import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video } from 'lucide-react';

const PROBES = [
  { id: 'linear', name: 'Linear Sequential', steering: 'None/Electronic', focusing: 'Electronic', image: 'Rectangular' },
  { id: 'phased', name: 'Phased Array', steering: 'Electronic (Sector)', focusing: 'Electronic', image: 'Sector (Fan)' },
  { id: 'convex', name: 'Convex/Curvilinear', steering: 'None (Natural Curved)', focusing: 'Electronic', image: 'Blunted Sector' },
  { id: 'annular', name: 'Annular Phased', steering: 'Mechanical', focusing: 'Electronic (multi-focus)', image: 'Sector' },
  { id: 'vector', name: 'Vector Array', steering: 'Electronic (Trapezoid)', focusing: 'Electronic', image: 'Trapezoidal' }
];

interface TransducerTypesModuleProps {
  setViewMode?: (mode: any) => void;
}

export default function TransducerTypesModule({ setViewMode }: TransducerTypesModuleProps) {
  const [selected, setSelected] = useState(PROBES[0]);
  const [steeringAngle, setSteeringAngle] = useState(0); // -20 to 20 deg
  const [focalDepth, setFocalDepth] = useState(150); // 50 to 250px depth
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 65);
    return () => clearInterval(interval);
  }, []);

  const canSteer = ['phased', 'vector', 'linear'].includes(selected.id);
  const canFocus = true;

  // Reset parameters when probe changes
  const handleProbeChange = (p: any) => {
    setSelected(p);
    setSteeringAngle(0);
    setFocalDepth(150);
  };

  // Calculations for dynamic array scanning sweep
  const sweepCycle = tick % 32;
  const sweepIdx = sweepCycle < 16 ? sweepCycle : 32 - sweepCycle; // 0 to 16
  const linearCenter = 3.5 + sweepIdx; // ranges 3.5 to 19.5 (active subgroup)
  const beamCx = 180 + linearCenter * 10.434;

  const mechanicalAngle = Math.sin(tick * 0.06) * 18; // Simulated mechanical swing for Annular probe (Locked controls but autohandles)

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      {/* Header section with theme alignment */}
      <div className="flex justify-between items-start md:items-end flex-col md:flex-row border-b border-[#2d3139] pb-6 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Transducer Hardware Architecture</div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">Array <span className="text-[#8e9299]">Geometries</span></div>
        </div>
        <div className="flex flex-col sm:flex-row py-2 sm:py-0 w-full md:w-auto items-start md:items-center gap-4">
           {setViewMode && (
             <button 
               onClick={() => setViewMode('library')}
               className="flex items-center justify-center w-full sm:w-auto gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 rounded-full transition-all group shadow-lg"
             >
               <Video size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-bold text-white uppercase tracking-widest">Watch Hardware Guide</span>
             </button>
           )}
           <div className="p-3 md:p-4 bg-[#1a1c22] border border-[#2d3139] rounded-xl flex items-center gap-4 w-full sm:w-auto">
              <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full border border-[#00d1ff]/30 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-[#00d1ff] animate-ping" />
              </div>
              <div className="flex flex-col">
                 <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest font-bold">Aperture Size</div>
                 <div className="text-sm md:text-lg font-mono font-bold text-white uppercase">{selected.id === 'phased' ? 'Small_Footprint' : 'Wide_Linear'}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-y-auto no-scrollbar pb-10 md:pb-0">
        {/* Left hand details panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <div className="flex flex-col gap-2">
             {PROBES.map(p => (
               <button
                 key={p.id}
                 onClick={() => handleProbeChange(p)}
                 className={`p-4 text-left border-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${selected.id === p.id ? 'border-[#ffd700] bg-[#ffd700]/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]' : 'border-[#1a1c22] bg-[#16181d] hover:border-[#2d3139]'}`}
               >
                 <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${selected.id === p.id ? 'bg-[#ffd700]' : 'bg-transparent'}`} />
                 <div className="text-[11px] font-bold text-white uppercase tracking-wide group-hover:text-[#ffd700] transition-colors">{p.name}</div>
                 <div className="text-[8px] text-[#8e9299] font-mono opacity-80 uppercase">{p.image}</div>
                 
                 {selected.id === p.id && (
                    <motion.div layoutId="probe-glow" className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/5 to-transparent pointer-events-none" />
                 )}
               </button>
             ))}
           </div>

           <div className="mt-4 p-6 bg-[#0c0d10] border border-[#2d3139] rounded-2xl space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#ffd700] uppercase tracking-widest">Active Aperture Specifications</span>
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
             </div>

             <div className="space-y-4 font-mono text-[10px] leading-relaxed">
                <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-white/40">Beam-Steering Method</span>
                   <span className="text-white text-right">{selected.steering}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-white/40">Focal Method</span>
                   <span className="text-white text-right">{selected.focusing}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-white/40">Field of View Shape</span>
                   <span className="text-[#ffd700] text-right">{selected.image}</span>
                </div>
                <div className="pt-2 text-[10px] text-white/50 leading-relaxed font-sans normal-case border-t border-white/10">
                   {selected.id === 'linear' && "Linear arrays sequentially actuate a small subgroup of crystal segments at once, keeping the aperture sound corridors parallel to create rectangular scans."}
                   {selected.id === 'phased' && "Phased arrays fire all crystals simultaneously but with nanosecond electronic time delays, creating constructive wavefront interference to steer and focus polar fan beams."}
                   {selected.id === 'convex' && "Convex arrays contain elements on a curved surface shell, emitting sound beams radially outwards to naturally construct a wide field of view blunted sector scan."}
                   {selected.id === 'annular' && "Annular arrays feature concentric elements. They must be swept mechanically to steer the beam, producing high-fidelity circular-symmetric focal columns along the central axis."}
                   {selected.id === 'vector' && "Vector arrays combine linear sequential firing with multi-angle phased electronic delay steering, enabling a clean trapezoidal field of view that maximizes side penetration."}
                </div>
             </div>
           </div>
        </div>

        {/* Right hand dynamic physics simulation container */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-[#0c0d10] border border-[#2d3139] rounded-2xl relative overflow-hidden min-h-[420px] shadow-2xl p-6">
           <div className="flex justify-between items-center z-10 border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                 <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest font-bold">Real-time Wavefront Beamforming State</span>
              </div>
              <span className="text-[9px] font-mono text-white/30 truncate leading-none uppercase">Aperture Target HFS-600</span>
           </div>

           <div className="flex-1 flex flex-col relative">
              <div className="relative w-full h-[400px] flex flex-col items-center pt-8 overflow-hidden lg:overflow-visible">
                  {/* Probe Head - High-fidelity Dynamic Aperture Geometry */}
                  <div className="w-72 h-16 bg-gradient-to-b from-[#22252c] to-[#141519] rounded-t-3xl flex flex-col items-center justify-center border-t border-x border-[#3b404c] shadow-[0_-8px_24px_rgba(0,0,0,0.6)] relative z-20 shrink-0 select-none">
                     {/* Metal alignment line */}
                     <div className="absolute top-1.5 w-10 h-[2px] bg-[#3b404d] rounded-full opacity-35" />

                     {/* Array footprint layout depending on geometry */}
                     {selected.id === 'linear' && (
                        <div className="flex gap-[3px] overflow-hidden px-8 w-full justify-center">
                           {[...Array(24)].map((_, i) => {
                             const isActive = Math.abs(i - linearCenter) < 2.5;
                             return (
                              <div 
                                key={i} 
                                className={`w-1.5 h-4.5 rounded-[1px] transition-all duration-150 ${isActive ? 'bg-[#ffb800] shadow-[0_0_10px_#ffb800]' : 'bg-[#ffd700]/10 border border-[#ffd700]/5'}`} 
                              />
                             );
                           })}
                        </div>
                     )}

                     {selected.id === 'phased' && (
                        <div className="flex gap-[2px] overflow-hidden justify-center px-12 w-1/2">
                           {[...Array(16)].map((_, i) => {
                             const offset = steeringAngle > 4 ? i : steeringAngle < -4 ? 15 - i : Math.abs(i - 7.5);
                             const pulsePhase = (tick - Math.round(offset * 0.4)) % 10;
                             const isActive = pulsePhase === 0 || pulsePhase === 1;
                             return (
                              <div 
                                key={i} 
                                className={`w-1 h-4.5 rounded-[1px] transition-all duration-75 ${isActive ? 'bg-[#ffd700] shadow-[0_0_12px_#ffd700]' : 'bg-[#ffd700]/10'}`} 
                              />
                             );
                           })}
                        </div>
                     )}

                     {selected.id === 'convex' && (
                        <div className="relative w-full h-8 flex justify-center overflow-hidden">
                           {[...Array(24)].map((_, i) => {
                             const angleDeg = -24 + (i * 48) / 23;
                             const activePhase = (tick - Math.round(i * 0.35)) % 12;
                             const isActive = activePhase === 0 || activePhase === 1;
                             return (
                               <div 
                                 key={i}
                                 className="absolute bottom-1 w-[1.5px] h-4.5 rounded-[1px] origin-bottom transition-all duration-150"
                                 style={{
                                   transform: `rotate(${angleDeg}deg) translateY(-8px)`,
                                   backgroundColor: isActive ? '#ffd700' : 'rgba(255, 215, 0, 0.12)',
                                   boxShadow: isActive ? '0 0 8px #ffd700' : 'none'
                                 }}
                               />
                             );
                           })}
                        </div>
                     )}

                     {selected.id === 'annular' && (
                        <div className="relative flex items-center justify-center h-10 w-full">
                           {[...Array(5)].map((_, i) => {
                             const cycle = Math.round(tick * 0.45) % 6;
                             const val = 4 - i;
                             const isActive = cycle === val;
                             return (
                               <div
                                 key={i}
                                 className="absolute rounded-full border transition-all duration-200"
                                 style={{
                                   width: `${8 + i * 10}px`,
                                   height: `${8 + i * 10}px`,
                                   borderColor: isActive ? '#00d1ff' : 'rgba(0, 209, 255, 0.12)',
                                   borderWidth: '1.5px',
                                   boxShadow: isActive ? '0 0 6px rgba(0, 209, 255, 0.35)' : 'none'
                                 }}
                               />
                             );
                           })}
                        </div>
                     )}

                     {selected.id === 'vector' && (
                        <div className="flex gap-[3px] overflow-hidden px-10 w-2/3 justify-center">
                           {[...Array(18)].map((_, i) => {
                             const offset = steeringAngle > 3 ? i : steeringAngle < -3 ? 17 - i : Math.abs(i - 8.5);
                             const pulsePhase = (tick - Math.round(offset * 0.35)) % 10;
                             const isActive = pulsePhase === 0 || pulsePhase === 1;
                             return (
                              <div 
                                key={i} 
                                className={`w-1.5 h-4.5 rounded-[1px] transition-all duration-100 ${isActive ? 'bg-[#ffb800] shadow-[0_0_10px_#ffb800]' : 'bg-[#ffb800]/15'}`} 
                              />
                             );
                           })}
                        </div>
                     )}

                     {/* Active LED status tracker */}
                     <div className="absolute top-1 left-3 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#00d1ff] animate-ping" />
                        <span className="text-[5px] font-mono text-white/30 uppercase tracking-widest leading-none">Aperture_Live</span>
                     </div>
                  </div>

                  {/* Dynamic SVG Beam Path */}
                  <div className="w-full flex-1 relative overflow-visible">
                     <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYTop">
                        <defs>
                           <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
                           </linearGradient>
                           <radialGradient id="focalGlow">
                              <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0" />
                           </radialGradient>
                        </defs>

                        <motion.g 
                         animate={{ rotate: selected.id === 'annular' ? mechanicalAngle : steeringAngle }} 
                         style={{ originX: '300px', originY: '0px' }}
                         transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        >
                           {/* Main Beam Representation - REFINED ACCORDING TO ARRAY GEOMETRY */}
                           {selected.id === 'linear' && (
                             <g>
                                {/* Side lobes representing visual grating noise (subdued) */}
                                <motion.path 
                                  animate={{ opacity: [0.03, 0.1, 0.03] }}
                                  transition={{ duration: 2.5, repeat: Infinity }}
                                  d={`M ${beamCx - 26},0 L ${beamCx - 80},400 L ${beamCx - 60},400 Z M ${beamCx + 26},0 L ${beamCx + 80},400 L ${beamCx + 60},400 Z`}
                                  fill="#ffd700" 
                                />
                                {/* Scanning and focusing Sequential Column */}
                                <motion.path 
                                  animate={{ 
                                    d: `M ${beamCx - 26},0 
                                        L ${beamCx - 6},${focalDepth} 
                                        L ${beamCx - 20},400 
                                        L ${beamCx + 20},400 
                                        L ${beamCx + 6},${focalDepth} 
                                        L ${beamCx + 26},0 Z` 
                                  }}
                                  fill="url(#beamGradient)" 
                                />
                                {/* Waves propagating down the focal column */}
                                {[...Array(4)].map((_, i) => (
                                  <motion.line
                                    key={i}
                                    animate={{ 
                                      y1: [0, 400],
                                      y2: [0, 400],
                                      opacity: [0, 0.75, 0]
                                    }}
                                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55 }}
                                    x1={beamCx - 22}
                                    y1={0}
                                    x2={beamCx + 22}
                                    y2={0}
                                    stroke="#ffd700"
                                    strokeOpacity="0.65"
                                    strokeWidth="1.5"
                                  />
                                ))}
                             </g>
                           )}

                           {selected.id === 'phased' && (
                             <g>
                                {/* Side Lobes */}
                                <motion.path 
                                  animate={{ scale: [1, 1.04, 1], opacity: [0.08, 0.16, 0.08] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  d="M 298,0 L 160,320 Q 150,330 140,320 Z M 302,0 L 440,320 Q 450,330 460,320 Z"
                                  fill="#ffd700"
                                />
                                <motion.path 
                                  animate={{ 
                                    d: `M 295,0 
                                        L 305,0 
                                        L ${300 + 16},${focalDepth} 
                                        L 570,400 
                                        L 30,400 
                                        L ${300 - 16},${focalDepth} Z` 
                                  }}
                                  fill="url(#beamGradient)" 
                                  className="opacity-75"
                                />
                                {/* Phased polar wave fronts */}
                                {[...Array(4)].map((_, i) => (
                                  <motion.path
                                    key={i}
                                    animate={{ 
                                      y: [0, focalDepth, 400],
                                      scale: [0.1, 0.45, 1.45],
                                      opacity: [0, 0.5, 0]
                                    }}
                                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }}
                                    d="M 270,0 Q 300,24 330,0"
                                    stroke="#ffd700"
                                    strokeWidth="1.5"
                                    fill="none"
                                  />
                                ))}
                             </g>
                           )}

                           {selected.id === 'convex' && (
                             <g>
                                {/* Natural broad blunted sector shape */}
                                <motion.path 
                                  animate={{ 
                                    d: `M 185,0 
                                        L 415,0
                                        C 400,${focalDepth*0.45} 340,${focalDepth} 490,400
                                        L 110,400
                                        C 260,${focalDepth} 200,${focalDepth*0.45} 185,0 Z` 
                                  }}
                                  fill="url(#beamGradient)" 
                                />
                                {/* Radiating guides matching natural geometry */}
                                {[...Array(9)].map((_, i) => {
                                   const theta = -24 + i * 6.0;
                                   const rad = theta * Math.PI / 180;
                                   const x_start = 300 + Math.sin(rad) * 40;
                                   const y_start = Math.cos(rad) * 15;
                                   const x_end = 300 + Math.sin(rad) * 380;
                                   const y_end = Math.cos(rad) * 380;
                                   return (
                                      <line 
                                        key={i}
                                        x1={x_start} y1={y_start}
                                        x2={x_end} y2={y_end}
                                        stroke="rgba(255, 215, 0, 0.12)"
                                        strokeWidth="0.5"
                                        strokeDasharray="4,4"
                                      />
                                   );
                                })}
                                {/* Naturally curved wavefront arcs */}
                                {[...Array(4)].map((_, i) => (
                                   <motion.path
                                     key={i}
                                     animate={{
                                        opacity: [0, 0.45, 0],
                                        y: [0, 400],
                                        scaleX: [0.5, 1.6]
                                     }}
                                     transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
                                     d="M 200,10 Q 300,40 400,10"
                                     fill="none"
                                     stroke="#ffd700"
                                     strokeWidth="1.5"
                                     style={{ originX: '300px', originY: '0px' }}
                                   />
                                ))}
                             </g>
                           )}

                           {selected.id === 'vector' && (
                             <g>
                                <motion.path 
                                  animate={{ 
                                    d: `M 245,0 
                                        L 355,0 
                                        L ${300 + 13},${focalDepth} 
                                        L 530,400 
                                        L 70,400 
                                        L ${300 - 13},${focalDepth} Z` 
                                  }}
                                  fill="url(#beamGradient)" 
                                />
                                {[...Array(4)].map((_, i) => (
                                  <motion.path
                                    key={i}
                                    animate={{ 
                                      y: [0, focalDepth, 400],
                                      scaleX: [0.35, 0.6, 1.55],
                                      opacity: [0, 0.45, 0]
                                    }}
                                    transition={{ duration: 2.0, repeat: Infinity, delay: i * 0.5 }}
                                    d="M 255,0 L 345,0"
                                    stroke="#ffd700"
                                    strokeWidth="1.5"
                                    fill="none"
                                  />
                                ))}
                             </g>
                           )}

                           {selected.id === 'annular' && (
                             <g>
                                {/* Symmetrical cylinder/bowl beam focusing deeply */}
                                <path d="M285,0 L210,400 L390,400 L315,0 Z" fill="url(#beamGradient)" />
                                {[1, 2, 3].map(i => (
                                  <motion.circle 
                                    key={i}
                                    cx="300" cy={focalDepth * (0.45 + i * 0.3)}
                                    animate={{ r: [6, 22, 6], opacity: [0.15, 0.4, 0.15] }}
                                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45 }}
                                    fill="none"
                                    stroke="#00d1ff"
                                    strokeWidth="1.2"
                                  />
                                ))}
                                {/* Symmetric sound core axis */}
                                <line x1="300" y1="0" x2="300" y2="400" stroke="#00d1ff" strokeWidth="0.8" strokeDasharray="3,3" className="opacity-30" />
                             </g>
                           )}

                           {/* Dynamic Focal Point Visualization */}
                           <motion.g animate={{ y: focalDepth }}>
                              <circle cx="300" cy="0" r="14" fill="url(#focalGlow)" className="animate-pulse" />
                              <line x1="280" y1="0" x2="320" y2="0" stroke="#00d1ff" strokeWidth="1" strokeDasharray="2,2" />
                              <text x="330" y="5" className="text-[7px] fill-[#00d1ff] font-mono font-bold tracking-widest uppercase">Focal_Zone</text>
                           </motion.g>

                           {/* Beam Convergence/Divergence Lines */}
                           <path 
                             d={`M300,0 L300,${focalDepth} L300,400`} 
                             stroke="#ffd700" 
                             strokeWidth="0.5" 
                             strokeDasharray="4,4" 
                             className="opacity-20"
                           />
                        </motion.g>
                     </svg>
                  </div>
               </div>

               {/* Readouts in desktop bottom margin */}
               <div className="absolute top-2 right-2 md:bottom-6 md:left-6 md:top-auto md:right-auto flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 w-auto md:w-[280px]">
                  <div className="bg-[#16181d] p-3 md:p-4 border border-[#2d3139] rounded-xl flex flex-col items-center shadow-lg">
                     <div className="text-[7px] md:text-[8px] text-[#ffd700] uppercase font-bold mb-1 tracking-widest opacity-60">Beam Width @ Focus</div>
                     <div className="text-[10px] md:text-[12px] text-white font-mono font-bold">{(1 + (focalDepth/300)).toFixed(2)} mm</div>
                  </div>
                  <div className="bg-[#16181d] p-3 md:p-4 border border-[#2d3139] rounded-xl flex flex-col items-center shadow-lg">
                     <div className="text-[7px] md:text-[8px] text-[#ffd700] uppercase font-bold mb-1 tracking-widest opacity-60">Fresnel Length</div>
                     <div className="text-[10px] md:text-[12px] text-white font-mono font-bold">{focalDepth.toFixed(0)} px</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Physics parameter settings controls at bottom (responsive layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#16181d] border border-[#2d3139] p-6 rounded-2xl">
         {/* Beam steering angle control */}
         <div className="space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold">
                  Electronic Steering Angle
               </span>
               <span className="text-xs font-mono text-[#ffd700] font-bold">
                  {selected.id === 'annular' 
                     ? `${mechanicalAngle.toFixed(1)}° (Auto Mechanical)` 
                     : canSteer 
                        ? `${steeringAngle}°` 
                        : '0° (Fixed)'
                  }
               </span>
            </div>
            <input 
              type="range"
              min="-20"
              max="20"
              value={selected.id === 'annular' ? mechanicalAngle : steeringAngle}
              disabled={!canSteer || selected.id === 'annular'}
              onChange={(e) => setSteeringAngle(parseInt(e.target.value))}
              className={`w-full h-1 bg-[#2d3139] rounded-lg appearance-none cursor-pointer accent-[#ffd700] ${(!canSteer || selected.id === 'annular') ? 'opacity-40 cursor-not-allowed' : ''}`}
            />
            <div className="flex justify-between text-[8px] font-mono text-white/30 truncate leading-none uppercase">
               <span>-20° Left</span>
               <span>0° Centered</span>
               <span>20° Right</span>
            </div>
         </div>

         {/* Focal depth control */}
         <div className="space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold">
                  Transmit Focusing Depth
               </span>
               <span className="text-xs font-mono text-[#00d1ff] font-bold">
                  {focalDepth} px
               </span>
            </div>
            <input 
              type="range"
              min="50"
              max="250"
              value={focalDepth}
              disabled={!canFocus}
              onChange={(e) => setFocalDepth(parseInt(e.target.value))}
              className="w-full h-1 bg-[#2d3139] rounded-lg appearance-none cursor-pointer accent-[#00d1ff]"
            />
            <div className="flex justify-between text-[8px] font-mono text-white/30 truncate leading-none uppercase">
               <span>Shallow (Near Zone)</span>
               <span>Mid Focus</span>
               <span>Deep (Far Zone)</span>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
