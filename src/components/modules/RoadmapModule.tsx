import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, 
  CheckCircle, 
  BookOpen, 
  Sparkles, 
  Award, 
  Info, 
  ChevronRight, 
  Copy, 
  CreditCard, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  Clock,
  Stethoscope,
  Users,
  HeartHandshake,
  TrendingUp,
  Search,
  Scale,
  ClipboardCheck,
  Briefcase,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface SubModule {
  id: string;
  name: string;
  category: string;
  weight: number; // weight in SPI registry
}

const SYLLABUS_MODULES: SubModule[] = [
  { id: 'pzt_anatomy', name: 'PZT Crystal Thickness & Operating Frequency', category: 'Transducer Design', weight: 15 },
  { id: 'pulsing', name: 'PRP, PRF, SPL, Duty Factor & Spatial Resolution', category: 'Pulsed Wave Parameters', weight: 15 },
  { id: 'resolutions', name: 'Axial vs. Lateral vs. Elevational Limits', category: 'Resolutions', weight: 12 },
  { id: 'attenuation', name: 'Decibel Attenuation & Half-Boundary Thickness', category: 'Acoustic Sound Loss', weight: 10 },
  { id: 'doppler_shift', name: 'Hemodynamics, Poiseuille’s Law & Doppler Equation', category: 'Doppler Speeds', weight: 18 },
  { id: 'tgc_knobs', name: 'Clinical TGC, Power, Receiver Gain & Dynamic Range', category: 'Instrumentation', weight: 12 },
  { id: 'artifacts', name: 'Reverberation, Shadowing, Mirror Image & Aliasing', category: 'Artifacts', weight: 10 },
  { id: 'safety', name: 'Bioeffects, Mechanical Index (MI) & Thermal Index (TI)', category: 'Safety & Regulations', weight: 8 },
];

const IconMap: Record<string, any> = {
  BookOpen,
  Stethoscope,
  Award,
  Users,
  Cpu,
  HeartHandshake,
  TrendingUp,
  Search,
  Scale,
  ClipboardCheck,
  Briefcase,
  Globe
};

interface ProgramSubComponent {
  id: string;
  name: string;
  desc: string;
}

interface ProgramComponent {
  id: string;
  num: number;
  title: string;
  desc: string;
  icon: string;
  colorClass: string;
  glowColor: string;
  subComponents: ProgramSubComponent[];
}

const PROGRAM_COMPONENTS_DATA: ProgramComponent[] = [
  {
    id: 'curriculum',
    num: 1,
    title: "Curriculum",
    desc: "Rigorous didactic and theoretical courses to establish foundational knowledge",
    icon: 'BookOpen',
    colorClass: "from-cyan-500/15 to-cyan-500/2 text-cyan-400 border-cyan-500/20",
    glowColor: "#00d1ff",
    subComponents: [
      { id: 'curr_core', name: "Core Courses", desc: "Fundamental courses covering anatomy, physiology, medical terminology, and pathology." },
      { id: 'curr_spec', name: "Specialized Courses", desc: "In-depth courses on various types of ultrasound, such as abdominal, obstetric and gynecologic, vascular, and cardiac sonography." },
      { id: 'curr_phys', name: "Physics and Instrumentation", desc: "Courses on ultrasound physics, principles of sound waves, and the operation of ultrasound equipment." }
    ]
  },
  {
    id: 'clinical_training',
    num: 2,
    title: "Clinical Training",
    desc: "Experiential integration in high-volume laboratory and medical settings",
    icon: 'Stethoscope',
    colorClass: "from-teal-500/15 to-teal-500/2 text-teal-400 border-teal-500/20",
    glowColor: "#14b8a6",
    subComponents: [
      { id: 'clin_hands', name: "Hands-On Experience", desc: "Supervised clinical rotations in hospitals, clinics, and imaging centers to provide real-world experience." },
      { id: 'clin_sim', name: "Simulation Labs", desc: "Use of ultrasound simulators to practice scanning techniques and procedures in a controlled environment." }
    ]
  },
  {
    id: 'accreditation',
    num: 3,
    title: "Accreditation and Certification",
    desc: "Adherence to premium standards and board eligibility pre-requisites",
    icon: 'Award',
    colorClass: "from-amber-500/15 to-amber-500/2 text-amber-400 border-amber-500/20",
    glowColor: "#f59e0b",
    subComponents: [
      { id: 'acc_standard', name: "Accreditation", desc: "Ensure the program is accredited by relevant accrediting bodies, such as the Commission on Accreditation of Allied Health Education Programs (CAAHEP)." },
      { id: 'acc_prep', name: "Certification Preparation", desc: "Courses and resources to prepare students for certification exams, such as those offered by the American Registry for Diagnostic Medical Sonography (ARDMS)." }
    ]
  },
  {
    id: 'faculty',
    num: 4,
    title: "Faculty",
    desc: "Academic and professional mentorship from credentialed clinical experts",
    icon: 'Users',
    colorClass: "from-purple-500/15 to-purple-500/2 text-purple-400 border-purple-500/20",
    glowColor: "#a855f7",
    subComponents: [
      { id: 'fac_qual', name: "Qualified Instructors", desc: "Experienced and certified sonographers and healthcare professionals who provide instruction and mentorship." },
      { id: 'fac_cont', name: "Continuing Education", desc: "Opportunities for faculty to stay updated with the latest advancements in ultrasound technology and techniques." }
    ]
  },
  {
    id: 'facilities',
    num: 5,
    title: "Facilities and Equipment",
    desc: "Physical and virtual infrastructure supporting professional acquisition",
    icon: 'Cpu',
    colorClass: "from-indigo-500/15 to-indigo-500/2 text-indigo-400 border-indigo-500/20",
    glowColor: "#6366f1",
    subComponents: [
      { id: 'fac_equip', name: "Modern Equipment", desc: "Access to state-of-the-art ultrasound machines and technology." },
      { id: 'fac_res', name: "Learning Resources", desc: "Availability of textbooks, online resources, and anatomical models for study and practice." }
    ]
  },
  {
    id: 'student_support',
    num: 6,
    title: "Student Support Services",
    desc: "Comprehensive academic, mental, and personal wellness advisory networks",
    icon: 'HeartHandshake',
    colorClass: "from-rose-500/15 to-rose-500/2 text-rose-400 border-rose-500/20",
    glowColor: "#f43f5e",
    subComponents: [
      { id: 'stud_adv', name: "Academic Advising", desc: "Guidance on course selection, career planning, and academic progress." },
      { id: 'stud_tut', name: "Tutoring and Mentoring", desc: "Support from faculty and peer mentors to help students succeed academically." },
      { id: 'stud_coun', name: "Counseling Services", desc: "Access to mental health and wellness resources." }
    ]
  },
  {
    id: 'professional_dev',
    num: 7,
    title: "Professional Development",
    desc: "Career preparedness and integration with industry-standard groups",
    icon: 'TrendingUp',
    colorClass: "from-emerald-500/15 to-emerald-500/2 text-emerald-400 border-emerald-500/20",
    glowColor: "#10b981",
    subComponents: [
      { id: 'prof_work', name: "Workshops and Seminars", desc: "Regularly scheduled events on topics such as resume writing, interview skills, and professional networking." },
      { id: 'prof_org', name: "Professional Organizations", desc: "Encouragement to join and participate in organizations like the Society of Diagnostic Medical Sonography (SDMS)." }
    ]
  },
  {
    id: 'research_ops',
    num: 8,
    title: "Research Opportunities",
    desc: "Pushing clinical domains through systematic inquiry and scholarship",
    icon: 'Search',
    colorClass: "from-pink-500/15 to-pink-500/2 text-pink-400 border-pink-500/20",
    glowColor: "#ec4899",
    subComponents: [
      { id: 'res_proj', name: "Research Projects", desc: "Opportunities to participate in or conduct research related to ultrasound technology and applications." },
      { id: 'res_pub', name: "Publications and Presentations", desc: "Support for presenting research findings at conferences and publishing in professional journals." }
    ]
  },
  {
    id: 'ethics_pro',
    num: 9,
    title: "Ethics and Professionalism",
    desc: "Advocating for high patient care standards and legal compliance",
    icon: 'Scale',
    colorClass: "from-sky-500/15 to-sky-500/2 text-sky-400 border-sky-500/20",
    glowColor: "#0ea5e9",
    subComponents: [
      { id: 'eth_train', name: "Ethics Training", desc: "Courses on medical ethics, patient confidentiality, and professional conduct." },
      { id: 'eth_beh', name: "Professional Behavior", desc: "Emphasis on developing a professional demeanor and effective communication skills." }
    ]
  },
  {
    id: 'assessment',
    num: 10,
    title: "Assessment and Evaluation",
    desc: "Rigorous standards tracking to optimize learning and clinical mastery",
    icon: 'ClipboardCheck',
    colorClass: "from-lime-500/15 to-lime-500/2 text-lime-400 border-lime-500/20",
    glowColor: "#84cc16",
    subComponents: [
      { id: 'ass_reg', name: "Regular Assessments", desc: "Quizzes, exams, and practical assessments to evaluate student knowledge and skills." },
      { id: 'ass_feed', name: "Feedback Mechanisms", desc: "Continuous feedback from instructors and clinical supervisors to help students improve." }
    ]
  },
  {
    id: 'career_services',
    num: 11,
    title: "Career Services",
    desc: "Unlocking structural pipelines for placement and lifelong mentorship",
    icon: 'Briefcase',
    colorClass: "from-orange-500/15 to-orange-500/2 text-orange-400 border-orange-500/20",
    glowColor: "#f97316",
    subComponents: [
      { id: 'car_job', name: "Job Placement Assistance", desc: "Help with finding job opportunities, internships, and externships." },
      { id: 'car_alum', name: "Alumni Network", desc: "Access to a network of graduates who can provide career advice and job leads." }
    ]
  },
  {
    id: 'community_eng',
    num: 12,
    title: "Community Engagement",
    desc: "Advocating for population healthcare out in the wild",
    icon: 'Globe',
    colorClass: "from-yellow-500/15 to-yellow-500/2 text-yellow-400 border-yellow-500/20",
    glowColor: "#eab308",
    subComponents: [
      { id: 'com_out', name: "Outreach Programs", desc: "Opportunities to participate in community health fairs, screenings, and educational events." },
      { id: 'com_vol', name: "Volunteer Opportunities", desc: "Encouragement to volunteer in healthcare settings to gain additional experience." }
    ]
  }
];

export default function RoadmapModule() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab ] = useState<'milestones' | 'program_components'>('milestones');
  
  // Track status for each syllabus section: 'not_started' | 'studying' | 'mastered'
  const [syllabusStatus, setSyllabusStatus] = useState<Record<string, 'not_started' | 'studying' | 'mastered'>>(() => {
    const saved = localStorage.getItem('spi_syllabus_readiness');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore fallback */ }
    }
    return SYLLABUS_MODULES.reduce((acc, current) => {
      acc[current.id] = 'not_started';
      return acc;
    }, {} as Record<string, 'not_started' | 'studying' | 'mastered'>);
  });

  // Track checked parameters for academic ultrasound program components
  const [programStatus, setProgramStatus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('spi_program_compliance');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore fallback */ }
    }
    return {};
  });

  const [selectedTier, setSelectedTier] = useState<'standard' | 'maestro'>('standard');
  const [generatedVoucher, setGeneratedVoucher] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('spi_syllabus_readiness', JSON.stringify(syllabusStatus));
  }, [syllabusStatus]);

  useEffect(() => {
    localStorage.setItem('spi_program_compliance', JSON.stringify(programStatus));
  }, [programStatus]);

  // Load from Firebase firestore if user is logged in
  useEffect(() => {
    if (user) {
      const loadProfileData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.syllabusStatus) {
              setSyllabusStatus(data.syllabusStatus);
            }
            if (data.programStatus) {
              setProgramStatus(data.programStatus);
            }
            if (data.voucherCode) {
              setGeneratedVoucher(data.voucherCode);
            }
          }
        } catch (e) {
          console.warn('Could not load user syllabus state from Firebase:', e);
        }
      };
      loadProfileData();
    }
  }, [user]);

  const handleStatusChange = async (moduleId: string, newStatus: 'not_started' | 'studying' | 'mastered') => {
    const updated = { ...syllabusStatus, [moduleId]: newStatus };
    setSyllabusStatus(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          syllabusStatus: updated
        }, { merge: true });
      } catch (err) {
        console.warn('Firebase status save error:', err);
      }
    }
  };

  const handleProgramCheckToggle = async (subId: string) => {
    const updated = { ...programStatus, [subId]: !programStatus[subId] };
    setProgramStatus(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          programStatus: updated
        }, { merge: true });
      } catch (err) {
        console.warn('Firebase program compliance save error:', err);
      }
    }
  };

  // Calculations of SPI readiness scoring
  const overallScore = Object.entries(syllabusStatus).reduce((total, [id, status]) => {
    const module = SYLLABUS_MODULES.find(m => m.id === id);
    if (!module) return total;
    
    const multiplier = status === 'mastered' ? 1.0 : status === 'studying' ? 0.4 : 0.0;
    return total + (module.weight * multiplier);
  }, 0);

  // Raw overall points sum
  const maxScore = SYLLABUS_MODULES.reduce((sum, current) => sum + current.weight, 0);
  const readinessPercent = Math.min(Math.round((overallScore / maxScore) * 100), 100);

  // Calculations of compliance stats for the 12 key ultrasound program training components
  const totalSubComponents = PROGRAM_COMPONENTS_DATA.reduce((sum, item) => sum + item.subComponents.length, 0);
  const checkedSubComponents = Object.values(programStatus).filter(Boolean).length;
  const programCompliancePercent = totalSubComponents > 0 ? Math.round((checkedSubComponents / totalSubComponents) * 100) : 0;

  // Dynamic ranking based on completeness
  const getReadinessBadge = (percent: number) => {
    if (percent === 0) return { title: 'Dormant Acoustician', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
    if (percent < 25) return { title: 'Registry Initiate', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (percent < 60) return { title: 'Resonance Apprentice', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (percent < 90) return { title: 'Doppler Tactician', color: 'text-[#00d1ff] bg-[#00d1ff]/10 border-[#00d1ff]/20' };
    return { title: 'SPI Exam King Master', color: 'text-[#ffd700] bg-[#ffd700]/10 border-[#ffd700]/20 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,215,0,0.15)] animate-pulse' };
  };

  const badge = getReadinessBadge(readinessPercent);

  // Diagnostic mini-questions playground to assess current logic
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  const DIAGNOSTIC_QUESTIONS = [
    {
      q: "If an ultrasound transducer operates at 6 MHz and is replaced by a 12 MHz transducer, what occurs to the crystal thickness and spatial pulse length?",
      opts: [
        "Crystal thickness is cut in half; Spatial Pulse Length (SPL) generally decreases.",
        "Crystal thickness doubles; Spatial Pulse Length remains constant.",
        "Both crystal thickness and period double.",
        "Crystal thickness is halved; SPL must double to preserve Axial resolution."
      ],
      correct: 0,
      exp: "Higher frequency requires a thinner piezoelectric element (inversely related, f ≈ C / 2th). Since frequency doubles, crystal thickness is halved. Wavelength is cut in half, reducing the Spatial Pulse Length (SPL = cycles × λ), which improves (decreases) your axial resolution limits!"
    },
    {
      q: "To image deeper structures successfully, a sonographer decreases the PRF. Which of the following parameters increases concurrently?",
      opts: [
        "Duty Factor (percent output duration)",
        "Pulse Repetition Period (PRP)",
        "Axial Resolution precision",
        "Acoustic impedance coefficient of target fat"
      ],
      correct: 1,
      exp: "Since PRF is inversely related to PRP (PRP = 1 / PRF), decreasing the PRF to allow sound waves to travel deeper and echo back before the next pulse increases the PRP. Duty factor decreases because there is longer rest time between pulses."
    },
    {
      q: "While performing a vascular scan, the sonographer notices severe aliasing of the spectral signal. Which intervention solves this artifact without changing the sampling angle?",
      opts: [
        "Lower the baseline control and decrease the wall filter.",
        "Switch to a higher frequency transducer.",
        "Increase the Pulse Repetition Frequency (PRF) or use a lower operating frequency probe.",
        "Decrease the speed of sound limit setting manually to 1450 m/s."
      ],
      correct: 2,
      exp: "Aliasing occurs when the Doppler shift exceeding the Nyquist Limit (PRF / 2). Raising the PRF increases the Nyquist scale. Alternatively, switching to a lower operating frequency transducer reduces the Doppler shift frequency, moving it below the limit."
    }
  ];

  const handleAnswerCheck = (index: number) => {
    setSelectedAns(index);
    const correct = index === DIAGNOSTIC_QUESTIONS[activeQuestion].correct;
    setAnsweredCorrectly(correct);
    if (correct && syllabusStatus['artifacts'] !== 'mastered') {
      // Auto upgrade their learning progress slightly on a correct answer!
      handleStatusChange('artifacts', 'studying');
    }
  };

  // Beta access voucher generator code
  const handleVoucherGeneration = async () => {
    setSavingStatus(true);
    const mockRef = 'SB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedVoucher(mockRef);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          voucherCode: mockRef,
          voucherTier: selectedTier,
          joinedBetaAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Failed saving voucher to cloud:', e);
      }
    }
    setSavingStatus(false);
  };

  const copyToClipboard = () => {
    if (generatedVoucher) {
      navigator.clipboard.writeText(generatedVoucher);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 gap-8 overflow-y-auto no-scrollbar scroll-smooth relative"
    >
      {/* Background radial soft lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="border-b border-[#2d3139] pb-6 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-[4px] text-[#00d1ff] font-bold mb-2 flex items-center gap-2">
            <Rocket size={12} className="animate-pulse" /> Commercial Release & Prep Strategy
          </div>
          <div className="text-3xl sm:text-4xl font-serif italic text-white tracking-tight">
            U.U.U. COVERT <span className="text-[#00d1ff]">Milestones</span> & Training Guide
          </div>
          <p className="text-xs text-[#8e9299] mt-2 max-w-2xl leading-relaxed">
            Get ready to dominate your ARDMS SPI registry exam and track compliance with the essential building blocks of a world-class training program.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#16181d] p-1 rounded-xl border border-white/5 gap-1 shrink-0 font-mono text-[9px] font-bold tracking-wider relative z-20">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-2 rounded-lg uppercase transition-all cursor-pointer ${activeTab === 'milestones' ? 'bg-[#00d1ff] text-black font-extrabold shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
          >
            Exam Prep & Registry
          </button>
          <button
            onClick={() => setActiveTab('program_components')}
            className={`px-3 py-2 rounded-lg uppercase transition-all cursor-pointer ${activeTab === 'program_components' ? 'bg-[#00d1ff] text-black font-extrabold shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
          >
            Program Training Components
          </button>
        </div>
      </div>

      {/* Immersive Philosophical Banner */}
      <div className="bg-[#16181d]/85 backdrop-blur-md border border-[#2d3139] rounded-2xl p-4 md:p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="absolute top-0 left-0 w-24 h-24 bg-[#00d1ff]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.4, 1] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-4 h-4 bg-[#00d1ff]/20 rounded-full absolute"
            />
            <motion.div 
              animate={{ scale: [1, 1.25, 1] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-2.5 h-2.5 bg-[#00d1ff] rounded-full absolute"
            />
          </div>
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[3px] text-[#00d1ff] uppercase">SYSTEM PROTOCOL</div>
            <p className="text-white font-serif italic text-xs md:text-[13px] mt-0.5 tracking-wide">
              "STAY BREATHE. YOUR ALLOWED TO MAKE MISTAKES. OUR JOB IS TO PREPARE YOU."
            </p>
          </div>
        </div>
        <div className="flex flex-col md:items-end text-center md:text-right shrink-0 border-t md:border-t-0 md:border-l border-[#2d3139] pt-3 md:pt-0 md:pl-5">
          <span className="text-[8px] font-mono tracking-[4px] text-[#8e9299] uppercase">YOUR RESPONSIBILITY</span>
          <p className="text-[#ffd700] font-mono text-[9px] font-bold tracking-widest uppercase mt-0.5">
            REMEMBER HOW WE FAIL YOU
          </p>
          <p className="text-[11px] text-white/90 font-serif leading-none mt-1">
            so that when it is your turn, <span className="text-[#00d1ff] font-bold">you do better</span>
          </p>
        </div>
      </div>

      {activeTab === 'milestones' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column: Interactive Study Board & Voucher Pitch */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Phase status indicator header card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#16181d] border border-[#2d3139] rounded-2xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider font-bold">Phase 1: Foundation</span>
                <span className="text-sm font-bold text-white font-mono mt-1">Sandbox Live</span>
                <span className="text-[10px] text-[#8e9299] leading-tight mt-1">Interactive waveforms, transducers, hemodynamics simulators.</span>
              </div>
              <div className="p-4 bg-[#16181d] border border-cyan-500/20 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00d1ff] shadow-[0_0_6px_#00d1ff]" />
                <span className="text-[8px] font-mono text-[#00d1ff] uppercase tracking-wider font-bold">Phase 2: Coach AI</span>
                <span className="text-sm font-bold text-white font-mono mt-1">Voice & Transcripts</span>
                <span className="text-[10px] text-[#8e9299] leading-tight mt-1 font-sans">Bourdain mode, audio scripts, Ask AI KB and diagnostic helpers.</span>
              </div>
              <div className="p-4 bg-[#16181d] border border-amber-500/10 rounded-2xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                <span className="text-[8px] font-mono text-amber-500 uppercase tracking-wider font-bold">Phase 3: Production</span>
                <span className="text-sm font-bold text-white/50 font-mono mt-1">Unified Exam Engine</span>
                <span className="text-[10px] text-[#8e9299]/70 leading-tight mt-1">Mock test telemetry, adaptively served registries, premium metrics dashboard.</span>
              </div>
            </div>

            {/* Interactive Syllabus Checklist */}
            <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-4 right-6 flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8e9299]">RANKING:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${badge.color}`}>{badge.title}</span>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/20 flex items-center justify-center">
                  <BookOpen size={16} className="text-[#00d1ff]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Interactive SPI Study Syllabus</h3>
                  <p className="text-[10px] text-[#8e9299]">Click each objective's state below to advance your live exam readiness index rating.</p>
                </div>
              </div>

              {/* Custom Interactive Scale progress bar */}
              <div className="mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold font-mono text-[#e0e0e0] flex items-center gap-1.5">
                    <Award size={14} className="text-[#ffd700]" /> Overall SPI Exam Readiness Index:
                  </span>
                  <span className="text-xl font-mono font-bold text-[#ffd700]">{readinessPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#2d3139] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-rose-500 via-[#00d1ff] to-[#ffd700] rounded-full"
                    animate={{ width: `${readinessPercent}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-[#8e9299] mt-2">
                  <span>0% Initiate</span>
                  <span>50% Registry Baseline (Approx. passing grade index)</span>
                  <span>100% Registry Master</span>
                </div>
              </div>

              {/* Syllabus Rows */}
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {SYLLABUS_MODULES.map((sub) => {
                  const status = syllabusStatus[sub.id] || 'not_started';
                  
                  return (
                    <div 
                      key={sub.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl hover:border-white/10 transition-colors gap-3 group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-[#00d1ff] uppercase bg-[#00d1ff]/5 px-1.5 py-0.5 rounded border border-[#00d1ff]/10">
                            {sub.category}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-500">Weight: {sub.weight}%</span>
                        </div>
                        <span className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors">{sub.name}</span>
                      </div>

                      {/* Interactive Toggles */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto font-mono text-[9px] font-bold">
                        <button
                          onClick={() => handleStatusChange(sub.id, 'not_started')}
                          className={`px-2 py-1 rounded-l border ${status === 'not_started' ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                        >
                          TODO
                        </button>
                        <button
                          onClick={() => handleStatusChange(sub.id, 'studying')}
                          className={`px-2 py-1 border-y border-r ${status === 'studying' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                        >
                          STUDYING
                        </button>
                        <button
                          onClick={() => handleStatusChange(sub.id, 'mastered')}
                          className={`px-2 py-1 rounded-r border-y border-r ${status === 'mastered' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-transparent border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                        >
                          MASTERED
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic Mini-Playground */}
            <div className="bg-gradient-to-br from-[#16181d] to-[#121318] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd700]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center">
                    <Flame size={16} className="text-[#ffd700]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Registry Diagnostic Mini-Test</h3>
                    <p className="text-[10px] text-[#8e9299]">Instantly assess your acoustical reasoning with realistic physical review prompts.</p>
                  </div>
                </div>

                {/* Slide dots switcher */}
                <div className="flex gap-1.5">
                  {DIAGNOSTIC_QUESTIONS.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setActiveQuestion(idx);
                        setSelectedAns(null);
                        setAnsweredCorrectly(null);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${activeQuestion === idx ? 'bg-[#ffd700] w-4' : 'bg-neutral-600'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-black/35 border border-white/5 rounded-xl p-4 md:p-5">
                <div className="text-[9px] font-mono text-[#ffd700] uppercase mb-1">PROMPT: QUESTION {activeQuestion + 1} OF 3</div>
                <blockquote className="text-xs text-white font-serif leading-relaxed mb-4">
                  "{DIAGNOSTIC_QUESTIONS[activeQuestion].q}"
                </blockquote>

                <div className="flex flex-col gap-2 mt-4">
                  {DIAGNOSTIC_QUESTIONS[activeQuestion].opts.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => selectedAns === null && handleAnswerCheck(i)}
                      className={`w-full text-left p-3 rounded-lg text-xs font-sans transition-all border ${
                        selectedAns === i 
                          ? answeredCorrectly 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                          : selectedAns !== null && i === DIAGNOSTIC_QUESTIONS[activeQuestion].correct
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : 'bg-black/20 border-white/5 text-[#8e9299] hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono opacity-60">[{String.fromCharCode(65 + i)}]</span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedAns !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 bg-black/80 rounded-lg border border-dashed border-[#2d3139] leading-relaxed"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-mono uppercase tracking-wider font-bold">
                      {answeredCorrectly ? (
                        <span className="text-emerald-400">✓ Correct Response</span>
                      ) : (
                        <span className="text-[#8e9299]">Incorrect. Review physics concept below:</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8e9299] font-sans">
                      {DIAGNOSTIC_QUESTIONS[activeQuestion].exp}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Commercial Licensure Early Access Reservation */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Subscription early pricing selector card */}
            <div className="bg-[#16181d] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#00d1ff] font-mono text-[9px] font-bold uppercase tracking-widest mb-2">
                  <CreditCard size={12} /> Early-Bird Access Priority
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Commercial Release Registration</h3>
                <p className="text-[10px] text-[#8e9299] mt-1 leading-relaxed">
                  Unlock our unified dynamic mock exam vaults, adaptive learning analysis engines, and early-bird university bundle plans.
                </p>

                {/* Tiers Grid */}
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={() => setSelectedTier('standard')}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 relative ${selectedTier === 'standard' ? 'border-[#00d1ff] bg-[#00d1ff]/5' : 'border-white/5 bg-black/20 opacity-70 hover:opacity-100'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-white">SPI Exam Prep Tier</span>
                      <span className="text-[#00d1ff] font-mono font-bold text-xs">$9.99<span className="text-[8px] font-normal text-[#8e9299]">/mo</span></span>
                    </div>
                    <ul className="text-[9px] text-[#8e9299] list-disc pl-3 flex flex-col gap-0.5 mt-1">
                      <li>3 Realistic SPI Adaptive Mock Tests</li>
                      <li>Waveform parameters calculator utilities</li>
                      <li>Syllabus completion certificate export</li>
                    </ul>
                  </button>

                  <button
                    onClick={() => setSelectedTier('maestro')}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 relative ${selectedTier === 'maestro' ? 'border-[#ffd700] bg-[#ffd700]/5' : 'border-white/5 bg-black/20 opacity-70 hover:opacity-100'}`}
                  >
                    <div className="absolute -top-1.5 -right-1 bg-[#ffd700] text-black text-[7px] font-mono font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      RECOMMENDED
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-[#ffd700] flex items-center gap-1"><Sparkles size={10} /> Ultrasound Maestro Tiers</span>
                      <span className="text-[#ffd700] font-mono font-bold text-xs">$19.99<span className="text-[8px] font-normal text-[#8e9299]">/mo</span></span>
                    </div>
                    <ul className="text-[9px] text-[#2ebdff] list-disc pl-3 flex flex-col gap-0.5 mt-1 font-mono">
                      <li className="text-[#ffd700]">Unlimited AI Adaptive Exam Generations</li>
                      <li>ElevenLabs Voice synthesis credentials</li>
                      <li>TGC Knob Simulator adaptive calibrations</li>
                    </ul>
                  </button>
                </div>
              </div>

              {/* Generated Serial codes preview */}
              <div className="mt-6 border-t border-[#2d3139] pt-5">
                {!generatedVoucher ? (
                  <button
                    onClick={handleVoucherGeneration}
                    disabled={savingStatus}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedTier === 'maestro'
                        ? 'bg-gradient-to-r from-[#ffd700] to-yellow-600 text-black font-extrabold hover:brightness-110 shadow-lg shadow-yellow-500/10'
                        : 'bg-gradient-to-r from-[#00d1ff] to-cyan-600 text-black font-extrabold hover:brightness-110 shadow-lg shadow-cyan-500/10'
                    }`}
                  >
                    {savingStatus ? 'Syncing Cloud...' : 'Reserve Access Code'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-mono text-[#8e9299] uppercase">YOUR SECURE STUDENT ACCESS CODE:</span>
                    <div className="bg-black/60 border border-white/10 p-2.5 rounded-xl flex items-center justify-between font-mono text-sm tracking-widest text-[#ffd700]">
                      <span className="truncate">{generatedVoucher}</span>
                      <button 
                        onClick={copyToClipboard}
                        className="p-1 px-2 border border-white/10 rounded-lg hover:bg-white/5 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[8px] not-italic text-white"
                        title="Copy registration token"
                      >
                        {copied ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        {copied ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    {user ? (
                      <span className="text-[8.5px] font-mono text-emerald-400/80 text-center leading-tight">
                        ✓ Reserved & Synced to database account: {user.email}
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-mono text-rose-400/80 text-center leading-tight">
                        * Note: Code saved locally. Sign In at screen header to persist securely to your cloud profile!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Technical Specs */}
            <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="text-[9px] font-mono text-white/50 uppercase tracking-widest">Acoustic Specs & Guidelines</h4>
              <div className="grid grid-cols-2 gap-3 text-left font-mono">
                <div className="p-2 bg-black/20 rounded border border-white/5">
                  <div className="text-[7.5px] text-[#8e9299] uppercase">Typical C</div>
                  <div className="text-[10px] text-white font-bold">1540 m/s</div>
                </div>
                <div className="p-2 bg-black/20 rounded border border-white/5">
                  <div className="text-[7.5px] text-[#8e9299] uppercase">SPI Pass Rating</div>
                  <div className="text-[10px] text-[#00d1ff] font-bold">80% Target</div>
                </div>
                <div className="p-2 bg-black/20 rounded border border-white/5">
                  <div className="text-[7.5px] text-[#8e9299] uppercase">Thermal Limit</div>
                  <div className="text-[10px] text-white font-bold">TI &lt; 1.0</div>
                </div>
                <div className="p-2 bg-black/20 rounded border border-white/5">
                  <div className="text-[7.5px] text-[#8e9299] uppercase">Safe Mechan.</div>
                  <div className="text-[10px] text-[#ffd700] font-bold">MI &lt; 1.9</div>
                </div>
              </div>
              
              <div className="flex gap-2 p-3 bg-black/40 rounded-xl border border-dashed border-white/5">
                <Info size={14} className="text-[#00d1ff] shrink-0 mt-0.5" />
                <div className="text-[8px] text-[#8e9299] leading-relaxed">
                  The Ultrasound Underground academy is built strictly on the ARDMS SPI Content Outline blueprint representing core elements in general clinical physics registry preparations. 
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 relative z-10 w-full">
          {/* Progress Header Card */}
          <div className="bg-gradient-to-br from-[#16181d] to-[#121318] border border-[#2d3139] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="max-w-xl">
                <div className="text-[10px] uppercase font-mono tracking-[4px] text-[#ffd700] font-bold mb-2 flex items-center gap-1.5">
                  <Award size={12} className="animate-bounce" /> Academic Integration Progress
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase tracking-wide">Ultrasound Program Training Components Guide</h3>
                <p className="text-xs text-[#8e9299] mt-2 leading-relaxed">
                  These 12 core components deliver comprehensive education and training preparing sonography students for clinical success. Mark your completion or review progress on each sub-topic to track your preparation status.
                </p>
                
                {/* Descriptive subtext from user prompt */}
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-[#8e9299] leading-relaxed italic">
                  "By incorporating these key components, our ultrasound physics review program can provide a well-rounded education that prepares you for successful careers in sonography."
                </div>
              </div>

              {/* compliance progress meter */}
              <div className="bg-black/40 p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shrink-0 w-full lg:w-56">
                <span className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider mb-2">Overall Program Compliance</span>
                
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#2d3139" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      stroke="#00d1ff" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 * (1 - programCompliancePercent / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-mono font-bold text-white">{programCompliancePercent}%</span>
                    <span className="text-[7.5px] font-mono text-[#00d1ff] uppercase">Audit Rating</span>
                  </div>
                </div>

                <span className="text-[10px] text-[#8e9299] mt-3 font-mono">{checkedSubComponents} of {totalSubComponents} Passed</span>
              </div>
            </div>
          </div>

          {/* 12 Key Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 w-full">
            {PROGRAM_COMPONENTS_DATA.map((item) => {
              const Icon = IconMap[item.icon] || BookOpen;
              const completedCount = item.subComponents.filter(s => programStatus[s.id]).length;
              const isComponentFullyCompliant = completedCount === item.subComponents.length;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#16181d] border border-[#2d3139] hover:border-white/10 rounded-2xl p-5 shadow-2xl relative flex flex-col justify-between transition-all group overflow-hidden"
                >
                  {/* Glowing background accent on hover */}
                  <div 
                    className="absolute -top-12 -left-12 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity"
                    style={{ backgroundColor: item.glowColor }}
                  />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div>
                      {/* Badge / Number and Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[9px] font-mono font-bold ${item.colorClass}`}>
                          <Icon size={12} className="stroke-[2.5]" />
                          <span>{item.num.toString().padStart(2, '0')}. {item.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[#8e9299] font-bold">
                          {completedCount} / {item.subComponents.length} Verified
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1.5 font-serif tracking-tight flex items-center gap-1.5 justify-between">
                        {item.title} Framework
                        {isComponentFullyCompliant && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                      </h4>
                      <p className="text-[11px] text-[#8e9299] leading-relaxed mb-4">{item.desc}</p>
                    </div>
                    
                    {/* Sub-check list */}
                    <div className="flex flex-col gap-2.5 bg-black/30 p-3 rounded-xl border border-white/5">
                      {item.subComponents.map((sub) => {
                        const isChecked = !!programStatus[sub.id];
                        return (
                          <div 
                            key={sub.id} 
                            className="flex items-start gap-2.5 cursor-pointer select-none group/item"
                            onClick={() => handleProgramCheckToggle(sub.id)}
                          >
                            <div className={`w-3.5 h-3.5 shrink-0 rounded border mt-0.5 flex items-center justify-center transition-all ${
                              isChecked 
                                ? 'bg-[#00d1ff] border-[#00d1ff] text-black shadow-[0_0_10px_rgba(0,209,255,0.2)]' 
                                : 'border-[#2d3139] group-hover/item:border-white/20 bg-black/25'
                            }`}>
                              {isChecked && <CheckCircle size={8} className="stroke-[3]" />}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold ${isChecked ? 'text-[#00d1ff]' : 'text-[#e0e0e0] group-hover/item:text-white transition-colors'}`}>
                                {sub.name}
                              </span>
                              <span className="text-[9px] text-[#8e9299] leading-relaxed font-sans mt-0.5">{sub.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
