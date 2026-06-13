import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Target, 
  ShieldCheck, 
  Trophy, 
  ArrowRight, 
  Radio, 
  Waves,
  Activity,
  Play,
  Sparkles,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Sliders,
  ShieldAlert,
  SlidersHorizontal,
  FolderSync,
  User,
  Cpu,
  Volume2,
  Terminal
} from 'lucide-react';
import teamBadge from '../../assets/images/undercover_uuu_badge_upgraded_1781319628636.jpg';
import teamPoster from '../../assets/images/undercover_uuu_comic_style_1781204130399.jpg';
import agentJackPortrait from '../../assets/images/agent_jack_portrait_1781263199183.jpg';
import agentSarahPortrait from '../../assets/images/agent_sarah_portrait_1781263218814.jpg';
import agentMarcusPortrait from '../../assets/images/agent_marcus_portrait_1781263232347.jpg';
import agentRPortrait from '../../assets/images/agent_r_ai_portrait_1781263244321.jpg';

interface DashboardModuleProps {
  setViewMode: (mode: any) => void;
  frequency: number;
  wavelength: number;
  axialRes: number;
  branding?: {
    teamBadge?: string;
    teamPoster?: string;
  };
}

export default function DashboardModule({ 
  setViewMode, 
  frequency, 
  wavelength, 
  axialRes,
  branding
}: DashboardModuleProps) {
  const [selectedAgent, setSelectedAgent] = React.useState<number>(0);
  const [badgeClicks, setBadgeClicks] = React.useState<number>(0);
  const [resonanceMultiplier, setResonanceMultiplier] = React.useState<number>(1.0);

  const SQUAD_AGENTS = [
    {
      name: "Agent Jack",
      title: "Acoustic Commander",
      badge: "Lead Sonography Instructor",
      icon: User,
      avatar: agentJackPortrait,
      colorClass: "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50",
      activeBorder: "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.25)]",
      accentColor: "text-yellow-400",
      accentBg: "bg-yellow-400/10",
      specialty: "High-Yield Strategy & ALARA Multipliers",
      keyOutlineTip: "ALARA (As Low As Reasonably Achievable) is the pure golden rule of sonography safety. Never increase output intensity (Transmit Power) to brighten a dim image first. Always turn up your digital receiver gain (TGC/Gain) instead, because receiver gain doesn't put any extra bioeffects pressure on tissue cells!",
      radioCode: "TX_POWER_COIL_SAFE_01",
      audioAdvice: "Check out Chapters 8 & 9 in our core Outlines on BIOEFFECTS to master ALARA!"
    },
    {
      name: "Agent Sarah",
      title: "Doppler Operator",
      badge: "Clinical Applications Specialist",
      icon: Activity,
      avatar: agentSarahPortrait,
      colorClass: "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/50",
      activeBorder: "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
      accentColor: "text-rose-400",
      accentBg: "bg-rose-400/10",
      specialty: "Spectral Shifting & Viscous Flow Kinetics",
      keyOutlineTip: "When Doppler-scanning vessels, maintain critical angles! Doppler shift depends directly on the cosine of the intercept angle. At exactly 90 degrees, cosine is 0 - meaning absolutely ZERO shift is measured. Always seek parallel vectors or standard correction angles below 60 degrees to beat aliasing!",
      radioCode: "DOPPLER_ANGLE_TRUE_02",
      audioAdvice: "Tune in to our Spectral Doppler Module to test shift angles in real-time fluid chambers!"
    },
    {
      name: "Agent Marcus",
      title: "Pulse Engineer",
      badge: "Transducer Physicist",
      icon: Sliders,
      avatar: agentMarcusPortrait,
      colorClass: "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/50",
      activeBorder: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]",
      accentColor: "text-cyan-400",
      accentBg: "bg-cyan-400/10",
      specialty: "Matching Layer Impedance & Crystal Calibrations",
      keyOutlineTip: "Axial resolution is strictly determined by Spatial Pulse Length (SPL). To make SPL shorter and resolution sharper (LARRD), we use high-frequency, well-damped crystals with a matching layer. The matching layer's impedance sits precisely between that of PZT and human skin for seamless propagation!",
      radioCode: "LARRD_SPL_SHARP_03",
      audioAdvice: "Slide on over to the Transducer Probe LAB to play with impedance layers dynamically!"
    },
    {
      name: "Agent R",
      title: "U.U. Mech Tutor",
      badge: "Registry Guardian AI",
      icon: Cpu,
      avatar: agentRPortrait,
      colorClass: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50",
      activeBorder: "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.25)]",
      accentColor: "text-emerald-400",
      accentBg: "bg-emerald-400/10",
      specialty: "Outlines Synthesis & 13-μsec Range Calibrations",
      keyOutlineTip: "In soft tissue, sound propagates at approximately 1,540 m/s. That gives us our absolute baseline: the 13-microsecond rule! It takes exactly 13μs of round-trip time for a pulse to travel to a depth of 1cm and back. If return-time is 39μs, the reflector is 3cm deep and total distance is 6cm!",
      radioCode: "RANGE_AMPLITUDE_COV_04",
      audioAdvice: "Launch Ask AI Assistant Instruct to ground yourself on any tricky board outlines formulas instantly!"
    }
  ];

  return (
    <div className="flex-1 w-full bg-[#07080a] p-4 sm:p-8 flex flex-col gap-8 text-white relative">
      {/* Background visual atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.05),transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 right-[10%] w-[350px] h-[350px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-[10%] w-[300px] h-[300px] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />

      {/* Top row: live review flashing & title banner */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 relative z-10">
        {/* Live review pill */}
        <div className="flex items-center gap-3 bg-red-600/10 border border-red-500/35 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse shrink-0 select-none">
          <Radio size={16} className="text-red-500 animate-spin-slow" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-mono font-black tracking-widest text-red-500 uppercase leading-none">LIVE REVIEW</span>
            <span className="text-[8px] font-mono text-[#8e9299] mt-0.5 uppercase tracking-wider">📡 SYLLABUS SYNCHRONIZED</span>
          </div>
        </div>

        {/* Massive Hazard-Bordered Title Banner */}
        <div className="relative w-full max-w-2xl bg-black rounded-lg border-2 border-yellow-500/80 p-5 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)] group">
          {/* Yellow/Black hazard warning background stripe trim */}
          <div className="absolute top-0 inset-x-0 h-2 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#000000_10px,#000000_20px)]" />
          <div className="absolute bottom-0 inset-x-0 h-2 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#000000_10px,#000000_20px)]" />
          
          <div className="text-center relative py-1.5 px-4">
            <h1 className="text-xl sm:text-3xl md:text-3.5xl font-black text-yellow-400 uppercase tracking-[0.06em] font-mono leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter brightness-110">
              ULTRASOUND UNDERGROUND
            </h1>
          </div>
        </div>

        {/* Covert stats pill on right */}
        <div className="hidden xl:flex items-center gap-3 bg-[#111317] border border-white/5 px-4 py-2 rounded-xl shrink-0 select-none font-mono">
          <div className="text-right flex flex-col justify-center">
            <span className="text-[8px] text-yellow-500 font-bold tracking-widest uppercase">COHORT ACCESS</span>
            <span className="text-[10px] text-zinc-300 font-bold mt-0.5">STEALTH ACTIVE</span>
          </div>
          <div className="h-6 w-[1.5px] bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[7px] text-[#8e9299]">FREQ COIL</span>
            <span className="text-[9.5px] text-cyan-400 font-bold">4.2 GHz</span>
          </div>
        </div>
      </div>

      {/* Main visual display mockup box */}
      <div className="border border-white/10 bg-[#0e1014] rounded-2xl p-5 md:p-8 relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
        {/* Tech decorative HUD elements */}
        <div className="absolute top-4 left-4 font-mono text-[8px] text-zinc-500 tracking-widest">
          SYSTEM: CLANDESTINE_RADAR_SOLVER_v2.1
        </div>
        <div className="absolute top-4 right-4 font-mono text-[8px] text-zinc-500 tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          FEED_SECURE_COIL
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 mt-2">
          {/* Left panel: Tactical radar scanning visual details mimicking actual state */}
          <div className="lg:col-span-3 space-y-4 font-mono border-r border-white/5 pr-4 hidden lg:block text-slate-400 text-[10px]">
            <div className="bg-black/35 border border-white/5 p-3 rounded-lg space-y-2">
              <span className="text-[8px] text-cyan-400 font-bold tracking-widest block border-b border-white/5 pb-1 uppercase">
                APICAL 4-CHAMBER SCAN
              </span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Transducer f₀:</span><span className="text-white font-bold">{frequency.toFixed(2)} MHz</span></div>
                <div className="flex justify-between"><span>Pulse λ:</span><span className="text-white font-bold">{wavelength.toFixed(3)} mm</span></div>
                <div className="flex justify-between"><span>Axial Res:</span><span className="text-[#34d399] font-bold">{axialRes.toFixed(2)} mm</span></div>
                <div className="flex justify-between"><span>Acoustic Mode:</span><span className="text-yellow-500 font-bold">Stealth Sector</span></div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 via-[#0a0f18] to-black border border-cyan-500/30 p-4.5 rounded-xl space-y-4 flex flex-col items-center relative overflow-hidden shadow-[0_0_20px_rgba(0,209,255,0.12)]">
              {/* Animated corner decorations */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400" />
              
              <div className="flex items-center justify-between w-full border-b border-white/5 pb-1">
                <span className="text-[8px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                  U.U. COGNITIVE CORE
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              </div>

              {/* Holographic Glowing 3D Badge container */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const newClicks = badgeClicks + 1;
                  setBadgeClicks(newClicks);
                  // Calculate dynamic multiplier boost showing level-ups
                  const boost = 1.0 + (newClicks * 0.15);
                  setResonanceMultiplier(Math.min(2.5, Number(boost.toFixed(2))));
                }}
                className="cursor-pointer relative flex items-center justify-center p-2 rounded-full bg-gradient-to-tr from-[#00f0ff]/20 via-slate-900 to-[#ff007f]/25 border border-cyan-400/30 shadow-[0_0_25px_rgba(0,240,255,0.25)] select-none group"
              >
                {/* Cybernetic outer rotating ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 animate-spin-slow group-hover:border-pink-500/60 pointer-events-none" />
                <div className="absolute -inset-1.5 rounded-full border border-[#ff007f]/10 animate-reverse-spin pointer-events-none" />
                
                {/* Interactive inner scanner laser overlay */}
                <div className="absolute inset-2 bg-cyan-400/5 rounded-full overflow-hidden pointer-events-none">
                  <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)] absolute animate-pulse" 
                       style={{
                         animation: 'scanLine 3s infinite linear',
                         backgroundImage: 'linear-gradient(to right, transparent, #00f0ff, transparent)'
                       }} 
                  />
                </div>

                <style>{`
                  @keyframes scanLine {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                  }
                  .animate-spin-slow {
                    animation: spin 16s linear infinite;
                  }
                  .animate-reverse-spin {
                    animation: spin 24s linear infinite reverse;
                  }
                `}</style>

                <img 
                  src={branding?.teamBadge || teamBadge} 
                  alt="Ultrasound Underground Badge" 
                  className="w-24 h-24 rounded-full object-cover filter contrast-110 brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all group-hover:brightness-125 select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Cyber badge rating status absolute bubble */}
                <div className="absolute -bottom-1 bg-black border border-cyan-400/60 rounded-full px-2 py-0.5 text-[7px] font-mono text-cyan-400 font-bold shadow-md tracking-wider">
                  MULTIPLIER: {resonanceMultiplier}x
                </div>
              </motion.div>

              <div className="space-y-1.5 text-center w-full relative z-10">
                <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                  <span className="font-bold text-[#ff007f] tracking-wide">COGNITIVE LEVEL {Math.min(10, 3 + badgeClicks)}</span>
                  <span className="text-cyan-400 font-extrabold">{75 + Math.min(25, badgeClicks * 3)}% POWER</span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-[#ff007f] h-full rounded-full transition-all duration-300 pointer-events-none shadow-[0_0_6px_#00f0ff]" 
                      style={{ width: `${Math.min(100, 75 + badgeClicks * 5)}%` }} 
                    />
                  </div>
                </div>

                <p className="text-[8px] font-mono text-cyan-300 leading-tight">
                  {badgeClicks === 0 ? "Click the badge to synchronize and boost your acoustic matching layers." : 
                   badgeClicks < 5 ? `🔥 MATCHING LAYER ACTIVE! Resonance multiplier is set to ${resonanceMultiplier}x.` : 
                   `⚡ MAXIMUM OVERDRIVE! Core decibel signal is boosted! Decrypt Key: RESONANCE_COGNITIVE_ACTIVE`}
                </p>
              </div>
            </div>
          </div>

          {/* Center Column: Movies Poster & Master Frame */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center text-center">
            <div className="relative">
              {/* Outer circular/rotating frame styling */}
              <div className="absolute -inset-4 rounded-3xl border border-[#eab308]/10 animate-pulse pointer-events-none" />
              <div className="absolute -inset-2 rounded-2xl border border-dashed border-[#00d1ff]/15 pointer-events-none" />

              {/* Poster frame in professional portrait (aspect-ratio 3:4 or 4:5 or 9:16) */}
              <div className="p-2.5 rounded-3xl bg-gradient-to-b from-[#eab308]/25 via-slate-900 to-black border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.85)] relative overflow-hidden max-w-full">
                {/* Yellow hazard warning stripe trim at top/bottom of frame */}
                <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_6px,#000000_6px,#000000_12px)]" />

                <img 
                  src={branding?.teamPoster || teamPoster} 
                  alt="Ultrasound Underground Poster" 
                  className="w-full max-w-xs sm:max-w-sm rounded-2xl object-cover filter contrast-105 brightness-105 border border-white/5"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* absolute coordinates overlay badge */}
              <div className="absolute -bottom-2.5 right-6 bg-yellow-500 text-black font-mono font-black rounded-lg text-[9px] px-2.5 py-1 shadow-md border border-black/50 tracking-wider">
                ACTIVE COOP DECK
              </div>
            </div>

            {/* SPI Exam Review Plate */}
            <div className="mt-8 relative w-full max-w-sm bg-gradient-to-b from-[#2a2d33] to-[#121417] border border-[#3e424d] rounded-lg p-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
              {/* Screw rivets on corners */}
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-[#515663] border border-black/45" />
              <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#515663] border border-black/45" />
              <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#515663] border border-black/45" />
              <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#515663] border border-black/45" />

              <h2 className="text-lg sm:text-2xl font-black text-[#f1f5f9] tracking-widest font-mono text-center uppercase leading-none select-none flex items-center justify-center gap-2">
                SPI <span className="text-yellow-400">EXAM</span> <span className="text-zinc-400 font-light font-sans">REVIEW</span>
              </h2>
            </div>

            {/* Glowing Blue Ribbon Badge: SONOGRAPHY SONGS + LECTURES */}
            <div className="mt-4 w-full max-w-md bg-gradient-to-r from-cyan-600/20 via-cyan-500/80 to-cyan-600/20 py-2 border-y border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-3">
              <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] font-sans text-center">
                SONOGRAPHY SONGS + LECTURES
              </span>
            </div>

            {/* Slogan */}
            <p className="mt-4 text-xs sm:text-xs text-[#8e9299] max-w-md mx-auto leading-relaxed font-sans font-semibold tracking-wide uppercase">
              For students who need to pass ultrasound physics.
            </p>
          </div>

          {/* Right panel: Live scan controls & Doppler shift visual details mimicking actual state */}
          <div className="lg:col-span-3 space-y-4 font-mono border-l border-white/5 pl-4 hidden lg:block text-slate-400 text-[10px]">
            <div className="bg-black/35 border border-white/5 p-3 rounded-lg space-y-2">
              <span className="text-[8px] text-rose-400 font-bold tracking-widest block border-b border-white/5 pb-1 uppercase">
                COLOR DOPPLER LAB
              </span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Wall Filter:</span><span className="text-white font-bold">120 Hz</span></div>
                <div className="flex justify-between"><span>Gain level:</span><span className="text-white font-bold">65%</span></div>
                <div className="flex justify-between"><span>Aliasing PRF:</span><span className="text-rose-400 font-bold">4.5 kHz</span></div>
                <div className="flex justify-between"><span>Velocity V:</span><span className="text-white font-bold">1.2 m/s</span></div>
              </div>
            </div>

            <div className="bg-black/35 border border-white/5 p-3 rounded-lg space-y-2">
              <span className="text-[8px] text-[#34d399] font-bold tracking-widest block border-b border-white/5 pb-1 uppercase">
                CLINICAL SYLLABUS INDEX
              </span>
              <div className="space-y-1.5 text-[9.5px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ffd700]" />
                  <span>Transducer Resonance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00d1ff]" />
                  <span>Decibel Tissue Loss</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>Reynolds Flow Kinetics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of the 4 iconic Bottom Badges styled exactly as the image */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
        {/* Badge 1: Focused Content */}
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center justify-between shadow-lg relative group overflow-hidden hover:border-yellow-500/25 transition-all">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-full" />
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 mb-3 group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Focused Content</h3>
            <p className="text-[10px] text-[#8e9299] mt-1.5 leading-relaxed font-sans max-w-[160px] mx-auto">
              Optimized notes tailored directly to ARDMS SPI registry outline criteria.
            </p>
          </div>
        </div>

        {/* Badge 2: High-Yield Strategy */}
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center justify-between shadow-lg relative group overflow-hidden hover:border-cyan-500/25 transition-all">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full" />
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">High-Yield Strategy</h3>
            <p className="text-[10px] text-[#8e9299] mt-1.5 leading-relaxed font-sans max-w-[160px] mx-auto">
              Memorable songs, vocal lectures, and dynamic simulation formulas.
            </p>
          </div>
        </div>

        {/* Badge 3: Pass With Confidence */}
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center justify-between shadow-lg relative group overflow-hidden hover:border-emerald-500/25 transition-all">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full" />
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Pass With Confidence</h3>
            <p className="text-[10px] text-[#8e9299] mt-1.5 leading-relaxed font-sans max-w-[160px] mx-auto">
              Durable scoring trackers & comprehensive boards quizzes.
            </p>
          </div>
        </div>

        {/* Badge 4: Ace the SPI Exam */}
        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center justify-between shadow-lg relative group overflow-hidden hover:border-rose-500/25 transition-all">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full" />
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 mb-3 group-hover:scale-110 transition-transform">
            <Trophy size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Ace the SPI Exam</h3>
            <p className="text-[10px] text-[#8e9299] mt-1.5 leading-relaxed font-sans max-w-[160px] mx-auto">
              110-Question timed simulator mirroring standard ARDMS interfaces.
            </p>
          </div>
        </div>
      </div>

      {/* COVERT STUDY SQUAD INTERACTIVE TRANSMISSIONS PANEL */}
      <div className="border border-yellow-500/30 bg-[#0c0d12]/90 rounded-2xl p-6 relative z-10 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        {/* Decorative corner brackets or borders */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500" />

        <div className="flex flex-col xl:flex-row items-start justify-between border-b border-white/5 pb-4 mb-6 gap-2">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[5px] text-yellow-500 hover:brightness-110 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              📡 ULTRASOUND UNDERGROUND INSTRUCTORS - TRANSMISSIONS FEED
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase font-mono mt-1">
              COMMAND DECK INTERCOM
            </h2>
          </div>
          <div className="text-[10px] font-mono bg-yellow-500/15 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-md uppercase">
            SECURE LINK_OUT STATUS: ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Block: Interactive Agent Selection Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
              TAP ACTIVE INSTRUCTOR TO RETRIEVE PHYSICS TIP:
            </span>
            <div className="flex flex-col gap-3">
              {SQUAD_AGENTS.map((agent, i) => {
                const AgentIcon = agent.icon;
                const isSelected = selectedAgent === i;
                return (
                  <button
                    key={agent.name}
                    type="button"
                    onClick={() => setSelectedAgent(i)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isSelected 
                        ? agent.activeBorder + " bg-zinc-900/80" 
                        : agent.colorClass
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${isSelected ? agent.accentBg + " " + agent.accentColor : "bg-neutral-800 text-neutral-400 group-hover:text-white"}`}>
                        <AgentIcon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-white font-mono tracking-wider">{agent.name}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 bg-black/40 rounded border border-white/5 text-zinc-400">{agent.radioCode}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold text-[8.5px] tracking-wide">{agent.title}</p>
                      </div>
                    </div>
                    <div className={`h-4 w-4 rounded-full border border-white/10 flex items-center justify-center transition-colors ${isSelected ? "bg-yellow-500 border-none" : "group-hover:border-white/30"}`}>
                      {isSelected && <div className="h-1.5 w-1.5 bg-black rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Block: Selected Agent's Screen/Intercom readout */}
          <div className="lg:col-span-7 flex flex-col bg-black/40 rounded-xl border border-white/5 p-5 relative overflow-hidden justify-between">
            {/* Visualizer background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.02),transparent_40%)] pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${SQUAD_AGENTS[selectedAgent].accentBg} flex items-center justify-center animate-pulse`}>
                    <div className={`w-1 h-1 rounded-full ${SQUAD_AGENTS[selectedAgent].accentColor.replace('text-', 'bg-')}`} />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-black">
                    NARRATIVE DIRECTORY INSTRUCTIONS
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-500 border border-white/5">
                  <Volume2 size={10} className="text-yellow-500 animate-pulse" /> SCAN STABILIZED
                </div>
              </div>

              {/* Character Details Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden relative shrink-0">
                  <img src={SQUAD_AGENTS[selectedAgent].avatar} alt="Agent Portrait" className="w-full h-full object-cover grayscale brightness-75 mix-blend-screen" />
                  <div className={`absolute inset-0 border-2 rounded-xl scale-105 pointer-events-none ${SQUAD_AGENTS[selectedAgent].activeBorder}`} />
                </div>
                <div>
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">ACTIVE SPECIALTY:</span>
                  <h3 className={`text-sm font-black uppercase tracking-normal mt-0.5 font-mono ${SQUAD_AGENTS[selectedAgent].accentColor}`}>
                    {SQUAD_AGENTS[selectedAgent].specialty}
                  </h3>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                  <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 absolute bottom-1 right-2 select-none">ULTRASOUND UNDERGROUND ADVICE DECK</span>
                
                <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-300 font-sans font-medium">
                  "{SQUAD_AGENTS[selectedAgent].keyOutlineTip}"
                </p>
              </div>
            </div>

            {/* Tactical Advice action footer */}
            <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-zinc-600" />
                <span className="text-[9.5px] text-zinc-400 font-medium">
                  {SQUAD_AGENTS[selectedAgent].audioAdvice}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Direct shortcut launcher based on selection redirecting corresponding view modes
                  const links = ['probe', 'doppler', 'probe', 'chat'];
                  setViewMode(links[selectedAgent]);
                }}
                className="px-3.5 py-1.5 bg-yellow-500 text-black font-bold uppercase text-[9px] tracking-wider rounded border border-yellow-400 hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 border-none cursor-pointer font-black"
              >
                DEPLOY DECK <ArrowRight size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main quick launch hubs terminal */}
      <div className="border border-white/5 bg-[#14161d]/55 rounded-2xl p-6 relative z-10">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-3.5 mb-5 flex items-center justify-between">
          <span>⚙️ SQUAD COVERT EXAM COMMAND CENTER</span>
          <span className="text-[8px] text-[#8e9299]">DIRECT LAUNCH PANELS ACTIVE</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Item 1: Internal Probe Sim */}
          <div 
            onClick={() => setViewMode('probe')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-cyan-500/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
              <Sliders size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-cyan-300 transition-colors">Transducer Probe LAB</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Review piezoelectric damping, matching impedance thresholds, and crystal thickeners.
              </p>
            </div>
          </div>

          {/* Item 2: Text Book */}
          <div 
            onClick={() => setViewMode('academy')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-yellow-500/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <BookOpen size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-yellow-300 transition-colors">Interactive Textbook</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Pass through the complete multi-chapter registry outlines index with fluid equations.
              </p>
            </div>
          </div>

          {/* Item 3: Interactive Practice Syllabus */}
          <div 
            onClick={() => setViewMode('practice')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-emerald-500/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all">
              <GraduationCap size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-emerald-300 transition-colors">Syllabus Boards Trainer</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Dynamic quiz panels divided relative to general physical board sections.
              </p>
            </div>
          </div>

          {/* Item 4: Spectral Doppler Lab */}
          <div 
            onClick={() => setViewMode('doppler')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-rose-500/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-black transition-all">
              <Activity size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-rose-300 transition-colors">Spectral Doppler shifting</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Tune angles, hemodynamics velocity flows, turbulent aliasing, and spectral graphs.
              </p>
            </div>
          </div>

          {/* Item 5: Timed Full Mock Exam */}
          <div 
            onClick={() => setViewMode('mock_exam')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-purple-500/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-all">
              <Trophy size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-purple-300 transition-colors">110Q Full Boards Mock</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Our timed premium simulated suite designed identical to official examinations.
              </p>
            </div>
          </div>

          {/* Item 6: Ask Doctor KB Assistant */}
          <div 
            onClick={() => setViewMode('chat')}
            className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-start gap-3.5 hover:border-[#00d1ff]/30 transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-lg bg-[#00d1ff]/10 text-[#00d1ff] group-hover:bg-[#00d1ff] group-hover:text-black transition-all">
              <MessageSquare size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono uppercase truncate group-hover:text-[#00d1ff] transition-colors">Ask AI Assistant Instruct</h4>
              <p className="text-[10px] text-[#8e9299] leading-relaxed mt-1">
                Full-stack grounded LLM ready to resolve complex wave and clinical scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
