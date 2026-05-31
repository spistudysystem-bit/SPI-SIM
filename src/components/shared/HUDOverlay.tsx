
import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Activity, 
  Terminal, 
  Wifi, 
  Cpu, 
  ShieldCheck, 
  BarChart3,
  Clock
} from 'lucide-react';

export default function HUDOverlay() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Viewport Corners */}
      <div className="hidden md:block absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-[#00d1ff]/20 m-6 rounded-tl-2xl" />
      <div className="hidden md:block absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-[#00d1ff]/20 m-6 rounded-tr-2xl" />
      <div className="hidden md:block absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-[#00d1ff]/20 m-6 rounded-bl-2xl" />
      <div className="hidden md:block absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-[#00d1ff]/20 m-6 rounded-br-2xl" />

      {/* Top Status Bar */}
      <div className="hidden md:flex absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 to-transparent items-center justify-between px-12">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Activity size={12} className="text-[#00d1ff] animate-pulse" />
               <span className="text-[9px] font-mono text-[#00d1ff] uppercase tracking-widest font-bold">Sys_Status: Uplink_Established</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
               <Cpu size={12} className="text-[#8e9299]" />
               <span className="text-[9px] font-mono text-[#8e9299] uppercase">Proc_Load: 12.4%</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-mono text-[9px] text-[#8e9299]">
               <Clock size={12} />
               {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="flex items-center gap-2">
               <Wifi size={12} className="text-green-500" />
               <span className="text-[9px] font-mono text-green-500 uppercase tracking-tighter">Lat: 24ms</span>
            </div>
         </div>
      </div>

      {/* Side HUD Elements */}
      <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col gap-8 items-center bg-black/20 backdrop-blur-md p-4 rounded-full border border-white/5 py-10 opacity-60 hover:opacity-100 transition-opacity">
         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Zap size={16} className="text-[#ffd700]" />
         </motion.div>
         <BarChart3 size={16} className="text-[#00d1ff]" />
         <ShieldCheck size={16} className="text-green-500" />
         <div className="w-8 h-[1px] bg-white/10" />
         <div className="text-[8px] font-mono text-[#8e9299] -rotate-90 origin-center translate-y-4">SONIC_SIM_v2</div>
      </div>

      {/* Decorative Scanlines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay animate-scanning" 
           style={{ background: 'linear-gradient(transparent 50%, rgba(0,209,255,0.4) 50%)', backgroundSize: '100% 4px' }} />

      {/* Bottom Technical Readout */}
      <div className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-[#2d3139] px-8 py-3 rounded-2xl items-center gap-12 shadow-2xl opacity-40">
         <div className="flex flex-col items-center">
            <span className="text-[7px] text-[#8e9299] uppercase tracking-widest font-mono">Sim_Engine</span>
            <span className="text-[10px] text-white font-mono uppercase">Vite_V1540</span>
         </div>
         <div className="w-[1px] h-6 bg-[#2d3139]" />
         <div className="flex flex-col items-center">
            <span className="text-[7px] text-[#8e9299] uppercase tracking-widest font-mono">Grounding</span>
            <span className="text-[10px] text-[#ffd700] font-mono uppercase">ARDMS_Physics_2020</span>
         </div>
         <div className="w-[1px] h-6 bg-[#2d3139]" />
         <div className="flex flex-col items-center">
            <span className="text-[7px] text-[#8e9299] uppercase tracking-widest font-mono">Encryption</span>
            <span className="text-[10px] text-green-500 font-mono uppercase">AES_256_ACTIVE</span>
         </div>
      </div>

      {/* Subtle vignettes */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}
