import React from 'react';

const MotorCrossSection = ({ data }) => {
  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Scaling factor
  const scale = 300 / Math.max(statorD * 1.2, 1); // Extra room for housing
  
  const centerX = 200;
  const centerY = 200;
  const housingRadius = (statorD / 2 * 1.1) * scale;
  const statorRadius = (statorD / 2) * scale;
  const rotorRadius = ((statorD / 2) - airGap) * scale;
  const shaftRadius = statorRadius * 0.2;
  
  const slotDepth = statorRadius * 0.18;
  const yokeThickness = statorRadius * 0.1;
  const toothWidth = (2 * Math.PI * (statorRadius - slotDepth)) / (slots * 3);
  const slotWidth = (2 * Math.PI * (statorRadius - slotDepth/2)) / (slots * 2);

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '2rem' }}>
      <div className="no-pdf" style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', margin: 0 }}>
          Full Engineering Cross-Section
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Detailed Assembly Blueprint (Dimensions in mm)
        </p>
      </div>

      <div className="drawing-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '2rem', 
        flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.4)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)'
      }}>
        <svg className="motor-svg" width="380" height="380" viewBox="0 0 400 400">
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#111" />
            </radialGradient>
            <linearGradient id="windingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b87333" />
              <stop offset="100%" stopColor="#8c4e1a" />
            </linearGradient>
          </defs>

          {/* ── HOUSING & FINS ── */}
          <circle cx={centerX} cy={centerY} r={housingRadius} fill="#1a1a1a" stroke="#333" strokeWidth="2" className="part-housing" />
          {[...Array(24)].map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <rect
                key={`fin-${i}`}
                x={centerX - 2}
                y={centerY - housingRadius - 10}
                width="4"
                height="12"
                fill="#222"
                stroke="#333"
                strokeWidth="1"
                transform={`rotate(${angle}, ${centerX}, ${centerY})`}
                className="part-fin"
              />
            );
          })}

          {/* ── STATOR YOKE ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#444" strokeWidth="1" className="part-stator-yoke" />
          
          {/* ── STATOR TEETH & WINDINGS ── */}
          {[...Array(slots)].map((_, i) => {
            const angle = (i * 360) / slots;
            return (
              <g key={`slot-group-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`} className="part-slot">
                {/* Teeth */}
                <path 
                  d={`M ${centerX - toothWidth/2} ${centerY - statorRadius + yokeThickness} 
                     L ${centerX + toothWidth/2} ${centerY - statorRadius + yokeThickness}
                     L ${centerX + toothWidth/1.5} ${centerY - statorRadius + slotDepth}
                     L ${centerX - toothWidth/1.5} ${centerY - statorRadius + slotDepth} Z`}
                  fill="#222" stroke="#444" 
                />
                {/* Windings (Coils) */}
                <rect
                  x={centerX - slotWidth/2.2}
                  y={centerY - statorRadius + yokeThickness + 2}
                  width={slotWidth/1.1}
                  height={slotDepth - yokeThickness - 4}
                  fill="url(#windingGrad)"
                  stroke="#5c3b16"
                  rx="2"
                  className="part-winding"
                />
              </g>
            );
          })}

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth} fill="#050505" stroke="#333" className="part-air-gap" />

          {/* ── ROTOR ASSEMBLY ── */}
          <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#1a1a1a" stroke="#00d2ff" strokeWidth="1" strokeDasharray="3 1" className="part-rotor" />
          
          {/* Rotor Poles */}
          {[...Array(poles)].map((_, i) => {
            const angle = (i * 360) / poles;
            const poleWidth = (2 * Math.PI * rotorRadius) / (poles * 2.2);
            return (
              <rect
                key={`pole-${i}`}
                x={centerX - poleWidth/2}
                y={centerY - rotorRadius}
                width={poleWidth}
                height={rotorRadius * 0.12}
                fill={i % 2 === 0 ? "#ff0055" : "#00d2ff"}
                stroke="rgba(0,0,0,0.5)"
                transform={`rotate(${angle}, ${centerX}, ${centerY})`}
                rx="1"
                className="part-pole"
              />
            );
          })}

          {/* ── SHAFT ── */}
          <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="1" className="part-shaft" />
          <circle cx={centerX} cy={centerY} r={shaftRadius * 0.3} fill="#111" stroke="#444" strokeWidth="1" />

          {/* Labels */}
          <g className="no-pdf">
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 30} y2={centerY} stroke="#00d2ff" strokeWidth="1" />
            <text x={centerX + statorRadius + 35} y={centerY + 4} fill="#00d2ff" fontSize="10" fontWeight="700">Ø {statorD}mm (Stator)</text>
          </g>
        </svg>

        <div className="drawing-key" style={{ flex: 1, minWidth: '250px' }}>
          <h5 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Drawing Component Key</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>VERIFIED</span>
          </h5>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#222', border: '1px solid #444' }}></div>
              <span><strong>Housing & Yoke:</strong> Cast Iron/Steel Frame with {slots} teeth</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#b87333', border: '1px solid #5c3b16' }}></div>
              <span><strong>Stator Windings:</strong> Concentric Copper Coils</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#ff0055', border: '1px solid #00d2ff' }}></div>
              <span><strong>Rotor Magnetic Poles:</strong> {poles}-Pole {data.motorType.split(' ')[0]} configuration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#222', border: '1px solid #666', borderRadius: '50%' }}></div>
              <span><strong>Main Shaft:</strong> High-tensile steel core</span>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <strong>Mechanical Note:</strong> This radial section shows active magnetic air gap of {airGap}mm. 
              The external housing fins are optimized for {data.thermal.coolingMethod}.
            </div>
          </div>
        </div>
      </div>

      {/* PDF Special Styles injected here for scoping */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .motor-drawing-container {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
        
        .pdf-export-mode .motor-drawing-container {
          page-break-before: always !important;
          break-before: page !important;
          margin-top: 50px !important;
          background: #fff !important;
        }

        .pdf-export-mode .drawing-layout {
          background: #fff !important;
          border: 2px solid #000 !important;
          padding: 20px !important;
          display: block !important;
        }

        .pdf-export-mode .motor-svg {
          filter: grayscale(1) !important;
          background: #fff !important;
        }

        .pdf-export-mode .motor-svg circle, 
        .pdf-export-mode .motor-svg rect, 
        .pdf-export-mode .motor-svg path {
          fill: none !important;
          stroke: #000 !important;
          stroke-width: 1px !important;
        }

        .pdf-export-mode .part-winding {
          fill: #eee !important;
          stroke: #000 !important;
        }

        .pdf-export-mode .part-pole {
          fill: #ddd !important;
          stroke: #000 !important;
        }
        
        .pdf-export-mode .drawing-key {
          margin-top: 20px !important;
          color: #000 !important;
        }
        
        .pdf-export-mode .no-pdf {
          display: none !important;
        }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
