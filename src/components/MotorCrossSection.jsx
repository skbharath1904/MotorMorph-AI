import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.75);
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data) return null;

  const { poles = 8, slots = 12 } = data.dimensions;
  
  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  const resetZoom = () => setScale(0.75);

  const colors = {
    bg: '#0a0a0a',
    housing: '#222',
    stator: '#333',
    windings: ['#ff9f43', '#00d2ff', '#a29bfe'], // A, B, C phases
    rotor: '#1a1a1a',
    magnets: ['#ff4757', '#2f3542'], // N, S
    dimension: '#00ff00',
    text: '#ffffff',
    leader: '#ffffff'
  };

  return (
    <div className="motor-viz-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── Viewport Container ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: '600px', 
        background: colors.bg, borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        
        {/* Zoom Controls (UI Only) */}
        {!isPdfMode && (
          <div style={{ 
            position: 'absolute', top: '20px', right: '20px', 
            display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 
          }}>
            <button onClick={resetZoom} className="zoom-btn" title="Reset View"><RotateCcw size={14} /></button>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
              <button onClick={() => handleZoom(-0.1)} className="zoom-btn-inner"><Minus size={14}/></button>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, width: '45px', textAlign: 'center', color: '#fff' }}>{Math.round(scale * 100)}%</span>
              <button onClick={() => handleZoom(0.1)} className="zoom-btn-inner"><Plus size={14}/></button>
            </div>
          </div>
        )}

        <motion.div 
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          animate={{ scale }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <svg viewBox="0 0 600 600" style={{ width: '90%', height: '90%' }}>
            {/* 1. External Housing */}
            <g>
              {[...Array(72)].map((_, i) => (
                <rect key={i} x="298" y="45" width="4" height="20" fill={colors.housing} transform={`rotate(${i * 5} 300 300)`} />
              ))}
              <circle cx="300" cy="300" r="230" fill="none" stroke={colors.housing} strokeWidth="6" />
            </g>

            {/* 2. Stator Core */}
            <circle cx="300" cy="300" r="200" fill="none" stroke={colors.stator} strokeWidth="40" />

            {/* 3. Stator Windings */}
            {[...Array(slots)].map((_, i) => (
              <rect 
                key={i} x="285" y="105" width="30" height="30" rx="4" 
                fill={colors.windings[i % 3]} 
                transform={`rotate(${i * (360/slots)} 300 300)`}
              />
            ))}

            {/* 4. Air Gap Line */}
            <circle cx="300" cy="300" r="168" fill="none" stroke={colors.dimension} strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />

            {/* 5. Rotor Body */}
            <circle cx="300" cy="300" r="165" fill={colors.rotor} />

            {/* 6. Rotor Magnets */}
            {[...Array(poles)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/poles)} 300 300)`}>
                <path d="M 270 142 A 158 158 0 0 1 330 142 L 325 160 A 140 140 0 0 0 275 160 Z" fill={i % 2 === 0 ? colors.magnets[0] : colors.magnets[1]} />
                <text x="300" y="155" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" pointerEvents="none">
                  {i % 2 === 0 ? 'N' : 'S'}
                </text>
              </g>
            ))}

            {/* 7. Drive Shaft */}
            <circle cx="300" cy="300" r="45" fill="#333" stroke="#fff" strokeWidth="2" />
            <circle cx="300" cy="300" r="15" fill="#fff" opacity="0.1" />

            {/* ── Dimension Lines (Neon Green) ── */}
            <g stroke={colors.dimension} strokeWidth="2">
              {/* Outer Diameter */}
              <line x1="520" y1="210" x2="520" y2="390" />
              <line x1="500" y1="210" x2="540" y2="210" />
              <line x1="500" y1="390" x2="540" y2="390" />
              
              {/* Stator Bore */}
              <line x1="230" y1="520" x2="370" y2="520" />
              <line x1="230" y1="500" x2="230" y2="540" />
              <line x1="370" y1="500" x2="370" y2="540" />
            </g>

            {/* ── Dimension Labels (Neon Green Box) ── */}
            <g>
              <rect x="540" y="270" width="130" height="40" rx="6" fill="none" stroke={colors.dimension} strokeWidth="1" />
              <text x="605" y="288" textAnchor="middle" fill={colors.dimension} fontSize="12" fontWeight="bold">Ø {data.dimensions.statorDiameter}</text>
              <text x="605" y="302" textAnchor="middle" fill={colors.dimension} fontSize="8">TOTAL OUTER DIAMETER</text>

              <rect x="235" y="550" width="130" height="40" rx="6" fill="none" stroke={colors.dimension} strokeWidth="1" />
              <text x="300" y="568" textAnchor="middle" fill={colors.dimension} fontSize="12" fontWeight="bold">Ø 98mm</text>
              <text x="300" y="582" textAnchor="middle" fill={colors.dimension} fontSize="8">STATOR INNER BORE DIAMETER</text>
            </g>

            {/* ── Annotation Leaders ── */}
            <g stroke={colors.leader} strokeWidth="1.5">
              <line x1="150" y1="180" x2="240" y2="250" /> {/* Housing */}
              <line x1="450" y1="100" x2="330" y2="210" /> {/* Windings */}
              <line x1="180" y1="420" x2="270" y2="350" /> {/* Poles */}
              <line x1="480" y1="250" x2="340" y2="280" /> {/* Air Gap */}
            </g>

            {/* ── Labels (White) ── */}
            <g fill={colors.text} fontSize="12" fontWeight="900" textAnchor="start">
               <text x="145" y="175" textAnchor="end">EXTERNAL HOUSING</text>
               <text x="455" y="95">STATOR WINDINGS (ABC)</text>
               <text x="175" y="435" textAnchor="end">ROTOR MAGNET POLES</text>
               <text x="485" y="245">AIR GAP: {data.dimensions.airGap}</text>
            </g>
          </svg>
        </motion.div>
      </div>

      {/* ── Parts Legend Grid (Exact Image Match) ── */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', 
        padding: '25px', background: '#0a0a0a', borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <div className="legend-item">
          <div className="legend-icon" style={{ background: '#333' }} />
          <div>
            <div className="legend-num">1. External Housing</div>
            <div className="legend-desc">Frame w/ cooling fins</div>
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-icon" style={{ background: '#222' }} />
          <div>
            <div className="legend-num">2. Stator Core</div>
            <div className="legend-desc">Laminated silicon steel yoke</div>
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-color-box">
             <div style={{ background: colors.windings[0], width: '8px', height: '12px' }} />
             <div style={{ background: colors.windings[1], width: '8px', height: '12px' }} />
          </div>
          <div>
            <div className="legend-num">3. Stator Windings</div>
            <div className="legend-desc">3-Phase (A/B/C) slot boxes</div>
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-dashed-line" />
          <div>
            <div className="legend-num">4. Air Gap</div>
            <div className="legend-desc">Flux region: {data.dimensions.airGap}</div>
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-magnet-box">
             <span style={{ background: colors.magnets[0] }}>N</span>
             <span style={{ background: colors.magnets[1] }}>S</span>
          </div>
          <div>
            <div className="legend-num">5. Rotor Poles</div>
            <div className="legend-desc">Permanent magnets (N/S)</div>
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-shaft-circle" />
          <div>
            <div className="legend-num">6. Drive Shaft</div>
            <div className="legend-desc">Main torque output shaft</div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .zoom-btn { background: rgba(255,255,255,0.1); border: none; border-radius: 6px; color: #fff; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .zoom-btn:hover { background: rgba(255,255,255,0.2); }
        .zoom-btn-inner { background: transparent; border: none; color: #fff; padding: 4px 8px; cursor: pointer; transition: opacity 0.2s; }
        .zoom-btn-inner:hover { opacity: 0.7; }
        
        .legend-item { display: flex; align-items: flex-start; gap: 12px; }
        .legend-icon { width: 32px; height: 32px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
        .legend-num { font-size: 0.9rem; font-weight: 700; color: #fff; }
        .legend-desc { font-size: 0.75rem; color: #888; }
        
        .legend-color-box { display: flex; gap: 2px; padding: 4px; border: 1px solid #444; border-radius: 2px; }
        .legend-dashed-line { width: 32px; height: 1px; border-top: 1px dashed #00ff00; margin-top: 15px; }
        .legend-magnet-box { display: flex; gap: 1px; }
        .legend-magnet-box span { font-size: 8px; width: 12px; height: 12px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .legend-shaft-circle { width: 24px; height: 24px; border: 2px solid #fff; border-radius: 50%; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
