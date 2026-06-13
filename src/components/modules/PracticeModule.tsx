import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Trophy, 
  BookOpen, 
  Video, 
  Clock, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  RefreshCw, 
  AlertTriangle,
  ChevronLeft,
  X,
  Gauge,
  Activity,
  Heart,
  Sliders,
  BookmarkCheck,
  Percent,
  TrendingUp,
  SlidersHorizontal,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SPI_EXAM_QUESTIONS, DOMAIN_DETAILS, SPIQuestion } from '../../constants/spiExamQuestions';

interface PracticeModuleProps {
  setViewMode?: (mode: any) => void;
}

// Spaced repetition local states
type MasteryStatus = 'unmastered' | 'reviewing' | 'mastered';

export default function PracticeModule({ setViewMode }: PracticeModuleProps) {
  const { user } = useAuth();
  
  // Tab Controller: flashcards, exam, prepry-kill
  const [activeTab, setActiveTab] = useState<'flashcards' | 'exam' | 'prepry-kill'>('exam');

  // Flashcards state (Original card questions augmented with spaced-rep)
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<number, MasteryStatus>>(() => {
    const local = localStorage.getItem('spi_flashcard_mastery_v2');
    return local ? JSON.parse(local) : {};
  });
  const [flashcardFilter, setFlashcardFilter] = useState<'all' | 'unmastered' | 'reviewing' | 'mastered'>('all');

  // Exam state parameters
  const [examMode, setExamMode] = useState<'idle' | 'tutor' | 'timed'>('idle');
  const [shuffledQuestions, setShuffledQuestions] = useState<SPIQuestion[]>([]);
  const [currentExamIdx, setCurrentExamIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({}); // question index -> option index
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes for mock exam
  const [timerActive, setTimerActive] = useState(false);
  const [revealTutorAnswer, setRevealTutorAnswer] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number; scaleScore: number; passed: boolean }[]>(() => {
    const local = localStorage.getItem('spi_mock_exam_history');
    return local ? JSON.parse(local) : [];
  });
  const [customName, setCustomName] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load and shuffle questions for exam
  const startExam = (mode: 'tutor' | 'timed') => {
    // Scramble questions lists to offer high variation
    const scrambled = [...SPI_EXAM_QUESTIONS].sort(() => Math.random() - 0.5);
    setShuffledQuestions(scrambled);
    setCurrentExamIdx(0);
    setSelectedAnswers({});
    setExamSubmitted(false);
    setRevealTutorAnswer(false);
    setExamMode(mode);
    
    if (mode === 'timed') {
      setTimeRemaining(1200); // 20 min budget (approx 1 min per board bullet)
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timerActive && examMode === 'timed' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            clearInterval(timerRef.current!);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, examMode, timeRemaining]);

  // Save Spaced Mastery to LocalStorage on modifications
  const updateMastery = (idx: number, status: MasteryStatus) => {
    const updated = { ...masteryData, [idx]: status };
    setMasteryData(updated);
    localStorage.setItem('spi_flashcard_mastery_v2', JSON.stringify(updated));
    triggerFlashcardNext();
  };

  const triggerFlashcardNext = () => {
    setIsFlipped(false);
    setFlashcardIdx((prev) => (prev + 1) % SPI_EXAM_QUESTIONS.length);
  };

  // Compute stats for current active filter
  const activeFlashcards = SPI_EXAM_QUESTIONS.filter((_, idx) => {
    const status = masteryData[idx] || 'unmastered';
    if (flashcardFilter === 'all') return true;
    return status === flashcardFilter;
  });

  const displayFlashcard = activeFlashcards[flashcardIdx] || activeFlashcards[0] || SPI_EXAM_QUESTIONS[0];
  const displayIdxInFullList = SPI_EXAM_QUESTIONS.findIndex(q => q.id === displayFlashcard.id);

  // Submit Exam Calculations
  const submitExam = () => {
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setExamSubmitted(true);

    // Compute score details
    let correctCount = 0;
    shuffledQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.a) {
        correctCount++;
      }
    });

    const totalQCount = shuffledQuestions.length || 1;
    const accuracy = correctCount / totalQCount;
    // Simulated ARDMS scale score: 300 to 700. 555 is the passing threshold. 
    // Accuracy of 0% -> 300, 100% -> 700.
    // Scale score formula: 300 + (Accuracy * 400). Passing 555 translates to roughly 63.75% accuracy (13 right out of 20).
    const scaleScore = Math.round(300 + (accuracy * 400));
    const passed = scaleScore >= 555;

    const newAttempt = {
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      score: correctCount,
      scaleScore,
      passed
    };

    const updatedHistory = [newAttempt, ...scoreHistory].slice(0, 10);
    setScoreHistory(updatedHistory);
    localStorage.setItem('spi_mock_exam_history', JSON.stringify(updatedHistory));
  };

  // Exit Quiz Mode
  const resetExamMode = () => {
    setExamMode('idle');
    setShuffledQuestions([]);
    setExamSubmitted(false);
    setSelectedAnswers({});
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Format countdown text
  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  // Identify wrong answers and subject gaps
  const getSubjectGapsBreakdown = () => {
    const totalBySec: Record<string, number> = { PHYS: 0, XMTR: 0, INST: 0, DOPP: 0, SAFE: 0 };
    const correctBySec: Record<string, number> = { PHYS: 0, XMTR: 0, INST: 0, DOPP: 0, SAFE: 0 };

    shuffledQuestions.forEach((q, idx) => {
      totalBySec[q.domainCode]++;
      if (selectedAnswers[idx] === q.a) {
        correctBySec[q.domainCode]++;
      }
    });

    return Object.keys(DOMAIN_DETAILS).map((code) => {
      const total = totalBySec[code] || 0;
      const correct = correctBySec[code] || 0;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 100;
      return {
        code,
        name: DOMAIN_DETAILS[code as keyof typeof DOMAIN_DETAILS].name,
        pct,
        total,
        correct,
        weight: DOMAIN_DETAILS[code as keyof typeof DOMAIN_DETAILS].weight,
        description: DOMAIN_DETAILS[code as keyof typeof DOMAIN_DETAILS].description
      };
    });
  };

  const getAccuracyRate = () => {
    if (!shuffledQuestions.length) return 0;
    let correct = 0;
    shuffledQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.a) correct++;
    });
    return Math.round((correct / shuffledQuestions.length) * 100);
  };

  const getCorrectCount = () => {
    let correct = 0;
    shuffledQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.a) correct++;
    });
    return correct;
  };

  const latestScore = scoreHistory[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col p-4 sm:p-8 lg:p-11 gap-6 md:gap-7 font-sans"
    >
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-5 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-yellow-500 font-bold mb-1.5 flex items-center gap-1.5 font-mono">
            <Trophy size={11} className="text-yellow-500 animate-pulse" /> U.U.U. COVERT READINESS BOARDS
          </div>
          <div className="text-2xl md:text-3.5xl font-black text-white tracking-tight uppercase font-mono">
            SPI REGISTRY <span className="text-yellow-400">EXAM &amp; QBANK</span>
          </div>
        </div>

        {/* Dynamic Selector Navigation */}
        <div className="flex bg-[#16181d] p-1 rounded-xl border border-white/10 w-full md:w-auto gap-0.5 z-10 text-[10px] uppercase font-bold tracking-wider text-center">
          <button
            onClick={() => setActiveTab('exam')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
              activeTab === 'exam' 
                ? 'bg-[#00d1ff] text-black shadow-md' 
                : 'text-[#8e9299] hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={12} className={activeTab === 'exam' ? 'text-black' : 'text-[#8e9299]'} />
            <span>Mock Exam Simulator</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('flashcards');
              setFlashcardFilter('all');
              setIsFlipped(false);
              setFlashcardIdx(0);
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
              activeTab === 'flashcards' 
                ? 'bg-[#00d1ff] text-black shadow-md' 
                : 'text-[#8e9299] hover:text-white hover:bg-white/5'
            }`}
          >
            <BookmarkCheck size={12} className={activeTab === 'flashcards' ? 'text-black' : 'text-[#8e9299]'} />
            <span>Spaced Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('prepry-kill')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
              activeTab === 'prepry-kill' 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'text-[#8e9299] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={11} className="text-amber-400 animate-pulse" />
            <span>App vs Prepry.com</span>
          </button>
        </div>
      </div>

      {/* PRIMARY VIEWER PORTAL */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: IMMERSIVE MOCK EXAM SYSTEM */}
        {activeTab === 'exam' && (
          <motion.div
            key="exam-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-6"
          >
            {examMode === 'idle' ? (
              /* Idle Landing Screen: Mode Selector, Previous analytics, ARDMS weighting */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Board Mode Configuration Selector */}
                <div className="lg:col-span-7 bg-[#16181d] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-[#00d1ff]/40 to-transparent" />
                  
                  <div className="space-y-1.5 select-none">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#00d1ff] uppercase">ARDMS SPI Board Simulator</span>
                    <h3 className="text-xl font-bold font-serif italic text-white">Choose Your Training Protocol</h3>
                    <p className="text-xs text-[#8e9299] leading-relaxed">
                      Calibrate your clinical scanning instincts. Select a test modality modeled directly after the American Registry for Diagnostic Medical Sonography (ARDMS) SPI Exam blueprint.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tutor interactive mode card */}
                    <button
                      type="button"
                      onClick={() => startExam('tutor')}
                      className="text-left p-5 rounded-xl border border-white/5 bg-[#0e1013] hover:bg-[#181a20] hover:border-[#00d1ff]/50 transition-all group flex flex-col gap-3 cursor-pointer"
                    >
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
                        <Sparkles size={16} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#00d1ff] transition-colors uppercase tracking-wider font-mono">1. Interactive Tutor Mode</h4>
                        <p className="text-[10px] text-[#8e9299] leading-relaxed">
                          Ideal for high-intensity study. Instantly evaluates every option you choose, loads logical explanations, cites physics equations, and lets you pace yourself without stress.
                        </p>
                      </div>
                    </button>

                    {/* Timed authentic exam simulation */}
                    <button
                      type="button"
                      onClick={() => startExam('timed')}
                      className="text-left p-5 rounded-xl border border-white/5 bg-[#0e1013] hover:bg-[#181a20] hover:border-amber-500/50 transition-all group flex flex-col gap-3 cursor-pointer"
                    >
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
                        <Clock size={16} className="animate-pulse" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-wider font-mono">2. Timed Board Simulation</h4>
                        <p className="text-[10px] text-[#8e9299] leading-relaxed">
                          Simulate authentic testing pressure. Features 20 randomized blueprint questions, a strict 20-minute countdown, locked instant reviews, and scaled scoring results.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Weighting distribution summary */}
                  <div className="bg-[#0b0c0f] border border-white/5 rounded-xl p-4 space-y-3">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#8e9299] uppercase block">Weighted Domain Outlines (ARDMS Blueprint)</span>
                    <div className="space-y-2">
                      {Object.keys(DOMAIN_DETAILS).map((k) => {
                        const d = DOMAIN_DETAILS[k as keyof typeof DOMAIN_DETAILS];
                        return (
                          <div key={k} className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00d1ff]" />
                              <span className="text-slate-300 font-medium">{d.name}</span>
                            </div>
                            <span className="font-mono text-[#00d1ff] bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {d.weight}% Weight
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Left Side: Recent test history graphs and readiness certificates */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Projected Registry Score card */}
                  <div className="bg-[#16181d] border border-white/5 rounded-2xl p-6 text-center space-y-4 shadow-xl">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#8e9299] uppercase block">Registry Readiness Rating</span>
                    
                    {scoreHistory.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Gauge size={22} className={latestScore.passed ? "text-emerald-400" : "text-amber-500"} />
                          <span className="text-4xl font-mono font-extrabold text-white tracking-tighter">
                            {latestScore.scaleScore}
                          </span>
                        </div>
                        <div className="flex justify-center items-center gap-1.5">
                          {latestScore.passed ? (
                            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-widest font-mono select-none uppercase">
                              PASSING PREDICTION (PASS &gt; 555)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold tracking-widest font-mono select-none uppercase">
                              MARGINAL CONFIDENCE (PASS &gt; 555)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8e9299] max-w-xs mx-auto leading-relaxed">
                          Your simulated ARDMS scale score on your last attempt is calculated on a 300-700 bounds profile. Over 555 indicates high clinical readiness!
                        </p>
                      </div>
                    ) : (
                      <div className="py-7 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-[#5c5f66]">
                          <Activity size={18} />
                        </div>
                        <p className="text-[10.5px] font-mono text-[#8e9299] uppercase tracking-wide">
                          No Simulated Board History
                        </p>
                        <p className="text-[9px] text-[#5c5f66] max-w-[220px] mx-auto leading-relaxed">
                          Your scores, accuracy rate breakdowns, and scale score passing logs will display here upon your first submittal.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Board Score Registry Logs */}
                  {scoreHistory.length > 0 && (
                    <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-300 uppercase">Interactive Log Histories</span>
                        <button
                          onClick={() => {
                            if (confirm("Reset historical performance recordings?")) {
                              setScoreHistory([]);
                              localStorage.removeItem('spi_mock_exam_history');
                            }
                          }}
                          className="text-[8.5px] font-mono text-rose-400 hover:underline hover:text-rose-300 transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {scoreHistory.map((h, i) => (
                          <div 
                            key={i}
                            className="bg-[#0e1013] border border-white/[0.02] rounded-xl p-3 flex justify-between items-center text-xs"
                          >
                            <div>
                              <div className="font-semibold text-white font-serif">{h.scaleScore} <span className="text-[#8e9299] text-[9.5px] font-mono">Scaled Score</span></div>
                              <span className="text-[8.5px] text-[#8e9299] font-mono block mt-0.5">{h.date}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-[9px] text-[#8e9299]">({h.score} / 22 Correct)</span>
                              {h.passed ? (
                                <span className="text-[8px] font-mono font-extrabold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">PASS</span>
                              ) : (
                                <span className="text-[8px] font-mono font-extrabold text-[#ffd700] px-1.5 py-0.5 rounded bg-amber-500/10 border border-[#ffd700]/20">FAIL</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core Preparation Creed */}
                  <div className="bg-gradient-to-br from-[#16181d] to-[#0e1013] border border-white/5 hover:border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
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
                      <span className="text-[9px] font-mono font-bold tracking-widest text-[#00d1ff] uppercase">
                        OUR PREPARATION CREED
                      </span>
                    </div>

                    <div className="space-y-4 text-center select-none py-1">
                      <p className="text-[#00d1ff] font-sans font-black text-sm tracking-[5px] uppercase animate-pulse">
                        STAY BREATHE.
                      </p>
                      
                      <div className="space-y-1.5 font-serif text-xs md:text-[13px] text-[#e0e0e0] leading-relaxed italic">
                        <p className="tracking-wide">YOUR ALLOWED TO MAKE MISTAKES</p>
                        <p className="text-white font-bold text-[10px] uppercase tracking-wider font-mono not-italic mt-2">OUR JOB IS TO PREPARE YOU.</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex flex-col items-center">
                        <span className="text-[8px] uppercase font-mono tracking-[3px] text-[#8e9299]">YOUR JOB IS TO</span>
                        <div className="mt-2 text-xs font-serif tracking-wider leading-relaxed text-[#ffd700]">
                          <p className="font-extrabold text-[10px] tracking-widest uppercase mb-1 font-mono">REMEMBER HOW WE FAIL YOU</p>
                          <p className="text-white text-[10px]">SO THAT WHEN IT IS YOUR TURN</p>
                          <p className="text-[#ffd700] font-black tracking-widest text-[11px] uppercase mt-1">YOU DO BETTER</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Active Board Exam Simulator Panel (Col-span-12) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Simulated Workspace Left controls (col-span-4 for timeline tracking) */}
                <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1">
                  
                  {/* Active Simulator Header and Clock */}
                  <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl select-none">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[8.5px] font-mono text-[#00d1ff] tracking-widest font-bold uppercase">
                        {examMode === 'timed' ? "⏱️ SCAN TIMER CALIBRATION" : "🎓 TUTORING INSTRUCTION"}
                      </span>
                      <button
                        onClick={resetExamMode}
                        className="text-[9px] font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1 uppercase transition-colors"
                      >
                        <ChevronLeft size={10} /> Exit Exam
                      </button>
                    </div>

                    {examMode === 'timed' && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wide">Time Remaining</span>
                          <div className={`text-2xl font-mono font-bold tracking-tight ${timeRemaining < 120 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                            {formatTime(timeRemaining)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTimerActive(!timerActive)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer border transition-all ${
                            timerActive 
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25" 
                              : "bg-[#00d1ff] border-transparent text-black hover:bg-[#00b2db]"
                          }`}
                        >
                          {timerActive ? "Pause" : "Resume"}
                        </button>
                      </div>
                    )}

                    {/* Accurate Progress tracking map */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-[#8e9299] uppercase">
                        <span>Calibration Progress</span>
                        <span>{currentExamIdx + 1} of {shuffledQuestions.length} Topics</span>
                      </div>
                      
                      <div className="relative w-full h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="absolute h-full bg-[#00d1ff] transition-all duration-300" 
                          style={{ width: `${((currentExamIdx + 1) / shuffledQuestions.length) * 100}%` }}
                        />
                      </div>

                      {/* Diagnostic question dot array */}
                      <div className="grid grid-cols-5 xs:grid-cols-6 lg:grid-cols-5 gap-1.5 pt-2.5">
                        {shuffledQuestions.map((q, idx) => {
                          const isAnswered = selectedAnswers[idx] !== undefined;
                          const isCurrent = idx === currentExamIdx;
                          let dotClass = "bg-black/30 border-white/5 text-[#5c5f66]";
                          if (isCurrent) {
                            dotClass = "bg-[#00d1ff]/10 border-[#00d1ff] text-[#00d1ff] font-bold ring-1 ring-[#00d1ff]/30";
                          } else if (isAnswered) {
                            dotClass = "bg-white/5 border-white/20 text-[#8e9299]";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentExamIdx(idx);
                                if (examMode === 'tutor') setRevealTutorAnswer(false);
                              }}
                              className={`h-7 rounded-lg border text-[9.5px] font-mono flex items-center justify-center transition-all cursor-pointer ${dotClass}`}
                            >
                              {(idx + 1).toString().padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Exam submission controller details */}
                  <div className="bg-[#16181d] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                    <span className="text-[8.5px] font-mono text-[#8e9299] tracking-widest font-bold uppercase block">Actions Matrix</span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you finished calibrating? This actions will compile and score your performance ledger.")) {
                          submitExam();
                        }
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-[#00d1ff] to-[#00b2db] text-black font-mono font-bold tracking-widest text-[10px] rounded-xl shadow-lg shadow-[#00d1ff]/10 hover:shadow-[#00d1ff]/20 hover:scale-[1.02] cursor-pointer text-center uppercase transition-transform"
                    >
                      ✓ Submit Assessment
                    </button>

                    <p className="text-[9px] text-[#8e9299] text-center leading-relaxed font-mono">
                      Uncompleted topics are logged in scoring as incorrect values. Keep iterating!
                    </p>
                  </div>
                </div>

                {/* Simulated Workstation Right main terminal (col-span-8) */}
                <div className="lg:col-span-8 flex flex-col gap-4 order-1 lg:order-2">
                  <AnimatePresence mode="wait">
                    
                    {/* SCENARIO A: EXAM RESULTS OVERLAY (Compiled scorecard) */}
                    {examSubmitted ? (
                      <motion.div
                        key="exam-results"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-[#16181d] border-2 border-white/10 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl relative"
                      >
                        {/* Certificate generation layout if passing score */}
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#00d1ff] to-amber-500" />
                        
                        <div className="text-center space-y-2">
                          <span className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold font-mono">BOARD ACCELERATOR SCORE REPORT</span>
                          <h3 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">Diagnostic Verification Verdict</h3>
                        </div>

                        {/* Bento Gauge matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Simulated scale score */}
                          <div className="bg-[#0e1013] border border-white/5 rounded-xl p-5 text-center flex flex-col justify-center items-center gap-2 shadow-inner">
                            <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider block font-bold">Simulated Scaled Score</span>
                            <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                              {300 + Math.round((getCorrectCount() / shuffledQuestions.length) * 400)}
                            </div>
                            <span className={`text-[8.5px] font-mono select-none px-2 py-0.5 rounded font-extrabold ${
                              (300 + (getCorrectCount() / shuffledQuestions.length) * 400) >= 555 
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                            }`}>
                              {(300 + (getCorrectCount() / shuffledQuestions.length) * 400) >= 555 ? "PASS VERDICT (> 555)" : "FAIL VERDICT (< 555)"}
                            </span>
                          </div>

                          {/* Accuracy percentage */}
                          <div className="bg-[#0e1013] border border-white/5 rounded-xl p-5 text-center flex flex-col justify-center items-center gap-2 shadow-inner">
                            <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider block font-bold">Scientific Accuracy</span>
                            <div className="text-4xl font-mono font-bold text-[#00d1ff] tracking-tighter">
                              {getAccuracyRate()}%
                            </div>
                            <span className="text-[8.5px] font-mono text-[#8e9299]">
                              ({getCorrectCount()} of {shuffledQuestions.length} Correct)
                            </span>
                          </div>

                          {/* Time footprint */}
                          <div className="bg-[#0e1013] border border-white/5 rounded-xl p-5 text-center flex flex-col justify-center items-center gap-1.5 shadow-inner">
                            <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider block font-bold">Efficiency Assessment</span>
                            <div className="text-4xl font-mono font-bold text-slate-300 tracking-tighter">
                              {formatTime(1200 - timeRemaining)}
                            </div>
                            <span className="text-[8.5px] font-mono text-[#8e9299] block font-semibold leading-normal">
                              Elapsed Duration
                            </span>
                          </div>
                        </div>

                        {/* Detailed domain matrix & weak-spot advisor */}
                        <div className="space-y-3.5 bg-[#0e1013] border border-white/5 rounded-xl p-5">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-[#8e9299] uppercase block h-fit pb-1.5 border-b border-white/5">
                            Domain Diagnostics &amp; Physical Simulation Advisories
                          </span>

                          <div className="space-y-4">
                            {getSubjectGapsBreakdown().map((sec) => {
                              const isWeak = sec.pct < 70;
                              return (
                                <div key={sec.code} className="space-y-1 text-xs">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-white block">{sec.name} <span className="text-[#8e9299] text-[8.5px] font-mono font-normal">({sec.correct}/{sec.total})</span></span>
                                      <span className="text-[9px] leading-relaxed text-[#8e9299] italic block">{sec.description}</span>
                                    </div>
                                    <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wide ${isWeak ? "text-rose-400 bg-rose-500/10 border border-rose-500/20 animate-pulse" : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"}`}>
                                      {sec.pct}% {isWeak ? "WEAK" : "MASTERED"}
                                    </span>
                                  </div>
                                  <div className="relative w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                    <div 
                                      className={`absolute h-full transition-all duration-500 ${isWeak ? "bg-rose-500" : "bg-emerald-500"}`} 
                                      style={{ width: `${sec.pct}%` }}
                                    />
                                  </div>

                                  {isWeak && (
                                    <div className="bg-[#1c1416]/50 border border-rose-500/10 rounded-lg p-2.5 text-[9.5px] text-rose-300 leading-relaxed font-mono flex items-start gap-1.5">
                                      <AlertTriangle size={12} className="text-rose-400 shrink-0 mt-0.5" />
                                      <div>
                                        <strong>Diagnostic Advisory:</strong> Your score exhibits critical knowledge gaps below ARDMS limits. You MUST launch the corresponding physics playground simulator:
                                        {sec.code === "PHYS" && <span className="text-white bg-slate-800 px-1 py-0.2 rounded font-bold mx-1">Wave Basics / Attenuation</span>}
                                        {sec.code === "XMTR" && <span className="text-white bg-slate-800 px-1 py-0.2 rounded font-bold mx-1">Transducer Layers</span>}
                                        {sec.code === "INST" && <span className="text-white bg-slate-800 px-1 py-0.2 rounded font-bold mx-1">TGC Sliders &amp; Resolution</span>}
                                        {sec.code === "DOPP" && <span className="text-white bg-slate-800 px-1 py-0.2 rounded font-bold mx-1">Doppler Math &amp; Spectral Canvas</span>}
                                        {sec.code === "SAFE" && <span className="text-white bg-slate-800 px-1 py-0.2 rounded font-bold mx-1">Safety &amp; Bioeffects Playbook</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* HOLOGRAPHIC DIGITAL CERTIFICATE FOR HIGH SUCCESS */}
                        {(300 + (getCorrectCount() / shuffledQuestions.length) * 400) >= 555 && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-tr from-[#162725] to-[#141d24] border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden flex flex-col justify-center items-center text-sans mt-6"
                          >
                            <span className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#00d1ff] filter blur-[60px] opacity-15" />
                            <span className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-400 filter blur-[60px] opacity-15" />
                            
                            <Award className="text-emerald-400 shrink-0 animate-bounce" size={42} strokeWidth={1} />
                            
                            <div className="space-y-1">
                              <h4 className="text-sm font-mono font-extrabold text-[#00d1ff] tracking-widest uppercase">SPI BOARD READINESS VERIFIED</h4>
                              <p className="text-xs text-[#8e9299]">This certifies that the candidate has compiled a scale score of <strong>{300 + Math.round((getCorrectCount() / shuffledQuestions.length) * 400)}</strong>, surpassing ARDMS passing boundaries.</p>
                            </div>

                            <div className="w-full max-w-sm space-y-2">
                              <input 
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Enter Your Professional Name (e.g. Sarah Connor, RDCS)"
                                className="w-full text-center text-xs font-mono bg-black/40 border border-white/10 rounded-lg py-2 text-white focus:border-emerald-500 outline-none"
                              />
                            </div>

                            <div className="border border-emerald-500/10 bg-black/40 px-6 py-4 rounded-xl max-w-md space-y-1 font-serif text-[11px] leading-relaxed italic text-[#e2e8f0]">
                              <strong>Holographic Credentials ID:</strong> {user?.uid || "SANDBOX_CANDIDATE"}_SPI_{Math.floor(Math.random() * 900000 + 100000)}
                              <p className="text-[10px] text-[#8e9299] font-sans mt-1">Ready to challenge the ARDMS board. Show this scorecard to peers to benchmark physics competencies!</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Interactive Retry option footer */}
                        <div className="flex border-t border-white/5 pt-6 gap-4">
                          <button
                            type="button"
                            onClick={resetExamMode}
                            className="flex-1 py-3 bg-[#111215] border border-white/10 text-slate-300 font-mono text-[10px] font-bold uppercase rounded-xl hover:bg-[#1a1c22] transition-colors"
                          >
                            Return to Dashboard
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => startExam(examMode)}
                            className="flex-1 py-3 bg-emerald-500 text-black font-mono text-[10px] font-bold uppercase rounded-xl hover:bg-emerald-400 transition-all shadow-lg"
                          >
                            ↻ Start Fresh Attempt
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* SCENARIO B: ACTIVE QUESTION SCREEN */
                      <motion.div
                        key="exam-active-q"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: -20 }}
                        className="bg-[#14161d] border border-white/5 rounded-2xl p-5 md:p-8 space-y-6 md:space-y-7 shadow-2xl relative"
                      >
                        {/* Domain Code Indicator */}
                        <div className="flex justify-between items-center text-[9px] font-mono text-[#8e9299]">
                          <span className="px-2 py-0.5 rounded bg-white/[0.02] border border-white/5 text-[#00d1ff]">
                            {DOMAIN_DETAILS[shuffledQuestions[currentExamIdx]?.domainCode as keyof typeof DOMAIN_DETAILS]?.name || "Physical Principles"}
                          </span>
                          <span>QUESTION {(currentExamIdx + 1).toString().padStart(2, '0')} OF {shuffledQuestions.length}</span>
                        </div>

                        {/* Question Text in serif */}
                        <div className="space-y-4">
                          <h4 className="text-base sm:text-xl font-serif italic text-white leading-relaxed select-text">
                            {shuffledQuestions[currentExamIdx]?.q}
                          </h4>
                          
                          {/* Options Block */}
                          <div className="flex flex-col gap-2.5">
                            {shuffledQuestions[currentExamIdx]?.opts.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[currentExamIdx] === optIdx;
                              const isCorrect = shuffledQuestions[currentExamIdx]?.a === optIdx;
                              
                              let buttonStyle = "bg-[#0e0f12] border-white/5 text-[#8e9299] hover:bg-[#181a20] hover:border-white/10";
                              
                              if (examMode === 'tutor' && revealTutorAnswer) {
                                if (isCorrect) {
                                  buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold z-10 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                                } else if (isSelected) {
                                  buttonStyle = "bg-rose-500/10 border-rose-500 text-rose-400 z-10 font-medium";
                                }
                              } else if (isSelected) {
                                buttonStyle = "bg-[#00d1ff]/10 border-[#00d1ff] text-white font-medium z-10 shadow-[0_0_15px_rgba(0,209,255,0.1)]";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => {
                                    if (examMode === 'tutor' && revealTutorAnswer) return; // locked in tutor
                                    setSelectedAnswers({
                                      ...selectedAnswers,
                                      [currentExamIdx]: optIdx
                                    });
                                  }}
                                  className={`text-left p-4 rounded-xl border text-xs sm:text-sm font-sans transition-all flex items-center justify-between gap-4 cursor-pointer relative ${buttonStyle}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-md border border-white/5 bg-black/40 text-[9px] font-mono font-bold flex items-center justify-center text-slate-400">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="text-slate-200">{opt}</span>
                                  </div>
                                  
                                  {examMode === 'tutor' && revealTutorAnswer && isCorrect && (
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                      Pass Key
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active feedback info panel for Interactive Tutor Mode */}
                        {examMode === 'tutor' && (
                          <div className="space-y-3">
                            {!revealTutorAnswer ? (
                              <button
                                type="button"
                                disabled={selectedAnswers[currentExamIdx] === undefined}
                                onClick={() => setRevealTutorAnswer(true)}
                                className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-semibold text-[10px] font-mono tracking-wider transition-all rounded-lg text-center uppercase cursor-pointer"
                              >
                                View Tutoring Verification
                              </button>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0e1013] border border-white/5 rounded-xl p-4 space-y-2"
                              >
                                <span className="text-[8.5px] font-mono text-[#00d1ff] tracking-widest uppercase block font-bold">Scientific Rationale</span>
                                <p className="text-[11.5px] text-[#8e9299] leading-relaxed italic">
                                  {shuffledQuestions[currentExamIdx]?.expl}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Navigation Footer for quiz controls */}
                        <div className="flex border-t border-white/5 pt-5 justify-between items-center bg-transparent gap-4 select-none">
                          <button
                            type="button"
                            disabled={currentExamIdx === 0}
                            onClick={() => {
                              setCurrentExamIdx(currentExamIdx - 1);
                              setRevealTutorAnswer(false);
                            }}
                            className="px-4 py-2 bg-[#0c0d10] border border-white/15 text-[#8e9299] hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ◄ Prev Topic
                          </button>

                          {currentExamIdx < shuffledQuestions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentExamIdx(currentExamIdx + 1);
                                setRevealTutorAnswer(false);
                              }}
                              className="px-4 py-2 bg-[#00d1ff] text-black hover:bg-[#00b2db] rounded-lg text-[10px] font-mono font-bold uppercase transition-all shadow-md"
                            >
                              Next Topic ►
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Final topic reached! Compile assessment ledger?")) {
                                  submitExam();
                                }
                              }}
                              className="px-4 py-2 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shadow-md"
                            >
                              Complete Assess ✓
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: SPACED-REPETITION FLASHCARD SYSTEM */}
        {activeTab === 'flashcards' && (
          <motion.div
            key="flashcards-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full gap-6 shrink-0"
          >
            {/* Filter segments & total readout */}
            <div className="w-full flex flex-col sm:flex-row gap-4 justify-between items-center border border-white/5 bg-[#16181d] rounded-2xl p-4 shrink-0 mt-2 select-none">
              
              <div className="flex items-center gap-1.5 shrink-0">
                <BookmarkCheck size={14} className="text-[#00d1ff]" />
                <span className="text-[9.5px] font-mono text-[#8e9299] uppercase tracking-wider font-bold">Drill Repetition Mastery Filter:</span>
              </div>

              <div className="flex bg-[#0c0d10] p-1 border border-white/5 rounded-xl gap-0.5 text-[9px] font-mono uppercase font-bold text-slate-400 shrink-0">
                {['all', 'unmastered', 'reviewing', 'mastered'].map((f) => {
                  const count = f === 'all' 
                    ? SPI_EXAM_QUESTIONS.length 
                    : SPI_EXAM_QUESTIONS.filter((_, idx) => (masteryData[idx] || 'unmastered') === f).length;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFlashcardFilter(f as any);
                        setFlashcardIdx(0);
                        setIsFlipped(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        flashcardFilter === f 
                          ? "bg-slate-800 text-white font-bold" 
                          : "hover:text-white"
                      }`}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flashcard Render Module */}
            {activeFlashcards.length > 0 ? (
              <div className="w-full h-[360px] xs:h-[300px] md:h-[280px] [perspective:1000px] relative group shrink-0 select-text">
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-full relative cursor-pointer duration-500 ease-out select-none [transform-style:preserve-3d]"
                  style={{ 
                     transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                     transitionProperty: 'transform'
                  }}
                >
                  {/* FRONT SIDE (Question) */}
                  <div className="absolute inset-0 rounded-[24px] border-2 bg-[#16181d] border-white/5 hover:border-[#00d1ff]/50 flex flex-col p-6 md:p-10 justify-between overflow-y-auto shadow-2xl transition-all [backface-visibility:hidden]">
                    <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                      <span className="text-[8.5px] font-mono text-[#8e9299] uppercase tracking-wider">
                        Domain: {displayFlashcard.category}
                      </span>
                      <span className="text-[8px] font-mono uppercase font-extrabold text-[#00d1ff] bg-[#00d1ff]/10 border border-[#00d1ff]/20 px-2 py-0.5 rounded">
                        {masteryData[displayIdxInFullList] || 'unmastered'}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center text-center py-4">
                      <span className="text-base sm:text-lg md:text-xl font-serif italic text-white leading-relaxed">
                        {displayFlashcard.q}
                      </span>
                    </div>

                    <div className="text-center text-[9px] text-[#00d1ff] font-mono font-bold tracking-widest animate-pulse h-fit shrink-0">
                      CLICK TO FLIP REVEAL
                    </div>
                  </div>

                  {/* BACK SIDE (Answer & rationales) */}
                  <div 
                    className="absolute inset-0 rounded-[24px] border-2 bg-[#191b22] border-emerald-500/30 flex flex-col p-6 md:p-10 justify-between overflow-y-auto shadow-2xl transition-all [backface-visibility:hidden]"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                      <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-wider">
                        Acoustic Answer
                      </span>
                      <span className="text-[8px] font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2' py-0.5 rounded">
                        ID_0x{(displayIdxInFullList + 21).toString(16)}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center py-4 text-center md:text-left gap-2">
                      <h4 className="text-md sm:text-lg md:text-xl font-serif text-white font-extrabold leading-tight">
                        {displayFlashcard.opts[displayFlashcard.a]}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[#8e9299] italic leading-relaxed mt-1">
                        {displayFlashcard.expl}
                      </p>
                    </div>

                    <span className="text-[8px] text-[#8e9299] font-mono uppercase tracking-wider block text-center">
                      Select Spaced Status below to cycle
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#16181d] border border-white/5 rounded-2xl p-12 text-center max-w-lg space-y-4">
                <BookmarkCheck size={32} className="text-slate-400 mx-auto" />
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Empty Mastery Bucket</h4>
                <p className="text-xs text-[#8e9299]">There are no flashcards indexed under: <span className="font-bold text-white font-mono uppercase">{flashcardFilter}</span> status. Select another filter above to drill topics!</p>
              </div>
            )}

            {/* Flashcard controller spaced-repetition actions */}
            {activeFlashcards.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 w-full select-none justify-center">
                
                {/* Manual cycle backup */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIdx((prev) => (prev - 1 + activeFlashcards.length) % activeFlashcards.length);
                  }}
                  className="px-6 py-2 bg-white/[0.02] border border-white/10 hover:bg-white/5 text-slate-300 font-mono text-[9px] font-bold uppercase rounded-xl transition-all"
                >
                  ◄ Previous Card
                </button>

                <div className="bg-[#0e1013] border border-white/5 rounded-xl p-1.5 flex gap-1 items-center font-mono text-[9px] font-bold uppercase z-10">
                  <button
                    type="button"
                    onClick={() => updateMastery(displayIdxInFullList, 'unmastered')}
                    className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-rose-400 hover:bg-red-500 hover:text-black transition-all cursor-pointer"
                  >
                    Unmastered
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMastery(displayIdxInFullList, 'reviewing')}
                    className="px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                  >
                    Reviewing
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMastery(displayIdxInFullList, 'mastered')}
                    className="px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                  >
                    ✓ Mastered
                  </button>
                </div>

                <button
                  type="button"
                  onClick={triggerFlashcardNext}
                  className="px-6 py-2 bg-white/[0.02] border border-white/10 hover:bg-white/5 text-slate-300 font-mono text-[9px] font-bold uppercase rounded-xl transition-all"
                >
                  Next Card ►
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: THE PREPRY VS OUTLET HUD COMPARATOR */}
        {activeTab === 'prepry-kill' && (
          <motion.div
            key="prepry-kill-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-6"
          >
            {/* Explanatory introduction */}
            <div className="bg-[#16181d] border border-white/10 rounded-2xl p-6 space-y-3 shadow-xl">
              <span className="text-[9px] font-mono tracking-widest text-[#00d1ff] uppercase font-bold blockh-fit">WHY PAY $49/MONTH TO PREPRY?</span>
              <h3 className="text-xl font-serif text-white italic">Competitive Value Proposition Analysis</h3>
              <p className="text-xs text-[#8e9299] leading-relaxed">
                Paid apps like Prepry charge monthly subscriptions merely to present static multi-choice question lists. Our platform delivers a vastly superior, multi-dimensional clinical cockpit absolutely free. Compare features below:
              </p>
            </div>

            {/* Bento score comparative matrices */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Feature A: Pricing */}
              <div className="bg-[#0e1013] border border-emerald-500/20 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 01 / Financial Assessment</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Platform Pricing Comparison</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    Prepry charges a flat <strong>$49 per month</strong> recurring subscription to study SPI content. Our system is fully hosted in the Google Cloud Sandbox <strong>completely free of charge</strong>, protecting clinical students.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>Savings Ratio</span>
                  <span>100% Free Forever</span>
                </div>
              </div>

              {/* Feature B: Real Reactive physics canvas */}
              <div className="bg-[#0e1013] border border-[#00d1ff]/20 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00d1ff] animate-pulse" />
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 02 / Pedagogical Tech</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Clinical Physics Sandboxes</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    Prepry relies on abstract textbooks and simple questions. Our workstation hosts live interactive physics sandboxes: sweep PZT thicknesses, modulate PRFs to observe aliasing, drag TGC amplifiers to defeat tissue attenuation, and simulate Doppler angles!
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-[#00d1ff] pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>Visualization Depth</span>
                  <span>Interactive Real-time Canvas</span>
                </div>
              </div>

              {/* Feature C: Multi-Style Audio Narratives */}
              <div className="bg-[#0e1013] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 03 / Narratives Layout</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Audio Textbook Narrations</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    Most prep apps have zero native voice tutoring. Our platform features an elegant dual-voice audio narration engine. You can listen to full chapter readings in the voice of professional coaches.
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-amber-400 pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>Acoustic Sync</span>
                  <span>Dynamic Narrator Panel</span>
                </div>
              </div>

              {/* Feature D: Quest systems */}
              <div className="bg-[#0e1013] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 04 / Gamification</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quest Station Accents</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    Traditional apps are clinical and boring. Our Quest Station turns learning into an immersive gauntlet: complete diagnostic operations to earn Acoustic Coins, spend tokens in the utility shop, climb real cohort leaderboards, and lock badges!
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-300 pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>Core Mechanic</span>
                  <span>XP Level & Token Store</span>
                </div>
              </div>

              {/* Feature E: Live external archives */}
              <div className="bg-[#0e1013] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 05 / Research</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">SonoWorld Clinical Portal</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    Study beyond static limits. Our live interactive SonoWorld Portal embeds full historical clinical ultrasound syllabi, transducer sound acoustics models, Doppler webinars, and obstetric scanning guidelines via secure iframe tunnels.
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-300 pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>External Sync</span>
                  <span>Secure IFrame Proxy</span>
                </div>
              </div>

              {/* Feature F: Absolute board compliance */}
              <div className="bg-[#0e1013] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-lg relative">
                <div className="space-y-3">
                  <span className="text-[8px] font-mono uppercase text-[#8e9299] tracking-wider block font-bold">Protocol 06 / Registry Align</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Board Content Compliance</h4>
                  <p className="text-[11px] text-[#8e9299] leading-relaxed">
                    All our questions represent exact mathematical limits on sound waves (wavelength formulas, impedance matching ratios, overall vs output gain safeties, Nyquist thresholds, and stable/transient cavitation bioeffects) aligned with official ARDMS guidelines.
                  </p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-300 pt-4 mt-4 border-t border-white/[0.03] flex justify-between">
                  <span>Compliance Scale</span>
                  <span>100% ARDMS Guided</span>
                </div>
              </div>

            </div>

            {/* CTA to run the app */}
            <div className="bg-[#1c1813] border border-amber-500/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-2 select-none">
              <div className="space-y-1.5 flex-1">
                <span className="text-[9px] font-mono font-extrabold text-[#00d1ff] tracking-widest uppercase block leading-normal">COMPETITOR EDGE ENGAGED</span>
                <p className="text-xs text-[#8e9299] leading-relaxed">
                  Avoid paying hundreds of yearly dollars. Master clinical sonographics with our interactive sandboxes, digital mock simulators, and customized syllabus notes. Set your custom schedule in the master roadmap and conquer the board!
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setViewMode?.('quest_station')}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-[10px] font-mono tracking-widest uppercase rounded-xl hover:scale-105 hover:bg-amber-400 cursor-pointer shadow transition-all shrink-0"
              >
                Go to Quest Station
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* FOOTER METADATA COCKPIT */}
      <div className="w-full bg-[#0c0d10] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 select-none">
        <div className="flex gap-7 shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1.5">Sandbox Mode</span>
            <span className="#00d1ff font-mono text-[10.5px] font-bold text-emerald-400">ACTIVE: FREE_PREP_PORTAL</span>
          </div>
          <div className="flex flex-col border-l border-white/5 pl-7">
            <span className="text-[8px] text-[#8e9299] uppercase font-bold tracking-widest mb-1.5 font-mono">Sim Calibration</span>
            <span className="text-white font-mono text-[10.5px] font-medium">SPI_BOARD_SCALED_SCORE_300_700</span>
          </div>
        </div>
        <div className="text-[10px] text-[#8e9299] italic text-center md:text-right max-w-xs leading-normal">
          "Ultrasound diagnostic capabilities are verified by rigorous physical comprehension, not monthly paywalls."
        </div>
      </div>

    </motion.div>
  );
}
