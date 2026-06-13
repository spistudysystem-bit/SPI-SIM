import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Activity, 
  Gauge, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  Timer, 
  Heart, 
  Info, 
  Eye, 
  Play, 
  Pause,
  RotateCcw,
  Sliders,
  FileCheck2
} from 'lucide-react';

interface LessonVisualsProps {
  lessonId: string; // e.g. "l1-1", "s1-1"
  isSedaris: boolean;
}

// Maps of generated static illustrations
const STATIC_ILLUSTRATIONS: Record<string, { src: string; caption: string; alt: string }> = {
  '1-1': {
    src: '/src/assets/images/ultrasound_waves_1779739883039.png',
    caption: 'Longitudinal Field: Compression (high-density pressure nodes) vs Rarefaction (expansion fields) propagating at 1,540 m/s.',
    alt: 'High-contrast medical wave illustration showing vertical acoustic compression and expansion fields.'
  },
  '1-2': {
    src: '/src/assets/images/ultrasound_frequency_1779739899960.png',
    caption: 'The Classical Dilemma: High-resolution short wavelengths (10 MHz) vs Deep-penetrating low attenuation waves (5 MHz).',
    alt: 'Sleek neon scientific schematic comparing 10 MHz versus 5 MHz wave decay in deep biological structures.'
  },
  '2-1': {
    src: '/src/assets/images/ultrasound_crystal_1779739915821.png',
    caption: 'Transducer Stack: PZT crystal vibration, 1/4 wavelength matching layer, and damping backing block.',
    alt: 'Industrial diagram of a piezoelectric sensor showing the matching layer stepping down acoustic impedance.'
  },
  '2-2': {
    src: '/src/assets/images/ultrasound_steering_1779739933335.png',
    caption: 'Huygen\'s Wavefront: Phased delays (nanosecond offsets) combining structurally to steer the acoustic main beam.',
    alt: 'Isometric schematic illustrating phased array delay line sequences and wave constructive interference.'
  },
  '3-1': {
    src: '/src/assets/images/ultrasound_depth_13us_1780312184191.png',
    caption: 'The 13-Microsecond Rule: Round-trip flight time calculations mapping reflector depth in soft tissue to exact return times.',
    alt: 'High-fidelity clinical diagram showing range-equation timing of ultrasound pulses.'
  },
  '4-1': {
    src: '/src/assets/images/ultrasound_doppler_angle_1780312204285.png',
    caption: 'Doppler Intercept Vector: Relationship of the angle cosine to detected blood velocity and arterial flow direction.',
    alt: 'Vascular Doppler vector diagram explaining angle calibration constraints.'
  },
  '5-1': {
    src: '/src/assets/images/ultrasound_reverberation_1780802881986.png',
    caption: 'Acoustic Reverberation & Reflection Pathing: Shows parallel bouncing sound sheets creating linear copycat artifacts.',
    alt: 'High-precision diagnostic diagram showing acoustic reverberation artifacting.'
  },
  '5-2': {
    src: '/src/assets/images/ultrasound_artifacts_shadow_1780312223092.png',
    caption: 'Acoustic Shadowing vs Enhancement: Highly reflective hard targets cast dark distal paths, while fluid cysts transmit energy to create distal hyper-intensity.',
    alt: 'Medical illustration demonstrating shadowing behind calcifications and enhancement behind simple cysts.'
  },
  '6-1': {
    src: '/src/assets/images/ultrasound_safety_alara_1780312243868.png',
    caption: 'Thermal Indices (TI): Calibration model tracking localized tissue temperature rises from sound-beam power accumulation.',
    alt: 'Safety warning dashboard modeling safe diagnostic power output indices.'
  },
  '6-2': {
    src: '/src/assets/images/acoustic_cavitation_1780802894792.png',
    caption: 'Cavitation Energy Risk: Distinguishes stable bubble oscillation from transient bubble implosion under 높은 Mechanical Index (MI > 1.0) acoustics.',
    alt: 'Scientific medical illustration of stable versus transient pressure wave cavitation.'
  },
  '7-1': {
    src: '/src/assets/images/hemodynamics_profile_1780802907527.png',
    caption: 'Arterial Flow Hemodynamics: Distributes parabolic, laminar, and turbulent velocities through cardiac cycles.',
    alt: 'Arterial flow profile diagram showing velocity distributions across cardiac phases.'
  },
  '7-2': {
    src: '/src/assets/images/poiseuille_law_1780802919241.png',
    caption: 'Poiseuille Law Flow Dynamics: Fluid resistance shifts exponentially as the fourth power of vessel lumen radius.',
    alt: 'Mathematical fluid flow diagram showing stenosis resistance thresholds.'
  },
  '8-1': {
    src: '/src/assets/images/calibration_phantom_1780802931022.png',
    caption: 'Instrument Calibration Range: Evaluating transducer dead zones, vertical calipers, and spatial resolution metrics.',
    alt: 'Industrial diagram of a diagnostic ultrasound sensor stack calibration.'
  }
};

export default function LessonVisuals({ lessonId, isSedaris }: LessonVisualsProps) {
  // Normalize ID (e.g. "l1-1" or "s1-1" becomes "1-1")
  const key = lessonId.replace(/^[ls]/, '');
  const activeStatic = STATIC_ILLUSTRATIONS[key];

  // Theme Settings
  const accentColor = isSedaris ? 'text-violet-400' : 'text-amber-500';
  const borderTheme = isSedaris ? 'border-violet-500/20' : 'border-amber-500/20';
  const bgThemeLight = isSedaris ? 'bg-violet-500/5' : 'bg-amber-500/5';
  const btnTheme = isSedaris ? 'bg-violet-500 hover:bg-violet-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-black';
  const sliderTheme = isSedaris ? 'accent-violet-500' : 'accent-amber-500';

  // State managers for various interactive dynamic widgets
  const [isPlaying, setIsPlaying] = useState(true);

  // Widget 1-1 states
  const [compressionFactor, setCompressionFactor] = useState(60);
  const [propSpeed, setPropSpeed] = useState(1540);

  // Widget 1-2 states
  const [depthValue, setDepthValue] = useState(5);
  const [showResolutions, setShowResolutions] = useState(true);

  // Widget 2-1 states
  const [matchingLayerMaterial, setMatchingLayerMaterial] = useState<'none' | 'acrylic' | 'optimal' | 'gel'>('optimal');

  // Widget 2-2 states
  const [steeringAngle, setSteeringAngle] = useState(15);

  // Widget 3-1 states
  const [ruleDepth, setRuleDepth] = useState(4);
  const [echoFired, setEchoFired] = useState(false);
  const [echoTime, setEchoTime] = useState(0);

  // Widget 4-1 states
  const [insonAngle, setInsonAngle] = useState(45);
  const [bloodVelocity, setBloodVelocity] = useState(80);

  // Widget 5-1 states
  const [activeArtifact, setActiveArtifact] = useState<'reverb' | 'comet' | 'mirror'>('reverb');

  // Widget 5-2 states
  const [tissueTarget, setTissueTarget] = useState<'cyst' | 'stone' | 'refraction'>('stone');

  // Widget 6-1 states
  const [powerOutput, setPowerOutput] = useState(40);
  const [dopplerModeOn, setDopplerModeOn] = useState(false);

  // Widget 6-2 states
  const [mechanicalIndexVal, setMechanicalIndexVal] = useState(0.8);

  // Widget 7-1 states
  const [vesselStenosisLevel, setVesselStenosisLevel] = useState('healthy');

  // Widget 7-2 states
  const [calcRadiusPercent, setCalcRadiusPercent] = useState(70);

  // Widget 8-1 states
  const [caliperDeadZone, setCaliperDeadZone] = useState(1.8);

  // Widget 4-2 states (Doppler Modalities)
  const [dopplerMode, setDopplerMode] = useState<'pw' | 'cw' | 'color' | 'power'>('pw');
  const [gateDepth, setGateDepth] = useState(6); // cm
  const [aliasingPrf, setAliasingPrf] = useState(4); // kHz

  // Widget 8-2 states (Doppler Phantom moving belt)
  const [phantomSpeed, setPhantomSpeed] = useState(30); // cm/s
  const [phantomAngle, setPhantomAngle] = useState(45); // degrees
  const [dopplerAngleCorrection, setDopplerAngleCorrection] = useState(45); // degrees

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const waveCycleRef = useRef(0);

  // Loop Render for animations in Interactive SVG or Canvas
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const render = () => {
      waveCycleRef.current += (propSpeed / 1540) * 0.05;
      ctx.clearRect(0, 0, width, height);

      // Rendering logic based on active section key
      if (key === '1-1') {
        // Draw compression/rarefaction particles
        ctx.fillStyle = '#0a0b10';
        ctx.fillRect(0, 0, width, height);

        // draw background grid
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 20) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }

        // draw particle nodes
        const particleCount = 280;
        const wavelengthPixels = 120;
        const amp = compressionFactor * 0.25;

        ctx.fillStyle = isSedaris ? 'rgba(167, 139, 250, 0.75)' : 'rgba(245, 158, 11, 0.75)';
        for (let idx = 0; idx < particleCount; idx++) {
          const baseIndex = idx * (width / particleCount);
          // Wave phase displacement
          const phase = (baseIndex / wavelengthPixels) - waveCycleRef.current;
          const shift = Math.sin(phase * Math.PI * 2) * amp;
          const px = baseIndex + shift;

          // Scatter slightly on Y axis for scatter grid representation
          const randomYSeed = (idx * 179) % (height - 20) + 10;
          ctx.beginPath();
          ctx.arc(px, randomYSeed, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Overlay text guides for node fields of dense vs sparse
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('COMPRESSION NODES (HIGH RISE)', 15, 20);
        ctx.fillText('RAREFACTION GAPS (EXPANSION)', 15, height - 15);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [key, isPlaying, compressionFactor, propSpeed, isSedaris]);

  // 13us rule countdown effect
  useEffect(() => {
    if (!echoFired) return;
    const speedRatio = 1540 / 1540; // baseline standard
    const targetMicroseconds = 13 * ruleDepth * speedRatio;
    setEchoTime(0);

    const interval = setInterval(() => {
      setEchoTime(prev => {
        if (prev >= targetMicroseconds) {
          clearInterval(interval);
          setEchoFired(false);
          return targetMicroseconds;
        }
        return prev + 1.5;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [echoFired, ruleDepth]);

  // Calculates Impedance Reflected fraction
  const getImpedanceStats = () => {
    const zPZT = 30.0;
    const zSkin = 1.6;
    let zMatch = 30.0;
    
    if (matchingLayerMaterial === 'acrylic') zMatch = 15.0;
    if (matchingLayerMaterial === 'optimal') zMatch = 6.9; // geometric mean (sqrt(30 * 1.6))
    if (matchingLayerMaterial === 'gel') zMatch = 1.65;

    // Multi-boundary reflections estimate
    // Reflection R = ((Z2 - Z1)/(Z2 + Z1))^2
    const r1 = Math.pow((zMatch - zPZT) / (zMatch + zPZT), 2);
    const r2 = Math.pow((zSkin - zMatch) / (zSkin + zMatch), 2);
    const transmissionEfficiency = (1 - r1) * (1 - r2) * 100;
    const reflectedEnergy = 100 - transmissionEfficiency;

    return {
      reflected: reflectedEnergy.toFixed(1),
      transmitted: transmissionEfficiency.toFixed(1),
      label: matchingLayerMaterial === 'optimal' ? 'Perfect Bridge (1/4λ)' : 
             matchingLayerMaterial === 'gel' ? 'Impedance Match Gel' : 
             matchingLayerMaterial === 'acrylic' ? 'Sub-optimal Compound' : 'Unmatched Raw Interface'
    };
  };

  return (
    <div className="mt-8 mb-12 space-y-8" id={`lesson-visuals-${key}`}>
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Activity className={accentColor} size={20} />
        <h3 className="text-md font-serif font-black text-white uppercase tracking-wider">
          Diagnostic Visuals & Interactive Laboratory
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Highly detailed Clinical Illustration (Generated) */}
        {activeStatic ? (
          <div className="bg-[#101216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-white/5 bg-[#14161c] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} className={accentColor} /> High-Fidelity Physics Render
              </span>
              <span className="text-[10px] font-mono text-[#00d1ff] bg-[#00d1ff]/10 px-2.5 py-0.5 rounded-full">
                Asset Active
              </span>
            </div>
            
            <div className="p-4 flex-1 flex items-center justify-center bg-[#07080b]">
              <img 
                src={activeStatic.src} 
                alt={activeStatic.alt} 
                referrerPolicy="no-referrer"
                className="rounded-xl w-full max-h-[240px] object-cover border border-white/5 shadow-inner"
              />
            </div>
            
            <div className="p-5 bg-[#0e1014] border-t border-white/5">
              <p className="text-xs text-[#8e9299] leading-relaxed italic">
                <strong className="text-white not-italic font-sans uppercase text-[10px] tracking-wide block mb-1">
                  Clinical Overview:
                </strong>
                {activeStatic.caption}
              </p>
            </div>
          </div>
        ) : (key === '4-2' || key === '8-2') ? (
          <div className="bg-[#101216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-white/5 bg-[#14161c] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Sparkles size={12} className={accentColor} /> High-Fidelity Physics Render
              </span>
              <span className="text-[10px] font-mono text-[#00d1ff] bg-[#00d1ff]/10 px-2.5 py-0.5 rounded-full">
                Interactive SVG Active
              </span>
            </div>
            
            <div className="p-4 flex-1 flex flex-col justify-center bg-[#07080b] min-h-[240px] items-center relative">
              {key === '4-2' ? (
                <svg viewBox="0 0 400 220" className="w-full h-full max-h-[220px]">
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" rx="10" />

                  <line x1="10" y1="50" x2="390" y2="50" stroke="#8e9299" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="330" y="42" fill="#8e9299" className="text-[9px] font-mono">SKIN LINE</text>

                  {dopplerMode === 'cw' && (
                    <>
                      <rect x="150" y="10" width="40" height="25" rx="2" fill="#1f2937" stroke="#10b981" strokeWidth="1.5" />
                      <text x="170" y="25" textAnchor="middle" fill="#10b981" className="text-[9px] font-bold font-mono">TX</text>
                      <rect x="210" y="10" width="40" height="25" rx="2" fill="#1f2937" stroke="#3b82f6" strokeWidth="1.5" />
                      <text x="230" y="25" textAnchor="middle" fill="#3b82f6" className="text-[9px] font-bold font-mono">RX</text>

                      <polygon points="170,35 110,210 210,210" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.2)" strokeDasharray="2 2" />
                      <polygon points="230,35 190,210 290,210" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(59, 130, 246, 0.2)" strokeDasharray="2 2" />

                      <polygon points="200,80 180,123 220,123" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="1" />
                      <text x="200" y="110" textAnchor="middle" fill="#ef4444" className="text-[9px] font-bold font-mono animate-pulse">RANGE AMBIGUITY ZONE</text>
                      <circle cx="200" cy="115" r="4" fill="#ef4444" />

                      <text x="15" y="185" fill="#8e9299" className="text-[8px] font-mono">CW mode: Continuous transmission</text>
                      <text x="15" y="200" fill="#8e9299" className="text-[8px] font-mono">Unbound high velocity, but no range gating</text>
                    </>
                  )}

                  {dopplerMode === 'pw' && (
                    <>
                      <rect x="175" y="10" width="50" height="25" rx="2" fill="#1f2937" stroke="#fbbf24" strokeWidth="1.5" />
                      <text x="200" y="25" textAnchor="middle" fill="#fbbf24" className="text-[9px] font-bold font-mono">TX / RX</text>

                      <polygon points="200,35 150,210 250,210" fill="rgba(251, 191, 36, 0.05)" stroke="rgba(251, 191, 36, 0.15)" />

                      {(() => {
                        const gateY = 50 + (gateDepth - 3) * (140 / 7);
                        return (
                          <g>
                            <rect x="180" y={gateY - 6} width="40" height="12" rx="1" fill="rgba(0, 191, 255, 0.15)" stroke="#00d1ff" strokeWidth="1.5" strokeDasharray="3 1" />
                            <text x="230" y={gateY + 4} fill="#00d1ff" className="text-[9px] font-bold font-mono">Gate Box ({gateDepth} cm)</text>
                            <path d={`M 190 ${gateY - 20} Q 200 ${gateY - 15} 210 ${gateY - 20} T 220 ${gateY - 20}`} fill="none" stroke="#fbbf24" strokeWidth="2.5" className="animate-pulse" />
                            <text x="15" y="185" fill="#8e9299" className="text-[8px] font-mono">PW mode: Alternates pulses to resolve depth</text>
                            <text x="15" y="200" fill="#8e9299" className="text-[8px] font-mono">Calculates distance via roundtrip flight time</text>
                            {aliasingPrf < 4 && (
                              <text x="15" y="212" fill="#ff453a" className="text-[8px] font-bold font-mono">⚠️ LOW Nyquist Limit: Signal wrapper risk!</text>
                            )}
                          </g>
                        );
                      })()}
                    </>
                  )}

                  {dopplerMode === 'color' && (
                    <>
                      <rect x="175" y="10" width="50" height="25" rx="2" fill="#1f2937" stroke="#ec4899" strokeWidth="1.5" />
                      <text x="200" y="25" textAnchor="middle" fill="#ec4899" className="text-[9px] font-bold font-mono">COLOR SCAN</text>

                      <polygon points="200,35 100,210 300,210" fill="none" stroke="rgba(236, 72, 153, 0.15)" />

                      <rect x="50" y="110" width="300" height="40" rx="4" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.08)" />
                      
                      <g>
                        <path d="M 80 130 L 320 130" stroke="rgba(255,255,255,0.15)" strokeWidth="4" strokeDasharray="5 5" />
                        
                        <circle cx="120" cy="130" r="10" fill="rgba(239, 68, 68, 0.7)" stroke="#f87171" strokeWidth="1" />
                        <text x="120" y="133" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-bold font-mono">TOWARD</text>

                        <line x1="200" y1="35" x2="200" y2="210" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                        <circle cx="200" cy="130" r="9" fill="#111827" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="194" y="133" fill="#ffffff" className="text-[7.5px] font-mono">90°</text>

                        <circle cx="280" cy="130" r="10" fill="rgba(59, 130, 246, 0.7)" stroke="#60a5fa" strokeWidth="1" />
                        <text x="280" y="133" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-bold font-mono">AWAY</text>

                        <text x="15" y="190" fill="#ec4899" className="text-[8.5px] font-bold font-mono">BART: Blue Away, Red Toward</text>
                        <text x="15" y="202" fill="#8e9299" className="text-[8px] font-mono">Gives full spatial mapping of flow parameters</text>
                      </g>
                    </>
                  )}

                  {dopplerMode === 'power' && (
                    <>
                      <rect x="175" y="10" width="50" height="25" rx="2" fill="#1f2937" stroke="#f59e0b" strokeWidth="1.5" />
                      <text x="200" y="25" textAnchor="middle" fill="#f59e0b" className="text-[9px] font-bold font-mono">POWER MAP</text>

                      <rect x="50" y="110" width="300" height="50" rx="6" fill="rgba(245, 158, 11, 0.03)" stroke="rgba(245, 158, 11, 0.1)" />

                      <g>
                        <circle cx="100" cy="135" r="14" fill="rgba(245, 158, 11, 0.35)" />
                        <circle cx="140" cy="135" r="15" fill="rgba(245, 158, 11, 0.45)" />
                        <circle cx="180" cy="135" r="16" fill="rgba(245, 158, 11, 0.55)" />
                        <circle cx="220" cy="135" r="16" fill="rgba(245, 158, 11, 0.55)" />
                        <circle cx="260" cy="135" r="15" fill="rgba(245, 158, 11, 0.45)" />
                        <circle cx="300" cy="135" r="14" fill="rgba(245, 158, 11, 0.35)" />

                        <path d="M 80 135 H 320" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                        <text x="200" y="139" textAnchor="middle" fill="#ffffff" className="text-[9px] font-black font-mono">AMPLITUDE ONLY (NO DIRECTION)</text>
                        <text x="15" y="190" fill="#f59e0b" className="text-[8.5px] font-mono">Power mode tracks echo amplitude for superb slow-flow counts</text>
                        <text x="15" y="202" fill="#8e9299" className="text-[8px] font-mono">No aliasing possible, completely direction blind</text>
                      </g>
                    </>
                  )}
                </svg>
              ) : (
                <svg viewBox="0 0 400 220" className="w-full h-full max-h-[220px]">
                  <defs>
                    <pattern id="gridPattern82" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern82)" rx="10" />

                  <rect x="20" y="60" width="360" height="150" rx="6" fill="rgba(245, 158, 11, 0.02)" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1.5" />
                  <text x="30" y="75" fill="rgba(245, 158, 11, 0.45)" className="text-[8px] font-mono tracking-widest font-bold">DOPPLER PHANTOM (MOVING PLATFORM)</text>

                  <rect x="20" y="140" width="360" height="26" rx="2" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255,255,255,0.06)" />
                  <line x1="20" y1="153" x2="380" y2="153" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeDasharray="10 5" />

                  <path d="M 220 153 L 260 153" stroke="#ffd700" strokeWidth="2.5" />
                  <polygon points="260,149 268,153 260,157" fill="#ffd700" />
                  <text x="210" y="174" fill="#ffd700" className="text-[8.5px] font-mono font-bold">Flow Belt Speed: {phantomSpeed} cm/s</text>

                  {(() => {
                    const rad = (phantomAngle * Math.PI) / 180;
                    const beamLength = 80; 
                    const txX = 200 - beamLength * Math.cos(rad);
                    const txY = 153 - beamLength * Math.sin(rad);
                    const txRotation = 180 - phantomAngle;
                    const isCorrectlyAligned = phantomAngle === dopplerAngleCorrection;

                    return (
                      <g>
                        <line x1={txX} y1={txY} x2={200} y2={153} stroke="#00d1ff" strokeWidth="2" strokeDasharray="3 2" className="animate-pulse" />
                        
                        <g transform={`translate(${txX}, ${txY}) rotate(${txRotation})`}>
                          <rect x="-12" y="-24" width="24" height="24" rx="2" fill="#1f2937" stroke="#8e9299" strokeWidth="1" />
                          <rect x="-8" y="-3" width="16" height="5" fill="#00d1ff" />
                        </g>

                        <circle cx="200" cy="153" r="3" fill="#00d1ff" />
                        <path d={`M ${200 - 25} 153 A 25 25 0 0 1 ${200 - 25 * Math.cos(rad)} ${153 - 25 * Math.sin(rad)}`} fill="none" stroke="#00d1ff" strokeWidth="1.5" />
                        <text x="145" y="142" fill="#00d1ff" className="text-[8.5px] font-bold font-mono">θ = {phantomAngle}°</text>

                        {phantomAngle !== 90 && (
                          <g>
                            <line 
                              x1={200 - 45 * Math.cos(dopplerAngleCorrection * Math.PI / 180)} 
                              y1={153 - 45 * Math.sin(dopplerAngleCorrection * Math.PI / 180)} 
                              x2={200 + 45 * Math.cos(dopplerAngleCorrection * Math.PI / 180)} 
                              y2={153} 
                              stroke={isCorrectlyAligned ? '#10b981' : '#ff453a'} 
                              strokeWidth="1.5" 
                              strokeDasharray="3 2" 
                            />
                            <text 
                              x="220" 
                              y="125" 
                              fill={isCorrectlyAligned ? '#10b981' : '#ff453a'} 
                              className="text-[8.5px] font-bold font-mono"
                            >
                              {isCorrectlyAligned ? '✓ Cursor Aligned' : '⚠️ Misaligned'}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>
            
            <div className="p-5 bg-[#0e1014] border-t border-white/5">
              <p className="text-xs text-[#8e9299] leading-relaxed italic">
                <strong className="text-white not-italic font-sans uppercase text-[10px] tracking-wide block mb-1">
                  Clinical Overview:
                </strong>
                {key === '4-2' 
                  ? 'Comparative Doppler Scopes: Demonstrating continuous wave range chaos, pulsed wave gating capabilities, BART color mapping direction shifts, and power mode amplitude intensity tracing.'
                  : 'Qualitative Calibration: Verifying actual velocity outputs against insonation angle cosine calculation corrections on the QA phantom flow line.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#101216] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-center items-center text-center space-y-4">
            <div className={`p-4 rounded-full ${bgThemeLight} ${accentColor}`}>
              <Eye size={36} />
            </div>
            <div>
              <h4 className="text-white font-serif font-bold text-lg mb-1">Core Clinical Concept</h4>
              <p className="text-xs text-[#8e9299] max-w-sm">
                This lesson is backed by our real-time interactive physics simulator to the right. Use the controls to test boundary cases.
              </p>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Highly Interactive Dynamic SVGs / Canvases */}
        <div className="bg-[#101216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="p-4 border-b border-white/5 bg-[#14161c] flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono text-white uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Sliders size={12} className={accentColor} /> Physical Parameter Laboratory
            </span>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 transition-all text-[#8e9299] hover:text-white"
                title={isPlaying ? "Pause physics" : "Resume physics"}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 bg-[#090b0e] flex flex-col justify-center min-h-[220px]">
            {/* Conditional renders of interactive laboratory templates */}
            
            {key === '1-1' && (
              <div className="space-y-4 w-full">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={130} 
                  className="w-full h-[130px] rounded-xl border border-white/10 bg-black cursor-crosshair shadow-inner"
                />
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299] flex items-center gap-1.5"><Sliders size={12} /> Compression Density</span>
                    <span className="text-white font-mono font-bold">{compressionFactor}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={compressionFactor} 
                    onChange={e => setCompressionFactor(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#8e9299]">
                    <span>Standard Gas (Loose)</span>
                    <span>High Acoustic Excitation (Dense)</span>
                  </div>
                </div>
              </div>
            )}

            {key === '1-2' && (
              <div className="space-y-4 w-full">
                {/* 5 vs 10 MHz decay widget */}
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="h-2 rounded bg-white/5 relative overflow-hidden">
                    <div 
                      className="absolute left-0 h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.max(10, 100 - depthValue * 7)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs items-center font-mono">
                    <span className="text-amber-400">5 MHz Signal Strength</span>
                    <span>{Math.max(10, 100 - depthValue * 7).toFixed(0)}% (Deep Penetration)</span>
                  </div>

                  <div className="h-2 rounded bg-white/5 relative overflow-hidden">
                    <div 
                      className="absolute left-0 h-full bg-violet-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - depthValue * 17)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs items-center font-mono">
                    <span className="text-violet-400">10 MHz Signal Strength</span>
                    <span>{Math.max(0, 100 - depthValue * 17).toFixed(0)}% (Heavy Attenuation)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Adjust Insonation Depth</span>
                    <span className="text-white font-mono font-bold">{depthValue} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={depthValue} 
                    onChange={e => setDepthValue(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex gap-2 text-[11px] text-[#8e9299] shrink-0">
                  <Info size={14} className={accentColor} />
                  <span>
                    At {depthValue} cm, standard 10 MHz wave power decays dramatically compared to the 5 MHz sound wave due to absorption and scattering.
                  </span>
                </div>
              </div>
            )}

            {key === '2-1' && (
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setMatchingLayerMaterial('none')}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${matchingLayerMaterial === 'none' ? 'border-[#ff453a] bg-[#ff453a]/10 text-[#ff453a]' : 'border-white/5 hover:border-white/10 text-[#8e9299]'}`}
                  >
                    No Match Layer
                    <span className="block text-[9px] opacity-75">30.0 MRayls &rarr; 1.6 MRayls</span>
                  </button>
                  <button 
                    onClick={() => setMatchingLayerMaterial('acrylic')}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${matchingLayerMaterial === 'acrylic' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/5 hover:border-white/10 text-[#8e9299]'}`}
                  >
                    Acrylic (15 MRayls)
                    <span className="block text-[9px] opacity-75">Intermediate Mismatch</span>
                  </button>
                  <button 
                    onClick={() => setMatchingLayerMaterial('optimal')}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${matchingLayerMaterial === 'optimal' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/5 hover:border-white/10 text-[#8e9299]'}`}
                  >
                    Optimal Polymer (6.9)
                    <span className="block text-[9px] opacity-75">Geometric Mean (1/4λ)</span>
                  </button>
                  <button 
                    onClick={() => setMatchingLayerMaterial('gel')}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${matchingLayerMaterial === 'gel' ? 'border-[#00d1ff] bg-[#00d1ff]/10 text-[#00d1ff]' : 'border-white/5 hover:border-white/10 text-[#8e9299]'}`}
                  >
                    Gel Coupler
                    <span className="block text-[9px] opacity-75">Acoustic Air Exclusion</span>
                  </button>
                </div>

                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl space-y-2 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 w-2 h-2 rounded bg-current" />
                  <span className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest block">Acoustic Interface Analysis</span>
                  <div className="text-2xl font-serif font-black text-white">{getImpedanceStats().transmitted}%</div>
                  <span className="text-xs text-[#8e9299] block">{getImpedanceStats().label} transmitted into tissue</span>
                  <div className="text-[10px] font-mono text-[#ff453a]">Reflected Loss: {getImpedanceStats().reflected}%</div>
                </div>
              </div>
            )}

            {key === '2-2' && (
              <div className="space-y-4 w-full">
                <div className="p-3 bg-[#0c0d12] rounded-xl border border-white/5 relative h-28 flex flex-col justify-center items-center overflow-hidden">
                  {/* Array timing delays visual map */}
                  <div className="flex gap-2 mb-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                      const delayFactor = Math.sin(steeringAngle * Math.PI / 180) * idx * 20;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full border border-white/15 flex items-center justify-center text-[8px] font-mono ${delayFactor > 0 ? 'bg-violet-500/10 text-violet-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            {idx + 1}
                          </div>
                          <div className="h-1 w-3 bg-white/20 rounded relative">
                            <div 
                              className="absolute bg-[#00d1ff] h-full"
                              style={{ 
                                width: '100%', 
                                top: `${Math.min(10, Math.max(-10, delayFactor))}px`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-white tracking-widest uppercase bg-white/5 px-3 py-1 rounded-full">
                      Beam Wavefront Tilt: {steeringAngle}°
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Steering Phasing Angle</span>
                    <span className="text-white font-mono font-bold">{steeringAngle}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-30" 
                    max="30" 
                    step="5"
                    value={steeringAngle} 
                    onChange={e => setSteeringAngle(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                </div>
              </div>
            )}

            {key === '3-1' && (
              <div className="space-y-4 w-full">
                <div className="flex text-xs justify-between font-mono bg-[#0c0d12] p-4 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[#8e9299] block font-sans">Acoustic Depth Target</span>
                    <span className="text-white text-lg font-bold">{ruleDepth} cm</span>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[#8e9299] block font-sans">Pulse Roundtrip Time</span>
                    <span className="text-[#00d1ff] text-lg font-bold">{(13 * ruleDepth).toFixed(0)} µs</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setEchoFired(true);
                    }}
                    disabled={echoFired}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono transition-all ${btnTheme} disabled:opacity-50`}
                  >
                    {echoFired ? `Acoustic Flight: ${echoTime.toFixed(1)} µs` : 'FIRE TRANSIT PULSE'}
                  </button>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={ruleDepth} 
                    onChange={e => setRuleDepth(parseInt(e.target.value))}
                    disabled={echoFired}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#8e9299]">
                    <span>Shallow boundary (13 µs)</span>
                    <span>Deep boundary (156 µs)</span>
                  </div>
                </div>
              </div>
            )}

            {key === '4-1' && (
              <div className="space-y-4 w-full">
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-[#8e9299] block">Cosine Factor (cos θ)</span>
                    <span className="text-md font-mono font-bold text-white">
                      {Math.cos(insonAngle * Math.PI / 180).toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8e9299] block">Measured Velocity</span>
                    <span className={`text-md font-mono font-bold ${insonAngle > 60 ? 'text-[#ff453a]' : 'text-green-400'}`}>
                      {(bloodVelocity * Math.cos(insonAngle * Math.PI / 180)).toFixed(1)} cm/s
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Angle of Insonation (θ)</span>
                    <span className="text-white font-mono font-bold">{insonAngle}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="90" 
                    step="5"
                    value={insonAngle} 
                    onChange={e => setInsonAngle(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#8e9299]">
                    <span>0° Max Shift</span>
                    <span>90° Zero Acoustic Signal</span>
                  </div>
                </div>

                {insonAngle > 60 && (
                  <div className="p-2.5 bg-[#ff453a]/10 rounded border border-[#ff453a]/30 text-[10px] text-[#ff453a] flex gap-2">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>Insonation angle exceeded 60°. Velocity calibrations are clinically unreliable because small angle discrepancies cause massive speed calculation errors.</span>
                  </div>
                )}
              </div>
            )}

            {key === '5-1' && (
              <div className="space-y-4 w-full">
                <div className="flex bg-[#0c0d10] p-1 rounded-xl border border-white/10 gap-1 w-full justify-between">
                  <button 
                    onClick={() => setActiveArtifact('reverb')}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all text-center cursor-pointer ${activeArtifact === 'reverb' ? 'bg-[#00d1ff] text-black' : 'text-[#8e9299] hover:text-white'}`}
                  >
                    Reverb
                  </button>
                  <button 
                    onClick={() => setActiveArtifact('comet')}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all text-center cursor-pointer ${activeArtifact === 'comet' ? 'bg-[#00d1ff] text-black' : 'text-[#8e9299] hover:text-white'}`}
                  >
                    Comet-Tail
                  </button>
                  <button 
                    onClick={() => setActiveArtifact('mirror')}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded transition-all text-center cursor-pointer ${activeArtifact === 'mirror' ? 'bg-[#00d1ff] text-black' : 'text-[#8e9299] hover:text-white'}`}
                  >
                    Mirror
                  </button>
                </div>

                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl min-h-[90px] flex flex-col justify-center text-xs">
                  {activeArtifact === 'reverb' && (
                    <p className="text-[#8e9299] leading-relaxed">
                      <strong className="text-white block mb-1">Reverberation Blueprint:</strong>
                      Sound bounces repeatingly between two strong parallel specular targets. The processor plots these delayed reflections down the center vector as evenly spaced, increasingly dim horizontal lines.
                    </p>
                  )}
                  {activeArtifact === 'comet' && (
                    <p className="text-[#8e9299] leading-relaxed">
                      <strong className="text-white block mb-1">Resonating Comet Tail:</strong>
                      High-frequency sound hits tiny metallic metallic/biliary stones, causing internal micro-bounces that ring endlessly. Recreates a solid, bright vertical acoustic tail downward on screen.
                    </p>
                  )}
                  {activeArtifact === 'mirror' && (
                    <p className="text-[#8e9299] leading-relaxed">
                      <strong className="text-white block mb-1">Specular Mirror Detour:</strong>
                      The pulse bounces off the bright diaphragm wall first, hits a lesion, and returns along the same path. The scanner assumes a straight flight line, plotting a false mirror object deep inside the thoracic chest cavity.
                    </p>
                  )}
                </div>
              </div>
            )}

            {key === '5-2' && (
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-3 gap-1">
                  {['cyst', 'stone', 'refraction'].map((opt) => (
                    <button 
                      key={opt}
                      onClick={() => setTissueTarget(opt as any)}
                      className={`py-1.5 rounded text-[11px] font-bold capitalize transition-all ${tissueTarget === opt ? 'bg-amber-500 text-black' : 'bg-white/5 text-[#8e9299] hover:text-white'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl text-center space-y-2">
                  <span className="text-[9px] font-mono text-[#8e9299] uppercase tracking-widest block">Acoustic Projection Mode</span>
                  {tissueTarget === 'cyst' && (
                    <div className="space-y-1">
                      <div className="text-md font-bold text-green-400">Post-Cystic Enhancement</div>
                      <p className="text-[11px] text-[#8e9299] leading-relaxed">
                        A fluid-filled cyst causes virtually zero sound attenuation. Sound leaving the back of the cyst is extremely energetic, making deep tissues illuminate with high brightness on the display monitor.
                      </p>
                    </div>
                  )}
                  {tissueTarget === 'stone' && (
                    <div className="space-y-1">
                      <div className="text-md font-bold text-amber-500">Posterior Acoustic Shadowing</div>
                      <p className="text-[11px] text-[#8e9299] leading-relaxed">
                        A calcium gallstone attenuates and reflects 100% of the forward beam. This blocks all acoustic energy downstream, plunging the space behind the stone into a thick diagnostic black shadow.
                      </p>
                    </div>
                  )}
                  {tissueTarget === 'refraction' && (
                    <div className="space-y-1">
                      <div className="text-md font-bold text-violet-400">Edge Bending Refraction Shadow</div>
                      <p className="text-[11px] text-[#8e9299] leading-relaxed">
                        Sound meets curved cyst margins at sharp angles. The change in acoustic speed bends the sound path away (refraction), spraying acoustic voids (thin edge shadows) downward from the poles.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {key === '6-1' && (
              <div className="space-y-4 w-full">
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-[#8e9299] block font-sans">Power Output Metric</span>
                    <span className="text-lg font-mono font-bold text-white">{powerOutput}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8e9299] block font-sans">Thermal Index (TI)</span>
                    <span className={`text-lg font-mono font-bold ${powerOutput > 70 ? 'text-[#ff453a]' : 'text-cyan-400'}`}>
                      {(powerOutput * 0.03 + (dopplerModeOn ? 1.4 : 0)).toFixed(1)}°C Estimate
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Acoustic Amplitude Power</span>
                    <span className="text-white font-mono font-bold">{powerOutput}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={powerOutput} 
                    onChange={e => setPowerOutput(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#8e9299]">Continuous Spectral Doppler</span>
                    <input 
                      type="checkbox" 
                      checked={dopplerModeOn} 
                      onChange={e => setDopplerModeOn(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {key === '6-2' && (
              <div className="space-y-4 w-full">
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl space-y-2 text-center">
                  <span className="text-[10px] text-[#8e9299] uppercase font-mono tracking-widest block">Microbubble Field State</span>
                  <div className="text-2xl font-black text-white">MI: {mechanicalIndexVal.toFixed(1)}</div>
                  <span className={`text-xs font-mono font-bold ${mechanicalIndexVal > 1.0 ? 'text-[#ff453a]' : 'text-green-400'}`}>
                    {mechanicalIndexVal > 1.0 ? 'IMPLOSION: TRANSIENT CAVITATION' : 'SAFE: STABLE HARMONIC OSCILLATION'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Transducer Pressure Wave Peak (MI)</span>
                    <span className="text-white font-mono font-bold">{mechanicalIndexVal.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="1.9" 
                    step="0.1"
                    value={mechanicalIndexVal} 
                    onChange={e => setMechanicalIndexVal(parseFloat(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                </div>
              </div>
            )}

            {key === '7-1' && (
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setVesselStenosisLevel('healthy')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${vesselStenosisLevel === 'healthy' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/5 text-[#8e9299]'}`}
                  >
                    Low Resistance Renal
                  </button>
                  <button 
                    onClick={() => setVesselStenosisLevel('severestenosis')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${vesselStenosisLevel === 'severestenosis' ? 'border-[#ff453a] bg-[#ff453a]/10 text-[#ff453a]' : 'border-white/5 text-[#8e9299]'}`}
                  >
                    Stenotic Renovascular
                  </button>
                </div>

                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-[#8e9299] uppercase font-mono block">Resistance Metrics</span>
                  {vesselStenosisLevel === 'healthy' ? (
                    <div>
                      <div className="text-lg font-bold text-green-400">RI = 0.58 (Low Resistance)</div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                        Organ displays continuous, abundant flow during cardiac diastole. Essential for critical perfusion beds like brain and kidney kidneys.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold text-[#ff453a]">RI = 0.89 (Severe Pathological Resist)</div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                        Extremely sharp spike with flat-to-absent end-diastolic runout. High resistive vascular beds downstream choke off residual flow.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {key === '7-2' && (
              <div className="space-y-4 w-full">
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-[#8e9299] block font-sans">Poiseuille Resistance</span>
                    <span className="text-md font-mono font-bold text-white">
                      {Math.pow(1 / (calcRadiusPercent / 100), 4).toFixed(1)}x Normal
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8e9299] block font-sans">Bernoulli Drop (4v²)</span>
                    <span className="text-md font-mono font-bold text-orange-400">
                      {(4 * Math.pow(2 / (calcRadiusPercent / 100), 2)).toFixed(1)} mmHg
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Vessel Open Path Radius (%)</span>
                    <span className="text-white font-mono font-bold">{calcRadiusPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="100" 
                    step="5"
                    value={calcRadiusPercent} 
                    onChange={e => setCalcRadiusPercent(parseInt(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#8e9299]">
                    <span>Extremely Narrowed</span>
                    <span>100% Fully Patent</span>
                  </div>
                </div>
              </div>
            )}

            {key === '8-1' && (
              <div className="space-y-4 w-full">
                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-[#8e9299] uppercase tracking-widest font-mono block">Caliper Calibration Mode</span>
                  <div className="text-xl font-bold text-[#00d1ff] font-mono">{caliperDeadZone.toFixed(2)} mm</div>
                  <span className="text-[10px] text-[#8e9299] block">Measured Dead Zone Range</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8e9299]">Adjust Caliper Slider</span>
                    <span className="text-white font-mono font-bold">{caliperDeadZone.toFixed(1)} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="4.0" 
                    step="0.1"
                    value={caliperDeadZone} 
                    onChange={e => setCaliperDeadZone(parseFloat(e.target.value))}
                    className={`w-full ${sliderTheme} cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] text-[#8e9299] font-mono">
                    <span>High Frequency Rod Resolv</span>
                    <span>Thick Acoustic Barrier Ringing</span>
                  </div>
                </div>
              </div>
            )}

            {key === '4-2' && (
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(['pw', 'cw', 'color', 'power'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setDopplerMode(mode)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold font-mono transition-all uppercase tracking-wider ${
                        dopplerMode === mode 
                          ? `${btnTheme} text-white border-transparent` 
                          : 'bg-white/5 border-white/10 text-[#8e9299] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {mode} Mode
                    </button>
                  ))}
                </div>

                <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-[#8e9299] uppercase tracking-widest font-mono block">Clinical Diagnostic Readout</span>
                  <div className="text-xs text-white leading-relaxed font-sans mt-1">
                    {dopplerMode === 'cw' && (
                      <span className="text-emerald-400 font-bold">Continuous Wave: Range ambiguity active. High speed velocity flow (up to 600 cm/s) resolved with zero limits (No Aliasing).</span>
                    )}
                    {dopplerMode === 'pw' && (
                      <span>
                        <span className="text-yellow-400 font-bold">Pulsed Wave Gate: </span> 
                        Depth gating set at {gateDepth} cm. Nyquist Limit is { (aliasingPrf / 2).toFixed(1) } kHz. Flow exceeding this will wrap around the spectrum!
                      </span>
                    )}
                    {dopplerMode === 'color' && (
                      <span className="text-pink-400 font-bold">Color Flow Scan: BART protocol (Blue Away, Red Toward). Real-time frequency shift maps spatial blood vessels visually.</span>
                    )}
                    {dopplerMode === 'power' && (
                      <span className="text-amber-500 font-bold font-mono">Power Doppler: Energy / Amplitude tracking only. Exquisite microbubble vascular perfusion without direction indicators.</span>
                    )}
                  </div>
                </div>

                {dopplerMode === 'pw' && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#8e9299]">Sample Volume Gate Depth</span>
                        <span className="text-white font-mono font-bold">{gateDepth} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="3" 
                        max="10" 
                        step="1"
                        value={gateDepth} 
                        onChange={e => setGateDepth(parseInt(e.target.value))}
                        className={`w-full ${sliderTheme} cursor-pointer`}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#8e9299]">Pulse Repetition Frequency (PRF)</span>
                        <span className="text-white font-mono font-bold">{aliasingPrf} kHz</span>
                      </div>
                      <input 
                        type="range" 
                        min="2" 
                        max="8" 
                        step="1"
                        value={aliasingPrf} 
                        onChange={e => setAliasingPrf(parseInt(e.target.value))}
                        className={`w-full ${sliderTheme} cursor-pointer`}
                      />
                      <div className="flex justify-between text-[10px] text-[#8e9299] font-mono">
                        <span>Low PRF (High Aliasing Risk)</span>
                        <span>High PRF (High Nyquist Limit)</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {key === '8-2' && (
              <div className="space-y-4 w-full">
                {(() => {
                  const rad = (phantomAngle * Math.PI) / 180;
                  const cosVal = Math.cos(rad);
                  const measuredNoCorr = phantomSpeed * cosVal;
                  const corrRad = (dopplerAngleCorrection * Math.PI) / 180;
                  const corrCos = Math.cos(corrRad);
                  const isPerfect = phantomAngle === dopplerAngleCorrection;
                  const safeCorrCos = Math.max(0.01, corrCos);
                  const measuredWithCorr = measuredNoCorr / safeCorrCos;
                  const isBlackout = phantomAngle === 90;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0c0d12] border border-white/5 p-3 rounded-xl text-center space-y-1">
                          <span className="text-[9px] text-[#8e9299] uppercase tracking-widest font-mono block">True Phantom Speed</span>
                          <div className="text-lg font-bold text-yellow-400 font-mono">{phantomSpeed} cm/s</div>
                        </div>
                        <div className="bg-[#0c0d12] border border-white/5 p-3 rounded-xl text-center space-y-1">
                          <span className="text-[9px] text-[#8e9299] uppercase tracking-widest font-mono block">System Measured Readout</span>
                          <div className={`text-lg font-bold font-mono ${isBlackout ? 'text-red-500 animate-pulse' : isPerfect ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {isBlackout ? '0.0 cm/s' : `${measuredWithCorr.toFixed(1)} cm/s`}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0c0d12] border border-white/5 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] text-[#8e9299] uppercase tracking-widest font-mono block">Cosine Geometry Math</span>
                        <div className="text-xs text-[#8e9299] font-mono leading-relaxed mt-1">
                          <div>Beam θ Cosine: cos({phantomAngle}°) = {cosVal.toFixed(3)}</div>
                          <div>Operator Correction: cos({dopplerAngleCorrection}°) = {corrCos.toFixed(3)}</div>
                          <div className="border-t border-[#ffffff]/5 pt-1 mt-1 text-white">
                            {isBlackout ? (
                              <span className="text-rose-400 font-bold font-sans">⚠️ 90° drop: complete academic blackout, zero Doppler shift!</span>
                            ) : isPerfect ? (
                              <span className="text-emerald-400 font-bold font-sans">✓ Perfect Match! Calibration error reduces to zero. Output reads {phantomSpeed} cm/s.</span>
                            ) : (
                              <span className="text-rose-400 font-bold font-sans">⚠️ Caliper Alignment Fault! Speed skew: {Math.abs(measuredWithCorr - phantomSpeed).toFixed(1)} cm/s!</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8e9299]">Physical Belt Speed</span>
                          <span className="text-white font-mono font-bold">{phantomSpeed} cm/s</span>
                        </div>
                        <input 
                          type="range" 
                          min="15" 
                          max="60" 
                          step="5"
                          value={phantomSpeed} 
                          onChange={e => setPhantomSpeed(parseInt(e.target.value))}
                          className={`w-full ${sliderTheme} cursor-pointer`}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8e9299]">Physical Insonation Angle (θ)</span>
                          <span className="text-white font-mono font-bold">{phantomAngle}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="90" 
                          step="15"
                          value={phantomAngle} 
                          onChange={e => setPhantomAngle(parseInt(e.target.value))}
                          className={`w-full ${sliderTheme} cursor-pointer`}
                        />
                        <div className="flex justify-between text-[9px] text-[#8e9299] font-mono">
                          <span>0° (Parallel)</span>
                          <span>90° (Perpendicular)</span>
                        </div>
                      </div>

                      {phantomAngle !== 90 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#8e9299]">Caliper Angle Correction (θ)</span>
                            <span className="text-[#00d1ff] font-mono font-bold">{dopplerAngleCorrection}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="80" 
                            step="5"
                            value={dopplerAngleCorrection} 
                            onChange={e => setDopplerAngleCorrection(parseInt(e.target.value))}
                            className={`w-full ${sliderTheme} cursor-pointer`}
                          />
                          <div className="flex justify-between text-[9px] text-[#8e9299] font-mono">
                            <span>0° Correction</span>
                            <span>80° Correction</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

          </div>

          <div className="p-4 bg-[#14161c] border-t border-white/5 flex gap-2 text-[10.5px] text-[#8e9299] items-center">
            <Info size={14} className={`${accentColor} shrink-0`} />
            <span className="font-mono">
               {key === '1-1' && 'Try shifting the Compression factor slider to raise wave frequency cycles.'}
               {key === '1-2' && 'Raise depth. Watch how higher frequencies decay significantly faster.'}
               {key === '2-1' && 'Optimal matching layer reduces acoustic mismatch reflections (R) to absolute minimum.'}
               {key === '2-2' && 'Slide array angle. The phased delays represent actual sub-microsecond voltage lags.'}
               {key === '3-1' && 'Firing sound at targets computes exact roundtrip flight (T) at 13 microseconds per cm.'}
               {key === '4-1' && 'Cosine factor calculates relative frequency shifts based on blood direction angles.'}
               {key === '4-2' && 'Toggle modes: PW targets depth gate settings, CW measures unlimited speed velocity profiles, BART colors spatial map direction.'}
               {key === '5-1' && 'Select different types of specular artifacts to see trace diagrams.'}
               {key === '5-2' && 'Adjust target type. Observe diagnostic acoustic shadows vs bright cystic enhancements.'}
               {key === '6-1' && 'Increasing power increases Thermal Index (TI) exposure. Keep as low as possible (ALARA).'}
               {key === '6-2' && 'High Mechanical Index (MI > 1.0) risks violent microbubble implosion (acoustic cavitation).'}
               {key === '7-1' && 'Compare waveforms to see systolic/diastolic ratios (RI).'}
               {key === '7-2' && 'Poiseuille 4th-power is why a tiny stenosis area creates massive resistance changes.'}
               {key === '8-1' && 'The unresolvable field at the top where crystal ringing makes objects invisible.'}
               {key === '8-2' && 'Adjust the steering angle and correction caliper to see how math errors distort real-time velocity calculations!'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
