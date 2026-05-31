import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CACHE_NAME = 'sonicbuild-audio-v1';
const SAMPLE_RATE = 24000;
const FIRESTORE_MAX_SIZE = 1048576; // 1MB limit for Firestore docs

export function useNarrator() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState<string | null>(null);
  
  const isSpeakingRef = useRef(false);
  const currentTextRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const getHash = async (text: string) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Safe catch if already stopped
      }
      sourceNodeRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setProgress(0);
  }, []);

  const playBuffer = async (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    stop();
    const ctx = audioContextRef.current;
    
    // Resume AudioContext if suspended (required by modern mobile browser security sandbox)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Failed to resume AudioContext:', e);
      }
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const startTime = ctx.currentTime;
    const duration = buffer.duration;
    
    source.onended = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
    
    source.start(0);
    sourceNodeRef.current = source;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    
    setProgress(0);
    // Start interval to update progress dynamically
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = ctx.currentTime - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 100);
  };

  const decodePcm = async (base64Data: string) => {
    if (!audioContextRef.current) return null;
    
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Ensure even number of bytes for 16-bit PCM
      const length = Math.floor(bytes.byteLength / 2);
      const pcmData = new Int16Array(bytes.buffer, 0, length);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }
      
      const buffer = audioContextRef.current.createBuffer(1, floatData.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(floatData);
      return buffer;
    } catch (e) {
      console.error('PCM Decoding failed:', e);
      return null;
    }
  };

  const speak = useCallback(async (text: string, voiceProfile?: string) => {
    if (!text || !audioContextRef.current) return;

    if (isSpeakingRef.current && currentTextRef.current === text) {
      stop();
      return;
    }

    setCurrentText(text);
    currentTextRef.current = text;
    // Prefix hash with voice profile to cache them separately!
    const stringToHash = voiceProfile ? `${voiceProfile}-${text}` : text;
    const hash = await getHash(stringToHash);
    const cache = await caches.open(CACHE_NAME);
    
    // 1. Check Browser Cache
    const cachedResponse = await cache.match(hash);
    if (cachedResponse) {
      try {
        const arrayBuffer = await cachedResponse.arrayBuffer();
        const length = Math.floor(arrayBuffer.byteLength / 2);
        const pcmData = new Int16Array(arrayBuffer, 0, length);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }
        const buffer = audioContextRef.current.createBuffer(1, floatData.length, SAMPLE_RATE);
        buffer.getChannelData(0).set(floatData);
        playBuffer(buffer);
        return;
      } catch (e) {
        console.warn('Cached audio playback failed, checking Firebase...', e);
      }
    }

    // 2. Check Firebase Cache
    try {
      const cacheDoc = await getDoc(doc(db, 'mediaCache', hash));
      if (cacheDoc.exists()) {
        const data = cacheDoc.data();
        const buffer = await decodePcm(data.base64Data);
        if (buffer) {
          // Sync to browser cache
          const binaryString = atob(data.base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await cache.put(hash, new Response(bytes.buffer));
          
          playBuffer(buffer);
          return;
        }
      }
    } catch (e) {
      console.warn('Firebase cache check failed:', e);
    }

    // 3. Generate New Content via Server Proxy
    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      
      let base64Audio: string | undefined;

      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceProfile }),
      });
      
      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        base64Audio = ttsData.base64Audio;
      } else {
        throw new Error("Failed to generate voice via server");
      }

      if (base64Audio) {
        const buffer = await decodePcm(base64Audio);
        if (buffer) {
          // Cache in Browser
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await cache.put(hash, new Response(bytes.buffer));
          
          // Cache in Firebase if size permits
          if (base64Audio.length < FIRESTORE_MAX_SIZE * 0.8) { // Safety margin
             try {
                await setDoc(doc(db, 'mediaCache', hash), {
                  key: hash,
                  base64Data: base64Audio,
                  contentType: 'audio/pcm',
                  createdAt: serverTimestamp()
                });
             } catch (fe) {
                console.warn('Failed to save to Firebase cache:', fe);
             }
          }
          
          playBuffer(buffer);
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, [stop]);

  // Pre-caching utility via Server Proxy
  const preCache = useCallback(async (texts: string[], voiceProfile?: string) => {
    const cache = await caches.open(CACHE_NAME);
    
    for (const text of texts) {
      const stringToHash = voiceProfile ? `${voiceProfile}-${text}` : text;
      const hash = await getHash(stringToHash);
      const cachedResponse = await cache.match(hash);
      if (cachedResponse) continue;

      // Also check Firebase before generating
      try {
        const cacheDoc = await getDoc(doc(db, 'mediaCache', hash));
        if (cacheDoc.exists()) {
          const data = cacheDoc.data();
          const binaryString = atob(data.base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await cache.put(hash, new Response(bytes.buffer));
          continue;
        }
      } catch (e) {}

      try {
        let base64Audio: string | undefined;

        const ttsResponse = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voiceProfile }),
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          base64Audio = ttsData.base64Audio;
        }

        if (base64Audio) {
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await cache.put(hash, new Response(bytes.buffer));

          // Save to Firebase
          if (base64Audio.length < FIRESTORE_MAX_SIZE * 0.8) {
            await setDoc(doc(db, 'mediaCache', hash), {
              key: hash,
              base64Data: base64Audio,
              contentType: 'audio/pcm',
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (e) {
        console.warn('Pre-cache failed for:', text.substring(0, 30), e);
      }
    }
  }, []);

  return { speak, stop, isSpeaking, progress, currentText, preCache };
}
