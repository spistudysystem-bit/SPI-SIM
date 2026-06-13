export interface SPIQuestion {
  id: string;
  q: string;
  opts: string[];
  a: number; // Correct option index (0-3)
  expl: string;
  category: string;
  domainCode: "PHYS" | "XMTR" | "INST" | "DOPP" | "SAFE";
}

export const DOMAIN_DETAILS = {
  PHYS: { name: "Physical Principles", weight: 20, description: "Wave behaviors, speed of sound, attenuation, and reflection physics." },
  XMTR: { name: "Ultrasound Transducers", weight: 15, description: "Piezoelectric crystal resonance, matching dimensions, backing damping, and beam steering." },
  INST: { name: "Imaging & Instrumentation", weight: 28, description: "Receiver operations, pulsed parameters, dynamic range, TGC sliders, and digital scan converters." },
  DOPP: { name: "Doppler & Hemodynamics", weight: 22, description: "Blood flow dynamics, Doppler math, spectral velocity aliasing, and angle correction equations." },
  SAFE: { name: "Safety & Bioeffects", weight: 15, description: "ALARA protocols, thermal vs mechanical indices, cavitation, hydrophone, and quality phantoms." }
};

export const SPI_EXAM_QUESTIONS: SPIQuestion[] = [
  // --- DOMAIN: PHYS (Physical Principles) ---
  {
    id: "phys-01",
    q: "If the frequency of a transducer is doubled while propagating through soft tissue, what happens to the wavelength?",
    opts: [
      "It is doubled",
      "It is halved",
      "It is quadrupled",
      "It remains unchanged"
    ],
    a: 1,
    expl: "According to the wave equation, Wavelength (λ) = c / f. Since propagation speed (c) behaves as a constant of the medium (1,540 m/s), doubling frequency (f) must cut wavelength exactly in half.",
    category: "Physical Principles",
    domainCode: "PHYS"
  },
  {
    id: "phys-02",
    q: "What properties of a physical medium determine the propagation speed of sound wave traveling through it?",
    opts: [
      "The transducer's output electrical power",
      "The density and stiffness of the medium",
      "The operating frequency of the crystal",
      "The spatial peak temporal average intensity"
    ],
    a: 1,
    expl: "Propagation speed (c) is solely determined by the medium's properties: stiffness (bulk modulus) and density. High stiffness increases speed; high density decreases speed. Sound source properties have zero effect.",
    category: "Physical Principles",
    domainCode: "PHYS"
  },
  {
    id: "phys-03",
    q: "How does the frequency of a sound wave change when it migrates across the boundary from fat (1,450 m/s) into muscle tissue (1,580 m/s)?",
    opts: [
      "It increases because muscle is stiffer",
      "It decreases because muscle is denser",
      "It remains completely unchanged",
      "It becomes zero because of boundary reflection"
    ],
    a: 2,
    expl: "Once sound is launched, its frequency is hardwired by the source transducer and CANNOT change when relocating to different tissues. Wavelength increases to offset the speed change, but frequency stays identical.",
    category: "Physical Principles",
    domainCode: "PHYS"
  },
  {
    id: "phys-04",
    q: "Which parameter is defined as the physical density of sound energy per unit area, proportional to wave amplitude squared?",
    opts: [
      "Wavelength",
      "Acoustic Impedance",
      "Intensity",
      "Duty Factor"
    ],
    a: 2,
    expl: "Intensity (W/cm²) is the power of the sound beam divided by its cross-sectional area. It is proportional to amplitude squared: If amplitude doubles, intensity quadruples.",
    category: "Physical Principles",
    domainCode: "PHYS"
  },

  // --- DOMAIN: XMTR (Ultrasound Transducers) ---
  {
    id: "xmtr-01",
    q: "What chemical element is the primary material used to fabricate modern clinical ultrasound crystals, exhibiting the piezoelectric effect?",
    opts: [
      "Barium sulfate",
      "Liquid helium suspension",
      "Lead Zirconate Titanate (PZT)",
      "Polyvinyl chloride backing"
    ],
    a: 2,
    expl: "Lead Zirconate Titanate (PZT) is the industry standard ceramic element used as the piezoelectric crystal in clinical ultrasound scanners.",
    category: "Ultrasound Transducers",
    domainCode: "XMTR"
  },
  {
    id: "xmtr-02",
    q: "The matching layer of a transducer is designed to be one-quarter wavelength thick. Why is its physical impedance (Z) vital?",
    opts: [
      "It acts as an acoustic damping blocker behind the crystal",
      "Its impedance bridges the massive difference between PZT crystal and skin tissue",
      "It prevents electrical shocks by keeping current within the probe casing",
      "It concentrates the mechanical focusing beam depth inside the near zone"
    ],
    a: 1,
    expl: "The impedance (Z) of the matching layer is intermediate between PZT crystal and skin. This gradual step-down reduces reflection, drastically maximizing transmission of sound into the patient.",
    category: "Ultrasound Transducers",
    domainCode: "XMTR"
  },
  {
    id: "xmtr-03",
    q: "What major diagnostic tradeoff occurs when heavy damping (backing material) is bonded behind a transducer crystal?",
    opts: [
      "It degrades axial resolution but increases system sensitivity",
      "It improves axial resolution but decreases sensitivity and lowers Quality Factor",
      "It worsens spatial pulse length but improves temporal resolution parameters",
      "It increases the operating frequency but introduces matching reflections"
    ],
    a: 1,
    expl: "Backing material shortens the pulse's ringing (decreases Spatial Pulse Length). This drastically improves axial resolution (LARRD). The penalty is that it reduces crystal sensitivity and lowers the Quality Factor.",
    category: "Ultrasound Transducers",
    domainCode: "XMTR"
  },
  {
    id: "xmtr-04",
    q: "Which of the following array transducers operates by firing concentric ring crystals with variable delay timers for mechanical scanning and variable refocusing depths?",
    opts: [
      "Linear Sequential Array",
      "Annular Phased Array",
      "Continuous Wave Pencil Probe",
      "Mechanical Oscillating Sector Wheel"
    ],
    a: 1,
    expl: "Annular phased arrays consist of nested concentric rings. They provide dynamic electronic focusing in all three spatial planes (reducing slice-thickness error) but rely on mechanical motors for spatial steering.",
    category: "Ultrasound Transducers",
    domainCode: "XMTR"
  },

  // --- DOMAIN: INST (Imaging & Instrumentation) ---
  {
    id: "inst-01",
    q: "If you adjust your clinical depth scanner from 4 cm to 8 cm, what happens to the Pulse Repetition Frequency (PRF)?",
    opts: [
      "It doubles because pulses travel faster",
      "It is halved because the round trip time doubles",
      "It increases fourfold to sustain frame rate",
      "It remains unchanged since frequency is fixed"
    ],
    a: 1,
    expl: "Pulsed systems must wait for echoes to complete their round trip back to the face. If depth is doubled, wait-time (PRP) doubles, meaning the scanner cannot fire as many pulses per second. Hence, PRF is halved.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },
  {
    id: "inst-02",
    q: "Which process of a diagnostic receiver is responsible for compressing the wide range of electrical voltage numbers into smaller grey scale bounds?",
    opts: [
      "Demodulation",
      "Compression (Dynamic Range)",
      "Rejection thresholding",
      "Preamplification gain"
    ],
    a: 1,
    expl: "Compression (Dynamic Range) adjusts the ratio of the largest to smallest signal amplitudes. It allows the ultrasound processor to display signals within limits that our eyes can differentiate.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },
  {
    id: "inst-03",
    q: "Which part of the scanner's receiver cannot be manipulated or optimized by the clinical sonographer at the console?",
    opts: [
      "Overall Receiver Gain",
      "Time Gain Compensation (TGC)",
      "Demodulation",
      "Dynamic Range Compression"
    ],
    a: 2,
    expl: "Demodulation (rectifying negative signals into positive and smoothing the electronic envelope) is a hardwired component of the system to prepare signals for display; it has no operator controls.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },
  {
    id: "inst-04",
    q: "How does the sound beam's axial resolution (LARRD) relate mathematically to the Spatial Pulse Length (SPL)?",
    opts: [
      "Axial Resolution = Spatial Pulse Length",
      "Axial Resolution = Spatial Pulse Length / 2",
      "Axial Resolution = Spatial Pulse Length × 2",
      "Axial Resolution = Spatial Pulse Length / Frequency"
    ],
    a: 1,
    expl: "The LARRD Axial Resolution formula is SPL / 2. Shorter Spatial Pulse Lengths create smaller resolution values, meaning the scanner can separate structures that are very close along the beam's axis.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },
  {
    id: "inst-05",
    q: "Which digital memory component translates the raw ultrasound radar lines into human-comprehensible Cartesian grid frames?",
    opts: [
      "The Pre-amplifier",
      "The High-pass Wall Filter",
      "The Scan Converter",
      "The Analog Demodulator"
    ],
    a: 2,
    expl: "The scan converter is the primary digital memory block translating radar lines (polar coordinates) into 2D display frames (Cartesian grid coordinates) for standard monitors.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },

  // --- DOMAIN: DOPP (Doppler & Hemodynamics) ---
  {
    id: "dopp-01",
    q: "If blood is traveling perpendicular (90-degree insonation angle) to the sound beam, what Doppler velocity shifts are recorded?",
    opts: [
      "Maximum positive shift",
      "Maximum negative shift",
      "No Doppler shift because cosine of 90 degrees is zero",
      "A false high shift due to refraction bending"
    ],
    a: 2,
    expl: "The Doppler shift formula contains cos(θ). The cosine of 90° is precisely zero. Therefore, scanning exactly perpendicular to blood flow generates a false zero velocity shift.",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },
  {
    id: "dopp-02",
    q: "What is the critical Nyquist limit of a pulsed-wave Doppler system, above which spectral aliasing wraps around the display?",
    opts: [
      "Four times the operating frequency",
      "One-half of the Pulse Repetition Frequency (PRF / 2)",
      "The average propagation velocity divided by depth",
      "Equal to the overall receiver attenuation coefficient"
    ],
    a: 1,
    expl: "The Nyquist Limit is PRF / 2. If the Doppler frequency shift exceeds half the Pulse Repetition Frequency, the system cannot sample quickly enough, causing the velocity curve to alias.",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },
  {
    id: "dopp-03",
    q: "To successfully eliminate aliasing artifact from a high-velocity carotid stenotic jet, which adjustments should you make?",
    opts: [
      "Increase operating frequency or increase scanning depth",
      "Decrease PRF scale and push baseline downward",
      "Increase PRF scale, lower baseline, or switch to a lower frequency probe",
      "Increase overall receiver gain and switch to continuous wave focus"
    ],
    a: 2,
    expl: "To kill aliasing, you must raise the Nyquist threshold or reduce the Doppler shift. Correct moves: increase PRF scale, shift baseline down, use lower operating frequency, or scan at a shallow depth (which allows higher PRFs).",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },
  {
    id: "dopp-04",
    q: "According to the simplified Bernoulli equation, how does blood pressure behave inside the narrowest throat of an arterial stenosis?",
    opts: [
      "Pressure drops dramatically as kinetic velocity increases to preserve energy",
      "Pressure spikes high to force blood cells through the bottleneck",
      "Pressure stays completely stable while local flow returns to laminar",
      "Pressure equals the hydrostatic pressure plus Doppler shifted speed"
    ],
    a: 0,
    expl: "The law of conservation of energy (and Bernoulli's Principle) states that potential energy (pressure) drops at the constriction, converting into kinetic energy (high velocity). Thus, pressure decreases as velocity increases.",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },
  {
    id: "dopp-05",
    q: "What Doppler artifact accounts for bleed-over color flow pixels into adjacent vessel walls, commonly corrected by increasing wall filter settings?",
    opts: [
      "Spectral aliasing wrap",
      "Color ghosting (clutter)",
      "Mirror image duplicate",
      "Refraction shadows"
    ],
    a: 1,
    expl: "Color ghosting or clutter artifact is created by low-frequency, high-amplitude Doppler signals originating from muscular tissue motion. Flipping on a high-pass wall filter cuts these out.",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },

  // --- DOMAIN: SAFE (Safety & Bioeffects) ---
  {
    id: "safe-01",
    q: "Which index evaluates potential risk for acoustic temperature elevation within human biological pathways?",
    opts: [
      "Mechanical Index (MI)",
      "Thermal Index (TI)",
      "Velocity Doppler ratio",
      "Duty Factor frequency score"
    ],
    a: 1,
    expl: "The Thermal Index (TI) estimates potential biological temperature rise due to acoustic energy absorption. TI is divided into TIS (soft tissue), TIB (bone interface), and TIC (cranial bone).",
    category: "Safety & Bioeffects",
    domainCode: "SAFE"
  },
  {
    id: "safe-02",
    q: "What parameters of the acoustic sound beam are used to mathematically calculate the Mechanical Index (MI)?",
    opts: [
      "Overall receiver gain and mechanical thickness",
      "Time Gain Compensation curves and scan lines",
      "Peak negative pressure (rarefactional) and transducer frequency",
      "Duty Factor percentage and impedance mismatch ratio"
    ],
    a: 2,
    expl: "MI is computed as: peak rarefactional pressure divided by the square root of frequency (MI = pr / √f). Under this formula, lower frequencies and higher rarefaction pressures maximize cavitation hazard.",
    category: "Safety & Bioeffects",
    domainCode: "SAFE"
  },
  {
    id: "safe-03",
    q: "Under the FDA and AIUM guidelines, what are the maximum SPTA intensity limits for an unfocused ultrasound beam in diagnostic medicine?",
    opts: [
      "10 mW/cm²",
      "100 mW/cm²",
      "720 mW/cm²",
      "1,000 W/cm²"
    ],
    a: 1,
    expl: "The AIUM/FDA regulation states that the safe intensity limit for an unfocused medical transducer is 100 mW/cm² SPTA (Spatial Peak Temporal Average) and 1,000 mW/cm² (1 W/cm²) for focused beams.",
    category: "Safety & Bioeffects",
    domainCode: "SAFE"
  },
  {
    id: "safe-04",
    q: "What device is engineered with miniature piezoelectric membranes to quantitatively record localized acoustic pressures and waveforms of transducer beams?",
    opts: [
      "The Tissue Mimicking phantom",
      "A Doppler fluid moving column",
      "The Hydrophone",
      "An oscilloscopic multi-gate spectrum analyzer"
    ],
    a: 2,
    expl: "A hydrophone (or microprobe) acts as an ultra-sensitive microphone, measuring the exact pressure wave profiles, frequencies, and intensities inside an ultrasound beam.",
    category: "Safety & Bioeffects",
    domainCode: "SAFE"
  },
  {
    id: "phys-05",
    q: "An acoustic wave travels through tissue with an attenuation coefficient of 0.5 dB/cm/MHz. If a 6 MHz transducer is used to sample a structure at 4 cm depth, what is the total round-trip attenuation experienced by the echoes returning to the probe?",
    opts: [
      "12 dB",
      "24 dB",
      "48 dB",
      "6 dB"
    ],
    a: 1,
    expl: "Total attenuation = Attenuation Coefficient × Path Length × Frequency. Sound must travel down to 4 cm and back up 4 cm, making the round-trip Path Length 8 cm. Thus, total attenuation = 0.5 dB/cm/MHz × 8 cm × 6 MHz = 24 dB.",
    category: "Physical Principles",
    domainCode: "PHYS"
  },
  {
    id: "xmtr-05",
    q: "If a PZT crystal has an internal sound propagation speed of 4,000 m/s and its physical thickness is 0.5 mm, what is its resonant frequency?",
    opts: [
      "2.0 MHz",
      "4.0 MHz",
      "8.0 MHz",
      "1.0 MHz"
    ],
    a: 1,
    expl: "transducer crystal resonant thickness is exactly 1/2 wavelength (λ / 2 = 0.5 mm → λ = 1.0 mm or 0.001 m). Resonant Frequency (f) = speed (c) / wavelength (λ) = 4,000 m/s / 0.001 m = 4,000,000 Hz = 4.0 MHz.",
    category: "Ultrasound Transducers",
    domainCode: "XMTR"
  },
  {
    id: "inst-06",
    q: "An ultrasound scanner scan converter uses a 6-bit digital memory array. How many unique shades of gray can be represented within each pixel cell?",
    opts: [
      "12 shades",
      "32 shades",
      "64 shades",
      "128 shades"
    ],
    a: 2,
    expl: "In digital memory scan converters, the number of gray shades represented is 2 raised to the power of the bits: 2⁶ = 64 unique gray shades.",
    category: "Imaging & Instrumentation",
    domainCode: "INST"
  },
  {
    id: "dopp-06",
    q: "According to Poiseuille's Law of hemodynamics, if the radius of a blood vessel is reduced by 50% due to stenosis, what happens to the volumetric flow rate (Q) through that channel?",
    opts: [
      "It is reduced to 50%",
      "It is reduced to 25%",
      "It is reduced to 6.25%",
      "It remains completely constant"
    ],
    a: 2,
    expl: "Poiseuille's Law states that volumetric flow rate (Q) is proportional to the radius of the vessel raised to the fourth power (r⁴). If radius is cut by 50% (0.5), flow rate drops to (0.5)⁴ = 0.0625, which represents a massive 93.75% reduction (or down to 6.25% of original volumetric flow).",
    category: "Doppler & Hemodynamics",
    domainCode: "DOPP"
  },
  {
    id: "safe-05",
    q: "When evaluating potential tissue damage from sound waves, which ultrasound beam intensity parameter is most closely correlated with bioeffects heating?",
    opts: [
      "SPTP (Spatial Peak Temporal Peak)",
      "SATA (Spatial Average Temporal Average)",
      "SPTA (Spatial Peak Temporal Average)",
      "SATP (Spatial Average Temporal Peak)"
    ],
    a: 2,
    expl: "SPTA (Spatial Peak Temporal Average) intensity is the most relevant parameter in diagnostic ultrasound regarding thermal bioeffects (heating), since temperature rises depend on average heat accumulation deposited over time.",
    category: "Safety & Bioeffects",
    domainCode: "SAFE"
  }
];
