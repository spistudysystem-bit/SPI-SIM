import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  Calculator, 
  BookOpen, 
  Activity, 
  Layers, 
  Zap, 
  Ruler, 
  TrendingDown, 
  CornerDownRight, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface PhysicsQuickReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

// Media list database
const REFERENCE_MEDIA = [
  { name: 'Air', z: 0.0004, c: 330, alpha: 12.0, color: '#8e9299', desc: 'Extremely high attenuation due to density mismatch; blocks beam penetration.' },
  { name: 'Fat', z: 1.38, c: 1450, alpha: 0.63, color: '#ffb800', desc: 'Slightly slower sound propagation; causes minor refraction edge shadowing.' },
  { name: 'Soft Tissue', z: 1.63, c: 1540, alpha: 0.50, color: '#00d1ff', desc: 'The universal clinical calibration standard database value.' },
  { name: 'Water', z: 1.48, c: 1480, alpha: 0.002, color: '#3b82f6', desc: 'Virtually zero acoustic attenuation; excellent control interface.' },
  { name: 'Muscle', z: 1.70, c: 1580, alpha: 1.00, color: '#ec4899', desc: 'Higher attenuation due to structural anisotropy and fibers.' },
  { name: 'Bone', z: 7.80, c: 4080, alpha: 20.0, color: '#e2e8f0', desc: 'Extreme impedance mismatch with tissue; absorbs energy rapidly.' },
  { name: 'PZT Crystal', z: 30.00, c: 4000, alpha: 2.50, color: '#a78bfa', desc: 'Active lead zirconate titanate sensor element slice.' }
];

export default function PhysicsQuickReference({ isOpen, onClose }: PhysicsQuickReferenceProps) {
  const [activeTab, setActiveTab] = useState<'constants' | 'calculator' | 'formulas'>('constants');
  
  // Interactive Reflection Calculator state
  const [medium1, setMedium1] = useState(REFERENCE_MEDIA[6]); // default PZT
  const [medium2, setMedium2] = useState(REFERENCE_MEDIA[2]); // default Soft Tissue
  
  // Interactive Frequency Wavelength calculator state
  const [calcFreq, setCalcFreq] = useState(5.0); // MHz
  const [calcDepth, setCalcDepth] = useState(6.0); // cm
  const [calcMedium, setCalcMedium] = useState(REFERENCE_MEDIA[2]); // Soft Tissue

  // Reflection calculations
  const reflectionCoefficient = Math.pow((medium2.z - medium1.z) / (medium2.z + medium1.z), 2);
  const reflectedPct = (reflectionCoefficient * 100).toFixed(2);
  const transmittedPct = (100 - parseFloat(reflectedPct)).toFixed(2);

  // Sound wavelength in mm
  const pulseWavelength = (calcMedium.c / (calcFreq * 1000)).toFixed(3); // mm
  
  // Specific Attenuation
  // Attel = alpha * frequency * depth
  const totalAttenDb = (calcMedium.alpha * calcFreq * calcDepth).toFixed(1);
  const attenPowerLeft = Math.pow(10, -parseFloat(totalAttenDb) / 10) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Drawer content frame */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#0c0e12] border-l border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden"
            id="physics-reference-drawer"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 bg-[#12151b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#00d1ff] animate-pulse" />
                <div>
                  <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                    Physics Quick-Reference
                  </h3>
                  <span className="text-[10px] text-[#8e9299] font-mono block">Clinical Acoustic Handbook</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#8e9299] hover:text-white transition-all cursor-pointer"
                title="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Custom Tab Bar Selector */}
            <div className="flex bg-[#101319] border-b border-white/5 p-1 gap-1">
              {(['constants', 'calculator', 'formulas'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-bold font-mono uppercase rounded transition-all text-center cursor-pointer ${
                    activeTab === tab ? 'bg-[#00d1ff]/10 text-[#00d1ff] border border-[#00d1ff]/20' : 'text-[#8e9299] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'constants' && 'Acoustic Constants'}
                  {tab === 'calculator' && 'Live Predictors'}
                  {tab === 'formulas' && 'Formula Bank'}
                </button>
              ))}
            </div>

            {/* Content list panel container with absolute scrolling to prevent app layout leakage */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              
              {/* TAB 1: Diagnostic Constants Index */}
              {activeTab === 'constants' && (
                <div className="space-y-4">
                  <div className="text-xs text-[#8e9299] leading-relaxed">
                    Quick reference lookup index for clinical acoustic characteristics across common body tissues. Use these reference markers for on-screen calibrations.
                  </div>

                  <div className="space-y-3">
                    {REFERENCE_MEDIA.map((med, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#141820] border border-white/5 rounded-xl p-3.5 space-y-2 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5Packed font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: med.color }} />
                            <span className="text-xs font-bold text-white">{med.name}</span>
                          </div>
                          <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-white/50">
                            {med.c === 1540 ? 'Calibration target' : 'Secondary medium'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                          <div className="bg-black/40 rounded p-1.5 flex flex-col justify-center">
                            <span className="text-[8px] text-[#8e9299] uppercase">Impedance (Z)</span>
                            <span className="text-white font-bold text-[11px] mt-0.5">{med.z} MRayls</span>
                          </div>
                          
                          <div className="bg-black/40 rounded p-1.5 flex flex-col justify-center">
                            <span className="text-[8px] text-[#8e9299] uppercase">Velocity (c)</span>
                            <span className="text-[#00d1ff] font-bold text-[11px] mt-0.5">{med.c} m/s</span>
                          </div>

                          <div className="bg-black/40 rounded p-1.5 flex flex-col justify-center">
                            <span className="text-[8px] text-[#8e9299] uppercase">Atten. (α)</span>
                            <span className="text-[#ffb800] font-bold text-[11px] mt-0.5">{med.alpha} dB/cm/MHz</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#8e9299] italic leading-relaxed">
                          {med.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Interactive Predictors and boundary calculator */}
              {activeTab === 'calculator' && (
                <div className="space-y-6">
                  
                  {/* Impedance Mismatch Reflector Card Block */}
                  <div className="bg-[#141820] border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Calculator size={14} className="text-[#00d1ff]" />
                      <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
                        Boundary Impedance Matcher
                      </h4>
                    </div>

                    <div className="text-[11px] text-[#8e9299] leading-relaxed">
                      Select two adjacent clinical structures below. The system will compute the reflection coefficient ($R$) and indicate downstream signal transfer.
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Medium 1 Picker */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider block">Boundary Medium 1</span>
                        <select 
                          value={medium1.name}
                          onChange={(e) => {
                            const found = REFERENCE_MEDIA.find(m => m.name === e.target.value);
                            if (found) setMedium1(found);
                          }}
                          className="w-full bg-[#1c222b] border border-white/10 outline-none text-xs rounded-lg px-2.5 py-1.5 text-white font-sans"
                        >
                          {REFERENCE_MEDIA.map(m => (
                            <option key={m.name} value={m.name}>{m.name} ({m.z} MRayls)</option>
                          ))}
                        </select>
                      </div>

                      {/* Medium 2 Picker */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider block">Boundary Medium 2</span>
                        <select 
                          value={medium2.name}
                          onChange={(e) => {
                            const found = REFERENCE_MEDIA.find(m => m.name === e.target.value);
                            if (found) setMedium2(found);
                          }}
                          className="w-full bg-[#1c222b] border border-white/10 outline-none text-xs rounded-lg px-2.5 py-1.5 text-white font-sans"
                        >
                          {REFERENCE_MEDIA.map(m => (
                            <option key={m.name} value={m.name}>{m.name} ({m.z} MRayls)</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Output readout strip */}
                    <div className="bg-[#08090d] border border-white/5 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8e9299]">Reflected Acoustic Power:</span>
                        <span className="text-red-400 font-bold">{reflectedPct}%</span>
                      </div>
                      
                      <div className="h-2 rounded-full bg-white/5 relative overflow-hidden">
                        <div 
                          className="absolute left-0 h-full bg-red-400 transition-all duration-300"
                          style={{ width: `${reflectedPct}%` }}
                        />
                        <div 
                          className="absolute h-full bg-[#00d1ff] transition-all duration-300"
                          style={{ left: `${reflectedPct}%`, right: 0 }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#8e9299]">Transmitted Forward Power:</span>
                        <span className="text-green-400 font-bold">{transmittedPct}%</span>
                      </div>
                    </div>

                    {/* Quick Match interpretation */}
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 text-[10px] text-[#8e9299] flex gap-2">
                      <Info size={14} className="text-[#00d1ff] shrink-0" />
                      <span>
                        {parseFloat(reflectedPct) > 90 ? (
                          <strong className="text-red-400 font-sans block mb-0.5">Critical Air/Bone Blockage:</strong>
                        ) : parseFloat(reflectedPct) < 1 ? (
                          <strong className="text-green-400 font-sans block mb-0.5">Perfect Acoustic Match:</strong>
                        ) : (
                          <strong className="text-yellow-400 font-sans block mb-0.5">Moderate Scattering Boundary:</strong>
                        )}
                        With {(medium1.z - medium2.z).toFixed(2)} MRayls difference, {reflectedPct}% of the sound power triggers a specular shadow return pattern.
                      </span>
                    </div>
                  </div>

                  {/* Wavelength & Attenuation Real-time calculator */}
                  <div className="bg-[#141820] border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Ruler size={14} className="text-[#ffb800]" />
                      <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
                        Frequency & Attenuation Predictor
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-[#8e9299] uppercase tracking-wider block">Simulated Tissue Medium</span>
                      <select 
                        value={calcMedium.name}
                        onChange={(e) => {
                          const found = REFERENCE_MEDIA.find(m => m.name === e.target.value);
                          if (found) setCalcMedium(found);
                        }}
                        className="w-full bg-[#1c222b] border border-white/10 outline-none text-xs rounded-lg px-2.5 py-1.5 text-white font-sans"
                      >
                        {REFERENCE_MEDIA.map(m => (
                          <option key={m.name} value={m.name}>{m.name} (@ {m.alpha} dB/cm/MHz)</option>
                        ))}
                      </select>
                    </div>

                    {/* Frequency range slider slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#8e9299]">Probe Frequency:</span>
                        <span className="text-white font-bold">{calcFreq.toFixed(1)} MHz</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-[#8e9299] font-mono">1.0 MHz</span>
                        <input 
                          type="range" 
                          min="1" 
                          max="15" 
                          step="0.5"
                          value={calcFreq} 
                          onChange={(e) => setCalcFreq(parseFloat(e.target.value))}
                          className="flex-1 accent-[#ffb800] cursor-pointer h-1 rounded"
                        />
                        <span className="text-[9px] text-[#8e9299] font-mono">15.0 MHz</span>
                      </div>
                    </div>

                    {/* Depth range slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#8e9299]">Depth Range:</span>
                        <span className="text-white font-bold">{calcDepth.toFixed(1)} cm</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-[#8e9299] font-mono">1.0 cm</span>
                        <input 
                          type="range" 
                          min="1" 
                          max="20" 
                          step="0.5"
                          value={calcDepth} 
                          onChange={(e) => setCalcDepth(parseFloat(e.target.value))}
                          className="flex-1 accent-[#00d1ff] cursor-pointer h-1 rounded"
                        />
                        <span className="text-[9px] text-[#8e9299] font-mono">20.0 cm</span>
                      </div>
                    </div>

                    {/* Core outputs display panel */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                      <div className="bg-[#08090d] border border-white/5 rounded-xl p-3">
                        <span className="text-[8px] text-[#8e9299] uppercase block mb-1">Acoustic Wavelength</span>
                        <span className="text-[#00d1ff] text-md font-bold">{pulseWavelength} mm</span>
                        <span className="text-[8px] text-white/40 block mt-0.5">λ = c / f</span>
                      </div>
                      
                      <div className="bg-[#08090d] border border-white/5 rounded-xl p-3">
                        <span className="text-[8px] text-[#8e9299] uppercase block mb-1">Total Attenuation Loss</span>
                        <span className="text-red-400 text-md font-bold">-{totalAttenDb} dB</span>
                        <span className="text-[8px] text-white/40 block mt-0.5">Power left: {attenPowerLeft.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: Academic Formulas Sheet */}
              {activeTab === 'formulas' && (
                <div className="space-y-4">
                  <div className="text-xs text-[#8e9299] leading-relaxed mb-2">
                    Standard registry physics equations mapped with definitions and core imaging variables. All values operate under steady constant soft-tissue density.
                  </div>

                  {/* Formula Cards stack */}
                  <div className="space-y-3">
                    
                    {/* Axial Resolution */}
                    <div className="bg-[#141820] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00d1ff]">
                        <Ruler size={13} />
                        <span>Axial Resolution Formula</span>
                      </div>
                      <div className="font-mono text-xs font-bold bg-[#08090d] text-center text-white py-1.5 rounded-lg border border-white/5">
                        Axial Res = SPL / 2  = (n × λ) / 2
                      </div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">
                        Defines resolution parallel to the axis of beam path. Shorter pulses (shorter wavelength and high damping/backing block thickness) yield smaller numbers, which clinically means <strong className="text-white">better image detail</strong>.
                      </p>
                    </div>

                    {/* Operational Crystal Frequency */}
                    <div className="bg-[#141820] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
                        <Layers size={13} />
                        <span>Operating Crystal Frequency</span>
                      </div>
                      <div className="font-mono text-xs font-bold bg-[#08090d] text-center text-white py-1.5 rounded-lg border border-white/5">
                        f = c_PZT / (2 × Thickness_PZT)
                      </div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">
                        Because thickness of the piezoelectric elements is hardwired to exactly <strong className="text-white">1/2 wavelength</strong>, thinner crystals generate high-frequency pulses suitable for shallow ocular/parts exams.
                      </p>
                    </div>

                    {/* Decibels and Attenuation */}
                    <div className="bg-[#141820] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffb800]">
                        <TrendingDown size={13} />
                        <span>Acoustic Decibel Loss Rate</span>
                      </div>
                      <div className="font-mono text-xs font-bold bg-[#08090d] text-center text-white py-1.5 rounded-lg border border-white/5">
                        Loss (dB) = α × f_MHz × Depth_cm
                      </div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">
                        To simplify decibel tracking, remember <strong className="text-white">3 dB loss = 50% power reduction</strong>, while <strong className="text-white">10 dB loss = 90% power reduction</strong>. Attenuation doubles when frequency doubles.
                      </p>
                    </div>

                    {/* The 13 Microsecond rule */}
                    <div className="bg-[#141820] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                        <Activity size={13} />
                        <span>The 13-Microsecond Rule</span>
                      </div>
                      <div className="font-mono text-xs font-bold bg-[#08090d] text-center text-white py-1.5 rounded-lg border border-white/5">
                        Depth (cm) = Round-Trip Time (µs) / 13
                      </div>
                      <p className="text-[10px] text-[#8e9299] leading-relaxed">
                        For every <strong className="text-white">13 microseconds</strong> of transit flight recording, the scanner plots target echoes exactly <strong className="text-white">1 cm deeper</strong> inside the abdominal scan grid.
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Quick reference footer links */}
            <div className="p-4 bg-[#101319] border-t border-white/10 flex justify-between items-center text-[10px] text-[#8e9299] font-mono">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-[#00d1ff]" /> Standard Calibration: 1,540 m/s
              </span>
              <a 
                href="#academy" 
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  // Dispatch scroll event helper to trigger route transition if needed inside App
                }}
                className="text-[#00d1ff] hover:underline"
              >
                Go to Textbook &rarr;
              </a>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
