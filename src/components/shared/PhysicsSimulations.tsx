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

interface CWDopplerSimProps {
  velocity?: number;
  angle?: number;
  frequency?: number;
  isPaused?: boolean;
}

export const CWDopplerSim: React.FC<CWDopplerSimProps> = ({
  velocity: propVelocity = 2.0,
  angle: propAngle = 45,
  frequency: propFrequency = 4.0,
  isPaused = false
}) => {
  const [mode, setMode] = React.useState<'both' | 'pw' | 'cw'>('both');
  const [velocity, setVelocity] = React.useState(propVelocity);
  const [frequency, setFrequency] = React.useState(propFrequency);
  const [angle, setAngle] = React.useState(propAngle);
  const [prfKHz, setPrfKHz] = React.useState(5.0); // PRF for PW aliasing simulation

  const pwCanvasRef = useRef<HTMLCanvasElement>(null);
  const cwCanvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number>(0);

  // Doppler Math
  const cosTheta = Math.cos((angle * Math.PI) / 180);
  const soundSpeed = 1540; // m/s
  // fd = 2 * f0 * v * cos(theta) / c
  const dopplerShiftHz = (2 * (frequency * 1e6) * velocity * cosTheta) / soundSpeed;
  const dopplerShiftKHz = dopplerShiftHz / 1000;
  
  const nyquistLimitKHz = prfKHz / 2;
  const isPWAliased = Math.abs(dopplerShiftKHz) > nyquistLimitKHz;

  // Let's draw and animate
  useEffect(() => {
    const pwCanvas = pwCanvasRef.current;
    const cwCanvas = cwCanvasRef.current;

    const render = () => {
      if (!isPaused) {
        timeRef.current += 0.015;
      }

      // Draw PW Canvas
      if (pwCanvas) {
        const ctx = pwCanvas.getContext('2d');
        if (ctx) {
          const W = pwCanvas.width;
          const H = pwCanvas.height;
          ctx.clearRect(0, 0, W, H);
          ctx.fillStyle = '#06070a';
          ctx.fillRect(0, 0, W, H);

          // Grid
          ctx.strokeStyle = 'rgba(0, 209, 255, 0.03)';
          ctx.lineWidth = 0.5;
          for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
          }

          // Draw Transducer (Single Crystal for PW)
          ctx.fillStyle = '#16181d';
          ctx.fillRect(W / 2 - 30, 10, 60, 25);
          ctx.strokeStyle = '#2d3139';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(W / 2 - 30, 10, 60, 25);

          // Crystal Active Indicator (Pulsing blue helper)
          const pulseCycle = (timeRef.current * 2) % Math.PI;
          const isTransmitting = pulseCycle < 1.0;
          ctx.fillStyle = isTransmitting ? 'rgba(0, 209, 255, 0.35)' : 'rgba(123, 111, 255, 0.1)';
          ctx.fillRect(W / 2 - 25, 25, 50, 8);
          ctx.fillStyle = '#8e9299';
          ctx.font = '8px monospace';
          ctx.fillText(isTransmitting ? 'TX PULSE' : 'LISTENING', W / 2 - 24, 20);

          // Target (Lumen vessel blood cell flow boundary)
          const targetY = H - 55;
          ctx.strokeStyle = 'rgba(74, 158, 255, 0.25)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(10, targetY); ctx.lineTo(W - 10, targetY); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(10, targetY + 30); ctx.lineTo(W - 10, targetY + 30); ctx.stroke();
          ctx.setLineDash([]);

          // Targets (Blood cells)
          const cellRadius = 5;
          const centerX = W / 2;
          const cells = [
            { xOffset: -40, yOffset: 15 },
            { xOffset: 0, yOffset: 5 },
            { xOffset: 45, yOffset: 20 }
          ];

          cells.forEach((cell, idx) => {
            const flowX = ((centerX + cell.xOffset + timeRef.current * velocity * 25) % (W - 40)) + 20;
            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(flowX, targetY + cell.yOffset, cellRadius, 0, Math.PI * 2);
            ctx.fill();

            // Label
            if (idx === 1) {
              ctx.fillStyle = '#ffd700';
              ctx.beginPath(); ctx.arc(flowX, targetY + cell.yOffset, 1.5, 0, Math.PI * 2); ctx.fill();
            }
          });

          // Wave packet traversing down
          const angleRad = (angle * Math.PI) / 180;
          const txX = W / 2;
          const txY = 35;
          
          const maxDistance = targetY + 15 - txY;
          // Pulse transit animation
          const pulseProgress = (timeRef.current * 0.8) % 2.0; // 0 to 2 (0-1: Down, 1-2: Up)
          
          if (pulseProgress < 1.0) {
            // Downward propagating pulse
            const currDist = pulseProgress * maxDistance;
            const px = txX + Math.sin(angleRad) * currDist;
            const py = txY + Math.cos(angleRad) * currDist;

            // Draw wave envelope
            ctx.strokeStyle = 'rgba(0, 209, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let d = -15; d <= 15; d++) {
              const wx = px + Math.sin(angleRad) * d;
              const wy = py + Math.cos(angleRad) * d;
              // Gaussian modulation envelope
              const amp = Math.exp(-Math.pow(d / 8, 2)) * 12;
              const cy = wy + Math.sin((d * 0.5 - timeRef.current * 25)) * amp;
              d === -15 ? ctx.moveTo(wx, cy) : ctx.lineTo(wx, cy);
            }
            ctx.stroke();

            ctx.fillStyle = '#00d1ff';
            ctx.font = '8px monospace';
            ctx.fillText('Pulse Down', px + 18, py);
          } else {
            // Upward returning echoes
            const echoProgress = pulseProgress - 1.0;
            const currDist = (1.0 - echoProgress) * maxDistance;
            const px = txX + Math.sin(angleRad) * currDist;
            const py = txY + Math.cos(angleRad) * currDist;

            ctx.strokeStyle = 'rgba(123, 111, 255, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let d = -15; d <= 15; d++) {
              const wx = px + Math.sin(angleRad) * d;
              const wy = py + Math.cos(angleRad) * d;
              const amp = Math.exp(-Math.pow(d / 10, 2)) * 8;
              const cy = wy + Math.sin((d * 0.3 + timeRef.current * 18)) * amp;
              d === -15 ? ctx.moveTo(wx, cy) : ctx.lineTo(wx, cy);
            }
            ctx.stroke();

            ctx.fillStyle = '#a78bfa';
            ctx.font = '8px monospace';
            ctx.fillText('Echo Up', px + 18, py);
          }

          // Sound Beam line
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(txX, txY);
          ctx.lineTo(txX + Math.sin(angleRad) * maxDistance, txY + Math.cos(angleRad) * maxDistance);
          ctx.stroke();

          // Depth Specifier Marker
          ctx.fillStyle = '#00d1ff';
          ctx.beginPath();
          ctx.arc(txX + Math.sin(angleRad) * maxDistance, txY + Math.cos(angleRad) * maxDistance, 4, 0, Math.PI * 2);
          ctx.stroke();

          // Annotations
          ctx.fillStyle = '#8e9299';
          ctx.font = '9px monospace';
          ctx.fillText(`PW Range Specificity:`, 15, 20);
          ctx.fillText(`d = (c × t) / 2`, 15, 32);
          ctx.fillText(`Depth resolved perfectly.`, 15, 44);

          // Spectral Indicator
          ctx.fillStyle = isPWAliased ? '#ff4d4d' : '#22c55e';
          ctx.font = '10px monospace';
          ctx.fillText(`PW Display: ${isPWAliased ? '🔥 ALIASING' : '✓ STABLE'}`, 15, H - 15);
          ctx.fillText(`Shift: ${dopplerShiftKHz.toFixed(2)} kHz`, 15, H - 27);
        }
      }

      // Draw CW Canvas
      if (cwCanvas) {
        const ctx = cwCanvas.getContext('2d');
        if (ctx) {
          const W = cwCanvas.width;
          const H = cwCanvas.height;
          ctx.clearRect(0, 0, W, H);
          ctx.fillStyle = '#06070a';
          ctx.fillRect(0, 0, W, H);

          // Grid
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.03)';
          ctx.lineWidth = 0.5;
          for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
          }

          // Draw Transducer (DUAL crystals: TX and RX)
          const txCenterX = W / 2 - 16;
          const rxCenterX = W / 2 + 16;

          // TX constant red crystal
          ctx.fillStyle = '#3a161d';
          ctx.fillRect(txCenterX - 14, 10, 28, 25);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(txCenterX - 14, 10, 28, 25);

          // RX constant gold crystal
          ctx.fillStyle = '#2d2510';
          ctx.fillRect(rxCenterX - 14, 10, 28, 25);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rxCenterX - 14, 10, 28, 25);

          ctx.fillStyle = '#ef4444';
          ctx.font = '7px monospace';
          ctx.fillText('TX', txCenterX - 4, 20);
          ctx.fillStyle = '#ffd700';
          ctx.fillText('RX', rxCenterX - 4, 20);

          // Target Vessel
          const targetY = H - 55;
          ctx.strokeStyle = 'rgba(74, 158, 255, 0.25)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(10, targetY); ctx.lineTo(W - 10, targetY); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(10, targetY + 30); ctx.lineTo(W - 10, targetY + 30); ctx.stroke();
          ctx.setLineDash([]);

          // Targets (Red blood cells)
          const cellRadius = 5;
          const centerX = W / 2;
          const cells = [
            { xOffset: -40, yOffset: 15 },
            { xOffset: 0, yOffset: 5 },
            { xOffset: 45, yOffset: 20 }
          ];

          cells.forEach((cell, idx) => {
            const flowX = ((centerX + cell.xOffset + timeRef.current * velocity * 25) % (W - 40)) + 20;
            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(flowX, targetY + cell.yOffset, cellRadius, 0, Math.PI * 2);
            ctx.fill();
          });

          // Continuous wave propagation
          // Beam angle calculation
          const angleRad = (angle * Math.PI) / 180;
          const maxDistance = targetY + 15 - 35;

          // Continuous TX wave going down (sinusoid filling the whole line)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let d = 0; d <= maxDistance; d += 2) {
            const wx = txCenterX + Math.sin(angleRad) * d;
            const wy = 35 + Math.cos(angleRad) * d;
            // sinusoidal oscillations
            const osc = Math.sin(d * 0.15 - timeRef.current * 20) * 5;
            // normal perpendicular offset
            const ox = wx - Math.cos(angleRad) * osc;
            const oy = wy + Math.sin(angleRad) * osc;
            d === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
          }
          ctx.stroke();

          // Continuous RX wave reflecting up (sinusoid filling the whole line)
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let d = maxDistance; d >= 0; d -= 2) {
            const wx = rxCenterX + Math.sin(angleRad) * d;
            const wy = 35 + Math.cos(angleRad) * d;
            const osc = Math.sin(d * 0.15 + timeRef.current * 20) * 5;
            const ox = wx + Math.cos(angleRad) * osc;
            const oy = wy - Math.sin(angleRad) * osc;
            d === maxDistance ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
          }
          ctx.stroke();

          // Overlap zone highlight (Acoustic Sample Area)
          const ox = W / 2 + Math.sin(angleRad) * (maxDistance / 2);
          const oy = 35 + Math.cos(angleRad) * (maxDistance / 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(ox, oy, 30, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.fill();

          ctx.fillStyle = '#ffd700';
          ctx.font = '7.5px monospace';
          ctx.fillText('Acoustic Overlap Area', ox + 32, oy);
          ctx.fillText('(Range Ambiguity Zone)', ox + 32, oy + 10);

          // Annotations
          ctx.fillStyle = '#8e9299';
          ctx.font = '9px monospace';
          ctx.fillText(`CW Range Ambiguity:`, 15, 20);
          ctx.fillText(`No temporal gating.`, 15, 32);
          ctx.fillText(`Measures all shifts along beam.`, 15, 44);

          // CW status
          ctx.fillStyle = '#00d1ff';
          ctx.font = '10px monospace';
          ctx.fillText(`CW Display: ✓ 100% EXEMPT`, 15, H - 15);
          ctx.fillText(`Shift: ${dopplerShiftKHz.toFixed(2)} kHz`, 15, H - 27);
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [velocity, frequency, angle, prfKHz, isPaused, mode]);

  return (
    <div className="flex flex-col gap-5 w-full bg-[#0a0b0e] border border-white/5 p-4 sm:p-5 rounded-2xl relative shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-1">
        <div>
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#ff4d4d] mb-1">Interactive Diagnostic Lab</div>
          <h3 className="text-base sm:text-lg font-serif italic text-white">CW (Continuous) vs PW (Pulsed) Wave-Fronts</h3>
        </div>
        
        {/* Toggle Mode button */}
        <div className="flex bg-[#12141c] p-1 border border-white/5 rounded-lg shrink-0">
          {(['both', 'pw', 'cw'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[8.5px] font-mono font-bold uppercase px-3 py-1.5 rounded-md transition-all ${mode === m ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-white/40 hover:text-white'}`}
            >
              {m === 'both' ? 'Split Stage' : m === 'pw' ? 'PW Pulse Only' : 'CW Continuous Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Simulator Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(mode === 'both' || mode === 'pw') && (
          <div className="flex flex-col gap-2.5 bg-[#07080b] p-3.5 border border-white/5 rounded-xl relative">
            <div className="absolute top-3.5 right-3.5 text-[7px] font-mono font-bold text-[#00d1ff] bg-[#00d1ff]/10 border border-[#00d1ff]/20 px-2 py-0.5 rounded">PULSED_WAVE</div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">PW Mode: Temporal Gated Sampling</h4>
            <div className="relative h-[220px] rounded-lg overflow-hidden border border-white/5 bg-[#050608]">
              <canvas ref={pwCanvasRef} width="440" height="220" className="w-full h-full object-cover block" />
            </div>
            <div className="text-[9.5px] text-[#8e9299] font-mono leading-relaxed p-2.5 bg-black/30 border border-white/5 rounded-lg">
              <span className="text-[#00d1ff] font-bold">How it works:</span> PW fires a selective, short packet of sinusoidal cycles (e.g. 3 cycles), then stops to listen. By timing the travel period <span className="text-white">($t$)</span>, the machine resolves exact depth <span className="text-white">($d = c \cdot t / 2$)</span> but is capped by the <span className="text-[#ffd700]">Nyquist limit</span>. High speeds alias!
            </div>
          </div>
        )}

        {(mode === 'both' || mode === 'cw') && (
          <div className="flex flex-col gap-2.5 bg-[#07080b] p-3.5 border border-white/5 rounded-xl relative">
            <div className="absolute top-3.5 right-3.5 text-[7px] font-mono font-bold text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/20 px-2 py-0.5 rounded">CONTINUOUS_WAVE</div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">CW Mode: Dual Crystal Constant Wave</h4>
            <div className="relative h-[220px] rounded-lg overflow-hidden border border-white/5 bg-[#050608]">
              <canvas ref={cwCanvasRef} width="440" height="220" className="w-full h-full object-cover block" />
            </div>
            <div className="text-[9.5px] text-[#8e9299] font-mono leading-relaxed p-2.5 bg-black/30 border border-white/5 rounded-lg">
              <span className="text-[#ffd700] font-bold">How it works:</span> CW utilizes two separate piezoelectric elements. One constantly transmits sound (red), and the other constantly receives echoes (yellow). This uninterrupted stream allows measurement of <span className="text-white">virtually infinite speeds</span> without aliasing, but causes <span className="text-red-400">Range Ambiguity</span>.
            </div>
          </div>
        )}
      </div>

      {/* Physics Sandbox Controls */}
      <div className="bg-[#10121a]/80 border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Slider 1: Speed */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-white/50">
            <span>Blood Flow Velocity</span>
            <span className="text-[#ffd700] font-bold text-xs">{velocity.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="4.5"
            step="0.1"
            value={velocity}
            onChange={(e) => setVelocity(parseFloat(e.target.value))}
            className="w-full appearance-none h-[2px] bg-[#1e2029] accent-[#ff4d4d] cursor-pointer"
          />
          <div className="text-[8px] font-mono text-white/30 lowercase italic">
            At velocities &gt; {(nyquistLimitKHz * soundSpeed / (2 * (frequency * 1e6) * cosTheta) / 1000).toFixed(2)} m/s, PW spectrogram experiences severe alias.
          </div>
        </div>

        {/* Slider 2: Frequency */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-white/50">
            <span>Transmit Frequency (f₀)</span>
            <span className="text-[#00d1ff] font-bold text-xs">{frequency.toFixed(1)} MHz</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="8.0"
            step="0.1"
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            className="w-full appearance-none h-[2px] bg-[#1e2029] accent-[#00d1ff] cursor-pointer"
          />
          <div className="text-[8px] font-mono text-white/30 lowercase italic">
            Higher frequency creates higher Doppler shift ($f_d \propto f_0$), making it more prone to PW aliasing limit.
          </div>
        </div>

        {/* Slider 3: Angle */}
        <div className="flex flex-col justify-between gap-2.5">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-white/50">
            <span>Insonation Angle (θ)</span>
            <span className="text-[#a78bfa] font-bold text-xs">{angle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="89"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
            className="w-full appearance-none h-[2px] bg-[#1e2029] accent-[#a78bfa] cursor-pointer"
          />
          <div className="text-[8px] font-mono text-white/30 lowercase italic">
            Cosine values drop as angle nears 90°, decreasing apparent shift. 60° is standard clinical limit.
          </div>
        </div>
      </div>

      {/* Physics Math Panel */}
      <div className="bg-[#12141c] rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-full bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20 shrink-0">
            <span className="text-sm font-sans italic font-bold text-[#ff4d4d]">f</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] font-mono uppercase font-bold tracking-widest text-[#ff4d4d]">Math Formula Solver (The Doppler Equation)</span>
            <p className="text-[12px] font-mono font-bold text-white tracking-widest">
              f_d = [ 2 · f_0 · v · cos(θ) ] / c = <span className="text-[#00d1ff] font-sans font-extrabold italic text-sm">{dopplerShiftKHz.toFixed(3)} kHz</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-black/45 border border-white/5 px-3 py-2 rounded-lg text-center shrink-0">
            <span className="text-[7px] text-[#8e9299] block font-mono font-bold uppercase tracking-wider mb-0.5">PW NYQUIST (PRF/2)</span>
            <span className="text-[11px] font-mono font-black text-[#00d1ff]">{nyquistLimitKHz.toFixed(2)} kHz</span>
          </div>
          <div className="bg-black/45 border border-white/5 px-3 py-2 rounded-lg text-center shrink-0">
            <span className="text-[7px] text-[#8e9299] block font-mono font-bold uppercase tracking-wider mb-0.5">CW LIMIT</span>
            <span className="text-[11px] font-mono font-black text-rose-500">Uncapped (∞)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
