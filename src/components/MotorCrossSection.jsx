import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw } from 'lucide-react';

/**
 * MotorCrossSection v4.2 - Precision Engineering Schema
 * Fixes: Dynamic Dimension Synchronization (Total Outer vs Bore Diameter)
 */
const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [scale, setScale] = useState(0.7);
  
  if (!data) return null;

  const { poles = 8, slots = 12 } = data.dimensions;
  
  // ── PRECISION DIMENSION CALCULATION ──
  // Extract predicted statorDiameter (e.g., "200 mm")
  const statorOuterD = parseInt(data.dimensions.statorDiameter) || 200;
  
  // Rule-of-thumb for traction motors: Bore is ~72% of Stator Outer
  const boreD = Math.round(statorOuterD * 0.72); 
  
  // External Housing adds ~8% radial overhead for cooling/structure
  const totalOuterD = Math.round(statorOuterD * 1.08);

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

  const getPoint = (radius, angleDeg) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: CX + radius * Math.cos(angleRad),
      y: CY + radius * Math.sin(angleRad)
    };
  };

  const pts = {
    housing: getPoint(245, -30),
    statorCore: getPoint(225, 45), 
    statorSlots: getPoint(217, 65),
    airGap: getPoint(190, 85), 
    poles: getPoint(165, 150),
    rotorCore: getPoint(110, 210),
    shaft: getPoint(45, 275)
  };

  return (
    <div className="motor-visualization-system" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── CAD VIEWPORT ── */}
      <div style={{ 
        position: 'relative', width: '100%', height: isPdfMode ? '600px' : '750px', 
        background: colors.bg, borderRadius: '24px', 
        border: isPdfMode ? '2px solid #000' : '1px solid #1a1a1a', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        
        {/* Version Tag for Cache Busting Confirmation */}
        {!isPdfMode && (
          <div style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '0.65rem', color: '#333', fontWeight: 900 }}>
            ENG_SCHEMA_V4.2
          </div>
        )}

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
            
            {/* 1. EXTERNAL HOUSING */}
            <g id="housing">
              {[...Array(72)].map((_, i) => (
                <rect key={i} x={CX - 2} y={CY - 255} width="4" height="25" fill={colors.housing} transform={`rotate(${i * 5} ${CX} ${CY})`} />
              ))}
              <circle cx={CX} cy={CY} r="230" fill="none" stroke={colors.housing} strokeWidth="8" />
            </g>

            {/* 2. STATOR CORE */}
            <circle cx={CX} cy={CY} r="220" fill="none" stroke={colors.stator} strokeWidth="30" />

            {/* 3. STATOR SLOTS */}
            {[...Array(slots)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/slots)} ${CX} ${CY})`}>
                <rect x={CX - 15} y={CY - 230} width="30" height="25" rx="3" fill={colors.windings[i % 3]} stroke="#000" strokeWidth="1" />
                <text x={CX} y={CY - 213} textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" pointerEvents="none">
                  {['A', 'B', 'C'][i % 3]}
                </text>
              </g>
            ))}

            {/* 4. AIR GAP */}
            <circle cx={CX} cy={CY} r="190" fill="none" stroke={colors.dimension} strokeWidth="2" strokeDasharray="8 6" opacity="1.0" />

            {/* 5. ROTOR CORE */}
            <circle cx={CX} cy={CY} r="160" fill={colors.rotor} stroke="#333" strokeWidth="2" />
            
            {/* MAGNETIC POLES */}
            {[...Array(poles)].map((_, i) => (
              <g key={i} transform={`rotate(${i * (360/poles)} ${CX} ${CY})`}>
                <path d={`M ${CX-36} ${CY-160} A 160 160 0 0 1 ${CX+36} ${CY-160} L ${CX+32} ${CY-175} A 175 175 0 0 0 ${CX-32} ${CY-175} Z`} fill={i % 2 === 0 ? colors.magnets.N : colors.magnets.S} stroke="#000" strokeWidth="1" />
                <text x={CX} y={CY - 165} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" pointerEvents="none">
                  {i % 2 === 0 ? 'N' : 'S'}
                </text>
              </g>
            ))}

            {/* 6. MAIN SHAFT */}
            <circle cx={CX} cy={CY} r="50" fill={isPdfMode ? "#fff" : "#111"} stroke={colors.text} strokeWidth="2" />
            <circle cx={CX} cy={CY} r="15" fill={colors.text} opacity={isPdfMode ? 0.2 : 0.4} />

            {/* ── MEASUREMENTS (UNIQUE PREDICTED VALUES) ── */}
            <g stroke={colors.dimension} strokeWidth="2.5" fill="none">
              <line x1={CX + 280} y1={CY - 230} x2={CX + 280} y2={CY + 230} />
              <line x1={CX + 260} y1={CY - 230} x2={CX + 300} y2={CY - 230} />
              <line x1={CX + 260} y1={CY + 230} x2={CX + 300} y2={CY + 230} />
              <line x1={CX - 200} y1={CY + 280} x2={CX + 200} y2={CY + 280} />
              <line x1={CX - 200} y1={CY + 260} x2={CX - 200} y2={CY + 300} />
              <line x1={CX + 200} y1={CY + 260} x2={CX + 200} y2={CY + 300} />
            </g>

            <g>
               {/* Right Callout: Explicitly use totalOuterD */}
               <rect x={CX + 320} y={CY - 25} width="220" height="55" rx="10" fill="none" stroke={colors.dimension} strokeWidth="1.5" />
               <text x={CX + 430} y={CY + 5} textAnchor="middle" fill={colors.dimension} fontSize="18" fontWeight="900">Ø {totalOuterD} mm</text>
               <text x={CX + 430} y={CY + 22} textAnchor="middle" fill={colors.dimension} fontSize="10" fontWeight="800">TOTAL OUTER DIAMETER</text>

               {/* Bottom Callout: Explicitly use boreD */}
               <rect x={CX - 110} y={CY + 320} width="220" height="55" rx="10" fill="none" stroke={colors.dimension} strokeWidth="1.5" />
               <text x={CX} y={CY + 350} textAnchor="middle" fill={colors.dimension} fontSize="18" fontWeight="900">Ø {boreD} mm</text>
               <text x={CX} y={CY + 367} textAnchor="middle" fill={colors.dimension} fontSize="10" fontWeight="800">STATOR INNER BORE DIAMETER</text>
            </g>

            {/* ── LABELS ── */}
            <g stroke={colors.leader} strokeWidth="2" fill="none">
               <circle cx={pts.housing.x} cy={pts.housing.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.statorCore.x} cy={pts.statorCore.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.statorSlots.x} cy={pts.statorSlots.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.airGap.x} cy={pts.airGap.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.poles.x} cy={pts.poles.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.rotorCore.x} cy={pts.rotorCore.y} r="5" fill={colors.leader} stroke="none" />
               <circle cx={pts.shaft.x} cy={pts.shaft.y} r="5" fill={colors.leader} stroke="none" />

               <path d={`M ${pts.housing.x} ${pts.housing.y} L ${CX + 300} ${CY - 300}`} /> 
               <path d={`M ${pts.statorCore.x} ${pts.statorCore.y} L ${CX + 350} ${CY - 230}`} />
               <path d={`M ${pts.statorSlots.x} ${pts.statorSlots.y} L ${CX + 350} ${CY - 160}`} />
               <path d={`M ${pts.airGap.x} ${pts.airGap.y} L ${CX + 350} ${CY + 110}`} />
               <path d={`M ${pts.poles.x} ${pts.poles.y} L ${CX - 350} ${CY + 150}`} />
               <path d={`M ${pts.rotorCore.x} ${pts.rotorCore.y} L ${CX - 350} ${CY + 230}`} />
               <path d={`M ${pts.shaft.x} ${pts.shaft.y} L ${CX - 350} ${CY - 60}`} />
            </g>

            <g fill={colors.text} fontSize="17" fontWeight="900" fontFamily="Inter, sans-serif">
               <text x={CX + 305} y={CY - 305} textAnchor="start">EXTERNAL HOUSING</text>
               <text x={CX + 355} y={CY - 225} textAnchor="start">STATOR CORE</text>
               <text x={CX + 355} y={CY - 165} textAnchor="start">STATOR SLOTS</text>
               <text x={CX + 355} y={CY + 115} textAnchor="start">AIR GAP: {data.dimensions.airGap}</text>
               <text x={CX - 355} y={CY + 155} textAnchor="end">MAGNETIC POLES</text>
               <text x={CX - 355} y={CY + 235} textAnchor="end">ROTOR CORE</text>
               <text x={CX - 355} y={CY - 55} textAnchor="end">MAIN SHAFT</text>
            </g>
          </svg>
        </motion.div>
      </div>

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
