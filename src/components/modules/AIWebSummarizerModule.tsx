import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Globe, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  History, 
  Trash2, 
  ExternalLink,
  BookOpen,
  Info,
  Sliders
} from 'lucide-react';

interface SummaryRecord {
  id: string;
  timestamp: string;
  inputType: 'url' | 'text';
  source: string; // The URL or a snippet of the text
  title: string;
  summary: string;
  tags: string[];
}

export default function AIWebSummarizerModule() {
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [inputVal, setInputVal] = useState('');
  const [summaryVibe, setSummaryVibe] = useState<'general' | 'technical' | 'academic' | 'executive'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Active output state
  const [result, setResult] = useState<{
    summary: string;
    tags: string[];
    count: number;
    title?: string;
  } | null>(null);

  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  
  // History storage
  const [history, setHistory] = useState<SummaryRecord[]>([]);

  // Rotate loading suggestions
  const loadingSteps = [
    "Establishing connection & fetching webpage layers...",
    "Scanning document layout & extracting text bodies...",
    "Analyzing semantic structure & tracking key themes...",
    "Gemini model synthesis: drafting perfect 1-3 sentences...",
    "Extracting specific keyword descriptors & tagging..."
  ];

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sonicbuild:summaries:history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load summary history", e);
    }
  }, []);

  // Save history helper
  const saveRecord = (record: SummaryRecord) => {
    const updated = [record, ...history.slice(0, 19)]; // Limit to 20 elements
    setHistory(updated);
    try {
      localStorage.setItem('sonicbuild:summaries:history', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist summaries history", e);
    }
  };

  // Clear single record
  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(r => r.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('sonicbuild:summaries:history', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all records
  const clearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('sonicbuild:summaries:history');
    } catch (err) {
      console.error(err);
    }
  };

  // Loading animation step rotator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCopySummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleClearInput = () => {
    setInputVal('');
    setErrorMsg(null);
  };

  const executeAnalysis = async () => {
    if (!inputVal.trim()) {
      setErrorMsg(inputType === 'url' ? 'Please provide a valid URL link.' : 'Please enter or paste the text content first.');
      return;
    }

    if (inputType === 'url') {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      let checkVal = inputVal.trim();
      if (!checkVal.startsWith('http://') && !checkVal.startsWith('https://')) {
        checkVal = 'https://' + checkVal;
      }
      if (!urlPattern.test(checkVal)) {
        setErrorMsg('Please enter a structurally valid URL (e.g. https://wikipedia.org).');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      let finalContent = inputVal.trim();
      if (inputType === 'url' && !finalContent.startsWith('http://') && !finalContent.startsWith('https://')) {
        finalContent = 'https://' + finalContent;
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalContent,
          isUrl: inputType === 'url',
          vibe: summaryVibe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error generating summary content');
      }

      const freshResult = {
        summary: data.summary,
        tags: data.tags,
        count: data.characterCountAnalyzed,
        title: inputType === 'url' ? new URL(finalContent).hostname : 'Raw Direct Text'
      };

      setResult(freshResult);

      // Save record in history
      const newRecord: SummaryRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        inputType,
        source: inputType === 'url' ? finalContent : (finalContent.slice(0, 60) + '...'),
        title: freshResult.title,
        summary: data.summary,
        tags: data.tags
      };
      
      saveRecord(newRecord);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please verify your network state or copy-paste text instead.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6"
    >
      {/* Module Title Section */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between border-b border-[#2d3139]/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] bg-[#00d1ff]/10 text-[#00d1ff] font-mono font-bold uppercase tracking-[2px] px-2 py-0.5 border border-[#00d1ff]/30 rounded-sm">
              AI EXPERT PILOT
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-[#8e9299] font-mono">MODEL: GEMINI_3.5_FLASH</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Sparkles className="text-[#00d1ff] w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            Web Semantic Summarizer &amp; Tagger
          </h1>
          <p className="text-xs text-[#8e9299]">
            Instantly map metadata, retrieve key educational takeaways, and filter core technical terms from any webpage or article.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controller Console */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#16181d] border border-[#2d3139]/80 rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
            <Globe size={180} />
          </div>

          <div className="flex flex-col gap-4">
            {/* Input Toggle Tab Row */}
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-[#8e9299] tracking-wider block mb-2">
                CHOOSE INGESTION METHOD
              </label>
              <div className="grid grid-cols-2 p-1 bg-[#0c0d10] border border-[#2d3139] rounded-lg">
                <button
                  onClick={() => { setInputType('url'); setInputVal(''); setErrorMsg(null); }}
                  className={`flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${inputType === 'url' ? 'bg-[#00d1ff] text-black shadow-lg shadow-[#00d1ff]/15' : 'text-[#8e9299] hover:text-white'}`}
                >
                  <Globe size={13} />
                  <span>Fetch Webpage URL</span>
                </button>
                <button
                  onClick={() => { setInputType('text'); setInputVal(''); setErrorMsg(null); }}
                  className={`flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${inputType === 'text' ? 'bg-[#00d1ff] text-black shadow-lg shadow-[#00d1ff]/15' : 'text-[#8e9299] hover:text-white'}`}
                >
                  <FileText size={13} />
                  <span>Copy Paste Article</span>
                </button>
              </div>
            </div>

            {/* URL/Text Input Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-[#8e9299] tracking-wider">
                  {inputType === 'url' ? 'TARGET WEBPAGE LINK' : 'BODY TEXT FOR AI INGESTION'}
                </label>
                {inputVal && (
                  <button onClick={handleClearInput} className="text-[9px] font-mono text-[#00d1ff] hover:underline uppercase tracking-wider cursor-pointer">
                    Clear Input
                  </button>
                )}
              </div>

              {inputType === 'url' ? (
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-[#8e9299] flex items-center justify-center pointer-events-none">
                    <Globe size={15} />
                  </div>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => { setInputVal(e.target.value); setErrorMsg(null); }}
                    placeholder="e.g. https://wikipedia.org/wiki/Ultrasound"
                    className="w-full bg-[#0c0d10] border border-[#2d3139] rounded-lg pl-10 pr-4 py-3 placeholder-[#8e9299]/40 text-[12px] font-mono text-white outline-none focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff]/20 transition-all font-light"
                    disabled={isLoading}
                    onKeyDown={(e) => { if (e.key === 'Enter') executeAnalysis(); }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    value={inputVal}
                    onChange={(e) => { setInputVal(e.target.value); setErrorMsg(null); }}
                    placeholder="Paste technical documentation, transcript lectures, or clinical summaries here (minimum 20 characters)..."
                    className="w-full h-44 bg-[#0c0d10] border border-[#2d3139] rounded-lg p-3.5 placeholder-[#8e9299]/30 text-[11px] leading-relaxed text-white outline-none focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff]/20 transition-all resize-none font-light"
                    disabled={isLoading}
                    maxLength={100000}
                  />
                  <div className="absolute bottom-2 right-3 text-[8.5px] font-mono text-[#8e9299] bg-[#16181d] px-2 py-0.5 rounded border border-[#2d3139]">
                    {inputVal.length.toLocaleString()} CHARACTER LIMIT
                  </div>
                </div>
              )}
            </div>

            {/* Customization Sliders / Parameters (adds enormous professional value) */}
            <div className="bg-[#0c0d10] border border-[#2d3139]/80 p-3.5 rounded-lg flex flex-col gap-2.5">
              <span className="text-[9px] font-mono uppercase font-bold text-[#00d1ff] tracking-widest flex items-center gap-1">
                <Sliders size={10} /> SUMMARY SPECIFICATION PROFILE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'general', label: 'Balanced General' },
                  { id: 'technical', label: 'Tech Explainer' },
                  { id: 'academic', label: 'Academic Rigor' },
                  { id: 'executive', label: 'Executive Brief' }
                ].map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSummaryVibe(profile.id as any)}
                    className={`py-1.5 px-2.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${summaryVibe === profile.id ? 'bg-[#ffd700]/15 text-[#ffd700] border-[#ffd700]/40' : 'bg-transparent text-[#8e9299]/80 border-[#2d3139] hover:text-white'}`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={executeAnalysis}
              disabled={isLoading || !inputVal.trim()}
              className={`w-full py-3.5 rounded-lg font-bold uppercase tracking-wider text-[11px] font-sans flex items-center justify-center gap-2 transition-all cursor-pointer ${isLoading ? 'bg-white/5 text-[#8e9299] cursor-not-allowed border border-white/5' : !inputVal.trim() ? 'bg-[#00d1ff]/20 text-[#00d1ff]/50 border border-[#00d1ff]/10 cursor-not-allowed' : 'bg-gradient-to-r from-[#00d1ff] to-indigo-600 text-black hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#00d1ff]/20'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Synthesizing Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  <span>Generate Quick Summary &amp; Tags</span>
                </>
              )}
            </button>

            {/* Informational Tips Context */}
            <div className="flex gap-2.5 items-start p-3 bg-[#0c0d10]/30 border border-[#2d3139]/40 rounded-lg">
              <Info size={14} className="text-[#ffd700] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#8e9299]/90 leading-normal">
                <strong>Ingestion Notice:</strong> Due to security restrictions on certain sites (like NYT, Medium paywalls, or dynamic single page apps), URL fetch operations may occasionally prevent access. If this occurs, simply switch to <strong>Copy Paste Article</strong> to bypass security firewalls.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Bento Display Screen */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Main Results Board */}
          <div className="bg-[#12141a] border border-[#2d3139] rounded-xl p-5 sm:p-6 shadow-2xl relative min-h-[300px] flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00d1ff]" />

            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-4 flex-1 h-full"
                >
                  <div className="relative">
                    <Loader2 size={36} className="text-[#00d1ff] animate-spin" />
                    <Sparkles size={14} className="text-[#ffd700] absolute -top-1.5 -right-1.5 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono tracking-widest text-[#00d1ff] uppercase">GENERATIVE PIPELINE ACTIVE</span>
                    <p className="text-xs text-white max-w-[280px] font-medium h-8 line-clamp-2">
                      {loadingSteps[loadingStep]}
                    </p>
                  </div>
                </motion.div>
              )}

              {errorMsg && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center p-6 gap-3 flex-1 h-full min-h-[220px]"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30">
                    <Trash2 className="text-rose-400 w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-black">EXTRACTION FAILED</span>
                    <pre className="text-[11px] text-[#e0e0e0] leading-relaxed whitespace-pre-wrap max-w-sm px-4 bg-[#0c0d10] py-2.5 rounded-lg border border-[#2d3139] font-mono">
                      {errorMsg}
                    </pre>
                  </div>
                </motion.div>
              )}

              {!isLoading && !errorMsg && !result && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-3.5 flex-1 h-full"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <BookOpen size={20} className="text-[#8e9299]/60" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono tracking-widest text-[#8e9299] uppercase">Terminal Output Ready</span>
                    <p className="text-xs text-[#8e9299] max-w-[240px]">
                      Provide a URL or paste raw text on the left and click execute to assemble semantic summaries.
                    </p>
                  </div>
                </motion.div>
              )}

              {!isLoading && !errorMsg && result && (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6 flex-1 justify-between h-full"
                >
                  <div>
                    {/* Source Title Indicator */}
                    <div className="flex justify-between items-center bg-[#0c0d10] border border-[#2d3139] rounded-lg px-3.5 py-2 mb-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="h-2 w-2 rounded-full bg-[#00d1ff]" />
                        <span className="text-[9.5px] font-mono text-white tracking-wide truncate max-w-[180px]">
                          {result.title}
                        </span>
                      </div>
                      <span className="text-[8.5px] font-mono text-[#8e9299] px-2 py-0.5 bg-white/5 border border-white/5 rounded">
                        {(result.count || 0).toLocaleString()} CHARS
                      </span>
                    </div>

                    {/* Summary Section */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono uppercase font-bold text-[#8e9299] tracking-wider">
                          GENERATED SUMMARY (1-3 Sentences)
                        </span>
                        <button 
                          onClick={handleCopySummary}
                          className="text-[#00d1ff] hover:text-[#00d1ff]/80 font-mono text-[9px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSummary ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                          <span>{copiedSummary ? 'COPIED!' : 'COPY SUMMARY'}</span>
                        </button>
                      </div>
                      <div className="bg-[#0c0d10] border border-[#2d3139]/80 rounded-xl p-4 text-[12px] leading-relaxed text-[#e0e0e0] font-sans antialiased shadow-inner">
                        {result.summary}
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className="flex flex-col gap-2.5 mt-5">
                      <span className="text-[9px] font-mono uppercase font-bold text-[#8e9299] tracking-wider">
                        EXTRACTED META TAGS (Click to copy)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCopyTag(tag)}
                            className="px-3 py-1.5 bg-[#00d1ff]/5 hover:bg-[#00d1ff]/15 border border-[#00d1ff]/20 text-[#00d1ff] text-[10px] font-mono uppercase rounded-full transition-all flex items-center gap-1 cursor-pointer select-none"
                            title="Click to copy tag descriptor"
                          >
                            <span>#</span>
                            <span className="font-bold">{tag}</span>
                            {copiedTag === tag ? (
                              <Check size={9} className="text-green-400 ml-0.5" />
                            ) : (
                              <Copy size={9} className="text-[#00d1ff]/40 ml-0.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] font-mono text-[#8e9299] tracking-widest uppercase border-t border-[#2d3139]/45 pt-4 mt-4 text-center">
                    COMPLETED SUCCESSFULLY — SEMANTICS RESOLVED
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Access Local History Box */}
          <div className="bg-[#16181d] border border-[#2d3139]/80 rounded-xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex justify-between items-center border-b border-[#2d3139]/45 pb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-white tracking-widest flex items-center gap-2">
                <History size={12} className="text-[#ffd700]" /> LOCAL STUDY AUDIT LOG ({history.length})
              </span>
              {history.length > 0 && (
                <button 
                  onClick={clearAllHistory}
                  className="text-[8.5px] font-mono text-rose-500 hover:underline uppercase tracking-wider cursor-pointer font-bold"
                >
                  Clear Log
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[165px] overflow-y-auto no-scrollbar">
              {history.length === 0 ? (
                <div className="py-4 text-center text-[10px] text-[#8e9299]/70 italic">
                  No recent documents analyzed. History will register here locally.
                </div>
              ) : (
                history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => {
                      setResult({
                        summary: record.summary,
                        tags: record.tags,
                        count: 0,
                        title: record.title
                      });
                      setInputType(record.inputType);
                      setInputVal(inputType === 'url' ? record.source : '');
                      setErrorMsg(null);
                    }}
                    className="flex justify-between items-center bg-[#0c0d10] hover:bg-white/5 border border-[#2d3139]/60 p-2.5 rounded-lg transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 overflow-hidden pr-3">
                      <div className="flex items-center gap-1.5">
                        {record.inputType === 'url' ? <Globe size={11} className="text-[#00d1ff]" /> : <FileText size={11} className="text-[#ffd700]" />}
                        <span className="text-[9.5px] font-mono text-[#e0e0e0] group-hover:text-white font-bold truncate max-w-[200px]">
                          {record.title || record.source}
                        </span>
                      </div>
                      <span className="text-[8.5px] font-mono text-[#8e9299] truncate max-w-[250px]">
                        {record.summary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-[8px] text-[#8e9299]">
                        {record.timestamp}
                      </span>
                      <button 
                        onClick={(e) => deleteRecord(record.id, e)}
                        className="p-1 rounded text-[#8e9299] hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete record"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
