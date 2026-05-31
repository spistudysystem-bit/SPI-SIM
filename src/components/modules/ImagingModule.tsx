import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Minimize2, 
  Trash2, 
  Maximize2, 
  BookOpen, 
  Sliders, 
  Sparkles, 
  Eye, 
  AlertTriangle,
  Info
} from 'lucide-react';

import RotaryKnob from '../shared/RotaryKnob';

interface ImagingModuleProps {
  tgc: number[];
}

export default function ImagingModule({ tgc: initialTgc }: ImagingModuleProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<'normal' | 'cyst' | 'stone'>('cyst');
  
  // Interactive Receiver Parameters
  const [overallGain, setOverallGain] = useState<number>(55);
  const [tgcNear, setTgcNear] = useState<number>(25);
  const [tgcMid, setTgcMid] = useState<number>(50);
  const [tgcFar, setTgcFar] = useState<number>(80);
  const [dynamicRange, setDynamicRange] = useState<number>(65); // dB
  const [rectification, setRectification] = useState<boolean>(true);
  const [smoothing, setSmoothing] = useState<boolean>(true);
  const [rejection, setRejection] = useState<number>(12); // %
  const [noiseLevel, setNoiseLevel] = useState<number>(15); // Simulated background noise %

  const steps = [
    { 
      name: 'Amplification', 
      alias: 'Overall Receiver Gain', 
      icon: <Zap size={18} />, 
      desc: 'Uniformly increases the amplitude of all returning echoes. This is the first step in processing. Amplifying weak voltages prevents system noise from overwhelming the signals downstream.',
      impact: 'Brightens or darkens the entire image uniformly. Does NOT improve the Signal-to-Noise Ratio (SNR) because noise is amplified equally with the signal.',
      registryTrap: 'Adjusting Receiver Gain does NOT affect acoustic exposure to the patient (ALARA safe). Always adjust Gain FIRST if the image is too dark, before raising output power.'
    },
    { 
      name: 'Compensation', 
      alias: 'TGC (Time Gain Compensation)', 
      icon: <Layers size={18} />, 
      desc: 'Corrects for depth-dependent attenuation of the acoustic beam as it travels deeper through body tissues. Deeper echoes require more electronic amplification than shallower ones.',
      impact: 'Creates a uniform brightness profile from top (near field) to bottom (far field). Helps distinguish physical tissue variations from attenuation artifacts.',
      registryTrap: 'Compensation curve shape relies strictly on the tissue medium attenuation rate (average: 0.5 dB/cm/MHz). Higher frequency transducers attenuate faster and require steeper TGC slopes!'
    },
    { 
      name: 'Compression', 
      alias: 'Dynamic Range (Log Compression)', 
      icon: <Minimize2 size={18} />, 
      desc: 'Squeezes the wide dynamic range of electrical voltages (often 120+ dB) down into a narrower range (display limits, e.g., 30 to 90 dB) without causing signal saturation.',
      impact: 'Changes the grayscale contrast map. Low Dynamic Range (30 dB) creates high-contrast, black-and-white images (ideal for echo/vessel borders). High Dynamic Range (90 dB) provides soft, rich gray details (ideal for hepatic parenchyma).',
      registryTrap: 'Compression scales high voltages logarithmically. High voltage spikes are kept safe within system boundaries, while small difference bounds are preserved for gray assignment.'
    },
    { 
      name: 'Demodulation', 
      alias: 'Rectified / Smoothed Envelope', 
      icon: <Activity size={18} />, 
      desc: 'Converts negative voltage pulses into positive ones (Rectification) and wraps a smooth protective trace around the peak cycles (Smoothing) to prepare the RF signal for image display.',
      impact: 'Converts high-frequency radiofrequency (RF) cycles into a clean amplitude-modulated videoraster signal. It does NOT visually worsen details, but packages the signal for presentation.',
      registryTrap: 'Demodulation is completely automated by the machine hardware. It is the ONLY receiver function that is NOT operator adjustable. There is no control knob for Demodulation on clinical consoles!'
    },
    { 
      name: 'Rejection', 
      alias: 'Threshold / Suppression', 
      icon: <Trash2 size={18} />, 
      desc: 'Eliminates weak, low-level voltages and electrical noise floor that do not contribute to real pathology representation, keeping the dark areas clean of snow-like artifact.',
      impact: 'Eliminates low-level speckles. Extremely low echoes disappear into true black, which improves contrast in low-reflectivity regions like cystic structures.',
      registryTrap: 'Rejection removes weak signals indiscriminately. Setting rejection too high will erroneously clip real low-level diagnostic clinical echoes (such as soft thrombus inside a vessel).'
    }
  ];

  // Reset to calibrated standard preset values
  const resetToPreset = () => {
    setOverallGain(55);
    setTgcNear(25);
    setTgcMid(50);
    setTgcFar(80);
    setDynamicRange(65);
    setRectification(true);
    setSmoothing(true);
    setRejection(12);
    setNoiseLevel(15);
  };

  // Helper to generate the simulated raw and processed ultrasound sound waves
  const generateWavePoints = (isPostProcessed: boolean) => {
    const points: { x: number; y: number; originalY: number; isClipped: boolean }[] = [];
    const stepsCount = 100;
    const baseFreq = 5.0; // MHz carrier wave

    for (let i = 0; i <= stepsCount; i++) {
      const x = i;
      const depthCm = (i / stepsCount) * 12; // 0 to 12cm depth

      // 1. Raw Acoustic Sound & Anatomical Target Echoes
      let targetEcho = 0;
      // Background scatter
      let tissueScatter = Math.sin(depthCm * 8) * 6 * Math.cos(depthCm * 17);

      if (selectedModel === 'cyst') {
        // Cyst is fluid-filled: no internal echoes, high transmission, acoustic enhancement deep to it
        if (depthCm >= 4 && depthCm <= 8) {
          tissueScatter = Math.sin(depthCm * 35) * 1.0; // very low internal echoes
        } else if (depthCm > 8) {
          tissueScatter *= 2.2; // Posterior Acoustic Enhancement (brighter deep echoes!)
        }
      } else if (selectedModel === 'stone') {
        // Stone is calcium-dense: strong reflection boundary, complete acoustic shadow deep to it
        if (depthCm >= 4.8 && depthCm <= 5.4) {
          targetEcho = 45; // huge calcium boundary reflection!
        } else if (depthCm > 5.4) {
          tissueScatter *= 0.12; // Severe Acoustic Shadowing (dark deep trace!)
        }
      } else {
        // Normal hepatic structures: normal periodic blood vessels & parenchymal noise
        if (depthCm >= 5 && depthCm <= 6.5) {
          tissueScatter = Math.sin(depthCm * 12) * 1.5; // dark vessel fluid lumen
        }
      }

      // Attenuation as sound travels down (sound energy lost exponentially)
      // Attenuation = 0.5 dB/cm/MHz * Depth * Frequency
      const attenuationFactor = Math.exp(-0.15 * baseFreq * (depthCm * 0.25));
      let waveVal = (tissueScatter + targetEcho) * attenuationFactor;

      // Add high frequency carrier wave components
      waveVal += Math.sin(depthCm * 32.0) * 8 * attenuationFactor;

      // Save raw un-amplified signal (with noise)
      // Let's add low-level system background noise floor
      const randomNoise = (Math.sin(depthCm * 140) * Math.cos(depthCm * 80)) * (noiseLevel / 2.5);
      const rawWithNoise = waveVal + randomNoise * 0.3;

      if (!isPostProcessed) {
        // Raw oscilloscope input line: weak attenuated RF wave
        points.push({ x: (i / stepsCount) * 400, y: 50 + rawWithNoise * 0.8, originalY: 50 + rawWithNoise, isClipped: false });
        continue;
      }

      // PROCESSING STEPS IN THE RECEIVER CHAIN (Sequential)
      let processed = rawWithNoise;

      // Step 1: Amplification (Overall Receiver Gain)
      // Boosts everything uniformly
      const ampFactor = overallGain / 55;
      processed *= ampFactor;

      // Step 2: Compensation (Depth selective gain / TGC)
      let currentTgc = tgcNear;
      if (depthCm > 4 && depthCm <= 8) {
        // Linear transition between regions
        const ratio = (depthCm - 4) / 4;
        currentTgc = tgcNear * (1 - ratio) + tgcMid * ratio;
      } else if (depthCm > 8) {
        const ratio = Math.min(1, (depthCm - 8) / 4);
        currentTgc = tgcMid * (1 - ratio) + tgcFar * ratio;
      }
      const tgcFactor = 1.0 + (currentTgc / 100) * 3.5;
      if (activeStep >= 1) {
        processed *= tgcFactor;
      }

      // Step 3: Compression (Dynamic Range)
      // Squeezes high voltage spikes logarithmically, while mapping grays smoothly
      if (activeStep >= 2) {
        const sign = Math.sign(processed);
        const absVal = Math.abs(processed);
        // Log calculation. Lower Dynamic Range means lower dB values, representing more stark step changes (high contrast)
        const drScaling = 85 / dynamicRange; // compression multiplier
        processed = sign * Math.log1p(absVal * 0.1) * 22 * drScaling;
      }

      // Step 4: Demodulation (Rectification & Smoothing)
      if (activeStep >= 3) {
        // Phase A: Rectification (Flip negative cycles to positive)
        if (rectification) {
          processed = Math.abs(processed);
        }
        // Phase B: Smoothing (Keep raw envelope or smooth trace)
        if (smoothing) {
          // Keep upper boundary envelope value cleanly
          processed = Math.abs(processed) * 0.95 + 4;
        }
      }

      // Step 5: Rejection (Suppresses values below threshold)
      let isClipped = false;
      if (activeStep >= 4) {
        const thresholdVal = rejection * 0.8;
        if (Math.abs(processed) < thresholdVal) {
          processed = smoothing ? 4 : 0; // Drop completely to baseline
          isClipped = true;
        }
      }

      points.push({
        x: (i / stepsCount) * 400,
        y: smoothing && activeStep >= 3 ? 80 - processed * 1.1 : 50 - processed * 0.9,
        originalY: 50 + rawWithNoise,
        isClipped
      });
    }

    return points;
  };

  const activeWavePoints = generateWavePoints(true);
  const rawWavePoints = generateWavePoints(false);

  // SVG string builders
  const rawPathD = rawWavePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const processedPathD = activeWavePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col p-3 sm:p-6 lg:p-8 gap-4 md:gap-6 hud-dots"
      id="receiver-chain-root"
    >
      {/* Module Title Section */}
      <div className="flex justify-between items-start lg:items-end flex-col lg:flex-row border-b border-[#2d3139]/80 pb-5 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[4px] text-[#00d1ff] font-bold mb-1.5 font-mono">
            Clinical Instrumentation Simulation Engine
          </div>
          <div className="text-2xl md:text-3xl font-serif italic text-white leading-tight">
            The <span className="text-[#8e9299]">Receiver Chain</span> Console
          </div>
        </div>
        
        {/* Toggle Preset Model Selection */}
        <div className="flex items-center gap-2 font-mono text-[9px] w-full lg:w-auto">
          <span className="text-[#8e9299] uppercase tracking-wider font-bold shrink-0">Anatomy:</span>
          <div className="grid grid-cols-3 gap-1 bg-[#14161d] p-1 border border-[#2d3139]/80 rounded-lg w-full lg:w-auto">
            <button 
              onClick={() => setSelectedModel('normal')}
              className={`px-3 py-1.5 rounded-md uppercase font-bold transition-all text-center cursor-pointer ${selectedModel === 'normal' ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
            >
              Normal Liver
            </button>
            <button 
              onClick={() => setSelectedModel('cyst')}
              className={`px-3 py-1.5 rounded-md uppercase font-bold transition-all text-center cursor-pointer ${selectedModel === 'cyst' ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
            >
              Fluid Cyst
            </button>
            <button 
              onClick={() => setSelectedModel('stone')}
              className={`px-3 py-1.5 rounded-md uppercase font-bold transition-all text-center cursor-pointer ${selectedModel === 'stone' ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
            >
              Gallstone
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-12 gap-5 lg:gap-6 flex-1 items-stretch">
        
        {/* LEFT COLUMN: 5-Stage Step Selector with Registry Traps */}
        <aside className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest font-black">
                Receiver Sequences (A - C - C - D - R)
              </span>
              <button 
                onClick={resetToPreset}
                className="text-[8px] font-mono hover:text-[#00d1ff] text-[#8e9299] border border-[#2d3139] px-2 py-0.5 rounded cursor-pointer transition-all uppercase"
                title="Reset all settings to normal baseline"
              >
                Reset Controls
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <button
                  key={step.name}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left relative overflow-hidden cursor-pointer ${
                    activeStep === i 
                      ? 'bg-[#00d1ff]/5 border-[#00d1ff] text-white shadow-[0_0_15px_rgba(0,209,255,0.15)]' 
                      : 'bg-black/15 border-[#1e2124] text-slate-400 hover:text-slate-200 hover:border-[#383a40]'
                  }`}
                >
                  {/* Step status bar indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeStep === i ? 'bg-[#00d1ff]' : 'bg-transparent'}`} />
                  
                  <div className="mt-0.5 shrink-0">
                    <div className={`p-1.5 rounded-lg ${activeStep === i ? 'bg-[#00d1ff]/10 text-[#00d1ff]' : 'bg-[#181a1f] text-slate-500'}`}>
                      {step.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10.5px] font-mono font-extrabold uppercase tracking-widest text-[#00d1ff]">
                        {i + 1}. {step.name}
                      </span>
                      {activeStep === i && (
                        <span className="text-[8.5px] font-bold text-amber-400 font-mono italic shrink-0">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[8.5px] font-mono text-[#8e9299] uppercase pr-2 line-clamp-1 mt-0.5">
                      Alias: {step.alias}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tutorial Box with Direct Fullscreen Option */}
          <div className="bg-[#111317] border-l-4 border-amber-500/70 bg-amber-500/[0.01] rounded-r-2xl p-4 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span className="text-[9.5px] font-mono font-black text-amber-400 uppercase tracking-widest">
                Registry Core Trap Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic">
              "{steps[activeStep].registryTrap}"
            </p>
            <button
              onClick={() => {
                (window as any).showInfoFullScreen?.({
                  title: `${steps[activeStep].name} (${steps[activeStep].alias})`,
                  badge: "REGISTRY CORE DOSSIER",
                  subtitle: `Receiver Execution Rank: Step #${activeStep + 1} of 5`,
                  content: `
                    <div class="space-y-6">
                      <div>
                        <h4 class="text-sm font-mono text-[#00d1ff] uppercase tracking-wider mb-2">Physiological Mechanism (Hardware Logic)</h4>
                        <p class="text-white/80 leading-relaxed text-sm">${steps[activeStep].desc}</p>
                      </div>
                      <div class="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <h4 class="text-sm font-mono text-[#ffd700] uppercase tracking-wider mb-2">Primary Clinical Impact</h4>
                        <p class="text-white/80 leading-relaxed text-sm">${steps[activeStep].impact}</p>
                      </div>
                      <div class="p-4 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl">
                        <h4 class="text-sm font-mono text-amber-400 uppercase tracking-wider mb-2">Diagnostic Board Trap Details</h4>
                        <p class="text-amber-300 leading-relaxed text-sm">${steps[activeStep].registryTrap}</p>
                      </div>
                    </div>
                  `,
                  concept: `A-C-C-D-R is the golden sequence. Mastering steps 1-5 in order prevents diagnostic confusion.`
                });
              }}
              className="mt-1 self-start flex items-center gap-1.5 px-2 py-1 text-[8.5px] font-mono uppercase tracking-wider text-[#00d1ff] bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 rounded transition-all cursor-pointer"
            >
              <BookOpen size={10} /> Explode Knowledge Fullscreen
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: Oscilloscope, Controls, and Live Visual Ultrasound Scans */}
        <main className="col-span-12 xl:col-span-8 flex flex-col gap-4">
          
          {/* TOP CONTROLS BOARD: Real-time Sliders depending on Active Step */}
          <div className="bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Sliders size={14} className="text-[#00d1ff]" />
              <span className="text-[9.5px] font-mono text-slate-300 uppercase tracking-widest font-black">
                Active Knob Adjusters // processed live
              </span>
            </div>

            {/* Render sliders depending on step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Step 1: Amplification Parameters */}
              <div className={`transition-all ${activeStep === 0 ? 'opacity-100' : 'opacity-40 hover:opacity-75'}`}>
                <RotaryKnob
                  value={overallGain}
                  min={5}
                  max={100}
                  onChange={(val) => {
                    setOverallGain(val);
                    if (activeStep !== 0) setActiveStep(0);
                  }}
                  label="1. Receiver Gain (Amplification)"
                  unit="dB"
                  color="cyan"
                  disabled={false}
                  helpText="V_out = G * V_in // Amplifies equally"
                />
              </div>

              {/* Step 2: Compensation Parameters */}
              <div className={`space-y-3 p-3 rounded-xl border border-transparent transition-all ${activeStep === 1 ? 'bg-black/30 border-white/5 shadow-inner' : 'opacity-40 bg-[#16181d]/50'}`}>
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-purple-400">2. Time Gain Compensation (TGC)</span>
                  <span className="text-slate-400">N:{tgcNear} | M:{tgcMid} | F:{tgcFar}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[7.5px] text-[#8e9299] font-mono text-center uppercase">Near</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={tgcNear} 
                      onChange={(e) => {
                        setTgcNear(parseInt(e.target.value));
                        if (activeStep !== 1) setActiveStep(1);
                      }} 
                      className="w-full h-1 bg-slate-800 accent-purple-500 cursor-pointer" 
                      disabled={activeStep !== 1}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[7.5px] text-[#8e9299] font-mono text-center uppercase">Mid</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={tgcMid} 
                      onChange={(e) => {
                        setTgcMid(parseInt(e.target.value));
                        if (activeStep !== 1) setActiveStep(1);
                      }} 
                      className="w-full h-1 bg-slate-800 accent-purple-500 cursor-pointer" 
                      disabled={activeStep !== 1}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[7.5px] text-[#8e9299] font-mono text-center uppercase">Far</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={tgcFar} 
                      onChange={(e) => {
                        setTgcFar(parseInt(e.target.value));
                        if (activeStep !== 1) setActiveStep(1);
                      }} 
                      className="w-full h-1 bg-slate-800 accent-purple-500 cursor-pointer" 
                      disabled={activeStep !== 1}
                    />
                  </div>
                </div>
                <span className="text-[8px] text-[#8e9299] font-mono block uppercase">
                  Slope: Corrects exponential tissue attenuation.
                </span>
              </div>

              {/* Step 3: Compression Parameters */}
              <div className={`space-y-3 p-3 rounded-xl border border-transparent transition-all ${activeStep === 2 ? 'bg-black/30 border-white/5 shadow-inner' : 'opacity-40'}`}>
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-amber-400">3. Grayscale Mapping (Dynamic Range)</span>
                  <span className="text-[#ffd700]">{dynamicRange} dB</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="90" 
                  value={dynamicRange} 
                  onChange={(e) => {
                    setDynamicRange(parseInt(e.target.value));
                    if (activeStep !== 2) setActiveStep(2);
                  }}
                  className="w-full h-1.5 rounded bg-slate-800 accent-amber-500 cursor-pointer"
                  disabled={activeStep !== 2}
                />
                <span className="text-[8px] text-[#8e9299] font-mono block uppercase">
                  DR choice: Lower scale decreases gray shades, increases contrast.
                </span>
              </div>

              {/* Step 4: Demodulation Parameters */}
              <div className={`space-y-3 p-3 rounded-xl border border-transparent transition-all ${activeStep === 3 ? 'bg-black/30 border-white/5 shadow-inner' : 'opacity-40'}`}>
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-emerald-400">4. Demodulator Circuitry (Non-adjustable)</span>
                  <span className="text-slate-400 font-mono text-[8px] uppercase">Auto Hardware Lock</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activeStep === 3) setRectification(!rectification);
                    }}
                    disabled={activeStep !== 3}
                    className={`flex-1 py-1.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold uppercase border text-center cursor-pointer transition-all ${
                      rectification 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                        : 'bg-black/15 border-white/5 text-slate-500'
                    }`}
                  >
                    Rectification: {rectification ? 'Full Wave' : 'Off'}
                  </button>
                  <button
                    onClick={() => {
                      if (activeStep === 3) setSmoothing(!smoothing);
                    }}
                    disabled={activeStep !== 3}
                    className={`flex-1 py-1.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold uppercase border text-center cursor-pointer transition-all ${
                      smoothing 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                        : 'bg-black/15 border-white/5 text-slate-500'
                    }`}
                  >
                    Smoothing: {smoothing ? 'Active' : 'Off'}
                  </button>
                </div>
                <span className="text-[8px] text-[#8e9299] font-mono block uppercase">
                  Registry Tip: Demodulation converts raw RF cycles to a video envelope.
                </span>
              </div>

              {/* Step 5: Rejection Parameters */}
              <div className={`space-y-3 p-3 rounded-xl border border-transparent transition-all ${activeStep === 4 ? 'bg-black/30 border-white/5 shadow-inner' : 'opacity-40'}`}>
                <div className="flex justify-between text-[10px] font-mono font-bold block">
                  <span className="text-rose-400">5. Noise Rejection (Suppression Limit)</span>
                  <span className="text-[#ffd700]">{rejection}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="45" 
                  value={rejection} 
                  onChange={(e) => {
                    setRejection(parseInt(e.target.value));
                    if (activeStep !== 4) setActiveStep(4);
                  }}
                  className="w-full h-1.5 rounded bg-slate-800 accent-rose-500 cursor-pointer"
                  disabled={activeStep !== 4}
                />
                <span className="text-[8px] text-[#8e9299] font-mono block uppercase">
                  Eliminates weak signals. Keeps dynamic bounds clean of fluff.
                </span>
              </div>

              {/* Auxiliary Simulator Variables */}
              <div className="space-y-3 p-3 rounded-xl border border-transparent bg-black/10">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">Acoustic Beam Carrier Frequency</span>
                  <span className="text-[#00d1ff] font-bold">5.0 MHz</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-mono text-[#8e9299] uppercase">Simulate Electronic Thermal Noise Floor:</span>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={noiseLevel}
                    onChange={(e) => setNoiseLevel(parseInt(e.target.value))}
                    className="w-20 sm:w-24 h-1 bg-slate-800 accent-sky-400 cursor-pointer"
                  />
                  <span className="text-[8px] font-mono text-white/50">{noiseLevel}%</span>
                </div>
                <span className="text-[8px] text-[#8e9299] font-mono block uppercase">
                  Internal acoustic impedance match coefficient: 0.5 dB/cm/MHz
                </span>
              </div>

            </div>
          </div>

          {/* LOWER INTERACTIVE BOARD: Dual Oscilloscopes & Mock Liver Ultrasound B-Mode Live View */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* OSCILLOSCOPE WAVEFORM MONITOR */}
            <div className="col-span-12 md:col-span-7 bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px]">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-[#00d1ff]" />
                  <span className="text-[9px] font-mono text-slate-300 uppercase tracking-wider font-extrabold">
                    A-Mode Oscilloscope Monitor
                  </span>
                </div>
                <span className="text-[7.5px] font-mono py-0.5 px-2 bg-black text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  Live Sweep
                </span>
              </div>

              {/* Reference Weak Wave (Raw echo) */}
              <div className="flex-1 flex flex-col gap-3 justify-center">
                <div className="bg-[#08090c] border border-[#2d3139]/50 rounded-xl p-2 relative h-24 overflow-hidden">
                  <div className="absolute top-1 left-3 text-[7.5px] font-mono text-[#8e9299] tracking-wider uppercase">
                    INPUT 1 // Raw, Weak, Attenuated Echo RF Data (+ scatter)
                  </div>
                  {/* Attenuation Curve Indicator overlay */}
                  <div className="absolute right-3 top-1 text-[7px] font-mono text-red-400 text-right uppercase">
                    Tissue Attenuation: -{ (0.5 * 5 * 12).toFixed(1) } dB/cm
                  </div>

                  <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                    {/* Baseline */}
                    <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    {/* Wave Path */}
                    <path d={rawPathD} fill="none" stroke="#e0e0e0" strokeWidth="1" strokeOpacity="0.4" />
                  </svg>
                </div>

                {/* Processed Signal (Output) */}
                <div className="bg-[#08090c] border border-[#2d3139]/50 rounded-xl p-2 relative h-32 overflow-hidden shadow-inner">
                  <div className="absolute top-1.5 left-3 text-[7.5px] font-mono text-[#00d1ff] tracking-wider uppercase flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d1ff] animate-ping" />
                    PROCESSED SYSTEM DATA // OUTPUT {activeStep + 1} ({steps[activeStep].name})
                  </div>

                  {/* Show Horizontal Rejection Cutoff Limit Line */}
                  {activeStep === 4 && (
                    <div className="absolute inset-x-0 h-0.5 border-t border-rose-500/30 font-mono text-[6px] text-rose-400" style={{ bottom: `${rejection * 0.8}%` }}>
                      <span className="bg-black/90 px-1 py-0.5 rounded ml-2">REJECT LIMIT ({rejection}%)</span>
                    </div>
                  )}

                  <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                    {/* Baseline */}
                    <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    {/* Wave Path */}
                    <path d={processedPathD} fill="none" stroke="#00d1ff" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* LIVE B-MODE ULTRASOUND IMAGE PREVIEW ZONE */}
            <div className="col-span-12 md:col-span-5 bg-[#111317] border border-[#2d3139]/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <Eye size={13} className="text-purple-400" />
                  <span className="text-[9px] font-mono text-slate-300 uppercase tracking-wider font-extrabold">
                    B-Mode Live Scan
                  </span>
                </div>
                <div className="text-[7.5px] font-mono text-cyan-400 uppercase">
                  Sector FOV // {selectedModel.toUpperCase()}
                </div>
              </div>

              {/* B-MODE SIMULATOR SCREEN */}
              <div className="flex-1 bg-[#050608] border border-[#2d3139]/70 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-3 aspect-square min-h-[220px]">
                {/* Sonographic Grid */}
                <div className="absolute inset-0 hud-grid opacity-5 pointer-events-none" />

                {/* Lateral Depth Gauge ticks */}
                <div className="absolute right-2 inset-y-8 flex flex-col justify-between text-[7.5px] font-mono text-slate-500 select-none">
                  <span>0 cm</span>
                  <span>3 cm</span>
                  <span>6 cm</span>
                  <span>9 cm</span>
                  <span>12 cm</span>
                </div>

                {/* Simulated Sector Probe Cone Area */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full max-h-[180px] max-w-[180px]">
                    {/* Sector outline */}
                    <path d="M50 0 L15 100 A 70 70 0 0 0 85 100 Z" fill="#000000" stroke="#2d3139" strokeWidth="1" />
                    
                    {/* Near Field Tissue Layer */}
                    <path 
                      d="M50 0 L26 70 A 55 55 0 0 0 74 70 Z" 
                      fill="url(#liverTexture)" 
                      opacity={Math.min(1, Math.max(0, (overallGain / 75) * (1.0 + tgcNear / 90) * (activeStep >= 1 ? 1.0 : 0.6)))} 
                    />

                    {/* Mid Field Pathology & Background */}
                    <path 
                      d="M50 0 L18 90 A 65 65 0 0 0 82 90 Z" 
                      fill="url(#midFieldTexture)" 
                      opacity={Math.min(1, Math.max(0, (overallGain / 80) * (1.0 + tgcMid / 80) * (activeStep >= 1 ? 1.0 : 0.35)))} 
                    />

                    {/* Pathology Target Layer overlays inside mid field */}
                    {selectedModel === 'cyst' && (
                      <>
                        {/* Fluid filled cyst: black hypoechoic center */}
                        <circle cx="50" cy="55" r="11" fill="#020304" stroke="#e0e0e0" strokeWidth="0.5" strokeOpacity="0.2" />
                        {/* Acoustic enhancement deep to fluid */}
                        <polygon 
                          points="39,63 61,63 68,95 32,95" 
                          fill="url(#enhancementGlow)" 
                          opacity={Math.min(0.9, Math.max(0.1, (overallGain / 60) * (tgcFar / 60) * 0.75))} 
                        />
                      </>
                    )}

                    {selectedModel === 'stone' && (
                      <>
                        {/* Dense Stone: bright calcification shell */}
                        <path 
                          d="M38 52 C42 45, 58 45, 62 52 C58 54, 42 54, 38 52 Z" 
                          fill="#ffffff" 
                          stroke="#00d1ff" 
                          strokeWidth="0.5" 
                          opacity={Math.min(1, Math.max(0.1, (overallGain / 50)))} 
                          className="animate-pulse"
                        />
                        {/* Complete posterior shadowing behind the stone */}
                        <polygon 
                          points="36,54 64,54 74,96 26,96" 
                          fill="#000000" 
                          opacity={Math.max(0.7, 1.0 - (rejection / 100) - (tgcFar / 100))} 
                          strokeWidth="0"
                        />
                      </>
                    )}

                    {selectedModel === 'normal' && (
                      <ellipse cx="50" cy="55" rx="8" ry="4" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 1" />
                    )}

                    {/* Grayscale palette gradient overlay simulating Compression changes */}
                    {/* Lower Dynamic Range results in highly stark contrast */}
                    <rect 
                      x="0" 
                      y="0" 
                      width="100" 
                      height="100" 
                      fill="url(#contrastOverlay)" 
                      style={{ mixBlendMode: "color-dodge" as any }} 
                      opacity={Math.min(0.8, (90 - dynamicRange) / 80)} 
                      pointerEvents="none" 
                    />

                    {/* Demodulation filter: if demodulation is OFF, draw raw RF noise cycles across pixel cone */}
                    {!(activeStep >= 3 && rectification && smoothing) && (
                      <path 
                        d="M50 0 L15 100 A 70 70 0 0 0 85 100 Z" 
                        fill="none" 
                        stroke="#00d1ff" 
                        strokeWidth="0.4" 
                        strokeDasharray="2 1 1 2 1 4" 
                        opacity="0.25" 
                      />
                    )}

                    {/* Defs block */}
                    <defs>
                      <radialGradient id="liverTexture" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8e9299" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#111317" stopOpacity="0.1"/>
                      </radialGradient>
                      <radialGradient id="midFieldTexture" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#5a5e66" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#181a1f" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.8"/>
                      </radialGradient>
                      <linearGradient id="enhancementGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="contrastOverlay" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
                        <stop offset="50%" stopColor="#000000" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Ultrasound Overlay Diagnostics HUD */}
                  <div className="absolute top-2 left-2 text-[6.5px] font-mono text-cyan-400 space-y-0.5">
                    <div>DR: {dynamicRange} dB</div>
                    <div>TGC SLOPE: {tgcNear < tgcFar ? 'NORMAL' : 'STEEP'}</div>
                    <div>FREQ: 5.0 MHz</div>
                  </div>

                  <div className="absolute top-2 right-2 text-[6.5px] font-mono text-emerald-400 text-right space-y-0.5">
                    <div>MI: { (0.9 + (overallGain / 100)).toFixed(2) }</div>
                    <div>TIB: 0.4</div>
                    <div>REJ: {rejection}%</div>
                  </div>
                </div>

                <div className="text-[7.5px] font-mono text-[#8e9299] text-center uppercase tracking-widest mt-1">
                  {selectedModel === 'cyst' && '⚠️ POSTERIOR ACOUSTIC ENHANCEMENT DETECTED'}
                  {selectedModel === 'stone' && '⚠️ POSTERIOR ACOUSTIC SHADOWING DETECTED'}
                  {selectedModel === 'normal' && 'STABLE LIV_04 SCATTER PROFILE'}
                </div>
              </div>
            </div>

          </div>

          {/* Clinically Rich Footer Explanation */}
          <div className="bg-[#16181d] border border-[#2d3139]/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-[#8e9299] gap-4 shadow-md">
            <span className="uppercase tracking-widest text-[#00d1ff] font-bold">
              📚 SONICBUILD RECEIVER CHAIN LAB
            </span>
            <div className="text-center md:text-right">
              <span className="text-white block">
                Current State: Step # {activeStep + 1} ({steps[activeStep].name}) is selected. 
              </span>
              <span className="text-slate-400 text-[8.5px]">
                Try toggling different anatomical subjects at the top to analyze artifacts!
              </span>
            </div>
          </div>

        </main>
      </div>

    </motion.div>
  );
}
