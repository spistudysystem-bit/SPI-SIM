import React, { useRef, useState, useEffect } from 'react';

interface RotaryKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label: string;
  unit?: string;
  color?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  disabled?: boolean;
  helpText?: string;
}

export default function RotaryKnob({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit = '',
  color = 'cyan',
  disabled = false,
  helpText
}: RotaryKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragStartValue = useRef<number>(0);

  // Map colors to tailwind config and inline hex styles
  const colorTheme = {
    cyan: {
      primary: '#00d1ff',
      glow: 'rgba(0, 209, 255, 0.4)',
      bgLight: 'bg-[#00d1ff]/5',
      bdrActive: 'border-[#00d1ff]/40',
      textActive: 'text-[#00d1ff]'
    },
    purple: {
      primary: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
      bgLight: 'bg-purple-500/5',
      bdrActive: 'border-purple-500/40',
      textActive: 'text-purple-400'
    },
    amber: {
      primary: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      bgLight: 'bg-[#f59e0b]/5',
      bdrActive: 'border-[#f59e0b]/40',
      textActive: 'text-amber-400'
    },
    emerald: {
      primary: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      bgLight: 'bg-emerald-500/5',
      bdrActive: 'border-emerald-500/40',
      textActive: 'text-emerald-400'
    },
    rose: {
      primary: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.4)',
      bgLight: 'bg-rose-500/5',
      bdrActive: 'border-rose-500/40',
      textActive: 'text-rose-400'
    }
  }[color];

  // Percentage from 0 to 1
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Angle for rotation: -135deg to +135deg (270deg total sweep)
  const angle = pct * 270 - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
    document.body.style.cursor = 'ns-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartValue.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY.current - e.clientY; // drag up = positive increment
      const pixelsPerFullRange = 150; // drag distance to go min to max
      const ratio = deltaY / pixelsPerFullRange;
      const valDelta = ratio * (max - min);
      
      let nextVal = dragStartValue.current + valDelta;
      nextVal = Math.round(nextVal / step) * step;
      nextVal = Math.max(min, Math.min(max, nextVal));
      
      onChange(nextVal);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY.current - e.touches[0].clientY;
      const pixelsPerFullRange = 150;
      const ratio = deltaY / pixelsPerFullRange;
      const valDelta = ratio * (max - min);
      
      let nextVal = dragStartValue.current + valDelta;
      nextVal = Math.round(nextVal / step) * step;
      nextVal = Math.max(min, Math.min(max, nextVal));
      
      onChange(nextVal);
    };

    const handleMouseUpOrEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUpOrEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUpOrEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUpOrEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUpOrEnd);
    };
  }, [isDragging, min, max, step, onChange]);

  // Handle scroll mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    
    // Check if the component is active step or active module to avoid accidental scrolling
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const nextVal = Math.max(min, Math.min(max, value + direction * step * 2));
    onChange(nextVal);
  };

  // Click on specific percentage marks
  const handleArcClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled || !knobRef.current) return;
    
    // Calculate polar coordinates relative to center of knob
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clickX = e.clientX - centerX;
    const clickY = e.clientY - centerY;
    
    // Angle in radians (-PI to PI)
    const rad = Math.atan2(clickY, clickX);
    // Angle in degrees (-180 to 180). Let's offset so top is 0, sweeping clockwise
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    
    // Dial starts at 225deg (-135deg from top) and sweeps clockwise to 135deg (+135deg from top)
    // Offset standard: relative to the starting point
    let relativeDeg = deg - 225;
    if (relativeDeg < 0) {
      relativeDeg += 360;
    }
    
    if (relativeDeg > 280) {
      // Clamped to bounds
      if (relativeDeg > 320) {
        onChange(min);
      } else {
        onChange(max);
      }
      return;
    }
    
    const targetPct = Math.min(1, Math.max(0, relativeDeg / 270));
    let nextVal = min + targetPct * (max - min);
    nextVal = Math.round(nextVal / step) * step;
    onChange(nextVal);
  };

  // Standard SVG arc formulation
  // Radius of arc: 26 (viewBox 0 0 60 60)
  const arcRadius = 24;
  const cx = 30;
  const cy = 30;
  
  // Perimeter = 2 * PI * r
  const circumference = 2 * Math.PI * arcRadius;
  // Sweep is 270 degrees out of 360 (75%)
  const activeLength = circumference * 0.75;
  const strokeDashoffset = activeLength * (1 - pct);

  return (
    <div className={`flex flex-col items-center select-none text-center relative p-3 rounded-xl border border-transparent transition-all ${disabled ? 'opacity-40' : colorTheme.bgLight + ' ' + colorTheme.bdrActive + ' bg-black/15 shadow-sm'}`}>
      
      {/* Title Header */}
      <div className="text-[10px] font-mono font-bold tracking-wider mb-1 text-slate-300">
        {label}
      </div>

      {/* Central Dial Body */}
      <div 
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        className="relative w-20 h-20 flex items-center justify-center cursor-ns-resize group"
        style={{ touchAction: 'none' }}
      >
        {/* Background Decorative Rings */}
        <svg 
          viewBox="0 0 60 60" 
          className="absolute inset-0 w-full h-full transform -rotate-225 pointer-events-none"
        >
          {/* Base track */}
          <circle
            cx={cx}
            cy={cy}
            r={arcRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="3"
            strokeDasharray={`${activeLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active colorful track */}
          <circle
            cx={cx}
            cy={cy}
            r={arcRadius}
            fill="none"
            stroke={colorTheme.primary}
            strokeWidth="3.5"
            strokeDasharray={`${activeLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${colorTheme.glow})`,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.15s ease-out'
            }}
          />
        </svg>

        {/* Inner Physical Knob Dial */}
        <div 
          className={`w-12 h-12 rounded-full bg-gradient-to-tr from-[#16181d] to-[#252831] border-2 border-[#3c414d] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.6),0_0_10px_rgba(255,255,255,0.02)] relative group-hover:border-[#525969]`}
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Knob pointer line */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          
          {/* Tiny center cap design */}
          <div className="w-4 h-4 rounded-full bg-black/40 border border-[#4a4f5c]" />
        </div>

        {/* Touch Assist click bounds (invisible backplate for arc clicks) */}
        <svg 
          onClick={handleArcClick}
          viewBox="0 0 60 60" 
          className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto opacity-0"
        />
      </div>

      {/* Numerical Visual Output Bar */}
      <div className="mt-1 flex flex-col items-center">
        <span className={`text-xs font-mono font-black tracking-widest ${colorTheme.textActive} shadow-glow`}>
          {value} <span className="text-[9px] text-[#8e9299] font-normal">{unit}</span>
        </span>
        
        {helpText && (
          <span className="text-[7.5px] text-[#8e9299] font-mono uppercase mt-1 tracking-wider block">
            {helpText}
          </span>
        )}
      </div>

      {/* Tiny manual adjustment arrows for convenience */}
      <div className="absolute top-12 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + step)); }} 
          className="p-0.5 rounded bg-white/5 hover:bg-white/15 text-white text-[8px] cursor-pointer"
        >
          ▲
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - step)); }} 
          className="p-0.5 rounded bg-white/5 hover:bg-white/15 text-white text-[8px] cursor-pointer"
        >
          ▼
        </button>
      </div>

    </div>
  );
}
