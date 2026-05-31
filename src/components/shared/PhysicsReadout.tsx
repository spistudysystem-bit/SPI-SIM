import React from 'react';
import { Cpu, Info } from 'lucide-react';

interface PhysicsReadoutProps {
  frequency: number;
  wavelength: number;
  reflectionCoeff: number;
  axialRes: number;
}

export default function PhysicsReadout({ 
  frequency, 
  wavelength, 
  reflectionCoeff, 
  axialRes 
}: PhysicsReadoutProps) {
  return (
    <div className="mt-auto p-5 bg-[#16181d] border-l-2 border-l-[#00d1ff] rounded-r shadow-2xl relative overflow-hidden group">
      <div className="text-[11px] uppercase tracking-wider text-[#00d1ff] mb-3 font-bold flex items-center gap-2">
        <Cpu size={14} /> Global Analysis
      </div>
      <div className="space-y-2 font-mono text-[10px] opacity-80">
        <div className="flex justify-between"><span>Frequency:</span> <span className="text-white">{frequency.toFixed(2)} MHz</span></div>
        <div className="flex justify-between"><span>Wavelength λ:</span> <span className="text-white">{wavelength.toFixed(3)} mm</span></div>
        <div className="flex justify-between"><span>Reflect R:</span> <span className={reflectionCoeff > 0.8 ? "text-red-400" : "text-white"}>{(reflectionCoeff * 100).toFixed(1)}%</span></div>
        <div className="flex justify-between"><span>Axial Res:</span> <span className="text-emerald-400">{axialRes.toFixed(2)} mm</span></div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#2d3139]">
         <div className="text-[9px] text-[#ffd700] uppercase font-bold mb-1">13 μs Rule (Round Trip)</div>
         <div className="text-[9px] text-[#8e9299] leading-tight italic">
            For every 13μs of round-trip time, the reflector is 1cm deeper. (Page 19)
         </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
         <span className="text-[9px] text-[#8e9299] italic">ALARA: Low Power, High Gain</span>
         <Info size={12} className="text-[#8e9299]" />
      </div>
    </div>
  );
}
