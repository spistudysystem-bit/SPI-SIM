import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Award,
  FlaskConical,
  Zap,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  Flame,
  Play,
  Square,
  Save,
  Sparkles,
  List,
  Search,
  Check,
  Compass,
  Keyboard,
  BookMarked
} from 'lucide-react';
import { WaveSim, DopplerSim } from '../shared/PhysicsSimulations';
import { BOURDAIN_LECTURES } from '../../constants/bourdainLectures';
import { SEDARIS_LECTURES } from '../../constants/sedarisLectures';
import LessonVisuals from './LessonVisuals';
import D3ThirteenMicrosecondRule from './D3ThirteenMicrosecondRule';
import { useNarrator } from '../../hooks/useNarrator';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import bourdainPortrait from '../../assets/images/bourdain_mode_portrait_1781263349950.jpg';
import sedarisPortrait from '../../assets/images/sedaris_mode_portrait_1781263410370.jpg';

interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  e: string;
}

const CHAPTERS = [
  {
    id: 0,
    tag: "Chapter 01 · Mathematics",
    title: "Foundations of Ultrasound Math",
    subtitle: "Logarithms, Decibels, Units, Reciprocals, and the Distance Equation — the mathematical scaffolding of the SPI.",
    content: [
      "Diagnostic ultrasound physics is described through the language of mathematics. Sonographers operate across a vast range of physical scales, requiring a firm grasp of exponential notation: frequencies of several million hertz (Mega, <strong>MHz = 10⁶</strong>) are paired with cycle timings measured in millionths of a second (micro, <strong>&mu;s = 10⁻⁶</strong>). Distance and wavelength are expressed in small meters like centi (<strong>cm = 10⁻²</strong>) and milli (<strong>mm = 10⁻³</strong>).",
      "A fundamental relationship in wave mechanics is the <strong>reciprocal</strong>: two numbers which, when multiplied, equal exactly 1. Because frequency (f) and period (T) are reciprocals, we have the equations: <strong>f = 1/T</strong> and <strong>T = 1/f</strong>. This means if frequency doubles, period is cut in half. For instance, a 5 MHz operating frequency matches a period of exactly 1/5,000,000 = 0.2 microseconds (&mu;s).",
      "The most critical formula is the <strong>Distance Equation</strong>, which calculates the depth of returning echoes: <strong>d = c &times; t / 2</strong>, where the scale factor of 2 accounts for the sound's round-trip travel to the interface and back. In soft tissue, sound speed is hardcoded at <strong>1,540 m/s (1.54 mm/&mu;s)</strong>. This constant propagation delay yields the famous <strong>13-microsecond rule</strong>: sound takes exactly 13 &mu;s of total round-trip flight to image a depth of 1 cm."
    ],
    quiz: [
      {
        q: "What is the round-trip travel time of an ultrasound pulse returning from a reflector at a depth of 4 cm in soft tissue?",
        opts: ["13 microseconds", "26 microseconds", "39 microseconds", "52 microseconds"],
        a: 3,
        e: "According to the 13-microsecond rule: 13 μs of round-trip time corresponds to 1 cm of depth. Therefore, for a depth of 4 cm, the total round-trip flight is 4 × 13 μs = 52 μs."
      },
      {
        q: "The period of a wave produced by an 8 MHz transducer is equal to:",
        opts: ["0.125 microseconds", "8 microseconds", "0.5 microseconds", "1.25 microseconds"],
        a: 0,
        e: "Period (T) and frequency (f) are reciprocals: T = 1/f. For 8 MHz: T = 1 / 8,000,000 Hz = 0.125 × 10⁻⁶ s = 0.125 microseconds."
      },
      {
        q: "An ultrasound system's transmit power increases by +10 dB. This represents an intensity increase of:",
        opts: ["2-fold (doubled)", "4-fold (quadrupled)", "10-fold (tenfold)", "100-fold"],
        a: 2,
        e: "In logarithmic decibels for power or intensity: +3 dB is a 2-fold increase, and +10 dB represents a 10-fold (tenfold) increase."
      }
    ]
  },
  {
    id: 1,
    tag: "Chapter 02 · Wave Physics",
    title: "Sound and Mechanical Propagation",
    subtitle: "Acoustic variables, particle behavior, compression, rarefaction, and the physical boundaries of speed.",
    content: [
      "Sound is a <strong>longitudinal, mechanical wave</strong>. Because it travels via the physical vibration of molecules, it strictly <strong>requires a physical medium</strong> (such as tissue or water) to propagate and <strong>cannot travel through a vacuum</strong>. As the wavefront passes, it produces local oscillations in four physical properties known as the <strong>acoustic variables</strong>: Pressure (Pa), Density (g/cm³), Temperature (&deg;C), and Particle motion.",
      "The wave consists of alternating segments in space and time: <strong>compressions</strong> (regions of high particle density and high acoustic pressure) and <strong>rarefactions</strong> (regions of low particle density and low pressure). Operating frequency (f) is determined solely by the source (the transducer's crystal properties) and does not change when sound crosses different tissue interfaces.",
      "In contrast, the wave's <strong>propagation velocity (c)</strong> is determined entirely by the medium's density and stiffness (bulk modulus): <strong>c = &radic;(Bulk Modulus / Density)</strong>. Stiffer media increase speed dramatically (e.g., bone travels at 3,500 m/s), while dense media (if stiffness remains equal) decrease speed. Average soft tissue velocity is hardcoded in ultrasound scanners at <strong>1,540 m/s</strong>."
    ],
    quiz: [
      {
        q: "Which property is classified as an acoustic variable in ultrasound physics?",
        opts: ["Frequency", "Acoustic Impedance", "Acoustic Pressure", "Wavelength"],
        a: 2,
        e: "The four acoustic variables are: Pressure, Density, Temperature, and Particle distance. Factors like frequency, impedance, and wavelength are parameters of the sound wave, not acoustic variables."
      },
      {
        q: "The speed of sound is determined solely by which parameter?",
        opts: ["The transducer's operating frequency", "The characteristics of the medium", "The thickness of the active crystal", "The wave's output transmit amplitude"],
        a: 1,
        e: "Propagation velocity is determined solely by the physical characteristics of the medium (specifically its stiffness and density), never by the transducer's frequency or output power."
      },
      {
        q: "In which of the following tissue mediums does ultrasound travel the fastest?",
        opts: ["Fat", "Water", "Average Soft Tissue", "Bone"],
        a: 3,
        e: "Ultrasound travels fastest in bone (typically 2,700–4,000 m/s) because of its extremely high bulk modulus (stiffness). Fat is slower (approx. 1,450 m/s) and soft tissue is 1,540 m/s."
      }
    ]
  },
  {
    id: 2,
    tag: "Chapter 03 · Attenuation & Reflection",
    title: "Acoustic Attenuation and Tissue Interfaces",
    subtitle: "Understanding reflection coefficients, Rayleigh scattering, tissue impedance mismatches, and refraction.",
    content: [
      "As ultrasound travels, its energy, power, and amplitude naturally decay—a process called <strong>attenuation</strong>. Attenuation occurs through three primary mechanisms: <strong>absorption, reflection, and scattering</strong>. In soft tissue, <strong>absorption</strong> (conversion of wave kinetic energy into heat) is the dominant factor, directly proportional to the transducer's operating frequency.",
      "The attenuation coefficient for average soft tissue is approximately <strong>0.5 dB/cm per MHz</strong> of frequency. This rapid decay restricts high-frequency probes to superficial imaging, while requiring lower-frequency probes for deep penetration. When a wave encounters a large, smooth boundary (like the diaphragm), <strong>specular reflection</strong> occurs, where the angle of reflection equals the angle of incidence.",
      "<strong>Acoustic Impedance (Z = &rho; &times; c)</strong>, measured in Rayls, describes tissue resistance. Reflections only occur if there is an impedance mismatch at the interface. <strong>Refraction</strong> is the bending of the sound beam when crossing an interface at an oblique angle between media with different propagation speeds, governed by Snell's Law."
    ],
    quiz: [
      {
        q: "What is the total round-trip attenuation of a 6 MHz sound beam traveling to a depth of 5 cm in soft tissue?",
        opts: ["3 dB", "15 dB", "30 dB", "45 dB"],
        a: 2,
        e: "Soft tissue attenuation = 0.5 dB/cm/MHz. The path is 5 cm one way, making round trip distance 10 cm. Attenuation = 0.5 × 6 MHz × 10 cm = 30 dB."
      },
      {
        q: "Rayleigh scattering occurs when encountering reflectors much smaller than the wavelength (e.g., RBCs) and is proportional to:",
        opts: ["Frequency squared", "Inverse of frequency", "Frequency to the fourth power", "Frequency cubed"],
        a: 2,
        e: "Rayleigh scattering intensity is proportional to f⁴ (frequency to the 4th power). This is why higher frequency transducers produce stronger scatter from blood."
      },
      {
        q: "Snell's Law mathematically governs which acoustic behavior at tissue interfaces?",
        opts: ["Specular Reflection", "Acoustic Shadowing", "Beam Refraction", "Rayleigh Scattering"],
        a: 2,
        e: "Snell's Law governs refraction: sin(θ_i) / c_1 = sin(θ_t) / c_2. Refraction is the bending of the sound beam as it crosses a boundary at an oblique angle between media with different speeds."
      }
    ]
  },
  {
    id: 3,
    tag: "Chapter 04 · Pulsed Wave Operation",
    title: "Pulsed Waves & Pulse Timings",
    subtitle: "Spatial Pulse Length, Pulse Duration, Duty Factor, and Frame Rate tradeoffs.",
    content: [
      "Diagnostic 2D imaging relies on brief <strong>pulses of sound</strong> rather than continuous waves. This enables range specificity—calculating depth based on echo travel timing. <strong>Pulse Duration (PD)</strong> is the actual time a pulse lasts (PD = N &times; T), while <strong>Spatial Pulse Length (SPL)</strong> is the physical span of the pulse in space (SPL = N &times; &lambda;).",
      "SPL is the sole physical determinant of <strong>axial (range) resolution</strong>, calculated as <strong>Axial Resolution = SPL / 2</strong>. Shorter spatial pulse lengths (achieved with higher frequencies of smaller wavelength, and heavier backing dampening material to limit the number of cycles per pulse) yield outstanding axial detail.",
      "The <strong>Pulse Repetition Frequency (PRF)</strong> is the number of pulses released per second, while the <strong>Duty Factor (DF)</strong> represents the active transmission ratio: DF = PD / PRP. In diagnostic scanning, Duty Factor is extremely low, generally between 0.1% and 1.0%, meaning the system spends over 99% of its lifetime acting as a silent, receptive antenna."
    ],
    quiz: [
      {
        q: "If an ultrasound system operates with a Spatial Pulse Length (SPL) of 0.6 mm, what is the best possible axial resolution?",
        opts: ["0.6 mm", "0.3 mm", "1.2 mm", "0.15 mm"],
        a: 1,
        e: "Axial Resolution = SPL / 2. For an SPL of 0.6 mm, the axial resolution limit is 0.6 / 2 = 0.3 mm. Smaller numerical resolution is better."
      },
      {
        q: "Which system adjustment directly modifies the Pulse Repetition Frequency (PRF)?",
        opts: ["Output Power slider", "Receiver Gain knob", "Imaging Depth setting", "Dynamic Range selection"],
        a: 2,
        e: "PRF and PRP are determined solely by the depth setting. Deep imaging requires the system to wait longer for deep echoes, reducing maximum PRF."
      },
      {
        q: "What index represents the percentage of time that the system is actively transmitting acoustic pulses?",
        opts: ["Pulse Duration", "Spatial Pulse Length", "Duty Factor", "Nyquist Criterion"],
        a: 2,
        e: "The Duty Factor (DF = PD / PRP) represents the fraction of time the transducer is actively transmitting sound. Normal pulsed-wave imaging is ~0.1% to 1.0%."
      }
    ]
  },
  {
    id: 4,
    tag: "Chapter 05 · Transducers & Arrays",
    title: "Acoustic Transducer Technology",
    subtitle: "Piezoelectric conversion, transducer stacks, beam focus profiles, and electronic phased array steering.",
    content: [
      "Transducers convert electrical voltage pulses into sound waves (transmission) and returning acoustic echoes back into voltage (reception) via the <strong>Piezoelectric Effect</strong>, typically using Lead Zirconate Titanate (PZT) ceramic elements. To maximize vibration efficiency, crystals are sliced to a thickness matching exactly <strong>half the sound wavelength (&lambda;/2)</strong> within PZT.",
      "The transducer stack contains a <strong>backing (damping) material</strong> behind the crystal to suppress natural ringing, shorten SPL, and improve axial resolution. The <strong>matching layer</strong> sits on the transducer face to step down the large impedance gap between PZT and skin, sized at precisely <strong>one-quarter wavelength (&lambda;/4)</strong> to maximize forward sound transmission.",
      "For a single crystal, the beam narrows from the face to its <strong>natural focus</strong>—this region is the <strong>near field (Fresnel zone)</strong>. The length of this zone (NZL) is given by D² / (4 &lambda;). Beyond the focus, the beam diverges in the <strong>far field (Fraunhofer zone)</strong>. Phased arrays use microsecond delay patterns to electronically steer and focus the beam."
    ],
    quiz: [
      {
        q: "What occurs when an active transducer's crystal is heated above its Curie temperature?",
        opts: ["Its resonant frequency doubles", "Its matching layer is destroyed", "It permanently loses its piezoelectric properties", "Its spatial pulse length is shortened"],
        a: 2,
        e: "The Curie point is the temperature above which a piezoelectric ceramic permanently depolarizes, losing its piezoelectric capabilities. For PZT, this is approx. 200-350°C."
      },
      {
        q: "Which component of the transducer stack is designed to shorten the Spatial Pulse Length (SPL) to improve axial resolution?",
        opts: ["Matching Layer", "Damping (Backing) Material", "Acoustic Lens", "Electrical Connector shield"],
        a: 1,
        e: "The backing (damping) material is bonded behind the crystal to absorb and dampen its vibrations, reducing the number of cycles per pulse (N), which shortens the SPL."
      },
      {
        q: "A transducer's near zone length (NZL) will increase if which of the following is increased?",
        opts: ["Wavelength", "Pulse Repetition Period", "Transducer Element Diameter (Aperture)", "Receive Gain"],
        a: 2,
        e: "NZL = d² / (4λ) = (diameter² × frequency) / (4 × c). Increasing transducer diameter (aperture) or frequency will lengthen the near zone."
      }
    ]
  },
  {
    id: 5,
    tag: "Chapter 06 · System Operation",
    title: "The Signal Processing Chain",
    subtitle: "The electrical signal path: pulser, pre-processing, receiver functions, dynamic range, and scan conversion.",
    content: [
      "The system handles voltage signals in a structured signal chain: <strong>Transmitter &rarr; Transducer &rarr; Receiver &rarr; Scan Converter &rarr; Display</strong>. The transmitter (pulser) regulates the electrical voltage spike driving the crystal, controlling output acoustic power. Sonographers prefer adjusting receiver gain over output power to keep patient bioeffects low (ALARA).",
      "The Receiver processes weak returned electrical signals through five functions: <strong>Amplification, Compensation (TGC), Compression (Dynamic Range), Demodulation, and Reject</strong>. Amplification brightens the entire screen uniformly but does not alter the signal-to-noise ratio (SNR). TGC applies depth-selective gain to compensate for tissue attenuation.",
      "<strong>Compression (Dynamic Range)</strong> narrows the huge amplitude range of returned echoes (60-100 dB) to the displayable range (~20-30 dB) to match human visual perception. <strong>Write Zoom</strong> is a real-time, active acoustic magnification method that allocates more scan lines to a region, improving spatial resolution, unlike post-acquisition <strong>Read Zoom</strong>."
    ],
    quiz: [
      {
        q: "Which function of the receiver is responsible for mapping a wide dynamic range into a narrower dynamic range for display?",
        opts: ["Amplification", "Compensation (TGC)", "Compression", "Demodulation"],
        a: 2,
        e: "Compression reduces the dynamic range of signal amplitudes by applying a logarithmic function, mapping large incoming ratios to the display scale."
      },
      {
        q: "How does adjusting the system's overall receiver gain affect the signal-to-noise ratio (SNR)?",
        opts: ["It increases the SNR", "It decreases the SNR", "It does not change the SNR", "It eliminates electronic thermal noise"],
        a: 2,
        e: "Receiver Gain amplifies all received signals and noise equally. It does not alter the ratio of signal to noise (SNR). To improve SNR, you must increase transmit output power or optimize the acoustic path."
      },
      {
        q: "Which of the following describes Write Zoom?",
        opts: ["An active, pre-processing magnification that redirects scan lines to improve spatial detail", "A post-processing magnification that crops and enlarges stored pixels", "An analog-to-digital converter speed regulator", "A dynamic receive focus enhancer"],
        a: 0,
        e: "Write Zoom is a preprocessing tool. It directs all scan lines into a smaller field of view during active scanning, increasing line density and spatial detail."
      }
    ]
  },
  {
    id: 6,
    tag: "Chapter 07 · Doppler Physics",
    title: "The Doppler Shift & Spectral Mechanics",
    subtitle: "The Doppler equation, beam angle alignment, aliasing limitations, and BART color models.",
    content: [
      "The <strong>Doppler Effect</strong> measures frequency changes caused by moving targets like red blood cells. Flow toward the transducer shifts returning frequency higher (positive shift), while receding flow shifts it lower (negative shift). The shift is defined as <strong>&Delta;f = 2 f₀ v cos&theta; / c</strong>, where insonation angle (&theta;) determines sensitivity.",
      "At a perpendicular insonation angle (90&deg;), cos(90&deg;) is zero, resulting in a <strong>zero detected Doppler shift</strong>. Clinical criteria require aligning the beam at or below <strong>60&deg;</strong> to minimize estimation errors. Pulsed wave spectral Doppler is bound by the <strong>Nyquist Limit (PRF / 2)</strong>, beyond which <strong>aliasing</strong> occurs, causing waveforms to wrap around the baseline.",
      "To resolve aliasing, you can increase PRF (reduce depth), shift the baseline, lower transmit frequency, increase insonation angle, or use <strong>Continuous Wave (CW) Doppler</strong>. CW uses two separate crystals and is range-ambiguous but immune to aliasing. <strong>Color Doppler</strong> displays mean velocities overlaying the B-mode image using the BART convention."
    ],
    quiz: [
      {
        q: "At what insonation angle between the sound beam and blood flow vector is no Doppler shift detected?",
        opts: ["0 degrees", "45 degrees", "60 degrees", "90 degrees"],
        a: 3,
        e: "At 90 degrees (perpendicular insonation), the cosine is 0. Since the Doppler shift depends directly on cos(θ), no shift is detected at 90°."
      },
      {
        q: "What is the maximum Doppler shift frequency that can be measured unambiguously without aliasing in a pulsed-wave system?",
        opts: ["Twice the PRF", "Pulse Repetition Frequency", "Half the PRF (Nyquist Limit)", "Operating Frequency f₀"],
        a: 2,
        e: "According to the Nyquist criterion, the maximum frequency shift that can be sampled unambiguously is half the PRF (PRF/2). Shifts exceeding this limit alias."
      },
      {
        q: "Which Doppler mode is completely immune to aliasing, even at extreme physiological blood velocities?",
        opts: ["Pulsed Wave (PW) Doppler", "Power Doppler", "Continuous Wave (CW) Doppler", "Color Flow Doppler"],
        a: 2,
        e: "CW Doppler operates by continuously transmitting and receiving sound via separate crystals. Because it does not sample in discrete pulses, it has no Nyquist limit and cannot alias."
      }
    ]
  },
  {
    id: 7,
    tag: "Chapter 08 · Acoustic Artifacts",
    title: "Diagnostic Seductions & Optical Illusions",
    subtitle: "Shadowing, through-transmission enhancement, reverberation, speed errors, and mirror reflections.",
    content: [
      "Acoustic <strong>artifacts</strong> represent displayed structures that do not match anatomical reality. They occur when tissues violate the system's hardcoded assumptions—namely, that sound travels in a straight line at exactly 1,540 m/s with constant attenuation.",
      "<strong>Acoustic Shadowing</strong> is a dark void posterior to a highly attenuating structure (calcification or bone) which absorbs or reflects most energy. Conversely, <strong>Posterior Acoustic Enhancement</strong> is a hyper-bright region distal to low-attenuating structures like liquid cysts or blood vessels.",
      "<strong>Reverberation</strong> occurs when sound bounces continuously between two parallel highly reflective lines, displaying as equally-spaced, progressively weaker false echoes. <strong>Mirror Image</strong> occurs when a strong curved interface (like the diaphragm) acts as a mirror, duplicating a liver parenchyma lesion on the wrong side of the boundary."
    ],
    quiz: [
      {
        q: "The acoustic shadowing artifact distal to a gallstone is primarily caused by which mechanism?",
        opts: ["Acoustic enhancement", "Extreme sound attenuation (absorption/reflection) in the stone", "Refraction of the beam away from the normal", "A propagation speed error"],
        a: 1,
        e: "Shadowing occurs behind highly attenuating or reflective structures (like stones or bone) that absorb or reflect the beam's energy, leaving a dark void behind."
      },
      {
        q: "A mirror image artifact commonly occurs in the vicinity of which highly reflective, curved anatomic interface?",
        opts: ["Gallbladder wall", "Interatrial septum", "Diaphragm", "Carotid bifurcation"],
        a: 2,
        e: "The diaphragm behaves as a specular mirror for sound. Sound reflects off it, strikes adjacent liver parenchyma, and returns back via the diaphragm, creating a duplicate 'ghost' structure in the chest."
      },
      {
        q: "If ultrasound travels through a fatty liver lesion (speed = 1,450 m/s), where will the target be displayed?",
        opts: ["Too shallow (closer to probe)", "Too deep (further from probe)", "In its correct anatomical position", "Shifted laterally"],
        a: 1,
        e: "Because fat is slower than the assumed 1,540 m/s, echoes take longer (arrive late) to return. The system interprets this delay as depth, displaying the structures deeper than they actually are."
      }
    ]
  },
  {
    id: 8,
    tag: "Chapter 09 · Bioeffects & Safety",
    title: "Acoustic Outputs & Safety Guidelines",
    subtitle: "Thermal heating, mechanical cavitation, safety indexes, and the ALARA directive.",
    content: [
      "Diagnostic ultrasound is highly safe, but high acoustic pressures can affect cells. There are two primary bioeffect pathways: <strong>Thermal</strong> (tissue heating from absorption) and <strong>Mechanical</strong> (cavitation of microbubbles). The system displays safety indicators in real-time.",
      "The <strong>Thermal Index (TI)</strong> represents the ratio of current power to the power needed to elevate tissue by 1&deg;C. High absorption in bone means thermal risk is greatest at fetal cranial or neonatal bone interfaces (TIB). The <strong>Mechanical Index (MI)</strong> gauges the likelihood of mechanical cavitation: MI = Peak Negative Pressure / &radic;f₀.",
      "<strong>Stable Cavitation</strong> is the gentle oscillation of bubbles, while <strong>Transient Cavitation</strong> involves violent bubble implosion, creating extreme localized micro-shocks. Under the <strong>ALARA principle (As Low As Reasonably Achievable)</strong>, you must minimize patient exposure by keeping output power low, using receiver gain to adjust screen brightness instead."
    ],
    quiz: [
      {
        q: "Which intensity measurement is most closely linked to thermal bioeffects and tissue heating?",
        opts: ["ISPTA (Spatial Peak Temporal Average)", "ISPPA (Spatial Peak Pulse Average)", "IMAX", "SPTA (Spatial Peak Temporal Average) of CW only"],
        a: 0,
        e: "ISPTA is the spatial peak, temporal average intensity. It represents the deposition of heat in tissues over time, governing thermal index (TI) risk."
      },
      {
        q: "To reduce patient exposure under ALARA guidelines when an image is too bright, the sonographer should:",
        opts: ["Decrease overall receiver gain", "Decrease acoustic output power", "Increase operating frequency", "Decrease the imaging depth"],
        a: 1,
        e: "ALARA dictates that when an image is too bright, you should decrease transmit output power first to minimize patient exposure. If the image is too dark, increase receiver gain first."
      },
      {
        q: "Transient (inertial) cavitation is characterized by which physical process?",
        opts: ["Stable, continuous oscillation of microbubbles", "Violent expansion and collapse of gas microbubbles in the sound field", "A simple temperature rise of 1°C in tissue", "Refraction of oblique sound beams"],
        a: 1,
        e: "Transient (inertial) cavitation occurs at higher acoustic pressures where microbubbles expand rapidly and then implode violently, creating extreme local temperatures and micro-shocks."
      }
    ]
  },
  {
    id: 9,
    tag: "Chapter 10 · Contrast & Harmonics",
    title: "Harmonic Propagation & Microbubbles",
    subtitle: "Non-linear sound dynamics, tissue harmonics, microbubble resonance, and phase inversion.",
    content: [
      "Standard imaging operates at the fundamental frequency transmitted by the probe. <strong>Tissue Harmonic Imaging</strong> utilizes the wave's <strong>non-linear propagation</strong> inside tissue: compressions travel slightly faster than rarefactions, distorting the wave and generating second harmonics (2 &times; f₀).",
      "Because harmonics build up gradually as sound penetrates deep, the superficial field lacks harmonic waves. Consequently, harmonic imaging is highly effective at <strong>eliminating near-field clutter, side lobes, and reverberations</strong>, producing a crystal-clear image in difficult-to-scan patients.",
      "<strong>Ultrasound Contrast Agents</strong> are injected microbubbles (1-10 &mu;m) with gas cores and thin lipid or protein shells. These bubbles resonate non-linearly under sound waves. <strong>Pulse Inversion harmonic sequence</strong> fires two out-of-phase pulses; their fundamental echoes cancel out completely, leaving pure contrast harmonic signals."
    ],
    quiz: [
      {
        q: "If the fundamental operating frequency is 4 MHz, what is the received second harmonic frequency?",
        opts: ["2 MHz", "4 MHz", "8 MHz", "16 MHz"],
        a: 2,
        e: "The second harmonic is exactly twice (2×) the fundamental operating frequency: 4 MHz × 2 = 8 MHz."
      },
      {
        q: "How do harmonics behave in the near field?",
        opts: ["They are absent and build up progressively with depth", "They are strongest at the transducer face", "They attenuate immediately", "They travel as transverse waves"],
        a: 0,
        e: "Harmonics require high acoustic intensity and distance to build up due to non-linear distortion. Therefore, they are negligible in the near field (clutter-free zone) and reach a peak at depth."
      },
      {
        q: "Pulse inversion harmonic imaging is primarily designed to:",
        opts: ["Cancel fundamental echoes and isolate pure non-linear harmonic reflections", "Increase the Nyquist limit of Doppler shifts", "Enhance Rayleigh scattering from erythrocytes", "Eliminate acoustic shadowing in gallstones"],
        a: 0,
        e: "Pulse inversion fires two successive pulses that are 180° out of phase. The linear fundamental echoes cancel out when summed, leaving only non-linear harmonic signals."
      }
    ]
  },
  {
    id: 10,
    tag: "Chapter 11 · Quality Assurance",
    title: "Equipment Performance & Statistics",
    subtitle: "Laboratory accreditation, QA phantoms, statistical tables for diagnostic accuracy.",
    content: [
      "Quality Assurance (QA) involves the routine testing of equipment to ensure clinical standards. Accreditation bodies (ACR, AIUM, IAC) mandate that labs document performance measurements. Testing utilizes <strong>tissue-equivalent phantoms</strong> with embedded wires and targets of known reflectivity.",
      "Phantoms assess <strong>Axial Resolution</strong> (closely-spaced vertical wires), <strong>Lateral Resolution</strong> (horizontal wire spacing), <strong>Caliper Calibration</strong> (exact distance accuracy), and depth of penetration. Doppler performance is tested using flow phantoms (pumping blood-mimicking fluid) or moving string phantoms.",
      "System diagnostic accuracy is measured using a <strong>2&times;2 Contingency Table</strong> comparing testing against a gold standard. <strong>Sensitivity = TP / (TP + FN)</strong> shows the ability to detect disease, while <strong>Specificity = TN / (TN + FP)</strong> shows the ability to rule out false positives. PPV is the ratio of true positives to all positive tests."
    ],
    quiz: [
      {
        q: "A tissue-equivalent phantom mimics average soft tissue in terms of which property?",
        opts: ["Only density and color", "Resonant frequency and impedance", "Propagation speed (1,540 m/s) and attenuation coefficient (0.5 dB/cm/MHz)", "Bit depth and sampling rate"],
        a: 2,
        e: "Tissue phantoms are built using gels with physical properties that propagate sound at 1,540 m/s and replicate average tissue attenuation of 0.5 dB/cm/MHz."
      },
      {
        q: "The statistical index representing a test's ability to correctly identify the ABSENCE of disease (no false positives) is:",
        opts: ["Sensitivity", "Specificity", "Positive Predictive Value", "Accuracy"],
        a: 1,
        e: "Specificity measures the true negative rate: Specificity = TN / (TN + FP). A highly specific test has a very low false-positive rate."
      },
      {
        q: "If 100 diseased patients are evaluated and the test correctly identifies 95 of them, what is the sensitivity of the test?",
        opts: ["5%", "90%", "95%", "100%"],
        a: 2,
        e: "Sensitivity = True Positives / Total Diseased = 95 / 100 = 95%. This quantifies the test's ability to identify disease."
      }
    ]
  },
  {
    id: 11,
    tag: "Chapter 12 · Fluid Dynamics",
    title: "Physical Laws of Flow & Resistance",
    subtitle: "Ohm's Hemodynamic Law, Poiseuille's 4th-power relationship, and the Bernoulli pressure drop.",
    content: [
      "Fluid dynamics defines blood flow parameters. Flow volume (Q) is governed by driving pressure and resistance: <strong>Q = &Delta;P / R</strong>. This mimics Ohm's Law in electrical circuits (V = I &times; R). Resistance is determined by fluid viscosity, vessel length, and most importantly, radius.",
      "<strong>Poiseuille's Law</strong> defines resistance: <strong>R &prop; 1 / r⁴</strong>. Because resistance is inversely proportional to the fourth power of radius, a 50% reduction in vessel diameter (radius halved) increases resistance 16-fold (2⁴). This massive exponential increase dramatically restricts flow downstream.",
      "The <strong>Continuity Equation (A₁v₁ = A₂v₂)</strong> explains that blood velocity must increase through a stenosis to maintain constant volumetric flow. The <strong>Modified Bernoulli Equation (&Delta;P = 4 v²)</strong> calculates pressure drop based on peak velocity across a stenotic valve, translating kinetic velocity into pressure gradients."
    ],
    quiz: [
      {
        q: "According to Poiseuille's Law, if a vessel's radius is reduced by half due to atherosclerotic plaque, what happens to resistance?",
        opts: ["It doubles (2-fold increase)", "It quadruples (4-fold increase)", "It increases 8-fold", "It increases 16-fold"],
        a: 3,
        e: "Resistance of a vessel is inversely proportional to radius to the 4th power (r⁴). Halving radius leads to an increase in resistance equal to 2⁴ = 16-fold."
      },
      {
        q: "The continuity equation states that in a closed vessel, if cross-sectional area decreases, what happens to velocity?",
        opts: ["It decreases", "It increases proportionally to maintain constant flow", "It remains unchanged", "It turns turbulent"],
        a: 1,
        e: "Continuity: Area × Velocity = Constant. To maintain volumetric flow rate through a narrowed area, local velocity must increase proportionally."
      },
      {
        q: "If the peak velocity measured distal to a stenotic aortic valve is 4 m/s, what is the estimated pressure gradient?",
        opts: ["16 mmHg", "32 mmHg", "64 mmHg", "100 mmHg"],
        a: 2,
        e: "Modified Bernoulli pressure gradient formula: ΔP = 4v². For a velocity v of 4 m/s: ΔP = 4 × (4)² = 4 × 16 = 64 mmHg."
      }
    ]
  },
  {
    id: 12,
    tag: "Chapter 13 · Clinical Hemodynamics",
    title: "Cardiovascular Waveforms & Pathologies",
    subtitle: "Triphasic vs monophasic waveforms, parvus-tardus stenotic indicators, and deep vein thrombosis signs.",
    content: [
      "Hemodynamics applies fluid laws to the vascular system. Arterial waveforms reflect downstream tissue resistance: <strong>High-Resistance flow</strong> (triphasic wave with transient early diastolic flow reversal and zero late-diastolic flow) is normal in fasting extremities, while <strong>Low-Resistance flow</strong> (broad monophasic systolic peaks with high, continuous diastolic flow) supplies vital organs.",
      "When a hemodynamically significant stenosis is present, it alters the waveform downstream, creating a <strong>Parvus-Tardus waveform</strong>. This is marked by a weakened, low amplitude peak (parvus) and a delayed, sluggish systolic upstroke (tardus), with acceleration times exceeding 80–100 ms.",
      "Venous flow is low-pressure and varies with respiration. In deep extremities, <strong>respiratory phasicity</strong> and distal compression augmentation confirm patency. <strong>Deep Vein Thrombosis (DVT)</strong> is diagnosed by a complete loss of respiratory phasicity, inability to compress the vein wall under direct probe pressure, and absent Doppler signals."
    ],
    quiz: [
      {
        q: "Which vessel typifies a low-resistance waveform with continuous, high forward diastolic flow?",
        opts: ["Fasting superficial femoral artery", "Renal artery", "Resting radial artery", "Normal posterior tibial artery"],
        a: 1,
        e: "The kidneys are vital organs requiring a constant, uninterrupted supply of blood throughout cardiac cycle. The renal artery thus displays a low-resistance waveform with persistent diastolic flow."
      },
      {
        q: "A tardus-parvus waveform detected in a peripheral artery suggests which upstream pathology?",
        opts: ["An acute deep vein thrombosis", "A severe proximal arterial stenosis", "Downstream arteriolar vasodilation", "Aortic valve insufficiency"],
        a: 1,
        e: "Tardus-parvus (delayed upstroke and dampened amplitude) occurs downstream from a severe, hemodynamically significant proximal arterial stenosis."
      },
      {
        q: "What visual finding remains the most reliable primary criterion for diagnosing acute lower extremity DVT during a B-mode exam?",
        opts: ["A high-resistance triphasic spectral wave", "The absence of cardiac pulsatility in the vein", "The inability of the vein walls to fully compress under direct probe pressure", "A sudden color flash (blossoming) on color Doppler"],
        a: 2,
        e: "The absolute gold standard sign for DVT is the non-compressibility of the vein wall on direct transverse compression view under B-mode ultrasound."
      }
    ]
  }
];

const CHAPTER_FIGURES: Record<number, { src: string; caption: string; alt: string; title: string }> = {
  0: {
    src: '/src/assets/images/ultrasound_depth_13us_1780312184191.png',
    title: 'Figure 1.1: Range Equation & Time-of-Flight Mapping',
    caption: 'This clinical schematic illustrates the 13-microsecond range-equation rule in diagnostic medical sonography. As the sound pulse travels through soft tissue at a constant velocity of 1,540 m/s, it requires exactly 13 µs of total round-trip time-of-flight to sample each centimeter of anatomical depth.',
    alt: 'High-contrast neon mathematical wave-pathing diagram showing reflector flight timings.'
  },
  1: {
    src: '/src/assets/images/ultrasound_waves_1779739883039.png',
    title: 'Figure 2.1: Mechanical Longitudinal Wave Propagation',
    caption: 'A high-fidelity depiction of mechanical acoustic waves traversing tissue media. Compressions show areas of elevated molecular density and pressure, while rarefactions correspond to low-density expansion phases.',
    alt: 'Vibrant medical schematic showing parallel molecular compression fields.'
  },
  2: {
    src: '/src/assets/images/ultrasound_frequency_1779739899960.png',
    title: 'Figure 3.1: Frequency vs Spatial Resolution & Attenuation Decay',
    caption: 'Compares a 10 MHz high-frequency pulse versus a 5 MHz penetration wave. High operating frequencies offer pristine spatial resolution but experience rapid absorption and attenuation, limiting deep tissue access.',
    alt: 'Medical graph illustrating wave decay gradients as a function of depth and frequency.'
  },
  3: {
    src: '/src/assets/images/ultrasound_pulsed_wave_timing_1780381493749.png',
    title: 'Figure 4.1: Pulsed Wave Timings',
    caption: 'A highly detailed visual schematic showing a pulsed ultrasound wave, demonstrating pulse duration, spatial pulse length, and pulse repetition period.',
    alt: 'Pulsed wave temporal timings diagram.'
  },
  4: {
    src: '/src/assets/images/ultrasound_crystal_1779739915821.png',
    title: 'Figure 5.1: Piezoelectric Transducer Stack Assembly',
    caption: 'A detailed structural layout of a single-element medical ultrasound transducer. Showcases the active Lead Zirconate Titanate (PZT) ceramic crystal, the backing damping block to shorten pulse lengths, and the optimal quarter-wavelength matching layer.',
    alt: 'Structural schematic of a modern diagnostic ultrasound probe crystal stack.'
  },
  5: {
    src: '/src/assets/images/ultrasound_signal_processing_chain_1780381509944.png',
    title: 'Figure 6.1: Signal Processing Chain',
    caption: 'A highly detailed block diagram of an ultrasound system signal processing chain, from transmitter and active crystal array down through the receiver, scan converter, and finally to the display monitor.',
    alt: 'System configuration and processing sequence logic diagram.'
  },
  6: {
    src: '/src/assets/images/ultrasound_doppler_angle_1780312204285.png',
    title: 'Figure 7.1: Vascular Doppler Intercept Metrics & Cosine Geometry',
    caption: 'Vascular blood velocity vectors and the sound-beam steering angle relative to fluid direction. Standard clinical angle calibration must seek a 60-degree intercept to bound frequency shifts within linear cosine scaling.',
    alt: 'Neon clinical diagram of blood flow vectors in a vessel intercepted by an angled Doppler beam.'
  },
  7: {
    src: '/src/assets/images/ultrasound_artifacts_shadow_1780312223092.png',
    title: 'Figure 8.1: Diagnostic Ultrasound Shadows and Comet-Tail Artifacts',
    caption: 'Underlying biomechanics of acoustic shadow lines cast behind highly reflective kidney stones, and parallel linear reverberations occurring inside fluid-tissue boundaries.',
    alt: 'Medical illustration demonstrating acoustic shadowing underneath calcification lesions.'
  },
  8: {
    src: '/src/assets/images/ultrasound_safety_alara_1780312243868.png',
    title: 'Figure 9.1: Bioeffects Limits & Safety Monitoring Dashboards',
    caption: 'Demonstrates real-world calibration gauges evaluating Mechanical Index (MI) cavitation risk and Thermal Index (TI) temperature escalation levels to enforce the clinical ALARA standard.',
    alt: 'Safety diagram indicating thermal heating and mechanical cavitation boundaries.'
  }
};

export default function MasterTextbook() {
  const { user } = useAuth();
  const [studyStyle, setStudyStyle] = useState<'standard' | 'bourdain' | 'sedaris'>(() => {
    const local = localStorage.getItem('spi_textbook_style');
    return (local === 'standard' || local === 'bourdain' || local === 'sedaris') ? local : 'standard';
  });
  const [activeCh, setActiveCh] = useState<number>(() => {
    const local = localStorage.getItem('spi_textbook_ch');
    return local ? parseInt(local, 10) : 0;
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>(() => {
    const local = localStorage.getItem('spi_textbook_quiz_answers');
    try {
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>(() => {
    const local = localStorage.getItem('spi_textbook_quiz_answers');
    try {
      if (local) {
        const parsed = JSON.parse(local);
        const explanations: Record<string, boolean> = {};
        Object.keys(parsed).forEach(key => {
          explanations[key] = true;
        });
        return explanations;
      }
    } catch {}
    return {};
  });
  const [currentBourdainIndex, setCurrentBourdainIndex] = useState<number>(() => {
    const local = localStorage.getItem('spi_textbook_bourdain_idx');
    return local ? parseInt(local, 10) : 0;
  });
  
  // Custom states for simulations
  const [waveFreq, setWaveFreq] = useState(3);
  const [waveAmp, setWaveAmp] = useState(32);
  const [waveAtt, setWaveAtt] = useState(25);
  
  const [doppAngle, setDoppAngle] = useState(45);
  const [doppVel, setDoppVel] = useState(60);

  // States for the newly illustrated 13 course chapters
  const [dbCalcRatio, setDbCalcRatio] = useState(2);
  const [ch3Depth, setCh3Depth] = useState(5);
  const [ch3Freq, setCh3Freq] = useState(5);
  const [ch4Depth, setCh4Depth] = useState(6);
  const [ch4Cycles, setCh4Cycles] = useState(3);
  const [ch5Diameter, setCh5Diameter] = useState(10);
  const [ch5Freq, setCh5Freq] = useState(5);
  const [ch6Gain, setCh6Gain] = useState(45);
  const [ch6TGC, setCh6TGC] = useState<number[]>([10, 22, 35, 48, 60]);
  const [ch6Compression, setCh6Compression] = useState(60);
  const [ch8Mode, setCh8Mode] = useState<'shadow' | 'enhancement'>('shadow');
  const [ch9Pressure, setCh9Pressure] = useState(0.6);
  const [ch9Freq, setCh9Freq] = useState(5);
  const [ch11TP, setCh11TP] = useState(92);
  const [ch11FN, setCh11FN] = useState(8);
  const [ch11TN, setCh11TN] = useState(85);
  const [ch11FP, setCh11FP] = useState(15);
  const [ch12Radius, setCh12Radius] = useState(100); // % radius relative to normal
  const [ch12Viscosity, setCh12Viscosity] = useState(3.5);
  const [ch13RI, setCh13RI] = useState(0.7);
  const [ch13ExtremityFlow, setCh13ExtremityFlow] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Navigation drawer & Elegant navigation HUD states
  const [isLessonMapOpen, setIsLessonMapOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [showShortcutIndicator, setShowShortcutIndicator] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper score / completion states
  const getChapterScore = (chIdx: number) => {
    const ch = CHAPTERS[chIdx];
    if (!ch) return { answered: 0, total: 3, correct: 0 };
    let answered = 0;
    let correct = 0;
    ch.quiz.forEach((q, qIdx) => {
      const key = `${chIdx}-${qIdx}`;
      const ans = quizAnswers[key];
      if (ans !== undefined) {
        answered++;
        if (ans === q.a) {
          correct++;
        }
      }
    });
    return { answered, total: ch.quiz.length, correct };
  };

  const getChaptersTotalProgress = () => {
    let totalQuestions = 0;
    let answeredQuestions = 0;
    let correctQuestions = 0;
    CHAPTERS.forEach((ch, chIdx) => {
      const score = getChapterScore(chIdx);
      totalQuestions += score.total;
      answeredQuestions += score.answered;
      correctQuestions += score.correct;
    });
    return { 
      totalQuestions, 
      answeredQuestions, 
      correctQuestions, 
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0 
    };
  };

  // Keyboard shortcut listener (tactile navigation for sonographers)
  useEffect(() => {
    const activeLecturesArray = studyStyle === 'sedaris' ? SEDARIS_LECTURES : BOURDAIN_LECTURES;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (studyStyle === 'standard') {
          if (activeCh > 0) {
            e.preventDefault();
            setActiveCh(prev => prev - 1);
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            triggerShortcutIndicator();
          }
        } else {
          if (currentBourdainIndex > 0) {
            e.preventDefault();
            setCurrentBourdainIndex(prev => prev - 1);
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            triggerShortcutIndicator();
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (studyStyle === 'standard') {
          if (activeCh < CHAPTERS.length - 1) {
            e.preventDefault();
            setActiveCh(prev => prev + 1);
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            triggerShortcutIndicator();
          }
        } else {
          if (currentBourdainIndex < activeLecturesArray.length - 1) {
            e.preventDefault();
            setCurrentBourdainIndex(prev => prev + 1);
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            triggerShortcutIndicator();
          }
        }
      }
    };

    let indicatorTimeout: NodeJS.Timeout;
    const triggerShortcutIndicator = () => {
      setShowShortcutIndicator(true);
      clearTimeout(indicatorTimeout);
      indicatorTimeout = setTimeout(() => setShowShortcutIndicator(false), 1200);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(indicatorTimeout);
    };
  }, [studyStyle, activeCh, currentBourdainIndex]);

  // Scroll tracer on the container ref to show/hide the floating scroll hud
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop > 350) {
        setShowFloatingNav(true);
      } else {
        setShowFloatingNav(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef.current]);

  // Load progress from Firestore on user log in
  useEffect(() => {
    if (!user) return;

    const loadProgress = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.textbookProgress) {
            const progress = data.textbookProgress;
            if (progress.activeCh !== undefined) setActiveCh(progress.activeCh);
            if (progress.quizAnswers !== undefined) {
              setQuizAnswers(progress.quizAnswers);
              const explanations: Record<string, boolean> = {};
              Object.keys(progress.quizAnswers).forEach(key => {
                explanations[key] = true;
              });
              setShowExplanation(explanations);
            }
            if (progress.studyStyle !== undefined) setStudyStyle(progress.studyStyle);
            if (progress.currentBourdainIndex !== undefined) setCurrentBourdainIndex(progress.currentBourdainIndex);
          }
        }
      } catch (err) {
        console.warn('Error loading textbook progress from Firestore:', err);
      }
    };

    loadProgress();
  }, [user]);

  // Save to local storage automatically
  useEffect(() => {
    localStorage.setItem('spi_textbook_ch', activeCh.toString());
  }, [activeCh]);

  useEffect(() => {
    localStorage.setItem('spi_textbook_quiz_answers', JSON.stringify(quizAnswers));
  }, [quizAnswers]);

  useEffect(() => {
    localStorage.setItem('spi_textbook_bourdain_idx', currentBourdainIndex.toString());
  }, [currentBourdainIndex]);

  useEffect(() => {
    localStorage.setItem('spi_textbook_style', studyStyle);
  }, [studyStyle]);

  const handleSaveProgress = async () => {
    if (!user) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        textbookProgress: {
          activeCh,
          quizAnswers,
          studyStyle,
          currentBourdainIndex,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving progress to Firestore:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Active Lectures Array mapping dynamically
  const isSedaris = studyStyle === 'sedaris';
  const themeColorClass = isSedaris ? 'text-violet-400' : 'text-amber-500';
  const themeColorClassBorder = isSedaris ? 'border-violet-500' : 'border-amber-500';
  const themeColorClassBgLight = isSedaris ? 'bg-violet-500/10' : 'bg-amber-500/10';
  const themeColorClassRing = isSedaris ? 'focus:ring-violet-500' : 'focus:ring-amber-500';
  const themeColorClassDotActive = isSedaris ? 'bg-violet-500' : 'bg-amber-500';
  const selectLabel = isSedaris ? "Select Active Essay" : "Select Active Lesson";
  const selectSublabel = isSedaris ? "Jump to any professional clinical essay" : "Jump to any clinical masterclass";
  const activeLecturesArray = isSedaris ? SEDARIS_LECTURES : BOURDAIN_LECTURES;

  const { speak, stop, isSpeaking: isPlayingText } = useNarrator();

  useEffect(() => {
    // Cancel any active speech when changing lessons or style
    stop();
  }, [currentBourdainIndex, studyStyle, stop]);

  const toggleSpeakBourdain = () => {
    if (isPlayingText) {
      stop();
    } else {
      const activeLesson = isSedaris ? SEDARIS_LECTURES[currentBourdainIndex] : BOURDAIN_LECTURES[currentBourdainIndex];
      const paragraphsText = activeLesson.content.join('. ');
      const textToSpeak = `${activeLesson.title}. ${activeLesson.subtitle}. ${paragraphsText}`;
      speak(textToSpeak, studyStyle);
    }
  };

  const chapter = CHAPTERS[activeCh];
  const activeLesson = activeLecturesArray[currentBourdainIndex] || activeLecturesArray[0];

  const handleAnswer = (qIndex: number, optIndex: number) => {
    const key = `${activeCh}-${qIndex}`;
    if (quizAnswers[key] !== undefined) return;
    setQuizAnswers(prev => ({ ...prev, [key]: optIndex }));
    setShowExplanation(prev => ({ ...prev, [key]: true }));

    // Reward XP & Coins for completing quiz questions in the textbook
    try {
      const correctIndex = chapter.quiz[qIndex].a;
      const isCorrect = optIndex === correctIndex;
      const baseXP = isCorrect ? 25 : 5;
      const baseCoins = isCorrect ? 10 : 2;

      // Double XP if booster purchased
      let hasDoubleXP = false;
      const localG = localStorage.getItem('spi_gamification_v1');
      if (localG) {
        try {
          const parsed = JSON.parse(localG);
          if (parsed.unlockedPowerUps && parsed.unlockedPowerUps.includes('double_xp')) {
            hasDoubleXP = true;
          }
        } catch {}
      }

      const finalXP = hasDoubleXP ? baseXP * 2 : baseXP;
      const finalCoins = hasDoubleXP ? baseCoins * 2 : baseCoins;

      if (user) {
        // Cloud Profile Update
        const activeId = localStorage.getItem(`active_profile_${user.uid}`) || 'primary-operator';
        const profRef = doc(db, 'users', user.uid, 'profiles', activeId);
        getDoc(profRef).then(snap => {
          if (snap.exists()) {
            const current = snap.data();
            const nextXP = (current.xp !== undefined ? current.xp : 220) + finalXP;
            const nextCoins = (current.coins !== undefined ? current.coins : 75) + finalCoins;
            setDoc(profRef, { xp: nextXP, coins: nextCoins }, { merge: true }).then(() => {
              window.dispatchEvent(new Event('storage'));
            });
          }
        }).catch(err => console.warn(err));

        // Sync to primary state
        const docRef = doc(db, 'users', user.uid);
        getDoc(docRef).then(snap => {
          if (snap.exists() && snap.data().gamification) {
            const g = snap.data().gamification;
            const nextXP = (g.xp !== undefined ? g.xp : 220) + finalXP;
            const nextCoins = (g.tokens !== undefined ? g.tokens : 75) + finalCoins;
            setDoc(docRef, { 
              gamification: {
                ...g,
                xp: nextXP,
                tokens: nextCoins
              }
            }, { merge: true });
          }
        }).catch(err => console.warn(err));
      } else {
        // Guest Profile Update
        const activeId = localStorage.getItem('active_profile_guest') || 'guest-student';
        const localProfs = localStorage.getItem('guest_operator_profiles');
        if (localProfs) {
          try {
            const parsed = JSON.parse(localProfs);
            const updatedProfs = parsed.map((p: any) => {
              if (p.id === activeId) {
                return {
                  ...p,
                  xp: (p.xp !== undefined ? p.xp : 220) + finalXP,
                  coins: (p.coins !== undefined ? p.coins : 75) + finalCoins
                };
              }
              return p;
            });
            localStorage.setItem('guest_operator_profiles', JSON.stringify(updatedProfs));
          } catch {}
        }

        // Also update standard fallback state
        if (localG) {
          try {
            const parsed = JSON.parse(localG);
            parsed.xp = (parsed.xp !== undefined ? parsed.xp : 220) + finalXP;
            parsed.tokens = (parsed.tokens !== undefined ? parsed.tokens : 75) + finalCoins;
            localStorage.setItem('spi_gamification_v1', JSON.stringify(parsed));
          } catch {}
        }
      }

      // Dispatch event to synchronize pages instantly
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn("Could not synchronize quiz progress to gamified profile", e);
    }
  };

  return (
    <div ref={scrollRef} className="flex flex-col h-full bg-[#0c0d10] overflow-y-auto custom-scrollbar">
      {/* Hero Banner */}
      <div className="w-full relative h-48 md:h-64 border-b border-[#2d3139]/40 flex items-center justify-center shrink-0">
         <img src="/src/assets/images/ultrasound_academic_library_1780381440826.png" className="absolute inset-0 w-full h-full object-cover opacity-50 select-none" alt="Academy Library" referrerPolicy="no-referrer" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-transparent to-[#0c0d10]/40" />
         <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-2xl md:text-4xl font-serif text-white tracking-wide shadow-black drop-shadow-2xl mb-2"><span className="text-yellow-400 font-mono font-bold">U.U.U.</span> UNDERGROUND <span className="text-[#00d1ff]">ACADEMY</span></h1>
            <p className="text-[10px] md:text-xs font-mono text-[#00d1ff] tracking-widest uppercase shadow-black drop-shadow-md bg-[#00d1ff]/10 border border-[#00d1ff]/20 px-4 py-1.5 rounded-full backdrop-blur">World-Class Ultrasound Education Curriculum</p>
         </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Toggle Mode Selector */}
        <div className="flex border-b border-white/5 pb-8 mb-8 justify-between items-center gap-4 flex-wrap">
          <div className="flex bg-[#16181d] p-1 rounded-xl border border-white/10 gap-1 shadow-inner shadow-black/40 flex-wrap">
            <button
              onClick={() => setStudyStyle('standard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${studyStyle === 'standard' ? 'bg-[#00d1ff] text-black shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen size={14} />
              SPI Syllabus Manual
            </button>
            <button
              onClick={() => setStudyStyle('bourdain')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${studyStyle === 'bourdain' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
            >
              <Flame size={14} className="fill-current" />
              Bourdain Mode
            </button>
            <button
              onClick={() => setStudyStyle('sedaris')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${studyStyle === 'sedaris' ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
            >
              <Volume2 size={14} />
              Sedaris Mode
            </button>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSaveProgress}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : saveStatus === 'saving'
                  ? 'bg-[#00d1ff]/10 border-[#00d1ff]/50 text-[#00d1ff] animate-pulse'
                  : saveStatus === 'error' && !user
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                  : saveStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-white/5 border-white/10 text-[#8e9299] hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
              title={user ? "Sync textbook chapters & quiz answers to database" : "Progress is kept in local memory. Login at the page header to save to the cloud!"}
            >
              <Save size={12} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
              {saveStatus === 'saved' && "Progress Synced!"}
              {saveStatus === 'saving' && "Syncing Cloud..."}
              {saveStatus === 'error' && !user && "Saved locally (Sign in for Cloud)"}
              {saveStatus === 'error' && user && "Sync Error! Retry"}
              {saveStatus === 'idle' && (user ? "Save Progress" : "Save Locally")}
            </button>

            <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              SONICBUILD_ACADEMY
            </div>
          </div>
        </div>

        {studyStyle === 'standard' ? (
          <motion.div 
            key={`standard-${activeCh}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Standard Chapter Selector Dropdown */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#16181d] border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="space-y-1 w-full md:w-auto">
                <span className="text-[9px] uppercase tracking-widest font-mono text-[#00d1ff] font-bold block">Syllabus Guide</span>
                <h3 className="text-sm font-sans font-medium text-[#c0c3cc]">Jump to any core registry chapter</h3>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto md:flex-1 md:justify-end max-w-xl">
                <select
                  value={activeCh}
                  onChange={(e) => {
                    setActiveCh(parseInt(e.target.value));
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#0c0d10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00d1ff] flex-1 min-w-0 cursor-pointer"
                >
                  {CHAPTERS.map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {ch.tag.split(' · ')[0]}: {ch.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsLessonMapOpen(true)}
                  className="px-4 py-3 rounded-xl border border-[#00d1ff]/20 bg-[#00d1ff]/5 hover:bg-[#00d1ff]/10 text-[#00d1ff] flex items-center justify-center gap-2 hover:border-[#00d1ff]/50 transition-all font-bold cursor-pointer font-sans shrink-0"
                  title="Open visual syllabus directory map"
                >
                  <Compass size={16} className="animate-pulse" />
                  <span className="hidden sm:inline text-xs font-mono tracking-wider">MAP</span>
                </button>
              </div>
            </div>

            {/* Header */}
            <header className="border-b border-white/5 pb-6 sm:pb-8">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#00d1ff] tracking-[0.2em] uppercase mb-4 block">
                {chapter.tag}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white mb-4 leading-tight">
                {chapter.title}
              </h1>
              <p className="text-base sm:text-lg text-[#8e9299] leading-relaxed max-w-2xl font-sans">
                {chapter.subtitle}
              </p>
            </header>

            {/* Interactive Lab Section */}
            {activeCh === 0 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Interactive DB Decibel Calculator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    dB = 10 · log₁₀(Power Ratio)
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Slide to adjust the <strong>power/intensity ratio</strong>. Watch how decibels compute. Remember: doubling power always adds <strong>+3 dB</strong>, while cutting power in half subtracts <strong>-3 dB</strong>. A 10-fold increase represents <strong>+10 dB</strong>.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Power Ratio multiplier</span>
                        <span className="text-cyan-400 font-mono text-xs">×{dbCalcRatio.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="20" 
                        step="0.1" 
                        value={dbCalcRatio} 
                        onChange={e => setDbCalcRatio(parseFloat(e.target.value))} 
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                      />
                    </div>
                  </div>

                  <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                    <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-wider">Resulting Gain/Loss</div>
                    <div className="text-3xl font-serif font-black text-cyan-400 font-mono">
                      {(10 * Math.log10(dbCalcRatio)).toFixed(2)} dB
                    </div>
                    <div className="text-[11px] text-[#8e9299] font-sans">
                      {dbCalcRatio >= 1 ? (
                        <span>Signals are amplified (Power increased by {(dbCalcRatio).toFixed(1)}x)</span>
                      ) : (
                        <span>Signals are attenuated (Intensity reduced to {(dbCalcRatio * 100).toFixed(1)}% of original)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 1 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Mechanical Longitudinal Wave Simulator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    λ = {(1540 / waveFreq / 1000).toFixed(3)} mm in Soft Tissue
                  </div>
                </div>
                
                <WaveSim frequency={waveFreq} amplitude={waveAmp} attenuation={waveAtt} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                      <span>Transducer Frequency</span>
                      <span className="text-cyan-400 font-mono">{waveFreq} MHz</span>
                    </div>
                    <input type="range" min="1" max="10" step="0.5" value={waveFreq} onChange={e => setWaveFreq(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                      <span>Acoustic Amplitude</span>
                      <span className="text-cyan-400 font-mono">{waveAmp}</span>
                    </div>
                    <input type="range" min="10" max="60" value={waveAmp} onChange={e => setWaveAmp(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                      <span>Medium Attenuation</span>
                      <span className="text-cyan-400 font-mono">{waveAtt}%</span>
                    </div>
                    <input type="range" min="0" max="90" value={waveAtt} onChange={e => setWaveAtt(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                </div>
              </div>
            )}

            {activeCh === 2 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#ffd700]">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Interactive Attenuation & Decay Chart</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    Loss = 0.5 dB / cm / MHz (Soft Tissue)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Adjust depth and frequency to compute total path loss. See how tissue attenuation drains acoustic energy. Fluids have very low attenuation (causes enhancement), while bone and lungs absorb/reflect sand in extreme dB ratios (causes shadowing).
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Target Tissue Depth</span>
                        <span className="text-[#ffd700] font-mono">{ch3Depth} cm</span>
                      </div>
                      <input type="range" min="2" max="15" step="1" value={ch3Depth} onChange={e => setCh3Depth(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#ffd700]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Transducer Frequency</span>
                        <span className="text-[#ffd700] font-mono">{ch3Freq} MHz</span>
                      </div>
                      <input type="range" min="2" max="12" step="1" value={ch3Freq} onChange={e => setCh3Freq(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#ffd700]" />
                    </div>
                  </div>

                  <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col justify-center space-y-2.5">
                    <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-wider border-b border-white/5 pb-1">Path Loss Estimates (Round Trip)</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8e9299]">Soft Tissue Loss:</span>
                      <span className="text-rose-400 font-mono text-right font-bold">{(0.5 * ch3Depth * ch3Freq * 2).toFixed(1)} dB</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8e9299]">Blood Loss (Very low):</span>
                      <span className="text-teal-400 font-mono text-right font-bold">{(0.18 * ch3Depth * ch3Freq * 2).toFixed(1)} dB</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8e9299]">Bone Loss (High shadow):</span>
                      <span className="text-red-500 font-mono text-right font-bold">{(8.0 * ch3Depth * ch3Freq * 2).toFixed(1)} dB</span>
                    </div>
                    <div className="text-[10px] text-[#8e9299] italic leading-tight pt-1 border-t border-white/5">
                      "At {ch3Freq} MHz and {ch3Depth} cm depth, sound must travel {ch3Depth * 2} cm round-trip. Energy is heavily absorbed by bone."
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 3 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Pulsed Timeline & Spatial Pulse Length (SPL)</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    Axial Resolution = SPL / 2
                  </div>
                </div>

                <div className="space-y-4">
                  {/* SVG Pulsed Timeline Illustration */}
                  <div className="h-20 bg-[#0c0d10] rounded-xl border border-white/5 relative overflow-hidden flex items-center">
                    <div className="absolute left-4 text-[9px] font-mono uppercase text-[#8e9299] select-none">Transmitted Pulses:</div>
                    <div className="flex w-full justify-around pl-32 pr-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col items-center relative">
                          <div className="w-10 h-8 flex items-center justify-center bg-cyan-500/20 border-x border-cyan-400 rounded-sm">
                            <span className="text-[8px] text-cyan-300 font-mono font-bold">PULSE</span>
                          </div>
                          <div className="w-24 h-1 bg-[#8e9299]/20 mt-1 flex items-center justify-center">
                            <span className="text-[7px] text-[#8e9299] font-mono">LISTENING</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Imaging Depth</span>
                          <span className="text-cyan-400 font-mono">{ch4Depth} cm</span>
                        </div>
                        <input type="range" min="3" max="15" step="1" value={ch4Depth} onChange={e => setCh4Depth(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Cycles per Pulse (damping)</span>
                          <span className="text-cyan-400 font-mono">{ch4Cycles} Cycles</span>
                        </div>
                        <input type="range" min="2" max="5" step="1" value={ch4Cycles} onChange={e => setCh4Cycles(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                      </div>
                    </div>

                    <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Pulse Duration (PD):</span>
                        <span className="text-white font-mono">{(ch4Cycles / 5).toFixed(2)} &mu;s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Pulse Repet. Period (PRP):</span>
                        <span className="text-white font-mono">{(ch4Depth * 13).toFixed(1)} &mu;s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Pulse Repet. Freq (PRF):</span>
                        <span className="text-[#00d1ff] font-mono font-bold">{(1000 / (ch4Depth * 13)).toFixed(1)} kHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Spatial Pulse Length (SPL):</span>
                        <span className="text-[#00d1ff] font-mono">{(ch4Cycles * (1.54 / 5)).toFixed(3)} mm</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2.5 font-bold">
                        <span className="text-[#ffd700]">Axial Resolution Limit:</span>
                        <span className="text-[#ffd700] font-mono">{((ch4Cycles * (1.54 / 5)) / 2).toFixed(3)} mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 4 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Beam Boundaries & Near Zone Simulator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    NZL = D² · f / (4 · c)
                  </div>
                </div>

                <div className="space-y-4">
                  {/* SVG Sound Beam Profile */}
                  <div className="h-28 bg-[#0c0d10] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center p-4">
                    <svg className="w-full h-full" viewBox="0 0 500 100">
                      {/* Transducer face */}
                      <rect x="10" y={50 - ch5Diameter} width="12" height={ch5Diameter * 2} fill="#ea580c" rx="2" />
                      <text x="25" y={50 - ch5Diameter - 4} fill="#ea580c" className="text-[7px] font-mono uppercase font-bold">PZT Crystal</text>
                      
                      {/* Near Zone Length Line */}
                      {/* Let's compute NZL pixels. NZL = diameter^2 * freq / factor. Max NZL pixel is around 300 */}
                      {(() => {
                        const nzlPixels = Math.min(380, Math.max(80, (ch5Diameter * ch5Diameter * ch5Freq) / 2.5));
                        const focusYWidth = 8;
                        const farWidth = Math.min(45, Math.max(15, 60 / (ch5Freq * 0.5)));
                        
                        return (
                          <>
                            {/* Sound waves path */}
                            <path 
                              d={`M 22 ${50 - ch5Diameter} L ${22 + nzlPixels} ${50 - focusYWidth} L 480 ${50 - farWidth} L 480 ${50 + farWidth} L ${22 + nzlPixels} ${50 + focusYWidth} Z`} 
                              fill="url(#beamGrad)" 
                              stroke="#00d1ff" 
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                            {/* Focus Label */}
                            <circle cx={22 + nzlPixels} cy="50" r="3" fill="#ffd700" className="animate-ping" />
                            <circle cx={22 + nzlPixels} cy="50" r="2.5" fill="#ffd700" />
                            <text x={22 + nzlPixels} y="40" fill="#ffd700" className="text-[8px] font-mono font-bold text-center" textAnchor="middle">FOCUS</text>
                            
                            {/* Distance measurements */}
                            <line x1="22" y1="88" x2={22 + nzlPixels} y2="88" stroke="#8e9299" strokeWidth="0.5" />
                            <text x={(22 + nzlPixels)/2} y="98" fill="#8e9299" className="text-[7px] font-mono" textAnchor="middle">
                              NZL = {(ch5Diameter * ch5Diameter * ch5Freq / 6.16).toFixed(1)} mm
                            </text>
                          </>
                        );
                      })()}
                      <defs>
                        <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="#ffd700" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#00d1ff" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Aperture (Crystal Width)</span>
                          <span className="text-amber-500 font-mono">{ch5Diameter} mm</span>
                        </div>
                        <input type="range" min="6" max="16" step="1" value={ch5Diameter} onChange={e => setCh5Diameter(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Crystal Frequency</span>
                          <span className="text-amber-500 font-mono">{ch5Freq} MHz</span>
                        </div>
                        <input type="range" min="3" max="10" step="1" value={ch5Freq} onChange={e => setCh5Freq(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                      </div>
                    </div>

                    <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col justify-center space-y-1 text-xs">
                      <p className="text-[#8e9299]">Lateral Resolution is best at the <strong>Focus Point</strong> where the sound beam is at its narrowest diameter.</p>
                      <p className="text-emerald-400 font-bold mt-1">
                        High frequency crystals + wider apertures deliver longer near-zone lengths (less early beam divergence).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 5 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00d1ff]">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Receiver Time Gain Compensation (TGC) Simulator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                     Db Gain Mapping
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual Equalizer / TGC slides */}
                  <div className="space-y-4">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Slide each depth zone slider to compensate for attenuation losses. A standard TGC has a smooth, descending diagonal slope.
                    </p>
                    <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex justify-between h-36">
                      {ch6TGC.map((val, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-between h-full w-8">
                          <span className="text-[8px] font-mono text-[#8e9299]">D{idx+1}</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="80" 
                            value={val} 
                            onChange={e => {
                              const newTGC = [...ch6TGC];
                              newTGC[idx] = parseInt(e.target.value);
                              setCh6TGC(newTGC);
                            }} 
                            className="h-20 accent-[#00d1ff] cursor-pointer" 
                            style={{ writingMode: 'vertical-lr' as any, WebkitAppearance: 'slider-vertical' }}
                          />
                          <span className="text-[9px] font-mono text-[#00d1ff]">{val}dB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Math and Output details */}
                  <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col justify-center space-y-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Overall Receiver Gain:</span>
                        <span className="text-white font-mono">{ch6Gain} dB</span>
                      </div>
                      <input type="range" min="10" max="80" value={ch6Gain} onChange={e => setCh6Gain(parseInt(e.target.value))} className="w-full accent-[#00d1ff] h-1" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#8e9299]">Dynamic Range (Compression):</span>
                        <span className="text-[#00d1ff] font-mono">{ch6Compression} dB</span>
                      </div>
                      <input type="range" min="30" max="90" step="10" value={ch6Compression} onChange={e => setCh6Compression(parseInt(e.target.value))} className="w-full accent-[#00d1ff] h-1" />
                    </div>
                    <p className="text-[10px] text-[#8e9299] leading-tight pt-2 border-t border-white/5">
                      "At {ch6Compression} dB dynamic range, your display shows {ch6Compression === 30 ? 'high contrast black-and-white' : 'many shades of gray for soft tissues'}. Adjust TGC to ensure uniform brightness."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 6 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#7B6FFF]">
                    <Target size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Doppler Shift Analyzer</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                     Δf ∝ cos({doppAngle}°)
                  </div>
                </div>
                
                <DopplerSim angle={doppAngle} velocity={doppVel} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                      <span>Insonation Angle</span>
                      <span className={doppAngle > 60 ? "text-red-400 font-bold" : "text-[#7B6FFF]"}>{doppAngle}° {doppAngle > 60 ? "(Avoid!)" : ""}</span>
                    </div>
                    <input type="range" min="0" max="89" value={doppAngle} onChange={e => setDoppAngle(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#7B6FFF]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                      <span>Flow Velocity</span>
                      <span className="text-[#7B6FFF]">{doppVel} cm/s</span>
                    </div>
                    <input type="range" min="20" max="150" value={doppVel} onChange={e => setDoppVel(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#7B6FFF]" />
                  </div>
                </div>
              </div>
            )}

            {activeCh === 7 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Interactive Acoustic Artifact Sandbox</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Select a tissue anomaly below to trigger the physical sound interactions and visualize its posterior effect on screen.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCh8Mode('shadow')}
                        className={`px-4 py-2 text-xs font-bold font-mono rounded-lg border cursor-pointer ${ch8Mode === 'shadow' ? 'bg-[#ea580c] text-white border-transparent' : 'bg-white/5 border-white/10 text-[#8e9299]'}`}
                      >
                        Gallstone (Shadowing)
                      </button>
                      <button 
                        onClick={() => setCh8Mode('enhancement')}
                        className={`px-4 py-2 text-xs font-bold font-mono rounded-lg border cursor-pointer ${ch8Mode === 'enhancement' ? 'bg-[#00d1ff] text-black border-transparent' : 'bg-white/5 border-white/10 text-[#8e9299]'}`}
                      >
                        Fluid Cyst (Enhancement)
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                    {ch8Mode === 'shadow' ? (
                      <>
                        <div className="w-12 h-12 rounded-full border-4 border-dashed border-[#ea580c] flex items-center justify-center text-[#ea580c]">
                          <span className="text-[9px] font-bold font-mono">STONE</span>
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Acoustic Shadowing (Clean Void)</span>
                        <p className="text-[10px] text-[#8e9299] leading-tight">
                          Gallstone absorbs almost 100% of sound. No echoes can propagate deeper, casting a completely dark strip posterior to the stone boundary.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full border-4 border-[#00d1ff] flex items-center justify-center text-[#00d1ff]">
                          <span className="text-[9px] font-bold font-mono">CYST</span>
                        </div>
                        <span className="text-xs font-bold text-[#00d1ff] uppercase tracking-wider block">Posterior Enhancement (Through Transmission)</span>
                        <p className="text-[10px] text-[#8e9299] leading-tight">
                          Fluid attenuates almost zero sound. Sound waves arriving deeper are highly energetic, producing extremely bright echoes behind the cyst.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeCh === 8 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-500">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">ALARA Safety Indices & Cavitation Calculator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    MI = P_neg / √f₀
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Acoustic Peak Pressure</span>
                        <span className="text-rose-500 font-mono">{ch9Pressure} MPa</span>
                      </div>
                      <input type="range" min="0.1" max="2.0" step="0.1" value={ch9Pressure} onChange={e => setCh9Pressure(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Resonant Frequency</span>
                        <span className="text-rose-500 font-mono">{ch9Freq} MHz</span>
                      </div>
                      <input type="range" min="2" max="12" step="1" value={ch9Freq} onChange={e => setCh9Freq(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                    </div>
                  </div>

                  {(() => {
                    const mi = ch9Pressure / Math.sqrt(ch9Freq);
                    const isHazard = mi > 0.65;
                    return (
                      <div className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center min-h-[140px] space-y-2 transition-all ${isHazard ? 'bg-amber-950/20 border-amber-500/40 text-amber-500' : 'bg-emerald-950/10 border-emerald-500/30 text-emerald-400'}`}>
                        <span className="text-[10px] font-mono uppercase tracking-widest">Computed Mechanical Index (MI)</span>
                        <span className="text-4xl font-serif font-black font-mono">{mi.toFixed(3)}</span>
                        
                        <div className="text-[11px] font-sans leading-tight">
                          {isHazard ? (
                            <span className="font-bold">⚠️ Warning: MI exceeds recommended diagnostic thresholds! Lower Output Power (ALARA).</span>
                          ) : (
                            <span>✔ Status Safe. MI lies within highly optimized safe cavitation limits.</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeCh === 9 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Tissue Harmonic Wave Distortion Demonstration</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    Fundamental (f₀) vs Second Harmonic (2·f₀)
                  </div>
                </div>

                <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col space-y-4 text-xs">
                  <p className="text-[#8e9299] leading-tight">
                    In shallow tissue, sound remains a perfect linear sine wave. At depth, non-linear propagation (compressed wave peaks traveling faster than rarefied wave troughs) distorts the sound curve, creating a secondary <strong>2× frequency harmonic wavefront</strong>.
                  </p>
                  
                  {/* SVG Wave Comparison Graph */}
                  <div className="h-24 relative overflow-hidden bg-black/40 rounded-xl border border-white/5 flex flex-col justify-around p-2">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block pl-2">Fundamental Sound Wave (Standard f₀ Sine)</span>
                      <svg className="w-full h-8 overflow-visible" viewBox="0 0 400 30">
                        <path d="M 0 15 Q 25 -5 50 15 T 100 15 T 150 15 T 200 15 T 250 15 T 300 15 T 350 15 T 400 15" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono text-violet-400 uppercase block pl-2">Non-Linear Distorted Deep Wave (Triggers 2f₀ Harmonics)</span>
                      <svg className="w-full h-8 overflow-visible" viewBox="0 0 400 30">
                        {/* Compressed Peaks (skewed forward) & Flattened Troughs */}
                        <path d="M 0 15 Q 15 -10 50 15 T 90 15 T 140 15 T 180 15 T 230 15 T 270 15 T 320 15 T 370 15" fill="none" stroke="#a78bfa" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCh === 10 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Interactive Laboratory 2×2 Contingency Table Solver</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    Statistical QA Model
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Table Inputs */}
                  <div className="space-y-3.5">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Enter the true count of results from testing compared against the medical gold standard. Recalculate sensitivity and statistical accuracy immediately.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1 bg-[#0c0d10] p-2 rounded border border-white/5">
                        <span className="text-[9px] text-[#8e9299] font-mono block uppercase">True Pos (TP)</span>
                        <input type="number" value={ch11TP} onChange={e => setCh11TP(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:outline-none" />
                      </div>
                      <div className="space-y-1 bg-[#0c0d10] p-2 rounded border border-white/5">
                        <span className="text-[9px] text-[#8e9299] font-mono block uppercase">False Neg (FN)</span>
                        <input type="number" value={ch11FN} onChange={e => setCh11FN(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-red-400 font-mono text-xs focus:outline-none" />
                      </div>
                      <div className="space-y-1 bg-[#0c0d10] p-2 rounded border border-white/5">
                        <span className="text-[9px] text-[#8e9299] font-mono block uppercase">True Neg (TN)</span>
                        <input type="number" value={ch11TN} onChange={e => setCh11TN(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:outline-none" />
                      </div>
                      <div className="space-y-1 bg-[#0c0d10] p-2 rounded border border-white/5">
                        <span className="text-[9px] text-[#8e9299] font-mono block uppercase">False Pos (FP)</span>
                        <input type="number" value={ch11FP} onChange={e => setCh11FP(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-red-400 font-mono text-xs focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const total = ch11TP + ch11FN + ch11TN + ch11FP;
                    const sensitivity = ch11TP / (ch11TP + ch11FN);
                    const specificity = ch11TN / (ch11TN + ch11FP);
                    const accuracy = (ch11TP + ch11TN) / total;
                    const ppv = ch11TP / (ch11TP + ch11FP);
                    
                    return (
                      <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col justify-center space-y-2 text-xs">
                        <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-wider border-b border-white/5 pb-1">QA Performance Statistics</div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-400">Sensitivity:</span>
                          <span className="text-emerald-400 font-mono">{(sensitivity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-400">Specificity:</span>
                          <span className="text-emerald-400 font-mono">{(specificity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-400">Overall Accuracy:</span>
                          <span className="text-emerald-400 font-mono">{(accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8e9299]">Pos predictive value (PPV):</span>
                          <span className="text-white font-mono">{(ppv * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-[9px] text-[#8e9299] italic leading-tight pt-1.5 border-t border-white/5">
                          Formulas: Sensitivity = TP / (TP + FN). Accuracy = (TP + TN) / Total.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeCh === 11 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Poiseuille's 4th-Power Arterial Stenosis Simulator</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8e9299]">
                    Resistance = 8ηL / (π · r⁴)
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-[#8e9299] leading-relaxed">
                    Adjust the vessel radius and blood viscosity sliders. Observe how resistance increases exponentially when plaque narrows the lumen. Halving radius raises resistance <strong>16-fold!</strong>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Vessel Radius ratio</span>
                          <span className="text-cyan-400 font-mono">{ch12Radius}% Normal</span>
                        </div>
                        <input type="range" min="30" max="100" value={ch12Radius} onChange={e => setCh12Radius(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                          <span>Blood Viscosity</span>
                          <span className="text-cyan-400 font-mono">{ch12Viscosity} cP</span>
                        </div>
                        <input type="range" min="1.0" max="8.0" step="0.5" value={ch12Viscosity} onChange={e => setCh12Viscosity(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                      </div>
                    </div>

                    {(() => {
                      const radRatio = ch12Radius / 100;
                      const relativeResistance = (ch12Viscosity / 3.5) / Math.pow(radRatio, 4);
                      const areaReduction = (1 - radRatio * radRatio) * 100;

                      return (
                        <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#8e9299]">Area Stenosis:</span>
                            <span className="text-red-400 font-mono font-bold">{areaReduction.toFixed(0)}% Reduction</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8e9299]">Relative Resistance of Lumen:</span>
                            <span className="text-[#ffd700] font-mono font-bold">{relativeResistance.toFixed(2)}x Normal</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8e9299]">Compensating Velocity through narrows:</span>
                            <span className="text-white font-mono font-bold">{(1 / radRatio).toFixed(2)}x Normal (Continuity)</span>
                          </div>
                          <div className="text-[10px] text-[#8e9299] italic leading-tight pt-1 border-t border-white/5">
                            {relativeResistance > 5 ? (
                              <span className="text-[#ffd700]">⚠️ High resistance boundary triggers tardus-parvus flow distal to the narrows!</span>
                            ) : (
                              <span>✔ Flow parameters remain clinically compensated.</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeCh === 12 && (
              <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FlaskConical size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest font-mono">Arterial Spectral Waveform Plotter Simulator</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Toggle the diagnostic flow bed. Notice how extremity muscles feature flow reversal (triphasic), while renal/organs feature continuous forward diastole.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCh13ExtremityFlow(true)}
                        className={`px-4 py-2 text-xs font-bold font-mono rounded-lg border cursor-pointer ${ch13ExtremityFlow ? 'bg-[#00d1ff] text-black border-transparent' : 'bg-white/5 border-white/10 text-[#8e9299]'}`}
                      >
                        Peripheral Artery (High Res)
                      </button>
                      <button 
                        onClick={() => setCh13ExtremityFlow(false)}
                        className={`px-4 py-2 text-xs font-bold font-mono rounded-lg border cursor-pointer ${!ch13ExtremityFlow ? 'bg-[#00d1ff] text-black border-transparent' : 'bg-white/5 border-white/10 text-[#8e9299]'}`}
                      >
                        Organ / Renal Artery (Low Res)
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[#8e9299] uppercase tracking-wider">
                        <span>Resistive Index (RI) setting</span>
                        <span className="text-[#00d1ff] font-mono">{ch13RI.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0.4" max="0.9" step="0.05" value={ch13RI} onChange={e => setCh13RI(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00d1ff]" />
                    </div>
                  </div>

                  <div className="bg-[#0c0d10] p-4 rounded-xl border border-white/5 flex flex-col justify-center text-center space-y-2.5 min-h-[140px]">
                    <span className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest block">Spectral wave analysis</span>
                    {ch13ExtremityFlow ? (
                      <>
                        <span className="text-xs font-bold text-white block">Triphasic High-Resistance Waveform</span>
                        <p className="text-[10px] text-[#8e9299] leading-tight">
                          Features rapid sharp systolic spikes, complete diagnostic flow reversal in early diastole, and zero flow at end-diastole. Normal for resting extremities.
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-[#00d1ff] block">Continuous Low-Resistance Waveform</span>
                        <p className="text-[10px] text-[#8e9299] leading-tight">
                          Broad systolic peaks with high, persistent diastolic flow. Kidneys or brain require blood 100% of the cardiac cycle. Calculated RI is {ch13RI.toFixed(2)}.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content Sections */}
            <section className="prose prose-invert max-w-none prose-p:text-[#8e9299] prose-p:leading-relaxed prose-strong:text-white">
              <h2 className="text-2xl font-serif text-white mt-12 mb-6 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Zap className="text-[#00d1ff]" size={20} />
                  <span>Core Textbook Theory</span>
                </div>
                <button
                  onClick={() => {
                    const lessonsMarkup = chapter.content.map(p => `<p class='mb-5 leading-relaxed text-lg text-white/90'>${p}</p>`).join('');
                    (window as any).showInfoFullScreen?.({
                       title: chapter.title,
                       badge: `${chapter.tag.toUpperCase()} // FOCUS THEATRE`,
                       subtitle: chapter.subtitle,
                       content: `<div class='space-y-6 max-w-3xl mx-auto'>${lessonsMarkup}</div>`,
                       concept: `You are reading in distraction-free Focus Theatre mode. Complete this lesson or press 'X' at the top right to return to the interactive console.`
                    });
                  }}
                  className="px-3 py-1 bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/25 hover:border-[#00d1ff] rounded-lg text-xs text-[#00d1ff] font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2"
                >
                  <BookOpen size={12} />
                  Focus Theatre Fullscreen
                </button>
              </h2>
              
              <div className="space-y-6 mb-8">
                {chapter.content.map((p, pIdx) => (
                  <p 
                    key={pIdx} 
                    dangerouslySetInnerHTML={{ __html: p }} 
                    className="text-base sm:text-lg text-[#8e9299] leading-relaxed border-l border-white/5 pl-5 py-0.5" 
                  />
                ))}
              </div>

              {activeCh === 0 && (
                <div className="my-10 space-y-4">
                  <h4 className="text-white text-lg font-serif font-bold">The 13-Microsecond Rule Interactive Laboratory</h4>
                  <p className="text-[#8e9299] text-sm leading-relaxed">
                    A sound pulse must travel to the depth of interest and return back to the transducer to produce an echo. In clinical soft tissue, sound travels at a speed of 1.54 mm/µs. This round-trip distance creates a constant travel delay of exactly <strong>13 microseconds per centimeter of depth</strong>.
                  </p>
                  <div className="not-prose">
                    <D3ThirteenMicrosecondRule />
                  </div>
                </div>
              )}

              {activeCh === 6 && (
                <div className="my-10 p-6 bg-gradient-to-r from-teal-500/5 to-[#00d1ff]/5 border border-teal-500/25 rounded-2xl relative overflow-hidden shadow-xl" id="pw-doppler-spotlight">
                  {/* Decorative background circle */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono text-[9px] uppercase tracking-widest rounded-lg inline-flex items-center gap-2 mb-4 font-bold">
                    <FlaskConical size={12} className="text-teal-400" /> Syllabus Spotlight: Pulsed-Wave Doppler
                  </div>
                  
                  <h3 className="text-xl font-serif italic text-white mb-1">CHAPTER 6 &bull; DOPPLER ULTRASOUND</h3>
                  <h4 className="text-sm font-sans font-bold text-slate-200 mb-3">Chapter 6: Pulsed-Wave Doppler</h4>
                  
                  <div className="space-y-4 text-[#cfd3db] text-sm leading-relaxed">
                    <p className="first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-[#00d1ff] first-letter:mr-2 first-letter:float-left">
                      Welcome to the zany world of Pulsed-Wave Doppler, where ultrasound waves
                      are sent out in short, controlled bursts, much like a toddler with a toy drum.
                      These bursts allow us to measure the velocity of blood flow with pinpoint
                      accuracy, all while keeping the machine from going into a full-on percussion
                      solo. It's like having a polite conversation with the bloodstream, asking it politely
                      to "please slow down" or "speed up," depending on the situation.
                    </p>
                    <p>
                      Now, imagine you're a traffic cop, but instead of cars, you're monitoring red
                      blood cells zipping through the vessels. Pulsed-Wave Doppler is your radar
                      gun, catching those speedy little cells in the act. But here's the twist: unlike
                      a traffic cop who might hand out tickets, you get to celebrate these speedsters,
                      as they reveal crucial information about cardiovascular health. It's like being
                      a detective, but with less trench coat and more lab coat.
                    </p>
                    <p className="border-l-2 border-[#00d1ff]/50 pl-4 py-1 italic bg-[#00d1ff]/5 rounded-r-lg">
                      But beware, dear student, for the Pulsed-Wave Doppler has its quirks. Just like
                      trying to order coffee in a foreign country, you might encounter some aliasing—where
                      the machine gets a bit confused and starts showing you speeds that make no sense.
                      Think of it as your ultrasound machine's way of saying, "Oops, I might have had
                      one too many espressos!" Fear not, though, because with a few adjustments, you'll
                      have it back on track, ready to ace your exams and impress your professors with
                      your newfound Doppler prowess.
                    </p>
                  </div>
                </div>
              )}

              {/* High-Fidelity Medical Figure Card */}
              {CHAPTER_FIGURES[activeCh] && (
                <div className="my-10 p-5 bg-[#101216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
                  <div className="p-4 border-b border-white/5 bg-[#14161c] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest flex items-center gap-1.5 font-bold font-mono">
                      <Sparkles size={12} className="text-[#00d1ff] animate-pulse" /> Diagnostic Technical Figure
                    </span>
                    <span className="text-[10px] font-mono text-[#00d1ff] bg-[#00d1ff]/10 px-2.5 py-0.5 rounded-full font-bold">
                      SPI Study Core
                    </span>
                  </div>
                  
                  <div className="p-6 flex items-center justify-center bg-[#07080b]">
                    <img 
                      src={CHAPTER_FIGURES[activeCh].src} 
                      alt={CHAPTER_FIGURES[activeCh].alt} 
                      referrerPolicy="no-referrer"
                      className="rounded-xl w-full max-h-[400px] object-cover border border-white/5 shadow-2xl hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-5 bg-[#0e1014] border-t border-white/5 space-y-1">
                    <h5 className="text-white text-sm font-semibold tracking-wide font-sans">
                      {CHAPTER_FIGURES[activeCh].title}
                    </h5>
                    <p className="text-xs text-[#8e9299] leading-relaxed italic font-serif">
                      {CHAPTER_FIGURES[activeCh].caption}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Quiz Section */}
            {chapter.quiz && (
              <div className="pt-12 border-t border-white/10 space-y-12 mb-20">
                <div className="flex items-center gap-3">
                  <Target className="text-[#00d1ff]" size={24} />
                  <h3 className="text-2xl font-serif text-white">Knowledge Check</h3>
                </div>
                
                {chapter.quiz.map((q, qIdx) => {
                  const key = `${activeCh}-${qIdx}`;
                  const selected = quizAnswers[key];
                  return (
                    <div key={qIdx} className="space-y-6">
                      <p className="text-[#e0e0e0] font-sans font-medium text-lg leading-relaxed">
                        <span className="text-[#00d1ff] font-mono text-sm mr-3 font-bold">Q{qIdx+1}.</span>
                        {q.q}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.opts.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.a;
                          const isSelected = selected === oIdx;
                          
                          let btnClass = "p-4 rounded-xl border transition-all text-left group font-sans text-sm ";
                          if (selected === undefined) {
                            btnClass += "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00d1ff]/30 text-[#8e9299] hover:text-white";
                          } else if (isCorrect) {
                            btnClass += "bg-green-500/10 border-green-500/30 text-green-400";
                          } else if (isSelected) {
                            btnClass += "bg-red-500/10 border-red-500/30 text-red-100";
                          } else {
                            btnClass += "bg-white/5 border-white/5 opacity-50 text-[#8e9299]";
                          }

                          return (
                            <button 
                              key={oIdx} 
                              onClick={() => handleAnswer(qIdx, oIdx)}
                              className={btnClass}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${isSelected ? 'border-current' : 'border-white/10'}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                {opt}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      <AnimatePresence>
                        {showExplanation[key] && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-[#16181d] border border-white/5 p-5 rounded-xl text-sm leading-relaxed text-[#8e9299] italic"
                          >
                            <div className="flex gap-3">
                              {selected === q.a ? <CheckCircle2 className="text-green-400 shrink-0" size={18} /> : <XCircle className="text-red-400 shrink-0" size={18} />}
                              <div>
                                 <span className={`font-bold uppercase tracking-widest text-[9px] mb-1 block ${selected === q.a ? 'text-green-400' : 'text-red-400'}`}>
                                   {selected === q.a ? 'Correct Result' : 'Incorrect Analysis'}
                                 </span>
                                 {q.e}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/10 pb-20">
              <button 
                disabled={activeCh === 0}
                onClick={() => { setActiveCh(activeCh - 1); window.scrollTo(0,0); }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 text-[#8e9299] hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
              >
                <ChevronLeft size={18} />
                <span className="text-sm font-bold">Previous Chapter</span>
              </button>
              <div className="flex flex-col items-center gap-1 order-3 sm:order-2">
                 <div className="text-[10px] font-mono text-[#8e9299]">{activeCh + 1} / {CHAPTERS.length}</div>
                 <div className="flex gap-1">
                   {CHAPTERS.map((_, i) => (
                     <div key={i} className={`h-1 w-4 rounded-full transition-all ${i === activeCh ? 'bg-[#00d1ff] w-8' : 'bg-white/10'}`} />
                   ))}
                 </div>
              </div>
              <button 
                disabled={activeCh === CHAPTERS.length - 1}
                onClick={() => { setActiveCh(activeCh + 1); window.scrollTo(0,0); }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00d1ff] text-black hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all disabled:opacity-0 order-2 sm:order-3"
              >
                <span className="text-sm font-bold">Next Chapter</span>
                <ChevronRight size={18} />
              </button>
            </footer>
          </motion.div>
        ) : (
          <motion.div 
            key={`${studyStyle}-${currentBourdainIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Lecture Selector Dropdown */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#16181d] border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="space-y-1 w-full md:w-auto">
                <span className={`text-[9px] uppercase tracking-widest font-mono ${themeColorClass} font-bold block`}>{selectLabel}</span>
                <h3 className="text-sm font-sans font-medium text-[#c0c3cc]">{selectSublabel}</h3>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto md:flex-1 md:justify-end max-w-xl">
                <select
                  value={currentBourdainIndex}
                  onChange={(e) => {
                    setCurrentBourdainIndex(parseInt(e.target.value));
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`bg-[#0c0d10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 ${themeColorClassRing} flex-1 min-w-0 cursor-pointer`}
                >
                  {activeLecturesArray.map((lesson, idx) => (
                    <option key={lesson.id} value={idx}>
                      [{lesson.lessonNum}] {lesson.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsLessonMapOpen(true)}
                  className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold cursor-pointer shrink-0 ${
                    isSedaris 
                      ? 'border-violet-500/25 bg-violet-500/5 text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10'
                      : 'border-amber-500/25 bg-amber-500/5 text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/10'
                  }`}
                  title="Open visual syllabus directory map"
                >
                  <Compass size={16} className="animate-pulse" />
                  <span className="hidden sm:inline text-xs font-mono tracking-wider">MAP</span>
                </button>
              </div>
            </div>

            {/* Lesson Title Card */}
            <div className={`relative border border-white/5 bg-gradient-to-br ${isSedaris ? 'from-violet-500/5 to-transparent' : 'from-amber-500/5 to-transparent'} rounded-3xl p-6 sm:p-10 mb-8 overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-64 h-64 ${isSedaris ? 'bg-violet-500/10' : 'bg-amber-500/10'} rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4`} />
              
              <div className="relative flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex gap-6 items-start w-full">
                  {!isSedaris ? (
                    <div className="hidden sm:block w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] grayscale mix-blend-screen opacity-90 sepia-[0.3]">
                      <img src={bourdainPortrait} alt="Dr. Bourdain" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="hidden sm:block w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] grayscale mix-blend-screen opacity-90 sepia-[0.2] hue-rotate-[-30deg]">
                      <img src={sedarisPortrait} alt="Sedaris Mode" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-3 relative z-10 w-full">
                    <span className={`text-[10px] sm:text-[11px] font-bold ${themeColorClass} tracking-[0.2em] uppercase flex items-center gap-2`}>
                      <BookOpen size={14} />
                      {activeLesson.module} · {activeLesson.lessonNum}
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white leading-tight">
                      {activeLesson.title}
                    </h1>
                    <p className={`text-lg sm:text-xl ${isSedaris ? 'text-violet-200' : 'text-amber-200'} italic font-serif`}>
                      "{activeLesson.subtitle}"
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={toggleSpeakBourdain}
                  className={`p-4 rounded-full border transition-all shrink-0 flex items-center justify-center gap-2 z-10 relative ${
                    isPlayingText 
                    ? `${themeColorClassBgLight} border ${isSedaris ? 'border-violet-500/50' : 'border-amber-500/50'} ${themeColorClass} animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
                    : `bg-[#0c0d10] border-white/10 text-[#8e9299] hover:text-white hover:${isSedaris ? 'border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'}`
                  }`}
                  title={isPlayingText ? 'Stop Speech' : 'Listen with Audio Narrator'}
                >
                  {isPlayingText ? (
                    <>
                      <Square size={20} className="fill-current" />
                      <span className="text-xs uppercase font-bold tracking-wider font-mono hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={20} />
                      <span className="text-xs uppercase font-bold tracking-wider font-mono hidden sm:inline">Listen Aloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Narrative Body wrapped in clean typography */}
            <div className="space-y-8 pt-4 font-serif text-base sm:text-lg text-[#8e9299] leading-relaxed max-w-3xl">
              {activeLesson.content.map((p, pIdx) => {
                const hasDialogue = p.includes('"');
                const isFirst = pIdx === 0;
                // Add a small divider every 4 paragraphs to pace the reading
                const showDivider = pIdx > 0 && pIdx % 4 === 0;

                // Format quote strings to be white and italic
                const formattedP = p.replace(/"([^"]+)"/g, '<span class="text-white font-medium italic">"$1"</span>');
                
                return (
                  <React.Fragment key={pIdx}>
                    {showDivider && (
                      <div className="flex justify-center py-4">
                        <div className={`w-8 h-px ${isSedaris ? 'bg-violet-500/30' : 'bg-amber-500/30'}`} />
                      </div>
                    )}
                    
                    {hasDialogue && !isFirst ? (
                      // Treat paragraphs with quotes as dialogue blockquotes
                      <div className={`relative pl-8 sm:pl-10 py-4 my-6 bg-gradient-to-r ${isSedaris ? 'from-violet-500/5' : 'from-amber-500/5'} to-transparent border-l-4 ${isSedaris ? 'border-violet-500/30' : 'border-amber-500/30'} rounded-r-2xl`}>
                        <div className={`absolute top-4 left-3 text-2xl font-serif leading-none ${isSedaris ? 'text-violet-500/30' : 'text-amber-500/30'}`}>"</div>
                        <p 
                          className="hover:text-white transition-colors duration-300 text-white/80"
                          dangerouslySetInnerHTML={{ __html: formattedP }}
                        />
                      </div>
                    ) : (
                      // Standard paragraphs (with dropcap on the first one)
                      <p 
                        className={`hover:text-white transition-colors duration-300 border-l border-white/5 hover:${isSedaris ? 'border-violet-500/30' : 'border-amber-500/30'} pl-5 py-0.5 ${
                          isFirst ? 'first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-black first-letter:text-white first-letter:mr-1.5 first-letter:float-left' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: formattedP }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Visual Illustrations & Dynamic Physics Laboratory Component */}
            <LessonVisuals lessonId={activeLesson.id} isSedaris={isSedaris} />

            {/* Key Takeaways Card */}
            <div className={`bg-gradient-to-br from-[#16181d] to-[#121318] border ${isSedaris ? 'border-violet-500/15' : 'border-amber-500/15'} rounded-2xl p-6 sm:p-8 relative overflow-hidden mt-12 mb-16`}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${isSedaris ? 'bg-violet-500/5' : 'bg-amber-500/5'} rounded-full blur-2xl pointer-events-none`} />
              <div className="flex items-center gap-3 mb-6">
                <Award className={themeColorClass} size={24} />
                <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wide">The Clinical Core: Key Takeaways</h3>
              </div>
              
              <ul className="space-y-4">
                {activeLesson.takeaways.map((takeaway, tIdx) => (
                  <li key={tIdx} className="flex gap-4 items-start text-sm sm:text-base text-[#8e9299] leading-relaxed">
                    <div className={`w-5 h-5 rounded-full ${isSedaris ? 'bg-violet-500/10 border-violet-500/25' : 'bg-amber-500/10 border-amber-500/25'} flex items-center justify-center shrink-0 mt-0.5 ${themeColorClass} text-[10px] font-mono font-bold`}>
                      {tIdx + 1}
                    </div>
                    <span className="font-sans font-medium text-white/95">
                      {takeaway}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pager Footer for Lectures */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/10 pb-20">
              <button 
                disabled={currentBourdainIndex === 0}
                onClick={() => {
                  setCurrentBourdainIndex(currentBourdainIndex - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 text-[#8e9299] hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={18} />
                <span className="text-sm font-bold">Previous Lesson</span>
              </button>
              
              <div className="flex flex-col items-center gap-1">
                 <div className="text-[10px] font-mono text-[#8e9299]">{currentBourdainIndex + 1} / {activeLecturesArray.length}</div>
                 <div className="flex gap-1 max-w-[200px] flex-wrap justify-center">
                   {activeLecturesArray.map((_, i) => (
                     <button 
                       key={i} 
                       onClick={() => {
                         setCurrentBourdainIndex(i);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }}
                       className={`h-1 rounded-full transition-all cursor-pointer ${i === currentBourdainIndex ? `${themeColorClassDotActive} w-4` : 'bg-white/10 w-1.5'}`}
                       title={`Go to Lesson ${i + 1}`}
                     />
                   ))}
                 </div>
              </div>
              
              <button 
                disabled={currentBourdainIndex === activeLecturesArray.length - 1}
                onClick={() => {
                  setCurrentBourdainIndex(currentBourdainIndex + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all disabled:opacity-30 disabled:pointer-events-none ${
                  isSedaris 
                    ? 'bg-violet-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                    : 'bg-amber-500 text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                <span className="text-sm font-bold">Next Lesson</span>
                <ChevronRight size={18} />
              </button>
            </footer>
          </motion.div>
        )}
      </div>

      {/* Floating HUD navigation bar on screen scroll */}
      <AnimatePresence>
        {showFloatingNav && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 40, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121317]/95 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-center gap-2 sm:gap-4 select-none mr-[-50%]"
          >
            {/* Prev Button */}
            <button
              disabled={studyStyle === 'standard' ? activeCh === 0 : currentBourdainIndex === 0}
              onClick={() => {
                if (studyStyle === 'standard') {
                  setActiveCh(prev => prev - 1);
                } else {
                  setCurrentBourdainIndex(prev => prev - 1);
                }
                if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1.5 rounded-full hover:bg-white/5 text-[#8e9299] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="h-4 w-px bg-white/10" />

            {/* Title click -> opens map */}
            <button
              onClick={() => setIsLessonMapOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1d24]/60 border border-white/5 hover:border-[#00d1ff]/20 hover:bg-[#00d1ff]/5 transition-all text-left group cursor-pointer"
            >
              <List size={12} className="text-[#00d1ff] group-hover:rotate-180 transition-transform duration-300" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#8e9299] group-hover:text-white uppercase truncate max-w-[120px] sm:max-w-[170px]">
                {studyStyle === 'standard' 
                  ? `Chapter ${activeCh + 1}` 
                  : `Lecture ${activeLesson.lessonNum.replace('Lesson ', '')}`
                }
              </span>
            </button>

            <div className="h-4 w-px bg-white/10" />

            {/* Next Button */}
            <button
              disabled={
                studyStyle === 'standard' 
                  ? activeCh === CHAPTERS.length - 1 
                  : currentBourdainIndex === activeLecturesArray.length - 1
              }
              onClick={() => {
                if (studyStyle === 'standard') {
                  setActiveCh(prev => prev + 1);
                } else {
                  setCurrentBourdainIndex(prev => prev + 1);
                }
                if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-1.5 rounded-full text-white transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer ${
                studyStyle === 'standard' 
                  ? 'bg-[#00d1ff]/10 hover:bg-[#00d1ff]/25 text-[#00d1ff]' 
                  : isSedaris 
                    ? 'bg-violet-500/10 hover:bg-violet-500/25 text-violet-400'
                    : 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-500'
              }`}
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcut Indicator Toast */}
      <AnimatePresence>
        {showShortcutIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="fixed bottom-20 right-6 z-50 bg-[#16181d] border border-white/10 px-4 py-2.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center gap-2.5 text-white text-xs font-mono select-none"
          >
            <Keyboard size={14} className="text-[#00d1ff] animate-pulse" />
            <span className="text-zinc-300 font-bold tracking-tight">Flipped page <span className="text-[#00d1ff]">via Arrow Key</span></span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Curriculum Map sliding side drawer */}
      <AnimatePresence>
        {isLessonMapOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLessonMapOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 cursor-pointer"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0c0d11] border-l border-white/10 z-55 shadow-2xl flex flex-col overflow-hidden text-white font-sans"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#111317]">
                <div className="flex items-center gap-2.5">
                  <Compass className="text-[#00d1ff] animate-pulse" size={18} />
                  <div>
                    <h2 className="text-sm font-bold tracking-wider uppercase font-sans">Curriculum Map</h2>
                    <p className="text-[10px] font-mono text-[#8e9299]">Interactive Syllabus Directory</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLessonMapOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-mono border border-white/5 cursor-pointer"
                >
                  [ESC] CLOSE
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4.5 bg-[#0e1014] border-b border-white/5 space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>QUIZ PROGRESS</span>
                  <span className="text-[#00d1ff] font-bold">{getChaptersTotalProgress().percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-[#00d1ff] transition-all duration-500"
                    style={{ width: `${getChaptersTotalProgress().percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                  <span>{getChaptersTotalProgress().answeredQuestions} / {getChaptersTotalProgress().totalQuestions} QUESTIONS TRIED</span>
                  <span>{getChaptersTotalProgress().correctQuestions} CORRECT ANSWERS</span>
                </div>
              </div>

              {/* Search filter Input */}
              <div className="p-4 border-b border-white/5 bg-[#111317] flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Search chapter title, subtitle, formulas..."
                    className="w-full bg-[#07080b] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#00d1ff]/40 text-white placeholder:text-zinc-600 transition-colors"
                  />
                  {mapSearchQuery && (
                    <button
                      onClick={() => setMapSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[9px] font-mono text-zinc-500 hover:text-white font-bold"
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>

              {/* Scroll list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#08090c]">
                {/* Section 1: Chapters list */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <BookOpen className="text-[#00d1ff]" size={14} />
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00d1ff]">
                      Standard Syllabus Chapters ({CHAPTERS.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {CHAPTERS.map((ch, idx) => {
                      const isSelected = studyStyle === 'standard' && activeCh === idx;
                      const score = getChapterScore(idx);
                      const percent = score.total > 0 ? Math.round((score.answered / score.total) * 100) : 0;
                      const isDone = percent === 100;

                      const matchesSearch = mapSearchQuery === '' || 
                        ch.title.toLowerCase().includes(mapSearchQuery.toLowerCase()) || 
                        ch.subtitle.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
                        ch.tag.toLowerCase().includes(mapSearchQuery.toLowerCase());

                      if (!matchesSearch) return null;

                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setStudyStyle('standard');
                            setActiveCh(idx);
                            setIsLessonMapOpen(false);
                            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all relative flex flex-col gap-1 cursor-pointer group ${
                            isSelected 
                              ? 'bg-[#00d1ff]/5 border-[#00d1ff]/35 text-white ring-1 ring-[#00d1ff]/15' 
                              : 'bg-[#121319]/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-mono font-semibold tracking-wider ${isSelected ? 'text-[#00d1ff]' : 'text-zinc-500'}`}>
                              {ch.tag.split(' · ')[0]}
                            </span>
                            {isDone ? (
                              <span className="flex items-center gap-1 text-[8px] font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-emerald-400 font-bold">
                                <Check size={8} /> Passed
                              </span>
                            ) : score.answered > 0 ? (
                              <span className="text-[8px] font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full text-amber-400">
                                In Progress ({score.answered}/{score.total})
                              </span>
                            ) : null}
                          </div>
                          <span className="font-sans font-bold text-xs line-clamp-1 text-white/90 group-hover:text-white">
                            {ch.title}
                          </span>
                          <span className="font-sans text-[10px] text-zinc-500 line-clamp-1">
                            {ch.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Premium Lectures */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2 pt-2 border-t border-white/5">
                    <Flame className="text-amber-500" size={14} />
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8e9299]">
                      Vocal Lectures ({activeLecturesArray.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#101115] rounded-xl border border-white/5 select-none">
                    <button
                      onClick={() => setStudyStyle('bourdain')}
                      className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        studyStyle === 'bourdain' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Flame size={11} className="fill-current" />
                      Bourdain Theme
                    </button>
                    <button
                      onClick={() => setStudyStyle('sedaris')}
                      className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        studyStyle === 'sedaris' ? 'bg-violet-500 text-white shadow-md' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Volume2 size={11} />
                      Sedaris Theme
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {activeLecturesArray.map((lec, idx) => {
                      const isSelected = studyStyle !== 'standard' && currentBourdainIndex === idx;

                      const matchesSearch = mapSearchQuery === '' || 
                        lec.title.toLowerCase().includes(mapSearchQuery.toLowerCase()) || 
                        lec.subtitle.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
                        lec.module.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
                        lec.lessonNum.toLowerCase().includes(mapSearchQuery.toLowerCase());

                      if (!matchesSearch) return null;

                      return (
                        <button
                          key={lec.id}
                          onClick={() => {
                            if (studyStyle === 'standard') setStudyStyle('bourdain');
                            setCurrentBourdainIndex(idx);
                            setIsLessonMapOpen(false);
                            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all relative flex flex-col gap-1 cursor-pointer group ${
                            isSelected 
                              ? `bg-${studyStyle === 'sedaris' ? 'violet' : 'amber'}-500/5 border-${studyStyle === 'sedaris' ? 'violet' : 'amber'}-500/35 text-white ring-1 ring-${studyStyle === 'sedaris' ? 'violet' : 'amber'}-500/15`
                              : 'bg-[#121319]/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-mono font-semibold tracking-wider ${
                              isSelected 
                                ? studyStyle === 'sedaris' ? 'text-violet-400' : 'text-amber-400' 
                                : 'text-zinc-500'
                            }`}>
                              {lec.lessonNum}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase truncate">
                              {lec.module.split(': ')[1] || lec.module}
                            </span>
                          </div>
                          <span className="font-sans font-bold text-xs line-clamp-1 text-white/90 group-hover:text-white">
                            {lec.title}
                          </span>
                          <span className="font-sans text-[10px] text-zinc-500 line-clamp-1">
                            {lec.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer info board */}
              <div className="p-4 bg-[#111317] border-t border-white/5 text-[10px] font-mono text-zinc-500 flex justify-between items-center bg-[#111317]">
                <span className="flex items-center gap-1.5"><Keyboard size={12} /> Press [←] or [→] to turn pages</span>
                <span>SPI SYSTEM</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
