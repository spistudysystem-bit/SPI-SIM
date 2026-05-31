
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  X, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Terminal,
  Activity,
  Mic2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { LECTURES } from '../../constants/lectures';

interface NarratorPanelProps {
  lectureId: string;
  onClose: () => void;
  narrator: {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    progress: number;
  };
}

// --- Helper Components for Visual Aids ---
const VisualViewport = ({ 
  lecture, 
  currentParagraphIndex, 
  isSpeaking 
}: { 
  lecture: any, 
  currentParagraphIndex: number,
  isSpeaking: boolean 
}) => {
  const currentImage = lecture.images?.find((img: any) => img.triggerParagraph === currentParagraphIndex) || 
                      lecture.images?.[0];

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl border border-white/10 overflow-hidden group mb-8">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage?.url || 'default'}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 flex items-center justify-center p-4"
        >
          {currentImage ? (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Simulated Diagnostic Diagram */}
                <div className="w-full h-full relative border border-[#00d1ff]/20 bg-[#00d1ff]/5 rounded-lg flex items-center justify-center">
                   <Activity size={48} className="text-[#00d1ff]/30 absolute animate-pulse" />
                   
                   {/* Abstract CSS Visuals based on ID */}
                   <div className="text-center px-6">
                      <div className="text-[10px] font-mono text-[#00d1ff] uppercase tracking-[0.3em] mb-4">Diagnostic_Asset_{currentImage.url.toUpperCase()}</div>
                      <div className="p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-sm">
                         <p className="text-sm font-bold text-white mb-2">{currentImage.caption}</p>
                         <p className="text-[10px] text-[#8e9299] italic uppercase tracking-wider">Visual aid synchronized with current narrative module</p>
                      </div>
                   </div>

                   {/* Corner Accents */}
                   <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00d1ff]" />
                   <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#00d1ff]" />
                   <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#00d1ff]" />
                   <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#00d1ff]" />
                </div>
             </div>
          ) : (
            <div className="text-center">
               <Terminal size={32} className="text-white/10 mx-auto mb-4" />
               <div className="text-[10px] font-mono text-[#8e9299] uppercase tracking-widest">Calibration_Stream_Active</div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* HUD Info */}
      <div className="absolute top-3 left-3 flex gap-2">
        <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/5 text-[8px] font-mono text-[#00d1ff]">
          RES: 1080P
        </div>
        <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/5 text-[8px] font-mono text-[#00d1ff]">
          LIVE: SYNC
        </div>
      </div>

      <div className="absolute bottom-3 right-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-[#8e9299]'}`} />
          <span className="text-[8px] font-mono text-white/80 uppercase tracking-widest">{isSpeaking ? 'RECORDING' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};

export default function NarratorPanel({ lectureId, onClose, narrator }: NarratorPanelProps) {
  const lecture = LECTURES.find(l => l.id === lectureId);
  const { speak, stop, isSpeaking, progress } = narrator;
  const [showAssessment, setShowAssessment] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Derive current paragraph index based on progress
  const paragraphs = lecture?.script.split('\n\n').filter(p => p.trim()) || [];
  const currentParagraphIndex = Math.min(
    Math.floor((progress / 100) * paragraphs.length),
    paragraphs.length - 1
  );

  // Auto-scroll logic for "Teleprompter" feel
  useEffect(() => {
    if (isSpeaking && scrollRef.current && !showAssessment) {
      const el = scrollRef.current;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      el.scrollTo({
        top: (progress / 100) * scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [progress, isSpeaking, showAssessment]);

  if (!lecture) return null;

  const toggleAnswer = (index: number) => {
    setRevealedAnswers(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const desktopAnimation = { 
    x: 0, 
    opacity: 1,
    height: isMinimized ? 'auto' : 'calc(100vh - 150px)',
    width: isMinimized ? '280px' : '400px',
    bottom: isMinimized ? 24 : 'auto',
    top: isMinimized ? 'auto' : 96,
    right: 24,
    position: 'fixed' as const
  };

  const mobileAnimation = {
    x: 0,
    y: 0,
    opacity: 1,
    height: isMinimized ? '80px' : '85vh',
    width: '100vw',
    bottom: 0,
    top: 'auto',
    right: 0,
    position: 'fixed' as const,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]" ref={constraintsRef}>
      <motion.div 
        drag={isMobile ? false : true}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
        animate={isMobile ? mobileAnimation : desktopAnimation}
        exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] pointer-events-auto"
      >
        <div className={`flex-1 bg-[#0c0d10]/95 backdrop-blur-2xl border border-white/10 rounded-t-2xl ${!isMobile ? 'rounded-b-2xl' : ''} flex flex-col overflow-hidden relative transition-all duration-500`}>
          {/* Glow Effects */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent opacity-50" />
          {!isMinimized && !isMobile && <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00d1ff]/10 blur-[100px] rounded-full" />}
          
          {/* Header - Drag Handle */}
          <div 
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button')) {
                return;
              }
              if (!isMobile) {
                dragControls.start(e);
              }
            }}
            onClick={() => isMobile && isMinimized && setIsMinimized(false)}
            className={`p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] ${isMobile && isMinimized ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-grab active:cursor-grabbing'} touch-none shrink-0`}
          >
            <div className="flex items-center gap-3">
              <div className={`relative p-2 rounded-lg transition-all duration-500 ${isSpeaking ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'bg-white/5 text-[#8e9299]'}`}>
                {isMinimized ? <Volume2 size={14} /> : (isSpeaking ? <Mic2 size={16} className="animate-pulse" /> : <VolumeX size={16} />)}
              </div>
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Terminal size={10} className="text-[#00d1ff]" />
                    <span className="text-[8px] font-mono text-[#00d1ff] uppercase tracking-[0.2em] font-bold">{isMinimized ? 'Lecture_Paused' : 'Module_Active'}</span>
                  </div>
                  <h2 className="text-xs font-bold text-white tracking-tight leading-tight truncate max-w-[150px] sm:max-w-[240px]">{lecture.title}</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 select-none">
              {isMinimized && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    isSpeaking ? stop() : speak(lecture.script); 
                  }}
                  className="w-11 h-11 rounded-lg flex items-center justify-center bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20 hover:bg-[#00d1ff]/20 transition-all active:scale-95 shrink-0 mr-1"
                  title={isSpeaking ? "Pause" : "Play"}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-[#8e9299] hover:text-white transition-colors shrink-0"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); stop(); onClose(); }}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-[#8e9299] hover:text-red-400 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
  
          <AnimatePresence>
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {/* Visualizer Area */}
                <div className="h-12 border-b border-white/5 bg-black/40 flex items-center justify-center gap-1 overflow-hidden px-4 relative shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00d1ff_1px,transparent_1px)] [background-size:16px_16px]" />
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={isSpeaking ? { 
                        height: [2, 12, 6, 18, 4],
                        transition: { repeat: Infinity, duration: 0.5 + Math.random(), delay: i * 0.05 }
                      } : { height: 2 }}
                      className={`w-0.5 rounded-full ${isSpeaking ? 'bg-[#00d1ff]' : 'bg-white/10'}`}
                      style={{ opacity: 1 - Math.abs(i - 12) / 15 }}
                    />
                  ))}
                </div>
  
                {/* content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth">
                  <AnimatePresence mode="wait">
                    {!showAssessment ? (
                      <motion.div 
                        key="script"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <VisualViewport 
                          lecture={lecture} 
                          currentParagraphIndex={currentParagraphIndex} 
                          isSpeaking={isSpeaking} 
                        />

                        <div className="flex items-center gap-3 py-2 border-y border-white/5">
                          <Activity size={14} className="text-[#ffd700]" />
                          <span className="text-[10px] font-bold text-[#ffd700] uppercase tracking-widest">{lecture.category} PATHWAY</span>
                        </div>

                        <div className="space-y-6">
                          {paragraphs.map((para, i) => (
                            <motion.div 
                              key={i} 
                              className="text-[14px] leading-relaxed font-sans font-medium transition-all duration-700 relative"
                              animate={{ 
                                opacity: isSpeaking ? (currentParagraphIndex === i ? 1 : 0.4) : 1,
                                x: isSpeaking && currentParagraphIndex === i ? 8 : 0,
                                color: isSpeaking && currentParagraphIndex === i ? '#ffffff' : '#8e9299'
                              }}
                            >
                              {currentParagraphIndex === i && (
                                <motion.div 
                                  layoutId="para-indicator"
                                  className="absolute -left-4 top-0 bottom-0 w-1 bg-[#00d1ff] rounded-full shadow-[0_0_10px_#00d1ff]"
                                />
                              )}
                              {para.trim()}
                            </motion.div>
                          ))}
                        </div>

                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAssessment(true)}
                          className="w-full mt-12 py-4 bg-[#00d1ff] text-black rounded-xl text-[11px] uppercase font-black tracking-[0.2em] shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all flex items-center justify-center gap-3 group"
                        >
                          Knowledge Validation <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="assessment"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-8">
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                            <HelpCircle size={14} className="text-[#00d1ff]" /> Assessment Mode
                          </h3>
                          <p className="text-[10px] text-[#8e9299]">Validate your physics comprehension to proceed.</p>
                        </div>

                        {lecture.assessment.map((item, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                            className="group"
                          >
                            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 group-hover:border-white/20 transition-all cursor-pointer" onClick={() => toggleAnswer(i)}>
                              <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#8e9299] group-hover:text-white transition-colors">
                                  0{i + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-[13px] font-semibold text-white mb-4 leading-snug">{item.question}</div>
                                  
                                  <AnimatePresence>
                                    {revealedAnswers.includes(i) ? (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 p-4 bg-[#00d1ff]/10 rounded-xl border border-[#00d1ff]/20 flex gap-3">
                                          <CheckCircle2 size={16} className="text-[#00d1ff] shrink-0 mt-0.5" />
                                          <div className="text-[13px] text-[#00d1ff] font-medium italic">{item.answer}</div>
                                        </div>
                                      </motion.div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-[#8e9299] group-hover:text-[#00d1ff] transition-colors tracking-widest uppercase">
                                        Click to verify <ChevronRight size={12} />
                                      </div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        <button 
                          onClick={() => setShowAssessment(false)}
                          className="w-full mt-8 py-3 text-[10px] text-[#8e9299] hover:text-white transition-all uppercase tracking-[0.2em] font-bold"
                        >
                          Retake Lecture
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Area with Controls */}
                <div className="p-4 border-t border-white/5 bg-black/60 relative">
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#00d1ff] shadow-[0_0_10px_#00d1ff]"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'linear' }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest">Playback Output</span>
                      <span className="text-[10px] font-mono text-white/80">{isSpeaking ? 'TRANSMITTING...' : 'IDLE_WAIT'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); stop(); speak(lecture.script); }}
                        className="w-11 h-11 rounded-lg bg-white/5 text-[#8e9299] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                        title="Restart"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); isSpeaking ? stop() : speak(lecture.script); }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSpeaking ? 'bg-[#00d1ff]/25 text-[#00d1ff] border border-[#00d1ff]/40 shadow-[0_0_12px_rgba(0,209,255,0.15)]' : 'bg-[#00d1ff] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)] active:scale-95'}`}
                      >
                        {isSpeaking ? <VolumeX size={20} /> : <Play size={20} className="ml-0.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
