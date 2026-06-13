import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, HardDrive, Cpu, Compass, Layers, Zap } from 'lucide-react';

interface SidebarControlsProps {
  viewMode: string;
  dopplerAngle: number;
  setDopplerAngle: (v: number) => void;
  bloodVelocity: number;
  setBloodVelocity: (v: number) => void;
  flowType: string;
  setFlowType: (v: any) => void;
  tgc: number[];
  setTgc: (v: number[]) => void;
  activeProbe: any;
  setActiveProbe: (v: any) => void;
  probeTypes: any[];
  thickness: number;
  setThickness: (v: number) => void;
  activeMedium: any;
  setActiveMedium: (v: any) => void;
  media: any[];
}

interface TouchSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  colorClass?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'purple' | 'white';
}

function TouchSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
  colorClass = 'cyan'
}: TouchSliderProps) {
  const colorMap = {
    cyan: { text: 'text-[#00d1ff]', accent: 'accent-[#00d1ff]', track: 'border-[#00d1ff]/15 bg-[#00d1ff]/5' },
    amber: { text: 'text-amber-400', accent: 'accent-amber-500', track: 'border-amber-500/15 bg-amber-500/5' },
    rose: { text: 'text-rose-400', accent: 'accent-rose-500', track: 'border-rose-500/15 bg-rose-500/5' },
    emerald: { text: 'text-emerald-400', accent: 'accent-emerald-500', track: 'border-emerald-500/15 bg-emerald-500/5' },
    purple: { text: 'text-purple-400', accent: 'accent-purple-500', track: 'border-purple-500/15 bg-purple-500/5' },
    white: { text: 'text-white', accent: 'accent-white', track: 'border-white/10 bg-white/5' }
  }[colorClass];

  const handleDecrement = () => {
    const raw = value - step;
    const precision = step < 1 ? 2 : 0;
    const nextVal = Math.max(min, parseFloat(raw.toFixed(precision)));
    onChange(nextVal);
  };

  const handleIncrement = () => {
    const raw = value + step;
    const precision = step < 1 ? 2 : 0;
    const nextVal = Math.min(max, parseFloat(raw.toFixed(precision)));
    onChange(nextVal);
  };

  return (
    <div className={`p-2 rounded-xl border border-transparent bg-black/10 transition-all ${colorMap.track}`}>
      {/* Header Info */}
      <div className="flex justify-between items-center text-[9.5px] font-mono mb-1">
        <span className="text-slate-400 font-bold uppercase tracking-wider">{label}</span>
        <span className={`font-black ${colorMap.text}`}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
          <span className="text-[8px] text-slate-500 font-normal ml-0.5">{unit}</span>
        </span>
      </div>

      {/* Control Row with Touch Handles */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:bg-white/10 active:scale-90 transition-all shrink-0 select-none cursor-pointer hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex-1 px-1 py-1 relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`w-full appearance-none h-1.5 rounded-full bg-black/50 border border-[#2d3139]/50 cursor-pointer ${colorMap.accent}`}
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:bg-white/10 active:scale-90 transition-all shrink-0 select-none cursor-pointer hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SidebarControls({
  viewMode,
  dopplerAngle,
  setDopplerAngle,
  bloodVelocity,
  setBloodVelocity,
  flowType,
  setFlowType,
  tgc,
  setTgc,
  activeProbe,
  setActiveProbe,
  probeTypes,
  thickness,
  setThickness,
  activeMedium,
  setActiveMedium,
  media
}: SidebarControlsProps) {
  const playAcousticPing = (probeId: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const clickOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      const clickGain = ctx.createGain();
      
      let freq = 880;
      let sweepDest = 1200;
      let duration = 0.12;
      let type: OscillatorType = 'sine';
      
      if (probeId === 'linear') {
        freq = 1500;
        sweepDest = 2200;
        duration = 0.09;
        type = 'triangle';
      } else if (probeId === 'curvilinear') {
        freq = 880;
        sweepDest = 1300;
        duration = 0.13;
        type = 'sine';
      } else if (probeId === 'phased') {
        freq = 440;
        sweepDest = 580;
        duration = 0.16;
        type = 'sine';
      }
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(sweepDest, ctx.currentTime + duration * 0.8);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(65, ctx.currentTime);
      clickOsc.frequency.linearRampToValueAtTime(5, ctx.currentTime + 0.015);
      clickGain.gain.setValueAtTime(0.03, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
      
      osc.connect(gain);
      clickOsc.connect(clickGain);
      
      gain.connect(ctx.destination);
      clickGain.connect(ctx.destination);
      
      osc.start();
      clickOsc.start();
      
      osc.stop(ctx.currentTime + duration);
      clickOsc.stop(ctx.currentTime + 0.02);
    } catch (e) {
      console.warn('Acoustic synthesis blocked by user gesture safety logic', e);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'doppler' ? (
        <motion.div 
          key="side-doppler" 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -5 }} 
          className="flex flex-col gap-4"
        >
          <div className="text-[11px] uppercase tracking-widest text-[#00d1ff] font-bold border-b border-[#2d3139]/50 pb-1.5 font-mono flex items-center gap-1.5">
            <Compass size={12} className="text-[#00d1ff]" />
            <span>Doppler System</span>
          </div>
          <div className="space-y-2.5">
            <TouchSlider
              label="Refraction Angle (θ)"
              min={0}
              max={90}
              step={1}
              value={dopplerAngle}
              onChange={setDopplerAngle}
              unit="°"
              colorClass={dopplerAngle > 60 ? 'rose' : 'cyan'}
            />
            
            <TouchSlider
              label="Blood Velocity"
              min={0.1}
              max={3.0}
              step={0.1}
              value={bloodVelocity}
              onChange={setBloodVelocity}
              unit="m/s"
              colorClass="amber"
            />

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[9.5px] text-[#8e9299] uppercase font-bold font-mono">Flow Profile</span>
              <div className="grid grid-cols-2 gap-1.5">
                {['laminar', 'turbulent'].map(type => (
                  <button 
                    key={type} 
                    onClick={() => setFlowType(type as any)} 
                    className={`h-9 text-[10px] uppercase font-bold font-mono rounded-lg border transition-all select-none cursor-pointer flex items-center justify-center ${flowType === type ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/60 shadow-[0_0_15px_rgba(255,184,0,0.15)]' : 'border-[#2d3139]/50 text-[#8e9299] bg-[#0c0d10] hover:border-[#8e9299]/50 hover:bg-[#16181d]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : viewMode === 'imaging' ? (
        <motion.div 
          key="side-imaging" 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -5 }} 
          className="flex flex-col gap-4"
        >
          <div className="text-[11px] uppercase tracking-widest text-[#00d1ff] font-bold border-b border-[#2d3139]/50 pb-1.5 font-mono flex items-center gap-1.5">
            <HardDrive size={12} className="text-[#00d1ff]" />
            <span>TGC Receiver Gain</span>
          </div>
          
          <div className="flex flex-col gap-2 border border-[#2d3139]/40 bg-[#0c0d10] p-3 rounded-xl">
            {['Top', 'Mid', 'Deep', 'Far'].map((zone, i) => (
              <TouchSlider
                key={zone}
                label={`${zone} Gain`}
                min={0}
                max={100}
                value={tgc[i]}
                onChange={(val) => {
                  const newTgc = [...tgc];
                  newTgc[i] = val;
                  setTgc(newTgc);
                }}
                unit="dB"
                colorClass="white"
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="side-default" 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -5 }} 
          className="flex flex-col gap-4"
        >
          {/* Probe Array Row: Compact 3-Column buttons on mobile and desktop */}
          <div className="flex flex-col gap-3">
            <div className="text-[11px] uppercase tracking-widest text-[#8e9299] font-bold border-b border-[#2d3139]/50 pb-1.5 font-mono flex items-center gap-1.5">
              <Layers size={12} className="text-[#00d1ff]" />
              <span>Transducer Type</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {probeTypes.map(p => {
                const isActive = activeProbe.id === p.id;
                return (
                  <motion.button 
                    key={p.id}
                    onClick={() => {
                      setActiveProbe(p);
                      playAcousticPing(p.id);
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className={`relative p-2 text-center rounded-xl border transition-all flex flex-col justify-between items-center select-none cursor-pointer min-h-[96px] ${
                      isActive 
                        ? 'border-[#00d1ff] bg-[#00d1ff]/8 text-white shadow-[0_0_15px_rgba(0,209,255,0.25)]' 
                        : 'border-[#2d3139]/80 bg-[#16181d] hover:border-[#8e9299]/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {/* Tiny neon dot on top right when active */}
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d1ff] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00d1ff]"></span>
                      </span>
                    )}

                    {/* Array Type Text */}
                    <div className="w-full flex flex-col items-center">
                      <div className="text-[9px] font-black uppercase tracking-tight line-clamp-1 leading-none">
                        {p.name.replace(" Array", "")}
                      </div>
                      <div className="text-[7.5px] font-mono text-slate-500 tracking-tighter mt-0.5 font-bold leading-none">
                        {p.freqRange}
                      </div>
                    </div>

                    {/* Integrated Interactive Beam Patterns */}
                    <div className="w-full shrink-0 flex items-center justify-center opacity-90">
                      {p.id === 'linear' && (
                        <svg className="w-full h-7 mt-1.5 overflow-visible" viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <style>{`
                            @keyframes linear-ray-pulse-${p.id} {
                              0%, 100% { opacity: 0.2; stroke-width: 0.5px; }
                              50% { opacity: 1; stroke-width: 1.5px; stroke: #00d1ff; filter: drop-shadow(0 0 2px rgba(0,209,255,0.5)); }
                            }
                            .linear-ray-${p.id} {
                              animation: linear-ray-pulse-${p.id} 1.4s infinite ease-in-out;
                            }
                          `}</style>
                          <rect x="6" y="2" width="48" height="2.5" rx="1" fill={isActive ? "#00d1ff" : "#3b404d"} />
                          <g opacity={isActive ? "1" : "0.35"}>
                            {[10, 18, 26, 34, 42, 50].map((x, i) => (
                              <line
                                key={i}
                                x1={x}
                                y1="4.5"
                                x2={x}
                                y2="24"
                                stroke={isActive ? "#00d1ff" : "#8e9299"}
                                strokeWidth="0.5"
                                className={isActive ? `linear-ray-${p.id}` : ""}
                                style={isActive ? { animationDelay: `${i * 0.15}s` } : {}}
                              />
                            ))}
                          </g>
                        </svg>
                      )}

                      {p.id === 'curvilinear' && (
                        <svg className="w-full h-7 mt-1.5 overflow-visible" viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <style>{`
                            @keyframes convex-wave-burst-${p.id} {
                              0% { stroke-dashoffset: 15; opacity: 0.3; stroke: #8e9299; }
                              50% { stroke-dashoffset: 0; opacity: 1; stroke: #00d1ff; filter: drop-shadow(0 0 2px rgba(0,209,255,0.5)); }
                              100% { stroke-dashoffset: -15; opacity: 0.3; stroke: #8e9299; }
                            }
                            .convex-wave-${p.id} {
                              animation: convex-wave-burst-${p.id} 1.8s infinite ease-in-out;
                            }
                          `}</style>
                          <path d="M 12 3.5 Q 30 1 48 3.5" stroke={isActive ? "#00d1ff" : "#3b404d"} strokeWidth="2.5" strokeLinecap="round" />
                          <g opacity={isActive ? "1" : "0.35"}>
                            <path d="M 16 9.5 Q 30 6.5 44 9.5" stroke={isActive ? "#00d1ff" : "#8e9299"} strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2.5 1.5" className={isActive ? `convex-wave-${p.id}` : ""} style={isActive ? { animationDelay: "0s" } : {}} />
                            <path d="M 11 16.5 Q 30 12.5 49 16.5" stroke={isActive ? "#00d1ff" : "#8e9299"} strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 1.5" className={isActive ? `convex-wave-${p.id}` : ""} style={isActive ? { animationDelay: "0.4s" } : {}} />
                            <path d="M 6 23.5 Q 30 18.5 54 23.5" stroke={isActive ? "#00d1ff" : "#8e9299"} strokeWidth="0.8" strokeLinecap="round" strokeDasharray="4 2" className={isActive ? `convex-wave-${p.id}` : ""} style={isActive ? { animationDelay: "0.8s" } : {}} />
                          </g>
                        </svg>
                      )}

                      {p.id === 'phased' && (
                        <svg className="w-full h-7 mt-1.5 overflow-visible" viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <style>{`
                            @keyframes sector-needle-sweep-${p.id} {
                              0%, 100% { transform: rotate(-22deg); }
                              50% { transform: rotate(22deg); }
                            }
                            .sector-sweep-line-${p.id} {
                              transform-origin: 30px 4px;
                              animation: sector-needle-sweep-${p.id} 1.6s infinite ease-in-out;
                            }
                          `}</style>
                          <rect x="23" y="2.5" width="14" height="2.5" rx="0.5" fill={isActive ? "#00d1ff" : "#3b404d"} />
                          <path d="M 30 4.5 L 10 25 M 30 4.5 L 50 25" stroke={isActive ? "#1e2127" : "#1a1a1e"} strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                          <g opacity={isActive ? "1" : "0.35"}>
                            <line
                              x1="30"
                              y1="4.5"
                              x2="30"
                              y2="24"
                              stroke={isActive ? "#00d1ff" : "#8e9299"}
                              strokeWidth={isActive ? "1.5" : "0.5"}
                              className={isActive ? `sector-sweep-line-${p.id}` : ""}
                              style={isActive ? { filter: "drop-shadow(0 0 2px rgba(0,209,255,0.4))" } : {}}
                            />
                            <path d="M 23 11 A 8 8 0 0 0 37 11" stroke={isActive ? "#00d1ff" : "#8e9299"} strokeWidth="0.5" opacity="0.4" strokeDasharray="1 1.5" />
                            <path d="M 17 18 A 16 16 0 0 0 43 18" stroke={isActive ? "#00d1ff" : "#8e9299"} strokeWidth="0.5" opacity="0.3" strokeDasharray="1.5 1.5" />
                          </g>
                        </svg>
                      )}
                    </div>

                    {/* Tiny Clinical Target Application Indicator (e.g. "VASCULAR") */}
                    <div className="w-full flex items-center justify-center">
                      <span className={`text-[6px] font-mono leading-none font-black uppercase tracking-wider ${
                        p.id === 'linear' 
                          ? 'text-sky-400' 
                          : p.id === 'curvilinear' 
                            ? 'text-amber-400' 
                            : 'text-rose-400'
                      }`}>
                        {p.use.split('/')[0]}
                      </span>
                    </div>

                    {/* Perfect ambient border highlight overlay */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-border-ring" 
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" 
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="text-[11px] uppercase tracking-widest text-[#8e9299] font-bold border-b border-[#2d3139]/50 pb-1.5 font-mono flex items-center gap-1.5">
              <Cpu size={12} className="text-yellow-500" />
              <span>Acoustic Parameters</span>
            </div>
            <div className="space-y-3.5">
              <TouchSlider
                label="Crystal thickness"
                min={0.1}
                max={1.0}
                step={0.01}
                value={thickness}
                onChange={setThickness}
                unit="mm"
                colorClass="amber"
              />

              <div className="space-y-2 pt-1 border-t border-[#2d3139]/30">
                <div className="text-[9.5px] text-[#8e9299] uppercase font-bold font-mono pt-2">Propagation Medium</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {media.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => setActiveMedium(m)} 
                      className={`h-11 text-[9.5px] uppercase font-bold font-mono rounded-lg border transition-all select-none cursor-pointer flex flex-col items-center justify-center leading-normal ${activeMedium.id === m.id ? 'bg-[#00d1ff]/10 text-[#00d1ff] border-[#00d1ff] shadow-[0_0_15px_rgba(0,209,255,0.15)]' : 'border-[#2d3139]/50 text-[#8e9299] bg-[#0c0d10] hover:bg-[#16181d]'}`}
                    >
                      <span className="font-extrabold">{m.name}</span>
                      <span className="text-[7.5px] text-slate-500 font-normal leading-none mt-0.5">{m.c * 1000} m/s</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
