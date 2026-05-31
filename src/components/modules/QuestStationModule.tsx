import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Zap, 
  Flame, 
  Trophy, 
  ShoppingBag, 
  Compass, 
  GitFork, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  Coins, 
  Play, 
  HelpCircle, 
  UserCheck, 
  Share2, 
  ArrowRight,
  TrendingUp,
  Clock,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Default mock registry score advancement logs (The fitbit for the brain)
const DEFAULT_XP_HISTORY = [
  { day: 'Mon', score: 65, xp: 120 },
  { day: 'Tue', score: 68, xp: 240 },
  { day: 'Wed', score: 72, xp: 390 },
  { day: 'Thu', score: 75, xp: 510 },
  { day: 'Fri', score: 79, xp: 740 },
  { day: 'Sat', score: 84, xp: 950 },
  { day: 'Sun', score: 88, xp: 1120 }
];

interface GamificationState {
  xp: number;
  tokens: number;
  streak: number;
  lastClaimDate: string; // ISO String
  activeQuestId: string | null;
  completedQuestIds: string[];
  unlockedPowerUps: string[];
  badges: string[];
}

export default function QuestStationModule() {
  const { user } = useAuth();
  
  // Primary Gamification local state
  const [gameState, setGameState] = useState<GamificationState>({
    xp: 220,
    tokens: 75,
    streak: 4,
    lastClaimDate: '',
    activeQuestId: null,
    completedQuestIds: [],
    unlockedPowerUps: [],
    badges: ['acoustic-apprentice']
  });

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Mini-Quest simulator states
  const [pztThickness, setPztThickness] = useState(1.0); // mm
  const [selectedPrf, setSelectedPrf] = useState(3.0); // kHz
  const [acousticOutputSetting, setAcousticOutputSetting] = useState(2.4); // MI intensity

  // Load state from Firestore or LocalStorage
  useEffect(() => {
    const loadState = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().gamification) {
            setGameState({
              ...gameState,
              ...snap.data().gamification
            });
          } else {
            // Write default gamification properties to User account
            await setDoc(docRef, { gamification: gameState }, { merge: true });
          }
        } catch (err) {
          console.warn("Could not fetch FireStore gamification, falling back to local storage:", err);
        }
      } else {
        const local = localStorage.getItem('spi_gamification_v1');
        if (local) {
          try {
            setGameState(JSON.parse(local));
          } catch {
            // reset logic
          }
        }
      }
      setLoading(false);
    };
    loadState();
  }, [user]);

  // Persists changes
  const saveState = async (updated: GamificationState) => {
    setGameState(updated);
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { gamification: updated }, { merge: true });
      } catch (err) {
        console.error("Firestore save error:", err);
      }
    } else {
      localStorage.setItem('spi_gamification_v1', JSON.stringify(updated));
    }
  };

  const addXP = (amount: number, reason: string) => {
    const updated = {
      ...gameState,
      xp: gameState.xp + amount,
      tokens: gameState.tokens + Math.round(amount * 0.4)
    };
    
    // Check level thresholds & automatically reward badge if relevant
    if (updated.xp >= 500 && !updated.badges.includes('doppler-dynamo')) {
      updated.badges.push('doppler-dynamo');
      triggerToast("🎉 Badge Unlocked: Doppler Dynamo!");
    } else if (updated.xp >= 1000 && !updated.badges.includes('physics-guru')) {
      updated.badges.push('physics-guru');
      triggerToast("🏆 Badge Unlocked: Ultimate Physics Guru!");
    } else {
      triggerToast(`+${amount} XP: ${reason}`);
    }
    
    saveState(updated);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Level computation logic
  const currentLevel = Math.floor(gameState.xp / 150) + 1;
  const currentLevelXPBasis = (currentLevel - 1) * 150;
  const xpNeededForNext = currentLevel * 150;
  const progressPercent = Math.min(
    100,
    ((gameState.xp - currentLevelXPBasis) / 150) * 100
  );

  // Daily Challenge Claim
  const handleDailyClaim = () => {
    const today = new Date().toDateString();
    if (gameState.lastClaimDate === today) {
      triggerToast("⚠️ Today's daily reward already claimed!");
      return;
    }

    setClaimLoading(true);
    setTimeout(() => {
      const updated = {
        ...gameState,
        streak: gameState.streak + 1,
        tokens: gameState.tokens + 35,
        xp: gameState.xp + 50,
        lastClaimDate: today
      };
      
      if (updated.streak >= 7 && !updated.badges.includes('streak-emperor')) {
        updated.badges.push('streak-emperor');
        triggerToast("🔥 Streak Builder: 7 Day Emperor Badge Earned!");
      }

      triggerToast("🔥 Claimed Daily Reward! +50 XP and +35 Acoustic Coins!");
      saveState(updated);
      setClaimLoading(false);
    }, 850);
  };

  // Store lists & triggers
  const storeItems = [
    {
      id: 'quiz_lifeline',
      name: '50/50 Quiz Lifeline',
      desc: 'Instantly eliminates two incorrect answers from any Master Textbook Quiz.',
      price: 50,
      icon: <HelpCircle className="text-[#00d1ff]" size={16} />
    },
    {
      id: 'double_xp',
      name: 'Twin-Acoustic XP Boost',
      desc: 'Unlocks a double XP multiplier on all active simulation & textbook actions.',
      price: 100,
      icon: <Sparkles className="text-yellow-400" size={16} />
    },
    {
      id: 'bourdain_coarse',
      name: 'Bourdain Humorous Narrator Pack',
      desc: 'Unlocks the masterclass audio package with explicit culinary metaphors and gritty wisdom.',
      price: 150,
      icon: <Volume2 className="text-[#ff5555]" size={16} />
    },
    {
      id: 'digital_cheat_sheet',
      name: 'Sonography Physics Formula Guide',
      desc: 'Provides printable formulas for Snell\'s Law, Impedance ratios, and Nyquist limits.',
      price: 60,
      icon: <GitFork className="text-[#10b981]" size={16} />
    }
  ];

  const handlePurchaseItem = (id: string, price: number, name: string) => {
    if (gameState.tokens < price) {
      triggerToast("❌ Deficient funds! Scan more lessons to earn extra Acoustic Coins.");
      return;
    }
    if (gameState.unlockedPowerUps.includes(id)) {
      triggerToast("⚠️ Item already unlocked in your acoustic utility belt.");
      return;
    }

    const updated = {
      ...gameState,
      tokens: gameState.tokens - price,
      unlockedPowerUps: [...gameState.unlockedPowerUps, id]
    };

    if (!updated.badges.includes('shopaholic')) {
      updated.badges.push('shopaholic');
    }

    triggerToast(`🛒 Unlocked powerup: ${name}!`);
    saveState(updated);
  };

  // Quests metadata
  const QUESTS = [
    {
      id: 'pzt_frequency',
      title: 'Quest A: The PZT Phantom Material',
      narrative: 'A medical scanner element has damaged. To fabricate a crystal resonant at exactly 5.0 MHz (needed for pediatric renal sweeps), you must adjust active crystal thickness. Operating frequency (f) is inversely proportional to crystal thickness!',
      rewardXP: 100,
      rewardCoins: 40,
      badge: 'pzt-artisan'
    },
    {
      id: 'doppler_aliasing',
      title: 'Quest B: The Aliasing Specter',
      narrative: 'A blood vessel exhibiting a critical 2.4 m/s stenotic velocity displays severe spectral broadening & aliasing wrap-around. Increase your Pulse Repetition Frequency (PRF) or reduce scanning depth to lift the Nyquist Limit above the target Doppler shift!',
      rewardXP: 150,
      rewardCoins: 60,
      badge: 'nyquist-conqueror'
    },
    {
      id: 'thermal_hazard',
      title: 'Quest C: pediatric Thermal Safeguard',
      narrative: 'During fetal cardiac screening, the Mechanical Index (MI) is dangerously elevated at 2.4. Lower your acoustic output power intensity to bring pediatric thermal indices inside the FDA ALARA guidelines (< 1.0).',
      rewardXP: 120,
      rewardCoins: 50,
      badge: 'safety-sentinel'
    }
  ];

  // Specific mini quest solver actions
  const solvePztQuest = () => {
    // Inversely proportional. High frequency (5.0MHz) needs thin crystal. 
    // Let's say target thickness is roughly around 0.3mm (range 0.1 to 2.0). 
    // Thickness between 0.25mm and 0.35mm is correct.
    if (pztThickness >= 0.25 && pztThickness <= 0.35) {
      if (gameState.completedQuestIds.includes('pzt_frequency')) {
        triggerToast("Re-manufactured perfect crystal! Thickness is perfect.");
        return;
      }
      const updated = {
        ...gameState,
        xp: gameState.xp + 100,
        tokens: gameState.tokens + 40,
        completedQuestIds: [...gameState.completedQuestIds, 'pzt_frequency']
      };
      if (!updated.badges.includes('pzt-artisan')) updated.badges.push('pzt-artisan');
      triggerToast("🌟 QUEST COMPLETED: Perfectly resonance-tuned 5 MHz PZT fabricated! +100 XP +40 Coins!");
      saveState(updated);
    } else {
      triggerToast(`❌ Bad Resonance! A thickness of ${pztThickness.toFixed(2)} mm yields ${ (1.5 / pztThickness).toFixed(1) } MHz. Need exactly 5.0 MHz! Thin it down.`);
    }
  };

  const solveDopplerQuest = () => {
    // Correct PRF selection: needs high Nyquist limit, so high PRF. Select PRF of 6.0 kHz or higher.
    if (selectedPrf >= 6.0) {
      if (gameState.completedQuestIds.includes('doppler_aliasing')) {
        triggerToast("Clean Doppler spectrogram resolved with high PRF limit.");
        return;
      }
      const updated = {
        ...gameState,
        xp: gameState.xp + 150,
        tokens: gameState.tokens + 60,
        completedQuestIds: [...gameState.completedQuestIds, 'doppler_aliasing']
      };
      if (!updated.badges.includes('nyquist-conqueror')) updated.badges.push('nyquist-conqueror');
      triggerToast("🌟 QUEST COMPLETED: PRF raised! Nyquist limit cleared. Spectral aliasing eliminated! +150 XP.");
      saveState(updated);
    } else {
      triggerToast(`❌ Still Aliasing! At PRF ${selectedPrf} kHz, the Nyquist max limit is only ${(selectedPrf / 2).toFixed(1)} kHz which wraps around.`);
    }
  };

  const solveSafetyQuest = () => {
    // Acoustic output setting must be <= 1.0
    if (acousticOutputSetting <= 1.0) {
      if (gameState.completedQuestIds.includes('thermal_hazard')) {
        triggerToast("Acoustic output is safely calibrated.");
        return;
      }
      const updated = {
        ...gameState,
        xp: gameState.xp + 120,
        tokens: gameState.tokens + 50,
        completedQuestIds: [...gameState.completedQuestIds, 'thermal_hazard']
      };
      if (!updated.badges.includes('safety-sentinel')) updated.badges.push('safety-sentinel');
      triggerToast("🌟 QUEST COMPLETED: Transducer output lowered below 1.0 MI! ALARA guidelines strictly satisfied! +120 XP.");
      saveState(updated);
    } else {
      triggerToast(`❌ Hazard! Acoustic output level index of ${acousticOutputSetting} is too thermal-intense for fetal soft tissue. Decrease settings!`);
    }
  };

  // Learning pathway skill nodes list
  const SKILL_NODES = [
    { id: 'physics_base', name: 'Wave Basics', status: 'mastered', desc: 'Frequency, Period, Velocity, λ', sub: 'Chapter 1' },
    { id: 'attenuation_node', name: 'dB Attenuation', status: 'mastered', desc: 'Half-boundary layers, Absorption', sub: 'Chapter 2' },
    { id: 'transducer_layout', name: 'Crystal Resonance', status: 'mastered', desc: 'Piezoelectricity & matching layout', sub: 'Chapter 3' },
    { id: 'doppler_shift', name: 'Doppler Shift Shift & Angle', status: 'active', desc: 'Velocity mapping, Blood flow', sub: 'Chapter 4' },
    { id: 'tgc_knobs', name: 'TGC Gain Knob', status: 'unlocked', desc: 'Compensation, Output vs. gain', sub: 'Chapter 5' },
    { id: 'bio_safety', name: 'Bioeffects & Safety', status: 'locked', desc: 'TI/MI limits, Hydrophone scans', sub: 'Chapter 6' }
  ];

  // cohort list metrics
  const COHORT_LEADERBOARD = [
    { name: 'Dr. Elizabeth Blackwell', xp: 1450, level: '10 (ULTRASOUND PHYSICIAN)', isUser: false },
    { name: 'Sarah Cullen (Boston Eye & Ear)', xp: 1220, level: '9 (Cardiac specialist)', isUser: false },
    { name: 'Professor Arthur (Acoustic Coach)', xp: 870, level: '6 (Chief Sonographer)', isUser: false },
    { name: 'You (Sonographer candidate)', xp: gameState.xp, level: `${currentLevel} (Level ${currentLevel})`, isUser: true },
    { name: 'Alex Cooper (Texas Heart)', xp: 330, level: '3 (Clinical Student)', isUser: false },
    { name: 'Michael Vance (Chicago Vascular)', xp: 180, level: '2 (Beginner Peer)', isUser: false }
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-8 lg:p-12 space-y-8 relative z-10">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-20 right-4 z-[999] bg-gradient-to-r from-cyan-900 to-[#16181d] border-2 border-[#00d1ff] px-6 py-4 rounded-2xl shadow-[0_0_25px_rgba(0,209,255,0.4)] flex items-center gap-3 font-mono text-xs text-white"
          >
            <Sparkles className="text-[#00d1ff] animate-spin" size={18} />
            <div>{toastMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#2d3139] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2 flex items-center gap-2">
            <Trophy size={12} className="animate-pulse" /> REGISTRY ACCELERATOR GAME SYSTEM
          </div>
          <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">
            Quest Station & <span className="text-[#8e9299]">Syllabus Pathways</span>
          </div>
        </div>

        {/* Level and digital currencies readout */}
        <div className="flex items-center gap-4 bg-[#16181d] border border-[#2d3139] rounded-2xl p-4 w-full md:w-auto justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00d1ff]/20 to-[#00d1ff]/5 border border-[#00d1ff]/40 flex items-center justify-center">
              <span className="text-sm font-bold text-[#00d1ff] font-mono">{currentLevel}</span>
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider">Active Level</div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Sonographer</div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#2d3139] hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Coins className="text-amber-400" size={18} />
            </div>
            <div>
              <div className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider">Acoustic Coins</div>
              <div className="text-xs font-mono font-bold text-amber-400">{gameState.tokens} <span className="text-[#8e9299] text-[9px]">🪙</span></div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#2d3139] hidden sm:block" />

          {/* Daily Streak claim button with animation */}
          <button 
            onClick={handleDailyClaim}
            disabled={claimLoading}
            className="flex items-center gap-2 bg-[#ff5555]/10 border border-[#ff5555]/30 hover:border-[#ff5555]/60 px-3 py-2 rounded-xl text-xs font-mono text-[#ff8888] font-bold cursor-pointer transition-all"
          >
            <Flame className="text-[#ff5555] animate-bounce" size={16} />
            <span>Streak: {gameState.streak}d</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left and Right panels */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left column (8 grid sizes): Progress, Quests, Pathways */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Progress Chart & Level Progress panel */}
          <div className="bg-[#16181d] border-2 border-[#1a1c22] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 hud-grid opacity-5 pointer-events-none" />
            <h3 className="text-sm text-white font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#00d1ff]" /> FITBIT-FOR-THE-BRAIN: XP DYNAMICS & ACCELERATOR PERFORMANCE
            </h3>

            {/* Level status progress bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-black/40 border border-[#2d3139] p-5 rounded-2xl">
              <div>
                <div className="text-[9px] text-[#8e9299] font-mono uppercase">Total Accumulated XP</div>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">{gameState.xp} XP</div>
              </div>
              <div>
                <div className="text-[9px] text-[#8e9299] font-mono uppercase">Level Boundaries</div>
                <div className="text-xs text-[#e0e0e0] font-mono mt-1">
                  Level {currentLevel}: {currentLevelXPBasis} - {xpNeededForNext} XP
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex justify-between items-center text-[9px] font-mono text-[#8e9299] mb-1">
                  <span>NEXT LEVEL {currentLevel + 1}</span>
                  <span className="text-white font-bold">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-black/80 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#00d1ff] to-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,209,255,0.4)]"
                  />
                </div>
              </div>
            </div>

            {/* Chart widget */}
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DEFAULT_XP_HISTORY}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d1ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00d1ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#5d636f" fontSize={10} tickLine={false} />
                  <YAxis stroke="#5d636f" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#16181d', borderColor: '#2d3139', borderRadius: '12px' }}
                    labelStyle={{ color: '#8e9299', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00d1ff" strokeWidth={2} fillOpacity={1} fill="url(#xpGrad)" name="Registry Readiness %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-[#8e9299] mt-3 italic font-mono text-center">
              The continuous learning telemetry plots simulated exam success based on accumulated XP values.
            </p>
          </div>

          {/* Interactive Missions / Advanture Quests */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2d3139] pb-4 mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Compass size={16} className="text-[#00d1ff]" /> Story Quests & Clinical Mini-Simulators
              </h3>
              <span className="text-[10px] font-mono text-yellow-500 uppercase">Interactive Doppler & Physics Fixes</span>
            </div>

            <div className="space-y-6">
              {QUESTS.map((quest) => {
                const isCompleted = gameState.completedQuestIds.includes(quest.id);
                return (
                  <div key={quest.id} className="bg-black/40 border border-[#2d3139] rounded-2xl p-5 md:p-6 space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="text-md font-serif italic text-white flex items-center gap-2">
                          {isCompleted && <CheckCircle className="text-[#10b981]" size={16} />}
                          {quest.title}
                        </h4>
                        <p className="text-xs text-[#8e9299] leading-relaxed mt-2 font-sans md:max-w-[580px]">{quest.narrative}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/20 px-2 py-1 rounded">
                          +{quest.rewardXP} XP
                        </span>
                        <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
                          +{quest.rewardCoins} 🪙
                        </span>
                      </div>
                    </div>

                    {/* Simulator Interactive Input Area for the quest if incomplete or reviewed */}
                    <div className="bg-black/60 border border-[#2d3139]/60 p-4 rounded-xl">
                      {quest.id === 'pzt_frequency' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-[#8e9299] font-mono uppercase block">Active PZT Crystal Thickness</label>
                            <input 
                              type="range" min="0.10" max="1.50" step="0.05"
                              value={pztThickness}
                              onChange={(e) => setPztThickness(parseFloat(e.target.value))}
                              className="w-full accent-[#00d1ff]"
                            />
                            <div className="flex justify-between text-[8px] text-[#8e9299] font-mono">
                              <span>1.5mm (THICK, LOW f)</span>
                              <span className="text-white font-bold">{pztThickness.toFixed(2)} mm</span>
                              <span>0.1mm (THIN, HIGH f)</span>
                            </div>
                          </div>
                          <button 
                            onClick={solvePztQuest}
                            className="bg-[#00d1ff] text-black font-mono font-bold text-[10px] px-4 py-2 rounded-lg cursor-pointer hover:bg-cyan-400 transition-all uppercase whitespace-nowrap self-center"
                          >
                            Fabricate Crystal
                          </button>
                        </div>
                      )}

                      {quest.id === 'doppler_aliasing' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-[#8e9299] font-mono uppercase block">Pulse Repetition Frequency (PRF)</label>
                            <input 
                              type="range" min="1.5" max="9.0" step="0.5"
                              value={selectedPrf}
                              onChange={(e) => setSelectedPrf(parseFloat(e.target.value))}
                              className="w-full accent-amber-500"
                            />
                            <div className="flex justify-between text-[8px] text-[#8e9299] font-mono">
                              <span>1.5 kHz (LOW NYQUIST)</span>
                              <span className="text-white font-bold">{selectedPrf.toFixed(1)} kHz</span>
                              <span>9.0 kHz (HIGH NYQUIST)</span>
                            </div>
                          </div>
                          <button 
                            onClick={solveDopplerQuest}
                            className="bg-amber-400 text-black font-mono font-bold text-[10px] px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-300 transition-all uppercase whitespace-nowrap self-center"
                          >
                            Calibrate PRF Range
                          </button>
                        </div>
                      )}

                      {quest.id === 'thermal_hazard' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-[#8e9299] font-mono uppercase block">Acoustic Output Power Level (MI)</label>
                            <input 
                              type="range" min="0.2" max="2.8" step="0.1"
                              value={acousticOutputSetting}
                              onChange={(e) => setAcousticOutputSetting(parseFloat(e.target.value))}
                              className="w-full accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8px] text-[#8e9299] font-mono">
                              <span>0.2 MI (Min Intensity)</span>
                              <span className="text-white font-bold">{acousticOutputSetting.toFixed(1)} MI</span>
                              <span>2.8 MI (Hazard levels)</span>
                            </div>
                          </div>
                          <button 
                            onClick={solveSafetyQuest}
                            className="bg-emerald-500 text-white font-mono font-bold text-[10px] px-4 py-2 rounded-lg cursor-pointer hover:bg-emerald-400 transition-all uppercase whitespace-nowrap self-center"
                          >
                            Set Safest ALARA Limit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Skill Tree Mapping / Syllabus Learning Pathways */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#2d3139] pb-4 mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <GitFork size={16} className="text-[#00d1ff]" /> SPI Registry Adaptive Skill Tree
              </h3>
              <span className="text-[10px] font-mono text-[#00d1ff] uppercase">Dynamic Progression Roadmap</span>
            </div>

            <div className="py-4">
              <p className="text-xs text-[#8e9299] leading-relaxed mb-6 font-sans">
                Completing interactive quizzes and clinical missions locks or unlocks specific nodes of the SPI physics syllabus tree. Hover and tap on path modules below to study competencies.
              </p>

              {/* Render dynamic list of Skill Tree items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {SKILL_NODES.map((node) => {
                  let statusBg = '';
                  let border = '';
                  let textColor = '';
                  let subText = '';
                  
                  if (node.status === 'mastered') {
                    statusBg = 'bg-emerald-500/10';
                    border = 'border-emerald-500/40 text-emerald-300';
                    textColor = 'text-emerald-400';
                    subText = '🏆 Mastered 100%';
                  } else if (node.status === 'active') {
                    statusBg = 'bg-cyan-500/10 border-2';
                    border = 'border-[#00d1ff] text-white animate-pulse';
                    textColor = 'text-[#00d1ff] font-bold';
                    subText = '⚡ Focus Study Node';
                  } else if (node.status === 'unlocked') {
                    statusBg = 'bg-yellow-500/5';
                    border = 'border-yellow-500/30 text-[#e0e0e0]';
                    textColor = 'text-yellow-500';
                    subText = '🔑 Node Unlocked';
                  } else {
                    statusBg = 'bg-[#1a1c22]/80 opacity-50';
                    border = 'border-[#2d3139] text-[#8e9299]';
                    textColor = 'text-[#8e9299]';
                    subText = '🔒 Locked. Complete chapter 5';
                  }

                  return (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative ${statusBg} ${border}`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-mono tracking-widest text-[#8e9299] uppercase">{node.sub}</span>
                          <span className="text-[9px] font-bold font-mono">{subText}</span>
                        </div>
                        <h4 className={`text-sm tracking-tight mt-1 truncate ${textColor}`}>{node.name}</h4>
                        <p className="text-[10px] text-[#8e9299] mt-1 line-clamp-1">{node.desc}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono mt-2 border-t border-[#2d3139]/40 pt-2 text-[#8e9299]">
                        <span>Curriculum Ref</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Badges, Leaderboards, Item store */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Active Badges Vault */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5 border-b border-[#2d3139] pb-4">
              <Award className="text-yellow-500" size={15} /> Your Trophies & SPI Exam Credentials
            </h3>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              {[
                { id: 'acoustic-apprentice', name: 'Acoustic Apprentice', desc: 'Read first chapter of SPI syllabus details', earned: true, color: 'text-cyan-400 bg-cyan-400/10' },
                { id: 'doppler-dynamo', name: 'Doppler Dynamo', desc: 'Achieved 500 XP inside sonography Doppler', earned: gameState.badges.includes('doppler-dynamo'), color: 'text-amber-400 bg-amber-400/10' },
                { id: 'pzt_frequency', name: 'PZT Artisan', desc: 'Fabricated high-f crystal thickness correctly', earned: gameState.completedQuestIds.includes('pzt_frequency'), color: 'text-indigo-400 bg-indigo-400/10' },
                { id: 'nyquist-conqueror', name: 'Nyquist Overlord', desc: 'Cured aliasing artifacts correctly', earned: gameState.completedQuestIds.includes('doppler_aliasing'), color: 'text-rose-400 bg-rose-400/10' },
                { id: 'safety-sentinel', name: 'ALARA Sentinel', desc: 'Resolved Pediatric thermal hazard', earned: gameState.completedQuestIds.includes('thermal_hazard'), color: 'text-emerald-400 bg-emerald-400/10' },
                { id: 'shopaholic', name: 'Power Shopper', desc: 'Bought your first premium simulator boost', earned: gameState.badges.includes('shopaholic'), color: 'text-violet-400 bg-violet-400/10 font-bold' }
              ].map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                    badge.earned 
                      ? 'bg-black/50 border-[#2d3139] shadow-inner text-white' 
                      : 'bg-black/80 border-white/5 opacity-30 text-[#8e9299]'
                  }`}
                  title={`${badge.name}: ${badge.desc}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.earned ? badge.color : 'bg-transparent text-gray-500 border border-gray-500/20'}`}>
                    <Trophy size={16} />
                  </div>
                  <div className="text-[10px] font-bold font-sans tracking-tight">{badge.name}</div>
                  <div className="text-[8px] font-mono text-[#8e9299] uppercase">
                    {badge.earned ? 'UNLOCKED' : 'LOCKED'}
                  </div>
                </div>
              ))}
            </div>

            {/* Social certificate export buttons */}
            <div className="mt-6">
              <button 
                onClick={() => setShowCertificate(true)}
                className="w-full bg-[#00d1ff]/10 hover:bg-[#00d1ff]/20 text-[#00d1ff] font-mono text-center text-[10px] font-bold border border-[#00d1ff]/20 uppercase py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={13} /> Export Exam Certificate
              </button>
            </div>
          </div>

          {/* Interactive Cohort Leaderboard */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5 border-b border-[#2d3139] pb-4">
              <UserCheck className="text-cyan-400" size={15} /> Competition Arena: Global Sonographers
            </h3>

            <div className="space-y-3 pt-2">
              {COHORT_LEADERBOARD.map((competitor, idx) => {
                const rankColor = idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-[#8e9299]';
                return (
                  <div 
                    key={competitor.name}
                    className={`p-3 rounded-xl flex items-center justify-between border ${
                      competitor.isUser 
                        ? 'bg-[#00d1ff]/10 border-[#00d1ff]/40 text-white font-bold' 
                        : 'bg-black/30 border-[#2d3139] text-[#e0e0e0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold w-4 text-center ${rankColor}`}>#{idx + 1}</span>
                      <div>
                        <div className="text-xs tracking-tight">{competitor.name}</div>
                        <div className="text-[8.5px] text-[#8e9299] uppercase font-mono">{competitor.level}</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">{competitor.xp} XP</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Virtual Coin Item Store */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5 border-b border-[#2d3139] pb-4">
              <ShoppingBag className="text-amber-400" size={15} /> Acoustic Coin Marketplace
            </h3>

            <div className="space-y-4 pt-1">
              {storeItems.map((item) => {
                const isUnlocked = gameState.unlockedPowerUps.includes(item.id);
                return (
                  <div key={item.id} className="bg-black/45 border border-[#2d3139] p-3.5 rounded-2xl relative space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      </div>
                      
                      {!isUnlocked ? (
                        <button 
                          onClick={() => handlePurchaseItem(item.id, item.price, item.name)}
                          className="bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/30 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Buy {item.price} 🪙
                        </button>
                      ) : (
                        <span className="text-[8px] bg-emerald-500/10 text-[#10b981] border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-mono font-bold">
                          Acquired
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8e9299] leading-relaxed font-sans">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Share / Export Certification Overlay Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#16181d] border-2 border-amber-500/40 rounded-3xl p-8 max-w-lg w-full relative space-y-6 text-center shadow-2xl"
            >
              {/* Seal design component */}
              <div className="w-20 h-20 rounded-full mx-auto border-4 border-amber-500/40 bg-gradient-to-tr from-[#00d1ff]/10 to-amber-500/15 flex items-center justify-center relative animate-pulse">
                <Trophy size={32} className="text-amber-500" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/5 px-3 py-1 rounded border border-amber-400/20 tracking-widest uppercase">
                  SPI REGISTRY EXAM QUALIFIED STATUS
                </span>
                <h3 className="text-2xl font-serif italic text-white mt-4">SonicBuild Academy Graduate</h3>
                <p className="text-xs text-[#8e9299] mt-2 leading-relaxed">
                  This certifies that <strong className="text-white">{user?.displayName || 'Authorized Clinician Candidate'}</strong> has successfully verified active PZT thickness calibrations, Nyquist sampling parameters, and safety limit calculations.
                </p>
              </div>

              <div className="border-t border-b border-[#2d3139] py-4 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <div className="text-[8px] text-[#8e9299] uppercase">Candidate Level</div>
                  <div className="text-lg text-white font-bold">{currentLevel}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#8e9299] uppercase">Earned Trophies</div>
                  <div className="text-lg text-amber-400 font-bold">{gameState.badges.length}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#8e9299] uppercase">Acoustic Score</div>
                  <div className="text-lg text-[#00d1ff] font-bold">{gameState.xp} XP</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    triggerToast("📧 Certification details synced to your student profile address.");
                    setShowCertificate(false);
                  }}
                  className="flex-1 bg-amber-500 border border-amber-500 text-black font-mono text-[10px] uppercase font-bold py-3.5 rounded-2xl cursor-pointer hover:bg-amber-400 transition-all"
                >
                  Share to LinkedIn
                </button>
                <button 
                  onClick={() => setShowCertificate(false)}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-[#8e9299] hover:text-white font-mono text-[10px] uppercase py-3.5 rounded-2xl cursor-pointer transition-all"
                >
                  Dismiss Frame
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
