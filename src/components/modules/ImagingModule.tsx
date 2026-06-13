import React, { useState, useEffect } from 'react';
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
import AttachedMediaList from '../shared/AttachedMediaList';

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

  // Premium GE/EPIQ Receiver Chain additions
  const [lgcLeft, setLgcLeft] = useState<number>(50); // Left lateral gain %
  const [lgcRight, setLgcRight] = useState<number>(50); // Right lateral gain %
  const [adcResolution, setAdcResolution] = useState<'8bit' | '12bit' | '16bit'>('16bit'); // Digital beamformer bits
  const [isAutoOptimizing, setIsAutoOptimizing] = useState<boolean>(false);

  // Physical Ultrasound Console Deck States
  const [displayDepth, setDisplayDepth] = useState<number>(12); // 6 | 9 | 12 | 15 cm
  const [focusDepth, setFocusDepth] = useState<number>(3); // 1 to 5 focal zone
  const [outputPower, setOutputPower] = useState<number>(85); // Acoustic Output % (affects mechanical safety Index)
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [tgcManual, setTgcManual] = useState<boolean>(true);
  const [tgc8, setTgc8] = useState<number[]>([25, 32, 45, 52, 60, 72, 80, 88]); // 8-segment real sliders
  const [annotationText, setAnnotationText] = useState<string>('LIVER LOBE');
  const [annotationInput, setAnnotationInput] = useState<string>('');
  
  // Trackball dragging coordinates to adjust focal zone position
  const [trackballAngle, setTrackballAngle] = useState<number>(0);
  const [isDraggingTrackball, setIsDraggingTrackball] = useState<boolean>(false);
  
  // Automatic sector swing sweeper
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [trackballPos, setTrackballPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const runAutoOptimization = () => {
    setIsAutoOptimizing(true);
    playConsoleBeep('snap');
    
    // Simulate real-time signal analysis and automatic control calibration
    setTimeout(() => {
      setOverallGain(58); // Optimal average 2D gain
      setDynamicRange(58); // High detail diagnostic contrast
      setRejection(8); // Clear small noise scatters without clipping structures
      setTgcManual(false);
      setTgcNear(18);
      setTgcMid(46);
      setTgcFar(82);
      setTgc8([15, 22, 35, 48, 56, 68, 78, 88]); // Smooth depth slope compensating attenuation
      setLgcLeft(50);
      setLgcRight(50);
      setIsAutoOptimizing(false);
      playConsoleBeep('beep');
    }, 900);
  };

  const handleTgcSliderChange = (idx: number, newVal: number) => {
    const updated = [...tgc8];
    updated[idx] = newVal;
    setTgc8(updated);
    playConsoleBeep('relay');
  };

  const handleTrackballMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setTrackballPos({ x, y });
    
    // Changing trackballPos gently shifts sweep center or gain ratio!
    if (!isFrozen) {
      // Optoelectronic light clicks
      playConsoleBeep('relay');
    }
  };

  // Web Audio Synthesizer for high-fidelity mechanical clicks
  const playConsoleBeep = (type: 'relay' | 'beep' | 'snap') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'relay') {
        // High frequency micro click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'beep') {
        // Clinical validation chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5 note
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 chimes
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'snap') {
        // Polar shutter capture sync noise
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.16);
        noise.stop(now + 0.15);
      }
    } catch (e) {
      // AudioContext failed
    }
  };

  // Sync B-Mode scan sector sweep
  useEffect(() => {
    if (isFrozen) return;
    let animId: number;
    let start = Date.now();
    const update = () => {
      const elapsed = (Date.now() - start) / 1000;
      setSweepAngle(Math.sin(elapsed * 4.2) * 31); // swift 31 deg swing
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isFrozen]);

  // Synchronize 8-band TGC sliders with Near, Mid, Far metrics
  useEffect(() => {
    if (tgcManual) {
      const computedNear = Math.round((tgc8[0] + tgc8[1]) / 2);
      const computedMid = Math.round((tgc8[2] + tgc8[3] + tgc8[4]) / 3);
      const computedFar = Math.round((tgc8[5] + tgc8[6] + tgc8[7]) / 3);
      setTgcNear(computedNear);
      setTgcMid(computedMid);
      setTgcFar(computedFar);
    }
  }, [tgc8, tgcManual]);

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
    setLgcLeft(50);
    setLgcRight(50);
    setAdcResolution('16bit');
    setIsAutoOptimizing(false);
    setDisplayDepth(12);
    setFocusDepth(3);
    setOutputPower(85);
    setIsFrozen(false);
    setTgcManual(true);
    setTgc8([25, 32, 45, 52, 60, 72, 80, 88]);
    setAnnotationText('LIVER LOBE');
    setAnnotationInput('');
    playConsoleBeep('beep');
  };

  // Helper to generate the simulated raw and processed ultrasound sound waves
  const generateWavePoints = (isPostProcessed: boolean) => {
    const points: { x: number; y: number; originalY: number; isClipped: boolean }[] = [];
    const stepsCount = 100;
    const baseFreq = 5.0; // MHz carrier wave

    for (let i = 0; i <= stepsCount; i++) {
      const x = i;
      const depthCm = (i / stepsCount) * displayDepth; // Dynamic depth based on active console depth selection

      // 1. Raw Acoustic Sound & Anatomical Target Echoes
      let targetEcho = 0;
      // Background scatter
      let tissueScatter = Math.sin(depthCm * (96 / displayDepth)) * 6 * Math.cos(depthCm * (204 / displayDepth));

      if (selectedModel === 'cyst') {
        // Cyst is fluid-filled: no internal echoes, high transmission, acoustic enhancement deep to it
        if (depthCm >= (4 * (displayDepth / 12)) && depthCm <= (8 * (displayDepth / 12))) {
          tissueScatter = Math.sin(depthCm * 35) * 1.0; // very low internal echoes
        } else if (depthCm > (8 * (displayDepth / 12))) {
          tissueScatter *= 2.2; // Posterior Acoustic Enhancement (brighter deep echoes!)
        }
      } else if (selectedModel === 'stone') {
        // Stone is calcium-dense: strong reflection boundary, complete acoustic shadow deep to it
        if (depthCm >= (4.8 * (displayDepth / 12)) && depthCm <= (5.4 * (displayDepth / 12))) {
          targetEcho = 45; // huge calcium boundary reflection!
        } else if (depthCm > (5.4 * (displayDepth / 12))) {
          tissueScatter *= 0.12; // Severe Acoustic Shadowing (dark deep shadow!)
        }
      } else {
        // Normal hepatic structures: normal periodic blood vessels & parenchymal noise
        if (depthCm >= (5 * (displayDepth / 12)) && depthCm <= (6.5 * (displayDepth / 12))) {
          tissueScatter = Math.sin(depthCm * 12) * 1.5; // dark vessel fluid lumen
        }
      }

      // Output Transmit Power affects initial acoustic wave strength
      const powerAmplify = outputPower / 85;

      // Attenuation as sound travels down (sound energy lost exponentially)
      // Attenuation = 0.5 dB/cm/MHz * Depth * Frequency
      const attenuationFactor = Math.exp(-0.15 * baseFreq * (depthCm * 0.25));
      let waveVal = (tissueScatter + targetEcho) * attenuationFactor * powerAmplify;

      // Add high frequency carrier wave components
      waveVal += Math.sin(depthCm * (384 / displayDepth)) * 8 * attenuationFactor * powerAmplify;

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

      // Digital Quantization (Beamformer ADCs Stage)
      if (adcResolution === '8bit') {
        const quantStep = 7.0; // Coarse step quantization
        processed = Math.round(processed / quantStep) * quantStep;
      } else if (adcResolution === '12bit') {
        const quantStep = 2.0; // Fine-grained digital boundary
        processed = Math.round(processed / quantStep) * quantStep;
      }

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
        <AttachedMediaList module="imaging" />
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
                {isFrozen ? (
                  <span className="text-[8.5px] font-mono font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
                    ❄️ ACQ FROZEN
                  </span>
                ) : (
                  <div className="text-[7.5px] font-mono text-cyan-400 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Sector FOV // {selectedModel.toUpperCase()}
                  </div>
                )}
              </div>

              {/* B-MODE SIMULATOR SCREEN */}
              <div className="flex-1 bg-[#050608] border border-[#2d3139]/70 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-3 aspect-square min-h-[220px]">
                {/* Sonographic Grid */}
                <div className="absolute inset-0 hud-grid opacity-5 pointer-events-none" />

                {/* Lateral Depth Gauge ticks */}
                <div className="absolute right-2 inset-y-8 flex flex-col justify-between text-[7px] font-mono text-slate-500 select-none">
                  <span>0 cm</span>
                  <span>{ (displayDepth * 0.25).toFixed(1) }</span>
                  <span>{ (displayDepth * 0.50).toFixed(1) }</span>
                  <span>{ (displayDepth * 0.75).toFixed(1) }</span>
                  <span>{ displayDepth } cm</span>
                </div>

                {/* Left side focal carets */}
                <div className="absolute left-2.5 inset-y-8 flex flex-col justify-between text-[6.5px] font-mono text-yellow-500/80 pointer-events-none select-none">
                  <span className={focusDepth === 1 ? "text-yellow-400 font-extrabold scale-110" : "opacity-20"}>◀ F1</span>
                  <span className={focusDepth === 2 ? "text-yellow-400 font-extrabold scale-110" : "opacity-20"}>◀ F2</span>
                  <span className={focusDepth === 3 ? "text-yellow-400 font-extrabold scale-110" : "opacity-30"}>◀ F3 (TGT)</span>
                  <span className={focusDepth === 4 ? "text-yellow-400 font-extrabold scale-110" : "opacity-20"}>◀ F4</span>
                  <span className={focusDepth === 5 ? "text-yellow-400 font-extrabold scale-110" : "opacity-20"}>◀ F5</span>
                </div>

                {/* Custom Patient Label Stamp overlay */}
                {annotationText && (
                  <div className="absolute bottom-6 left-6 text-[7.5px] font-mono text-emerald-400/90 font-bold tracking-widest uppercase bg-black/60 px-1 py-0.5 rounded border border-emerald-500/20 select-none pointer-events-none">
                    🔖 ANNOTATION: {annotationText}
                  </div>
                )}

                {/* Simulated Sector Probe Cone Area */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full max-h-[180px] max-w-[180px]">
                    {/* Sector outline */}
                    <path d="M50 0 L15 100 A 70 70 0 0 0 85 100 Z" fill="#000000" stroke="#2d3139" strokeWidth="1" />
                    
                    {/* Near Field Tissue Layer */}
                    <path 
                      d="M50 0 L26 70 A 55 55 0 0 0 74 70 Z" 
                      fill="url(#liverTexture)" 
                      opacity={Math.min(1.0, Math.max(0.1, (overallGain / 75) * (1.0 + tgcNear / 90) * (activeStep >= 1 ? 1.0 : 0.6) * (outputPower / 85)))} 
                    />

                    {/* Mid Field Pathology & Background */}
                    <path 
                      d="M50 0 L18 90 A 65 65 0 0 0 82 90 Z" 
                      fill="url(#midFieldTexture)" 
                      opacity={Math.min(1.0, Math.max(0.05, (overallGain / 80) * (1.0 + tgcMid / 80) * (activeStep >= 1 ? 1.0 : 0.35) * (outputPower / 85)))} 
                    />

                    {/* Pathology Target Layer overlays inside mid field */}
                    {selectedModel === 'cyst' && (
                      <>
                        <circle 
                          cx="50" 
                          cy="55" 
                          r="11" 
                          fill="#020304" 
                          stroke="#e0e0e0" 
                          strokeWidth="0.5" 
                          strokeOpacity={focusDepth === 3 ? "0.6" : "0.2"} 
                          style={{ filter: focusDepth === 3 ? 'none' : 'blur(1.4px)' }}
                        />
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
                          opacity={Math.min(1.0, Math.max(0.1, (overallGain / 55) * (outputPower / 85)))} 
                          className={isFrozen ? "" : "animate-pulse"}
                          style={{ filter: focusDepth === 3 ? 'none' : 'blur(1.2px)' }}
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
                      <ellipse 
                        cx="50" 
                        cy="55" 
                        rx="8" 
                        ry="4" 
                        fill="none" 
                        stroke="#ffffff" 
                        strokeWidth="0.5" 
                        opacity={focusDepth === 3 ? "0.6" : "0.2"} 
                        strokeDasharray="1 1" 
                        style={{ filter: focusDepth === 3 ? 'none' : 'blur(1px)' }}
                      />
                    )}

                    {/* Live beam swing sweep line */}
                    {!isFrozen && (
                      <line
                        x1="50"
                        y1="1"
                        x2={50 + 44 * Math.sin((sweepAngle * Math.PI) / 180)}
                        y2={0 + 84 * Math.cos((sweepAngle * Math.PI) / 180)}
                        stroke="#00d1ff"
                        strokeWidth="1.2"
                        strokeOpacity="0.75"
                        style={{ filter: "drop-shadow(0 0 3px rgba(0, 209, 255, 0.8))" }}
                      />
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

                    {/* Lateral Gain Compensation Overlay (LGC Left/Right balance) */}
                    <rect 
                      x="0" 
                      y="0" 
                      width="100" 
                      height="100" 
                      fill="url(#lgcOverlay)" 
                      clipPath="url(#sectorClip)"
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

                    {/* Active Auto Optimization (iSCAN / Auto-Opt) Interceptor Shield */}
                    {isAutoOptimizing && (
                      <g opacity="0.92">
                        <path d="M50 0 L15 100 A 70 70 0 0 0 85 100 Z" fill="#080a0f" />
                        <circle cx="50" cy="50" r="16" fill="none" stroke="#00d1ff" strokeWidth="1" strokeDasharray="4 2" className="animate-spin" style={{ transformOrigin: '50% 50%' }} />
                        <text x="50" y="47" fill="#00d1ff" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold" className="animate-pulse">iSCAN ACTIVE</text>
                        <text x="50" y="55" fill="#8e9299" fontSize="3" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">EQUALIZING SCATTER...</text>
                      </g>
                    )}

                    {/* Defs block */}
                    <defs>
                      <clipPath id="sectorClip">
                        <path d="M50 0 L15 100 A 70 70 0 0 0 85 100 Z" />
                      </clipPath>
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
                      <linearGradient id="lgcOverlay" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#000000" stopOpacity={Math.max(0, 1.0 - (lgcLeft / 50))} />
                        <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000000" stopOpacity={Math.max(0, 1.0 - (lgcRight / 50))} />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Ultrasound Overlay Diagnostics HUD */}
                  <div className="absolute top-2 left-2 text-[6.5px] font-mono text-cyan-400 space-y-0.5">
                    <div>DR: {dynamicRange} dB</div>
                    <div>TGC SLOPE: {tgcNear < tgcFar ? 'NORMAL' : 'STEEP'}</div>
                    <div>FREQ: 5.0 MHz</div>
                    <div>DPTH: {displayDepth} cm</div>
                  </div>

                  <div className="absolute top-2 right-2 text-[6.5px] font-mono text-emerald-400 text-right space-y-0.5">
                    <div className={((outputPower / 85) * (0.9 + (overallGain / 130))).toFixed(2) > "1.4" ? "text-amber-400 font-extrabold animate-pulse" : ""}>
                      MI: { ((outputPower / 85) * (0.9 + (overallGain / 130))).toFixed(2) }
                    </div>
                    <div>TI: { ((outputPower / 85) * 0.4).toFixed(1) }</div>
                    <div>PWR: {outputPower}%</div>
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

          {/* PHYSICAL PHILIPS iU22 INSPIRED CONSOLE PANEL */}
          <div className="bg-gradient-to-b from-[#1c1f26] to-[#12141a] border-2 border-[#3b4252] rounded-3xl p-6 shadow-2xl relative overflow-hidden font-sans space-y-6">
            
            {/* Top Deck: Brushed Metal Status Plate */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2d3139] pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.7)]" />
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                    Philips iU22 Intelligent Console Core
                  </h3>
                </div>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-0.5">
                  Ergonomic Physical Operator Deck // Sono-Acoustic Active Diagnostics
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#0a0c10]/80 px-4 py-2 rounded-xl border border-white/5 font-mono text-[9px]">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <Sliders size={11} className="text-cyan-400" />
                  CONSOLE BEAM STATE:
                </div>
                <span className={isFrozen ? "text-rose-400 font-extrabold animate-pulse" : "text-emerald-400 font-extrabold"}>
                  {isFrozen ? "[FROZEN]" : "[ACTIVE_SWEEP_CONTINUOUS_5MHz]"}
                </span>
                <button
                  id="h-probe-power"
                  onClick={() => {
                    playConsoleBeep('beep');
                    setIsFrozen(!isFrozen);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-wide text-[8.5px] transition-colors"
                >
                  Power Sweep Toggle
                </button>
              </div>
            </div>

            {/* Main Interactive Deck Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* ZONE A: 8-Band Segmented TGC Sliders Console */}
              <div className="col-span-12 lg:col-span-4 bg-[#0d0f14] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9.5px] font-mono tracking-wider text-slate-300 font-bold uppercase flex items-center gap-1.5">
                      <Sliders size={12} className="text-yellow-500" />
                      8-Band TGC slide potentiometers
                    </span>
                    <span className="text-[7.5px] font-mono text-yellow-500/80 bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/15">
                      Philips iU22 Mode
                    </span>
                  </div>
                  <p className="text-[9px] text-[#8e9299] uppercase font-mono mb-4 leading-relaxed">
                    Over-compensates depth attenuation profiles. Near field, central liver tissue, to deep posterior boundaries.
                  </p>
                </div>

                {/* 8 TGC Sliders */}
                <div className="space-y-2.5 my-2">
                  {tgc8.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-12 text-[8px] font-mono text-slate-400 text-right uppercase">
                        CH_0{idx + 1} ({idx < 2 ? "Near" : idx < 5 ? "Mid" : "Far"})
                      </span>
                      <div className="flex-1 flex items-center gap-2 relative group">
                        {/* Tooltip */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#16181d] border border-yellow-500/30 text-[#ffd700] text-[9.5px] font-mono px-2 py-0.5 rounded shadow-xl pointer-events-none z-20 whitespace-nowrap">
                          {idx < 2 ? "Near Field" : idx < 5 ? "Mid Field" : "Far Field"} Applied Gain: {val} dB
                        </div>
                        <input
                          id={`tgc-manual-slider-${idx}`}
                          type="range"
                          min="0"
                          max="99"
                          value={val}
                          onChange={(e) => {
                            const newVal = parseInt(e.target.value);
                            handleTgcSliderChange(idx, newVal);
                          }}
                          className="flex-1 h-2 rounded bg-slate-800 accent-yellow-500 cursor-pointer"
                        />
                        <span className="w-6 text-[8.5px] font-mono text-yellow-400 font-bold">
                          {val}dB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lateral Gain Compensation (LGC) Dual Slide Pots */}
                <div className="border-t border-[#2d3139]/40 pt-3 mt-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-wider text-slate-300 font-bold uppercase flex items-center gap-1.5">
                      <Sliders size={11} className="text-[#00d1ff]" />
                      Lateral Gain Compensation (LGC)
                    </span>
                    <span className="text-[7px] font-mono text-[#00d1ff] bg-[#00d1ff]/5 px-2 py-0.5 rounded border border-[#00d1ff]/15">
                      Dual Side Pots
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {/* LGC Left slider */}
                    <div className="bg-[#151922]/50 p-2 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 uppercase">
                        <span>LGC LEFT</span>
                        <span className="text-cyan-400">{lgcLeft}%</span>
                      </div>
                      <input
                        id="lgc-left"
                        type="range"
                        min="0"
                        max="100"
                        value={lgcLeft}
                        onChange={(e) => {
                          setLgcLeft(parseInt(e.target.value));
                          playConsoleBeep('relay');
                        }}
                        className="w-full h-1 bg-slate-800 accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* LGC Right slider */}
                    <div className="bg-[#151922]/50 p-2 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 uppercase">
                        <span>LGC RIGHT</span>
                        <span className="text-cyan-400">{lgcRight}%</span>
                      </div>
                      <input
                        id="lgc-right"
                        type="range"
                        min="0"
                        max="100"
                        value={lgcRight}
                        onChange={(e) => {
                          setLgcRight(parseInt(e.target.value));
                          playConsoleBeep('relay');
                        }}
                        className="w-full h-1 bg-slate-800 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[7.5px] text-[#8e9299] font-mono uppercase bg-black/40 p-2 rounded mt-2 border border-white/5">
                  Slide left/right to sculpt gain increments manually. Auto-syncs live near (Ch 1-2), mid (Ch 3-5), far (Ch 6-8) receivers!
                </div>
              </div>

              {/* ZONE B: Rotary Knobs Deck & Alphanumeric Operator Notes Core */}
              <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-[#0d0f14] p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-5">
                
                {/* Rotary Knobs Subsection */}
                <div>
                  <h4 className="text-[9.5px] font-mono tracking-wider text-slate-300 font-bold uppercase mb-3 flex items-center gap-1.5">
                    <Activity size={12} className="text-cyan-400" />
                    B-Mode Rotary Receiver Knobs
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Master B-Mode Gain Knob */}
                    <div className="bg-[#151922] p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono text-slate-300 font-bold uppercase mb-1">
                        B-Mode Gain
                      </span>
                      <RotaryKnob
                        value={overallGain}
                        onChange={(val) => {
                          setOverallGain(val);
                          playConsoleBeep('relay');
                        }}
                        min={10}
                        max={99}
                        label="Gain"
                        color="cyan"
                      />
                      <span className="text-[8.5px] font-mono text-cyan-400 mt-2 font-black">
                        {overallGain} dB
                      </span>
                    </div>

                    {/* Focus Depth Knob */}
                    <div className="bg-[#151922] p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono text-slate-300 font-bold uppercase mb-1">
                        Focus Zone
                      </span>
                      <RotaryKnob
                        value={focusDepth * 18}
                        onChange={(val) => {
                          const level = Math.max(1, Math.min(5, Math.ceil(val / 18)));
                          if (level !== focusDepth) {
                            setFocusDepth(level);
                            playConsoleBeep('relay');
                          }
                        }}
                        min={10}
                        max={90}
                        label="Focus"
                        color="amber"
                      />
                      <span className="text-[8.5px] font-mono text-yellow-400 mt-2 font-black uppercase">
                        Level F{focusDepth}
                      </span>
                    </div>

                    {/* Acoustic Output Transmit Power */}
                    <div className="bg-[#151922] p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono text-slate-300 font-bold uppercase mb-1">
                        Output Power
                      </span>
                      <RotaryKnob
                        value={outputPower}
                        onChange={(val) => {
                          setOutputPower(val);
                          playConsoleBeep('relay');
                        }}
                        min={10}
                        max={99}
                        label="PWR"
                        color="rose"
                      />
                      <span className="text-[8.5px] font-mono text-sky-400 mt-2 font-black">
                        {outputPower}%
                      </span>
                    </div>

                    {/* Display Depth Penetration Knob */}
                    <div className="bg-[#151922] p-3 rounded-xl border border-[#2d3139]/20 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono text-slate-300 font-bold uppercase mb-1">
                        Display Depth
                      </span>
                      <RotaryKnob
                        value={displayDepth * 6.6}
                        onChange={(val) => {
                          const depths = [3.0, 6.0, 9.0, 12.0, 15.0];
                          const selectedIndex = Math.max(0, Math.min(4, Math.floor(val / 18)));
                          const targetDepth = depths[selectedIndex];
                          if (targetDepth !== displayDepth) {
                            setDisplayDepth(targetDepth);
                            playConsoleBeep('relay');
                          }
                        }}
                        min={10}
                        max={90}
                        label="Depth"
                        color="emerald"
                      />
                      <span className="text-[8.5px] font-mono text-emerald-400 mt-2 font-black">
                        {displayDepth} cm
                      </span>
                    </div>

                  </div>
                </div>

                {/* nSIGHT Digital Beamformer ADC Resolution Selector */}
                <div className="bg-[#151922]/40 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-wider text-slate-300 font-bold uppercase flex items-center gap-1.5">
                      <Zap size={11} className="text-[#00d1ff] shrink-0" />
                      nSIGHT ADC Quantization (Bit Depth)
                    </span>
                    <span className="text-[7.5px] font-mono text-cyan-400 font-medium">Digital Beamformer</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-[#0a0c10] p-1 border border-[#2d3139]/80 rounded-lg">
                    <button
                      onClick={() => {
                        setAdcResolution('16bit');
                        playConsoleBeep('relay');
                      }}
                      className={`px-2 py-1 text-[8.5px] font-mono font-bold uppercase rounded-md text-center cursor-pointer transition-all ${
                        adcResolution === '16bit'
                          ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20'
                          : 'text-slate-550 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      16-Bit (Smooth)
                    </button>
                    <button
                      onClick={() => {
                        setAdcResolution('12bit');
                        playConsoleBeep('relay');
                      }}
                      className={`px-2 py-1 text-[8.5px] font-mono font-bold uppercase rounded-md text-center cursor-pointer transition-all ${
                        adcResolution === '12bit'
                          ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20'
                          : 'text-slate-550 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      12-Bit (Fine)
                    </button>
                    <button
                      onClick={() => {
                        setAdcResolution('8bit');
                        playConsoleBeep('relay');
                      }}
                      className={`px-2 py-1 text-[8.5px] font-mono font-bold uppercase rounded-md text-center cursor-pointer transition-all ${
                        adcResolution === '8bit'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'text-slate-550 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      8-Bit (Coarse)
                    </button>
                  </div>
                </div>

                {/* Operator Patient Alphanumeric Membrane Panel */}
                <div>
                  <h4 className="text-[9.5px] font-mono tracking-wider text-slate-300 font-bold uppercase mb-2 flex items-center gap-1.5">
                    <Eye size={12} className="text-emerald-400" />
                    Membrane Annotation Keyboard Pad
                  </h4>
                  <div className="space-y-2">
                    <input
                      id="console-patient-input"
                      type="text"
                      maxLength={24}
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="#Enter Patient Diagnosis Note/Label Stamp..."
                      className="w-full bg-[#181d24] border border-[#2d3139] rounded-lg px-3 py-1.5 text-[10px] font-mono text-emerald-400 placeholder-[#8e9299]/50 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {["STONE", "CYST", "NORMAL LIVER", "PORTAL VEIN", "LIV_FL_02", "CLEAR"].map((stamp) => (
                        <button
                          key={stamp}
                          onClick={() => {
                            playConsoleBeep('relay');
                            if (stamp === "CLEAR") {
                              setAnnotationText("");
                            } else {
                              setAnnotationText((prev) => prev ? `${prev} - ${stamp}`.substring(0, 24) : stamp);
                            }
                          }}
                          className="bg-[#1e2330] hover:bg-[#2b3145] text-slate-300 font-mono text-[8px] font-bold px-2 py-1 rounded border border-white/5 transition-colors uppercase"
                        >
                          {stamp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* ZONE C: Backlit Push Controls & Ergonomic Optoelectronic Trackball */}
              <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#0d0f14] p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-5">
                
                {/* Physical Action Swells */}
                <div>
                  <h4 className="text-[9.5px] font-mono tracking-wider text-slate-300 font-bold uppercase mb-3 flex items-center gap-1.5">
                    <Activity size={12} className="text-[#00d1ff]" />
                    Tactile Backlit Keys
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    
                    {/* iSCAN AUTO-OPTIMIZE Key */}
                    <button
                      id="iscan-optimize-button"
                      onClick={() => {
                        runAutoOptimization();
                      }}
                      disabled={isAutoOptimizing}
                      className={`relative overflow-hidden flex items-center justify-between px-3 py-3 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all duration-300 shadow-md ${
                        isAutoOptimizing
                          ? "bg-[#00d1ff]/10 text-[#00d1ff] border-[#00d1ff] animate-pulse"
                          : "bg-[#1c2c36] text-[#00d1ff] border-[#00d1ff]/30 hover:border-[#00d1ff] hover:bg-[#203c4f]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={11} className={isAutoOptimizing ? "animate-spin" : ""} />
                        {isAutoOptimizing ? "[iSCAN TUNING]" : "⚡ [iSCAN AUTO-OPT]"}
                      </span>
                      <span className="text-[7px] uppercase bg-[#00d1ff]/10 px-1 py-0.5 rounded border border-[#00d1ff]/20">Active Tuning</span>
                    </button>

                    {/* FREEZE Key */}
                    <button
                      id="freeze-button"
                      onClick={() => {
                        playConsoleBeep('snap');
                        setIsFrozen(!isFrozen);
                      }}
                      className={`relative overflow-hidden flex items-center justify-between px-3 py-3 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all duration-300 shadow-md ${
                        isFrozen 
                          ? "bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" 
                          : "bg-[#1c2130] text-cyan-400 border-[#2d3139] hover:border-cyan-500/50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isFrozen ? "bg-rose-500 animate-ping" : "bg-cyan-500"}`} />
                        {isFrozen ? "[UNFREEZE]" : "❄️ [FREEZE ACQ]"}
                      </span>
                      <span>ICE BLUE-GLOW</span>
                    </button>

                    {/* PRESET RESET Key */}
                    <button
                      id="reset-preset-button"
                      onClick={() => {
                        resetToPreset();
                      }}
                      className="relative overflow-hidden flex items-center justify-between px-3 py-3 rounded-xl bg-[#1c2130] text-emerald-400 border border-[#2d3139] hover:border-emerald-500/50 font-mono text-[10px] font-bold uppercase transition-all duration-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ♻️ [Preset Reset]
                      </span>
                      <span>EMERALD FLASH</span>
                    </button>

                  </div>
                </div>

                {/* Ergonomic tracked mechanical trackball hub */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9.5px] font-mono text-slate-300 font-bold uppercase">
                      Optoelectronic Trackball
                    </span>
                    <span className="text-[7.5px] font-mono text-cyan-400">
                      NAVIGATOR ACTIVE
                    </span>
                  </div>

                  {/* Physical Trackball Plate element */}
                  <div 
                    onMouseMove={handleTrackballMove}
                    onTouchMove={handleTrackballMove}
                    className="relative w-full h-32 rounded-full bg-[#1b1e26] border-4 border-[#2e3440] shadow-inner flex items-center justify-center cursor-crosshair group overflow-hidden"
                  >
                    {/* Ring markings representing outer orbit ring */}
                    <div className="absolute inset-4 rounded-full border border-dashed border-white/5 pointer-events-none" />
                    
                    {/* Floating mechanical sphere */}
                    <div 
                      className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-[#d8dee9] to-[#4c566a] shadow-lg border-2 border-slate-300 transition-transform duration-75 pointer-events-none flex items-center justify-center text-slate-800 text-[8px] font-bold"
                      style={{
                        transform: `translate(${(trackballPos.x - 50) * 0.4}px, ${(trackballPos.y - 50) * 0.4}px)`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center" />
                    </div>

                    {/* Visual coordinates tracking line */}
                    <div className="absolute bottom-2 inset-x-0 text-center font-mono text-[8px] text-cyan-400/90 pointer-events-none select-none">
                      X: {trackballPos.x.toFixed(1)} | Y: {trackballPos.y.toFixed(1)}
                    </div>
                  </div>
                  
                  <p className="text-[7.5px] text-[#8e9299] text-center uppercase font-mono mt-2 leading-tight">
                    Hover-drag mouse/finger across trackball to pilot beam sweep sector offsets!
                  </p>
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
