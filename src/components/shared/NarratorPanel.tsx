
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  X, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Terminal,
  Activity,
  Mic2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { LECTURES } from '../../constants/lectures';

interface NarratorPanelProps {
  lectureId: string;
  onClose: () => void;
  narrator: {
    speak: (text: string, voiceProfile?: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    progress: number;
    getAnalyserData?: (dataArray: Uint8Array) => boolean;
  };
}

// --- Helper Components for Visual Aids ---
export const DynamicInteractiveDiagram = ({ url, caption }: { url: string; caption: string }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const handle = setInterval(() => {
      setFrame((f) => (f + 1) % 100);
    }, 45);
    return () => clearInterval(handle);
  }, []);

  switch (url) {
    case 'beam_zones':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <defs>
            <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffd700" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="focusGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="220" rx="12" fill="#090a0f" />
          
          {/* Grids */}
          <path d="M 0,110 L 400,110" stroke="#1d212c" strokeWidth="0.75" strokeDasharray="3 3" />
          
          {/* Near zone / Fresnel zone */}
          <path d="M 45,75 L 180,98 L 180,122 L 45,145 Z" fill="url(#beamGrad)" opacity="0.35" />
          {/* Far zone / Fraunhofer zone */}
          <path d="M 180,98 L 360,65 L 360,155 L 180,122 Z" fill="#00d1ff" fillOpacity="0.06" stroke="#00d1ff" strokeWidth="0.5" strokeDasharray="1 2" />

          {/* Transducer head element */}
          <rect x="15" y="70" width="30" height="80" rx="4" fill="#1b1e26" stroke="#3b404c" strokeWidth="2" />
          <line x1="45" y1="75" x2="45" y2="145" stroke="#00d1ff" strokeWidth="3" strokeLinecap="round" />
          
          {/* Transducer labels */}
          <text x="30" y="113" fill="#00d1ff" fontSize="7" fontWeight="bold" textAnchor="middle" transform="rotate(-90 30 113)">PROBE APERTURE</text>

          {/* Boundaries / Labels */}
          <line x1="180" y1="20" x2="180" y2="200" stroke="#ffd700" strokeWidth="1" strokeDasharray="4 3" opacity="0.8" />
          
          {/* Animated Wavefronts propagating */}
          {[0, 1, 2, 3].map((i) => {
            const pct = ((frame + i * 25) % 100) / 100;
            const x = 45 + pct * 315;
            let width = 70;
            if (x < 180) {
              // converging near-field
              width = 70 - (x - 45) * (46 / 135);
            } else {
              // diverging far-field
              width = 24 + (x - 180) * (66 / 180);
            }
            const y1 = 110 - width / 2;
            const y2 = 110 + width / 2;
            return (
              <g key={i} opacity={1.1 - pct}>
                <line
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke={x < 180 ? '#00d1ff' : '#ffd700'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx={x} cy="110" r="1.5" fill="#ffffff" opacity="0.6" />
              </g>
            );
          })}

          {/* Focal spot indicator */}
          <circle cx="180" cy="110" r="16" fill="url(#focusGlow)" className="animate-pulse" />
          <circle cx="180" cy="110" r="3" fill="#ffd700" />
          
          {/* Annotations */}
          <text x="180" y="18" textAnchor="middle" fill="#ffd700" fontSize="8" fontWeight="bold">★ FOCAL POINT</text>
          <text x="180" y="28" textAnchor="middle" fill="#8e9299" fontSize="6">NZL Boundary / Max Intensity</text>
          
          <text x="105" y="200" textAnchor="middle" fill="#00d1ff" fontSize="7" fontWeight="bold">NEAR ZONE (FRESNEL)</text>
          <text x="105" y="210" textAnchor="middle" fill="#8e9299" fontSize="6">Beam converges / NZL = D²f/4v</text>

          <text x="285" y="200" textAnchor="middle" fill="#ffd700" fontSize="7" fontWeight="bold">FAR ZONE (FRAUNHOFER)</text>
          <text x="285" y="210" textAnchor="middle" fill="#8e9299" fontSize="6">Beam diverges / sin(θ) = 1.22λ/D</text>
        </svg>
      );

    case 'phased_steering':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <defs>
            <linearGradient id="steeredGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect width="400" height="220" rx="12" fill="#090a0f" />
          
          {/* Grid back */}
          <path d="M 50,20 L 50,200 M 150,20 L 150,200 M 250,20 L 250,200 M 350,20 L 350,200" stroke="#1d212c" strokeWidth="0.5" strokeDasharray="2 4" />

          {/* Steered beam sector sweep paths */}
          <path d="M 200,30 L 110,190 L 290,190 Z" fill="none" stroke="#2d3139" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Array Transducer Base */}
          <g transform="translate(140, 20)">
            <rect x="0" y="0" width="120" height="15" rx="3" fill="#1b1e26" stroke="#2f333d" strokeWidth="1.5" />
            {/* 10 dynamic crystal segments */}
            {[...Array(10)].map((_, i) => {
              const activeIdx = Math.floor((frame / 10) % 10);
              const isActive = Math.abs(i - activeIdx) <= 1;
              return (
                <rect 
                  key={i} 
                  x={4 + i * 11.2} 
                  y="3" 
                  width="8" 
                  height="9" 
                  rx="1" 
                  fill={isActive ? '#00d1ff' : '#222530'} 
                  stroke={isActive ? '#ffd700' : 'none'} 
                  strokeWidth="0.75"
                  className="transition-colors duration-150"
                />
              );
            })}
          </g>

          {/* Steered wave vector path */}
          <g transform="rotate(18, 200, 30)">
            {/* Beam outline */}
            <path d="M 194,30 L 175,200 L 225,200 L 206,30 Z" fill="url(#steeredGrad)" />
            {/* Steering directional vector arrow */}
            <line x1="200" y1="30" x2="200" y2="190" stroke="#ffd700" strokeWidth="2" strokeDasharray="5 2" />
            <polygon points="200,195 196,183 204,183" fill="#ffd700" />
            
            {/* Propagation pulse arc waves */}
            {[0, 1, 2, 3].map((i) => {
              const pct = ((frame + i * 25) % 100) / 100;
              const r = pct * 165;
              return (
                <path
                  key={i}
                  d={`M ${200 - r * 0.12},${30 + r} Q 200,${34 + r} ${200 + r * 0.12},${30 + r}`}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeOpacity={0.8 - pct}
                  fill="none"
                />
              );
            })}
          </g>

          {/* Delays timeline panel */}
          <g transform="translate(20, 50)">
            <rect x="0" y="0" width="100" height="75" rx="6" fill="#12141c" stroke="#2d3139" strokeWidth="1" />
            <text x="50" y="15" textAnchor="middle" fill="#00d1ff" fontSize="6.5" fontWeight="bold">NANOSECOND DELAYS</text>
            
            {/* Simulated delay timelines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const delay = i * 4;
              return (
                <g key={i} transform={`translate(10, ${25 + i * 9})`}>
                  <line x1="0" y1="3" x2="60" y2="3" stroke="#2d3139" strokeWidth="1.5" />
                  <circle cx={4 + delay} cy="3" r="2.5" fill="#ffd700" />
                  <line x1="65" y1="5" x2="75" y2="5" stroke="#8e9299" strokeWidth="0.5" />
                </g>
              );
            })}
            <text x="50" y="70" textAnchor="middle" fill="#8e9299" fontSize="5.5">Left-to-Right Beam Bending</text>
          </g>

          {/* Descriptive Tags */}
          <text x="200" y="208" textAnchor="middle" fill="#00d1ff" fontSize="8" fontWeight="bold">PHASED ELECTRONIC STEERING</text>
          <text x="200" y="216" textAnchor="middle" fill="#8e9299" fontSize="5.5">Delay patterns of 10-25ns shape and tilt wavefront vectors</text>
        </svg>
      );

    case 'axial_vs_lateral':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <rect width="400" height="220" rx="12" fill="#090a0f" />
          
          <line x1="200" y1="15" x2="200" y2="185" stroke="#2d3139" strokeWidth="1.5" />

          {/* AXIAL RESOLUTION (LARRD) */}
          <g transform="translate(0, 0)">
            <text x="100" y="24" textAnchor="middle" fill="#00d1ff" fontSize="9" fontWeight="bold" letterSpacing="0.5">AXIAL RESOLUTION (LARRD)</text>
            <text x="100" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">ALONG THE SOUND BEAM PATH</text>
            
            {/* Sound beam line */}
            <line x1="100" y1="50" x2="100" y2="165" stroke="#2d3139" strokeWidth="4" />
            <line x1="100" y1="50" x2="100" y2="165" stroke="#00d1ff" strokeWidth="1" strokeOpacity="0.4" />

            {/* High freq short pulse */}
            <g transform={`translate(100, ${55 + (frame % 80)})`}>
              {/* Short pulse wave */}
              <path d="M -12,-8 Q -6,4 0,-8 Q 6,-20 12,-8" fill="none" stroke="#ffd700" strokeWidth="2.5" />
              <rect x="-24" y="-2" width="48" height="4" fill="#ffd700" opacity="0.3" rx="2" />
              <text x="28" y="2" fill="#ffd700" fontSize="5.5" fontWeight="bold">SHORT SPL</text>
            </g>

            {/* Target dots */}
            <ellipse cx="100" cy="100" rx="1.5" ry="1.5" fill="#ffffff" stroke="#ff4d4d" strokeWidth="1.5" />
            <ellipse cx="100" cy="118" rx="1.5" ry="1.5" fill="#ffffff" stroke="#ff4d4d" strokeWidth="1.5" />
            
            <path d="M 60,100 L 76,100 M 60,118 L 76,118" stroke="#8e9299" strokeWidth="0.5" />
            <line x1="60" y1="100" x2="60" y2="118" stroke="#8e9299" strokeWidth="0.5" />
            <text x="50" y="112" textAnchor="middle" fill="#8e9299" fontSize="6">Distance</text>
            
            <rect x="25" y="132" width="150" height="28" rx="4" fill="#0f1118" stroke="#1d212c" />
            <text x="100" y="142" textAnchor="middle" fill="#e0e0e0" fontSize="6.5" fontWeight="bold">Axial Limit = SPL / 2</text>
            <text x="100" y="152" textAnchor="middle" fill="#8e9299" fontSize="5.5">Determined only by system damping & f</text>
          </g>

          {/* LATERAL RESOLUTION (LATA) */}
          <g transform="translate(200, 0)">
            <text x="100" y="24" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="bold" letterSpacing="0.5">LATERAL RESOLUTION (LATA)</text>
            <text x="100" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">ACROSS THE SOUND BEAM PATH</text>

            {/* Converging beam */}
            <path d="M 100,50 L 75,110 L 100,165" fill="none" stroke="#00d1ff" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M 100,50 L 125,110 L 100,165" fill="none" stroke="#00d1ff" strokeWidth="1" strokeDasharray="2 2" />
            
            <circle cx="100" cy="110" r="32" fill="#00d1ff" fillOpacity="0.04" />

            {/* Target dots side-by-side */}
            <ellipse cx="88" cy="110" rx="1.5" ry="1.5" fill="#ffffff" stroke="#ff4d4d" strokeWidth="1.5" />
            <ellipse cx="112" cy="110" rx="1.5" ry="1.5" fill="#ffffff" stroke="#ff4d4d" strokeWidth="1.5" />
            
            {/* Focus line indicator */}
            <line x1="60" y1="110" x2="140" y2="110" stroke="#ffd700" strokeWidth="0.5" strokeDasharray="1 1" />
            <text x="100" y="125" textAnchor="middle" fill="#ffd700" fontSize="6">Focal Zone (Narrowest)</text>

            <rect x="25" y="132" width="150" height="28" rx="4" fill="#0f1118" stroke="#1d212c" />
            <text x="100" y="142" textAnchor="middle" fill="#e0e0e0" fontSize="6.5" fontWeight="bold">Lateral Limit = Beam Width</text>
            <text x="100" y="152" textAnchor="middle" fill="#8e9299" fontSize="5.5">Improves at focal depth where beam is thin</text>
          </g>

          <rect x="20" y="195" width="360" height="18" rx="3" fill="#1b1e26"/ >
          <text x="200" y="207" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">LARRD: Longitudinal, Axial, Range, Radial, Depth | LATA: Lateral, Angular, Transverse, Azimuthal</text>
        </svg>
      );

    case 'shadow_enhancement':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <defs>
            <linearGradient id="shadowG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0a0a0d" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="enhanceG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect width="400" height="220" rx="12" fill="#090a0f" />

          {/* Left panel: Shadowing */}
          <g transform="translate(0, 0)">
            <text x="100" y="24" textAnchor="middle" fill="#ff4d4d" fontSize="9" fontWeight="bold">POSTERIOR SHADOWING</text>
            <text x="100" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">HIGHLY ATTENUATING (STONE)</text>

            {/* Ultrasound Beam */}
            <path d="M 100,45 L 60,200 L 140,200 Z" fill="#00d1ff" fillOpacity="0.08" />

            {/* Gallstone / Bone */}
            <rect x="80" y="85" width="40" height="20" rx="6" fill="#757575" stroke="#ffffff" strokeWidth="1.5" />
            <text x="100" y="97" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">STONE</text>

            {/* Shadow cast underneath */}
            <path d="M 80,105 L 60,200 L 140,200 L 120,105 Z" fill="url(#shadowG)" />
            <text x="100" y="150" textAnchor="middle" fill="#ff4d4d" fontSize="7" fontWeight="bold" opacity="0.6">★ SHADOW</text>
            <text x="100" y="160" textAnchor="middle" fill="#8e9299" fontSize="6" opacity="0.7">Energy fully absorbed/reflected</text>
          </g>

          {/* Right panel: Enhancement */}
          <g transform="translate(200, 0)">
            <text x="100" y="24" textAnchor="middle" fill="#00d1ff" fontSize="9" fontWeight="bold">ACOUSTIC ENHANCEMENT</text>
            <text x="100" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">LOW ATTENUATING (CYST / FLUID)</text>

            {/* Ultrasound Beam */}
            <path d="M 100,45 L 60,200 L 140,200 Z" fill="#00d1ff" fillOpacity="0.08" />

            {/* Simple fluid cyst */}
            <circle cx="100" cy="95" r="22" fill="#0c111e" stroke="#00d1ff" strokeWidth="2" />
            <text x="100" y="98" textAnchor="middle" fill="#00d1ff" fontSize="6" fontWeight="bold">FLUID CYST</text>

            {/* Enhancement column underneath */}
            <path d="M 78,95 L 60,200 L 140,200 L 122,95 Z" fill="url(#enhanceG)" opacity="0.75" />
            <text x="100" y="150" textAnchor="middle" fill="#ffd700" fontSize="7" fontWeight="bold" className="animate-pulse">★ BRIGHT OVER-GAIN</text>
            <text x="100" y="160" textAnchor="middle" fill="#8e9299" fontSize="6">Fluid attenuates less than tissue</text>
          </g>

          {/* Dividing border */}
          <line x1="200" y1="15" x2="200" y2="195" stroke="#1d212c" />
        </svg>
      );

    case 'mirror_artifact':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <rect width="400" height="220" rx="12" fill="#090a0f" />
          
          <text x="200" y="24" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="bold" letterSpacing="1">DIAPHRAGMIC MIRROR ARTIFACT</text>
          <text x="200" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">SPECULAR DUPLICATION PHENOMENON</text>

          {/* Transducer face */}
          <line x1="200" y1="42" x2="200" y2="45" stroke="#00d1ff" strokeWidth="5" />

          {/* Diaphragm reflector (Specular boundary) */}
          <line x1="50" y1="110" x2="350" y2="140" stroke="#ffd700" strokeWidth="3" />
          <text x="150" y="115" fill="#ffd700" fontSize="7" fontWeight="bold">⬔ DIAPHRAGM (Specular Reflector)</text>

          {/* Real object */}
          <circle cx="270" cy="85" r="10" fill="#00d1ff" fillOpacity="0.4" stroke="#00d1ff" strokeWidth="1.5" />
          <text x="270" y="103" textAnchor="middle" fill="#00d1ff" fontSize="6.5" fontWeight="bold">REAL LESION</text>

          {/* Sound wave routing paths */}
          {/* Leg A: to Diaphragm */}
          <line x1="200" y1="45" x2="200" y2="125" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
          {/* Leg B: Diaphragm to Lesion */}
          <line x1="200" y1="125" x2="270" y2="85" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Wavefront signal direction indicators */}
          <polygon points="200,80 197,72 203,72" fill="#ffffff" />
          <polygon points="235,105 231,99 239,101" fill="#ffffff" />

          {/* Duplicate fake image appearing deeper behind diaphragm */}
          {/* Virtual line projection straight path */}
          <line x1="200" y1="45" x2="280" y2="190" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="1 3" opacity="0.6" />
          
          <circle cx="265" cy="170" r="10" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse" />
          <text x="265" y="188" textAnchor="middle" fill="#f43f5e" fontSize="6.5" fontWeight="bold" className="animate-pulse">⚠️ MIRROR CLONE (FAKE)</text>

          <rect x="20" y="198" width="360" height="15" rx="3" fill="#151722" />
          <text x="200" y="208" textAnchor="middle" fill="#8e9299" fontSize="6">Violates Assumption: Sound wave travels only in a straight direct path</text>
        </svg>
      );

    case 'safety_indices':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <rect width="400" height="220" rx="12" fill="#090a0f" />

          <text x="200" y="24" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold" letterSpacing="1">BIOEFFECTS SAFETY METERS</text>
          <text x="200" y="34" textAnchor="middle" fill="#8e9299" fontSize="6.5">REAL-TIME CLINICAL EXPOSURE GAUGES</text>

          {/* Mechanical Index Gauge (MI) */}
          <g transform="translate(45, 52)">
            <rect width="140" height="115" rx="8" fill="#11131a" stroke="#2d3139" strokeWidth="1.5" />
            <text x="70" y="22" textAnchor="middle" fill="#00d1ff" fontSize="8" fontWeight="bold">MECHANICAL INDEX (MI)</text>
            <text x="70" y="32" textAnchor="middle" fill="#8e9299" fontSize="5.5">Micro-cavitation / Peak Rarefaction</text>

            {/* Gauge dial path */}
            <path d="M 25,90 A 45,45 0 0,1 115,90" fill="none" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
            <path d="M 25,90 A 45,45 0 0,1 90,52" fill="none" stroke="#00d1ff" strokeWidth="6" strokeLinecap="round" />
            <path d="M 90,52 A 45,45 0 0,1 115,90" fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />

            <circle cx="70" cy="90" r="4" fill="#ffffff" />
            <line x1="70" y1="90" x2="84" y2="52" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

            <text x="70" y="103" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">1.18</text>
            <rect x="40" y="106" width="60" height="7" rx="1.5" fill="#00d1ff" fillOpacity="0.15" />
            <text x="70" y="112" textAnchor="middle" fill="#00d1ff" fontSize="5" fontWeight="bold">SAFE: OUTSIDE CAVITATION</text>
          </g>

          {/* Thermal Index Gauge (TI) */}
          <g transform="translate(215, 52)">
            <rect width="140" height="115" rx="8" fill="#11131a" stroke="#2d3139" strokeWidth="1.5" />
            <text x="70" y="22" textAnchor="middle" fill="#ff9f1c" fontSize="8" fontWeight="bold">THERMAL INDEX (TI)</text>
            <text x="70" y="32" textAnchor="middle" fill="#8e9299" fontSize="5.5">Tissue Heating / Absorption rate</text>

            {/* Gauge dial path */}
            <path d="M 25,90 A 45,45 0 0,1 115,90" fill="none" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
            <path d="M 25,90 A 45,45 0 0,1 65,48" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" />

            <circle cx="70" cy="90" r="4" fill="#ffffff" />
            <line x1="70" y1="90" x2="58" y2="48" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

            <text x="70" y="103" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">0.45</text>
            <rect x="40" y="106" width="60" height="7" rx="1.5" fill="#34d399" fillOpacity="0.15" />
            <text x="70" y="112" textAnchor="middle" fill="#34d399" fontSize="5" fontWeight="bold">SAFE: &lt; 1.0 °C RISE</text>
          </g>

          <rect x="25" y="182" width="350" height="23" rx="4" fill="#1e1b12" stroke="#453112" strokeWidth="0.5" />
          <text x="200" y="192" textAnchor="middle" fill="#ffd700" fontSize="7" fontWeight="bold">★ ALARA SAFETY GOLD STANDARD</text>
          <text x="200" y="200" textAnchor="middle" fill="#e0e0e0" fontSize="5.5">Maintain indicators below thresholds to avoid biological tissue damage.</text>
        </svg>
      );

    case 'alara_diagram':
      return (
        <svg className="w-full h-full font-mono select-none" viewBox="0 0 400 220">
          <rect width="400" height="220" rx="12" fill="#090a0f" />

          <text x="200" y="22" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="bold" letterSpacing="0.8">ALARA OPTIMIZATION STEPS</text>
          <text x="200" y="32" textAnchor="middle" fill="#8e9299" fontSize="6.5">HIGH GAIN VS TRANSMIT POWER TRADEOFF</text>

          {/* Left Block: Transmit Power */}
          <g transform="translate(25, 45)">
            <rect width="160" height="135" rx="8" fill="#1b1214" stroke="#ff4d4d" strokeWidth="1" strokeOpacity="0.4" />
            <text x="80" y="18" textAnchor="middle" fill="#ff4d4d" fontSize="7.5" fontWeight="bold">1. TRANSMIT OUTPUT POWER</text>
            <text x="80" y="27" textAnchor="middle" fill="#8e9299" fontSize="5.5">Changes pulse energy injected into body</text>

            <rect x="25" y="42" width="110" height="34" rx="4" fill="#0a0506" stroke="#ff4d4d" strokeWidth="1.5" className="animate-pulse" />
            <text x="80" y="55" textAnchor="middle" fill="#ff4d4d" fontSize="6.5" fontWeight="bold">🗲 HIGH BIOEFFECTS</text>
            <text x="80" y="66" textAnchor="middle" fill="#e0e0e0" fontSize="5.5">Raises acoustic index levels</text>

            <path d="M 30,105 L 130,105" stroke="#ff4d4d" strokeWidth="1.5" />
            {[0, 10, 20, 30].map((d) => (
              <path key={d} d={`M ${50 + d * 2.5},105 Q ${55 + d * 2.5},85 ${60 + d * 2.5},105`} fill="none" stroke="#ff4d4d" strokeWidth="2.5" />
            ))}
            <text x="80" y="123" textAnchor="middle" fill="#8e9299" fontSize="6" fontWeight="bold">Active high voltage spike</text>
          </g>

          {/* Right Block: Gain */}
          <g transform="translate(215, 45)">
            <rect width="160" height="135" rx="8" fill="#121b18" stroke="#34d399" strokeWidth="1" strokeOpacity="0.4" />
            <text x="80" y="18" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">2. RECEIVER AMPLIFICATION (GAIN)</text>
            <text x="80" y="27" textAnchor="middle" fill="#8e9299" fontSize="5.5">Boosts signals AFTER returning to probe</text>

            <rect x="25" y="42" width="110" height="34" rx="4" fill="#050a07" stroke="#34d399" strokeWidth="1" />
            <text x="80" y="55" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="bold">🛡️ ZERO RISK TO PATIENT</text>
            <text x="80" y="66" textAnchor="middle" fill="#e0e0e0" fontSize="5.5">Pure digital math gain amplification</text>

            <line x1="30" y1="105" x2="130" y2="105" stroke="#34d399" strokeWidth="1" />
            {[0, 8, 16, 24, 32, 40].map((d, i) => {
              const h = 5 + i * 4;
              return (
                <rect key={d} x={45 + d} y={105 - h} width="4" height={h} fill="#34d399" />
              );
            })}
            <text x="80" y="123" textAnchor="middle" fill="#8e9299" fontSize="6" fontWeight="bold">TGC digital envelope bars</text>
          </g>

          {/* Bottom ALARA rule recommendation */}
          <rect x="25" y="188" width="350" height="18" rx="4" fill="#ffd700" fillOpacity="0.1" />
          <text x="200" y="200" textAnchor="middle" fill="#ffd700" fontSize="6.5" fontWeight="bold">✔ ALARA PROTOCOL RULE: DO NOT BLAST BODY FIRST, MAXIMIZE AMPLIFICATION (GAIN) INSTEAD</text>
        </svg>
      );

    default:
      return (
        <div className="relative w-full h-full border border-white/10 bg-slate-900 rounded-lg flex items-center justify-center p-4">
           <Activity size={48} className="text-[#00d1ff]/20 absolute animate-pulse" />
           <div className="text-center px-4 relative z-10">
              <div className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-widest mb-2">DIAGNOSTIC_FRAME_{url.toUpperCase()}</div>
              <p className="text-xs text-[#8e9299]">{caption}</p>
           </div>
        </div>
      );
  }
};

const VisualViewport = ({ 
  lecture, 
  currentParagraphIndex, 
  isSpeaking 
}: { 
  lecture: any, 
  currentParagraphIndex: number,
  isSpeaking: boolean 
}) => {
  const currentImage = lecture.images?.find((img: any) => img.triggerParagraph === currentParagraphIndex) || 
                      lecture.images?.[0];

  return (
    <div className="relative w-full aspect-video bg-[#05060b] rounded-2xl border border-[#2d3139]/70 overflow-hidden group mb-8 shadow-inner shadow-black">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#00d1ff12_1px,transparent_1px),linear-gradient(to_bottom,#00d1ff12_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage?.url || 'default'}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center p-2.5"
        >
          {currentImage ? (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                <DynamicInteractiveDiagram url={currentImage.url} caption={currentImage.caption} />
             </div>
          ) : (
            <div className="text-center">
               <Terminal size={32} className="text-[#00d1ff]/20 mx-auto mb-4 animate-pulse" />
               <div className="text-[9px] font-mono text-[#00d1ff] uppercase tracking-[4px] font-black animate-pulse">SYSTEM_STREAMING_ACTIVE...</div>
               <div className="text-[7.5px] font-mono text-[#8e9299]/50 uppercase tracking-[2px] mt-1">Ready to receive lecture trigger signals</div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* HUD Info */}
      <div className="absolute top-3 left-3 flex gap-2 z-20">
        <div className="px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-white/15 text-[7px] font-mono text-[#00d1ff] font-bold uppercase tracking-wider">
          VES: {currentImage ? currentImage.url.toUpperCase() : 'LINE_OUT'}
        </div>
        <div className="px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-white/15 text-[7px] font-mono text-[#ffd700] font-bold uppercase tracking-wider">
          SYNC: HIGH_FIDELITY
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full border border-white/15">
          <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-[#34d399]'}`} />
          <span className="text-[7px] font-mono text-white font-bold uppercase tracking-widest">{isSpeaking ? 'NARRATING STUDY' : 'STANDBY'}</span>
        </div>
      </div>
    </div>
  );
};

const RealAudioVisualizer = ({ isSpeaking, getAnalyserData }: { isSpeaking: boolean, getAnalyserData?: (data: Uint8Array) => boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32); 
    const simHeights = Array.from({ length: 32 }, () => Math.random());

    const draw = () => {
      let isRealAudio = false;
      if (getAnalyserData) {
        isRealAudio = getAnalyserData(dataArray);
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / 32);
      let x = 0;

      // Check if dataArray is actually receiving non-zero bytes
      let hasData = false;
      if (isRealAudio) {
        for (let i = 0; i < 32; i++) {
          if (dataArray[i] > 0) hasData = true;
        }
      }

      for (let i = 0; i < 32; i++) {
        let heightMultiplier = 0;

        if (isRealAudio && isSpeaking && hasData) {
          heightMultiplier = dataArray[i] / 255;
        } else if (!isRealAudio || (isSpeaking && !hasData)) {
          if (isSpeaking) {
            simHeights[i] += (Math.random() - 0.5) * 0.25;
            simHeights[i] = Math.max(0, Math.min(1, simHeights[i]));
            const edgeFade = Math.max(0, 1 - Math.abs(i - 16) / 20);
            heightMultiplier = simHeights[i] * edgeFade * 0.8;
          }
        }

        const barHeight = Math.max(2, heightMultiplier * canvas.height * 0.8);
        const opacity = isSpeaking ? Math.max(0.3, heightMultiplier + 0.2) : 0.1;
        
        ctx.fillStyle = isSpeaking ? `rgba(0, 209, 255, ${opacity})` : `rgba(255, 255, 255, 0.1)`;
        // Add rounded effect by using fillRect
        ctx.fillRect(x + 1, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
        
        x += barWidth;
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSpeaking, getAnalyserData]);

  return (
    <canvas ref={canvasRef} width={320} height={48} className="w-full h-full mix-blend-screen relative z-10" />
  );
};

export default function NarratorPanel({ lectureId, onClose, narrator }: NarratorPanelProps) {
  const lecture = LECTURES.find(l => l.id === lectureId);
  const { speak, stop, isSpeaking, progress } = narrator;
  const [showAssessment, setShowAssessment] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const [voiceAccent, setVoiceAccent] = useState<'neutral' | 'british' | 'bourdain' | 'sedaris'>(() => {
    return (localStorage.getItem('spi_narrator_voice_profile') as any) || 'british';
  });

  const updateVoiceAccent = (newAccent: 'neutral' | 'british' | 'bourdain' | 'sedaris') => {
    setVoiceAccent(newAccent);
    localStorage.setItem('spi_narrator_voice_profile', newAccent);
    if (isSpeaking && lecture) {
      stop();
      setTimeout(() => {
        speak(lecture.script, newAccent);
      }, 150);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Derive current paragraph index based on progress
  const paragraphs = lecture?.script.split('\n\n').filter(p => p.trim()) || [];
  const currentParagraphIndex = Math.min(
    Math.floor((progress / 100) * paragraphs.length),
    paragraphs.length - 1
  );

  // Auto-scroll logic for "Teleprompter" feel
  useEffect(() => {
    if (isSpeaking && scrollRef.current && !showAssessment) {
      const el = scrollRef.current;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      el.scrollTo({
        top: (progress / 100) * scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [progress, isSpeaking, showAssessment]);

  if (!lecture) return null;

  const toggleAnswer = (index: number) => {
    setRevealedAnswers(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const desktopAnimation = { 
    x: 0, 
    opacity: 1,
    height: isMinimized ? 'auto' : 'calc(100vh - 150px)',
    width: isMinimized ? '280px' : '400px',
    bottom: isMinimized ? 24 : 'auto',
    top: isMinimized ? 'auto' : 96,
    right: 24,
    position: 'fixed' as const
  };

  const mobileAnimation = {
    x: 0,
    y: 0,
    opacity: 1,
    height: isMinimized ? '80px' : '85vh',
    width: '100vw',
    bottom: 0,
    top: 'auto',
    right: 0,
    position: 'fixed' as const,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]" ref={constraintsRef}>
      <motion.div 
        drag={isMobile ? false : true}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
        animate={isMobile ? mobileAnimation : desktopAnimation}
        exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] pointer-events-auto"
      >
        <div className={`flex-1 bg-[#0c0d10]/95 backdrop-blur-2xl border border-white/10 rounded-t-2xl ${!isMobile ? 'rounded-b-2xl' : ''} flex flex-col overflow-hidden relative transition-all duration-500`}>
          {/* Glow Effects */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent opacity-50" />
          {!isMinimized && !isMobile && <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00d1ff]/10 blur-[100px] rounded-full" />}
          
          {/* Header - Drag Handle */}
          <div 
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button')) {
                return;
              }
              if (!isMobile) {
                dragControls.start(e);
              }
            }}
            onClick={() => isMobile && isMinimized && setIsMinimized(false)}
            className={`p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] ${isMobile && isMinimized ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-grab active:cursor-grabbing'} touch-none shrink-0`}
          >
            <div className="flex items-center gap-3">
              <div className={`relative p-2 rounded-lg transition-all duration-500 ${isSpeaking ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'bg-white/5 text-[#8e9299]'}`}>
                {isMinimized ? <Volume2 size={14} /> : (isSpeaking ? <Mic2 size={16} className="animate-pulse" /> : <VolumeX size={16} />)}
              </div>
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Terminal size={10} className="text-[#00d1ff]" />
                    <span className="text-[8px] font-mono text-[#00d1ff] uppercase tracking-[0.2em] font-bold">{isMinimized ? 'Lecture_Paused' : 'Module_Active'}</span>
                  </div>
                  <h2 className="text-xs font-bold text-white tracking-tight leading-tight truncate max-w-[150px] sm:max-w-[240px]">{lecture.title}</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 select-none text-white">
              {isMinimized && (
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    isSpeaking ? stop() : speak(lecture.script, voiceAccent); 
                  }}
                  className="w-11 h-11 rounded-lg flex items-center justify-center bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20 hover:bg-[#00d1ff]/20 transition-all active:scale-95 shrink-0 mr-1"
                  title={isSpeaking ? "Pause" : "Play"}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
              )}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-[#8e9299] hover:text-white transition-colors shrink-0"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); stop(); onClose(); }}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-[#8e9299] hover:text-red-400 transition-colors shrink-0"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
  
          <AnimatePresence>
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {/* Visualizer Area */}
                <div className="h-12 border-b border-white/5 bg-black/40 flex items-center justify-center overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00d1ff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  <RealAudioVisualizer isSpeaking={isSpeaking} getAnalyserData={narrator.getAnalyserData} />
                </div>
  
                {/* content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth">
                  <AnimatePresence mode="wait">
                    {!showAssessment ? (
                      <motion.div 
                        key="script"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <VisualViewport 
                          lecture={lecture} 
                          currentParagraphIndex={currentParagraphIndex} 
                          isSpeaking={isSpeaking} 
                        />

                        <div className="flex items-center gap-3 py-2 border-y border-white/5">
                          <Activity size={14} className="text-[#ffd700]" />
                          <span className="text-[10px] font-bold text-[#ffd700] uppercase tracking-widest">{lecture.category} PATHWAY</span>
                        </div>

                        <div className="space-y-6">
                          {paragraphs.map((para, i) => (
                            <motion.div 
                              key={i} 
                              className="text-[14px] leading-relaxed font-sans font-medium transition-all duration-700 relative"
                              animate={{ 
                                opacity: isSpeaking ? (currentParagraphIndex === i ? 1 : 0.4) : 1,
                                x: isSpeaking && currentParagraphIndex === i ? 8 : 0,
                                color: isSpeaking && currentParagraphIndex === i ? '#ffffff' : '#8e9299'
                              }}
                            >
                              {currentParagraphIndex === i && (
                                <motion.div 
                                  layoutId="para-indicator"
                                  className="absolute -left-4 top-0 bottom-0 w-1 bg-[#00d1ff] rounded-full shadow-[0_0_10px_#00d1ff]"
                                />
                              )}
                              {para.trim()}
                            </motion.div>
                          ))}
                        </div>

                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAssessment(true)}
                          className="w-full mt-12 py-4 bg-[#00d1ff] text-black rounded-xl text-[11px] uppercase font-black tracking-[0.2em] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all flex items-center justify-center gap-3 group"
                        >
                          Knowledge Validation <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="assessment"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-8">
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                            <HelpCircle size={14} className="text-[#00d1ff]" /> Assessment Mode
                          </h3>
                          <p className="text-[10px] text-[#8e9299]">Validate your physics comprehension to proceed.</p>
                        </div>

                        {lecture.assessment.map((item, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                            className="group"
                          >
                            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 group-hover:border-white/20 transition-all cursor-pointer" onClick={() => toggleAnswer(i)}>
                              <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#8e9299] group-hover:text-white transition-colors">
                                  0{i + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-[13px] font-semibold text-white mb-4 leading-snug">{item.question}</div>
                                  
                                  <AnimatePresence>
                                    {revealedAnswers.includes(i) ? (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 p-4 bg-[#00d1ff]/10 rounded-xl border border-[#00d1ff]/20 flex gap-3">
                                          <CheckCircle2 size={16} className="text-[#00d1ff] shrink-0 mt-0.5" />
                                          <div className="text-[13px] text-[#00d1ff] font-medium italic">{item.answer}</div>
                                        </div>
                                      </motion.div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-[#8e9299] group-hover:text-[#00d1ff] transition-colors tracking-widest uppercase">
                                        Click to verify <ChevronRight size={12} />
                                      </div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        <button 
                          onClick={() => setShowAssessment(false)}
                          className="w-full mt-8 py-3 text-[10px] text-[#8e9299] hover:text-white transition-all uppercase tracking-[0.2em] font-bold"
                        >
                          Retake Lecture
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Area with Controls */}
                <div className="p-4 border-t border-white/5 bg-black/60 relative">
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#00d1ff] shadow-[0_0_10px_#00d1ff]"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'linear' }}
                    />
                  </div>

                  {/* Accent Selector Segmented Control */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest">Presenter Squad Voice</span>
                      <span className="text-[9px] font-mono text-yellow-500 font-bold">
                        {voiceAccent === 'british' ? '🇬🇧 AGENT SARAH (DOPPLER OP)' :
                         voiceAccent === 'bourdain' ? '🎙️ AGENT JACK (ACOUSTIC CMD)' :
                         voiceAccent === 'sedaris' ? '🎯 TUTOR R (MECH AI)' :
                         '👤 AGENT MARCUS (PULSE ENG)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {[
                        { id: 'neutral', short: 'Marcus (Pulse)' },
                        { id: 'british', short: 'Sarah (Doppler)' },
                        { id: 'bourdain', short: 'Jack (Cmdr)' },
                        { id: 'sedaris', short: 'Tutor R' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateVoiceAccent(item.id as any)}
                          className={`py-1.5 px-0.5 rounded-lg text-[8px] font-mono font-bold uppercase transition-all tracking-wider text-center cursor-pointer ${voiceAccent === item.id ? 'bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.3)] border-none' : 'text-[#8e9299] hover:text-white hover:bg-white/5 border-none'}`}
                        >
                          {item.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest">Playback Output</span>
                      <span className="text-[10px] font-mono text-white/80">{isSpeaking ? 'TRANSMITTING...' : 'IDLE_WAIT'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); stop(); speak(lecture.script, voiceAccent); }}
                        className="w-11 h-11 rounded-lg bg-white/5 text-[#8e9299] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                        title="Restart"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); isSpeaking ? stop() : speak(lecture.script, voiceAccent); }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSpeaking ? 'bg-[#00d1ff]/25 text-[#00d1ff] border border-[#00d1ff]/40 shadow-[0_0_12px_rgba(0,209,255,0.15)]' : 'bg-[#00d1ff] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)] active:scale-95'}`}
                      >
                        {isSpeaking ? <VolumeX size={20} /> : <Play size={20} className="ml-0.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
