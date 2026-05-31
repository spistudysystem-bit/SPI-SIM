import React from 'react';
import { motion } from 'motion/react';

interface ResolutionsModuleProps {
  axialRes: number;
  wavelength: number;
}

export default function ResolutionsModule({ axialRes, wavelength }: ResolutionsModuleProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      <div className="flex justify-between items-start lg:items-end flex-col lg:flex-row border-b border-[#2d3139] pb-6 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Spatial Accuracy Analysis</div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">Resolution <span className="text-[#8e9299]">& Selectivity</span></div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
           <div className="p-3 md:p-4 bg-[#1a1c22] border border-[#2d3139] rounded-xl flex flex-col items-start lg:items-end flex-1 lg:flex-none">
              <div className="text-[7px] md:text-[8px] font-mono text-[#8e9299] uppercase tracking-widest mb-1 font-bold">LARRD / LATA Metrics</div>
              <div className="text-lg md:text-xl font-mono font-bold text-white uppercase">Phantom Mode</div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 md:gap-10 overflow-y-auto no-scrollbar pb-10 md:pb-0">
        <div className="col-span-12 lg:col-span-8 bg-black border-2 border-[#1a1c22] rounded-3xl relative overflow-hidden flex flex-col shadow-2xl min-h-[400px]">
           <div className="absolute inset-0 hud-grid opacity-10" />
           <div className="absolute top-4 md:top-6 left-4 md:left-6 text-[7px] md:text-[9px] font-mono text-[#00d1ff] uppercase tracking-widest opacity-60">SPATIAL_ENVELOPE_RENDER</div>
           
           <div className="flex-1 flex flex-col sm:flex-row lg:flex-col items-center justify-around p-8 md:p-20 relative">
              {/* Axial Resolution visualization */}
              <div className="flex flex-col items-center group relative cursor-help">
                <div className="static sm:absolute sm:-left-32 sm:top-1/2 sm:-translate-y-1/2 flex flex-col items-center sm:items-end mb-4 sm:mb-0">
                   <div className="text-[8px] font-bold text-[#ffd700] uppercase tracking-widest mb-1">Axial Pair</div>
                   <div className="text-[10px] md:text-xs font-mono text-white">Min Dist: {axialRes.toFixed(2)}mm</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_20px_white] z-10" />
                <motion.div 
                  animate={{ marginTop: `${Math.max(5, axialRes * 50)}px` }}
                  className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_20px_white] z-10 relative" 
                >
                   <div className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
                </motion.div>
                <div className="absolute top-0 bottom-0 w-[1px] bg-white/10 -z-0" />
              </div>

              {/* Lateral Resolution visualization */}
              <div className="flex items-center group relative cursor-help">
                <div className="static sm:absolute sm:-left-32 sm:top-1/2 sm:-translate-y-1/2 flex flex-col items-center sm:items-end mb-4 sm:mb-0 mr-4 sm:mr-0">
                   <div className="text-[8px] font-bold text-[#00d1ff] uppercase tracking-widest mb-1">Lateral Pair</div>
                   <div className="text-[10px] md:text-xs font-mono text-white">Dist: {(1.2 * wavelength).toFixed(2)}mm</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#00d1ff] shadow-[0_0_25px_rgba(0,209,255,0.4)] relative">
                     <div className="absolute inset-0 bg-[#00d1ff]/30 animate-pulse rounded-full" />
                  </div>
                  <motion.div 
                    animate={{ marginLeft: `${Math.max(10, (1.2 * wavelength) * 40)}px` }}
                    className="w-3.5 h-3.5 rounded-full bg-[#00d1ff] shadow-[0_0_25px_rgba(0,209,255,0.4)]" 
                  />
                </div>
              </div>
           </div>

           <div className="min-h-16 md:h-20 border-t border-[#1a1c22] bg-[#0c0d10] flex flex-col md:flex-row items-start md:items-center p-4 md:px-10 gap-2 md:gap-8 justify-center">
              <div className="text-[8px] md:text-[10px] font-mono text-[#8e9299] flex flex-col sm:flex-row gap-2 sm:gap-8 items-start sm:items-center">
                <span className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                   AXIAL (LARRD: Longitudinal, Axial...)
                </span>
                <span className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] shrink-0" />
                   LATERAL (LATA: Lateral, Angular...)
                </span>
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-xl flex-1">
              <div className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest mb-6 border-b border-[#2d3139] pb-2">Physics Logic</div>
              <div className="space-y-6">
                 <div>
                    <div className="text-[11px] font-bold text-white uppercase mb-2">Axial Theorem</div>
                    <div className="text-[10px] text-[#8e9299] leading-relaxed mb-3">Resolution is equal to half the Spatial Pulse Length (SPL). Shorter pulses mean better (smaller) resolution.</div>
                    <div className="px-3 py-2 bg-black rounded border border-[#2d3139] text-[9px] font-mono text-[#ffd700]">Axial = 1/2 SPL</div>
                 </div>
                 <div>
                    <div className="text-[11px] font-bold text-white uppercase mb-2">Lateral Theorem</div>
                    <div className="text-[10px] text-[#8e9299] leading-relaxed mb-3">Lateral resolution is equal to the beam diameter. Best at the focus where the beam is narrowest.</div>
                    <div className="px-3 py-2 bg-black rounded border border-[#2d3139] text-[9px] font-mono text-[#00d1ff]">Best @ Focal Point</div>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#1a1c22] border border-[#2d3139] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#ffb800]" />
              <div className="text-[9px] text-[#ffb800] font-bold uppercase tracking-widest mb-3">Clinical Tip</div>
              <p className="text-[10px] text-[#8e9299] leading-relaxed font-medium"> Axial resolution is generally BETTER than lateral because pulses are engineered to be short, while beam width is physically constrained.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
