import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.75);
  
  if (!data) return null;

  const { poles = 8, slots = 12 } = data.dimensions;
  
  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  const resetZoom = () => setScale(0.75);

  const colors = {
    bg: isPdfMode ? '#ffffff' : '#050505',
    housing: isPdfMode ? '#000000' : '#3d3d3d',
    stator: isPdfMode ? '#333333' : '#242424',
    windings: ['#e67e22', '#2980b9', '#8e44ad'], 
    rotor: isPdfMode ? '#111111' : '#1a1a1a',
    magnets: { N: '#ff4757', S: '#2f3542' },
    dimension: isPdfMode ? '#000000' : '#00ff00',
    leader: isPdfMode ? '#000000' : '#ffffff',
    text: isPdfMode ? '#000000' : '#ffffff'
  };

  return (
    <div className="motor-visualization-system" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── CAD VIEWPORT ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: isPdfMode ? '500px' : '700px', 
        background: colors.bg, borderRadius: '24px', 
        border: isPdfMode ? '2px solid #000' : '1px solid #1a1a1a', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        
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
          animate={{ scale: isPdfMode ? 0.6 : scale }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
            
            {/* 1. HOUSING WITH FINS */}
            <g id="housing">
              {[...Array(72)].map((_, i) => (
                <rect key={i} x="398" y="145" width="4" height="25" fill={colors.housing} transform={`rotate(${i * 5} 400 400)`} />
              ))}
              <circle cx="400" cy="400" r="230" fill="none" stroke={colors.housing} strokeWidth="8" />
            </g>

            {/* 2. STATOR CORE */}
            <circle cx="400" cy="400" r="215" fill="none" stroke={colors.stator} strokeWidth="30" />

            {/* 3. STATOR WINDINGS (A/B/C) - Moved slightly out to show air gap */}
            {[...Array(slots)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/slots)} 400 400)`}>
                <rect x="385" y="195" width="30" height="30" rx="3" fill={colors.windings[i % 3]} />
                <text x="400" y="215" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" pointerEvents="none">
                  {['A', 'B', 'C'][i % 3]}
                </text>
              </g>
            ))}

            {/* 4. CLEAR AIR GAP (GREEN DOTTED LINE) */}
            <circle cx="400" cy="400" r="182" fill="none" stroke={colors.dimension} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />

            {/* 5. ROTOR ASSEMBLY - Moved slightly in to show air gap */}
            <circle cx="400" cy="400" r="165" fill={colors.rotor} stroke="#222" strokeWidth="2" />
            {[...Array(poles)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/poles)} 400 400)`}>
                <path d="M 370 235 A 165 165 0 0 1 430 235 L 425 255 A 145 145 0 0 0 375 255 Z" fill={i % 2 === 0 ? colors.magnets.N : colors.magnets.S} />
                <text x="400" y="250" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" pointerEvents="none">
                  {i % 2 === 0 ? 'N' : 'S'}
                </text>
              </g>
            ))}

            {/* 6. DRIVE SHAFT */}
            <circle cx="400" cy="400" r="45" fill={isPdfMode ? "#fff" : "#111"} stroke={colors.text} strokeWidth="2" />
            <circle cx="400" cy="400" r="12" fill={colors.text} opacity={isPdfMode ? 0.2 : 0.5} />

            {/* ── ENGINEERING MEASUREMENTS (ELITE STYLE) ── */}
            <g stroke={colors.dimension} strokeWidth="2" fill="none">
              {/* Outer Diameter Vertical */}
              <line x1="650" y1="130" x2="650" y2="670" />
              <line x1="630" y1="130" x2="670" y2="130" />
              <line x1="630" y1="670" x2="670" y2="670" />

              {/* Stator Inner Horizontal */}
              <line x1="280" y1="710" x2="520" y2="710" />
              <line x1="280" y1="690" x2="280" y2="730" />
              <line x1="520" y1="690" x2="520" y2="730" />
            </g>

            {/* Callout Boxes WITH Proper Names */}
            <g>
               {/* Right Callout: Total Outer Diameter */}
               <rect x="690" y="375" width="180" height="50" rx="8" fill="none" stroke={colors.dimension} strokeWidth="1" />
               <text x="780" y="402" textAnchor="middle" fill={colors.dimension} fontSize="16" fontWeight="900">Ø {data.dimensions.statorDiameter}</text>
               <text x="780" y="418" textAnchor="middle" fill={colors.dimension} fontSize="9" fontWeight="700">TOTAL OUTER DIAMETER</text>

               {/* Bottom Callout: Stator Inner Bore Diameter */}
               <rect x="310" y="740" width="180" height="50" rx="8" fill="none" stroke={colors.dimension} strokeWidth="1" />
               <text x="400" y="767" textAnchor="middle" fill={colors.dimension} fontSize="16" fontWeight="900">Ø 98mm</text>
               <text x="400" y="783" textAnchor="middle" fill={colors.dimension} fontSize="9" fontWeight="700">STATOR INNER BORE DIAMETER</text>
            </g>

            {/* ── LABELS & LEADERS (MATCHING USER IMAGE) ── */}
            <g stroke={colors.leader} strokeWidth="1.5" fill="none">
               <line x1="260" y1="230" x2="350" y2="280" /> {/* External Housing */}
               <line x1="530" y1="180" x2="430" y2="280" /> {/* Stator Windings */}
               <line x1="260" y1="580" x2="370" y2="480" /> {/* Rotor Magnet Poles */}
               <line x1="530" y1="450" x2="430" y2="410" /> {/* Air Gap */}
            </g>

            <g fill={colors.text} fontSize="14" fontWeight="900" fontFamily="Inter, sans-serif">
               <text x="255" y="225" textAnchor="end">EXTERNAL HOUSING</text>
               <text x="535" y="175">STATOR WINDINGS (ABC)</text>
               <text x="255" y="585" textAnchor="end">ROTOR MAGNET POLES</text>
               <text x="535" y="445">AIR GAP: {data.dimensions.airGap}</text>
            </g>
          </svg>
        </motion.div>
      </div>

      {/* ── LEGEND ── */}
      {!isPdfMode && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', 
          padding: '30px', background: '#0a0a0a', borderRadius: '24px', 
          border: '1px solid #111' 
        }}>
          <div className="cad-legend-item"><div className="cad-icon-box" style={{ background: colors.housing }} /><div><div className="cad-label-num">1. External Housing</div><div className="cad-label-desc">Frame w/ cooling fins</div></div></div>
          <div className="cad-legend-item"><div className="cad-icon-box" style={{ background: colors.stator }} /><div><div className="cad-label-num">2. Stator Core</div><div className="cad-label-desc">Laminated silicon steel yoke</div></div></div>
          <div className="cad-legend-item"><div className="cad-icon-multi"><div style={{ background: colors.windings[0] }} /><div style={{ background: colors.windings[1] }} /></div><div><div className="cad-label-num">3. Stator Windings</div><div className="cad-label-desc">3-Phase (A/B/C) slot boxes</div></div></div>
          <div className="cad-legend-item"><div className="cad-dashed-line" /><div><div className="cad-label-num">4. Air Gap</div><div className="cad-label-desc">Flux region: {data.dimensions.airGap}</div></div></div>
          <div className="cad-legend-item"><div className="cad-magnet-icon"><span style={{ background: colors.magnets.N }}>N</span><span style={{ background: colors.magnets.S }}>S</span></div><div><div className="cad-label-num">5. Rotor Poles</div><div className="cad-label-desc">Permanent magnets (N/S)</div></div></div>
          <div className="cad-legend-item"><div className="cad-shaft-icon" /><div><div className="cad-label-num">6. Drive Shaft</div><div className="cad-label-desc">Main torque output shaft</div></div></div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .cad-tool-btn { background: #111; border: 1px solid #222; color: #fff; padding: 6px 12px; font-size: 0.75rem; font-weight: 900; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .cad-tool-btn:hover { background: #222; border-color: #333; }
        .cad-zoom-btn { background: transparent; border: none; color: #888; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cad-zoom-btn:hover { color: #fff; }
        
        .cad-legend-item { display: flex; align-items: center; gap: 15px; }
        .cad-icon-box { width: 40px; height: 32px; border-radius: 4px; border: 1px solid #333; }
        .cad-label-num { font-size: 1rem; font-weight: 800; color: #fff; }
        .cad-label-desc { font-size: 0.8rem; color: #666; margin-top: 2px; }
        
        .cad-icon-multi { display: flex; gap: 2px; padding: 4px; border: 1px solid #333; border-radius: 4px; width: 40px; height: 32px; box-sizing: border-box; }
        .cad-icon-multi div { flex: 1; border-radius: 2px; }
        .cad-dashed-line { width: 40px; border-top: 2px dashed #00ff00; margin-top: 2px; }
        .cad-magnet-icon { display: flex; gap: 1px; width: 40px; }
        .cad-magnet-icon span { width: 20px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #fff; border-radius: 2px; }
        .cad-shaft-icon { width: 28px; height: 28px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .cad-shaft-icon::after { content: ''; width: 6px; height: 6px; background: #fff; border-radius: 50%; opacity: 0.5; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
