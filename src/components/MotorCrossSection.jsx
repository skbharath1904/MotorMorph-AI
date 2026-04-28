import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.75);
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data) return null;

  const { poles = 8, slots = 24 } = data.dimensions;
  
  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  const resetZoom = () => setScale(0.75);

  const colors = {
    bg: '#050505',
    housing: '#2d3436',
    stator: '#1a1a1a',
    windings: ['#ff9f43', '#00d2ff', '#a29bfe'],
    rotor: '#111',
    magnets: { N: '#ff4757', S: '#2f3542' },
    dimension: '#00ff00',
    leader: '#ffffff',
    text: '#ffffff'
  };

  return (
    <div className="motor-elite-viz" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── INTERACTIVE VIEWPORT ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: '700px', 
        background: colors.bg, borderRadius: '24px', 
        border: '1px solid #1a1a1a', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        
        {/* Zoom Controls Overlay */}
        {!isPdfMode && (
          <div style={{ position: 'absolute', top: '25px', right: '25px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
            <button onClick={resetZoom} className="cad-tool-btn">RESET</button>
            <div style={{ display: 'flex', alignItems: 'center', background: '#111', borderRadius: '8px', padding: '2px', border: '1px solid #222' }}>
              <button onClick={() => handleZoom(-0.1)} className="cad-zoom-btn"><Minus size={16}/></button>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, width: '55px', textAlign: 'center', color: '#00d2ff' }}>{Math.round(scale * 100)}%</span>
              <button onClick={() => handleZoom(0.1)} className="cad-zoom-btn"><Plus size={16}/></button>
            </div>
          </div>
        )}

        <motion.div 
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          animate={{ scale }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          <svg viewBox="0 0 800 800" style={{ width: '90%', height: '90%' }}>
            
            {/* 1. STATOR ASSEMBLY */}
            <circle cx="400" cy="400" r="320" fill="none" stroke={colors.housing} strokeWidth="3" />
            <circle cx="400" cy="400" r="210" fill={colors.stator} stroke="#333" strokeWidth="1" />

            {/* 2. SLOTS & WINDINGS */}
            <g id="slots">
              {[...Array(slots)].map((_, i) => (
                <g key={i} transform={`rotate(${i * (360/slots)} 400 400)`}>
                   <path 
                    d="M 392 110 L 408 110 L 405 190 L 395 190 Z" 
                    fill={colors.windings[i % 3]} 
                    stroke="#000" 
                    strokeWidth="0.5"
                  />
                </g>
              ))}
            </g>

            {/* 3. ROTOR ASSEMBLY */}
            <circle cx="400" cy="400" r="205" fill={colors.rotor} stroke="#333" strokeWidth="2" />
            <circle cx="400" cy="400" r="140" fill="#0a0a0a" stroke="#222" strokeWidth="1" />

            {/* 4. MAGNETS (N/S) */}
            <g id="magnets">
              {[...Array(poles)].map((_, i) => (
                <g key={i} transform={`rotate(${i * (360/poles)} 400 400)`}>
                  <path 
                    d="M 375 205 A 205 205 0 0 1 425 205 L 420 220 A 190 190 0 0 0 380 220 Z" 
                    fill={i % 2 === 0 ? colors.magnets.N : colors.magnets.S} 
                    stroke="#000"
                  />
                  <text x="400" y="216" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" pointerEvents="none">
                    {i % 2 === 0 ? 'N' : 'S'}
                  </text>
                </g>
              ))}
            </g>

            {/* 5. DRIVE SHAFT */}
            <g id="shaft">
              <circle cx="400" cy="400" r="50" fill="#111" stroke="#fff" strokeWidth="2" />
              <line x1="390" y1="400" x2="410" y2="400" stroke="#fff" strokeWidth="1" opacity="0.5" />
              <line x1="400" y1="390" x2="400" y2="410" stroke="#fff" strokeWidth="1" opacity="0.5" />
            </g>

            {/* ── MEASUREMENTS (Neon Green) ── */}
            <g stroke={colors.dimension} strokeWidth="2" fill="none">
              {/* Outer Diameter Line */}
              <line x1="680" y1="80" x2="680" y2="720" />
              <line x1="660" y1="80" x2="700" y2="80" />
              <line x1="660" y1="720" x2="700" y2="720" />

              {/* Stator Bore Line */}
              <line x1="280" y1="730" x2="520" y2="730" />
              <line x1="280" y1="710" x2="280" y2="750" />
              <line x1="520" y1="710" x2="520" y2="750" />
            </g>

            {/* ── MEASUREMENT LABELS ── */}
            <g>
               <rect x="710" y="375" width="160" height="50" rx="8" fill="none" stroke={colors.dimension} strokeWidth="1" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
               <text x="790" y="402" textAnchor="middle" fill={colors.dimension} fontSize="16" fontWeight="900">Ø {data.dimensions.statorDiameter}</text>
               <text x="790" y="418" textAnchor="middle" fill={colors.dimension} fontSize="9" fontWeight="700">TOTAL OUTER DIAMETER</text>

               <rect x="320" y="760" width="160" height="50" rx="8" fill="none" stroke={colors.dimension} strokeWidth="1" style={{ filter: 'drop-shadow(0 0 5px #00ff00)' }} />
               <text x="400" y="787" textAnchor="middle" fill={colors.dimension} fontSize="16" fontWeight="900">Ø 98mm</text>
               <text x="400" y="803" textAnchor="middle" fill={colors.dimension} fontSize="9" fontWeight="700">STATOR INNER BORE DIAMETER</text>
            </g>

            {/* ── ACADEMIC LABELS & LEADERS ── */}
            <g stroke="#fff" strokeWidth="1.5" fill="none">
               <path d="M 500 120 L 580 80 L 620 80" /> {/* Magnets */}
               <path d="M 520 250 L 600 200 L 640 200" /> {/* Rotor */}
               <path d="M 450 400 L 640 400" /> {/* Shaft */}
               <path d="M 550 550 L 620 620 L 650 620" /> {/* Slots */}
               <path d="M 500 680 L 580 730 L 620 730" /> {/* Stator */}
            </g>

            <g fill="#fff" fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">
               <text x="625" y="85">Magnets</text>
               <text x="645" y="205">Rotor</text>
               <text x="645" y="405">Shaft</text>
               <text x="655" y="625">Slots</text>
               <text x="625" y="735">Stator</text>
            </g>
          </svg>
        </motion.div>
      </div>

      {/* ── PARTS LEGEND ── */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', 
        padding: '30px', background: '#0a0a0a', borderRadius: '24px', 
        border: '1px solid #111' 
      }}>
        <div className="elite-legend-item">
          <div className="elite-icon" style={{ background: colors.housing }} />
          <div>
            <div className="elite-num">1. External Housing</div>
            <div className="elite-desc">Outer stationary assembly</div>
          </div>
        </div>
        <div className="elite-legend-item">
          <div className="elite-icon" style={{ background: colors.stator }} />
          <div>
            <div className="elite-num">2. Stator Core</div>
            <div className="elite-desc">Laminated silicon steel yoke</div>
          </div>
        </div>
        <div className="elite-legend-item">
          <div className="elite-multi-icon">
             <div style={{ background: colors.windings[0] }} />
             <div style={{ background: colors.windings[1] }} />
          </div>
          <div>
            <div className="elite-num">3. Stator Windings</div>
            <div className="elite-desc">3-Phase (A/B/C) slot boxes</div>
          </div>
        </div>
        <div className="elite-legend-item">
          <div className="elite-dashed" />
          <div>
            <div className="elite-num">4. Air Gap</div>
            <div className="elite-desc">Flux region: {data.dimensions.airGap}</div>
          </div>
        </div>
        <div className="elite-legend-item">
          <div className="elite-magnet-icon">
             <span style={{ background: colors.magnets.N }}>N</span>
             <span style={{ background: colors.magnets.S }}>S</span>
          </div>
          <div>
            <div className="elite-num">5. Rotor Poles</div>
            <div className="elite-desc">Permanent magnets (N/S)</div>
          </div>
        </div>
        <div className="elite-legend-item">
          <div className="elite-shaft-circle" />
          <div>
            <div className="elite-num">6. Drive Shaft</div>
            <div className="elite-desc">Main torque output shaft</div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .cad-tool-btn { background: #111; border: 1px solid #222; color: #fff; padding: 6px 12px; font-size: 0.75rem; font-weight: 900; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .cad-zoom-btn { background: transparent; border: none; color: #888; padding: 6px 10px; cursor: pointer; }
        
        .elite-legend-item { display: flex; align-items: center; gap: 15px; }
        .elite-icon { width: 36px; height: 32px; border-radius: 4px; border: 1px solid #333; }
        .elite-num { font-size: 1rem; font-weight: 800; color: #fff; }
        .elite-desc { font-size: 0.8rem; color: #666; }
        .elite-multi-icon { display: flex; gap: 2px; padding: 4px; border: 1px solid #333; border-radius: 4px; width: 36px; height: 32px; box-sizing: border-box; }
        .elite-multi-icon div { flex: 1; border-radius: 1px; }
        .elite-dashed { width: 36px; border-top: 2px dashed #00ff00; }
        .elite-magnet-icon { display: flex; gap: 1px; width: 36px; }
        .elite-magnet-icon span { width: 18px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #fff; border-radius: 2px; }
        .elite-shaft-circle { width: 28px; height: 28px; border: 2px solid #fff; border-radius: 50%; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
