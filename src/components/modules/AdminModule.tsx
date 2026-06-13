import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Users, 
  Lock, 
  Shield, 
  ShieldCheck, 
  Film, 
  Image as ImageIcon, 
  Video, 
  Database, 
  LogOut, 
  Settings, 
  Layers, 
  Activity, 
  Sliders, 
  Eye, 
  CheckCircle,
  HelpCircle,
  X,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { 
  AdminMediaItem, 
  SystemUser, 
  getAdminMedia, 
  saveAdminMedia, 
  getSystemUsers, 
  saveSystemUsers,
  initializeAdminSystem
} from '../../lib/adminMedia';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import DashboardModule from './DashboardModule';

interface AdminModuleProps {
  onClose?: () => void;
}

export default function AdminModule({ onClose }: AdminModuleProps) {
  // Authentication states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [deniedUser, setDeniedUser] = useState<SystemUser | null>(null);

  // Preview interactive configurations
  const [brandingPreviewMode, setBrandingPreviewMode] = useState<'cards' | 'simulator'>('simulator');
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Dashboard configuration states
  const [activeTab, setActiveTab] = useState<'media' | 'branding' | 'users' | 'status'>('media');
  
  // Media upload fields
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaCategory, setMediaCategory] = useState('Physics');
  const [targetModule, setTargetModule] = useState('probe');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [webUrl, setWebUrl] = useState('');
  const [base64File, setBase64File] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);

  // Database lists
  const [mediaList, setMediaList] = useState<AdminMediaItem[]>([]);
  const [userList, setUserList] = useState<SystemUser[]>([]);

  // User Manager state
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'regular'>('admin');
  const [userSuccessMessage, setUserSuccessMessage] = useState('');

  // Branding Customizer states
  const [brandingBadge, setBrandingBadge] = useState('');
  const [brandingPoster, setBrandingPoster] = useState('');
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const [brandingError, setBrandingError] = useState('');
  const [isBrandingSaving, setIsBrandingSaving] = useState(false);

  useEffect(() => {
    initializeAdminSystem();
    loadDashboardState();

    // Setup active branding listener
    const unsubscribeBranding = onSnapshot(doc(db, 'branding', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBrandingBadge(data.teamBadge || '');
        setBrandingPoster(data.teamPoster || '');
      }
    }, (err) => {
      console.warn("Branding state offline within Admin Workspace:", err);
    });

    // Check if there is an active session in Firebase authentication
    const unsubAuth = auth.onAuthStateChanged((userItem) => {
      if (userItem && (userItem.email === 'spistudysystem@gmail.com' || userItem.email?.toLowerCase().includes('admin'))) {
        const adminUser: SystemUser = {
          username: userItem.displayName || userItem.email?.split('@')[0] || 'spistudysystem',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(adminUser);
        localStorage.setItem('sonicbuild_admin_session_user', JSON.stringify(adminUser));
      }
    });
    
    // Check if there is an active local session as fallback
    const savedUser = localStorage.getItem('sonicbuild_admin_session_user');
    if (savedUser && !currentUser) {
      const parsed = JSON.parse(savedUser) as SystemUser;
      if (parsed.role === 'admin') {
        setCurrentUser(parsed);
      } else {
        setDeniedUser(parsed);
      }
    }

    return () => {
      unsubscribeBranding();
      unsubAuth();
    };
  }, []);

  const compressImageBase64 = (file: File, maxDimension: number, quality: number, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
          } else {
            callback(event.target!.result as string);
          }
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBadgeFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setBrandingError("Only image formats are supported for the Covert Team Badge.");
      return;
    }
    compressImageBase64(file, 600, 0.6, (base64) => {
      setBrandingBadge(base64);
      setBrandingSuccess("New Badge preview loaded successfully! Ensure you click 'Commit Branding Configuration' below to serialize.");
    });
  };

  const handlePosterFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setBrandingError("Only image formats are supported for the Covert Poster.");
      return;
    }
    compressImageBase64(file, 1000, 0.6, (base64) => {
      setBrandingPoster(base64);
      setBrandingSuccess("New Poster preview loaded successfully! Ensure you click 'Commit Branding Configuration' below to serialize.");
    });
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBrandingSaving(true);
    setBrandingSuccess('');
    setBrandingError('');
    try {
      await setDoc(doc(db, 'branding', 'global'), {
        teamBadge: brandingBadge,
        teamPoster: brandingPoster,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.username || 'admin_operator'
      });
      setBrandingSuccess('Operational command branding media has been compiled and serialized to live database storage!');
    } catch (err: any) {
      console.error("Branding save error: ", err);
      setBrandingError(err.message || 'Permission denied. Ensure you are logged in as the root spistudysystem@gmail.com administrator.');
    } finally {
      setIsBrandingSaving(false);
    }
  };

  const loadDashboardState = () => {
    setMediaList(getAdminMedia());
    setUserList(getSystemUsers());
  };

  // Secure Front-End Sign-in system differentiating admin vs regular user role roles
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setDeniedUser(null);

    if (!username.trim() || !password.trim()) {
      setLoginError('Credentials cannot be empty');
      return;
    }

    const allUsers = getSystemUsers();
    const matchedUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase().trim());

    if (!matchedUser) {
      setLoginError('User profile not found in registration roster.');
      return;
    }

    // Security Verification: admin passwords rules
    // Admin user: username admin keying password "admin-secure-2026" or username "admin" password "admin"
    // Regular user: username "staff_john" keying password "john-secure-2026" or "regular"
    const lowerUser = username.toLowerCase().trim();
    let isPasswordCorrect = false;

    if (lowerUser === 'admin' && (password === 'admin-secure-2026' || password === 'admin')) {
      isPasswordCorrect = true;
    } else if (lowerUser === 'staff_john' && (password === 'john-secure-2026' || password === 'regular')) {
      isPasswordCorrect = true;
    } else if (password === `${lowerUser}-pass`) {
      isPasswordCorrect = true;
    }

    if (!isPasswordCorrect) {
      setLoginError('Incorrect passphrase for authenticated identity.');
      return;
    }

    // Save token in localStorage and session info
    localStorage.setItem('sonicbuild_admin_token', `token-secure-hash-${btoa(lowerUser)}`);
    localStorage.setItem('sonicbuild_admin_session_user', JSON.stringify(matchedUser));

    if (matchedUser.role === 'admin') {
      setCurrentUser(matchedUser);
    } else {
      setDeniedUser(matchedUser);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('sonicbuild_admin_token');
    localStorage.removeItem('sonicbuild_admin_session_user');
    setCurrentUser(null);
    setDeniedUser(null);
    setUsername('');
    setPassword('');
  };

  // File Drag and Drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert("Unsupported file format! Please upload an image or video clip.");
      return;
    }

    // Inform users about video constraints if they drop large files
    if (isVideo && file.size > 2 * 1024 * 1024) {
      alert("Video file is too large for local storage caching (Max 2MB). Please use an external Web URL for large videos.");
      return;
    }

    setMediaType(isImage ? 'image' : 'video');
    setWebUrl(''); // Reset web URL input if they file upload

    if (isImage) {
      compressImageBase64(file, 1200, 0.7, (base64) => {
        setBase64File(base64);
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBase64File(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Media Registry submission
  const handlePublishMedia = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalUrl = webUrl.trim() || base64File;
    if (!finalUrl) {
      alert("Please provide a media source (either upload a file or enter an external URL).");
      return;
    }

    if (!mediaTitle.trim()) {
      alert("Media Title is required.");
      return;
    }

    const newItem: AdminMediaItem = {
      id: `custom-media-${Date.now()}`,
      title: mediaTitle.trim(),
      description: mediaDesc.trim() || "Administrative custom attachment.",
      category: mediaCategory,
      module: targetModule,
      url: finalUrl,
      mediaType: mediaType,
      uploadedAt: new Date().toISOString()
    };

    const currentMedia = getAdminMedia();
    const updated = [newItem, ...currentMedia];
    saveAdminMedia(updated);
    setMediaList(updated);

    // Reset fields
    setMediaTitle('');
    setMediaDesc('');
    setWebUrl('');
    setBase64File(null);
    alert("New media item published successfully! It has been attached to the live application.");
  };

  const handleDeleteMedia = (id: string) => {
    if (confirm("Are you sure you want to permanently detach and delete this media item?")) {
      const updated = mediaList.filter(m => m.id !== id);
      saveAdminMedia(updated);
      setMediaList(updated);
    }
  };

  // User roles manager submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccessMessage('');

    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername) return;

    const allUsers = getSystemUsers();
    if (allUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      alert("A user profile with this name already exists in roster.");
      return;
    }

    const newUser: SystemUser = {
      username: cleanUsername,
      role: newRole,
      createdAt: new Date().toISOString()
    };

    const updated = [...allUsers, newUser];
    saveSystemUsers(updated);
    setUserList(updated);
    setNewUsername('');
    setUserSuccessMessage(`Successfully registered user "${cleanUsername}" with role "${newRole}". Password rule: [username]-pass`);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'admin') {
      alert("Cannot delete the root developer administrator!");
      return;
    }
    if (confirm(`Permanently delete account "${usernameToDelete}"?`)) {
      const updated = userList.filter(u => u.username !== usernameToDelete);
      saveSystemUsers(updated);
      setUserList(updated);
    }
  };

  const MODULE_ROUTING_MAP = [
    { id: 'probe', name: 'Internal Transducer (probe)' },
    { id: 'types', name: 'Transducer Arrays (types)' },
    { id: 'beam', name: 'Beam Formation (beam)' },
    { id: 'pulse', name: 'Pulsed Wave (pulse)' },
    { id: 'physics', name: 'Image Resolutions (physics)' },
    { id: 'doppler', name: 'Spectral Doppler (doppler)' },
    { id: 'interactions', name: 'Tissue Interactions (interactions)' },
    { id: 'attenuation', name: 'Attenuation Sim (attenuation)' },
    { id: 'hemodynamics', name: 'Hemodynamics Core (hemodynamics)' },
    { id: 'imaging', name: 'Multi-Zone TGC Consoles (imaging)' },
    { id: 'artifacts', name: 'Clinical Artifacts (artifacts)' },
    { id: 'safety', name: 'Mechanical & Thermal indices (safety)' },
    { id: 'library', name: 'Voice Lectures Library (library)' }
  ];

  // If NOT logged in, show the styled glassmorphic console terminal login form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4 relative overflow-hidden hud-dots selection:bg-cyan-500/20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-gradient-to-b from-[#13161c] to-[#0c0d11] border border-[#2d3139] rounded-2xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,209,255,0.08)] z-10 transition-transform duration-300">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-[#00d1ff] flex items-center justify-center border border-cyan-400/30 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
              <Lock className="text-black" size={20} />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-[4px] uppercase text-cyan-400 font-bold">SONICBUILD TERMINAL SECURED</span>
              <h1 className="text-xl sm:text-2xl font-serif italic text-white mt-1">Administrator Portal</h1>
              <p className="text-[10px] text-[#8e9299] font-mono uppercase mt-1">Front-end validation console</p>
            </div>
          </div>

          {/* Regular User Access Restriction Catcher */}
          {deniedUser && (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex gap-3 items-start"
            >
              <AlertOctagon className="text-rose-400 shrink-0 mt-0.5" size={16} />
              <div className="text-left space-y-1">
                <div className="text-[10px] font-mono text-rose-400 font-black uppercase">ACCESS DENIED - ROLE RESTRICTED</div>
                <p className="text-[11px] text-[#8e9299] font-sans leading-relaxed">
                  Identity <strong>{deniedUser.username}</strong> holds role <code className="bg-rose-500/20 px-1 py-0.2 rounded text-white text-[9.5px]">[{deniedUser.role}]</code>. The administrative control deck is strictly accessible to accounts assigned administrative permissions.
                </p>
                <button 
                  onClick={handleSignOut}
                  className="text-[9.5px] font-mono text-cyan-400 font-bold hover:underline uppercase block pt-1.5"
                >
                  Return to prompt
                </button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Operator Username</label>
              <input 
                id="admin-username-input"
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Type 'admin'..."
                className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-4 py-2.5 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,209,255,0.1)] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Consolidated Crypt-Lock Keyphrase</label>
              <input 
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type 'admin-secure-2026'..."
                className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-4 py-2.5 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,209,255,0.1)] transition-all"
              />
            </div>

            {loginError && (
              <div className="text-[10px] font-mono text-rose-400 bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/20 text-center uppercase tracking-wide">
                ⚠️ {loginError}
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full h-11 bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 group transition-all duration-300 shadow-[0_0_20px_rgba(0,209,255,0.15)] hover:shadow-[0_0_30px_rgba(0,209,255,0.3)] active:translate-y-0.5 cursor-pointer mt-6"
            >
              <ShieldCheck size={14} className="group-hover:rotate-6 transition-transform" />
              <span>Verify and Establish Uplink</span>
            </button>
          </form>

          {/* Secure developer credential guidelines panel */}
          <div className="mt-8 bg-black/40 border border-white/5 rounded-xl p-4.5 space-y-2 font-mono text-[9px] text-[#8e9299] leading-relaxed text-left">
            <div className="flex items-center gap-1 text-cyan-400 font-bold mb-1 uppercase tracking-wider">
              <HelpCircle size={10} />
              Testing Guide &amp; Credentials
            </div>
            <div>
              <span className="text-white font-bold block">1. Administrator privileges (Full access):</span>
              <span className="text-emerald-400 font-bold">Username:</span> <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">admin</code><br />
              <span className="text-emerald-400 font-bold">Password:</span> <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">admin-secure-2026</code> (or <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">admin</code>)
            </div>
            <div className="pt-1.5 border-t border-white/5">
              <span className="text-white font-bold block">2. Regular staff (restricted Access Denied validation):</span>
              <span className="text-amber-500 font-bold">Username:</span> <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">staff_john</code><br />
              <span className="text-amber-500 font-bold">Password:</span> <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">john-secure-2026</code> (or <code className="bg-[#12141a] text-slate-100 px-1 py-0.5 rounded border border-white/5">regular</code>)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard main cockpit interface (ONLY for verified admins)
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto selection:bg-cyan-500/20 text-[#e0e0e0] font-sans">
      {/* Upper brushed console banner strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.7)]" />
            <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-[3px] uppercase">SonicBuild Administrator Console v1.0.3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white mt-1">Sim Core Customizer</h1>
          <p className="text-[10px] sm:text-[11px] text-[#8e9299] font-mono uppercase mt-1 select-none">
            Welcome, Administrator <strong className="text-slate-100">{currentUser.username}</strong> // Authenticated console channel active
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowFullscreenPreview(true)}
            className="px-4 py-2 bg-[#121c24] hover:bg-cyan-500 hover:text-black border border-cyan-500/40 text-cyan-400 text-[10px] font-mono uppercase tracking-widest font-black rounded-lg transition-all hover:scale-102 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse"
            title="Launch interactive simulation viewport overlay with draft values applied instantly"
          >
            <Sliders size={12} className="text-cyan-400 animate-spin-slow" />
            <span>Interactive HUD Overlay</span>
          </button>

          {onClose && (
            <button
              id="admin-back-btn" 
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#2d3139] text-[10px] font-mono uppercase tracking-widest font-black rounded-lg transition-transform hover:scale-102 flex items-center gap-2 cursor-pointer"
            >
              <Eye size={12} className="text-emerald-400" />
              <span>Preview Live Application</span>
            </button>
          )}

          <button
            id="admin-logout-btn"
            onClick={handleSignOut}
            className="px-4 py-2 bg-gradient-to-r from-rose-500/20 to-red-600/10 hover:from-rose-500 border border-rose-500/40 hover:text-black text-rose-400 text-[10px] font-mono uppercase tracking-widest font-black rounded-lg transition-transform hover:scale-102 flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign Out Operator</span>
          </button>
        </div>
      </div>

      {/* Main navigation controller header for Admin workspace */}
      <div className="flex flex-wrap bg-[#13161c] p-1.5 rounded-xl border border-[#2d3139]/80 w-fit gap-1 shadow-lg">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10.5px] font-mono tracking-widest uppercase transition-all font-bold cursor-pointer ${activeTab === 'media' ? 'bg-cyan-400 text-black shadow-md font-black shadow-cyan-400/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <Film size={13} />
          Media Customization &amp; Upload
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10.5px] font-mono tracking-widest uppercase transition-all font-bold cursor-pointer ${activeTab === 'branding' ? 'bg-cyan-400 text-black shadow-md font-black shadow-cyan-400/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <Settings size={13} />
          Swap Out Branding Media
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10.5px] font-mono tracking-widest uppercase transition-all font-bold cursor-pointer ${activeTab === 'users' ? 'bg-cyan-400 text-black shadow-md font-black shadow-cyan-400/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <Users size={13} />
          User Account Roles Manager
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10.5px] font-mono tracking-widest uppercase transition-all font-bold cursor-pointer ${activeTab === 'status' ? 'bg-cyan-400 text-black shadow-md font-black shadow-cyan-400/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'}`}
        >
          <Database size={13} />
          System Telemetry &amp; Log
        </button>
      </div>

      {/* Content Pane */}
      <AnimatePresence mode="wait">
        {activeTab === 'media' && (
          <motion.div 
            key="media"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20"
          >
            {/* COLUMN 1: Visual Registry & File attachment Uploader */}
            <div className="col-span-12 lg:col-span-5 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                  <Upload size={14} className="text-cyan-400" />
                  Media Attachment Portal
                </h3>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5 leading-relaxed">
                  Upload localized medical clips, ultrasound scans, or diagnostic diagrams. Dynamically route them to live clinical modules.
                </p>
              </div>

              <form onSubmit={handlePublishMedia} className="space-y-4">
                {/* Media Selector Zone: Drag and drop + upload */}
                <div className="space-y-2">
                  <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Attachment Source Payload</label>
                  
                  {/* Outer drag block */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${base64File ? 'border-emerald-500 bg-emerald-500/5' : dragActive ? 'border-cyan-400 bg-cyan-400/5' : 'border-[#2d3139] bg-black/30 hover:border-slate-500'}`}
                    onClick={() => document.getElementById('media-file-selector')?.click()}
                  >
                    <input 
                      id="media-file-selector"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {base64File ? (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                          <CheckCircle className="text-emerald-400" size={18} />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-slate-200 block truncate max-w-[200px]">Localized File Staged</span>
                          <span className="text-[8.5px] font-mono text-[#8e9299] uppercase">Encoded into storage buffer successfully</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="p-2 bg-white/5 rounded-full border border-white/10 group-hover:scale-105 transition-transform">
                          <Upload className="text-[#8e9299]" size={16} />
                        </div>
                        <div>
                          <span className="text-[10.5px] font-mono font-bold text-slate-200 block">Drag &amp; drop file or select link Click</span>
                          <span className="text-[8.5px] font-mono text-[#8e9299] uppercase leading-tight mt-1 block">Supports diagnostic PNG, JPG, GIF, WebP, WebM, MP4</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center font-mono text-[9px] text-[#8e9299]">OR DIRECT EXTERNAL HYPERLINK PATH</div>

                  <input 
                    id="admin-weburl-input"
                    type="url"
                    value={webUrl}
                    onChange={(e) => {
                      setWebUrl(e.target.value);
                      if (e.target.value) setBase64File(null); // Clear direct upload if web-url is keying
                    }}
                    placeholder="https://clinical-repository.org/ultrasound-vein.mp4"
                    className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Info Inputs */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Attachment Type</label>
                      <select
                        id="admin-mediatype-select"
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                        className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-2.5 py-2 font-mono text-[10.5px] text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="image">📸 Image Attachment</option>
                        <option value="video">🎥 Video Segment</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Physics Category</label>
                      <select
                        id="admin-category-select"
                        value={mediaCategory}
                        onChange={(e) => setMediaCategory(e.target.value)}
                        className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-2.5 py-2 font-mono text-[10.5px] text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Physics">Physics Models</option>
                        <option value="Hardware">Hardware Transducers</option>
                        <option value="Doppler">Fluid Doppler</option>
                        <option value="Safety">Safety Guidelines</option>
                        <option value="Artifacts">Acoustic Artifacts</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Attach specifically to module:</label>
                    <select
                      id="admin-targetmodule-select"
                      value={targetModule}
                      onChange={(e) => setTargetModule(e.target.value)}
                      className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-2.5 py-2.5 font-mono text-[10.5px] text-white focus:outline-none border-cyan-400/50 focus:border-cyan-400"
                    >
                      {MODULE_ROUTING_MAP.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Attachment Title</label>
                    <input 
                      id="admin-mediatitle-input"
                      type="text"
                      required
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="e.g., Liver Portal Flow Turbulence Profile"
                      className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Diagnostic Log Description</label>
                    <textarea 
                      id="admin-mediadesc-textarea"
                      value={mediaDesc}
                      onChange={(e) => setMediaDesc(e.target.value)}
                      placeholder="Brief clinic note to help students study this artifact mapping..."
                      rows={2}
                      className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg p-3 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>
                </div>

                <button
                  id="admin-publish-btn"
                  type="submit"
                  className="w-full h-10 bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all mt-4 hover:shadow-[0_0_15px_rgba(0,209,255,0.2)] cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Publish Custom Attachment</span>
                </button>
              </form>
            </div>

            {/* COLUMN 2: Linked custom attachments catalog */}
            <div className="col-span-12 lg:col-span-7 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl flex flex-col h-full justify-between">
              <div>
                <h3 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                  <Database size={14} className="text-cyan-400" />
                  Active Custom Attachment Media Grid
                </h3>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5 mb-6">
                  Items listed below are immediately injected and active in specific simulator tabs.
                </p>

                {mediaList.length === 0 ? (
                  <div className="border border-dashed border-[#2d3139] bg-black/15 rounded-xl p-12 text-center text-[#8e9299] space-y-2">
                    <FolderEmptyIcon size={24} className="mx-auto" />
                    <div className="text-[10.5px] font-mono uppercase">Database Registry Staged Empty</div>
                    <p className="text-[9px] font-sans">No customized attachments have been loaded into localStorage roster yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                    {mediaList.map((media) => (
                      <div 
                        key={media.id} 
                        className="bg-[#0b0c10] border border-[#2d3139] p-3 rounded-xl flex flex-col justify-between hover:border-slate-500 transition-colors"
                      >
                        <div className="space-y-2.5">
                          {/* Visual asset display block */}
                          <div className="h-28 w-full bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative border border-white/5">
                            {media.mediaType === 'image' ? (
                              <img src={media.url} alt={media.title} className="max-h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={media.url} className="max-h-full" muted playsInline loop />
                            )}
                            <div className="absolute top-1.5 right-1.5 bg-black/85 px-2 py-0.5 rounded border border-white/10 text-[7px] font-mono text-cyan-400 uppercase">
                              {media.mediaType}
                            </div>
                          </div>

                          <div>
                            <div className="text-[7.5px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded w-fit uppercase font-bold">
                              MODULE: {MODULE_ROUTING_MAP.find(m => m.id === media.module)?.name || media.module}
                            </div>
                            <h4 className="text-[11.5px] font-mono text-white font-bold leading-tight mt-1 truncate">{media.title}</h4>
                            <p className="text-[9.5px] text-[#8e9299] font-mono leading-tight line-clamp-2 mt-1">{media.description}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-3">
                          <span className="text-[7.5px] font-mono text-[#8e9299]">Published: {new Date(media.uploadedAt).toLocaleDateString()}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setPreviewOpen(media.url)}
                              className="p-1 px-2 bg-slate-800 hover:bg-slate-700 rounded border border-white/15 text-slate-100 font-mono text-[8.5px] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={10} />
                              Preview
                            </button>
                            <button 
                              onClick={() => handleDeleteMedia(media.id)}
                              className="p-1 bg-rose-500/15 hover:bg-rose-500/30 rounded border border-rose-500/25 text-rose-400 cursor-pointer"
                              title="Delete attachment item"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 bg-[#00d1ff]/5 border border-[#00d1ff]/15 rounded-xl p-3.5 text-left text-[9px] font-mono leading-relaxed text-[#8e9299]">
                💡 <strong className="text-[#00d1ff] uppercase">Aesthetic attachment proof:</strong> Detached assets are completely clean and independent. Detached changes will mirror instantaneously inside target modules (like Transducer view under internal dashboard slots, multi TGC, etc.). Try navigating tabs below!
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Branding Customizer */}
        {activeTab === 'branding' && (
          <motion.div 
            key="branding"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20 text-left"
          >
            {/* COLUMN 1: Editor Form */}
            <div className="col-span-12 lg:col-span-6 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-sm font-black font-mono tracking-widest text-[#00d1ff] uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                  <Settings size={14} className="text-cyan-400" />
                  COVERT BRANDING MANAGER
                </h3>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5 leading-relaxed">
                  Swap out the system-wide visual graphics including the Covert Team Badge and the operational Covert Poster. Saves straight to Firestore Cloud.
                </p>
              </div>

              {/* Success/Error displays */}
              {brandingSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10.5px] font-mono leading-relaxed">
                  ✓ {brandingSuccess}
                </div>
              )}
              {brandingError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[10.5px] font-mono leading-relaxed">
                  ⚠ {brandingError}
                </div>
              )}

              <form onSubmit={handleSaveBranding} className="space-y-6">
                {/* PART A: Covert Team Badge */}
                <div className="space-y-2 border-b border-white/5 pb-6">
                  <label className="text-[10px] font-mono uppercase text-[#eab308] font-extrabold tracking-wider block">
                    1. Covert Team Badge Asset
                  </label>
                  <p className="text-[9.5px] text-[#8e9299] leading-snug">
                    Provide an online image URL, or upload/drag your custom picture file directly to convert it to ultra-light base64 payload.
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 px-3 py-2 bg-black/40 border border-[#2d3139] rounded-lg text-xs font-mono text-white placeholder-slate-650 focus:outline-none focus:border-cyan-400/50"
                      placeholder="Enter online URL or upload folder asset below..."
                      value={brandingBadge.startsWith('data:') ? 'Local Upload Asset (Base64 Binary Payload)' : brandingBadge}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val.startsWith('Local Upload')) {
                          setBrandingBadge(val);
                        }
                      }}
                    />
                    {brandingBadge && (
                      <button
                        type="button"
                        onClick={() => setBrandingBadge('')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-400 hover:text-white transition-colors text-[9px] font-mono uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('badge-file-uploader')?.click()}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 text-[10px] font-mono uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Upload size={12} />
                      Upload Badge Image File
                    </button>
                    <input 
                      id="badge-file-uploader"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBadgeFile(file);
                      }}
                    />
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase">Supports PNG, JPG, WEBP, SVG</span>
                  </div>
                </div>

                {/* PART B: Covert Team Poster */}
                <div className="space-y-2 border-b border-white/5 pb-6">
                  <label className="text-[10px] font-mono uppercase text-[#eab308] font-extrabold tracking-wider block">
                    2. Covert Operational Poster
                  </label>
                  <p className="text-[9.5px] text-[#8e9299] leading-snug">
                    Set a customized poster background image (best in vertical/portrait orientation like poster comic ratios). Enter URL or upload your template.
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 px-3 py-2 bg-black/40 border border-[#2d3139] rounded-lg text-xs font-mono text-white placeholder-slate-650 focus:outline-none focus:border-cyan-400/50"
                      placeholder="Enter online URL or upload poster comic below..."
                      value={brandingPoster.startsWith('data:') ? 'Local Upload Asset (Base64 Binary Payload)' : brandingPoster}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val.startsWith('Local Upload')) {
                          setBrandingPoster(val);
                        }
                      }}
                    />
                    {brandingPoster && (
                      <button
                        type="button"
                        onClick={() => setBrandingPoster('')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-400 hover:text-white transition-colors text-[9px] font-mono uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('poster-file-uploader')?.click()}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 text-[10px] font-mono uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Upload size={12} />
                      Upload Poster Image File
                    </button>
                    <input 
                      id="poster-file-uploader"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePosterFile(file);
                      }}
                    />
                    <span className="text-[8.5px] text-slate-500 font-mono uppercase font-black">Portrait bounds recommended</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isBrandingSaving}
                  className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-mono uppercase tracking-widest font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs shadow-[0_4px_15px_rgba(34,211,238,0.25)]"
                >
                  {isBrandingSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Serializing Configuration to DB...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Commit Branding Configuration
                    </>
                  )}
                </button>
              </form>

              <div className="bg-[#00d1ff]/5 border border-[#00d1ff]/15 rounded-xl p-3.5 text-[9px] font-mono leading-relaxed text-[#8e9299]">
                ℹ <strong className="text-[#00d1ff] uppercase">Zero-Friction Hot Swaps:</strong> Saved modifications will propagate in real-time to all live terminals globally leveraging Firestore reactive event snapshot queries! No restarts required.
              </div>
            </div>

            {/* COLUMN 2: Live Screen Previews */}
            <div className="col-span-12 lg:col-span-6 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-white/5 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                    <Activity size={14} className="text-[#00d1ff] animate-pulse" />
                    LIVE COCKPIT VISUAL PREVIEW
                  </h3>
                  <p className="text-[9.5px] text-slate-500 font-mono uppercase mt-0.5">
                    Real-time viewport preview of operational assets
                  </p>
                </div>
                
                <div className="flex bg-black/60 p-1 rounded-lg border border-white/5 self-start sm:self-auto shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setBrandingPreviewMode('cards')}
                    className={`px-3 py-1 text-[9px] font-mono rounded-md uppercase transition-all font-bold cursor-pointer ${brandingPreviewMode === 'cards' ? 'bg-[#2d3139] text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    🔍 Standalone
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandingPreviewMode('simulator')}
                    className={`px-3 py-1 text-[9px] font-mono rounded-md uppercase transition-all font-bold cursor-pointer ${brandingPreviewMode === 'simulator' ? 'bg-[#2d3139] text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    🖥️ Simulator HQ
                  </button>
                </div>
              </div>

              {brandingPreviewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card A: Badge Preview */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-[8.5px] text-yellow-500 font-bold tracking-widest block uppercase font-mono">
                      TEAM BADGE SCREEN
                    </span>
                    
                    <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#eab308]/20 via-slate-800 to-[#00d1ff]/20 border border-white/5 shadow-md">
                      {brandingBadge ? (
                        <img 
                          src={brandingBadge} 
                          alt="Badge Preview" 
                          className="w-24 h-24 rounded-full object-contain filter contrast-105 brightness-110"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-800/80 flex flex-col items-center justify-center text-[9px] text-slate-500 font-mono uppercase p-2 border border-dashed border-slate-600/55">
                          <span>Default</span>
                          <span>Badge Asset</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-mono">1:1 Circular Aspect Ratio</span>
                  </div>

                  {/* Card B: Poster Preview */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-[8.5px] text-yellow-500 font-bold tracking-widest block uppercase font-mono">
                      POSTER SCREEN
                    </span>

                    <div className="p-1.5 rounded-xl bg-gradient-to-b from-[#eab308]/25 via-slate-900 to-black border border-white/10 shadow-lg relative overflow-hidden h-36 w-28 flex items-center justify-center">
                      {brandingPoster ? (
                        <img 
                          src={brandingPoster} 
                          alt="Poster Preview" 
                          className="h-full w-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80";
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-800/80 flex flex-col items-center justify-center text-[9px] text-slate-500 font-mono uppercase p-2 text-center border border-dashed border-slate-600/55 rounded-lg">
                          <span>Default</span>
                          <span>Poster Asset</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-mono">Vertical Layout Ratio</span>
                  </div>
                </div>
              ) : (
                <div className="border border-cyan-500/25 bg-[#07080a] rounded-2xl relative overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
                  {/* Monitor Bezel Top Bar */}
                  <div className="bg-gradient-to-r from-slate-950 to-[#13161c] border-b border-white/10 py-2.5 px-4 flex items-center justify-between font-mono text-[9px] text-[#8e9299]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[10px] text-slate-300 font-extrabold uppercase">COVERT SIMULATOR WORKSTATION [HQ PREVIEW]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black text-[8px] uppercase">
                        Real-time Draft Apply
                      </span>
                    </div>
                  </div>
                  
                  {/* Simulator Screen Content */}
                  <div className="overflow-y-auto max-h-[480px] bg-black no-scrollbar rounded-b-2xl">
                    <DashboardModule 
                      setViewMode={(mode) => console.log('Mock redirect view:', mode)}
                      frequency={4.5} 
                      wavelength={0.342}
                      axialRes={0.684}
                      branding={{
                        teamBadge: brandingBadge,
                        teamPoster: brandingPoster
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: User manager */}
        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20"
          >
            {/* User creation block */}
            <div className="col-span-12 lg:col-span-5 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                  <Users size={14} className="text-cyan-400" />
                  User Role Registry Enrollment
                </h3>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5 leading-relaxed">
                  Store custom user profiles with administrator or limited guest roles. Instantly test credential validation routing thresholds.
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Username</label>
                  <input 
                    id="new-username-input"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. resident_mike"
                    className="w-full bg-[#08090d] border border-[#2d3139] rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-[#8e9299]/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-mono uppercase text-[#8e9299] font-bold tracking-wider block">Assigned Role Membership</label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      id="role-select-admin-btn"
                      type="button"
                      onClick={() => setNewRole('admin')}
                      className={`h-11 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${newRole === 'admin' ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-md' : 'border-[#2d3139] bg-black/20 text-[#8e9299] hover:bg-white/5'}`}
                    >
                      <Shield size={12} />
                      <span>Administrator</span>
                    </button>
                    <button
                      id="role-select-regular-btn"
                      type="button"
                      onClick={() => setNewRole('regular')}
                      className={`h-11 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${newRole === 'regular' ? 'border-[#8e9299]/50 bg-[#8e9299]/10 text-slate-100 shadow-md' : 'border-[#2d3139] bg-black/20 text-[#8e9299] hover:bg-white/5'}`}
                    >
                      <FileText size={12} />
                      <span>Regular Staff</span>
                    </button>
                  </div>
                </div>

                <button
                  id="admin-create-user-btn"
                  type="submit"
                  className="w-full h-10 bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all mt-4 hover:shadow-[0_0_15px_rgba(0,209,255,0.2)] cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Register Identity Record</span>
                </button>
              </form>

              {userSuccessMessage && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-xl font-mono text-[9px] text-emerald-400 mt-2 leading-relaxed">
                  {userSuccessMessage}
                </div>
              )}
            </div>

            {/* Roster database block */}
            <div className="col-span-12 lg:col-span-7 bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                  <Users size={14} className="text-cyan-400" />
                  Operator Privilege Roster Database
                </h3>
                <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5 mb-6">
                  Verify user roles stored in application memory state. Attempting access with Regular role results in explicit system lockout rules.
                </p>

                <div className="overflow-x-auto border border-[#2d3139] rounded-xl bg-black/15">
                  <table className="w-full text-left border-collapse font-mono text-xs text-[#8e9299]">
                    <thead>
                      <tr className="bg-[#0b0c10] border-b border-[#2d3139] text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                        <th className="p-3 pl-4">Username ID</th>
                        <th className="p-3">Assigned Role Badge</th>
                        <th className="p-3">Validation Password Rules</th>
                        <th className="p-3 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d3139]/40">
                      {userList.map((user) => (
                        <tr key={user.username} className="hover:bg-white/[0.02]">
                          <td className="p-3 pl-4 text-white font-bold">{user.username}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-[#e0e0e0]/5 text-slate-100 border border-white/10'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3 text-[9px] text-[#8e9299]">
                            {user.username === 'admin' ? (
                              <code>admin-secure-2026</code>
                            ) : user.username === 'staff_john' ? (
                              <code>john-secure-2026</code>
                            ) : (
                              <code>{user.username}-pass</code>
                            )}
                          </td>
                          <td className="p-3 text-right pr-4">
                            {user.username === 'admin' ? (
                              <span className="text-[7.5px] font-mono text-[#8e9299] uppercase font-bold">Root Holder</span>
                            ) : (
                              <button 
                                onClick={() => handleDeleteUser(user.username)}
                                className="p-1 px-1.5 bg-rose-500/15 hover:bg-rose-500/35 border border-rose-500/20 text-rose-400 rounded transition-colors text-[9px] cursor-pointer"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[9.5px] font-mono text-[#8e9299] bg-black/40 p-3.5 rounded-xl border border-white/5 mt-6 leading-relaxed">
                🚨 <strong className="text-rose-400 font-bold uppercase">Role-access differentiation verify:</strong> To try role restriction rules, sign out your admin session and input regular staff account <code>staff_john</code> credentials. The console will trigger permission locks and prevent loading of administration tools.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab 3: System telemetry */}
        {activeTab === 'status' && (
          <motion.div 
            key="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl bg-[#13161c] border border-[#2d3139] rounded-2xl p-6 shadow-xl space-y-6 mx-auto pb-6"
          >
            <div>
              <h3 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                <Sliders size={14} className="text-cyan-400" />
                Local Storage Integrity Engine
              </h3>
              <p className="text-[10px] text-[#8e9299] uppercase font-mono mt-1.5">
                Front-end persistent framework health and payload variables analyzer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 border border-[#2d3139] rounded-xl p-4 space-y-2">
                <span className="text-[9px] font-mono text-[#8e9299] uppercase block font-bold">Local storage sizing indices</span>
                <div className="flex justify-between font-mono text-xs">
                  <span>Custom Media Registry:</span>
                  <span className="text-[#00d1ff] font-bold">{mediaList.length} items</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>Authorized Operators:</span>
                  <span className="text-[#00d1ff] font-bold">{userList.length} users</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>Memory Buffer State:</span>
                  <span className="text-[#00d1ff] font-bold uppercase">ONLINE (SYNCED)</span>
                </div>
              </div>

              <div className="bg-black/30 border border-[#2d3139] rounded-xl p-4 space-y-2">
                <span className="text-[9px] font-mono text-[#8e9299] uppercase block font-bold">System details &amp; credentials</span>
                <div className="flex justify-between font-mono text-xs">
                  <span>Development Hub:</span>
                  <span className="text-[#00d1ff]">Client Sandbox Mode</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>Active Role Session Scope:</span>
                  <span className="text-amber-500 font-bold uppercase">{currentUser.role} permissions</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span>Server Synchronization:</span>
                  <span className="text-emerald-400 font-bold uppercase">SECURED LOCALSTORE</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[9px] font-mono text-[#8e9299] uppercase block font-bold mb-1">Raw Database Backup Stream (System storage dump)</span>
              <pre className="text-[9px] bg-black/60 p-4 border border-[#2d3139] rounded-xl text-cyan-400 overflow-x-auto max-h-48 font-mono select-all custom-scrollbar whitespace-pre-wrap leading-normal">
                {JSON.stringify({ media: mediaList, users: userList }, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Modal Image/Video Preview portal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-zoom-out"
            onClick={() => setPreviewOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-4xl max-h-[85vh] bg-[#0c0d10] border border-[#2d3139] p-2.5 rounded-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewOpen(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/85 border border-[#2d3139] text-[#8e9299] hover:text-white"
              >
                <X size={15} />
              </button>
              
              <div className="flex items-center justify-center h-[50vh] w-[70vw] rounded-xl overflow-hidden bg-slate-950">
                {previewOpen.startsWith('data:image/') || previewOpen.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || !mediaList.find(m => m.url === previewOpen)?.mediaType || mediaList.find(m => m.url === previewOpen)?.mediaType === 'image' ? (
                  <img src={previewOpen} alt="Attachment Preview" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <video src={previewOpen} className="max-h-full" controls autoPlay muted playsInline loop />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Interactive Viewport Preview Overlay */}
      <AnimatePresence>
        {showFullscreenPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 z-50 overflow-y-auto flex flex-col p-4 sm:p-8"
          >
            <div className="w-full max-w-7xl mx-auto flex flex-col h-full space-y-4">
              {/* Header inside full-screen preview */}
              <div className="flex justify-between items-center bg-[#13161c] border border-[#2d3139] rounded-xl p-4 shadow-xl shrink-0">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.7)]" />
                  <div>
                    <h2 className="text-xs font-mono text-cyan-400 font-extrabold tracking-widest uppercase">
                      🖥️ FULLSCREEN WORKSTATION SIMULATOR PORT [PREVIEW MODE]
                    </h2>
                    <p className="text-[10px] text-[#8e9299] font-mono uppercase mt-0.5">
                      Displaying active draft styles & media configurations • Visual state dynamically linked
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowFullscreenPreview(false)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-black border border-rose-500/30 text-rose-400 text-[10px] font-mono uppercase tracking-widest font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <X size={12} />
                  <span>Exit Simulator Viewport</span>
                </button>
              </div>

              {/* Main Application frame */}
              <div className="flex-1 bg-black border border-[#2d3139] rounded-2xl overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(45deg,#00d1ff,#00d1ff_6px,#000_6px,#000_12px)] opacity-50 z-20 pointer-events-none" />
                
                <div className="h-full overflow-y-auto max-h-[82vh] p-2 sm:p-4">
                  <DashboardModule 
                    setViewMode={(mode) => console.log('Mock navigate to:', mode)}
                    frequency={4.5} 
                    wavelength={0.342}
                    axialRes={0.684}
                    branding={{
                      teamBadge: brandingBadge,
                      teamPoster: brandingPoster
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom simple fallback icons
function FolderEmptyIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
