import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data) return null;

  const { poles = 8, slots = 12 } = data.dimensions;
  
  // Colors for interactive mode
  const colors = {
    housing: isPdfMode ? '#000' : '#444',
    stator: isPdfMode ? '#333' : '#64748b',
    windings: isPdfMode ? '#555' : '#0ea5e9',
    rotor: isPdfMode ? '#222' : '#334155',
    magnets: isPdfMode ? '#000' : '#f43f5e',
    shaft: isPdfMode ? '#000' : '#1e293b',
    text: isPdfMode ? '#000' : '#fff'
  };

  const getPartStyle = (partName) => ({
    stroke: hoveredPart === partName ? '#00d2ff' : 'none',
    strokeWidth: hoveredPart === partName ? 3 : 0,
    filter: hoveredPart === partName ? 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.5))' : 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  });

  return (
    <div className="motor-visualization-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '700px', background: isPdfMode ? '#fff' : 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: isPdfMode ? '1px solid #000' : '1px solid var(--glass-border)' }}>
        
        {/* Interactive Tooltip UI Only */}
        {!isPdfMode && (
          <AnimatePresence>
            {hoveredPart && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', border: '1px solid var(--accent-blue)', color: '#fff', padding: '8px 15px', borderRadius: '6px', fontSize: '0.85rem', zIndex: 10 }}
              >
                <strong>{hoveredPart.toUpperCase()}</strong>: {getPartDescription(hoveredPart, data)}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <svg viewBox="0 0 600 600" width="100%" height="auto">
          {/* Background definitions */}
          <defs>
            <radialGradient id="shaftGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
          </defs>

          {/* 1. External Housing w/ Cooling Fins */}
          <g onMouseEnter={() => setHoveredPart('housing')} onMouseLeave={() => setHoveredPart(null)}>
            {[...Array(60)].map((_, i) => (
              <rect 
                key={i} 
                x="298" y="40" width="4" height="25" 
                fill={colors.housing} 
                transform={`rotate(${i * 6} 300 300)`}
                style={getPartStyle('housing')}
              />
            ))}
            <circle cx="300" cy="300" r="235" fill="none" stroke={colors.housing} strokeWidth="6" />
          </g>

          {/* 2. Stator Core */}
          <g onMouseEnter={() => setHoveredPart('stator')} onMouseLeave={() => setHoveredPart(null)}>
            <circle cx="300" cy="300" r="210" fill="none" stroke={colors.stator} strokeWidth="40" style={getPartStyle('stator')} />
          </g>

          {/* 3. Stator Windings (Slots) */}
          <g onMouseEnter={() => setHoveredPart('windings')} onMouseLeave={() => setHoveredPart(null)}>
            {[...Array(slots)].map((_, i) => (
              <rect 
                key={i} 
                x="285" y="95" width="30" height="30" rx="4" 
                fill={colors.windings} 
                transform={`rotate(${i * (360/slots)} 300 300)`}
                style={getPartStyle('windings')}
              />
            ))}
            {/* Phase Labels */}
            {!isPdfMode && [...Array(slots)].map((_, i) => (
              <text 
                key={`lbl-${i}`} 
                x="300" y="115" 
                textAnchor="middle" 
                fontSize="12" 
                fontWeight="bold" 
                fill="#fff" 
                transform={`rotate(${i * (360/slots)} 300 300)`}
                pointerEvents="none"
              >
                {['A', 'B', 'C'][i % 3]}
              </text>
            ))}
          </g>

          {/* 4. Air Gap (Implicit) */}
          <circle cx="300" cy="300" r="168" fill="none" stroke={isPdfMode ? "#000" : "rgba(0, 210, 255, 0.2)"} strokeWidth="1" strokeDasharray="4 4" />

          {/* 5. Rotor Body */}
          <g onMouseEnter={() => setHoveredPart('rotor')} onMouseLeave={() => setHoveredPart(null)}>
            <circle cx="300" cy="300" r="165" fill={colors.rotor} style={getPartStyle('rotor')} />
          </g>

          {/* 6. Rotor Magnets */}
          <g onMouseEnter={() => setHoveredPart('magnets')} onMouseLeave={() => setHoveredPart(null)}>
            {[...Array(poles)].map((_, i) => (
              <path 
                key={i} 
                d="M 270 140 A 160 160 0 0 1 330 140 L 325 155 A 145 145 0 0 0 275 155 Z" 
                fill={i % 2 === 0 ? colors.magnets : '#3b82f6'} 
                transform={`rotate(${i * (360/poles)} 300 300)`}
                style={getPartStyle('magnets')}
              />
            ))}
            {!isPdfMode && [...Array(poles)].map((_, i) => (
               <text 
                key={`pole-${i}`} 
                x="300" y="152" 
                textAnchor="middle" 
                fontSize="10" 
                fontWeight="bold" 
                fill="#fff" 
                transform={`rotate(${i * (360/poles)} 300 300)`}
                pointerEvents="none"
              >
                {i % 2 === 0 ? 'N' : 'S'}
              </text>
            ))}
          </g>

          {/* 7. Drive Shaft */}
          <g onMouseEnter={() => setHoveredPart('shaft')} onMouseLeave={() => setHoveredPart(null)}>
            <circle cx="300" cy="300" r="45" fill={isPdfMode ? colors.shaft : 'url(#shaftGradient)'} style={getPartStyle('shaft')} />
            <circle cx="300" cy="300" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </g>

          {/* Annotations & Dimension Lines */}
          <g style={{ opacity: isPdfMode ? 1 : 0.8 }}>
             {/* Stator Diameter Line */}
             <line x1="100" y1="500" x2="500" y2="500" stroke={colors.text} strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
             <text x="300" y="525" textAnchor="middle" fill={colors.text} fontSize="14" fontWeight="bold">Ø {data.dimensions.statorDiameter} - STATOR BORE</text>
             
             {/* Air Gap Indicator */}
             <line x1="480" y1="300" x2="520" y2="300" stroke={colors.text} strokeWidth="1" />
             <text x="530" y="305" fill={colors.text} fontSize="12" fontWeight="bold">AIR GAP: {data.dimensions.airGap}</text>
             
             {/* Part Labels w/ Leaders */}
             <line x1="200" y1="120" x2="100" y2="50" stroke={colors.text} strokeWidth="1" />
             <text x="95" y="45" textAnchor="end" fill={colors.text} fontSize="12" fontWeight="bold">EXTERNAL HOUSING</text>
             
             <line x1="330" y1="100" x2="450" y2="50" stroke={colors.text} strokeWidth="1" />
             <text x="455" y="45" fill={colors.text} fontSize="12" fontWeight="bold">STATOR WINDINGS (ABC)</text>
          </g>

          {/* Arrow markers */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 Z" fill={colors.text} />
            </marker>
          </defs>
        </svg>

        {/* Legend for UI Only */}
        {!isPdfMode && (
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['housing', 'stator', 'windings', 'rotor', 'magnets', 'shaft'].map(part => (
              <div 
                key={part} 
                onMouseEnter={() => setHoveredPart(part)} 
                onMouseLeave={() => setHoveredPart(null)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', 
                  background: hoveredPart === part ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '12px', height: '12px', background: colors[part === 'housing' ? 'housing' : part], borderRadius: '2px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: hoveredPart === part ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                  {part.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to get descriptions
const getPartDescription = (part, data) => {
  const descriptions = {
    housing: "High-grade aluminum external frame with optimized cooling fins for maximum heat dissipation.",
    stator: "Laminated silicon steel stator core with optimized flux paths for high efficiency.",
    windings: `3-Phase copper windings arranged in ${data.dimensions.slots} slots for optimal torque ripple control.`,
    rotor: "High-inertia rotor core designed for structural integrity at maximum RPM.",
    magnets: `High-coercivity permanent magnets (${data.dimensions.poles} poles) for superior magnetic flux density.`,
    shaft: "Precision-engineered drive shaft for high torque transmission and bearing stability."
  };
  return descriptions[part] || "";
};

export default MotorCrossSection;
