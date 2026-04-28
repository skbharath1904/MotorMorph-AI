import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.85);
  
  if (!data) return null;

  const { poles = 8, slots = 36 } = data.dimensions; // Slots often higher in this format
  
  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  const resetZoom = () => setScale(0.85);

  // Exact "Academic Technical" Palette
  const colors = {
    bg: '#ffffff',
    line: '#000000',
    fill: '#fcfcfc',
    highlight: '#e3f2fd',
    magnet: '#f0f0f0',
    text: '#000000'
  };

  return (
    <div className="motor-academic-viz" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── ACADEMIC VIEWPORT ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: '650px', 
        background: colors.bg, borderRadius: '12px', 
        border: '2px solid #eee', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        
        {/* VIEWPORT CONTROLS */}
        {!isPdfMode && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
            <button onClick={resetZoom} className="academic-btn">RESET</button>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '6px', border: '1px solid #ddd', padding: '2px' }}>
              <button onClick={() => handleZoom(-0.1)} className="academic-zoom-btn"><Minus size={14}/></button>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, width: '45px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
              <button onClick={() => handleZoom(0.1)} className="academic-zoom-btn"><Plus size={14}/></button>
            </div>
          </div>
        )}

        <motion.div 
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          animate={{ scale }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
            
            {/* 1. STATOR (OUTER RING) */}
            <circle cx="400" cy="400" r="320" fill="none" stroke={colors.line} strokeWidth="2" />
            <circle cx="400" cy="400" r="210" fill="none" stroke={colors.line} strokeWidth="1.5" />

            {/* 2. SLOTS (TRAPEZOIDAL) */}
            <g id="slots">
              {[...Array(slots)].map((_, i) => (
                <path 
                  key={i} 
                  d="M 390 100 L 410 100 L 406 180 L 394 180 Z" 
                  fill={colors.fill} 
                  stroke={colors.line} 
                  strokeWidth="1" 
                  transform={`rotate(${i * (360/slots)} 400 400)`}
                />
              ))}
            </g>

            {/* 3. ROTOR (INNER RING) */}
            <circle cx="400" cy="400" r="200" fill="none" stroke={colors.line} strokeWidth="1.5" />
            <circle cx="400" cy="400" r="130" fill="none" stroke={colors.line} strokeWidth="1.5" />

            {/* 4. MAGNETS (SURFACE MOUNTED) */}
            <g id="magnets">
              {[...Array(poles)].map((_, i) => (
                <path 
                  key={i} 
                  d="M 375 200 A 200 200 0 0 1 425 200 L 420 215 A 185 185 0 0 0 380 215 Z" 
                  fill={colors.magnet} 
                  stroke={colors.line} 
                  strokeWidth="1.2" 
                  transform={`rotate(${i * (360/poles)} 400 400)`}
                />
              ))}
            </g>

            {/* 5. SHAFT & CROSSHAIR */}
            <g id="shaft">
              <circle cx="400" cy="400" r="50" fill="none" stroke={colors.line} strokeWidth="1.5" />
              {/* Central Crosshair */}
              <line x1="390" y1="400" x2="410" y2="400" stroke={colors.line} strokeWidth="1" />
              <line x1="400" y1="390" x2="400" y2="410" stroke={colors.line} strokeWidth="1" />
            </g>

            {/* ── ACADEMIC LABELS & LEADERS (MATCHING IMAGE) ── */}
            <g stroke={colors.line} strokeWidth="1" fill="none">
              {/* Magnets Label */}
              <path d="M 500 120 L 580 80 L 620 80" />
              <text x="625" y="85" fill={colors.text} fontSize="18" fontWeight="500" stroke="none">Magnets</text>

              {/* Rotor Label */}
              <path d="M 520 250 L 600 200 L 640 200" />
              <text x="645" y="205" fill={colors.text} fontSize="18" fontWeight="500" stroke="none">Rotor</text>

              {/* Shaft Label */}
              <path d="M 450 400 L 640 400" />
              <text x="645" y="405" fill={colors.text} fontSize="18" fontWeight="500" stroke="none">Shaft</text>

              {/* Slots Label */}
              <path d="M 550 550 L 620 620 L 650 620" />
              <text x="655" y="625" fill={colors.text} fontSize="18" fontWeight="500" stroke="none">Slots</text>

              {/* Stator Label */}
              <path d="M 500 680 L 580 730 L 620 730" />
              <text x="625" y="735" fill={colors.text} fontSize="18" fontWeight="500" stroke="none">Stator</text>
            </g>
          </svg>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .academic-btn { background: #fff; border: 1px solid #ddd; padding: 6px 12px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .academic-btn:hover { background: #f8f8f8; border-color: #ccc; }
        .academic-zoom-btn { background: transparent; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; }
        .academic-zoom-btn:hover { color: #000; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
