import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves,
  Zap,
  Atom,
  Menu,
  X,
  LogOut,
  LogIn,
  User as UserIcon,
  BookOpen,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Sliders,
  Award,
  Book,
  GraduationCap,
  Sparkles,
  Layers,
  Activity,
  ShieldAlert,
  Shield,
  Compass,
  Play,
  Sun,
  Moon,
  ArrowRight,
  Scan,
  Cpu,
  Target,
  Signal,
  Split,
  TrendingDown,
  LineChart,
  Trophy,
  FileText,
  MessageSquare,
  Calculator,
  Search
} from 'lucide-react';

import TransducerModule from './components/modules/TransducerModule';
import DopplerModule from './components/modules/DopplerModule';
import DopplerDuelModule from './components/modules/DopplerDuelModule';
import ImagingModule from './components/modules/ImagingModule';
import ResolutionsModule from './components/modules/ResolutionsModule';
import ArtifactsModule from './components/modules/ArtifactsModule';
import PulsedWaveModule from './components/modules/PulsedWaveModule';
import TransducerTypesModule from './components/modules/TransducerTypesModule';
import BeamFormationModule from './components/modules/BeamFormationModule';
import InteractionsModule from './components/modules/InteractionsModule';
import AttenuationModule from './components/modules/AttenuationModule';
import HemodynamicsModule from './components/modules/HemodynamicsModule';
import SafetyModule from './components/modules/SafetyModule';
import PracticeModule from './components/modules/PracticeModule';
import MockExamModule from './components/modules/MockExamModule';
import VideoLibraryModule from './components/modules/VideoLibraryModule';
import AskKBModule from './components/modules/AskKBModule';
import MasterTextbook from './components/modules/MasterTextbook';
import ProfileModule from './components/modules/ProfileModule';
import RoadmapModule from './components/modules/RoadmapModule';
import QuestStationModule from './components/modules/QuestStationModule';
import PhysicsCalculatorModule from './components/modules/PhysicsCalculatorModule';
import AIWebSummarizerModule from './components/modules/AIWebSummarizerModule';
import DashboardModule from './components/modules/DashboardModule';

import SidebarControls from './components/shared/SidebarControls';
import PhysicsReadout from './components/shared/PhysicsReadout';
import NarratorPanel from './components/shared/NarratorPanel';
import OnboardingTour from './components/shared/OnboardingTour';
import CinematicIntro from './components/shared/CinematicIntro';
import CinematicModuleIntro from './components/shared/CinematicModuleIntro';
import PhysicsQuickReference from './components/shared/PhysicsQuickReference';
import AdminModule from './components/modules/AdminModule';
import { useNarrator } from './hooks/useNarrator';
import { LECTURES } from './constants/lectures';
import { Volume2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';

// --- Constants ---
const Z_PZT = 30; // MRayls
const MEDIA = [
  { id: 'soft-tissue', name: 'Soft Tissue', z: 1.63, c: 1540, color: '#00d1ff' },
  { id: 'fat', name: 'Fat', z: 1.38, c: 1450, color: '#ffb800' },
  { id: 'bone', name: 'Bone', z: 7.8, c: 4080, color: '#e0e0e0' },
  { id: 'air', name: 'Air', z: 0.0004, c: 330, color: '#8e9299' },
];

const PROBE_TYPES = [
  { id: 'linear', name: 'Linear', shape: 'Rectangular', freqRange: '7-15 MHz', use: 'Vascular/Parts' },
  { id: 'curvilinear', name: 'Curvilinear', shape: 'Curved', freqRange: '2-5 MHz', use: 'Abdominal/OB' },
  { id: 'phased', name: 'Phased Array', shape: 'Sector', freqRange: '1-4 MHz', use: 'Cardiac/Echo' },
];

const CATEGORIES_MAP = [
  {
    title: "Tactical HQ Command",
    colorClass: "from-yellow-500/15 to-yellow-500/2 text-yellow-400 border-yellow-500/20",
    glowColor: "#fbbf24",
    badge: "Tactical Intel",
    items: [
      { id: 'dashboard' as const, label: 'Underground Command Deck', desc: 'Secure tactical deck, user profiles, and active review curriculum', icon: LayoutGrid },
    ]
  },
  {
    title: "Transducer & Wave Basics",
    colorClass: "from-[#00d1ff]/15 to-[#00d1ff]/2 text-[#00d1ff] border-[#00d1ff]/20",
    glowColor: "#00d1ff",
    badge: "Sound Engine",
    items: [
      { id: 'probe' as const, label: 'Internal Probe', desc: 'Piezoelectric damping, crystal parameters, matching layers', icon: Cpu },
      { id: 'types' as const, label: 'Clinical Arrays', desc: 'Linear, curvilinear, and phased-array transducer geometries', icon: Scan },
      { id: 'beam' as const, label: 'Beam Formation', desc: 'Huygens principle, wave interference, and electrical focusing', icon: Target },
      { id: 'pulse' as const, label: 'Pulsed Wave', desc: 'Duty factor, PRP, PRF, spatial pulse length equations', icon: Signal },
    ]
  },
  {
    title: "Tissue Propagation Loss",
    colorClass: "from-amber-500/15 to-amber-500/2 text-amber-400 border-amber-500/20",
    glowColor: "#f59e0b",
    badge: "Boundaries",
    items: [
      { id: 'interactions' as const, label: 'Refraction & Reflection', desc: 'Impedance mismatch boundaries and reflection math', icon: Split },
      { id: 'attenuation' as const, label: 'Decibel Loss Sim', desc: 'Depth-dependent tissue attenuation physics coefficients', icon: TrendingDown },
      { id: 'physics' as const, label: 'Image Resolutions', desc: 'Axial, lateral, and elevational scanning parameters', icon: Sliders },
    ]
  },
  {
    title: "Hemodynamics & Doppler",
    colorClass: "from-rose-500/15 to-rose-500/2 text-rose-400 border-rose-500/20",
    glowColor: "#f43f5e",
    badge: "Fluid Kinetics",
    items: [
      { id: 'hemodynamics' as const, label: 'Hemodynamics Core', desc: 'Laminar/Turbulent fluid vectors and Reynolds number model', icon: Waves },
      { id: 'doppler' as const, label: 'Spectral Doppler', desc: 'Acoustic frequency shifting and velocity pulse graphics', icon: LineChart },
      { id: 'duel' as const, label: 'Doppler Angle Duel', desc: 'Gamified peak systolic velocity angle optimization arena', icon: Compass },
    ]
  },
  {
    title: "Clinical Console & Safety",
    colorClass: "from-emerald-500/15 to-emerald-500/2 text-emerald-400 border-emerald-500/20",
    glowColor: "#10b981",
    badge: "B-Mode Console",
    items: [
      { id: 'imaging' as const, label: 'Multi-Zone TGC', desc: 'Overall Receiver gain amplification and depth sliders', icon: Sliders },
      { id: 'artifacts' as const, label: 'Acoustic Artifacts', desc: 'Shadowing, reverberations, mirrors, index aliasing limits', icon: ShieldAlert },
      { id: 'safety' as const, label: 'Scanner Safety', desc: 'Bioeffects, Mechanical, and Thermal Safety indices (ALARA)', icon: Shield },
    ]
  },
  {
    title: "Ultrasound Academy hub",
    colorClass: "from-purple-500/15 to-purple-500/2 text-purple-400 border-purple-500/20",
    glowColor: "#a855f7",
    badge: "Registry Suite",
    items: [
      { id: 'academy' as const, label: 'Interactive Textbook', desc: 'Complete board-ready ARDMS/SPI physics reference text', icon: BookOpen },
      { id: 'solver' as const, label: 'Formula Solver Studio', desc: 'Step-by-step math derivation, sliders, and physics challenges', icon: Calculator },
      { id: 'quest_station' as const, label: 'Gamified Quests', desc: 'Comprehensive medical challenges and scoring puzzles', icon: Trophy },
      { id: 'practice' as const, label: 'Syllabus Exam', desc: 'Real-time full multiple choice simulator & grading system', icon: FileText },
      { id: 'mock_exam' as const, label: '110Q Mock Exam', desc: '2-hour timed full mock exam with detailed review', icon: GraduationCap },
      { id: 'chat' as const, label: 'Ask AI Board Assistant', desc: 'Conversational cognitive clinical instructor', icon: MessageSquare },
      { id: 'summarizer' as const, label: 'AI Web Summarizer', desc: 'Synthesize summaries and tags from webpages and registry study docs', icon: Search },
      { id: 'library' as const, label: 'Voice Lectures', desc: 'Audio lecture tracks with dynamic clinical media clips', icon: Volume2 },
      { id: 'profile' as const, label: 'Operator Profile', desc: 'Study levels, scoring records, and credential checklist', icon: Award },
      { id: 'roadmap' as const, label: 'SPI Prep Checklist', desc: 'Track eligibility, checklist requirements, and pre-exams', icon: Compass },
    ]
  }
];

const LAYERS = [
  { 
    id: 'lens', 
    name: 'Acoustic Lens', 
    description: 'Mechanical means of focusing to reduce divergence. Curved element or lens converges the sound beam at a fixed focal point depth (Phase 13).',
    physics: 'Focusing / Refraction',
    clinical: 'Critical for regulating slice thickness/elevational resolution.'
  },
  { 
    id: 'matching', 
    name: 'Matching Layer', 
    description: 'A layer at the transducer face that matches impedances. Typically 1/4 wavelength thick. Its Z value is halfway between the crystal and soft tissue (Page 13).',
    physics: 'Impedance Matching',
    clinical: 'Aids transmission of sound into the body by reducing reflection at the skin-transducer interface.'
  },
  { 
    id: 'pzt', 
    name: 'PZT Crystal', 
    description: 'Piezoelectric element (Lead Zirconate Titanate). Thickness = 1/2 wavelength. Operating frequency is inversely related to crystal thickness (Page 13).',
    physics: 'Piezoelectric Effect',
    clinical: 'Thinner the crystal, higher the frequency. Converts electrical pulse to mechanical sound and vice-versa.'
  },
  { 
    id: 'backing', 
    name: 'Backing Material', 
    description: 'Damping material at the back of the crystal. Stops the ringing to shorten the Spatial Pulse Length (SPL). Prefers Lo Q (Page 14).',
    physics: 'Damping / Shortens SPL',
    clinical: 'Required for high axial resolution. Decreases sensitivity and quality factor but essential for pulsed imaging.'
  }
];

type ViewMode = 'dashboard' | 'probe' | 'types' | 'pulse' | 'beam' | 'physics' | 'doppler' | 'duel' | 'interactions' | 'attenuation' | 'hemodynamics' | 'imaging' | 'artifacts' | 'safety' | 'practice' | 'library' | 'chat' | 'academy' | 'profile' | 'roadmap' | 'quest_station' | 'solver' | 'summarizer' | 'mock_exam';

import GlobalStudyRadio from './components/shared/GlobalStudyRadio';
import ThemeLiveBackground from './components/shared/ThemeLiveBackground';

export default function App() {
  const [isAdminParam, setIsAdminParam] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('admin') === 'true';
    }
    return false;
  });

  const handleExitAdmin = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.toString());
      setIsAdminParam(false);
    }
  };

  const [thickness, setThickness] = useState(0.4);
  const [theme, setTheme] = useState<'dark' | 'daylight'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('spi_theme') as 'dark' | 'daylight') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'daylight') {
      el.classList.add('daylight');
      el.setAttribute('data-theme', 'daylight');
    } else {
      el.classList.remove('daylight');
      el.removeAttribute('data-theme');
    }
    localStorage.setItem('spi_theme', theme);
  }, [theme]);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('sonicbuild_intro_seen');
    }
    return true;
  });

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sonicbuild_intro_seen', 'true');
    }
    setShowIntro(false);
  };

  const [cinematicMode, setCinematicMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spi_cinematic_mode');
      return stored === 'false' ? false : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('spi_cinematic_mode', cinematicMode.toString());
  }, [cinematicMode]);

  const [transitionModule, setTransitionModule] = useState<{
    label: string;
    category?: string;
    badge?: string;
  } | null>(null);

  const isFirstLoadRef = React.useRef(true);

  const getModuleMetadata = (mode: ViewMode) => {
    const item = CATEGORIES_MAP.flatMap(cat => cat.items.map(it => ({ ...it, cat })))
      .find(it => it.id === mode);
    
    if (item) {
      return {
        label: item.label,
        category: item.cat.title,
        badge: item.cat.badge
      };
    }
    
    const fallbackMetadata: Record<string, { label: string; category?: string; badge?: string }> = {
      'academy': { label: 'Interactive Textbook', category: 'COLLEGE ACADEMY REFERENCE', badge: 'TEXTBOOK' },
      'solver': { label: 'Formula Solver Studio', category: 'REGISTRY EQUATIVE LAB', badge: 'CALCS' },
      'quest_station': { label: 'Gamified Quests', category: 'REGISTRY LEVEL CHALLENGES', badge: 'GAMIFIED' },
      'practice': { label: 'Syllabus Quiz Practice', category: 'SPI PREPARATION BOARD', badge: 'PRACTICE' },
      'mock_exam': { label: '110Q Mock Exam simulator', category: 'BOARD PREP TIMED SUITE', badge: 'MOCK EXAM' },
      'chat': { label: 'Ask AI Assistant', category: 'CLINICAL COGNITIVE CHAT', badge: 'AI ASSISTANT' },
      'summarizer': { label: 'AI Web Summarizer', category: 'ONLINE REPOSITORY COMPRESSION', badge: 'SUMMARIZER' },
      'library': { label: 'Audio Vocal library', category: 'BOARD TRACK AUDIO LECTURES', badge: 'LIBRARY' },
      'profile': { label: 'Ultrasonic Operator Profile', category: 'CREDENTIAL PROGRESS TRACKER', badge: 'OPERATOR' },
      'roadmap': { label: 'Credential Roadmap & Checklist', category: 'ARDMS SPI CERTIFICATION', badge: 'ROADMAP' }
    };
    
    return fallbackMetadata[mode] || { label: 'Physics Console', category: 'ULTRASONOGRAPHIC CALCULATOR', badge: 'CONSOLE' };
  };

  const [damping, setDamping] = useState(0.7);
  const [matchingImpedance] = useState(15.0);
  const [activeLayer, setActiveLayer] = useState<string | null>('pzt');
  const [activeProbe, setActiveProbe] = useState(PROBE_TYPES[0]);
  const [activeMedium, setActiveMedium] = useState(MEDIA[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  
  const [branding, setBranding] = useState<{
    teamBadge?: string;
    teamPoster?: string;
  }>({});

  useEffect(() => {
    // Realtime subscription to the custom branding configurator documents
    const unsubscribe = onSnapshot(doc(db, 'branding', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBranding({
          teamBadge: data.teamBadge || undefined,
          teamPoster: data.teamPoster || undefined,
        });
      }
    }, (error) => {
      console.warn("Firestore branding offline or inactive:", error);
    });
    return unsubscribe;
  }, []);

  const bottomBarRef = React.useRef<HTMLDivElement>(null);
  const mainContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll pages to top when swapping tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  // Cinematic transitions hook
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    if (cinematicMode) {
      const meta = getModuleMetadata(viewMode);
      setTransitionModule(meta);
    }
  }, [viewMode, cinematicMode]);
  const [dopplerAngle, setDopplerAngle] = useState(60);
  const [bloodVelocity, setBloodVelocity] = useState(1.0);
  const [flowType, setFlowType] = useState<'laminar' | 'turbulent'>('laminar');
  const [tgc, setTgc] = useState([20, 40, 60, 80]);
  const [navOpen, setNavOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [physicsQuickRefOpen, setPhysicsQuickRefOpen] = useState(false);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const { speak, stop, isSpeaking, progress, preCache } = useNarrator();
  const { user, signIn, logout } = useAuth();

  const [isWorkspaceFullScreen, setIsWorkspaceFullScreen] = useState(false);
  const [fullScreenItem, setFullScreenItem] = useState<{
    title: string;
    subtitle?: string;
    category?: string;
    badge?: string;
    content: string | React.ReactNode;
    alert?: string;
    formula?: string;
    concept?: string;
    extra?: React.ReactNode;
  } | null>(null);

  useEffect(() => {
    (window as any).showInfoFullScreen = (item: any) => {
      setFullScreenItem(item);
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsWorkspaceFullScreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      (window as any).showInfoFullScreen = undefined;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sync user profile to Firestore
  useEffect(() => {
    if (user) {
      const syncProfile = async () => {
        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous Engineer',
            email: user.email,
            photoURL: user.photoURL,
            lastActive: serverTimestamp(),
            createdAt: serverTimestamp() // Only works for new docs if merge: true is handled differently, but here we can just use setDoc with merge
          }, { merge: true });
        } catch (e) {
          console.error("Profile sync error", e);
          handleFirestoreError(e, OperationType.WRITE, path);
        }
      };
      syncProfile();
    }
  }, [user]);

  // Pre-cache all lecture audio on launch
  useEffect(() => {
    const scripts = LECTURES.map(l => l.script);
    preCache(scripts);
  }, [preCache]);

  // Auto-scroll mobile active tab to center of scroll bar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bottomBarRef.current) {
        const activeEl = bottomBarRef.current.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Map viewMode to lectureId
  const viewModeToLecture: Record<string, string> = {
    'probe': 'internal-transducer',
    'types': 'beam-formation',
    'beam': 'beam-formation',
    'pulse': 'pulse-wave', 
    'physics': 'resolutions',
    'doppler': 'doppler',
    'attenuation': 'attenuation',
    'hemodynamics': 'hemodynamics',
    'artifacts': 'artifacts',
    'safety': 'safety',
    'interactions': 'wave-interactions',
    'imaging': 'imaging-knobs'
  };

  const currentLectureId = viewModeToLecture[viewMode];

  // Logic
  const frequency = useMemo(() => 2 / thickness, [thickness]);
  const wavelength = useMemo(() => activeMedium.c / (frequency * 1000), [frequency, activeMedium]);
  
  const dopplerShift = useMemo(() => {
    const angleRad = (dopplerAngle * Math.PI) / 180;
    return (2 * (frequency * 1e6) * bloodVelocity * Math.cos(angleRad)) / (activeMedium.c * 1000);
  }, [frequency, bloodVelocity, dopplerAngle, activeMedium]);

  const reflectionCoeff = useMemo(() => {
    return Math.pow((activeMedium.z - Z_PZT) / (activeMedium.z + Z_PZT), 2);
  }, [activeMedium]);

  const spl = useMemo(() => (3 * (1.1 - damping)) * wavelength, [damping, wavelength]);
  const axialRes = useMemo(() => spl / 2, [spl]);
  const attenuation = useMemo(() => 0.5 * frequency, [frequency]); 

  const waveformData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 10;
      const amplitude = Math.exp(-(damping * 3) * (t / 5)) * Math.sin(2 * Math.PI * (frequency / 5) * t);
      data.push({ t, amplitude });
    }
    return data;
  }, [frequency, damping]);

  const dopplerSpectrum = useMemo(() => {
    const data = [];
    const isTurbulent = flowType === 'turbulent';
    // Increase spread significantly for turbulent flow to show broadening
    const spread = isTurbulent ? 3.5 : 0.6;
    const noiseLevel = isTurbulent ? 0.3 : 0.05;
    
    for (let i = 0; i < 40; i++) {
        const v = i / 10;
        // Primary velocity peak
        let intensity = Math.exp(-Math.pow(v - bloodVelocity, 2) / (spread * 0.15));
        
        // In turbulent flow, we add random broadening and fill the "window"
        if (isTurbulent) {
          // Fill lower velocities (broadening)
          intensity += Math.exp(-Math.pow(v - (bloodVelocity * 0.6), 2) / 0.8) * 0.4;
          // Add random jitter to simulate complex flow
          intensity *= (0.8 + Math.random() * 0.4);
          // Ensure a minimum floor for the "spectral window"
          intensity = Math.max(intensity, noiseLevel + Math.random() * 0.05);
        } else {
          // Clean laminar flow - ensure low floor to show "spectral window"
          intensity = Math.pow(intensity, 2); // Sharpen the peak
          intensity = intensity < 0.01 ? 0 : intensity;
        }

        data.push({ v, intensity: Math.min(intensity, 1.2) });
    }
    return data;
  }, [bloodVelocity, flowType]);

  const tabs: { id: ViewMode; label: string }[] = [
    { id: 'dashboard', label: 'Command HQ' },
    { id: 'probe', label: 'Internal' },
    { id: 'types', label: 'Arrays' },
    { id: 'beam', label: 'Beam' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'physics', label: 'Res' },
    { id: 'interactions', label: 'Wave' },
    { id: 'attenuation', label: 'dB Loss' },
    { id: 'hemodynamics', label: 'Flow' },
    { id: 'doppler', label: 'Doppler' },
    { id: 'imaging', label: 'Knobs' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'safety', label: 'Safety' },
    { id: 'academy', label: 'Academy' },
    { id: 'practice', label: 'Practice' },
    { id: 'mock_exam', label: 'Mock Exam' },
    { id: 'chat', label: 'Ask AI' },
    { id: 'summarizer', label: 'Summarizer' },
    { id: 'library', label: 'Library' },
    { id: 'profile', label: 'Operator' },
    { id: 'roadmap', label: 'Roadmap & SPI' },
    { id: 'quest_station', label: 'Gamified Quests' },
    { id: 'solver', label: 'Solver' }
  ];

  if (isAdminParam) {
    return <AdminModule onClose={handleExitAdmin} />;
  }

  return (
    <>
      <AnimatePresence>
        {showIntro && <CinematicIntro key="cinematic-intro" onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <div className="flex flex-col h-[100dvh] w-full bg-[#0c0d10] text-[#e0e0e0] font-sans selection:bg-[#00d1ff]/30 overflow-hidden hud-dots">
      <OnboardingTour viewMode={viewMode} setViewMode={setViewMode} />
      <header className="relative h-14 lg:h-16 border-b border-[#2d3139] flex items-center justify-between px-4 sm:px-8 bg-[#16181d]/95 backdrop-blur-xl z-50 shrink-0 shadow-lg">
        <div className="flex items-center justify-between w-full lg:w-auto gap-4 lg:gap-6">
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button 
              onClick={() => setNavOpen(!navOpen)}
              className={`p-2 rounded-full transition-all duration-300 select-none cursor-pointer ${navOpen ? 'bg-[#00d1ff]/15 text-[#00d1ff] shadow-[0_0_15px_rgba(0,209,255,0.25)]' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
            >
              {navOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none" onClick={() => setViewMode('dashboard')}>
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.25)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.45)] group-hover:scale-105 active:scale-95 transition-all duration-300">
                <span className="absolute inset-0 rounded-lg bg-yellow-400/10 animate-ping opacity-20 group-hover:opacity-100 transition-opacity" />
                <Waves size={16} className="text-black sm:w-[18px] sm:h-[18px] filter drop-shadow animate-pulse" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <div className="brand text-[13px] sm:text-[15px] tracking-[1.5px] sm:tracking-[2px] uppercase text-white font-extrabold flex items-center gap-1">
                  <span>ULTRASOUND</span>
                </div>
                <div className="text-[8px] sm:text-[9px] font-mono text-yellow-500 font-extrabold tracking-[2px] uppercase mt-0.5 sm:mt-1">
                  UNDERGROUND
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {currentLectureId && (
              <button 
                onClick={() => {
                  const lecture = LECTURES.find(l => l.id === currentLectureId);
                  if (lecture) {
                    setActiveLectureId(currentLectureId);
                    speak(lecture.script);
                  }
                }}
                className={`flex items-center justify-center p-1.5 border rounded-lg transition-all group ${isSpeaking && activeLectureId === currentLectureId ? 'bg-white/10 border-[#00d1ff]/50 text-[#00d1ff]' : 'bg-[#ffd700]/10 border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700] hover:text-black'}`}
                title={isSpeaking && activeLectureId === currentLectureId ? 'Lecture Playing' : 'Listen to Lecture'}
              >
                <Volume2 size={14} className={isSpeaking && activeLectureId === currentLectureId ? 'animate-pulse' : 'group-hover:animate-bounce'} />
              </button>
             )}
            {/* Mobile Theme Toggle */}
            <button
               onClick={() => setTheme(prev => prev === 'dark' ? 'daylight' : 'dark')}
               className="p-1.5 rounded-lg border border-[#2d3139] bg-white/5 text-[#8e9299] hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
               title={theme === 'dark' ? 'Switch to Daylight Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={14} className="text-amber-400 animate-spin-slow" /> : <Moon size={14} className="text-violet-400" />}
            </button>
            {user ? (
              <img src={user.photoURL || undefined} alt="User" className="w-7 h-7 rounded-full border border-[#00d1ff]/30 cursor-pointer" onClick={() => setViewMode('profile')} />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#00d1ff]/10 flex items-center justify-center border border-[#00d1ff]/30 text-[#00d1ff] cursor-pointer" onClick={signIn}>
                <UserIcon size={12} />
              </div>
            )}
          </div>
        </div>
        
        <div className="hidden lg:flex relative items-center justify-center flex-1">
          <button 
            onClick={() => {
              setNavOpen(!navOpen);
            }}
            className="flex items-center gap-4 px-5 py-2.5 bg-gradient-to-r from-[#12141c] to-[#1a1c24] border border-[#2d3139] hover:border-[#00d1ff]/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5),_0_4px_12px_rgba(0,0,0,0.3)] hover:bg-[#00d1ff]/5 rounded-xl transition-all duration-300 group overflow-hidden relative select-none cursor-pointer"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00d1ff] to-cyan-500 group-hover:w-1.5 transition-all duration-300" />
            <div className="p-1 rounded-lg bg-[#00d1ff]/10 text-[#00d1ff] group-hover:bg-[#00d1ff] group-hover:text-black transition-all duration-300">
              <LayoutGrid size={16} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[8px] text-[#00d1ff] font-mono font-black tracking-widest uppercase mb-0.5">Directory Hub</span>
              <span className="text-xs text-white font-black tracking-wider transition-all uppercase">{tabs.find(t => t.id === viewMode)?.label || 'Select Module'}</span>
            </div>
            <div className="ml-4 pl-4 border-l border-[#2d3139] flex items-center justify-center">
              <span className="text-[9px] text-[#8e9299] font-mono font-bold uppercase tracking-widest group-hover:text-white transition-colors">Browse Modules</span>
            </div>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-6">
           <a
             href="https://buy.stripe.com/00w6oGanpcH8boq5tRafS0e"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-2 px-3.5 py-2 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent hover:border-amber-400 text-amber-400 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.05)] cursor-pointer select-none group shrink-0"
           >
             <Sparkles size={14} className="text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
             <div className="flex flex-col items-start leading-none gap-0.5">
               <span className="text-[8px] text-amber-500/80 font-mono font-black tracking-widest uppercase">EARLY ACCESS DEAL</span>
               <span className="text-[10px] text-white font-extrabold tracking-wider">LIFETIME ACCESS — $350</span>
             </div>
           </a>

           {currentLectureId && (
             <button 
               onClick={() => {
                 const lecture = LECTURES.find(l => l.id === currentLectureId);
                 if (lecture) {
                   setActiveLectureId(currentLectureId);
                   speak(lecture.script);
                 }
               }}
               className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-all group ${isSpeaking && activeLectureId === currentLectureId ? 'bg-white/10 border-[#00d1ff]/50 text-[#00d1ff]' : 'bg-[#ffd700]/10 border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700] hover:text-black'}`}
               title={isSpeaking && activeLectureId === currentLectureId ? 'Lecture Playing' : 'Listen to Lecture'}
             >
               <Volume2 size={16} className={isSpeaking && activeLectureId === currentLectureId ? 'animate-pulse' : 'group-hover:animate-bounce'} />
               <span className="text-[10px] font-bold uppercase tracking-widest ml-2">{isSpeaking && activeLectureId === currentLectureId ? 'Lecture Playing' : 'Listen to Lecture'}</span>
             </button>
           )}
           <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <div className="text-[8px] font-mono text-[#00d1ff] leading-none mb-1 tracking-widest">SYSTEM_STATUS</div>
                <div className="text-[10px] items-center gap-2 font-mono text-[#8e9299] flex uppercase">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse" /> SIM_CORE_01_ONLINE
                </div>
              </div>

              {/* Replay Cinematic Intro */}
              <button
                onClick={() => setShowIntro(true)}
                className="px-3 py-1.5 rounded-xl border border-[#2d3139] bg-white/5 text-[#8e9299] hover:text-[#00d1ff] transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 hover:border-[#00d1ff]/40 hover:bg-[#00d1ff]/5"
                title="Replay Entrance Cinematic Intro"
              >
                <Play size={11} className="text-[#00d1ff]" />
                <span className="text-[8px] font-bold tracking-widest uppercase font-mono">REPLAY INTRO</span>
              </button>

              {/* Cinematic transitions Toggle */}
              <button
                onClick={() => setCinematicMode(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                  cinematicMode 
                    ? 'border-[#00d1ff]/30 bg-[#00d1ff]/5 text-[#00d1ff] hover:bg-[#00d1ff]/10 hover:border-[#00d1ff]/50' 
                    : 'border-[#2d3139] bg-white/5 text-[#8e9299] hover:text-white hover:bg-white/10'
                }`}
                title={cinematicMode ? 'Disable Cinematic Navigation Intros' : 'Enable Cinematic Navigation Intros'}
              >
                <Scan size={13} className={cinematicMode ? 'animate-pulse' : ''} />
                <span className="text-[8px] font-bold tracking-widest uppercase font-mono">
                  {cinematicMode ? 'CINEMATIC ON' : 'CINEMATIC OFF'}
                </span>
              </button>

              {/* Desktop Theme Toggle */}
              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'daylight' : 'dark')}
                className="px-3 py-1.5 rounded-xl border border-[#2d3139] bg-white/5 text-[#8e9299] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                title={theme === 'dark' ? 'Switch to Daylight Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={13} className="text-amber-400 animate-spin-slow" />
                    <span className="text-[8px] font-bold tracking-widest uppercase text-amber-500/90 font-mono">Daylight</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} className="text-violet-400" />
                    <span className="text-[8px] font-bold tracking-widest uppercase text-violet-400 font-mono">Cosmic</span>
                  </>
                )}
              </button>

              <div className="w-[1px] h-8 bg-[#2d3139]" />
              
              <button 
                onClick={() => setIsAdminParam(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-black transition-all text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.15)] shrink-0"
                title="Open Admin System Settings"
              >
                <Shield size={12} className="animate-pulse" />
                ADMIN PANEL
              </button>

              <div className="w-[1px] h-8 bg-[#2d3139]" />

              {user ? (
               <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <div className="text-[8px] font-mono text-[#8e9299] leading-none mb-1 uppercase">Operator_Verified</div>
                    <div className="text-[10px] font-mono text-white truncate max-w-[120px]">{user.displayName || user.email?.split('@')[0]}</div>
                 </div>
                 <div className="relative group cursor-pointer" onClick={() => setViewMode('profile')}>
                   {user.photoURL ? (
                     <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-[#00d1ff]/30 group-hover:border-[#00d1ff] transition-all" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-[#00d1ff]/10 flex items-center justify-center border border-[#00d1ff]/30">
                       <UserIcon size={14} className="text-[#00d1ff]" />
                     </div>
                   )}
                   <div className="absolute -bottom-1 -right-1 bg-[#00d1ff] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <UserIcon size={10} className="text-black" />
                   </div>
                 </div>
               </div>
             ) : (
               <button 
                 onClick={signIn}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff] hover:bg-[#00d1ff] hover:text-black transition-all group"
               >
                 <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Secure Login</span>
               </button>
             )}
           </div>
        </div>
      </header>

      {/* Mobile Compact Telemetry HUD Ribbon */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#0b0c0f] border-b border-[#2d3139]/80 text-[#8e9299] font-mono text-[9px] select-none shrink-0 overflow-x-auto no-scrollbar gap-4 shadow-inner"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#00d1ff] font-extrabold tracking-wider">f₀:</span>
          <motion.span 
            key={frequency}
            initial={{ scale: 1.15, color: '#00d1ff', opacity: 0.8 }}
            animate={{ scale: 1, color: '#ffffff', opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-white font-bold inline-block"
          >
            {frequency.toFixed(2)}<span className="text-[7.5px] text-slate-500 font-normal ml-0.5">MHz</span>
          </motion.span>
        </div>
        <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-amber-400 font-extrabold tracking-wider">λ:</span>
          <motion.span 
            key={wavelength}
            initial={{ scale: 1.15, color: '#fbbf24', opacity: 0.8 }}
            animate={{ scale: 1, color: '#ffffff', opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-white font-bold inline-block"
          >
            {wavelength.toFixed(3)}<span className="text-[7.5px] text-slate-500 font-normal ml-0.5">mm</span>
          </motion.span>
        </div>
        <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-rose-400 font-extrabold tracking-wider">AR:</span>
          <motion.span 
            key={axialRes}
            initial={{ scale: 1.15, color: '#fb7185', opacity: 0.8 }}
            animate={{ scale: 1, color: '#34d399', opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-white font-bold inline-block text-emerald-400"
          >
            {axialRes.toFixed(2)}<span className="text-[7.5px] text-slate-500 font-normal ml-0.5">mm</span>
          </motion.span>
        </div>
        <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-emerald-400 font-extrabold tracking-wider">R:</span>
          <motion.span 
            key={reflectionCoeff}
            initial={{ scale: 1.15, color: '#34d399', opacity: 0.8 }}
            animate={{ scale: 1, color: reflectionCoeff > 0.8 ? '#f87171' : '#ffffff', opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`font-bold inline-block ${reflectionCoeff > 0.8 ? "animate-pulse" : ""}`}
          >
            {((reflectionCoeff) * 100).toFixed(1)}%
          </motion.span>
        </div>
        <div className="w-[1px] h-3.5 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-purple-400 font-extrabold tracking-wider">SYS_MED:</span>
          <motion.span 
            key={activeMedium.name}
            initial={{ scale: 1.05, color: '#c084fc', opacity: 0.8 }}
            animate={{ scale: 1, color: '#ffffff', opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-white font-extrabold uppercase tracking-tight inline-block"
          >
            {activeMedium.name} <span className="text-[7px] text-slate-500 font-normal font-mono ml-0.5">({activeMedium.c * 1000}m/s)</span>
          </motion.span>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <AnimatePresence>
          {navOpen && (
            <motion.div
              key="nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setNavOpen(false)}
            />
          )}
          {navOpen && (
            <motion.aside 
              key="nav-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute lg:relative inset-y-0 left-0 border-r border-[#2d3139] bg-[#0c0d10] flex flex-col overflow-hidden shrink-0 z-40 w-[85vw] max-w-[320px] sm:w-[320px] sm:max-w-none shadow-[20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none"
            >
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-10">
                  <div className="flex justify-between items-center lg:hidden mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#8e9299] uppercase">Navigation</span>
                    <button onClick={() => setNavOpen(false)} className="p-2 text-[#8e9299]">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Early Access Lifetime Offer Box */}
                  <a 
                    href="https://buy.stripe.com/00w6oGanpcH8boq5tRafS0e"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-4 hover:border-amber-400 group transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] cursor-pointer select-none"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400">EARLY ACCESS</span>
                    </div>
                    <h3 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors tracking-wide leading-tight">
                      Lifetime Membership Access
                    </h3>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-base font-black text-amber-300 tracking-tight">$350</span>
                      <span className="text-[9px] text-[#8e9299] line-through font-mono">$1,200</span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase ml-auto">SAVE 70%</span>
                    </div>
                    <div className="mt-3 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-center text-[9px] font-mono font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1">
                      Secure Instant Access <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </a>
                  
                  {CATEGORIES_MAP.map((category, catIdx) => (
                    <div key={catIdx} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2d3139]/40 pb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#8e9299]">
                          {category.title}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {category.items.map((item, idx) => {
                          const IconComp = item.icon;
                          const isActive = viewMode === item.id;
                          return (
                            <button
                              key={`${item.id}-${idx}`}
                              onClick={() => {
                                setViewMode(item.id);
                                if (window.innerWidth < 1024) setNavOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left rounded-lg transition-all flex items-center gap-3 relative overflow-hidden group select-none cursor-pointer ${isActive ? 'bg-[#00d1ff]/10 text-white' : 'text-[#8e9299] hover:bg-white/5 hover:text-white'}`}
                            >
                              <IconComp size={14} className={isActive ? 'text-[#00d1ff]' : 'text-[#8e9299] group-hover:text-white'} />
                              <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-[#8e9299] group-hover:text-white'}`}>
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-[#00d1ff] rounded-r-full shadow-[0_0_8px_#00d1ff]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.aside>
          )}
        </AnimatePresence>

        <main ref={mainContainerRef} className={`flex-1 min-w-0 relative bg-[#0c0d10] overflow-y-auto overflow-x-hidden scroll-smooth ${isWorkspaceFullScreen ? 'fixed inset-0 z-[120] bg-black p-4 md:p-8' : ''}`}>
          <ThemeLiveBackground theme={theme} />
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full min-h-full flex flex-col relative z-10"
            >
              {viewMode === 'dashboard' && (
                <DashboardModule 
                  setViewMode={setViewMode}
                  frequency={frequency}
                  wavelength={wavelength}
                  axialRes={axialRes}
                  branding={branding}
                />
              )}
              {viewMode === 'probe' && (
                <TransducerModule 
                  thickness={thickness}
                  setThickness={setThickness}
                  frequency={frequency}
                  damping={damping}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  layers={LAYERS}
                  waveformData={waveformData}
                  spl={spl}
                  setViewMode={setViewMode}
                />
              )}
              {viewMode === 'types' && <TransducerTypesModule setViewMode={setViewMode} />}
              {viewMode === 'beam' && <BeamFormationModule setViewMode={setViewMode} />}
              {viewMode === 'pulse' && <PulsedWaveModule />}
              {viewMode === 'physics' && (
                <ResolutionsModule 
                  axialRes={axialRes}
                  wavelength={wavelength}
                />
              )}
              {viewMode === 'doppler' && (
                <DopplerModule 
                  dopplerShift={dopplerShift}
                  dopplerAngle={dopplerAngle}
                  bloodVelocity={bloodVelocity}
                  flowType={flowType}
                  dopplerSpectrum={dopplerSpectrum}
                  setViewMode={setViewMode}
                />
              )}
              {viewMode === 'duel' && <DopplerDuelModule setViewMode={setViewMode} />}
              {viewMode === 'interactions' && <InteractionsModule />}
              {viewMode === 'attenuation' && <AttenuationModule />}
              {viewMode === 'hemodynamics' && <HemodynamicsModule setViewMode={setViewMode} />}
              {viewMode === 'imaging' && <ImagingModule tgc={tgc} />}
              {viewMode === 'artifacts' && <ArtifactsModule setViewMode={setViewMode} />}
              {viewMode === 'safety' && <SafetyModule setViewMode={setViewMode} />}
              {viewMode === 'academy' && <MasterTextbook />}
              {viewMode === 'practice' && <PracticeModule setViewMode={setViewMode} />}
              {viewMode === 'mock_exam' && <MockExamModule setViewMode={setViewMode} />}
              {viewMode === 'chat' && <AskKBModule />}
              {viewMode === 'summarizer' && <AIWebSummarizerModule />}
              {viewMode === 'profile' && (
                <ProfileModule 
                  setViewMode={setViewMode}
                  dopplerAngle={dopplerAngle}
                  bloodVelocity={bloodVelocity}
                />
              )}
              {viewMode === 'roadmap' && <RoadmapModule />}
              {viewMode === 'quest_station' && <QuestStationModule />}
              {viewMode === 'solver' && <PhysicsCalculatorModule />}
              {viewMode === 'library' && (
                <VideoLibraryModule 
                  setActiveLectureId={setActiveLectureId}
                  speak={(script: string, id: string) => {
                    setActiveLectureId(id);
                    speak(script);
                  }}
                  activeLectureId={activeLectureId}
                  isSpeaking={isSpeaking}
                  stopSpeaking={stop}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {activeLectureId && (
              <NarratorPanel 
                lectureId={activeLectureId} 
                onClose={() => setActiveLectureId(null)} 
                narrator={{ speak, stop, isSpeaking, progress }}
              />
            )}
          </AnimatePresence>

          {/* Mobile Upgraded Navigation Console & Command Center */}
          <div className="lg:hidden flex flex-col border-t border-[#2d3139] bg-[#16181d] sticky bottom-0 z-30 shadow-[0_-12px_24px_rgba(0,0,0,0.65)] shrink-0">
            {/* Smooth-Scrolling Active Tab Header */}
            <div 
              ref={bottomBarRef}
              className="flex items-center gap-3 px-4 py-3 bg-[#0b0c10] border-b border-[#2d3139]/40 w-full"
            >
              <button 
                onClick={() => {
                  setNavOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#00d1ff]/10 to-indigo-500/5 hover:from-[#00d1ff]/20 border border-[#00d1ff]/30 text-[#00d1ff] rounded-xl transition-all shadow-[0_0_15px_rgba(0,209,255,0.08)] select-none cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid size={14} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-[8px] text-[#8e9299] font-mono font-bold tracking-widest uppercase">Current Directory</span>
                    <span className="text-xs text-white font-bold tracking-wider">{tabs.find(t => t.id === viewMode)?.label || 'Select Module'}</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-[#00d1ff]/10 rounded font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 font-bold">
                  MENU <ArrowRight size={10} />
                </div>
              </button>
            </div>

            {/* Core Controls & Audio Assist row */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#12141a]">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setControlsOpen(!controlsOpen)}
                  className={`flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider font-bold rounded-lg px-2.5 py-1.5 transition-all border shrink-0 cursor-pointer ${controlsOpen ? 'bg-[#00d1ff]/15 border-[#00d1ff]/40 text-[#00d1ff]' : 'bg-white/5 border-white/10 text-[#8e9299]'}`}
                >
                  <Sliders size={11} className="text-[#00d1ff]" />
                  <span>SIM PANEL</span>
                </button>
                <button
                  onClick={() => setPhysicsQuickRefOpen(true)}
                  className="flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider font-bold bg-white/5 border border-white/10 text-[#8e9299] rounded-lg px-2.5 py-1.5 transition-all outline-none cursor-pointer hover:text-white"
                >
                  <BookOpen size={11} className="text-[#ffd700]" />
                  <span>PHYSICS</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {currentLectureId && (
                  <button 
                    onClick={() => {
                      const lecture = LECTURES.find(l => l.id === currentLectureId);
                      if (lecture) {
                        setActiveLectureId(currentLectureId);
                        speak(lecture.script);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${isSpeaking && activeLectureId === currentLectureId ? 'bg-[#00d1ff]/10 border-[#00d1ff]/50 text-[#00d1ff] animate-pulse' : 'bg-[#ffd700]/10 border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700] hover:text-black'}`}
                  >
                    <Volume2 size={11} className={isSpeaking && activeLectureId === currentLectureId ? "animate-bounce" : ""} />
                    <span>{isSpeaking && activeLectureId === currentLectureId ? 'NARRATING' : 'LISTEN'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {transitionModule && (
              <CinematicModuleIntro 
                key={`${viewMode}-transition`}
                moduleLabel={transitionModule.label}
                moduleCategory={transitionModule.category}
                badge={transitionModule.badge}
                onComplete={() => setTransitionModule(null)}
              />
            )}
          </AnimatePresence>

          <footer className="p-3 sm:p-4 md:p-6 bg-[#0c0d10] border-t border-[#2d3139] grid grid-cols-3 sm:flex sm:flex-row items-center justify-around z-20 shadow-2xl shrink-0 text-center gap-2 sm:gap-4 lg:gap-2">
             <div className="flex flex-col items-center">
                <div className="text-[7.5px] sm:text-[8px] md:text-[9px] text-[#8e9299] uppercase font-bold tracking-tighter sm:tracking-normal">Atten. Coeff</div>
                <div className="text-xs sm:text-sm md:text-lg font-serif italic text-white leading-tight">{attenuation.toFixed(1)} <span className="text-[7.5px] sm:text-[8px] md:text-[9px] font-sans not-italic text-[#8e9299]">dB/cm/MHz</span></div>
             </div>
             <div className="hidden sm:block w-[1px] h-6 md:h-8 bg-[#2d3139]" />
             <div className="flex flex-col items-center border-x sm:border-x-0 border-[#2d3139]/50">
                <div className="text-[7.5px] sm:text-[8px] md:text-[9px] text-[#8e9299] uppercase font-bold tracking-tighter sm:tracking-normal">Prop. Velocity</div>
                <div className="text-xs sm:text-sm md:text-lg font-serif italic text-[#00d1ff] leading-tight">{activeMedium.c} <span className="text-[7.5px] sm:text-[8px] md:text-[9px] font-sans not-italic text-[#8e9299]">m/s</span></div>
             </div>
             <div className="hidden sm:block w-[1px] h-6 md:h-8 bg-[#2d3139] shrink-0" />
             <div className="flex flex-col items-center">
                <div className="text-[7.5px] sm:text-[8px] md:text-[9px] text-[#8e9299] uppercase font-bold tracking-tighter sm:tracking-normal">Tissue</div>
                <div className="text-xs sm:text-sm md:text-lg font-serif italic text-[#ffd700] uppercase tracking-wider leading-tight line-clamp-1">{activeMedium.name}</div>
             </div>
          </footer>
        </main>

        <AnimatePresence>
          {controlsOpen && (
            <motion.div
              key="controls-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setControlsOpen(false)}
            />
          )}
          {controlsOpen && (
            <motion.aside 
              key="controls-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute lg:relative right-0 inset-y-0 border-l border-[#2d3139] bg-[#0f1115] flex flex-col gap-6 overflow-hidden shrink-0 z-40 w-[85vw] max-w-[300px] sm:w-[360px] sm:max-w-none shadow-[-20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none"
            >
                <div className="p-5 sm:p-8 flex flex-col gap-6 h-full overflow-y-auto w-full">
                  <div className="flex justify-between items-center lg:hidden -mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#8e9299] uppercase">Sim Panel</span>
                    <button onClick={() => setControlsOpen(false)} className="p-2 text-[#8e9299]">
                      <X size={20} />
                    </button>
                  </div>

                  <SidebarControls 
                    viewMode={viewMode}
                    dopplerAngle={dopplerAngle}
                    setDopplerAngle={setDopplerAngle}
                    bloodVelocity={bloodVelocity}
                    setBloodVelocity={setBloodVelocity}
                    flowType={flowType}
                    setFlowType={setFlowType}
                    tgc={tgc}
                    setTgc={setTgc}
                    activeProbe={activeProbe}
                    setActiveProbe={setActiveProbe}
                    probeTypes={PROBE_TYPES}
                    thickness={thickness}
                    setThickness={setThickness}
                    activeMedium={activeMedium}
                    setActiveMedium={setActiveMedium}
                    media={MEDIA}
                  />
                  
                  <div className="hidden lg:block mt-auto shrink-0">
                    <PhysicsReadout 
                      frequency={frequency}
                      wavelength={wavelength}
                      reflectionCoeff={reflectionCoeff}
                      axialRes={axialRes}
                    />
                  </div>
                </div>
              </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Floating physics quick reference trigger badge */}
      {viewMode !== 'academy' && viewMode !== 'practice' && viewMode !== 'chat' && viewMode !== 'library' && (
        <button
          onClick={() => setPhysicsQuickRefOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#14161d] hover:bg-[#1a1d26] border-l border-t border-b border-[#2d3139] hover:border-[#00d1ff]/50 rounded-l-xl py-4 px-2.5 shadow-[0_0_25px_rgba(0,0,0,0.5)] z-40 transition-all flex flex-col items-center gap-2 group cursor-pointer"
          title="Open Physics Quick Reference"
          id="physics-quick-ref-btn"
        >
          <BookOpen size={16} className="text-[#00d1ff] group-hover:scale-110 transition-transform" />
          <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-[#8e9299] group-hover:text-white [writing-mode:vertical-lr] select-none">
            Physics Ref
          </span>
        </button>
      )}

      {/* Floating Fullscreen Workspace Overlay Toggle Badge */}
      <button
        onClick={async () => {
          try {
            if (!isWorkspaceFullScreen) {
              if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
              }
              setIsWorkspaceFullScreen(true);
            } else {
              if (document.exitFullscreen && document.fullscreenElement) {
                await document.exitFullscreen();
              }
              setIsWorkspaceFullScreen(false);
            }
          } catch (err) {
            console.warn("Fullscreen API failed", err);
            setIsWorkspaceFullScreen(!isWorkspaceFullScreen);
          }
        }}
        className="fixed left-6 bottom-20 md:bottom-24 bg-[#14161d]/95 hover:bg-[#1a1d26] border border-[#2d3139] hover:border-[#00d1ff]/50 rounded-xl p-3 shadow-[0_0_25px_rgba(0,0,0,0.8)] z-[130] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        title={isWorkspaceFullScreen ? "Exit Fullscreen Sim" : "Maximize Active Simulation"}
        id="workspace-fullscreen-badge-btn"
      >
        {isWorkspaceFullScreen ? <Minimize2 size={15} className="text-[#00d1ff]" /> : <Maximize2 size={15} className="text-[#00d1ff]" />}
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8e9299] group-hover:text-white">
          {isWorkspaceFullScreen ? "Exit Fullscreen" : "Fullscreen Sim"}
        </span>
      </button>

      {/* Physics Quick-Reference Slider Drawer */}
      <PhysicsQuickReference 
        isOpen={physicsQuickRefOpen} 
        onClose={() => setPhysicsQuickRefOpen(false)} 
      />

      {/* Universal Full Screen Detail Info Reader Modal */}
      <AnimatePresence>
        {fullScreenItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setFullScreenItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#0c0d10] border border-[#2d3139] rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Terminal Header */}
              <div className="bg-[#111317] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[10px] font-mono text-[#00d1ff] tracking-[3px] uppercase animate-pulse">
                    {fullScreenItem.badge || "DIAGNOSTIC KNOWLEDGE SYSTEM // DETAILED VIEW"}
                  </div>
                  {fullScreenItem.category && (
                    <div className="text-[8px] font-mono text-amber-400 mt-0.5 tracking-wider uppercase">
                      Registry Category: {fullScreenItem.category}
                    </div>
                  )}
                  <h3 className="text-xl md:text-2xl font-serif italic text-white mt-1">
                    {fullScreenItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setFullScreenItem(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8e9299] hover:text-white transition-all border border-[#2d3139] cursor-pointer"
                  title="Close Content Details"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-[#e0e0e0] leading-relaxed custom-scrollbar">
                {fullScreenItem.subtitle && (
                  <p className="text-sm text-white/70 font-serif italic border-l-2 border-[#00d1ff]/50 pl-4 py-1">
                    {fullScreenItem.subtitle}
                  </p>
                )}

                {/* Standard main text Content */}
                <div className="text-white text-sm md:text-base selection:bg-[#00d1ff]/30 leading-relaxed font-sans space-y-4">
                  {typeof fullScreenItem.content === 'string' ? (
                    <p dangerouslySetInnerHTML={{ __html: fullScreenItem.content }} />
                  ) : (
                    fullScreenItem.content
                  )}
                </div>

                {/* Formula */}
                {fullScreenItem.formula && (
                  <div className="p-4 rounded-xl bg-black/60 border border-[#2d3139] flex flex-col md:flex-row md:justify-between md:items-center font-mono gap-3 shadow-inner">
                    <span className="text-[8.5px] text-white/40 uppercase tracking-widest font-black">
                      Registry Mathematics Formula:
                    </span>
                    <span className="text-base md:text-lg text-[#00d1ff] font-extrabold pr-2 drop-shadow-[0_0_15px_rgba(0,209,255,0.3)]">
                      {fullScreenItem.formula}
                    </span>
                  </div>
                )}

                {/* High-Yield Concept */}
                {fullScreenItem.concept && (
                  <div className="p-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/[0.02] shadow-sm">
                    <span className="text-white font-mono text-[9px] uppercase tracking-widest font-black block mb-1 text-emerald-400">
                      High-Yield Translation:
                    </span>
                    <p className="text-xs md:text-sm text-white/75 font-sans leading-relaxed">
                      {fullScreenItem.concept}
                    </p>
                  </div>
                )}

                {/* Trap Alert */}
                {fullScreenItem.alert && (
                  <div className="p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 text-xs leading-relaxed text-[#ffd700]/95 font-mono">
                    <span className="text-[#ffd700] font-extrabold uppercase text-[9px] tracking-wider flex items-center gap-1.5 mb-2">
                      ⚠️ Core Registry Trap Catch
                    </span>
                    {fullScreenItem.alert}
                  </div>
                )}
              </div>

              {/* Footer info decoration */}
              <div className="bg-[#111317] border-t border-white/5 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[9px] font-mono text-[#8e9299] shrink-0">
                <span className="uppercase tracking-widest">SONICBUILD TERMINAL // STABLE PORTAL</span>
                <button
                  onClick={() => setFullScreenItem(null)}
                  className="mt-2 md:mt-0 px-4 py-1.5 border border-[#2d3139] hover:border-[#00d1ff]/50 hover:bg-[#00d1ff]/5 hover:text-white rounded-lg transition-all text-[9px] font-mono cursor-pointer"
                >
                  DISMISS OVERLAY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {controlsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed lg:hidden inset-0 bg-black/60 z-30"
            onClick={() => setControlsOpen(false)}
          />
        )}
      </AnimatePresence>
      <GlobalStudyRadio />
    </div>
    </>
  );
}
