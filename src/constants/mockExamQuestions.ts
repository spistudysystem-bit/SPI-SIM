export interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  mediaType?: 'svg' | 'image' | 'none';
  mediaData?: any;
}

const manualQuestions: ExamQuestion[] = [
  {
    id: 1,
    category: 'Physics Principles',
    text: 'What happens to the duty factor if the pulse repetition frequency (PRF) is increased while the pulse duration remains constant?',
    options: ['It decreases', 'It increases', 'It remains the same', 'It becomes zero'],
    correctAnswer: 1,
    explanation: 'Duty Factor = Pulse Duration × PRF. If pulse duration is constant and PRF increases, the duty factor must increase because the system is pulsing more often in a given timeframe.'
  },
  {
    id: 2,
    category: 'Transducers',
    text: 'Which of the following determines the operating frequency of a continuous wave (CW) transducer?',
    options: ['The thickness of the PZT crystal', 'The propagation speed of the PZT', 'The frequency of the drive voltage', 'The damping material'],
    correctAnswer: 2,
    explanation: 'For a continuous wave (CW) transducer, the ultrasound frequency is determined strictly by the electrical frequency of the alternating current drive voltage, not crystal thickness.'
  },
  {
    id: 3,
    category: 'Transducers',
    text: 'What is the primary purpose of the matching layer in an ultrasound transducer?',
    options: ['To reduce the spatial pulse length', 'To reduce the impedance mismatch between the PZT and the skin', 'To eliminate side lobes', 'To focus the beam'],
    correctAnswer: 1,
    explanation: 'The matching layer has an acoustic impedance between that of the active element (PZT) and the skin. This intermediate impedance increases the percentage of transmitted sound into the body.'
  },
  {
    id: 4,
    category: 'Artifacts',
    text: 'Which artifact appears as a series of multiple, equally spaced echoes positioned parallel to the sound beam\'s main axis?',
    options: ['Mirror image', 'Reverberation', 'Comet tail', 'Shadowing'],
    correctAnswer: 1,
    explanation: 'Reverberation artifact occurs when a sound wave bounces back and forth between two strong reflectors, creating multiple, equally spaced echoes parallel to the sound beam along the axis.',
    mediaType: 'image',
    mediaData: '/src/assets/images/reverberation_artifact_scan_1780691164790.png'
  },
  {
    id: 5,
    category: 'Doppler',
    text: 'The Nyquist limit is equal to:',
    options: ['PRF / 2', '2 × PRF', 'Doppler shift / 2', 'Velocity / 2'],
    correctAnswer: 0,
    explanation: 'The Nyquist limit, or the point at which aliasing occurs in spectral Doppler, is exactly equal to half of the Pulse Repetition Frequency (PRF/2).'
  },
  {
    id: 6,
    category: 'Resolution',
    text: 'Lateral resolution is primarily determined by:',
    options: ['Spatial pulse length', 'Beam width', 'Pulse duration', 'Damping material'],
    correctAnswer: 1,
    explanation: 'Lateral resolution is the ability to distinctly identify two structures that are side-by-side. It is determined by the width of the sound beam.',
    mediaType: 'image',
    mediaData: '/src/assets/images/lateral_resolution_1780734098884.png'
  },
  {
    id: 7,
    category: 'Instrumentation',
    text: 'Which receiver function eliminates low-level signals to reduce background noise?',
    options: ['Amplification', 'Demodulation', 'Reject', 'Compression'],
    correctAnswer: 2,
    explanation: 'Reject (also called threshold or suppression) eliminates all signals below a minimum strength, effectively clearing the image of low-level background noise.'
  },
  {
    id: 8,
    category: 'Physics Principles',
    text: 'Snell\'s law governs which of the following physical principles?',
    options: ['Reflection', 'Refraction', 'Scattering', 'Absorption'],
    correctAnswer: 1,
    explanation: 'Snell\'s law quantifies the physics of refraction—the bending of a sound wave as it crosses a boundary between two media with different propagation speeds.',
    mediaType: 'image',
    mediaData: '/src/assets/images/snells_law_diagram_1780734084647.png'
  },
  {
    id: 9,
    category: 'Hemodynamics',
    text: 'According to Poiseuille\'s equation, what factor has the most dramatic effect on blood flow volume?',
    options: ['Vessel length', 'Blood viscosity', 'Pressure gradient', 'Vessel radius'],
    correctAnswer: 3,
    explanation: 'Vessel radius is raised to the fourth power in Poiseuille\'s equation. Therefore, small changes in the radius cause massive changes in volume flow.'
  },
  {
    id: 10,
    category: 'Safety',
    text: 'Which index relates to the likelihood of harmful cavitation occurring?',
    options: ['Thermal Index (TI)', 'Mechanical Index (MI)', 'Duty Factor', 'Intensity'],
    correctAnswer: 1,
    explanation: 'The Mechanical Index (MI) is a predictor of cavitation-related bioeffects. Higher MI values imply a greater likelihood of cavitation.'
  },
  {
    id: 11,
    category: 'Resolution',
    text: 'Increasing the frequency of the transducer will generally:',
    options: ['Improve axial resolution and decrease penetration', 'Degrade axial resolution and increase penetration', 'Improve lateral resolution only', 'Have no effect on resolution'],
    correctAnswer: 0,
    explanation: 'Higher frequency transducers produce shorter spatial pulse lengths, which greatly improves axial resolution. However, high frequency waves attenuate faster, reducing depth penetration.'
  },
  {
    id: 12,
    category: 'Artifacts',
    text: 'A posterior acoustic shadow is typically seen behind a structure that is highly:',
    options: ['Absorbing or reflecting', 'Conductive', 'Refractive', 'Liquid'],
    correctAnswer: 0,
    explanation: 'Shadowing occurs posterior to structures (like bone or gallstones) that heavily attenuate (absorb or reflect) the sound beam, leaving structures behind them un-insonated.'
  },
  {
    id: 13,
    category: 'Doppler',
    text: 'To completely eliminate aliasing in a pulsed wave spectral Doppler display, the operator can:',
    options: ['Increase the transducer frequency', 'Use continuous wave (CW) Doppler', 'Decrease the scale (PRF)', 'Shift the baseline up'],
    correctAnswer: 1,
    explanation: 'Continuous Wave (CW) Doppler does not alias because it transmits continuously without pulsing, so there is no Nyquist limit. Adjusting baseline is cosmetic, and PRF must be increased, not decreased.',
    mediaType: 'image',
    mediaData: '/src/assets/images/aliasing_doppler_diagram_1780691150017.png'
  },
  {
    id: 14,
    category: 'Physics Principles',
    text: 'What is the speed of sound in soft tissue?',
    options: ['1,540 m/s', '1,540 km/s', '1,450 m/s', '330 m/s'],
    correctAnswer: 0,
    explanation: 'The universally accepted average propagation speed of sound in biologic soft tissue is 1,540 meters per second, or 1.54 millimeters per microsecond.'
  },
  {
    id: 15,
    category: 'Transducers',
    text: 'Which of the following array transducers electronically steers a beam by firing elements with tiny time delays in a curved pattern?',
    options: ['Linear sequential array', 'Phased array', 'Mechanical sector', 'Annular array'],
    correctAnswer: 1,
    explanation: 'A phased array transducer uses electronic steering, where almost all elements are fired in groups with nanosecond time delays (phase delays) to sweep and focus the beam.'
  },
  {
    id: 16,
    category: 'Instrumentation',
    text: 'What system component determines the initial amplitude, frequency, and PRP of the beam?',
    options: ['Receiver', 'Pulser', 'Scan converter', 'Display'],
    correctAnswer: 1,
    explanation: 'The pulser generates the electrical voltage shocks to the transducer. Its output power determines amplitude, and the timing of the pulses determines PRP and PRF.'
  },
  {
    id: 17,
    category: 'Resolution',
    text: 'Which part of the sound beam has the best lateral resolution?',
    options: ['The Fresnel zone', 'The focal point', 'The Fraunhofer zone', 'The near zone'],
    correctAnswer: 1,
    explanation: 'Lateral resolution is equal to the beam width. The beam is narrowest at the focal point, therefore lateral resolution is superior at that precise depth.'
  },
  {
    id: 18,
    category: 'Artifacts',
    text: 'Mirror image artifact will always place the false twin structure:',
    options: ['Shallower to the actual anatomy', 'Deeper to the actual anatomy', 'Lateral to the real anatomy', 'Above the strong reflector'],
    correctAnswer: 1,
    explanation: 'Mirror image artifact delays the return of the echo because it bounces off a strong reflector first. The delayed return time causes the machine to plot the false image deeper on the screen.'
  },
  {
    id: 19,
    category: 'Hemodynamics',
    text: 'Reynold\'s number predicts the onset of turbulent flow. Values above what number are generally considered turbulent?',
    options: ['1,500', '2,000', '1,000', '500'],
    correctAnswer: 1,
    explanation: 'A Reynold\'s number greater than 2,000 indicates purely turbulent flow (as seen distally to tight stenoses).'
  },
  {
    id: 20,
    category: 'Physics Principles',
    text: 'Attenuation of a 4 MHz beam traveling through 5 cm of soft tissue is approximately:',
    options: ['10 dB', '2 dB', '20 dB', '5 dB'],
    correctAnswer: 0,
    explanation: 'In soft tissue, the attenuation coefficient is ~0.5 dB/cm/MHz. So: 0.5 * 4 MHz = 2 dB/cm. Total loss = 2 dB/cm * 5 cm = 10 dB.'
  },
  {
    id: 21,
    category: 'Safety',
    text: 'Which principle states that ultrasound exposure should be minimized to the lowest output needed to obtain diagnostic data?',
    options: ['In Vivo', 'In Vitro', 'ALARA', 'Cavitation'],
    correctAnswer: 2,
    explanation: 'ALARA stands for As Low As Reasonably Achievable. Operators should maximize receiver gain before increasing output power to limit patient exposure.'
  },
  {
    id: 22,
    category: 'Transducers',
    text: 'A crystal with a high propagation speed and a thin profile will produce:',
    options: ['A low frequency sound wave', 'A high frequency sound wave', 'A long spatial pulse length', 'A wide bandwidth'],
    correctAnswer: 1,
    explanation: 'For pulsed wave transducers, frequency is directly related to the speed of sound in the PZT, and inversely related to its thickness. Thin, fast crystals equal high frequencies.'
  },
  {
    id: 23,
    category: 'Instrumentation',
    text: 'What mathematical process does the ultrasound machine use to analyze backscattered Doppler signals?',
    options: ['Autocorrelation', 'Fast Fourier Transform', 'Demodulation', 'Rectification'],
    correctAnswer: 1,
    explanation: 'Spectral Doppler utilizes the Fast Fourier Transform (FFT) for accurate, detailed shift processing. Color flow Doppler uses Autocorrelation because it is faster.'
  },
  {
    id: 24,
    category: 'Physics Principles',
    text: 'If the period of a wave is 0.2 microseconds, what is the frequency?',
    options: ['2 MHz', '5 MHz', '10 MHz', '0.2 Hz'],
    correctAnswer: 1,
    explanation: 'Frequency and period are reciprocals. F = 1 / Period. So, 1 / 0.2 microseconds = 5 MHz.'
  },
  {
    id: 25,
    category: 'Image Display',
    text: 'Which function is responsible for converting the analog signal into digital form for the scan converter?',
    options: ['A-to-D Converter', 'Post-processing', 'D-to-A Converter', 'Display Monitor'],
    correctAnswer: 0,
    explanation: 'The Analog-to-Digital (A-to-D) converter digitizes the electrical voltages arriving from the transducer into binary numbers so the scan converter can map them into memory.'
  },
  {
    id: 26,
    category: 'Artifacts',
    text: 'Comet tail artifact is a form of:',
    options: ['Refraction', 'Mirroring', 'Reverberation', 'Attenuation'],
    correctAnswer: 2,
    explanation: 'Comet tail is essentially a dense, merged form of reverberation caused by resonance within a tiny, highly reflective target, such as a metal clip or cholesterol crystal.'
  },
  {
    id: 27,
    category: 'Doppler',
    text: 'In color Doppler, what does the black area in the center of the color bar indicate?',
    options: ['Maximum velocity away from the transducer', 'Maximum velocity toward the transducer', 'Baseline indicating zero or very low velocity shift', 'Aliasing limit'],
    correctAnswer: 2,
    explanation: 'The black line dividing the red and blue sections of the color map represents the baseline, where no frequency shift (zero velocity) is detected.'
  },
  {
    id: 28,
    category: 'Resolution',
    text: 'Axial resolution is determined exclusively by:',
    options: ['Spatial pulse length', 'Beam width', 'Frame rate', 'Transducer diameter'],
    correctAnswer: 0,
    explanation: 'Axial resolution is determined by the SPL. Shorter pulses (higher frequency, better damping) yield better axial resolution. Axial Res = SPL / 2.'
  },
  {
    id: 29,
    category: 'Instrumentation',
    text: 'Time Gain Compensation (TGC) compensates for:',
    options: ['Refraction', 'Scattering', 'Attenuation', 'Aliasing'],
    correctAnswer: 2,
    explanation: 'TGC artificially amplifies echoes originating from deeper structures to compensate for the continuous attenuation of the sound beam as it travels.'
  },
  {
    id: 30,
    category: 'Physics Principles',
    text: 'Which form of energy loss in tissue causes tissue heating?',
    options: ['Scattering', 'Absorption', 'Reflection', 'Refraction'],
    correctAnswer: 1,
    explanation: 'Absorption is the conversion of acoustic wave energy into heat energy, and it makes up the vast majority of attenuation in soft tissue.'
  }
];

// Generate 80 algorithmic variations to reach exactly 110 high-quality exam questions.
const generateVariations = (): ExamQuestion[] => {
  const variations: ExamQuestion[] = [];
  let currentId = 31;

  // Variation Math Problems (Depth Calculations)
  for (let i = 0; i < 20; i++) {
    const time = 13 + (i * 13); // multiples of 13 for 1, 2, 3 cm
    const depth = time / 13;
    variations.push({
      id: currentId++,
      category: 'Physics Principles',
      text: `A sound wave travels in soft tissue and the echo returns in ${time} microseconds. What is the depth of the reflector?`,
      options: [`${depth / 2} cm`, `${depth} cm`, `${depth * 2} cm`, `1.54 cm`],
      correctAnswer: 1,
      explanation: `The 13-microsecond rule dictates that for every 13 μs of go-and-return time, the object is 1 cm deep in soft tissue. ${time} / 13 = ${depth} cm.`
    });
  }

  // Variation Math Problems (Frequency & Period reciprocals)
  for (let i = 0; i < 20; i++) {
    const freq = 2 + (i * 0.5); 
    const period = (1 / freq).toFixed(3);
    variations.push({
      id: currentId++,
      category: 'Physics Principles',
      text: `If an ultrasound probe utilizes an operating frequency of ${freq} MHz, what is the period of the sound wave?`,
      options: [`${period} microseconds`, `${freq * 2} microseconds`, `1.54 microseconds`, `13 microseconds`],
      correctAnswer: 0,
      explanation: `Period and frequency are inversely proportional reciprocals. Period = 1 / Frequency. 1 / ${freq} = ${period} microseconds.`
    });
  }

  // Variation (Attenuation calculations)
  for (let i = 0; i < 20; i++) {
    const freq = 2 + (i % 5);
    const depth = 2 + (i % 4);
    const atten = (0.5 * freq) * depth;
    variations.push({
      id: currentId++,
      category: 'Attenuation',
      text: `Calculate the total attenuation of a ${freq} MHz transducer imaging a target located at a depth of ${depth} cm in soft tissue. (One-way loss)`,
      options: [`${atten} dB`, `${atten * 2} dB`, `${atten / 2} dB`, `${atten + 3} dB`],
      correctAnswer: 0,
      explanation: `Total attenuation = Attenuation Coefficient × Depth. In soft tissue, AC is ~0.5 dB/cm/MHz. 0.5 * ${freq} = ${0.5*freq} dB/cm. Multiplying by ${depth} cm yields ${atten} dB.`
    });
  }
  
  // Variation (General Terminology matching)
  const concepts = [
    { t: 'duty factor', ans: 'Percentage of time the machine is transmitting' },
    { t: 'spatial pulse length', ans: 'The physical length of a single pulse' },
    { t: 'pulse repetition frequency', ans: 'Number of pulses transmitted per second' },
    { t: 'impedance', ans: 'Resistance to sound travel in a medium' },
    { t: 'refraction', ans: 'Bending of sound at a boundary' },
    { t: 'Rayleigh scattering', ans: 'Uniform scattering by red blood cells' },
    { t: 'Nyquist limit', ans: 'The velocity limit before aliasing occurs' },
    { t: 'dynamic range', ans: 'Ratio of largest to smallest signal magnitudes' },
    { t: 'frame rate', ans: 'Number of discrete images painted per second' },
    { t: 'temporal resolution', ans: 'Accuracy of tracking motion over time' }
  ];
  
  for (let i = 0; i < 20; i++) {
    const concept = concepts[i % concepts.length];
    variations.push({
      id: currentId++,
      category: 'Terminology',
      text: `Which of the following best describes the fundamental definition of ${concept.t}?`,
      options: [
        concept.ans,
        'The depth of the reflector',
        'The heat generated by the transducer',
        'The electrical voltage applied to the crystal'
      ],
      correctAnswer: 0,
      explanation: `${concept.t.toUpperCase()} is best defined as: ${concept.ans}. This is a core competency definition in ultrasound physics.`
    });
  }

  return variations;
};

export const MOCK_EXAM_QUESTIONS: ExamQuestion[] = [...manualQuestions, ...generateVariations()].slice(0, 110);
