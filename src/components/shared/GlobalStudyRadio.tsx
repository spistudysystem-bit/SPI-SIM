import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Music, Waves, CloudRain, ShieldHalf, LayoutGrid, Upload, GripHorizontal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Track = {
  id: string;
  name: string;
  icon: React.ElementType;
  isCustom?: boolean;
  url?: string;
  uploaderId?: string;
};

const INITIAL_TRACKS: Track[] = [
  { id: 'binaural', name: 'Alpha Binaural Beats', icon: ShieldHalf },
  { id: 'brown_noise', name: 'Deep Brown Noise', icon: Waves },
  { id: 'rain', name: 'Ambient Rain', icon: CloudRain },
  { id: 'synth', name: 'Space Drift Synth', icon: Music },
];

export default function GlobalStudyRadio() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { user } = useAuth();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customBuffersRef = useRef<Record<string, AudioBuffer>>({});

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'shared_audio'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbTracks: Track[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        dbTracks.push({
          id: doc.id,
          name: data.name,
          icon: Music,
          isCustom: true,
          url: data.url,
          uploaderId: data.uploaderId
        });
      });
      setPlaylist([...INITIAL_TRACKS, ...dbTracks]);
    }, (error) => {
      console.error("Error fetching shared audio:", error);
    });
    return unsubscribe;
  }, [user]);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aesthetic sci-fi visualizer
    const barWidth = (canvas.width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const opacity = (dataArray[i] / 255) * 0.8;
      
      ctx.fillStyle = `rgba(0, 209, 255, ${opacity})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    requestRef.current = requestAnimationFrame(drawVisualizer);
  };

  useEffect(() => {
    if (isPlaying && isOpen) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      drawVisualizer();
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isOpen]);

  // Synthesizers
  const synthesizeTrack = async (track: Track, vol: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = vol;
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    masterGain.connect(analyser);
    masterGain.connect(ctx.destination);
    nodesRef.current.push(masterGain, analyser);

    const trackId = track.id;

    if (track.url) {
      if (!customBuffersRef.current[trackId]) {
        try {
          const response = await fetch(track.url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          customBuffersRef.current[trackId] = buffer;
        } catch (error) {
          console.error("Failed to fetch custom audio track", error);
          return;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = customBuffersRef.current[trackId];
      source.loop = true;
      source.connect(masterGain);
      source.start();
      nodesRef.current.push(source);
    }
    else if (customBuffersRef.current[trackId]) {
      const source = ctx.createBufferSource();
      source.buffer = customBuffersRef.current[trackId];
      source.loop = true;
      source.connect(masterGain);
      source.start();
      nodesRef.current.push(source);
    }
    else if (trackId === 'brown_noise') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start();
      nodesRef.current.push(noiseSource, filter);
    } 
    else if (trackId === 'binaural') {
      const carrier = 200; // Hz
      const beat = 10; // Hz (Alpha)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);
      
      oscL.frequency.value = carrier - beat / 2;
      oscR.frequency.value = carrier + beat / 2;
      
      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      merger.connect(filter);
      
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 20;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      filter.connect(masterGain);
      
      oscL.start();
      oscR.start();
      lfo.start();
      nodesRef.current.push(oscL, oscR, merger, filter, lfo, lfoGain);
    }
    else if (trackId === 'rain') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = white * 0.5;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'highpass';
      filter2.frequency.value = 200;

      noiseSource.connect(filter);
      filter.connect(filter2);
      filter2.connect(masterGain);
      noiseSource.start();
      nodesRef.current.push(noiseSource, filter, filter2);
    }
    else if (trackId === 'synth') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const chorus = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc3.type = 'sine';

      // Base chord: C major 7th in low frequencies
      osc1.frequency.value = 130.81; // C3
      osc2.frequency.value = 164.81; // E3
      osc3.frequency.value = 196.00; // G3

      // Detune for space drift
      osc1.detune.value = 5;
      osc2.detune.value = -3;
      osc3.detune.value = 2;

      // Slow LFO for sweeping filter
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Very slow sweep

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 400;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(chorus);
      chorus.connect(masterGain);

      lfo.start();
      osc1.start();
      osc2.start();
      osc3.start();
      nodesRef.current.push(osc1, osc2, osc3, lfo, lfoGain, filter, chorus);
    }
  };

  const stopAudio = () => {
    nodesRef.current.forEach(node => {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    });
    nodesRef.current = [];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert("You must be logged in to share audio tracks.");
      return;
    }

    try {
      setUploadProgress(0);
      const storageRef = ref(storage, `shared_audio/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed", error);
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'shared_audio'), {
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: downloadURL,
            createdAt: serverTimestamp(),
            uploaderId: user.uid
          });
          setUploadProgress(null);
          // Play the newly added track once it syncs back (handled by onSnapshot)
        }
      );
    } catch (err) {
      console.error("Failed to begin upload", err);
      setUploadProgress(null);
    }
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      stopAudio();
        const activeTrack = playlist[currentTrackIndex];
        if (activeTrack) {
          synthesizeTrack(activeTrack, volume);
        }
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isPlaying, currentTrackIndex, playlist]);

  useEffect(() => {
    // Update volume on the fly for master gain nodes
    if (nodesRef.current.length > 0 && nodesRef.current[0].gain) {
      nodesRef.current[0].gain.setTargetAtTime(volume, audioCtxRef.current!.currentTime, 0.1);
    }
  }, [volume]);

  // Clean up entirely on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const TrackIcon = playlist[currentTrackIndex]?.icon || Music;

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileUpload} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
            className="mb-4 bg-[#0a0a0f] border border-[#2d3139] rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto cursor-default"
            style={{ width: 280 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-[#00d1ff] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00d1ff]">Study Radio</span>
              </div>
              <div className="flex space-x-1">
                <div className={`w-1 h-3 rounded-full bg-[#00d1ff] transition-all duration-300 ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'opacity-20 translate-y-1'}`}></div>
                <div className={`w-1 h-4 rounded-full bg-[#00d1ff] transition-all duration-300 ${isPlaying ? 'animate-[bounce_1s_infinite_0.1s]' : 'opacity-20 translate-y-1'}`}></div>
                <div className={`w-1 h-2 rounded-full bg-[#00d1ff] transition-all duration-300 ${isPlaying ? 'animate-[bounce_0.9s_infinite_0.2s]' : 'opacity-20 translate-y-1'}`}></div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cover Art / Title */}
              <div className="bg-[#12141a] border border-[#2d3139] rounded-xl p-3 flex items-center space-x-3 relative overflow-hidden">
                <canvas ref={canvasRef} width={280} height={60} className="absolute bottom-0 left-0 w-full h-[30px] opacity-40 mix-blend-screen pointer-events-none" />
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1d24] to-[#0a0a0f] flex items-center justify-center border border-white/5 flex-shrink-0 relative overflow-hidden z-10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrackIcon className={`w-5 h-5 ${isPlaying ? 'text-[#00d1ff]' : 'text-slate-500'} transition-colors`} />
                  </div>
                  {isPlaying && (
                    <div className="absolute inset-0 bg-[#00d1ff]/10 mix-blend-overlay"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pointer-events-auto">
                  <div className="text-white text-xs font-bold truncate">
                    {playlist[currentTrackIndex]?.name}
                  </div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">
                    {playlist[currentTrackIndex]?.isCustom ? 'User Upload' : 'Synthetic Generative'}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="text-slate-400 text-xs font-mono bg-white/5 px-2 py-1 rounded">LIVE</div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProgress !== null}
                    className="p-1 px-2 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
                    title="Upload Local Audio"
                  >
                    {uploadProgress !== null ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadProgress !== null && <span>{Math.round(uploadProgress)}%</span>}
                  </button>
                </div>
                
                <div className="flex items-center space-x-3 pointer-events-auto">
                  <button 
                    onClick={() => setCurrentTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-[#00d1ff] hover:bg-[#00b0d6] text-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] hover:scale-105"
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <button 
                    onClick={() => setCurrentTrackIndex(prev => (prev + 1) % playlist.length)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors rotate-180"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center space-x-2 pt-2 border-t border-white/5 pointer-events-auto">
                <VolumeX className="w-3 h-3 text-slate-500" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 overflow-hidden appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-[#2d3139] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00d1ff] [&::-webkit-slider-thumb]:-mt-0.5 [&::-webkit-slider-thumb]:shadow-[-400px_0_0_400px_#00d1ff]"
                />
                <Volume2 className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 pointer-events-auto">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl backdrop-blur-xl border flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${isOpen ? 'bg-[#12141a] border-[#00d1ff]/30 text-[#00d1ff]' : 'bg-[#0a0a0f]/80 border-[#2d3139] text-white hover:border-slate-600'}`}
        >
          <div className="relative">
            <Music className="w-5 h-5" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d1ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00d1ff]"></span>
              </span>
            )}
          </div>
        </button>
        <div className="flex flex-col items-center justify-center w-8 h-14 bg-[#0a0a0f]/80 backdrop-blur-xl border border-[#2d3139] rounded-full cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </motion.div>
  );
}
