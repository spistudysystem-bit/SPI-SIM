import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VeinArteryVisualizer from './VeinArteryVisualizer';
import { 
  Activity, 
  Beaker, 
  Zap, 
  ArrowRight, 
  Video, 
  Layers, 
  Sliders, 
  HelpCircle, 
  BookOpen, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ReferenceLine 
} from 'recharts';

interface HemodynamicsModuleProps {
  setViewMode?: (mode: any) => void;
}

// Advanced physiological presets
interface ClinicalPreset {
  id: string;
  name: string;
  description: string;
  radius: number;      // mm (healthy is ~5.0 mm)
  velocity: number;    // cm/s (healthy base CCA is ~40 cm/s)
  viscosity: number;   // cP (normal blood is ~3.5 cP)
  stenosis: number;    // % area/diameter reduction (0% represents uniform vessel)
}

const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'healthy_cca',
    name: 'Normal Carotid Artery (CCA)',
    description: 'Laminar, low-resistance, healthy flow feeding the cerebral distal bed.',
    radius: 5.5,
    velocity: 35,
    viscosity: 3.5,
    stenosis: 0
  },
  {
    id: 'mild_stenosis',
    name: 'Borderline Carotid Stenosis',
    description: 'Early plaque build-up at bifurcation. Elevated velocities, borderline turbulence.',
    radius: 5.0,
    velocity: 42,
    viscosity: 3.6,
    stenosis: 40
  },
  {
    id: 'severe_stenosis',
    name: 'Severe ICA Stenosis (Pathological)',
    description: 'Critical narrowing. Localized jet speeds exceed 250 cm/s with post-stenotic bruits.',
    radius: 4.5,
    velocity: 55,
    viscosity: 3.5,
    stenosis: 80
  },
  {
    id: 'anemic_hyper',
    name: 'Anemic Hyperdynamic State',
    description: 'Thin blood (low viscosity) triggers compensatory high-velocity cardiac output.',
    radius: 5.0,
    velocity: 75,
    viscosity: 1.8,
    stenosis: 0
  },
  {
    id: 'polycythemia_sludge',
    name: 'Hyperviscosity (Polycythemia)',
    description: 'Abnormally high red cell count. Sluggish sludgy flow requiring high pressure grids.',
    radius: 5.5,
    velocity: 22,
    viscosity: 8.5,
    stenosis: 25
  }
];

export default function HemodynamicsModule({ setViewMode }: HemodynamicsModuleProps) {
  // --- Core States ---
  const [radius, setRadius] = useState<number>(5.0);           // Normal vessel baseline radius (2.0 to 8.0 mm)
  const [velocity, setVelocity] = useState<number>(40);        // Baseline velocity (10 to 120 cm/s)
  const [viscosity, setViscosity] = useState<number>(3.5);     // Viscosity of blood (1.0 to 10.0 cP)
  const [stenosis, setStenosis] = useState<number>(0);         // Stenosis severity diameter reduction (0% to 90%)
  const [dopplerAngle, setDopplerAngle] = useState<number>(60); // Inbound ultrasound angle (0 to 80 degrees)
  const [selectedSegment, setSelectedSegment] = useState<'pre' | 'stenosis' | 'post'>('stenosis');
  const [activeFormulaTab, setActiveFormulaTab] = useState<'bernoulli' | 'poiseuille' | 'reynolds'>('bernoulli');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply a physiological preset
  const handleApplyPreset = (preset: ClinicalPreset) => {
    setRadius(preset.radius);
    setVelocity(preset.velocity);
    setViscosity(preset.viscosity);
    setStenosis(preset.stenosis);
  };

  // --- Dynamic Physical Calculations & Formulations ---
  const computations = useMemo(() => {
    const r_0 = radius; // mm (at normal segment)
    const v_0 = velocity; // cm/s
    const eta = viscosity; // cP
    const s = stenosis; // % diameter reduction

    // 1. Core measurements for PRE-STENOTIC (Normal) Segment
    const r_pre_cm = r_0 / 10;
    const a_pre_cm2 = Math.PI * r_pre_cm * r_pre_cm;
    const q_ml_s = velocity * a_pre_cm2; // Flow Q = v * A
    const flow_rate_ml_min = q_ml_s * 60; // mL/minute

    // Pre-stenotic Reynolds number
    // Re = (v * D * rho) / eta  where rho = 1.05 and viscosity cP converts
    const diameter_pre_mm = r_0 * 2;
    const re_pre = (v_0 * diameter_pre_mm * 1.05) / (eta / 10);

    // 2. STENOTIC Segment Mechanics
    // Ratio of diameter reduction
    const d_reduction = s / 100;
    const r_sten = r_0 * (1 - d_reduction); // stenotic radius
    const a_sten_cm2 = Math.PI * Math.pow(r_sten / 10, 2);

    // Velocity increases to maintain flow volume continuity (A1v1 = A2v2)
    // Capped at 500 cm/s physiological limit
    const areaRatioLimit = Math.max(0.15, Math.pow(1 - d_reduction, 2));
    const raw_v_sten = v_0 / areaRatioLimit;
    const v_sten = Math.min(500, raw_v_sten);

    // Stenotic Reynolds number (diameter is squeezed but velocity is multiplied!)
    const diameter_sten_mm = r_sten * 2;
    const re_sten = (v_sten * diameter_sten_mm * 1.05) / (eta / 10);

    // Bernoulli pressure drop (using classic clinical Simplified Bernoulli equation)
    // dP = 4 * (v_sten^2 - v_pre_segment^2) where velocities represent m/s
    const v_sten_ms = v_sten / 100;
    const v_pre_ms = v_0 / 100;
    const dp_bern_mmHg = 4 * (Math.pow(v_sten_ms, 2) - Math.pow(v_pre_ms, 2));

    // Normal baseline pressure of 100 mmHg
    const p_pre = 100.0;
    const p_sten = Math.round(Math.max(5, p_pre - dp_bern_mmHg));

    // 3. POST-STENOTIC Segment Mechanics
    const r_post = r_0;
    const v_post = v_0; // Returns on average to original, but is highly disturbed
    
    // Post-stenotic pressure recovery is poor because energy was wasted as heat, bruits, vibrations
    const permanent_loss_multiplier = 0.72; // ~72% pressure drop is unrecovered
    const p_post = Math.round(Math.max(10, p_pre - permanent_loss_multiplier * dp_bern_mmHg));

    // Post-stenotic Reynolds number is modeled to show massive disturbance when stenotic jet suddenly expands
    const re_post = re_pre * (1 + Math.pow(s / 100, 2) * 12);

    // 4. Clinical Vascular Resistance derived from Poiseuille's law:
    // Resistance R = (8 * eta * L) / (pi * r^4). Let's model length L as a fixed 50mm corridor
    const calcResistancePRU = (8 * (eta / 10) * 5) / (Math.PI * Math.pow(r_pre_cm, 4));

    // 5. Doppler physics link: Spectral simulated Shift Frequency (kHz)
    // df = (2 * F0 * V * cos(angle)) / C 
    const f0_hz = 5.0e6; // 5.0 MHz probe
    const sound_speed_c = 1540.0; // m/s
    const radAngle = (dopplerAngle * Math.PI) / 180;
    
    const getLocalV = () => {
      if (selectedSegment === 'pre') return v_0;
      if (selectedSegment === 'stenosis') return v_sten;
      return v_post;
    };
    
    const local_v_ms = getLocalV() / 100;
    const doppler_shift_khz = (2 * f0_hz * local_v_ms * Math.cos(radAngle)) / sound_speed_c / 1000;

    return {
      pre: { radius: r_0, velocity: v_0, pressure: p_pre, reynolds: re_pre },
      sten: { radius: r_sten, velocity: v_sten, pressure: p_sten, reynolds: re_sten, dp: dp_bern_mmHg },
      post: { radius: r_post, velocity: v_post, pressure: p_post, reynolds: re_post },
      flow_rate_ml_min,
      resistance_pru: calcResistancePRU,
      doppler_shift_khz
    };
  }, [radius, velocity, viscosity, stenosis, dopplerAngle, selectedSegment]);

  // --- HTML5 Canvas Interactive Renderer with high performance blood cells tracking ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const numParticles = 110;
    
    // Instantiate random red blood cells particles inside the bounds
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * 800,
      yOffset: (Math.random() - 0.5) * 1.8, // normalized elevation distance from centerline (-1 to 1)
      speedCoef: 0.75 + Math.random() * 0.5, // particle variations
      size: 2.2 + Math.random() * 1.8,
      seed: Math.random()
    }));

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Convert normal radius slider to pixel size (e.g. 5mm baseline -> ~24px width in vertical half-height)
      const radiusPx = radius * 4.4;

      // Local hourglass radius lookup based on X coordinate
      const getRadiusAtX = (x: number) => {
        if (x < 240) return radiusPx;
        if (x > 460) return radiusPx;
        const u = (x - 240) / 220;
        // Symmetric hourglass geometry using sine peak interpolation
        const stenosisScale = 1 - (stenosis / 100) * Math.sin(Math.PI * u);
        return radiusPx * stenosisScale;
      };

      // 1. Draw static grid background
      ctx.strokeStyle = '#1b1d22';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let j = 0; j < h; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(w, j);
        ctx.stroke();
      }

      // 2. Draw surrounding anatomical muscle tissue layers
      ctx.fillStyle = '#0f1013';
      
      // Top tissue slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(800, 0);
      ctx.lineTo(800, 100);
      for (let x = 800; x >= 0; x -= 8) {
        ctx.lineTo(x, 100 - getRadiusAtX(x));
      }
      ctx.closePath();
      ctx.fill();

      // Bottom tissue slice
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(800, 200);
      ctx.lineTo(800, 100);
      for (let x = 800; x >= 0; x -= 8) {
        ctx.lineTo(x, 100 + getRadiusAtX(x));
      }
      ctx.closePath();
      ctx.fill();

      // 3. Draw vessel borders
      ctx.lineWidth = 2.0;

      // Draw Upper Boundary
      ctx.beginPath();
      for (let x = 0; x <= 800; x += 10) {
        const halfW = getRadiusAtX(x);
        if (x === 0) ctx.moveTo(0, 100 - halfW);
        else ctx.lineTo(x, 100 - halfW);
      }
      ctx.strokeStyle = '#2d333e';
      ctx.stroke();

      // Draw Lower Boundary
      ctx.beginPath();
      for (let x = 0; x <= 800; x += 10) {
        const halfW = getRadiusAtX(x);
        if (x === 0) ctx.moveTo(0, 100 + halfW);
        else ctx.lineTo(x, 100 + halfW);
      }
      ctx.strokeStyle = '#2d333e';
      ctx.stroke();

      // 4. Overlap high friction/wall stress red heat glow around stenosis corridor (Segment B)
      if (stenosis > 0) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.12 + (stenosis / 100) * 0.7})`;
        ctx.lineWidth = 3.5;
        
        ctx.beginPath();
        for (let x = 240; x <= 460; x += 8) {
          const halfW = getRadiusAtX(x);
          if (x === 240) ctx.moveTo(x, 100 - halfW);
          else ctx.lineTo(x, 100 - halfW);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let x = 240; x <= 460; x += 8) {
          const halfW = getRadiusAtX(x);
          if (x === 240) ctx.moveTo(x, 100 + halfW);
          else ctx.lineTo(x, 100 + halfW);
        }
        ctx.stroke();
      }

      // 5. Highlight selection overlays behind segments
      if (selectedSegment === 'pre') {
        ctx.fillStyle = 'rgba(0, 209, 255, 0.04)';
        ctx.fillRect(0, 0, 240, 200);
      } else if (selectedSegment === 'stenosis') {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.04)';
        ctx.fillRect(240, 0, 220, 200);
      } else if (selectedSegment === 'post') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.fillRect(460, 0, 340, 200);
      }

      // 6. Draw vertical dividers as dashed clinical scanning boundaries
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.75;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(240, 0);
      ctx.lineTo(240, 200);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(460, 0);
      ctx.lineTo(460, 200);
      ctx.stroke();

      ctx.setLineDash([]);

      // Section labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.fillText('SEG_A // PRE-STENOSIS', 15, 14);
      ctx.fillText('SEG_B // STENOTIC METRIC', 255, 14);
      ctx.fillText('SEG_C // POST-DISTURBANCE', 475, 14);

      // 7. Render ultrasound transducer firing down
      let beamX = 120;
      let beamColor = 'rgba(0, 209, 255, 0.4)';
      let gateAccentColor = '#00d1ff';

      if (selectedSegment === 'pre') {
        beamX = 120;
        beamColor = 'rgba(0, 209, 255, 0.4)';
        gateAccentColor = '#00d1ff';
      } else if (selectedSegment === 'stenosis') {
        beamX = 350; // narrowest point representation
        beamColor = 'rgba(255, 215, 0, 0.4)';
        gateAccentColor = '#ffd700';
      } else if (selectedSegment === 'post') {
        beamX = 630;
        beamColor = 'rgba(16, 185, 129, 0.4)';
        gateAccentColor = '#10b981';
      }

      // Draw probe casing
      ctx.fillStyle = '#1c1e24';
      ctx.strokeStyle = '#2d333e';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.roundRect(beamX - 35, 6, 70, 13, 3);
      ctx.fill();
      ctx.stroke();
      
      // Active piezoelectric face plate
      ctx.fillStyle = gateAccentColor;
      ctx.fillRect(beamX - 25, 15, 50, 1.5);

      // Draw ultrasound linear ray beam
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(beamX, 16);
      ctx.lineTo(beamX, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Ultrasound Doppler Gate (parallel PW bars) at the vessel centerline
      const gateCenterY = 100;
      const localR_px = getRadiusAtX(beamX);
      const gateWidth_px = Math.max(10, localR_px * 0.42); // proportional gate height width

      ctx.strokeStyle = gateAccentColor;
      ctx.lineWidth = 2.0;

      // Top bar
      ctx.beginPath();
      ctx.moveTo(beamX - 7, gateCenterY - gateWidth_px / 2);
      ctx.lineTo(beamX + 7, gateCenterY - gateWidth_px / 2);
      ctx.stroke();

      // Bottom bar
      ctx.beginPath();
      ctx.moveTo(beamX - 7, gateCenterY + gateWidth_px / 2);
      ctx.lineTo(beamX + 7, gateCenterY + gateWidth_px / 2);
      ctx.stroke();

      // 8. Stream cells/particles
      particles.forEach(p => {
        const halfW = getRadiusAtX(p.x);

        // Volumetric Continuity velocity scale
        const rRatio = radiusPx / halfW;
        const speedExpansion = rRatio * rRatio; // Area ratio inverse (3D cylindrical flow)

        // Parabolic friction modeling (centerline flow is maximum, wall boundary is zero-slip)
        const boundaryShear = 1.0 - Math.pow(p.yOffset, 2);
        
        // Calculate incremental velocity
        const deltaX = (velocity / 11) * speedExpansion * p.speedCoef * Math.max(0.12, boundaryShear);
        p.x += deltaX;

        // Reset if goes off right edge
        if (p.x > 800) {
          p.x = 0;
          p.yOffset = (Math.random() - 0.5) * 1.8;
          p.size = 2.2 + Math.random() * 1.8;
        }

        // Draw coordinate calculation
        let drawY = 100 + p.yOffset * halfW;

        // Post-stenotic turbulence (randomized eddy currents/orbits)
        if (p.x > 380 && stenosis > 15) {
          const distFromThroat = p.x - 380;
          // Splat eddy strength increases immediately after the stenosis waist and decays downstream
          const eddyScale = (stenosis / 100) * Math.sin(Math.min(Math.PI, (distFromThroat / 420) * Math.PI));
          
          const cycleRate = (Date.now() * 0.0075 * (velocity / 20)) + p.seed * 30;
          
          // Orbital offsets
          drawY += Math.sin(cycleRate) * eddyScale * 14 * (1 - Math.abs(p.yOffset));
          p.x += Math.cos(cycleRate) * eddyScale * 3;
        }

        // Color coding cells based on localized phase / speed
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.size, 0, 2 * Math.PI);

        if (p.x >= 240 && p.x < 460) {
          // Friction heat/high shear color representation (Gold/Yellow gradient glow)
          const heatBlend = Math.floor((stenosis / 100) * 160);
          ctx.fillStyle = `rgba(255, ${215 - heatBlend}, 0, 0.75)`;
        } else if (p.x >= 460) {
          // Post-stenolic cells (Turbulent eddies look messy or dark red)
          ctx.fillStyle = stenosis > 40 ? 'rgba(239, 68, 68, 0.65)' : 'rgba(200, 30, 30, 0.55)';
        } else {
          // Normal fresh laminar cells (Cool glowing cyan)
          ctx.fillStyle = 'rgba(0, 209, 255, 0.65)';
        }
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [radius, velocity, stenosis, selectedSegment]);

  // Handle clicking on different spots of the vessel scan
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickXInternal = ((e.clientX - rect.left) / rect.width) * 800; // translate click onto 800px standard canvas matrix
    
    if (clickXInternal < 240) {
      setSelectedSegment('pre');
    } else if (clickXInternal >= 240 && clickXInternal < 460) {
      setSelectedSegment('stenosis');
    } else {
      setSelectedSegment('post');
    }
  };

  // --- Chart Data computations for Recharts visual plots ---
  const rechartsData = useMemo(() => {
    const data = [];
    const R_0 = radius;         // normal radius mm
    const v_0 = velocity;       // base velocity cm/s
    const pre_P = 100.0;        // initial normal pressure mmHg

    for (let mm = 0; mm <= 50; mm += 1) {
      let localRadius = R_0;
      let localVelocity = v_0;
      let localPressure = pre_P;

      if (mm >= 15 && mm <= 35) {
        // Hourglass smooth taper representing stenosis bottleneck
        const u = (mm - 15) / 20;
        const scale = 1 - (stenosis / 100) * Math.sin(Math.PI * u);
        
        localRadius = R_0 * scale;
        // Limit velocity capping at 500 cm/s
        const rawV = v_0 / Math.max(0.15, Math.pow(scale, 2));
        localVelocity = Math.min(500, rawV);

        // Bernoulli Pressure Drop calculations
        const vSten_ms = localVelocity / 100;
        const vPre_ms = v_0 / 100;
        const pressureDrop = 4 * (Math.pow(vSten_ms, 2) - Math.pow(vPre_ms, 2));
        localPressure = Math.max(5, pre_P - pressureDrop);
      } else if (mm > 35) {
        // Section C (After stenosis wall expansion): Pressure partially returns but suffers 72% turbulency loss
        localRadius = R_0;
        localVelocity = v_0;
        
        // Permanent viscous friction pressure losses
        const maxStenosisScale = 1 - (stenosis / 100);
        const stencap = v_0 / Math.max(0.15, Math.pow(maxStenosisScale, 2));
        const vMaxSten = Math.min(500, stencap);
        const maxPressureDrop = 4 * (Math.pow(vMaxSten / 100, 2) - Math.pow(v_0 / 100, 2));
        
        localPressure = Math.max(10, pre_P - 0.72 * maxPressureDrop);
      }

      data.push({
        mm,
        Radius: parseFloat(localRadius.toFixed(2)),
        Velocity: Math.round(localVelocity),
        Pressure: Math.round(localPressure)
      });
    }
    return data;
  }, [radius, velocity, stenosis]);

  // Current variables based on active segment selection
  const activeSegmentData = useMemo(() => {
    if (selectedSegment === 'pre') {
      return {
        title: 'Pre-Stenotic Compartment (Normal)',
        radius: computations.pre.radius,
        velocity: computations.pre.velocity,
        pressure: computations.pre.pressure,
        reynolds: computations.pre.reynolds,
        color: 'text-[#00d1ff]',
        badgeColor: 'bg-[#00d1ff]/10 text-[#00d1ff] border-[#00d1ff]/20',
        note: 'Flow corresponds cleanly to baseline arterial profile. Low sheer stress and parallel laminar layers.'
      };
    } else if (selectedSegment === 'stenosis') {
      return {
        title: 'Stenosis Throat Compartment (Jet)',
        radius: computations.sten.radius,
        velocity: computations.sten.velocity,
        pressure: computations.sten.pressure,
        reynolds: computations.sten.reynolds,
        color: 'text-[#ffd700]',
        badgeColor: 'bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/20',
        note: `Extreme velocity acceleration due to area restriction. Potential energy converted into kinetic jet speed, dropping static pressure by ${computations.sten.dp.toFixed(1)} mmHg.`
      };
    } else {
      return {
        title: 'Post-Stenotic Expansion (Disturbed)',
        radius: computations.post.radius,
        velocity: computations.post.velocity,
        pressure: computations.post.pressure,
        reynolds: computations.post.reynolds,
        color: 'text-[#10b981]',
        badgeColor: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
        note: `Vessel returns to original diameter, slowing the bulk velocity. High kinetic energy splits into chaotic eddies, causing permanent pressure energy dissipation.`
      };
    }
  }, [selectedSegment, computations]);

  // Simple flow state description
  const flowRegimeSummary = (re: number) => {
    if (re < 1200) return { label: 'Laminar (Stable Stream)', style: 'text-[#00d1ff]', desc: 'Parallel layers glide smoothly with zero friction overlaps.' };
    if (re < 2000) return { label: 'Transitional Flow State', style: 'text-amber-400', desc: 'Flow layers begin sliding or flickering near the core.' };
    return { label: 'Highly Turbulent (Eddies)', style: 'text-red-500 font-bold', desc: 'Chaotic vortex clusters absorb pumping power. Vascular bruits.' };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-6 sm:gap-8 hud-dots overflow-y-auto"
    >
      {/* 1. Header Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#2d3139] pb-6 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2">Acoustic Fluid Dynamics // Lab v2</div>
          <h1 className="text-3xl sm:text-4xl font-serif italic text-white tracking-tight">
            Hemodynamics <span className="text-[#8e9299]"> &amp; Flow Simulator</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setViewMode?.('library')}
            className="flex items-center gap-2 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 rounded-full transition-all group shadow-md"
          >
            <Video size={13} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Watch Hemodynamics Video</span>
          </button>
          
          <div className="px-4 py-2.5 bg-[#14151a] border border-[#2d3139] rounded-xl flex items-center gap-4">
            <div>
              <div className="text-[8px] text-[#8e9299] uppercase font-bold tracking-widest leading-none mb-1">Volumetric flow</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {computations.flow_rate_ml_min} <span className="text-[10px] text-white/50">mL/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Clinical Presets Horizontal Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {CLINICAL_PRESETS.map((p) => {
          const isActive = radius === p.radius && velocity === p.velocity && stenosis === p.stenosis;
          return (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`text-left p-3 rounded-xl border transition-all text-[9.5px] cursor-pointer flex flex-col gap-1 ${
                isActive 
                  ? 'bg-[#00d1ff]/10 border-[#00d1ff] shadow-[0_0_12px_rgba(0,209,255,0.05)] text-white' 
                  : 'bg-[#14151a] border-[#2d3139] hover:border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>{p.name}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff]" />}
              </div>
              <p className="text-[8px] text-white/40 leading-tight line-clamp-2">{p.description}</p>
            </button>
          );
        })}
      </div>

      {/* 3. Main Split-Screen Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDEBAR BLOCK: Fluid Controller Deck (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#14151a] border border-[#2d3139] rounded-2xl p-5 shadow-lg flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#2d3139] pb-3 mb-2">
              <Sliders size={14} className="text-[#00d1ff]" />
              <span className="text-[10px] uppercase tracking-wider text-white font-bold font-mono">Arterial Variables Grid</span>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9.5px] font-bold font-mono">
                <span className="text-white/50 uppercase">Vessel Baseline Radius (R₀)</span>
                <span className="text-[#00d1ff]" id="slider-r-val">{radius.toFixed(1)} mm</span>
              </div>
              <input 
                type="range" 
                min="2.0" 
                max="8.0" 
                step="0.5" 
                value={radius} 
                onChange={e => setRadius(parseFloat(e.target.value))} 
                className="w-full accent-[#00d1ff] h-[2px] cursor-pointer bg-[#22242a]" 
                id="slider-r"
              />
              <p className="text-[7.5px] text-white/30 italic font-sans leading-none">Healthy CCA average is approximately 5.0 - 6.0 mm.</p>
            </div>

            {/* Stenosis Percentage Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9.5px] font-bold font-mono">
                <span className="text-white/50 uppercase">Stenosis Severity (Atheroma)</span>
                <span className="text-amber-400" id="slider-s-val">{stenosis}% diameter narrowing</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="90" 
                step="5" 
                value={stenosis} 
                onChange={e => setStenosis(parseInt(e.target.value))} 
                className="w-full accent-amber-500 h-[2px] cursor-pointer bg-[#22242a]" 
                id="slider-s"
              />
              <div className="flex justify-between text-[7px] text-white/40 font-mono">
                <span>0% (CLEAN VESSEL)</span>
                <span>50% (MODERATE)</span>
                <span>&gt;70% (CRITICAL JET)</span>
              </div>
            </div>

            {/* Velocity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9.5px] font-bold font-mono">
                <span className="text-white/50 uppercase">Baseline Flow Velocity (v₀)</span>
                <span className="text-emerald-400" id="slider-v-val">{velocity} cm/s</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="120" 
                step="5" 
                value={velocity} 
                onChange={e => setVelocity(parseInt(e.target.value))} 
                className="w-full accent-emerald-400 h-[2px] cursor-pointer bg-[#22242a]" 
                id="slider-v"
              />
              <p className="text-[7.5px] text-white/30 italic font-sans leading-none">Standard carotid blood baseline velocity spans 30 - 50 cm/s.</p>
            </div>

            {/* Blood Viscosity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9.5px] font-bold font-mono">
                <span className="text-white/50 uppercase">Blood Dynamic Viscosity (η)</span>
                <span className="text-white" id="slider-visc-val">{viscosity.toFixed(1)} cP</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="10.0" 
                step="0.5" 
                value={viscosity} 
                onChange={e => setViscosity(parseFloat(e.target.value))} 
                className="w-full accent-white h-[2px] cursor-pointer bg-[#22242a]" 
                id="slider-visc"
              />
              
              {/* Specialized viscosity quick selectors */}
              <div className="grid grid-cols-4 gap-1 pt-1.5">
                {[
                  { name: 'Anemia', val: 1.8 },
                  { name: 'Normal', val: 3.5 },
                  { name: 'Dehydr.', val: 5.5 },
                  { name: 'Sludge', val: 8.5 }
                ].map((viscItem) => (
                  <button
                    key={viscItem.name}
                    onClick={() => setViscosity(viscItem.val)}
                    className={`text-[7px] uppercase font-mono py-1 rounded transition-all ${
                      Math.abs(viscosity - viscItem.val) < 0.25
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#1c1d22] border border-white/5 text-white/50 hover:text-white'
                    }`}
                  >
                    {viscItem.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Doppler Angle configuration link */}
            <div className="border-t border-[#2d3139] pt-4 space-y-2">
              <div className="flex justify-between text-[9.5px] font-bold font-mono">
                <span className="text-white/50 uppercase">Doppler Transducer Angle (θ)</span>
                <span className="text-[#00d1ff]">{dopplerAngle}°</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="80" 
                step="5" 
                value={dopplerAngle} 
                onChange={e => setDopplerAngle(parseInt(e.target.value))} 
                className="w-full accent-[#00d1ff] h-[2px] cursor-pointer bg-[#22242a]" 
              />
              <p className="text-[7.5px] text-white/30 italic font-sans leading-tight">
                Vascular standard is exactly 60°. Above 60° introduces unacceptable cosine scaling error margins.
              </p>
            </div>
          </div>

          {/* Quick Poiseuille Fact Box */}
          <div className="p-4 bg-[#14151a] border border-[#2d3139] rounded-2xl flex flex-col gap-2 font-mono text-[9px] text-[#8e9299]">
            <div className="text-[#ffd700] uppercase font-bold tracking-wider text-[10px] border-b border-white/5 pb-1 flex items-center gap-1.5">
              <BookOpen size={12} />
              <span>Poiseuille resistance index</span>
            </div>
            <div className="space-y-1 text-white/70">
              <div className="flex justify-between">
                <span>Calc. Vascular Resistance:</span>
                <span className="text-emerald-400 font-bold">{computations.resistance_pru.toFixed(3)} PRU</span>
              </div>
              <p className="text-[7.5px] text-white/40 leading-tight pt-1">
                Notice: Reducing radius (r) causes Resistance to spike to the 4th power (r⁴). An 80% stenosis raises resistance locally by over 625 times!
              </p>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE SIMULATION WORKDECK (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* A. Vessel Simulation Canvas Console */}
          <div className="bg-black border border-[#2d3139] rounded-2xl shadow-xl overflow-hidden relative flex flex-col">
            {/* Header row containing interactive commands */}
            <div className="flex justify-between items-center bg-[#14151a] border-b border-[#2d3139] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d1ff] animate-pulse" />
                <span className="text-[9.5px] font-mono tracking-widest text-white/80 uppercase font-bold">
                  Live Ultrasonic Hemodynamics Scanning Core
                </span>
              </div>
              <span className="text-[7px] text-[#8e9299] font-mono">
                CLICK SEGMENTS TO SLIDE PROBE OVER COLOURED CORRIDOR
              </span>
            </div>

            {/* HTML5 Canvas Rendering Stage */}
            <div className="p-4 bg-[#0a0a0f] flex justify-center items-center relative group">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                onClick={handleCanvasClick}
                className="w-full h-[200px] border border-white/5 rounded-xl bg-[#030304] cursor-crosshair shadow-inner"
              />
              
              {/* Touch Helper indicators */}
              <div className="absolute bottom-6 inset-x-12 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <button className="px-1.5 py-0.5 bg-black/80 rounded border border-[#00d1ff]/40 text-[#00d1ff] text-[7.5px] font-mono">Inspect Segment A</button>
                <button className="px-1.5 py-0.5 bg-black/80 rounded border border-[#ffd700]/40 text-[#ffd700] text-[7.5px] font-mono">Inspect Segment B</button>
                <button className="px-1.5 py-0.5 bg-black/80 rounded border border-[#10b981]/40 text-[#10b981] text-[7.5px] font-mono">Inspect Segment C</button>
              </div>
            </div>

            {/* B. Segment Inspect Specific Stats Deck */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-t border-[#2d3139] divide-y md:divide-y-0 md:divide-x divide-[#2d3139] bg-[#0c0d10]">
              
              {/* Segment Select indicator panel */}
              <div className="md:col-span-4 p-4 flex flex-col gap-2 justify-center">
                <div className="text-[7.5px] text-[#8e9299] font-mono uppercase tracking-widest leading-none">scanning caliper probe</div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-mono font-bold uppercase ${activeSegmentData.color}`}>
                    {activeSegmentData.title}
                  </span>
                </div>
                <p className="text-[9px] text-[#8e9299] leading-tight font-sans">
                  {activeSegmentData.note}
                </p>
              </div>

              {/* Physical details grid columns */}
              <div className="md:col-span-8 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Metric 1: Radius */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#8e9299] text-[7.5px] font-mono uppercase">Local Radius</span>
                  <p className="text-[14px] font-mono font-black text-white">
                    {activeSegmentData.radius.toFixed(2)} <span className="text-[9px] font-normal text-white/50">mm</span>
                  </p>
                  <span className="text-[7px] text-white/40 font-mono">
                    ({((activeSegmentData.radius / radius) * 100).toFixed(0)}% width)
                  </span>
                </div>

                {/* Metric 2: Local flow velocity */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#8e9299] text-[7.5px] font-mono uppercase">Local Velocity</span>
                  <p className="text-[14px] font-mono font-black text-white">
                    {activeSegmentData.velocity.toFixed(1)} <span className="text-[9px] font-normal text-white/50">cm/s</span>
                  </p>
                  <span className="text-[7px] text-white/40 font-mono">
                    ({(activeSegmentData.velocity / 100).toFixed(2)} m/s)
                  </span>
                </div>

                {/* Metric 3: Hydrostatic pressure relative */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#8e9299] text-[7.5px] font-mono uppercase">Hydro Pressure</span>
                  <p className="text-[14px] font-mono font-black text-white">
                    {activeSegmentData.pressure} <span className="text-[9px] font-normal text-white/50">mmHg</span>
                  </p>
                  <span className={`text-[7px] font-mono ${selectedSegment === 'pre' ? 'text-white/40' : 'text-red-400'}`}>
                    {selectedSegment === 'pre' ? 'Baseline Reference' : `-${(100 - activeSegmentData.pressure)} mmHg loss`}
                  </span>
                </div>

                {/* Metric 4: Reynolds number and state */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#8e9299] text-[7.5px] font-mono uppercase">Reynolds (R#)</span>
                  <p className="text-[14px] font-mono font-black text-white">
                    {activeSegmentData.reynolds.toFixed(0)}
                  </p>
                  <span className={`text-[7px] font-mono font-bold leading-none capitalize ${flowRegimeSummary(activeSegmentData.reynolds).style}`}>
                    {flowRegimeSummary(activeSegmentData.reynolds).label}
                  </span>
                </div>

              </div>
            </div>

            {/* Additional Doppler spectral shift matching info */}
            <div className="bg-[#14151a] p-3 border-t border-[#2d3139] flex flex-col sm:flex-row justify-between items-start sm:items-center text-[8.5px] font-mono text-[#8e9299] gap-2">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-[#00d1ff]" />
                <span>Simulated Ultrasonic Doppler shift frequency (Δf):</span>
                <span className="text-white font-bold">
                  {computations.doppler_shift_khz > 20.0 
                    ? `${(computations.doppler_shift_khz / 1000).toFixed(2)} MHz` 
                    : `${computations.doppler_shift_khz.toFixed(3)} kHz`}
                </span>
              </div>
              <span className="text-[8px] text-white/30 italic">
                Derived at {dopplerAngle}° in the active scan segment using 5.0 MHz transmit waves.
              </span>
            </div>
          </div>

          {/* C. Interactive Charting Panel (Dual Charting using Recharts) */}
          <div className="bg-[#14151a] border border-[#2d3139] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-emerald-400" />
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-white">
                  Continuous Spatial Hemodynamics Profile Plot
                </span>
              </div>
              <span className="text-[8px] text-[#8e9299] text-right">0 mm to 50 mm Spatial Gradient</span>
            </div>

            <div className="h-[220px] w-full" id="hemodynamic-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rechartsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="mm" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={8.5} 
                    fontFamily="monospace"
                    tickFormatter={(v) => `${v}mm`}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#00d1ff" 
                    fontSize={8.5} 
                    fontFamily="monospace"
                    domain={[0, 400]}
                    tickCount={5}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#ff9800" 
                    fontSize={8.5} 
                    fontFamily="monospace"
                    domain={[0, 120]}
                    tickCount={5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c0d10', 
                      borderColor: '#2d3139', 
                      borderRadius: '8px',
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ color: '#8e9299' }}
                    itemStyle={{ paddingBlock: '1.5px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={28} 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }} 
                  />
                  
                  {/* Critical limits indicators */}
                  <ReferenceLine x={15} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" yAxisId="left" />
                  <ReferenceLine x={35} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" yAxisId="left" />

                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="Velocity" 
                    name="Velocity (cm/s)" 
                    stroke="#00d1ff" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="Pressure" 
                    name="Pressure (mmHg)" 
                    stroke="#ff9800" 
                    strokeWidth={2.5} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-[#0c0d10] p-3 rounded-xl border border-[#2d3139]/50 grid grid-cols-2 gap-4 text-[8px] font-mono text-[#8e9299]">
              <div className="flex flex-col gap-1">
                <span className="text-white/60 font-bold">📉 THE PRESSURE SHIFT (BERNOULLI):</span>
                <span>As blood cells accelerate through the narrow stenosis waist (15-35mm), their potential energy decreases causing a severe localized pressure drop.</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-white/5 pl-4">
                <span className="text-white/60 font-bold">🌪️ STENOTIC ENERGY DISSIPATION:</span>
                <span>In the downstream section (after 35mm), friction and turbulent vortices waste kinetic forces, resulting in poor downstream pressure recovery.</span>
              </div>
            </div>
          </div>

          {/* D. Comprehensive Educational Physics Workings Tabs */}
          <div className="bg-[#14151a] border border-[#2d3139] rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center px-4 py-3 bg-[#0c0d10] border-b border-[#2d3139] justify-between">
              <div className="flex items-center gap-2">
                <Beaker size={13} className="text-[#ffd700]" />
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-white">Vascular Fluid Dynamics Mathematics Solver</span>
              </div>
              <span className="text-[8px] bg-[#ffd700]/10 text-[#ffd700] px-2 py-0.5 rounded font-mono uppercase">Live values solving</span>
            </div>

            {/* Quick Math tabs */}
            <div className="flex bg-[#101115] border-b border-[#2d3139] text-[8.5px] font-mono uppercase text-white/50">
              <button
                onClick={() => setActiveFormulaTab('bernoulli')}
                className={`flex-1 py-2 px-4 border-b-2 text-center transition-all cursor-pointer ${activeFormulaTab === 'bernoulli' ? 'border-[#ffd700] text-white bg-white/5 font-bold' : 'border-transparent hover:text-white'}`}
              >
                1. Bernoulli's Equation & dP
              </button>
              <button
                onClick={() => setActiveFormulaTab('poiseuille')}
                className={`flex-1 py-2 px-4 border-b-2 text-center transition-all cursor-pointer ${activeFormulaTab === 'poiseuille' ? 'border-[#ffd700] text-white bg-white/5 font-bold' : 'border-transparent hover:text-white'}`}
              >
                2. Poiseuille Resistance (R)
              </button>
              <button
                onClick={() => setActiveFormulaTab('reynolds')}
                className={`flex-1 py-2 px-4 border-b-2 text-center transition-all cursor-pointer ${activeFormulaTab === 'reynolds' ? 'border-[#ffd700] text-white bg-white/5 font-bold' : 'border-transparent hover:text-white'}`}
              >
                3. Reynolds Turbulence threshold
              </button>
            </div>

            <div className="p-5 font-mono text-[9px] text-[#8e9299]">
              <AnimatePresence mode="wait">
                {activeFormulaTab === 'bernoulli' && (
                  <motion.div
                    key="bernoulli"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[#ffd700] font-bold">Simplified Bernoulli Formula (Echocardiography Rule):</span>
                      <p className="bg-[#08080a] p-3 rounded-lg text-white/80 border border-white/5 text-center leading-relaxed text-[10.5px]">
                        ΔP = 4 · ( v₂² - v₁² )
                      </p>
                      <p className="text-[8px] font-sans text-white/40 leading-relaxed">
                        Where ΔP represents the pressure drop gradient (mmHg), v₂ is the peak velocity inside the stenosis jet (m/s), and v₁ is the pre-stenotic baseline blood velocity (m/s).
                      </p>
                    </div>

                    <div className="bg-[#08080a] p-3 rounded-lg border border-white/5 space-y-2 text-[8.5px]">
                      <span className="text-white/60 font-bold block uppercase border-b border-white/5 pb-1">Solver equations mapped to simulator:</span>
                      
                      {/* Step-by-step numbers solving */}
                      <div className="space-y-1 text-white/70">
                        <div>Step 1: Convert baseline and jet velocities to m/s:</div>
                        <div className="pl-4 text-[#00d1ff]">
                          v₁ = {velocity} cm/s = <span className="font-bold">{(velocity / 100).toFixed(2)} m/s</span>
                        </div>
                        <div className="pl-4 text-amber-400">
                          v₂ = {computations.sten.velocity.toFixed(0)} cm/s = <span className="font-bold">{(computations.sten.velocity / 100).toFixed(2)} m/s</span>
                        </div>

                        <div className="pt-2">Step 2: Squaring metrics & subtraction:</div>
                        <div className="pl-4">
                          v₂² - v₁² = ({(computations.sten.velocity / 100).toFixed(2)})² - ({(velocity / 100).toFixed(2)})²
                        </div>
                        <div className="pl-4 text-emerald-400 font-bold">
                          = {Math.pow(computations.sten.velocity / 100, 2).toFixed(4)} - {Math.pow(velocity / 100, 2).toFixed(4)} = {Math.max(0, Math.pow(computations.sten.velocity / 100, 2) - Math.pow(velocity / 100, 2)).toFixed(4)} m²/s²
                        </div>

                        <div className="pt-2">Step 3: Solve the simplified clinical mmHg drop:</div>
                        <div className="pl-4 text-emerald-300 font-black text-[10px]">
                          ΔP = 4 · {Math.max(0, Math.pow(computations.sten.velocity / 100, 2) - Math.pow(velocity / 100, 2)).toFixed(4)} = {computations.sten.dp.toFixed(2)} mmHg
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeFormulaTab === 'poiseuille' && (
                  <motion.div
                    key="poiseuille"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[#ffd700] font-bold">Hagen-Poiseuille Viscous Resistance Equation:</span>
                      <p className="bg-[#08080a] p-3 rounded-lg text-white/80 border border-white/5 text-center leading-relaxed text-[10.5px]">
                        R = ( 8 · η · L ) / ( π · r⁴ )
                      </p>
                      <p className="text-[8px] font-sans text-white/40 leading-relaxed">
                        Where R is the vascular flow resistance index, η represents blood viscous thickness (cP), L stands for active segment length (mm), and r represents the vessel radius (mm). Notice that reducing internal radius (r) causes flow resistance to spike as fourth power (r⁴)!
                      </p>
                    </div>

                    <div className="bg-[#08080a] p-3 rounded-lg border border-white/5 space-y-2 text-[8.5px]">
                      <span className="text-white/60 font-bold block uppercase border-b border-white/5 pb-1">Fluid Resistance calculations:</span>
                      
                      <div className="space-y-1 text-white/70">
                        <div>Step 1: Set Viscosity constants & Radius conversion to cm:</div>
                        <div className="pl-4 text-[#00d1ff]">
                          η = {viscosity} cP = {(viscosity / 10).toFixed(3)} Poise dynamic cP conversion.
                        </div>
                        <div className="pl-4 text-[#00d1ff]">
                          Normal Baseline Radius (r₀) = {radius.toFixed(1)} mm = <span className="font-bold">{(radius / 10).toFixed(2)} cm</span>
                        </div>
                        {stenosis > 0 && (
                          <div className="pl-4 text-amber-500">
                            Stenotic Waist Radius (r_sten) = {computations.sten.radius.toFixed(2)} mm = <span className="font-bold">{(computations.sten.radius / 10).toFixed(3)} cm</span>
                          </div>
                        )}

                        <div className="pt-2">Step 2: Calculate baseline vascular resistance:</div>
                        <div className="pl-4 text-emerald-400 font-bold">
                          R_baseline = ( 8 · {(viscosity / 10).toFixed(3)} · 5 ) / ( π · ({(radius / 10).toFixed(2)})⁴ )
                          = <span className="text-white font-black">{computations.resistance_pru.toFixed(3)} PRU (Peripheral Resistance Units)</span>
                        </div>

                        {stenosis > 0 && (
                          <div className="pt-2">
                            <div>Step 3: Calculating comparative stenotic resistance profile:</div>
                            <div className="pl-4 text-amber-300 font-bold">
                              R_stenosis = ( 8 · {(viscosity / 10).toFixed(3)} · 5 ) / ( π · ({(computations.sten.radius / 10).toFixed(3)})⁴ )
                              = <span className="text-white font-black">
                                {((8 * (viscosity / 10) * 5) / (Math.PI * Math.pow(computations.sten.radius / 10, 4))).toFixed(1)} PRU
                              </span>
                            </div>
                            <div className="pl-4 text-red-400 font-bold italic pt-1 text-[8.2px]">
                              🚨 Vascular blockage causes a {(((8 * (viscosity / 10) * 5) / (Math.PI * Math.pow(computations.sten.radius / 10, 4))) / computations.resistance_pru).toFixed(0)}x resistance hike locally inside Segment B!
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeFormulaTab === 'reynolds' && (
                  <motion.div
                    key="reynolds"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[#ffd700] font-bold">Reynolds Turbulence Factor Framework:</span>
                      <p className="bg-[#08080a] p-3 rounded-lg text-white/80 border border-white/5 text-center leading-relaxed text-[10.5px]">
                        Re = ( v · D · ρ ) / η
                      </p>
                      <p className="text-[8px] font-sans text-white/40 leading-relaxed">
                        Where Re is the dimensionless Reynolds coefficient, v is local velocity (cm/s), D represents vessel diameter (mm), ρ designates blood density (1.05 g/cm³ constant), and η represents viscosity (cP).
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-1 font-sans text-[7.5px] text-center">
                        <div className="bg-green-500/10 text-green-400 p-1.5 rounded border border-green-500/15">Re &lt; 1,200: Laminar</div>
                        <div className="bg-amber-500/10 text-amber-300 p-1.5 rounded border border-amber-500/15">Re 1,200 - 2,000: Transitional</div>
                        <div className="bg-red-500/10 text-red-400 p-1.5 rounded border border-red-500/15 font-bold">Re &gt; 2,000: Turbulence</div>
                      </div>
                    </div>

                    <div className="bg-[#08080a] p-3 rounded-lg border border-white/5 space-y-2 text-[8.5px]">
                      <span className="text-white/60 font-bold block uppercase border-b border-white/5 pb-1">Solver parameters for selected segment ({selectedSegment.toUpperCase()}):</span>
                      
                      <div className="space-y-1 text-white/70">
                        <div className="flex justify-between">
                          <span>Local velocity (v):</span>
                          <span className="text-white">{activeSegmentData.velocity.toFixed(1)} cm/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Local vessel diameter (D):</span>
                          <span className="text-white">{(activeSegmentData.radius * 2).toFixed(2)} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Blood density (ρ):</span>
                          <span className="text-white">1.05 g/cm³</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1 select-none">
                          <span>Dynamic blood viscosity (η):</span>
                          <span className="text-white">{viscosity.toFixed(1)} cP</span>
                        </div>

                        <div className="pt-2 text-white/90">Reynolds calculation formula filled:</div>
                        <div className="pl-4 font-bold text-[#ffd700]">
                          Re = ( {activeSegmentData.velocity.toFixed(1)} · {(activeSegmentData.radius * 2).toFixed(2)} · 1.05 ) / ( {viscosity.toFixed(1)} / 10 )
                        </div>
                        <div className="pl-4 text-emerald-400 font-bold text-[10px]">
                          = {activeSegmentData.reynolds.toFixed(0)} ({flowRegimeSummary(activeSegmentData.reynolds).label})
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Interactive Artery vs Vein Comparative System */}
      <div className="mt-8 border-t border-[#2d3139]/50 pt-8 shrink-0">
        <VeinArteryVisualizer />
      </div>
    </motion.div>
  );
}
