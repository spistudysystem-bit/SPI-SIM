import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function PulsedWaveModule() {
  const [depth, setDepth] = useState(10); // cm
  const [cyclesPerPulse, setCyclesPerPulse] = useState(3);
  
  // Calculations
  const frequency = 5; // MHz (fixed for simplicity in this module)
  const c = 1540; // m/s
  const wavelength = 1.54 / frequency; // mm (c = 1.54 mm/μs)
  
  const goReturnTime = depth * 13; // microseconds (13 microsecond rule)
  const prp = goReturnTime; // microseconds (Pulse Repetition Period)
  const prf = 1000 / (prp / 1000); // Hz (Pulse Repetition Frequency)
  
  const pulseDuration = cyclesPerPulse * (1 / frequency); // Pulse Duration in μs
  const spl = cyclesPerPulse * wavelength; // Spatial Pulse Length in mm
  const dutyFactor = (pulseDuration / prp) * 100;

  const data = useMemo(() => {
    return [
      { name: 'PRP (Period)', value: prp, unit: 'μs', color: '#00d1ff' },
      { name: 'PRF (Rate)', value: prf / 1000, unit: 'kHz', color: '#ffd700' },
      { name: 'Pulse Duration', value: pulseDuration, unit: 'μs', color: '#ff4d4d' },
      { name: 'Duty Factor (%)', value: dutyFactor * 10, unit: '%', color: '#ffb800' }, 
    ];
  }, [prp, prf, pulseDuration, dutyFactor]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      <div className="flex justify-between items-start md:items-end flex-col md:flex-row border-b border-[#2d3139] pb-6 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Pulse-Echo Fundamentals v3.1</div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">Depth <span className="text-[#8e9299]">& Time</span> Parameters</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
           {/* Intensity Cards */}
           <div className="p-3 md:p-4 bg-[#1a1c22] border border-[#2d3139] rounded-xl flex justify-between sm:justify-start items-center gap-4 group text-white flex-1 sm:flex-none">
              <div className="text-left sm:text-right">
                <div className="text-[7px] md:text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1">Max Intensity</div>
                <div className="text-lg md:text-xl font-mono font-bold text-[#ffd700]">SPTP</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#ffd700]/10 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#ffd700]" />
              </div>
           </div>
           <div className="p-3 md:p-4 bg-[#1a1c22] border border-[#2d3139] rounded-xl flex justify-between sm:justify-start items-center gap-4 group text-white flex-1 sm:flex-none">
              <div className="text-left sm:text-right">
                <div className="text-[7px] md:text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1">Average Heat</div>
                <div className="text-lg md:text-xl font-mono font-bold text-[#00d1ff]">SPTA</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#00d1ff]/10 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00d1ff]" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 md:gap-8 flex-1 overflow-y-auto lg:overflow-y-auto xl:overflow-hidden pb-10 lg:pb-0 no-scrollbar">
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
           <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-xl">
              <div className="text-[10px] uppercase tracking-widest text-[#00d1ff] font-bold border-b border-[#2d3139] pb-3 mb-6">Imaging Depth</div>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Total Range</span>
                       <span className="text-white font-mono">{depth} cm</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="25" 
                      value={depth} 
                      onChange={(e) => setDepth(parseInt(e.target.value))} 
                      className="w-full appearance-none h-[2px] bg-[#2d3139] accent-[#00d1ff] cursor-pointer" 
                    />
                 </div>

                 <div className="space-y-3 border-t border-[#2d3139] pt-6">
                    <div className="flex justify-between text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Cycles Per Pulse</span>
                       <span className="text-white font-mono">{cyclesPerPulse} Cycles</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="10" 
                      value={cyclesPerPulse} 
                      onChange={(e) => setCyclesPerPulse(parseInt(e.target.value))} 
                      className="w-full appearance-none h-[2px] bg-[#2d3139] accent-[#ff4d4d] cursor-pointer" 
                    />
                 </div>
                 <div className="p-4 bg-black/60 rounded-xl border border-[#2d3139] text-[10px] text-[#8e9299] leading-relaxed italic border-l-4 border-[#00d1ff]">
                   "13 Microsecond Rule: Sound takes 13μs to go 1cm and return in soft tissue."
                 </div>
              </div>
           </div>

           <div className="bg-[#1a1c22] p-6 rounded-2xl border border-[#2d3139] flex-1 relative overflow-y-auto xl:overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-1 bg-[#ffb800] shadow-[0_0_10px_#ffb800]" />
              <div className="text-[10px] font-bold text-[#ffb800] uppercase mb-6 tracking-widest">Pulse Performance Matrix</div>
              <div className="space-y-5 font-mono">
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-[9px] text-[#8e9299] uppercase">Go-Return Time:</span> 
                    <span className="text-lg font-bold text-white leading-none">{prp.toFixed(0)} <span className="text-[9px] font-normal opacity-50 uppercase">μs</span></span>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-[9px] text-[#8e9299] uppercase">Repetition Freq:</span> 
                    <span className="text-lg font-bold text-white leading-none">{(prf / 1000).toFixed(2)} <span className="text-[9px] font-normal opacity-50 uppercase">kHz</span></span>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-[9px] text-[#8e9299] uppercase">Spatial Pulse Len (SPL):</span> 
                    <span className="text-lg font-bold text-[#ff4d4d] leading-none">{spl.toFixed(2)} <span className="text-[9px] font-normal opacity-50 uppercase">mm</span></span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[9px] text-[#8e9299] uppercase">Duty Factor:</span> 
                    <span className="text-lg font-bold text-[#00d1ff] leading-none">{dutyFactor.toFixed(3)} <span className="text-[9px] font-normal opacity-50">%</span></span>
                 </div>
              </div>
              
              <div className="mt-8 flex flex-col gap-2">
                 <div className="text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1">Inverse Relationship</div>
                 <div className="w-full h-1 bg-[#2d3139] rounded-full overflow-hidden">
                    <motion.div 
                       animate={{ width: `${(1 - depth/25) * 100}%` }}
                       className="h-full bg-gradient-to-r from-red-500 to-green-500" 
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-mono opacity-50">
                    <span>LOW_PRF (DEEP)</span>
                    <span>HIGH_PRF (SHALLOW)</span>
                 </div>
              </div>
           </div>
        </aside>

        <main className="col-span-12 lg:col-span-8 xl:col-span-9 bg-black border border-[#2d3139] rounded-3xl flex flex-col p-6 md:p-8 overflow-hidden relative shadow-2xl min-h-[500px]">
           <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
           <div className="text-[9px] font-mono text-[#00d1ff] uppercase mb-4 md:mb-8 tracking-[4px] border-b border-[#2d3139] pb-4">Pulse Train Temporal Map [0xDD1]</div>
           
           <div className="flex-1 flex flex-col gap-6 md:gap-12 relative text-white items-center">
              {/* Pulse train visualization */}
              <div className="h-24 md:h-32 w-full border border-[#2d3139] bg-gradient-to-r from-black via-[#0c0d10] to-black rounded-2xl relative flex items-center overflow-hidden group shadow-inner shadow-black shrink-0">
                 <div className="absolute inset-0 bg-[#00d1ff]/5 pointer-events-none" />
                 
                 <div 
                   className="flex gap-16 md:gap-24 absolute left-4 md:left-8 flex-nowrap"
                   style={{ animation: `pulse-scroll-v3 ${depth * 0.4}s linear infinite` }}
                 >
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 md:gap-3 relative shrink-0">
                         <div className="absolute -top-4 md:-top-6 text-[6px] md:text-[8px] font-mono text-[#00d1ff] opacity-40">TX_{i+1}</div>
                         <motion.div 
                           animate={{ 
                             scale: [1, 1.1, 1],
                             boxShadow: [
                               '0 0 10px rgba(0,209,255,0.2)',
                               '0 0 30px rgba(0,209,255,0.4)',
                               '0 0 10px rgba(0,209,255,0.2)'
                             ]
                           }}
                           transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                           className="h-10 md:h-16 bg-gradient-to-b from-[#00d1ff] to-[#013540] rounded-lg md:rounded-xl relative overflow-hidden flex items-center justify-center border border-white/10" 
                           style={{ width: `${6 + cyclesPerPulse * 6}px` }}
                         >
                            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                            <div className="flex gap-[1px] md:gap-0.5 px-1 md:px-2">
                               {[...Array(cyclesPerPulse)].map((_, j) => (
                                   <div key={j} className="w-[1px] md:w-[2px] h-4 md:h-8 bg-white/40 rounded-full" />
                               ))}
                            </div>
                         </motion.div>
                         <span className="text-[6px] md:text-[8px] text-[#8e9299] uppercase font-mono tracking-widest">Pulse_Train</span>
                      </div>
                    ))}
                 </div>

                 {/* Indicators */}
                 <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-black to-transparent z-10" />
              </div>

              {/* PRP Arrow label overlay */}
              <div className="static md:absolute md:top-[160px] w-full px-4 md:px-10 flex flex-col items-center mt-4 md:mt-0 shrink-0">
                 <div className="w-full flex items-center gap-2 md:gap-4">
                    <div className="h-[1px] bg-[#2d3139] flex-1 relative hidden sm:block">
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00d1ff]" />
                    </div>
                    <div className="px-4 py-2 md:px-6 md:py-2 bg-[#16181d] border border-[#2d3139] rounded-full text-[8px] md:text-[10px] font-mono text-white shadow-2xl flex flex-col sm:flex-row items-center gap-1 sm:gap-3 mx-auto">
                       <span className="text-[#8e9299] uppercase font-bold tracking-[1px] md:tracking-[2px] text-[7px] md:text-[8px] text-center">PRP (Repetition Period)</span>
                       <span className="text-[#00d1ff] font-bold">{prp.toFixed(1)} μs</span>
                    </div>
                    <div className="h-[1px] bg-[#2d3139] flex-1 relative hidden sm:block">
                       <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00d1ff]" />
                    </div>
                 </div>
              </div>

              <div className="flex-1 w-full bg-black/40 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#2d3139] min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" stroke="#8e9299" fontSize={10} width={120} axisLine={false} tickLine={false} />
                       <Tooltip 
                         cursor={{fill: 'rgba(255,254,255,0.05)'}} 
                         contentStyle={{backgroundColor: '#16181d', border: '1px solid #2d3139', borderRadius: '12px', fontSize: '11px'}}
                       />
                       <Bar 
                          dataKey="value" 
                          fill="#00d1ff" 
                          radius={[0, 10, 10, 0]} 
                          barSize={28}
                        />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </main>
      </div>
      
      <style>{`
        @keyframes pulse-scroll-v3 {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}
