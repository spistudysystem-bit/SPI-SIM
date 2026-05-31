import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  HelpCircle, 
  Activity, 
  Compass, 
  Waves, 
  Maximize2 
} from 'lucide-react';

interface SimProps {
  videoId: string;
  onClose: () => void;
}

export default function InteractiveUltrasoundVideoSim({ videoId, onClose }: SimProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSubMode, setActiveSubMode] = useState<string>('default');
  
  // Slide controls depending on physics modes
  const [frequencyMHz, setFrequencyMHz] = useState<number>(6); // 2-12 MHz
  const [steeringAngle, setSteeringAngle] = useState<number>(15); // -45 to 45 deg
  const [targetSpacing, setTargetSpacing] = useState<number>(4); // 2-12 mm spacing
  const [focalDepth, setFocalDepth] = useState<number>(100); // 50-180 px depth
  const [artifactType, setArtifactType] = useState<'reverb' | 'shadow' | 'enhance'>('shadow');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Initialize specific submodes so the UI shows options for each selected video
  useEffect(() => {
    if (videoId === 'transducer-selection') {
      setActiveSubMode('linear');
    } else if (videoId === 'artifacts-guide') {
      setActiveSubMode('shadow');
      setArtifactType('shadow');
    } else {
      setActiveSubMode('default');
    }
  }, [videoId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = phaseRef.current;

    const render = () => {
      if (isPlaying) {
        localPhase += 0.05;
        phaseRef.current = localPhase;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Clear with medical monitor dark slate color
      ctx.fillStyle = '#0a0c10';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 1. CHOOSE CORRESPONDING RENDER MODULE
      if (videoId === 'transducer-selection' || videoId === 'linear-array' || videoId === 'curved-array') {
        renderTransducersAndBeams(ctx, w, h, localPhase);
      } else if (videoId === 'phased-array') {
        renderPhasedSteering(ctx, w, h, localPhase);
      } else if (videoId === 'resolution') {
        renderResolutionTargets(ctx, w, h, localPhase);
      } else if (videoId === 'frequency') {
        renderAttenuationWaves(ctx, w, h, localPhase);
      } else if (videoId === 'artifacts-guide') {
        renderClinicalArtifacts(ctx, w, h, localPhase);
      } else {
        // Fallback generic simulator
        renderGenericWave(ctx, w, h, localPhase);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, videoId, activeSubMode, frequencyMHz, steeringAngle, targetSpacing, focalDepth, artifactType]);

  // RENDER INTERACTIVE SCHEMAS

  // 1. Transducer Selection & Scan Field Geometry
  const renderTransducersAndBeams = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    const sweep = Math.sin(phase * 1.5) * 0.5 + 0.5; // 0 to 1
    
    // Choose active style
    let mode = activeSubMode;
    if (videoId === 'linear-array') mode = 'linear';
    if (videoId === 'curved-array') mode = 'curved';

    // Draw Transducer Body representation on top
    ctx.shadowBlur = 0;
    
    if (mode === 'linear') {
      const txHeight = 40;
      const txWidth = 240;
      const txX = w / 2 - txWidth / 2;
      const txY = 20;

      // Draw Linear Transducer Hull
      ctx.fillStyle = '#161d26';
      ctx.fillRect(txX, txY, txWidth, txHeight);
      ctx.strokeStyle = '#00d1ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(txX, txY, txWidth, txHeight);

      // Draw linear crystal elements Array
      const elementsCount = 28;
      const elemW = txWidth / elementsCount;
      const activeIdx = Math.floor(sweep * (elementsCount - 5));

      for (let i = 0; i < elementsCount; i++) {
        const ex = txX + i * elemW;
        const isActive = i >= activeIdx && i < activeIdx + 5;
        ctx.fillStyle = isActive ? '#00d1ff' : '#2a3545';
        ctx.fillRect(ex + 1, txY + 25, elemW - 2, 10);

        if (isActive) {
          // Draw parallel vertical scan beams firing straight down
          ctx.fillStyle = 'rgba(0, 209, 255, 0.08)';
          ctx.fillRect(ex + 1, txY + 40, elemW - 2, h - txY - 80);

          // Draw ultrasonic packet pulse moving down
          const packetY = txY + 40 + ((phase * 120 + i * 15) % (h - txY - 95));
          const radGrad = ctx.createRadialGradient(ex + elemW / 2, packetY, 1, ex + elemW / 2, packetY, 8);
          radGrad.addColorStop(0, '#00d1ff');
          radGrad.addColorStop(0.4, 'rgba(0, 209, 255, 0.6)');
          radGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(ex + elemW / 2, packetY, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw organic horizontal vessel beneath
      ctx.strokeStyle = 'rgba(150, 180, 255, 0.25)';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 130, h / 2 + 40);
      ctx.lineTo(w / 2 + 130, h / 2 + 40);
      ctx.stroke();

      // Label vessel
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.fillText('Superficial Target (Carotid Artery)', w / 2 - 95, h / 2 + 43);

      // Technical HUD overlay
      ctx.fillStyle = '#00d1ff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('FORMAT: RECTILINEAR SCAN PROFILE', 20, h - 25);
      ctx.fillStyle = '#8e9299';
      ctx.fillText('STEERING: PARALLEL UNSTEERED (0°)', 20, h - 14);

    } else if (mode === 'curved') {
      const cx = w / 2;
      const cy = -60;
      const radius = 130;
      const arcAngle = Math.PI / 4; // 45 degrees

      // Draw curved array face
      ctx.strokeStyle = '#deb887';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI / 2 - arcAngle / 2, Math.PI / 2 + arcAngle / 2);
      ctx.stroke();

      // Sector-like blunted acoustic scan lines
      ctx.fillStyle = 'rgba(222, 184, 135, 0.05)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI / 2 - arcAngle / 2, Math.PI / 2 + arcAngle / 2);
      ctx.arc(cx, cy, radius + 200, Math.PI / 2 + arcAngle / 2, Math.PI / 2 - arcAngle / 2, true);
      ctx.closePath();
      ctx.fill();

      // Animated scan line sweeps
      const sweepAngle = (Math.PI / 2 - arcAngle / 2) + sweep * arcAngle;
      ctx.strokeStyle = 'rgba(222, 184, 135, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.lineTo(cx + Math.cos(sweepAngle) * (radius + 200), cy + Math.sin(sweepAngle) * (radius + 200));
      ctx.stroke();

      // Deep fetal outline/Target
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, cy + radius + 100, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('Deep Abdomen Obstetric Target', w / 2 - 80, cy + radius + 115);

      ctx.fillStyle = '#deb887';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('FORMAT: CURVILINEAR SECTOR', 20, h - 25);
      ctx.fillStyle = '#8e9299';
      ctx.fillText('CHARACTERISTIC: OPTIMIZED DEEP SCANNING', 20, h - 14);

    } else if (mode === 'sector') {
      // Phased array triangular sector
      const apexX = w / 2;
      const apexY = 40;
      const sectorAngle = Math.PI / 3; // 60 deg cone
      
      // Draw small sector transducer probe footprint
      ctx.fillStyle = '#9b59b6';
      ctx.fillRect(apexX - 15, apexY - 20, 30, 20);
      ctx.strokeStyle = '#be90d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(apexX - 15, apexY - 20, 30, 20);

      // Cone wash
      ctx.fillStyle = 'rgba(155, 89, 182, 0.05)';
      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.arc(apexX, apexY, 210, Math.PI / 2 - sectorAngle / 2, Math.PI / 2 + sectorAngle / 2);
      ctx.closePath();
      ctx.fill();

      // Scanning sweep line
      const activeSweepAngle = (Math.PI / 2 - sectorAngle / 2) + sweep * sectorAngle;
      ctx.strokeStyle = 'rgba(190, 144, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(apexX + Math.cos(activeSweepAngle) * 210, apexY + Math.sin(activeSweepAngle) * 210);
      ctx.stroke();

      // Draw cardiac chambers outline
      ctx.strokeStyle = 'rgba(190, 144, 212, 0.15)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(w / 2, apexY + 120, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText('Intercostal Cardiac Target', w / 2 - 70, apexY + 125);

      ctx.fillStyle = '#be90d4';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('FORMAT: SECTOR CONE (PHASED)', 20, h - 25);
      ctx.fillStyle = '#8e9299';
      ctx.fillText('FOOTPRINT: EXTREMELY COAPTED FOR RIBS ACCESS', 20, h - 14);
    }
  };

  // 2. Phased Array Electronic Wavefront Steering & Focused Huygens Waves
  const renderPhasedSteering = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    // We show a 10-element array on top, firing according to the user-selected angle (steeringAngle)
    const elementsCount = 10;
    const arrayWidth = 180;
    const txX = w / 2 - arrayWidth / 2;
    const txY = 50;
    const elemSpacing = arrayWidth / elementsCount;

    // Draw crystals
    ctx.fillStyle = '#222630';
    ctx.fillRect(txX - 10, txY - 15, arrayWidth + 20, 20);
    ctx.strokeRect(txX - 10, txY - 15, arrayWidth + 20, 20);

    const radAngle = (steeringAngle * Math.PI) / 180;

    // Calculate electrical delays per element for viz
    // delay is proportional to position * sin(theta)
    for (let i = 0; i < elementsCount; i++) {
      const ex = txX + i * elemSpacing + elemSpacing / 2;
      
      // Delay offset calculation (Huygens wavefront calculation)
      const relativeOffset = (steeringAngle >= 0) ? (elementsCount - 1 - i) : i;
      const elementDelayAmount = Math.abs(Math.sin(radAngle)) * relativeOffset * 0.8;
      
      const isFiring = (phase * 1.5 - elementDelayAmount) % 3 > 0 && (phase * 1.5 - elementDelayAmount) % 3 < 0.6;
      ctx.fillStyle = isFiring ? '#00d1ff' : '#34495e';
      ctx.fillRect(ex - elemSpacing / 2.5, txY - 10, elemSpacing * 0.8, 12);

      // Draw wavefront circles emanating from each active element
      const ageOfWave = (phase * 45 - elementDelayAmount * 30) % 180;
      if (ageOfWave > 0 && ageOfWave < 160) {
        ctx.strokeStyle = `rgba(0, 209, 255, ${Math.max(0, 1 - ageOfWave / 160) * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, txY + 4, ageOfWave, 0, Math.PI, false);
        ctx.stroke();
      }
    }

    // Draw the coalesced steered wavefront
    const beamLength = 160;
    const bx = w / 2;
    const by = txY + 10;
    const bEndX = bx + Math.sin(radAngle) * beamLength;
    const bEndY = by + Math.cos(radAngle) * beamLength;

    // Draw heavy laser focal beam line
    ctx.strokeStyle = '#00d1ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d1ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bEndX, bEndY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Animated focal pulse packets traveling along steered beam
    const pulseT = (phase * 60) % beamLength;
    const px = bx + Math.sin(radAngle) * pulseT;
    const py = by + Math.cos(radAngle) * pulseT;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Huygens Envelope marker
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const lX = txX;
    const lY = txY + 15 + Math.abs(Math.sin(radAngle)) * (steeringAngle >= 0 ? arrayWidth : 0);
    const rX = txX + arrayWidth;
    const rY = txY + 15 + Math.abs(Math.sin(radAngle)) * (steeringAngle < 0 ? arrayWidth : 0);
    ctx.moveTo(lX, lY);
    ctx.lineTo(rX, rY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00d1ff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`HUYGEN'S WAVEFRONT STEERING`, 20, h - 35);
    ctx.fillStyle = '#f39c12';
    ctx.fillText(`STEER ANGLE (θ): ${steeringAngle}°`, 20, h - 23);
    ctx.fillStyle = '#8e9299';
    ctx.fillText(`STEERING DELAYS ACTIVATED: ${Math.abs(steeringAngle) > 0 ? 'YES' : 'NONE'}`, 20, h - 12);
  };

  // 3. Spatial Resolution (Axial and Lateral targets)
  const renderResolutionTargets = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    // Left Screen: Axial Target simulation (frequencies change axial LARRD)
    // Right Screen: Lateral Target simulation (focus changes beam width)

    const midX = w / 2;
    // Draw screen separator
    ctx.strokeStyle = '#2d3139';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, h - 30);
    ctx.stroke();

    // Left Panel: AXIAL RESOLUTION (LARRD)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('AXIAL RESOLUTION (LARRD)', 15, 30);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#8e9299';
    ctx.fillText('Determined by Spatial Pulse Length (SPL)', 15, 42);

    // Render sound pulse propagating down
    const pY = 55 + ((phase * 40) % (h - 100));
    
    // Draw high/low frequency wave pulses representing transducer output
    const wavesCount = frequencyMHz; 
    ctx.strokeStyle = '#00d1ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < wavesCount; i++) {
      const wx = midX / 2 + Math.sin(i * 1.5 + phase * 4) * 12;
      const wy = pY - i * 35 / frequencyMHz;
      if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // Two pins stacked vertically (separated by user-controlled spacing)
    const pinX = midX / 2;
    const pinY1 = h / 2 + 10;
    const pinY2 = pinY1 + targetSpacing * 6; // px distance scaled to targetSpacing

    // Core rule: SPL = 2 * wavelength. If targetSpacing > SPL/2, they resolve!
    // Scale SPL to targetSpacing: high frequency (10MHz) => resolved, low frequency (2MHz) => merged.
    const splScaled = 25 / (frequencyMHz * 0.45);
    const isResolvedAxially = (targetSpacing * 6) > (splScaled * 1.2);

    // Draw physical pins
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(pinX, pinY1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pinX, pinY2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e9299';
    ctx.fillText(`Target Spacing: ${targetSpacing}mm`, pinX - 55, pinY2 + 25);

    // Draw processed screen image result representation
    const screenX = 35;
    const screenY = h - 100;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(screenX, screenY, 110, 40);
    ctx.strokeStyle = '#1d222b';
    ctx.strokeRect(screenX, screenY, 110, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('SCREEN PREVIEW:', screenX + 5, screenY + 12);

    if (isResolvedAxially) {
      // Draw 2 distinct dots
      ctx.fillStyle = '#00ffcc';
      ctx.shadowBlur = 4; ctx.shadowColor = '#00ffcc';
      ctx.beginPath(); ctx.arc(screenX + 55, screenY + 22, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(screenX + 55, screenY + 30, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00ffcc';
      ctx.fillText('RESOLVED (2 DOTS)', screenX + 5, screenY + 35);
    } else {
      // Draw 1 merged blob!
      ctx.fillStyle = '#ff3366';
      ctx.shadowBlur = 5; ctx.shadowColor = '#ff3366';
      ctx.fillRect(screenX + 52, screenY + 22, 6, 12);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff3366';
      ctx.fillText('UNRESOLVED (1 BLOB)', screenX + 5, screenY + 35);
    }


    // Right Panel: LATERAL RESOLUTION (LATA)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('LATERAL RESOLUTION (LATA)', midX + 15, 30);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#8e9299';
    ctx.fillText('Determined by Ultrasound Beam Width', midX + 15, 42);

    // Draw ultrasound hourglass beam
    const bCenterX = midX + (w - midX) / 2;
    const bTopY = 55;
    const bFocalY = focalDepth; // custom focus height

    // Draw yellow beam contour lines
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bCenterX - 45, bTopY);
    ctx.bezierCurveTo(bCenterX - 20, bTopY + 30, bCenterX - 5, bFocalY - 10, bCenterX - 6, bFocalY);
    ctx.bezierCurveTo(bCenterX - 8, bFocalY + 10, bCenterX - 20, h - 110, bCenterX - 50, h - 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bCenterX + 45, bTopY);
    ctx.bezierCurveTo(bCenterX + 20, bTopY + 30, bCenterX + 5, bFocalY - 10, bCenterX + 6, bFocalY);
    ctx.bezierCurveTo(bCenterX + 8, bFocalY + 10, bCenterX + 20, h - 110, bCenterX + 50, h - 90);
    ctx.stroke();

    // Two pins side by side (separated horizontally)
    const latY = h / 2 - 10;
    const latPinX1 = bCenterX - targetSpacing * 3.5;
    const latPinX2 = bCenterX + targetSpacing * 3.5;

    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(latPinX1, latY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(latPinX2, latY, 3, 0, Math.PI * 2); ctx.fill();

    // Check if beam width at latY is narrower than target spacing
    // Beam width approximate distance from center
    const dy = Math.abs(latY - bFocalY);
    const beamWidthAtLatY = 12 + dy * 0.3; // hourglass narrowest at focal center
    const isResolvedLaterally = (targetSpacing * 7) > beamWidthAtLatY;

    // Output target lines
    ctx.fillStyle = '#8e9299';
    ctx.fillText(`Beam Width here: ~${beamWidthAtLatY.toFixed(1)}mm`, bCenterX - 50, latY + 25);

    // Draw processed screen image result representation
    const screenX2 = midX + 35;
    const screenY2 = h - 100;
    ctx.fillStyle = '#05070a';
    ctx.fillRect(screenX2, screenY2, 110, 40);
    ctx.strokeStyle = '#1d222b';
    ctx.strokeRect(screenX2, screenY2, 110, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('SCREEN PREVIEW:', screenX2 + 5, screenY2 + 12);

    if (isResolvedLaterally) {
      ctx.fillStyle = '#00ffcc';
      ctx.shadowBlur = 4; ctx.shadowColor = '#00ffcc';
      ctx.beginPath(); ctx.arc(screenX2 + 45, screenY2 + 25, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(screenX2 + 65, screenY2 + 25, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00ffcc';
      ctx.fillText('RESOLVED (2 DOTS)', screenX2 + 5, screenY2 + 35);
    } else {
      ctx.fillStyle = '#ff3366';
      ctx.shadowBlur = 5; ctx.shadowColor = '#ff3366';
      ctx.fillRect(screenX2 + 35, screenY2 + 24, 40, 3);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff3366';
      ctx.fillText('UNRESOLVED (SMUSHED)', screenX2 + 5, screenY2 + 35);
    }
  };

  // 4. Frequency, wavelength, and Attenuation trade-offs
  const renderAttenuationWaves = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    // Left-to-right acoustic propagation with custom frequency
    const startX = 60;
    const startY = h / 2 - 20;

    // Draw Transducer Firing Surface
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(5, startY - 50, 45, 100);
    ctx.strokeStyle = '#00d1ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(5, startY - 50, 45, 100);

    ctx.fillStyle = '#00d1ff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('TX ARRAY', 8, startY + 4);

    // Draw tissue layers
    const layer1X = w * 0.45;
    const layer2X = w * 0.75;

    ctx.fillStyle = 'rgba(76, 209, 55, 0.05)';
    ctx.fillRect(startX, 40, layer1X - startX, h - 80);
    ctx.fillStyle = '#4cd137';
    ctx.font = '9px monospace';
    ctx.fillText('FAT LAYER', startX + 15, h - 25);

    ctx.fillStyle = 'rgba(232, 65, 24, 0.05)';
    ctx.fillRect(layer1X, 40, layer2X - layer1X, h - 80);
    ctx.fillStyle = '#e84118';
    ctx.fillText('MUSCLE LAYER', layer1X + 15, h - 25);

    ctx.fillStyle = 'rgba(156, 136, 255, 0.05)';
    ctx.fillRect(layer2X, 40, w - layer2X - 20, h - 80);
    ctx.fillStyle = '#9c88ff';
    ctx.fillText('DEEP LIVER', layer2X + 10, h - 25);

    // Compute wavelength from frequency index (inverse)
    const wavelength = 120 / frequencyMHz; 
    
    // Attenuation rate: higher frequency = high attenuation
    const attenFactor = frequencyMHz * 0.0035;

    // Generate sinusoidal acoustic beam cycle
    ctx.strokeStyle = '#00d1ff';
    ctx.shadowBlur = 0;

    // We draw multiple horizontal offset curves representing spherical pressure lines
    const depthSpan = w - startX - 30;
    const pathsCount = 5;

    for (let r = 0; r < pathsCount; r++) {
      const rowOffset = (r - (pathsCount - 1) / 2) * 15;
      ctx.beginPath();
      
      let initialized = false;
      for (let dx = 0; dx < depthSpan; dx += 2) {
        const x = startX + dx;
        const localY = startY + rowOffset;

        // Exponential attenuation multiplier: amp decays as x increases
        const attenuation = Math.exp(-attenFactor * dx);
        
        // Sine cycle
        const waveY = Math.sin((dx / wavelength) - phase * 4) * 20 * attenuation;

        if (!initialized) {
          ctx.moveTo(x, localY + waveY);
          initialized = true;
        } else {
          ctx.lineTo(x, localY + waveY);
        }
      }
      
      // Paint amplitude color according to local intensity
      ctx.strokeStyle = r === 2 ? '#fff' : `rgba(0, 209, 255, ${0.15 + (1 - r*0.25)})`;
      ctx.lineWidth = r === 2 ? 1.5 : 1;
      ctx.stroke();
    }

    // Interactive indicators
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('DYNAMIC BEAM ATTENUATION MAP', startX, 30);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#8e9299';
    ctx.fillText(`Frequency: ${frequencyMHz} MHz   Wavelength: ${(1.54 / frequencyMHz * 10).toFixed(2)} mm`, startX, h - 25);

    if (frequencyMHz > 8) {
      ctx.fillStyle = '#ff4d4d';
      ctx.fillText('⚠️ CRITICAL BEAM LOSS: HIGH FREQUENCY CANNOT PENETRATE DEEP LIVER!', startX + 120, 30);
    } else if (frequencyMHz < 4) {
      ctx.fillStyle = '#2ed573';
      ctx.fillText('✅ OPTIMAL DEEP PENETRATION: LOW FREQUENCY REMAINS ROBUST AT DEPTH', startX + 120, 30);
    } else {
      ctx.fillStyle = '#ffbe76';
      ctx.fillText('⚖️ CLASSIC DETAIL/PENETRATION BALANCED HARMONY SEGMENT', startX + 160, 30);
    }
  };

  // 5. Clinical Artifacts Simulator
  const renderClinicalArtifacts = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    // Render specific selected artifact structure
    const mode = activeSubMode === 'default' ? artifactType : (activeSubMode as 'reverb' | 'shadow' | 'enhance');

    // Horizontal transducer top
    ctx.fillStyle = '#222731';
    ctx.fillRect(80, 20, w - 160, 24);
    ctx.strokeStyle = '#00d1ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(80, 20, w - 160, 24);

    ctx.fillStyle = '#00d1ff';
    ctx.font = 'bold 8.5px monospace';
    ctx.fillText('TRANSDUCER SCAN ELEMENT APERTURE', w / 2 - 80, 35);

    // Render scanline fan backdrop
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 44);
    ctx.lineTo(40, h - 60);
    ctx.lineTo(w - 40, h - 60);
    ctx.closePath();
    ctx.fill();

    const cx = w / 2;
    const cy = h / 2 - 15;

    if (mode === 'reverb') {
      // Reverberation: Echo bouncing between transducer and parallel specular reflector
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px font-serif';
      ctx.fillText('REVERBERATION ARTIFACT (COMET TAIL)', 30, h - 35);

      // Highly reflective line
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 30);
      ctx.lineTo(cx + 50, cy - 30);
      ctx.stroke();

      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Highly Reflective Interface (e.g. Pleural Line / Metal Needle)', cx + 65, cy - 28);

      // Draw bouncing wavefront vectors
      const bounceOffset = (phase * 110) % 190;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 44);
      ctx.lineTo(cx, cy - 30);
      ctx.stroke();

      // Reverberation artifacts: Draw equidistant fake ghost interfaces deeper in image
      for (let d = 1; d <= 6; d++) {
        const falseDepth = cy - 30 + d * 30;
        ctx.strokeStyle = `rgba(0, 209, 255, ${0.85 / d})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 35 + d * 2, falseDepth);
        ctx.lineTo(cx + 35 - d * 2, falseDepth);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 209, 255, 0.5)';
        ctx.font = '7px monospace';
        if (d === 1) {
          ctx.fillText('REAL WALL', cx - 90, falseDepth + 2);
        } else {
          ctx.fillText(`FALSE EQUIDISTANT REVERB REFLECTION #${d - 1}`, cx - 180, falseDepth + 2);
        }
      }

    } else if (mode === 'shadow') {
      // Shadowing: Highly attenuating stone block sound
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px font-serif';
      ctx.fillText('ACOUSTIC SHADOWING (BEHIND GALLSTONE)', 30, h - 35);

      // Draw gallbladder background
      ctx.fillStyle = 'rgba(0, 255, 50, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 50, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Calcified target inside gallbladder (stone)
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(cx - 15, cy - 10, 30, 18);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 15, cy - 10, 30, 18);

      // Acoustic Shadow: Dark segment behind the stone extending vertical
      const shadowGrad = ctx.createLinearGradient(cx, cy + 8, cx, h - 50);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - 15, cy + 8, 30, h - cy - 68);

      // Clean indicators
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText('GALLSTONE', cx - 25, cy - 18);
      
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('ANACHOIC CLEAN SHADOW ZONE', cx - 60, cy + 50);

    } else if (mode === 'enhance') {
      // Acoustic Enhancement: Sound passes fluid with low attenuation
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px font-serif';
      ctx.fillText('POSTERIOR ACOUSTIC ENHANCEMENT', 30, h - 35);

      // Draw fluid filled simple cyst
      ctx.fillStyle = 'rgba(0, 80, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0050ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#00d1ff';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText('FLUID CYST', cx - 26, cy - 15);

      // Posterior Enhancement: Bright column because fluid has low attenuation compared to tissue.
      const enhanceGrad = ctx.createLinearGradient(cx, cy + 25, cx, h - 50);
      enhanceGrad.addColorStop(0, 'rgba(0, 209, 255, 0.28)');
      enhanceGrad.addColorStop(1, 'rgba(0, 209, 255, 0.05)');
      ctx.fillStyle = enhanceGrad;
      ctx.fillRect(cx - 35, cy + 25, 70, h - cy - 85);

      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('HYPERECHOIC POSTERIOR ENHANCEMENT COLUMN', cx - 100, cy + 60);
    }
  };

  const renderGenericWave = (ctx: CanvasRenderingContext2D, w: number, h: number, phase: number) => {
    // Simple harmonic standard propagation visualizer
    ctx.strokeStyle = '#00d1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 20; x < w - 20; x++) {
      const y = h / 2 + Math.sin(x * 0.03 - phase * 3) * 35;
      if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#8e9299';
    ctx.font = '10px monospace';
    ctx.fillText('ACOUSTIC PRESSURE PROPAGATION SIMULATOR', 20, 40);
  };

  return (
    <div className="flex flex-col h-full w-full select-none justify-between p-4 bg-[#111317]">
      {/* Top Controller Header bar */}
      <div className="bg-[#181b24] p-3 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#00d1ff] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] text-[#00d1ff] font-mono leading-none font-bold uppercase tracking-widest">Physics Lab Simulator v2.8</span>
            <span className="text-[8px] text-[#8e9299] font-mono mt-0.5">ACOUSTIC BEAM GRAPHIC CONSOLE</span>
          </div>
        </div>

        {/* Diagnostic controls depending on selected video physics */}
        <div className="flex items-center gap-3">
          {videoId === 'transducer-selection' && (
            <div className="flex bg-[#0a0c10] p-1 rounded-lg border border-white/5 gap-1 shadow-inner">
              {['linear', 'curved', 'sector'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveSubMode(mode)}
                  className={`px-3 py-1 text-[8.5px] font-mono uppercase tracking-wider rounded-md transition-all ${activeSubMode === mode ? 'bg-[#00d1ff] text-black font-bold' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
                >
                  {mode} array
                </button>
              ))}
            </div>
          )}

          {videoId === 'artifacts-guide' && (
            <div className="flex bg-[#0a0c10] p-1 rounded-lg border border-white/5 gap-1 shadow-inner">
              {[
                { id: 'shadow', label: 'Shadowing' },
                { id: 'reverb', label: 'Reverberation' },
                { id: 'enhance', label: 'Enhancement' },
              ].map((art) => (
                <button
                  key={art.id}
                  onClick={() => setArtifactType(art.id as any)}
                  className={`px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider rounded border border-transparent transition-all ${artifactType === art.id ? 'bg-[#ffd700]/10 border-[#ffd700]/45 text-[#ffd700] font-bold' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
                >
                  {art.label}
                </button>
              ))}
            </div>
          )}

          {/* Steer slider for Phased Array */}
          {videoId === 'phased-array' && (
            <div className="flex items-center gap-2 bg-[#0c0d10] px-3 py-1 border border-white/5 rounded-lg">
              <span className="text-[8px] text-[#8e9299] font-mono uppercase tracking-widest">Steer Angle:</span>
              <input 
                type="range" 
                min="-45" 
                max="45" 
                step="5"
                value={steeringAngle} 
                onChange={(e) => setSteeringAngle(parseInt(e.target.value))}
                className="w-24 accent-[#00d1ff]" 
              />
              <span className="text-[9px] text-[#00d1ff] font-mono w-8 font-bold">{steeringAngle}°</span>
            </div>
          )}

          {/* Frequency Control for Resolution / Attenuation */}
          {(videoId === 'frequency' || videoId === 'resolution') && (
            <div className="flex items-center gap-2 bg-[#0c0d10] px-3 py-1 border border-white/5 rounded-lg">
              <span className="text-[8px] text-[#8e9299] font-mono uppercase tracking-widest">Freq (MHz):</span>
              <input 
                type="range" 
                min="2" 
                max="12" 
                step="1"
                value={frequencyMHz} 
                onChange={(e) => setFrequencyMHz(parseInt(e.target.value))}
                className="w-20 accent-[#00d1ff]" 
              />
              <span className="text-[9px] text-[#00d1ff] font-mono w-10 font-bold">{frequencyMHz} MHz</span>
            </div>
          )}

          {/* Target distance Control for Spatial Resolution */}
          {videoId === 'resolution' && (
            <div className="flex items-center gap-2 bg-[#0c0d10] px-3 py-1 border border-white/5 rounded-lg">
              <span className="text-[8px] text-[#8e9299] font-mono uppercase tracking-widest">Target Gap:</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={targetSpacing} 
                onChange={(e) => setTargetSpacing(parseInt(e.target.value))}
                className="w-16 accent-[#ffd700]" 
              />
              <span className="text-[9px] text-[#ffd700] font-mono w-10 font-bold">{targetSpacing}mm</span>
            </div>
          )}

          {/* Play/Pause control */}
          <div className="flex gap-1.5 border-l border-white/10 pl-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md hover:bg-white/5 text-[#8e9299] hover:text-white transition-all cursor-pointer"
              title={isPlaying ? 'Pause Simulator' : 'Play Simulator'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => {
                phaseRef.current = 0;
                setFrequencyMHz(6);
                setSteeringAngle(15);
                setFocalDepth(100);
                setTargetSpacing(4);
              }}
              className="p-1.5 rounded-md hover:bg-white/5 text-[#8e9299] hover:text-white transition-all cursor-pointer"
              title="Reset Parameters"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Simulator Screen Wrapper */}
      <div className="flex-1 min-h-[300px] bg-black border border-white/10 relative rounded-2xl overflow-hidden my-3 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={760}
          height={380}
          className="w-full h-full block"
        />
        
        {/* Dynamic Watermark HUD */}
        <div className="absolute top-4 right-4 text-right pointer-events-none select-none opacity-40">
          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active_Scan_Matrix</div>
          <div className="text-[10px] font-mono text-[#00d1ff] font-bold uppercase tracking-widest">SPI_ONLINE_LAB</div>
        </div>
      </div>

      {/* Explanatory Clinical Legend bottom footer */}
      <div className="bg-[#171a22] border border-white/10 p-3.5 rounded-xl">
        <div className="flex items-start gap-2.5">
          <HelpCircle size={14} className="text-[#00d1ff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono text-white tracking-widest uppercase font-bold">Registry Physics Integration Description</h4>
            <p className="text-[10.5px] text-[#8e9299] leading-relaxed select-text font-serif italic">
              {videoId === 'transducer-selection' && "Transducer criteria governs image formation format profile. Linear array utilizes sequential parallel elements unsteered for superficial detail. Curved face produces diverging blunted sector scans for abdomen. Phased array coapts tiny point-origination footprints to slide through tight ribs intercostal access points."}
              {videoId === 'phased-array' && "Phased array steering fires tiny crystal segments sequentially within nanoseconds bounds. Delay lines creates curved wavefronts which converge at focal depth (Huygen peak) and can steer left-to-right on mechanical drag."}
              {videoId === 'linear-array' && "Linear format scans sequentially in localized groups of piezoelectric channels, firing acoustic lines parallel downstream. Reconstructs pristine horizontal grids suited beautifully for anatomical carotid vascular structures."}
              {videoId === 'curved-array' && "Curved array sweeps outward from a physically arc-shaped transducer head, extending lateral resolution deeper in deep field-of-view scanning zones."}
              {videoId === 'resolution' && "Spatial resolution relies heavily on physics parameters: Axial (LARRD) depends fully on Spatial Pulse Length (SPL), requiring high frequency transmitters to distinguish stacked targets. Lateral (LATA) depends entirely on beam width, resolving close targets only inside a tightly focused zone."}
              {videoId === 'frequency' && "Ultrasound trade-offs demand frequency domain harmony. High-frequency (12MHz) wave periods are extremely short, generating spectacular near-field spatial resolution, but attenuate to zero immediately in dense deep organs. Deep liver abdominal access demands robust low frequency (2-4MHz) travel."}
              {videoId === 'artifacts-guide' && "Acoustic artifacts provide critical diagnostic clues. Reverberation mimics pleural comet-tails by repeated bouncing reflections. Shadowing marks calcified stones by blocking sound travel completely. Posterior enhancement spotlights liquid cysts due to light, zero-attenuation posterior travel."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
