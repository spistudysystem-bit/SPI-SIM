import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Image as ImageIcon, Eye, Film, X, Info } from 'lucide-react';
import { AdminMediaItem, getAdminMediaForModule } from '../../lib/adminMedia';
import agentSarahPortrait from '../../assets/images/agent_sarah_portrait_1781263218814.jpg';

interface AttachedMediaListProps {
  module: string; // matches target viewMode like 'probe', 'doppler', 'imaging', 'artifacts', 'safety'
}

export default function AttachedMediaList({ module }: AttachedMediaListProps) {
  const [items, setItems] = useState<AdminMediaItem[]>([]);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    // Reload items whenever the module changes
    setItems(getAdminMediaForModule(module));
    
    // Listen for custom trigger to sync dynamically when admin panel modifies items
    const handleSync = () => {
      setItems(getAdminMediaForModule(module));
    };
    window.addEventListener('sonicbuild_admin_sync', handleSync);
    return () => {
      window.removeEventListener('sonicbuild_admin_sync', handleSync);
    };
  }, [module]);

  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-400/5 via-indigo-500/[0.02] to-transparent border border-cyan-400/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00d1ff]" />
            <span className="text-[9.5px] font-mono text-cyan-400 font-extrabold tracking-[2px] uppercase">
              Instructor Clinical Attachments Staged
            </span>
          </div>
          <h3 className="text-sm font-serif italic text-white mt-1">
            Additional Custom Case Materials ({items.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5 font-mono text-[8.5px] text-[#8e9299]">
          <Info size={11} className="text-cyan-400" />
          <span>ADDED VIA ADMIN COCKPIT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((media) => (
          <div 
            key={media.id}
            className="bg-[#12141c]/90 border border-[#2d3139] rounded-xl p-3 flex flex-col sm:flex-row gap-4 items-stretch hover:border-[#00d1ff]/40 transition-colors group"
          >
            {/* Asset thumb preview */}
            <div 
              onClick={() => setActiveMediaUrl(media.url)}
              className="w-full sm:w-28 h-20 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer border border-white/5 shrink-0 group-hover:scale-[1.02] transition-transform"
            >
              {media.mediaType === 'image' ? (
                <img src={media.url} alt={media.title} className="max-h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <video src={media.url} className="max-h-full object-contain" muted playsInline />
              )}
              
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="p-1.5 bg-black/80 rounded-full border border-white/10">
                  {media.mediaType === 'image' ? (
                    <ImageIcon size={12} className="text-cyan-400" />
                  ) : (
                    <Play size={12} className="text-cyan-400 ml-0.5" />
                  )}
                </div>
              </div>

              <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[7px] font-mono text-slate-300 uppercase">
                {media.mediaType}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{media.title}</h4>
                <p className="text-[10px] text-[#8e9299] font-sans leading-relaxed line-clamp-2">{media.description}</p>
              </div>

              <div className="flex justify-between items-center text-[8.5px] font-mono text-[#8e9299] mt-3 border-t border-white/5 pt-1.5">
                <span>Category: <strong className="text-white">{media.category}</strong></span>
                <button 
                  onClick={() => setActiveMediaUrl(media.url)}
                  className="text-cyan-400 hover:underline uppercase flex items-center gap-1 font-bold"
                >
                  <Eye size={10} />
                  Inspect view
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal display */}
      <AnimatePresence>
        {activeMediaUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[300] cursor-zoom-out"
            onClick={() => setActiveMediaUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-4xl max-h-[85vh] bg-[#0c0d10] border border-[#2d3139] p-3 rounded-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveMediaUrl(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/85 border border-[#2d3139] text-[#8e9299] hover:text-white z-10"
              >
                <X size={15} />
              </button>
              
              <div className="flex items-center justify-center h-[55vh] w-[75vw] rounded-xl overflow-hidden bg-slate-950 border border-white/5 shadow-2xl relative">
                {activeMediaUrl.startsWith('data:image/') || activeMediaUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || !items.find(m => m.url === activeMediaUrl)?.mediaType || items.find(m => m.url === activeMediaUrl)?.mediaType === 'image' ? (
                  <img src={activeMediaUrl} alt="Inspection Mode" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <video src={activeMediaUrl} className="max-h-full" controls autoPlay playsInline loop />
                    {/* Character Overlay */}
                    <div className="absolute bottom-16 left-6 flex items-end gap-3 z-[10] pointer-events-none drop-shadow-2xl">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.4)] bg-black shrink-0">
                        <img src={agentSarahPortrait} alt="Agent Sarah" className="w-full h-full object-cover" />
                      </div>
                      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 p-2.5 rounded-2xl rounded-bl-none shadow-xl max-w-[200px]">
                        <p className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-0.5">Agent Sarah</p>
                        <p className="text-[10px] text-white leading-snug">Reviewing clinical playback. Watch closely for key sonographic artifacts.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
