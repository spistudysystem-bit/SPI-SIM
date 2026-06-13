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
  Volume2,
  Timer,
  CheckSquare,
  Gift,
  Activity,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import questMasterPortrait from '../../assets/images/quest_master_portrait_1781263503448.jpg';

// Default mock registry score advancement logs (The fitbit for the brain)
const DEFAULT_XP_HISTORY = [
  { day: 'Mon', score: 65, xp: 120 },
  { day: 'Tue', score: 68, xp: 240 },
  { day: 'Wed', score: 72, xp: 390 },
  { day: 'Thu', score: 75, xp: 510 },
  { day: 'Fri', score: 79, xp: 740 },
  { day: 'Sat', score: 84, xp: 950 },
  { day: 'Sun', score: 92, xp: 1220 }
];

const SPEED_SPRINT_QUESTIONS = [
  {
    q: "If sound velocity increases from soft tissue (1,540 m/s) to bone (4,080 m/s) with a constant operating f, what happens to wavelength (λ)?",
    opts: ["Wavelength is halved", "Wavelength remains unchanged", "Wavelength increases substantially", "Wavelength collapses to zero"],
    a: 2,
    desc: "Since v = f × λ, velocity is directly proportional to wavelength. Faster media results in longer wavelengths!"
  },
  {
    q: "An ultrasound pulse returns from a boundary in exactly 39 microseconds. What is the approximate distance to the reflector?",
    opts: ["1 cm", "3 cm", "6 cm", "13 cm"],
    a: 1,
    desc: "According to the 13-microsecond rule, sound takes 13 µs for every 1 cm of depth (round-trip of 2 cm). 39 µs represents 3 cm."
  },
  {
    q: "If you shift from a 2.5 MHz transducer to a 5.0 MHz transducer, what happens to the spatial pulse length (SPL) for a 3-cycle pulse?",
    opts: ["SPL is doubled", "SPL is halved", "SPL is quadrupled", "SPL is unaffected"],
    a: 1,
    desc: "As frequency doubles, wavelength halves. Since SPL = cycles × λ, the total pulse length is precisely cut in half."
  },
  {
    q: "Overadjusting the Multi-Zone TGC slider on the far field amplifies tissue echoes. Does this receiver gain change acoustic transmit energy?",
    opts: ["Yes, raises safety index TI", "Yes, increases Mechanical Index (MI)", "No, simply scales electrical signal gain", "Yes, triggers peak bioeffect warnings"],
    a: 2,
    desc: "TGC and overall gain affect the receiver amplification, not the scanner output power. Always adjust TGC before power! (ALARA)"
  },
  {
    q: "What is the primary physical source of critical color aliasing wrap-around artifacts in Spectral Doppler analysis?",
    opts: ["Doppler shift exceeding the Nyquist Limit", "Focal zone alignment divergence", "Impedance acoustic shadow reflection", "Piezoelectric element mechanical dampening"],
    a: 0,
    desc: "Aliasing occurs when the blood flow velocity shift exceeds the Nyquist Limit (which equals PRF / 2)."
  },
  {
    q: "Which frequency of sound is classified as diagnostic medical ultrasound?",
    opts: ["Below 20 Hz", "Between 20 Hz and 20 kHz", "Between 20 kHz and 100 kHz", "Above 2 MHz (2-15 MHz)"],
    a: 3,
    desc: "Human limits are 20 Hz - 20 kHz. Ultrasound is > 20 kHz, but diagnostic medical starts above 2 MHz."
  },
  {
    q: "If target blood flow is perpendicular to the sound beam (insonation angle = 90°), what velocity is measured?",
    opts: ["Zero flow is recorded", "Double true speed", "Optimal diagnostic wave", "Severe mirror echo"],
    a: 0,
    desc: "The Doppler equation contains cos(θ). Since cos(90°) = 0, no Doppler shift can be detected perpendicularly!"
  },
  {
    q: "Under the ALARA protocol, what is the best sequence to resolve a dim visual feedback image?",
    opts: ["Raise transmit power immediately", "Increase receiver gain first, then adjust power", "Switch immediately to Continuous Wave", "Widen scanning sector bounds"],
    a: 1,
    desc: "To protect the patient, maximize receiver gain (which adds no bioeffects) before increasing transmit sound energy intensity!"
  }
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

  // Adaptive Difficulty Selection state
  const [difficulty, setDifficulty] = useState<'novice' | 'associate' | 'expert'>('novice');

  // Timed Sprints Game States
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintTimer, setSprintTimer] = useState(30);
  const [activeSprintQuestion, setActiveSprintQuestion] = useState<number | null>(null);
  const [sprintScore, setSprintScore] = useState(0);

  // Easter Egg hunt state
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [easterEggCollected, setEasterEggCollected] = useState(false);

  // Daily repeatable quests list state
  const [dailyMissions, setDailyMissions] = useState([
    { id: 'daily_claim', name: 'Claim daily Registry Flame', progress: 0, target: 1, reward: 30, completed: false },
    { id: 'sprint_master', name: 'Complete a Timed Speed Sprint with 4+ correct', progress: 0, target: 1, reward: 60, completed: false },
    { id: 'expert_calibration', name: 'Solve any Story Quest on Chief Registrar (Expert) mode', progress: 0, target: 1, reward: 80, completed: false }
  ]);

  // Load state from Firestore or LocalStorage & unify with active profile
  useEffect(() => {
    const loadState = async () => {
      let userXP = 220;
      let userCoins = 75;
      let userStreak = 4;
      let userBadges: string[] = ['acoustic-apprentice'];
      let userUnlockedPowerups: string[] = [];

      if (user) {
        try {
          // Cloud mode: Load primary or active profile
          const savedActiveId = localStorage.getItem(`active_profile_${user.uid}`) || 'primary-operator';
          const profRef = doc(db, 'users', user.uid, 'profiles', savedActiveId);
          const profSnap = await getDoc(profRef);
          
          if (profSnap.exists()) {
            const pData = profSnap.data();
            userXP = pData.xp !== undefined ? pData.xp : 220;
            userCoins = pData.coins !== undefined ? pData.coins : 75;
            userStreak = pData.streak !== undefined ? pData.streak : 4;
            userBadges = pData.badges || ['acoustic-apprentice'];
            userUnlockedPowerups = pData.unlockedPowerUps || [];
          }

          // Backwards compatibility with parent gamification collection
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().gamification) {
            const g = snap.data().gamification;
            setGameState(prev => ({
              ...prev,
              ...g,
              xp: userXP,
              tokens: userCoins,
              streak: userStreak,
              badges: Array.from(new Set([...userBadges, ...(g.badges || [])])),
              unlockedPowerUps: Array.from(new Set([...userUnlockedPowerups, ...(g.unlockedPowerUps || [])])),
            }));
          } else {
            setGameState(prev => ({
              ...prev,
              xp: userXP,
              tokens: userCoins,
              streak: userStreak,
              badges: userBadges,
              unlockedPowerUps: userUnlockedPowerups,
            }));
          }
        } catch (err) {
          console.warn("Could not fetch Firestore gamification:", err);
        }
      } else {
        // Guest mode: load active profile from guest_operator_profiles
        const activeId = localStorage.getItem('active_profile_guest') || 'guest-student';
        const localProfs = localStorage.getItem('guest_operator_profiles');
        if (localProfs) {
          try {
            const parsed = JSON.parse(localProfs);
            const activeProfile = parsed.find((p: any) => p.id === activeId);
            if (activeProfile) {
              userXP = activeProfile.xp !== undefined ? activeProfile.xp : 220;
              userCoins = activeProfile.coins !== undefined ? activeProfile.coins : 75;
              userStreak = activeProfile.streak !== undefined ? activeProfile.streak : 4;
              userBadges = activeProfile.badges || ['acoustic-apprentice'];
              userUnlockedPowerups = activeProfile.unlockedPowerUps || [];
            }
          } catch (e) {
            console.warn("Failed to parse guest profiles", e);
          }
        }

        const localGStr = localStorage.getItem('spi_gamification_v1');
        if (localGStr) {
          try {
            const g = JSON.parse(localGStr);
            setGameState({
              ...g,
              xp: userXP,
              tokens: userCoins,
              streak: userStreak,
              badges: Array.from(new Set([...userBadges, ...(g.badges || [])])),
              unlockedPowerUps: Array.from(new Set([...userUnlockedPowerups, ...(g.unlockedPowerUps || [])])),
            });
          } catch {
            setGameState(prev => ({
              ...prev,
              xp: userXP,
              tokens: userCoins,
              streak: userStreak,
            }));
          }
        } else {
          setGameState(prev => ({
            ...prev,
            xp: userXP,
            tokens: userCoins,
            streak: userStreak,
            badges: userBadges,
            unlockedPowerUps: userUnlockedPowerups,
          }));
        }
      }
      setLoading(false);
    };
    loadState();

    window.addEventListener('storage', loadState);
    return () => {
      window.removeEventListener('storage', loadState);
    };
  }, [user]);

  // Persists changes and notifies other pages immediately
  const saveState = async (updated: GamificationState) => {
    setGameState(updated);
    
    if (user) {
      try {
        const savedActiveId = localStorage.getItem(`active_profile_${user.uid}`) || 'primary-operator';
        
        // 1. Save to active user profile
        const profRef = doc(db, 'users', user.uid, 'profiles', savedActiveId);
        await setDoc(profRef, {
          xp: updated.xp,
          coins: updated.tokens,
          streak: updated.streak,
          badges: updated.badges,
          unlockedPowerUps: updated.unlockedPowerUps
        }, { merge: true });

        // 2. Save to core users collection (gamification field)
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { gamification: updated }, { merge: true });
      } catch (err) {
        console.error("Firestore save error:", err);
      }
    } else {
      // Guest mode
      // 1. Update list of profiles in localStorage
      const activeId = localStorage.getItem('active_profile_guest') || 'guest-student';
      const localProfs = localStorage.getItem('guest_operator_profiles');
      if (localProfs) {
        try {
          const parsed = JSON.parse(localProfs);
          const updatedProfs = parsed.map((p: any) => {
            if (p.id === activeId) {
              return {
                ...p,
                xp: updated.xp,
                coins: updated.tokens,
                streak: updated.streak,
                badges: updated.badges,
                unlockedPowerUps: updated.unlockedPowerUps
              };
            }
            return p;
          });
          localStorage.setItem('guest_operator_profiles', JSON.stringify(updatedProfs));
        } catch (e) {
          console.error("Guest profile save error", e);
        }
      }

      // 2. Save standalone state
      localStorage.setItem('spi_gamification_v1', JSON.stringify(updated));
    }
    // Dispatch storage event to notify other modules of values shift
    window.dispatchEvent(new Event('storage'));
  };

  // Speed Sprint Timer countdown mechanism
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (sprintActive && sprintTimer > 0) {
      timerId = setTimeout(() => {
        setSprintTimer(prev => prev - 1);
      }, 1000);
    } else if (sprintActive && sprintTimer === 0) {
      endSprintGame();
    }
    return () => clearTimeout(timerId);
  }, [sprintActive, sprintTimer]);

  // Float visual easter eggs randomly
  useEffect(() => {
    const interval = setInterval(() => {
      if (!easterEggCollected && !sprintActive && Math.random() < 0.2) {
        setEasterEggActive(true);
        // Fade out after 10 seconds if not tapped
        setTimeout(() => setEasterEggActive(false), 10000);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [easterEggCollected, sprintActive]);

  const addXP = (amount: number, reason: string) => {
    // Apply difficulty multiplier to rewards
    const multiplier = difficulty === 'expert' ? 2.0 : difficulty === 'associate' ? 1.5 : 1.0;
    const finalXP = Math.round(amount * multiplier);
    const finalCoins = Math.round(amount * multiplier * 0.4);

    const updated = {
      ...gameState,
      xp: gameState.xp + finalXP,
      tokens: gameState.tokens + finalCoins
    };
    
    // Check level thresholds & automatically reward badges
    if (updated.xp >= 500 && !updated.badges.includes('doppler-dynamo')) {
      updated.badges.push('doppler-dynamo');
      triggerToast("🎉 Badge Unlocked: Doppler Dynamo!");
    } else if (updated.xp >= 1000 && !updated.badges.includes('physics-guru')) {
      updated.badges.push('physics-guru');
      triggerToast("🏆 Badge Unlocked: Ultimate Physics Guru!");
    } else {
      triggerToast(`+${finalXP} XP: ${reason}`);
    }
    
    saveState(updated);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };


  // Custom Easter Egg interaction
  const handleCollectEasterEgg = () => {
    setEasterEggCollected(true);
    setEasterEggActive(false);
    
    const updated = {
      ...gameState,
      xp: gameState.xp + 100,
      tokens: gameState.tokens + 100
    };
    if (!updated.badges.includes('sonic-explorer')) {
      updated.badges.push('sonic-explorer');
    }
    triggerToast("🏆 FOUND THE LEGENDARY GOLDEN REFLECTOR! +100 Coins & unlocked 'Sonic Explorer' badge!");
    saveState(updated);
  };

  // Timed Challanges logic
  const startSprintGame = () => {
    setSprintActive(true);
    setSprintTimer(30);
    setActiveSprintQuestion(0);
    setSprintScore(0);
    triggerToast("⏱️ Timed Sprint Initiated! Answer as fast as possible!");
  };

  const submitSprintAnswer = (optIdx: number) => {
    if (activeSprintQuestion === null) return;
    const currentQ = SPEED_SPRINT_QUESTIONS[activeSprintQuestion];
    const isCorrect = optIdx === currentQ.a;

    if (isCorrect) {
      setSprintScore(prev => prev + 1);
      triggerToast("🎯 Correct! Advanced streak!");
    } else {
      triggerToast("❌ Incorrect analysis!");
    }

    if (activeSprintQuestion + 1 < SPEED_SPRINT_QUESTIONS.length) {
      setActiveSprintQuestion(prev => prev! + 1);
    } else {
      endSprintGame();
    }
  };

  const endSprintGame = () => {
    setSprintActive(false);
    setActiveSprintQuestion(null);
    
    const xpBonus = sprintScore * 10;
    const coinBonus = sprintScore * 4;
    
    const updated = {
      ...gameState,
      xp: gameState.xp + xpBonus,
      tokens: gameState.tokens + coinBonus
    };

    triggerToast(`🏁 Sprint Over! Correct: ${sprintScore}/8. Earned +${xpBonus} XP and +${coinBonus} Coins!`);

    // Check achievement unlocked
    if (sprintScore >= 5 && !updated.badges.includes('speed-demon')) {
      updated.badges.push('speed-demon');
      triggerToast("⚡ Fast Reflexes: 'Speed Demon' Badge Unlocked!");
    }

    // Progress daily quests
    const updatedMissions = dailyMissions.map(m => {
      if (m.id === 'sprint_master' && sprintScore >= 4) {
        if (!m.completed) {
          updated.xp += m.reward;
          updated.tokens += Math.round(m.reward * 0.4);
          triggerToast(`🎯 Daily Mission Complete: Sprint Master! +${m.reward} XP`);
        }
        return { ...m, progress: 1, completed: true };
      }
      return m;
    });
    setDailyMissions(updatedMissions);

    saveState(updated);
  };


  // Level computation logic
  const currentLevel = Math.floor(gameState.xp / 150) + 1;
  const currentLevelXPBasis = (currentLevel - 1) * 150;
  const xpNeededForNext = currentLevel * 150;
  const progressPercent = Math.min(
    100,
    ((gameState.xp - currentLevelXPBasis) / 150) * 100
  );

  // Daily Challenge Flame Claim
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

      // Complete matching mission
      const updatedMissions = dailyMissions.map(m => {
        if (m.id === 'daily_claim') {
          if (!m.completed) {
            updated.xp += m.reward;
            updated.tokens += Math.round(m.reward * 0.4);
          }
          return { ...m, progress: 1, completed: true };
        }
        return m;
      });
      setDailyMissions(updatedMissions);

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
      narrative: 'During fetal cardiac screening, the Mechanical Index (MI) is dangerously elevated. Lower your acoustic output power intensity to bring pediatric thermal indices inside the FDA ALARA guidelines.',
      rewardXP: 120,
      rewardCoins: 50,
      badge: 'safety-sentinel'
    }
  ];

  // Specific mini quest solver actions incorporating difficulties
  const solvePztQuest = () => {
    // target thickness around 0.3mm.
    let isCorrect = false;
    let target = 0.3;
    let desc = '';

    if (difficulty === 'novice') {
      isCorrect = pztThickness >= 0.15 && pztThickness <= 0.45;
      desc = "Novice clearance allowed wide tolerance (0.15mm - 0.45mm).";
    } else if (difficulty === 'associate') {
      isCorrect = pztThickness >= 0.24 && pztThickness <= 0.36;
      desc = "Associate clearance required standard precision (0.24mm - 0.36mm).";
    } else {
      isCorrect = pztThickness >= 0.285 && pztThickness <= 0.315;
      desc = "Chief Registrar limits met! Microscale precision achieved (0.285mm - 0.315mm).";
    }

    if (isCorrect) {
      if (gameState.completedQuestIds.includes('pzt_frequency')) {
        triggerToast(`Ideal crystal matching achieved! ${desc}`);
        return;
      }
      const updated = {
        ...gameState,
        completedQuestIds: [...gameState.completedQuestIds, 'pzt_frequency']
      };
      if (!updated.badges.includes('pzt-artisan')) updated.badges.push('pzt-artisan');
      
      // trigger expert badge if relevant
      if (difficulty === 'expert') {
        if (!updated.badges.includes('expert-calibrator')) updated.badges.push('expert-calibrator');
        triggerToast("🏆 EXPERT CALIBRATOR UNLOCKED!");
      }

      // complete mission
      const updatedMissions = dailyMissions.map(m => {
        if (m.id === 'expert_calibration' && difficulty === 'expert') {
          updated.xp += m.reward;
          updated.tokens += Math.round(m.reward * 0.4);
          return { ...m, progress: 1, completed: true };
        }
        return m;
      });
      setDailyMissions(updatedMissions);

      triggerToast(`🌟 QUEST COMPLETED: Perfectly resonance-tuned 5 MHz PZT! ${desc}`);
      setGameState(updated);
      saveState(updated);
      addXP(100, "Successfully fabricated PZT Crystal");
    } else {
      triggerToast(`❌ Resonance Failure! At thickness of ${pztThickness.toFixed(2)} mm yields ${(1.5 / pztThickness).toFixed(1)} MHz f. Try again.`);
    }
  };

  const solveDopplerQuest = () => {
    let isCorrect = false;
    let desc = '';

    if (difficulty === 'novice') {
      isCorrect = selectedPrf >= 4.5;
      desc = "Novice clearance cleared (PRF >= 4.5 kHz).";
    } else if (difficulty === 'associate') {
      isCorrect = selectedPrf >= 6.0;
      desc = "Associate clearance met (PRF >= 6.0 kHz).";
    } else {
      isCorrect = selectedPrf >= 7.5;
      desc = "Chief Registrar exact precision met! (PRF >= 7.5 kHz). Correct Nyquist floor verified.";
    }

    if (isCorrect) {
      if (gameState.completedQuestIds.includes('doppler_aliasing')) {
        triggerToast(`Doppler Spectrogram resolved completely. ${desc}`);
        return;
      }
      const updated = {
        ...gameState,
        completedQuestIds: [...gameState.completedQuestIds, 'doppler_aliasing']
      };
      if (!updated.badges.includes('nyquist-conqueror')) updated.badges.push('nyquist-conqueror');

      if (difficulty === 'expert') {
        if (!updated.badges.includes('expert-calibrator')) updated.badges.push('expert-calibrator');
        triggerToast("🏆 EXPERT CALIBRATOR UNLOCKED!");
      }

      // complete mission
      const updatedMissions = dailyMissions.map(m => {
        if (m.id === 'expert_calibration' && difficulty === 'expert') {
          updated.xp += m.reward;
          updated.tokens += Math.round(m.reward * 0.4);
          return { ...m, progress: 1, completed: true };
        }
        return m;
      });
      setDailyMissions(updatedMissions);

      triggerToast(`🌟 QUEST COMPLETED: PRF raised to clear aliasing! ${desc}`);
      setGameState(updated);
      saveState(updated);
      addXP(150, "Cured Doppler Aliasing parameters");
    } else {
      triggerToast(`❌ Still Aliasing! At PRF ${selectedPrf} kHz, the Nyquist max limit is only ${(selectedPrf / 2).toFixed(1)} kHz which wraps around.`);
    }
  };

  const solveSafetyQuest = () => {
    let isCorrect = false;
    let desc = '';

    if (difficulty === 'novice') {
      isCorrect = acousticOutputSetting <= 1.5;
      desc = "Novice ALARA baseline cleared (MI <= 1.5).";
    } else if (difficulty === 'associate') {
      isCorrect = acousticOutputSetting <= 0.8;
      desc = "Associate ALARA pediatric limits satisfied (MI <= 0.8).";
    } else {
      isCorrect = acousticOutputSetting <= 0.4;
      desc = "Chief Registrar extreme fetal safety standards enforced (MI <= 0.4)!";
    }

    if (isCorrect) {
      if (gameState.completedQuestIds.includes('thermal_hazard')) {
        triggerToast(`Acoustic outputs safe. ${desc}`);
        return;
      }
      const updated = {
        ...gameState,
        completedQuestIds: [...gameState.completedQuestIds, 'thermal_hazard']
      };
      if (!updated.badges.includes('safety-sentinel')) updated.badges.push('safety-sentinel');

      if (difficulty === 'expert') {
        if (!updated.badges.includes('expert-calibrator')) updated.badges.push('expert-calibrator');
        triggerToast("🏆 EXPERT CALIBRATOR UNLOCKED!");
      }

      // complete mission
      const updatedMissions = dailyMissions.map(m => {
        if (m.id === 'expert_calibration' && difficulty === 'expert') {
          updated.xp += m.reward;
          updated.tokens += Math.round(m.reward * 0.4);
          return { ...m, progress: 1, completed: true };
        }
        return m;
      });
      setDailyMissions(updatedMissions);

      triggerToast(`🌟 QUEST COMPLETED: Transducer intensity calibrated safely! ${desc}`);
      setGameState(updated);
      saveState(updated);
      addXP(120, "Satisfied ALARA Safety limits");
    } else {
      triggerToast(`❌ Hazard! Acoustic output level of ${acousticOutputSetting} MI exceeds ALARA boundaries of difficulty ${difficulty.toUpperCase()}.`);
    }
  };

  // Learning pathway skill nodes list
  const SKILL_NODES = [
    { id: 'physics_base', name: 'Wave Basics', status: 'mastered', desc: 'Frequency, Period, Velocity, λ', sub: 'Chapter 1' },
    { id: 'attenuation_node', name: 'dB Attenuation', status: 'mastered', desc: 'Half-boundary layers, Absorption', sub: 'Chapter 2' },
    { id: 'transducer_layout', name: 'Crystal Resonance', status: 'mastered', desc: 'Piezoelectricity & matching layout', sub: 'Chapter 3' },
    { id: 'doppler_shift', name: 'Doppler Angle', status: 'active', desc: 'Velocity mapping, Blood flow', sub: 'Chapter 4' },
    { id: 'tgc_knobs', name: 'TGC Gain Knob', status: 'unlocked', desc: 'Compensation, Output vs. gain', sub: 'Chapter 5' },
    { id: 'bio_safety', name: 'Bioeffects & Safety', status: 'locked', desc: 'TI/MI limits, Hydrophone scans', sub: 'Chapter 6' }
  ];

  // cohort list metrics
  const COHORT_LEADERBOARD = [
    { name: 'Dr. Elizabeth Blackwell', xp: 1450, level: '10 (ULTRASOUND PHYSICIAN)', isUser: false },
    { name: 'Sarah Cullen (Boston Eye & Ear)', xp: 1220, level: '9 (Cardiac specialist)', isUser: false },
    { name: 'Professor Arthur (Acoustic Coach)', xp: 870, level: '6 (Chief Sonographer)', isUser: false },
    { name: 'You (Sonographer candidate)', xp: gameState.xp, level: `${currentLevel} (Level ${currentLevel})`, isUser: true },
    { name: 'Alex Cooper (Texas Heart)', xp: 430, level: '3 (Clinical Student)', isUser: false },
    { name: 'Michael Vance (Chicago Vascular)', xp: 210, level: '2 (Beginner Peer)', isUser: false }
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

      {/* Floating Easter Egg */}
      <AnimatePresence>
        {easterEggActive && !easterEggCollected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={handleCollectEasterEgg}
            className="fixed bottom-24 right-8 z-[90] bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-400 p-4 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.8)] cursor-pointer flex flex-col items-center justify-center gap-1.5 animate-bounce hover:scale-115 transition-all text-black"
          >
            <Gift size={24} className="text-black" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Golden Reflector Sparkle!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#2d3139] pb-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#00d1ff]/20 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,209,255,0.1)] relative">
            <img src={questMasterPortrait} alt="Quest Master" className="w-full h-full object-cover grayscale mix-blend-screen opacity-90 sepia-[0.3] hue-rotate-[-10deg]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[6px] text-[#00d1ff] font-bold mb-2 flex items-center gap-2">
              <Trophy size={12} className="animate-pulse" /> REGISTRY ACCELERATOR GAME SYSTEM
            </div>
            <div className="text-3xl md:text-4xl font-serif italic text-white tracking-tight">
              Quest Station & <span className="text-[#8e9299]">Syllabus Pathways</span>
            </div>
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
          
          {/* Adaptive Difficulty Segment Control */}
          <div className="bg-[#16181d] border border-[#2d3139] p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xs font-mono font-bold text-[#00d1ff] uppercase tracking-wider">Physics Difficulty Adaptation</h4>
              <p className="text-[10px] text-[#8e9299]">Higher difficulty levels scale the success boundaries of active story quests and amplify all XP gains!</p>
            </div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5 gap-1 self-stretch sm:self-auto">
              {(['novice', 'associate', 'expert'] as const).map((lvl) => {
                const active = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDifficulty(lvl);
                      triggerToast(`Difficulty modified to ${lvl.toUpperCase()}: ${lvl === 'expert' ? '2.0x Reward Multiplier active!' : lvl === 'associate' ? '1.5x scaling' : 'Standard 1x'}`);
                    }}
                    className={`flex-1 sm:flex-none capitalize font-mono text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
                      active ? 'bg-[#00d1ff] text-black shadow' : 'text-[#8e9299] hover:text-white'
                    }`}
                  >
                    {lvl === 'novice' ? 'Novice (1x)' : lvl === 'associate' ? 'Associate (1.5x)' : 'Chief Registrar (2x)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timed Sprints Game Board (Timed Challenges & Speed Runs) */}
          <div className="bg-gradient-to-br from-[#121318] to-[#16181d] border-2 border-red-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4 flex-wrap gap-2">
              <div>
                <span className="text-[9px] font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                  <Timer size={12} className="animate-spin" /> TIMED SPRINT CHALLENGE
                </span>
                <h3 className="text-xl font-serif text-white italic mt-1.5">30-Second Clinical Speed Run</h3>
              </div>
              
              {!sprintActive && (
                <button
                  onClick={startSprintGame}
                  className="bg-red-500 hover:bg-red-400 text-black font-mono text-[10px] uppercase font-bold py-2.5 px-5 rounded-xl cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex items-center gap-1.5 self-center"
                >
                  <Play size={12} /> Launch Sprint
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!sprintActive ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6 space-y-3"
                >
                  <Clock className="text-[#8e9299]/30 mx-auto" size={48} />
                  <p className="text-xs text-[#8e9299] max-w-md mx-auto">
                    Train diagnostic reflexes under time pressure! Answer consecutive physics questions in under 30 seconds. Score 5+ correct to earn the legendary <strong className="text-red-400">Speed Demon</strong> trophy!
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeSprintQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Progress Header */}
                  <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-2">
                    <span className="text-white">Question {activeSprintQuestion! + 1} of {SPEED_SPRINT_QUESTIONS.length}</span>
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      ⏱️ {sprintTimer}s boundaries
                    </span>
                  </div>

                  {/* Timer Bar */}
                  <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-1000"
                      style={{ width: `${(sprintTimer / 30) * 100}%` }}
                    />
                  </div>

                  {/* Question Prompt */}
                  <div className="bg-[#0b0c0f] border border-white/5 p-5 rounded-2xl">
                    <p className="text-sm font-sans tracking-wide leading-relaxed text-[#f0f0f0]">
                      {SPEED_SPRINT_QUESTIONS[activeSprintQuestion!].q}
                    </p>
                  </div>

                  {/* Answers Selector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {SPEED_SPRINT_QUESTIONS[activeSprintQuestion!].opts.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => submitSprintAnswer(optIdx)}
                        className="p-4 rounded-xl border border-white/10 bg-[#16181d] hover:bg-white/5 hover:border-[#00d1ff]/50 text-left text-xs font-mono text-[#e0e0e0] cursor-pointer transition-all flex items-center gap-3 active:scale-95"
                      >
                        <span className="w-5 h-5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center font-bold text-[10px] text-[#8e9299]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Daily Missions Panel (Engagement list checking) */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2 border-b border-[#2d3139] pb-4">
              <CheckSquare className="text-cyan-400" size={15} /> Your Daily Training Missions Agenda
            </h3>
            
            <div className="space-y-4 pt-1">
              {dailyMissions.map((mission) => (
                <div key={mission.id} className="p-4 rounded-2xl border border-white/5 bg-black/30 flex justify-between items-center flex-wrap gap-4">
                  <div className="flex gap-3.5 items-start">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${mission.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/20'}`}>
                      {mission.completed && <CheckCircle size={12} />}
                    </div>
                    <div>
                      <h4 className="text-xs text-white font-bold">{mission.name}</h4>
                      <div className="text-[10px] text-[#8e9299] font-mono mt-0.5">Value: +{mission.reward} XP / +{Math.round(mission.reward * 0.4)} Coins</div>
                    </div>
                  </div>
                  
                  <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg ${mission.completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-[#8e9299]'}`}>
                    {mission.completed ? 'COMPLETED' : 'INCOMPLETE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

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

          {/* Interactive Missions / Adventure Quests */}
          <div className="bg-[#16181d] border border-[#2d3139] rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2d3139] pb-4 mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Compass size={16} className="text-[#00d1ff]" /> Story Quests & Clinical Mini-Simulators
              </h3>
              <span className="text-[10px] font-mono text-yellow-500 uppercase">Adaptive Calibration Targets</span>
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
                { id: 'acoustic-apprentice', name: 'Apprentice', desc: 'Read first chapter of SPI syllabus details', earned: true, color: 'text-cyan-400 bg-cyan-400/10' },
                { id: 'doppler-dynamo', name: 'Doppler Dynamo', desc: 'Achieved 500 XP inside sonography Doppler', earned: gameState.badges.includes('doppler-dynamo'), color: 'text-amber-400 bg-amber-400/10' },
                { id: 'pzt_frequency', name: 'PZT Artisan', desc: 'Fabricated high-f crystal thickness correctly', earned: gameState.completedQuestIds.includes('pzt_frequency'), color: 'text-indigo-400 bg-indigo-400/10' },
                { id: 'nyquist-conqueror', name: 'Nyquist Overlord', desc: 'Cured aliasing artifacts correctly', earned: gameState.completedQuestIds.includes('doppler_aliasing'), color: 'text-rose-400 bg-rose-400/10' },
                { id: 'safety-sentinel', name: 'ALARA Sentinel', desc: 'Resolved Pediatric thermal hazard', earned: gameState.completedQuestIds.includes('thermal_hazard'), color: 'text-emerald-400 bg-emerald-400/10' },
                { id: 'shopaholic', name: 'Power Shopper', desc: 'Bought your first premium simulator boost', earned: gameState.badges.includes('shopaholic'), color: 'text-violet-400 bg-violet-400/10 font-bold' },
                { id: 'speed-demon', name: 'Speed Demon', desc: 'Scored 5+ correct answers in a Timed Sprint', earned: gameState.badges.includes('speed-demon'), color: 'text-red-400 bg-red-400/10' },
                { id: 'sonic-explorer', name: 'Sonic Explorer', desc: 'Found the legendary hidden Golden Reflector', earned: gameState.badges.includes('sonic-explorer'), color: 'text-yellow-400 bg-yellow-400/10' }
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
                <h3 className="text-2xl font-serif italic text-white mt-4">U.U.U. Underground Academy Graduate</h3>
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
