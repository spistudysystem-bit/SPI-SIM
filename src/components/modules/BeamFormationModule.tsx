import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Radio, Video } from 'lucide-react';

interface BeamFormationModuleProps {
  setViewMode?: (mode: any) => void;
}

export default function BeamFormationModule({ setViewMode }: BeamFormationModuleProps) {
  const [steeringAngle, setSteeringAngle] = useState(0);
  const [focusDepth, setFocusDepth] = useState(150);
  const [activeElement, setActiveElement] = useState<number | null>(null);

  const elements = Array.from({ length: 16 });

  // Refs for the new high-fidelity Huygens simulation canvas
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeRef = React.useRef<number>(0);

  // Calculate delays for steering and focusing
  // t = (x * sin(theta)) / c + ((Xmax^2 - x^2) / (2 * F * c))
  // Page 16: Time delays on the center elements >> shape of the beam becomes U shaped (CONVERGENT)
  const getDelay = (index: number) => {
    const x = (index - 7.5) * 1.5; // element position relative to center (mm)
    const maxX = 7.5 * 1.5;
    const c = 1.54; // mm/microsec
    
    // Steering: Delay on side, beam steered to the side
    const steerDelay = (x * Math.sin((steeringAngle * Math.PI) / 180)) / c;
    
    // Focusing: Delay in center, beam focuses towards center (U-shaped)
    // We want maximum delay at x=0
    const focusDelay = (maxX * maxX - x * x) / (2 * focusDepth * c);
    
    return steerDelay + focusDelay;
  };

  const delays = elements.map((_, i) => getDelay(i));
  const minDelay = Math.min(...delays);
  const normalizedDelays = delays.map(d => d - minDelay);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let frameRef: number;
    const render = () => {
      timeRef.current += 0.55; // Wave progression speed
      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, W, H);

      // Map 16 elements horizontally aligned with the divs above
      const startX = W / 2 - 120;
      const endX = W / 2 + 120;
      const spacing = 240 / 15;
      const y0 = 5; // Near top of canvas

      const delayFactor = 28; // pixels of delay per microsec
      const period = 140; // reset radius period
      const t = timeRef.current % period;

      // 1. Draw Huygens circular wavelets with electronic phase timing delays
      for (let i = 0; i < 16; i++) {
        const xi = startX + i * spacing;
        const delayD = normalizedDelays[i] * delayFactor;

        ctx.lineWidth = 1;
        // Paint successive wave ripples
        for (let waveIndex = 0; waveIndex < 2; waveIndex++) {
          const r = t - delayD + waveIndex * 55;
          if (r > 0 && r < H * 1.25) {
            const opacity = Math.max(0, 0.22 * (1 - r / (H * 1.25)));
            ctx.strokeStyle = `rgba(0, 209, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(xi, y0, r, 0, Math.PI); // Draw propagating semicircle downward
            ctx.stroke();
          }
        }
      }

      // 2. Draw Mathematical Interference Wavefront (the resulting sum of wavelets)
      const rad = (steeringAngle * Math.PI) / 180;
      const cosS = Math.cos(rad);
      const sinS = Math.sin(rad);
      const F = focusDepth;

      for (let waveIndex = 0; waveIndex < 2; waveIndex++) {
        const r_front = t + waveIndex * 55;
        if (r_front > 0 && r_front < H) {
          ctx.beginPath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = `rgba(0, 209, 255, ${Math.max(0, 0.75 * (1 - r_front / H))})`;
          
          let first = true;
          // Sample wavefront shape to form precise curves
          for (let sx = -120; sx <= 120; sx += 4) {
            let sy = r_front;
            if (r_front < F) {
              const fraction = (1 - r_front / F);
              sy = r_front - (sx * sx) / (3.5 * F) * fraction;
            } else {
              const fraction = (r_front / F - 1);
              sy = r_front + (sx * sx) / (3.5 * F) * Math.min(1.4, fraction);
            }

            // Rotate points based on steering angle
            const rx = W / 2 + (sx * cosS - sy * sinS);
            const ry = y0 + (sx * sinS + sy * cosS);

            if (first) {
              ctx.moveTo(rx, ry);
              first = false;
            } else {
              ctx.lineTo(rx, ry);
            }
          }
          ctx.stroke();
        }
      }

      // 3. Draw Transducer Aperture Faint Field boundaries (Sector envelope)
      const w0 = 240; // array width
      const wf = 8;   // focal beam width
      const wd = 270; // broad width at bottom
      
      ctx.fillStyle = 'rgba(0, 209, 255, 0.04)';
      ctx.beginPath();

      // Left edge
      const lx1 = W / 2 - (w0 / 2) * cosS;
      const ly1 = y0 - (w0 / 2) * sinS;
      const lx2 = W / 2 - (wf / 2) * cosS - F * sinS;
      const ly2 = y0 - (wf / 2) * sinS + F * cosS;
      const lx3 = W / 2 - wd * cosS - H * sinS;
      const ly3 = y0 - wd * sinS + H * cosS;

      // Right edge
      const rx3 = W / 2 + wd * cosS - H * sinS;
      const ry3 = y0 + wd * sinS + H * cosS;
      const rx2 = W / 2 + (wf / 2) * cosS - F * sinS;
      const ry2 = y0 + (wf / 2) * sinS + F * cosS;
      const rx1 = W / 2 + (w0 / 2) * cosS;
      const ry1 = y0 + (w0 / 2) * sinS;

      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.lineTo(lx3, ly3);
      ctx.lineTo(rx3, ry3);
      ctx.lineTo(rx2, ry2);
      ctx.lineTo(rx1, ry1);
      ctx.closePath();
      ctx.fill();

      // 4. Central Main Beam Axis line
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W / 2, y0);
      ctx.lineTo(W / 2 - H * sinS, y0 + H * cosS);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Draw Focal Spot Marker
      const fx = W / 2 - F * sinS;
      const fy = y0 + F * cosS;
      
      const pulseR = 9 + Math.sin(timeRef.current * 0.08) * 2;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(fx, fy, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 8px Courier New';
      ctx.fillText('FOCAL_ZONE', fx + 15, fy + 3);

      frameRef = requestAnimationFrame(render);
    };

    frameRef = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef);
      ro.disconnect();
    };
  }, [steeringAngle, focusDepth, normalizedDelays]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-4 md:gap-8 hud-dots"
    >
      <div className="flex justify-between items-start lg:items-end flex-col lg:flex-row gap-4 border-b border-[#2d3139] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Phase Timing Engine // Alpha</div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">Beam <span className="text-[#8e9299]">Steering & Focusing</span></div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
           <button 
             onClick={() => setViewMode?.('library')}
             className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 rounded-full transition-all group shadow-lg"
           >
             <Video size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-bold text-white uppercase tracking-widest">Watch Physics Guide</span>
           </button>
           <div className="p-4 w-full sm:w-auto bg-[#1a1c22] border border-[#2d3139] rounded-xl flex flex-col items-start sm:items-end">
              <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest mb-1 font-bold">Aperture Size</div>
              <div className="text-lg md:text-xl font-mono font-bold text-white uppercase">16 Elements</div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 md:gap-10 overflow-y-auto no-scrollbar pb-10 md:pb-0">
        {/* Controls Sidebar */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
           <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-xl">
              <div className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest mb-6 border-b border-[#2d3139] pb-2 flex items-center justify-between">
                Phasing Matrix <Cpu size={12} />
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Steering Angle</span>
                       <span className="text-white font-mono">{steeringAngle}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="-30" max="30" 
                      value={steeringAngle} 
                      onChange={(e) => setSteeringAngle(parseInt(e.target.value))}
                      className="w-full appearance-none h-[2px] bg-[#2d3139] accent-[#00d1ff] cursor-pointer" 
                    />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-[#8e9299] uppercase font-bold">
                       <span>Focus Depth</span>
                       <span className="text-white font-mono">{focusDepth}mm</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" max="300" 
                      value={focusDepth} 
                      onChange={(e) => setFocusDepth(parseInt(e.target.value))}
                      className="w-full appearance-none h-[2px] bg-[#2d3139] accent-[#ffd700] cursor-pointer" 
                    />
                 </div>
              </div>
           </div>

            <div className="bg-[#0c0d10] border border-[#2d3139] rounded-2xl p-6 flex-1 relative overflow-y-auto xl:overflow-hidden group">
               <div className="absolute inset-0 hud-grid opacity-10" />
               <div className="text-[10px] font-bold text-[#ffd700] uppercase mb-4 tracking-widest">Huygens' Principle</div>
               <p className="text-[10px] text-[#8e9299] leading-relaxed italic">
                 "Each wave produced by the elements will combine or link together to form a wavefront. The wavefront is a single beam of sound." (Page 16)
               </p>
               <div className="mt-6 flex flex-col gap-2">
                  <div className="text-[9px] text-[#00d1ff] font-bold uppercase tracking-widest flex items-center gap-2">
                     <Zap size={12} /> Electronic Phasing
                  </div>
                  <p className="text-[9px] text-[#8e9299] leading-tight">
                    <strong>Steering:</strong> Delay on side, beam steered to side.<br/>
                    <strong>Focusing:</strong> Delay in center, beam focuses toward center.
                  </p>
               </div>
            </div>
        </div>

        {/* Technical Visualization */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 bg-black border border-[#2d3139] rounded-3xl relative overflow-hidden flex flex-col shadow-2xl">
           <div className="absolute inset-0 hud-dots opacity-10" />
           
           {/* Wavefront Simulation Stage */}
           <div className="flex-1 flex flex-col items-center justify-center relative p-6 md:p-20 overflow-y-auto xl:overflow-hidden lg:overflow-visible">
              <div className="absolute top-4 left-4 md:top-8 md:left-8 text-[9px] font-mono text-[#00d1ff] opacity-60">ELECTRONIC_DELAY_LOG [0xBF]</div>
              
              {/* Probe Array Top */}
              <div className="flex gap-1 md:gap-2 relative z-20 overflow-x-auto no-scrollbar w-full justify-center md:w-auto">
                 {elements.map((_, i) => (
                   <div key={i} className="flex flex-col items-center gap-4 shrink-0">
                      <div className="text-[6px] md:text-[7px] font-mono text-[#8e9299]">{i+1}</div>
                      <motion.div 
                        initial={false}
                        animate={{ 
                          height: 40 + normalizedDelays[i] * 50,
                          backgroundColor: activeElement === i ? '#00d1ff' : '#1a1c22'
                        }}
                        className="w-3 md:w-4 rounded-full border border-white/5 relative shadow-inner"
                      >
                         <div className="absolute bottom-0 w-full h-4 bg-[#ffd700] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                      </motion.div>
                   </div>
                 ))}
              </div>

              {/* Connecting Delay Lines */}
              <div ref={containerRef} className="mt-6 relative w-full flex-1 min-h-[340px] overflow-hidden rounded-2xl border border-[#2d3139] bg-[#030308]/90 shadow-inner flex flex-col justify-end">
                 <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                 />
              </div>

              {/* Data Overlays */}
              <div className="absolute top-4 right-4 md:bottom-10 md:inset-x-10 md:top-auto flex flex-col md:flex-row justify-end md:justify-between gap-4">
                 <div className="hidden md:flex bg-[#16181d]/80 backdrop-blur-md border border-[#2d3139] p-4 rounded-xl flex-col gap-1 w-48 shadow-2xl">
                    <div className="text-[8px] font-bold text-[#8e9299] uppercase tracking-widest">Processing Delay</div>
                    <div className="text-lg font-mono font-bold text-[#00d1ff]">{normalizedDelays[0].toFixed(3)} μs</div>
                    <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1">
                       <motion.div 
                          animate={{ width: `${(normalizedDelays[0] / 2) * 100}%` }}
                          className="h-full bg-[#00d1ff]" 
                       />
                    </div>
                 </div>

                 <div className="bg-[#16181d]/80 backdrop-blur-md border border-[#2d3139] p-3 md:p-4 rounded-xl flex flex-col gap-1 w-auto md:w-48 shadow-2xl items-end">
                    <div className="text-[7px] md:text-[8px] font-bold text-[#8e9299] uppercase tracking-widest">Focal Zone Intensity</div>
                    <div className="text-sm md:text-lg font-mono font-bold text-[#ffb800]">92.4% <span className="text-[8px] md:text-[10px] font-normal">MAX</span></div>
                    <div className="flex gap-1 mt-1">
                       {[...Array(8)].map((_, i) => <div key={i} className={`w-1 md:w-1.5 h-2 md:h-3 rounded-sm ${i < 7 ? 'bg-[#ffb800]' : 'bg-[#2d3139]'}`} />)}
                    </div>
                 </div>
              </div>
           </div>

           {/* Phasing Matrix Analysis */}
           <div className="p-6 border-t border-[#1a1c22] bg-[#0c0d10]/95 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                 <div className="text-[10px] font-bold text-[#ffd700] uppercase tracking-[0.3em] flex items-center gap-2">
                   <Radio size={12} className="text-[#00d1ff]" /> Phasing Matrix Computation (μs)
                 </div>
                 <div className="text-[8px] font-mono text-[#8e9299]">ALGORITHM: FRESNEL_CONVERGENCE_V2.01</div>
              </div>
              
              <div className="grid grid-cols-8 gap-3">
                 {elements.map((_, i) => {
                   const maxNormalized = Math.max(...normalizedDelays) || 1;
                   return (
                     <div key={i} className="bg-black/40 border border-white/5 p-2 rounded-lg flex flex-col gap-1 hover:border-[#00d1ff]/30 transition-colors group">
                       <div className="flex justify-between items-center text-[7px] font-mono">
                         <span className="text-[#8e9299] group-hover:text-white transition-colors">CH_{i+1 < 10 ? `0${i+1}` : i+1}</span>
                         <span className="text-[#00d1ff] font-bold">{normalizedDelays[i].toFixed(4)}</span>
                       </div>
                       <div className="h-1 bg-[#16181d] rounded-full overflow-hidden">
                         <motion.div 
                           animate={{ width: `${(normalizedDelays[i] / maxNormalized) * 100}%` }}
                           className="h-full bg-gradient-to-r from-[#00d1ff] to-[#ffd700]"
                         />
                       </div>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Console Readout */}
           <div className="h-20 border-t border-[#1a1c22] bg-[#0c0d10] flex items-center px-10 gap-10">
              <div className="flex items-center gap-3">
                 <Zap size={14} className="text-[#00d1ff]" />
                 <span className="text-[10px] font-mono text-white opacity-40 uppercase tracking-widest">Transmitter_Sync_Ok</span>
              </div>
              <div className="h-6 w-[1px] bg-[#2d3139]" />
              <div className="flex items-center gap-4 text-[10px] font-mono">
                 <span className="text-[#8e9299]">THETA: <span className="text-white">{steeringAngle}°</span></span>
                 <span className="text-[#8e9299]">FOCUS: <span className="text-white">{focusDepth}mm</span></span>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
