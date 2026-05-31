import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Zap, Info, TrendingDown } from 'lucide-react';

export default function AttenuationModule() {
  const [frequency, setFrequency] = useState(5); // MHz
  const [distance, setDistance] = useState(6); // cm
  const [medium, setMedium] = useState('Soft Tissue');

  const coefficients: Record<string, number> = {
    'Soft Tissue': 0.5,
    'Muscle': 1.0,
    'Liver': 0.4,
    'Bone': 20.0,
    'Water': 0.002,
    'Fat': 0.6
  };

  const attenCoeff = coefficients[medium] * frequency;
  const totalAttenuation = attenCoeff * distance;
  // Half value layer thickness = 3 / attenuation coefficient
  const hvl = 3 / attenCoeff;

  const data = useMemo(() => {
    const points = [];
    for (let x = 0; x <= 15; x += 0.5) {
      const dbLoss = coefficients[medium] * frequency * x;
      const amplitude = Math.pow(10, -dbLoss / 20); // Conversion for visual wave height
      points.push({ x, amplitude });
    }
    return points;
  }, [frequency, medium]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      <div className="flex justify-between items-start md:items-end flex-col md:flex-row border-b border-[#2d3139] pb-6 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Acoustic Energy Dissipation Engine</div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">Attenuation <span className="text-[#8e9299]">& Depth</span> Loss</div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="p-3 md:p-4 bg-[#1a1c22] border border-[#2d3139] rounded-xl flex items-center justify-between md:justify-start gap-4 group flex-1 md:flex-none">
              <div className="text-left md:text-right">
                <div className="text-[7px] md:text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1 font-mono">Total DB Loss</div>
                <div className="text-lg md:text-xl font-mono font-bold text-[#ff4e00]">{totalAttenuation.toFixed(1)} dB</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#ff4e00]/10 flex items-center justify-center shrink-0">
                 <TrendingDown size={16} className="text-[#ff4e00] md:w-[20px] md:h-[20px]" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 md:gap-8 flex-1 overflow-y-auto lg:overflow-y-auto xl:overflow-hidden pb-10 lg:pb-0 no-scrollbar">
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
           <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-4 md:p-6 shadow-xl">
              <div className="text-[10px] uppercase tracking-widest text-[#00d1ff] font-bold border-b border-[#2d3139] pb-3 md:pb-4 mb-4 md:mb-6">Physics Tuning</div>
              
              <div className="space-y-4 md:space-y-6">
                 <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Frequency</span>
                       <span className="text-white font-mono">{frequency} MHz</span>
                    </div>
                    <input type="range" min="2" max="15" step="0.5" value={frequency} onChange={(e) => setFrequency(parseFloat(e.target.value))} className="w-full accent-[#00d1ff]" />
                 </div>

                 <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Path Length</span>
                       <span className="text-white font-mono">{distance} cm</span>
                    </div>
                    <input type="range" min="1" max="15" step="0.5" value={distance} onChange={(e) => setDistance(parseFloat(e.target.value))} className="w-full accent-[#ffd700]" />
                 </div>

                 <div className="space-y-2 md:space-y-3">
                    <div className="text-[9px] md:text-[10px] text-[#8e9299] uppercase font-bold mb-1 md:mb-2">Medium Selection</div>
                    <div className="grid grid-cols-2 gap-2 text-center md:text-left text-ellipsis">
                       {Object.keys(coefficients).map(m => (
                         <button 
                           key={m}
                           onClick={() => setMedium(m)}
                           className={`px-1 sm:px-2 md:px-3 py-2 rounded-lg text-[8px] md:text-[9px] font-bold uppercase transition-all border w-full overflow-hidden text-ellipsis ${medium === m ? 'bg-[#00d1ff] text-black border-[#00d1ff]' : 'bg-black/40 text-[#8e9299] border-[#2d3139] hover:border-[#8e9299]'}`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#1a1c22] p-4 md:p-6 rounded-2xl border border-[#2d3139] relative overflow-hidden flex flex-col gap-3 md:gap-4">
              <div className="text-[9px] md:text-[10px] font-bold text-[#ffb800] uppercase tracking-widest">Half Value Layer</div>
              <div className="flex items-end gap-2">
                 <span className="text-2xl md:text-3xl font-mono font-bold text-white leading-none">{hvl.toFixed(2)}</span>
                 <span className="text-[9px] md:text-[10px] text-[#8e9299] font-mono mb-0.5 md:mb-1 uppercase tracking-tighter">cm</span>
              </div>
              <p className="text-[8px] md:text-[9px] text-[#8e9299] leading-relaxed italic border-l-2 border-[#ffb800] pl-3">
                 "The distance sound travels to reduce intensity to 50% (-3dB) of its original value."
              </p>
           </div>
        </aside>

        <main className="col-span-12 lg:col-span-8 xl:col-span-9 bg-black border border-[#2d3139] rounded-3xl flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden shadow-2xl min-h-[500px]">
           <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
           <div className="absolute top-4 md:top-6 left-4 md:left-10 text-[7px] md:text-[9px] font-mono text-[#00d1ff] opacity-60">ATTENUATION_WAVE_MAP</div>
           
           {/* Wave Degradation Visualization */}
           <div className="w-full max-w-4xl h-48 md:h-64 relative flex items-center overflow-hidden bg-[#0a0c10] border border-[#2d3139] rounded-2xl shadow-inner scroll-mask mt-4 md:mt-0">
              <svg viewBox="0 0 1000 200" className="w-full h-full preserve-3d">
                 {/* Attenuation Curve Line */}
                 <path 
                   d={`M 0 100 ${data.map(p => `L ${p.x * 66.6} ${100 - (p.amplitude * 80)}`).join(' ')}`}
                   fill="none"
                   stroke="#00d1ff"
                   strokeWidth="1"
                   strokeDasharray="4 4"
                   opacity="0.3"
                 />
                 <path 
                   d={`M 0 100 ${data.map(p => `L ${p.x * 66.6} ${100 + (p.amplitude * 80)}`).join(' ')}`}
                   fill="none"
                   stroke="#00d1ff"
                   strokeWidth="1"
                   strokeDasharray="4 4"
                   opacity="0.3"
                 />

                 {/* Real-time Waveform */}
                 <motion.path 
                   animate={{ 
                     d: Array.from({ length: 100 }, (_, i) => {
                       const x = i * 10;
                       const cmPos = x / 66.6;
                       const attenCoeff = coefficients[medium] * frequency;
                       const amp = Math.pow(10, -(attenCoeff * cmPos) / 20);
                       const y = 100 + Math.sin(x / 10 + Date.now() / 100) * (amp * 80);
                       return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                     }).join(' ')
                   }}
                   fill="none"
                   stroke={`url(#waveGradient)`}
                   strokeWidth="3"
                   strokeLinecap="round"
                 />
                 
                 <defs>
                   <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#00d1ff" />
                     <stop offset="50%" stopColor="#ffd700" />
                     <stop offset="100%" stopColor="#ff4e00" />
                   </linearGradient>
                 </defs>
              </svg>

              {/* Path markers */}
              <div className="absolute inset-x-0 bottom-0 flex justify-around px-2 text-[6px] md:text-[8px] font-mono text-[#8e9299]">
                 {[0, 2, 4, 6, 8, 10, 12, 14].map(cm => (
                   <div key={cm} className="flex flex-col items-center gap-1">
                      <div className="w-[1px] h-2 bg-[#2d3139]" />
                      <span>{cm}cm</span>
                   </div>
                 ))}
              </div>

              {/* Selection Marker */}
              <motion.div 
                 animate={{ x: `${(distance / 15) * 100}%` }}
                 className="absolute top-0 bottom-0 w-[1px] bg-white/40 shadow-[0_0_15px_white] z-10 flex flex-col items-center"
              >
                 <div className="bg-white text-black px-1.5 md:px-2 py-0.5 rounded text-[6px] md:text-[8px] font-bold mt-4 uppercase text-center w-max max-w-[50px] leading-tight">Target Depth</div>
              </motion.div>
           </div>

           <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
              <div className="bg-[#16181d] p-4 md:p-6 rounded-2xl border border-[#2d3139] flex flex-col gap-1 md:gap-2 relative group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#00d1ff]/5 to-transparent pointer-events-none" />
                 <div className="text-[7px] md:text-[8px] text-[#8e9299] font-bold uppercase tracking-widest">Reflection</div>
                 <div className="text-lg md:text-xl font-bold text-white">Scatter + Mirror</div>
                 <div className="text-[8px] md:text-[9px] text-[#00d1ff] font-mono">PRIMARY LOSS CAUSE</div>
              </div>

              <div className="bg-[#16181d] p-4 md:p-6 rounded-2xl border border-[#2d3139] flex flex-col gap-1 md:gap-2 relative group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/5 to-transparent pointer-events-none" />
                 <div className="text-[7px] md:text-[8px] text-[#8e9299] font-bold uppercase tracking-widest">Scattering</div>
                 <div className="text-lg md:text-xl font-bold text-white">Disorganized</div>
                 <div className="text-[8px] md:text-[9px] text-[#ffd700] font-mono">RAYLEIGH SCALE (f⁴)</div>
              </div>

              <div className="bg-[#16181d] p-4 md:p-6 rounded-2xl border border-[#2d3139] flex flex-col gap-1 md:gap-2 relative group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 to-transparent pointer-events-none" />
                 <div className="text-[7px] md:text-[8px] text-[#8e9299] font-bold uppercase tracking-widest">Absorption</div>
                 <div className="text-lg md:text-xl font-bold text-white">Heat Energy</div>
                 <div className="text-[8px] md:text-[9px] text-[#ff4e00] font-mono">LARGEST FRACTION</div>
              </div>
           </div>
        </main>
      </div>
      
      <style>{`
        .scroll-mask {
           mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </motion.div>
  );
}
