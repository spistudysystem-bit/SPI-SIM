import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Info, 
  Zap, 
  Timer, 
  ChevronsRight, 
  Ruler, 
  HelpCircle,
  Activity
} from 'lucide-react';

export default function D3ThirteenMicrosecondRule() {
  const [depth, setDepth] = useState(6); // Target depth in cm (1 to 15)
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // Elapsed in microseconds (0 to depth * 13)
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 2x, 0.5x simulation speed
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Constants
  const maxDepth = 15;
  const standardMicrosPerCm = 13;
  const roundTripTime = depth * standardMicrosPerCm;
  const speedOfSound = 1540; // m/s
  const speedOfSoundMmUs = 1.54; // mm/µs

  // D3 dimensions
  const width = 680;
  const height = 220;
  const margin = { top: 40, right: 30, bottom: 45, left: 30 };

  // 1. High precision Simulation Loop for the clock & wavefront
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsedMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // In our slow motion representation:
      // 1 microsecond of acoustic time corresponds to 40ms of real screen time (at 1x speed).
      // This is adjustable via speedMultiplier.
      const timeIncrementUs = (elapsedMs / 40) * speedMultiplier;

      setCurrentTime(prev => {
        const nextTime = prev + timeIncrementUs;
        if (nextTime >= roundTripTime) {
          // Reset when round trip ends (add a short buffer delay of 5 µs equivalent)
          if (nextTime >= roundTripTime + 5) {
            return 0;
          }
          return roundTripTime;
        }
        return nextTime;
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, depth, roundTripTime, speedMultiplier]);

  // Handle resets or pause synchronizations when depth shifts
  useEffect(() => {
    // If current time exceeds the new roundtrip time, clamp it or reset
    if (currentTime > roundTripTime) {
      setCurrentTime(0);
    }
  }, [depth, roundTripTime]);

  const triggerReset = () => {
    setCurrentTime(0);
    lastTimeRef.current = 0;
    setIsAnimating(true);
  };

  // 2. D3 Visualization Canvas Setup and Synchronized Dynamic updates
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // Clear element to prevent D3 duplicate renders
    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, maxDepth])
      .range([margin.left + 50, width - margin.right - 10]);

    // Draw the tissue background grid
    svg.append('rect')
      .attr('x', margin.left + 50)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right - 60)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', '#07080b')
      .attr('rx', 8);

    // Create diagonal biological tissue stripes for texture
    const pattern = svg.append('defs')
      .append('pattern')
      .attr('id', 'tissue-texture')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('line')
      .attr('x1', 0)
      .attr('y1', 20)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', 'rgba(255, 255, 255, 0.02)')
      .attr('stroke-width', 1.5);

    svg.append('rect')
      .attr('x', margin.left + 50)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right - 60)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'url(#tissue-texture)')
      .attr('pointer-events', 'none');

    // Add glowing filter for laser lines
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter')
      .attr('id', 'neon-glow-cyan')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    glowFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode')
      .attr('in', d => d);

    const glowFilterRed = defs.append('filter')
      .attr('id', 'neon-glow-red')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    glowFilterRed.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    glowFilterRed.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode')
      .attr('in', d => d);

    // D3 Axes Setup
    // Top axis for Depth (cm)
    const topAxis = d3.axisTop(xScale)
      .ticks(15)
      .tickValues([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      .tickFormat(d => `${d}`);

    svg.append('g')
      .attr('transform', `translate(0, ${margin.top})`)
      .attr('class', 'axis top-axis')
      .call(topAxis)
      .call(g => g.select('.domain').attr('stroke', '#2d3139'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#2d3139'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#8e9299')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono, monospace)')
      );

    // Bottom axis for Time (microseconds)
    const bottomAxis = d3.axisBottom(xScale)
      .ticks(15)
      .tickFormat(d => `${(Number(d) * standardMicrosPerCm).toFixed(0)}`);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .attr('class', 'axis bottom-axis')
      .call(bottomAxis)
      .call(g => g.select('.domain').attr('stroke', '#2d3139'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#2d3139'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#8e9299')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono, monospace)')
      );

    // Label coordinates
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', margin.top - 12)
      .attr('fill', '#ffd700')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text('DEPTH:');

    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top - 12)
      .attr('fill', '#ffd700')
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono, monospace)')
      .text('(cm)');

    svg.append('text')
      .attr('x', margin.left)
      .attr('y', height - margin.bottom + 22)
      .attr('fill', '#00d1ff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text('TIME:');

    svg.append('text')
      .attr('x', width - margin.right)
      .attr('y', height - margin.bottom + 22)
      .attr('fill', '#00d1ff')
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono, monospace)')
      .text('(microseconds µs)');

    // 3. Render Transducer Probe (Source)
    const probeGrp = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw the grey probe body
    probeGrp.append('path')
      .attr('d', `M -10,12 C -10,5 20,5 20,12 L 20,110 C 20,122 -10,122 -10,110 Z`)
      .attr('fill', '#1a1c23')
      .attr('stroke', '#3a3f4c')
      .attr('stroke-width', 2);

    // Draw piezoelectric crystal stack (blue strip)
    probeGrp.append('rect')
      .attr('x', 15)
      .attr('y', 20)
      .attr('width', 6)
      .attr('height', 80)
      .attr('fill', '#00d1ff')
      .attr('opacity', 0.8)
      .attr('rx', 2);

    svg.append('text')
      .attr('x', margin.left - 50)
      .attr('y', margin.top + 65)
      .attr('fill', '#8e9299')
      .attr('font-size', '9px')
      .attr('font-weight', 'medium')
      .attr('font-family', 'sans-serif')
      .attr('transform', `rotate(-90, ${margin.left - 10}, ${margin.top + 60})`)
      .text('TRANSDUCER');

    // 4. Render Target Reflector (Adjustable / Draggable)
    const targetX = xScale(depth);

    // Clickable Drag zone overlay on the target reflector
    const targetGrp = svg.append('g')
      .attr('class', 'target-reflector')
      .style('cursor', 'ew-resize');

    // Target boundary line
    targetGrp.append('line')
      .attr('x1', targetX)
      .attr('y1', margin.top)
      .attr('x2', targetX)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#ffd700')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.85);

    // Target vertical thick bracket
    targetGrp.append('rect')
      .attr('x', targetX - 5)
      .attr('y', margin.top + 10)
      .attr('width', 10)
      .attr('height', height - margin.top - margin.bottom - 20)
      .attr('fill', 'rgba(255, 215, 0, 0.12)')
      .attr('rx', 4);

    // Reflector center node circle
    targetGrp.append('circle')
      .attr('cx', targetX)
      .attr('cy', (margin.top + height - margin.bottom) / 2)
      .attr('r', 8)
      .attr('fill', '#ffd700')
      .attr('stroke', '#0c0d10')
      .attr('stroke-width', 2);

    // Adding target indicator text labels
    targetGrp.append('text')
      .attr('x', targetX)
      .attr('y', margin.top + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffd700')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text('REFLECTOR');

    targetGrp.append('text')
      .attr('x', targetX)
      .attr('y', margin.top + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8e9299')
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-mono, monospace)')
      .text(`(${depth} cm)`);

    // Target Dragging behaviors with D3
    const dragHandler = d3.drag<SVGGElement, unknown>()
      .on('drag', (event) => {
        // Find x coordinate relative to SVG container
        const mouseX = event.x;
        // Invert scale to locate the depth value (clamp between 1 and 15 cm)
        let newDepth = xScale.invert(mouseX);
        newDepth = Math.max(1.0, Math.min(newDepth, maxDepth));
        // Round to 1 decimal place
        setDepth(parseFloat(newDepth.toFixed(1)));
      });

    targetGrp.call(dragHandler as any);

    // 5. Sound Wavefront propagation
    const halfTripTime = roundTripTime / 2;
    const isGoingForward = currentTime < halfTripTime;

    // Calculate exact wavefront boundary coordinates
    let wavePosCm = 0;
    if (isGoingForward) {
      // ratio * target depth
      wavePosCm = (currentTime / halfTripTime) * depth;
    } else {
      // reverse decay path from depth back to 0
      const returnRatio = (currentTime - halfTripTime) / halfTripTime;
      wavePosCm = depth - (returnRatio * depth);
    }

    const waveX = xScale(wavePosCm);

    // Check if wavefront is active
    if (currentTime > 0 && currentTime <= roundTripTime) {
      const pulseColor = isGoingForward ? '#00d1ff' : '#ff453a';
      const pulseGlow = isGoingForward ? 'url(#neon-glow-cyan)' : 'url(#neon-glow-red)';

      // Incoming wave group
      const wavefrontGrp = svg.append('g')
        .attr('class', 'pulsing-wavefront')
        .attr('pointer-events', 'none');

      // Main ripple arcs
      const arcGradients = [0, 12, 24];
      const opacitySteps = [0.85, 0.5, 0.25];

      arcGradients.forEach((offsetDistance, idx) => {
        // Adjust coordinate offset according to travel vector
        const waveCoord = isGoingForward 
          ? waveX - offsetDistance 
          : waveX + offsetDistance;

        // Clip arcs to stay strictly contained inside the tissue grid coordinates
        if (waveCoord >= margin.left + 50 && waveCoord <= targetX + 5) {
          
          wavefrontGrp.append('path')
            .attr('d', `
              M ${waveCoord}, ${margin.top + 25} 
              C ${waveCoord + (isGoingForward ? 15 : -15)}, ${margin.top + 45} 
                ${waveCoord + (isGoingForward ? 15 : -15)}, ${height - margin.bottom - 45} 
                ${waveCoord}, ${height - margin.bottom - 25}
            `)
            .attr('fill', 'none')
            .attr('stroke', pulseColor)
            .attr('stroke-width', 3 - idx * 0.75)
            .attr('opacity', opacitySteps[idx])
            .attr('filter', pulseGlow)
            .attr('stroke-linecap', 'round');
        }
      });

      // Pulse traveling status bullet label
      svg.append('rect')
        .attr('x', waveX - (isGoingForward ? 55 : -5))
        .attr('y', (margin.top + height - margin.bottom) / 2 - 40)
        .attr('width', 52)
        .attr('height', 16)
        .attr('fill', '#090b0e')
        .attr('stroke', pulseColor)
        .attr('stroke-width', 1)
        .attr('rx', 3);

      svg.append('text')
        .attr('x', waveX - (isGoingForward ? 29 : -31))
        .attr('y', (margin.top + height - margin.bottom) / 2 - 29)
        .attr('text-anchor', 'middle')
        .attr('fill', pulseColor)
        .attr('font-size', '7.5px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'var(--font-mono, monospace)')
        .text(isGoingForward ? 'PULSE' : 'ECHO');
    }

  }, [depth, currentTime, roundTripTime, maxDepth]);

  // Calculations for readout panels
  const distanceOneWayCm = depth;
  const distanceRoundTripCm = depth * 2;
  const timeOneWayUs = (depth * 6.5).toFixed(1);
  const timeRoundTripUs = (depth * 13).toFixed(0);

  return (
    <div className="bg-[#111216] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden" id="d3-13us-visualizer">
      {/* Decorative ambient background grid lines */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header telemetry and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-[#00d1ff]/10 text-[#00d1ff]">
              <Activity size={14} />
            </span>
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#00d1ff] uppercase">
              13-Microsecond Rule Lab
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            Dynamic Dual-Axis Reflector Trace
          </h3>
        </div>
        
        {/* Dynamic Telemetry Badge */}
        <div className="flex items-center gap-2 bg-[#08090d] border border-white/10 rounded-xl px-3.5 py-2 font-mono">
          <Timer size={14} className="text-[#00d1ff] animate-pulse" />
          <span className="text-[10px] text-[#8e9299] uppercase tracking-wide">Live Trace:</span>
          <span className="text-xs font-bold text-white">{currentTime.toFixed(1)} µs</span>
        </div>
      </div>

      {/* Primary SVG Render workspace via D3 container */}
      <div className="bg-[#08090c] rounded-xl border border-white/5 p-2 overflow-hidden relative">
        <svg 
          ref={svgRef} 
          className="w-full text-white cursor-crosshair"
          style={{ minHeight: '190px', maxHeight: '250px' }}
        />
        
        {/* Drag handle hint overlays inside the D3 frame */}
        <div className="absolute right-4 bottom-4 pointer-events-none flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded border border-white/5 text-[9px] font-mono text-[#8e9299]">
          <Ruler size={10} className="text-yellow-400" />
          <span>Drag yellow reflector to change depth range</span>
        </div>
      </div>

      {/* Physics readout statistics panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#16181f]/70 border border-white/5 rounded-xl p-3 space-y-1 text-center">
          <span className="text-[9px] font-mono font-bold text-[#8e9299] uppercase tracking-wider block">Target Depth</span>
          <div className="text-lg font-serif font-black text-white">{distanceOneWayCm} cm</div>
          <span className="text-[8.5px] text-[#00d1ff] font-mono block">d = (c × t) / 2</span>
        </div>

        <div className="bg-[#16181f]/70 border border-white/5 rounded-xl p-3 space-y-1 text-center">
          <span className="text-[9px] font-mono font-bold text-[#8e9299] uppercase tracking-wider block">One-Way Time</span>
          <div className="text-lg font-serif font-black text-white">{timeOneWayUs} µs</div>
          <span className="text-[8.5px] text-[#8e9299] font-mono block">Transit to target</span>
        </div>

        <div className="bg-[#16181f]/70 border border-white/5 rounded-xl p-3 space-y-1 text-center border-l border-r border-[#ffd700]/10 bg-yellow-500/[0.01]">
          <span className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-wider block">Round-Trip Time</span>
          <div className="text-lg font-serif font-black text-yellow-500">{timeRoundTripUs} µs</div>
          <span className="text-[8.5px] text-yellow-500/80 font-mono block">13-Microsecond rule</span>
        </div>

        <div className="bg-[#16181f]/70 border border-white/5 rounded-xl p-3 space-y-1 text-center">
          <span className="text-[9px] font-mono font-bold text-[#8e9299] uppercase tracking-wider block">Total Wave Path</span>
          <div className="text-lg font-serif font-black text-white">{distanceRoundTripCm} cm</div>
          <span className="text-[8.5px] text-[#8e9299] font-mono block">Round-trip distance</span>
        </div>
      </div>

      {/* Slider Interactive panel and control bars */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#08090d] border border-white/5 p-4 rounded-xl flex-wrap">
          {/* Slider input */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8e9299] font-medium flex items-center gap-1.5">
                <Ruler size={13} className="text-yellow-500" />
                Target Reflector Depth Slider
              </span>
              <span className="text-white font-mono font-bold bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
                {depth.toFixed(1)} cm
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-[#8e9299]">1 cm</span>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={depth} 
                onChange={(e) => setDepth(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500 cursor-pointer h-1 rounded"
              />
              <span className="text-[9px] font-mono text-[#8e9299]">15 cm</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8e9299] uppercase">Presets:</span>
            {[5, 10, 15].map((presetVal) => (
              <button
                key={presetVal}
                onClick={() => setDepth(presetVal)}
                className={`px-3 py-1 bg-white/5 border text-xs font-mono font-bold rounded-lg transition-all capitalize ${
                  depth === presetVal ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-white/10 hover:border-white/20 text-[#8e9299]'
                }`}
              >
                {presetVal} cm
              </button>
            ))}
          </div>
        </div>

        {/* Live Audio playback and Slow-mot controls */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-[#0d0f14] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00d1ff] text-black text-xs font-bold transition-all hover:bg-[#00d1ff]/85 cursor-pointer"
            >
              {isAnimating ? (
                <>
                  <Pause size={12} className="fill-current" />
                  <span>Pause Wave</span>
                </>
              ) : (
                <>
                  <Play size={12} className="fill-current" />
                  <span>Resume Wave</span>
                </>
              )}
            </button>
            
            <button
              onClick={triggerReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#8e9299] text-xs font-bold transition-all hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Restart Pulse</span>
            </button>
          </div>

          {/* Animation Wave Speed Selector */}
          <div className="flex items-center gap-1.5 bg-[#08090d] border border-white/5 p-1 rounded-lg">
            <span className="text-[9px] font-mono text-[#8e9299] uppercase px-1.5">Simulation Speed:</span>
            {([0.5, 1, 2] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setSpeedMultiplier(sc)}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  speedMultiplier === sc ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20' : 'text-[#8e9299] hover:text-white'
                }`}
              >
                {sc === 1 ? '1x (Default)' : sc === 2 ? '2x Fast' : '0.5x Slow'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Physics breakdown callout */}
      <div className="bg-[#08090c] border-l-2 border-[#00d1ff] p-4 rounded-r-xl">
        <div className="flex gap-2.5 items-start text-xs font-sans text-[#8e9299] leading-relaxed">
          <Info size={16} className="text-[#00d1ff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-white font-medium">Why exactly 13 microseconds per centimeter?</p>
            <p>
              In clinical soft tissues, the velocity of longitudinal sound waves is constant at <strong className="text-white">1,540 m/s (1.54 mm/µs)</strong>.
              To reach a target reflector at exactly 1 cm depth, the sound wave must travel <strong className="text-white">10 mm or 1 cm forward</strong>, which takes:
            </p>
            <p className="font-mono text-center text-white py-1 bg-white/[0.02] rounded border border-white/5 leading-normal my-1">
              Time = Distance / Velocity = 10 mm / 1.54 mm/µs &asymp; 6.5 microseconds (one-way)
            </p>
            <p>
              The echo must then bounce and travel another <strong className="text-white">10 mm or 1 cm backward</strong> to return to the crystal face. This adds another <strong className="text-white">6.5 microseconds</strong>, yielding a total round-trip flight of:
            </p>
            <p className="font-mono text-center text-[#00d1ff] py-1 bg-[#00d1ff]/5 rounded border border-[#00d1ff]/10 leading-normal my-1">
              Round-Trip Time_total = 6.5 µs + 6.5 µs = 13 microseconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
