import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users, 
  Plus, 
  Trash2, 
  Award, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight, 
  Sliders, 
  Volume2, 
  Sparkles,
  Clipboard,
  ShieldAlert,
  Save,
  Layers,
  Heart,
  Star,
  Flame,
  Coins,
  Crown,
  Lock,
  Zap,
  Atom
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import undercoverUuuBadge from '../../assets/images/undercover_uuu_badge_upgraded_1781319628636.jpg';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

export interface OperatorProfile {
  id: string;
  name: string;
  track: string;
  level: string;
  voice: 'standard' | 'bourdain' | 'sedaris' | 'british';
  studyGoalMinutes: number;
  streak: number;
  completedLecturesCount: number;
  simSecondsElapsed: number;
  // Dynamic gamification elements
  avatarId?: string;
  avatarColor?: string;
  tagline?: string;
  xp?: number;
  coins?: number;
  equippedPowerup?: string;
  teamId?: string;
  difficultyMode?: 'low' | 'medium' | 'high';
  completedDailyQuests?: string[];
  unlockedBadges?: string[];
}

// Safely backfills existing operator records with custom gamified attributes
export function sanitizeProfile(p: any): OperatorProfile {
  return {
    ...p,
    xp: p.xp !== undefined ? p.xp : 120,
    coins: p.coins !== undefined ? p.coins : 50,
    streak: p.streak !== undefined ? p.streak : 1,
    avatarId: p.avatarId || 'user',
    avatarColor: p.avatarColor || '#00d1ff',
    tagline: p.tagline || 'Acoustic pioneer of ultrasound physics.',
    equippedPowerup: p.equippedPowerup || '',
    teamId: p.teamId || 'vascular-vikings',
    difficultyMode: p.difficultyMode || 'medium',
    completedDailyQuests: p.completedDailyQuests || [],
    unlockedBadges: p.unlockedBadges || ['acoustic-apprentice']
  };
}

interface ScanLog {
  id: string;
  profileId: string;
  caseId: string;
  site: string;
  psv: number; // Peak Systolic Velocity in cm/s
  edv: number; // End Diastolic Velocity in cm/s
  ri: number;  // Resistive Index: (PSV-EDV)/PSV
  findings: string;
  timestamp: string;
}

interface ProfileModuleProps {
  setViewMode: (mode: any) => void;
  dopplerAngle?: number;
  bloodVelocity?: number;
}

// Unique identifiers for abstract sonography user icons
export const AVATARS_LIST = [
  { id: 'user', label: 'Clinician User' },
  { id: 'wave', label: 'Doppler Wave' },
  { id: 'zap', label: 'Acoustic Pulse' },
  { id: 'heart', label: 'Standard Echocardiograph' },
  { id: 'shield', label: 'Safety Index ALARA' },
  { id: 'layers', label: 'Synthetic Crystal' },
  { id: 'crown', label: 'Registry Master' },
  { id: 'star', label: 'Cosmic Resonance' }
];

// Rich wave colors representing modern imaging spectrums
export const AVATAR_COLORS = [
  { color: '#00d1ff', name: 'Cyber Neon Cyan' },
  { color: '#10b981', name: 'Aurora Green' },
  { color: '#fbbf24', name: 'Solar Apex Gold' },
  { color: '#e11d48', name: 'Velocity Crimson' },
  { color: '#8b5cf6', name: 'Interstellar Purple' },
  { color: '#ff7849', name: 'Cosmic Orange' }
];

// Dynamic Lucide selection mapper
export function renderAvatarIcon(avatarId: string, size: number = 16) {
  switch (avatarId) {
    case 'wave':
      return <Activity size={size} />;
    case 'zap':
      return <Zap size={size} className="fill-current/10" />;
    case 'heart':
      return <Heart size={size} className="fill-current/10" />;
    case 'shield':
      return <ShieldAlert size={size} className="fill-current/10" />;
    case 'layers':
      return <Layers size={size} />;
    case 'crown':
      return <Crown size={size} className="fill-current/10" />;
    case 'star':
      return <Star size={size} className="fill-current/10" />;
    default:
      return <User size={size} />;
  }
}

// Pre-defined scanning presets for quick logging
const SCANNING_PRESETS = [
  { site: 'Carotid Artery', psv: 110, edv: 32, findings: 'Normal forward flow, crisp systolic upstroke with clean dicrotic notch.' },
  { site: 'Renal Artery', psv: 140, edv: 48, findings: 'Low resistance perfusion pattern, continuous diastolic velocity within standard guidelines.' },
  { site: 'Abdominal Aorta', psv: 100, edv: 12, findings: 'High resistance triphasic waveform profile, robust diastolic recoil.' },
  { site: 'Mitral Valve (Ventricle)', psv: 85, edv: 0, findings: 'Clean standard biphasic E-peak and A-peak diastoled flow ratios.' },
  { site: 'Umbilical Artery (Fetal)', psv: 42, edv: 14, findings: 'Reassuring low-impedance placental transfer velocity, positive diastolic buffer.' },
  { site: 'Stenotic Carotid Bifurcation', psv: 245, edv: 88, findings: 'Critical stenosis! Marked systolic acceleration, color aliasing, and spectral broadening.' }
];

// Quiz metadata mapped exactly to the MasterTextbook chapters and questions
const QUIZ_ANSWER_METADATA = [
  { ch: 0, title: "Sound & Wave Principles", answers: [1, 2, 1, 2, 1] },
  { ch: 1, title: "Transducers & Crystals", answers: [2, 1] },
  { ch: 2, title: "Pulse-Wave Parameters", answers: [1, 0] },
  { ch: 3, title: "Resolution and LARRD", answers: [1, 2] },
  { ch: 4, title: "Hemodynamics & Doppler", answers: [0, 2] },
  { ch: 5, title: "Knobology Controls", answers: [2, 1] },
  { ch: 6, title: "Artifact Detection", answers: [1, 1] },
  { ch: 7, title: "Bioeffects & Safety (ALARA)", answers: [2, 1] }
];

export default function ProfileModule({ setViewMode, dopplerAngle = 60, bloodVelocity = 1.0 }: ProfileModuleProps) {
  const { user, logout } = useAuth();
  const [profiles, setProfiles] = useState<OperatorProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default-operator');
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Toast Notification States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quiz progress and performance states
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showDemoBenchmarks, setShowDemoBenchmarks] = useState<boolean>(true);

  // Create profile form states
  const [formName, setFormName] = useState('');
  const [formTrack, setFormTrack] = useState('Vascular & Doppler');
  const [formLevel, setFormLevel] = useState('Beginner Student');
  const [formVoice, setFormVoice] = useState<'standard' | 'bourdain' | 'sedaris' | 'british'>('standard');
  const [formGoal, setFormGoal] = useState('60');
  const [showAddModal, setShowAddModal] = useState(false);

  // Create scan log form states
  const [scanCaseId, setScanCaseId] = useState(`SCAN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [scanSite, setScanSite] = useState('Carotid Artery');
  const [scanPsv, setScanPsv] = useState('110');
  const [scanEdv, setScanEdv] = useState('32');
  const [scanFindings, setScanFindings] = useState('Normal forward flow, crisp systolic peak.');
  const [showLogModal, setShowLogModal] = useState(false);

  // Load guest local quiz answers on mount and focus
  useEffect(() => {
    if (!user) {
      const loadLocalAnswers = () => {
        const local = localStorage.getItem('spi_textbook_quiz_answers');
        if (local) {
          try {
            setQuizAnswers(JSON.parse(local));
          } catch (e) {
            console.warn("Failed to parse local quiz answers", e);
          }
        } else {
          setQuizAnswers({});
        }
      };
      
      loadLocalAnswers();
      window.addEventListener('storage', loadLocalAnswers);
      window.addEventListener('focus', loadLocalAnswers);
      return () => {
        window.removeEventListener('storage', loadLocalAnswers);
        window.removeEventListener('focus', loadLocalAnswers);
      };
    }
  }, [user]);

  // Sync / load profile options
  useEffect(() => {
    let unsubscribeProfiles = () => {};
    let unsubscribeScans = () => {};
    let unsubscribeUser = () => {};

    if (user) {
      // Firebase-authorized loading
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeUser = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.textbookProgress && data.textbookProgress.quizAnswers) {
            setQuizAnswers(data.textbookProgress.quizAnswers);
          }
        }
      });

      const profilesRef = collection(db, 'users', user.uid, 'profiles');
      unsubscribeProfiles = onSnapshot(profilesRef, (snapshot) => {
        const loadedProfiles: OperatorProfile[] = [];
        snapshot.forEach((doc) => {
          loadedProfiles.push(sanitizeProfile({ id: doc.id, ...doc.data() }));
        });

        if (loadedProfiles.length === 0) {
          // Initialize with a default profile if none exists
          const defaultProf = sanitizeProfile({
            id: 'primary-operator',
            name: user.displayName || 'Authorized Clinician',
            track: 'Echo & General Physics',
            level: 'Certified Sonographer',
            voice: 'standard',
            studyGoalMinutes: 60,
            streak: 3,
            completedLecturesCount: 4,
            simSecondsElapsed: 1200,
            avatarId: 'crown',
            avatarColor: '#fbbf24',
            tagline: 'Lead Clinical Registrar / Physics Guide',
            xp: 320,
            coins: 120
          });
          setDoc(doc(db, 'users', user.uid, 'profiles', 'primary-operator'), defaultProf);
          loadedProfiles.push(defaultProf);
        }

        setProfiles(loadedProfiles);
        
        // Restore active profile id
        const savedActive = localStorage.getItem(`active_profile_${user.uid}`);
        if (savedActive && loadedProfiles.some(p => p.id === savedActive)) {
          setActiveProfileId(savedActive);
        } else {
          setActiveProfileId(loadedProfiles[0].id);
        }
        setLoading(false);
      });

      // Scan logs database loading
      const scansRef = collection(db, 'users', user.uid, 'scans');
      unsubscribeScans = onSnapshot(scansRef, (snapshot) => {
        const loadedScans: ScanLog[] = [];
        snapshot.forEach((doc) => {
          loadedScans.push({ id: doc.id, ...doc.data() } as ScanLog);
        });
        loadedScans.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setScanLogs(loadedScans);
      });

    } else {
      // Offline/Guest fallback modes using localStorage
      const defaultProfiles: OperatorProfile[] = [
        {
          id: 'guest-student',
          name: 'Demo Ultrasound Student',
          track: 'Vascular & Doppler',
          level: 'Beginner Student',
          voice: 'bourdain',
          studyGoalMinutes: 45,
          streak: 1,
          completedLecturesCount: 1,
          simSecondsElapsed: 340,
          avatarId: 'user',
          avatarColor: '#00d1ff',
          tagline: 'Velocity is vector, Doppler is king.',
          xp: 220,
          coins: 75,
          equippedPowerup: '',
          teamId: 'vascular-vikings',
          completedDailyQuests: []
        },
        {
          id: 'guest-physician',
          name: 'Dr. Elizabeth Blackwell',
          track: 'Echocardiography Masterclass',
          level: 'Ultrasound Physician',
          voice: 'standard',
          studyGoalMinutes: 120,
          streak: 5,
          completedLecturesCount: 8,
          simSecondsElapsed: 4200,
          avatarId: 'crown',
          avatarColor: '#8b5cf6',
          tagline: 'Echocardiography Master. ALARA safety advocate.',
          xp: 1450,
          coins: 480,
          equippedPowerup: 'double_xp',
          teamId: 'cardiac-knights',
          completedDailyQuests: []
        }
      ];

      const localProfilesStr = localStorage.getItem('guest_operator_profiles');
      if (localProfilesStr) {
        try {
          const parsed = JSON.parse(localProfilesStr);
          setProfiles(parsed.map((p: any) => sanitizeProfile(p)));
        } catch {
          setProfiles(defaultProfiles.map(p => sanitizeProfile(p)));
        }
      } else {
        localStorage.setItem('guest_operator_profiles', JSON.stringify(defaultProfiles.map(p => sanitizeProfile(p))));
        setProfiles(defaultProfiles.map(p => sanitizeProfile(p)));
      }

      const savedActive = localStorage.getItem('active_profile_guest') || 'guest-student';
      setActiveProfileId(savedActive);

      const localScansStr = localStorage.getItem('guest_scan_logs');
      if (localScansStr) {
        setScanLogs(JSON.parse(localScansStr));
      } else {
        const initialScans: ScanLog[] = [
          {
            id: 'scan-init-1',
            profileId: 'guest-student',
            caseId: 'SCAN-8022',
            site: 'Carotid Artery',
            psv: 112,
            edv: 35,
            ri: 0.69,
            findings: 'Excellent laminar velocities recorded. Smooth Doppler angle sync at 60 degrees.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'scan-init-2',
            profileId: 'guest-physician',
            caseId: 'SCAN-9134',
            site: 'Stenotic Carotid Bifurcation',
            psv: 240,
            edv: 82,
            ri: 0.66,
            findings: 'Critical jet hemodynamics detected. Significant spectral window broadening with color aliasing overlay.',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        localStorage.setItem('guest_scan_logs', JSON.stringify(initialScans));
        setScanLogs(initialScans);
      }

      setLoading(false);
    }

    return () => {
      unsubscribeProfiles();
      unsubscribeScans();
      unsubscribeUser();
    };
  }, [user]);

  // Handle setting active profile
  const handleSelectProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    if (user) {
      localStorage.setItem(`active_profile_${user.uid}`, profileId);
    } else {
      localStorage.setItem('active_profile_guest', profileId);
    }
  };

  // Get active profile properties safely
  const activeProfile = sanitizeProfile(
    profiles.find(p => p.id === activeProfileId) || profiles[0] || {
      id: 'default-operator',
      name: 'Clinical Guest',
      track: 'Vascular & Doppler',
      level: 'Beginner Student',
      voice: 'standard',
      studyGoalMinutes: 60,
      streak: 1,
      completedLecturesCount: 2,
      simSecondsElapsed: 450
    }
  );

  // Automatically sync active profile voice to localStorage narrator key for useNarrator hook
  useEffect(() => {
    if (activeProfile && activeProfile.voice) {
      localStorage.setItem('spi_narrator_voice_profile', activeProfile.voice);
    }
  }, [activeProfile?.id, activeProfile?.voice]);

  // Form submit to create a new operator profile
  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newId = `profile_${Date.now()}`;
    const newProfile = sanitizeProfile({
      id: newId,
      name: formName,
      track: formTrack,
      level: formLevel,
      voice: formVoice,
      studyGoalMinutes: parseInt(formGoal) || 60,
      streak: 1,
      completedLecturesCount: 0,
      simSecondsElapsed: 0,
      avatarId: 'user',
      avatarColor: '#00d1ff',
      tagline: 'Ultrasonic resonance engineer.',
      xp: 120,
      coins: 50,
      equippedPowerup: '',
      teamId: 'vascular-vikings'
    });

    if (user) {
      // Sync with cloud db
      const path = `users/${user.uid}/profiles/${newId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'profiles', newId), newProfile);
        showToast("👤 New sonographer ID registered on Cloud Database!");
      } catch (err) {
        console.error('Error inserting operator profile', err);
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      // Offline/Guest local storage
      const updated = [...profiles, newProfile];
      setProfiles(updated);
      localStorage.setItem('guest_operator_profiles', JSON.stringify(updated));
      showToast("👤 New sonographer ID created locally!");
    }

    setActiveProfileId(newId);
    setFormName('');
    setShowAddModal(false);
  };

  // Update profile attributes inline (e.g. customized avatar, tagline, team)
  const handleUpdatePersona = async (updates: Partial<OperatorProfile>) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, ...updates };
      }
      return p;
    });
    setProfiles(updatedProfiles);

    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'profiles', activeProfileId);
        await setDoc(docRef, updates, { merge: true });
        showToast("🎨 Sonic Persona updated. Changes synchronized to cloud!", "success");
      } catch (err) {
        console.error("Cloud persona update error:", err);
        showToast("⚠️ Could not sync persona online.", "warning");
      }
    } else {
      localStorage.setItem('guest_operator_profiles', JSON.stringify(updatedProfiles));
      // Dispatch storage event to notify other modules
      window.dispatchEvent(new Event('storage'));
      showToast("🎨 Persona style saved locally!", "success");
    }
  };

  // Delete profile option
  const handleDeleteProfile = async (pId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) return; // Must have at least one profile
    if (!confirm('Are you absolutely sure you want to delete this Operator Profile? This removes all local data.')) {
      return;
    }

    if (user) {
      const path = `users/${user.uid}/profiles/${pId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'profiles', pId));
      } catch (err) {
        console.error('Error deleting operator profile', err);
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const updated = profiles.filter(p => p.id !== pId);
      setProfiles(updated);
      localStorage.setItem('guest_operator_profiles', JSON.stringify(updated));
      if (activeProfileId === pId) {
        setActiveProfileId(updated[0].id);
      }
    }
  };

  // Filter scan logs to only show the ones taken by the active profile
  const activeProfileScans = scanLogs.filter(scan => scan.profileId === activeProfileId);

  // Form submit to log a new scan
  const handleAddScanLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const psvNum = parseFloat(scanPsv) || 100;
    const edvNum = parseFloat(scanEdv) || 30;
    const computedRi = psvNum !== 0 ? (psvNum - edvNum) / psvNum : 0;

    const newScanId = `scan_${Date.now()}`;
    const newScan: ScanLog = {
      id: newScanId,
      profileId: activeProfileId,
      caseId: scanCaseId,
      site: scanSite,
      psv: psvNum,
      edv: edvNum,
      ri: parseFloat(computedRi.toFixed(2)),
      findings: scanFindings,
      timestamp: new Date().toISOString()
    };

    if (user) {
      const path = `users/${user.uid}/scans/${newScanId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'scans', newScanId), newScan);
      } catch (err) {
        console.error('Error saving scan log', err);
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      const updated = [newScan, ...scanLogs];
      setScanLogs(updated);
      localStorage.setItem('guest_scan_logs', JSON.stringify(updated));
    }

    // Give some simulation progress stats reward randomly
    if (!user) {
      const updatedProfs = profiles.map(p => {
        if (p.id === activeProfileId) {
          return {
            ...p,
            simSecondsElapsed: p.simSecondsElapsed + 180,
            completedLecturesCount: p.completedLecturesCount + 1
          };
        }
        return p;
      });
      setProfiles(updatedProfs);
      localStorage.setItem('guest_operator_profiles', JSON.stringify(updatedProfs));
    } else {
      // Reward profile with some seconds on cloud
      try {
        await setDoc(doc(db, 'users', user.uid, 'profiles', activeProfileId), {
          ...activeProfile,
          simSecondsElapsed: (activeProfile.simSecondsElapsed || 0) + 180
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }

    // Reset scan logging form
    setScanCaseId(`SCAN-${Math.floor(1000 + Math.random() * 9000)}`);
    setScanFindings('Normal forward flow.');
    setShowLogModal(false);
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('Delete this clinical scan record?')) return;

    if (user) {
      const path = `users/${user.uid}/scans/${scanId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'scans', scanId));
      } catch (err) {
        console.error('Error deleting scan log', err);
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const updated = scanLogs.filter(s => s.id !== scanId);
      setScanLogs(updated);
      localStorage.setItem('guest_scan_logs', JSON.stringify(updated));
    }
  };

  const selectScanningPreset = (preset: typeof SCANNING_PRESETS[0]) => {
    setScanSite(preset.site);
    setScanPsv(preset.psv.toString());
    setScanEdv(preset.edv.toString());
    setScanFindings(preset.findings);
  };

  // Quick prefill of active Doppler parameters if clicked
  const handlePrefillDopplerRun = () => {
    const currentPsv = Math.round(bloodVelocity * 100);
    const estimatedEdv = Math.round(currentPsv * (Math.cos((dopplerAngle * Math.PI)/180) * 0.4 + 0.2));
    const safeEdv = Math.max(5, Math.min(estimatedEdv, currentPsv - 10));

    setScanSite(`Workbench (Angle: ${dopplerAngle}°)`);
    setScanPsv(currentPsv.toString());
    setScanEdv(safeEdv.toString());
    setScanFindings(`Live simulated workbench capture at customized velocity: ${bloodVelocity.toFixed(2)} m/s.`);
  };

  // Prefill whole quiz progress correctly for testing and development
  const prefillFullQuizProgress = async () => {
    const completedAnswers: Record<string, number> = {};
    QUIZ_ANSWER_METADATA.forEach((meta) => {
      meta.answers.forEach((ans, qIdx) => {
        completedAnswers[`${meta.ch}-${qIdx}`] = ans; // 100% correct!
      });
    });

    if (user) {
      const path = `users/${user.uid}`;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          textbookProgress: {
            quizAnswers: completedAnswers,
            updatedAt: new Date().toISOString()
          }
        }, { merge: true });
      } catch (e) {
        console.error("Firebase save fallback", e);
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      localStorage.setItem('spi_textbook_quiz_answers', JSON.stringify(completedAnswers));
      setQuizAnswers(completedAnswers);
    }
  };

  const resetQuizProgress = async () => {
    if (!confirm("Are you sure you want to completely erase textbook quiz progress?")) return;
    
    if (user) {
      const path = `users/${user.uid}`;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          textbookProgress: {
            quizAnswers: {},
            updatedAt: new Date().toISOString()
          }
        }, { merge: true });
      } catch (e) {
        console.error("Firebase save fallback", e);
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      localStorage.removeItem('spi_textbook_quiz_answers');
      setQuizAnswers({});
    }
  };

  // Compile real quiz answers metrics
  const compiledQuizData = QUIZ_ANSWER_METADATA.map((meta) => {
    const ch = meta.ch;
    const questionsCount = meta.answers.length;
    
    let totalAnswered = 0;
    let correctCount = 0;
    
    meta.answers.forEach((correctIndex, qIdx) => {
      const key = `${ch}-${qIdx}`;
      const userAns = quizAnswers[key];
      if (userAns !== undefined) {
        totalAnswered++;
        if (userAns === correctIndex) {
          correctCount++;
        }
      }
    });

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const mastery = Math.round((correctCount / questionsCount) * 100);
    const progress = Math.round((totalAnswered / questionsCount) * 100);

    return {
      ch,
      subject: meta.title,
      mastery,
      accuracy,
      progress,
      total: questionsCount,
      answered: totalAnswered,
      correct: correctCount,
    };
  });

  const hasAnyRealQuizResponses = Object.keys(quizAnswers).some(key => {
    const match = /^\d+-\d+$/.test(key);
    return match && quizAnswers[key] !== undefined;
  });

  // Combine real answers with profile-tailored demonstration data if they have no answers or explicitly have toggle on
  const dashboardSourceData = QUIZ_ANSWER_METADATA.map((meta, idx) => {
    const realVal = compiledQuizData[idx];
    
    let finalMastery = realVal.mastery;
    let finalProgress = realVal.progress;
    let finalAccuracy = realVal.accuracy;
    
    const isUsingMock = !hasAnyRealQuizResponses && showDemoBenchmarks;
    if (isUsingMock) {
      // Create high-fidelity profile-adjusted simulated curves
      let standardBias = 45;
      if (activeProfile.level.toLowerCase().includes('physician')) {
        standardBias = 85;
      } else if (activeProfile.level.toLowerCase().includes('certified') || activeProfile.level.toLowerCase().includes('specialist')) {
        standardBias = 70;
      }
      
      const waveVariance = (meta.ch * 17) % 25 - 10; // variance from -10 to +15%
      finalMastery = Math.max(15, Math.min(100, standardBias + waveVariance));
      finalProgress = Math.max(25, Math.min(100, finalMastery + 12));
      finalAccuracy = Math.max(50, Math.min(100, Math.round((finalMastery / finalProgress) * 100)));
    }

    return {
      subject: meta.title.replace(" Principles", "").replace(" Technology", "").replace(" Parameters", "").replace(" Detection", "").replace(" & Safety (ALARA)", ""), // shorten for mobile graphs
      "Mastery Score": finalMastery,
      "Answered Depth": finalProgress,
      "Precision Accuracy": finalAccuracy,
      "National Average": 72,
      rawCorrect: realVal.correct,
      rawAnswered: realVal.answered,
      rawTotal: realVal.total,
      chId: meta.ch,
    };
  });

  // Overall calculations across all chapters
  const rawSumCorrect = compiledQuizData.reduce((acc, c) => acc + c.correct, 0);
  const rawSumAnswered = compiledQuizData.reduce((acc, c) => acc + c.answered, 0);
  const rawSumTotal = compiledQuizData.reduce((acc, c) => acc + c.total, 0);

  const realOverallAccuracy = rawSumAnswered > 0 ? Math.round((rawSumCorrect / rawSumAnswered) * 100) : 0;
  const realOverallCompletion = Math.round((rawSumAnswered / rawSumTotal) * 100);
  const realWeightedMastery = Math.round((rawSumCorrect / rawSumTotal) * 100);

  const isSimulated = !hasAnyRealQuizResponses && showDemoBenchmarks;

  let displayAccuracy = realOverallAccuracy;
  let displayCompletion = realOverallCompletion;
  let displayMastery = realWeightedMastery;

  if (isSimulated) {
    let generalBias = 50;
    if (activeProfile.level.toLowerCase().includes('physician')) {
      generalBias = 88;
    } else if (activeProfile.level.toLowerCase().includes('certified')) {
      generalBias = 74;
    }
    displayAccuracy = Math.min(100, generalBias + 4);
    displayCompletion = Math.min(100, generalBias + 10);
    displayMastery = Math.min(100, Math.round((displayAccuracy * displayCompletion) / 100));
  }

  // Registry Exam Ready profile recommendation
  let passingSpectrum = {
    label: "Requires Baseline Review",
    p_text: "Student is currently in the fundamental knowledge acquisition stage. Navigate to the Master Textbook and complete Sound Principles, Transducer Crystals, and Pulse wave chapters.",
    color: "text-rose-400 bg-rose-500/5 border-rose-500/10",
    barBg: "bg-rose-500/10",
    barColor: "bg-rose-500",
    percent: displayMastery,
  };

  if (displayMastery >= 80) {
    passingSpectrum = {
      label: "Registry Certified Qualified",
      p_text: "Superb coverage of ultrasound physical physics! Scoring average indicates a strong command of the SPI syllabus, estimating a 95% passing probability on standard registry exams.",
      color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
      barBg: "bg-emerald-500/10",
      barColor: "bg-emerald-500",
      percent: displayMastery,
    };
  } else if (displayMastery >= 60) {
    passingSpectrum = {
      label: "Borderline Passing Range",
      p_text: "The clinical passing limit is within sight. Practice specific weak modules, particularly Doppler fluid dynamics and artifact profiles, to clear the borderline score window securely.",
      color: "text-amber-400 bg-amber-500/5 border-amber-500/10",
      barBg: "bg-amber-500/10",
      barColor: "bg-amber-500",
      percent: displayMastery,
    };
  }

  // Computed achievement checks
  const totalCompletedScans = activeProfileScans.length;
  const isAngleCorrectMaster = dopplerAngle <= 60 && dopplerAngle >= 45;
  const loggedTurbulentCases = activeProfileScans.some(s => s.psv > 200 || s.findings.toLowerCase().includes('stenosis') || s.findings.toLowerCase().includes('critical'));
  const holdsALARAHonor = activeProfile.simSecondsElapsed > 600;
  const isCovertOperative = activeProfile.teamId === 'undercover-uuu';
  const unlockedBadgesCount = Math.max(1, 
    (isAngleCorrectMaster ? 1 : 0) + 
    (totalCompletedScans > 0 ? 1 : 0) + 
    (loggedTurbulentCases ? 1 : 0) + 
    (holdsALARAHonor ? 1 : 0) + 
    (activeProfile.completedLecturesCount > 0 ? 1 : 0) +
    (isCovertOperative ? 1 : 0)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-8 flex-1 flex flex-col gap-6 relative"
    >
      {/* Upper Brand Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#00d1ff] font-mono text-[9px] uppercase tracking-wider mb-1">
            <Activity size={10} className="animate-pulse" />
            OPERATOR_SECURITY_CREDENTIALS_VERIFIED
          </div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-3">
             Operator Portfolio
             <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-sans">
                {user ? 'Enterprise Cloud' : 'Isolated Local'}
             </span>
          </h1>
          <p className="text-[#8e9299] text-xs mt-1">
             Manage team operator identities, review clinical scan logsheets, and analyze educational progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="tour-add-operator"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#00d1ff]/10 hover:bg-[#00d1ff] text-[#00d1ff] hover:text-black border border-[#00d1ff]/30 transition-all text-xs sm:text-sm font-mono font-bold uppercase tracking-widest cursor-pointer"
          >
            <Plus size={14} /> Add Operator
          </button>
          
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black border border-red-500/30 transition-all text-xs sm:text-sm font-mono font-bold uppercase tracking-widest cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Main Core Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left 4 Cols: Operator Switchers */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4">
             <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center justify-between">
                <span>Active Operators ({profiles.length})</span>
                <Users size={12} />
             </h2>

             {loading ? (
                <div className="flex justify-center py-6 text-white/30 font-mono text-xs items-center gap-1.5 animate-pulse">
                   <RefreshCw size={12} className="animate-spin" /> Retrieving operators...
                </div>
             ) : (
                <div className="flex flex-col gap-2.5">
                   {profiles.map(prof => {
                      const isActive = prof.id === activeProfileId;
                      return (
                         <div
                           key={prof.id}
                           onClick={() => handleSelectProfile(prof.id)}
                           className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden ${isActive ? 'bg-[#00d1ff]/5 border-[#00d1ff]/50 text-white shadow-[0_0_15px_rgba(0,209,255,0.04)]' : 'bg-transparent border-white/5 hover:border-white/20 text-[#8e9299] hover:text-white'}`}
                         >
                            <div className="flex items-start gap-3">
                               <div className={`p-2 rounded-lg ${isActive ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'bg-[#1a1c22] text-[#8e9299] group-hover:text-white'}`}>
                                  {renderAvatarIcon(prof.avatarId || 'user', 14)}
                               </div>
                               <div>
                                  <div className="text-xs uppercase font-mono font-bold tracking-wider leading-none flex items-center gap-1.5">
                                     {prof.name}
                                     {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff]" />}
                                  </div>
                                  <div className="text-[9px] text-[#8e9299] font-sans mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
                                     <span>Lvl {Math.floor((prof.xp || 120) / 100)} •</span>
                                     <span>{prof.teamId === 'cardiac-knights' ? 'Knight' : prof.teamId === 'physics-phantoms' ? 'Phantom' : prof.teamId === 'safety-guardians' ? 'Guardian' : 'Viking'} •</span>
                                     <span>{prof.track.split(' ')[0]}</span>
                                  </div>
                               </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <ChevronRight size={13} className={`transition-transform duration-300 ${isActive ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:opacity-100'}`} />
                               {profiles.length > 1 && (
                                  <button
                                    onClick={(e) => handleDeleteProfile(prof.id, e)}
                                    className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Archive profile"
                                  >
                                     <Trash2 size={13} />
                                  </button>
                               )}
                            </div>

                            {/* Background slide line indicator */}
                            {isActive && (
                               <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: prof.avatarColor || '#00d1ff' }} />
                            )}
                         </div>
                      );
                   })}
                </div>
             )}
          </div>

          {/* Premium Early Access Lifetimer Trigger Link */}
          <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-5 shadow-[0_0_25px_rgba(245,158,11,0.05)]">
             <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl" />
             <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">EARLY ACCESS PROMO</span>
             </div>
             <h3 className="text-sm font-black text-white tracking-wide leading-snug">
                Lifetime Membership Access
             </h3>
             <p className="text-[#8e9299] text-[11px] leading-relaxed mt-1">
                Unlock full unlimited credentials, premium SPI mock exams, AI board assistants, and future features forever with a single payment.
             </p>
             <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-300 tracking-tight">$350</span>
                <span className="text-xs text-[#8e9299] line-through font-mono">$1,200</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase ml-auto bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded">SAVE 70% // ONCE</span>
             </div>
             <a 
                href="https://buy.stripe.com/00w6oGanpcH8boq5tRafS0e"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black rounded-lg text-center text-xs font-mono font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(245,158,11,0.25)] cursor-pointer select-none"
             >
                Secure Lifetime Access
             </a>
          </div>

          {/* Weekly Goals Summary */}
          <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4">
             <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299]">Goals & System Settings</h2>
             
             <div className="flex flex-col gap-4">
                {/* Visual Ring Dial with statistics inside */}
                <div className="flex items-center gap-4 bg-[#0a0b0d] p-3 rounded-xl border border-white/5">
                   <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="28" cy="28" r="24" className="stroke-[#16181d] fill-transparent" strokeWidth="4" />
                         <circle 
                           cx="28" 
                           cy="28" 
                           r="24" 
                           className="stroke-[#00d1ff] fill-transparent" 
                           strokeWidth="4" 
                           strokeDasharray={2 * Math.PI * 24}
                           strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(1.0, (activeProfile.simSecondsElapsed / 60) / (activeProfile.studyGoalMinutes || 60)))}
                           strokeLinecap="round"
                         />
                      </svg>
                      <div className="absolute text-[8px] font-mono font-bold text-white">
                         {Math.round(((activeProfile.simSecondsElapsed / 60) / (activeProfile.studyGoalMinutes || 60)) * 100)}%
                      </div>
                   </div>
                   <div>
                      <div className="text-[11px] font-bold text-white uppercase font-mono tracking-wide leading-none mb-1">Weekly Target</div>
                      <div className="text-[10px] text-[#8e9299]">
                         Recorded: <span className="text-[#00d1ff] font-bold">{Math.round(activeProfile.simSecondsElapsed / 60)}m</span> / {activeProfile.studyGoalMinutes}m
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5 flex flex-col justify-between font-mono">
                      <div className="text-[8px] text-[#8e9299] uppercase">Streak Target</div>
                      <div className="text-lg font-bold text-orange-500 mt-1 flex items-center gap-1.5">
                         <Sparkles size={14} className="fill-orange-500/20" />
                         {activeProfile.streak || 0} Days
                      </div>
                   </div>
                   <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5 flex flex-col justify-between font-mono">
                      <div className="text-[8px] text-[#8e9299] uppercase">Audio Narrator</div>
                      <div className="text-[11px] font-bold text-emerald-400 uppercase mt-1.5 flex items-center gap-1.5">
                         <Volume2 size={12} />
                         {activeProfile.voice === 'bourdain' ? 'Bourdain' : activeProfile.voice === 'sedaris' ? 'Sedaris (UK F)' : activeProfile.voice === 'british' ? 'British Tutor' : 'Clinical (US)'}
                      </div>
                   </div>
                </div>
             </div>
          </div>

         {/* Clinician Persona & Live Avatar Customizer Studio */}
         <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4 font-sans text-white">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/70 flex items-center gap-1.5 font-bold">
                  <Sparkles size={11} className="text-[#00d1ff] animate-pulse" />
                  Identity Studio
               </h2>
               <span className="text-[8px] font-mono text-[#00d1ff]/85 uppercase bg-[#00d1ff]/10 border border-[#00d1ff]/20 px-2 py-0.5 rounded-full">Level {Math.floor((activeProfile.xp || 120) / 100)}</span>
            </div>

            {/* Large Dynamic Live Avatar Preview block */}
            <div className="bg-[#0a0b0d] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group select-none">
               {/* Background Gradient Orbs */}
               <div 
                 className="absolute inset-0 opacity-10 filter blur-xl group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                 style={{
                   background: `radial-gradient(circle, ${activeProfile.avatarColor || '#00d1ff'} 0%, transparent 70%)`
                 }}
               />
               
               {/* Icon Frame */}
               <div 
                 className="p-5 rounded-2xl mb-3 shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                 style={{
                   background: `${activeProfile.avatarColor || '#00d1ff'}15`,
                   color: activeProfile.avatarColor || '#00d1ff',
                   border: `2px solid ${activeProfile.avatarColor || '#00d1ff'}30`,
                   boxShadow: `0 0 15px ${activeProfile.avatarColor || '#00d1ff'}10`
                 }}
                 onClick={() => {
                   // Hidden Easter Egg: Click 5 times to trigger secret reward
                   const counts = (window as any)._eggCount || 0;
                   const newCount = counts + 1;
                   (window as any)._eggCount = newCount;
                   if (newCount === 5) {
                     const earnsEasterEgg = !activeProfile.unlockedBadges?.includes('easter-egg');
                     if (earnsEasterEgg) {
                       const updatedBadges = [...(activeProfile.unlockedBadges || []), 'easter-egg'];
                       handleUpdatePersona({
                         unlockedBadges: updatedBadges,
                         xp: (activeProfile.xp || 120) + 50,
                         coins: (activeProfile.coins || 50) + 30
                       });
                       showToast("🎉 Secret Acoustic Resonance Found! +50 XP, +30 Coins and 'Easter Egg Hunter' badge awarded!", "success");
                     } else {
                       showToast("🌸 Quiet frequencies of the crystal lattice resonate smoothly.", "info");
                     }
                   } else if (newCount < 5) {
                     showToast(`🔮 Calibrating crystal frequency... Tap ${5 - newCount} more times!`, "info");
                   }
                 }}
               >
                  {renderAvatarIcon(activeProfile.avatarId || 'user', 32)}
               </div>

               <div className="text-sm font-bold text-white font-serif italic relative z-10">{activeProfile.name}</div>
               <p className="text-[10px] text-[#8e9299] italic mt-1 px-4 relative z-10 font-mono leading-none">
                  "{activeProfile.tagline || 'Acoustic pioneer of ultrasound.'}"
               </p>

               {/* Experience and Level Progress Sub-stat */}
               <div className="w-full mt-4 pt-3.5 border-t border-white/5 flex flex-col gap-1.5 relative z-10 leading-none">
                  <div className="flex justify-between items-center text-[9px] font-mono leading-none">
                     <span className="text-[#8e9299] uppercase">XP Progress</span>
                     <span className="text-white font-bold">{(activeProfile.xp || 120) % 100} / 100 XP</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div 
                       className="h-full rounded-full transition-all duration-700 font-mono"
                       style={{
                         width: `${((activeProfile.xp || 120) % 100)}%`,
                         backgroundColor: activeProfile.avatarColor || '#00d1ff'
                       }}
                     />
                  </div>
                  <div className="flex justify-between items-center text-[8.5px] font-mono mt-1.5 text-[#8e9299] leading-none">
                     <span>Total XP: {activeProfile.xp || 120}</span>
                     <span className="text-[#ffd700] flex items-center gap-0.5 font-bold"><Coins size={9} /> {activeProfile.coins || 50} Acoustic Coins</span>
                  </div>
               </div>
            </div>

            {/* Customizer Toggles */}
            <div className="flex flex-col gap-3 font-sans">
               {/* 1. Choose Avatar Symbol */}
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-[#8e9299] uppercase tracking-wider font-mono">Select Probe Symbol</label>
                  <div className="grid grid-cols-4 gap-1.5">
                     {AVATARS_LIST.map(av => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handleUpdatePersona({ avatarId: av.id })}
                          className={`p-1.5 border rounded-lg flex items-center justify-center transition-all cursor-pointer ${activeProfile.avatarId === av.id ? 'bg-white/5 border-white/40 text-white' : 'bg-transparent border-white/5 text-white/45 hover:text-white hover:bg-white/5'}`}
                          title={av.label}
                        >
                           {renderAvatarIcon(av.id, 13)}
                        </button>
                     ))}
                  </div>
               </div>

               {/* 2. Color Palette Selector */}
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-[#8e9299] uppercase tracking-wider font-mono">Adjust Wave Theme</label>
                  <div className="flex items-center gap-2">
                     {AVATAR_COLORS.map(c => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleUpdatePersona({ avatarColor: c.color })}
                          className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center transition-transform hover:scale-110 shrink-0 relative cursor-pointer"
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        >
                           {activeProfile.avatarColor === c.color && (
                              <div className="w-1.5 h-1.5 rounded-full bg-black/80" />
                           )}
                        </button>
                     ))}
                  </div>
               </div>

               {/* 3. Competitive Team Guild */}
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-[#8e9299] uppercase tracking-wider font-mono">Join Class Cohort</label>
                  <select
                    value={activeProfile.teamId || 'vascular-vikings'}
                    onChange={(e) => {
                       const chosenTeam = e.target.value;
                       handleUpdatePersona({ teamId: chosenTeam });
                       if (chosenTeam === 'undercover-uuu') {
                         showToast("🕶️ WELCOME TO THE ULTRASOUND UNDERGROUND (U.U.)! Clandestine registry clearance protocols authorized.", "success");
                       }
                     }}
                    className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#00d1ff] cursor-pointer"
                  >
                     <option value="vascular-vikings">Vascular Vikings 🛡️ (Stenosis Scanners)</option>
                     <option value="cardiac-knights">Cardiac Knights ❤️ (Echocardiography Guild)</option>
                     <option value="physics-phantoms">Physics Phantoms 🌀 (Wave Alchemists)</option>
                     <option value="safety-guardians">ALARA Guardians 🔰 (Safety Index Masters)</option>
                      <option value="undercover-uuu">Ultrasound Underground 🕶️ (Spec-Ops Registry Solvers)</option>
                  </select>
               </div>

               {/* 4. Edit Tagline Inline */}
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-[#8e9299] uppercase tracking-wider font-mono">Custom Tagline / Bio</label>
                  <input 
                    type="text"
                    value={activeProfile.tagline || ''}
                    onChange={(e) => handleUpdatePersona({ tagline: e.target.value })}
                    maxLength={40}
                    placeholder="e.g. Velocity is vector, Doppler is king."
                    className="bg-[#0a0b0d] border border-white/10 focus:border-[#00d1ff] rounded-lg p-2 text-[10px] text-white focus:outline-none font-mono"
                  />
               </div>

               {/* 5. Narrator Voice Accent */}
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-[#8e9299] uppercase tracking-wider font-mono">Narrator Voice Accent</label>
                  <select
                    value={activeProfile.voice || 'standard'}
                    onChange={(e) => {
                      const voiceVal = e.target.value as any;
                      handleUpdatePersona({ voice: voiceVal });
                      localStorage.setItem('spi_narrator_voice_profile', voiceVal);
                    }}
                    className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#00d1ff] cursor-pointer"
                  >
                     <option value="standard">Clinical Tutor (US Standard)</option>
                     <option value="bourdain">Bourdain (American Warm)</option>
                     <option value="sedaris">Sedaris Mode (UK Female Accent)</option>
                     <option value="british">Standard British Accent (UK Professional Male)</option>
                  </select>
               </div>
            </div>
         </div>

         {/* Card: Daily Quests & Team Cohort Goals */}
         <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4 font-sans text-white">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] flex items-center gap-1.5 font-bold">
                  <Flame size={12} className="text-orange-500 animate-pulse" />
                  Daily Mini-Quests
               </h2>
               <span className="text-[8px] font-mono bg-orange-500/10 text-orange-400 font-bold px-1.5 py-0.5 rounded border border-orange-500/20">
                  Resets Daily
               </span>
            </div>

            <div className="flex flex-col gap-3">
               {/* Mini Quest 1 */}
               <div className="flex items-start justify-between bg-[#0a0b0d] p-2.5 rounded-lg border border-white/5">
                  <div className="flex gap-2">
                     <input 
                       type="checkbox" 
                       checked={activeProfile.completedDailyQuests?.includes('daily-angle') || false}
                       onChange={() => {
                         const questList = activeProfile.completedDailyQuests || [];
                         const isFinished = questList.includes('daily-angle');
                         let updated = [...questList];
                         let xpGain = 0;
                         let coinGain = 0;
                         
                         if (!isFinished) {
                           updated.push('daily-angle');
                           xpGain = 30;
                           coinGain = 15;
                           showToast("💪 Mini-Quest: Carotid Precision matched! +30 XP, +15 Coins!", "success");
                         } else {
                           updated = updated.filter(q => q !== 'daily-angle');
                           xpGain = -30;
                           coinGain = -15;
                         }
                         handleUpdatePersona({
                           completedDailyQuests: updated,
                           xp: Math.max(0, (activeProfile.xp || 120) + xpGain),
                           coins: Math.max(0, (activeProfile.coins || 50) + coinGain)
                         });
                       }}
                       className="mt-0.5 rounded border-white/20 bg-black text-cyan-400 focus:ring-0 scale-95 cursor-pointer animate-none"
                     />
                     <div>
                        <div className="text-[10px] font-bold text-white leading-none">The Golden Angle</div>
                        <p className="text-[9px] text-[#8e9299] mt-0.5 font-mono">Achieve a perfect 60° Doppler alignment in Simulator.</p>
                     </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#ffd700]">+15 Coins</span>
               </div>

               {/* Mini Quest 2 */}
               <div className="flex items-start justify-between bg-[#0a0b0d] p-2.5 rounded-lg border border-white/5">
                  <div className="flex gap-2">
                     <input 
                       type="checkbox" 
                       checked={activeProfile.completedDailyQuests?.includes('daily-scan') || false}
                       onChange={() => {
                         const questList = activeProfile.completedDailyQuests || [];
                         const isFinished = questList.includes('daily-scan');
                         let updated = [...questList];
                         let xpGain = 0;
                         let coinGain = 0;
                         
                         if (!isFinished) {
                           updated.push('daily-scan');
                           xpGain = 30;
                           coinGain = 15;
                           showToast("💪 Mini-Quest: Record Renal Flow verified! +30 XP, +15 Coins!", "success");
                         } else {
                           updated = updated.filter(q => q !== 'daily-scan');
                           xpGain = -30;
                           coinGain = -15;
                         }
                         handleUpdatePersona({
                           completedDailyQuests: updated,
                           xp: Math.max(0, (activeProfile.xp || 120) + xpGain),
                           coins: Math.max(0, (activeProfile.coins || 50) + coinGain)
                         });
                       }}
                       className="mt-0.5 rounded border-white/20 bg-black text-cyan-400 focus:ring-0 scale-95 cursor-pointer animate-none"
                     />
                     <div>
                        <div className="text-[10px] font-bold text-white leading-none">Record Renal Flow</div>
                        <p className="text-[9px] text-[#8e9299] mt-0.5 font-mono">Log low-impedance kidney flow logs.</p>
                     </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#ffd700]">+15 Coins</span>
               </div>
            </div>

            {/* Collaborative Team Challenge Progress bar */}
            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2 relative z-10 leading-none">
               <div className="flex justify-between items-center text-[9px] font-mono uppercase text-[#8e9299] font-bold">
                  <span>Collaborative Milestones</span>
                  <span className="text-[#00d1ff] font-sans">
                     {activeProfile.teamId === 'vascular-vikings' ? '82%' : activeProfile.teamId === 'cardiac-knights' ? '65%' : activeProfile.teamId === 'physics-phantoms' ? '93%' : '52%'}
                  </span>
               </div>
               <div className="bg-[#0a0b0d] p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-baseline font-mono text-[9px]">
                     <span className="font-bold text-white">Stenosis Sweep Sync</span>
                     <span className="text-[#8e9299]">4,120 / 5,000 runs</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-cyan-400 rounded-full"
                       style={{
                         width: activeProfile.teamId === 'physics-phantoms' ? '93%' : activeProfile.teamId === 'vascular-vikings' ? '82%' : activeProfile.teamId === 'cardiac-knights' ? '65%' : '52%',
                         backgroundColor: activeProfile.avatarColor || '#00d1ff'
                       }}
                     />
                  </div>
                  <p className="text-[8px] leading-tight text-[#8e9299] italic mt-1 font-mono">
                     👥 Joint targets boost sonography knowledge. Active group: <span className="text-white font-bold tracking-wider uppercase">{activeProfile.teamId?.replace('-', ' ')}</span>.
                  </p>
               </div>
            </div>
         </div>

         {/* Claimable Milestones and Real-World Rewards Panel */}
         <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4 font-sans text-white">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] flex items-center gap-1.5 font-bold">
                  <Crown size={12} className="text-[#ffd700]" />
                  Milestone Rewards
               </h2>
               <span className="text-[9px] font-mono text-[#ffd700] font-bold flex items-center gap-1">
                  <Coins size={11} /> {activeProfile.coins || 50}
               </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
               {/* Reward 1 */}
               <div className="bg-[#0a0b0d] border border-white/5 p-2.5 rounded-lg flex justify-between items-center">
                  <div className="pr-2">
                     <h4 className="text-[10.5px] font-bold text-white leading-tight">Registry Discount Pass</h4>
                     <p className="text-[8px] text-[#8e9299] font-mono mt-0.5">15% off SPI review simulators. (Needs Lvl 2+)</p>
                  </div>
                  {Math.floor((activeProfile.xp || 120) / 100) >= 2 ? (
                     <button
                       type="button"
                       onClick={() => showToast("🎫 Voucher claimed! Use code SPI_REVEAL_15 at checkout.", "success")}
                       className="px-2.5 py-1 text-[8.5px] font-mono font-bold uppercase rounded bg-cyan-500 text-black cursor-pointer shrink-0"
                     >
                        Claim
                     </button>
                  ) : (
                     <span className="text-[8px] text-white/30 font-mono flex items-center gap-0.5 shrink-0"><Lock size={9} /> Locked</span>
                  )}
               </div>

               {/* Reward 2 */}
               <div className="bg-[#0a0b0d] border border-white/5 p-2.5 rounded-lg flex justify-between items-center">
                  <div className="pr-2">
                     <h4 className="text-[10.5px] font-bold text-white leading-tight">Registry Graduate Seal</h4>
                     <p className="text-[8px] text-[#8e9299] font-mono mt-0.5">Professional certification badge. (Needs Lvl 5+)</p>
                  </div>
                  {Math.floor((activeProfile.xp || 120) / 100) >= 5 ? (
                     <button
                       type="button"
                       onClick={() => showToast("🎓 Certificate Reference RDMS-REF-" + activeProfileId.slice(-4).toUpperCase() + " generated in database archive.", "success")}
                       className="px-2.5 py-1 text-[8.5px] font-mono font-bold uppercase rounded bg-[#ffd700] text-black cursor-pointer shrink-0"
                     >
                        Graduate
                     </button>
                  ) : (
                     <span className="text-[8px] text-white/30 font-mono flex items-center gap-0.5 shrink-0"><Lock size={9} /> Locked</span>
                  )}
               </div>
            </div>
         </div>
        </div>

        {/* Right 8 Cols: Logbook Scanner & Badge Credentials */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* Panel: Live Dynamic Achievements of Current Operator */}
          <div className="border border-white/5 bg-[#16181d]/40 rounded-xl p-5 flex flex-col gap-4">
             <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] flex items-center justify-between">
                <span>Clinical Badge Portfolio • {activeProfile.name}</span>
                <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-bold px-2 py-0.5 rounded">
                   Unlocked: {unlockedBadgesCount} / 6
                </span>
             </h2>

             {/* Bento Grid Badge Layout */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* Badge 1: Scholar */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${activeProfile.completedLecturesCount > 0 ? 'bg-[#ffd700]/5 border-[#ffd700]/30 shadow-[0_0_12px_rgba(255,215,0,0.03)]' : 'bg-[#0c0d10]/50 border-white/5 opacity-50'}`}>
                   <div>
                      <div className="flex justify-between items-start mb-2.5">
                         <div className={`p-2 rounded-lg ${activeProfile.completedLecturesCount > 0 ? 'bg-[#ffd700]/20 text-[#ffd700]' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                            <BookOpen size={16} />
                         </div>
                         <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">ACADEMY</div>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Diagnostic Scholar</h3>
                      <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                         Automatically unlocks upon attending or completing an academy/library physics lecture.
                      </p>
                   </div>
                   <div className="text-[8px] font-mono text-[#ffd700]/80 mt-4 font-bold flex items-center gap-1">
                      {activeProfile.completedLecturesCount > 0 ? '✓ COMPLETE' : '⏳ COMPLETED_LECTURES: 0/1'}
                   </div>
                </div>

                {/* Badge 2: Angle Correct */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${isAngleCorrectMaster ? 'bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.03)]' : 'bg-[#0c0d10]/50 border-white/5'}`}>
                   <div>
                      <div className="flex justify-between items-start mb-2.5">
                         <div className={`p-2 rounded-lg ${isAngleCorrectMaster ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                            <TrendingUp size={16} />
                         </div>
                         <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">DOPPLER</div>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Steering Master</h3>
                      <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                         Achieved by mapping the Doppler angle perfectly between standard 45° to 60° limits.
                      </p>
                   </div>
                   <div className="text-[8px] font-mono text-indigo-400 mt-4 font-bold flex items-center gap-1">
                      {isAngleCorrectMaster ? '✓ ALIGNED (Ideal Range)' : `⏳ CURRENT_ANGLE: ${dopplerAngle}° (Stay in 45-60°)`}
                   </div>
                </div>

                {/* Badge 3: Stenotic Profiler */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${loggedTurbulentCases ? 'bg-[#00d1ff]/5 border-[#00d1ff]/30 shadow-[0_0_12px_rgba(0,209,255,0.03)]' : 'bg-[#0c0d10]/50 border-white/5 opacity-50'}`}>
                   <div>
                      <div className="flex justify-between items-start mb-2.5">
                         <div className={`p-2 rounded-lg ${loggedTurbulentCases ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                            <Activity size={16} />
                         </div>
                         <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">SCANBOOK</div>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Stenotic Profiler</h3>
                      <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                         Unlocks by diagnostic evaluation and logging of high-velocity stenotic bifurcation jets.
                      </p>
                   </div>
                   <div className="text-[8px] font-mono text-[#00d1ff] mt-4 font-bold flex items-center gap-1">
                      {loggedTurbulentCases ? '✓ PROFILE RECORDED' : '⏳ LOG_STED_CASE: 0/1'}
                   </div>
                </div>

                {/* Badge 4: ALARA Guard */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${holdsALARAHonor ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#0c0d10]/50 border-white/5'}`}>
                   <div>
                      <div className="flex justify-between items-start mb-2.5">
                         <div className={`p-2 rounded-lg ${holdsALARAHonor ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                            <Clock size={16} />
                         </div>
                         <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">ALARA</div>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Safety Advocate</h3>
                      <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                         Unlock standard by logs accumulating more than 10 minutes of active transducer simulation time.
                      </p>
                   </div>
                   <div className="text-[8px] font-mono text-emerald-400 mt-4 font-bold flex items-center gap-1">
                      {holdsALARAHonor ? '✓ GUARD OF SAFETY' : `⏳ TIME ELAPSED: ${Math.round(activeProfile.simSecondsElapsed / 60)}m / 10m`}
                   </div>
                </div>

                {/* Badge 5: Workbook Master */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${totalCompletedScans >= 3 ? 'bg-red-500/5 border-red-500/30 animate-pulse' : 'bg-[#0c0d10]/50 border-white/5 opacity-50'}`}>
                   <div>
                      <div className="flex justify-between items-start mb-2.5">
                         <div className={`p-2 rounded-lg ${totalCompletedScans >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                            <Award size={16} />
                         </div>
                         <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">WORKBOOK</div>
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Vascular Architect</h3>
                      <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                         Unlocked upon finalizing and documenting 3 or more vascular cases in your scan log.
                      </p>
                   </div>
                   <div className="text-[8px] font-mono text-red-400 mt-4 font-bold flex items-center gap-1">
                      {totalCompletedScans >= 3 ? '✓ SPECIALIST CREDENT' : `⏳ CASES_LOGGED: ${totalCompletedScans} / 3`}
                   </div>
                </div>
                 {/* Badge 6: Ultrasound Underground Operative */}
                 <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${isCovertOperative ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#0c0d10]/50 border-white/5 opacity-50'}`}>
                    <div>
                       <div className="flex justify-between items-start mb-2.5">
                          <div className={`p-2 rounded-lg ${isCovertOperative ? 'bg-amber-500/20 text-amber-500' : 'bg-[#1a1c22] text-[#8e9299]'}`}>
                             <Zap size={16} />
                          </div>
                          <div className="text-[7.5px] font-mono font-bold tracking-widest uppercase">U.U. SPEC-OPS</div>
                       </div>
                       <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide leading-none">Clandestine Agent</h3>
                       <p className="text-[9.5px] text-[#8e9299] mt-1.5 leading-normal">
                          Unlocked by joining the elite Ultrasound Underground (U.U.) class cohort. Spec-ops registry solver active.
                       </p>
                    </div>
                    <div className="text-[8px] font-mono text-amber-500 mt-4 font-bold flex items-center gap-1">
                       {isCovertOperative ? '✓ ACTIVE OPERATIVE' : '⏳ JOIN COHORT'}
                    </div>
                 </div>

             </div>
          </div>

          {/* Section: Ultrasound Underground Tactical Command Deck */}
         {isCovertOperative ? (
             <div className="border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-black rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.03)] border-dashed">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-[#ffd700]/10" />
                
                <div className="flex flex-col md:flex-row gap-5 items-center">
                   <div className="relative shrink-0 select-none group cursor-help">
                      {/* Interactive dual-glowing laser aura */}
                      <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-cyan-400 via-[#ffd700] to-[#ff007f] opacity-40 blur-md animate-pulse group-hover:opacity-70 transition-opacity duration-300 animate-spin-slow" />
                      
                      <div className="p-1 rounded-full bg-black border border-cyan-400/50 relative shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all group-hover:scale-105 duration-300">
                         <img 
                           src={undercoverUuuBadge} 
                           alt="Ultrasound Underground Logo" 
                           className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover filter brightness-110 contrast-110"
                           referrerPolicy="no-referrer"
                         />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-cyan-400 to-[#ff007f] text-white rounded-full p-1 border border-black shadow-[0_0_8px_#00f0ff]">
                         <Atom size={10} className="fill-current animate-pulse" />
                      </div>
                   </div>

                   <div className="flex-1 space-y-2 text-center md:text-left">
                      <span className="text-[9px] font-mono font-black tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded">
                         🔑 COVERT REGISTRY MODE SPEC-OPS ACCESS
                      </span>
                      <h2 className="text-md font-bold text-white font-serif uppercase tracking-wider mt-1.5">
                         Ultrasound Underground (U.U.) Command Deck
                      </h2>
                      <p className="text-xs text-[#8e9299] leading-relaxed max-w-xl font-sans">
                         Welcome, Operative. Your profile is routing scanning telemetry through our covert frequency tunnel. Maintain optimal wave angles & steering to ensure total stealth.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                   <div className="bg-black/40 border border-white/5 p-3.5 rounded-lg flex flex-col gap-2.5">
                      <h4 className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider border-b border-white/5 pb-1 flex items-center justify-between">
                         <span>📡 SQUAD OPERATIVE COMMS ON-AIR</span>
                         <span className="text-green-500 flex items-center gap-1 animate-pulse">● online</span>
                      </h4>
                      <div className="space-y-2 text-[10.5px]">
                         <div className="leading-snug text-white font-mono">
                            <span className="text-[#ffd700] font-bold font-sans">⚡ Dr. Carter (Doppler Master):</span>{" "}
                            &quot;Stealth limits locked. High-contrast carotid vectors in place.&quot;
                         </div>
                         <div className="leading-snug text-white font-mono">
                            <span className="text-[#00d1ff] font-bold font-sans">🧬 Dr. Alexander (Imaging stack):</span>{" "}
                            &quot;Gel bridge active. Secondary impedance match layer cleared.&quot;
                         </div>
                         <div className="leading-snug text-white font-mono">
                            <span className="text-purple-400 font-bold font-sans">🛡️ Tech Sarah (Safety index):</span>{" "}
                            &quot;Mechanical limits secure. Heat emission below cavitation risk.&quot;
                         </div>
                      </div>
                   </div>

                   <div className="bg-black/45 border border-white/5 p-3.5 rounded-lg flex flex-col justify-between gap-3">
                      <div>
                         <h4 className="text-[9px] font-mono text-amber-400 uppercase tracking-wider border-b border-white/5 pb-1 flex items-center justify-between">
                            <span>🛠️ CLANDESTINE TELEMETRY TOOLS</span>
                            <span className="text-amber-500 font-mono text-[9px] font-bold">U.U.-STEALTH</span>
                         </h4>
                         <div className="mt-1.5 space-y-1.5 font-mono text-[10px]">
                            <div className="flex justify-between">
                               <span className="text-[#8e9299]">Stealth PRF Frequency:</span>
                               <span className="text-[#ffd700] font-bold">4.2 kHz (Coiled)</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-[#8e9299]">Stealth Sweep Tunnel:</span>
                               <span className="text-[#00d1ff] font-bold">Encrypted SSL B-Mode</span>
                            </div>
                         </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const soundEffect = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
                          soundEffect.volume = 0.15;
                          soundEffect.play().catch(() => {});
                          
                          const currentXp = activeProfile.xp || 120;
                          const currentCoins = activeProfile.coins || 50;
                          handleUpdatePersona({
                             xp: currentXp + 50,
                             coins: currentCoins + 20
                          });
                          showToast("📡 Ultrasound Underground Stealth Sweep launched successfully! Doppler parameters encrypted. +50 XP and +20 Coins secured.", "success");
                        }}
                        className="w-full bg-[#ffd700] hover:bg-[#ffe55c] text-black font-mono font-black text-[10.5px] py-2 rounded-lg transition-all shadow-[0_0_12px_rgba(255,215,0,0.1)] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] select-none shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                         <Sparkles size={11} className="text-black fill-black" />
                         RUN TACTICAL RESONANCE SWEEP
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div 
               onClick={() => {
                 const confirmChange = window.confirm("Authorization: Join the Ultrasound Underground (U.U.) class cohort?");
                 if (confirmChange) {
                    handleUpdatePersona({ teamId: 'undercover-uuu' });
                    showToast("🕶️ WELCOME TO THE ULTRASOUND UNDERGROUND (U.U.)! Clandestine registry clearance protocols authorized.", "success");
                 }
               }}
               className="border border-white/5 bg-[#16181d]/20 rounded-xl p-4 flex items-center justify-between hover:bg-[#16181d]/40 border-dashed hover:border-amber-500/20 cursor-pointer group transition-all"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-full bg-white/5 text-[#8e9299] group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all border border-white/5">
                      <Crown size={15} />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Ultrasound Underground (U.U.) Cohort Info</h4>
                      <p className="text-[10px] text-[#8e9299]">Join the elite task force to access the stealth scanning command deck hubs.</p>
                   </div>
                </div>
                <div className="text-[9px] font-mono text-amber-500 font-bold flex items-center gap-1 bg-amber-500/[0.05] border border-amber-500/20 px-2 py-0.5 rounded opacity-80 group-hover:opacity-100 transition-all">
                   🔒 INFILTRATE COHORT
                </div>
             </div>
          )}

           {/* Section: Cognitive Quiz Performance & Syllabus Mastery Dashboard */}
          <div className="border border-white/5 bg-[#16181d]/40 rounded-xl p-5 flex flex-col gap-5">
             {/* Dashboard Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                <div>
                   <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award size={15} className="text-[#00d1ff]" />
                      Cognitive Syllabus Mastery & Quiz Diagnostics
                   </h2>
                   <p className="text-[10px] text-[#8e9299] font-mono mt-0.5 uppercase tracking-wider font-semibold">
                      {isSimulated ? "✨ SIMULATED CORRELATION INDEX" : "✓ LIVE ACADEMIC CAPTURE"} • OPERATOR LEVEL: {activeProfile.level}
                   </p>
                </div>
                
                {/* Prefill & Reset Testing Controls */}
                <div className="flex flex-wrap items-center gap-2 scale-90 sm:scale-100 origin-left">
                   {!hasAnyRealQuizResponses && (
                      <label className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none">
                         <input 
                           type="checkbox" 
                           checked={showDemoBenchmarks} 
                           onChange={(e) => setShowDemoBenchmarks(e.target.checked)}
                           className="rounded border-white/20 bg-black text-[#00d1ff] focus:ring-0 scale-90"
                         />
                         <span className="text-[9px] font-mono font-bold uppercase text-[#8e9299]">Demo Baseline</span>
                      </label>
                   )}
                   
                   {hasAnyRealQuizResponses ? (
                      <button
                        type="button"
                        onClick={resetQuizProgress}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black border border-red-500/20 text-[9px] font-mono font-bold uppercase transition-all"
                        title="Completely erase textbook quiz progress"
                      >
                         Reset Quiz
                      </button>
                   ) : (
                      <button
                        type="button"
                        onClick={prefillFullQuizProgress}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00d1ff]/10 hover:bg-[#00d1ff] text-[#00d1ff] hover:text-black border border-[#00d1ff]/20 text-[9px] font-mono font-bold uppercase transition-all"
                        title="Instant 100% correct prefill for sandbox review"
                      >
                         Prefill Mastery
                      </button>
                   )}
                </div>
             </div>

             {/* Dynamic Statistical Metrics Rows */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1: Readiness gauge dial */}
                <div className="bg-[#0a0b0d] rounded-xl p-4 border border-white/5 flex flex-col justify-between min-h-[140px]">
                   <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider font-bold">Registry Preparedness</span>
                   
                   <div className="my-2 flex flex-col justify-center">
                      <div className="flex items-baseline gap-1.5">
                         <span className="text-3xl font-serif font-black text-white">{displayMastery}%</span>
                         <span className="text-[9px] text-[#8e9299] font-mono">Mastery</span>
                      </div>
                      
                      {/* Weighted Progress bar */}
                      <div className={`h-1.5 w-full rounded-full ${passingSpectrum.barBg} overflow-hidden mt-2 relative`}>
                         <div 
                           className={`h-full rounded-full transition-all duration-1000 ${passingSpectrum.barColor}`} 
                           style={{ width: `${displayMastery}%` }}
                         />
                      </div>
                   </div>
                   
                   <div className={`px-2 py-1 rounded text-[8px] font-mono font-semibold uppercase ${passingSpectrum.color} inline-block self-start text-center`}>
                      {passingSpectrum.label}
                   </div>
                </div>

                {/* Metric 2: Precision Accuracy */}
                <div className="bg-[#0a0b0d] rounded-xl p-4 border border-white/5 flex flex-col justify-between min-h-[140px]">
                   <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider font-bold">Concept Accuracy</span>
                   <div className="my-2 text-2xl font-serif text-white font-black">{displayAccuracy}%</div>
                   <p className="text-[9.5px] text-[#8e9299] leading-normal font-sans">
                      Ratio of correct responses across all completed chapter knowledge reviews.
                   </p>
                   <div className="text-[8px] font-mono text-[#00d1ff] font-bold uppercase mt-1">
                      {displayAccuracy >= 80 ? "🎯 EXCELLENT ALIGN" : displayAccuracy >= 65 ? "⚡ PASS COGNITIVE" : "⚠️ NEEDS INTERVENE"}
                   </div>
                </div>

                {/* Metric 3: Quiz Syllabus Coverage */}
                <div className="bg-[#0a0b0d] rounded-xl p-4 border border-white/5 flex flex-col justify-between min-h-[140px]">
                   <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider font-bold">Syllabus Coverage</span>
                   <div className="my-2 text-2xl font-serif text-white font-black">{displayCompletion}%</div>
                   <p className="text-[9.5px] text-[#8e9299] leading-normal font-sans">
                      Percentage of the general 19-question SPI physics curriculum completed in study sessions.
                   </p>
                   <div className="text-[8px] font-mono text-[#8e9299] font-semibold uppercase text-white/50 mt-1">
                      Logged: {isSimulated ? Math.round(19 * (displayCompletion / 100)) : rawSumAnswered} / 19 Qs
                   </div>
                </div>

                {/* Metric 4: Academic Advisor Recommendation */}
                <div id="tour-advisor-recommendations" className="bg-[#0a0b0d] rounded-xl p-4 border border-white/5 flex flex-col justify-between min-h-[140px]">
                   <span className="text-[8px] font-mono text-[#8e9299] uppercase tracking-wider font-bold">Advisor Recommendation</span>
                   <p className="text-[9.5px] text-[#e0e0e0]/90 leading-tight font-sans my-1 text-white/80">
                      {passingSpectrum.p_text}
                   </p>
                   <button
                     type="button"
                     onClick={() => setViewMode('textbook')} 
                     className="text-[9px] font-mono font-extrabold text-[#00d1ff] flex items-center gap-1 cursor-pointer hover:underline uppercase self-start bg-transparent border-none p-0"
                   >
                      Go to Master Textbook <ChevronRight size={10} />
                   </button>
                </div>
             </div>

             {/* Charts Row: Spider Mastery and Metric Histograms */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* Left Side: Radar Matrix Chart */}
                <div id="tour-radar-chart" className="bg-[#0a0b0d]/50 rounded-xl p-4 border border-white/5 flex flex-col gap-3 lg:col-span-5 h-[290px]">
                   <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] font-bold">Mastery Spider Matrix</h3>
                   <div className="flex-1 w-full text-xs font-mono select-none">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dashboardSourceData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis 
                              dataKey="subject" 
                              tick={{ fill: "#8e9299", fontSize: 7, fontWeight: "bold" }} 
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 100]} 
                              tick={{ fill: "#8e9299", fontSize: 6 }} 
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <Radar 
                              name="My Progress" 
                              dataKey="Mastery Score" 
                              stroke="#00d1ff" 
                              fill="#00d1ff" 
                              fillOpacity={0.25} 
                            />
                            <Radar 
                              name="National Average" 
                              dataKey="National Average" 
                              stroke="#ffd700" 
                              fill="transparent" 
                              strokeDasharray="3 3"
                              strokeWidth={1.5}
                            />
                            <Tooltip 
                              contentStyle={{ background: "#14161d", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "9px", fontFamily: "monospace", color: "#fff" }}
                            />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Right Side: Horizontal Bar Chart Histograms */}
                <div className="bg-[#0a0b0d]/50 rounded-xl p-4 border border-white/5 flex flex-col gap-3 lg:col-span-7 h-[290px]">
                   <div className="flex justify-between items-center bg-[#0d0f14] p-2 rounded-lg border border-white/5">
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] font-bold">Topic Efficiency Metrics</h3>
                      <div className="flex items-center gap-3 text-[8.5px] font-mono text-[#8e9299]">
                         <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00d1ff] rounded"></span> Mastery %</span>
                         <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded"></span> Accuracy %</span>
                      </div>
                   </div>
                   <div className="flex-1 w-full text-[8.5px] font-mono mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart 
                           data={dashboardSourceData} 
                           layout="vertical"
                           margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                         >
                            <XAxis 
                              type="number" 
                              domain={[0, 100]} 
                              tick={{ fill: "#8e9299", fontSize: 8 }} 
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <YAxis 
                              dataKey="subject" 
                              type="category" 
                              tick={{ fill: "#fff", fontSize: 7, width: 85 }} 
                              stroke="rgba(255,255,255,0.1)"
                              width={90}
                            />
                            <Tooltip 
                              contentStyle={{ background: "#14161d", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "9px", fontFamily: "monospace", color: "#fff" }}
                            />
                            <Bar dataKey="Mastery Score" fill="#00d1ff" radius={[0, 4, 4, 0]} barSize={5} />
                            <Bar dataKey="Precision Accuracy" fill="#10b981" radius={[0, 4, 4, 0]} barSize={5} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>

             {/* Modular Diagnostic Breakdowns bento grids */}
             <div className="bg-[#0a0b0d] rounded-xl p-4 border border-white/5 flex flex-col gap-3.5">
                <div>
                   <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8e9299] font-bold">Syllabus Breakdown & Module Grades</h3>
                   <p className="text-[9px] text-[#8e9299] mt-0.5 font-sans leading-normal">
                      Live cognitive grades based on custom textbook sessions. Navigate to the Master Textbook and finalize pending quizzes to push mastery ratings upwards.
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                   {dashboardSourceData.map((item, idx) => {
                      const masteryScore = item["Mastery Score"];
                      const answersCount = item.rawTotal;
                      const correctAnswers = item.rawCorrect;
                      
                      let grColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                      let borderStyle = "border-white/5 hover:border-rose-500/10";
                      let statusPillText = "Needs Review";
                      let commentStr = "Revise chapter " + (idx + 1) + " reading.";

                      if (masteryScore >= 80) {
                         grColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                         borderStyle = "border-white/5 hover:border-emerald-500/10";
                         statusPillText = "Mastered";
                         commentStr = "Excellent competency. Registry exam ready!";
                      } else if (masteryScore >= 50) {
                         grColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                         borderStyle = "border-white/5 hover:border-amber-500/10";
                         statusPillText = "Proficient";
                         commentStr = "Execute more quizzes to clear criteria standard.";
                      }

                      return (
                         <div 
                           key={idx} 
                           className={`p-3 rounded-lg border ${borderStyle} bg-[#14161d]/50 transition-all flex flex-col justify-between gap-1.5 font-sans`}
                         >
                            <div className="flex justify-between items-start">
                               <span className="text-[9.5px] font-mono font-bold text-white leading-tight uppercase max-w-[130px]">
                                  CH 0{idx + 1}: {QUIZ_ANSWER_METADATA[idx].title}
                               </span>
                               <span className={`text-[7px] font-mono font-bold uppercase px-2 py-0.5 border rounded ${grColor}`}>
                                  {statusPillText}
                               </span>
                            </div>
                            
                            <div className="flex justify-between items-baseline mt-1 font-mono">
                               <span className="text-[9.5px] text-[#8e9299]">Level Score:</span>
                               <span className="text-xs font-black text-white">{masteryScore}%</span>
                            </div>

                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-0.5">
                               <div 
                                 className={`h-full rounded-full transition-all duration-700 ${masteryScore >= 80 ? 'bg-emerald-500' : masteryScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                 style={{ width: `${masteryScore}%` }}
                               />
                            </div>
                            
                            <div className="text-[8.5px] text-[#8e9299] flex justify-between mt-1 border-t border-white/5 pt-1.5 font-mono">
                               <span>Grading:</span>
                               <span>
                                  {isSimulated ? `${Math.round(answersCount * (masteryScore / 100))} / ${answersCount}` : `${correctAnswers} / ${answersCount}`} Correct
                               </span>
                            </div>

                            <p className="text-[8.5px] leading-normal text-white/50 italic mt-0.5 font-mono">
                               💡 {commentStr}
                            </p>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

          {/* Section: Clinical Worksheet Scan logs */}
          <div className="border border-white/5 bg-[#16181d]/60 rounded-xl p-5 flex flex-col gap-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                <div>
                   <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clipboard size={14} className="text-[#00d1ff]" />
                      Clinical Scan Logbook ({activeProfileScans.length})
                   </h2>
                   <p className="text-[10px] text-[#8e9299] font-mono uppercase mt-0.5 tracking-wider font-semibold">Active: {activeProfile.name}</p>
                </div>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all self-stretch sm:self-auto justify-center"
                >
                   <Plus size={12} /> Log New Scan
                </button>
             </div>

             {activeProfileScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-[#0a0b0d] rounded-xl border border-dashed border-white/5">
                   <Clipboard size={22} className="text-white/20 mb-2" />
                   <p className="text-xs text-white/50 font-mono uppercase">Logbook Is Empty</p>
                   <p className="text-[10px] text-white/30 max-w-[280px] mt-1">
                      Click 'Log New Scan' or capture live velocities directly to record standard ultrasound pathology.
                   </p>
                </div>
             ) : (
                <div className="flex flex-col gap-3">
                   {activeProfileScans.map(scan => (
                      <div 
                        key={scan.id}
                        className="bg-[#0a0b0d] border border-white/5 hover:border-white/15 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 transition-all relative"
                      >
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-[10px] font-mono font-bold text-[#00d1ff] bg-[#00d1ff]/10 px-2 py-0.5 rounded">
                                  {scan.caseId}
                               </span>
                               <span className="text-xs text-white uppercase tracking-wider font-serif italic">
                                  {scan.site}
                               </span>
                               <span className="text-[8px] font-mono text-white/30 ml-auto md:ml-0">
                                  {new Date(scan.timestamp).toLocaleString()}
                               </span>
                            </div>
                            <p className="text-[10px] text-white/75 bg-white/2 p-2 rounded-lg border border-white/5 italic">
                               "{scan.findings}"
                            </p>
                         </div>

                         {/* Spectral/Calculations HUD panel */}
                         <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 shrink-0 min-w-[120px] gap-2">
                            <div className="flex gap-4 md:flex-col md:gap-1.5 md:items-end">
                               <div className="text-[9px] font-mono text-white/50">
                                  PSV: <span className="text-white font-bold">{scan.psv}</span> cm/s
                               </div>
                               <div className="text-[9px] font-mono text-white/50">
                                  EDV: <span className="text-white font-bold">{scan.edv}</span> cm/s
                               </div>
                            </div>
                            <div className="md:mt-1 border-t border-white/5 md:pt-1">
                               <div className="text-[9px] font-mono text-yellow-500 font-bold flex items-center gap-1">
                                  RI (Resistive Index): <span className="text-white text-xs underline decoration-yellow-500 font-bold">{(scan.ri || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                              onClick={() => handleDeleteScan(scan.id)}
                              className="p-1 rounded text-red-500/70 hover:bg-red-500/10 cursor-pointer self-start md:self-auto"
                              title="Delete record"
                            >
                               <Trash2 size={12} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>

        </div>
      </div>

      {/* MODAL: ADD OPERATOR PROFILE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#14161d] w-full max-w-[420px] rounded-xl border border-white/10 overflow-hidden shadow-2xl"
             >
                <div className="bg-[#1c1f26] p-4 border-b border-white/10 flex justify-between items-center">
                   <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#00d1ff] flex items-center gap-2">
                      <Users size={14} /> Add Sonographer ID
                   </h3>
                   <button onClick={() => setShowAddModal(false)} className="text-[#8e9299] hover:text-white">&times;</button>
                </div>
                
                <form onSubmit={handleAddProfile} className="p-5 flex flex-col gap-4 font-mono">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">OPERATOR_NICKNAME</label>
                      <input 
                        type="text"
                        placeholder="e.g. Dr. Carter, Tech_Alex"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                        required
                        maxLength={24}
                      />
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">FOCUS_PRACTICE_TRACK</label>
                      <select
                        value={formTrack}
                        onChange={(e) => setFormTrack(e.target.value)}
                        className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                      >
                         <option value="Vascular & Doppler">Vascular & Doppler Physics</option>
                         <option value="Echocardiography Masterclass">Echocardiography Masterclass</option>
                         <option value="General Abdominal / OB">General Abdominal / OB</option>
                         <option value="Fundamental Physics Core">Fundamental Physics Core</option>
                      </select>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">OPERATOR_EXPERIENCE_LEVEL</label>
                      <select
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value)}
                        className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                      >
                         <option value="Beginner Student">Beginner Student / Resident</option>
                         <option value="Certified Sonographer">Certified Sonographer (RDMS)</option>
                         <option value="Ultrasound Physician">Ultrasound Physician (Cardiologist/Radiologist)</option>
                      </select>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">AUDIO_NARRATION_PREFERENCE</label>
                      <div className="grid grid-cols-4 gap-2">
                         {(['standard', 'bourdain', 'sedaris', 'british'] as const).map(style => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => setFormVoice(style)}
                              className={`py-1.5 border rounded-lg text-[8px] uppercase font-bold transition-all ${formVoice === style ? 'bg-[#00d1ff]/10 border-[#00d1ff] text-[#00d1ff]' : 'bg-transparent border-white/5 text-[#8e9299] hover:text-white'}`}
                            >
                               {style === 'standard' ? 'Clinical' : style === 'bourdain' ? 'Bourdain' : style === 'sedaris' ? 'Sedaris' : 'British'}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">WEEKLY_STUDY_TARGET (MINS)</label>
                      <input 
                        type="number"
                        min="15"
                        max="480"
                        value={formGoal}
                        onChange={(e) => setFormGoal(e.target.value)}
                        className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                        required
                      />
                   </div>

                   <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4 mt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-1.5 text-xs text-white/50 hover:text-white"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00d1ff] text-black rounded-lg text-xs font-bold font-sans tracking-wide"
                      >
                         <Save size={12} /> Save Operator
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: LOG NEW SCAN */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#14161d] w-full max-w-[480px] rounded-xl border border-white/10 overflow-hidden shadow-2xl"
             >
                <div className="bg-[#1c1f26] p-4 border-b border-white/10 flex justify-between items-center">
                   <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#00d1ff] flex items-center gap-2">
                      <Clipboard size={14} /> Record Simulated Examination
                   </h3>
                   <button onClick={() => setShowLogModal(false)} className="text-[#8e9299] hover:text-white">&times;</button>
                </div>
                
                <div className="p-4 bg-[#0a0b0d] border-b border-white/5">
                   <div className="text-[7.5px] font-mono text-[#8e9299] mb-1.5 uppercase font-bold tracking-widest">Select Pathology Template:</div>
                   <div className="flex flex-wrap gap-1.5">
                      {SCANNING_PRESETS.map((preset, idx) => (
                         <button
                           key={idx}
                           onClick={() => selectScanningPreset(preset)}
                           className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00d1ff]/50 px-2.5 py-1 rounded text-[8.5px] font-mono text-white transition-all"
                         >
                            {preset.site}
                         </button>
                      ))}
                   </div>
                </div>

                <form onSubmit={handleAddScanLog} className="p-5 flex flex-col gap-4 font-mono">
                   
                   <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">PATIENT_CASE_ID</label>
                         <input 
                           type="text"
                           value={scanCaseId}
                           onChange={(e) => setScanCaseId(e.target.value)}
                           className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                           required
                         />
                      </div>
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">PREFILL_LATEST_WORKRUN</label>
                         <button
                           type="button"
                           onClick={handlePrefillDopplerRun}
                           className="py-1.5 px-2 text-[8px] text-[#00d1ff] border border-[#00d1ff]/30 hover:border-[#00d1ff] bg-[#00d1ff]/5 hover:bg-[#00d1ff]/15 rounded-lg flex items-center justify-center gap-1.5 h-full"
                         >
                            <Sliders size={11} /> Grab Doppler Run
                         </button>
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">BIOMARKER_ARTERIAL_SITE</label>
                      <input 
                        type="text"
                        value={scanSite}
                        onChange={(e) => setScanSite(e.target.value)}
                        className="bg-[#0a0b0d] border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                        required
                        maxLength={40}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">PEAK_SYSTOLIC (cm/s)</label>
                         <input 
                           type="number"
                           value={scanPsv}
                           onChange={(e) => setScanPsv(e.target.value)}
                           className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                           required
                         />
                      </div>
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">END_DIASTOLIC (cm/s)</label>
                         <input 
                           type="number"
                           value={scanEdv}
                           onChange={(e) => setScanEdv(e.target.value)}
                           className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all"
                           required
                         />
                      </div>
                   </div>

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-[#8e9299] uppercase tracking-widest font-bold">DIAGNOSTIC_FINDINGS_SUMMARY</label>
                      <textarea 
                        value={scanFindings}
                        onChange={(e) => setScanFindings(e.target.value)}
                        rows={3}
                        className="bg-[#0a0b0d] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00d1ff] transition-all resize-none"
                        required
                        maxLength={250}
                      />
                   </div>

                   <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4 mt-2">
                      <button 
                        type="button"
                        onClick={() => setShowLogModal(false)}
                        className="px-4 py-1.5 text-xs text-white/50 hover:text-white"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00d1ff] text-black rounded-lg text-xs font-bold font-sans tracking-wide"
                      >
                         <Save size={12} /> Record to Logbook
                      </button>
                   </div>

                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
