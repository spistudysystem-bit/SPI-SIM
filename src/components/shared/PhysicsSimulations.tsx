import React, { useRef, useEffect } from 'react';

interface WaveSimProps {
  frequency: number;
  amplitude: number;
  attenuation: number;
  isPaused?: boolean;
}

export const WaveSim: React.FC<WaveSimProps> = ({ 
  frequency, 
  amplitude, 
  attenuation,
  isPaused = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const { width } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = 160 * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const render = () => {
      if (!isPaused) {
        timeRef.current += 0.01;
      }

      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);
      const cy = H / 2;
      const att = attenuation / 100;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#090914';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(201,168,76,.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }

      // Wave
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const af = 1 - att * (x / W);
        const y = cy - Math.sin((x / W * frequency * 2.5 + timeRef.current) * Math.PI * 2) * amplitude * af;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#C9A84C');
      g.addColorStop(0.45, '#7B6FFF');
      g.addColorStop(1, 'rgba(123,111,255,.05)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [frequency, amplitude, attenuation, isPaused]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full bg-[#090914] rounded-lg cursor-crosshair shadow-inner h-[160px]"
      />
    </div>
  );
};

export const DopplerSim: React.FC<{ angle: number; velocity: number }> = ({ angle, velocity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const { width } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = 210 * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const render = () => {
      timeRef.current += 0.012;
      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);
      const rad = angle * Math.PI / 180;
      
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#090914';
      ctx.fillRect(0, 0, W, H);

      // Vessel
      const vw = Math.min(600, W * 0.8), vx = (W - vw) / 2, vy = H / 2, vr = 28;
      ctx.fillStyle = 'rgba(26,26,50,.9)';
      ctx.fillRect(vx, vy - vr, vw, vr * 2);
      ctx.strokeStyle = 'rgba(74,158,255,.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy - vr, vw, vr * 2);

      // Particles
      for (let i = 0; i < 18; i++) {
        const px = ((i / 18 * vw + timeRef.current * velocity * 0.8) % (vw)) + vx;
        const yOff = (i % 3 - 1) * 8;
        ctx.fillStyle = `rgba(201,168,76,${0.4 + 0.4 * Math.sin(timeRef.current * 3 + i)})`;
        ctx.beginPath(); ctx.arc(px, vy + yOff, 3, 0, Math.PI * 2); ctx.fill();
      }

      // Beam
      const bx = W * 0.5, by = 30;
      const bex = bx + Math.sin(rad) * 160;
      const bey = by + Math.cos(rad) * 160;
      ctx.strokeStyle = 'rgba(123,111,255,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bex, bey); ctx.stroke();

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [angle, velocity]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg bg-[#090914] h-[210px]" />
    </div>
  );
};
