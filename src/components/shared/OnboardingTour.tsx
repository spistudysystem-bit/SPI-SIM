import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, X, Check, Award, Compass, Users } from 'lucide-react';

interface TourStep {
  title: string;
  content: string;
  targetId?: string;
  viewMode?: string; // Automatically switch to this tab if specified
}

const STEPS: TourStep[] = [
  {
    title: "Welcome, Sonographer!",
    content: "Welcome to the SPI Physics Lab & Credentials Simulator. This interactive toolkit helps you master advanced Ultrasound Physics (SPI) and clinical hemodynamics. Let's take a quick 1-minute onboarding tour to highlight the core student training systems.",
  },
  {
    title: "1. Manage Operator Identities",
    content: "Our simulator supports multiple team member profiles. Click here to add operator identities, review clinical scan logs, select custom narration voices, and customize individual study goals.",
    targetId: "tour-add-operator",
    viewMode: "profile"
  },
  {
    title: "2. Track Mastery Dynamics",
    content: "Track student progress across core syllabus fields in real-time. The Mastery Spider Matrix maps performance in Sound Waves, Transducers, Hemodynamics, and Knobs to guide targeted clinical study.",
    targetId: "tour-radar-chart",
    viewMode: "profile"
  },
  {
    title: "3. Advisor Recommendations",
    content: "Our virtual academic advisor monitors quiz answers continuously to generate daily custom study recommendations. Tap directly in this panel to jump straight to relevant textbook chapters!",
    targetId: "tour-advisor-recommendations",
    viewMode: "profile"
  },
  {
    title: "Tour Complete!",
    content: "You are now certified to operate the simulator! Switch navigation tabs above to explore PZT internal probe elements, B-mode Multizone TGC, spectral Doppler shifts, or take a realistic mock board exam. Happy scanning!",
  }
];

interface OnboardingTourProps {
  viewMode: string;
  setViewMode: (mode: any) => void;
}

export default function OnboardingTour({ viewMode, setViewMode }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Initialize: Check localStorage to see if user has ever dismissed/completed the tour
  useEffect(() => {
    const hasCompleted = localStorage.getItem('spi_onboarding_completed_v2');
    if (!hasCompleted) {
      // Auto-launch after 1.5 seconds for first-time users
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Recalculate target element position
  const updateCoordinates = useCallback(() => {
    const currentStep = STEPS[stepIndex];
    if (!currentStep.targetId) {
      setCoords(null);
      return;
    }
    const element = document.getElementById(currentStep.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Ensure the target is actually on screen and has valid width
      if (rect.width > 0 && rect.height > 0) {
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    } else {
      setCoords(null);
    }
  }, [stepIndex]);

  // Sync step change with automatic viewMode switches and scrolling
  useEffect(() => {
    if (!isOpen) return;

    const currentStep = STEPS[stepIndex];
    
    // Function to scroll target into view
    const scrollToTarget = () => {
      if (currentStep.targetId) {
        const element = document.getElementById(currentStep.targetId);
        if (element) {
           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    if (currentStep.viewMode && viewMode !== currentStep.viewMode) {
      setViewMode(currentStep.viewMode);
      // Wait for tab animation/mounting to complete before measuring positions
      const timer = setTimeout(() => {
        scrollToTarget();
        updateCoordinates();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Small delayed measurement to make sure parent layouts have fully settled
      const timer = setTimeout(() => {
        scrollToTarget();
        updateCoordinates();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, isOpen, viewMode, setViewMode, updateCoordinates]);

  // Keep coordinates updated on resize and scroll
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updateCoordinates);
    // Use true to capture scroll events from container divs
    window.addEventListener('scroll', updateCoordinates, { capture: true });
    return () => {
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates, { capture: true });
    };
  }, [isOpen, updateCoordinates]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem('spi_onboarding_completed_v2', 'true');
  };

  const forceStartTour = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  // Expose manual launch action on absolute window level for sandbox trigger buttons if needed
  useEffect(() => {
    (window as any).startSPIOnboardingTour = forceStartTour;
    return () => {
      delete (window as any).startSPIOnboardingTour;
    };
  }, []);

  if (!isOpen) {
    // Hidden launcher button in the footer or menu for recurring users
    return (
      <button
        id="manual-tour-trigger"
        onClick={forceStartTour}
        className="fixed bottom-4 right-4 z-40 p-2 rounded-full border border-[#00d1ff]/20 bg-[#0c0d10]/90 text-[#00d1ff] hover:bg-[#00d1ff] hover:text-black shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-wider font-bold"
        title="Start Onboarding Tour"
      >
        <Sparkles size={11} className="animate-spin-slow" />
        <span className="hidden sm:inline">Tour</span>
      </button>
    );
  }

  const currentStep = STEPS[stepIndex];

  // Compute absolute tooltip placement
  // Default centered placement fallback
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!coords) {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
    if (isMobile) {
      tooltipStyle.width = 'calc(100vw - 32px)';
    }
  } else if (isMobile) {
    // Mobile mode: Anchor to bottom, or top if target is near bottom
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translateX(-50%)';
    tooltipStyle.width = 'calc(100vw - 32px)';
    
    // Instead of right/left which can conflict with translate, use width
    if (coords.top > window.innerHeight / 2) {
       // Target is in bottom half, anchor tooltip to top
       tooltipStyle.top = '100px'; // Account for top nav header
    } else {
       // Target is in top half, anchor tooltip to bottom
       tooltipStyle.bottom = '100px'; 
    }
  } else {
    const spaceBelow = window.innerHeight - (coords.top + coords.height);
    const spaceAbove = coords.top;
    const spaceRight = window.innerWidth - (coords.left + coords.width);

    const offset = 12;
    
    // Choose placement dynamically
    if (spaceBelow > 260) {
      tooltipStyle.top = `${coords.top + coords.height + offset}px`;
      tooltipStyle.left = `${Math.max(16, Math.min(window.innerWidth - 336, coords.left + coords.width / 2 - 160))}px`;
    } else if (spaceAbove > 260) {
      tooltipStyle.top = `${coords.top - 260 - offset}px`;
      tooltipStyle.left = `${Math.max(16, Math.min(window.innerWidth - 336, coords.left + coords.width / 2 - 160))}px`;
    } else if (spaceRight > 330) {
      tooltipStyle.top = `${Math.max(16, Math.min(window.innerHeight - 260, coords.top + coords.height / 2 - 100))}px`;
      tooltipStyle.left = `${coords.left + coords.width + offset}px`;
    } else {
      // Overlay fallback
      tooltipStyle.top = '50%';
      tooltipStyle.left = '50%';
      tooltipStyle.transform = 'translate(-50%, -50%)';
    }
  }

  return (
    <AnimatePresence>
      {/* 1. Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-[1.5px] z-[9990] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 2. Target Pulsing Focus Box */}
      {coords && (
        <div
          style={{
            position: 'fixed',
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
            pointerEvents: 'none',
            zIndex: 9995,
          }}
          className="border-2 border-[#00d1ff] rounded-xl shadow-[0_0_25px_rgba(0,209,255,0.7),_inset_0_0_10px_rgba(0,209,255,0.2)] animate-pulse transition-all duration-300"
        />
      )}

      {/* 3. Floating Interactive Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: coords ? 0 : -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={tooltipStyle}
        className="bg-[#0f1115]/95 border border-[#00d1ff]/30 shadow-[0_0_30px_rgba(0,209,255,0.15)] rounded-2xl p-4 sm:p-5 w-full sm:w-[320px] max-w-none sm:max-w-[90vw] text-white flex flex-col gap-3 sm:gap-4 pointer-events-auto"
      >
        {/* Header decoration */}
        <div className="flex items-center justify-between border-b border-[#2d3139]/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#00d1ff]/10 text-[#00d1ff]">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-[3px] text-[#00d1ff] font-bold">
              SPI TUTORIAL SYSTEM
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[#8e9299] hover:text-white transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
            {currentStep.title}
          </h2>
          <p className="text-[11.5px] text-[#8e9299] leading-relaxed font-sans">
            {currentStep.content}
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-[#2d3139]/40">
          {/* Progress Indication */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === stepIndex ? 'w-4 bg-[#00d1ff]' : 'w-1.5 bg-[#2d3139]'
                }`}
              />
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#2d3139] hover:border-white text-[#8e9299] hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft size={10} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-gradient-to-r from-[#00d1ff]/20 to-indigo-500/20 hover:from-[#00d1ff] hover:to-[#00d1ff] border border-[#00d1ff]/40 text-[#00d1ff] hover:text-black font-extrabold shadow-[0_0_12px_rgba(0,209,255,0.15)] hover:shadow-cyan-500/25 transition-all cursor-pointer"
            >
              {stepIndex === STEPS.length - 1 ? (
                <>Ready <Check size={10} /></>
              ) : (
                <>Next <ArrowRight size={10} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
