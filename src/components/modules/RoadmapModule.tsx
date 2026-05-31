import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, 
  CheckCircle, 
  BookOpen, 
  Sparkles, 
  Award, 
  Info, 
  ChevronRight, 
  Copy, 
  CreditCard, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface SubModule {
  id: string;
  name: string;
  category: string;
  weight: number; // weight in SPI registry
}

const SYLLABUS_MODULES: SubModule[] = [
  { id: 'pzt_anatomy', name: 'PZT Crystal Thickness & Operating Frequency', category: 'Transducer Design', weight: 15 },
  { id: 'pulsing', name: 'PRP, PRF, SPL, Duty Factor & Spatial Resolution', category: 'Pulsed Wave Parameters', weight: 15 },
  { id: 'resolutions', name: 'Axial vs. Lateral vs. Elevational Limits', category: 'Resolutions', weight: 12 },
  { id: 'attenuation', name: 'Decibel Attenuation & Half-Boundary Thickness', category: 'Acoustic Sound Loss', weight: 10 },
  { id: 'doppler_shift', name: 'Hemodynamics, Poiseuille’s Law & Doppler Equation', category: 'Doppler Speeds', weight: 18 },
  { id: 'tgc_knobs', name: 'Clinical TGC, Power, Receiver Gain & Dynamic Range', category: 'Instrumentation', weight: 12 },
  { id: 'artifacts', name: 'Reverberation, Shadowing, Mirror Image & Aliasing', category: 'Artifacts', weight: 10 },
  { id: 'safety', name: 'Bioeffects, Mechanical Index (MI) & Thermal Index (TI)', category: 'Safety & Regulations', weight: 8 },
];

export default function RoadmapModule() {
  const { user } = useAuth();
  
  // Track status for each syllabus section: 'not_started' | 'studying' | 'mastered'
  const [syllabusStatus, setSyllabusStatus] = useState<Record<string, 'not_started' | 'studying' | 'mastered'>>(() => {
    const saved = localStorage.getItem('spi_syllabus_readiness');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore fallback */ }
    }
    return SYLLABUS_MODULES.reduce((acc, current) => {
      acc[current.id] = 'not_started';
      return acc;
    }, {} as Record<string, 'not_started' | 'studying' | 'mastered'>);
  });

  const [selectedTier, setSelectedTier] = useState<'standard' | 'maestro'>('standard');
  const [generatedVoucher, setGeneratedVoucher] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('spi_syllabus_readiness', JSON.stringify(syllabusStatus));
  }, [syllabusStatus]);

  // Load from Firebase firestore if user is logged in
  useEffect(() => {
    if (user) {
      const loadProfileData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.syllabusStatus) {
              setSyllabusStatus(data.syllabusStatus);
            }
            if (data.voucherCode) {
              setGeneratedVoucher(data.voucherCode);
            }
          }
        } catch (e) {
          console.warn('Could not load user syllabus state from Firebase:', e);
        }
      };
      loadProfileData();
    }
  }, [user]);

  const handleStatusChange = async (moduleId: string, newStatus: 'not_started' | 'studying' | 'mastered') => {
    const updated = { ...syllabusStatus, [moduleId]: newStatus };
    setSyllabusStatus(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          syllabusStatus: updated
        }, { merge: true });
      } catch (err) {
        console.warn('Firebase status save error:', err);
      }
    }
  };

  // Calculations of SPI readiness scoring
  const overallScore = Object.entries(syllabusStatus).reduce((total, [id, status]) => {
    const module = SYLLABUS_MODULES.find(m => m.id === id);
    if (!module) return total;
    
    const multiplier = status === 'mastered' ? 1.0 : status === 'studying' ? 0.4 : 0.0;
    return total + (module.weight * multiplier);
  }, 0);

  // Raw overall points sum
  const maxScore = SYLLABUS_MODULES.reduce((sum, current) => sum + current.weight, 0);
  const readinessPercent = Math.min(Math.round((overallScore / maxScore) * 100), 100);

  // Dynamic ranking based on completeness
  const getReadinessBadge = (percent: number) => {
    if (percent === 0) return { title: 'Dormant Acoustician', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
    if (percent < 25) return { title: 'Registry Initiate', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (percent < 60) return { title: 'Resonance Apprentice', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (percent < 90) return { title: 'Doppler Tactician', color: 'text-[#00d1ff] bg-[#00d1ff]/10 border-[#00d1ff]/20' };
    return { title: 'SPI Exam King Master', color: 'text-[#ffd700] bg-[#ffd700]/10 border-[#ffd700]/20 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,215,0,0.15)] animate-pulse' };
  };

  const badge = getReadinessBadge(readinessPercent);

  // Diagnostic mini-questions playground to assess current logic
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  const DIAGNOSTIC_QUESTIONS = [
    {
      q: "If an ultrasound transducer operates at 6 MHz and is replaced by a 12 MHz transducer, what occurs to the crystal thickness and spatial pulse length?",
      opts: [
        "Crystal thickness is cut in half; Spatial Pulse Length (SPL) generally decreases.",
        "Crystal thickness doubles; Spatial Pulse Length remains constant.",
        "Both crystal thickness and period double.",
        "Crystal thickness is halved; SPL must double to preserve Axial resolution."
      ],
      correct: 0,
      exp: "Higher frequency requires a thinner piezoelectric element (inversely related, f ≈ C / 2th). Since frequency doubles, crystal thickness is halved. Wavelength is cut in half, reducing the Spatial Pulse Length (SPL = cycles × λ), which improves (decreases) your axial resolution limits!"
    },
    {
      q: "To image deeper structures successfully, a sonographer decreases the PRF. Which of the following parameters increases concurrently?",
      opts: [
        "Duty Factor (percent output duration)",
        "Pulse Repetition Period (PRP)",
        "Axial Resolution precision",
        "Acoustic impedance coefficient of target fat"
      ],
      correct: 1,
      exp: "Since PRF is inversely related to PRP (PRP = 1 / PRF), decreasing the PRF to allow sound waves to travel deeper and echo back before the next pulse increases the PRP. Duty factor decreases because there is longer rest time between pulses."
    },
    {
      q: "While performing a vascular scan, the sonographer notices severe aliasing of the spectral signal. Which intervention solves this artifact without changing the sampling angle?",
      opts: [
        "Lower the baseline control and decrease the wall filter.",
        "Switch to a higher frequency transducer.",
        "Increase the Pulse Repetition Frequency (PRF) or use a lower operating frequency probe.",
        "Decrease the speed of sound limit setting manually to 1450 m/s."
      ],
      correct: 2,
      exp: "Aliasing occurs when the Doppler shift exceeding the Nyquist Limit (PRF / 2). Raising the PRF increases the Nyquist scale. Alternatively, switching to a lower operating frequency transducer reduces the Doppler shift frequency, moving it below the limit."
    }
  ];

  const handleAnswerCheck = (index: number) => {
    setSelectedAns(index);
    const correct = index === DIAGNOSTIC_QUESTIONS[activeQuestion].correct;
    setAnsweredCorrectly(correct);
    if (correct && syllabusStatus['artifacts'] !== 'mastered') {
      // Auto upgrade their learning progress slightly on a correct answer!
      handleStatusChange('artifacts', 'studying');
    }
  };

  // Beta access voucher generator code
  const handleVoucherGeneration = async () => {
    setSavingStatus(true);
    const mockRef = 'SB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedVoucher(mockRef);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          voucherCode: mockRef,
          voucherTier: selectedTier,
          joinedBetaAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Failed saving voucher to cloud:', e);
      }
    }
    setSavingStatus(false);
  };

  const copyToClipboard = () => {
    if (generatedVoucher) {
      navigator.clipboard.writeText(generatedVoucher);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-8 overflow-y-auto no-scrollbar scroll-smooth relative"
    >
      {/* Background radial soft lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="border-b border-[#2d3139] pb-6 relative z-10">
        <div className="text-[10px] uppercase font-mono tracking-[4px] text-[#00d1ff] font-bold mb-2 flex items-center gap-2">
          <Rocket size={12} className="animate-pulse" /> Commercial Release & Prep Strategy
        </div>
        <div className="text-3xl sm:text-4xl font-serif italic text-white tracking-tight">
          SonicBuild <span className="text-[#8e9299]">SPI Milestones</span> & Commercial Plan
        </div>
        <p className="text-xs text-[#8e9299] mt-2 max-w-2xl leading-relaxed">
          Get ready to dominate your ARDMS SPI registry exam. This panel contains our three-phase production rollout roadmap, interactive physics syllabus tracking, diagnostic toolkits, and early access license reservation hooks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Interactive Study Board & Voucher Pitch */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Phase status indicator header card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#16181d] border border-[#2d3139] rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider font-bold">Phase 1: Foundation</span>
              <span className="text-sm font-bold text-white font-mono mt-1">Sandbox Live</span>
              <span className="text-[10px] text-[#8e9299] leading-tight mt-1">Interactive waveforms, transducers, hemodynamics simulators.</span>
            </div>
            <div className="p-4 bg-[#16181d] border border-cyan-500/20 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00d1ff] shadow-[0_0_6px_#00d1ff]" />
              <span className="text-[8px] font-mono text-[#00d1ff] uppercase tracking-wider font-bold">Phase 2: Coach AI</span>
              <span className="text-sm font-bold text-white font-mono mt-1">Voice & Transcripts</span>
              <span className="text-[10px] text-[#8e9299] leading-tight mt-1 font-sans">Bourdain mode, audio scripts, Ask AI KB and diagnostic helpers.</span>
            </div>
            <div className="p-4 bg-[#16181d] border border-amber-500/10 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              <span className="text-[8px] font-mono text-amber-500 uppercase tracking-wider font-bold">Phase 3: Production</span>
              <span className="text-sm font-bold text-white/50 font-mono mt-1">Unified Exam Engine</span>
              <span className="text-[10px] text-[#8e9299]/70 leading-tight mt-1">Mock test telemetry, adaptively served registries, premium metrics dashboard.</span>
            </div>
          </div>

          {/* Interactive Syllabus Checklist */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute top-4 right-6 flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#8e9299]">RANKING:</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${badge.color}`}>{badge.title}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/20 flex items-center justify-center">
                <BookOpen size={16} className="text-[#00d1ff]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Interactive SPI Study Syllabus</h3>
                <p className="text-[10px] text-[#8e9299]">Click each objective's state below to advance your live exam readiness index rating.</p>
              </div>
            </div>

            {/* Custom Interactive Scale progress bar */}
            <div className="mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold font-mono text-[#e0e0e0] flex items-center gap-1.5">
                  <Award size={14} className="text-[#ffd700]" /> Overall SPI Exam Readiness Index:
                </span>
                <span className="text-xl font-mono font-bold text-[#ffd700]">{readinessPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#2d3139] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-rose-500 via-[#00d1ff] to-[#ffd700] rounded-full"
                  animate={{ width: `${readinessPercent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-[#8e9299] mt-2">
                <span>0% Initiate</span>
                <span>50% Registry Baseline (Approx. passing grade index)</span>
                <span>100% Registry Master</span>
              </div>
            </div>

            {/* Syllabus Rows */}
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              {SYLLABUS_MODULES.map((sub) => {
                const status = syllabusStatus[sub.id] || 'not_started';
                
                return (
                  <div 
                    key={sub.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl hover:border-white/10 transition-colors gap-3 group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-[#00d1ff] uppercase bg-[#00d1ff]/5 px-1.5 py-0.5 rounded border border-[#00d1ff]/10">
                          {sub.category}
                        </span>
                        <span className="text-[8px] font-mono text-neutral-500">Weight: {sub.weight}%</span>
                      </div>
                      <span className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors">{sub.name}</span>
                    </div>

                    {/* Interactive Toggles */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto font-mono text-[9px] font-bold">
                      <button
                        onClick={() => handleStatusChange(sub.id, 'not_started')}
                        className={`px-2 py-1 rounded-l border ${status === 'not_started' ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                      >
                        TODO
                      </button>
                      <button
                        onClick={() => handleStatusChange(sub.id, 'studying')}
                        className={`px-2 py-1 border-y border-r ${status === 'studying' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                      >
                        STUDYING
                      </button>
                      <button
                        onClick={() => handleStatusChange(sub.id, 'mastered')}
                        className={`px-2 py-1 rounded-r border-y border-r ${status === 'mastered' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                      >
                        MASTERED
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Mini-Playground */}
          <div className="bg-gradient-to-br from-[#16181d] to-[#121318] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center">
                  <Flame size={16} className="text-[#ffd700]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Registry Diagnostic Mini-Test</h3>
                  <p className="text-[10px] text-[#8e9299]">Instantly assess your acoustical reasoning with realistic physical review prompts.</p>
                </div>
              </div>

              {/* Slide dots switcher */}
              <div className="flex gap-1.5">
                {DIAGNOSTIC_QUESTIONS.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setActiveQuestion(idx);
                      setSelectedAns(null);
                      setAnsweredCorrectly(null);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${activeQuestion === idx ? 'bg-[#ffd700] w-4' : 'bg-neutral-600'}`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-black/35 border border-white/5 rounded-xl p-4 md:p-5">
              <div className="text-[9px] font-mono text-[#ffd700] uppercase mb-1">PROMPT: QUESTION {activeQuestion + 1} OF 3</div>
              <blockquote className="text-xs text-white font-serif leading-relaxed mb-4">
                "{DIAGNOSTIC_QUESTIONS[activeQuestion].q}"
              </blockquote>

              <div className="flex flex-col gap-2 mt-4">
                {DIAGNOSTIC_QUESTIONS[activeQuestion].opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectedAns === null && handleAnswerCheck(i)}
                    className={`w-full text-left p-3 rounded-lg text-xs font-sans transition-all border ${
                      selectedAns === i 
                        ? answeredCorrectly 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                        : selectedAns !== null && i === DIAGNOSTIC_QUESTIONS[activeQuestion].correct
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-black/20 border-white/5 text-[#8e9299] hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono opacity-60">[{String.fromCharCode(65 + i)}]</span>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedAns !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3.5 bg-black/80 rounded-lg border border-dashed border-[#2d3139] leading-relaxed"
                >
                  <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-mono uppercase tracking-wider font-bold">
                    {answeredCorrectly ? (
                      <span className="text-emerald-400">✓ Correct Response</span>
                    ) : (
                      <span className="text-[#8e9299]">Incorrect. Review physics concept below:</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8e9299] font-sans">
                    {DIAGNOSTIC_QUESTIONS[activeQuestion].exp}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Commercial Licensure Early Access Reservation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Subscription early pricing selector card */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#00d1ff] font-mono text-[9px] font-bold uppercase tracking-widest mb-2">
                <CreditCard size={12} /> Early-Bird Access Priority
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Commercial Release Registration</h3>
              <p className="text-[10px] text-[#8e9299] mt-1 leading-relaxed">
                Unlock our unified dynamic mock exam vaults, adaptive learning analysis engines, and early-bird university bundle plans.
              </p>

              {/* Tiers Grid */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() => setSelectedTier('standard')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 relative ${selectedTier === 'standard' ? 'border-[#00d1ff] bg-[#00d1ff]/5' : 'border-white/5 bg-black/20 opacity-70 hover:opacity-100'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-white">SPI Exam Prep Tier</span>
                    <span className="text-[#00d1ff] font-mono font-bold text-xs">$9.99<span className="text-[8px] font-normal text-[#8e9299]">/mo</span></span>
                  </div>
                  <ul className="text-[9px] text-[#8e9299] list-disc pl-3 flex flex-col gap-0.5 mt-1">
                    <li>3 Realistic SPI Adaptive Mock Tests</li>
                    <li>Waveform parameters calculator utilities</li>
                    <li>Syllabus completion certificate export</li>
                  </ul>
                </button>

                <button
                  onClick={() => setSelectedTier('maestro')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 relative ${selectedTier === 'maestro' ? 'border-[#ffd700] bg-[#ffd700]/5' : 'border-white/5 bg-black/20 opacity-70 hover:opacity-100'}`}
                >
                  <div className="absolute -top-1.5 -right-1 bg-[#ffd700] text-black text-[7px] font-mono font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    RECOMMENDED
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-[#ffd700] flex items-center gap-1"><Sparkles size={10} /> Ultrasound Maestro Tiers</span>
                    <span className="text-[#ffd700] font-mono font-bold text-xs">$19.99<span className="text-[8px] font-normal text-[#8e9299]">/mo</span></span>
                  </div>
                  <ul className="text-[9px] text-[#2ebdff] list-disc pl-3 flex flex-col gap-0.5 mt-1 font-mono">
                    <li className="text-[#ffd700]">Unlimited AI Adaptive Exam Generations</li>
                    <li>ElevenLabs Voice synthesis credentials</li>
                    <li>TGC Knob Simulator adaptive calibrations</li>
                  </ul>
                </button>
              </div>
            </div>

            {/* Generated Serial codes preview */}
            <div className="mt-6 border-t border-[#2d3139] pt-5">
              {!generatedVoucher ? (
                <button
                  onClick={handleVoucherGeneration}
                  disabled={savingStatus}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedTier === 'maestro'
                      ? 'bg-gradient-to-r from-[#ffd700] to-yellow-600 text-black font-extrabold hover:brightness-110 shadow-lg shadow-yellow-500/10'
                      : 'bg-gradient-to-r from-[#00d1ff] to-cyan-600 text-black font-extrabold hover:brightness-110 shadow-lg shadow-cyan-500/10'
                  }`}
                >
                  {savingStatus ? 'Syncing Cloud...' : 'Reserve Access Code'}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] font-mono text-[#8e9299] uppercase">YOUR SECURE STUDENT ACCESS CODE:</span>
                  <div className="bg-black/60 border border-white/10 p-2.5 rounded-xl flex items-center justify-between font-mono text-sm tracking-widest text-[#ffd700]">
                    <span className="truncate">{generatedVoucher}</span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-1 px-2 border border-white/10 rounded-lg hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[8px] not-italic text-white"
                      title="Copy registration token"
                    >
                      {copied ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                  {user ? (
                    <span className="text-[8.5px] font-mono text-emerald-400/80 text-center leading-tight">
                      ✓ Reserved & Synced to database account: {user.email}
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-mono text-rose-400/80 text-center leading-tight">
                      * Note: Code saved locally. Sign In at screen header to persist securely to your cloud profile!
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Technical Specs */}
          <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <h4 className="text-[9px] font-mono text-white/50 uppercase tracking-widest">Acoustic Specs & Guidelines</h4>
            <div className="grid grid-cols-2 gap-3 text-left font-mono">
              <div className="p-2 bg-black/20 rounded border border-white/5">
                <div className="text-[7.5px] text-[#8e9299] uppercase">Typical C</div>
                <div className="text-[10px] text-white font-bold">1540 m/s</div>
              </div>
              <div className="p-2 bg-black/20 rounded border border-white/5">
                <div className="text-[7.5px] text-[#8e9299] uppercase">SPI Pass Rating</div>
                <div className="text-[10px] text-[#00d1ff] font-bold">80% Target</div>
              </div>
              <div className="p-2 bg-black/20 rounded border border-white/5">
                <div className="text-[7.5px] text-[#8e9299] uppercase">Thermal Limit</div>
                <div className="text-[10px] text-white font-bold">TI &lt; 1.0</div>
              </div>
              <div className="p-2 bg-black/20 rounded border border-white/5">
                <div className="text-[7.5px] text-[#8e9299] uppercase">Safe Mechan.</div>
                <div className="text-[10px] text-[#ffd700] font-bold">MI &lt; 1.9</div>
              </div>
            </div>
            
            <div className="flex gap-2 p-3 bg-black/40 rounded-xl border border-dashed border-white/5">
              <Info size={14} className="text-[#00d1ff] shrink-0 mt-0.5" />
              <div className="text-[8px] text-[#8e9299] leading-relaxed">
                SonicBuild is built strictly on the ARDMS SPI Content Outline blueprint representing core elements in general clinical physics registry preparations. 
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
