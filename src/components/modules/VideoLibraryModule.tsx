import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Clock, 
  Info, 
  ChevronRight, 
  Layers, 
  Waves, 
  Activity, 
  ShieldAlert, 
  Search,
  MonitorPlay,
  X,
  Volume2,
  VolumeX,
  BookOpen,
  HelpCircle,
  ArrowUpRight,
  Globe,
  RefreshCw,
  ChevronLeft,
  ExternalLink,
  Compass,
  Download,
  FileDown
} from 'lucide-react';
import { VIDEOS } from '../../constants';
import { LECTURES, LectureScript } from '../../constants/lectures';
import { generateStyledHTML, generateStructuredMarkdown } from '../../utils/lectureExporter';
import InteractiveUltrasoundVideoSim from './InteractiveUltrasoundVideoSim';
import AttachedMediaList from '../shared/AttachedMediaList';
import PulsedWaveDopplerGlossary from '../shared/PulsedWaveDopplerGlossary';

const SONOWORLD_PRESETS = [
  {
    id: "sonoworld-home",
    title: "SonoWorld Legacy Archive Index",
    category: "ARCHIVE INDEX",
    url: "https://www.iame.com/sonoworld-archive",
    description: "The full open-access historical clinical ultrasound curriculum, case portfolios, and visual lectures compilation."
  },
  {
    id: "sonoworld-physics",
    title: "Ultrasound Physical Acoustics & Instrumentation",
    category: "PHYSICS",
    url: "https://www.iame.com/sonoworld-archive",
    description: "Theoretical physics, transducer design, sound propagates formulas, Doppler mathematics models, and Knobology lectures."
  },
  {
    id: "sonoworld-vascular",
    title: "Vascular Diagnostics & Doppler Principles",
    category: "VASCULAR",
    url: "https://www.iame.com/sonoworld-archive",
    description: "Interactive webinars covering color flow, spectral broadening, aliasing, and carotid stenotic velocities profiles."
  },
  {
    id: "sonoworld-cardiac",
    title: "Adult Echocardiography & Chambers Studies",
    category: "CARDIAC",
    url: "https://www.iame.com/sonoworld-archive",
    description: "Comprehensive registry review slides on left ventricular volume, flow acceleration, and valvular regurgitation."
  },
  {
    id: "sonoworld-obgyn",
    title: "Obstetrics & Gynecologic Diagnostic Ultrasound",
    category: "OB/GYN",
    url: "https://www.iame.com/sonoworld-archive",
    description: "Fetal Doppler velocity assessment, gestational parameters, uterine perfusion studies, and anatomical guidelines."
  },
  {
    id: "sonoworld-abdominal",
    title: "Abdominal Imaging & Organ Studies",
    category: "ABDOMINAL",
    url: "https://www.iame.com/sonoworld-archive",
    description: "Complete clinical archive compiling scanning techniques and diagnostics for liver, kidneys, biliary tree, and retroperitoneum."
  }
];

const HIGH_YIELD_TERMS = [
  { term: "Pulsed-Wave Doppler", def: "Exploring the Dynamics of Blood Flow. Pulsed-wave Doppler integrates range-gated pulse-echo timings to profile localized blood velocities. Click to interact with the full simulation and clinical syllabus guide." },
  { term: "Nyquist Limit", def: "In Doppler imaging, the maximum frequency shift that can be measured without aliasing, equal to PRF/2." },
  { term: "Spectral Broadening", def: "A widening of the Doppler spectral wave, indicating turbulent, multi-directional flow, common in stenosis." },
  { term: "Acoustic Impedance", def: "Resistance of a medium to sound wave propagation. Difference in impedance causes reflections." },
  { term: "ALARA Protocol", def: "As Low As Reasonably Achievable: minimize acoustic power output and exam duration to ensure biological safety." },
  { term: "Temporal Resolution", def: "Ability to distinguish moving structures over time. Directly determined by frame rate." }
];

interface VideoLibraryProps {
  setActiveLectureId?: (id: string | null) => void;
  speak?: (script: string, id: string) => void;
  activeLectureId?: string | null;
  isSpeaking?: boolean;
  stopSpeaking?: () => void;
}

export default function VideoLibraryModule({
  setActiveLectureId,
  speak,
  activeLectureId,
  isSpeaking,
  stopSpeaking
}: VideoLibraryProps) {
  const [libraryTab, setLibraryTab] = useState<'clips' | 'narratives' | 'sonoworld'>('narratives');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSonoWorldUrl, setActiveSonoWorldUrl] = useState<string>("https://www.iame.com/sonoworld-archive");
  const [activeSonoWorldTitle, setActiveSonoWorldTitle] = useState<string>("SonoWorld Legacy Archive Index");
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [userStudyNotes, setUserStudyNotes] = useState<string>(() => {
    return localStorage.getItem('spi_sonoworld_study_notes') || "";
  });

  // Export State System
  const [showExporterModal, setShowExporterModal] = useState(false);
  const [exporterSelectedLecture, setExporterSelectedLecture] = useState<LectureScript | null>(null);
  const [exporterTheme, setExporterTheme] = useState<'cosmic' | 'minimalist'>('cosmic');
  const [exporterFormat, setExporterFormat] = useState<'html' | 'md'>('html');
  const [exporterScope, setExporterScope] = useState<'single' | 'all'>('single');

  const triggerDownloadExport = () => {
    if (exporterScope === 'single' && !exporterSelectedLecture) return;

    const op = {
      theme: exporterTheme,
      combine: exporterScope === 'all',
      selectedLectureId: exporterSelectedLecture?.id
    };

    let filename = '';
    let content = '';
    let mimeType = '';

    if (exporterFormat === 'html') {
      content = generateStyledHTML(LECTURES, op);
      filename = exporterScope === 'all' 
        ? 'SPI_Master_Study_Binder.html' 
        : `Lecture_${exporterSelectedLecture?.id}_Study_Guide.html`;
      mimeType = 'text/html';
    } else {
      content = generateStructuredMarkdown(LECTURES, op);
      filename = exporterScope === 'all' 
        ? 'SPI_Master_Study_Notebook.md' 
        : `Lecture_${exporterSelectedLecture?.id}_Study_Sheet.md`;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExporterModal(false);
  };

  const renderVideoThumbnailCover = (id: string) => {
    switch (id) {
      case 'transducer-selection':
        return (
          <svg className="w-full h-full text-sky-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M50 10 L40 5 L60 5 Z" fill="#1f2937" stroke="#38bdf8" />
            <path d="M50 10 L25 45 M50 10 L35 50 M50 10 L50 52 M50 10 L65 50 M50 10 L75 45" stroke="#38bdf8" strokeDasharray="1 1" />
            <path d="M25 45 Q 50 55 75 45" stroke="#00d1ff" />
            <circle cx="50" cy="30" r="8" stroke="rgba(0,209,255,0.15)" strokeWidth="6" />
          </svg>
        );
      case 'phased-array':
        return (
          <svg className="w-full h-full text-violet-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="20" y="5" width="60" height="8" rx="1" fill="#1f2937" stroke="#a78bfa" />
            <path d="M20 13 Q35 25 50 25 Q65 25 80 13" stroke="#a78bfa" strokeDasharray="2 2" />
            <line x1="50" y1="9" x2="68" y2="48" stroke="#00d1ff" strokeWidth="2.5" />
            <circle cx="68" cy="48" r="3" fill="#ffffff" />
          </svg>
        );
      case 'linear-array':
        return (
          <svg className="w-full h-full text-sky-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="15" y="5" width="70" height="8" rx="1" fill="#1f2937" stroke="#38bdf8" />
            <line x1="25" y1="13" x2="25" y2="48" stroke="#38bdf8" strokeOpacity="0.4" />
            <line x1="35" y1="13" x2="35" y2="48" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.5" />
            <line x1="45" y1="13" x2="45" y2="48" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.5" />
            <line x1="55" y1="13" x2="55" y2="48" stroke="#38bdf8" strokeOpacity="0.8" strokeWidth="1.5" />
            <line x1="65" y1="13" x2="65" y2="48" stroke="#38bdf8" strokeOpacity="0.4" />
            <line x1="75" y1="13" x2="75" y2="48" stroke="#38bdf8" strokeOpacity="0.1" />
            <path d="M10 42 C40 37 60 47 90 42" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          </svg>
        );
      case 'curved-array':
        return (
          <svg className="w-full h-full text-amber-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M25 10 Q 50 18 75 10" stroke="#fbbf24" strokeWidth="2.5" />
            <path d="M25 10 L 10 46 M37 13 L 28 50 M50 14 L 50 52 M63 13 L 72 50 M75 10 L 90 46" stroke="#fbbf24" strokeOpacity="0.4" strokeDasharray="1 1" />
            <path d="M10 46 Q 50 56 90 46" stroke="rgba(251, 191, 36, 0.4)" />
          </svg>
        );
      case 'resolution':
        return (
          <svg className="w-full h-full text-emerald-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M45 5 L55 5 L50 25 L50 52" stroke="#34d399" strokeOpacity="0.3" />
            <ellipse cx="50" cy="25" rx="2" ry="10" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="50" cy="22" r="1.5" fill="#ffd700" />
            <circle cx="50" cy="29" r="1.5" fill="#ffd700" />
            <circle cx="43" cy="25" r="1.2" fill="#ff4d4d" />
            <circle cx="57" cy="25" r="1.2" fill="#ff4d4d" />
          </svg>
        );
      case 'frequency':
        return (
          <svg className="w-full h-full text-[#00d1ff]/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 30 Q20 10 30 30 T50 30 T70 30 T90 30" stroke="#00d1ff" strokeWidth="1.5" strokeOpacity="0.8" />
            <path d="M10 30 Q15 20 20 30 T30 30 T40 30 T50 30" stroke="#ffd700" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="10" y1="30" x2="90" y2="30" stroke="rgba(255,255,255,0.08)" />
          </svg>
        );
      case 'artifacts-guide':
        return (
          <svg className="w-full h-full text-rose-400/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="40,15 60,15 65,27 35,27" fill="#374151" stroke="#f43f5e" />
            <rect x="35" y="27" width="30" height="28" fill="rgba(0,0,0,0.85)" stroke="#ef4444" strokeOpacity="0.15" />
            <line x1="35" y1="27" x2="35" y2="55" stroke="#ef4444" strokeOpacity="0.3" strokeDasharray="2 2" />
            <line x1="65" y1="27" x2="65" y2="55" stroke="#ef4444" strokeOpacity="0.3" strokeDasharray="2 2" />
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full text-[#8e9299]/25 bg-[#0d1117] p-8" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="50" cy="30" r="15" stroke="#8e9299" strokeDasharray="3 3" />
            <line x1="20" y1="30" x2="80" y2="30" stroke="#8e9299" />
          </svg>
        );
    }
  };

  // Categories list based on active tab
  const activeCategories = libraryTab === 'clips' 
    ? ['ALL', ...Array.from(new Set(VIDEOS.map(v => v.category)))]
    : libraryTab === 'sonoworld'
    ? ['ALL', ...Array.from(new Set(SONOWORLD_PRESETS.map(p => p.category)))]
    : ['ALL', ...Array.from(new Set(LECTURES.map(l => l.category)))];

  const filteredVideos = VIDEOS.filter(video => {
    const matchesCategory = selectedCategory === 'ALL' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredLectures = LECTURES.filter(lecture => {
    const matchesCategory = selectedCategory === 'ALL' || lecture.category === selectedCategory;
    const matchesSearch = lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lecture.script.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredSonoWorld = SONOWORLD_PRESETS.filter(preset => {
    const matchesCategory = selectedCategory === 'ALL' || preset.category === selectedCategory;
    const matchesSearch = preset.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         preset.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const activeVideo = VIDEOS.find(v => v.id === selectedVideo);

  // Helper to color borders by category
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'hardware': return 'border-amber-500 text-amber-400 bg-amber-500/10';
      case 'physics': return 'border-sky-500 text-sky-400 bg-sky-500/10';
      case 'doppler': return 'border-violet-500 text-violet-400 bg-violet-500/10';
      case 'safety': return 'border-rose-500 text-rose-400 bg-rose-500/10';
      case 'artifacts': return 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10';
      default: return 'border-gray-500 text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 gap-6 sm:gap-8 overflow-y-auto custom-scrollbar relative bg-[#0c0d10]">
      {/* Background visual atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.02),transparent_40%)] pointer-events-none" />

      {/* Header with tactical live sync and hazard styled subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 border-b border-white/5 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono font-black tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 uppercase leading-none">
              U.U.U. SPEC-OPS BANDWIDTH
            </span>
            <span className="text-[8px] font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/20 uppercase">
              STUDY DECK SECURE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1 font-mono">
            SONOGRAPHY <span className="text-yellow-400">SONGS &amp; LECTURES</span>
          </h1>
          <p className="text-[11px] text-[#8e9299] uppercase tracking-widest max-w-xl mt-1.5 font-medium leading-relaxed font-sans">
            Clandestine audio-visual directory, exam-focused outline lectures, and clinical ultrasound soundtracks.
          </p>
        </div>
        
        {/* Search tool */}
        <div className="w-full md:w-64 h-12 border border-[#2d3139] bg-[#16181d] rounded-sm flex items-center px-4 gap-3 group focus-within:border-[#00d1ff]/50 transition-all shadow-inner">
           <Search size={14} className="text-[#8e9299] group-focus-within:text-[#00d1ff]" />
           <input 
             type="text" 
             placeholder="QUERY DATABASE..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="bg-transparent border-none outline-none text-[10px] font-mono text-[#00d1ff] placeholder:text-[#8e9299]/30 w-full uppercase tracking-widest"
           />
        </div>
      </div>

      {/* Segmented Library Toggle */}
      <div className="flex flex-wrap bg-[#16181d] p-1.5 rounded-xl border border-white/10 w-fit gap-1 z-10 shadow-lg">
        <button
          onClick={() => {
            setLibraryTab('narratives');
            setSelectedCategory('ALL');
          }}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${libraryTab === 'narratives' ? 'bg-[#00d1ff] text-black shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <BookOpen size={13} />
          Audio Lectures ({LECTURES.length})
        </button>
        <button
          onClick={() => {
            setLibraryTab('clips');
            setSelectedCategory('ALL');
          }}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${libraryTab === 'clips' ? 'bg-[#00d1ff] text-black shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <MonitorPlay size={13} />
          Diagnostic Clips ({VIDEOS.length})
        </button>
        <button
          onClick={() => {
            setLibraryTab('sonoworld');
            setSelectedCategory('ALL');
            setActiveSonoWorldUrl("https://www.iame.com/sonoworld-archive");
            setActiveSonoWorldTitle("SonoWorld Legacy Archive Index");
          }}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${libraryTab === 'sonoworld' ? 'bg-[#00d1ff] text-black shadow-md' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <Globe size={13} />
          SonoWorld Archive Portal (Interactive)
        </button>
      </div>

      {/* Category Tabs */}
      <AttachedMediaList module="library" />
      <div className="flex flex-wrap gap-2 sm:gap-3 z-10">
        {activeCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 sm:px-6 py-2 rounded-sm text-[10px] font-mono tracking-widest transition-all border ${
              selectedCategory === category 
                ? 'bg-[#00d1ff] border-[#00d1ff] text-black font-bold shadow-[0_0_15px_#00d1ff]/20' 
                : 'bg-[#16181d] border-[#2d3139] text-[#8e9299] hover:border-[#00d1ff]/50 hover:text-white'
            }`}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Content Display Grid */}
      <AnimatePresence mode="wait">
        {libraryTab === 'narratives' ? (
          <div className="flex flex-col gap-6 z-10 pb-20 w-full">
            {/* Master Study Binder Compilation Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-slate-900/90 via-[#181b24] to-slate-900/95 border border-[#00d1ff]/25 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00d1ff]/15 flex items-center justify-center border border-[#00d1ff]/25 shrink-0">
                  <FileDown size={22} className="text-[#00d1ff] animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] bg-amber-400/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider">
                      ★ HIGH YIELD REGISTER
                    </span>
                    <span className="text-[10px] text-[#8e9299] font-mono">11 MODULE REVIEWS COMPLETE</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Full-Scope ARDMS SPI Master Review Handbook</h3>
                  <p className="text-xs text-[#8e9299] leading-normal max-w-xl">
                    Compile all study lecture scripts, mnemonics keywords, and 20+ self-assessment quiz parameters into one interactive PDF-ready digital booklet.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setExporterSelectedLecture(null);
                  setExporterScope('all');
                  setShowExporterModal(true);
                }}
                className="w-full md:w-auto px-5 py-3 bg-[#00d1ff] text-black hover:bg-[#00b2db] hover:scale-[1.02] text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-[0_0_20px_rgba(0,209,255,0.25)]"
              >
                <Download size={14} />
                <span>Compile MASTER Study Binder</span>
              </button>
            </motion.div>

            {/* Individual Lecture Cards Grid */}
            <motion.div 
              key="narratives"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredLectures.length > 0 ? (
                filteredLectures.map((lecture) => {
                  const wordsCount = lecture.script.split(/\s+/).filter(Boolean).length;
                  const readTimeMinutes = Math.max(1, Math.ceil(wordsCount / 140));
                  const synopsis = lecture.script.trim().replace(/\s+/g, ' ').substring(0, 130) + '...';
                  const isCurrentLecture = activeLectureId === lecture.id;
                  const isCurrentPlaying = isCurrentLecture && isSpeaking;

                  return (
                    <motion.div
                      key={lecture.id}
                      variants={item}
                      whileHover={{ y: -4 }}
                      className={`bg-[#16181d] border ${isCurrentPlaying ? 'border-[#00d1ff] shadow-[0_0_30px_rgba(0,195,255,0.15)]' : 'border-[#2d3139]'} rounded-xl p-5 flex flex-col justify-between hover:border-white/10 group transition-all duration-300 shadow-md`}
                    >
                      <div className="space-y-4">
                        {/* Top badges */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-widest uppercase rounded border ${getCategoryColor(lecture.category)}`}>
                            {lecture.category}
                          </span>
                          
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8e9299]">
                            <Clock size={11} />
                            <span>{readTimeMinutes} MIN</span>
                          </div>
                        </div>

                        {/* Title & Synopsis */}
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-white group-hover:text-[#00d1ff] transition-colors leading-snug">
                            {lecture.title}
                          </h3>
                          <p className="text-xs text-[#8e9299] leading-relaxed italic line-clamp-3">
                            "{synopsis}"
                          </p>
                        </div>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/5 rounded text-[9px] font-mono text-[#8e9299]">
                            <HelpCircle size={10} className="text-emerald-500" />
                            <span>{lecture.assessment.length} ASSESSMENT Qs</span>
                          </div>
                          {lecture.images && lecture.images.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/5 rounded text-[9px] font-mono text-[#8e9299]">
                              <Activity size={10} className="text-[#00d1ff]" />
                              <span>{lecture.images.length} SYNC DIAGRAMS</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Playback & Export actions */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                        <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest hidden xs:block">
                          REGISTRY_SCRIPT
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Download Study Guide Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExporterSelectedLecture(lecture);
                              setExporterScope('single');
                              setShowExporterModal(true);
                            }}
                            className="flex items-center justify-center p-2 rounded-lg border border-[#2d3139] hover:border-[#00d1ff]/40 bg-[#0d0d12]/60 text-[#8e9299] hover:text-[#00d1ff] transition-all cursor-pointer"
                            title="Download Styled Study Sheets"
                          >
                            <Download size={13} />
                          </button>

                          {speak ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentPlaying) {
                                  stopSpeaking?.();
                                } else {
                                  speak(lecture.script, lecture.id);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${isCurrentPlaying ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500' : 'bg-[#00d1ff]/10 border-[#00d1ff]/30 text-[#00d1ff] hover:bg-[#00d1ff] hover:text-black hover:border-[#00d1ff]'}`}
                            >
                              {isCurrentPlaying ? (
                                <>
                                  <VolumeX size={12} className="animate-pulse" />
                                  <span>Stop Lecture</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={12} />
                                  <span>Listen &amp; Practice</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-[10px] text-amber-500/75 italic">
                              Click from top header
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-[#2d3139] rounded-lg">
                  <ShieldAlert size={48} className="text-[#8e9299] mb-4 opacity-50" />
                  <div className="text-[10px] font-mono text-[#8e9299] tracking-widest uppercase">No lectures matches search criteria</div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSearchTerm('');
                    }}
                    className="mt-6 px-4 py-2 text-[10px] font-mono text-[#00d1ff] border border-[#00d1ff]/30 rounded hover:bg-[#00d1ff]/10 transition-all uppercase tracking-widest"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        ) : libraryTab === 'clips' ? (
          <motion.div 
            key="clips"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 z-10 pb-20"
          >
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <motion.div 
                  key={video.id}
                  variants={item}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedVideo(video.id)}
                  className="group cursor-pointer flex flex-col bg-[#16181d] border border-[#2d3139] rounded-lg overflow-hidden transition-all hover:border-[#00d1ff]/30 shadow-lg"
                >
                  <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                    <div className="w-full h-full opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500 pointer-events-none">
                      {renderVideoThumbnailCover(video.id)}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-[#00d1ff] group-hover:border-[#00d1ff] transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_#00d1ff]/40">
                        <Play size={20} className="text-white group-hover:text-black transition-colors fill-current" />
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="px-2 py-0.5 rounded-[2px] bg-black/80 backdrop-blur-sm border border-white/10 text-[8px] font-mono text-[#00d1ff] uppercase tracking-widest leading-normal">
                        {video.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#00d1ff] transition-colors">{video.title}</h3>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed line-clamp-2 italic font-serif">
                        {video.description}
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-[#2d3139]/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#8e9299]">
                         <MonitorPlay size={10} />
                         <span className="text-[8px] font-mono uppercase tracking-widest">Acoustic_Sim_V1</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#00d1ff] opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-bold uppercase tracking-widest">Execute</span>
                         <ChevronRight size={10} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-[#2d3139] rounded-lg">
                <ShieldAlert size={48} className="text-[#8e9299] mb-4 opacity-50" />
                <div className="text-[10px] font-mono text-[#8e9299] tracking-widest uppercase">No data matches criteria</div>
                <button 
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchTerm('');
                  }}
                  className="mt-6 px-4 py-2 text-[10px] font-mono text-[#00d1ff] border border-[#00d1ff]/30 rounded hover:bg-[#00d1ff]/10 transition-all uppercase tracking-widest"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sonoworld"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 pb-20 items-start font-sans w-full"
          >
            {/* Left Hand Options (col-span-4) */}
            <div className="lg:col-span-4 flex flex-col gap-5 w-full">
              <div className="bg-[#16181d] border border-white/5 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Compass size={16} className="text-[#00d1ff]" />
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#e2e8f0]">Syllabus Directories</h3>
                </div>
                
                <p className="text-[10.5px] text-[#8e9299] leading-relaxed">
                  Select a clinical lecture domain below to dynamically update the interactive browser workspace directory to that exact portal.
                </p>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredSonoWorld.map((preset) => {
                    const isActive = activeSonoWorldUrl === preset.url && activeSonoWorldTitle === preset.title;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setActiveSonoWorldUrl(preset.url);
                          setActiveSonoWorldTitle(preset.title);
                          setIframeKey(k => k + 1);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 w-full group ${
                          isActive 
                            ? "bg-[#00d1ff]/15 border-[#00d1ff] text-white shadow-sm" 
                            : "bg-[#0e1013] border-white/5 text-[#8e9299] hover:bg-[#1c1e24] hover:border-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[9px] font-mono font-bold uppercase ${isActive ? "text-[#00d1ff]" : "text-[#8e9299]"}`}>
                            {preset.category}
                          </span>
                          <span className="text-[8px] font-mono text-[#8e9299] group-hover:text-white flex items-center gap-1">
                            Load <ChevronRight size={8} />
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#00d1ff] transition-colors line-clamp-1 leading-snug">
                          {preset.title}
                        </h4>
                        <p className="text-[9.5px] leading-normal text-[#8e9299] line-clamp-2">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                  
                  {filteredSonoWorld.length === 0 && (
                    <div className="text-center py-6 text-[10px] font-mono text-[#5c5f66] uppercase">
                      No matching topics found
                    </div>
                  )}
                </div>
              </div>

              {/* Study Assistant and Local Note Pad */}
              <div className="bg-[#16181d] border border-white/5 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <BookOpen size={15} className="text-emerald-400" />
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#e2e8f0]">Lecture Notes &amp; Sync Tracker</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg bg-[#0a0b0d] p-3 border border-white/5">
                    <span className="text-[8.5px] text-[#8e9299] font-mono uppercase tracking-widest block font-bold mb-1.5">Target Core Diagnostic Terms</span>
                    <div className="flex flex-col gap-2">
                      {HIGH_YIELD_TERMS.map((item, idx) => (
                        <div key={idx} className="bg-[#0c0d10] border border-white/5 rounded-lg p-2 flex items-start justify-between gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              const noteText = `\n[Notes on ${item.term}]: ${item.def}\n`;
                              setUserStudyNotes(prev => {
                                const updated = prev + noteText;
                                localStorage.setItem('spi_sonoworld_study_notes', updated);
                                return updated;
                              });
                            }}
                            className="text-left text-[9.5px] leading-relaxed text-slate-300 hover:text-white transition-all flex-1 cursor-pointer"
                            title="Click to insert into study notes"
                          >
                            <strong className="text-[#00d1ff] font-semibold">{item.term}</strong>: {item.def}
                            <div className="text-[7.5px] text-[#8e9299] mt-0.5 font-mono">⚡ Cite into notes</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.term === "Pulsed-Wave Doppler") {
                                (window as any).showInfoFullScreen?.({
                                   title: "Pulsed-Wave Doppler",
                                   badge: "COGNITIVE CLINICAL STUDY SYSTEM",
                                   content: <PulsedWaveDopplerGlossary />,
                                   concept: "Pulsed-wave Doppler provides precise localized depth resolution of velocity vector waveforms within a designated sample volume gate.",
                                });
                              } else {
                                (window as any).showInfoFullScreen?.({
                                   title: item.term,
                                   badge: "HIGH YIELD SYLLABUS CORE GLOSSARY",
                                   content: `<strong>Clinical definition of ${item.term}:</strong><br/><br/>${item.def}`,
                                   concept: `This term is frequently tested on the ARDMS SPI registry examination. Make sure to understand its physical triggers and visual manifestations.`
                                });
                              }
                            }}
                            className="p-1 px-1.5 text-[#00d1ff] bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 border border-[#00d1ff]/20 rounded transition-all cursor-pointer text-[7.5px] font-mono whitespace-nowrap uppercase"
                            title="Open Term in Full Screen"
                          >
                             MAX
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider block">Active Clinical Work Pad</label>
                    <textarea
                      value={userStudyNotes}
                      onChange={(e) => {
                        setUserStudyNotes(e.target.value);
                        localStorage.setItem('spi_sonoworld_study_notes', e.target.value);
                      }}
                      placeholder="Write down custom notes, case observations, or physics formulas while reviewing the archives..."
                      rows={5}
                      className="w-full text-xs font-mono bg-[#0c0d10] border border-white/5 rounded-lg p-2.5 text-white placeholder:text-[#5c5f66] focus:border-[#00d1ff]/50 outline-none resize-none transition-all"
                    />
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-[#8e9299]">
                      <span>Saved automatically to sandbox</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Clear notes?")) {
                            setUserStudyNotes("");
                            localStorage.removeItem('spi_sonoworld_study_notes');
                          }
                        }}
                        className="text-red-400 hover:underline hover:text-red-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Clear Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hand: Highly Polished IFrame Workstation (col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-4 w-full">
              {/* Browser Simulator Frame */}
              <div className="bg-[#14161d] border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[580px] xs:min-h-[640px] md:min-h-[720px] transition-all w-full">
                {/* Browser simulation top title/control bar */}
                <div className="bg-[#1b1e25] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
                  {/* Dots representing browser controls */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block opacity-80" />
                  </div>

                  {/* Browser simulated Address Bar */}
                  <div className="flex-1 max-w-xl h-8 bg-[#0a0b0d] border border-white/5 rounded-lg flex items-center px-3 gap-2 text-[10px] text-zinc-400 font-mono shadow-inner select-none truncate">
                    <Globe size={11} className="text-[#00d1ff] shrink-0" />
                    <span className="text-emerald-500 shrink-0 font-bold">SECURE_PROXY_SSL //</span>
                    <span className="truncate text-[#8e9299]/90">{activeSonoWorldUrl}</span>
                  </div>

                  {/* Browser toolbar actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIframeKey(k => k + 1)}
                      className="p-1.5 rounded bg-[#0a0b0d] hover:bg-white/5 border border-white/5 text-[#8e9299] hover:text-[#00d1ff] transition-all"
                      title="Reload Iframe Connection"
                    >
                      <RefreshCw size={11} className="active:rotate-180 transition-transform duration-300" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => window.open(activeSonoWorldUrl, '_blank')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00d1ff] text-black text-[9px] font-mono font-bold tracking-wider hover:bg-[#00b2db] shadow transition-all cursor-pointer"
                      title="Launch site in standalone companion window"
                    >
                      <span>SYNC</span>
                      <ArrowUpRight size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Sub-header detailing what is active */}
                <div className="bg-[#101216] border-b border-white/5 px-5 py-2 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-[#8e9299] font-mono font-bold uppercase tracking-wider">
                      Active Target: <span className="text-white font-sans font-normal normal-case">{activeSonoWorldTitle}</span>
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-[#8e9299]/60">SANDBOX EMBED METHOD // IFRAME</span>
                </div>

                {/* Iframe or fallback container */}
                <div className="flex-1 w-full h-[540px] xs:h-[590px] md:h-[660px] relative bg-black">
                  <iframe 
                    key={iframeKey}
                    src={activeSonoWorldUrl}
                    className="w-full h-full bg-[#111215] border-0"
                    title="SonoWorld Clinical Audio-Visual Archive"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                  />
                </div>
              </div>

              {/* Sync Tutorial and Diagnostic Workspace Fallback card */}
              <div className="bg-[#16181d] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
                <div className="space-y-1.5 flex-1 select-none">
                  <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-mono font-bold uppercase tracking-widest">
                    <ShieldAlert size={12} />
                    IAME SonoWorld Connection Protocol
                  </div>
                  <p className="text-xs text-[#8e9299] leading-relaxed max-w-2xl font-sans">
                    Due to external browser protection rules (Cross-Origin Resource Sharing / CORS) or local sandbox settings, some sections of the archive website may display a security block or load with limitations. 
                    If so, simply click the <span className="text-white font-bold inline-flex items-center gap-0.5">SYNC Portal <ArrowUpRight size={9} /></span> button above. It will launch the archives in a standalone browser window, allowing you to seamlessly study both resources with our customized note-taker and terms tracker!
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => window.open(activeSonoWorldUrl, '_blank')}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/20 text-[10px] font-mono font-extrabold uppercase rounded-lg transition-all scale-95 md:scale-100 self-center shrink-0 cursor-pointer"
                >
                  Synchronize Standalone Tab
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-[#0c0d10] border border-[#2d3139] rounded-xl overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
            >
              <div className="bg-[#111317] border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#00d1ff] tracking-[3px] uppercase">ACTIVE SIMULATOR // {selectedVideo.replace(/-/g, '_')}</div>
                  <h2 className="text-lg md:text-xl font-serif italic text-white mt-1">{activeVideo?.title}</h2>
                </div>
                
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8e9299] hover:text-white transition-all border border-white/10 hover:rotate-90 cursor-pointer"
                  title="Close Screen"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 flex flex-col bg-[#111317]">
                <InteractiveUltrasoundVideoSim 
                  videoId={selectedVideo} 
                  onClose={() => setSelectedVideo(null)} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stylized Exporter Configuration Modal */}
      <AnimatePresence>
        {showExporterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#11131a] border border-[#2d3139] rounded-2xl w-full max-w-lg p-6 relative flex flex-col gap-6 text-white shadow-2xl relative overflow-hidden"
            >
              {/* Overlay glow background */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent opacity-40 pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="text-[10px] font-mono text-[#00d1ff] tracking-[3.5px] uppercase font-bold">COMPILER UTILITY WORKSPACE</div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-1">Export Lecture Review Deck</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowExporterModal(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#8e9299] hover:text-white transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-5">
                {/* 1. Selected Scope */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest font-bold">Selected Compilation Scope</label>
                  {exporterScope === 'all' ? (
                    <div className="bg-[#00d1ff]/10 border border-[#00d1ff]/20 rounded-xl p-3 flex items-start gap-3">
                      <div className="p-1 px-1.5 bg-[#00d1ff] text-black text-[9px] font-mono font-black rounded uppercase">ALL</div>
                      <div className="space-y-0.5">
                        <strong className="text-white text-xs block">Combined Master Study Binder</strong>
                        <span className="text-[11px] text-[#8e9299] block leading-normal">
                          Includes index tables, custom badges spacing, full lecture syllabus scripts for all 11 modules and 20+ quiz challenges assembled.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-start gap-3">
                      <div className="p-1 px-1.5 bg-[#00d1ff]/20 border border-[#00d1ff]/40 text-[#00d1ff] text-[9px] font-mono font-black rounded uppercase">UNIT</div>
                      <div className="space-y-0.5">
                        <strong className="text-white text-xs block">{exporterSelectedLecture?.title}</strong>
                        <span className="text-[11px] text-[#8e9299] block">
                          Category: <span className="text-[#00d1ff] font-mono font-bold">{exporterSelectedLecture?.category}</span> • Assembles single-module reviews.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Style Preset */}
                <div className="space-y-2">
                  <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest font-bold">Select Visual Theme Accent</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExporterTheme('cosmic')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${exporterTheme === 'cosmic' ? 'bg-[#00d1ff]/10 border-[#00d1ff] text-white' : 'bg-[#0d0e12] border-white/5 text-[#8e9299] hover:bg-white/[0.02] hover:text-white'}`}
                    >
                      <span className="text-xs font-bold block text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00d1ff]" />
                        Cosmic Slate Dark
                      </span>
                      <span className="text-[10px] leading-relaxed opacity-80">Radiant screen mode styled with cobalt accents &amp; dark contrast ratios.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExporterTheme('minimalist')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${exporterTheme === 'minimalist' ? 'bg-[#0284c7]/10 border-[#0284c7] text-white' : 'bg-[#0d0e12] border-white/5 text-[#8e9299] hover:bg-white/[0.02] hover:text-white'}`}
                    >
                      <span className="text-xs font-bold block text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Clinical Ink-Saver
                      </span>
                      <span className="text-[10px] leading-relaxed opacity-80">High-contrast bright off-white outline layout. Perfect for manual printing.</span>
                    </button>
                  </div>
                </div>

                {/* 3. Output Format */}
                <div className="space-y-2">
                  <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest font-bold">Target File Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExporterFormat('html')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${exporterFormat === 'html' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-[#0d0e12] border-white/5 text-[#8e9299] hover:bg-white/[0.02] hover:text-white'}`}
                    >
                      <span className="text-xs font-bold block text-white">Printers HTML Document</span>
                      <span className="text-[10px] leading-relaxed opacity-80">Includes printable @media styles and interactive self-evaluation toggle script keys.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExporterFormat('md')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${exporterFormat === 'md' ? 'bg-[#00d1ff]/10 border-[#00d1ff] text-white' : 'bg-[#0d0e12] border-white/5 text-[#8e9299] hover:bg-white/[0.02] hover:text-[#00d1ff]'}`}
                    >
                      <span className="text-xs font-bold block text-white">Markdown Notebook</span>
                      <span className="text-[10px] leading-relaxed opacity-80">Pruned structured markdown layout. Fully compatible with Obsidian or Notion.</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExporterModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-bold text-[#8e9299] hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerDownloadExport}
                  className="flex-1 py-3 bg-[#00d1ff] text-black hover:bg-[#00b2db] rounded-xl text-xs font-bold hover:scale-[1.01] transition-all uppercase tracking-wider shadow-lg shadow-[#00d1ff]/10 cursor-pointer"
                >
                  Compile &amp; Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 right-10 flex flex-col items-end pointer-events-none opacity-20 hidden xl:flex">
         <div className="text-[40px] font-mono text-white/5 tracking-[-4px]">ARCHIVE</div>
         <div className="w-64 h-[1px] bg-white/10" />
      </div>
    </div>
  );
}
