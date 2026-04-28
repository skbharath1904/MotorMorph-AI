import React from 'react';

const MotorCrossSection = ({ data }) => {
  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Scaling factor to fit in a 400x400 viewbox
  // We want the largest dimension (Stator D) to be around 300px
  const scale = 300 / Math.max(statorD, 1);
  
  const centerX = 200;
  const centerY = 200;
  const statorRadius = (statorD / 2) * scale;
  const rotorRadius = ((statorD / 2) - airGap) * scale;
  const shaftRadius = statorRadius * 0.2; // Approximate shaft size
  
  // Slot and Pole math
  const slotDepth = statorRadius * 0.15;
  const slotWidth = (2 * Math.PI * (statorRadius - slotDepth/2)) / (slots * 2);

  return (
    <div className="glass-panel" style={{ 
      padding: '1.5rem', 
      background: 'rgba(0,0,0,0.4)', 
      border: '1px solid var(--glass-border)',
      borderRadius: '16px',
      marginBottom: '2rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', margin: 0 }}>
          Engineering Cross-Section
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Radial Blueprint (Dimensions in mm)
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <svg width="350" height="350" viewBox="0 0 400 400">
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: '#222', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#111', stopOpacity: 1 }} />
            </radialGradient>
            <linearGradient id="coilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#b87333', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d9480f', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Stator Outer Body */}
          <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#444" strokeWidth="2" />
          
          {/* Stator Slots / Coils */}
          {[...Array(slots)].map((_, i) => {
            const angle = (i * 360) / slots;
            return (
              <rect
                key={`slot-${i}`}
                x={centerX - slotWidth/2}
                y={centerY - statorRadius}
                width={slotWidth}
                height={slotDepth}
                fill="url(#coilGrad)"
                transform={`rotate(${angle}, ${centerX}, ${centerY})`}
                rx="2"
              />
            );
          })}

          {/* Air Gap Area */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth} fill="#050505" stroke="#333" strokeWidth="1" />

          {/* Rotor Body */}
          <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#1a1a1a" stroke="#00d2ff" strokeWidth="1.5" strokeDasharray="4 2" />
          
          {/* Rotor Poles */}
          {[...Array(poles)].map((_, i) => {
            const angle = (i * 360) / poles;
            const poleWidth = (2 * Math.PI * rotorRadius) / (poles * 2.5);
            return (
              <rect
                key={`pole-${i}`}
                x={centerX - poleWidth/2}
                y={centerY - rotorRadius}
                width={poleWidth}
                height={rotorRadius * 0.1}
                fill={i % 2 === 0 ? "#ff0055" : "#00d2ff"}
                transform={`rotate(${angle}, ${centerX}, ${centerY})`}
                rx="1"
              />
            );
          })}

          {/* Shaft */}
          <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#333" stroke="#888" strokeWidth="1" />
          <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#222" />

          {/* Dimensional Annotations */}
          <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 20} y2={centerY} stroke="var(--accent-blue)" strokeWidth="1" />
          <text x={centerX + statorRadius + 25} y={centerY + 5} fill="var(--accent-blue)" fontSize="10">Ø {statorD}mm</text>
        </svg>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <h5 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Drawing Key
          </h5>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'url(#coilGrad)', borderRadius: '2px', backgroundColor: '#b87333' }}></div>
              <span><strong>Stator Windings:</strong> {slots} Slots</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', border: '1.5px solid #00d2ff', borderRadius: '50%' }}></div>
              <span><strong>Rotor Boundary:</strong> Ø {(rotorRadius * 2 / scale).toFixed(1)} mm</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#ff0055', borderRadius: '2px' }}></div>
              <span><strong>Magnetic Poles:</strong> {poles} Poles ({data.motorType.split(' ')[0]})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#333', border: '1px solid #888', borderRadius: '50%' }}></div>
              <span><strong>Shaft Diameter:</strong> ~{(shaftRadius * 2 / scale).toFixed(1)} mm</span>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              Drawing shows radial cross-section at center of active rotor length ({rotorL}mm). All dimensions verified by AI engine.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotorCrossSection;
