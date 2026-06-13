import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import RotaryKnob from './RotaryKnob';
import { 
  Activity, 
  BookOpen, 
  Sliders, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Heart,
  User,
  GitBranch,
  Search,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

// Define structures for cases and sections
interface CaseStudy {
  title: string;
  category: string;
  presentation: string;
  metrics: string;
  waveformSim: string;
  interpretation: string;
}

const CLINICAL_CASES: CaseStudy[] = [
  {
    title: "Cardiovascular Outflow Jet Obstruction",
    category: "Cardiovascular Applications",
    presentation: "An 82-year-old male presents with exertional angina and dyspnea. A systolic ejection murmur is auscultated at the second right intercostal space, radiating to the carotids.",
    metrics: "Peak Systolic Velocity (PSV): 4.2 m/s | Mean Pressure Gradient: 45 mmHg | Calculated Valve Area: 0.75 cm²",
    waveformSim: "Severe high-velocity systolic jet exceeding Nyquist limit at standard scale. Displays massive spectral broadening and high-volume aliasing wrap-around during systole.",
    interpretation: "Severe Aortic Stenosis (Calcific). Pulsed-wave Doppler in the Left Ventricular Outflow Tract (LVOT) combined with Continuous-Wave Doppler across the valve confirms severe transvalvular gradient."
  },
  {
    title: "Carotid Artery Stenosis and Hemodynamics",
    category: "Cerebrovascular Applications",
    presentation: "A 68-year-old female presents to the vascular lab following a transient ischemic attack (TIA) manifesting as transient left arm weakness.",
    metrics: "Internal Carotid Artery (ICA) PSV: 245 cm/s | End Diastolic Velocity (EDV): 98 cm/s | ICA/CCA Ratio: 3.4",
    waveformSim: "Sharp upstroke with an extremely elevated peak, followed by loss of the standard spectral window (complete turbid filling below peak), indicating turbulent local vortexes.",
    interpretation: "Severe ICA Stenosis (70-99%). The high peak systolic velocity and filling of the spectral window indicate accelerated blood velocity running through a heavily restricted narrowing."
  },
  {
    title: "Peripheral Artery Occlusive Disease (PAOD)",
    category: "Peripheral Vascular Applications",
    presentation: "A 55-year-old diabetic male smoker presents with severe right calf claudication after walking less than 50 meters.",
    metrics: "Ankle-Brachial Index (ABI): 0.52 (Right leg) | Popliteal Artery PSV: 45 cm/s",
    waveformSim: "Monophasic (tardus-parvus) waveform with extremely prolonged rise time (acceleration time > 140ms), rounded peak, and complete loss of the normal early diastolic reversal phase.",
    interpretation: "Severe Femoropopliteal Occlusive Disease. The damped, monophasic waveform downstream of the stenosis indicates severe proximal resistance and compensatory distal arteriolar vasodilation."
  },
  {
    title: "Intrauterine Growth Restriction (IUGR) Monitoring",
    category: "Fetal Applications",
    presentation: "A 28-year-old pregnant female (G1P0) at 32 weeks gestation is referred for suspected fetal growth restriction based on fundal height mismatch.",
    metrics: "Umbilical Artery Resistive Index (RI): 0.95 | Systolic/Diastolic (S/D) Ratio: 11.2 | Ductus Venosus: Absent a-wave",
    waveformSim: "High systolic peaks with complete absence (or reverse) of forward flow during diastole. Shows the baseline flat during the diastolic pause.",
    interpretation: "Decompensated Fetal Placental Insufficiency. Elevated resistance in the umbilical artery signifies progressive placental obliteration. Requires urgent obstetric follow-up and close Biophysical Profile (BPP) screening."
  }
];

export default function PulsedWaveDopplerGlossary() {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Simulation Interactive Parameters
  const [prfKnob, setPrfKnob] = useState<number>(3); // kHz
  const [gainKnob, setGainKnob] = useState<number>(60); // %
  const [angleKnob, setAngleKnob] = useState<number>(45); // degrees
  const [hasBroadening, setHasBroadening] = useState<boolean>(false);

  // Doppler Shift Math Calculations
  const calculatedVCalculated = (1540 * prfKnob * 0.5) / (2 * 5 * Math.cos((angleKnob * Math.PI) / 180)); // mock velocity limit
  const isAliasing = calculatedVCalculated < 0.95; // mock velocity of 0.95 m/s

  return (
    <div className="text-white font-sans text-xs sm:text-sm flex flex-col gap-6 selection:bg-[#00d1ff]/20">
      
      {/* Title block */}
      <div className="p-5 bg-[#16181d] border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] animate-ping" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[4px] text-[#00d1ff]">Pulsed-Wave Doppler Spectrum</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif italic text-white mt-1">Exploring the Dynamics of Blood Flow</h2>
          <p className="text-[#8e9299] text-[11px] leading-relaxed mt-1">
            An advanced clinical syllabus compilation on range-specific spectral hemodynamics and velocity profiling.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0e1013] px-3.5 py-2 border border-white/5 rounded-lg shrink-0">
          <Activity size={16} className="text-rose-400 animate-pulse" />
          <div className="font-mono text-[9px]">
            <span className="text-[#8e9299] uppercase block font-bold">Registry Priority</span>
            <span className="text-[#ffd700] uppercase font-bold tracking-widest">Syllabus Complete</span>
          </div>
        </div>
      </div>

      {/* --- LIVE INTERACTIVE SIMULATOR CARD ("IMAGINING") --- */}
      <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#00d1ff]" />
            <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-white">
              EXPERIMENTAL SCANNER WORKSPACE (IMAGINING)
            </h3>
          </div>
          <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20">
            LIVE PREVIEW
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (4 Cols) */}
          <div className="lg:col-span-4 bg-[#0a0c0f] border border-white/5 rounded-xl p-4 space-y-4">
            <span className="text-[8.5px] text-[#8e9299] font-mono uppercase tracking-widest block font-bold border-b border-white/5 pb-2">
              Console Parameters
            </span>

            {/* Slider 1: PRF */}
            <div className="space-y-1.5 flex flex-col items-center">
              <RotaryKnob
                label="Scale / PRF"
                value={prfKnob}
                min={1.5}
                max={6}
                step={0.5}
                onChange={(val) => setPrfKnob(val)}
                unit="kHz"
              />
              <p className="text-[8.5px] text-[#8e9299] leading-tight flex items-center justify-between w-full mt-2">
                <span>Nyquist Limit (PRF/2):</span>
                <span className="font-mono text-white">{(prfKnob / 2).toFixed(2)} kHz</span>
              </p>
            </div>

            {/* Slider 2: Angle of Insonation */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-300">Insonation Angle (θ)</span>
                <span className="text-[#ffd700] font-bold">{angleKnob}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="85" 
                step="5"
                value={angleKnob} 
                onChange={(e) => setAngleKnob(parseInt(e.target.value))}
                className="w-full select-none h-1 bg-[#1a1e24] rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
              />
              <p className="text-[8.5px] text-[#8e9299] leading-tight flex items-center justify-between">
                <span>Cos({angleKnob}°):</span>
                <span className="font-mono text-white">{Math.cos((angleKnob * Math.PI) / 180).toFixed(3)}</span>
              </p>
            </div>

            {/* Slider 3: Doppler Gain */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-300">Spectral Gain</span>
                <span className="text-emerald-400 font-bold">{gainKnob}%</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                step="5"
                value={gainKnob} 
                onChange={(e) => setGainKnob(parseInt(e.target.value))}
                className="w-full select-none h-1 bg-[#1a1e24] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="broadening-toggle"
                  type="checkbox"
                  checked={hasBroadening}
                  onChange={(e) => setHasBroadening(e.target.checked)}
                  className="rounded bg-[#1a1e24] border-white/10 text-[#00d1ff] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="broadening-toggle" className="text-[9px] font-mono text-slate-300 cursor-pointer uppercase">
                  Simulate Stenosis (Broadening)
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                setPrfKnob(3.5);
                setAngleKnob(45);
                setGainKnob(60);
                setHasBroadening(false);
              }}
              className="w-full py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-mono uppercase tracking-widest text-white/70 hover:text-white rounded transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <RotateCcw size={10} /> Reset Parameters
            </button>
          </div>

          {/* Interactive Screen Column (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative h-48 md:h-56 bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col justify-end p-2 font-mono text-[9px]">
              
              {/* Scanline backdrop coordinates */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.03] border-white text-[7px]" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              
              {/* Scanline vector indicator */}
              <div className="absolute top-2 left-6 text-[7px] text-zinc-500 font-mono tracking-widest uppercase">
                ACTIVE GATE // TRANSDUCER EMITTOR v5.1
              </div>

              {/* Dynamic Warning Alert on Top of the Waves */}
              <AnimatePresence>
                {isAliasing && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-10 left-1/2 -translate-x-1/2 z-25 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] px-3 py-1 rounded-full text-[8.5px] tracking-wide flex items-center gap-1.5 backdrop-blur-sm"
                  >
                    <ShieldAlert size={10} className="animate-bounce" />
                    <strong>ALIASING ENCOUNTERED:</strong> PRF Scale too low for clinical velocities
                  </motion.div>
                )}
                {angleKnob > 60 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-25 bg-amber-500/10 border border-amber-500/30 text-[#ffd700] px-3 py-1 rounded-full text-[8.5px] tracking-wide flex items-center gap-1.5 backdrop-blur-sm"
                  >
                    <TrendingUp size={10} className="rotate-45" />
                    <strong>ANGLE TRAP (&gt;60°):</strong> Substantial error in calculated velocity
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Baseline Indicator */}
              <div className="absolute left-0 right-0 h-[1.5px] bg-sky-500/30 z-10" style={{ bottom: '40%' }}>
                <span className="absolute left-1 -top-2.5 text-[6.5px] text-sky-400 p-0.5 px-1 bg-black/60 rounded border border-sky-500/20 uppercase font-mono">
                  BASELINE (V = 0.0 m/s)
                </span>
              </div>

              {/* Spectral Envelope Limit line */}
              <div className="absolute left-12 -top-1 font-mono text-[7px] text-emerald-400 animate-pulse text-right right-2">
                GAIN COMPRESSION: {gainKnob > 80 ? "HIGH-FILL OVERFLOW" : gainKnob < 40 ? "SIGNAL DROPOUT" : "BALANCED RECEPTION"}
              </div>

              {/* Simulated Spectral Waves SVG */}
              <svg className="w-full h-full min-h-[140px] z-5 overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity={gainKnob / 100} />
                    <stop offset="100%" stopColor="#ffd700" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="aliasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4d4d" stopOpacity={gainKnob / 100} />
                    <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3 3" />

                {/* Animated Simulated Doppler Path */}
                {/* Baseline is at y = 120 (40% from bottom of 200h is y=120) */}
                <motion.path
                  animate={{
                    d: isAliasing
                      ? [
                          // Aliased wave wrapping around representing extreme flow wrap
                          "M 0 120 C 30 20, 60 20, 90 120 C 100 120, 110 200, 130 200 C 150 200, 170 120, 190 120 C 220 20, 250 20, 280 120 C 290 120, 300 200, 320 200 C 340 200, 360 120, 390 120 C 420 20, 450 20, 480 120",
                          "M 0 120 C 35 15, 65 15, 95 120 C 105 120, 115 200, 135 200 C 155 200, 175 120, 195 120 C 225 15, 255 15, 285 120 C 295 120, 305 200, 325 200 C 345 200, 365 120, 395 120 C 425 15, 455 15, 485 120"
                        ]
                      : [
                          // Standard beautiful clinical Doppler wave peaks
                          "M 0 120 C 30 40, 60 40, 95 120 C 115 120, 130 90, 150 120 C 170 120, 185 120, 190 120 C 220 40, 250 40, 285 120 C 305 120, 320 90, 340 120 C 360 120, 375 120, 390 120 C 420 40, 450 40, 485 120",
                          "M 0 120 C 33 45, 63 45, 98 120 C 118 120, 133 93, 153 120 C 173 120, 188 120, 193 120 C 223 45, 253 45, 288 120 C 308 120, 323 93, 343 120 C 363 120, 378 120, 393 120 C 423 45, 453 45, 488 120"
                        ]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear"
                  }}
                  fill={isAliasing ? "url(#aliasGradient)" : "url(#spectrumGradient)"}
                  stroke={isAliasing ? "#ff4d4d" : "#ffd700"}
                  strokeWidth={hasBroadening ? 10 : 3}
                  strokeLinecap="round"
                  opacity={0.8}
                />

                {/* If Spectral Broadening is ON, fill the complete envelope window with turbid dashes */}
                {hasBroadening && (
                  <motion.path
                    animate={{
                      d: isAliasing
                        ? "M 0 120 C 30 20, 60 20, 90 120 L 130 200 L 190 120 C 220 20, 250 20, 280 120 Z"
                        : "M 0 120 C 30 40, 60 40, 95 120 L 150 120 C 170 120, 185 120, 190 120 C 220 40, 250 40, 285 120 Z"
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    fill="#ffd700"
                    opacity={gainKnob / 300}
                    strokeDasharray="4 4"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                )}
              </svg>

              {/* Scale Tick Markers on the Right */}
              <div className="absolute right-1.5 top-0 bottom-0 flex flex-col justify-between text-[7px] font-mono text-zinc-500 py-2 border-l border-white/5 pl-1.5 bg-black/40">
                <span>+ {calculatedVCalculated > 4 ? "4.0" : calculatedVCalculated.toFixed(1)} m/s</span>
                <span>+ 2.0 m/s</span>
                <span>0.0 m/s</span>
                <span>- 2.0 m/s</span>
              </div>
            </div>

            {/* Readout dashboard panel banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-[#12141a] rounded-lg border border-white/5">
                <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-widest block">PRF SCALE</span>
                <span className="text-[11px] font-mono font-bold text-white">{(prfKnob).toFixed(1)} kHz</span>
              </div>
              <div className="p-2 bg-[#12141a] rounded-lg border border-white/5">
                <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-widest block">NYQUIST LIMIT</span>
                <span className={`text-[11px] font-mono font-bold ${(isAliasing) ? 'text-[#ff4d4d]' : 'text-emerald-400'}`}>
                  {(prfKnob / 2).toFixed(2)} kHz
                </span>
              </div>
              <div className="p-2 bg-[#12141a] rounded-lg border border-white/5">
                <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-widest block">ANGLE COEF (COS)</span>
                <span className={`text-[11px] font-mono font-bold ${(angleKnob > 60) ? 'text-amber-400' : 'text-[#ffd700]'}`}>
                  {Math.cos((angleKnob * Math.PI) / 180).toFixed(3)}
                </span>
              </div>
              <div className="p-2 bg-[#12141a] rounded-lg border border-white/5">
                <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-widest block">WAVEFORM STATUS</span>
                <span className="text-[11px] font-mono font-bold flex items-center justify-center gap-1">
                  {isAliasing ? (
                    <span className="text-[#ff4d4d]">ALIASED ⚠️</span>
                  ) : hasBroadening ? (
                    <span className="text-[#ffd700]">TURBULENT ⚠️</span>
                  ) : (
                    <span className="text-emerald-400">NORM LAMINAR</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ACADEMIC SYLLABUS DIRECTORY NAVIGATION --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar (col-span-4) */}
        <div className="md:col-span-4 flex flex-col gap-2.5">
          <div className="p-3 bg-[#16181d] border border-white/5 rounded-xl">
            <span className="text-[8px] font-mono font-extrabold tracking-widest text-[#00d1ff] uppercase">
              CHAPTER COMPARTMENTS
            </span>
            <div className="flex flex-col gap-1.5 mt-2.5">
              {[
                { id: 'intro', label: "1. Introduction to PW Doppler", desc: "Principles, equations, calculations, advantages" },
                { id: 'app', label: "2. Clinical Applications", desc: "Cardiac, peripheral, fetal, neurological studies" },
                { id: 'spectral', label: "3. Spectral Waveform Analysis", desc: "Resistances, broadening, normal & abnormal patterns" },
                { id: 'aliasing', label: "4. Limitations & Aliasing", desc: "Nyquist, gate placement, angle corrections" },
                { id: 'optimization', label: "5. Console Optimization", desc: "Gain scaling, PRF adjustment, gate sizes" },
                { id: 'artifacts', label: "6. Spectral Artifacts", desc: "Clutter, motion noise, wrapping" },
                { id: 'comparison', label: "7. Tech Comparison", desc: "Continuous wave vs. color mapping vs. PW" },
                { id: 'cases', label: "8. Clinical Case Studies", desc: "Real scan parameters & diagnosis results" },
                { id: 'future', label: "9. Emerging Frontiers", desc: "Vector flow mapping & AI automated gates" },
                { id: 'conclusion', label: "10. Summary & Checklist", desc: "Key registry tips & clinical implications" }
              ].map((sect) => (
                <button
                  key={sect.id}
                  onClick={() => setActiveTab(sect.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 group cursor-pointer ${
                    activeTab === sect.id 
                      ? "bg-[#00d1ff]/15 border-[#00d1ff] text-white shadow" 
                      : "bg-[#0e1013] border-white/5 text-[#8e9299] hover:bg-[#1a1c22] hover:border-white/10 hover:text-white"
                  }`}
                >
                  <span className={`text-[9.5px] font-semibold transition-colors duration-200 ${activeTab === sect.id ? "text-white text-[10px]" : "group-hover:text-white text-[#cfd3db]"}`}>
                    {sect.label}
                  </span>
                  <span className={`text-[8.5px] leading-tight ${activeTab === sect.id ? "text-[#00d1ff]/80" : "text-[#545861]"}`}>
                    {sect.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Viewer (col-span-8) */}
        <div className="md:col-span-8 bg-[#16181d] border border-white/5 rounded-xl p-5 md:p-6 shadow-xl min-h-[350px] flex flex-col gap-4">
          
          <AnimatePresence mode="wait">
            {activeTab === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 01</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Introduction to Pulsed-Wave Doppler</h3>
                </div>

                <div className="p-4 bg-gradient-to-r from-[#00d1ff]/5 to-pink-500/5 border border-[#00d1ff]/20 rounded-xl space-y-3.5" id="chapter-6-zany-intro">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-pink-400">Chapters Feed &bull; Chapter 6 Spotlight</span>
                    <span className="text-[7.5px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded font-mono font-bold">HUMOROUS ANATOMY</span>
                  </div>
                  <h4 className="text-xs font-serif italic font-bold text-white">Chapter 6: Pulsed-Wave Doppler</h4>
                  <div className="space-y-3 leading-relaxed text-slate-300 text-[11px] sm:text-[11.5px]">
                    <p className="first-letter:text-3xl first-letter:font-serif first-letter:font-bold first-letter:text-[#00d1ff] first-letter:mr-1.5 first-letter:float-left">
                      Welcome to the zany world of Pulsed-Wave Doppler, where ultrasound waves
                      are sent out in short, controlled bursts, much like a toddler with a toy drum.
                      These bursts allow us to measure the velocity of blood flow with pinpoint
                      accuracy, all while keeping the machine from going into a full-on percussion
                      solo. It's like having a polite conversation with the bloodstream, asking it politely
                      to "please slow down" or "speed up," depending on the situation.
                    </p>
                    <p>
                      Now, imagine you're a traffic cop, but instead of cars, you're monitoring red
                      blood cells zipping through the vessels. Pulsed-Wave Doppler is your radar
                      gun, catching those speedy little cells in the act. But here's the twist: unlike
                      a traffic cop who might hand out tickets, you get to celebrate these speedsters,
                      as they reveal crucial information about cardiovascular health. It's like being
                      a detective, but with less trench coat and more lab coat.
                    </p>
                    <p className="border-l-2 border-pink-500/40 pl-3 py-1 italic bg-pink-500/[0.02] rounded-r text-pink-300">
                      But beware, dear student, for the Pulsed-Wave Doppler has its quirks. Just like
                      trying to order coffee in a foreign country, you might encounter some aliasing—where
                      the machine gets a bit confused and starts showing you speeds that make no sense.
                      Think of it as your ultrasound machine's way of saying, "Oops, I might have had
                      one too many espressos!" Fear not, though, because with a few adjustments, you'll
                      have it back on track, ready to ace your exams and impress your professors with
                      your newfound Doppler prowess.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 leading-relaxed text-slate-300">
                  <div className="p-3.5 bg-black/40 border-l-4 border-[#00d1ff] rounded-r-lg space-y-1">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#00d1ff]">Principles of the Doppler Effect</h4>
                    <p className="text-[11.5px]">
                      Named after Christian Doppler, the <strong>Doppler Effect</strong> governs the observed change in a wave's frequency due to the relative motion between the transmitter source (the transducer) and the reflector boundary (red blood cells). 
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-[#ffd700] rounded-full" />
                      Frequency Shift and Velocity Calculation
                    </h4>
                    <p className="text-[11.5px] pl-2.5">
                      When sound reflects off flowing red blood cells, the received echo is frequency-shifted. Mathematically represented as the <strong>Doppler Equation</strong>:
                    </p>
                    <div className="p-3 bg-black/60 rounded-xl border border-white/5 my-2 flex flex-col font-mono text-center gap-1">
                      <span className="text-emerald-400 font-extrabold text-sm tracking-widest">f_shift = (2 · f₀ · v · cosθ) / c</span>
                      <span className="text-[8.5px] text-[#8e9299]">
                        Where f₀ = Transmit Frequency, v = Blood Velocity, θ = Insonation Angle, c = Propagation Speed (1,540 m/s).
                      </span>
                    </div>
                    <p className="text-[11.5px] pl-2.5">
                      By rearranging this equation, we calculate the exact physiological blood velocity: 
                      <span className="text-[#ffd700] font-mono ml-1 font-semibold">v = (f_shift · c) / (2 · f₀ · cosθ)</span>.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-[#00d1ff] rounded-full" />
                      Advantages of Pulsed-Wave Doppler
                    </h4>
                    <p className="text-[11.5px] pl-2.5">
                      The primary advantage of Pulsed-Wave (PW) Doppler is **Range Specificity** (or range resolution). Unlike Continuous-Wave systems, a PW module emits short pulses and listens exclusively after a calculated delay window (using the 13μs distance rule). This allows the operator to selectively measure blood velocity profiles at a very precise vessel location, known as the **Sample Volume** or **Sample Gate**.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'app' && (
              <motion.div
                key="app"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 02</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Clinical Applications of PW Doppler</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-slate-300">
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-[#00d1ff] uppercase">Cardiac Evaluation</div>
                    <ul className="text-[11px] list-disc list-inside space-y-1">
                      <li>Measures transvalvular inflow dynamics (Mitral E/A waves).</li>
                      <li>Assesses diastolic dysfunction degrees.</li>
                      <li>Calculates myocardial tissue velocities (Tissue Doppler Imaging).</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-[#ffd700] uppercase">Peripheral Vascular Assessment</div>
                    <ul className="text-[11px] list-disc list-inside space-y-1">
                      <li>Grades internal carotid artery stenosis percentages.</li>
                      <li>Maps lower extremity arterial bypass bypass patency.</li>
                      <li>Differentiates deep venous thrombosis and local flow obstruction.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-rose-400 uppercase">Fetal Monitoring</div>
                    <ul className="text-[11px] list-disc list-inside space-y-1">
                      <li>Assesses fetal distress via umbilical artery Resistive Index.</li>
                      <li>Measures middle cerebral artery velocities to screen fetus anemia.</li>
                      <li>Studies uterine artery flow in preeclampsia pregnancies.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-purple-400 uppercase">Cerebrovascular Imaging</div>
                    <ul className="text-[11px] list-disc list-inside space-y-1">
                      <li>Screens transcranial blood channels in intracranial vasospasms.</li>
                      <li>Identifies Circle of Willis vessel occlusions.</li>
                      <li>Grades hemodynamics of severe vertebral subclavian steel cycles.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'spectral' && (
              <motion.div
                key="spectral"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 03</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Spectral Waveform Analysis</h3>
                </div>

                <div className="space-y-2.5 text-slate-300 text-[11px] leading-relaxed">
                  <p>
                    Spectral waveforms are graphical readouts showing measured velocity (vertical axis) plotted against time (horizontal axis). The brightness of the pixels indicates the relative intensity of RBC scatterers returning at that specific velocity and moment.
                  </p>

                  <div className="space-y-3 mt-4">
                    <div className="bg-black/40 border border-white/5 p-3 rounded-lg">
                      <strong className="text-emerald-400 font-mono block">NORMAL VELOCITY CLASS SEGREGATION:</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-white font-bold block mb-0.5">High-Resistance Waveforms:</span>
                          Sharp rapid rise in systole, immediate sharp deceleration, and complete drop to zero or brief retrograde reverse flow in early diastole (e.g. resting skeletal extremity arteries or ECA).
                        </div>
                        <div>
                          <span className="text-white font-bold block mb-0.5">Low-Resistance Waveforms:</span>
                          Continuous high-volume forward flow throughout both systole and diastole. Organ systems requiring relentless metabolic nutrition show low resistance (e.g. ICA, renal, hepatic, celiac arteries).
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-3 rounded-lg">
                      <strong className="text-rose-400 font-mono block">ABNORMAL HEURISTICS DEVIATIONS:</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[10.5px]">
                        <div>
                          <strong className="text-white block mb-0.5">Damped Flow:</strong>
                          Tardus-parvus profile occurring downstream of severe stenotic blockings. Displays a slow prolonged acceleration index with short peak heights.
                        </div>
                        <div>
                          <strong className="text-white block mb-0.5">Spectral Broadening:</strong>
                          Vertical thickening of the wave line and turbid filling of the clean spectral envelope window, signifying turbulent blood movement with chaotic velocities.
                        </div>
                        <div>
                          <strong className="text-white block mb-0.5">Venous Waveforms:</strong>
                          Low velocity, non-pulsatile profiles. Show phasic variations corresponding to respirations (e.g., lower thoracic inhalation pressure cycles).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'aliasing' && (
              <motion.div
                key="aliasing"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 04</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Aliasing & Velocity Limitations</h3>
                </div>

                <div className="space-y-2.5 text-slate-300 text-[11.5px] leading-relaxed">
                  <p>
                    PW Doppler does not measure continuously. Because the system utilizes discrete pulsed sample rates, it is limited by the **Nyquist Limit**.
                  </p>

                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-[#ff4d4d] rounded-xl flex items-start gap-3">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold font-mono text-xs block uppercase">The Nyquist Limit Trap: f_nyquist = PRF / 2</strong>
                      If the target blood flow velocity triggers a biological frequency shift exceeding exactly **half of the Pulse Repetition Frequency (PRF/2)**, the scanner can no longer sample unambiguously. The peak waveform chops off and wraps around, projecting at the bottom of the baseline.
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-3">
                    <h4 className="text-white font-bold text-xs uppercase font-mono">Registry Core Adjustments to Resolve Aliasing:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                      <div className="p-2.5 bg-black/40 border-l-2 border-[#ffd700] rounded">
                        <strong>1. Increase PRF Scale:</strong> Increases the sampling rate ceiling, but depth constraint is limited.
                      </div>
                      <div className="p-2.5 bg-black/40 border-l-2 border-[#ffd700] rounded">
                        <strong>2. Shift the Baseline:</strong> Visually allocates more display area for extreme directional flows.
                      </div>
                      <div className="p-2.5 bg-black/40 border-l-2 border-[#ffd700] rounded">
                        <strong>3. Use Lower Frequency:</strong> Translates to physically smaller Doppler shifts, staying below Nyquist thresholds.
                      </div>
                      <div className="p-2.5 bg-black/40 border-l-2 border-[#ffd700] rounded">
                        <strong>4. Increase Insonation Angle:</strong> Increases cosθ estimation parameters, though angle error threshold risks rise.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'optimization' && (
              <motion.div
                key="optimization"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 05</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Optimization of PW Doppler Console</h3>
                </div>

                <div className="space-y-3 text-slate-300 text-[11px] leading-relaxed">
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Sliders size={13} className="text-[#00d1ff]" />
                      Gain and Power Adjustments
                    </h4>
                    <p className="pl-4">
                      **Spectral Gain** amplifies the digital receiver of returning Doppler shifts. Excessive gain introduces background snow noise and artificial broadening. Insufficient gain drops weak clinical tracings entirely. **Transmit Power** regulates acoustic wave amplitude, increasing biological signal-to-noise ratio but bounded by indices.
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-white/5 pt-2.5">
                    <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Activity size={13} className="text-[#ffd700]" />
                      Pulse Repetition Frequency (PRF) Scale
                    </h4>
                    <p className="pl-4">
                      Varying the PRF scale calibrates the vertical display limits to matches biological states (e.g. low scales = 10cm/s for deep hepatic veins; high scales = 150cm/s for carotid jets).
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-white/5 pt-2.5">
                    <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Layers size={13} className="text-emerald-400" />
                      Sample Volume Size &amp; Positioning Gate Guidelines
                    </h4>
                    <p className="pl-4">
                      The sampling gate has two parameters: **Position** and **Size**. 
                      **Clinical Standard:** Position exactly in the center stream (the fastest parabolic laminar flow vector), and size the gate at approximately **1.5 to 2.0 mm**. An excessively large gate registers slow wall-vessel movements, causing false spectral window filling.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'artifacts' && (
              <motion.div
                key="artifacts"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 06</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Artifacts in Pulsed-Wave Doppler</h3>
                </div>

                <div className="space-y-3.5 text-slate-300 text-[11px] leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-rose-400 font-bold block">1. Aliasing wrapping</strong>
                      <p className="text-[10px]">The most common physical artifact. Triggered when flow shift velocities exceed half of the system line PRF rate. Resolvable via scale shifts.</p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-[#ffd700] font-bold block">2. Mirror Image (Crosstalk)</strong>
                      <p className="text-[10px]">Identical Doppler profile appearing symmetrically at the bottom baseline. Caused by ninety-degree beam angles or excessive gain.</p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-[#00d1ff] font-bold block">3. Spectral Clutter Noise</strong>
                      <p className="text-[10px]">Low-velocity spikes caused by cardiac wall or pulsing vessel expanding. Purged easily by engaging the console internal Wall Filter.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#ff4d4d]/5 border border-[#ff4d4d]/10 text-white/90 rounded-lg text-[10.5px]">
                    <strong className="text-[#ff4d4d] block font-mono">⚠️ THE CORNERSTONE ARDMS EXAM TRAP: Spectral Mirroring (Crosstalk)</strong>
                    To differentiate true bi-directional flow from the Crossroads Mirroring artifact, verify if insonation angle equals exactly 90 degrees or if the receiver spectral gain slider is turned up into critical overdrive.
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 07</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Doppler Technology Comparisons</h3>
                </div>

                <div className="space-y-3 text-slate-300">
                  <p className="text-[11px]">
                    A comparative taxonomy of clinical modes mapped directly to registry performance criteria.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono border-collapse text-left">
                      <thead>
                        <tr className="bg-black/60 border-b border-white/10 text-[#00d1ff]">
                          <th className="p-2 uppercase">Diagnostic Parameter</th>
                          <th className="p-2 uppercase">Pulsed-Wave (PW)</th>
                          <th className="p-2 uppercase">Continuous-Wave (CW)</th>
                          <th className="p-2 uppercase">Color Flow Mapping</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-black/20">
                        <tr>
                          <td className="p-2 font-bold text-white">Range Resolution</td>
                          <td className="p-2 text-emerald-400">Yes (Precise gate specificity)</td>
                          <td className="p-2 text-rose-400">No (Reads complete sound line)</td>
                          <td className="p-2 text-emerald-400">Yes (Multi-gate grid matrices)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-white">Aliasing Limitations</td>
                          <td className="p-2 text-rose-400">Yes (Nyquist PRF/2 threshold)</td>
                          <td className="p-2 text-emerald-400">No (Completely immune)</td>
                          <td className="p-2 text-rose-400">Yes (Nyquist PRF/2 threshold)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-white">Velocity Output</td>
                          <td className="p-2">Exact Peak &amp; Mean tracing</td>
                          <td className="p-2">Exact high peak velocity profiles</td>
                          <td className="p-2">Calculates mean velocity maps</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-white">Physical Crystals</td>
                          <td className="p-2">One single multiplexed crystal</td>
                          <td className="p-2">Separate dedicated TX &amp; RX crystals</td>
                          <td className="p-2">Acoustic group grid arrays</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cases' && (
              <motion.div
                key="cases"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 08</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Clinical Case Studies Directory</h3>
                </div>

                <div className="space-y-3">
                  {CLINICAL_CASES.map((cs, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">{cs.category}</span>
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      </div>
                      <h4 className="text-xs font-bold text-white">{cs.title}</h4>
                      <p className="text-[10px] text-[#8e9299]"><strong>Presentation:</strong> {cs.presentation}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[10px] font-mono bg-black/60 p-2.5 rounded border border-white/5">
                        <div>
                          <strong className="text-[#00d1ff] block font-mono uppercase tracking-widest text-[8px] mb-1">MEASURED DIAGNOSTICS:</strong>
                          {cs.metrics}
                        </div>
                        <div>
                          <strong className="text-[#ffd700] block font-mono uppercase tracking-widest text-[8px] mb-1">SPECTRAL ANALYSIS (IMAGINING):</strong>
                          {cs.waveformSim}
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9.5px] leading-relaxed flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                        <div><strong>Final Interpretation:</strong> {cs.interpretation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'future' && (
              <motion.div
                key="future"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 09</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Emerging Frontiers in PW Doppler</h3>
                </div>

                <div className="space-y-3.5 text-slate-300 text-[11px] leading-relaxed">
                  <div className="p-3.5 bg-black/40 border-l-4 border-purple-500 rounded-r-lg space-y-1.5">
                    <h4 className="text-xs font-mono font-bold uppercase text-purple-400">1. Ultrafast Vector Flow Imaging (VFI)</h4>
                    <p className="text-[10.5px]">
                      Traditional Doppler registers only flow parallel to the line beam, requiring manual angle adjustments. Emerging **Vector Flow Imaging** merges multiple pulse angles simultaneously to compute actual 2D velocity vectors, providing angle-independent mapping of complex blood currents without aliasing thresholds.
                    </p>
                  </div>

                  <div className="p-3.5 bg-black/40 border-l-4 border-purple-500 rounded-r-lg space-y-1.5">
                    <h4 className="text-xs font-mono font-bold uppercase text-purple-400">2. Deep-Learning Cognitive Gate Automation</h4>
                    <p className="text-[10.5px]">
                      Harnessing neural clinical vision systems, future ultrasound scanners automatically track moving anatomic structures, instantly centering the sample volume and aligning the angle correction baseline with maximum flow streams in real-time.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'conclusion' && (
              <motion.div
                key="conclusion"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-mono text-[#00d1ff] tracking-[3px] uppercase">PART 10</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Summary and SPI Registry Guidelines</h3>
                </div>

                <div className="space-y-3 text-slate-300 text-[11px]">
                  <p>
                    Congratulations! You have completed the intensive syllabus on Pulsed-Wave Doppler. Re-verify your registry knowledge with the core checklist below:
                  </p>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="p-2.5 bg-black/40 rounded border border-white/5 flex items-start gap-2 text-[10.5px]">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Range specificity is paramount:</strong> Always recall that PW is able to sample precise deep locations because sound pulses are temporally isolated.
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 rounded border border-white/5 flex items-start gap-2 text-[10.5px]">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Oblique angles required:</strong> Align the Doppler sample correction line exactly parallel with vessels at or below **60 degrees** for accurate conversions.
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/40 rounded border border-white/5 flex items-start gap-2 text-[10.5px]">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Nyquist limit boundary:</strong> High-risk clinical flows exceeding PRF/2 wrap around. Combat with lowering frequencies, raising PRF scale steps, or moving baseline.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
