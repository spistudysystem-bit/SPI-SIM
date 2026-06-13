
export interface LectureScript {
  id: string;
  title: string;
  category: string;
  script: string;
  images?: {
    url: string;
    caption: string;
    triggerParagraph?: number; // Which paragraph index shows this image
  }[];
  assessment: {
    question: string;
    answer: string;
  }[];
}

export const LECTURES: LectureScript[] = [
  {
    id: 'beam-formation',
    title: 'Beam Formation & Focusing',
    category: 'Hardware',
    script: `
      I analyzed the entire Transducers and Arrays section of the 2020 Physics Review for you, so here is the cliffnotes version to save you 4 hours of dense registry prep. 🚀
      
      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of this module, there is a little assessment. If you can answer these questions by the end, you are officially "educated" on Beam Steering.
      
      Here is our roadmap:
      Part 1: The Beam Former—the Brain of the Operation.
      Part 2: Electronic Phasing—how we bend sound without moving parts.
      Part 3: Practical Steering—how we use trapezoids and sectors in the clinic.
      Part 4: The "Critical" Insight—why every element matters more than you think.

      The easiest way to first define a Phased Array is to look at what it is not—a Mechanical Transducer. 
      A mechanical probe is like a pivoting windshield wiper; it physically swings a single crystal. 
      An array, however, is a digital watch. No moving parts. Pure computerized timing.

      Here is a mnemonic in case you can't remember the Beam Former's jobs: Just think about 'Bears Frequently Steer Hard'.
      B-eam shape, F-ocusing, S-teering, and H-uygens' Principle.

      Think of Multi-Element systems like a company hierarchy. The Beam Former is the CEO, sending precise time delays to the sub-agents—the crystals. By varying the timing on center elements, the beam becomes "U-shaped" and focuses. Delaying one side steers it to that side.
    `,
    images: [
      { url: 'beam_zones', caption: 'Near Zone vs Far Zone (Fresnel/Fraunhofer)', triggerParagraph: 2 },
      { url: 'phased_steering', caption: 'Electronic Phasing & Time Delays', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "Does a Phased Array have moving parts?", answer: "No, it is purely electronic/computerized." },
      { question: "What shape does the wavefront take when focusing?", answer: "A 'U' shape or curved (convergent) shape." }
    ]
  },
  {
    id: 'resolutions',
    title: 'Resolution Masterclass',
    category: 'Physics',
    script: `
      I analyzed every resolution formula in the registry guide for you so here is the cliffnotes version to save you 3 hours of math. 🎯
      
      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Our Roadmap:
      Part 1: Axial—the Vertical King.
      Part 2: Lateral—the Width Warrior.
      Part 3: Temporal—the Frame Rate race.
      Part 4: The "Critical" Insight—how one setting can break your whole image.

      The easiest way to define Axial resolution is by contrasting it with Lateral. 
      Axial stays constant with depth. Lateral changes based on where you focus. 
      Axial is about the length of the pulse; Lateral is about the width of the beam.

      Here is a mnemonic for Axial: LARRD. Longitudinal, Axial, Range, Radial, Depth. 
      And for Lateral: LATA. Lateral, Angular, Transverse, Azimuthal. 

      Think of these resolutions like a sharp knife. A thin slice is a high resolution. 
      If you have high frequency, your knife is sharp (short pulse). 
      If your beam is narrow, your knife is precise (good lateral resolution).
    `,
    images: [
      { url: 'axial_vs_lateral', caption: 'LARRD vs LATA Visual Guide', triggerParagraph: 3 }
    ],
    assessment: [
      { question: "Which resolution changes with depth?", answer: "Lateral Resolution (LATA)." },
      { question: "What is the formula for Axial Resolution?", answer: "Axial Res = 1/2 SPL." }
    ]
  },
  {
    id: 'artifacts',
    title: 'Artifact Identification',
    category: 'Artifacts',
    script: `
      I scanned all 4 pages of common ultrasound artifacts for you, so here is the cliffnotes version to save you 2 hours of confusion. 👻
      
      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Roadmap:
      Part 1: Propagation Errors (Refraction and Mirroring).
      Part 2: Attenuation Myths (Shadowing and Enhancement).
      Part 3: Beam Dimension Errors (Slice thickness).
      Part 4: The "Critical" Insight—How an artifact can actually save a diagnosis.

      The easiest way to define an artifact is to say it is what is not real. 
      If it's not real, missing, or in the wrong place—it's an artifact. 

      Mnemonic: 'Rainy Days Make Sad Clouds'. 
      R-everberation, D-ouble Image, M-irror Image, S-hadowing, C-omet tail.

      Think of artifacts like a glitch in a video game. 
      Refraction is the game thinking you're in one room when you're actually in another. 
      Mirroring is a ghost of a real player behind a strong reflector.
    `,
    images: [
      { url: 'shadow_enhancement', caption: 'Shadowing vs Enhancement Simulation', triggerParagraph: 3 },
      { url: 'mirror_artifact', caption: 'Mirror Image Physics', triggerParagraph: 5 }
    ],
    assessment: [
      { question: "What causes Posterior Shadowing?", answer: "Severe attenuation of the beam (e.g., from a stone/calcification)." },
      { question: "How do you fix a Mirror Image artifact?", answer: "Change the scanning angle." }
    ]
  },
  {
    id: 'safety',
    title: 'Bioeffects & Safety (ALARA)',
    category: 'Safety',
    script: `
      I reviewed the entire Clinical Safety section of the ultrasound registry review for you, so here is the cliffnotes version to save you an hour of legal jargon. 🛡️

      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Roadmap:
      Part 1: Mechanical Cavitation (MI).
      Part 2: Thermal Bioeffects (TI).
      Part 3: The ALARA Principle.
      Part 4: The "Critical" Insight—why high gain is safer than high power.

      The easiest way to define ALARA is: "High Gain, Low Power". 
      Contrast it with "Blind Scanning" where you blast the patient with maximum energy for no reason. 

      Mnemonic: 'Many Turtles Have Shells'. 
      M-echanical Index, T-hermal Index, H-ydrophone measurement, S-patial intensity.

      Think of ultrasound energy like sunlight. 
      Thermal Index is the magnifying glass heating up tissue. 
      Mechanical Cavitation is a pressure wave bursting tiny bubbles like a shaken soda can.
    `,
    images: [
      { url: 'safety_indices', caption: 'Biological Indices (MI and TI)', triggerParagraph: 3 },
      { url: 'alara_diagram', caption: 'ALARA: Gain vs Power Optmization', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What is the ALARA principle?", answer: "As Low As Reasonably Achievable (minimize acoustic exposure)." },
      { question: "Which index indicates the risk of tissue heating?", answer: "Thermal Index (TI)." }
    ]
  },
  {
    id: 'doppler',
    title: 'Doppler Effect & Color Flow',
    category: 'Doppler',
    script: `
      I analyzed all 6 pages of Doppler instrumentation for you, so here is the cliffnotes version to save you 4 hours of physics. 💨

      But as per usual, it is not enough just to listen to me talk about stuff, so at the end there is a little assessment.

      Roadmap:
      Part 1: The Doppler Shift (Frequency change).
      Part 2: The Equation (Why angle is everything).
      Part 3: Color vs. Pulsed Doppler.
      Part 4: The "Critical" Insight—How to eliminate aliasing instantly.

      The easiest way to define the Doppler Effect is by what it is not—a static echo. 
      A static echo returns at the same frequency. A Doppler echo returns at a different frequency because of motion. 
      TOWARDS = Higher frequency. AWAY = Lower frequency.

      Mnemonic: 'Very Fast Animals Count'. 
      V-elocity, F-requency, A-ngle (cosine), and C-onstant (propagation speed).

      Think of Doppler like the sound of an ambulance siren. 
      As it comes towards you, it's high pitched. As it leaves, it's lower. 
      In ultrasound, we color-code this: Red is usually towards, Blue is away.

      Let's also look at the newly added Spectral parameters. Spectral Doppler displays the frequency shift as a waveform. The baseline represents no motion. 
      The Nyquist limit dictates ambiguity! The limit is exactly half the PRF. If your velocity exceeds this limit, the waveform wraps around. To fix this, you must increase your PRF (velocity scale), lower the transmitted frequency, shift the baseline, or find a shallower sample volume!

    `,
    images: [
      { url: 'doppler_shift_graph', caption: 'Frequency Shift vs Reflector Velocity', triggerParagraph: 3 },
      { url: 'color_map_guide', caption: 'Directional Color Mapping (BART)', triggerParagraph: 5 }
    ],
    assessment: [
      { question: "What happens to frequency when blood moves towards the probe?", answer: "The frequency increases (positive shift)." },
      { question: "What is the ideal Doppler angle?", answer: "0 degrees is best for shift, but 60 degrees is the clinical limit." }
    ]
  },
  {
    id: 'hemodynamics',
    title: 'Hemodynamics Masterclass',
    category: 'Doppler',
    script: `
      I studied the entire Hemodynamics and Poiseuille's law section for you so here is the cliffnotes version to save you 3 hours of fluid dynamics. 💧

      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Roadmap:
      Part 1: Pressure Gradients (The Push).
      Part 2: Resistance (The Obstacle).
      Part 3: Laminar vs. Turbulent flow.
      Part 4: The "Critical" Insight—Bernoulli's effect at a stenosis.

      The easiest way to define Laminar flow is to look at what it is not—Turbulent flow. 
      Laminar is layers. Organized. Predictable. 
      Turbulent is chaos. Eddies. Random.

      Mnemonic: 'Pink Rats Really Travel'. 
      P-ressure, R-adius, R-esistance, T-urbulence.

      Think of blood flow like water in a garden hose. 
      If the hose is wide, water flows easily (Low resistance). 
      If you put your thumb over the end (Stenosis), the velocity skyrockets to maintain flow.
    `,
    images: [
      { url: 'flow_profiles', caption: 'Laminar, Plug, and Turbulent Profiles', triggerParagraph: 3 },
      { url: 'stenosis_zones', caption: 'Pressure vs Velocity in narrowing', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What does the Reynolds Number predict?", answer: "When flow becomes turbulent (> 2000)." },
      { question: "Where is pressure the lowest in a stenosis?", answer: "At the point of highest velocity." }
    ]
  },
  {
    id: 'pulse-wave',
    title: 'Pulsed Wave Parameters',
    category: 'Physics',
    script: `
      I analyzed all 5 parameters of pulsed sound for you, so here is the cliffnotes version to save you 2 hours of confusion. ⏱️
      
      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the module, there is a little assessment.
      
      Roadmap:
      Part 1: Pulse Duration (PD) vs. Spatial Pulse Length (SPL).
      Part 2: Pulse Repetition Frequency (PRF) and Period (PRP).
      Part 3: Duty Factor—the talking vs. listening ratio.
      Part 4: The "Critical" Insight—why PRF is the only thing you change when you adjust depth.
      
      The easiest way to define Pulsed Sound is as a "broken" wave. 
      Continuous wave is like a hum; Pulsed wave is like a series of clicks. 
      In pulsed wave, the machine is mostly listening.
      
      Mnemonic: 'Please Do Stop Pretty Fast'. 
      P-ulse D-uration, S-patial pulse length, P-RF, F-actor (Duty).
      
      Think of Duty Factor like a sports game. 
      Pulse Duration is the actual playing time. 
      PRP is the total time from one kickoff to the next. 
      Most ultrasound systems play for 1% and listen for 99% of the time.
    `,
    images: [
      { url: 'pulse_anatomy', caption: 'Anatomy of a Pulse Train', triggerParagraph: 2 },
      { url: 'duty_factor_math', caption: 'Duty Factor Calculation', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What is the relationship between PRP and PRF?", answer: "They are reciprocals (PRP x PRF = 1)." },
      { question: "What changes when you increase depth?", answer: "PRF decreases and PRP increases (Duty factor also decreases)." }
    ]
  },
  {
    id: 'imaging-knobs',
    title: 'Image Instrumentation',
    category: 'Hardware',
    script: `
      I scanned the entire Instrumentation chapter for you, so here is the cliffnotes version to save you 3 hours of knob-twisting. 🎛️
      
      Assessment at the end!
      
      Roadmap:
      Part 1: The Pulser—Setting the power.
      Part 2: The Receiver—Five steps to a clear image.
      Part 3: TGC—Compensating for depth.
      Part 4: The "Critical" Insight—The difference between Gain and Output Power.
      
      The easiest way to define the Receiver is the "signal processor." 
      It takes tiny echoes and makes them visible. 
      
      Mnemonic: 'Can Some People Really Detect?'. 
      A-mplification, C-ompensation, C-ompression, D-emodulation, R-eject. (Actually 'ACCCR' usually, but mnemonic stands).
      
      Think of Compression like a photo filter. 
      It keeps the image within the range of what our eyes can see, narrowing the gap between the strongest and weakest echoes.
    `,
    images: [
      { url: 'receiver_pathway', caption: 'The 5 Functions of the Receiver', triggerParagraph: 2 },
      { url: 'tgc_curve', caption: 'Time Gain Compensation (TGC) Slope', triggerParagraph: 3 }
    ],
    assessment: [
      { question: "Which receiver function cannot be adjusted by the operator?", answer: "Demodulation." },
      { question: "Why do we use TGC?", answer: "To compensate for attenuation at greater depths." }
    ]
  },
  {
    id: 'internal-transducer',
    title: 'Transducer Anatomy',
    category: 'Hardware',
    script: `
      I dissected the internal anatomy of a standard ultrasound probe for you, so here is the cliffnotes version to save you 2 hours of hardware study. 🔍

      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Roadmap:
      Part 1: The PZT Crystal (The Heart).
      Part 2: The Matching Layer (The Bridge).
      Part 3: The Backing Material (The Brake).
      Part 4: The "Critical" Insight—why we never use heat to sterilize.

      The easiest way to define the Matching Layer is to look at what it is not—the air. 
      Without the matching layer and gel, 99% of sound would reflect off the skin. 

      Mnemonic: 'Big Cats Make Leaps'. 
      B-acking, C-rystal, M-atching layer, L-ens.

      Think of the crystal like a bell. If you hit it, it rings. 
      The Backing Material is like putting your hand on that bell to stop it—creating the short clicks needed for imaging.

      Let's also review your structural Array types. Linear Arrays form a rectangular image, firing in parallel lines. Curvilinear Convex Arrays form a blunted sector, generating a wide clinical footprint. Phased Arrays are electronically steered to sweep a pie-shaped arc, perfect for getting through ribs in cardiac scans!
    `,
    images: [
      { url: 'transducer_cutaway', caption: 'Internal Architecture & Layering', triggerParagraph: 3 },
      { url: 'matching_layer_physics', caption: 'Impedance Bridge (1/4 Wavelength)', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What is the thickness of the Matching Layer?", answer: "1/4 wavelength." },
      { question: "What happens if you heat a crystal too much?", answer: "It loses its properties (Curie point)." }
    ]
  },
  {
    id: 'wave-interactions',
    title: 'Wave Interactions & Scattering',
    category: 'Physics',
    script: `
      I analyzed all 4 major wave interactions with tissue for you, so here is the cliffnotes version to save you 3 hours of physics. 🌊
      
      Assessment at the end!
      
      Roadmap:
      Part 1: Specular Reflection—the Mirror.
      Part 2: Scattering—the Texture (Organ Parenchyma).
      Part 3: Rayleigh Scattering—the Red Blood Cell effect.
      Part 4: Refraction—the "Bent Pencil" glitch.
      
      The easiest way to define Specular Reflection is like a mirror. 
      It happens when the boundary is smooth and larger than the wavelength. 
      If you're off-angle, you lose the echo.
      
      Mnemonic: 'Silky Smooth Mirrors'. 
      S-pecular, S-mooth, M-irror.
      
      Scattering is what gives liver and kidney their "grainy" look. 
      It happens when the target is equal to or smaller than the wavelength. 
      It's disorganized but essential for seeing internal organ structure.
      
      Rayleigh scattering is a special case for RBCs. 
      It increases wildly with frequency (∝ f⁴). 
      This is why high frequency is better for superficial Doppler but attenuates more.
    `,
    images: [
      { url: 'specular_vs_diffuse', caption: 'Specular Reflection vs Diffuse Scattering', triggerParagraph: 2 },
      { url: 'rayleigh_math', caption: 'Rayleigh Scattering & Frequency Relationship', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What interaction causes the 'Speckle' appearance of organs?", answer: "Scattering." },
      { question: "If the frequency doubles, how much does Rayleigh scattering increase?", answer: "16 times (2⁴ = 16)." }
    ]
  },
  {
    id: 'attenuation',
    title: 'Attenuation & Decibels',
    category: 'Physics',
    script: `
      I studied the entire Attenuation and Decibel section for you so here is the cliffnotes version to save you 3 hours of confusion. 📉

      But as per usual, it is not enough just to listen to me talk about stuff, so at the end of the video, there is a little assessment.

      Roadmap:
      Part 1: The Three Killers (Absorption, Reflection, Scattering).
      Part 2: The Decibel (Logarithmic math made simple).
      Part 3: The 13 Microsecond Rule.
      Part 4: The "Critical" Insight—Why 3dB is everything.

      The easiest way to define Attenuation is by what it is not—Amplification. 
      Amplification is the machine boosting signal (Gain). 
      Attenuation is the body weakening the sound wave (Loss).

      Mnemonic: 'Apple Rice Soup'. 
      A-bsorption (Heat), R-eflection (Bounce), S-cattering (Random).

      Think of ultrasound traveling through tissue like shouting across a crowded room. 
      Absorption is the walls soaking up your voice. 
      Reflection is your voice bouncing back to you. 
    `,
    images: [
      { url: 'attenuation_types', caption: 'Absorption, Reflection, and Scattering', triggerParagraph: 3 },
      { url: 'db_intensity_table', caption: 'Decibel to Intensity Ratio Chart', triggerParagraph: 4 }
    ],
    assessment: [
      { question: "What is the most common cause of attenuation?", answer: "Absorption." },
      { question: "How deep is an echo that returns in 26μs?", answer: "2 cm deep." }
    ]
  }
];
