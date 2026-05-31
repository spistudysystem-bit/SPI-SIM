import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Thermometer, Zap, Info, Video } from 'lucide-react';

interface SafetyModuleProps {
  setViewMode?: (mode: any) => void;
}

export default function SafetyModule({ setViewMode }: SafetyModuleProps) {
  const [power, setPower] = useState(50);
  const [exposureTime, setExposureTime] = useState(15);
  const [scanType, setScanType] = useState<'general' | 'fetal' | 'cardiac'>('general');
  
  // Simulated MI and TI calculations
  // MI = Peak Rarefactional Pressure / sqrt(Frequency)
  const mi = (power / 100) * 1.9;
  
  // TI relates to absorption and heat. 
  // TIS: Soft tissue, TIB: Bone, TIC: Cranial Bone
  const tis = (power / 100) * 1.2 + (exposureTime / 60) * 1;
  const tib = (power / 100) * 1.8 + (exposureTime / 60) * 2;
  const tic = (power / 100) * 1.5 + (exposureTime / 60) * 1.5;

  const getSafetyRisk = () => {
    if (scanType === 'fetal') return tis > 0.7 || tib > 0.7 || mi > 0.3;
    if (scanType === 'general') return mi > 1.0 || tis > 1.0;
    return mi > 1.9 || tis > 1.5; // Cardiac
  };

  const isSafetyRisk = getSafetyRisk();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex-1 flex flex-col p-8 gap-8 hud-dots bg-[#0c0d10] overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-[#2d3139] pb-6 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Diagnostic Safety Protocols</div>
          <div className="text-4xl font-serif italic text-white tracking-tight">Bioeffects <span className="text-[#8e9299]">& ALARA</span></div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Scan Type Selector */}
           <div className="flex bg-[#16181d] p-1 rounded-xl border border-[#2d3139]">
              {['general', 'fetal', 'cardiac'].map((type) => (
                <button
                  key={type}
                  onClick={() => setScanType(type as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-widest ${scanType === type ? 'bg-[#00d1ff] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]' : 'text-[#8e9299] hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
           </div>

           <button 
             onClick={() => setViewMode?.('library')}
             className="flex items-center gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-5 py-2.5 rounded-full transition-all group shrink-0"
           >
             <Video size={16} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-bold text-white uppercase tracking-widest">Video Safety Guide</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* Monitoring Panel */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">
           {/* Primary Indices */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* MI */}
              <div className="bg-[#16181d] border border-[#2d3139] p-6 rounded-2xl relative overflow-hidden group">
                 <div className="text-[9px] font-bold text-[#8e9299] uppercase tracking-widest mb-1">Mechanical Index (MI)</div>
                 <div className="text-4xl font-mono font-bold text-white mb-4">{mi.toFixed(2)}</div>
                 <div className="text-[10px] text-[#8e9299] leading-tight mb-4 min-h-[40px]">
                   Risk of Cavitation (SPPA). 1.9 is FDA limit.
                 </div>
                 <div className="w-full h-1.5 bg-[#2d3139] rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(mi/1.9) * 100}%` }} className={`h-full ${mi > 1.0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-[#ffd700]'}`} />
                 </div>
              </div>

              {/* TIS */}
              <div className="bg-[#16181d] border border-[#2d3139] p-6 rounded-2xl">
                 <div className="text-[9px] font-bold text-[#8e9299] uppercase tracking-widest mb-1 font-mono">Thermal Index: Soft (TIS)</div>
                 <div className="text-4xl font-mono font-bold text-white mb-4">{tis.toFixed(2)}</div>
                 <div className="text-[10px] text-[#8e9299] leading-tight mb-4 min-h-[40px]">
                   Heat Risk (SPTA). TI of 1 = rise of 1°C. Page 41.
                 </div>
                 <div className="w-full h-1.5 bg-[#2d3139] rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(tis/2.5) * 100}%` }} className="h-full bg-orange-400" />
                 </div>
              </div>

              {/* TIB */}
              <div className="bg-[#16181d] border border-[#2d3139] p-6 rounded-2xl">
                 <div className="text-[9px] font-bold text-[#8e9299] uppercase tracking-widest mb-1 font-mono">Thermal Index: Bone (TIB)</div>
                 <div className="text-4xl font-mono font-bold text-white mb-4">{tib.toFixed(2)}</div>
                 <div className="text-[10px] text-[#8e9299] leading-tight mb-4 min-h-[40px]">
                   Heat near Bone. Critical in late 2nd/3rd trimester fetal scans.
                 </div>
                 <div className="w-full h-1.5 bg-[#2d3139] rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(tib/3.5) * 100}%` }} className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                 </div>
              </div>

              {/* TIC */}
              <div className="bg-[#16181d] border border-[#2d3139] p-6 rounded-2xl">
                 <div className="text-[9px] font-bold text-[#8e9299] uppercase tracking-widest mb-1 font-mono">Thermal Index: Cranial (TIC)</div>
                 <div className="text-4xl font-mono font-bold text-white mb-4">{tic.toFixed(2)}</div>
                 <div className="text-[10px] text-[#8e9299] leading-tight mb-4 min-h-[40px]">
                   Heat where bone is near transducer surface (Adult Head).
                 </div>
                 <div className="w-full h-1.5 bg-[#2d3139] rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(tic/3) * 100}%` }} className="h-full bg-orange-600" />
                 </div>
              </div>
           </div>

           {/* Visualization Section */}
           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black border border-[#2d3139] rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-inner">
                 <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert size={18} className={isSafetyRisk ? 'text-red-500 animate-pulse' : 'text-[#00d1ff]'} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">ALARA Threshold Visualization</span>
                 </div>
                 <div className="flex-1 flex items-end justify-between gap-1 px-4">
                    {[...Array(15)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: `${(power/100) * (30 + Math.random() * 70)}%` }}
                        transition={{ duration: 0.15, repeat: Infinity, repeatType: 'reverse' }}
                        className={`w-full rounded-t-sm transition-colors ${isSafetyRisk ? 'bg-gradient-to-t from-red-600/40 to-red-500' : 'bg-gradient-to-t from-[#00d1ff]/40 to-[#00d1ff]'}`}
                      />
                    ))}
                 </div>
                 <div className="mt-6 flex justify-between text-[9px] font-mono text-[#8e9299]">
                    <span>0 Hz</span>
                    <span>SPTA INTENSITY (mW/cm²)</span>
                    <span>15 MHz</span>
                 </div>
              </div>

              <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-8 flex flex-col justify-center">
                 <h4 className="text-[11px] font-bold text-[#ffd700] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} /> Clinical Significance
                 </h4>
                 <ul className="space-y-4">
                    <li className="flex gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] mt-1.5 shrink-0" />
                       <p className="text-[11px] text-[#8e9299] leading-relaxed">
                          <strong className="text-white block mb-1">ALARA PRINCIPLE</strong>
                          Output intensity should be "As Low As Reasonably Achievable" while maintaining image quality.
                       </p>
                    </li>
                    <li className="flex gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] mt-1.5 shrink-0" />
                       <p className="text-[11px] text-[#8e9299] leading-relaxed">
                          <strong className="text-white block mb-1">PULSED WAVE DOPPLER</strong>
                          Has the highest output intensity. Caution required during fetal heart rate checks.
                       </p>
                    </li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Controls Sidebar */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
           {/* Active Controls */}
           <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-8 shadow-2xl border-t-2 border-t-[#00d1ff]">
              <div className="text-[10px] uppercase tracking-widest text-white font-bold mb-8 flex justify-between">
                 <span>Radiation Setup</span>
                 <span className="text-[#00d1ff] font-mono">LIVE_FEED</span>
              </div>
              <div className="space-y-10">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div className="text-[11px] font-bold text-[#8e9299] uppercase tracking-tight">System Gain / Power</div>
                       <div className="text-2xl font-mono text-white leading-none">{power}%</div>
                    </div>
                    <input 
                       type="range" min="1" max="100" value={power} 
                       onChange={e => setPower(parseInt(e.target.value))} 
                       className="w-full h-1.5 bg-[#2d3139] rounded-lg appearance-none cursor-pointer accent-[#00d1ff]"
                    />
                    <div className="text-[9px] text-[#8e9299] italic italic">Peak Rarefactional Pressure (PRP) directly proportional.</div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div className="text-[11px] font-bold text-[#8e9299] uppercase tracking-tight">Dwell Time on Target</div>
                       <div className="text-2xl font-mono text-white leading-none">{exposureTime} <span className="text-[12px] opacity-50">min</span></div>
                    </div>
                    <input 
                       type="range" min="1" max="60" value={exposureTime} 
                       onChange={e => setExposureTime(parseInt(e.target.value))} 
                       className="w-full h-1.5 bg-[#2d3139] rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="text-[9px] text-[#8e9299] italic">Temporal Average Intensity (SPTA) accumulates over time.</div>
                 </div>
              </div>
           </div>

           {/* Hazard Alert */}
           {isSafetyRisk && (
              <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-red-500/10 border-2 border-red-500/40 p-6 rounded-2xl flex flex-col gap-3"
              >
                 <div className="flex items-center gap-3 text-red-500 font-bold uppercase text-[12px] tracking-widest">
                    <ShieldAlert size={20} className="animate-pulse" /> Safety Violation
                 </div>
                 <p className="text-[11px] text-red-400/80 leading-relaxed">
                   The current settings exceed the AIUM safety threshold for a <strong className="text-red-500 uppercase">{scanType}</strong> scan. Reduction of output power or dwell time is strictly advised to minimize bioeffects.
                 </p>
              </motion.div>
           )}

           {/* Bioeffects Education */}
           <div className="bg-[#1a1c22]/50 border border-[#2d3139] rounded-2xl p-6">
              <div className="flex items-center gap-2 text-[#ffd700] mb-4">
                 <Zap size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Cavitation Physics</span>
              </div>
              <div className="space-y-4">
                 <div>
                    <div className="text-[10px] text-white font-bold mb-1">STABLE CAVITATION</div>
                    <p className="text-[10px] text-[#8e9299] leading-tight">Low MI. Gas bubbles oscillate but don't burst. Causes microstreaming stress.</p>
                 </div>
                 <div className="w-full h-px bg-[#2d3139]" />
                 <div>
                    <div className="text-[10px] text-white font-bold mb-1">TRANSIENT CAVITATION</div>
                    <p className="text-[10px] text-[#8e9299] leading-tight">High MI. Bubbles implode, creating localized massive heat and pressure shock waves.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
