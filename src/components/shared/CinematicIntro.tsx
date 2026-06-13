import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Atom, Activity, HeartPulse, Sparkles, Volume2, ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

interface WavePulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  speed: number;
  type: 'transmit' | 'echo';
}

interface ScatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

const INSPIRES = [
  { text: "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.", author: "Nikola Tesla" },
  { text: "The art of sonography is the language of mechanical waves mapping the unseen geometries of life.", author: "Acoustical Physics Maxim" },
  { text: "There is no science without fancy and no art without facts.", author: "Vladimir Nabokov" },
  { text: "What we see is but a shadow of the mechanical echoes returning from the deep.", author: "Rayleigh Interface Principle" },
  { text: "The meeting of parallel sound beams forms the focal zone of clinical clarity.", author: "Huygens' Principle" }
];

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [stage, setStage] = useState(0);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Select quote on mount
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * INSPIRES.length);
    setQuote(INSPIRES[randomIdx]);
  }, []);

  useEffect(() => {
    // Stage-based timing for text transitions and final fade
    const t0 = setTimeout(() => setStage(1), 500);
    const t1 = setTimeout(() => setStage(2), 2200);
    const t2 = setTimeout(() => setStage(3), 4200);
    const t3 = setTimeout(() => onComplete(), 5800);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Premium ambient acoustical ultrasound pulse sound synthesizer
  const playSonarSweep = (frequencyStart = 520, frequencyEnd = 140, duration = 1.2) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      // Prevent running if blocked or suspended state
      if (audioCtx.state === 'suspended') {
        // We do not force resume to prevent browser alerts, let user interactions trigger or fail silently
        return;
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequencyStart, audioCtx.currentTime);
      // Swept exponential down-ramp mimics the acoustics echoes attenuation
      osc.frequency.exponentialRampToValueAtTime(frequencyEnd, audioCtx.currentTime + duration);

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      // Lowpass filter to make it deeply atmospheric and non-abrasive
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored: browser autoplay policy limits
    }
  };

  // Trigger sound when clicking screen
  const handleInteractionClick = () => {
    playSonarSweep(620, 180, 0.9);
  };

  // High-fidelity Acoustical Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Acoustical Simulation State Arrays
    let waves: WavePulse[] = [];
    let particles: ScatterParticle[] = [];
    let beamAngle = -Math.PI / 4; 
    let beamDirection = 1;
    let pulseTimer = 0;

    // Static horizontal array coordinates representing piezoelectric elements
    const elementY = 80;
    const elementCount = 24;

    const animate = () => {
      ctx.fillStyle = 'rgba(12, 13, 16, 0.15)'; // Deep space trail fade
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Simulated Piezoelectric Transducer Aperture
      const startX = width / 2 - 120;
      const spacing = 240 / (elementCount - 1);
      
      // Draw faint mechanical casing of the probe
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX - 15, elementY - 20, 270, 30);
      
      for (let i = 0; i < elementCount; i++) {
        const x = startX + i * spacing;
        // Element trigger indicator
        const distFromCenter = Math.abs(i - elementCount / 2);
        const intensity = Math.max(0.1, 1 - distFromCenter / (elementCount / 2));
        
        ctx.fillStyle = `rgba(0, 209, 255, ${0.1 + intensity * 0.1})`;
        ctx.fillRect(x - 2, elementY - 10, 4, 12);
        
        // Element electrical spark highlight
        if (Math.random() < 0.04) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(x - 3, elementY - 11, 6, 2);
        }
      }

      // 2. Synthesize Transmit Sonic Pulse Sequences periodically
      pulseTimer++;
      if (pulseTimer % 18 === 0) {
        // Sweep the dynamic steering focus beam
        beamAngle += 0.08 * beamDirection;
        if (beamAngle > Math.PI / 4) beamDirection = -1;
        if (beamAngle < -Math.PI / 4) beamDirection = 1;

        // Firing sound effect automatically on wave emissions
        // Triggered every few seconds ambiently
        if (pulseTimer % 54 === 0) {
          playSonarSweep(580, 160, 1.4);
        }

        // Multiple waves generated with precise delays to show interference wavefront synthesis
        for (let delay = 0; delay < 5; delay++) {
          waves.push({
            x: width / 2,
            y: elementY,
            radius: delay * -12, // staggered delay negative radius
            maxRadius: Math.max(width, height) * 0.9,
            opacity: 1,
            color: 'rgba(0, 209, 255, 0.45)',
            speed: 5.5,
            type: 'transmit'
          });
        }
      }

      // 3. Render Acoustic Interference Waves & Sweep Beams
      waves.forEach((w, index) => {
        w.radius += w.speed;
        if (w.radius < 0) return; // Stagger waiting period

        const lifeRatio = 1 - w.radius / w.maxRadius;
        w.opacity = lifeRatio * 1.5;

        if (w.opacity <= 0) {
          waves.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.beginPath();
        
        // Beam steer simulation (using clip masks or parabolic arc constraints)
        const fanSpan = Math.PI / 3;
        const centerAngle = Math.PI / 2 + beamAngle;
        
        ctx.arc(w.x, w.y, w.radius, centerAngle - fanSpan, centerAngle + fanSpan);
        ctx.strokeStyle = w.type === 'transmit' 
          ? `rgba(0, 209, 255, ${0.25 * w.opacity})` 
          : `rgba(244, 63, 94, ${0.35 * w.opacity})`;
        
        // Highlight active wave peak to mimic compressed compression zone
        ctx.lineWidth = w.type === 'transmit' ? 2 : 1.5;
        ctx.stroke();

        // Secondary high-frequency carrier wave ripple inside main pulse
        if (w.radius > 8) {
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.radius - 8, centerAngle - fanSpan, centerAngle + fanSpan);
          ctx.strokeStyle = w.type === 'transmit' 
            ? `rgba(0, 209, 255, ${0.08 * w.opacity})` 
            : `rgba(244, 63, 94, ${0.12 * w.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Generate scatter collision particles when transmit wave front hits specific 'tissue boundaries'
        const borderLevel = height * 0.58;
        if (w.type === 'transmit' && Math.abs((w.y + w.radius) - borderLevel) < 6) {
          // Colliding at a physical focus point triggers reflection echoes
          const collideX = w.x + Math.sin(beamAngle) * w.radius;
          const collideY = borderLevel + (Math.random() - 0.5) * 15;
          
          if (Math.random() < 0.35 && collideX > 40 && collideX < width - 40) {
            // Echo wave returned back to transducer source
            waves.push({
              x: collideX,
              y: collideY,
              radius: 5,
              maxRadius: w.radius * 0.8,
              opacity: 1,
              color: 'rgba(244, 63, 94, 0.5)',
              speed: 4.5,
              type: 'echo'
            });

            // Burst particle scatter visual sparks
            for (let p = 0; p < 8; p++) {
              particles.push({
                x: collideX,
                y: collideY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.7) * 4 - 1.5,
                life: 0,
                maxLife: 30 + Math.random() * 25,
                size: 1.5 + Math.random() * 2.5,
                color: Math.random() > 0.4 ? 'rgba(0, 209, 255, 0.85)' : 'rgba(244, 63, 94, 0.85)',
                alpha: 1
              });
            }
          }
        }
      });

      // 4. Render Horizontal 'Tissue Core Reflector interface' with a fluorescent laser-line
      const lineY = height * 0.58;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Highlight the focused sector scan range area directly
      const gradient = ctx.createRadialGradient(width / 2, elementY, 100, width / 2, elementY, height * 0.7);
      gradient.addColorStop(0, 'rgba(0, 209, 255, 0.04)');
      gradient.addColorStop(0.5, 'rgba(0, 209, 255, 0.005)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.moveTo(width / 2, elementY);
      ctx.arc(width / 2, elementY, height * 0.75, Math.PI/2 - Math.PI/3.5, Math.PI/2 + Math.PI/3.5);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // 5. Update and Draw Sparkle/Scatter Echo Particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity/drag coefficient
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particles.splice(index, 1);
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('0.85', p.alpha.toString());
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [soundEnabled]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: stage < 3 ? 1 : 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      onClick={handleInteractionClick}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#0c0d10] cursor-pointer"
    >
      {/* Interactive Skip Button & Sound Toggle Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-[250]" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#8e9299] hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={soundEnabled ? 'Mute Sonar Synth' : 'Enable Sonar Synth'}
        >
          <Volume2 size={16} className={soundEnabled ? 'text-[#00d1ff] animate-pulse' : 'text-zinc-600'} />
        </button>
        <button
          onClick={onComplete}
          className="px-4 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-mono hover:text-[#00d1ff] rounded-xl transition-all tracking-widest uppercase flex items-center gap-1 cursor-pointer font-bold"
        >
          Skip Intro <ArrowRight size={12} className="text-[#00d1ff]" />
        </button>
      </div>

      {/* Real-time Simulated Acoustical Waves Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-50"
      />

      {/* Cybernetic Grid/Scanning overlay lines */}
      <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#00d1ff12_1px,transparent_1px),linear-gradient(to_bottom,#00d1ff12_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,#0c0d10_75%)] pointer-events-none" />

      {/* Running Boot Console Sequence Logs */}
      <div className="absolute bottom-8 left-8 font-mono text-[9px] sm:text-[10px] text-zinc-600 uppercase flex flex-col gap-1 tracking-[0.2em] text-left z-20">
        <AnimatePresence>
          {stage >= 0 && (
            <motion.div key="seq1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              INIT SEQUENCE: SIM_ACOUSTIC_CORE_ACTIVE
            </motion.div>
          )}
          {stage >= 1 && (
            <motion.div key="seq2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-zinc-500">
              SYNTHESIZING PARABOLIC DELAY BEAMS...
            </motion.div>
          )}
          {stage >= 1 && (
            <motion.div key="seq3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-zinc-500">
              CALIBRATING 24-ELEMENT PIEZOELECTRIC APERTURE...
            </motion.div>
          )}
          {stage >= 2 && (
            <motion.div key="seq4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[#00d1ff] mt-2 font-black">
              ACOUSTIC FOCUS STABILIZED. SYSTEM ARMED.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {stage >= 1 && stage < 3 && (
          <motion.div 
            key="main-logo-container"
            initial={{ scale: 0.94, opacity: 0, filter: 'blur(15px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 1.05, opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center gap-8 px-4"
          >
            {/* Holographic Glowing Circle Arrays */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-[#00d1ff]/10 flex items-center justify-center relative shadow-[0_0_100px_rgba(0,209,255,0.06)]"
            >
              <div className="absolute inset-0 rounded-full border-t border-r shadow-[0_0_25px_#00d1ff] border-[#00d1ff]/50 animate-spin" style={{ animationDuration: '3.5s' }} />
              <div className="absolute inset-4 rounded-full border-b border-l shadow-[0_0_20px_#f43f5e] border-rose-500/30 animate-spin" style={{ animationDuration: '5.5s', animationDirection: 'reverse' }} />
              <div className="absolute inset-8 rounded-full border-t border-[#10b981]/20 animate-spin" style={{ animationDuration: '7.5s' }} />
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#00d1ff] rounded-lg flex items-center justify-center shadow-[0_0_50px_rgba(0,209,255,0.55)]">
                <Atom size={32} className="text-black fill-current animate-pulse" />
              </div>
            </motion.div>

            <div className="text-center space-y-3 max-w-xl">
              <motion.div 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="brand text-2xl sm:text-4xl lg:text-5xl tracking-[4px] sm:tracking-[8px] uppercase text-white font-extrabold ml-4"
              >
                <span className="text-yellow-400 font-mono font-black">U.U.U.</span> UNDERGROUND
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 1.2 }}
                className="text-[9px] sm:text-[11px] font-mono text-[#8e9299] tracking-[0.3em] uppercase mx-auto"
              >
                SPI EXAM REVIEW • SONOGRAPHY SONGS + LECTURES
              </motion.div>

              {/* Cinematic Physics Quote */}
              {quote.text && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 1.2 }}
                  className="pt-6 border-t border-white/5 space-y-1.5 select-none"
                >
                  <p className="text-xs sm:text-sm text-zinc-300 italic max-w-sm sm:max-w-md mx-auto leading-relaxed">
                    "{quote.text}"
                  </p>
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#00d1ff]/80">
                    — {quote.author}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

