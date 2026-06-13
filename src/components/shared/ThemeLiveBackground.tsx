import React, { useEffect, useRef } from 'react';

interface ThemeLiveBackgroundProps {
  theme: 'dark' | 'daylight';
}

export default function ThemeLiveBackground({ theme }: ThemeLiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId: number;

    // Simulation states
    interface WaveFront {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      opacity: number;
      color: string;
      lineWidth: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      growth: number;
      colorType: 'cyan' | 'magenta' | 'lime' | 'gold';
    }

    interface BloodCorpuscle {
      pathIndex: number;
      progress: number; // 0 to 1 along the screen width
      speed: number;
      size: number;
      color: string;
      pulseFactor: number;
    }

    let waves: WaveFront[] = [];
    let particles: Particle[] = [];
    let corpuscles: BloodCorpuscle[] = [];
    const maxParticles = 65; // increased density for more ambient richness
    const maxCorpuscles = 24; // increased blood corpuscle flow density

    // Handle Resize using ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: boxWidth, height: boxHeight } = entry.contentRect;
        width = boxWidth;
        height = boxHeight;
        
        // Correct for high-res screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = boxWidth * dpr;
        canvas.height = boxHeight * dpr;
        canvas.style.width = `${boxWidth}px`;
        canvas.style.height = `${boxHeight}px`;
        ctx.scale(dpr, dpr);

        // Re-initialize elements relative to new size
        initParticles();
        initCorpuscles();
      }
    });

    resizeObserver.observe(container);

    const initParticles = () => {
      particles = [];
      const types: ('cyan' | 'magenta' | 'lime' | 'gold')[] = ['cyan', 'magenta', 'lime', 'gold'];
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          size: Math.random() * 1.8 + 0.5,
          alpha: Math.random() * 0.45 + 0.1,
          baseAlpha: Math.random() * 0.3 + 0.1,
          growth: Math.random() * 0.012 + 0.002,
          colorType: types[Math.floor(Math.random() * types.length)]
        });
      }
    };

    const initCorpuscles = () => {
      corpuscles = [];
      for (let i = 0; i < maxCorpuscles; i++) {
        // Distribute across 3 distinct vessels simulating dynamic multi-frequency structures
        const pathIndex = Math.floor(Math.random() * 3);
        const isArterial = pathIndex === 0;
        const color = isArterial 
          ? 'rgba(255, 0, 127, 0.65)' // Neon Hot Pink
          : pathIndex === 1
            ? 'rgba(0, 240, 255, 0.65)' // Neon Cyan
            : 'rgba(57, 255, 20, 0.6)'; // Neon Lime
            
        corpuscles.push({
          pathIndex,
          progress: Math.random(),
          speed: 0.0008 + Math.random() * 0.0012,
          size: Math.random() * 3.2 + 1.2,
          color,
          pulseFactor: Math.random() * Math.PI
        });
      }
    };

    // Spawn a wave propagating from a position - with brilliant neon halo colors
    const spawnWave = (startX?: number, startY?: number) => {
      if (waves.length >= 8) return; // Cap simultaneous wavefronts for performance

      const isDay = theme === 'daylight';
      // High intensity glowing neon hues
      const colors = isDay 
        ? [
            'rgba(14, 165, 233, 0.15)', // bright sky blue
            'rgba(6, 182, 212, 0.12)', // electric cyan
            'rgba(244, 63, 94, 0.1)' // rose blush
          ]
        : [
            'rgba(0, 240, 255, 0.25)', // Neon Cyan
            'rgba(255, 0, 127, 0.2)',  // Neon Magenta/Pink
            'rgba(57, 255, 20, 0.22)', // Neon Lime
            'rgba(255, 170, 0, 0.18)'  // Neon Orange/Gold
          ];

      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      waves.push({
        x: startX ?? Math.random() * width,
        y: startY ?? 0, 
        radius: 0,
        maxRadius: Math.max(width, height) * (0.65 + Math.random() * 0.3),
        speed: 1.5 + Math.random() * 1.5,
        opacity: 0.95,
        color: randomColor,
        lineWidth: 1.2 + Math.random() * 2.0
      });
    };

    // Auto spawn waves occasionally
    let lastSpawn = 0;
    const waveSpawnCooldown = 2800; // faster cycle for double kinetic activity

    // Animation loop
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      const isDay = theme === 'daylight';
      const opacityMultiplier = isDay ? 0.35 : 1.0;

      // 1. Draw Sonographic Grid & Cybernetic Target Circles (Scanner Interface)
      const centerX = width / 2;
      const centerY = -50;
      const beamLength = Math.max(width, height) * 0.95;

      try {
        // Draw standard target radial grid lines
        ctx.strokeStyle = isDay ? 'rgba(14, 165, 233, 0.02)' : 'rgba(0, 240, 255, 0.025)';
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        for (let angleDeg = 45; angleDeg <= 135; angleDeg += 15) {
          const rad = (angleDeg * Math.PI) / 180;
          const endX = centerX + Math.cos(rad) * beamLength;
          const endY = centerY + Math.sin(rad) * beamLength;
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();

        // Radiating Target Rings with Neon Cyan accents
        ctx.strokeStyle = isDay ? 'rgba(14, 165, 233, 0.025)' : 'rgba(0, 240, 255, 0.035)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let r = 80; r < beamLength; r += 120) {
          ctx.arc(centerX, centerY, r, (40 * Math.PI) / 180, (140 * Math.PI) / 180);
        }
        ctx.stroke();
      } catch (err) {}

      // 2. Render Ultrasound Sector Sweep (Radar sonography scan lines) with stunning Neon magenta & cyan gradients
      const sweepAngle = Math.sin(timestamp * 0.001) * (Math.PI / 4.8);
      try {
        const beamX = centerX + Math.sin(sweepAngle) * beamLength;
        const beamY = centerY + Math.cos(sweepAngle) * beamLength;
        
        const scanGlow = ctx.createLinearGradient(centerX, centerY, beamX, beamY);
        if (isDay) {
          scanGlow.addColorStop(0, 'rgba(14, 165, 233, 0.22)');
          scanGlow.addColorStop(0.3, 'rgba(6, 182, 212, 0.08)');
          scanGlow.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          // Intense neon cyan laser gradient transitioning to magenta aura
          scanGlow.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
          scanGlow.addColorStop(0.2, 'rgba(0, 240, 255, 0.15)');
          scanGlow.addColorStop(0.5, 'rgba(255, 0, 127, 0.08)');
          scanGlow.addColorStop(1, 'rgba(0,0,0,0)');
        }

        ctx.strokeStyle = scanGlow;
        ctx.lineWidth = isDay ? 4 : 7;
        
        // Active neon glow blur on the sweep line for immersive vibes
        if (!isDay) {
          ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(beamX, beamY);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset instantly for performance safety
      } catch (e) {}

      // Auto trigger random acoustic wavefront
      if (timestamp - lastSpawn > waveSpawnCooldown) {
        spawnWave(width / 2, -20);
        lastSpawn = timestamp;
      }

      // 3. Render Simulated Real-Time Neon ECG/Pulse Telemetry Timeline at the bottom of the screen!
      try {
        ctx.beginPath();
        ctx.lineWidth = isDay ? 1.5 : 2.5;
        ctx.strokeStyle = isDay ? 'rgba(14, 165, 233, 0.35)' : 'rgba(57, 255, 20, 0.55)'; // Neon Lime Green
        
        if (!isDay) {
          ctx.shadowColor = 'rgba(57, 255, 20, 0.85)';
          ctx.shadowBlur = 10;
        }

        const ecgY = height - 90;
        const ecgW = width;
        
        for (let x = 0; x < ecgW; x += 5) {
          // Simulated clinical continuous sinus rhythm
          const frequency = 0.012;
          const cycleRad = (timestamp * 0.0022 - x * frequency) % (Math.PI * 2);
          
          let yOffset = Math.sin(cycleRad * 0.5) * 4; // base physical vibration
          
          // QRS complex spike
          if (cycleRad > 0 && cycleRad < 0.6) {
            const progress = cycleRad / 0.6; // 0 to 1
            if (progress < 0.15) {
              // Q wave dip
              yOffset -= progress * 15;
            } else if (progress < 0.45) {
              // R wave spike
              yOffset += (progress - 0.15) * 90;
            } else if (progress < 0.75) {
              // S wave drop
              yOffset -= (progress - 0.45) * 110;
            } else {
              // return to baseline
              yOffset += (progress - 0.75) * 35;
            }
          } else if (cycleRad >= 1.0 && cycleRad < 1.6) {
            // T wave hump
            const tProgress = (cycleRad - 1.0) / 0.6;
            yOffset += Math.sin(tProgress * Math.PI) * 18;
          }

          if (x === 0) {
            ctx.moveTo(x, ecgY + yOffset);
          } else {
            ctx.lineTo(x, ecgY + yOffset);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
        
        // Draw secondary spectral baseline
        ctx.strokeStyle = isDay ? 'rgba(14, 165, 233, 0.1)' : 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ecgY);
        ctx.lineTo(width, ecgY);
        ctx.stroke();
      } catch (err) {}

      // 4. Render Multiple Complex Vascular Micro-vessel Channels
      try {
        // Path 0 (Neon Magenta Arterial high-vibe conduit flowing Left-to-Right)
        // Path 1 (Neon Cyan Venous steady profile flowing Right-to-Left)
        // Path 2 (Neon Lime Peripheral high-frequency pathway weaving gently near center)
        const flowY0 = height * 0.28;
        const flowY1 = height * 0.66;
        const flowY2 = height * 0.46;

        const pathCoordsY = [flowY0, flowY1, flowY2];

        // Draw faint tube boundaries to give context
        ctx.strokeStyle = isDay ? 'rgba(0, 0, 0, 0.01)' : 'rgba(255, 255, 255, 0.008)';
        ctx.lineWidth = 14;
        
        // Tube 0 (Arterial Conduit)
        ctx.beginPath();
        for (let x = 0; x <= width; x += 50) {
          const y = flowY0 + Math.sin(x * 0.0035 + timestamp * 0.0006) * 15;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Tube 1 (Venous Conduit)
        ctx.beginPath();
        for (let x = 0; x <= width; x += 50) {
          const y = flowY1 + Math.cos(x * 0.0025 - timestamp * 0.0004) * 18;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Tube 2 (Peripheral High-Freq)
        ctx.beginPath();
        for (let x = 0; x <= width; x += 50) {
          const y = flowY2 + Math.sin(x * 0.005 + timestamp * 0.0008) * 10;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Move and draw corpuscles with neon glows inside simulated vessels
        corpuscles.forEach((corp) => {
          corp.progress += corp.speed;
          if (corp.progress > 1) {
            corp.progress = 0;
            corp.size = Math.random() * 3.2 + 1.2;
          }

          let px = 0;
          let py = 0;

          if (corp.pathIndex === 0) {
            // Left to right
            px = corp.progress * width;
            py = flowY0 + Math.sin(px * 0.0035 + timestamp * 0.0006) * 15;
            
            ctx.fillStyle = corp.color;
            if (!isDay) {
              ctx.shadowColor = 'rgba(255, 0, 127, 0.8)';
              ctx.shadowBlur = 8;
            }
          } else if (corp.pathIndex === 1) {
            // Right to left
            px = (1 - corp.progress) * width;
            py = flowY1 + Math.cos(px * 0.0025 - timestamp * 0.0004) * 18;
            
            ctx.fillStyle = corp.color;
            if (!isDay) {
              ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
              ctx.shadowBlur = 8;
            }
          } else {
            // Intertwining path Left to right
            px = corp.progress * width;
            py = flowY2 + Math.sin(px * 0.005 + timestamp * 0.0008) * 10;
            
            ctx.fillStyle = corp.color;
            if (!isDay) {
              ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
              ctx.shadowBlur = 6;
            }
          }

          ctx.beginPath();
          ctx.arc(px, py, corp.size, 0, Math.PI * 2);
          ctx.fill();
        });
        
        ctx.shadowBlur = 0; // Safety clear
      } catch (e) {}

      // 5. Render Waves (Ultrasound Wave Fronts with multi-frequency high contrast glow)
      waves.forEach((wave) => {
        wave.radius += wave.speed;
        const lifeRatio = wave.radius / wave.maxRadius;
        wave.opacity = Math.max(0, 0.95 * (1 - lifeRatio)) * opacityMultiplier;

        ctx.strokeStyle = wave.color.replace(/[\d.]+\)$/, `${wave.opacity})`);
        ctx.lineWidth = wave.lineWidth;

        if (!isDay) {
          ctx.shadowColor = wave.color.replace(/[\d.]+\)$/, '0.9)');
          ctx.shadowBlur = 10;
        }
        
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Remove dead waves
      waves = waves.filter(wave => wave.radius < wave.maxRadius);
      ctx.shadowBlur = 0; // reset

      // 6. Render Particles (Neon Acoustic Scatterers)
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse opacity (vibrant twinkling)
        p.alpha = (p.baseAlpha + Math.sin(timestamp * p.growth) * p.baseAlpha * 0.6) * opacityMultiplier;
        
        let colorStr = '';
        if (isDay) {
          colorStr = `rgba(14, 165, 233, ${p.alpha * 0.6})`;
        } else {
          if (p.colorType === 'cyan') colorStr = `rgba(0, 240, 255, ${p.alpha})`; // Cyan
          else if (p.colorType === 'magenta') colorStr = `rgba(255, 0, 127, ${p.alpha})`; // Hot Pink
          else if (p.colorType === 'lime') colorStr = `rgba(57, 255, 20, ${p.alpha})`; // Neon Lime
          else colorStr = `rgba(255, 170, 0, ${p.alpha})`; // Electric Gold
        }

        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Push particles from wavefronts simulating real acoustic physics (compressibility)
        waves.forEach(wave => {
          const dx = p.x - wave.x;
          const dy = p.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - wave.radius) < 30) {
            const force = (30 - Math.abs(dist - wave.radius)) / 30;
            p.x += (dx / dist) * force * 0.45;
            p.y += (dy / dist) * force * 0.45;
          }
        });
      });

      // 7. Draw Digital Sonographic HUD Systems Watermarks with premium branding
      try {
        const textOpacity = isDay ? 0.12 : 0.08;
        ctx.fillStyle = isDay ? `rgba(15, 23, 42, ${textOpacity})` : `rgba(0, 240, 255, ${textOpacity})`;
        
        // Top Left Annotation HUD
        ctx.font = 'bold 8.5px monospace, Courier, monospace-ui';
        ctx.fillText('SYS CODE: ARDMS-SPI // REF_OSC: [ACTIVE]', 24, 30);
        ctx.fillText('SCANNING MODE: REAL-TIME TRIPLEX', 24, 43);
        ctx.fillText('PRF RATIO: 6.2 KHZ // AUTOPULSED', 24, 56);

        // Top Right Info HUD
        ctx.fillText('SPI-SPECTRUM: LOCK CALIBRANT', width - 210, 30);
        ctx.fillText('COGNITIVE SONAR CHIP DETECTED', width - 210, 43);
        ctx.fillText('ANTIGRAVITY SYSTEMS INGRESS', width - 210, 56);

        // Draw coordinate ticks in neon colors
        ctx.fillStyle = isDay ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 0, 127, 0.12)';
        ctx.fillText('+ CENTER CORRELATION', centerX - 60, centerY + 300);
        
        ctx.fillStyle = isDay ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 240, 255, 0.12)';
        ctx.fillText('o COHERENT APERTURE [OK]', centerX - 65, centerY + 500);

        // Watermarks at absolute corners
        ctx.fillStyle = isDay ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)';
        ctx.fillText('SPI PHYSICS LAB V3.2', 24, height - 35);
        ctx.fillText('ULTRA-HIGH FREQUENCY TRANSDUCER INTERACTIVE', width - 260, height - 35);
      } catch (err) {}

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Dynamic wave trigger when clicked by user inside preview container
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnWave(x, y);
      // Spawn two additional waves nearby for complex interference pattern!
      setTimeout(() => spawnWave(x - 45, y + 25), 180);
      setTimeout(() => spawnWave(x + 45, y - 25), 360);
    };

    container.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (container) {
        container.removeEventListener('click', handleClick);
      }
    };
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
    >
      <canvas 
        ref={canvasRef} 
        className="opacity-[0.88] mix-blend-screen pointer-events-none transition-opacity duration-1000"
      />
    </div>
  );
}
