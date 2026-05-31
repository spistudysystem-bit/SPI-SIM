
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  MessageSquare,
  Sparkles,
  Zap,
  HelpCircle,
  ChevronRight,
  Terminal,
  Activity,
  History,
  Trash2
} from 'lucide-react';
import { askPhysicsAI } from '../../services/kbService';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  deleteDoc,
  doc,
  limit
} from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AskKBModule() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load history from Firestore
  useEffect(() => {
    if (user) {
      const loadHistory = async () => {
        try {
          const chatsRef = collection(db, 'users', user.uid, 'chats');
          const q = query(chatsRef, orderBy('timestamp', 'asc'), limit(50));
          const querySnapshot = await getDocs(q);
          const history: Message[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({ role: 'user', content: data.question });
            history.push({ role: 'model', content: data.answer });
          });
          if (history.length > 0) setMessages(history);
        } catch (e) {
          console.error("Error loading chat history", e);
        }
      };
      loadHistory();
    } else {
      setMessages([]);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const response = await askPhysicsAI(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', content: response }]);

      // Save to Firestore if logged in
      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'chats'), {
          userId: user.uid,
          question: userMessage,
          answer: response,
          timestamp: serverTimestamp(),
          topic: 'General Physics'
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "🚨 **System Error:** Failed to establish uplink with simulation core. Please check your credentials (API Key) and try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "How does frequency affect axial resolution?",
    "Explain the 13 microsecond rule simply.",
    "What is the difference between LARRD and LATA?",
    "Explain Bernoulli's effect in a stenosis."
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden"
    >
      {/* Header Info */}
      <div className="p-8 border-b border-[#2d3139] bg-[#16181d]/30 backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-6 shrink-0 relative overflow-y-auto xl:overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} className="text-[#ffd700]" />
         </div>
         
         <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#ffd700]/10 rounded-lg">
                  <BookOpen size={20} className="text-[#ffd700]" />
               </div>
               <div className="text-[10px] font-mono text-[#ffd700] tracking-[3px] uppercase">Simulation_Core_Knowledge_Base</div>
            </div>
            <h2 className="text-3xl font-serif italic text-white">Ask the <span className="text-[#ffd700]">Tutor</span></h2>
            <p className="text-[12px] text-[#8e9299] max-w-xl">
               I've processed the entire Ultrasound Physics Review for you. 
               Ask me anything about sound props, transducers, resolution, or safety. 
               I'll provide cliffnotes to save you time.
            </p>
         </div>

         <div className="flex items-center gap-8 relative z-10 bg-black/40 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col">
               <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest leading-none mb-1">Status</div>
               <div className="flex items-center gap-1.5 font-mono text-[10px] text-green-400">
                  <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  Grounded_v2
               </div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col">
               <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest leading-none mb-1">Storage</div>
               <div className="font-mono text-[10px] text-[#ffd700]">
                  {user ? 'Cloud_Sync_ON' : 'Local_Only'}
               </div>
            </div>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row relative">
         {/* Suggested Questions (Sidebar on large screens) */}
         <div className="w-full xl:w-72 border-b xl:border-b-0 xl:border-r border-[#2d3139] p-6 bg-[#0f1115] shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="text-[9px] font-bold text-[#8e9299] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Terminal size={12} /> Training_Prompts
            </div>
            {suggestedQuestions.map((q, i) => (
               <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-left p-3 rounded-lg bg-black/40 border border-white/5 hover:border-[#ffd700]/30 hover:bg-[#ffd700]/5 transition-all group"
               >
                  <p className="text-[11px] text-[#e0e0e0] group-hover:text-white leading-relaxed">{q}</p>
                  <div className="flex items-center gap-1 mt-2 text-[8px] text-[#ffd700] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-tighter">
                     Run query <ChevronRight size={10} />
                  </div>
               </button>
            ))}

            {messages.length > 0 && user && (
               <button 
                onClick={async () => {
                  if (confirm('Wipe all academic logs?')) {
                    const chatsRef = collection(db, 'users', user.uid, 'chats');
                    const querySnapshot = await getDocs(chatsRef);
                    querySnapshot.forEach(async (d) => await deleteDoc(d.ref));
                    setMessages([]);
                  }
                }}
                className="mt-4 flex items-center gap-2 text-[9px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest px-3 py-2 border border-red-500/10 hover:border-red-500/30 rounded-lg"
               >
                 <Trash2 size={12} /> Purge History
               </button>
            )}

            <div className="mt-auto p-4 bg-[#ffd700]/5 rounded-xl border border-[#ffd700]/10 flex flex-col gap-2">
               <div className="flex items-center gap-2 text-[#ffd700]">
                  <Zap size={14} fill="currentColor" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Expert Mode</span>
               </div>
               <p className="text-[10px] text-[#8e9299] leading-relaxed">
                  Answers are derived from the 2020 registry review edition.
               </p>
            </div>
         </div>

         {/* Messages Container */}
         <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth no-scrollbar"
            >
               {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                     <div className="w-16 h-16 bg-[#ffd700]/10 rounded-2xl flex items-center justify-center mb-6 relative">
                        <MessageSquare className="text-[#ffd700] w-8 h-8" />
                        <div className="absolute -inset-2 bg-[#ffd700]/20 blur-xl opacity-30 animate-pulse rounded-full" />
                     </div>
                     <h3 className="text-xl font-serif italic text-white mb-3">Initializing Academic Uplink</h3>
                     <p className="text-sm text-[#8e9299] max-w-sm">
                        Connect to the knowledge core by entering a query below.
                        I'm specialized in explaining the physics behind ultrasound imagery.
                     </p>
                  </div>
               )}

               {messages.map((message, index) => (
                  <motion.div
                     key={index}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex gap-6 ${message.role === 'model' ? 'justify-start' : 'justify-end'}`}
                  >
                     {message.role === 'model' && (
                        <div className="w-10 h-10 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center shrink-0 mt-1">
                           <Bot size={20} className="text-[#ffd700]" />
                        </div>
                     )}
                     
                     <div className={`max-w-[85%] xl:max-w-[70%] flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="text-[8px] font-mono text-[#8e9299] uppercase tracking-widest mb-1 mx-2">
                           {message.role === 'model' ? 'SYSTEM_CORE_RESPONSE' : 'OPERATOR_QUERY'}
                        </div>
                        <div className={`p-6 rounded-2xl border ${
                           message.role === 'model' 
                           ? 'bg-[#16181d] border-white/5 text-[#e0e0e0] shadow-2xl' 
                           : 'bg-[#ffd700] border-[#ffd700]/20 text-black font-medium'
                        }`}>
                           <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-code:bg-white/10 prose-code:px-1 prose-code:rounded">
                              {message.role === 'model' ? (
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              ) : (
                                message.content
                              )}
                           </div>
                        </div>
                     </div>

                     {message.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                           <User size={20} className="text-[#8e9299]" />
                        </div>
                     )}
                  </motion.div>
               ))}

               {isLoading && (
                  <div className="flex gap-6 justify-start">
                     <div className="w-10 h-10 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 flex items-center justify-center shrink-0">
                        <Loader2 size={20} className="text-[#ffd700] animate-spin" />
                     </div>
                     <div className="flex flex-col items-start">
                        <div className="text-[8px] font-mono text-[#ffd700] uppercase tracking-widest mb-1 mx-2">CORE_PROCESSING...</div>
                        <div className="w-24 h-12 bg-[#16181d] border border-white/5 rounded-2xl flex items-center justify-center gap-1.5">
                           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                           <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-[#2d3139] bg-[#0f1115]/50 backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
                  <div className="flex-1 relative group">
                     <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Study query (e.g. explain attenuation coefficient)..."
                        className="w-full bg-black/60 border border-[#2d3139] group-hover:border-[#ffd700]/30 focus:border-[#ffd700] transition-all rounded-xl py-4 px-6 text-white placeholder-[#8e9299] focus:outline-none focus:ring-4 focus:ring-[#ffd700]/5"
                        disabled={isLoading}
                     />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-mono text-[#8e9299]">
                           GND.v2
                        </div>
                     </div>
                  </div>
                  <button 
                     type="submit"
                     disabled={!input.trim() || isLoading}
                     className="px-8 bg-[#ffd700] hover:bg-[#ffc700] disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] flex items-center justify-center group"
                  >
                     <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-4 text-center">
                   <p className="text-[9px] text-[#8e9299] flex items-center justify-center gap-2">
                      <Terminal size={10} /> AI grounded in SonicBuild Physics Knowledge Base. Version 2.0.4.
                   </p>
                </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
