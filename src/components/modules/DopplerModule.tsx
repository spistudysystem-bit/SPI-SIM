import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, Video, Volume2, VolumeX, Flame, Activity, Gauge, Sliders, Info, Zap, RotateCcw, Heart, ShieldAlert, BookOpen, Search, Sparkles, Book, CheckCircle2, Maximize2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import RotaryKnob from '../shared/RotaryKnob';

interface DopplerModuleProps {
  dopplerShift: number;
  dopplerAngle: number;
  bloodVelocity: number;
  flowType: string;
  dopplerSpectrum: any[];
  setViewMode?: (mode: any) => void;
}

interface VascularPreset {
  id: string;
  name: string;
  vmax: number; // m/s peak velocity
  flow: 'laminar' | 'turbulent';
  resistance: 'high' | 'low';
  direction: 'forward' | 'reverse';
  description: string;
}

const PRESETS: VascularPreset[] = [
  { id: 'laminar', name: 'Normal Carotid Artery', vmax: 1.1, flow: 'laminar', resistance: 'low', direction: 'forward', description: 'Normal low-resistance profile. Elegant parabolic laminar flow with clear, open spectral window beneath the envelope.' },
  { id: 'moderate', name: 'Moderate Carotid Stenosis', vmax: 2.1, flow: 'turbulent', resistance: 'low', direction: 'forward', description: 'Moderate narrowing of the vessel lumen. Friction increases peak velocity with onset of mild turbulent spectral broadening.' },
  { id: 'severe', name: 'Severe Stenosis (Jet Flow)', vmax: 3.8, flow: 'turbulent', resistance: 'low', direction: 'forward', description: 'Critical lumen obstruction. Extreme velocity jet exceeding default Nyquist. Massive turbulence and complete spectral window filling.' },
  { id: 'reversed', name: 'Subclavian Steal (Right Vertebral Artery)', vmax: 0.9, flow: 'laminar', resistance: 'high', direction: 'forward', description: 'Retrograde (reverse) flow runs in the right vertebral artery to supply the ipsilateral arm due to a proximal subclavian artery occlusion. Waveform displays on top of the baseline (inverted) for optimal medical assessment.' }
];

interface StudyItem {
  id: string;
  category: string;
  subCategory: string;
  q: string;
  a: string;
  formula?: string;
  concept?: string;
  alert?: string;
  actionId?: string;
  interactLabel?: string;
}

const spiStudyBank: StudyItem[] = [
  // SECTION I
  {
    id: 'freq_unit',
    category: "I. Acoustics & Waves",
    subCategory: "Basic Wave Parameters",
    q: "What is the unit of frequency and how does it apply to ultrasound diagnostics?",
    a: "The unit of frequency is Hertz (Hz), which represents cycles per second. In diagnostic ultrasound, we use Megahertz (1 MHz = 10⁶ Hz) since clinical ultrasound frequencies typically range from 1 to 15 MHz.",
    concept: "Lower frequency waves provide deeper physical tissue penetration but reduced spatial detail representation. Higher frequencies yield shorter wavelengths, boosting detail but absorbing faster.",
    alert: "SPI registry favorite: Frequency is determined solely by the acoustic transmitter source (crystal thickness). It does NOT change when crossing tissue interfaces!"
  },
  {
    id: 'period_calc',
    category: "I. Acoustics & Waves",
    subCategory: "Wave Relationships",
    q: "How do you calculate the period of an ultrasound wave, and how are period and frequency related?",
    formula: "T = 1 / f",
    a: "Period (T) and frequency (f) are mathematical reciprocals: T = 1/f. For a wave with a frequency of 2 MHz, wave period is T = 1 / 2,000,000 = 0.5 microseconds (μs).",
    concept: "Higher frequency automatically yields a shorter period; lower frequency yields a longer period.",
    alert: "Remember, direct mathematical calculation is rarely requested on the SPI. Instead, master the inverse relationship: if frequency is doubled, period is cut exactly in half!"
  },
  {
    id: 'wavelength_calc',
    category: "I. Acoustics & Waves",
    subCategory: "Wavelength and Detail",
    q: "What is the wavelength of an ultrasound wave traveling at 1540 m/s with a frequency of 1 MHz?",
    formula: "λ = c / f",
    a: "Wavelength (λ) corresponds to tissue wave velocity (c) divided by frequency (f). For a 1 MHz wave in an average soft tissue medium (1540 m/s): λ = 1540 / 1,000,000 = 1.54 mm.",
    concept: "Wavelength is determined by BOTH the sound source (frequency) and the medium's propagation speed. Shorter wavelengths improve axial resolution but reduce depth penetration.",
    alert: "This inverse relationship is why high-frequency transducers provide superb axial detail for superficial vessels, but have poor penetration.",
    actionId: 'laminar_parabolic',
    interactLabel: "Demonstrate Parabolic Detail"
  },
  {
    id: 'amplitude_def',
    category: "I. Acoustics & Waves",
    subCategory: "Wave Amplitude",
    q: "Define amplitude in the context of diagnostic sound waves.",
    a: "Amplitude is the maximum displacement of an acoustic particle from its baseline equilibrium state. It represents the maximum difference between pressure peak and ambient pressure, directly governing sound intensity and power.",
    concept: "As sound propagates through tissue, its pressure amplitude steadily decays due to path absorption.",
    alert: "Warning: Wave power and intensity are proportional to the SQUARE of the amplitude. Doubling wave amplitude increases intensity by 4 times (2² = 4)!"
  },
  {
    id: 'power_intensity',
    category: "I. Acoustics & Waves",
    subCategory: "Power and Intensity Rules",
    q: "What is the physical relationship between Wave Power and Intensity in tissue?",
    formula: "Intensity = Power / Area",
    a: "Intensity (I) is the concentration of power (P) distributed across a beam width area (A). If the transmitter power is doubled or if the beam is focused (reducing area), intensity spikes dynamically.",
    concept: "Intensity is directly proportional to power. If beam area remains constant, doubling the power doubles the intensity.",
    alert: "SPI Registry Prompt: Remember that Power and Intensity are proportional to Amplitude squared. If the power of a sound wave is doubled, the intensity is doubled."
  },
  {
    id: 'wave_eq_main',
    category: "I. Acoustics & Waves",
    subCategory: "The General Wave Equation",
    q: "Write the general wave propagation equation, defining every variable.",
    formula: "v = f · λ",
    a: "The wave propagation equation states that sound speed (v) equals frequency (f) multiplied by wavelength (λ). In any specific tissue medium (e.g. liver, blood), propagation speed is fixed, meaning frequency and wavelength are strictly inversely related.",
    concept: "Operating frequency is set by the sound source, while velocity is determined by the medium. Wavelength is calculated from both.",
    alert: "If the transducer's frequency changes, wavelength adapts automatically. But wave velocity (c) is unaffected because it is determined solely by tissue properties!"
  },
  {
    id: 'avg_velocity',
    category: "I. Acoustics & Waves",
    subCategory: "Soft Tissue Velocity Constants",
    q: "What is the average velocity of ultrasound in soft tissue, and why is it important?",
    a: "The average speed of diagnostic sound in human soft tissue is hardcoded as 1540 m/s (or 1.54 mm/μs). It serves as the baseline calibration constant for diagnostic machines to compute reflector depths.",
    concept: "Sound speed varies slightly in different biological media: Fat (1450 m/s), Liver (1560 m/s), Muscle (1580 m/s), and Bone (3500 m/s).",
    alert: "SPI Alert: If sound travels through a medium slower than 1540 m/s (like fat), the system takes longer to receive the echo. It assumes the reflector is deeper than it actually is, causing speed error displacement!"
  },
  {
    id: 'wave_types_diff',
    category: "I. Acoustics & Waves",
    subCategory: "Longitudinal vs Transverse Waves",
    q: "Differentiate between longitudinal waves and transverse waves.",
    a: "In longitudinal waves, particles vibrate parallel to the direction of wave propagation. In transverse (shear) waves, particle vibration is perpendicular to wave travel. Medical ultrasound consists of longitudinal waves. Sound waves in fluids, gases, and tissues are exclusively longitudinal.",
    concept: "Compressions (high pressure/density) and rarefactions (low pressure/density) occur along the beam axis.",
    alert: "Sound cannot propagate in a vacuum because it is a mechanical pressure wave that requires a physical medium to vibrate."
  },
  {
    id: 'cw_vs_pw',
    category: "I. Acoustics & Waves",
    subCategory: "Diagnostic Pulsing Modalities",
    q: "Contrast Continuous Wave (CW) vs Pulsed Wave (PW) ultrasound.",
    a: "Continuous Wave (CW) uses two distinct crystals: one constantly transmits, while the other constantly receives. It has no range resolution but is immune to aliasing. Pulsed Wave (PW) transmits short sound bursts then 'listens' for echoes, providing precise depth range resolution but suffers from sampling limits (aliasing).",
    concept: "Most standard diagnostic imaging (B-mode) utilizes pulsed waves to register anatomical depth.",
    alert: "CW has a duty factor of 100% (1.0), whereas PW imaging has a duty factor of less than 1% (0.01) — meaning the system spends 99% of its time listening!",
    actionId: 'laminar_parabolic',
    interactLabel: "Compare Doppler Modes"
  },
  {
    id: 'acoustic_impedance',
    category: "I. Acoustics & Waves",
    subCategory: "Boundary Reflection",
    q: "Define acoustic impedance, list its formula, and state its clinical units.",
    formula: "Z = ρ · v",
    a: "Acoustic impedance (Z) is a tissue's physical resistance to sound wave travel. It is equal to tissue density (ρ) multiplied by sound propagation speed (v). Calculated in units of Rayls.",
    concept: "Echoes are created exclusively at boundaries where mismatched acoustic impedances meet.",
    alert: "A massive mismatch (e.g. tissue to air or tissue to bone) creates total reflection and acoustic shadowing, making sound transmission impossible without coupling gel!"
  },
  {
    id: 'bulk_modulus_speed',
    category: "I. Acoustics & Waves",
    subCategory: "Medium Mechanics",
    q: "How do bulk modulus and tissue density affect sound propagation velocity?",
    formula: "v = √(B / ρ)",
    a: "Bulk modulus is a material's resistance to compression (stiffness). Higher bulk modulus increases propagation velocity speed. Increased density acts to slow sound down.",
    concept: "Compact, stiff, dense media like bone propagate sound waves extremely quickly (high bulk modulus dominates over density).",
    alert: "Stiffness and bulk modulus are directly related; compressibility is their reciprocal. Therefore, highly compressible media (like air) exhibit very slow speed."
  },
  {
    id: 'rayleigh_scattering_RBC',
    category: "I. Acoustics & Waves",
    subCategory: "Blood Scatter Mechanics",
    q: "Define Rayleigh Scattering, including its primary clinical source.",
    formula: "Scattering ∝ f⁴",
    a: "Rayleigh scattering occurs when a wave interacts with targets much smaller than the wavelength (e.g. red blood cells). Rather than reflecting specularly, the acoustic wave is scattered uniformly in all directions.",
    concept: "Rayleigh scattering is heavily dependent on operating frequency. High-frequency transducers detect RBC flow with greater SNR.",
    alert: "SPI Favorite: Red blood cells scatter sound in a Rayleigh pattern. Doubling operating frequency increases scattering strength 16-fold (2⁴ = 16)!"
  },
  {
    id: 'axial_resolution_big',
    category: "I. Acoustics & Waves",
    subCategory: "Resolution Priorities",
    q: "What is Axial Resolution and how is it optimized for the registry?",
    formula: "Axial Res ≈ SPL / 2",
    a: "Axial resolution is the capability to distinguish two parallel structures along the sound beam's axis (depth). It is optimized by: Higher frequency (shorter wavelength), broader bandwidth, and active backing damping.",
    concept: "Axial resolution is constant with depth. Shorter pulse duration is the key to excellent detail representation.",
    alert: "Active transducer backing dampens element ring-down, shortening the spatial pulse length (SPL) and duty factor for fine axial separation."
  },
  {
    id: 'lateral_resolution_focal',
    category: "I. Acoustics & Waves",
    subCategory: "Resolution Priorities",
    q: "Define Lateral Resolution, including its main differences from Axial.",
    a: "Lateral resolution is the capability to resolve two structures side-by-side (perpendicular to the beam axis). Unlike axial resolution, lateral resolution varies directly with depth, and is sharpest at the beam's focal zone.",
    concept: "Lateral resolution is equal to the local beam width. Narrower beam = superior lateral resolution.",
    alert: "Improving lateral resolution requires electronic focusing (changing aperture or array delay curves) to narrow the focal zone.",
    actionId: 'laminar_parabolic',
    interactLabel: "Focus Lateral Detail"
  },
  {
    id: 'elevational_temporal_rest',
    category: "I. Acoustics & Waves",
    subCategory: "Resolution Priorities",
    q: "Explain Elevational and Temporal Resolutions and state their clinical significance.",
    a: "Elevational resolution (slice thickness) is determined perpendicular to the scan plane, governing partial volume distortions. Temporal resolution represents real-time performance (frame rate). High frame rate requires fewer focal zones, narrow sectors, and shallow depths.",
    concept: "Temporal resolution is critical when evaluating active cardiac structures or fast blood jets.",
    alert: "Adding multiple focal zones significantly worsens temporal resolution because the system must send multiple pulses along each scan line!"
  },

  // SECTION II
  {
    id: 'pzt_transducers',
    category: "II. Ultrasound Transducers",
    subCategory: "Piezoelectricity Principles",
    q: "Explain the Piezoelectric Effect and describe standard transducer elements.",
    a: "Piezoelectricity is when particular crystals generate a voltage when mechanically stressed (direct effect). The reverse effect generates sound waves when voltage is applied (pulsed transmission). The standard crystal used is Lead Zirconate Titanate (PZT).",
    concept: "Curie Point (300°C) is the temperature at which PZT loses its polarization. AUTOCLAVING destroys probes!",
    alert: "Damping backing materials are attached behind PZT to shorten pulse duration. This improves axial detail, but reduces sensitivity."
  },
  {
    id: 'trans_components',
    category: "II. Ultrasound Transducers",
    subCategory: "Shielding & Matching",
    q: "Explain the purpose of the element matching layer and the transducer casing.",
    a: "The Matching Layer reduces impedance mismatch between PZT and patient tissue, maximizing sound entry. It is designed to be exactly 1/4 wavelength thick. The casing/casing shield prevents electrical shock, isolates internal noise, and provides support.",
    concept: "Impedance order is: PZT > Matching Layer > Coupling Gel > Skin.",
    alert: "Never operate an ultrasound probe with a cracked or compromised outer matching casing, as it exposes the patient to high-voltage shock and causes major image artifacts!"
  },
  {
    id: 'beam_div_nzl',
    category: "II. Ultrasound Transducers",
    subCategory: "Near Field and Far Field",
    q: "Describe near zone (Fresnel) and far zone (Fraunhofer) beam profiles.",
    formula: "NZL = D² · f / 6",
    a: "The Near Zone Length is where the sound beam stays narrow and parallel. Beyond the focal spot, the beam diverges in the Far Field. Larger crystal diameter (D) or higher frequency (f) yields a longer NZL with less beam divergence.",
    concept: "Lateral resolution is optimal in the focal zone, which sits exactly at the transition between near and far zones.",
    alert: "At the focal point of an unfocused single-element transducer, the beam width is exactly HALF of the original transducer crystal's diameter!"
  },

  // SECTION III
  {
    id: 'pulse_parameters_cycle',
    category: "III. Pulse-Echo Principles",
    subCategory: "Pulse Chronometry Parameters",
    q: "Define Pulse Duration, Pulse Repetition Period, and Duty Factor.",
    formula: "Duty Factor = PD / PRP",
    a: "Pulse Duration (PD) is the 'on' time. Pulse Repetition Period (PRP) is 'on' plus 'listening' time. Duty Factor is the transmitted energy ratio. For standard B-mode, the duty factor is extremely low (<1%), meaning the probe listens for 99% of its total time.",
    concept: "PRP is determined solely by the depth selection setting, NOT by the crystal properties.",
    alert: "To improve temporal resolution and avoid aliasing, sonographers must reduce depth, which increases PRF and shortens the listening PRP.",
    actionId: 'prf_low',
    interactLabel: "Demonstrate Aliasing"
  },
  {
    id: 'reflection_types_spec',
    category: "III. Pulse-Echo Principles",
    subCategory: "Reflection Mechanics",
    q: "Contrast Specular Reflection vs Diffuse Scattering.",
    a: "Specular reflection occurs when waves strike large, smooth, flat boundaries (e.g., diaphragm). Reflections are strong, and highly dependent on the beam's angle. Diffuse scattering occurs at small, complex interfaces, reflecting sound weakly in multiple directions.",
    concept: "Specular reflections are best imaged when the beam strikes at exactly 90 degrees (perpendicular incidence).",
    alert: "Diffuse blood-cell scattering (Rayleigh patterns) is nearly independent of the incident angle, allowing directional Doppler readings."
  },

  // SECTION IV
  {
    id: 'atten_tissue_freq',
    category: "IV. Attenuation & Tissue",
    subCategory: "System Losses",
    q: "How does attenuation change with path length, operating frequency, and tissue types?",
    formula: "Loss (dB) = α · Depth (cm) · f (MHz)",
    a: "Total attenuation increases proportionally with tissue thickness and operating frequency. Sound attenuates extremely fast in air, fast in bone (3.0 dB/cm/MHz), moderately in soft tissue (0.5 dB/cm/MHz), and extremely slowly in simple fluids.",
    concept: "TGC slider adjustments directly compensate for depth-related exponential signal attenuation.",
    alert: "Because attenuation doubles when you double your frequency, deep organ scanning requires low-frequency probes (2-5 MHz)!"
  },
  {
    id: 'refraction_snell_law',
    category: "IV. Attenuation & Tissue",
    subCategory: "Refraction Mechanics",
    q: "State Snell's Law and outline refraction prerequisites.",
    formula: "sin θ_t / sin θ_i = v_2 / v_1",
    a: "Refraction is the bending of sound across boundaries. Prerequisites are: (1) Non-perpendicular, oblique incidence (θ ≠ 90°), and (2) Mismatched propagation speeds (v₁ ≠ v₂) between media.",
    concept: "Refraction creates artifacts like lateral displacement and shadow lines at curved borders.",
    alert: "If propagation speed decreases (v₂ < v₁), the transmission angle bends close to the perpendicular line (θ_t < θ_i)."
  },

  // SECTION V
  {
    id: 'five_rec_functions',
    category: "V. Instrumentation",
    subCategory: "The Processor Chain",
    q: "Explain the Receiver's five major functions in sequential order.",
    a: "Receiver functions must follow the standard operational pipeline: Amplification, Compensation (TGC), Compression (Dynamic Range), Demodulation (Rectify & Smooth), and Reject.",
    concept: "Amplification boosts all echoes equally. Compensation adjusts intensity losses with depth. Compression reduces contrast ranges for displays.",
    alert: "Demodulation is a fixed hardware filter process (converting AC voltage to DC envelopes). It CANNOT be adjusted by the operator!",
    actionId: 'wall_filter_high',
    interactLabel: "Demonstrate Reject Limit"
  },
  {
    id: 'beamformer_element',
    category: "V. Instrumentation",
    subCategory: "Aperture Controls",
    q: "Explain the role of the Beamformer and Apodization in medical arrays.",
    a: "The Beamformer controls element delay sequences for steering and dynamic receive focusing. Apodization changes element excitation voltage amplitudes from center to edges of the transducer, minimizing unwanted grating artifacts.",
    concept: "Pulsing delays shape the output wave, while receive delays focus incoming signals.",
    alert: "Grating/Side Lobes project false echo structures into the margins. Apodization and subdicing elements mitigate this issue completely."
  },

  // SECTION VII
  {
    id: 'alara_bioeffects_output',
    category: "⚕️ Safety & QA",
    subCategory: "Acoustic Bioeffects",
    q: "Specify the ALARA concept and compare Transmit Power vs Receiver Gain.",
    a: "ALARA (As Low As Reasonably Achievable) is the core guideline to minimize bioeffects. Transmit Output Power changes acoustic wave intensity entering the patient. Receiver Gain simply amplifies existing echoes electronically inside the system.",
    concept: "Output Power raises dose exposure. Receiver Gain never alters biosafety indexes.",
    alert: "Clinical rule: If an image is too dark, first change Receiver Gain. If an image is too bright, first lower Transmit Power to protect the tissue!",
    actionId: 'power_high',
    interactLabel: "Acoustic Safety Check"
  },
  {
    id: 'cavitation_mi_ti',
    category: "⚕️ Safety & QA",
    subCategory: "Dosimetry & Quality",
    q: "Explain Thermal (TI) and Mechanical (MI) Indices and list the FDA intensity limits.",
    formula: "Limit: I_SPTA = 720 mW/cm²",
    a: "Thermal Index (TI) measures heat exposure risk. Mechanical Index (MI) measures cavitation risk (expansion/vibration of microbubbles). Cavitation includes Stable cavitation and violent, destructive Inertial cavitation.",
    concept: "Mechanical index is highest with strong negative pressures and low-frequency probes.",
    alert: "FDA limits peak spatial-peak temporal-average intensity (I_SPTA) to 720 mW/cm² for adult diagnostic scanning."
  }
];

export default function DopplerModule({
  dopplerShift: propDopplerShift,
  dopplerAngle: propDopplerAngle,
  bloodVelocity: propBloodVelocity,
  flowType: propFlowType,
  dopplerSpectrum: propDopplerSpectrum,
  setViewMode
}: DopplerModuleProps) {
  // 1. Diagnostic Scanner Modes
  const [activeTab, setActiveTab] = useState<'spectral' | 'color'>('spectral');
  const [activePreset, setActivePreset] = useState<VascularPreset>(PRESETS[0]);
  const [dopplerMode, setDopplerMode] = useState<'pw' | 'cw'>('pw'); // PW vs CW Doppler select state
  const [autoScale, setAutoScale] = useState<boolean>(false); // Automatically scale PRF based on peak velocity to prevent aliasing

  // 2. Interactive Local Knobs/Parameters (Initialized from props, fully interactive)
  const [dopplerAngle, setDopplerAngle] = useState(propDopplerAngle);
  const [prfKHz, setPrfKHz] = useState(5.0); // PRF scale: 1.0 to 10.0 kHz
  const [baselineShift, setBaselineShift] = useState(0.0); // -0.8 to +0.8 shift
  const [wallFilterHz, setWallFilterHz] = useState(150); // 20 to 800 Hz wall filter
  const [dopplerGain, setDopplerGain] = useState(70); // 10% to 100% visual gain
  const [gateSize, setGateSize] = useState(2.5); // 1.5mm to 8.0mm Sample volume gate size
  const [gateDepth, setGateDepth] = useState<number>(0); // -20 to +20px sample gate depth offset
  const [spectralInvert, setSpectralInvert] = useState<boolean>(false); // Invert display channels +/-
  const [isFrozen, setIsFrozen] = useState<boolean>(false); // Freeze spectrogram stream
  const [caliperPSVY, setCaliperPSVY] = useState<number | null>(null); // Canvas Y for Caliper 1
  const [caliperEDVY, setCaliperEDVY] = useState<number | null>(null); // Canvas Y for Caliper 2
  const [activeCaliper, setActiveCaliper] = useState<'psv' | 'edv' | null>(null); // Placing state
  const [colorSteer, setColorSteer] = useState(-20); // -20, 0, 20 degrees steered color box
  const [heartRateBPM, setHeartRateBPM] = useState<number>(75); // Heart Rate pacing: 45 to 135
  const [colorMapMode, setColorMapMode] = useState<'velocity' | 'variance' | 'power'>('velocity'); // Velocity vs Variance vs Power Doppler

  // Audio synthesize parameters
  const [speakerOn, setSpeakerOn] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(50);

  // 3. Advanced Diagnostic & Safety Parameters
  const [acousticPower, setAcousticPower] = useState<number>(100); // 10% to 100% Acoustic output power
  const [autoEnvelope, setAutoEnvelope] = useState<boolean>(true); // Draw peak velocity envelope
  const [sweepSpeed, setSweepSpeed] = useState<number>(2); // 1 (Slow), 2 (Normal), 4 (Fast) scroll sweep speed
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [hoverCaliperVal, setHoverCaliperVal] = useState<number | null>(null);

  // Scrolling profile peak history coordinates
  const traceHistoryRef = useRef<number[]>(new Array(480).fill(0));

  // Time & Animation counters
  const [currentTime, setCurrentTime] = useState(0);
  const requestRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);

  // Canvases refs
  const pwBackgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const pwScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const pwFFTCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevEcgYRef = useRef<number | null>(null);
  const lastActiveIntensitiesRef = useRef<Float32Array | null>(null);

  const [isDraggingAngle, setIsDraggingAngle] = useState(false);
  const [isDraggingCanvasAngle, setIsDraggingCanvasAngle] = useState(false);
  const [knobCategory, setKnobCategory] = useState<'transducer' | 'signal' | 'safety'>('transducer');
  const [selectedHelpKnob, setSelectedHelpKnob] = useState<string>('angle');

  const [rightPanelMode, setRightPanelMode] = useState<'console' | 'study'>('console');
  const [studySearchQuery, setStudySearchQuery] = useState('');
  const [expandedStudyCard, setExpandedStudyCard] = useState<string | null>(null);
  const [selectedStudyCategory, setSelectedStudyCategory] = useState<string>('All');

  const applyStudyScenario = (actionId?: string) => {
    if (!actionId) return;
    switch (actionId) {
      case 'angle_high':
        setDopplerAngle(80);
        setSelectedHelpKnob('angle');
        setKnobCategory('transducer');
        break;
      case 'prf_low':
        setPrfKHz(1.5);
        setAutoScale(false);
        setDopplerMode('pw');
        setSelectedHelpKnob('prf');
        setKnobCategory('signal');
        break;
      case 'baseline_shift':
        setBaselineShift(-0.4);
        setSelectedHelpKnob('baseline');
        setKnobCategory('signal');
        break;
      case 'wall_filter_high':
        setWallFilterHz(600);
        setSelectedHelpKnob('wallfilter');
        setKnobCategory('signal');
        break;
      case 'gatedepth_deep':
        setGateDepth(12);
        setDopplerMode('pw');
        setSelectedHelpKnob('gatedepth');
        setKnobCategory('transducer');
        break;
      case 'power_high':
        setAcousticPower(100);
        setDopplerGain(35); // Poor signal, violates ALARA guidelines
        setSelectedHelpKnob('power');
        setKnobCategory('safety');
        break;
      case 'laminar_parabolic':
        handleApplyPreset(PRESETS[0]); // Carotid Artery Normal
        break;
      case 'severe_jet':
        handleApplyPreset(PRESETS[2]); // Severe Stenosis jet
        setDopplerMode('pw');
        setPrfKHz(3.0); // aliased!
        setAutoScale(false);
        break;
    }
  };

  const knobHelpDb: Record<string, { name: string; formula: string; concept: string; alert: string }> = {
    angle: {
      name: "Doppler Angle Correction (θ)",
      formula: "Fd = (2 · f0 · v · cos θ) / c",
      concept: "Aligns the math with biological flow direction. Translates raw frequency shift into correct directional velocity on screen.",
      alert: "SPI registry favorite! Cosine relationship error spikes above 60°. At 90 degrees, shift is zero (cos 90 = 0). Keep angle θ strictly at 45°-60° for vessels.",
    },
    prf: {
      name: "Scale / Pulse Repetition Freq (PRF)",
      formula: "Nyquist Limit = ± PRF / 2",
      concept: "Specifies ultrasound pulse execution frequency. Determines the speed boundaries of the visual spectrogram.",
      alert: "If RBC shifts exceed half your PRF (Nyquist Limit), peak waveforms wrap around (aliasing). Fix by raising PRF scale or shifting baseline.",
    },
    gain: {
      name: "Doppler Receiver Gain (Rx)",
      formula: "V_out = V_in · Gain amplification",
      concept: "Amplifies returning electrical echoes post-receive. Brightens the spectrogram and boosts sound volume safely.",
      alert: "Tissues are not exposed to Gain! To obey ALARA, keep transmit Power low (≤50%) and compensate brightness using Receiver Gain.",
    },
    baseline: {
      name: "Baseline Offset Shift",
      formula: "Flow Range Shift Scale",
      concept: "Re-allocates display headroom above/below zero line to trace fast unidirectional streams without changing PRF.",
      alert: "Baseline shifting resolves unidirectional aliasing with NO depth penalty (unlike doubling PRF, which cuts maximum scanning depth!).",
    },
    wallfilter: {
      name: "Low Cutoff Wall Filter",
      formula: "High-Pass Cutoff (Hz)",
      concept: "Filters low-frequency, high-amplitude noise (clutter) from vessel wall thumping and probe respiratory motion.",
      alert: "Keep wall filters low (~50-100 Hz) to avoid cropping the End-Diastolic Velocity (EDV). Setting it too high will fabricate false diagnoses!",
    },
    gatedepth: {
      name: "Sample Volume Depth",
      formula: "Depth = (c · t) / 2 [13 μs/cm rule]",
      concept: "Specifies the precise anatomical depth from which the gated receiver samples RBC velocities in PW mode.",
      alert: "PW sample volume gives absolute path range resolution. But travel delay limits PRF, hence PW is prone to aliasing at extreme depths.",
    },
    gatesize: {
      name: "Doppler Gate Size (Volume)",
      formula: "Sample Gate Height (mm)",
      concept: "Defines the exact spatial length of the blood column sampled inside the vessel lumen.",
      alert: "A narrow gate (1.5-2mm) centered in flow measures laminar streams. A wide gate captures fast center and slower margins, causing false broader spectrals.",
    },
    power: {
      name: "Acoustic Transmit Power (Tx)",
      formula: "Power ∝ Voltage² [Direct Exposure]",
      concept: "Adjusts biological energy output fired into patient tissues. Governs Mechanical (MI) and Thermal (TI) Indexes.",
      alert: "SPI alert: Output power increases patient acoustic dose! Always keep as low as reasonably achievable (ALARA). Maximize Gain instead.",
    }
  };

  const handleDialInteraction = (clientX: number, clientY: number, containerRect: DOMRect) => {
    const cx = containerRect.left + containerRect.width / 2;
    const cy = containerRect.top + containerRect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    const beamAngleOnScreenRad = ((90 + colorSteer) * Math.PI) / 180;
    const mouseAngleOnScreenRad = Math.atan2(dy, dx);

    let diffAngleRad = Math.abs(mouseAngleOnScreenRad - beamAngleOnScreenRad);
    let diffAngleDeg = (diffAngleRad * 180) / Math.PI;
    diffAngleDeg = diffAngleDeg % 180;
    if (diffAngleDeg > 90) {
      diffAngleDeg = 180 - diffAngleDeg;
    }

    const newAngle = Math.min(85, Math.max(0, Math.round(diffAngleDeg)));
    setDopplerAngle(newAngle);
  };

  const onDialStart = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleDialInteraction(e.clientX, e.clientY, rect);
    setIsDraggingAngle(true);
  };

  const handleColorCanvasInteraction = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ((clientX - rect.left) / rect.width) * canvas.width;
    const my = ((clientY - rect.top) / rect.height) * canvas.height;

    const skew = Math.sin((colorSteer * Math.PI) / 180) * 40;
    const gateX = canvas.width / 2 + skew * 1.5;
    const gateY = canvas.height / 2 + gateDepth;

    const dx = mx - gateX;
    const dy = my - gateY;

    const beamAngleOnScreenRad = ((90 + colorSteer) * Math.PI) / 180;
    const mouseAngleOnScreenRad = Math.atan2(dy, dx);

    let diffAngleRad = Math.abs(mouseAngleOnScreenRad - beamAngleOnScreenRad);
    let diffAngleDeg = (diffAngleRad * 180) / Math.PI;
    diffAngleDeg = diffAngleDeg % 180;
    if (diffAngleDeg > 90) {
      diffAngleDeg = 180 - diffAngleDeg;
    }

    const newAngle = Math.min(85, Math.max(0, Math.round(diffAngleDeg)));
    setDopplerAngle(newAngle);
  };

  useEffect(() => {
    if (!isDraggingAngle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dialElement = document.getElementById('interactive-doppler-dial');
      if (!dialElement) return;
      const rect = dialElement.getBoundingClientRect();
      handleDialInteraction(e.clientX, e.clientY, rect);
    };

    const handleMouseUp = () => {
      setIsDraggingAngle(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingAngle, colorSteer]);

  useEffect(() => {
    if (!isDraggingCanvasAngle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = colorCanvasRef.current;
      if (!canvas) return;
      handleColorCanvasInteraction(e.clientX, e.clientY, canvas);
    };

    const handleMouseUp = () => {
      setIsDraggingCanvasAngle(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingCanvasAngle, colorSteer, gateDepth]);

  // Web Audio Synth references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const oscGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);

  // Physics context calculations
  const f0 = 4.0; // Transmit carrier frequency 4.0 MHz (standard diagnostic probe)
  const soundSpeed = 1540; // c = 1540 m/s in tissue/blood

  // Instantaneous hemodynamic profile generator synced to heart cycle
  const getVelocityAtPhase = (phase: number, preset: VascularPreset): number => {
    const directionMult = preset.direction === 'reverse' ? -1 : 1;
    const peakV = Math.abs(preset.vmax);

    let normEnvelope = 0.2;
    if (phase < 0.15) {
      // Systolic Acceleration (up to Peak)
      normEnvelope = 0.25 + (phase / 0.15) * 0.75;
    } else if (phase < 0.35) {
      // Deceleration down to dicrotic notch
      const p = (phase - 0.15) / 0.20;
      normEnvelope = 1.0 - p * 0.6; // decays to 0.4
    } else if (phase < 0.42) {
      // Notch bounce back slightly
      const p = (phase - 0.35) / 0.07;
      normEnvelope = 0.4 + p * 0.08;
    } else {
      // Diastolic decay (runoff)
      const p = (phase - 0.42) / 0.58;
      // High resistance vessels drop near zero during diastole; low resistance keeps high flow
      const endDiastolic = preset.resistance === 'high' ? 0.05 : 0.3;
      normEnvelope = 0.48 - p * (0.48 - endDiastolic);
    }

    return normEnvelope * peakV * directionMult;
  };

  // Convert blood velocity to Canvas Y coordinate (pixel) using the actual physical insonation angle
  const getCanvasYFromVelocity = (vel: number, h: number) => {
    const physicalCos = Math.abs(Math.cos(((90 - colorSteer) * Math.PI) / 180));
    let fd_s = (2 * (f0 * 1e6) * vel * physicalCos) / soundSpeed / 1000;
    if (spectralInvert) {
      fd_s = -fd_s;
    }
    const instNyquist = prfKHz / 2;
    const baselineY = h * (0.5 - baselineShift * 0.5);
    if (fd_s >= 0) {
      const ratio = Math.min(1.0, fd_s / instNyquist);
      return baselineY * (1 - ratio);
    } else {
      const ratio = Math.min(1.0, -fd_s / instNyquist);
      return baselineY + ratio * (h - baselineY);
    }
  };

  // Convert Canvas Y coordinate to blood velocity (m/s)
  const getVelocityFromCanvasY = (y: number, h: number) => {
    const instNyquist = prfKHz / 2;
    const baselineY = h * (0.5 - baselineShift * 0.5);
    let pixelKHz = 0;
    if (y <= baselineY) {
      const ratio = (baselineY - y) / Math.max(1, baselineY);
      pixelKHz = ratio * instNyquist;
    } else {
      const ratio = (y - baselineY) / Math.max(1, h - baselineY);
      pixelKHz = -ratio * instNyquist;
    }
    if (spectralInvert) {
      pixelKHz = -pixelKHz;
    }
    const cosVal = Math.cos((dopplerAngle * Math.PI) / 180);
    if (Math.abs(cosVal) < 0.01) return 0;
    const vel = (pixelKHz * 1000 * soundSpeed) / (2 * (f0 * 1e6) * cosVal);
    return vel;
  };

  // Trigger audio initialization on intent
  const initAudioEngine = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Stereo Panner Node for stereophonic directional sound separation
      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, ctx.currentTime);
        panner.connect(masterGain);
        pannerRef.current = panner;
      }

      // 1. Oscillator whistling core
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      
      const oscFilter = ctx.createBiquadFilter();
      oscFilter.type = 'bandpass';
      oscFilter.Q.setValueAtTime(14, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      if (panner) {
        oscGain.connect(panner);
      } else {
        oscGain.connect(masterGain);
      }

      osc.start();
      oscRef.current = osc;
      filterRef.current = oscFilter;
      oscGainRef.current = oscGain;

      // 2. White Noise turbulent machine
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.Q.setValueAtTime(4.0, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      if (panner) {
        noiseGain.connect(panner);
      } else {
        noiseGain.connect(masterGain);
      }

      noiseSrc.start();
      noiseSourceRef.current = noiseSrc;
      noiseFilterRef.current = noiseFilter;
      noiseGainRef.current = noiseGain;
    } catch (err) {
      console.error("Audio initialization problem: ", err);
    }
  };

  const handleSpeakerToggle = () => {
    initAudioEngine();
    setSpeakerOn(!speakerOn);
  };

  // Live Calculations of dynamic statistics
  const paceFactor = useMemo(() => heartRateBPM / 60, [heartRateBPM]);
  const currentPhase = (currentTime % 1.0);
  const currentV = getVelocityAtPhase(currentPhase, activePreset);
  const cosFactor = Math.cos((dopplerAngle * Math.PI) / 180);
  
  // High-accuracy medical physics: actual physical Doppler shift is determined by colorSteer angle
  const physicalInsonationAngle = 90 - colorSteer;
  const physicalCosFactor = Math.abs(Math.cos((physicalInsonationAngle * Math.PI) / 180)); // Equals -Math.sin(colorSteer)
  
  // Doppler Shift Equation: Fd = 2 * f0 * V * cos(theta_physical) / C
  const currentFdKHz = (2 * (f0 * 1e6) * currentV * physicalCosFactor) / soundSpeed / 1000;

  const nyquistKHz = prfKHz / 2;
  const maxVelocityPossibleAtNyquist = (nyquistKHz * 1000 * soundSpeed) / (2 * (f0 * 1e6) * Math.max(0.01, cosFactor));
  const isCurrentlyAliasing = dopplerMode === 'pw' && Math.abs(currentFdKHz) > nyquistKHz * (1 + Math.abs(baselineShift));

  // Derived caliper velocities (using current calibration math to remain stable and scale correctly)
  const caliperPSV = useMemo(() => {
    if (caliperPSVY === null) return null;
    return Math.abs(getVelocityFromCanvasY(caliperPSVY, 230));
  }, [caliperPSVY, dopplerAngle, prfKHz, baselineShift, spectralInvert]);

  const caliperEDV = useMemo(() => {
    if (caliperEDVY === null) return null;
    return Math.abs(getVelocityFromCanvasY(caliperEDVY, 230));
  }, [caliperEDVY, dopplerAngle, prfKHz, baselineShift, spectralInvert]);

  // Convert desired calculated velocity (m/s) back to canvas Y (pixel) using current calibration settings
  const getCanvasYFromVelocityCalibrated = (vel: number, h: number) => {
    const cosVal = Math.cos((dopplerAngle * Math.PI) / 180);
    let fd_s = (2 * (f0 * 1e6) * vel * cosVal) / soundSpeed / 1000;
    if (spectralInvert) {
      fd_s = -fd_s;
    }
    const instNyquist = prfKHz / 2;
    const baselineY = h * (0.5 - baselineShift * 0.5);
    if (fd_s >= 0) {
      const ratio = Math.min(1.0, fd_s / instNyquist);
      return baselineY * (1 - ratio);
    } else {
      const ratio = Math.min(1.0, -fd_s / instNyquist);
      return baselineY + ratio * (h - baselineY);
    }
  };

  const handleSetCaliperPSV = (vel: number) => {
    const yVal = getCanvasYFromVelocityCalibrated(vel, 230);
    setCaliperPSVY(yVal);
  };

  const handleSetCaliperEDV = (vel: number) => {
    const yVal = getCanvasYFromVelocityCalibrated(vel, 230);
    setCaliperEDVY(yVal);
  };

  // Automatically adjust Pulse Repetition Frequency (PRF) to prevent aliasing
  useEffect(() => {
    if (autoScale && dopplerMode === 'pw') {
      const physicalCos = Math.abs(Math.cos(((90 - colorSteer) * Math.PI) / 180));
      // Determine peak shift frequency for the absolute peak velocity of the preset based on physical insonation
      const peakFdValKHz = (2 * (f0 * 1e6) * Math.abs(activePreset.vmax) * physicalCos) / soundSpeed / 1000;
      
      // Safe PRF prevents aliasing: (PRF / 2) * (1 + |baselineShift|) > peakFdValKHz
      // Apply an elegant 1.25x margin to ensure complete spectrum clarity
      let idealPrf = (2 * peakFdValKHz * 1.25) / (1 + Math.abs(baselineShift));
      
      // Match workstation hardware limits [1.0 to 10.0 kHz]
      idealPrf = Math.max(1.0, Math.min(10.0, idealPrf));
      
      // Snap to nearest 0.5 kHz matching physical knobs
      idealPrf = Math.round(idealPrf * 2) / 2;
      
      setPrfKHz(idealPrf);
    }
  }, [autoScale, activePreset, colorSteer, baselineShift, dopplerMode, f0, soundSpeed]);

  // High performance visual render frames
  useEffect(() => {
    let lastRender = 0;

    const tick = (timestamp: number) => {
      if (!prevTimeRef.current) prevTimeRef.current = timestamp;
      const progress = (timestamp - prevTimeRef.current) / 1000;
      prevTimeRef.current = timestamp;

      // Cardiac pacing speed (scaled by heartRateBPM)
      if (!isFrozen) {
        setCurrentTime(prev => prev + progress * paceFactor);
      }

      // 1. RENDER PW SPECTRUM (Historical scroll trail pattern)
      if (activeTab === 'spectral') {
        const pwBg = pwBackgroundCanvasRef.current;
        const pwScr = pwScreenCanvasRef.current;

        if (pwBg && pwScr) {
          const bgCtx = pwBg.getContext('2d', { willReadFrequently: true });
          const scrCtx = pwScr.getContext('2d');

          if (bgCtx && scrCtx) {
            const h = pwBg.height;
            const w = pwBg.width;
            const instNyquist = prfKHz / 2;
            const baselineY = h * (0.5 - baselineShift * 0.5);

            if (!isFrozen) {
              const shiftAmount = sweepSpeed;
              // Shift existing spectrogram pixels by sweepSpeed to the left
              const imgData = bgCtx.getImageData(shiftAmount, 0, w - shiftAmount, h);
              bgCtx.putImageData(imgData, 0, 0);

              // Clear rightmost pixel slice & fill background
              bgCtx.fillStyle = '#060709';
              bgCtx.fillRect(w - shiftAmount, 0, shiftAmount, h);

              // Render continuous medical ECG trace along bottom margins
              const livePhase = ((timestamp / 1000) * paceFactor) % 1.0;
              const ecgHeightScale = 22; // 22px vertical span
              const ecgBaseline = h - 18; // drawn 18px above the bottom edge of canvas
              
              const getEcgValueAtPhase = (phase: number): number => {
                let val = 0.5; // baseline iso-electric line
                const p = phase % 1.0;
                if (p < 0.01) {
                  val = 0.5 - (p / 0.01) * 0.12; // Q
                } else if (p >= 0.01 && p < 0.035) {
                  val = 0.38 + ((p - 0.01) / 0.025) * 0.57; // R
                } else if (p >= 0.035 && p < 0.065) {
                  val = 0.95 - ((p - 0.035) / 0.03) * 0.8; // S
                } else if (p >= 0.065 && p < 0.10) {
                  val = 0.15 + ((p - 0.065) / 0.035) * 0.35; // recover
                } else if (p >= 0.20 && p < 0.38) {
                  val = 0.5 + Math.sin(((p - 0.20) / 0.18) * Math.PI) * 0.12; // T wave
                } else if (p >= 0.84 && p < 0.92) {
                  val = 0.5 + Math.sin(((p - 0.84) / 0.08) * Math.PI) * 0.06; // P wave
                }
                return val;
              };

              const currentEcgVal = getEcgValueAtPhase(livePhase);
              const ecgY = ecgBaseline - (currentEcgVal - 0.5) * ecgHeightScale;
              
              if (prevEcgYRef.current === null) {
                prevEcgYRef.current = ecgY;
              }
              
              // Draw ECG path slice in beautiful glowing emerald green
              bgCtx.strokeStyle = '#22c55e'; // Emerald green
              bgCtx.lineWidth = 1.5;
              bgCtx.beginPath();
              bgCtx.moveTo(w - (shiftAmount + 2), prevEcgYRef.current);
              bgCtx.lineTo(w - shiftAmount / 2, ecgY);
              bgCtx.stroke();
              prevEcgYRef.current = ecgY;

              const instV = getVelocityAtPhase(livePhase, activePreset);
              const physicalCos = Math.abs(Math.cos(((90 - colorSteer) * Math.PI) / 180));

              // Maintain peak envelope trace history
              for (let i = 0; i < w - shiftAmount; i++) {
                traceHistoryRef.current[i] = traceHistoryRef.current[i + shiftAmount];
              }
              const peakYVal = getCanvasYFromVelocity(instV, h);
              for (let i = w - shiftAmount; i < w; i++) {
                traceHistoryRef.current[i] = peakYVal;
              }

              // Render spectrum column slice at x = w-shiftAmount (rightmost edge)
              const isTurbulent = activePreset.flow === 'turbulent';
              const gateSpanParams = gateSize * 2.2; // Gate size translates to pixel span inside vessel
              const currColIntensities = new Float32Array(h);

              for (let y = 0; y < h; y += 1) {
                // Map vertical coordinate y to its matching shift frequency
                let pixelKHz = 0;
                if (y <= baselineY) {
                  const ratio = (baselineY - y) / Math.max(1, baselineY);
                  pixelKHz = ratio * instNyquist;
                } else {
                  const ratio = (y - baselineY) / Math.max(1, h - baselineY);
                  pixelKHz = -ratio * instNyquist;
                }

                if (spectralInvert) {
                  pixelKHz = -pixelKHz;
                }

                // Apply Wall Filter threshold mapping cutoff
                const wallFilterKHz = wallFilterHz / 1000;
                if (Math.abs(pixelKHz) < wallFilterKHz) {
                  continue;
                }

                // Sample multiple blood velocity stream layers across the Gate thickness
                let intensity = 0;
                const samplePts = [-1.0, -0.5, 0.0, 0.5, 1.0];
                for (const s of samplePts) {
                  // y_px measures distance from vessel centerline (+/- 22.5px limit)
                  const y_px = gateDepth + s * gateSpanParams;
                  let velocityProfileFactor = 0;

                  const radiusLimit = 22.5; 
                  if (Math.abs(y_px) <= radiusLimit) {
                    // Parabolic flow profile: velocity drops toward walls
                    const normDist = y_px / radiusLimit;
                    velocityProfileFactor = 1.0 - normDist * normDist;

                    if (isTurbulent) {
                      velocityProfileFactor = 0.5 * velocityProfileFactor + 0.5 * (0.8 + 0.2 * Math.random());
                    }
                  } else {
                    velocityProfileFactor = 0.0; // outside vessel, no flow
                  }

                  const velAtPt = instV * velocityProfileFactor;
                  let fd_s = (2 * (f0 * 1e6) * velAtPt * physicalCos) / soundSpeed / 1000;

                  // PW Mode aliasing wrap-around
                  if (dopplerMode === 'pw') {
                    const spectralSpan = prfKHz;
                    while (fd_s > instNyquist) fd_s -= spectralSpan;
                    while (fd_s < -instNyquist) fd_s += spectralSpan;
                  }

                  // Signal weight is 0 if sampled completely outside vessel
                  let layerSignalWeight = Math.abs(y_px) <= radiusLimit ? 0.2 : 0.0;
                  
                  // Wall motion clutter near walls
                  if (Math.abs(y_px) <= radiusLimit + 2 && Math.abs(y_px) >= radiusLimit - 2) {
                    fd_s = fd_s * 0.02; // slow thump
                    layerSignalWeight += 0.08;
                  }

                  const layerSpread = isTurbulent ? 1.4 : 0.08;
                  intensity += Math.exp(-Math.pow(pixelKHz - fd_s, 2) / layerSpread) * layerSignalWeight;
                }

                // Gain & Output Power modulation
                let finalIntensity = intensity * (dopplerGain / 100) * (acousticPower / 100);

                // Inject salt-and-pepper noise static (electronic snow)
                const noiseFloor = Math.max(0, (dopplerGain - 45) / 100) * 0.09;
                if (Math.random() < noiseFloor) {
                  finalIntensity += Math.random() * 0.22;
                }

                finalIntensity = Math.min(1.0, Math.max(0.0, finalIntensity));
                currColIntensities[y] = finalIntensity;

                if (finalIntensity > 0.04) {
                  // Fire Gold fire gradient mapping
                  let r = 0, g = 0, b = 0;
                  if (finalIntensity < 0.35) {
                    r = Math.floor(finalIntensity * 3 * 160);
                    g = Math.floor(finalIntensity * 3 * 50);
                    b = Math.floor(finalIntensity * 12);
                  } else if (finalIntensity < 0.75) {
                    r = 180 + Math.floor((finalIntensity - 0.35) * 180);
                    g = 120 + Math.floor((finalIntensity - 0.35) * 190);
                    b = 20;
                  } else {
                    r = 255;
                    g = 210 + Math.floor((finalIntensity - 0.75) * 180);
                    b = Math.floor((finalIntensity - 0.75) * 4 * 160);
                  }

                  bgCtx.fillStyle = `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
                  bgCtx.fillRect(w - shiftAmount, y, shiftAmount, 1);
                }
              }

              lastActiveIntensitiesRef.current = currColIntensities;
            }

            // Draw Spectrogram UI Overlay Hud on visible Screen Canvas
            scrCtx.clearRect(0, 0, w, h);
            scrCtx.drawImage(pwBg, 0, 0);

            // Render Live FFT Vertical Power Spectrum slice
            const fftCanvas = pwFFTCanvasRef.current;
            if (fftCanvas) {
              const fftCtx = fftCanvas.getContext('2d');
              if (fftCtx) {
                const fw = fftCanvas.width;
                const fh = fftCanvas.height;
                fftCtx.clearRect(0, 0, fw, fh);
                fftCtx.fillStyle = '#06070a';
                fftCtx.fillRect(0, 0, fw, fh);

                // Draw alignment baseline Y inside FFT panel matching spectrogram baseline
                const fBaselineY = fh * (0.5 - baselineShift * 0.5);
                fftCtx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
                fftCtx.lineWidth = 1;
                fftCtx.beginPath();
                fftCtx.moveTo(0, fBaselineY);
                fftCtx.lineTo(fw, fBaselineY);
                fftCtx.stroke();

                // Horizontal reference grid lines syncing with spectrogram grid lines
                fftCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                for (let gridY = fh / 6; gridY < fh; gridY += fh / 6) {
                  fftCtx.beginPath();
                  fftCtx.moveTo(0, gridY);
                  fftCtx.lineTo(fw, gridY);
                  fftCtx.stroke();
                }

                // Render matching wall filter blocking bands
                const wallKHz = wallFilterHz / 1000;
                const fFilterHeight = (wallKHz / instNyquist) * fBaselineY;
                const fFilterHeightDown = (wallKHz / instNyquist) * (fh - fBaselineY);
                fftCtx.fillStyle = 'rgba(0, 209, 255, 0.05)';
                fftCtx.fillRect(0, fBaselineY - fFilterHeight, fw, fFilterHeight);
                fftCtx.fillRect(0, fBaselineY, fw, fFilterHeightDown);

                // Plot live or frozen fourier intensity waveform trace
                const intensities = lastActiveIntensitiesRef.current || new Float32Array(fh);
                fftCtx.strokeStyle = '#ffd700'; // neon gold signature
                fftCtx.lineWidth = 1.5;
                fftCtx.beginPath();
                
                for (let y = 0; y < fh; y++) {
                  const val = intensities[y] || 0;
                  const xOffset = 4 + val * (fw - 14);
                  if (y === 0) {
                    fftCtx.moveTo(xOffset, y);
                  } else {
                    fftCtx.lineTo(xOffset, y);
                  }
                }
                fftCtx.stroke();

                // Draw smooth semi-transparent golden fill area
                fftCtx.fillStyle = 'rgba(255, 215, 0, 0.06)';
                fftCtx.beginPath();
                fftCtx.moveTo(4, fh);
                for (let y = fh - 1; y >= 0; y--) {
                  const val = intensities[y] || 0;
                  const xOffset = 4 + val * (fw - 14);
                  fftCtx.lineTo(xOffset, y);
                }
                fftCtx.lineTo(4, 0);
                fftCtx.closePath();
                fftCtx.fill();

                // Find peak velocity frequency coordinate in the current slice
                let maxIntVal = 0;
                let peakY = fBaselineY;
                for (let y = 0; y < fh; y++) {
                  if ((intensities[y] || 0) > maxIntVal) {
                    maxIntVal = intensities[y] || 0;
                    peakY = y;
                  }
                }
                if (maxIntVal > 0.08) {
                  fftCtx.fillStyle = '#00d1ff'; // lock indicator
                  fftCtx.beginPath();
                  fftCtx.arc(4 + maxIntVal * (fw - 14), peakY, 3, 0, Math.PI * 2);
                  fftCtx.fill();
                }
              }
            }

            // Horizontal reference grid lines (every 20% height)
            scrCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            scrCtx.lineWidth = 1;
            for (let gridY = h / 6; gridY < h; gridY += h / 6) {
              scrCtx.beginPath();
              scrCtx.moveTo(0, gridY);
              scrCtx.lineTo(w, gridY);
              scrCtx.stroke();
            }

            // Draw Wall Filter bands of darkness around baseline
            const filterHeight = (wallFilterHz / 1000 / instNyquist) * (baselineY);
            const filterHeightDown = (wallFilterHz / 1000 / instNyquist) * (h - baselineY);
            scrCtx.fillStyle = 'rgba(0, 209, 255, 0.08)';
            scrCtx.fillRect(0, baselineY - filterHeight, w, filterHeight);
            scrCtx.fillRect(0, baselineY, w, filterHeightDown);

            scrCtx.strokeStyle = 'rgba(0, 209, 255, 0.2)';
            scrCtx.lineWidth = 1;
            scrCtx.beginPath();
            scrCtx.moveTo(0, baselineY - filterHeight); scrCtx.lineTo(w, baselineY - filterHeight);
            scrCtx.moveTo(0, baselineY + filterHeightDown); scrCtx.lineTo(w, baselineY + filterHeightDown);
            scrCtx.stroke();

            // Draw critical horizontal baseline line
            scrCtx.strokeStyle = '#ffd700';
            scrCtx.lineWidth = 1.5;
            scrCtx.beginPath();
            scrCtx.moveTo(0, baselineY);
            scrCtx.lineTo(w, baselineY);
            scrCtx.stroke();

            // 1. Draw Peak Velocity Envelope Auto-Trace
            if (autoEnvelope) {
              scrCtx.beginPath();
              scrCtx.strokeStyle = '#f43f5e'; // neon rose pink
              scrCtx.lineWidth = 1.5;
              let first = true;
              for (let x = 0; x < w; x++) {
                const yVal = traceHistoryRef.current[x];
                if (yVal > 0 && yVal < h) {
                  if (first) {
                    scrCtx.moveTo(x, yVal);
                    first = false;
                  } else {
                    scrCtx.lineTo(x, yVal);
                  }
                }
              }
              scrCtx.stroke();
            }

            // 2. Draw Diagnostic Calipers directly on the canvas
            if (caliperPSV !== null) {
              const psvY = getCanvasYFromVelocity(caliperPSV, h);
              scrCtx.strokeStyle = '#ffd700'; // gold for Caliper 1
              scrCtx.lineWidth = 1.0;
              scrCtx.setLineDash([3, 3]);
              scrCtx.beginPath();
              scrCtx.moveTo(0, psvY);
              scrCtx.lineTo(w, psvY);
              scrCtx.stroke();
              scrCtx.setLineDash([]);
              
              scrCtx.fillStyle = '#ffd700';
              scrCtx.font = '8px monospace';
              scrCtx.fillText(`★ PSV Caliper: ${caliperPSV.toFixed(2)} m/s`, 8, psvY - 4);
            }

            if (caliperEDV !== null) {
              const edvY = getCanvasYFromVelocity(caliperEDV, h);
              scrCtx.strokeStyle = '#34d399'; // emerald green for Caliper 2
              scrCtx.lineWidth = 1.0;
              scrCtx.setLineDash([3, 3]);
              scrCtx.beginPath();
              scrCtx.moveTo(0, edvY);
              scrCtx.lineTo(w, edvY);
              scrCtx.stroke();
              scrCtx.setLineDash([]);
              
              scrCtx.fillStyle = '#34d399';
              scrCtx.font = '8px monospace';
              scrCtx.fillText(`★ EDV Caliper: ${caliperEDV.toFixed(2)} m/s`, 8, edvY + 10);
            }

            // 3. Draw placing caliper hover guideline
            if (activeCaliper && hoverY !== null && hoverCaliperVal !== null) {
              scrCtx.strokeStyle = activeCaliper === 'psv' ? 'rgba(255, 215, 0, 0.7)' : 'rgba(52, 211, 153, 0.7)';
              scrCtx.lineWidth = 1.0;
              scrCtx.setLineDash([2, 4]);
              scrCtx.beginPath();
              scrCtx.moveTo(0, hoverY);
              scrCtx.lineTo(w, hoverY);
              scrCtx.stroke();
              scrCtx.setLineDash([]);
              
              scrCtx.fillStyle = '#ffffff';
              scrCtx.font = '8.5px monospace';
              scrCtx.fillText(`📐 Click to Set ${activeCaliper === 'psv' ? 'PSV' : 'EDV'} Caliper (${Math.abs(hoverCaliperVal).toFixed(2)} m/s)`, 8, hoverY - 5);
            }

            // Screen labels overlay
            scrCtx.fillStyle = '#8e9299';
            scrCtx.font = '7px monospace';
            scrCtx.fillText(`+${instNyquist.toFixed(1)} kHz (Nyquist)`, h / 12, h / 12);
            scrCtx.fillText(`-${instNyquist.toFixed(1)} kHz`, h / 12, h - h / 16);
            scrCtx.fillStyle = '#ffd700';
            scrCtx.fillText(`Doppler Baseline (Fd = 0)`, w - 110, baselineY - 4);

            // Active Vessel HUD text label
            const badgeW = 200;
            const badgeH = 14;
            const badgeX = w / 2 - badgeW / 2;
            const badgeY = 6;
            scrCtx.fillStyle = 'rgba(0, 209, 255, 0.12)';
            scrCtx.fillRect(badgeX, badgeY, badgeW, badgeH);
            scrCtx.strokeStyle = 'rgba(0, 209, 255, 0.45)';
            scrCtx.lineWidth = 1;
            scrCtx.strokeRect(badgeX, badgeY, badgeW, badgeH);

            scrCtx.fillStyle = '#00d1ff';
            scrCtx.font = 'bold 7.5px monospace';
            const vesselLabel = activePreset.id === 'reversed' ? 'VESSEL: RIGHT VERTEBRAL ARTERY' : 'VESSEL: COMMON CAROTID ARTERY';
            scrCtx.fillText(vesselLabel, badgeX + 8, badgeY + 10);
          }
        }
      }

      // 2. RENDER COLOR FLOW SIMULATOR VESSEL DISPLAY
      if (activeTab === 'color' || true) {
        const cCanvas = colorCanvasRef.current;
        if (cCanvas) {
          const ctx = cCanvas.getContext('2d');
          if (ctx) {
            const w = cCanvas.width;
            const h = cCanvas.height;
            const livePhase = ((timestamp / 1000) * paceFactor);

            // Dark space backdrop draw
            ctx.fillStyle = '#06070a';
            ctx.fillRect(0, 0, w, h);

            // Sector frame guidelines (gray ultrasound cone background visual)
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.strokeRect(0, 0, w, h);

            // Draw Longitudinal Blood Vessel Cylinder with plaque shadows
            const vesselY = h / 2;
            const vesselH = 45;

            // Localized organic plaque boundary calculation for clinical accuracy
            const getVesselRadiusAtX = (x: number) => {
              const radiusLimit = 22.5;
              if (activePreset.id === 'laminar' || activePreset.id === 'reversed') {
                return radiusLimit;
              }
              // Narrowing centered at w/2
              const plaqueWidth = 110;
              const distFromCenter = Math.abs(x - w / 2);
              if (distFromCenter < plaqueWidth) {
                const scale = activePreset.id === 'severe' ? 0.68 : 0.36;
                const protrusion = radiusLimit * scale * (0.5 + 0.5 * Math.cos((distFromCenter / plaqueWidth) * Math.PI));
                return radiusLimit - protrusion;
              }
              return radiusLimit;
            };

            // Draw Longitudinal Blood Vessel Cylinder with plaque shadows
            ctx.fillStyle = 'rgba(15, 17, 26, 0.7)';
            ctx.fillRect(10, vesselY - vesselH / 2, w - 20, vesselH);

            // Draw organic calcium fibro-calcific plaque structures
            ctx.fillStyle = 'rgba(240, 238, 228, 0.1)'; // calcified fibrous caps shadow
            ctx.beginPath();
            ctx.moveTo(10, vesselY - 22.5);
            for (let x = 10; x <= w - 10; x += 5) {
              const r = getVesselRadiusAtX(x);
              ctx.lineTo(x, vesselY - r);
            }
            ctx.lineTo(w - 10, vesselY - 22.5);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(10, vesselY + 22.5);
            for (let x = 10; x <= w - 10; x += 5) {
              const r = getVesselRadiusAtX(x);
              ctx.lineTo(x, vesselY + r);
            }
            ctx.lineTo(w - 10, vesselY + 22.5);
            ctx.closePath();
            ctx.fill();

            // Draw Vessel endothelials boundaries (plaques contoured intima edges)
            ctx.strokeStyle = 'rgba(180, 185, 195, 0.45)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let x = 10; x <= w - 10; x += 5) {
              const r = getVesselRadiusAtX(x);
              if (x === 10) ctx.moveTo(x, vesselY - r); else ctx.lineTo(x, vesselY - r);
            }
            ctx.stroke();

            ctx.beginPath();
            for (let x = 10; x <= w - 10; x += 5) {
              const r = getVesselRadiusAtX(x);
              if (x === 10) ctx.moveTo(x, vesselY + r); else ctx.lineTo(x, vesselY + r);
            }
            ctx.stroke();

            // Draw Steered Color Box ROI trapezoid
            const steerRad = (colorSteer * Math.PI) / 180;
            const beamCenter = w / 2;
            const beamStartWidth = 60;
            const beamScanDepth = h / 2 - 20;

            const boxWidth = 140;
            const boxHeight = 65;
            const boxY = vesselY - boxHeight / 2 - 5;

            // Geometry offsets based on Steer angle projection
            const skewOffset = Math.sin(steerRad) * 40;

            const tl = beamCenter - boxWidth / 2 + skewOffset * 0.5;
            const tr = beamCenter + boxWidth / 2 + skewOffset * 0.5;
            const bl = beamCenter - boxWidth / 2 + skewOffset * 1.5;
            const br = beamCenter + boxWidth / 2 + skewOffset * 1.5;

            // Draw bounding border box for Color Region of interest
            ctx.strokeStyle = '#00d1ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tl, boxY);
            ctx.lineTo(tr, boxY);
            ctx.lineTo(br, boxY + boxHeight);
            ctx.lineTo(bl, boxY + boxHeight);
            ctx.closePath();
            ctx.stroke();

            // Background shade for active steer box
            ctx.fillStyle = 'rgba(0, 209, 255, 0.02)';
            ctx.fill();

            // Render flowing Hemodynamic Pixels inside Steer ROI box
            const instV = getVelocityAtPhase(livePhase % 1.0, activePreset);
            // Color Shift is proportional to velocity projected along beam
            const colorScaleFactor = Math.sin(steerRad);
            const relativeProjV = instV * colorScaleFactor;

            // Fading out at 90 degrees/0 steer perfectly shown
            const hasColorFlowValue = Math.abs(colorScaleFactor) > 0.05;

            if (hasColorFlowValue) {
              const gradientAlpha = Math.min(0.65, Math.abs(relativeProjV) * 0.65);
              let flowColor = 'rgba(0,0,0,0)';
              const isAliasedColor = Math.abs(relativeProjV) > 1.8;

              // Compute color mapped flows based on dynamic map mode selection
              if (colorMapMode === 'power') {
                // Power Doppler is entirely positive amplitude-based, displaying bright molten gold
                const goldGlow = Math.min(0.9, Math.abs(relativeProjV) * 0.5);
                flowColor = `rgba(249, ${Math.floor(110 + goldGlow * 145)}, 12, ${Math.min(0.85, 0.2 + goldGlow * 0.95)})`;
              } else if (colorMapMode === 'variance') {
                // Variance mode overlays bright neon shades for turbulent/high shear flow
                const isTurbulent = activePreset.flow === 'turbulent' || isAliasedColor;
                if (relativeProjV < 0) {
                  // Towards
                  flowColor = isTurbulent 
                    ? `rgba(163, 230, 53, ${gradientAlpha * 1.2})`  // turbulent lime green
                    : `rgba(239, 68, 68, ${gradientAlpha})`;        // standard red
                } else {
                  // Away
                  flowColor = isTurbulent
                    ? `rgba(20, 184, 166, ${gradientAlpha * 1.2})`  // turbulent turquoise/teal
                    : `rgba(59, 130, 246, ${gradientAlpha})`;        // standard blue
                }
              } else {
                // Standard Velocity map (BART Rule with simulated high-speed aliased wrap-around)
                if (relativeProjV < 0) {
                  // Towards = Red
                  if (isAliasedColor) {
                    flowColor = `rgba(6, 182, 212, ${gradientAlpha})`; // Wrap around to bright cyan
                  } else {
                    flowColor = `rgba(239, 68, 68, ${gradientAlpha})`; // standard red
                  }
                } else {
                  // Away = Blue
                  if (isAliasedColor) {
                    flowColor = `rgba(245, 158, 11, ${gradientAlpha})`; // Wrap around to gold/amber
                  } else {
                    flowColor = `rgba(59, 130, 246, ${gradientAlpha})`; // standard blue
                  }
                }
              }

              // Color voxels overlay representing hemodynamic speed variance (like real ultrasound Color Power Spectrum)
              ctx.save();
              
              // Clip 1: Color steer box envelope
              ctx.beginPath();
              ctx.moveTo(tl, boxY);
              ctx.lineTo(tr, boxY);
              ctx.lineTo(br, boxY + boxHeight);
              ctx.lineTo(bl, boxY + boxHeight);
              ctx.closePath();
              ctx.clip();

              // Clip 2: Vessel organic boundaries (constrains color wash strictly into lumen)
              ctx.beginPath();
              ctx.moveTo(10, vesselY - getVesselRadiusAtX(10));
              for (let x = 10; x <= w - 10; x += 5) {
                ctx.lineTo(x, vesselY - getVesselRadiusAtX(x));
              }
              for (let x = w - 10; x >= 10; x -= 5) {
                ctx.lineTo(x, vesselY + getVesselRadiusAtX(x));
              }
              ctx.closePath();
              ctx.clip();

              // Draw Parabolic Hemodynamic Layer flow gradient (faded boundaries, intense jet throat)
              const rgbBase = colorMapMode === 'power' ? `249, ${Math.floor(110 + Math.min(0.9, Math.abs(relativeProjV) * 0.5) * 145)}, 12` : (colorMapMode === 'variance' ? (relativeProjV < 0 ? (activePreset.flow === 'turbulent' || isAliasedColor ? '163, 230, 53' : '239, 68, 68') : (activePreset.flow === 'turbulent' || isAliasedColor ? '20, 184, 166' : '59, 130, 246')) : (relativeProjV < 0 ? (isAliasedColor ? '6, 182, 212' : '239, 68, 68') : (isAliasedColor ? '245, 158, 11' : '59, 130, 246')));
              const grad = ctx.createLinearGradient(0, vesselY - 22.5, 0, vesselY + 22.5);
              grad.addColorStop(0.0, `rgba(${rgbBase}, 0)`);
              grad.addColorStop(0.25, `rgba(${rgbBase}, ${gradientAlpha * 0.45})`);
              grad.addColorStop(0.5, `rgba(${rgbBase}, ${gradientAlpha})`); // center peak velocity jet
              grad.addColorStop(0.75, `rgba(${rgbBase}, ${gradientAlpha * 0.45})`);
              grad.addColorStop(1.0, `rgba(${rgbBase}, 0)`);

              ctx.fillStyle = grad;
              ctx.fillRect(0, vesselY - 25, w, 50);

              // Render vortex eddies for stenosis turbulence downstream
              if (activePreset.flow === 'turbulent') {
                ctx.fillStyle = isAliasedColor ? 'rgba(6, 182, 212, 0.45)' : 'rgba(245, 158, 11, 0.45)'; // Turb variance cyan/amber
                for (let e = 0; e < 12; e++) {
                  // Eddies downstream (past narrowing center)
                  const eddyX = beamCenter + 25 + Math.sin(livePhase * 8 + e) * 35;
                  const maxRadius = getVesselRadiusAtX(eddyX);
                  const eddyY = vesselY + Math.cos(livePhase * 5 + e) * (maxRadius * 0.65);
                  ctx.beginPath();
                  ctx.arc(eddyX, eddyY, 4 + (e % 3), 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              // Draw dynamic streamlined velocity vector arrows representing flow vectors
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.lineWidth = 1.0;
              const streamLevels = [-12, 0, 12];
              streamLevels.forEach((offsetY) => {
                 for (let ax = beamCenter - 65; ax <= beamCenter + 65; ax += 30) {
                    // Flow offset
                    let mockVel = instV * (1.0 - Math.pow(offsetY / 22.5, 2));
                    const flowOffset = (livePhase * 85 * mockVel) % 30;
                    const finalX = ax + flowOffset;
                    
                    const rAtX = getVesselRadiusAtX(finalX);
                    const py = vesselY + offsetY * (rAtX / 22.5); // curved particle alignment
                    
                    // Continuity equation: speed is inversely proportional to radius squared
                    const velocityAccelerationFactor = Math.pow(22.5 / Math.max(3.0, rAtX), 2);
                    const localVel = instV * (1.0 - Math.pow(offsetY / 22.5, 2)) * velocityAccelerationFactor;
                    const vecLen = localVel * 16 * (localVel > 0 ? 1 : -1) * 0.45; // clamp vectors length
                    
                    if (Math.abs(vecLen) > 1.2) {
                       ctx.strokeStyle = localVel > 0 ? 'rgba(191, 219, 254, 0.5)' : 'rgba(254, 202, 202, 0.5)';
                       if (colorMapMode === 'power') {
                         ctx.strokeStyle = 'rgba(254, 243, 199, 0.5)';
                       }
                       ctx.beginPath();
                       ctx.moveTo(finalX - vecLen, py);
                       ctx.lineTo(finalX + vecLen, py);
                       ctx.stroke();
                       
                       ctx.fillStyle = ctx.strokeStyle;
                       ctx.beginPath();
                       const hSize = 3;
                       if (localVel > 0) {
                          ctx.moveTo(finalX + vecLen, py);
                          ctx.lineTo(finalX + vecLen - hSize, py - hSize/1.5);
                          ctx.lineTo(finalX + vecLen - hSize, py + hSize/1.5);
                       } else {
                          ctx.moveTo(finalX - vecLen, py);
                          ctx.lineTo(finalX - vecLen + hSize, py - hSize/1.5);
                          ctx.lineTo(finalX - vecLen + hSize, py + hSize/1.5);
                       }
                       ctx.fill();
                    }
                 }
              });

              ctx.restore();
            }

            // Draw sound beam vectors emanating from the transducer face
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.lineWidth = 1;
            // Central scan line
            ctx.beginPath();
            ctx.moveTo(beamCenter, 10);
            ctx.lineTo(beamCenter + skewOffset * 1.5, vesselY);
            ctx.stroke();

            // Dynamic Sample Volume gate overlay (placed directly on top of beam intersection)
            const gateY = vesselY + gateDepth;
            const gateX = beamCenter + skewOffset * 1.5;
            const gateSpan = gateSize * 2.2;

            if (dopplerMode === 'cw') {
              // Draw continuous beam sampling line representing range ambiguity
              ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
              ctx.setLineDash([4, 4]);
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(gateX, 12);
              ctx.lineTo(gateX, h - 10);
              ctx.stroke();
              ctx.setLineDash([]); // reset

              ctx.fillStyle = '#ffd700';
              ctx.font = '8px monospace';
              ctx.fillText(`CW Beam (Range Ambiguity)`, gateX + 10, vesselY + 28);
            } else {
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 2.0;
              // Draw standard gate indicators "="
              ctx.beginPath();
              ctx.moveTo(gateX - 8, gateY - gateSpan);
              ctx.lineTo(gateX + 8, gateY - gateSpan);
              ctx.moveTo(gateX - 8, gateY + gateSpan);
              ctx.lineTo(gateX + 8, gateY + gateSpan);
              ctx.stroke();
            }

            // Draw Angle Corrector parallel indicator line
            const correctorRad = ((90 - dopplerAngle) * Math.PI) / 180;
            ctx.strokeStyle = '#00d1ff';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(gateX - Math.cos(correctorRad) * 16, gateY - Math.sin(correctorRad) * 16);
            ctx.lineTo(gateX + Math.cos(correctorRad) * 16, gateY + Math.sin(correctorRad) * 16);
            ctx.stroke();

            // Label corrector Angle info
            ctx.fillStyle = '#00d1ff';
            ctx.font = '8px monospace';
            ctx.fillText(`Correction Angle: ${dopplerAngle}°`, gateX + 14, gateY - 14);

            // Draw interactive target dashed ring around SV gate for mouse dragging
            ctx.strokeStyle = 'rgba(0, 209, 255, 0.4)';
            ctx.lineWidth = 1.0;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(gateX, gateY, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dynamic drag-to-align small caption tag
            ctx.fillStyle = 'rgba(0, 209, 255, 0.55)';
            ctx.font = '7px monospace';
            ctx.fillText('DRAG SECTOR TO ROTATE θ', gateX - 45, gateY + 36);

            // Draw blood cells / erythrocyte particles propagating horizontally
            // Particles speeds are modulated by instant flow velocity and stenosis local squeeze (continuity equation)
            for (let pIdx = 0; pIdx < 35; pIdx++) {
              // Speed profile varies from velocity center parabolic (streamline laminar flow model)
              const heightDistribution = (pIdx % 5 - 2) * 5.2; // fits nicely within +/- 22.5px
              
              // Localized position X along the vessel
              let initialX = (pIdx / 35) * (w - 20) + 10;
              // Compute flow velocity contribution along x
              const baseSpeed = instV * 2.1 * (1 - Math.abs(heightDistribution) / 22.5);
              
              // We can compute the cumulative displacement or simple localized velocity multiplier
              // Let's use the local radius to scale the instantaneous propagation speed dynamically
              const px = ((initialX + livePhase * 180 * baseSpeed) % (w - 20)) + 10;
              
              const rAtX = getVesselRadiusAtX(px);
              
              // continuity equation: speed is inversely proportional to radius squared!
              // For extreme stenosis, we scale particle horizontal position displacement speed
              const py = vesselY + heightDistribution * (rAtX / 22.5);

              // Color code blood particle dots depending on whether they lie inside steered color box
              const isInsideBoxX = px > bl - 10 && px < br + 10;
              if (isInsideBoxX && hasColorFlowValue) {
                ctx.fillStyle = relativeProjV < 0 ? '#ff5252' : '#3b82f6';
              } else {
                ctx.fillStyle = 'rgba(218, 178, 64, 0.45)';
              }

              ctx.beginPath();
              // Make erythrocyte particles a bit glowy
              ctx.arc(px, py, 2.0, 0, Math.PI * 2);
              ctx.fill();
            }

            // Transducer foot outline mock
            ctx.fillStyle = '#1e222b';
            ctx.fillRect(beamCenter - 25, 2, 50, 10);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.strokeRect(beamCenter - 25, 2, 50, 10);

            // Active Vessel HUD text label in color B-Mode
            const cbBadgeW = 200;
            const cbBadgeH = 14;
            const cbBadgeX = 12;
            const cbBadgeY = h - 22;
            ctx.fillStyle = 'rgba(0, 209, 255, 0.12)';
            ctx.fillRect(cbBadgeX, cbBadgeY, cbBadgeW, cbBadgeH);
            ctx.strokeStyle = 'rgba(0, 209, 255, 0.45)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cbBadgeX, cbBadgeY, cbBadgeW, cbBadgeH);

            ctx.fillStyle = '#00d1ff';
            ctx.font = 'bold 7.5px monospace';
            const cbVesselLabel = activePreset.id === 'reversed' ? 'VESSEL: RIGHT VERTEBRAL ARTERY' : 'VESSEL: COMMON CAROTID ARTERY';
            ctx.fillText(cbVesselLabel, cbBadgeX + 8, cbBadgeY + 10);
          }
        }
      }

      // 3. REALTIME WEB AUDIO PARAMETER MODULATIONS
      if (audioCtxRef.current && speakerOn && masterGainRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        const livePhase = ((timestamp / 1000) * paceFactor) % 1.0;
        const instV = getVelocityAtPhase(livePhase, activePreset);
        const physicalCos = Math.abs(Math.cos(((90 - colorSteer) * Math.PI) / 180));

        // Calculate gate parameters for the Web Audio Synth
        const isTurbulent = activePreset.flow === 'turbulent';
        let avgSpeedMult = 0;
        let gateCenterMult = 0;

        // Peak center velocity multiple based on gateDepth
        if (Math.abs(gateDepth) <= 22.5) {
          gateCenterMult = 1.0 - Math.pow(gateDepth / 22.5, 2);
          if (isTurbulent) {
            gateCenterMult = 0.5 * gateCenterMult + 0.5;
          }
        }

        // Multi-point average velocity scale inside actual Gate span
        const samplePts = [-1.0, -0.5, 0.0, 0.5, 1.0];
        const gateSpanParams = gateSize * 2.2;
        let insideCount = 0;
        for (const s of samplePts) {
          const y_px = gateDepth + s * gateSpanParams;
          if (Math.abs(y_px) <= 22.5) {
            insideCount++;
            avgSpeedMult += (1.0 - Math.pow(y_px / 22.5, 2)) * 0.2;
          }
        }
        
        const gateVolumeScale = insideCount > 0 ? (avgSpeedMult / (insideCount * 0.2)) * (insideCount / 5) : 0.05;

        // Peak shift adjusted to gate depth
        const adjustedV = instV * gateCenterMult;
        let adjustedFdKHz = (2 * (f0 * 1e6) * adjustedV * physicalCos) / soundSpeed / 1000;

        // Spectral inversion direction flip
        if (spectralInvert) {
          adjustedFdKHz = -adjustedFdKHz;
        }

        // Realistic spectral frequency wrapping for audio (pitch matches visual aliasing)
        let audioFdKHz = adjustedFdKHz;
        if (dopplerMode === 'pw') {
          const instNyquist = prfKHz / 2;
          const spectralSpan = prfKHz;
          while (audioFdKHz > instNyquist) audioFdKHz -= spectralSpan;
          while (audioFdKHz < -instNyquist) audioFdKHz += spectralSpan;
        }

        const absFd = Math.abs(audioFdKHz);

        // Map absolute shift frequency to audio oscillator whistle pitch (fundamental tone)
        // High flow velocity shifts frequency upwards, whistling rises higher in pitch!
        const basePitch = 60;
        const targetPitchHz = basePitch + absFd * 220; // 60Hz up to ~1.2kHz

        if (oscRef.current && filterRef.current && oscGainRef.current) {
          oscRef.current.frequency.setTargetAtTime(targetPitchHz, now, 0.05);
          filterRef.current.frequency.setTargetAtTime(targetPitchHz, now, 0.05);

          // Rhythmic amplitude envelope tracking flow acceleration, scaled by gate position volume
          const heartbeatEnvelopeRatio = Math.max(0.12, Math.abs(instV) / Math.abs(activePreset.vmax || 1.1)) * gateVolumeScale;
          
          // Simulating low-frequency, high-amplitude blood vessel wall compliance thumps (wall clutter)
          let wallClutterAmp = 0;
          if (wallFilterHz < 120) {
            const isSystole = Math.abs(instV) > Math.abs(activePreset.vmax) * 0.7;
            if (isSystole) {
              wallClutterAmp = ((120 - wallFilterHz) / 120) * 0.28;
            }
          }

          let oscAmp = activePreset.flow === 'turbulent' ? 0.02 : 0.35; // whistling cleaner in laminar carotid
          oscAmp += wallClutterAmp;
          oscGainRef.current.gain.setTargetAtTime(oscAmp * heartbeatEnvelopeRatio * (acousticPower / 100), now, 0.05);
        }

        // Modulate broadband noise filter to match multi-velocity turbulent murmurs
        if (noiseFilterRef.current && noiseGainRef.current) {
          noiseFilterRef.current.frequency.setTargetAtTime(targetPitchHz * 1.05, now, 0.05);

          const heartbeatEnvelopeRatio = Math.max(0.12, Math.abs(instV) / Math.abs(activePreset.vmax || 1.1)) * gateVolumeScale;
          const isTurbulentFlow = activePreset.flow === 'turbulent';

          // High-velocity turbulent stenosis produces intense rushing hisses (acoustic murmurs)
          let targetNoiseAmplitude = isTurbulentFlow 
            ? (0.16 + (absFd / 4.0) * 0.4) 
            : (0.01 + (absFd / 4.0) * 0.06);

          // Add heavy wall compliance rumble if filter cut-off is low
          if (wallFilterHz < 120) {
            const isSystole = Math.abs(instV) > Math.abs(activePreset.vmax) * 0.7;
            if (isSystole) {
              targetNoiseAmplitude += ((120 - wallFilterHz) / 120) * 0.15;
            }
          }

          noiseGainRef.current.gain.setTargetAtTime(targetNoiseAmplitude * heartbeatEnvelopeRatio * (acousticPower / 100), now, 0.05);
        }

        // Realtime Stereo Directional Separation to left/right headphones based on flow vector (towards/away)
        if (pannerRef.current) {
          // positive shift goes to left ear (-0.65), negative shift goes to right ear (+0.65)
          const targetPan = audioFdKHz > 0.05 ? -0.65 : (audioFdKHz < -0.05 ? 0.65 : 0.0);
          pannerRef.current.pan.setTargetAtTime(targetPan, now, 0.05);
        }

        // Apply overall master volume knob level
        masterGainRef.current.gain.setTargetAtTime((volumeLevel / 100) * 0.40, now, 0.08);
      } else if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0, masterGainRef.current.context.currentTime, 0.06);
      }

      lastRender = timestamp;
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [activeTab, activePreset, dopplerAngle, prfKHz, baselineShift, wallFilterHz, dopplerGain, gateSize, colorSteer, speakerOn, volumeLevel, dopplerMode, gateDepth, spectralInvert, isFrozen, acousticPower, autoEnvelope, sweepSpeed, caliperPSV, caliperEDV, activeCaliper, hoverY, hoverCaliperVal]);

  // Clean-up Audio contexts properly on unmount
  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch (e) {}
      }
      if (noiseSourceRef.current) {
        try { noiseSourceRef.current.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Quick reset parameters to preset values
  const handleApplyPreset = (preset: VascularPreset) => {
    setActivePreset(preset);
    // Reset secondary knobs safely matching pathlogical states
    if (preset.id === 'severe') {
      setPrfKHz(8.5); // automatically scale PRF high to resolve jet aliasing!
      setWallFilterHz(300); // raise wall filter to remove low-frequency turbulence wall clutter
    } else {
      setPrfKHz(5.0);
      setWallFilterHz(150);
    }
    setBaselineShift(0);
    // Reset calipers when switching pathologies
    setCaliperPSVY(null);
    setCaliperEDVY(null);
    setActiveCaliper(null);
  };

  const handleResetWorkbench = () => {
    setDopplerAngle(60);
    setPrfKHz(5.0);
    setBaselineShift(0.0);
    setWallFilterHz(150);
    setDopplerGain(70);
    setGateSize(2.5);
    setGateDepth(0);
    setSpectralInvert(false);
    setIsFrozen(false);
    setCaliperPSVY(null);
    setCaliperEDVY(null);
    setActiveCaliper(null);
    setColorSteer(-20);
    setActivePreset(PRESETS[0]);
    setDopplerMode('pw');
    setAutoScale(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden bg-[#0c0d10]"
    >
      {/* LEFT SCANNING WORKBENCH WINDOW */}
      <div className="flex-1 flex flex-col p-4 md:p-8 gap-6 hud-grid relative border-r border-[#2d3139] overflow-y-auto">
        <div className="doppler-workbench-header flex justify-between items-start lg:items-end flex-col lg:flex-row gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="text-[10px] uppercase tracking-[4px] text-[#00d1ff] font-bold mb-2">Hemodynamics pipeline v3.0 &bull; Live Sandbox</div>
            <div className="text-3xl md:text-4xl font-serif italic text-white leading-tight">Spectral & Color <span className="text-[#8e9299]">Doppler</span> Workbench</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setAutoScale(!autoScale)}
              className={`flex items-center gap-2 border px-4 py-2 rounded-full transition-all group shadow-lg mb-1 ${autoScale ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border-[#ffd700]/30 text-[#ffd700]'}`}
            >
              <Zap size={14} className={`${autoScale ? 'text-emerald-400 animate-pulse' : 'text-[#ffd700]'} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {autoScale ? 'Auto-Scale: Active' : 'Toggle Auto-Scale'}
              </span>
            </button>
            <button 
              onClick={() => setViewMode?.('library')}
              className="flex items-center gap-3 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/30 px-4 py-2 rounded-full transition-all group shadow-lg mb-1"
            >
              <Video size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Watch Physics Lectures</span>
            </button>
          </div>
        </div>

        {/* SCANNER CONSOLE GRAPHICS TAB SELECTOR */}
        <div className="flex-1 min-h-[500px] md:min-h-[440px] bg-black border border-[#1a1c22] rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
          <div className="h-12 border-b border-[#1a1c22] bg-[#0c0d10]/95 flex justify-between items-center px-4 shrink-0">
             <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('spectral')}
                  className={`text-[9px] font-mono tracking-widest font-bold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-2 ${activeTab === 'spectral' ? 'bg-[#ffd700]/10 border border-[#ffd700] text-[#ffd700]' : 'text-white/60 hover:text-white border border-transparent'}`}
                >
                   <Activity size={10} />
                   Pulsed Wave Spectral
                </button>
                <button 
                  onClick={() => setActiveTab('color')}
                  className={`text-[9px] font-mono tracking-widest font-bold uppercase px-3 py-1.5 rounded transition-all flex items-center gap-2 ${activeTab === 'color' ? 'bg-[#00d1ff]/10 border border-[#00d1ff] text-[#00d1ff]' : 'text-white/60 hover:text-white border border-transparent'}`}
                >
                   <Waves size={10} />
                   Color Flow Box
                </button>
             </div>
             <div className="flex gap-4 items-center">
                {activeTab === 'color' && (
                   <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-lg">
                      <span className="text-[7.5px] font-mono text-white/40 uppercase tracking-widest px-1 hidden md:inline">MAP PROFILE:</span>
                      {(['velocity', 'variance', 'power'] as const).map(mode => (
                         <button
                           key={mode}
                           onClick={() => setColorMapMode(mode)}
                           className={`text-[7.5px] font-mono uppercase px-2 py-0.5 rounded transition-all ${colorMapMode === mode ? 'bg-[#00d1ff]/20 border border-[#00d1ff]/50 text-[#00d1ff] font-bold' : 'text-white/40 hover:text-white border border-transparent'}`}
                         >
                            {mode === 'power' ? 'Power Doppler' : mode}
                         </button>
                      ))}
                   </div>
                )}
                <div className="flex gap-3 text-[8px] font-mono text-white/40 uppercase items-center">
                   <span>PRF: {prfKHz.toFixed(1)} kHz</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                </div>
             </div>
          </div>

          <div className="flex-1 p-4 md:p-8 flex flex-col relative">
             <div className="flex justify-between items-start xl:items-center flex-col xl:flex-row gap-4 mb-4">
                <div className="text-[10px] font-mono text-[#00d1ff] uppercase border-l-2 border-[#00d1ff] pl-3 tracking-widest font-bold">
                   {activeTab === 'spectral' ? 'SPECTROGRAM STREAM // POWER_DENSITY_PROBE' : 'COLOR DOPPLER OVERLAY // FLOW_DIRECTION_VECTOR'}
                </div>
                <div className="text-[9px] font-mono text-[#8e9299] uppercase tracking-widest">
                   Preset: {activePreset.name}
                </div>
             </div>

             {/* LIVE RENDERING CANVAS STAGES */}
             <div className="flex-1 min-h-[260px] relative rounded-xl border border-white/5 bg-[#060709] overflow-hidden flex flex-col">
                {activeTab === 'spectral' && (
                   <div className="flex-1 h-full flex flex-row relative">
                      {/* Left Side: Horizontal scrolling waterfall spectrogram */}
                      <div className="flex-1 h-full relative">
                         {/* Hidden reference scroll container */}
                         <canvas 
                           ref={pwBackgroundCanvasRef} 
                           width="480" 
                           height="230" 
                           className="hidden" 
                         />
                         <canvas 
                           ref={pwScreenCanvasRef} 
                           width="480" 
                           height="230" 
                           className="w-full h-full object-fill block cursor-crosshair" 
                           onMouseMove={(e) => {
                             const canvas = pwScreenCanvasRef.current;
                             if (!canvas) return;
                             const rect = canvas.getBoundingClientRect();
                             const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
                             setHoverY(clickY);
                             const vel = getVelocityFromCanvasY(clickY, canvas.height);
                             setHoverCaliperVal(vel);
                           }}
                           onMouseLeave={() => {
                             setHoverY(null);
                             setHoverCaliperVal(null);
                           }}
                           onClick={(e) => {
                             if (!activeCaliper) return;
                             const canvas = pwScreenCanvasRef.current;
                             if (!canvas) return;
                             const rect = canvas.getBoundingClientRect();
                             const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
                             const vel = getVelocityFromCanvasY(clickY, canvas.height);
                             
                             if (activeCaliper === 'psv') {
                               setCaliperPSVY(clickY);
                               setActiveCaliper(null);
                             } else if (activeCaliper === 'edv') {
                               setCaliperEDVY(clickY);
                               setActiveCaliper(null);
                             }
                           }}
                         />
                      </div>

                      {/* Right Side: High-speed live Fourier FFT spectrum slice analyzer */}
                      <div className="w-16 md:w-24 border-l border-white/5 bg-[#08090d] relative flex flex-col justify-between p-1 shrink-0">
                         <canvas 
                           ref={pwFFTCanvasRef} 
                           width="96" 
                           height="230" 
                           className="w-full h-full object-fill block" 
                         />
                         <div className="absolute top-1.5 right-1.5 text-[6px] font-mono font-bold text-[#ffd700] uppercase tracking-wider opacity-60 pointer-events-none">FFT_SLICE</div>
                      </div>

                      {/* Spectral Indicators overlays */}
                      <div className="absolute right-20 md:right-28 top-4 flex flex-col bg-black/70 w-40 border border-white/10 p-2 rounded backdrop-blur font-mono text-[9px] text-[#8e9299] space-y-1 z-10">
                         <div className="flex justify-between text-white/50 border-b border-white/5 pb-1 mb-1">
                            <span>Peak Fd Shift</span>
                            <span className={isCurrentlyAliasing ? "text-red-500 font-bold animate-pulse" : "text-[#ffd700]"}>
                               {currentFdKHz.toFixed(2)} kHz
                            </span>
                         </div>
                         <div className="flex justify-between">
                            <span>Nyquist Limit</span>
                            <span className="text-white font-bold">
                               {dopplerMode === 'cw' ? 'None (CW)' : `${nyquistKHz.toFixed(2)} kHz`}
                            </span>
                         </div>
                         <div className="flex justify-between">
                            <span>Wall Filter Gate</span>
                            <span className="text-[#00d1ff] font-bold">{wallFilterHz} Hz</span>
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === 'color' && (
                  <div className="w-full h-full relative">
                     <canvas 
                       ref={colorCanvasRef} 
                       width="580" 
                       height="230" 
                       className="w-full h-full block rounded-xl cursor-grab active:cursor-grabbing"
                       onMouseDown={(e) => {
                         const canvas = colorCanvasRef.current;
                         if (!canvas) return;
                         const rect = canvas.getBoundingClientRect();
                         const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
                         const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
                         
                         const skew = Math.sin((colorSteer * Math.PI) / 180) * 40;
                         const gateX = canvas.width / 2 + skew * 1.5;
                         const gateY = canvas.height / 2 + gateDepth;

                         const dist = Math.sqrt(Math.pow(mx - gateX, 2) + Math.pow(my - gateY, 2));
                         if (dist < 60) {
                           setIsDraggingCanvasAngle(true);
                           handleColorCanvasInteraction(e.clientX, e.clientY, canvas);
                         }
                       }}
                     />
                     
                     {/* BART rules guide color bar */}
                     <div className="absolute left-6 top-6 h-32 w-10 bg-black/8 border border-white/5 p-1 rounded backdrop-blur flex flex-col justify-between items-center text-[7px] font-mono">
                        <div className="text-[#ff5252] font-bold uppercase text-center flex flex-col">
                           <span>Towards</span>
                           <span>Red +</span>
                           <span className="text-[5px] text-white/40">Aliased Gold</span>
                        </div>
                        <div className="h-10 w-2.5 rounded bg-gradient-to-b from-[#ff5252] via-black to-[#3b82f6]" />
                        <div className="text-[#3b82f6] font-bold uppercase text-center flex flex-col">
                           <span className="text-[5px] text-white/40">Aliased Cyan</span>
                           <span>Blue -</span>
                           <span>Away</span>
                        </div>
                     </div>
                  </div>
                )}

                {/* Aliasing Status banner */}
                <AnimatePresence>
                   {isCurrentlyAliasing && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-[0px] z-20 border-2 border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center pointer-events-none"
                      >
                         <span className="text-[36px] font-mono font-black text-red-500/10 tracking-[12px] uppercase -rotate-12">ALIASED_WRAP_AROUND</span>
                         <span className="text-[10px] font-mono text-red-500/50 uppercase tracking-widest leading-none mt-1">Exceeds Nyquist Limit (PRF/2)</span>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

             {/* Live quantitative diagnostic calculations readouts */}
             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#101217] p-3 border border-white/5 rounded-xl">
                   <div className="text-[7px] text-[#ffd700] uppercase font-mono font-bold tracking-widest mb-1">Peak Systolic Vel (PSV)</div>
                   <div className="text-sm font-mono text-white font-bold">
                      {Math.abs(activePreset.vmax).toFixed(2)} m/s
                   </div>
                </div>
                <div className="bg-[#101217] p-3 border border-white/5 rounded-xl">
                   <div className="text-[7px] text-[#00d1ff] uppercase font-mono font-bold tracking-widest mb-1">End Diastolic Vel (EDV)</div>
                   <div className="text-sm font-mono text-white font-bold">
                      {Math.abs(activePreset.vmax * (activePreset.id === 'reversed' ? 0.3 : activePreset.resistance === 'high' ? 0.05 : 0.3)).toFixed(2)} m/s
                   </div>
                </div>
                <div className="bg-[#101217] p-3 border border-white/5 rounded-xl">
                   <div className="text-[7px] text-white/40 uppercase font-mono font-bold tracking-widest mb-1">Resistive Index (RI)</div>
                   <div className="text-sm font-mono text-white font-bold">
                      {activePreset.resistance === 'high' ? '0.90 (High)' : '0.67 (Normal)'}
                   </div>
                </div>
                <div className="bg-[#101217] p-3 border border-white/5 rounded-xl">
                   <div className="text-[7px] text-[#ef4444] uppercase font-mono font-bold tracking-widest mb-1">Diagnostic Classification</div>
                   <div className={`text-[10px] font-bold uppercase truncate ${activePreset.id === 'severe' ? 'text-red-500 animate-pulse' : activePreset.id === 'moderate' ? 'text-amber-500' : 'text-green-500'}`}>
                      {activePreset.id === 'laminar' && 'Normal Laminar Flow'}
                      {activePreset.id === 'moderate' && 'Moderate Stenosis'}
                      {activePreset.id === 'severe' && 'Critical Obstruction!'}
                      {activePreset.id === 'reversed' && 'Subclavian Steal'}
                   </div>
                </div>
             </div>

             {/* INTERACTIVE DOPPLER ANGLE & COSINE SANDBOX DEMO MODULE */}
             <div className="mt-6 bg-[#0a0c10] border border-[#232731] rounded-2xl p-4 flex flex-col md:flex-row gap-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Visual Dial Column */}
                <div className="flex flex-col items-center justify-center shrink-0">
                   <span className="text-[8px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">Tactile Vector Alignment</span>
                   <div className="relative bg-[#0d0f14] border border-white/5 p-3 rounded-xl shadow-inner">
                      <svg 
                        id="interactive-doppler-dial"
                        width="160" 
                        height="160" 
                        className="select-none cursor-pointer"
                        onMouseDown={onDialStart}
                      >
                         <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                               <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                            </marker>
                         </defs>
                         
                         {/* Circle borders and grids */}
                         <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                         <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(0, 209, 255, 0.1)" strokeWidth="1" strokeDasharray="2,3" />
                         <circle cx="80" cy="80" r="3" fill="#ffffff" opacity="0.3" />

                         {/* Blood Vessel Flow Conduit Path (Horizontal) */}
                         <line x1="10" y1="80" x2="150" y2="80" stroke="rgba(239, 68, 68, 0.08)" strokeWidth="16" strokeLinecap="round" />
                         <line x1="12" y1="80" x2="148" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow)" />
                         <text x="12" y="70" fill="rgba(239, 68, 68, 0.6)" fontSize="6" fontFamily="monospace" fontWeight="bold">FLOW VECTOR</text>

                         {/* Ultrasound Propagation Beam Axis (Gold line) */}
                         {(() => {
                           const bRad = ((90 + colorSteer) * Math.PI) / 180;
                           const bx1 = 80 - Math.cos(bRad) * 70;
                           const by1 = 80 - Math.sin(bRad) * 70;
                           const bx2 = 80 + Math.cos(bRad) * 70;
                           const by2 = 80 + Math.sin(bRad) * 70;
                           return (
                             <>
                               <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke="#ffd700" strokeWidth="1.5" strokeDasharray="2,2" />
                               <text x={bx1 < 80 ? bx1 + 5 : bx1 - 40} y={by1 < 80 ? by1 + 10 : by1 - 5} fill="#ffd700" fontSize="6.5" fontFamily="monospace" fontWeight="bold" opacity="0.8">US BEAM</text>
                             </>
                           );
                         })()}

                         {/* Active Drag-Adjustable Angle Corrector Cursor (Cyan line) */}
                         {(() => {
                           const bRad = ((90 + colorSteer) * Math.PI) / 180;
                           const adjustSign = colorSteer >= 0 ? 1 : -1;
                           const cRad = bRad + adjustSign * ((dopplerAngle * Math.PI) / 180);
                           const cx1 = 80 - Math.cos(cRad) * 65;
                           const cy1 = 80 - Math.sin(cRad) * 65;
                           const cx2 = 80 + Math.cos(cRad) * 65;
                           const cy2 = 80 + Math.sin(cRad) * 65;
                           return (
                             <>
                               {/* Corrector line */}
                               <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="#00d1ff" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_4px_#00d1ff]" />
                               
                               {/* Arc marking the angle */}
                               {dopplerAngle > 5 && (
                                 <path 
                                   d={`M 80 80 L ${80 + Math.cos(bRad) * 25} ${80 + Math.sin(bRad) * 25} A 25 25 0 0 ${adjustSign > 0 ? 0 : 1} ${80 + Math.cos(cRad) * 25} ${80 + Math.sin(cRad) * 25} Z`} 
                                   fill="rgba(0, 209, 255, 0.15)" 
                                   stroke="#00d1ff" 
                                   strokeWidth="0.5" 
                                 />
                               )}
                               
                               {/* Interactive Circular Handle Knob */}
                               <circle cx={cx2} cy={cy2} r="7" fill="#00d1ff" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer hover:scale-125 transition-transform drop-shadow" />
                               <circle cx={cx2} cy={cy2} r="2" fill="#0c0d10" />
                             </>
                           );
                         })()}
                      </svg>
                      
                      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                         <span className="bg-black/80 px-2 py-0.5 rounded text-[7px] font-mono text-[#00d1ff] font-bold border border-white/5 uppercase">θ = {dopplerAngle}°</span>
                      </div>
                   </div>
                </div>

                {/* Pedagogical Calculations & Explanation Column */}
                <div className="flex-1 flex flex-col justify-between font-mono">
                   <div>
                      <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5 mb-3">
                         <Sliders size={12} className="text-[#00d1ff]" />
                         <span className="text-[10px] text-white font-bold uppercase tracking-wider">Dynamic Cosine Sandbox</span>
                      </div>
                      
                      {/* Math outputs display */}
                      <div className="space-y-2 text-[9.5px]">
                         <div className="flex justify-between items-center text-white/60">
                            <span>True Incidence Angle (θ<sub>true</sub>):</span>
                            <span className="text-white font-bold">{Math.round(90 - Math.abs(colorSteer))}°</span>
                         </div>
                         <div className="flex justify-between items-center text-white/60">
                            <span>Your Corrector Setting (θ<sub>est</sub>):</span>
                            <span className="text-[#00d1ff] font-black">{dopplerAngle}°</span>
                         </div>
                         <div className="flex justify-between items-center text-white/60">
                            <span>Set Cosine cos(θ<sub>est</sub>):</span>
                            <span className="text-[#ffd700] font-bold">{Math.cos(dopplerAngle * Math.PI / 180).toFixed(4)}</span>
                         </div>
                         <div className="flex justify-between items-center text-white/50 pt-1.5 border-t border-white/5 text-[9px] leading-tight">
                            <span>Formula: V<sub>calc</sub> = V<sub>uncorrected</sub> / cos(θ<sub>est</sub>)</span>
                         </div>
                      </div>

                      {/* Live Alignment Evaluation Badge & Description */}
                      {(() => {
                        const trueIncidentAngle = 90 - Math.abs(colorSteer);
                        const trueVelocity = Math.abs(activePreset.vmax);
                        const measuredUncorrectedVelocity = trueVelocity * Math.cos((trueIncidentAngle * Math.PI) / 180);
                        const cosCorrectedVal = Math.cos((dopplerAngle * Math.PI) / 180);
                        const reportedCorrectedVelocity = cosCorrectedVal > 0.01 ? (measuredUncorrectedVelocity / cosCorrectedVal) : 0;
                        const velocityErrorPct = trueVelocity > 0 ? ((reportedCorrectedVelocity - trueVelocity) / trueVelocity) * 100 : 0;
                        const alignmentError = dopplerAngle - trueIncidentAngle;

                        let badgeColor = "";
                        let badgeText = "";
                        let feedbackMsg = "";

                        if (Math.abs(alignmentError) <= 2) {
                          badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                          badgeText = "✅ PERFECT FLOW ALIGNMENT";
                          feedbackMsg = `Excellent alignment! Your corrector matches the real vessel direction. Velocity reports ${reportedCorrectedVelocity.toFixed(2)} m/s (100% accurate).`;
                        } else if (alignmentError < 0) {
                          badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                          badgeText = "⚠️ UNDER-CORRECTED CALIBRATION";
                          feedbackMsg = `Calibration angle too narrow by ${Math.abs(alignmentError).toFixed(0)}°. Calculated speed (${reportedCorrectedVelocity.toFixed(2)} m/s) is under-reported by ${Math.abs(velocityErrorPct).toFixed(0)}% below actual carotid rate!`;
                        } else if (dopplerAngle > 60) {
                          badgeColor = "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse";
                          badgeText = "🚨 CLINICAL WARNING: EXTREME ANGLE";
                          feedbackMsg = `Angles over 60° amplify alignment error exponentially! A tiny alignment wobble inflates calculations to ${reportedCorrectedVelocity.toFixed(2)} m/s (+${velocityErrorPct.toFixed(0)}% error)! Beam steer recommended.`;
                        } else {
                          badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                          badgeText = "⚠️ OVER-CORRECTED CALIBRATION";
                          feedbackMsg = `Calibration angle too wide by ${alignmentError.toFixed(0)}°. Over-correcting cos(θ) inflates reported flow values to ${reportedCorrectedVelocity.toFixed(2)} m/s (+${velocityErrorPct.toFixed(0)}% over-report)!`;
                        }

                        return (
                          <div className="mt-4 space-y-2">
                             <div className={`px-2 py-1 rounded text-[8px] font-bold tracking-wider uppercase border inline-block ${badgeColor}`}>
                                {badgeText}
                             </div>
                             
                             <p className="text-[8px] font-sans text-white/50 leading-relaxed italic normal-case">
                                {feedbackMsg}
                             </p>

                             {/* Speed Comparison Grid */}
                             <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5 text-[8px] leading-tight">
                                <div className="p-1.5 bg-black/30 rounded border border-white/5">
                                   <div className="text-white/40 mb-0.5">True Flow</div>
                                   <div className="text-white font-bold">{trueVelocity.toFixed(2)} m/s</div>
                                </div>
                                <div className="p-1.5 bg-black/30 rounded border border-white/5">
                                   <div className="text-white/40 mb-0.5 font-mono">Cos Offset</div>
                                   <div className="text-amber-500 font-bold">{measuredUncorrectedVelocity.toFixed(2)} m/s</div>
                                </div>
                                <div className="p-1.5 bg-black/30 rounded border border-white/5">
                                   <div className="text-[#00d1ff] font-bold mb-0.5">Calculated</div>
                                   <div className={`font-black ${Math.abs(alignmentError) <= 2 ? "text-emerald-400" : "text-amber-400"}`}>{reportedCorrectedVelocity.toFixed(2)} m/s</div>
                                </div>
                             </div>
                          </div>
                        );
                      })()}
                   </div>
                </div>
             </div>
          </div>

          {/* Standard secondary FFT profile comparison drawer */}
          <div className="h-24 border-t border-white/5 bg-[#0c0d10]/50 flex items-center justify-around p-4 gap-4 backdrop-blur shrink-0 md:px-8">
             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase text-[#8e9299] tracking-widest mb-1 font-bold">Live Doppler Shift (Fd)</span>
               <div className={`text-base md:text-lg font-mono font-bold transition-colors ${isCurrentlyAliasing ? 'text-red-500' : 'text-[#ffd700]'}`}>
                 {currentFdKHz.toFixed(3)} <span className="text-[9px] font-normal opacity-50">kHz</span>
               </div>
             </div>

             <div className="w-[1px] h-8 bg-white/5" />

             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase text-[#8e9299] tracking-widest mb-1 font-bold">Maximum Unambiguous Shift</span>
                <div className="text-base md:text-lg font-mono font-bold text-white">
                   {dopplerMode === 'cw' ? '∞ (No PW Limit)' : `${nyquistKHz.toFixed(2)} kHz`}
                </div>
             </div>

             <div className="w-[1px] h-8 bg-white/5" />

             <div className="flex flex-col items-center">
               <span className="text-[8px] uppercase text-[#8e9299] tracking-widest mb-1 font-bold">Aliasing Status</span>
               <div className={`px-4 py-1 rounded-full border text-[9px] font-bold tracking-widest ${isCurrentlyAliasing ? 'border-red-500 text-red-500 animate-pulse bg-red-500/5' : dopplerMode === 'cw' ? 'border-[#00d1ff] text-[#00d1ff] bg-[#00d1ff]/5' : 'border-green-500 text-green-500 bg-green-500/5'}`}>
                 {isCurrentlyAliasing ? 'ALIASING' : dopplerMode === 'cw' ? 'CW Focus (EXEMPT)' : 'STABLE'}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR HEALING DIAGNOSTIC PANEL & CONTROLS */}
      <div className="w-full xl:w-[450px] p-4 md:p-8 flex flex-col gap-8 bg-[#0c0d10] border-l border-[#2d3139] overflow-y-auto no-scrollbar shadow-2xl shrink-0">
         <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
               <div className="text-[9px] font-mono text-[#00d1ff] tracking-[3px] uppercase font-bold">DOPO-SCAN DIAGNOSTIC CONTROL</div>
               <h2 className="text-3xl font-serif italic text-white leading-tight">Knobology <span className="text-[#8e9299]">& Labs</span></h2>
            </div>
            <button 
              onClick={handleResetWorkbench}
              title="Reset all settings"
              className="p-2 border border-white/5 hover:border-white/15 hover:bg-white/5 text-[#8e9299] hover:text-white rounded-lg transition-all"
            >
               <RotateCcw size={14} />
            </button>
         </div>

         {/* EXCLUSIVE SWITCH: ENHANCED INTERACTIVE SPI BOARD CLASSROOM */}
         <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 font-mono text-[9px]">
            <button
              onClick={() => setRightPanelMode('console')}
              className={`py-2 px-1 rounded-lg transition-all text-center font-bold uppercase flex items-center justify-center gap-1.5 ${rightPanelMode === 'console' ? 'bg-[#00d1ff]/10 border border-[#00d1ff]/20 text-[#00d1ff]' : 'text-white/40 border border-transparent hover:text-white hover:bg-white/[0.02]'}`}
            >
               <Sliders size={12} />
               Scanner Console
            </button>
            <button
              onClick={() => setRightPanelMode('study')}
              className={`py-2 px-1 rounded-lg transition-all text-center font-bold uppercase flex items-center justify-center gap-1.5 ${rightPanelMode === 'study' ? 'bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700]' : 'text-white/40 border border-transparent hover:text-[#ffd700] hover:bg-[#ffd700]/5'}`}
            >
               <BookOpen size={12} />
               SPI Study Lab
            </button>
         </div>

         {/* CONDITIONAL SIDEBAR BRANCHING */}
         {rightPanelMode === 'console' ? (
           <>
              {/* SECTION 1: VASCULAR PATHOLOGY LABORATORY */}
              <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
               <Flame size={12} className="text-[#ffd700]" />
               <span className="text-[10px] font-mono text-white/55 uppercase tracking-widest font-bold">Select Vascular Pathology Lab</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
               {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3 text-left border rounded-xl transition-all flex flex-col justify-between ${activePreset.id === p.id ? 'border-[#ffd700] bg-[#ffd700]/5 shadow-[0_0_15px_rgba(255,215,0,0.06)]' : 'border-white/5 bg-[#141519] hover:border-white/10'}`}
                  >
                     <div className="text-[10px] font-bold text-white truncate">{p.name}</div>
                     <span className="text-[8px] font-mono text-[#8e9299] mt-2 uppercase">{p.flow} &bull; {p.vmax.toFixed(2)}m/s</span>
                  </button>
               ))}
            </div>
            <div className="p-3 bg-[#101115] border border-white/5 rounded-lg text-[10px] text-white/60 leading-relaxed italic">
               <div className="flex flex-col gap-2">
                  <div>{activePreset.description}</div>
                  <button
                    onClick={() => {
                      (window as any).showInfoFullScreen?.({
                         title: activePreset.name,
                         badge: `VASCULAR PATHOLOGY LAB // PRESET_${activePreset.id.toUpperCase()}`,
                         subtitle: `Flow Type: ${activePreset.flow.toUpperCase()} | Resistance: ${activePreset.resistance.toUpperCase()} | Direction: ${activePreset.direction.toUpperCase()}`,
                         content: `This clinical preset represents a typical clinical presentation of <strong>${activePreset.name}</strong>.<br/><br/><strong>Calibrated Parameters:</strong><br/>• Peak velocity limit (V_max): <strong>${activePreset.vmax} m/s</strong>.<br/>• Flow profile type: <strong>${activePreset.flow.toUpperCase()}</strong>.<br/>• Acoustic impedance resistance: <strong>${activePreset.resistance.toUpperCase()}</strong>.<br/>• Spatial vector direction: <strong>${activePreset.direction.toUpperCase()}</strong>.<br/><br/><strong>Diagnostic Assessment & Guidelines:</strong><br/>${activePreset.description}`
                      });
                    }}
                    className="self-end px-2 py-0.5 rounded bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/20 hover:border-[#00d1ff]/40 text-[#00d1ff] text-[7.5px] font-mono tracking-widest uppercase cursor-pointer transition-all"
                  >
                     Fullscreen Lab Case
                  </button>
               </div>
            </div>
         </div>

         {/* SECTION 2: WEB DOPPLER SYNTH AUDIO PLAYER */}
         <div className="p-4 bg-[#14161a] border border-[#2d3139] rounded-xl flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <Volume2 size={13} className="text-[#00d1ff]" />
                  <span className="text-[10px] text-[#00d1ff] font-bold uppercase font-mono tracking-widest">Doppler Audio Synth (Whoosh!)</span>
               </div>
               {/* Pulsing visual beat of heart rate synchronized perfectly to BPM */}
               <motion.div 
                 key={heartRateBPM}
                 animate={{ scale: [1, 1.35, 1], opacity: [0.4, 1, 0.4] }}
                 transition={{ duration: 60 / heartRateBPM, repeat: Infinity, ease: "easeInOut" }}
                 className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
               />
            </div>
            <div className="flex items-center gap-4">
               <button
                 onClick={handleSpeakerToggle}
                 className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-mono font-bold uppercase transition-all tracking-wide ${speakerOn ? 'bg-red-500/10 border-red-500 text-red-500 shadow-md animate-pulse' : 'bg-white/5 border-white/10 text-[#8e9299] hover:text-white'}`}
               >
                  {speakerOn ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  {speakerOn ? 'Speaker On (Pulsing)' : 'Doppler Sound Off'}
               </button>

               <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-white/50">
                     <span>VOLUME</span>
                     <span>{volumeLevel}%</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    value={volumeLevel}
                    onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
                    disabled={!speakerOn}
                    className={`w-full accent-red-500 h-[3px] bg-[#2d3139] cursor-pointer rounded ${!speakerOn ? 'opacity-30 cursor-not-allowed' : ''}`}
                  />
               </div>
            </div>

            {/* Cardiac Heart Rate BPM Pacing Control */}
            <div className="flex flex-col gap-1 border-t border-white/5 pt-3 mt-1 font-mono">
               <div className="flex justify-between text-[8px] text-white/50">
                  <span className="flex items-center gap-1 uppercase tracking-widest font-bold">
                     <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" />
                     Pacing Rhythm (Heart Rate)
                  </span>
                  <span className="text-[#00d1ff] font-bold">{heartRateBPM} BPM</span>
               </div>
               <input 
                 type="range"
                 min="30"
                 max="150"
                 step="5"
                 value={heartRateBPM}
                 onChange={(e) => setHeartRateBPM(parseInt(e.target.value))}
                 className="w-full accent-red-500 h-[3px] bg-[#2d3139] cursor-pointer rounded"
               />
               <div className="flex justify-between text-[7px] text-white/30 mt-1">
                  <span>30 BPM (Bradycardia)</span>
                  <span>75 BPM (Normal)</span>
                  <span>150 BPM (Tachycardia)</span>
               </div>
            </div>

            <p className="text-[8px] font-sans text-white/40 leading-relaxed italic leading-normal">
               *Synthesizes genuine vascular heartbeats. Laminar flow creates melodic, clean whistles, and stenotic jet turbulence generates wide-band whistling noise!
            </p>
         </div>

         {/* SECTION 3: CLINICIAN'S MULTI-MODE CONSOLE & SPI KNOBOLOGY LAB */}
         <div className="p-4 bg-[#14161a] border border-[#2d3139] rounded-xl flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <div className="flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#ffd700]" />
                  <span className="text-[10px] uppercase text-[#ffd700] tracking-widest font-black font-mono">Workstation Knobology Deck</span>
               </div>
               <span className="text-[7px] text-white/30 font-mono">SPI COMPLIANT v2.5</span>
            </div>

            {/* 3A. TAB CATEGORIES */}
            <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-lg border border-white/5 font-mono text-[8px]">
               <button
                 onClick={() => setKnobCategory('transducer')}
                 className={`py-1.5 rounded transition-all text-center font-bold uppercase ${knobCategory === 'transducer' ? 'bg-[#ffd700]/10 border border-[#ffd700]/25 text-[#ffd700]' : 'text-[#8e9299] border border-transparent hover:text-white'}`}
               >
                  🛠️ Probe Angle
               </button>
               <button
                 onClick={() => setKnobCategory('signal')}
                 className={`py-1.5 rounded transition-all text-center font-bold uppercase ${knobCategory === 'signal' ? 'bg-[#00d1ff]/10 border border-[#00d1ff]/25 text-[#00d1ff]' : 'text-[#8e9299] border border-transparent hover:text-white'}`}
               >
                  📡 Sampling
               </button>
               <button
                 onClick={() => setKnobCategory('safety')}
                 className={`py-1.5 rounded transition-all text-center font-bold uppercase ${knobCategory === 'safety' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' : 'text-[#8e9299] border border-transparent hover:text-white'}`}
               >
                  ⚕️ Dosimetry
               </button>
            </div>

            {/* 3B. ULTRASOUND MODE TACTICAL TOGGLE */}
            <div className="flex flex-col gap-1 bg-black/15 p-2 rounded-lg border border-white/[0.02]">
               <span className="text-white/40 text-[7px] uppercase tracking-wider font-mono">Doppler Modality Mode</span>
               <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setDopplerMode('pw');
                      setSelectedHelpKnob('gatedepth');
                    }}
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 bg-black/25 border rounded-lg transition-all ${dopplerMode === 'pw' ? 'border-[#ffd700] bg-[#ffd700]/5 text-[#ffd700]' : 'border-white/5 text-[#8e9299] hover:text-white'}`}
                  >
                     <span className="text-[9.5px] font-bold">Pulsed Wave (PW)</span>
                     <span className="text-[6.5px] opacity-40 font-mono">Range Gated &bull; Subject to Aliasing</span>
                  </button>
                  <button
                    onClick={() => {
                      setDopplerMode('cw');
                      setSelectedHelpKnob('angle');
                    }}
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 bg-black/25 border rounded-lg transition-all ${dopplerMode === 'cw' ? 'border-[#00d1ff] bg-[#00d1ff]/5 text-[#00d1ff]' : 'border-white/5 text-[#8e9299] hover:text-white'}`}
                  >
                     <span className="text-[9.5px] font-bold">Continuous Wave (CW)</span>
                     <span className="text-[6.5px] opacity-40 font-mono">Continuous &bull; Immune to Aliasing</span>
                  </button>
               </div>
            </div>

            {/* 3C. ACTIVE TAB PARAMETERS PANEL */}
            <div className="space-y-3 pt-1 font-mono text-[9px]">
               {knobCategory === 'transducer' && (
                  <div className="space-y-2.5">
                     {/* Doppler Angle Correction */}
                     <div 
                       onClick={() => setSelectedHelpKnob('angle')}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedHelpKnob === 'angle' ? 'bg-[#ffd700]/5 border-[#ffd700]/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                              Doppler Angle Correction (θ)
                           </span>
                           <span className="text-[#ffd700] font-black text-[10px]">{dopplerAngle}°</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="85"
                          value={dopplerAngle}
                          onChange={(e) => setDopplerAngle(parseInt(e.target.value))}
                          className="w-full h-1 accent-[#ffd700] bg-[#2d3139] rounded cursor-pointer"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>0° (Max Shift Offset)</span>
                           <span className={dopplerAngle > 60 ? 'text-amber-400 font-bold' : ''}>60° (Clinical Sweet Spot)</span>
                           <span>85° (Poor Accuracy Limit)</span>
                        </div>
                     </div>

                     {/* Sample Volume Gate Depth */}
                     <div 
                       onClick={() => { if (dopplerMode !== 'cw') setSelectedHelpKnob('gatedepth'); }}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border transition-all ${dopplerMode === 'cw' ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'} ${selectedHelpKnob === 'gatedepth' && dopplerMode !== 'cw' ? 'bg-[#ffd700]/5 border-[#ffd700]/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              Sample Volume Gate Depth
                           </span>
                           <span className="text-cyan-400 font-black">
                              {dopplerMode === 'cw' ? 'N/A' : gateDepth === 0 ? 'Centered (0.0mm)' : `${(gateDepth * 0.4).toFixed(1)} mm ${gateDepth > 0 ? 'Deep' : 'Shallow'}`}
                           </span>
                        </div>
                        <input 
                          type="range"
                          min="-18"
                          max="18"
                          step="1"
                          value={gateDepth}
                          disabled={dopplerMode === 'cw'}
                          onChange={(e) => setGateDepth(parseInt(e.target.value))}
                          className="w-full h-1 accent-cyan-400 bg-[#2d3139] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                     </div>

                     {/* Doppler Gate Size */}
                     <div 
                       onClick={() => { if (dopplerMode !== 'cw') setSelectedHelpKnob('gatesize'); }}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border transition-all ${dopplerMode === 'cw' ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'} ${selectedHelpKnob === 'gatesize' && dopplerMode !== 'cw' ? 'bg-[#ffd700]/5 border-[#ffd700]/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              Spectral Sample Gate Size
                           </span>
                           <span className="text-cyan-400 font-black">
                              {dopplerMode === 'cw' ? 'N/A (Continuous)' : `${gateSize.toFixed(1)} mm`}
                           </span>
                        </div>
                        <input 
                          type="range"
                          min="1.5"
                          max="8.0"
                          step="0.5"
                          value={gateSize}
                          disabled={dopplerMode === 'cw'}
                          onChange={(e) => setGateSize(parseFloat(e.target.value))}
                          className="w-full h-1 accent-cyan-400 bg-[#2d3139] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>1.5 mm (Laminar Stream)</span>
                           <span>8.0 mm (Turbulent broadened)</span>
                        </div>
                     </div>

                     {/* Steering Color Box Angle */}
                     <div className="flex flex-col gap-1.5 p-2 bg-black/15 rounded-lg border border-white/[0.02]">
                        <span className="text-white/50 text-[7.5px] uppercase">Steered Color Box ROI Angle</span>
                        <div className="flex gap-1.5">
                           {[-20, 0, 20].map(sAngle => (
                              <button
                                key={sAngle}
                                onClick={() => {
                                  setColorSteer(sAngle);
                                  setSelectedHelpKnob('angle');
                                }}
                                className={`flex-1 text-[8.5px] font-mono py-1 rounded border transition-all ${colorSteer === sAngle ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 font-bold' : 'border-white/5 text-[#8e9299] hover:text-white'}`}
                              >
                                 {sAngle > 0 ? `+${sAngle}° Steer` : sAngle < 0 ? `${sAngle}° Steer` : '0° Parallel'}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {knobCategory === 'signal' && (
                  <div className="space-y-2.5">
                     {/* Scale / PRF */}
                     <div 
                       onClick={() => { if (dopplerMode !== 'cw') setSelectedHelpKnob('prf'); }}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border transition-all ${dopplerMode === 'cw' ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'} ${selectedHelpKnob === 'prf' && dopplerMode !== 'cw' ? 'bg-[#00d1ff]/5 border-[#00d1ff]/25' : 'bg-black/15 border-transparent hover:border-white/5'} ${autoScale && dopplerMode !== 'cw' ? 'border-emerald-500/30' : ''}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              Pulse Repetition Freq (PRF)
                           </span>
                           <span className={`font-black text-[10px] ${autoScale ? 'text-emerald-400' : 'text-[#00d1ff]'}`}>
                              {dopplerMode === 'cw' ? '∞ Continuous' : autoScale ? `${prfKHz.toFixed(1)} kHz (Auto)` : `${prfKHz.toFixed(1)} kHz`}
                           </span>
                        </div>
                        <input 
                          type="range"
                          min="1.0"
                          max="10.0"
                          step="0.5"
                          value={prfKHz}
                          disabled={dopplerMode === 'cw'}
                          onChange={(e) => {
                            setPrfKHz(parseFloat(e.target.value));
                            setAutoScale(false);
                          }}
                          className="w-full h-1 accent-[#00d1ff] bg-[#2d3139] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>1.0 kHz (Low-Flow focus)</span>
                           <span>10.0 kHz (Nyquist Limit)</span>
                        </div>
                     </div>

                     {/* Baseline Offset Shift */}
                     <div 
                       onClick={() => setSelectedHelpKnob('baseline')}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedHelpKnob === 'baseline' ? 'bg-white/5 border-white/20' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Spectral Baseline Shift
                           </span>
                           <span className="text-white font-black text-[10px]">{baselineShift > 0 ? `+${(baselineShift * 100).toFixed(0)}%` : `${(baselineShift * 100).toFixed(0)}%`}</span>
                        </div>
                        <input 
                          type="range"
                          min="-0.8"
                          max="0.8"
                          step="0.1"
                          value={baselineShift}
                          onChange={(e) => setBaselineShift(parseFloat(e.target.value))}
                          className="w-full h-1 accent-white bg-[#2d3139] rounded cursor-pointer"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>-80% Lower (Antegrade Peak)</span>
                           <span>0% Centered</span>
                           <span>+80% Upper (Retrograde Peak)</span>
                        </div>
                     </div>

                     {/* Wall Filter cutoff */}
                     <div 
                       onClick={() => setSelectedHelpKnob('wallfilter')}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedHelpKnob === 'wallfilter' ? 'bg-[#00d1ff]/5 border-[#00d1ff]/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              Low Cutoff Wall Filter
                           </span>
                           <span className="text-cyan-400 font-black text-[10px]">{wallFilterHz} Hz</span>
                        </div>
                        <input 
                          type="range"
                          min="20"
                          max="800"
                          step="20"
                          value={wallFilterHz}
                          onChange={(e) => setWallFilterHz(parseInt(e.target.value))}
                          className="w-full h-1 accent-[#00d1ff] bg-[#2d3139] rounded cursor-pointer"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>20 Hz (Deep diastolic thumps)</span>
                           <span className={wallFilterHz > 300 ? 'text-amber-400 font-bold' : ''}>800 Hz (Crops diastolic flow)</span>
                        </div>
                     </div>

                     {/* Spectral Inversion and Stream Freezing */}
                     <div className="grid grid-cols-2 gap-2 bg-black/10 p-2 rounded-lg">
                        <button
                          onClick={() => setSpectralInvert(prev => !prev)}
                          className={`py-1 rounded border text-[8px] font-mono uppercase tracking-wide transition-all border-white/5 ${spectralInvert ? 'bg-[#00d1ff]/10 border-[#00d1ff] text-[#00d1ff] font-bold shadow-md' : 'bg-black/35 hover:bg-white/5 text-[#8e9299]'}`}
                        >
                           🔄 Spectral Invert
                        </button>
                        <button
                          onClick={() => setIsFrozen(prev => !prev)}
                          className={`py-1 rounded border text-[8px] font-mono uppercase tracking-wide transition-all border-white/5 ${isFrozen ? 'bg-red-500/10 border-red-500 text-red-500 font-bold shadow-md animate-pulse' : 'bg-black/35 hover:bg-white/5 text-[#8e9299]'}`}
                        >
                           ❄️ {isFrozen ? 'Stream Frozen' : 'Live Stream'}
                        </button>
                     </div>
                  </div>
               )}

               {knobCategory === 'safety' && (
                  <div className="space-y-2.5">
                     {/* Acoustic Transmit Power */}
                     <div 
                       onClick={() => setSelectedHelpKnob('power')}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedHelpKnob === 'power' ? 'bg-red-500/5 border-red-500/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Acoustic Output Power (Tx)
                           </span>
                           <span className={`font-black text-[10px] ${acousticPower > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{acousticPower}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={acousticPower}
                          onChange={(e) => setAcousticPower(parseInt(e.target.value))}
                          className="w-full h-1 accent-red-400 bg-[#2d3139] rounded cursor-pointer"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>10% (Ultra Safe exposure)</span>
                           <span className={acousticPower > 50 ? 'text-rose-400 font-bold' : ''}>100% (High Exposure)</span>
                        </div>
                     </div>

                     {/* Receiver Doppler Gain slider */}
                     <div 
                       onClick={() => setSelectedHelpKnob('gain')}
                       className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${selectedHelpKnob === 'gain' ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-black/15 border-transparent hover:border-white/5'}`}
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-white/70 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Doppler Receiver Gain (Rx)
                           </span>
                        </div>
                        <div className="py-2 flex justify-center">
                          <RotaryKnob
                            value={dopplerGain}
                            min={10}
                            max={100}
                            onChange={(val) => setDopplerGain(val)}
                            label=""
                            unit="%"
                            color="emerald"
                            disabled={false}
                            helpText="70% - 90% is ALARA Standard"
                          />
                        </div>
                        <div className="hidden">
                        <input 
                          type="range"
                          min="10"
                          max="100"
                          value={dopplerGain}
                          onChange={(e) => setDopplerGain(parseInt(e.target.value))}
                          className="w-full h-1 accent-emerald-400 bg-[#2d3139] rounded cursor-pointer"
                        />
                        <div className="flex justify-between text-[6.5px] text-white/30">
                           <span>10% (Insufficent Signal)</span>
                           <span className="text-emerald-400">70% to 90% (ALARA Standard)</span>
                           <span>100% (High noise snow)</span>
                        </div>
                        </div>
                     </div>

                     {/* Sweep speed & Auto envelope */}
                     <div className="grid grid-cols-2 gap-2 bg-black/15 p-2 rounded-lg border border-white/[0.02]">
                        <div className="flex flex-col gap-1">
                           <span className="text-[7.5px] text-white/40 uppercase">Sweep Speed</span>
                           <div className="flex gap-1">
                              {([1, 2, 4] as const).map(speedValue => (
                                 <button
                                   key={speedValue}
                                   onClick={() => setSweepSpeed(speedValue)}
                                   className={`flex-1 text-[8px] py-1 bg-black/25 rounded border transition-all ${sweepSpeed === speedValue ? 'border-[#00d1ff] bg-[#00d1ff]/5 text-[#00d1ff] font-bold' : 'border-transparent text-[#8e9299] hover:text-white'}`}
                                 >
                                    {speedValue === 1 ? 'Slow (1x)' : speedValue === 2 ? 'Normal (2x)' : 'Fast (4x)'}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[7.5px] text-white/40 uppercase">Auto Envelope Path</span>
                           <button
                             onClick={() => setAutoEnvelope(prev => !prev)}
                             className={`py-1 text-[8px] font-bold rounded border transition-all ${autoEnvelope ? 'bg-rose-500/15 border-rose-500 text-rose-400' : 'bg-black/20 border-transparent text-[#8e9299]'}`}
                           >
                              {autoEnvelope ? 'ACTIVE ENVELOPE' : 'MUTED'}
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* 3D. CLINICAL INTERACTIVE OPTIMIZATION MACROS */}
            <div className="pt-2 border-t border-white/5 space-y-2">
               <div className="text-cyan-400 text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <Zap size={11} className="text-amber-400" />
                  Quick Optimize Preset Macros
               </div>
               <div className="grid grid-cols-3 gap-1.5 font-mono text-[7px] leading-tight">
                  <button
                    onClick={() => {
                       const dynamicPrf = Math.min(10.0, Math.max(1.0, Math.abs(activePreset.vmax) * 2.3));
                       setPrfKHz(dynamicPrf);
                       setBaselineShift(activePreset.direction === 'reverse' ? 0.35 : -0.35);
                       setAutoScale(false);
                       setSelectedHelpKnob('prf');
                    }}
                    className="py-1 px-1.5 border border-amber-500/20 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 rounded-lg transition-all text-center leading-tight font-medium"
                  >
                     ⚡ Anti-Aliasing Shield
                  </button>
                  <button
                    onClick={() => {
                       setAcousticPower(40);
                       setDopplerGain(85);
                       setSelectedHelpKnob('power');
                    }}
                    className="py-1 px-1.5 border border-emerald-500/20 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-300 rounded-lg transition-all text-center leading-tight font-medium"
                  >
                     🍀 Clear ALARA Safe
                  </button>
                  <button
                    onClick={() => {
                       setPrfKHz(1.5);
                       setWallFilterHz(40);
                       setBaselineShift(0.0);
                       setAutoScale(false);
                       setSelectedHelpKnob('wallfilter');
                    }}
                    className="py-1 px-1.5 border border-cyan-500/20 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-300 rounded-lg transition-all text-center leading-tight font-medium"
                  >
                     🔬 Low-Flow Focus
                  </button>
               </div>
            </div>

            {/* 3E. SPI STUDY CHEAT SHEET CLIPBOARD */}
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2 relative overflow-hidden backdrop-blur">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd700]/25 to-transparent animate-pulse" />
               <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.04]">
                  <span className="text-[7.5px] uppercase text-[#ffd700] tracking-widest font-black flex items-center gap-1">
                     <Info size={10} className="text-[#ffd700]" />
                     SPI Registry Guide & Cheat Sheet
                  </span>
                  <span className="text-[6.5px] text-white/30 font-mono font-bold">PHYSICS</span>
               </div>

               <div className="space-y-1.5 leading-relaxed">
                  <div className="flex justify-between items-start">
                     <div className="text-[10px] font-bold text-white font-serif italic tracking-wide">
                        {knobHelpDb[selectedHelpKnob]?.name || "Select any parameter knob above"}
                     </div>
                     <div className="text-[7.5px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-[#00d1ff] rounded font-bold uppercase tracking-wider">
                        {knobHelpDb[selectedHelpKnob]?.formula || "N/A"}
                     </div>
                  </div>
                  
                  <p className="text-[8.5px] text-white/55 leading-normal font-sans">
                     <strong className="text-white font-mono text-[7.5px] uppercase mr-1">Concept:</strong>
                     {knobHelpDb[selectedHelpKnob]?.concept || "Click on any slider above to automatically fetch registry tips on this parameters."}
                  </p>
                  
                  <div className="mt-2 p-2 rounded bg-black/30 border border-[#ffd700]/15 text-[8px] leading-tight text-amber-200 font-mono">
                     <strong className="text-[#ffd700] font-black uppercase text-[7.5px] flex items-center gap-1 mb-1">
                        ⚠️ SPI Registry Guide Detail
                     </strong>
                     {knobHelpDb[selectedHelpKnob]?.alert || "Select any slider to review corresponding registry study patterns!"}
                  </div>
               </div>
            </div>

            {/* 3F. BIOSAFETY DOSIMETRIC SCREEN & ALARA */}
            <div className={`p-2.5 rounded-lg border transition-all duration-300 ${acousticPower <= 50 && dopplerGain >= 70 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
               <div className="flex justify-between items-center mb-1 border-b border-white/[0.04] pb-1 font-mono">
                  <div className="flex gap-1.5 items-center">
                     <div className={`w-1.5 h-1.5 rounded-full ${acousticPower <= 50 && dopplerGain >= 70 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                     <span className={`text-[8.5px] uppercase font-black tracking-wider ${acousticPower <= 50 && dopplerGain >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {acousticPower <= 50 && dopplerGain >= 70 ? 'ALARA ACTIVE (SAFE)' : 'NON-ALARA EXPOSURE'}
                     </span>
                  </div>
                  
                  <div className="flex gap-2 text-[7.5px] font-bold">
                     <div>MI: <span className={acousticPower > 50 ? 'text-red-400' : 'text-emerald-400'}>{((acousticPower / 100) * 1.6 / Math.sqrt(4.0)).toFixed(2)}</span> <span className="opacity-40">(Limit 1.9)</span></div>
                     <span>&bull;</span>
                     <div>TI: <span className={acousticPower > 50 ? 'text-red-400' : 'text-emerald-400'}>{((acousticPower / 100) * 1.1).toFixed(2)}</span> <span className="opacity-40">(Limit 1.0)</span></div>
                  </div>
               </div>
               
               <p className="text-[7.5px] text-white/50 leading-normal font-sans">
                  {acousticPower <= 50 && dopplerGain >= 70 
                    ? "Optimal safety configuration: Transmit intensity is minimized, protecting the tissue. The Doppler waveform is safely supplemented using receiver gain instead."
                    : "Acoustic intensity alert: Reduce transmit output power to ≤50% to mitigate biological thermal/mechanical risk, then raise receiver Doppler Gain to secure visibility."
                  }
               </p>
            </div>
         </div>

         {/* EXCLUSIVE CLINICAL MEASUREMENT CALIPERS PANEL */}
         <div className="p-4 bg-[#14161a] border border-[#2d3139] rounded-xl flex flex-col gap-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono tracking-widest">Diagnostic Calipers Deck</span>
               </div>
               {(caliperPSV !== null || caliperEDV !== null) && (
                  <button 
                    onClick={() => {
                       setCaliperPSVY(null);
                       setCaliperEDVY(null);
                       setActiveCaliper(null);
                    }}
                    className="text-[8px] uppercase font-mono px-2 py-0.5 rounded border border-[#ef4444]/30 hover:border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/5 transition-all"
                  >
                     Clear Calipers
                  </button>
               )}
            </div>

            <div className="space-y-3 font-mono text-[9px]">
               {/* PSV Caliper placement */}
               <div className="flex flex-col gap-1.5 p-2 bg-black/20 rounded border border-white/5">
                  <div className="flex justify-between items-center">
                     <button
                       onClick={() => setActiveCaliper(activeCaliper === 'psv' ? null : 'psv')}
                       className={`px-2 py-1 rounded text-[8.5px] uppercase transition-all ${activeCaliper === 'psv' ? 'bg-[#ffd700] text-black font-bold' : 'bg-white/5 text-white/70 border border-white/10'}`}
                     >
                        📐 Place Caliper 1 (PSV)
                     </button>
                     <span className="text-[#ffd700] font-bold text-[10px]">
                        {caliperPSV !== null ? `${caliperPSV.toFixed(2)} m/s` : 'Not Placed'}
                     </span>
                  </div>
                  {activeCaliper === 'psv' && (
                     <div className="flex flex-col gap-1 mt-1">
                        <span className="text-white/40 text-[7.5px] uppercase">Drag to position over Peak Systolic velocity</span>
                        <input 
                          type="range"
                          min="0.1"
                          max="2.5"
                          step="0.05"
                          value={caliperPSV === null ? activePreset.vmax : caliperPSV}
                          onChange={(e) => handleSetCaliperPSV(parseFloat(e.target.value))}
                          className="w-full accent-[#ffd700] h-[2px] bg-[#2d3139]"
                        />
                     </div>
                  )}
               </div>

               {/* EDV Caliper placement */}
               <div className="flex flex-col gap-1.5 p-2 bg-black/20 rounded border border-white/5">
                  <div className="flex justify-between items-center">
                     <button
                       onClick={() => setActiveCaliper(activeCaliper === 'edv' ? null : 'edv')}
                       className={`px-2 py-1 rounded text-[8.5px] uppercase transition-all ${activeCaliper === 'edv' ? 'bg-emerald-400 text-black font-bold' : 'bg-white/5 text-white/70 border border-white/10'}`}
                     >
                        📐 Place Caliper 2 (EDV)
                     </button>
                     <span className="text-emerald-400 font-bold text-[10px]">
                        {caliperEDV !== null ? `${caliperEDV.toFixed(2)} m/s` : 'Not Placed'}
                     </span>
                  </div>
                  {activeCaliper === 'edv' && (
                     <div className="flex flex-col gap-1 mt-1">
                        <span className="text-white/40 text-[7.5px] uppercase">Drag to position over End Diastolic velocity</span>
                        <input 
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={caliperEDV === null ? activePreset.vmax * 0.2 : caliperEDV}
                          onChange={(e) => handleSetCaliperEDV(parseFloat(e.target.value))}
                          className="w-full accent-emerald-400 h-[2px] bg-[#2d3139]"
                        />
                     </div>
                  )}
               </div>

               {/* Clinical calculated Resistive Index (RI) with physical commentary */}
               {caliperPSV !== null && caliperEDV !== null ? (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1.5 text-white">
                     <div className="flex justify-between text-[10px]">
                        <span className="text-white/50 uppercase font-bold">clinical index calculated:</span>
                        <span className="text-emerald-400 font-black">RI = {((caliperPSV - caliperEDV) / caliperPSV).toFixed(2)}</span>
                     </div>
                     <p className="text-[7.5px] font-sans text-white/60 leading-tight">
                        {((caliperPSV - caliperEDV) / caliperPSV) > 0.8 ? (
                           <span className="text-amber-400 font-bold">⚠️ Warning: Elevated Resistive Index (&gt;0.80) suggests poor downstream vascular compliance or severe arterial stenosis obstruction.</span>
                        ) : (
                           <span className="text-emerald-300">✅ Normal Range Resistive Index (0.50 to 0.75) represents healthy low-resistance distal bed perfusion.</span>
                        )}
                     </p>
                  </div>
               ) : (
                  <div className="p-2 border border-dashed border-white/15 rounded-lg text-center text-[7.5px] text-white/30">
                     Place and calibrate both calipers on the spectral scroll wave to unlock mathematical Resistive Index (RI) diagnostic analysis.
                  </div>
               )}
            </div>
         </div>

         {/* SECTION 4: EDUCATIONAL MATH ANALYSIS WORKSPACE */}
         <div className="p-4 bg-[#0a0b0d] border border-white/5 rounded-xl space-y-3 font-mono text-[9px]">
            <div className="flex justify-between items-center text-[#ffd700] uppercase font-bold border-b border-white/5 pb-2">
               <span>θ vs. Cosine Physics Table</span>
               <Info size={11} />
            </div>
            <div className="space-y-1 text-white/50">
               <div className="flex justify-between text-white border-b border-white/5 pb-1 mb-1">
                  <span>Cosine: cos({dopplerAngle}°)</span>
                  <span className="text-[#ffd700] font-bold">{cosFactor.toFixed(4)}</span>
               </div>
               <div className="flex justify-between">
                  <span>Vel Peak Limit (no alias)</span>
                  <span className="text-[#ffd700] font-bold">
                     {dopplerMode === 'cw' ? '∞ (Immune)' : `${maxVelocityPossibleAtNyquist.toFixed(2)} m/s`}
                  </span>
               </div>
               <p className="text-[8px] font-sans text-white/40 leading-relaxed italic pt-2 normal-case">
                  *Doppler Shift calculation: 2 &bull; f₀ &bull; v &bull; cos(θ) / c. When θ approaches 90°, cosine approaches 0, destroying spectral waves and color velocities. Keeps angles ≤ 60° clinically.
               </p>
            </div>
         </div>
         </>
         ) : (
            /* SPI STUDY LAB AREA PANEL */
            <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar flex-1 select-none pr-1">
               {/* STUDY LAB SUMMARY BANNER */}
               <div className="p-3 bg-gradient-to-br from-[#ffd700]/10 to-transparent border border-[#ffd700]/15 rounded-xl flex flex-col gap-1.5 relative overflow-hidden shrink-0">
                  <div className="flex items-center gap-2">
                     <Sparkles size={13} className="text-[#ffd700] animate-pulse" />
                     <span className="text-[10px] font-mono text-white tracking-widest uppercase font-black">
                        Ultrasound Physics Board Prep
                     </span>
                  </div>
                  <p className="text-[8px] font-sans text-white/50 leading-relaxed">
                     Interactive classrooms aligned with current SPI exam formats. Choose a domain or search key terms. Click questions to inspect model answers, key math, and link scenarios back with the scanner!
                  </p>
               </div>

               {/* SEARCH BOX */}
               <div className="relative shrink-0">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <Search size={11} className="text-white/30" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search terms (e.g., ALARA, refraction, frequency)..."
                    value={studySearchQuery}
                    onChange={(e) => setStudySearchQuery(e.target.value)}
                    className="w-full bg-[#141519]/80 border border-white/5 rounded-xl py-2 pl-8 pr-8 text-[9.5px] font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#ffd700]/30 selection:bg-[#ffd700]/30 selection:text-white"
                  />
                  {studySearchQuery !== "" && (
                     <button
                       onClick={() => setStudySearchQuery("")}
                       className="absolute inset-y-0 right-0 flex items-center pr-3 text-[9px] font-mono text-white/20 hover:text-white"
                     >
                        ×
                     </button>
                  )}
               </div>

               {/* CATEGORY SELECTOR CHIPS */}
               <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 shrink-0">
                  {["All", "I. Acoustics & Waves", "II. Transducers", "III. Pulse-Echo Principles", "IV. Attenuation & Tissue", "V. Instrumentation", "⚕️ Safety & QA"].map((cat) => {
                     const catShort = cat === "III. Pulse-Echo Principles" ? "III. Pulse-Echo" : cat === "IV. Attenuation & Tissue" ? "IV. Attenuation" : cat;
                     const isSelected = selectedStudyCategory === cat;
                     return (
                        <button
                          key={cat}
                          onClick={() => {
                             setSelectedStudyCategory(cat);
                             setExpandedStudyCard(null);
                          }}
                          className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[8px] font-mono font-bold transition-all ${isSelected ? 'bg-[#ffd700]/15 border border-[#ffd700]/25 text-[#ffd700]' : 'bg-white/5 border border-white/[0.03] text-white/40 hover:text-white hover:bg-white/10'}`}
                        >
                           {catShort === "All" ? "🌐 VIEW ALL" : catShort}
                        </button>
                     );
                  })}
               </div>

               {/* ITERATIVE FLASHCARDS CONTAINER */}
               <div className="space-y-2 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
                  {(() => {
                     const filteredItems = spiStudyBank.filter(item => {
                        const matchCat = selectedStudyCategory === "All" || item.category === selectedStudyCategory;
                        const matchSearch = studySearchQuery.trim() === "" || 
                           item.q.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
                           item.a.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
                           item.subCategory.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
                           (item.formula && item.formula.toLowerCase().includes(studySearchQuery.toLowerCase())) ||
                           (item.concept && item.concept.toLowerCase().includes(studySearchQuery.toLowerCase())) ||
                           (item.alert && item.alert.toLowerCase().includes(studySearchQuery.toLowerCase()));
                        return matchCat && matchSearch;
                     });

                     if (filteredItems.length === 0) {
                        return (
                           <div className="p-6 border border-dashed border-white/5 rounded-xl text-center flex flex-col gap-2 bg-[#0c0d10]">
                              <span className="text-lg">🔍</span>
                              <span className="text-[9px] font-mono text-white/40 font-bold uppercase">No Registry Matching Found</span>
                              <span className="text-[8px] font-sans text-white/35 leading-tight">Try adjusting filters or typing alternative search terms.</span>
                           </div>
                        );
                     }

                     return filteredItems.map((item) => {
                        const isExpanded = expandedStudyCard === item.id;
                        return (
                           <motion.div
                             layout="position"
                             key={item.id}
                             className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 relative overflow-hidden group select-text ${isExpanded ? 'border-[#ffd700]/30 bg-[#ffd700]/[0.03] shadow-[0_4px_25px_rgba(255,215,0,0.03)]' : 'border-white/5 bg-[#141519]/70 hover:border-white/10 hover:bg-[#141519]'}`}
                             onClick={() => setExpandedStudyCard(isExpanded ? null : item.id)}
                           >
                              <div className="flex justify-between items-center text-[7.5px] font-mono relative z-10">
                                 <span className="text-[#8e9299] font-bold uppercase tracking-wider">{item.subCategory}</span>
                                 <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         (window as any).showInfoFullScreen?.({
                                            title: item.q,
                                            badge: `${item.subCategory.toUpperCase()} // REGISTRY DATA`,
                                            category: item.category,
                                            content: item.a,
                                            formula: item.formula,
                                            concept: item.concept,
                                            alert: item.alert
                                         });
                                      }}
                                      className="p-1 rounded bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/20 hover:border-[#ffd700]/40 text-[#ffd700] cursor-pointer transition-all flex items-center justify-center font-mono text-[6px]"
                                      title="Read in Full Screen"
                                    >
                                       FULLSCREEN VIEW
                                    </button>
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-black uppercase text-[6.5px]">
                                       {item.category.split(". ")[1] || item.category}
                                    </span>
                                 </div>
                              </div>

                              <div className="text-white text-[10.5px] font-bold leading-normal relative z-10 pr-4 mt-0.5 selection:bg-cyan-500/30">
                                 {item.q}
                                 {/* Arrow icon rotated on expansion */}
                                 <div className="absolute right-0 top-0.5">
                                    <span className={`text-[9px] font-mono text-[#ffd700] transition-transform duration-300 inline-block ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                                       ▶
                                    </span>
                                 </div>
                              </div>

                              <AnimatePresence initial={false}>
                                 {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25, ease: "easeOut" }}
                                      className="mt-2.5 pt-2.5 border-t border-white/[0.04] space-y-2.5 relative z-10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                       <div className="text-[9.5px] text-white/80 leading-relaxed font-sans font-medium selection:bg-cyan-500/30">
                                          <span className="text-[#ffd700] font-mono text-[8.5px] uppercase tracking-wider mr-1.5 font-bold">Explanation:</span>
                                          {item.a}
                                       </div>

                                       {item.formula && (
                                          <div className="p-2 rounded bg-black/50 border border-white/5 flex justify-between items-center font-mono">
                                             <span className="text-[7.5px] text-white/40 uppercase tracking-widest font-black">Registry Math Formula:</span>
                                             <span className="text-[9.5px] text-[#00d1ff] font-extrabold pr-1 drop-shadow-[0_0_10px_rgba(0,209,255,0.2)]">{item.formula}</span>
                                          </div>
                                       )}

                                       {item.concept && (
                                          <div className="text-[9px] text-white/55 leading-relaxed font-sans select-text border-l-2 border-white/10 pl-2">
                                             <span className="text-white font-mono text-[7.5px] uppercase mr-1.5 font-black">High-Yield Translation:</span>
                                             {item.concept}
                                          </div>
                                       )}

                                       {item.alert && (
                                          <div className="p-2.5 rounded bg-amber-500/[0.03] border border-amber-500/15 text-[8.5px] leading-relaxed text-[#ffd700]/95 font-mono">
                                             <span className="text-[#ffd700] font-extrabold uppercase text-[7.5px] flex items-center gap-1 mb-1">
                                                ⚠️ core registry trap catch
                                             </span>
                                             {item.alert}
                                          </div>
                                       )}

                                       {item.actionId && (
                                          <button
                                            onClick={() => applyStudyScenario(item.actionId)}
                                            className="w-full py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[8.5px] font-mono font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                          >
                                             <Sparkles size={10} className="text-emerald-400 animate-pulse" />
                                             {item.interactLabel || "Apply Demo Settings"}
                                          </button>
                                       )}
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </motion.div>
                        );
                     });
                  })()}
               </div>
            </div>
         )}
      </div>
   </motion.div>
  );
}
