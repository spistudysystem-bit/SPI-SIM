import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Tv, 
  Activity, 
  Sparkles, 
  Database, 
  Compass, 
  Eye, 
  Zap, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  Download, 
  Lock, 
  Layers,
  Heart,
  Wind
} from 'lucide-react';

interface ComparativeItem {
  attribute: string;
  artery: {
    title: string;
    description: string;
    physicsCode: string;
  };
  vein: {
    title: string;
    description: string;
    physicsCode: string;
  };
  boardFocus: string;
}

const COMPARISON_MATRIX: ComparativeItem[] = [
  {
    attribute: "Lumen Wall Anatomy",
    artery: {
      title: "Thick & Elastic",
      description: "Heavily reinforced Tunica Media layer with dense smooth muscle fibers to absorb cyclic high-pressure thrusts.",
      physicsCode: "HIGH_ELASTIC_MODULUS"
    },
    vein: {
      title: "Thin & Collapsible",
      description: "Negligible smooth muscle layer. Highly compliant and equipped with delicate bicuspid valves to prevent gravity backflow.",
      physicsCode: "HIGH_COMPLIANCE_LOW_RES"
    },
    boardFocus: "Arterial walls do NOT collapse easily. Venous walls collapse, meeting coaptation completely under minimal direct probe pressure."
  },
  {
    attribute: "Internal Fluid Pressure",
    artery: {
      title: "High Dynamic Pressure",
      description: "Maintains a high gradient pressure reservoir (80 - 120 mmHg) driven directly by left ventricular stroke volume.",
      physicsCode: "P_GRAD ~ 100 mmHg"
    },
    vein: {
      title: "Extremely Low Pressure",
      description: "Low-tension reservoir (5 - 12 mmHg). Dependent on peripheral muscular pumps and thoracic breathing suctions.",
      physicsCode: "P_GRAD ~ 5-10 mmHg"
    },
    boardFocus: "Hydrostatic pressures heavily influence venous column weight but have a negligible impact on active arterial driving vectors."
  },
  {
    attribute: "Doppler Flow Profile",
    artery: {
      title: "Pulsatile Velocity Pattern",
      description: "Rapid high-velocity systolic acceleration, sharp dicrotic notches, and continuous forward low/high resistance run-offs.",
      physicsCode: "PULSATILE_HEMODY"
    },
    vein: {
      title: "Phasic Velocity Pattern",
      description: "Continuous low-velocity waveforms that change organically with patient's breathing cycles (respiratory phasicity).",
      physicsCode: "RESPIRATORY_PHASIC"
    },
    boardFocus: "Loss of respiratory phasicity (waveform goes flat) indicates proximal vascular obstruction, such as a major tumor or thrombus block."
  },
  {
    attribute: "Transducer Compression",
    artery: {
      title: "Rigid & Non-Compressible",
      description: "Requires extreme localized pressure to physically flatten. Resists standard clinical diagnostic squeezing.",
      physicsCode: "RESIST_COMPRESS"
    },
    vein: {
      title: "Fully Compressible (Co-apt)",
      description: "Gently flattens out entirely under tiny probe pressures. Anterior and posterior walls touch perfectly.",
      physicsCode: "EASY_COLLAPSE_COAPT"
    },
    boardFocus: "The inablity to compress a vein under direct pressure is the absolute gold-standard, primary diagnostic criteria for DVT."
  },
  {
    attribute: "Color Doppler Filling",
    artery: {
      title: "Bright High-Velocity Jets",
      description: "Fills the vessel completely with high-frequency frequency shifts. Fast jet streams and clean boundaries.",
      physicsCode: "FAST_COLOR_SPEED"
    },
    vein: {
      title: "Low-Velocity Smooth Fill",
      description: "Fills evenly with lower baseline velocity settings. Sensitive to scale values due to slow flow rates.",
      physicsCode: "SLOW_COLOR_SENSITIVE"
    },
    boardFocus: "Requires custom low Pulse Repetition Frequency (PRF) scales and high wall filters to prevent arterial noise from spilling."
  }
];

export default function VeinArteryVisualizer() {
  // Compression state
  const [compression, setCompression] = useState<number>(0); // 0 to 100%
  const [hasDvt, setHasDvt] = useState<boolean>(false);
  const [activeTab, setActiveTab]= useState<'imaging' | 'doppler' | 'matrix'>('imaging');
  
  // Interactive physiologic triggers for vein Doppler
  const [valsalvaActive, setValsalvaActive] = useState<boolean>(false);
  const [augmentationActive, setAugmentationActive] = useState<boolean>(false);
  const [narratorPlaying, setNarratorPlaying] = useState<boolean>(false);

  // Doppler sound simulation helper
  const [audioOsc, setAudioOsc] = useState<boolean>(false);

  // Time generator for live SVG waves
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setTime(prev => (prev + 0.05) % (Math.PI * 20));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Compute live waveform path coordinates
  // Artery parameters: heart rate cycle (Pulsatile)
  const arterialPath = useMemo(() => {
    let points = [];
    const width = 450;
    const height = 120;
    const baseline = 95;
    
    for (let x = 0; x <= width; x += 3) {
      // Periodic cardiac pulse with rapid rise & dicrotic notch
      const phase = (x / 75 - time * 1.5) % (Math.PI * 2);
      let yOffset = 0;
      
      const normalizedPhase = phase < 0 ? phase + Math.PI * 2 : phase;
      
      if (normalizedPhase < 1.0) {
        // Systolic upstroke & rapid descent (100% force)
        yOffset = Math.sin(normalizedPhase * Math.PI) * 75;
      } else if (normalizedPhase >= 1.0 && normalizedPhase < 1.6) {
        // Dicrotic rebound notch peak
        const notchPhase = (normalizedPhase - 1.0) / 0.6;
        yOffset = 25 + Math.sin(notchPhase * Math.PI) * 15;
      } else {
        // Slow diastolic decay
        const diastolicPhase = (normalizedPhase - 1.6) / (Math.PI * 2 - 1.6);
        yOffset = 25 * Math.pow(1 - diastolicPhase, 1.8);
      }
      
      points.push(`${x},${baseline - yOffset}`);
    }
    return `M ${points.join(' L ')}`;
  }, [time]);

  // Vein parameters: slower respiratory rhythm (Phasic)
  const venousPath = useMemo(() => {
    let points = [];
    const width = 450;
    const height = 120;
    const baseline = 80;
    
    for (let x = 0; x <= width; x += 3) {
      // Slower, breathing-dependent sinusoidal modulation
      const respiratoryPhase = (x / 140 - time * 0.4);
      let heightMultiplier = 1.0;
      let staticY = 22; // normal amplitude

      if (valsalvaActive) {
        // Hold breath: Venous return drops to zero!
        staticY = 2;
      } else if (augmentationActive) {
        // Sudden high velocity surge spike
        // Let's model a localized surge that moves or decays
        const surgeLocComp = (x / 450); // relative
        if (surgeLocComp > 0.3 && surgeLocComp < 0.7) {
          staticY = 60 * Math.sin((surgeLocComp - 0.3) / 0.4 * Math.PI);
        } else {
          staticY = 15;
        }
      }
      
      const yOffset = (Math.sin(respiratoryPhase) * 6 + staticY);
      points.push(`${x},${baseline - yOffset}`);
    }
    return `M ${points.join(' L ')}`;
  }, [time, valsalvaActive, augmentationActive]);

  // Auto recovery timers for interactive actions
  useEffect(() => {
    if (augmentationActive) {
      const t = setTimeout(() => setAugmentationActive(false), 2200);
      return () => clearTimeout(t);
    }
  }, [augmentationActive]);

  // Audio simulation beep / hiss
  const handleAudioToggle = () => {
    setAudioOsc(prev => !prev);
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (narratorPlaying) {
        window.speechSynthesis.cancel();
        setNarratorPlaying(false);
      } else {
        const text = `Physicians and sonographers inspect two primary differences: vessel compressibility and flow dynamics. Normal healthy veins have thin, highly flexible walls that slide and touch together completely under gentle pressure from the transducer lens, while thick-walled arteries resist change. In cases of acute deep vein thrombosis, or DVT, the vein lumen fills with a rigid blood clot, preventing wall coaptation. Demographically, arterial flow is highly pulsatile, reflecting ventricular contractions, whereas venous flow is slow and varies gently with respirations, which we call respiratory phasicity.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.onend = () => setNarratorPlaying(false);
        utterance.onerror = () => setNarratorPlaying(false);
        setNarratorPlaying(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Text-to-speech option is not fully supported on this device's browser frame.");
    }
  };

  // Safe release of voices on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="bg-[#12141a] border border-[#2d3139] rounded-2xl overflow-hidden flex flex-col p-4 sm:p-6 gap-6 relative shadow-2xl">
      {/* Glow highlight */}
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#00d1ff]/50 to-transparent pointer-events-none" />

      {/* Title & Quick Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2d3139]/50 pb-4 gap-3">
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20 uppercase">Core Clinical Standard</span>
            <span className="text-[9px] font-mono text-amber-400 font-extrabold tracking-widest flex items-center gap-1 leading-none uppercase">
              <Sparkles size={10} /> SPI BOARD TOPIC
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-sans text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Artery vs Vein Physics</span>
            <span className="text-xs text-slate-500 font-serif italic font-normal">Comparative Simulator</span>
          </h2>
          <p className="text-[10px] text-[#8e9299] leading-snug font-mono mt-0.5">Understand physical structure, pressure variations, and Doppler signatures.</p>
        </div>

        {/* Listen Narrator */}
        <button
          onClick={handleSpeech}
          className={`flex items-center gap-1 px-3 py-1.5 border text-[9px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all select-none cursor-pointer shrink-0 ${narratorPlaying ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 animate-pulse' : 'bg-white/5 border-white/10 text-[#8e9299] hover:text-white'}`}
        >
          <Volume2 size={11} className={narratorPlaying ? "animate-bounce" : ""} />
          <span>{narratorPlaying ? "Stop Narration" : "Listen Lecture"}</span>
        </button>
      </div>

      {/* Internal Sub Navigation Tabs */}
      <div className="flex border-b border-[#2d3139]/40 p-1 bg-black/40 rounded-xl max-w-full overflow-x-auto no-scrollbar self-start">
        <button
          onClick={() => setActiveTab('imaging')}
          className={`px-3 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider font-mono font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'imaging' ? 'bg-[#00d1ff] text-black font-black font-sans' : 'text-[#8e9299] hover:text-white'}`}
        >
          1. Wall Compressibility Sim
        </button>
        <button
          onClick={() => setActiveTab('doppler')}
          className={`px-3 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider font-mono font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'doppler' ? 'bg-[#00d1ff] text-black font-black font-sans' : 'text-[#8e9299] hover:text-white'}`}
        >
          2. Pulsatile vs Phasic Doppler
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider font-mono font-bold transition-all shrink-0 cursor-pointer ${activeTab === 'matrix' ? 'bg-[#00d1ff] text-black font-black font-sans' : 'text-[#8e9299] hover:text-white'}`}
        >
          3. Study Comparison Matrix
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: WALL COMPRESSIBILITY SIMULATOR */}
        {activeTab === 'imaging' && (
          <motion.div
            key="imaging-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* Visualizer Frame */}
            <div className="lg:col-span-8 bg-[#0a0a0f] border border-[#2d3139] rounded-2xl p-4 sm:p-6 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black font-mono tracking-widest text-[#00d1ff] uppercase">B-Mode Transverse Scan view</h3>
                  <p className="text-[10px] text-[#8e9299] font-mono leading-none mt-0.5">Drag compression slider below to simulate probe pressure</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-[#ffd700] px-2 py-0.5 bg-[#ffd700]/15 rounded border border-[#ffd700]/20 font-bold uppercase select-none">
                    Real-Time Coaptation
                  </span>
                </div>
              </div>

              {/* Core Physical Cross Section Displays */}
              <div className="flex flex-row justify-around items-center py-6 gap-4 flex-1">
                {/* 1. ARTERY CROSS SECTION */}
                <div className="flex flex-col items-center flex-1 max-w-[180px]">
                  <span className="text-[9.5px] font-mono font-extrabold tracking-wider text-rose-400 uppercase mb-3 text-center border-b border-rose-500/20 pb-0.5 w-full">
                    Artery (High Pressure)
                  </span>

                  <div className="relative w-28 h-28 bg-[#151515] border border-white/5 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Pulsatile outer ring wall representing thick muscular tunica media */}
                    <div 
                      className="border-red-500 rounded-full flex items-center justify-center transition-all bg-[#ff003c]/5"
                      style={{
                        width: `${Math.max(76, 92 - (compression * 0.12))}px`,
                        height: `${Math.max(76, 92 - (compression * 0.08))}px`,
                        borderWidth: '8px',
                        transform: `scale(${1.0 + Math.sin(time * 3.5) * 0.03})` // cardiac blood pulse contraction!
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-[#ff003c]/20 flex items-center justify-center select-none">
                        <span className="text-[7.5px] font-mono font-bold text-red-300">PULSE</span>
                      </div>
                    </div>
                    {/* Elastic structural fiber tags */}
                    <div className="absolute inset-2 border border-dashed border-red-500/10 rounded-full pointer-events-none" />
                  </div>

                  <div className="space-y-1 mt-3 w-full text-center">
                    <p className="text-[9.5px] font-mono text-white font-extrabold leading-none">NON-COMPRESSIBLE</p>
                    <p className="text-[8px] text-slate-500 leading-tight">Muscular walls are highly elastic &amp; preserve inner vessel geometry.</p>
                  </div>
                </div>

                {/* 2. VEIN CROSS SECTION */}
                <div className="flex flex-col items-center flex-1 max-w-[180px]">
                  <span className="text-[9.5px] font-mono font-extrabold tracking-wider text-blue-400 uppercase mb-3 text-center border-b border-blue-500/20 pb-0.5 w-full">
                    Vein (Low Pressure)
                  </span>

                  <div className="relative w-28 h-28 bg-[#151515] border border-white/5 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                    {/* Collapsible vein wall under transducer pressure */}
                    {/* If DVT is active, vein refuses to collapse and shows internal clot */}
                    <div 
                      className={`rounded-full flex items-center justify-center transition-all ${hasDvt ? 'border-amber-600 bg-amber-950/20' : 'border-cyan-500 bg-[#00d1ff]/5'}`}
                      style={{
                        width: `${hasDvt ? 84 : Math.max(8, 88 - (compression * 0.85))}px`,
                        height: `${hasDvt ? Math.max(68, 84 - (compression * 0.18)) : Math.max(4, 88 - (compression * 0.85))}px`,
                        borderWidth: '2.5px',
                        borderRadius: hasDvt ? '45% 45% 45% 45%' : `${50 - (compression * 0.2)}%`
                      }}
                    >
                      {/* Inner lumen */}
                      {hasDvt ? (
                        <div className="w-full h-full bg-amber-800/25 flex flex-col items-center justify-center p-1 select-none text-center">
                          <ShieldAlert size={14} className="text-amber-400 animate-pulse mb-0.5" />
                          <span className="text-[7px] text-amber-300 font-mono font-bold leading-none uppercase">THROMBI CLOT</span>
                          <span className="text-[6px] text-slate-400 font-mono">RIGID BLOCK</span>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center select-none">
                          <span className="text-[7px] font-mono font-medium text-cyan-300">
                            {compression > 85 ? 'COLLAPSED' : 'SLOW FLOW'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Valve indicator inside high quality vein */}
                    {!hasDvt && compression < 30 && (
                      <div className="absolute inset-x-8 top-12 h-[1px] bg-sky-500/30 flex justify-between px-1 pointer-events-none">
                        <span className="w-1.5 h-1 bg-sky-500/40 rounded-full origin-left rotate-[25deg]" />
                        <span className="w-1.5 h-1 bg-sky-500/40 rounded-full origin-right -rotate-[25deg]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 mt-3 w-full text-center">
                    <p className={`text-[9.5px] font-mono font-extrabold leading-none ${hasDvt ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {hasDvt ? 'NON-COMPRESSIBLE (DVT)' : 'HIGH COLLAPSIBILITY'}
                    </p>
                    <p className="text-[8px] text-slate-500 leading-tight">
                      {hasDvt ? 'Thrombus blocks structural coaptation. High risk warning.' : 'Thin walls flat easily with coaptation at minimal transducer compression.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status footer information board */}
              <div className="bg-[#121217] p-2.5 rounded-xl border border-[#2d3139]/40 text-left font-mono text-[8px] sm:text-[9px] text-[#8e9299] flex items-start gap-2 select-none">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-extrabold uppercase font-sans">BOARD MEMORY TRICK: </span>
                  An acute DVT blood clot is low-echogenicity (dark) or hypoechoic, so you cannot rely purely on visual grayscale diagnostics. <span className="text-amber-400 font-bold">Transverse compressibility represents the absolute gold standard rule for confirming DVT disease.</span>
                </div>
              </div>
            </div>

            {/* Interactive Control side panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* DVT Toggle Box */}
              <div className="p-4 bg-[#181a20] rounded-2xl border border-[#2d3139]/60 flex flex-col gap-3">
                <div className="text-left">
                  <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-[#ffd700]">Pathology Engine</h4>
                  <p className="text-[8.5px] text-[#8e9299] font-mono leading-tight mt-0.5">Toggle diseases to test physical responses</p>
                </div>

                <button
                  type="button"
                  onClick={() => setHasDvt(prev => !prev)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    hasDvt 
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                      : 'bg-black/35 border-[#2d3139] hover:border-[#8e9299]/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 ${hasDvt ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                      <ShieldAlert size={14} className={hasDvt ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <h5 className="text-[10.5px] font-extrabold uppercase leading-none">Acute Vein DVT Clot</h5>
                      <p className="text-[8px] text-[#8e9299] font-mono tracking-tight mt-0.5 leading-none">Simulate a Deep Vein Thrombosis</p>
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${hasDvt ? 'border-amber-500 bg-amber-500 text-black' : 'border-[#2d3139]'}`}>
                    {hasDvt && <span className="text-[8px] font-extrabold">✓</span>}
                  </div>
                </button>
              </div>

              {/* Compression Slider Block */}
              <div className="p-4 bg-[#181a20] rounded-2xl border border-[#2d3139]/60 flex flex-col gap-3.5">
                <div className="text-left">
                  <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-[#00d1ff]">Transducer Compression</h4>
                  <p className="text-[8.5px] text-[#8e9299] font-mono leading-tight mt-0.5">Physical load applied by the probe face</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-400 font-bold uppercase">Probe Pressure</span>
                    <span className="text-[#00d1ff] font-extrabold text-[10.5px]">{compression}%</span>
                  </div>

                  <input 
                    type="range"
                    min={0}
                    max={100}
                    value={compression}
                    onChange={(e) => setCompression(parseInt(e.target.value))}
                    className="w-full appearance-none h-1.5 rounded-full bg-black/50 border border-[#2d3139] cursor-pointer accent-[#00d1ff] mb-2"
                  />

                  <div className="grid grid-cols-2 gap-1 text-[7.5px] font-mono text-slate-500">
                    <button onClick={() => setCompression(0)} className="p-1 px-1.5 bg-black/40 border border-[#2d3139]/40 rounded hover:text-white leading-none">0% (Rest)</button>
                    <button onClick={() => setCompression(100)} className="p-1 px-1.5 bg-black/40 border border-[#2d3139]/40 rounded hover:text-white leading-none">100% (Full)</button>
                  </div>
                </div>

                <div className="border-t border-[#2d3139]/40 pt-3 text-left">
                  <span className="text-[8.5px] text-[#8e9299] uppercase font-bold font-mono block mb-1">Compression Status:</span>
                  <div className="p-2.5 bg-black/45 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[8.5px] font-mono leading-none">
                      <span className="text-slate-400">Artery Compress:</span>
                      <span className="text-rose-400 font-bold">{(compression * 0.08).toFixed(1)}% (Rigid)</span>
                    </div>
                    <div className="flex justify-between items-center text-[8.5px] font-mono leading-none pt-0.5">
                      <span className="text-slate-400">Vein Compress:</span>
                      <span className={hasDvt ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                        {hasDvt ? `${(compression * 0.15).toFixed(1)}% (Blocked)` : `${compression.toFixed(0)}% (Coapts)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PULSATILE VS PHASIC DOOPLER */}
        {activeTab === 'doppler' && (
          <motion.div
            key="doppler-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* Spectral Wave plots */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Plot A: Artery Wave */}
              <div className="bg-[#0a0a0f] border border-[#2d3139] rounded-2xl p-4 flex flex-col h-[165px] relative overflow-hidden justify-between">
                <div className="absolute top-2 left-4 text-left z-10 leading-none">
                  <span className="text-[8px] font-mono uppercase font-bold text-red-400 bg-red-400/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                    Arterial Doppler Waveform
                  </span>
                  <h4 className="text-[10px] text-white font-extrabold font-mono tracking-tight mt-1.5">HIGH RESISTANCE CAROTID PROFILE (PULSATILE)</h4>
                </div>
                <div className="absolute top-2 right-4 text-right z-10 font-mono text-[8px] text-slate-500">
                  <span>SWEEP RATE: 50 mm/s</span>
                </div>

                <div className="flex-1 flex items-end relative overflow-hidden mt-6 mb-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-around opacity-15 pointer-events-none">
                    <div className="h-[1px] bg-[#2d3139]" />
                    <div className="h-[1px] bg-[#2d3139]" />
                    <div className="h-[1px] bg-[#2d3139]" />
                  </div>

                  <svg className="w-full h-full overflow-visible">
                    {/* Fill Area */}
                    <path 
                      d={`${arterialPath} L 450,120 L 0,120 Z`} 
                      fill="url(#arteryGlow)" 
                      opacity="0.3"
                    />
                    {/* Wave Line */}
                    <path 
                      d={arterialPath} 
                      fill="none" 
                      stroke="url(#arteryStroke)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="arteryStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                      <linearGradient id="arteryGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#000000" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-[#8e9299] font-mono border-t border-white/5 pt-1 mt-0.5 leading-none">
                  <span className="text-rose-400 font-extrabold">Systole Peak (Fast Velocity Upstroke)</span>
                  <span className="text-amber-400">Dicrotic Notch (Aortic Valve Closure Rebound)</span>
                  <span className="text-slate-400">Diastolic runoff decline</span>
                </div>
              </div>

              {/* Plot B: Vein Wave */}
              <div className="bg-[#0a0a0f] border border-[#2d3139] rounded-2xl p-4 flex flex-col h-[165px] relative overflow-hidden justify-between">
                <div className="absolute top-2 left-4 text-left z-10 leading-none">
                  <span className="text-[8px] font-mono uppercase font-bold text-sky-400 bg-sky-400/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                    Venous Doppler Waveform
                  </span>
                  <h4 className="text-[10px] text-white font-extrabold font-mono tracking-tight mt-1.5">RESPIRATORY PHASIC VELOCITY (LOW SPEED)</h4>
                </div>
                <div className="absolute top-2 right-4 text-right z-10 font-mono text-[8px] text-slate-500">
                  <span>SWEEP RATE: 50 mm/s</span>
                </div>

                <div className="flex-1 flex items-end relative overflow-hidden mt-6 mb-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-around opacity-15 pointer-events-none">
                    <div className="h-[1px] bg-[#2d3139]" />
                    <div className="h-[1px] bg-[#2d3139]" />
                    <div className="h-[1px] bg-[#2d3139]" />
                  </div>

                  <svg className="w-full h-full overflow-visible">
                    {/* Fill Area */}
                    <path 
                      d={`${venousPath} L 450,120 L 0,120 Z`} 
                      fill="url(#veinGlow)" 
                      opacity="0.25"
                    />
                    {/* Wave Line */}
                    <path 
                      d={venousPath} 
                      fill="none" 
                      stroke="url(#veinStroke)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />

                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="veinStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="veinGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d1ff" />
                        <stop offset="100%" stopColor="#000000" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-[#8e9299] font-mono border-t border-white/5 pt-1 mt-0.5 leading-none">
                  <span className="text-[#00d1ff] font-extrabold">Inhalation dip (Negative intra-pressure boosts speed)</span>
                  <span className="text-slate-400">Exhalation flow decline pattern</span>
                </div>
              </div>
            </div>

            {/* Interactive Physiology Controller Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Interaction Board */}
              <div className="p-4 bg-[#181a20] rounded-2xl border border-[#2d3139]/60 flex flex-col gap-3">
                <div className="text-left">
                  <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-[#00d1ff]">Venous Stress Test Bed</h4>
                  <p className="text-[8.5px] text-[#8e9299] font-mono leading-tight mt-0.5">Diagnose flow adjustments dynamically</p>
                </div>

                {/* Valsalva Trigger */}
                <button
                  onClick={() => {
                    setValsalvaActive(!valsalvaActive);
                    setAugmentationActive(false);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${valsalvaActive ? 'bg-rose-500/10 border-rose-500 text-rose-300' : 'bg-black/30 border-white/5 text-[#8e9299] hover:text-white hover:border-[#2d3139]'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-white/5 ${valsalvaActive ? 'text-rose-400' : 'text-[#8e9299]'}`}>
                      <Wind size={12} />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase leading-none">Valsalva Maneuver</h5>
                      <span className="text-[7.5px] font-mono text-[#8e9299]">Raise intrathoracic chest pressure</span>
                    </div>
                  </div>
                  <span className="text-[7px] font-mono uppercase font-bold border border-current px-1 rounded leading-none">
                    {valsalvaActive ? 'HALT FLOW' : 'TEST'}
                  </span>
                </button>

                {/* Distal Compression Trigger */}
                <button
                  onClick={() => {
                    setAugmentationActive(true);
                    setValsalvaActive(false);
                  }}
                  disabled={valsalvaActive}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${augmentationActive ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-black/30 border-white/5 text-[#8e9299] hover:text-white hover:border-[#2d3139] disabled:opacity-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-white/5 ${augmentationActive ? 'text-emerald-400' : 'text-[#8e9299]'}`}>
                      <Activity size={12} />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase leading-none">Distal Augmentation</h5>
                      <span className="text-[7.5px] font-mono text-[#8e9299]">Calf squeeze triggers backup velocity surge</span>
                    </div>
                  </div>
                  <span className="text-[7px] font-mono uppercase font-bold border border-current px-1 rounded leading-none">
                    {augmentationActive ? 'SURGING' : 'SQUEEZE'}
                  </span>
                </button>
              </div>

              {/* Informative summary box */}
              <div className="p-4 bg-[#181a20] rounded-2xl border border-[#2d3139]/60 flex-1 flex flex-col justify-between text-left">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-[#ffd700]">Core Physics Recap</h4>
                  <div className="space-y-2.5 text-[9.5px] text-white/80 leading-normal">
                    <p>
                      <strong>Arteries</strong> receive direct stroke waves from the heart. Peak systolic flow velocity usually measures above <strong>50 - 150 cm/s</strong>.
                    </p>
                    <p>
                      <strong>Veins</strong> are compliant loops where speed stays low (<strong>10 - 25 cm/s</strong>) and pulsatility is flattened, shifting and waving closely with respiration cycles instead.
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-2 rounded-xl mt-4">
                  <span className="text-[7.5px] font-mono uppercase font-bold text-amber-400 block mb-1">ARDMS BOARD ALERT:</span>
                  <div className="text-[7.5px] text-[#8e9299] font-mono leading-tight">
                    Severe tricuspid valve regurgitant flow can introduce continuous arterial-like pulsatility abnormalities into hepatic or systemic vena cava veins! Keep this on your checklist.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: STUDY COMPARISON HELPER MATRIX */}
        {activeTab === 'matrix' && (
          <motion.div
            key="matrix-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            {/* Desktop and Mobile responsive comparative matrix cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {COMPARISON_MATRIX.map((row, index) => (
                <div 
                  key={index}
                  className="bg-[#181a20] border border-[#2d3139]/65 rounded-xl p-4 flex flex-col gap-3 text-left relative"
                >
                  {/* Item index */}
                  <div className="absolute right-3.5 top-3.5 text-[8.5px] font-mono text-slate-600 font-extrabold group-hover:text-white/40 select-none">
                    [0{index + 1}]
                  </div>

                  <h3 className="text-xs font-black font-mono tracking-widest text-emerald-400 uppercase border-b border-white/5 pb-1 max-w-[80%]">
                    {row.attribute}
                  </h3>

                  {/* Artery Column details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[8.5px] uppercase font-bold text-rose-400 font-mono flex items-center gap-1">
                        <Heart size={9} /> ARTERIAL SYSTEM
                      </span>
                      <h4 className="text-[11.5px] font-bold text-white font-sans">{row.artery.title}</h4>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">{row.artery.description}</p>
                    </div>

                    {/* Vein Column details */}
                    <div className="space-y-1 sm:border-l sm:border-[#2d3139]/40 sm:pl-3">
                      <span className="text-[8.5px] uppercase font-bold text-sky-400 font-mono flex items-center gap-1">
                        <Wind size={9} /> VENOUS SYSTEM
                      </span>
                      <h4 className="text-[11.5px] font-bold text-white font-sans">{row.vein.title}</h4>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">{row.vein.description}</p>
                    </div>
                  </div>

                  {/* SPI Diagnostic Board Focus Box */}
                  <div className="bg-[#090b0e] px-3 py-2 rounded-lg border border-[#ffd700]/10 text-[9px] font-mono leading-normal mt-1 text-amber-300">
                    <strong className="text-white">Exam Key Focus: </strong>
                    {row.boardFocus}
                  </div>
                </div>
              ))}
            </div>

            {/* General bottom summary bar */}
            <div className="mt-2 bg-[#1b1c24]/80 p-3 rounded-xl border border-[#2d3139]/60 flex flex-col sm:flex-row items-center justify-between text-left gap-3 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h4 className="text-[10.5px] font-black uppercase font-mono tracking-widest text-[#ffd700] leading-tight">Board Exam Question Focus</h4>
                  <p className="text-[8.5px] text-[#8e9299] font-mono tracking-normal mt-0.5 leading-tight">How does Doppler scale (PRF) adjust between arteries and veins?</p>
                </div>
              </div>

              <div className="text-[8.5px] font-mono text-slate-300 max-w-sm sm:text-right">
                Because venous blood is slow-moving, you must **decrease the PRF Doppler speed scale** and **lower the wall filter** in order to capture the low frequency shift signals without clipping!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
