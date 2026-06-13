import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldCheck, Cpu, Sliders, Zap, Scan } from 'lucide-react';

interface CinematicModuleIntroProps {
  moduleLabel: string;
  moduleCategory?: string;
  badge?: string;
  onComplete: () => void;
}

export default function CinematicModuleIntro({ 
  moduleLabel, 
  moduleCategory = "PHYSICS PARAMETER CORE", 
  badge = "ACTIVE",
  onComplete 
}: CinematicModuleIntroProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger sound effect on transit
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state !== 'suspended') {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.4);
          
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
          
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.setValueAtTime(450, audioCtx.currentTime);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        }
      }
    } catch (e) {
      // safe catch: browser autoplay policy block
    }

    // Sequence logs typing effect over 1.25s
    const logList = [
      "SYNCHRONIZING RECEPTIVE ACOUSTIC APERTURE...",
      "CALIBRATING HUYGENS WAVE INTERFERENCE PLANE...",
      "STABILIZING THERMAL INDEX LIMIT COEFFICIENTS..."
    ];

    const timeouts = logList.map((log, index) => {
      return setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, 180 + index * 240);
    });

    const completionTimeout = setTimeout(() => {
      onComplete();
    }, 1350);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completionTimeout);
    };
  }, [moduleLabel, onComplete]);

  // Fast scanning radar sweep animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let circles: { r: number; alpha: number; speed: number }[] = [
      { r: 10, alpha: 0.8, speed: 6 },
      { r: 40, alpha: 0.5, speed: 4.5 }
    ];

    const animate = () => {
      ctx.fillStyle = 'rgba(12, 13, 16, 0.25)'; // trail effect
      ctx.fillRect(0, 0, width, height);

      // Draw faint background tech scope target reticle
      ctx.strokeStyle = 'rgba(0, 209, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Center crosshair
      const cx = width / 2;
      const cy = height / 3;
      
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      // Dynamic expanding sonic wavefront segments
      circles.forEach((c, idx) => {
        c.r += c.speed;
        c.alpha -= 0.015;
        
        if (c.alpha <= 0) {
          c.r = 10;
          c.alpha = 0.8;
        }

        ctx.strokeStyle = `rgba(0, 209, 255, ${c.alpha * 0.18})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Scanline laser tracker sweep descending
      const scanTime = (Date.now() % 1400) / 1400;
      const sy = scanTime * height;
      ctx.strokeStyle = 'rgba(0, 209, 255, 0.12)';
      ctx.shadowColor = '#00d1ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onComplete} // Immediate dismiss trigger on tap
      className="absolute inset-0 z-50 bg-[#0c0d10]/95 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
      />

      <div className="relative text-center max-w-lg px-6 space-y-5 flex flex-col items-center">
        {/* Glowing holographic radar focus spinner */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-[#00d1ff]/10">
          <div className="absolute inset-0 rounded-full border-t border-b border-[#00d1ff]/40 animate-spin" style={{ animationDuration: '2s' }} />
          <Cpu className="text-[#00d1ff] animate-pulse" size={24} />
        </div>

        {/* Categories telemetry badge */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#00d1ff] border border-[#00d1ff]/30 bg-[#00d1ff]/5 px-2.5 py-0.5 rounded-full uppercase">
            {badge}
          </span>
          <span className="text-[10px] font-mono tracking-wider text-[#8e9299]">
            {moduleCategory}
          </span>
        </div>

        {/* Immersive high fidelity title */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8e9299] block">
            STABILIZING MODULE
          </span>
          <motion.h1 
            initial={{ scale: 0.95, filter: 'blur(4px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3.5xl font-light tracking-[0.1em] uppercase text-white font-sans"
          >
            {moduleLabel}
          </motion.h1>
        </div>

        {/* Real-time diagnostics logger box */}
        <div className="w-full max-w-sm bg-[#0c0d12]/80 border border-white/5 p-4 rounded-xl text-left font-mono space-y-1.5 text-[9px] sm:text-[10.5px] leading-relaxed select-none min-h-[90px]">
          <span className="text-[8px] text-zinc-500 tracking-wider block uppercase mb-1">
            Core Initialization Sequencer
          </span>
          <AnimatePresence>
            {logs.map((log, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-zinc-400"
              >
                <div className="w-1 h-3 bg-[#00d1ff] shrink-0" />
                <span>{log}</span>
                <span className="ml-auto text-[#00d1ff] font-bold">READY</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {logs.length < 3 && (
            <div className="animate-pulse flex items-center gap-2 text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span>ENGAGING RESONATION SWEEP CONTROLS...</span>
            </div>
          )}
        </div>

        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 block pt-4">
          Tap screen / click space to skip intro sweep
        </span>
      </div>
    </motion.div>
  );
}
