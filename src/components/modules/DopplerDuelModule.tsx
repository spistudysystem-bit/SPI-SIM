import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, Target, ShieldAlert, Award, Crosshair, HelpCircle, Triangle, Circle, Square as SquareIcon, Volume2, VolumeX, Lightbulb, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DopplerDuelModuleProps {
  setViewMode: (mode: any) => void;
}

// 5 Rich Clinical cases representing real-world human hemodynamics
const CASES = [
  {
    name: "Common Carotid Artery (CCA)",
    location: "Anterolateral Neck",
    basePsv: 120,
    idealAngle: "45°-60°",
    optimalMin: 45,
    optimalMax: 60,
    description: "Low-resistance vascular bed providing continuous forward diastolic flow to the cerebral circulation.",
    notes: "Perfect for assessing proximal stenosis or common plaque formations.",
    colors: "from-rose-500 via-rose-600 to-rose-700",
    baseline: 20, // baseline percentage from bottom
    triphasic: false
  },
  {
    name: "Renal Artery",
    location: "Retroperitoneum (Kidney)",
    basePsv: 95,
    idealAngle: "45°-60°",
    optimalMin: 45,
    optimalMax: 60,
    description: "Crucial visceral vessel showing rapid systolic acceleration and high continuous diastolic perfusion.",
    notes: "An angle error here of just 5° can falsely indicate over 180 cm/s (Renal Artery Stenosis threshold!).",
    colors: "from-blue-600 via-indigo-600 to-cyan-500",
    baseline: 20,
    triphasic: false
  },
  {
    name: "Posterior Tibial Artery (PTA)",
    location: "Medial Malleolus (Ankle)",
    basePsv: 45,
    idealAngle: "50°-60°",
    optimalMin: 50,
    optimalMax: 60,
    description: "Classic high-resistance peripheral circulation with sharp forward systole and reverse diastolic flow.",
    notes: "Requires lower PRF scaling and higher gains. Keeping angle tight is key to catching early ischemia.",
    colors: "from-amber-500 via-yellow-500 to-orange-600",
    baseline: 40,
    triphasic: true
  },
  {
    name: "Femoral Artery",
    location: "Proximal anterior thigh",
    basePsv: 130,
    idealAngle: "45°-60°",
    optimalMin: 45,
    optimalMax: 60,
    description: "Extremely pulsatile high-resistance lower extremity conduit showing classic triphasic spectral signatures.",
    notes: "High flow speeds. Keep the sample volume centered in the lumen to secure highest laminar velocities.",
    colors: "from-red-600 via-amber-600 to-rose-500",
    baseline: 35,
    triphasic: true
  },
  {
    name: "Celiac Trunk",
    location: "Upper Abdomen (Aorta branch)",
    basePsv: 160,
    idealAngle: "45°-60°",
    optimalMin: 45,
    optimalMax: 60,
    description: "High-velocity gut feeding trunk displaying stable low-resistance flow unaffected by respiration.",
    notes: "Crucial for diagnostics of median arcuate ligament syndrome. Avoid over-steering the beam.",
    colors: "from-teal-500 via-cyan-600 to-[#10b981]",
    baseline: 15,
    triphasic: false
  }
];

export default function DopplerDuelModule({ setViewMode }: DopplerDuelModuleProps) {
  const [round, setRound] = useState(1);
  const currentCase = CASES[round - 1] || CASES[0];
  
  const [angle, setAngle] = useState(25);
  const [truePsv, setTruePsv] = useState(120); // Dynamically calculated below
  const [measuredPsv, setMeasuredPsv] = useState(0);
  const [gateDepth, setGateDepth] = useState(50); // percentage of height from bottom
  const [isLocked, setIsLocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(85);
  const [points, setPoints] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [showHintMsg, setShowHintMsg] = useState(false);

  // Audio state
  const [isSoundOn, setIsSoundOn] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainNodeRef = useRef<GainNode | null>(null);
  const pulseIntervalRef = useRef<any>(null);

  // Drag interaction state
  const viewportRef = useRef<HTMLDivElement>(null);
  const leverRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLever, setIsDraggingLever] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(60);
  const totalRounds = 5;

  // Sync refs for audio loop to avoid closures stale state issues
  const angleRef = useRef(angle);
  const truePsvRef = useRef(truePsv);
  const isFrozenRef = useRef(isFrozen);
  const roundCaseRef = useRef(currentCase);
  const gateDepthRef = useRef(gateDepth);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    truePsvRef.current = truePsv;
  }, [truePsv]);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  useEffect(() => {
    roundCaseRef.current = currentCase;
  }, [currentCase]);

  useEffect(() => {
    gateDepthRef.current = gateDepth;
  }, [gateDepth]);

  // Handle case initializations
  useEffect(() => {
    // Generate randomized True PSV around selected base case value (+-10%)
    const variance = Math.floor((Math.random() * 0.2 - 0.1) * currentCase.basePsv);
    setTruePsv(currentCase.basePsv + variance);
    setGateDepth(50); // Reset sample volume gate perfectly to vessel center
    setAngle(Math.floor(Math.random() * 25) + 10); // Random offset starting angle
    setShowHintMsg(false);
  }, [round]);

  // Calculate measured PSV based on current angle (Doppler equation simplified representation)
  // Measured = True * cos(angle)
  useEffect(() => {
    const angleRad = (angle * Math.PI) / 180;
    const newMeasured = truePsv * Math.cos(angleRad);
    setMeasuredPsv(Number(newMeasured.toFixed(1)));
  }, [angle, truePsv]);

  // Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isLocked && !showResult) handleSubmit();
      return;
    }
    if (isFrozen || isLocked || showResult) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFrozen, isLocked, showResult]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopDopplerSound();
    };
  }, []);

  // Handle angle adjustment via buttons
  const handleAngleChange = (delta: number) => {
    if (isLocked) return;
    setAngle(prev => {
      let newAngle = prev + delta;
      if (newAngle < 0) newAngle = 0;
      if (newAngle > 90) newAngle = 90;
      return newAngle;
    });
  };

  // Click & Drag Coordinate calculation for direct screen steering
  const handleViewportPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Origin at bottom-center center: (width / 2, height)
    const originX = rect.width / 2;
    const originY = rect.height;
    
    const dx = x - originX;
    const dy = originY - y; // vertical up is positive
    
    // Calculate angle in degrees
    let clickedAngle = Math.atan2(dy, -dx) * (180 / Math.PI);
    
    // Lock within 0 to 90
    if (clickedAngle < 0) clickedAngle = 0;
    if (clickedAngle > 90) clickedAngle = 90;
    
    setAngle(Math.round(clickedAngle));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleViewportPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleViewportPointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateLeverFromPointer = (e: React.PointerEvent<HTMLDivElement>, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, relativeY / rect.height));
    
    // Top is 70% depth (shallowest), bottom is 30% depth (deepest)
    const depthValue = Math.round(70 - ratio * 40);
    setGateDepth(depthValue);
  };

  const handleLeverPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    setIsDraggingLever(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateLeverFromPointer(e, e.currentTarget);
  };

  const handleLeverPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingLever && !isLocked) {
      updateLeverFromPointer(e, e.currentTarget);
    }
  };

  const handleLeverPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingLever(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Doppler Audio Synthesizer (Realistic pulsatile hemodynamics pitch shift)
  const startDopplerSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      // Resonant sweep oscillator to mimic acoustic friction
      const osc = ctx.createOscillator();
      const bandpass = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      bandpass.type = 'bandpass';
      bandpass.Q.value = 14; 
      
      osc.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      
      oscRef.current = osc;
      filterNodeRef.current = bandpass;
      gainNodeRef.current = gainNode;

      // Add actual background white noise static to simulate high-angle impedance
      // Generate a quick white noise buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.01; // subtle background static
      
      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start();
      
      noiseSourceRef.current = noiseSource;
      noiseGainNodeRef.current = noiseGain;

      setIsSoundOn(true);
      const startTime = ctx.currentTime;
      
      const updatePulse = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        
        const t = ctx.currentTime - startTime;
        const currentCaseData = roundCaseRef.current;
        
        // Simulating systemic pulse loop (Approx 72 bpm -> 0.83 seconds cycle)
        const cycle = (t % 0.83) / 0.83;
        
        let flowFactor = 0;
        if (currentCaseData.triphasic) {
          // Triphasic flow: High systole, reverse diastolic notch, return forward diastole
          if (cycle < 0.18) {
            flowFactor = cycle / 0.18; // Sharp upstroke
          } else if (cycle < 0.32) {
            flowFactor = 1.0 - ((cycle - 0.18) / 0.14) * 1.3; // Rapid drop below zero (reversal)
          } else if (cycle < 0.45) {
            flowFactor = -0.3 + ((cycle - 0.32) / 0.13) * 0.45; // Gentle return forward
          } else {
            flowFactor = 0.15 - ((cycle - 0.45) / 0.38) * 0.12; // Flat diastolic decay
          }
        } else {
          // Low resistance flow: continuous brain/visceral path flow
          if (cycle < 0.22) {
            flowFactor = 0.3 + (cycle / 0.22) * 0.7; // rapid ascent
          } else if (cycle < 0.55) {
            flowFactor = 1.0 - ((cycle - 0.22) / 0.33) * 0.5; // slow decay
          } else {
            flowFactor = 0.5 - ((cycle - 0.55) / 0.28) * 0.2; // stable diastole
          }
        }
        
        if (isFrozenRef.current) flowFactor = 0.1; // Freeze keeps uniform low hum

        // Convert velocity and Cosine to actual audio pitch:
        // Angle close to 0 gives highest shift. Angle 90 gives no shift.
        const thetaRad = (angleRef.current * Math.PI) / 180;
        const cosFactor = Math.cos(thetaRad);
        
        // Dynamic frequency bounds (from 40Hz to 1200Hz based on hemodynamic flow)
        const absoluteVelocityFactor = truePsvRef.current / 120;
        let pitch = 650 * absoluteVelocityFactor * cosFactor * Math.abs(flowFactor);
        pitch = Math.max(45, pitch);
        
        // Push filter values to standard synthesizer
        osc.frequency.setValueAtTime(pitch * 0.75, ctx.currentTime);
        bandpass.frequency.setValueAtTime(pitch, ctx.currentTime);
        
        // Angle-dependent static/noise factor:
        // High angles above 60° have low SNR and increased ambient noise/scrambling
        const gDepth = gateDepthRef.current !== undefined ? gateDepthRef.current : 50;
        const isInsideVessel = gDepth >= 41 && gDepth <= 59;
        const vesselFactor = isInsideVessel 
          ? 1.0 
          : Math.max(0.04, 1.0 - Math.min(10, Math.min(Math.abs(gDepth - 41), Math.abs(gDepth - 59))) / 10);

        if (noiseGain) {
          if (!isInsideVessel) {
            // tissue friction hiss
            const tissueFactor = 0.01 + (1.0 - vesselFactor) * 0.15;
            noiseGain.gain.setValueAtTime(tissueFactor, ctx.currentTime);
          } else if (angleRef.current > 60) {
            const staticFactor = Math.min(0.2, (angleRef.current - 60) / 150);
            noiseGain.gain.setValueAtTime(staticFactor, ctx.currentTime);
          } else {
            noiseGain.gain.setValueAtTime(0.01, ctx.currentTime);
          }
        }

        // Output Gain matching hemodynamics flow power
        let targetVolume = 0.15 * cosFactor;
        if (angleRef.current >= currentCaseData.optimalMin && angleRef.current <= currentCaseData.optimalMax) {
          targetVolume = 0.24; // clean sound amplification in optimal training range
        } else if (angleRef.current > 75) {
          targetVolume = 0.02; // extremely muffled near orthogonal
        }
        
        targetVolume = targetVolume * vesselFactor;
        
        gainNode.gain.setValueAtTime(targetVolume * Math.max(0.1, flowFactor), ctx.currentTime);
        
        pulseIntervalRef.current = requestAnimationFrame(updatePulse);
      };
      
      pulseIntervalRef.current = requestAnimationFrame(updatePulse);
    } catch (err) {
      console.error("Audio engine context startup blocked or failed.", err);
    }
  };

  const stopDopplerSound = () => {
    if (pulseIntervalRef.current) {
      cancelAnimationFrame(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch(e){}
      oscRef.current = null;
    }
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch(e){}
      noiseSourceRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e){}
      audioContextRef.current = null;
    }
    setIsSoundOn(false);
  };

  const handleSoundToggle = () => {
    if (isSoundOn) {
      stopDopplerSound();
    } else {
      startDopplerSound();
    }
  };

  const getAngleStatusColor = () => {
    if (angle >= currentCase.optimalMin && angle <= currentCase.optimalMax) return 'text-[#10b981]';
    if (angle > 60) return 'text-red-500';
    return 'text-[#00d1ff]'; 
  };
  
  const getAngleStatusText = () => {
    if (angle >= currentCase.optimalMin && angle <= currentCase.optimalMax) return 'OPTIMAL (45°-60°)';
    if (angle > 60) return 'OVERESTIMATED ERROR';
    return 'SUB-OPTIMAL SPEED';
  };

  const handleSubmit = () => {
    if (isLocked) return;
    setIsLocked(true);
    
    // Evaluate if user is inside target range
    const isOptimal = angle >= currentCase.optimalMin && angle <= currentCase.optimalMax;
    const scoreGain = isOptimal ? 150 + (streak * 10) : 0;

    if (isOptimal) {
      setStreak(prev => prev + 1);
      setPoints(prev => prev + scoreGain);
      setAccuracy(prev => Math.min(100, prev + 3));
    } else {
      setStreak(0);
      setAccuracy(prev => Math.max(0, prev - 4));
    }
    
    setShowResult(true);
    
    // Reset after delay and cycle rounds
    setTimeout(() => {
      if (round >= totalRounds) {
        setViewMode('dashboard'); // Exit back to clinical main deck when fully cleared
        return;
      }
      setRound(prev => prev + 1);
      setTimeLeft(60);
      setShowResult(false);
      setIsLocked(false);
      setIsFrozen(false);
    }, 4000);
  };

  // Corrected PSV calculation (what the machine calculates given the input angle)
  // Corrected = Measured / cos(input_angle)
  const correctedPsv = angle === 90 ? 0 : measuredPsv / Math.cos((angle * Math.PI) / 180);

  // Dynamic y-coordinate matching the sample volume gate to the vessel center
  const alphaRad = ((angle - 90) * Math.PI) / 180;
  const cosAlpha = Math.max(0.1, Math.cos(alphaRad)); // prevent division by zero or extreme values
  // gateDepth is percent of viewport height from the bottom
  const dRatio = (gateDepth / 100) / (1.4 * cosAlpha);
  const gateTopPercent = Math.max(2, Math.min(98, (1 - dRatio) * 100));

  return (
    <div className="w-full h-full min-h-screen bg-[#050B14] p-2 sm:p-4 text-white font-sans overflow-y-auto selection:bg-[#00d1ff]/30 touch-none">
      <style>{`
        @keyframes slideLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes flowLeft {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes beamGlow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {/* Background Grid & Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25" style={{
        backgroundImage: `linear-gradient(rgba(0, 209, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 209, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-t from-[#050B14] via-transparent to-[#050B14]" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-4 px-1 pb-16">
        
        {/* Header Region */}
        <header className="flex flex-col items-center justify-center relative mb-1">
          {/* Top Tech Decals / Utility Rail */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 text-slate-500 font-mono text-[8px] sm:text-[9px] tracking-widest mb-1.5 uppercase opacity-80">
            <span>[ SYSTEM REFERENCE: ARDMS-SPI ]</span>
            <span className="w-1.5 h-1.5 bg-[#00d1ff] rounded-full animate-pulse shadow-[0_0_8px_#00d1ff]" />
            <span>HEMODYNAMICS CALIBRATOR // CLASS-IV DECK</span>
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>SPI LABS • PROBE-AUTOON</span>
          </div>

          <h2 className="text-[#00d1ff]/80 text-[8px] md:text-[10px] font-black tracking-[0.35em] uppercase mb-1 drop-shadow-[0_0_5px_rgba(0,209,255,0.3)]">
            SPI ULTRASONIC TRAINING DECK
          </h2>
          
          <div className="relative flex items-center justify-center py-1">
            <div className="h-[2px] w-12 md:w-32 bg-gradient-to-l from-[#00d1ff] to-transparent absolute right-[105%] top-1/2" />
            <span className="absolute -top-1.5 text-[6px] tracking-widest text-[#00d1ff]/60 uppercase font-mono">Arena Session #4029</span>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-amber-300 drop-shadow-[0_0_15px_rgba(0,209,255,0.6)] uppercase text-center px-4">
              Doppler Angle Duel
            </h1>
            <div className="h-[2px] w-12 md:w-32 bg-gradient-to-r from-[#eab308] to-transparent absolute left-[105%] top-1/2" />
          </div>

          {/* Scoreboard Bar */}
          <div className="flex items-center justify-between w-full lg:w-auto lg:justify-center gap-1 sm:gap-4 mt-3 sm:mt-5 px-1 sm:px-2">
             {/* Player Arena Section */}
             <div className="flex items-center bg-blue-900/30 border border-blue-500/40 rounded-l-full pr-3 sm:pr-6 pl-1 sm:pl-2 py-1 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                <div className="hidden sm:flex -space-x-2 mr-3">
                  <div className="w-7 h-7 rounded-full bg-blue-700 border border-blue-400 opacity-80 flex items-center justify-center text-[10px] font-bold">SP</div>
                  <div className="w-7 h-7 rounded-full bg-blue-500 border border-blue-400 opacity-80 z-10 flex items-center justify-center text-[10px] font-bold">C</div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[7px] sm:text-[9px] text-blue-300 font-bold uppercase tracking-wider hidden sm:block">Challenger</span>
                  <span className="text-[10px] sm:text-sm font-black text-white italic">SONOGRAPHER</span>
                </div>
             </div>

             {/* Score Box */}
             <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-950/80 border-2 border-blue-400 rounded-lg flex items-center justify-center transform -skew-x-12 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 relative -ml-1 sm:-ml-4">
               <span className="text-sm sm:text-2xl font-black text-white transform skew-x-12">{points}</span>
             </div>

             {/* Timer */}
             <div className="flex flex-col items-center justify-center w-20 sm:w-28 mx-1">
                <div className={`bg-black/95 border ${timeLeft <= 10 ? 'border-red-500 animate-pulse text-red-500' : 'border-[#00d1ff]/40 text-white'} rounded px-2 py-1 flex flex-col items-center w-full transition-colors`}>
                  <span className="text-base sm:text-2xl font-mono font-bold tracking-widest leading-none">{Math.floor(timeLeft/60).toString().padStart(2, '0')}:{Math.floor(timeLeft%60).toString().padStart(2, '0')}</span>
                  <span className="text-[5px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Round {round}/{totalRounds}</span>
                </div>
             </div>

             {/* Rival scoreboard */}
             <div className="w-10 h-10 sm:w-14 sm:h-14 bg-amber-950/80 border-2 border-amber-500 rounded-lg flex items-center justify-center transform -skew-x-12 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 relative -mr-1 sm:-mr-4">
               <span className="text-sm sm:text-2xl font-black text-white transform skew-x-12">{150 * round - 35}</span>
             </div>

             {/* Rival Section */}
             <div className="flex items-center bg-amber-900/30 border border-amber-500/40 rounded-r-full pl-3 sm:pl-6 pr-1 sm:pr-2 py-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <div className="flex flex-col text-left mr-3">
                  <span className="text-[7px] sm:text-[9px] text-amber-300 font-bold uppercase tracking-wider hidden sm:block">AI Pilot</span>
                  <span className="text-[10px] sm:text-sm font-black text-white italic">PROBE-BOT</span>
                </div>
                <div className="hidden sm:flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-amber-600 border border-amber-400 opacity-80" />
                </div>
             </div>
          </div>
        </header>

        {/* Main Content Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
          
          {/* COLUMN 1 (4 cols): Target Screen, Angle and Adjust Dial */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            {/* Direct Interaction Viewport */}
            <div 
              ref={viewportRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative border border-[#00d1ff]/50 rounded-lg bg-[#040c18] overflow-hidden shadow-[inset_0_0_25px_rgba(0,209,255,0.2)] h-64 md:h-76 flex flex-col cursor-crosshair touch-none select-none"
            >
              <div className="absolute top-0 w-full bg-gradient-to-b from-[#00d1ff]/25 to-transparent p-2 flex justify-between items-center z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[#00d1ff] text-[10px] font-black tracking-widest uppercase">SPI CORE DUPLEX DVS</span>
                </div>
                <span className="text-[7.5px] bg-[#00d1ff]/25 text-white border border-[#00d1ff]/40 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono hidden sm:inline">
                  DRAG VIEWPORT TO STEER
                </span>
              </div>
              
              {/* Fake Sector / Vascular Layer */}
              <div className="flex-1 relative bg-[#010811] flex items-center justify-center overflow-hidden">
                {/* Interactive Grid Scale Markers (Depth Tick Marks down the right edge) */}
                <div className="absolute right-1 top-4 bottom-4 w-4 flex flex-col justify-between items-end text-[7px] text-slate-500 font-mono pointer-events-none z-10 pr-0.5 border-r border-slate-800/60">
                  <span>- 0</span>
                  <span>- 1</span>
                  <span>- 2</span>
                  <span>- 3</span>
                  <span>- 4</span>
                  <span>- 5</span>
                  <span>- 6cm</span>
                </div>

                {/* Transducer Sonographic Orientation Marker "D" on top-left (Crucial for clinical ultrasound scanners) */}
                <div className="absolute top-9 left-2 w-5 h-5 rounded border border-[#00d1ff]/40 bg-[#00d1ff]/10 flex items-center justify-center pointer-events-none z-10 text-[9px] text-[#00d1ff] font-extrabold font-mono shadow-[0_0_8px_rgba(0,209,255,0.3)]">
                  D
                </div>

                {/* Clinical Metadata Stamp overlay matching premium hospital machines */}
                <div className="absolute top-9 left-10 flex flex-col text-[7px] text-slate-500 font-mono pointer-events-none z-10 leading-none gap-0.5">
                  <span>SPI SHIFT: AUTO-CONV</span>
                  <span>TIS: 0.2 | MI: 1.1</span>
                  <span>PWR: 100% | DR: 65dB</span>
                </div>

                {/* Sonar sweep overlay */}
                <div className="absolute top-[-40%] w-[120%] h-[180%] border-x-[30px] border-transparent border-t-[80px] border-t-transparent border-b-[600px] border-b-slate-900/30 rounded-full opacity-40 blur-sm pointer-events-none" />
                
                {/* Horizontal vessel representation */}
                <div className="absolute w-[120%] h-12 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-900/80 border-y-2 border-white/20 top-[40%] flex items-center pointer-events-none overflow-hidden">
                  {/* Flow blood cells */}
                  <div className="absolute inset-0 flex items-center gap-12 opacity-85 px-4" style={{ animation: isFrozen ? 'none' : 'flowLeft 6s linear infinite' }}>
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="w-3 h-2 rounded-full bg-red-600/60 blur-[1px]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                        <div className="w-2.5 h-2 rounded-full bg-rose-500/50" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Flow Region Boundary Box */}
                <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 w-[160px] h-[33px] border border-[#00d1ff]/50 rounded-sm overflow-hidden flex flex-col pointer-events-none" style={{ transform: 'translateX(-50%) skewX(12deg)' }}>
                   <div className="flex-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 opacity-60 blur-[1px]" />
                   <div className="flex-1 bg-gradient-to-r from-blue-700 via-cyan-500 to-teal-400 opacity-55 blur-[1px]" style={{ mixBlendMode: 'screen' }} />
                </div>

                {/* Acoustic Steering Alignment Beam Line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-[#00d1ff]/20 shadow-[0_0_5px_rgba(0,209,255,0.3)] pointer-events-none" style={{ animation: 'beamGlow 3s infinite' }} />

                {/* Actual Doppler cursor (steered by user angle) */}
                <div 
                  className="absolute bottom-0 w-[2px] bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,1)] transform origin-bottom transition-all duration-150 ease-out pointer-events-none" 
                  style={{ height: '140%', transform: `rotate(${angle - 90}deg) translateX(-50%)` }}
                >
                  {/* Doppler sample volume fence gate */}
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 w-[14px] h-[14px] rounded-full border border-green-400 flex items-center justify-center transition-all duration-150 ease-out bg-[#010811]/70"
                    style={{ top: `${gateTopPercent}%` }}
                  >
                    <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                  </div>
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 w-[22px] h-[1.5px] bg-yellow-400 transition-all duration-150 ease-out shadow-[0_0_5px_rgba(234,179,8,0.8)]" 
                    style={{ top: `${gateTopPercent - 3}%` }} 
                  />
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 w-[22px] h-[1.5px] bg-yellow-400 transition-all duration-150 ease-out shadow-[0_0_5px_rgba(234,179,0,0.8)]" 
                    style={{ top: `${gateTopPercent + 3}%` }} 
                  />
                </div>
              </div>

              {/* Informative HUD details */}
              <div className="absolute bottom-2 left-2 flex flex-col font-mono text-[9px] pointer-events-none select-none text-slate-400">
                <span className="font-bold text-[#00d1ff]">{currentCase.name}</span>
                <span>Anatomy: {currentCase.location}</span>
              </div>
              
              <div className="absolute top-10 right-8 border border-slate-700 bg-black/75 rounded px-2 py-0.5 pointer-events-none">
                <span className="text-yellow-400 font-mono text-xs font-bold">θ = {angle}°</span>
              </div>
              
              <div className="absolute bottom-2 right-8 text-[8px] text-slate-400 font-mono pointer-events-none select-none">
                F0 4.5 MHz<span className="ml-3 font-bold text-yellow-400">STEER MODE</span>
              </div>
            </div>

            {/* Adjuster Module - Buttons and rotary dials */}
            <div className="flex gap-2 h-32 sm:h-36">
              
              {/* Dial Gauge */}
              <div className="flex-1 border border-[#00d1ff]/30 rounded-lg bg-[#050e1b] p-2 relative flex flex-col items-center justify-center">
                <span className="absolute top-1.5 left-2 text-[#00d1ff] text-[8px] font-bold tracking-wider uppercase">Cosine Gauge</span>
                
                {/* Gauge sweep layout */}
                <div className="relative w-28 h-12 mt-3 overflow-hidden flex justify-center">
                  <div className="absolute bottom-0 w-24 h-24 rounded-full border-8 border-slate-800/80" />
                  {/* Perfect training segment */}
                  <div className="absolute bottom-0 w-24 h-24 rounded-full border-8 border-transparent border-t-[#10b981] border-r-[#10b981] transform -rotate-45 opacity-50" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }} />
                  {/* Error segment above 60 */}
                  <div className="absolute bottom-0 w-24 h-24 rounded-full border-8 border-transparent border-r-red-500 opacity-50" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%)' }} />
                  
                  {/* Needle pointing */}
                  <motion.div 
                    className="absolute bottom-[-3px] left-1/2 w-0.5 h-12 bg-white origin-bottom pointer-events-none drop-shadow-[0_0_4px_white]"
                    animate={{ rotate: angle - 90 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  />
                  <div className="absolute bottom-[-3px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-400 rounded-full border border-white" />
                </div>

                <div className="mt-1 flex flex-col items-center">
                  <span className={`text-base font-extrabold font-mono leading-none ${getAngleStatusColor()}`}>{angle}°</span>
                  <span className={`text-[8px] font-bold tracking-widest mt-0.5 ${getAngleStatusColor()}`}>{getAngleStatusText()}</span>
                </div>
              </div>

              {/* Angle Knob controller */}
              <div className="flex-1 border border-[#00d1ff]/30 rounded-lg bg-[#050e1b] p-2 relative flex flex-col items-center justify-center">
                <span className="absolute top-1.5 left-2 text-[#00d1ff] text-[8px] font-bold tracking-wider uppercase">Rotary Dial</span>
                
                <button onClick={() => handleAngleChange(1)} className="text-[#00d1ff] hover:text-white transition-colors p-0.5 z-10" disabled={isLocked}>
                  <Triangle className="w-3.5 h-3.5 fill-current" />
                </button>
                <div className="text-[7px] text-slate-400 font-bold leading-none mb-1 uppercase">Fine</div>
                
                <div className="flex items-center gap-2 w-full justify-center">
                  <button onClick={() => handleAngleChange(-5)} className="text-white/40 hover:text-white text-sm font-bold w-5 h-5 flex items-center justify-center border border-white/20 rounded bg-white/5 active:bg-white/25 z-10" disabled={isLocked}>-</button>
                  
                  {/* Styled physical round dial */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 border border-slate-500 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={() => handleAngleChange(isLocked ? 0 : 5)}>
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black/40 bg-gradient-to-tl from-slate-800 to-slate-600 flex items-center justify-center shadow-inner">
                       <div className="w-1 h-1 bg-[#00d1ff] rounded-full shadow-[0_0_3px_#00d1ff] self-start mt-1" />
                     </div>
                  </div>
                  
                  <button onClick={() => handleAngleChange(5)} className="text-white/40 hover:text-white text-sm font-bold w-5 h-5 flex items-center justify-center border border-white/20 rounded bg-white/5 active:bg-white/25 z-10" disabled={isLocked}>+</button>
                </div>
                
                <div className="text-[7px] text-slate-400 font-bold leading-none mt-1 uppercase">Coarse</div>
                <button onClick={() => handleAngleChange(-1)} className="text-[#00d1ff] hover:text-white transition-colors rotate-180 p-0.5 z-10" disabled={isLocked}>
                  <Triangle className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

            </div>

            {/* Gate Depth (Sample Volume Position) Control Panel */}
            <div className="border border-[#00d1ff]/20 rounded-lg bg-[#050e1b] p-3 flex flex-col gap-2 relative shadow-md">
              <span className="absolute top-1.5 left-2.5 text-[#00d1ff] text-[8px] font-bold tracking-wider uppercase">Gate Depth (SV)</span>
              
              <div className="flex justify-between items-center text-[7.5px] font-bold uppercase tracking-wider text-slate-400 mt-2 border-b border-white/5 pb-1.5">
                <span>Transducer Gate Lever</span>
                <span className={gateDepth >= 41 && gateDepth <= 59 ? "text-green-400 font-extrabold" : "text-yellow-500 animate-pulse font-extrabold"}>
                  {gateDepth >= 41 && gateDepth <= 59 ? "IN LUMEN (FLOW ACTIVE)" : "OUT OF VESSEL (TISSUE SILENCE)"}
                </span>
              </div>
              
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Visual Metadata Panel (Left 7 Columns) */}
                <div className="col-span-7 flex flex-col gap-2">
                  <div className="bg-[#02070f] border border-slate-800 rounded p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Acoustic Gate Center</span>
                    <div className="text-xl font-mono font-black text-white flex items-baseline gap-1">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00d1ff] drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]">
                        {gateDepth}%
                      </span>
                      <span className="text-[9px] text-slate-500 font-normal">depth</span>
                    </div>
                  </div>

                  {/* Manual Arrow Steps for precision clicks */}
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => setGateDepth(prev => Math.min(70, prev + 1))}
                      disabled={isLocked}
                      className="text-[#00d1ff] bg-[#00d1ff]/5 hover:bg-[#00d1ff]/15 border border-[#00d1ff]/20 rounded py-1.5 px-2 flex items-center justify-between text-[8px] font-mono select-none active:scale-95 transition-all text-left"
                    >
                      <span>▲ RETRACT (SHALLOW)</span>
                      <span className="font-bold">+1%</span>
                    </button>
                    
                    <button 
                      onClick={() => setGateDepth(prev => Math.max(30, prev - 1))}
                      disabled={isLocked}
                      className="text-[#00d1ff] bg-[#00d1ff]/5 hover:bg-[#00d1ff]/15 border border-[#00d1ff]/20 rounded py-1.5 px-2 flex items-center justify-between text-[8px] font-mono select-none active:scale-95 transition-all text-left"
                    >
                      <span>▼ DEEPEN (PENETRATE)</span>
                      <span className="font-bold">-1%</span>
                    </button>
                  </div>

                  {/* Calibration hint message */}
                  <div className="text-[7.5px] font-mono text-slate-400 leading-tight border-t border-white/5 pt-1.5 bg-[#02070f]/30 p-1.5 rounded">
                    <span className="text-amber-400 font-bold">LUMEN TARGET:</span> Move lever to align the yellow sample volume dots perfectly inside the vessel red/blue lumen.
                  </div>
                </div>

                {/* Tactical Vertical Lever Bay (Right 5 Columns) */}
                <div className="col-span-5 flex flex-col items-center justify-center">
                  <div 
                    ref={leverRef}
                    onPointerDown={handleLeverPointerDown}
                    onPointerMove={handleLeverPointerMove}
                    onPointerUp={handleLeverPointerUp}
                    onPointerLeave={handleLeverPointerUp}
                    className={`w-14 h-40 bg-[#010811] border ${isDraggingLever ? 'border-cyan-400' : 'border-slate-800'} rounded-lg relative flex flex-col items-center justify-between py-2 cursor-row-resize select-none overflow-hidden shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] touch-none`}
                    style={{ cursor: isLocked ? 'not-allowed' : 'row-resize', opacity: isLocked ? 0.6 : 1 }}
                  >
                    {/* Linear tick markings inside track */}
                    <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[6.5px] text-slate-500 font-mono pointer-events-none select-none z-0">
                      <span>70% -</span>
                      <span>60% -</span>
                      <span>50% -</span>
                      <span>40% -</span>
                      <span>30% -</span>
                    </div>

                    {/* Glowing vertical target vessel lumen zone bar (41% to 59%) */}
                    <div className="absolute top-[27.5%] bottom-[27.5%] right-2.5 w-1 rounded-sm bg-green-500/15 border-r border-[#10b981]/20 pointer-events-none z-0 shadow-[0_0_4px_rgba(16,185,129,0.1)]" />

                    {/* Actual vertical physical glide rail */}
                    <div className="absolute inset-y-2 right-4 w-[4px] bg-slate-900 border border-slate-800 rounded-full pointer-events-none z-0 flex items-center justify-center">
                      {/* Active track lighting based on Lumen activation */}
                      <div 
                        className={`w-full rounded-full transition-colors ${gateDepth >= 41 && gateDepth <= 59 ? 'bg-green-500 shadow-[0_0_6px_#10b981]' : 'bg-[#00d1ff]/50'}`}
                        style={{
                          height: `${((70 - gateDepth) / 40) * 100}%`,
                          marginTop: 'auto'
                        }}
                      />
                    </div>

                    {/* 3D Physical Lever Handle */}
                    <div 
                      className="absolute right-[5px] w-8 h-7 rounded-md border border-slate-700 bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 flex flex-col items-center justify-center shadow-[0_3px_6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] pointer-events-none z-10 transition-all duration-75 ease-out"
                      style={{
                        top: `calc(${((70 - gateDepth) / 40) * 100}% - 14px)`,
                        transform: isDraggingLever ? 'scale(1.04)' : 'none',
                        boxShadow: isDraggingLever ? '0 0 10px rgba(0, 209, 255, 0.4)' : 'none'
                      }}
                    >
                      {/* Metal grip horizontal ribs */}
                      <div className="w-5 h-[1.5px] bg-black/40 mb-0.5 rounded-full" />
                      
                      {/* Floating neon light center alignment marker */}
                      <div className={`w-6 h-[2.5px] rounded-full transition-colors ${gateDepth >= 41 && gateDepth <= 59 ? 'bg-green-400 shadow-[0_0_6px_#10b981]' : 'bg-[#00d1ff] shadow-[0_0_6px_#00d1ff]'}`} />
                      
                      <div className="w-5 h-[1.5px] bg-black/40 mt-0.5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2 (4 cols): Case Objective & Hologram results */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            {/* Case Objective Card */}
            <div className="border border-slate-800 bg-[#060f1c]/90 p-4 rounded-lg flex flex-col relative overflow-hidden shadow-md">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-cyan-400 text-xs font-black tracking-widest uppercase">CASE PROFILE #{round}</span>
                <span className="text-[9px] text-[#10b981] font-mono font-bold bg-[#10b981]/15 border border-[#10b981]/30 px-1.5 py-0.5 rounded uppercase">Active Round</span>
              </div>
              <h3 className="text-white font-extrabold text-sm mb-1">{currentCase.name}</h3>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">{currentCase.description}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 font-mono text-[9px] text-slate-400">
                <div>
                  <span className="block text-slate-500 uppercase tracking-wider text-[8px]">Ideal Goal Angle</span>
                  <span className="text-[#00d1ff] font-bold">{currentCase.idealAngle}</span>
                </div>
                <div>
                  <span className="block text-slate-500 uppercase tracking-wider text-[8px]">Gold Std PSV</span>
                  <span className="text-[#10b981] font-bold">~ {currentCase.basePsv} cm/s</span>
                </div>
              </div>
              
              <div className="mt-3 bg-black/30 p-2 rounded border border-slate-800 flex gap-2 items-start">
                <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 italic leading-snug">{currentCase.notes}</p>
              </div>
            </div>

            {/* Score & Streak Block */}
            <div className="flex gap-2 justify-center">
              <div className="flex-1 border border-slate-800 rounded-lg bg-[#050e1b] p-2 flex flex-col items-center justify-center text-center">
                <span className="text-slate-400 text-[8px] font-bold tracking-widest uppercase mb-1">STEERING SCORE</span>
                <span className={`text-base font-mono font-black ${getAngleStatusColor()}`}>{angle}&deg;</span>
                <span className="text-[8px] font-mono text-slate-500 mt-0.5">COSINE: {Math.cos((angle * Math.PI) / 180).toFixed(3)}</span>
              </div>
              <div className="flex-1 border border-slate-800 rounded-lg bg-[#050e1b] p-2 flex flex-col items-center justify-center text-center">
                <span className="text-[#10b981] text-[8px] font-bold tracking-widest uppercase mb-1">STREAK MULTI</span>
                <span className="text-base font-mono font-black text-[#10b981] leading-none">x{streak}</span>
                <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-[#10b981]/80">
                  <Activity size={10} className="text-[#10b981] animate-pulse" />
                  <span>BURST</span>
                </div>
              </div>
              <div className="flex-1 border border-slate-800 rounded-lg bg-[#050e1b] p-2 flex flex-col items-center justify-center text-center">
                <span className="text-cyan-400 text-[8px] font-bold tracking-widest uppercase mb-1">ACCURACY INDEX</span>
                <span className="text-base font-mono font-black text-cyan-400 leading-none">{accuracy}%</span>
                <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-cyan-400/80">
                  <Target size={10} className="text-cyan-400" />
                  <span>CALIBRATED</span>
                </div>
              </div>
            </div>

            {/* Hologram Floating results Area */}
            <div className="flex-1 relative flex items-center justify-center min-h-[140px] md:min-h-[180px]">
               {/* Ambient Hologram rings */}
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] aspect-square rounded-full border border-dashed border-[#00d1ff]/15 flex items-center justify-center" style={{ transform: 'translate(-50%, -50%) rotateX(65deg)' }}>
                  <div className="w-[80%] aspect-square rounded-full border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,186,255,0.15)] flex items-center justify-center">
                     <div className="w-[50%] aspect-square rounded-full bg-[#00d1ff]/10 animate-pulse" />
                  </div>
               </div>

               <AnimatePresence mode="wait">
                 {!showResult ? (
                   <motion.div 
                     key="streak-bonus"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="relative z-10 border border-[#eab308]/40 bg-black/80 p-2.5 px-6 rounded text-center shadow-lg mt-[-20px]"
                   >
                     <span className="text-[#eab308] text-[9px] font-bold tracking-widest uppercase block mb-0.5">Accuracy multiplier</span>
                     <span className="text-lg font-black text-white font-mono">x{(1.0 + streak * 0.05).toFixed(2)}</span>
                     <span className="block text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{streak > 0 ? "STREAK BONUSES MULTIPLYING!" : "GET A STREAK STARTED!"}</span>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="reveal-result"
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -15 }}
                     className={`relative z-20 border-2 ${angle >= currentCase.optimalMin && angle <= currentCase.optimalMax ? 'border-[#10b981] bg-[#071911]/95 text-[#10b981]' : 'border-red-500 bg-[#1c0808]/95 text-red-500'} p-4 rounded-xl shadow-2xl w-full max-w-sm backdrop-blur-md flex flex-col text-center`}
                   >
                     <div className="flex items-center justify-center gap-3 border-b border-white/10 pb-2 mb-2">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${angle >= currentCase.optimalMin && angle <= currentCase.optimalMax ? 'bg-[#10b981]/25 border border-[#10b981]' : 'bg-red-500/25 border border-red-500'}`}>
                         {angle >= currentCase.optimalMin && angle <= currentCase.optimalMax ? '✓' : '✗'}
                       </div>
                       <span className="text-base font-black tracking-widest uppercase">{angle >= currentCase.optimalMin && angle <= currentCase.optimalMax ? 'OPTIMIZED ANGLE!' : 'SUB-OPTIMAL RANGE'}</span>
                     </div>
                     <span className="text-white font-mono text-[11px] mb-1.5 leading-relaxed">
                       TRUE VELOCITY = <span className="font-bold text-yellow-400">{truePsv} cm/s</span><br/>
                       YOUR ANGLE = <span className="font-bold">{angle}&deg;</span>
                     </span>
                     {angle >= currentCase.optimalMin && angle <= currentCase.optimalMax ? (
                       <span className="text-[#10b981] font-extrabold font-mono text-sm mt-1 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                         +{150 + (streak * 10)} POINTS INJECTED
                       </span>
                     ) : (
                       <span className="text-red-400 text-[10px] font-bold mt-1 italic">
                         Cosine math error escalated target speed. Keep below 60°.
                       </span>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

          </div>

          {/* COLUMN 3 (4 cols): Spectral Waveform & Realtime Values */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            {/* Spectral Doppler Box */}
            <div className="border border-slate-800 rounded-lg bg-[#01060e] overflow-hidden flex flex-col shadow-inner h-52">
               <div className="bg-slate-900/40 p-2 flex justify-between items-center border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-yellow-400 animate-pulse" />
                    <span className="text-[#eab308] text-[9px] font-bold tracking-widest uppercase">SPECTRAL ULTRASOUND WAVEFORM</span>
                  </div>
                  <div className="flex gap-2 text-[8px] text-slate-500 font-mono">
                    <span>PW GATE</span>
                    <span>GAIN: {isFrozen ? "HOLD" : "AUTO"}</span>
                  </div>
               </div>
               
               {/* Waveform Canvas Simulation */}
               <div className="flex-1 relative bg-black/90 flex">
                  {/* Grid values */}
                  <div className="w-9 border-r border-slate-800/80 flex flex-col justify-between text-[8px] text-slate-500 font-mono py-1 px-1 text-right bg-black/40 z-15">
                    <span className="text-[#00d1ff]">cm/s</span>
                    <span>160</span>
                    <span>120</span>
                    <span>80</span>
                    <span>40</span>
                    <span>0</span>
                    <span>-40</span>
                  </div>
                  
                  {/* Waveform curves */}
                  <div className="flex-1 relative overflow-hidden flex items-end" style={{ paddingBottom: '15%' }}>
                    {/* Baseline indicator */}
                    <div className="absolute bottom-[20%] w-full h-[1.5px] bg-slate-800 dotted-line" style={{ backgroundSize: '5px 1px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 50%, transparent 50%)' }} />
                    
                    {/* Measurement Line */}
                    {isLocked && (
                      <div className="absolute left-[35%] top-0 h-full w-[1.5px] bg-[#10b981] shadow-[0_0_8px_#10b981] z-10 flex flex-col items-center pointer-events-none">
                        <div className="w-2 h-[1px] bg-[#10b981] mt-8" />
                        <div className="w-[1.5px] h-3 bg-[#10b981] absolute top-8 text-[8px] pl-1 font-bold">PSV</div>
                      </div>
                    )}

                    {/* Infinite moving wave loop */}
                    <div className="absolute inset-0 w-[200%] h-full flex items-end">
                      <svg 
                        className={`w-full h-full text-white fill-current opacity-75 filter brightness-125 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] ${(!isFrozen && !isLocked) ? 'animate-[slideLeft_2.6s_linear_infinite]' : ''}`} 
                        preserveAspectRatio="none" 
                        viewBox="0 0 200 100"
                        style={{ animationName: (!isFrozen && !isLocked) ? 'slideLeft' : 'none', animationDuration: '2.6s', animationTimingFunction: 'linear' }}
                      >
                         {/* Realistic pulsatile curve path */}
                         <path d="M0,85 L4,85 L8,80 L10,50 L12,25 L14,35 L16,55 L18,70 L20,78 L22,80 L24,81 L26,82 L30,85 L44,85 L48,80 L50,50 L52,25 L54,35 L56,55 L58,70 L60,78 L62,80 L64,81 L66,82 L70,85 L84,85 L88,80 L90,50 L92,25 L94,35 L96,55 L98,70 L100,78 L102,80 L104,81 L106,82 L110,85 L124,85 L128,80 L130,50 L132,25 L134,35 L136,55 L138,70 L140,78 L142,80 L144,81 L146,82 L150,85 L164,85 L168,80 L170,50 L172,25 L174,35 L176,55 L178,70 L180,78 L184,80 L186,81 L188,82 L190,85 L200,85 L200,100 L0,100 Z" />
                         <path d="M10,50 L12,25 L14,35 L16,55 M50,50 L52,25 L54,35 M90,50 L92,25 L94,35 M130,50 L132,25 L134,35 M170,50 L172,25 L174,35" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
                      </svg>
                    </div>
                  </div>
               </div>
            </div>

            {/* Calculations Panel */}
            <div className="grid grid-cols-12 gap-2">
               {/* Formula items */}
               <div className="col-span-7 border border-slate-800 rounded-lg bg-[#050c18] py-2 px-3 shadow-inner">
                 <span className="text-[#eab308] text-[8px] sm:text-[9px] font-bold tracking-wider uppercase mb-1.5 block border-b border-[#eab308]/20 pb-0.5">Velocity Engine</span>
                 
                 <div className="flex flex-col gap-1 text-[9px] font-mono mt-1">
                    <div className="flex justify-between text-slate-400">
                      <span>θ (Angle)</span>
                      <span>{angle}&deg;</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cos({angle}&deg;)</span>
                      <span>{Math.cos((angle * Math.PI) / 180).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Measured</span>
                      <span>{measuredPsv.toFixed(1)} cm/s</span>
                    </div>
                    <div className="flex justify-between text-[#10b981] font-bold bg-[#10b981]/10 px-1 -mx-1 rounded mt-1">
                      <span>Corrected</span>
                      <span>{correctedPsv.toFixed(1)} cm/s</span>
                    </div>
                 </div>
               </div>

               {/* Computed Output Box */}
               <div className="col-span-5 border border-[#10b981]/40 rounded-lg bg-[#051510] p-1.5 sm:p-2 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                 <div className="absolute top-0 w-full h-[1px] bg-[#10b981]/50" />
                 <span className="text-[#10b981] text-[8px] font-bold tracking-wider uppercase mb-0.5 text-center">REPORT VALUE</span>
                 <span className="text-[#10b981] text-[7px] font-mono mb-1">PSV (cm/s)</span>
                 
                 <span className="text-2xl sm:text-3xl font-black text-[#10b981] font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                   {isLocked ? truePsv : Math.round(correctedPsv)}
                 </span>
                 
                 {isLocked && (
                   <span className="text-[7px] text-white border border-[#10b981]/50 bg-[#10b981]/30 rounded px-1.5 py-0.5 mt-1 animate-pulse font-bold">
                     ✓ LOCKED
                   </span>
                 )}
               </div>
            </div>

            {/* Leaderboard */}
            <div className="border border-slate-800 rounded-lg bg-[#02070f] p-3 pt-2 shadow-inner h-24 flex flex-col">
               <div className="flex items-center gap-1.5 mb-1.5 border-b border-slate-800 pb-1.5 justify-between">
                 <span className="text-[#00d1ff] text-[8px] font-bold tracking-widest uppercase">Leaderboard</span>
                 <span className="text-[7px] text-slate-500 font-mono font-bold">STEREOTAXIC DUEL</span>
               </div>
               
               <div className="flex flex-col gap-1 text-[9px] font-mono flex-1 overflow-y-auto">
                 <div className="flex justify-between border-l-2 border-cyan-400 bg-cyan-400/5 pl-2 py-0.5 rounded-r">
                   <span className="text-cyan-400 font-bold">1 <span className="ml-[3px] text-slate-300">YOU (SONOGRAPHER)</span></span>
                   <span className="text-white font-bold">{points}</span>
                 </div>
                 <div className="flex justify-between border-l-2 border-amber-500 bg-amber-500/5 pl-2 py-0.5 rounded-r">
                   <span className="text-amber-500 font-bold">2 <span className="ml-[3px] text-slate-300">AI PILOT</span></span>
                   <span className="text-white">{150 * round - 35}</span>
                 </div>
                 <div className="flex justify-between border-l-2 border-transparent pl-2 py-0.5 text-slate-500">
                   <span>3  TEAM CLINICAL</span>
                   <span>380</span>
                 </div>
               </div>
            </div>

          </div>

        </div>

        {/* Collapsable Educational Core Theory Box */}
        <div className="border border-slate-800 bg-slate-900/20 rounded-lg p-3 mt-1 flex flex-col gap-2">
          <button 
            onClick={() => setShowTheory(!showTheory)}
            className="flex items-center justify-between text-xs font-bold text-[#00d1ff] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-400 animate-pulse" />
              <span className="tracking-widest uppercase">Doppler Angle Physics Cheat Sheet ({showTheory ? "Hide" : "Show"})</span>
            </div>
            <span className="text-slate-500 text-[10px]">{showTheory ? "[-]" : "[+]"}</span>
          </button>
          
          <AnimatePresence>
            {showTheory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-[11px] text-slate-300 flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800 font-sans leading-relaxed"
              >
                <div className="p-2 bg-black/40 rounded border border-slate-800 font-mono text-[10px] text-yellow-400">
                  <p className="font-bold text-center">THE DOPPLER SHIFT EQUATION</p>
                  <p className="text-center mt-1 text-xs">Δf = (2 • f0 • v • cosθ) / c</p>
                  <p className="text-slate-400 text-[9px] mt-2 text-center">
                    Where Δf = frequency shift, f0 = operating frequency, v = blood velocity, 
                    θ = Doppler angle, c = speed of sound in tissue (1540 m/s).
                  </p>
                </div>
                <p>
                  • <strong className="text-white">Why &le; 60&deg;?</strong> Above 60&deg;, the cosine curve steepens dramatically. Small alignment errors cause astronomical miscalculations of true speed because we divide by <span className="font-mono text-cyan-400">cosθ</span> to correct the velocity. 5&deg; of error at 80&deg; translates to absolute diagnostics chaos!
                </p>
                <p>
                  • <strong className="text-white">Why not 0&deg;?</strong> Physics-wise 0&deg; is perfect (cos 0 = 1). But blood vessels run parallel to skin, and ultrasound beams travel straight down. You cannot physically beam straight up inside the body lines. Thus we aim for the sweet clinical compromise: <strong className="text-cyan-400 font-mono">45&deg;–60&deg;</strong>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsable Prompt Hint message */}
        <AnimatePresence>
          {showHintMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-2.5 text-xs text-amber-200"
            >
              <span className="font-bold block text-yellow-400 uppercase tracking-widest text-[10px] mb-1">PROBE PILOT HINT</span>
              Adjust the angle selector so your alignment beam matches the target vessel flow lines closely. Target the gold range: <span className="text-white font-bold">{currentCase.idealAngle}</span>. Press Submit once aligned to capture peak systole with maximum fidelity!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-8 mt-2 pt-4 border-t border-white/5 opacity-90 pb-8 px-2">
           
           <button 
             onClick={() => setShowHintMsg(!showHintMsg)}
             className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white group p-1 z-20"
           >
             <Triangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10b981] group-hover:drop-shadow-[0_0_5px_#10b981]" />
             <span className="tracking-widest uppercase">Hint</span>
           </button>

           {/* Audio Toggle button */}
           <button 
             onClick={handleSoundToggle}
             className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all p-1.5 rounded-md z-20 ${isSoundOn ? 'text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)] animate-pulse' : 'text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900/40'}`}
           >
             {isSoundOn ? <Volume2 size={14} className="text-[#10b981]" /> : <VolumeX size={14} className="text-slate-400" />}
             <span className="tracking-widest uppercase">{isSoundOn ? "Mute Doppler" : "Listen Doppler"}</span>
           </button>

           <button onClick={() => setIsFrozen(!isFrozen)} className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-all group p-1 z-20 ${isFrozen ? 'text-[#f43f5e] drop-shadow-[0_0_5px_#f43f5e]' : 'text-slate-300 hover:text-white'}`}>
             <SquareIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
             <span className="tracking-widest uppercase">{isFrozen ? 'Unfreeze' : 'Freeze Grid'}</span>
           </button>
           
           <button className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white group p-1 z-20" disabled={isLocked}>
             <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00d1ff] group-hover:drop-shadow-[0_0_35px_#00d1ff]" />
             <span className="tracking-widest uppercase">Calibrate</span>
           </button>

           <button 
             onClick={handleSubmit} 
             disabled={isLocked}
             className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-semibold text-[#eab308] hover:text-yellow-300 group ml-2 sm:ml-4 md:ml-8 border border-[#eab308]/60 bg-[#eab308]/15 px-4 py-2 rounded-full hover:bg-[#eab308]/25 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] w-full sm:w-auto mt-2 sm:mt-0 z-20"
           >
             <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#eab308] group-hover:drop-shadow-[0_0_5px_#eab308]" />
             <span className="tracking-widest uppercase font-black">Submit Velocity</span>
           </button>
           
           <button onClick={() => setViewMode('dashboard')} className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-white group w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 p-1 z-20">
             <span className="tracking-widest uppercase">Exit Deck</span>
           </button>
        </div>

      </div>
    </div>
  );
}
