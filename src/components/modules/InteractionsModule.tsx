import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Target, Zap, Waves, Activity, AlertTriangle, Play, HelpCircle } from 'lucide-react';

const INTERACTIONS = [
  { 
    id: 'specular', 
    name: 'Specular Reflection', 
    desc: 'Occurs when sound hits a large, smooth boundary relative to wavelength (e.g., Diaphragm, Vessel Wall). Reflections are highly direction-dependent in nature.',
    physics: 'Mirror-like behavior. Boundary size > Wavelength (λ). Angle of Incidence = Angle of Reflection (θi = θr). Check how oblique scans cause echoes to miss the probe!',
    icon: <Target size={18} />
  },
  { 
    id: 'scattering', 
    name: 'Scattering', 
    desc: 'Occurs when sound hits rough surfaces or small targets. Sound redirects in countless divergent directions, producing beneficial diffuse reflections.',
    physics: 'Diffuse redirection. Interface roughness ≈ Wavelength (λ). Creates the characteristic acoustic "speckle" texture of organ parenchyma.',
    icon: <Share2 size={18} />
  },
  { 
    id: 'rayleigh', 
    name: 'Rayleigh Scattering', 
    desc: 'Specialized scattering from targets much smaller than wavelength (e.g., Red Blood Cells). Redirects sound uniformly in all directions.',
    physics: "Omni-directional scattering. Boundary size << Wavelength (λ). Proportional to frequency to the fourth power (f⁴). Doubling frequency multiplies scattering by 16x!",
    icon: <Waves size={18} />
  },
  { 
    id: 'refraction', 
    name: 'Refraction', 
    desc: 'The bending of a sound beam as it crosses a boundary. Requires oblique incidence and mismatched propagation velocities between two media.',
    physics: "Snell's Law: sin(θ₁) / sin(θ₂) = c₁ / c₂. Shows Total Internal Reflection (TIR) when the critical angle is exceeded in fast-traveling media.",
    icon: <Zap size={18} />
  }
];

export default function InteractionsModule() {
  const [selected, setSelected] = useState(INTERACTIONS[0]);
  
  // Interactive Params
  const [incidentAngle, setIncidentAngle] = useState(30); // Specular & Refraction info
  const [specularSmoothness, setSpecularSmoothness] = useState(1.0); // Perfect mirror to rough
  const [scattererDensity, setScattererDensity] = useState(6); // Sub-wavelength elements
  const [c1, setC1] = useState(1450); // m/s (Fat / Medium 1)
  const [c2, setC2] = useState(1580); // m/s (Muscle / Medium 2)
  const [frequency, setFrequency] = useState(5.0); // MHz for Rayleigh and others
  const [rbcFlow, setRbcFlow] = useState(12); // Number of RBCs

  const frequencyRad = frequency;
  const rayleighMultiplier = Math.pow(frequency / 2.0, 4); // Base index at 2.0 MHz

  // Refraction calculation (Snell's Law):
  // sin(theta2) = sin(theta1) * (c2 / c1)
  const theta1Rad = (incidentAngle * Math.PI) / 180;
  const snellRatio = c2 / c1;
  const sinTheta2 = Math.sin(theta1Rad) * snellRatio;
  const isTIR = sinTheta2 > 1.0; // Total Internal Reflection
  const refractedAngle = isTIR ? 0 : Math.asin(sinTheta2) * (180 / Math.PI);

  // Specular signal return coefficient: returns strongest at perpendicular (0°)
  const signalReturnRatio = Math.max(0, Math.cos(theta1Rad) ** (8 * specularSmoothness));
  const signalReturnPercentage = Math.round(signalReturnRatio * 100);

  // Approximate wavelength
  const wavelength = 1.54 / frequency; // mm in average soft tissue

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      {/* Header section with interactive toggles */}
      <div className="flex justify-between items-start md:items-end flex-col md:flex-row border-b border-[#2d3139] pb-6 gap-6 relative z-10">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2 flex items-center gap-2">
            <Activity size={12} className="animate-pulse" /> Acoustic Boundary Dynamics
          </div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">
            Wave <span className="text-[#8e9299]">Interactions</span>
          </div>
        </div>
        
        {/* Horizontal tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {INTERACTIONS.map(type => (
            <button
              key={type.id}
              onClick={() => setSelected(type)}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center gap-1 sm:gap-2 flex-grow sm:flex-none w-auto sm:w-28 ${
                selected.id === type.id 
                  ? 'bg-[#00d1ff] text-black border-[#00d1ff] shadow-[0_0_20px_rgba(0,209,255,0.3)] font-bold' 
                  : 'border-[#2d3139] text-[#8e9299] hover:text-white hover:border-[#8e9299]'
              }`}
            >
              {type.icon}
              <span className="text-[8px] font-mono tracking-widest uppercase">{type.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="flex-1 grid grid-cols-12 gap-8 overflow-y-auto no-scrollbar pb-10 xl:pb-0">
        
        {/* Left Column: Wave Simulation Screen */}
        <div className="col-span-12 lg:col-span-8 bg-[#0c0d10] border-2 border-[#1a1c22] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl flex flex-col min-h-[460px] justify-between">
          <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
          
          <div className="flex justify-between items-center w-full relative z-20">
            <span className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest bg-[#00d1ff]/5 px-2.5 py-1 rounded border border-[#00d1ff]/10">
              INTERFACE_INTERACTION: {selected.name.toUpperCase()}
            </span>
            <span className="text-[9px] font-mono text-[#8e9299] hidden sm:block">
              Wavelength (λ) ≈ {wavelength.toFixed(3)} mm @ {frequency.toFixed(1)} MHz
            </span>
          </div>

          {/* Interactive Simulation Display Canvas Area */}
          <div className="my-6 relative flex items-center justify-center bg-black/45 border border-[#2d3139] rounded-2xl p-4 overflow-hidden h-[300px]">
            <div className="absolute inset-0 bg-[#00d1ff]/[0.02] pointer-events-none" />
            
            {/* 1. Specular Simulation */}
            {selected.id === 'specular' && (
              <svg className="w-full h-full min-h-[260px]" viewBox="0 0 500 260">
                <defs>
                  <linearGradient id="incidentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="reflectedGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffd700" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Normal normal dashed line */}
                <line x1="250" y1="20" x2="250" y2="180" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

                {/* Transducer Probe at top */}
                <g transform="translate(250, 20)">
                  <rect x="-60" y="-15" width="120" height="25" rx="4" fill="#16181d" stroke="#2d3139" strokeWidth="1.5" />
                  <rect x="-55" y="-10" width="110" height="8" rx="2" fill="#00d1ff" opacity="0.8" />
                  <text x="0" y="5" fill="#8e9299" fontSize="6px" fontFamily="monospace" textAnchor="middle">TRANSDUCER APERTURE</text>
                </g>

                {/* Large Smooth Specular Boundary */}
                <g transform="translate(250, 180)">
                  {/* Mirrors/Diaphragm visual representation */}
                  <rect x="-240" y="0" width="480" height="20" fill="url(#acousticBoundaryBg)" opacity="0.1" />
                  <line x1="-240" y1="0" x2="240" y2="0" stroke="#ffd700" strokeWidth="3" />
                  
                  {/* Subtle smoothness texture markers */}
                  {specularSmoothness < 0.8 && (
                    <path d="M-240,0 L240,0" stroke="#16181d" strokeWidth="2.5" strokeDasharray="3 5" opacity="0.7" />
                  )}
                  
                  <text x="-210" y="16" fill="#ffd700" fontSize="8px" fontFamily="monospace" opacity="0.8">LARGE DIAPHRAGM INTERFACE (&gt; λ)</text>
                </g>

                {/* Angle θi, θr calculations */}
                {/* Center point of reflection: cx = 250, cy = 180 */}
                {(() => {
                  const rad = (incidentAngle * Math.PI) / 180;
                  const dx = Math.sin(rad);
                  const dy = Math.cos(rad);
                  const beamLength = 160; // Distance to probe

                  const ix = 250 - beamLength * dx;
                  const iy = 180 - beamLength * dy;

                  const rx = 250 + beamLength * dx * (1 - (1 - specularSmoothness) * 0.1); 
                  const ry = 180 - beamLength * dy;

                  return (
                    <>
                      {/* Incident Ray */}
                      <line x1={ix} y1={iy} x2="250" y2="180" stroke="#00d1ff" strokeWidth="2.5" opacity="0.8" />
                      
                      {/* Interactive Incident Wavefront segments */}
                      {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                        const px = ix + (250 - ix) * ratio;
                        const py = iy + (180 - iy) * ratio;
                        // Orthogonal vector for wavefront segment
                        const wx = dy * 20;
                        const wy = -dx * 20;
                        return (
                          <motion.line
                            key={`inc-front-${i}`}
                            x1={px - wx}
                            y1={py - wy}
                            x2={px + wx}
                            y2={py + wy}
                            stroke="#00d1ff"
                            strokeWidth="1.5"
                            opacity={0.6}
                            animate={{
                              x: [-(dx * 30), (dx * 30)],
                              y: [-(dy * 30), (dy * 30)],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.35 }}
                          />
                        );
                      })}

                      {/* Reflected Ray direction */}
                      <line x1="250" y1="180" x2={rx} y2={ry} stroke="#ffd700" strokeWidth="2" strokeDasharray={specularSmoothness < 0.4 ? "3 3" : "none"} opacity={0.8} />

                      {/* Reflected Wavefront segments */}
                      {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                        const px = 250 + (rx - 250) * ratio;
                        const py = 180 + (ry - 180) * ratio;
                        // Orthogonal vector
                        const wx = dy * 20;
                        const wy = dx * 20;
                        return (
                          <motion.line
                            key={`ref-front-${i}`}
                            x1={px - wx}
                            y1={py - wy}
                            x2={px + wx}
                            y2={py + wy}
                            stroke="#ffd700"
                            strokeWidth="1.2"
                            opacity={0.5 * specularSmoothness} // diminishes with roughness
                            animate={{
                              x: [-(dx * 30), (dx * 30)],
                              y: [(dy * 30), -(dy * 30)],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.35 + 0.4 }}
                          />
                        );
                      })}

                      {/* Normal markers & labels */}
                      <path d={`M250,150 A30,30 0 0,0 ${250 - 30 * Math.sin(rad)},${180 - 30 * Math.cos(rad)}`} fill="none" stroke="#00d1ff" strokeWidth="1" />
                      <text x={240 - 15 * dx} y="145" fill="#00d1ff" fontSize="8px" fontFamily="monospace">θi = {incidentAngle}°</text>

                      <path d={`M250,150 A30,30 0 0,1 ${250 + 30 * Math.sin(rad)},${180 - 30 * Math.cos(rad)}`} fill="none" stroke="#ffd700" strokeWidth="1" />
                      <text x={260 + 15 * dx} y="145" fill="#ffd700" fontSize="8px" fontFamily="monospace">θr = {incidentAngle}°</text>
                      
                      {/* Aperture Catching helper box indicator */}
                      <g transform="translate(140, 245)">
                        <rect x="0" y="0" width="220" height="15" fill="#16181d" rx="4" stroke="#2d3139" />
                        <circle cx="10" cy="7" r="3" fill={signalReturnPercentage > 15 ? "#00d1ff" : "#ef4444"} />
                        <text x="20" y="11" fill="white" fontSize="7px" fontFamily="monospace">
                          ECHO RETURN RATE TO PROBE: {signalReturnPercentage}% {signalReturnPercentage < 20 ? "(OBLIQUE ANGLE LOSS)" : "(CAPTURED)"}
                        </text>
                      </g>
                    </>
                  );
                })()}
              </svg>
            )}

            {/* 2. Soft Tissue / Diffuse Scattering Simulation */}
            {selected.id === 'scattering' && (
              <svg className="w-full h-full min-h-[260px]" viewBox="0 0 500 260">
                {/* Horizontal main wavefront sweeping */}
                <line x1="120" y1="20" x2="120" y2="240" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.1" />

                {/* Left Transducer Sending Sound */}
                <path d="M5,100 L5,160" stroke="#00d1ff" strokeWidth="4" />
                <rect x="3" y="100" width="3" height="60" fill="#00d1ff" opacity="0.4" />
                <text x="12" y="132" fill="#00d1ff" fontSize="6px" fontFamily="monospace" transform="rotate(-90, 12, 132)">TRANSDUCER FACE</text>

                {/* Sweep lines of main incident pulse wave */}
                <motion.line
                  x1="20" y1="40" x2="20" y2="220"
                  stroke="#00d1ff" strokeWidth="2" opacity="0.6"
                  animate={{ x: [20, 240, 20] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />

                <motion.line
                  x1="60" y1="40" x2="60" y2="220"
                  stroke="#00d1ff" strokeWidth="1.5" opacity="0.4"
                  animate={{ x: [60, 240, 60] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0.6 }}
                />

                {/* Diffuse Rough/Heterogeneous Interface at Center x=240 */}
                <g>
                  {/* Cellular Scatterer cluster */}
                  {[
                    { cx: 240, cy: 60, r: 4 },
                    { cx: 250, cy: 90, r: 6 },
                    { cx: 236, cy: 120, r: 5 },
                    { cx: 255, cy: 140, r: 4 },
                    { cx: 245, cy: 170, r: 7 },
                    { cx: 238, cy: 200, r: 5 },
                    { cx: 248, cy: 225, r: 4 }
                  ].map((scatterer, idx) => (
                    <g key={`scat-el-${idx}`}>
                      {/* Original target node */}
                      <circle cx={scatterer.cx} cy={scatterer.cy} r={scatterer.r} fill="#16181d" stroke="#8e9299" strokeWidth="1.5" />
                      <circle cx={scatterer.cx} cy={scatterer.cy} r={scatterer.r - 2} fill="#ef4444" opacity="0.6" />
                      
                      {/* Scattered circular concentric wave lines pulsing outward */}
                      {[1, 2, 3].map((ring) => (
                        <motion.circle
                          key={`scat-ring-${idx}-${ring}`}
                          cx={scatterer.cx}
                          cy={scatterer.cy}
                          r={idx * 2}
                          fill="none"
                          stroke="#00d1ff"
                          strokeWidth="0.8"
                          opacity={0.8}
                          animate={{
                            r: [scatterer.r, scatterer.r + 55],
                            opacity: [0.8, 0],
                            strokeWidth: [1, 0.4]
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            delay: (idx * 0.15) + (ring * 0.5),
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </g>
                  ))}
                </g>

                <text x="250" y="25" fill="#8e9299" fontSize="8px" fontFamily="monospace" textAnchor="middle">
                  ROUGH OR HETEROGENEOUS TISSUE BORDER (INTERFACE ≈ λ)
                </text>
                <text x="440" y="130" fill="#ffd700" fontSize="7px" fontFamily="monospace" textAnchor="middle">
                  MULTI-DIRECTIONAL
                </text>
                <text x="440" y="140" fill="#ffd700" fontSize="7px" fontFamily="monospace" textAnchor="middle">
                  "BACKSCATTER" TEXTURES
                </text>
              </svg>
            )}

            {/* 3. Rayleigh Scattering (RBCs) Simulation */}
            {selected.id === 'rayleigh' && (
              <svg className="w-full h-full min-h-[260px]" viewBox="0 0 500 260">
                {/* Horizontal blood vessel walls */}
                <rect x="0" y="100" width="500" height="90" fill="#7f1d1d" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="5 3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#ef4444" strokeWidth="2.5" opacity="0.8" />
                <line x1="0" y1="190" x2="500" y2="190" stroke="#ef4444" strokeWidth="2.5" opacity="0.8" />
                <text x="15" y="115" fill="#ef4444" fontSize="8px" fontFamily="monospace" fontWeight="bold">BLOOD VESSEL LUMEN</text>

                {/* Backwards drift representing uniform blood flow */}
                <g>
                  {[...Array(rbcFlow)].map((_, i) => {
                    const cellOffset = (i * 35) % 480;
                    const cellY = 112 + ((i * 23) % 65);
                    const speed = 1.0 + (i % 3) * 0.4;
                    
                    return (
                      <g key={`rbc-cell-${i}`}>
                        {/* Red Blood Cell Core */}
                        <motion.ellipse
                          cx={40 + cellOffset}
                          cy={cellY}
                          rx="4.5"
                          ry="2.5"
                          fill="#ef4444"
                          stroke="#b91c1c"
                          strokeWidth="1"
                          animate={{
                            x: [0, 420],
                          }}
                          transition={{
                            duration: 12 / speed,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />

                        {/* Fine Symmetric Rayleigh Micro-Rings */}
                        {[1, 2].map((ring) => (
                          <motion.circle
                            key={`rayleigh-ring-${i}-${ring}`}
                            cx={40 + cellOffset}
                            cy={cellY}
                            r="2"
                            fill="none"
                            stroke="#ff9999"
                            strokeWidth="0.5"
                            opacity={0.8}
                            animate={{
                              x: [0, 420],
                              r: [2, 18 * frequencyRad / 5],
                              opacity: [0.7, 0]
                            }}
                            transition={{
                              x: { duration: 12 / speed, repeat: Infinity, ease: "linear" },
                              r: { duration: 1.5, repeat: Infinity, delay: ring * 0.61, ease: "linear" },
                              opacity: { duration: 1.5, repeat: Infinity, delay: ring * 0.61, ease: "linear" }
                            }}
                          />
                        ))}
                      </g>
                    );
                  })}
                </g>

                {/* Ultrasonic wave beam hitting RBCs from top */}
                <g opacity="0.3">
                  {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480].map((x, i) => (
                    <motion.line
                      key={`incoming-rayl-${i}`}
                      x1={x}
                      y1="10"
                      x2={x}
                      y2="100"
                      stroke="#00d1ff"
                      strokeWidth="1.2"
                      animate={{
                        opacity: [0.1, 0.4, 0.1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </g>

                <text x="250" y="25" fill="#ef4444" fontSize="8px" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  RAYLEIGH SCATTERING: RED BLOOD CELL TARGETS (&lt;&lt; λ)
                </text>
                
                {/* Microscopic dimension label scale */}
                <g transform="translate(320, 215)">
                  <rect x="0" y="0" width="165" height="40" fill="#16181d" rx="6" stroke="#2d3139" />
                  <text x="10" y="15" fill="#8e9299" fontSize="7px" fontFamily="monospace">RBC DIMENSION: ~7 μm</text>
                  <text x="10" y="25" fill="#00d1ff" fontSize="7px" fontFamily="monospace">λ AT {frequency.toFixed(1)}MHz: {(1540 / (frequency*1e6) * 1e3).toFixed(0)} μm</text>
                  <text x="10" y="34" fill="#ffd700" fontSize="7px" fontFamily="monospace" fontWeight="bold">DIFFERENCE: RBC &lt;&lt; λ</text>
                </g>
              </svg>
            )}

            {/* 4. Refraction / Snell's Law Simulation */}
            {selected.id === 'refraction' && (
              <svg className="w-full h-full min-h-[260px]" viewBox="0 0 500 260">
                <defs>
                  <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#ffd700" strokeWidth="1" opacity="0.1" />
                  </pattern>
                </defs>

                {/* Medium Separation Line (Acoustic Impedance Boundary) */}
                <line x1="50" y1="130" x2="450" y2="130" stroke="#ffd700" strokeWidth="2.5" opacity="0.8" />
                
                {/* Normal dashed line */}
                <line x1="250" y1="20" x2="250" y2="240" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

                {/* Medium descriptions */}
                <text x="60" y="45" fill="#00d1ff" fontSize="8px" fontFamily="monospace">MEDIUM 1 (Fast or Slow): {c1} m/s</text>
                <text x="60" y="225" fill="#ffd700" fontSize="8px" fontFamily="monospace">MEDIUM 2 (Velocity): {c2} m/s</text>

                {(() => {
                  const rad1 = (incidentAngle * Math.PI) / 180;
                  const dx1 = Math.sin(rad1);
                  const dy1 = Math.cos(rad1);

                  // Coordinates of Incident Path reaching (250, 130)
                  const ix = 250 - 110 * dx1;
                  const iy = 130 - 110 * dy1;

                  // Render Incident Ray
                  const incidentRay = <line x1={ix} y1={iy} x2="250" y2="130" stroke="#00d1ff" strokeWidth="2" />;

                  // Draw Incident Wavefront bars rotating along original angle
                  const incidentWaveFronts = [0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                    const wx = 250 - 110 * dx1 * (1 - ratio);
                    const wy = 130 - 110 * dy1 * (1 - ratio);
                    const rx1 = dy1 * 18;
                    const ry1 = -dx1 * 18;
                    return (
                      <motion.line
                        key={`ref-inc-${i}`}
                        x1={wx - rx1}
                        y1={wy - ry1}
                        x2={wx + rx1}
                        y2={wy + ry1}
                        stroke="#00d1ff"
                        strokeWidth="1.2"
                        opacity={0.4}
                        animate={{
                          x: [-(dx1 * 20), dx1 * 20],
                          y: [-(dy1 * 20), dy1 * 20]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.35 }}
                      />
                    );
                  });

                  if (isTIR) {
                    // Reflected Ray Only (TIR!)
                    const tx = 250 + 110 * dx1;
                    const ty = 130 - 110 * dy1;

                    return (
                      <>
                        {incidentRay}
                        {incidentWaveFronts}
                        
                        {/* Shading representing total reflection boundary */}
                        <rect x="50" y="130" width="400" height="110" fill="url(#diagonalHatch)" />

                        {/* Reflected beam */}
                        <line x1="250" y1="130" x2={tx} y2={ty} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 1" />
                        
                        {/* Reflected Wavefronts */}
                        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                          const rx_coord = 250 + 110 * dx1 * ratio;
                          const ry_coord = 130 - 110 * dy1 * ratio;
                          const rx1 = dy1 * 18;
                          const ry1 = dx1 * 18;
                          return (
                            <motion.line
                              key={`ref-tir-${i}`}
                              x1={rx_coord - rx1}
                              y1={ry_coord - ry1}
                              x2={rx_coord + rx1}
                              y2={ry_coord + ry1}
                              stroke="#ef4444"
                              strokeWidth="1.2"
                              opacity={0.5}
                              animate={{
                                x: [-(dx1 * 20), dx1 * 20],
                                y: [dy1 * 20, -(dy1 * 20)]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.35 }}
                            />
                          );
                        })}

                        {/* Critical angle alert banners */}
                        <g transform="translate(130, 160)">
                          <rect x="0" y="0" width="240" height="30" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" rx="4" />
                          <text x="120" y="15" fill="#ef4444" fontSize="8px" fontFamily="monospace" fontWeight="bold" textAnchor="middle" className="animate-pulse">
                            ⚠️ TOTAL INTERNAL REFLECTION (TIR)
                          </text>
                          <text x="120" y="23" fill="#8e9299" fontSize="6px" fontFamily="monospace" textAnchor="middle">
                            Critical angle exceeded (sinθ₁ * c₂/c₁ &gt; 1)
                          </text>
                        </g>

                        {/* Snell's Angle markers */}
                        <path d={`M250,90 A40,40 0 0,0 ${250 - 40 * dx1},${130 - 40 * dy1}`} fill="none" stroke="#00d1ff" strokeWidth="1" />
                        <text x={230 - 15 * dx1} y="95" fill="#00d1ff" fontSize="7px" fontFamily="monospace">θ₁ = {incidentAngle}°</text>
                        
                        <path d={`M250,90 A40,40 0 0,1 ${250 + 40 * dx1},${130 - 40 * dy1}`} fill="none" stroke="#ef4444" strokeWidth="1" />
                        <text x={255 + 15 * dx1} y="95" fill="#ef4444" fontSize="7px" fontFamily="monospace">θ_reflected = {incidentAngle}°</text>
                      </>
                    );
                  } else {
                    // Standard bending of refracted beam
                    const rad2 = (refractedAngle * Math.PI) / 180;
                    const dx2 = Math.sin(rad2);
                    const dy2 = Math.cos(rad2);

                    const rx = 250 + 110 * dx2;
                    const ry = 130 + 110 * dy2;

                    return (
                      <>
                        {incidentRay}
                        {incidentWaveFronts}

                        {/* Refracted Beam line going down into Medium 2 */}
                        <line x1="250" y1="130" x2={rx} y2={ry} stroke="#10b981" strokeWidth="2" />

                        {/* Refracted Wavefronts (Notice: spacing compresses or stretches depending on wavelength changes in M2) */}
                        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                          const px = 250 + 110 * dx2 * ratio;
                          const py = 130 + 110 * dy2 * ratio;
                          const rx2 = dy2 * 18;
                          const ry2 = -dx2 * 18;
                          
                          // Velocity affects wave propagation duration step (Snell's speed correction)
                          const speedFactor = c2 / c1;

                          return (
                            <motion.line
                              key={`ref-refracted-${i}`}
                              x1={px - rx2}
                              y1={py - ry2}
                              x2={px + rx2}
                              y2={py + ry2}
                              stroke="#10b981"
                              strokeWidth="1.2"
                              opacity={0.6}
                              animate={{
                                x: [-(dx2 * 20 * speedFactor), dx2 * 20 * speedFactor],
                                y: [-(dy2 * 20 * speedFactor), dy2 * 20 * speedFactor]
                              }}
                              transition={{ duration: 1.5 * (c1/c2), repeat: Infinity, ease: 'linear', delay: (i * 0.35) + 0.2 }}
                            />
                          );
                        })}

                        {/* Arc angle markers */}
                        <path d={`M250,90 A40,40 0 0,0 ${250 - 40 * dx1},${130 - 40 * dy1}`} fill="none" stroke="#00d1ff" strokeWidth="1" />
                        <text x={230 - 15 * dx1} y="95" fill="#00d1ff" fontSize="7px" fontFamily="monospace">θ₁ = {incidentAngle}°</text>

                        <path d={`M250,170 A40,40 0 0,0 ${250 + 40 * dx2},${130 + 40 * dy2}`} fill="none" stroke="#10b981" strokeWidth="1" />
                        <text x={255 + 15 * dx2} y="170" fill="#10b981" fontSize="7px" fontFamily="monospace">θ₂ = {refractedAngle.toFixed(1)}°</text>
                      </>
                    );
                  }
                })()}

                <line x1="250" y1="130" x2="250" y2="130" stroke="#ffd700" strokeWidth="5" strokeLinecap="round" />
              </svg>
            )}
          </div>

          {/* Dynamic Sliders / Bottom Console for Adjusting Simulators */}
          <div className="bg-[#16181d] border border-[#2d3139] p-4 sm:p-5 rounded-2xl relative z-20">
            {selected.id === 'specular' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Incident Scan Angle (θ)</span>
                    <span className="text-[#00d1ff] font-bold">{incidentAngle}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="75" step="1"
                    value={incidentAngle}
                    onChange={e => setIncidentAngle(parseInt(e.target.value))}
                    className="w-full accent-[#00d1ff]"
                  />
                  <div className="flex justify-between text-[7.5px] text-[#8e9299] font-mono">
                    <span>0° (NORMAL INCIDENCE)</span>
                    <span>75° (OBLIQUE)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Interface Smoothness</span>
                    <span className="text-[#ffd700] font-bold">{(specularSmoothness*100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="1.5" step="0.1"
                    value={specularSmoothness}
                    onChange={e => setSpecularSmoothness(parseFloat(e.target.value))}
                    className="w-full accent-[#ffd700]"
                  />
                  <div className="flex justify-between text-[7.5px] text-[#8e9299] font-mono">
                    <span>ROUGH BOUNDARY</span>
                    <span>PERFECT SPECULAR SHIELD MIIRROR</span>
                  </div>
                </div>
              </div>
            )}

            {selected.id === 'scattering' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Transducer Frequency</span>
                    <span className="text-[#00d1ff] font-bold">{frequency.toFixed(1)} MHz</span>
                  </div>
                  <input 
                    type="range" min="2.0" max="15.0" step="0.5"
                    value={frequency}
                    onChange={e => setFrequency(parseFloat(e.target.value))}
                    className="w-full accent-[#00d1ff]"
                  />
                  <div className="flex justify-between text-[7.5px] text-[#8e9299] font-mono">
                    <span>2.0 MHz (LONG λ)</span>
                    <span>15.0 MHz (SHORT λ)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Cellular Target Size</span>
                    <span className="text-[#ffd700] font-bold">{(wavelength * 0.8).toFixed(3)} mm</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-dashed border-[#2d3139] flex items-center justify-between h-[34px]">
                    <div className="text-[9px] font-mono text-[#8e9299]">
                      Target size closely mirrors Wavelength.
                    </div>
                    <span className="text-[9px] text-[#ffd700] font-mono font-bold uppercase tracking-wider bg-[#ffd700]/5 px-2 py-0.5 rounded border border-[#ffd700]/10">
                      Standard Diffuse Scattering
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selected.id === 'rayleigh' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#ef4444]">
                    <span className="uppercase">PROBE FREQUENCY (λ DETECTOR)</span>
                    <span className="font-bold text-white bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">{frequency.toFixed(1)} MHz</span>
                  </div>
                  <input 
                    type="range" min="2.0" max="12.0" step="0.5"
                    value={frequency}
                    onChange={e => setFrequency(parseFloat(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-[7.5px] text-[#8e9299] font-mono">
                    <span>2 MHz</span>
                    <span>12 MHz</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Rayleigh Scattering Factor (f⁴)</span>
                    <span className="text-[#ffd700] font-bold bg-[#ffd700]/5 px-1.5 py-0.5 border border-[#ffd700]/10 rounded font-mono">{rayleighMultiplier.toFixed(1)}x</span>
                  </div>
                  <div className="text-[9px] text-[#8e9299] leading-relaxed p-1">
                    At <span className="text-white">{frequency.toFixed(1)} MHz</span>, scattering is multiplied by <span className="text-[#ffd700] font-bold">{rayleighMultiplier.toFixed(1)}x</span> compared to low 2.0 MHz frequencies.
                  </div>
                </div>
              </div>
            )}

            {selected.id === 'refraction' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#8e9299]">
                    <span className="uppercase">Incident Angle θ₁</span>
                    <span className="text-[#00d1ff] font-bold">{incidentAngle}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="75" step="1"
                    value={incidentAngle}
                    onChange={e => setIncidentAngle(parseInt(e.target.value))}
                    className="w-full accent-[#00d1ff]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#c0c0c0]">
                    <span className="uppercase">Velocity c₁ (Medium 1)</span>
                    <span className="text-white font-bold font-mono">{c1} m/s</span>
                  </div>
                  <input 
                    type="range" min="1000" max="2200" step="50"
                    value={c1}
                    onChange={e => setC1(parseInt(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-[#ffd700]">
                    <span className="uppercase">Velocity c₂ (Medium 2)</span>
                    <span className="font-bold text-[#ffd700] font-mono">{c2} m/s</span>
                  </div>
                  <input 
                    type="range" min="1000" max="2200" step="50"
                    value={c2}
                    onChange={e => setC2(parseInt(e.target.value))}
                    className="w-full accent-[#ffd700]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Expert Briefing & Registry Study Cards */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Main expert briefing on selected interaction */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 sm:p-8 shadow-2xl flex-1 relative overflow-y-auto max-h-[350px] lg:max-h-none">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
              {selected.icon}
            </div>
            
            <div className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest border-b border-[#2d3139] pb-4 mb-6 flex items-center gap-2">
              <Play size={10} className="text-[#ffd700]" strokeWidth={3} /> SPI Exam Core Review
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-serif italic text-white mb-2">{selected.name}</h3>
                <p className="text-xs text-[#8e9299] leading-relaxed font-sans">{selected.desc}</p>
              </div>

              <div className="p-4 bg-black/60 rounded-2xl border border-[#2d3139] space-y-2">
                <span className="text-[8px] font-bold text-[#00d1ff] uppercase tracking-widest block font-mono">
                  PHYSICAL KEY REQUIREMENTS
                </span>
                <p className="text-[11px] font-mono text-[#e0e0e0] leading-relaxed">
                  {selected.physics}
                </p>
              </div>

              {selected.id === 'refraction' && (
                <div className="p-4 bg-[#10b981]/5 rounded-2xl border border-[#10b981]/20 space-y-1">
                  <span className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest block font-mono">
                    SNELL'S BENDING ANALYSIS
                  </span>
                  <p className="text-[10px] text-[#8e9299] leading-relaxed">
                    {isTIR ? (
                      <span className="text-rose-400 font-bold">Total Internal Reflection occurs because c₂ &gt; c₁ and oblique angle θi exceeds critical limits!</span>
                    ) : c2 > c1 ? (
                      <span>Since Medium 2 is faster than Medium 1 (c₂ &gt; c₁), the refracted angle bends <strong className="text-white">AWAY</strong> from the normal line (θ₂ &gt; θ₁).</span>
                    ) : c2 < c1 ? (
                      <span>Since Medium 2 is slower than Medium 1 (c₂ &lt; c₁), the refracted angle bends <strong className="text-white">TOWARD</strong> the normal line (θ₂ &lt; θ₁).</span>
                    ) : (
                      <span>Velocity is matched. No bending occurs (θ₁ = θ₂).</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Testable Facts Box */}
          <div className="bg-[#1a1c22] border border-[#2d3139] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="text-[10px] text-[#ffb800] font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5 font-mono">
              <HelpCircle size={12} /> Registry Highlights
            </div>
            
            <div className="space-y-3.5">
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between font-mono">
                  <span className="text-[#8e9299]">Refractions Needed:</span>
                  <span className="text-white font-bold">Oblique Angle + Δ Velocity</span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[11px] border-t border-[#2d3139] pt-3.5">
                <div className="flex justify-between font-mono">
                  <span className="text-[#8e9299]">Rayleigh Targets:</span>
                  <span className="text-[#ef4444] font-bold">RBC (∝ f⁴)</span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#ef4444] w-2/3" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[11px] border-t border-[#2d3139] pt-3.5">
                <div className="flex justify-between font-mono">
                  <span className="text-[#8e9299]">Specular Angle:</span>
                  <span className="text-white font-bold">θ_incidence = θ_reflection</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
