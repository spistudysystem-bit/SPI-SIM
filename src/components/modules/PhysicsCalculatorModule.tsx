import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Activity, 
  Zap, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Trophy, 
  BookOpen, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Info, 
  RefreshCw, 
  Play, 
  Volume2, 
  RotateCcw,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, getDocs, setDoc, collection } from 'firebase/firestore';
import { sanitizeProfile, OperatorProfile } from './ProfileModule';

interface QuizChallenge {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  appliedFormula: string;
}

interface SolverDetail {
  id: string;
  name: string;
  description: string;
  icon: any;
  bullet: string;
  formula: string;
  concept: string;
  variables: { name: string; symbol: string; min: number; max: number; step: number; defaultValue: number; unit: string; desc: string }[];
  quiz: QuizChallenge;
}

const SOLVERS: SolverDetail[] = [
  {
    id: 'range',
    name: '13-Microsecond Rule (Range Solver)',
    bullet: 'Acoustics & Depth',
    description: 'Computes deep tissue reflector depth, total distance traveled, and round-trip pulse-echo times calibrated to soft tissue propagation velocity.',
    icon: Compass,
    formula: 'Time (μs) = Depth (cm) × 13 μs',
    concept: 'In soft tissue, it takes 13 microseconds for sound to travel to a reflector 1 cm deep and back to the transducer. Each centimeter of depth requires 13 μs of round-trip flight time. Total distance traveled is always twice the reflector depth.',
    variables: [
      { name: 'Imaging Reflector Depth', symbol: 'd', min: 1, max: 15, step: 0.5, defaultValue: 5, unit: 'cm', desc: 'Distance from the transducer face to the biological tissue layer.' }
    ],
    quiz: {
      id: 'range_q',
      question: 'A sonographer scans with a 5 MHz probe. It takes 78 microseconds for a sound pulse to travel from the transducer and return from a renal artery boundary. What is the depth of the reflector?',
      options: [
        '3 cm',
        '6 cm',
        '12 cm',
        '8 cm'
      ],
      correctIndex: 1,
      explanation: 'Using the 13-microsecond rule, Reflector Depth = Total Time / 13 μs. Therefore, 78 μs / 13 μs per cm = 6 cm. Perfect match!',
      appliedFormula: 'Depth (cm) = Time (μs) / 13 μs'
    }
  },
  {
    id: 'doppler',
    name: 'Doppler Shift & Velocity Engine',
    bullet: 'Vascular Kinetics',
    description: 'Computes the resulting high-frequency acoustic physical frequency shift (Fd) based on blood cell vectors, angle cosine, and operating carrier frequency.',
    icon: Activity,
    formula: 'Fd = (2 × f₀ × v × cosθ) / c',
    concept: 'Doppler shift (Fd) is directly proportional to blood velocity (v) and transmitter frequency (f₀), and is related to the cosine of the intercept angle (θ). At 90 degrees (perpendicular scanning), no shift is detected since cos(90°) = 0, causing critical diagnostic flow drop-out.',
    variables: [
      { name: 'Transducer Carrier Frequency', symbol: 'f₀', min: 2, max: 12, step: 1, defaultValue: 5, unit: 'MHz', desc: 'Acoustic operating frequency of the ultrasound array crystal.' },
      { name: 'Blood Flow Velocity', symbol: 'v', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0, unit: 'm/s', desc: 'Peak velocity of blood cells traveling in the lumen.' },
      { name: 'Doppler Intercept Angle', symbol: 'θ', min: 0, max: 90, step: 5, defaultValue: 60, unit: 'degrees', desc: 'Angle between the ultrasound beam axis and the direction of blood flow.' }
    ],
    quiz: {
      id: 'doppler_q',
      question: 'If you double the operating frequency of your transducer from 2 MHz to 4 MHz while keeping the flow angle and blood velocity constant, what happens to the detected Doppler shift frequency?',
      options: [
        'It is halved',
        'It increases by four times',
        'It doubles',
        'It remains unchanged'
      ],
      correctIndex: 2,
      explanation: 'The Doppler equation displays a linear direct relationship between operating carrier frequency (f₀) and shift frequency (Fd). Doubling f₀ doubles the Doppler shift frequency perfectly.',
      appliedFormula: 'Fd ∝ f₀'
    }
  },
  {
    id: 'boundary',
    name: 'Impedance & Reflection (IRC/ITC)',
    bullet: 'Acoustic Mismatches',
    description: 'Models sound waves meeting tissue interfaces. Computes the Intensity Reflection Coefficient (IRC) and Intensity Transmission Coefficient (ITC) at boundaries.',
    icon: Layers,
    formula: 'IRC = [(Z₂ - Z₁) / (Z₂ + Z₁)]²',
    concept: 'Acoustic impedance (Z = ρc) governs reflections. If two adjacent tissues have identical impedance, index matching is complete and no reflection occurs (total transmission). A tiny mismatch causes a minor echo (soft tissue). A massive mismatch (tissue-to-bone or air) produces total reflection, casting acoustic shadows.',
    variables: [
      { name: 'Medium 1 Impedance', symbol: 'Z₁', min: 1.0, max: 8.0, step: 0.1, defaultValue: 1.6, unit: 'MRayls', desc: 'Resistance of the first tissue layer (e.g. standard soft tissue ~1.63 MRayls).' },
      { name: 'Medium 2 Impedance', symbol: 'Z₂', min: 1.0, max: 8.0, step: 0.1, defaultValue: 2.5, unit: 'MRayls', desc: 'Resistance of the second tissue layer (e.g. bone ~7.8 MRayls, fat ~1.38 MRayls).' }
    ],
    quiz: {
      id: 'boundary_q',
      question: 'A sound wave travels from soft tissue (Z₁ = 1.6 MRayls) and hits a boundary of muscle tissue with identical acoustic impedance (Z₂ = 1.6 MRayls). What percentage of sound intensity is reflected back as an echo?',
      options: [
        '0% (Total Transmission)',
        '100% (Complete Reflection)',
        '50% (Symmetrical Split)',
        '25%'
      ],
      correctIndex: 0,
      explanation: 'Because Z₁ and Z₂ are identical (1.6 MRayls), the difference (Z₂ - Z₁) equals 0. The reflection coefficient (IRC) becomes 0², which is exactly 0%, meaning 100% of the energy is transmitted downstream.',
      appliedFormula: 'IRC = [(1.6 - 1.6) / (1.6 + 1.6)]² = 0%'
    }
  },
  {
    id: 'spl',
    name: 'Spatial Pulse Length & Axial Resolution',
    bullet: 'Spatial Precision',
    description: 'Simulates spatial laser-like pulse rings. Computes Spatial Pulse Length (SPL) and the minimum separation distance (Axial Resolution / LARRD) to resolve two structure dots.',
    icon: Zap,
    formula: 'Axial Resolution (mm) = SPL / 2',
    concept: 'Axial resolution is the minimum distance that two structures lying parallel to the ultrasound beam can be apart and still be displayed as two distinct echoes. Shorter pulses (fewer cycles, higher frequency/shorter wavelength) minimize SPL, reducing axial limits and yielding maximum detail resolution.',
    variables: [
      { name: 'Carrier Frequency', symbol: 'f₀', min: 1.0, max: 12.0, step: 0.5, defaultValue: 5.0, unit: 'MHz', desc: 'Crystal frequency, defining wave length.' },
      { name: 'Cycles per Pulse', symbol: 'n', min: 1, max: 5, step: 1, defaultValue: 3, unit: 'cycles', desc: 'Number of active mechanical cycles in each pulse burst (pulsed imaging requires 2 to 4).' }
    ],
    quiz: {
      id: 'spl_q',
      question: 'Which of the following modifications will significantly improve the longitudinal (axial) resolution of an ultrasound imaging system?',
      options: [
        'Adding more cycles to the pulse burst (Lighter damping)',
        'Increasing the operating frequency of the transducer',
        'Decreasing the transducer overall receiver gain knob',
        'Increasing the overall imaging depth'
      ],
      correctIndex: 1,
      explanation: 'Increasing transducer frequency shortens the wavelength. Since wavelength is smaller, the Spatial Pulse Length (SPL) is reduced. Since Axial Res = SPL/2, a smaller resolution metric represents a superior ability to differentiate adjacent organs.',
      appliedFormula: 'Axial Res = [n × (c/f)] / 2'
    }
  },
  {
    id: 'frame',
    name: 'Frame Rate & Temporal Resolution',
    bullet: 'Real-time Refresh',
    description: 'Models scanner speed tradeoffs. Calculates the ultimate frame period and refresh rate based on active line indices, focus zone counts, and depth barriers.',
    icon: Sliders,
    formula: 'FR (Hz) = 1 / [Lines × Focuses × (2 × Depth / c)]',
    concept: 'High frame rates are necessary for clean real-time dynamic anatomical scanning (e.g., cardiac valves moving). However, temporal rate is deeply locked to the speed of sound. If you increase depth, lines, or focal zones, the scanner must wait longer for echoes from each line, forcing the Frame Rate to plummet.',
    variables: [
      { name: 'Total Imaging Depth', symbol: 'd', min: 2, max: 15, step: 1, defaultValue: 8, unit: 'cm', desc: 'Maximum screen target depth in cm (governs round trip delay).' },
      { name: 'Line Density (Color lines)', symbol: 'N', min: 40, max: 150, step: 10, defaultValue: 80, unit: 'lines', desc: 'Number of vertical scan lines of acoustic data used to compose one frame.' },
      { name: 'Acoustic Focal Zones', symbol: 'Z_f', min: 1, max: 3, step: 1, defaultValue: 1, unit: 'zones', desc: 'Multiple points of beam focus. Adds an extra sound pulse per line, multiplying travel delay.' }
    ],
    quiz: {
      id: 'frame_q',
      question: 'A cardiac sonographer adds 3 focal zones to get excellent detail of a mitral valve, but the frame rate drops to 10 Hz, causing sluggish image updates. How can they restore crisp frame rate (temporal resolution) without losing frequency?',
      options: [
        'Increase overall imaging receiver gain',
        'Decrease the active scan line density or reduce the focus zones',
        'Increase the depth to maximum limits',
        'Switch from Pulsed-Wave to Continuous-Wave Doppler'
      ],
      correctIndex: 1,
      explanation: 'Decreasing line density or removing unnecessary focal zones saves precious sound-travel cycles per frame, allowing the machine to refresh the screen much faster, restoring temporal resolution.',
      appliedFormula: 'Frame Time = Lines × Focuses × (2 × Depth / 154,000)'
    }
  }
];

export default function PhysicsCalculatorModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('range');
  const [activeProfile, setActiveProfile] = useState<OperatorProfile | null>(null);
  const [profiles, setProfiles] = useState<OperatorProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default-operator');
  const [quizStatus, setQuizStatus] = useState<Record<string, { completed: boolean; answerIdx: number | null; success: boolean }>>(() => {
    const saved = localStorage.getItem('spi_solver_completed_challenges');
    return saved ? JSON.parse(saved) : {};
  });

  // Current slider inputs state mapped dynamically
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [triggerCoinCelebration, setTriggerCoinCelebration] = useState(false);

  // Initialize active solver variables on tab change
  const currentSolver = SOLVERS.find(s => s.id === activeTab) || SOLVERS[0];

  useEffect(() => {
    const defaultInputs: Record<string, number> = {};
    SOLVERS.forEach(s => {
      s.variables.forEach(v => {
        defaultInputs[`${s.id}_${v.symbol}`] = v.defaultValue;
      });
    });
    setInputs(defaultInputs);
  }, []);

  // Sync / load active profile logs to reward XP / coins
  useEffect(() => {
    if (user) {
      const profilesRef = collection(db, 'users', user.uid, 'profiles');
      getDocs(profilesRef).then((snap) => {
        const loaded: OperatorProfile[] = [];
        snap.forEach((doc) => {
          loaded.push(sanitizeProfile({ id: doc.id, ...doc.data() }));
        });
        if (loaded.length > 0) {
          setProfiles(loaded);
          const savedActive = localStorage.getItem(`active_profile_${user.uid}`) || loaded[0].id;
          setActiveProfileId(savedActive);
          const activeProf = loaded.find(p => p.id === savedActive) || loaded[0];
          setActiveProfile(activeProf);
        }
      });
    } else {
      const localProfilesStr = localStorage.getItem('guest_operator_profiles');
      if (localProfilesStr) {
        try {
          const parsed = JSON.parse(localProfilesStr).map((p: any) => sanitizeProfile(p));
          setProfiles(parsed);
          const savedActive = localStorage.getItem('active_profile_guest') || 'guest-student';
          setActiveProfileId(savedActive);
          const activeProf = parsed.find((p: any) => p.id === savedActive) || parsed[0];
          setActiveProfile(activeProf);
        } catch {}
      }
    }
  }, [user]);

  // Handle slide manipulation
  const handleValChange = (symbol: string, val: number) => {
    setInputs(prev => ({
      ...prev,
      [`${currentSolver.id}_${symbol}`]: val
    }));
  };

  const getVal = (symbol: string) => {
    return inputs[`${currentSolver.id}_${symbol}`] ?? currentSolver.variables.find(v => v.symbol === symbol)?.defaultValue ?? 1;
  };

  // Safe synthesized sound beep for correct answers
  const playPerfectBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Multi-tonal ultrasonic synthetic ping
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(520, now); // C note harmonic
      osc1.frequency.exponentialRampToValueAtTime(1040, now + 0.15); // Clear ping sweep

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659, now); // E note harmonic
      osc2.frequency.exponentialRampToValueAtTime(1318, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  };

  // Save the solved status and award rewards
  const handleVerifyQuiz = async (correctIndex: number) => {
    if (selectedQuizIdx === null) return;

    const isCorrect = selectedQuizIdx === correctIndex;
    const challengeKey = currentSolver.quiz.id;
    const isAlreadyCompleted = quizStatus[challengeKey]?.success;

    const newStatus = {
      ...quizStatus,
      [challengeKey]: {
        completed: true,
        answerIdx: selectedQuizIdx,
        success: isCorrect
      }
    };
    setQuizStatus(newStatus);
    localStorage.setItem('spi_solver_completed_challenges', JSON.stringify(newStatus));

    if (isCorrect) {
      setQuizFeedback("correct");
      playPerfectBeep();
      
      if (!isAlreadyCompleted) {
        // Trigger visual coin shower on desktop
        setTriggerCoinCelebration(true);
        setTimeout(() => setTriggerCoinCelebration(false), 3000);

        // Award dynamic registry XP & Coins
        const xpGain = 50;
        const coinsGain = 30;

        const updatedProfiles = profiles.map(p => {
          if (p.id === activeProfileId) {
            return {
              ...p,
              xp: (p.xp || 120) + xpGain,
              coins: (p.coins || 50) + coinsGain
            };
          }
          return p;
        });
        setProfiles(updatedProfiles);

        if (user) {
          try {
            const docRef = doc(db, 'users', user.uid, 'profiles', activeProfileId);
            await setDoc(docRef, {
              xp: (activeProfile?.xp || 120) + xpGain,
              coins: (activeProfile?.coins || 50) + coinsGain
            }, { merge: true });
          } catch (e) {
            console.error("Firestore user sync error", e);
          }
        } else {
          localStorage.setItem('guest_operator_profiles', JSON.stringify(updatedProfiles));
          window.dispatchEvent(new Event('storage'));
        }

        // Show achievement unlock
        const currentActive = updatedProfiles.find(p => p.id === activeProfileId);
        if (currentActive) {
          setActiveProfile(currentActive);
        }
      }
    } else {
      setQuizFeedback("wrong");
    }
  };

  const getCompletedCount = () => {
    return Object.values(quizStatus).filter(v => v.success).length;
  };

  // --- COMPUTE MATHEMATICAL METRICS ---

  // 1. Range Equation
  const rangeDepth = getVal('d');
  const soundSpeedSoftTissue = 1540; // m/s
  const computedRoundTripTime = rangeDepth * 13; // microseconds
  const computedTotalDistance = rangeDepth * 2; // cm
  const absoluteTimeSec = computedRoundTripTime * 1e-6;
  const theoreticalTrueDistanceMm = (soundSpeedSoftTissue * absoluteTimeSec * 1000) / 2;

  // 2. Doppler Equation
  const dopFreq = getVal('f₀');
  const dopVel = getVal('v');
  const dopAngle = getVal('θ');
  const angleRad = (dopAngle * Math.PI) / 180;
  const computedCos = Math.cos(angleRad);
  // Fd = (2 * f0 * v * cosθ) / c -> c = 1540 m/s
  const computedDopplerShiftHz = (2 * (dopFreq * 1e6) * dopVel * computedCos) / 1540;
  const computedDopplerShiftKhz = computedDopplerShiftHz / 1000;

  // 3. Impedance boundary
  const z1 = getVal('Z₁');
  const z2 = getVal('Z₂');
  const difference = z2 - z1;
  const sum = z2 + z1;
  const reflectionCoefficient = sum > 0 ? Math.pow(difference / sum, 2) : 0;
  const reflectionPct = reflectionCoefficient * 100;
  const transmissionPct = 100 - reflectionPct;

  // 4. Spatial Pulse Length & Axial Resolution
  const splFreq = getVal('f₀');
  const splCycles = getVal('n');
  const splWavelengthMm = 1.54 / splFreq; // wavelength (mm) in soft tissue = 1.54 / f (MHz)
  const computedSplMm = splCycles * splWavelengthMm;
  const computedAxialResMm = computedSplMm / 2;

  // 5. Frame rate
  const frameDepth = getVal('d');
  const frameLines = getVal('N');
  const frameFocuses = getVal('Z_f');
  // Total round-trip time for 1 line = 2 * Depth (m) / 1540 (m/s) = 2 * (Depth/100) / 1540 = 2 * Depth / 154000 sec
  // Frame time = Lines * Focuses * (2 * Depth / 154000)
  const lineTravelTimeSec = (2 * (frameDepth / 100)) / 1540;
  const totalFrameTimeSec = frameLines * frameFocuses * lineTravelTimeSec;
  const computedFrameRateHz = totalFrameTimeSec > 0 ? 1 / totalFrameTimeSec : 30;

  // Wave bouncing animation timeline loop (Range Solver)
  const [pulseTimelinePct, setPulseTimelinePct] = useState(0);
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - lastTime;
      lastTime = now;
      setPulseTimelinePct(prev => {
        let next = prev + (elapsed / 25); // Loop every 2.5 seconds roughly
        if (next > 100) next = 0;
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 min-w-0 w-full flex flex-col h-full bg-[#0c0d10] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 select-none custom-scrollbar pb-24 lg:pb-8"
    >
      {/* Coin Shower alert on correct answer */}
      <AnimatePresence>
        {triggerCoinCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#ffd700] text-black font-mono font-bold px-6 py-3 rounded-full shadow-[0_0_50px_rgba(255,215,0,0.4)] z-[300] flex items-center gap-3 border border-white/50"
          >
            <Coins className="animate-bounce" size={20} />
            <div>
              <div className="text-[11px] uppercase tracking-widest font-black leading-none">CHALLENGE COMPLETE!</div>
              <div className="text-[10px] opacity-80 mt-0.5">+50 XP • +30 Acoustic Coins Synchronized</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="relative border-2 border-yellow-500/80 bg-[#0e1014] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden shadow-[0_0_25px_rgba(234,179,8,0.1)]">
        {/* Repeating hazard stripe border trim */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_8px,#000000_8px,#000000_16px)]" />

        <div className="space-y-1 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[8.5px] font-mono uppercase bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 tracking-widest font-black">
              U.U.U. MATHEMATICS ENGINE
            </span>
            <span className="p-1 px-2 rounded-full text-[8.5px] font-mono bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700] flex items-center gap-1 font-bold">
              <Trophy size={9} /> {getCompletedCount()} / 5 Complete
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
            SPI <span className="text-yellow-400">SOLVER LAB</span>
          </h2>
          <p className="text-xs text-[#8e9299] max-w-xl font-medium font-sans mt-0.5">
            Calibrate core physical constants synchronously. Practice deriving real acoustic equations, axial resolutions, and Doppler vector velocities modeled on ARDMS SPI standards.
          </p>
          <div className="mt-4 border border-[#2d3139]/50 rounded-xl overflow-hidden max-w-full md:max-w-md shadow-lg">
            <img src="/src/assets/images/ultrasound_solver_blueprint_1780381425382.png" alt="Solver Blueprint Schematic" className="w-full h-auto object-cover opacity-80" referrerPolicy="no-referrer" />
          </div>
        </div>

        {/* Level Progression Indicator */}
        {activeProfile && (
          <div className="bg-[#12141c]/90 border border-[#2d3139] p-4 rounded-xl flex items-center gap-4 shrink-0 shadow-lg relative z-10 w-full md:w-auto">
            <div className="w-10 h-10 rounded-lg bg-[#00d1ff]/10 flex items-center justify-center border border-[#00d1ff]/30 text-[#00d1ff] shrink-0">
              <Award size={20} />
            </div>
            <div className="space-y-1 text-left">
              <div className="text-[10px] font-mono text-white flex items-center justify-between gap-4">
                <span className="truncate max-w-[130px] font-bold">{activeProfile.name}</span>
                <span className="text-[#00d1ff] font-extrabold">LVL {Math.floor((activeProfile.xp || 120) / 100)}</span>
              </div>
              <div className="w-40 sm:w-48 bg-black/45 h-2 rounded-full overflow-hidden border border-[#2d3139]">
                <div 
                  className="bg-[#00d1ff] h-full shadow-[0_0_10px_#00d1ff] transition-all duration-500"
                  style={{ width: `${((activeProfile.xp || 120) % 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[8.5px] font-mono text-[#8e9299]">
                <span className="flex items-center gap-0.5"><Coins size={8} /> {activeProfile.coins || 50} Coins</span>
                <span>{activeProfile.xp || 120} Total XP</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Solver Navigation Row */}
      <div className="flex bg-[#111318] p-1 rounded-xl border border-[#2d3139]/80 overflow-x-auto no-scrollbar gap-1 shadow-inner shadow-black shrink-0">
        {SOLVERS.map(solver => {
          const IconComponent = solver.icon;
          const isActive = solver.id === activeTab;
          const isDone = quizStatus[solver.quiz.id]?.success;
          return (
            <button 
              key={solver.id}
              onClick={() => {
                setActiveTab(solver.id);
                setSelectedQuizIdx(null);
                setQuizFeedback(null);
              }}
              className={`px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all md:flex-1 shrink-0 flex items-center justify-center gap-2 border select-none cursor-pointer ${isActive ? 'bg-[#00d1ff]/10 border-[#00d1ff]/40 text-[#00d1ff] shadow-[0_0_15px_rgba(0,209,255,0.06)]' : 'bg-transparent border-transparent text-slate-500 hover:text-white'}`}
            >
              <IconComponent size={14} className={isActive ? 'text-[#00d1ff]' : 'text-[#8e9299]'} />
              <span>{solver.bullet}</span>
              {isDone && <CheckCircle2 size={12} className="text-[#4ade80]" />}
            </button>
          );
        })}
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Variable Sliders & Live Computation Math Math Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6 items-stretch">
          
          {/* Sliders Input Panel */}
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-5 flex flex-col gap-5 text-left shadow-lg">
            <div className="border-b border-[#2d3139]/40 pb-3">
              <h3 className="text-xs font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <Sliders size={13} className="text-[#00d1ff]" />
                Interactive Sliders
              </h3>
            </div>

            <div className="space-y-6">
              {currentSolver.variables.map(variable => {
                const curVal = getVal(variable.symbol);
                return (
                  <div key={variable.symbol} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8e9299] uppercase tracking-wider">{variable.name}</span>
                      <span className="text-[#00d1ff] font-extrabold font-mono bg-black/40 px-2 py-0.5 border border-[#2d3139] rounded">
                        {curVal} {variable.unit}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-600 font-extrabold">{variable.min}</span>
                      <input 
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={curVal}
                        onChange={(e) => handleValChange(variable.symbol, parseFloat(e.target.value))}
                        className="flex-1 accent-[#00d1ff] cursor-pointer bg-black/45 h-1.5 rounded-lg border border-[#2d3139]"
                      />
                      <span className="text-[10px] font-mono text-slate-600 font-extrabold">{variable.max}</span>
                    </div>

                    <p className="text-[10.5px] text-[#8e9299] leading-relaxed">
                      {variable.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-[#2d3139] flex items-start gap-3">
              <ChevronRight size={14} className="text-[#00d1ff] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block font-black">Applied Formula</span>
                <span className="text-xs text-white font-mono font-black tracking-wide">{currentSolver.formula}</span>
              </div>
            </div>
          </div>

          {/* Derivation breakdown list */}
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-lg">
            <h3 className="text-xs font-black font-mono tracking-widest text-[#00d1ff] uppercase flex items-center gap-2 border-b border-[#2d3139]/40 pb-3">
              <Activity size={13} className="text-[#00d1ff]" />
              Numerical Derivation
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              {currentSolver.id === 'range' && (
                <>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Reflector Depth (d)</span>
                    <span className="text-white font-bold">{rangeDepth} cm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Soft Tissue Travel Constant</span>
                    <span className="text-white font-bold">13 μs / cm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#ffd700] font-bold">Total Time-of-Flight (t)</span>
                    <span className="text-[#ffd700] font-extrabold underline">{computedRoundTripTime} μs</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Calculated Distance Traveled</span>
                    <span className="text-white font-bold">{computedTotalDistance} cm (Round-trip)</span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-sans space-y-1.5 leading-relaxed text-slate-400 text-[11px]">
                    <span className="text-white font-bold block text-xs">Proof Check (True Physics c = 1540 m/s):</span>
                    Sound travels 1540 m/s. For {computedRoundTripTime} μs, true distance calculations yield: 1540 m/s × {absoluteTimeSec.toFixed(5)}s = {theoreticalTrueDistanceMm.toFixed(1)} mm ({ (theoreticalTrueDistanceMm/10).toFixed(2) } cm Reflector Depth). Perfectly matching the system baseline coordinate calibration!
                  </div>
                </>
              )}

              {currentSolver.id === 'doppler' && (
                <>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Carrier Frequency (f₀)</span>
                    <span className="text-white font-bold">{dopFreq} MHz ({(dopFreq * 1e6).toLocaleString()} Hz)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Blood Speed (v)</span>
                    <span className="text-white font-bold">{dopVel} m/s</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Doppler Angle (θ)</span>
                    <span className="text-white font-bold">{dopAngle}°</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Cosine Value cos(θ)</span>
                    <span className="text-white font-bold text-amber-500 font-serif italic">{computedCos.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#00d1ff] font-bold">Computed Shift Freq (Fd)</span>
                    <span className="text-[#00d1ff] font-extrabold underline">{computedDopplerShiftKhz.toFixed(3)} kHz</span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-sans space-y-1 bg-rose-500/[0.01]">
                    <span className="text-white font-mono text-[9px] text-[#ffd700] uppercase font-black block">Registry Trap Factor:</span>
                    <p className="text-[10.5px] leading-relaxed text-slate-400">
                      Scanning perpendicular (90°) kills the Cosine value completely (0.00). Keep the Doppler angle at **60 degrees or lower** to avoid critical reading dropouts and maintain signal calibration!
                    </p>
                  </div>
                </>
              )}

              {currentSolver.id === 'boundary' && (
                <>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Medium 1 Acoustic Impedance (Z₁)</span>
                    <span className="text-white font-bold">{z1} MRayls</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Medium 2 Acoustic Impedance (Z₂)</span>
                    <span className="text-white font-bold">{z2} MRayls</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Difference (Z₂ - Z₁)</span>
                    <span className="text-white font-bold">{difference.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#ffd700] font-bold">Reflection Coefficient (IRC)</span>
                    <span className="text-[#ffd700] font-extrabold underline">{reflectionPct.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-emerald-400 font-bold">Transmission Coefficient (ITC)</span>
                    <span className="text-emerald-400 font-extrabold underline">{transmissionPct.toFixed(2)}%</span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-sans text-left space-y-1">
                    <span className="text-white font-bold block text-[11px]">Boundary Implication:</span>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {reflectionPct > 40 ? 
                        "⚠️ Massive mismatch detected! Reflective barrier casts dark acoustic shadowing below (e.g. tissue to air or bone boundary)." :
                        "✓ Parabolic soft tissue interface! Rich sound propagation allows continuous anatomical scanning behind this tissue plane."
                      }
                    </p>
                  </div>
                </>
              )}

              {currentSolver.id === 'spl' && (
                <>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Operating Frequency (f₀)</span>
                    <span className="text-white font-bold">{splFreq} MHz</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Wavelength in tissue (λ)</span>
                    <span className="text-white font-bold text-amber-500">{splWavelengthMm.toFixed(3)} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Active Cycles per Pulse (n)</span>
                    <span className="text-white font-bold">{splCycles}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#ffd700] font-bold">Spatial Pulse Length (SPL)</span>
                    <span className="text-[#ffd700] font-extrabold underline">{computedSplMm.toFixed(3)} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#00d1ff] font-bold">Axial Resolution (LARRD)</span>
                    <span className="text-[#00d1ff] font-extrabold underline">{computedAxialResMm.toFixed(3)} mm</span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-sans text-left space-y-1">
                    <span className="text-white font-bold block text-[11px]">Detail Resolution Score:</span>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      Structures separated parallel to the beam axis by less than **{computedAxialResMm.toFixed(3)} mm** will blur into a single pixel shadow. High damping reduces cycle counts to boost resolution details!
                    </p>
                  </div>
                </>
              )}

              {currentSolver.id === 'frame' && (
                <>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Imaging Depth (d)</span>
                    <span className="text-white font-bold">{frameDepth} cm ({ (frameDepth/100).toFixed(2) } m)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Number of Scan Lines (N)</span>
                    <span className="text-white font-bold">{frameLines} lines</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Active Focal Zones (Z_f)</span>
                    <span className="text-white font-bold">{frameFocuses}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-slate-500">Sound Pulse Line Trip Delay</span>
                    <span className="text-white font-bold">{(lineTravelTimeSec * 1000).toFixed(2)} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#ffd700] font-bold">Total Frame Acquisition</span>
                    <span className="text-[#ffd700] font-extrabold underline">{(totalFrameTimeSec * 1000).toFixed(1)} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2d3139]/25 pb-2">
                    <span className="text-[#00d1ff] font-bold">Computed Frame Rate (FR)</span>
                    <span className="text-[#00d1ff] font-extrabold underline">{computedFrameRateHz.toFixed(1)} Hz</span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl font-sans text-left space-y-1">
                    <span className={`text-[10px] font-mono leading-none tracking-wider font-extrabold block ${computedFrameRateHz >= 20 ? 'text-green-400' : 'text-red-400'}`}>
                      {computedFrameRateHz >= 24 ? "✓ HIGH-FREQUENCY Dynamic Refresh Rate" : "⏳ REALTIME RECOLLECTION STUTTER"}
                    </span>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {computedFrameRateHz >= 24 ? 
                        "Superb high temporal resolution! Excellent for cardiac valvular motion studies." : 
                        "Significant lag. Severe ghost artifacts occur on moving blood elements. Shrink depth structures or reduce lines to speed up frame refresh."
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic HTML5 Interactive Canvas Simulation & Registry Quiz Cards */}
        <div className="xl:col-span-8 flex flex-col gap-6 items-stretch">
          
          {/* Active Canvas Simulator panel */}
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-6 flex flex-col gap-4 text-left shadow-lg aspect-auto md:min-h-[380px] justify-between relative overflow-hidden">
            <div className="border-b border-[#2d3139]/40 pb-3 flex justify-between items-center z-10">
              <h3 className="text-xs font-black font-mono tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <Play size={13} className="text-[#00d1ff]" />
                Interactive Diagnostic Simulator
              </h3>
              <span className="text-[9px] font-mono text-[#00d1ff] border border-[#00d1ff]/20 bg-[#00d1ff]/5 px-2 py-0.5 rounded uppercase font-bold tracking-widest animate-pulse">
                Dynamic Loop
              </span>
            </div>

            {/* Simulated UI Area */}
            <div className="flex-1 bg-black/85 rounded-xl border border-[#2d3139]/60 p-4 min-h-[220px] sm:min-h-[260px] flex items-center justify-center relative overflow-hidden">
              
              {/* Range Equation Animation */}
              {currentSolver.id === 'range' && (
                <div className="w-full h-full flex flex-col justify-between items-stretch">
                  <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-[#8e9299]">
                    <span>TRANSDUCER FACING</span>
                    <span>REFLECTOR AT {rangeDepth} cm</span>
                  </div>

                  <div className="flex-1 flex items-center relative px-2.5">
                    {/* Beam Path Trace */}
                    <div className="absolute inset-x-8 h-[2px] bg-dashed bg-slate-800 border-t border-dashed border-white/5" />
                    
                    {/* Transducer Representation */}
                    <div className="w-10 h-14 bg-gradient-to-r from-indigo-900 to-slate-900 border border-[#00d1ff]/50 rounded flex items-center justify-center relative z-10 shrink-0">
                      <Layers size={14} className="text-[#00d1ff]" />
                    </div>

                    {/* Interactive Animated Reflector Boundary */}
                    <div 
                      className="absolute h-16 w-[3px] bg-dashed border-r border-[#00d1ff]/85 shadow-[0_0_15px_#00d1ff] z-10 transition-all duration-300"
                      style={{ left: `calc(13% + (65% * (${rangeDepth} / 15)))` }}
                    >
                      <div className="absolute -top-6 -left-8 font-mono text-[9px] text-white/95 px-1.5 py-0.5 bg-[#00d1ff]/20 border border-[#00d1ff]/30 rounded">
                        {rangeDepth} cm
                      </div>
                    </div>

                    {/* Bouncing Pulse ring */}
                    {(() => {
                      // Normalize the bounce path. 0 to 50 is forwarding, 50 to 100 is returning back
                      const isReturning = pulseTimelinePct > 50;
                      const progress = isReturning ? (100 - pulseTimelinePct) / 50 : pulseTimelinePct / 50;
                      const reflectorLeftPct = 13 + (65 * (rangeDepth / 15));
                      const ringPositionLeft = 13 + (reflectorLeftPct - 13) * progress;
                      return (
                        <div 
                          className={`absolute w-5 h-5 rounded-full border-r-2 ${isReturning ? 'border-l-2 border-r-0 border-amber-400' : 'border-r-2 border-[#00d1ff]'} flex items-center justify-center transition-all duration-75`}
                          style={{ left: `${ringPositionLeft}%`, opacity: ringPositionLeft > reflectorLeftPct ? 0 : 0.85 }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isReturning ? 'bg-amber-400' : 'bg-[#00d1ff]'}`} />
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-1 text-left font-mono mt-2 p-3 bg-[#111317]/85 border border-[#2d3139] rounded-lg">
                    <div className="text-[10px] text-white flex justify-between">
                      <span>13-Microsecond Clock Timer:</span>
                      <span className="text-[#00d1ff] font-extrabold">{ (computedRoundTripTime * (pulseTimelinePct/100)).toFixed(1) } μs / {computedRoundTripTime} μs</span>
                    </div>
                    <div className="w-full bg-black h-1 rounded overflow-hidden mt-1 bg-neutral-900 border border-neutral-800">
                      <div className="bg-gradient-to-r from-[#00d1ff] to-amber-500 h-full" style={{ width: `${pulseTimelinePct}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Doppler Velocity Intercept Vector Animation */}
              {currentSolver.id === 'doppler' && (
                <div className="w-full h-full flex flex-col justify-between items-stretch">
                  <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-[#8e9299]">
                    <span>BLOOD LUMEN</span>
                    <span>ANGLE: {dopAngle}° • cos: {computedCos.toFixed(2)}</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                    {/* Horizontal Blood Vessel Boundary */}
                    <div className="absolute inset-x-0 h-10 border-y border-[#ffd700]/30 bg-[#ffd700]/5 flex items-center overflow-hidden">
                      {/* Bouncing blood cells moving left to right */}
                      {Array.from({ length: 6 }).map((_, i) => {
                        const cellTravel = ((pulseTimelinePct + (i * 20)) % 100);
                        return (
                          <div 
                            key={i}
                            className="absolute w-2.5 h-1.5 rounded bg-red-500/50 border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-75"
                            style={{ left: `${cellTravel}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Intersecting Doppler Beam Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {(() => {
                        // Math calculation to compute focal endpoint coordinates
                        // Draw line from top-center of transducer down to vessel baseline index (normally h-1/2, center)
                        const angleInRad = (dopAngle * Math.PI) / 180;
                        const centerX = 200;
                        const centerY = 100;
                        
                        // Vector line representing ultrasonic beam
                        const beamLength = 80;
                        // For 90 degrees, beam is strictly straight vertical.
                        // For 60 degrees, it slants down.
                        const startX = centerX - beamLength * Math.cos(angleInRad);
                        const startY = centerY - beamLength * Math.sin(angleInRad);
                        
                        return (
                          <>
                            {/* Ultrasound Probe Representation */}
                            <g transform={`translate(${startX - 15}, ${startY - 15})`}>
                              <rect width="30" height="15" rx="3" fill="#141a29" stroke="#00d1ff" strokeWidth="1" />
                              <line x1="5" y1="5" x2="25" y2="5" stroke="#00d1ff" strokeWidth="1.5" />
                            </g>

                            {/* Center intercept line vector */}
                            <line 
                              x1={startX} 
                              y1={startY} 
                              x2={centerX} 
                              y2={centerY} 
                              stroke="#00d1ff" 
                              strokeWidth="2" 
                              strokeDasharray="4 2" 
                              className="opacity-80"
                            />

                            {/* Angle indicator wedge */}
                            <path 
                              d={`M ${centerX - 25} ${centerY} A 25 25 0 0 1 ${centerX - 25 * Math.cos(angleInRad)} ${centerY - 25 * Math.sin(angleInRad)}`} 
                              fill="none" 
                              stroke="#ffd700" 
                              strokeWidth="1.5"
                            />
                          </>
                        );
                      })()}
                    </svg>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 font-mono text-[9px] text-[#ffd700] bg-black/75 px-2 py-1 rounded border border-[#2d3139]/50">
                      Doppler Shift: {computedDopplerShiftKhz.toFixed(3)} kHz
                    </div>
                  </div>
                </div>
              )}

              {/* Acoustic boundary mismatch layout (Reflection Wave opacity mapping) */}
              {currentSolver.id === 'boundary' && (
                <div className="w-full h-full flex flex-col justify-between items-stretch">
                  <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-[#8e9299]">
                    <span>MEDIUM 1 (Z₁: {z1} MRayls)</span>
                    <span>MEDIUM 2 (Z₂: {z2} MRayls)</span>
                  </div>

                  <div className="flex-1 flex items-center relative px-4">
                    {/* Division line representing intermediate tissue boundary */}
                    <div className="absolute inset-y-0 left-1/2 w-[2px] bg-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.5)] z-20" />
                    
                    {/* Block for Medium 1 */}
                    <div className="absolute inset-y-0 left-0 right-1/2 bg-[#00d1ff]/5 border-r border-[#2d3139]" />
                    {/* Block for Medium 2 */}
                    <div className="absolute inset-y-0 left-1/2 right-0 bg-purple-500/[0.04]" />

                    {/* Waves Visualizer */}
                    <div className="w-full flex items-center justify-around relative">
                      
                      {/* Incident wave (always robust line) */}
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Incident Sound</span>
                        <div className="w-16 h-8 bg-[#00d1ff]/20 border border-[#00d1ff] rounded flex items-center justify-center font-mono text-[10px] text-white">
                          100%
                        </div>
                      </div>

                      {/* Echo reflection wave (opacity maps to reflectionPct) */}
                      <div className="flex flex-col items-center shrink-0 transition-opacity duration-300" style={{ opacity: reflectionPct > 0 ? 1 : 0.15 }}>
                        <span className="text-[8.5px] font-mono text-amber-500 uppercase tracking-wider block mb-1">Echo Reflected</span>
                        <div 
                          className="w-16 h-8 bg-amber-500/10 border text-amber-500 rounded flex items-center justify-center font-mono text-[10px] font-extrabold transition-all duration-300"
                          style={{ 
                            borderWidth: `${Math.max(1, reflectionPct/10)}px`,
                            borderColor: reflectionPct > 5 ? 'rgba(245,158,11,1)' : 'rgba(245,158,11,0.2)' 
                          }}
                        >
                          {reflectionPct.toFixed(1)}%
                        </div>
                      </div>

                      {/* Transmitted wave (opacity maps to transmissionPct) */}
                      <div className="flex flex-col items-center shrink-0 transition-opacity duration-300" style={{ opacity: transmissionPct > 0 ? 1 : 0.15 }}>
                        <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">Transmitted</span>
                        <div 
                          className="w-16 h-8 bg-emerald-500/10 border text-emerald-400 rounded flex items-center justify-center font-mono text-[10px] font-extrabold transition-all duration-300"
                          style={{ 
                            borderWidth: `${Math.max(1, transmissionPct/10)}px`,
                            borderColor: transmissionPct > 5 ? 'rgba(16,185,129,1)' : 'rgba(16,185,129,0.2)'
                          }}
                        >
                          {transmissionPct.toFixed(1)}%
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Axial detail separation simulator */}
              {currentSolver.id === 'spl' && (
                <div className="w-full h-full flex flex-col justify-between items-stretch">
                  <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-[#8e9299]">
                    <span>AXIAL RESOLUTION LIMIT: {computedAxialResMm.toFixed(3)} mm</span>
                    <span>PULSE CYCLES: {splCycles}</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center relative gap-6">
                    {/* Visual simulator mapping structural markers */}
                    <div className="flex gap-12 items-center justify-center w-full">
                      
                      {/* Structure 1 (Transducer wave generator visual) */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-mono text-slate-500">Acoustic wave pulse</span>
                        <div className="w-20 h-6 bg-black border border-white/10 rounded flex items-center justify-around overflow-hidden px-1">
                          {/* Generated sine wave counts */}
                          {Array.from({ length: splCycles * 3 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="w-[2px] bg-[#00d1ff] transition-all"
                              style={{ 
                                height: `${Math.sin(i * 0.8) * 12 + 14}px`,
                                textShadow: '0 0 10px #00d1ff' 
                              }} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-white/55">SPL: {computedSplMm.toFixed(2)}mm</span>
                      </div>

                      {/* Display Output Representation */}
                      <div className="flex flex-col items-center gap-1 text-center font-mono">
                        <span className="text-[8px] font-mono text-[#00d1ff] tracking-wider uppercase font-bold">Clinical Monitor</span>
                        
                        <div className="w-28 h-16 bg-black rounded-lg border border-[#2d3139] flex items-center justify-center gap-1.5 transition-all">
                          {/* If axial resolution limit is lower than structural distance (usually mapped linearly, let's assume arbitrary separation distance of 0.35mm is the benchmark) */}
                          {computedAxialResMm <= 0.23 ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" title="Reflector A resolved" />
                              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" title="Reflector B resolved" />
                              <div className="absolute -bottom-1 text-[8px] text-green-400 font-extrabold uppercase mt-1">✓ TWO DOTS RESOLVED</div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_#f59e0b] opacity-80" title="Merged blur" />
                              <div className="absolute -bottom-1 text-[8px] text-amber-500 font-extrabold uppercase mt-1">⚠️ MERGED SCAN BLUR</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Temporal Resolution Scanning loop layout */}
              {currentSolver.id === 'frame' && (
                <div className="w-full h-full flex flex-col justify-between items-stretch">
                  <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-[#8e9299]">
                    <span>TEMPORAL PERFORMANCE MATRIX</span>
                    <span>FRAME RATE: {computedFrameRateHz.toFixed(1)} Hz</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                    <div className="flex items-center gap-8 font-mono">
                      
                      {/* Interactive refresh speed layout (Speed maps sweep loop) */}
                      <div className="w-28 h-28 border border-[#2d3139]/80 rounded bg-black/60 relative overflow-hidden flex items-center justify-center">
                        {/* Interactive sweeping line indicating ultrasonic scan angle lines */}
                        <div 
                          className="absolute inset-[1px] bg-[#00d1ff]/5 origin-center transition-all duration-75"
                          style={{
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                          }}
                        />

                        {/* Interactive dynamic screen redraw */}
                        <div 
                          className="absolute bottom-0 inset-x-0 h-1 bg-[#00d1ff] transition-opacity"
                          style={{
                            // Flicker velocity corresponds to Frame Rate
                            animation: `pulse ${totalFrameTimeSec.toFixed(3)}s infinite ease-in-out`
                          }}
                        />

                        {/* Sluggish text overlay if too slow */}
                        {computedFrameRateHz < 15 && (
                          <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center text-center p-2">
                            <span className="text-[8px] text-red-500 uppercase tracking-wider font-extrabold animate-pulse">SLUGGISH SCREEN LAG</span>
                          </div>
                        )}
                      </div>

                      {/* Performance Specs Cards */}
                      <div className="flex flex-col gap-2 text-left justify-center text-xs">
                        <div className="space-y-0.5 border-b border-[#2d3139] pb-1">
                          <span className="text-slate-500 uppercase text-[8px] block">Calculated Frame Period:</span>
                          <span className="text-white font-extrabold">{(totalFrameTimeSec * 1000).toFixed(1)} ms</span>
                        </div>
                        <div className="space-y-0.5 border-b border-[#2d3139] pb-1">
                          <span className="text-slate-500 uppercase text-[8px] block">Temporal Grading:</span>
                          <span className={`font-extrabold ${computedFrameRateHz >= 24 ? 'text-green-400' : 'text-amber-500'}`}>
                            {computedFrameRateHz >= 24 ? "✓ BOARD EXCELLENT" : "⏳ COMPROMISED"}
                          </span>
                        </div>
                        <div className="space-y-0.5 select-none text-[10px] text-white">
                          <span>Frame speed: {computedFrameRateHz.toFixed(1)} FPS</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Explanatory concept note (Bottom toolbar) */}
            <div className="p-3 bg-black/25 rounded-xl border border-white/5 flex items-start gap-3 z-10">
              <Info size={14} className="text-[#00d1ff] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans select-text">
                <span className="font-bold text-white block">Core Physical Translation:</span>
                {currentSolver.concept}
              </p>
            </div>
          </div>

          {/* Gamified SPI Quiz Card */}
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-6 text-left flex flex-col gap-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles size={60} className="text-[#ffd700]" />
            </div>

            <div className="border-b border-[#2d3139]/40 pb-3 flex justify-between items-center relative z-10">
              <h3 className="text-xs font-black font-mono tracking-widest text-[#ffd700] uppercase flex items-center gap-2">
                <Trophy size={13} className="text-[#ffd700]" />
                Interactive Board Challenge
              </h3>
              <span className="p-1 px-2 rounded-full text-[8.5px] font-mono uppercase bg-neutral-900 border border-[#2d3139] text-[#ffd700] font-bold">
                Level UP • +50 XP
              </span>
            </div>

            <p className="text-xs text-white leading-relaxed font-medium relative z-10 select-text">
              {currentSolver.quiz.question}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 selection:bg-none">
              {currentSolver.quiz.options.map((option, idx) => {
                const isSelected = selectedQuizIdx === idx;
                const solverStatus = quizStatus[currentSolver.quiz.id];
                const isAnswered = solverStatus?.completed;
                const isThisValCorrect = currentSolver.quiz.correctIndex === idx;

                let cardStyle = "bg-[#0b0c10]/90 border-[#2d3139]/80 text-[#8e9299] hover:border-slate-500";
                if (isSelected) cardStyle = "bg-[#00d1ff]/5 border-[#00d1ff] text-white";
                if (isAnswered) {
                  if (isThisValCorrect) {
                    cardStyle = "bg-green-500/10 border-green-500 text-green-400 font-bold";
                  } else if (isSelected) {
                    cardStyle = "bg-red-500/10 border-red-500 text-red-500 font-bold";
                  } else {
                    cardStyle = "bg-[#0b0c10]/40 border-neutral-800/20 text-slate-600 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => {
                      setSelectedQuizIdx(idx);
                      setQuizFeedback(null);
                    }}
                    className={`p-3 text-[11px] font-semibold text-left rounded-xl border transition-all cursor-pointer select-none ${cardStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center font-mono text-[9.5px] shrink-0 font-bold ${isSelected ? 'border-[#00d1ff] bg-[#00d1ff] text-black' : 'border-neutral-500'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center border-t border-[#2d3139]/40 pt-4 mt-1 relative z-10">
              
              <div className="flex items-center gap-1 font-mono text-[9px] text-[#8e9299]">
                <span>Used equation:</span>
                <span className="text-slate-400 font-bold tracking-wide font-sans">{currentSolver.quiz.appliedFormula}</span>
              </div>

              {/* Verify button or feedback states */}
              {quizStatus[currentSolver.quiz.id]?.completed ? (
                <div className="flex items-center gap-2">
                  {quizStatus[currentSolver.quiz.id].success ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase bg-green-500/15 text-green-400 px-3.5 py-1.5 rounded-lg border border-green-500/30 font-extrabold animate-pulse">
                      ✓ SOLVED (+50 XP)
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        setSelectedQuizIdx(null);
                        setQuizFeedback(null);
                        setQuizStatus(prev => {
                          const updated = { ...prev };
                          delete updated[currentSolver.quiz.id];
                          return updated;
                        });
                      }}
                      className="text-[9.5px] font-mono tracking-wider font-extrabold px-3 py-1.5 bg-black border border-red-500/30 text-rose-400 hover:text-white rounded-lg flex items-center gap-2 select-none cursor-pointer hover:bg-neutral-900 transition-all"
                    >
                      <RotateCcw size={10} />
                      RETRY CHALLENGE
                    </button>
                  )}
                </div>
              ) : (
                <button
                  disabled={selectedQuizIdx === null}
                  onClick={() => handleVerifyQuiz(currentSolver.quiz.correctIndex)}
                  className={`px-5 py-2 font-mono text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 border select-none cursor-pointer ${selectedQuizIdx === null ? 'bg-neutral-900 border-neutral-800 text-slate-600' : 'bg-[#ffd700] hover:bg-yellow-400 border-[#ffd700] text-black shadow-[0_0_15px_rgba(255,215,0,0.25)]'}`}
                >
                  <Check size={11} className="stroke-[3]" />
                  Verify Answer
                </button>
              )}
            </div>

            {/* Step-by-Step Explanation Block */}
            <AnimatePresence>
              {quizStatus[currentSolver.quiz.id]?.completed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-black/60 border border-[#2d3139] leading-relaxed relative z-10"
                >
                  <p className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider font-black mb-1 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Registry Diagnostic Verification Explanation
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans select-text">
                    {currentSolver.quiz.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
