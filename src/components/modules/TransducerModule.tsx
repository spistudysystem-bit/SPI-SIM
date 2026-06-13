import React from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { Video } from 'lucide-react';
import AttachedMediaList from '../shared/AttachedMediaList';

interface TransducerModuleProps {
  thickness: number;
  setThickness?: (v: number) => void;
  frequency?: number;
  damping: number;
  activeLayer: string | null;
  setActiveLayer: (id: string) => void;
  layers: any[];
  waveformData: any[];
  spl: number;
  setViewMode?: (mode: any) => void;
}

export default function TransducerModule({ 
  thickness, 
  setThickness,
  frequency,
  damping, 
  activeLayer, 
  setActiveLayer, 
  layers, 
  waveformData, 
  spl,
  setViewMode
}: TransducerModuleProps) {
  const currentLayer = layers.find(l => l.id === activeLayer);

  const [backingOpacity, setBackingOpacity] = React.useState<number>(1);
  const [pztOpacity, setPztOpacity] = React.useState<number>(1);
  const [matchingOpacity, setMatchingOpacity] = React.useState<number>(1);
  const [lensOpacity, setLensOpacity] = React.useState<number>(1);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden"
    >
      {/* Left Scan View */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-12 hud-grid relative border-r border-[#2d3139]">
        {/* Pulse Propagation Overlay */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-0">
           <motion.div 
             animate={{ 
                scale: [1, 1.5],
                opacity: [0, 0.2, 0],
                y: [0, 400]
             }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="w-full max-w-[380px] h-[4px] bg-[#00d1ff] blur-xl rounded-full"
           />
        </div>

        <div className="absolute top-8 left-8 flex flex-col gap-1 hidden xl:flex">
          <div className="text-[10px] font-mono text-[#00d1ff] tracking-[3px]">MORPHOLOGY_DIAGRAM</div>
          <div className="w-32 h-[1px] bg-gradient-to-r from-[#00d1ff] to-transparent" />
          <div className="flex gap-4 mt-4">
             <div className="flex flex-col">
                <span className="text-[7px] text-[#8e9299] font-mono uppercase">Coord_X</span>
                <span className="text-[9px] text-[#00d1ff] font-mono">154.22</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[7px] text-[#8e9299] font-mono uppercase">Coord_Y</span>
                <span className="text-[9px] text-[#00d1ff] font-mono">082.19</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden xl:flex flex-col items-end gap-2">
            <div className="flex gap-1">
               {[...Array(8)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 h-3 bg-[#00d1ff]"
                  />
               ))}
            </div>
            <div className="text-[8px] font-mono text-[#8e9299] tracking-widest uppercase">Transducer_Integrity_Index</div>
        </div>

        <button 
          onClick={() => setViewMode?.('library')}
          className="absolute top-8 right-8 flex items-center gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 rounded-full transition-all group z-50"
        >
          <Video size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Watch Hardware Guide</span>
        </button>

        <div className="flex flex-col items-center gap-4">
          <div className="text-[10px] text-[#8e9299] tracking-[8px] uppercase font-bold opacity-50 mb-2 font-mono">ASSEMBLY_CROSS_SECTION</div>
            <div className="w-full max-w-[380px] flex flex-col border border-[#2d3139] bg-black/60 p-3 sm:p-4 rounded-xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {/* Backing Block */}
            <div 
              onClick={() => setActiveLayer('backing')} 
              className={`w-full h-[140px] mb-1.5 flex items-center justify-center cursor-pointer transition-all duration-500 rounded-t-lg overflow-hidden border border-white/5 ${activeLayer === 'backing' ? 'brightness-125 scale-[1.02] shadow-xl z-10' : 'brightness-50 grayscale-[0.5]'}`} 
              style={{ 
                background: 'repeating-linear-gradient(45deg, var(--backing-stripe), var(--backing-stripe) 4px, var(--backing-stripe-alt) 4px, var(--backing-stripe-alt) 8px)',
                boxShadow: activeLayer === 'backing' ? '0 0 30px rgba(100,100,100,0.2)' : 'none',
                opacity: backingOpacity
              }}
            >
              <span className="text-[8px] font-mono opacity-40 text-white uppercase tracking-[6px] font-bold">Backing Block</span>
            </div>

            {/* PZT Element */}
            <motion.div 
              animate={{ height: thickness * 80 + 20 }} 
              onClick={() => setActiveLayer('pzt')} 
              className={`w-full mb-1.5 cursor-pointer flex items-center justify-center transition-all duration-500 relative overflow-hidden group/pzt ${activeLayer === 'pzt' ? 'brightness-110 scale-[1.02] z-20 shadow-[0_0_50px_rgba(255,215,0,0.3)]' : 'brightness-75'}`}
              style={{ 
                background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                border: '1px solid rgba(255,215,0,0.4)',
                opacity: pztOpacity
              }}
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-bold text-black uppercase tracking-[4px] relative z-10 drop-shadow-sm">PZT Element</span>
              
              <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-30 pointer-events-none group-hover/pzt:opacity-100 transition-opacity">
                 <div className="w-full h-[1px] bg-white animate-pulse" />
                 <div className="w-full h-[1px] bg-white animate-pulse" style={{ animationDelay: '200ms'}} />
              </div>
            </motion.div>

            {/* Matching Layer */}
            <div 
              onClick={() => setActiveLayer('matching')} 
              className={`w-full h-5 mb-1.5 cursor-pointer flex items-center justify-center transition-all duration-500 rounded-sm border border-[#40e0d0]/30 shadow-inner group/matching ${activeLayer === 'matching' ? 'brightness-125 scale-x-[1.04] z-10 shadow-[0_0_30px_rgba(64,224,208,0.3)]' : 'brightness-50'}`}
              style={{ background: 'linear-gradient(90deg, #1a4d4a 0%, #40e0d0 50%, #1a4d4a 100%)', opacity: matchingOpacity }}
            >
               <span className="text-[7px] font-bold text-black uppercase tracking-widest opacity-0 group-hover/matching:opacity-100 transition-opacity">1/4 λ Bridge</span>
            </div>

            {/* Acoustic Lens */}
            <div 
              onClick={() => setActiveLayer('lens')} 
              className={`w-full h-10 bg-gradient-to-b from-[#00d1ff]/40 to-[#00d1ff]/10 rounded-b-[40px] border-t-2 border-[#00d1ff]/40 cursor-pointer relative overflow-hidden transition-all duration-500 ${activeLayer === 'lens' ? 'brightness-125 scale-y-[1.1] origin-top' : 'brightness-50'}`}
              style={{ opacity: lensOpacity }}
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="bg-[#16181d] border border-[#2d3139] p-4 rounded-xl shadow-2xl">
            <div className="text-[9px] text-[#00d1ff] font-bold uppercase mb-1 font-mono tracking-widest">WAVE_ENVELOPE_OUTPUT</div>
            <div className="h-[80px]">
              <ResponsiveContainer>
                <LineChart data={waveformData}>
                  <Line 
                    type="monotone" 
                    dataKey="amplitude" 
                    stroke="#00d1ff" 
                    strokeWidth={1.5} 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 px-2 border-t border-white/5 pt-2">
               <div className="text-[9px] text-[#8e9299] font-mono">SPL: <span className="text-white">{spl.toFixed(2)}mm</span></div>
               <div className="text-[9px] text-[#8e9299] font-mono">DAMPING: <span className="text-white">{(damping * 100).toFixed(0)}%</span></div>
            </div>
          </div>

          {/* Calculator */}
          <div className="bg-[#16181d] border border-[#2d3139] p-4 rounded-xl shadow-2xl">
            <div className="text-[9px] text-[#00d1ff] font-bold uppercase mb-3 font-mono tracking-widest">PZT ELEMENT CALCULATOR</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#8e9299] uppercase font-bold">Thickness (mm)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    max="5.0"
                    value={Number(thickness.toFixed(2))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0 && setThickness) {
                        setThickness(val);
                      }
                    }}
                    className="w-full bg-[#0c0d10] border border-[#2d3139] rounded p-2 text-[#ffd700] text-sm font-mono focus:border-[#ffd700] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#8e9299] uppercase font-bold">Frequency (MHz)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="20.0"
                    value={Number((frequency || (2 / thickness)).toFixed(2))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0 && setThickness) {
                        setThickness(2 / val);
                      }
                    }}
                    className="w-full bg-[#0c0d10] border border-[#2d3139] rounded p-2 text-[#00d1ff] text-sm font-mono focus:border-[#00d1ff] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 p-2 bg-black/40 rounded border border-white/5 border-dashed text-[9px] text-[#8e9299] font-mono leading-relaxed opacity-80 flex flex-col gap-1">
              <span>{`> Element freq inversely maps to thickness.`}</span>
              <span>{`> Based on PZT C ≈ 4.0 mm/μs. Eq: f = C / (2 * th)`}</span>
            </div>
          </div>

          {/* Layer Opacity Controls */}
          <div className="bg-[#16181d] border border-[#2d3139] p-4 rounded-xl shadow-2xl">
            <div className="text-[9px] text-[#00d1ff] font-bold uppercase mb-3 font-mono tracking-widest">LAYER VISIBILITY / OPACITY</div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Backing Block', value: backingOpacity, setter: setBackingOpacity, color: '#8e9299' },
                { label: 'PZT Element', value: pztOpacity, setter: setPztOpacity, color: '#ffd700' },
                { label: 'Matching Layer', value: matchingOpacity, setter: setMatchingOpacity, color: '#40e0d0' },
                { label: 'Acoustic Lens', value: lensOpacity, setter: setLensOpacity, color: '#00d1ff' }
              ].map((layer, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#8e9299]">
                     <span style={{ color: layer.color }}>{layer.label}</span>
                     <span>{(layer.value * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.value}
                    onChange={(e) => layer.setter(parseFloat(e.target.value))}
                    className="w-full h-1.5 appearance-none bg-[#0c0d10] border border-[#2d3139] rounded-full outline-none focus:border-[#00d1ff]/50 transition-colors"
                    style={{ accentColor: layer.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Panel */}
      <div className="w-full xl:w-[440px] bg-[#0c0d10] p-8 overflow-y-auto no-scrollbar flex flex-col gap-8 border-l border-[#2d3139]">
        <div className="flex flex-col gap-1">
           <div className="text-[10px] font-mono text-[#00d1ff] tracking-[3px]">LAB_MANUAL_v2.0</div>
           <h2 className="text-3xl font-serif italic text-white leading-tight">Hardware <span className="text-[#8e9299]">Analysis</span></h2>
        </div>

        {/* AGENT MARCUS COVERT INTERCOM BRIEFING */}
        <div className="flex items-start gap-3 bg-cyan-950/40 border border-cyan-500/20 p-4 rounded-xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-400/5 to-transparent rounded-full" />
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 animate-pulse shrink-0" />
          <div className="space-y-1">
            <div className="text-[7.5px] font-mono text-cyan-400 uppercase tracking-widest font-black leading-none">
              AGENT MARCUS • FIELD ADVICE SYSTEM
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              "Impedance calibration is my specialty. Check out the active layers in my interactive probe below—keeping matching layers at 1/4 wavelength thickness keeps signal reflections pristine!"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
           <div className="p-5 bg-[#16181d] border border-[#2d3139] rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ffd700]" />
              <div className="text-[9px] font-mono text-[#ffd700] uppercase tracking-widest mb-1">Active Element</div>
              <h3 className="text-white font-bold text-lg mb-3 flex items-center justify-between gap-2 flex-wrap">
                 <span>{currentLayer?.name}</span>
                 <button
                   onClick={() => {
                     if (!currentLayer) return;
                     (window as any).showInfoFullScreen?.({
                        title: `${currentLayer.name} Engineering Specifications`,
                        badge: `HARDWARE TRANSDUCER ASSEMBLY // LAYER_${currentLayer.id.toUpperCase()}`,
                        subtitle: currentLayer.description,
                        content: `This detailed specifications index catalogs the mechanical properties and industrial boundary conditions of the <strong>${currentLayer.name}</strong>.<br/><br/><strong>Acoustic Wave Modulation:</strong><br/>The layer material is optimized to maximize temporal pulse clarity and regulate trans-impedance characteristics of acoustic fields. This directly influences the transducer's signal-to-noise ratio (SNR) and spectral power density in soft tissue.`,
                        concept: `<strong>Underlying Wave Physics Principle:</strong><br/>${currentLayer.physics}`,
                        alert: `<strong>Clinical Significance & Sonographer Guidelines:</strong><br/>${currentLayer.clinical}`
                     });
                   }}
                   className="px-2 py-0.5 rounded bg-[#ffd700]/10 hover:bg-[#ffd700]/25 border border-[#ffd700]/20 hover:border-[#ffd700]/40 text-[#ffd700] text-[7.5px] font-mono tracking-widest uppercase cursor-pointer transition-all"
                 >
                    Fullscreen Blueprint
                 </button>
              </h3>
              <p className="text-[12px] text-[#e0e0e0] leading-relaxed mb-4">{currentLayer?.description}</p>
              
              <div className="flex flex-col gap-4">
                 <div className="p-3 bg-black/40 rounded border border-white/5">
                    <div className="text-[9px] text-[#00d1ff] font-bold uppercase mb-1 font-mono tracking-widest">Physical Principle</div>
                    <div className="text-sm text-white font-medium">{currentLayer?.physics}</div>
                 </div>
                 <div className="p-3 bg-black/40 rounded border border-white/5">
                    <div className="text-[9px] text-green-400 font-bold uppercase mb-1 font-mono tracking-widest">Clinical Significance</div>
                    <div className="text-sm text-white font-medium">{currentLayer?.clinical}</div>
                 </div>
              </div>
           </div>

           <div className="p-5 bg-[#1a1c22]/50 border border-[#2d3139] rounded-xl flex flex-col gap-3">
              <AttachedMediaList module="probe" />
              <div className="text-[9px] text-[#8e9299] font-bold uppercase font-mono tracking-widest">Module Summary</div>
              <ul className="flex flex-col gap-2">
                 {[
                   'Crystal thickness dictates fundamental frequency.',
                   'Backing material shortens SPL for better resolution.',
                   'Matching layer minimizes acoustic impedance mismatch.',
                   'Lens regulates elevational resolution/slice thickness.'
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 text-[11px] text-[#8e9299]">
                      <span className="text-[#00d1ff] font-mono">[{i+1}]</span>
                      <span>{tip}</span>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
