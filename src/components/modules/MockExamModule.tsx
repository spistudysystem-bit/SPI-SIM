import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, RotateCcw, Clock, AlertCircle, Bookmark, ArrowRight, LayoutGrid, Check } from 'lucide-react';
import { MOCK_EXAM_QUESTIONS } from '../../constants/mockExamQuestions';
import { motion, AnimatePresence } from 'framer-motion';

export default function MockExamModule({ setViewMode }: { setViewMode: (mode: any) => void }) {
  const [examState, setExamState] = useState<'intro' | 'running' | 'review'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    let timer: any;
    if (examState === 'running' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && examState === 'running') {
      submitExam();
    }
    return () => clearInterval(timer);
  }, [examState, timeRemaining]);

  const startExam = () => {
    setExamState('running');
    setTimeRemaining(7200);
    setAnswers({});
    setBookmarks({});
    setCurrentIndex(0);
  };

  const submitExam = () => {
    let correct = 0;
    Object.keys(answers).forEach((qIndexStr) => {
      const qIndex = parseInt(qIndexStr);
      if (answers[qIndex] === MOCK_EXAM_QUESTIONS[qIndex].correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
    setExamState('review');
    setShowGrid(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optIndex }));
  };

  const toggleBookmark = () => {
    setBookmarks(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  if (examState === 'intro') {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[70vh] relative">
        {/* Decorative background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.03),transparent_50%)] pointer-events-none" />

        <div className="bg-[#0e1014] border-2 border-yellow-500/80 p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-2xl w-full relative overflow-hidden">
          {/* Repeating hazard stripe border trim */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_8px,#000000_8px,#000000_16px)] animate-pulse" />
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_8px,#000000_8px,#000000_16px)] animate-pulse" />
          
          <div className="text-[8px] font-mono font-bold tracking-widest text-[#8e9299] mb-2 uppercase flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            SECURE LIVE LINK_OUT_PRF: COVERT EXAM
          </div>

          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] border border-yellow-500/30">
            <Clock size={36} className="text-yellow-500 animate-pulse" />
          </div>

          <h2 className="text-xs font-mono font-black tracking-widest text-yellow-500 uppercase">U.U.U. SPECIAL OPERATIONS</h2>
          <h1 className="text-3xl font-black text-white uppercase mt-1 tracking-tight leading-none font-mono">
            SPI <span className="text-yellow-400">EXAM</span> REVIEW SUITE
          </h1>
          <p className="text-xs text-[#8e9299] mt-4 mb-8 leading-relaxed max-w-lg mx-auto font-sans font-medium">
            This module provides a randomized full-length, 110-question covert simulated exam mirroring the strict outlines of the ARDMS SPI board physics registry. 
            Keep your focus sharp, your acoustic formulas calibrated, and lock down your credentials.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-black/45 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-yellow-500/20 transition-all">
              <div className="text-[8.5px] uppercase text-[#8e9299] font-mono tracking-wider font-bold mb-1">Time Limit</div>
              <div className="text-xl font-black text-white font-mono">120 MINUTES</div>
            </div>
            <div className="bg-black/45 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-cyan-500/20 transition-all">
              <div className="text-[8.5px] uppercase text-[#8e9299] font-mono tracking-wider font-bold mb-1">Total Boards Questions</div>
              <div className="text-xl font-black text-white font-mono">110 OUTLINES</div>
            </div>
          </div>

          <button
            onClick={startExam}
            className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-3 font-mono cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            INITIALIZE EXAM PROTOCOL
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const currentQ = MOCK_EXAM_QUESTIONS[currentIndex];

  if (examState === 'running') {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col h-full z-10">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-[#13161c] border border-[#2d3139] rounded-xl p-3 sm:p-4 mb-4 shadow-lg shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'bg-white/5 text-[#8e9299] hover:text-white'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-[#8e9299] font-mono">Progress</span>
              <span className="font-bold text-white text-sm sm:text-base">{answeredCount} / 110 Answered</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold ${timeRemaining < 600 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-black/30 text-[#00d1ff]'}`}>
              <Clock size={16} />
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={() => submitExam()}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Question Navigator Grid (sliding or flex based on state) */}
          {showGrid && (
            <div className="w-[300px] shrink-0 bg-[#13161c] border border-[#2d3139] rounded-xl p-4 overflow-y-auto hidden md:block">
              <div className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Navigator</div>
              <div className="grid grid-cols-5 gap-2">
                {MOCK_EXAM_QUESTIONS.map((q, i) => {
                  const isCurrent = i === currentIndex;
                  const isAnswered = answers[i] !== undefined;
                  const isBookmarked = bookmarks[i];
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-10 text-xs font-mono font-bold rounded-lg border transition-all relative ${isCurrent ? 'border-[#00d1ff] bg-[#00d1ff]/10 text-white' : isAnswered ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-[#2d3139] bg-black/20 text-[#8e9299] hover:bg-white/5'}`}
                    >
                      {i + 1}
                      {isBookmarked && <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Question Area */}
          <div className="flex-1 bg-[#13161c] border border-[#2d3139] rounded-xl p-4 sm:p-6 md:p-8 flex flex-col overflow-y-auto relative shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[#00d1ff] font-bold text-xl">Question {currentIndex + 1}</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] uppercase tracking-wider text-[#8e9299]">
                    {currentQ?.category || 'General'}
                  </span>
                </div>
                <button
                  onClick={toggleBookmark}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${bookmarks[currentIndex] ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/30 border-[#2d3139] text-[#8e9299] hover:text-white'}`}
                >
                  <Bookmark size={14} className={bookmarks[currentIndex] ? 'fill-current' : ''} />
                  {bookmarks[currentIndex] ? 'Flagged' : 'Flag'}
                </button>
             </div>

             <h2 className="text-lg md:text-xl text-white font-medium mb-6 leading-relaxed">
               {currentQ?.text}
             </h2>

             {/* Media / Diagram rendering placeholder if question has one */}
             {currentQ?.mediaType === 'image' && (
                <div className="w-full max-w-lg mx-auto bg-black/40 border-2 border-dashed border-[#2d3139] rounded-xl p-4 mb-6 flex items-center justify-center min-h-[200px]">
                  <img src={currentQ?.mediaData} alt="Diagram" className="max-w-full h-auto rounded-lg" />
                </div>
             )}

             <div className="space-y-3 mt-auto">
               {currentQ?.options.map((opt, oIdx) => {
                 const isSelected = answers[currentIndex] === oIdx;
                 return (
                   <button
                     key={oIdx}
                     onClick={() => handleOptionSelect(oIdx)}
                     className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected ? 'border-[#00d1ff] bg-[#00d1ff]/10 shadow-[0_0_15px_rgba(0,209,255,0.15)]' : 'border-[#2d3139] bg-black/20 hover:border-[#8e9299]/50 hover:bg-white/5'}`}
                   >
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#00d1ff] bg-[#00d1ff]' : 'border-[#525969] group-hover:border-[#8e9299]'}`}>
                       {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                     </div>
                     <span className={`text-base ${isSelected ? 'text-white' : 'text-[#e0e0e0]'}`}>{opt}</span>
                   </button>
                 );
               })}
             </div>

             <div className="flex items-center gap-4 mt-8 pt-6 border-t border-[#2d3139]">
               <button
                 onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                 disabled={currentIndex === 0}
                 className="px-6 py-2.5 rounded-lg border border-[#2d3139] text-white hover:bg-white/5 disabled:opacity-30 transition-all font-bold uppercase tracking-wider text-[11px]"
               >
                 Previous
               </button>
               <div className="flex-1" />
               <button
                 onClick={() => {
                   if (currentIndex < MOCK_EXAM_QUESTIONS.length - 1) {
                     setCurrentIndex(prev => prev + 1);
                   } else {
                     submitExam();
                   }
                 }}
                 className="px-6 py-2.5 bg-[#00d1ff] text-black rounded-lg hover:bg-[#00b8e6] transition-all font-bold uppercase tracking-wider text-[11px] shadow-[0_0_15px_rgba(0,209,255,0.3)] flex items-center gap-2"
               >
                 {currentIndex === MOCK_EXAM_QUESTIONS.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'review') {
    const percentage = Math.round((score / MOCK_EXAM_QUESTIONS.length) * 100);
    const passed = percentage >= 75; // Standard passing score is often ~70-75% scale

    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col h-full z-10 overflow-y-auto">
        
        {/* Score Header */}
        <div className="bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 md:p-10 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-8">
            <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-8 ${passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className={passed ? 'text-emerald-500' : 'text-red-500'} strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * percentage / 100)} />
              </svg>
              <div className="text-center">
                <div className={`text-4xl font-black ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{percentage}%</div>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">{passed ? 'Passed' : 'Needs Improvement'}</h2>
              <div className="text-[#8e9299] text-sm mt-1">{score} of 110 Correct</div>
              {passed ? (
                <div className="flex items-center gap-2 text-emerald-400 mt-2 text-xs font-bold font-mono tracking-wider"><CheckCircle size={14} /> BOARD REGISTRY READY</div>
              ) : (
                <div className="flex items-center gap-2 text-red-400 mt-2 text-xs font-bold font-mono tracking-wider"><AlertCircle size={14} /> REVIEW REQUIRED</div>
              )}
            </div>
          </div>

          <button
            onClick={() => setExamState('intro')}
            className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2"
          >
            <RotateCcw size={16} /> Retake Exam
          </button>
        </div>

        {/* detailed review */}
        <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">Question Review</h3>
        <div className="space-y-6">
          {MOCK_EXAM_QUESTIONS.map((q, i) => {
            const chosenIndex = answers[i];
            const isCorrect = chosenIndex === q.correctAnswer;
            
            return (
              <div key={q.id} className={`bg-[#13161c] border ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'} rounded-2xl p-6 shadow-xl`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isCorrect ? <Check size={18} /> : <XCircle size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[#8e9299] font-mono text-xs uppercase tracking-wider font-bold">Question {i + 1}</span>
                       <span className="px-2 py-0.5 bg-black/40 rounded text-[9px] text-[#5c5f66] uppercase">{q.category}</span>
                    </div>
                    <h4 className="text-white text-lg font-medium mb-4">{q.text}</h4>
                    {q.mediaType === 'image' && (
                       <div className="w-full max-w-sm mb-4 border-2 border-dashed border-[#2d3139] rounded-xl p-2 bg-black/30 relative overflow-hidden">
                         <img src={q.mediaData} alt="Diagram" className="w-full rounded-lg relative z-10" />
                         {/* Animated Scanline Effect */}
                         <motion.div 
                           initial={{ top: '-10%' }}
                           animate={{ top: '110%' }}
                           transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                           className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[#00d1ff]/30 to-transparent z-20 pointer-events-none"
                         />
                         <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-md text-[8px] uppercase tracking-widest text-cyan-400 font-mono z-30 flex items-center gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                           Scan View
                         </div>
                       </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = chosenIndex === oIdx;
                    const isActuallyCorrect = q.correctAnswer === oIdx;
                    let style = 'border-[#2d3139] bg-black/20 text-[#8e9299]';
                    if (isActuallyCorrect) style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                    else if (isSelected) style = 'border-red-500/50 bg-red-500/10 text-red-300';

                    return (
                      <div key={oIdx} className={`p-4 border-2 rounded-xl text-sm transition-all ${style}`}>
                        {opt} {isActuallyCorrect && <CheckCircle size={14} className="inline ml-2 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 p-5 bg-[#0b0c10] border border-[#2d3139] shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-xl flex items-start gap-4 text-[#e0e0e0] leading-relaxed relative overflow-hidden group"
                >
                   <motion.div 
                     initial={{ height: 0 }}
                     whileInView={{ height: '100%' }}
                     transition={{ duration: 0.6, delay: 0.2 }}
                     className="absolute top-0 left-0 w-1.5 bg-gradient-to-b from-[#00d1ff] to-blue-600 rounded-l-xl" 
                   />
                   <div className="flex-1 pl-2">
                     <span className="flex items-center gap-2 font-bold text-[#00d1ff] uppercase tracking-widest text-[10px] mb-3">
                       <Play size={12} className="text-[#00d1ff] fill-[#00d1ff]/50" /> Concept Explainer
                     </span>
                     <div className="text-sm md:text-base text-slate-300 leading-relaxed font-light">
                       {q.explanation}
                     </div>
                   </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
