import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Info, Video } from 'lucide-react';

const ARTIFACTS = [
  {
    id: 'reverberation',
    name: 'Reverberation',
    description: 'Caused by the bouncing of the sound wave between two strong reflectors or a reflector and the transducer face.',
    logic: 'The machine incorrectly assumes a long "go-return" time means the reflector is deep, rather than multiple bounces.',
    clues: 'Multiple, equally spaced echoes parallel to the sound beam with decreasing intensity with depth.',
    violation: 'Violates: Sound travels directly to a reflector and back.',
    visual: 'lines'
  },
  {
    id: 'shadowing',
    name: 'Shadowing',
    description: 'A signal-free region appearing deeper than a highly attenuating or reflecting structure.',
    logic: 'The beam is either entirely reflected (bone) or absorbed (gallstone) by the structure, blocking deeper propagation.',
    clues: 'A dark, anechoic streak beneath a bright reflector. Confirms a highly dense or calcified object.',
    violation: 'Violates: Amplitude of reflections correlates to tissue characteristics.',
    visual: 'dark-path'
  },
  {
    id: 'enhancement',
    name: 'Enhancement',
    description: 'Hyperechoic (bright) region appearing deeper than a structure with abnormally low attenuation.',
    logic: 'Sound travels through fluid (cyst) with less energy loss than surrounding tissue, making deeper echoes appear too bright.',
    clues: 'A bright column beneath a low-attenuating structure. Proof that a dark void is fluid-filled (simple cyst).',
    violation: 'Violates: Uniform attenuation across the entire beam path.',
    visual: 'bright-path'
  },
  {
    id: 'mirror',
    name: 'Mirror Image',
    description: 'A duplicate version of an anatomical structure appearing deeper than the original.',
    logic: 'Sound reflects off a strong, curved specular reflector (like the diaphragm) before hitting the target and returning.',
    clues: 'A secondary, fuzzy version of a structure located on the opposite side of a highly reflective membrane.',
    violation: 'Violates: Sound only travels in a straight line.',
    visual: 'duplicate'
  },
  {
    id: 'comet-tail',
    name: 'Comet Tail',
    description: 'A continuous, solid hyperechoic line extending downward from a small, strong reflector.',
    logic: 'Small spacing between reflective surfaces (e.g. cholesterol crystals) causes internal resonance/reverb.',
    clues: 'A solid, bright, downward-directed tail. Often found in adenomyomatosis of the gallbladder or surgical clips.',
    violation: 'A form of reverberation with extremely narrow spacing.',
    visual: 'comet'
  },
  {
    id: 'ring-down',
    name: 'Ring Down',
    description: 'A type of resonance artifact appearing as a vertical streak through the entire image field.',
    logic: 'Sound waves resonate within a fluid trapped between small gas bubbles, creating a continuous source of energy.',
    clues: 'A bright, steady vertical line extend through the entire clinical field. Often indicates gas in bowel or abscess.',
    violation: 'Continuous energy emission from a stationary source.',
    visual: 'ring'
  }
];

interface ArtifactsModuleProps {
  setViewMode?: (mode: any) => void;
}

export default function ArtifactsModule({ setViewMode }: ArtifactsModuleProps) {
  const [selected, setSelected] = useState(ARTIFACTS[0]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden bg-[#0c0d10]"
    >
      {/* Left List & Selection */}
      <div className="w-full xl:w-[380px] border-b xl:border-b-0 xl:border-r border-[#2d3139] flex flex-col p-6 lg:p-8 gap-4 lg:gap-6 hud-grid shrink-0 xl:shrink">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-mono text-[#8e9299] tracking-[3px]">DB_QUERY: ARTIFACTS</div>
          <h2 className="text-2xl lg:text-3xl font-serif italic text-white flex flex-row xl:flex-col gap-2 xl:gap-0">
            Diagnostic <span>Glitch</span>
          </h2>
          <div className="w-24 h-[1px] bg-[#00d1ff] mt-2 opacity-50 hidden xl:block" />
        </div>

        <div className="flex xl:flex-col gap-2 lg:gap-3 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0 no-scrollbar snap-x">
          {ARTIFACTS.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`p-3 lg:p-4 text-left border rounded-xl transition-all relative overflow-hidden group shrink-0 w-[160px] xl:w-auto snap-start ${selected.id === a.id ? 'border-[#00d1ff] bg-[#00d1ff]/10' : 'border-[#1a1c22] bg-[#16181d] hover:border-[#2d3139]'}`}
            >
              <div className={`absolute top-0 left-0 w-1 xl:h-full xl:w-1 h-1 w-full transition-colors ${selected.id === a.id ? 'bg-[#00d1ff]' : 'bg-transparent'}`} />
              <div className="text-xs lg:text-sm font-bold text-white uppercase tracking-tight group-hover:text-[#00d1ff] transition-colors line-clamp-1">{a.name}</div>
              <div className="text-[8px] lg:text-[9px] text-[#8e9299] mt-1 font-mono uppercase tracking-widest">{a.visual.replace('-', '_')}</div>
            </button>
          ))}
        </div>

        <div className="mt-auto p-3 lg:p-4 bg-[#1a1c22]/50 border border-[#2d3139] rounded-lg hidden md:block">
           <div className="text-[10px] text-green-400 font-bold mb-2">PRO_TIP // SPI</div>
           <p className="text-[10px] lg:text-[11px] text-[#8e9299] leading-relaxed italic font-serif">
             Artifacts are not errors; they are physical results that violate the machine's basic assumptions.
           </p>
        </div>
      </div>

      {/* Main Analysis View */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="p-6 lg:p-8 pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 box-border border-b sm:border-none border-[#2d3139] pb-4 sm:pb-0">
          <div className="flex items-center gap-3 lg:gap-4">
             <div className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-lg bg-[#00d1ff]/20 flex items-center justify-center border border-[#00d1ff]/40">
                <Info size={16} className="text-[#00d1ff] lg:w-[20px] lg:h-[20px]" />
             </div>
             <div>
                <h3 className="text-xl lg:text-2xl font-serif italic text-white leading-tight flex items-center gap-2 flex-wrap">
                   {selected.name} <span className="text-[#8e9299]">Analysis</span>
                   <button
                     onClick={() => {
                        (window as any).showInfoFullScreen?.({
                           title: `${selected.name} Artifact Case File`,
                           badge: `CLINICAL ARTIFACT FILE // ${selected.id.toUpperCase()}`,
                           subtitle: selected.description,
                           content: `<strong>Physiological Phenomenon:</strong><br/>${selected.description}<br/><br/><strong>Diagnostic Machine Logic Breakdown:</strong><br/>${selected.logic}`,
                           concept: `<strong>How to Identify in Clinic (Visual Clues):</strong><br/>${selected.clues}`,
                           alert: `<strong>Registry Critical Assumption Violated:</strong><br/>${selected.violation}`
                        });
                     }}
                     className="px-2 py-0.5 text-[8.5px] font-mono tracking-widest text-[#00d1ff] bg-[#00d1ff]/10 hover:bg-[#00d1ff]/25 border border-[#00d1ff]/30 hover:border-[#00d1ff]/50 rounded cursor-pointer transition-all uppercase"
                     title="View Full Case File"
                   >
                      Fullscreen Case study
                   </button>
                </h3>
                <div className="text-[8px] lg:text-[9px] font-mono text-[#00d1ff] uppercase tracking-[2px] lg:tracking-[3px] line-clamp-1">STATUS: RECONSTRUCTING_PHYSICS...</div>
             </div>
          </div>
          <button 
             onClick={() => setViewMode?.('library')}
             className="flex w-full sm:w-auto justify-center items-center gap-2 lg:gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full transition-all group shadow-lg shrink-0"
           >
             <Video size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform lg:w-[16px] lg:h-[16px]" />
             <span className="text-[9px] lg:text-[11px] font-bold text-white uppercase tracking-widest leading-none">Execute Video Probe</span>
           </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row p-6 lg:p-8 gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden">
          {/* Visual Reconstruction */}
          <div className="flex-1 bg-black rounded-2xl border border-[#1a1c22] shadow-inner relative flex items-center justify-center p-12 overflow-hidden border-2 border-white/5 mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-[#00d1ff]/10 to-transparent animate-scanning z-0 opacity-50" />
            <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
            
            <div className="z-10 bg-black/40 p-12 rounded-full border border-white/5 shadow-2xl backdrop-blur-sm relative">
              {selected.id === 'reverberation' && (
                <div className="space-y-5 flex flex-col items-center">
                   {[1, 0.8, 0.6, 0.4, 0.2].map((op, i) => (
                     <motion.div 
                        key={i} 
                        initial={{ width: 0 }} 
                        animate={{ width: 180 }} 
                        transition={{ delay: i * 0.1 }}
                        className="h-1 bg-white rounded-full" 
                        style={{ opacity: op }} 
                     />
                   ))}
                </div>
              )}
              {selected.id === 'shadowing' && (
                <div className="relative flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.4)] relative z-20" />
                  <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-20 h-48 bg-gradient-to-b from-black/80 to-transparent z-10" />
                </div>
              ) }
              {selected.id === 'enhancement' && (
                <div className="relative flex flex-col items-center">
                   <div className="w-24 h-24 rounded-full border-2 border-[#00d1ff]/50 bg-[#00d1ff]/10 relative z-20" />
                   <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-20 h-48 bg-gradient-to-b from-white/20 to-transparent z-10 blur-[4px]" />
                </div>
              )}
              {selected.id === 'mirror' && (
                <div className="flex flex-col gap-20 relative items-center">
                   <div className="w-20 h-20 bg-red-400/20 border-2 border-red-400/60 rounded-xl relative z-20" />
                   <div className="w-56 h-[1px] bg-[#00d1ff] rotate-[-5deg] shadow-[0_0_15px_#00d1ff] relative z-10" />
                   <div className="w-20 h-20 bg-red-400/5 border border-red-400/20 rounded-xl blur-[2px] opacity-40 shadow-inner" />
                </div>
              )}
              {selected.id === 'comet-tail' && (
                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rotate-45 bg-white shadow-[0_0_20px_white] z-20" />
                   <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 200 }}
                      className="w-14 bg-gradient-to-b from-white via-[#00d1ff]/50 to-transparent clip-triangle" 
                   />
                </div>
              )}
              {selected.id === 'ring-down' && (
                <div className="flex flex-col items-center">
                   <div className="flex gap-2 mb-[-10px]">
                      <div className="w-5 h-5 rounded-full border border-white/50 bg-[#00d1ff]/30 animate-bounce" />
                      <div className="w-4 h-4 rounded-full border border-white/50 bg-[#00d1ff]/20 animate-bounce delay-100" />
                   </div>
                   <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5], width: [2, 6, 2] }}
                      transition={{ duration: 0.1, repeat: Infinity }}
                      className="h-56 bg-[#00d1ff] shadow-[0_0_30px_#00d1ff]" 
                   />
                </div>
              )}
            </div>
          </div>

          {/* Technical breakdown */}
          <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto no-scrollbar">
             <div className="p-5 bg-[#16181d] border border-[#2d3139] rounded-xl shadow-lg border-l-4 border-l-[#00d1ff]">
                <div className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest mb-1 font-bold underline">Diagnostic Logic</div>
                <p className="text-[12px] text-[#e0e0e0] leading-relaxed italic">{selected.logic}</p>
             </div>

             <div className="p-5 bg-black/40 border border-[#2d3139] rounded-xl border-l-4 border-l-[#ffd700]">
                <div className="text-[10px] font-mono text-[#ffd700] uppercase tracking-widest mb-1 font-bold underline">Visual Clues</div>
                <p className="text-[12px] text-[#e0e0e0] leading-relaxed">{selected.clues}</p>
             </div>

             <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-xl border-l-4 border-l-red-500">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1 font-bold underline">Assumption Violated</div>
                <p className="text-[12px] text-[#e0e0e0] leading-relaxed">{selected.violation}</p>
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .clip-triangle {
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          transform: rotate(180deg);
        }
      `}</style>
    </motion.div>
  );
}
