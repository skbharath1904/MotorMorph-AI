import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.7);
  
  if (!data) return null;

  const { poles = 8, slots = 12 } = data.dimensions;
  
  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2.0));
  };

  const resetZoom = () => setScale(0.7);

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

  const CX = 500;
  const CY = 450;

  return (
    <div className="motor-visualization-system" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── CAD VIEWPORT ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: isPdfMode ? '600px' : '750px', 
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
          animate={{ scale: isPdfMode ? 0.65 : scale }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          <svg viewBox="0 0 1100 900" style={{ width: '100%', height: '100%' }}>
            
            {/* 1. EXTERNAL HOUSING WITH FINS */}
            <g id="housing">
              {[...Array(72)].map((_, i) => (
                <rect key={i} x={CX - 2} y={CY - 255} width="4" height="25" fill={colors.housing} transform={`rotate(${i * 5} ${CX} ${CY})`} />
              ))}
              <circle cx={CX} cy={CY} r="230" fill="none" stroke={colors.housing} strokeWidth="8" />
            </g>

            {/* 2. STATOR CORE (The Gap between housing and slots) */}
            <circle cx={CX} cy={CY} r="215" fill="none" stroke={colors.stator} strokeWidth="30" />

            {/* 3. STATOR SLOTS (A/B/C boxes) */}
            {[...Array(slots)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/slots)} ${CX} ${CY})`}>
                <rect x={CX - 15} y={CY - 225} width="30" height="25" rx="3" fill={colors.windings[i % 3]} stroke="#000" strokeWidth="1" />
                <text x={CX} y={CY - 208} textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" pointerEvents="none">
                  {['A', 'B', 'C'][i % 3]}
                </text>
              </g>
            ))}

            {/* 4. AIR GAP (GREEN DOTTED LINE) */}
            <circle cx={CX} cy={CY} r="185" fill="none" stroke={colors.dimension} strokeWidth="2" strokeDasharray="8 6" opacity="1.0" />

            {/* 5. ROTOR CORE ASSEMBLY (Gap between poles and shaft) */}
            <circle cx={CX} cy={CY} r="165" fill={colors.rotor} stroke="#333" strokeWidth="2" />
            
            {/* MAGNETIC POLES (Magnets) */}
            {[...Array(poles)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/poles)} ${CX} ${CY})`}>
                <path d={`M ${CX-30} ${CY-165} A 165 165 0 0 1 ${CX+30} ${CY-165} L ${CX+25} ${CY-178} A 150 150 0 0 0 ${CX-25} ${CY-178} Z`} fill={i % 2 === 0 ? colors.magnets.N : colors.magnets.S} stroke="#000" strokeWidth="1" />
                <text x={CX} y={CY - 168} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" pointerEvents="none">
                  {i % 2 === 0 ? 'N' : 'S'}
                </text>
              </g>
            ))}

            {/* 6. MAIN SHAFT */}
            <circle cx={CX} cy={CY} r="50" fill={isPdfMode ? "#fff" : "#111"} stroke={colors.text} strokeWidth="2" />
            <circle cx={CX} cy={CY} r="15" fill={colors.text} opacity={isPdfMode ? 0.2 : 0.4} />

            {/* ── MEASUREMENTS ── */}
            <g stroke={colors.dimension} strokeWidth="2.5" fill="none">
              <line x1={CX + 280} y1={CY - 230} x2={CX + 280} y2={CY + 230} />
              <line x1={CX + 260} y1={CY - 230} x2={CX + 300} y2={CY - 230} />
              <line x1={CX + 260} y1={CY + 230} x2={CX + 300} y2={CY + 230} />
              <line x1={CX - 200} y1={CY + 280} x2={CX + 200} y2={CY + 280} />
              <line x1={CX - 200} y1={CY + 260} x2={CX - 200} y2={CY + 300} />
              <line x1={CX + 200} y1={CY + 260} x2={CX + 200} y2={CY + 300} />
            </g>

            {/* Callout Boxes */}
            <g>
               <rect x={CX + 320} y={CY - 25} width="220" height="55" rx="10" fill="none" stroke={colors.dimension} strokeWidth="1.5" />
               <text x={CX + 430} y={CY + 5} textAnchor="middle" fill={colors.dimension} fontSize="18" fontWeight="900">Ø {data.dimensions.statorDiameter}</text>
               <text x={CX + 430} y={CY + 22} textAnchor="middle" fill={colors.dimension} fontSize="10" fontWeight="800">TOTAL OUTER DIAMETER</text>

               <rect x={CX - 110} y={CY + 320} width="220" height="55" rx="10" fill="none" stroke={colors.dimension} strokeWidth="1.5" />
               <text x={CX} y={CY + 350} textAnchor="middle" fill={colors.dimension} fontSize="18" fontWeight="900">Ø 98mm</text>
               <text x={CX} y={CY + 367} textAnchor="middle" fill={colors.dimension} fontSize="10" fontWeight="800">STATOR INNER BORE DIAMETER</text>
            </g>

            {/* ── UPDATED LABELS (NEW ENGINEERING SCHEMA) ── */}
            <g stroke={colors.leader} strokeWidth="1.5" fill="none">
               {/* Bullets */}
               <circle cx={CX - 230} cy={CY - 100} r="4" fill={colors.leader} stroke="none" /> {/* External Housing */}
               <circle cx={CX + 205} cy={CY - 235} r="4" fill={colors.leader} stroke="none" /> {/* Stator Core */}
               <circle cx={CX + 215} cy={CY - 160} r="4" fill={colors.leader} stroke="none" /> {/* Stator Slots */}
               <circle cx={CX + 185} cy={CY + 50} r="4" fill={colors.leader} stroke="none" /> {/* Air Gap */}
               <circle cx={CX - 165} cy={CY + 50} r="4" fill={colors.leader} stroke="none" /> {/* Magnetic Poles */}
               <circle cx={CX + 120} cy={CY + 120} r="4" fill={colors.leader} stroke="none" /> {/* Rotor Core */}
               <circle cx={CX - 40} cy={CY + 20} r="4" fill={colors.leader} stroke="none" /> {/* Main Shaft */}

               {/* Leader Lines */}
               <path d={`M ${CX - 230} ${CY - 100} L ${CX - 300} ${CY - 150}`} /> 
               <path d={`M ${CX + 205} ${CY - 235} L ${CX + 300} ${CY - 240}`} />
               <path d={`M ${CX + 215} ${CY - 160} L ${CX + 300} ${CY - 180}`} />
               <path d={`M ${CX + 185} ${CY + 50} L ${CX + 300} ${CY + 100}`} />
               <path d={`M ${CX - 165} ${CY + 50} L ${CX - 300} ${CY + 100}`} />
               <path d={`M ${CX + 120} ${CY + 120} L ${CX + 300} ${CY + 160}`} />
               <path d={`M ${CX - 40} ${CY + 20} L ${CX - 300} ${CY + 20}`} />
            </g>

            <g fill={colors.text} fontSize="16" fontWeight="900" fontFamily="Inter, sans-serif">
               <text x={CX - 305} y={CY - 155} textAnchor="end">EXTERNAL HOUSING</text>
               <text x={CX + 305} y={CY - 245} textAnchor="start">STATOR CORE</text>
               <text x={CX + 305} y={CY - 185} textAnchor="start">STATOR SLOTS</text>
               <text x={CX + 305} y={CY + 105} textAnchor="start">AIR GAP: {data.dimensions.airGap}</text>
               <text x={CX - 305} y={CY + 105} textAnchor="end">MAGNETIC POLES</text>
               <text x={CX + 305} y={CY + 165} textAnchor="start">ROTOR CORE</text>
               <text x={CX - 305} y={CY + 25} textAnchor="end">MAIN SHAFT</text>
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
          <div className="cad-legend-item"><div className="cad-icon-multi"><div style={{ background: colors.windings[0] }} /><div style={{ background: colors.windings[1] }} /></div><div><div className="cad-label-num">3. Stator Slots</div><div className="cad-label-desc">3-Phase (A/B/C) slot boxes</div></div></div>
          <div className="cad-legend-item"><div className="cad-dashed-line" /><div><div className="cad-label-num">4. Air Gap</div><div className="cad-label-desc">Flux region: {data.dimensions.airGap}</div></div></div>
          <div className="cad-legend-item"><div className="cad-magnet-icon"><span style={{ background: colors.magnets.N }}>N</span><span style={{ background: colors.magnets.S }}>S</span></div><div><div className="cad-label-num">5. Magnetic Poles</div><div className="cad-label-desc">Permanent magnets (N/S)</div></div></div>
          <div className="cad-legend-item"><div className="cad-shaft-icon" /><div><div className="cad-label-num">6. Main Shaft</div><div className="cad-label-desc">Central torque transmission</div></div></div>
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
