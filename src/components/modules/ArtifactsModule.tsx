import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Info, Video } from 'lucide-react';

import ShadowingImg from '../../assets/images/artifact_shadowing_1780412446421.png';
import EnhancementImg from '../../assets/images/artifact_enhancement_1780412462440.png';
import MirrorImg from '../../assets/images/artifact_mirror_1780412477271.png';

const ARTIFACTS = [
  {
    id: 'reverberation',
    name: 'Reverberation',
    category: 'Depth Artifact',
    description: 'Multiple representations in the image of the same interface. Caused by repeated reflections between two interfaces with high acoustic impedance mismatch (e.g. tissue/bone, tissue/lung).',
    logic: 'The machine incorrectly assumes a long "go-return" time means the reflector is deep, placing echoes at twice the distance on the display.',
    clues: 'Multiple, equally spaced horizontal echoes parallel to the sound beam with decreasing intensity with depth.',
    violation: 'Violates: Sound travels directly to a reflector and back.',
    visual: 'lines'
  },
  {
    id: 'shadowing',
    name: 'Shadowing',
    category: 'Attenuation Artifact',
    description: 'Reduction in amplitude of echoes deep to an attenuating surface or object. Can be clean (tissue/bone) or dirty (soft tissue/lung/bowel).',
    logic: 'The beam is reflected or absorbed by a highly attenuating structure (bone, gallstone), blocking deeper propagation so deep echoes are extremely low intensity.',
    clues: 'A dark, anechoic streak beneath a bright reflector. Confirms a highly dense or calcified object.',
    violation: 'Violates: Amplitude of reflections correlates directly and purely to tissue characteristics.',
    visual: 'dark-path',
    image: ShadowingImg
  },
  {
    id: 'enhancement',
    name: 'Acoustic Enhancement',
    category: 'Attenuation Artifact',
    description: 'Occurs due to reduced attenuation through an area relative to surrounding tissue (e.g. cyst, gallbladder), resulting in an area of increased brightness deep to the structure.',
    logic: 'Sound travels through fluid with less energy loss than surrounding tissue, meaning echoes from deeper structures are received with greater amplitude.',
    clues: 'A bright column beneath a low-attenuating fluid-filled structure. Mitigated by adjusting gain and TGC.',
    violation: 'Violates: Uniform attenuation across the entire beam path.',
    visual: 'bright-path',
    image: EnhancementImg
  },
  {
    id: 'mirror',
    name: 'Mirror Image',
    category: 'Reflection Artifact',
    description: 'A duplicate artifactual version of an anatomical structure appearing deeper than the original. Occurs at specular interfaces like the diaphragm.',
    logic: 'Sound reflects off a strong specular reflector before hitting the target. Returning echoes follow the same path, and the machine measures total time, displaying it deeper along the line of sight.',
    clues: 'A secondary, fuzzy version of a structure located on the opposite side of a highly reflective boundary (e.g. liver mass deep to diaphragm).',
    violation: 'Violates: Sound always travels in a straight line.',
    visual: 'duplicate',
    image: MirrorImg
  },
  {
    id: 'slice-thickness',
    name: 'Slice Thickness',
    category: 'Beam Dimension Artifact',
    description: 'Occurs when the imaging plane is thicker than the structure being scanned. Causes low-level echoes (pseudosludge) to appear in otherwise anechoic structures like the bladder or gallbladder.',
    logic: 'The beam acquires echoes from a relatively thick volume in the Z-elevation plane. The system averages these out across the slice, incorrectly placing off-center echoes inside hollow structures.',
    clues: 'Faint internal echoes inside cysts or bladders that should remain purely black.',
    violation: 'Violates: The imaging plane is infinitely thin.',
    visual: 'elevation_blur'
  },
  {
    id: 'beamwidth',
    name: 'Beamwidth',
    category: 'Beam Dimension Artifact',
    description: 'Causes degradation of lateral resolution leading to lateral smearing of targets that are scanned outside the focal zone or non-perpendicularly.',
    logic: 'The beam is wider than the target. The machine assumes all echoes return from the thin central axis, so it stretches the point laterally in the image.',
    clues: 'Smearing of boundaries, prominent at non-perpendicular beam incidence or deep in the far field where the beam diverges.',
    violation: 'Violates: The ultrasound beam is razor-thin and travels uniformly.',
    visual: 'lateral-smear'
  },
  {
    id: 'sidelobe',
    name: 'Sidelobe / Grating Lobe',
    category: 'Beam Dimension Artifact',
    description: 'Multiple low-intensity beams outside the central axis (sidelobes) strike a strong reflector and the echoes are wrongly assumed to come from the main beam.',
    logic: 'Strong reflectors hit by off-axis lobes return echoes that the machine plots straight down the main central axis.',
    clues: 'Extraneous curved lines or diffuse faint echoes in anechoic areas (like bowel gas projecting into an adjacent gallbladder).',
    violation: 'Violates: All echoes detected originate exclusively from the central axis.',
    visual: 'off-axis'
  },
  {
    id: 'refraction',
    name: 'Refraction (Ghosting)',
    category: 'Beam Path Artifact',
    description: 'The beam is bent during transmission (e.g. through rectus muscles acting as a biconvex lens), causing a laterally displaced duplicate image.',
    logic: 'The system assumes the beam travelled straight. When refracted laterally to hit a target, the returning echo is placed straight down the original path, creating a double.',
    clues: 'Side-by-side duplication of a structure (e.g., duplicated aorta or gestational sac deep to rectus muscles).',
    violation: 'Violates: Transmit pulses and echoes travel strictly in a straight line.',
    visual: 'split-image'
  },
  {
    id: 'comet-tail',
    name: 'Comet Tail',
    category: 'Depth Artifact',
    description: 'A type of reverberation caused by very closely spaced interfaces (small calcifications), resulting in a short tapering artifact resembling a comet tail.',
    logic: 'Small spacing limits discernable separate bands; multiple rapid bounces merge into a solid trailing streak.',
    clues: 'Solid bright tail from microlithiasis or adenomyomatosis.',
    violation: 'Violates: Sound travels directly to a reflector and back.',
    visual: 'comet'
  },
  {
    id: 'ring-down',
    name: 'Ring Down',
    category: 'Depth Artifact',
    description: 'Reverberation between multiple small gas bubbles (or resonant ringing), producing a continuous bright streak through the image.',
    logic: 'High reflection coefficient of bubbles produces high intensity echoes through the whole depth. They resonate and do not return from a discrete point.',
    clues: 'Steady bright vertical streak. Examples: B-lines in wet lungs or gas in bowel.',
    violation: 'Violates: Sound travels directly to a reflector and back.',
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

        <div className="flex xl:flex-col gap-2 lg:gap-3 overflow-x-auto xl:overflow-y-auto pb-2 xl:pb-0 no-scrollbar snap-x h-auto xl:min-h-0 xl:flex-1">
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
            
            {selected.image ? (
              <div className="z-10 relative flex flex-col items-center">
                 <img src={selected.image} alt={selected.name} className="max-w-full max-h-[300px] object-contain rounded-xl border border-white/10 shadow-2xl" />
                 <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
              </div>
            ) : (
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
                {selected.id === 'slice-thickness' && (
                  <div className="relative flex flex-col items-center w-48 h-48 rounded-full border-4 border-slate-700 bg-black overflow-hidden">
                     <div className="absolute inset-0 bg-blue-900/20" />
                     <motion.div 
                        animate={{ y: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute bottom-0 w-full h-1/3 bg-slate-500/40 blur-md"
                     />
                     <div className="absolute inset-x-0 bottom-4 text-center text-[10px] text-white/50 font-mono tracking-widest uppercase">PSEUDOSLUDGE</div>
                  </div>
                )}
                {selected.id === 'beamwidth' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <motion.div 
                       animate={{ scaleX: [1, 2.5, 1] }} 
                       transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                       className="w-8 h-8 bg-white rounded-full shadow-[0_0_20px_white] blur-[2px]" 
                    />
                    <div className="absolute inset-0 border-r border-l border-[#00d1ff]/30 w-32 -translate-x-[40px] pointer-events-none" />
                  </div>
                )}
                {selected.id === 'sidelobe' && (
                  <div className="relative flex flex-col items-center h-48 w-64 justify-center">
                     <div className="w-2 h-full bg-[#00d1ff]/40 absolute left-1/2 -translate-x-1/2" />
                     <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                       <path d="M50 0 C 30 50, 70 80, 50 100" stroke="rgba(0,209,255,0.2)" strokeWidth="2" fill="none" />
                       <path d="M50 0 C 70 50, 30 80, 50 100" stroke="rgba(0,209,255,0.2)" strokeWidth="2" fill="none" />
                     </svg>
                     <motion.div 
                        animate={{ opacity: [0.2, 0.8, 0.2] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute bottom-10 left-10 w-6 h-6 bg-white rounded-full blur-[2px]" 
                     />
                     <motion.div 
                        animate={{ opacity: [0.2, 0.8, 0.2] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-10 h-2 bg-white/50 rounded-full blur-[2px]" 
                     />
                  </div>
                )}
                {selected.id === 'refraction' && (
                  <div className="relative flex gap-8 items-center">
                     <motion.div 
                        animate={{ x: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 h-16 rounded-full border-4 border-emerald-400 bg-emerald-400/20"
                     />
                     <motion.div 
                        animate={{ x: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 h-16 rounded-full border-4 border-emerald-400/50 bg-emerald-400/10"
                     />
                  </div>
                )}
              </div>
            )}
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
