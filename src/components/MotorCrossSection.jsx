import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Scaling factor
  const scale = 300 / Math.max(statorD * 1.2, 1);
  
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

  const handleHover = (part) => setHoveredPart(part);

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '2rem' }}>
      <div className="no-pdf" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', margin: 0 }}>
            Interactive Engineering Cross-Section
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Touch parts to identify assembly components
          </p>
        </div>
        <div style={{ 
          background: 'rgba(0, 210, 255, 0.1)', 
          padding: '0.4rem 1rem', 
          borderRadius: '20px',
          border: '1px solid var(--accent-blue)',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: 'var(--accent-blue)',
          minWidth: '180px',
          textAlign: 'center',
          opacity: hoveredPart ? 1 : 0.3,
          transition: 'all 0.2s'
        }}>
          {hoveredPart ? `SELECTED: ${hoveredPart}` : 'HOVER TO IDENTIFY'}
        </div>
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
        <svg className="motor-svg" width="380" height="380" viewBox="0 0 400 400" style={{ cursor: 'crosshair' }}>
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
          <g 
            onMouseEnter={() => handleHover('External Cooling Fins')}
            onMouseLeave={() => handleHover(null)}
            onTouchStart={() => handleHover('External Cooling Fins')}
          >
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
          </g>

          {/* ── STATOR YOKE ── */}
          <circle 
            cx={centerX} cy={centerY} r={statorRadius} 
            fill="url(#statorGrad)" stroke="#444" strokeWidth="1" 
            className="part-stator-yoke" 
            onMouseEnter={() => handleHover('Stator Back Iron (Yoke)')}
            onMouseLeave={() => handleHover(null)}
          />
          
          {/* ── STATOR TEETH & SLOTS ── */}
          {[...Array(slots)].map((_, i) => {
            const angle = (i * 360) / slots;
            return (
              <g key={`slot-group-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                {/* Stator Tooth (Iron) */}
                <path 
                  d={`M ${-toothWidth/2} ${-statorRadius + yokeThickness} 
                     L ${toothWidth/2} ${-statorRadius + yokeThickness}
                     L ${toothWidth/1.2} ${-statorRadius + slotDepth}
                     L ${-toothWidth/1.2} ${-statorRadius + slotDepth} Z`}
                  fill="#1a1a1a" stroke="#333" strokeWidth="0.5"
                  transform={`translate(${centerX}, ${centerY})`}
                  onMouseEnter={() => handleHover('Stator Tooth (Lamination)')}
                  onMouseLeave={() => handleHover(null)}
                />
                
                {/* Winding / Slot Detail */}
                <g 
                  transform={`rotate(${180/slots}, ${centerX}, ${centerY})`}
                  onMouseEnter={() => handleHover(`Stator Winding Slot #${i+1}`)}
                  onMouseLeave={() => handleHover(null)}
                  onTouchStart={() => handleHover(`Stator Winding Slot #${i+1}`)}
                >
                  {/* The Slot space */}
                  <rect
                    x={centerX - slotWidth/2.5}
                    y={centerY - statorRadius + yokeThickness + 1}
                    width={slotWidth/1.25}
                    height={slotDepth - yokeThickness - 2}
                    fill="#0a0a0a"
                    stroke="#222"
                  />
                  {/* Detailed Copper Wire Bundles */}
                  {[...Array(6)].map((_, j) => (
                    <circle 
                      key={`wire-${j}`}
                      cx={centerX - slotWidth/5 + (j % 2) * (slotWidth/2.5)}
                      cy={centerY - statorRadius + yokeThickness + 6 + Math.floor(j/2) * 6}
                      r="2"
                      fill="url(#windingGrad)"
                      stroke="#5c3b16"
                      strokeWidth="0.3"
                    />
                  ))}
                  <line 
                    x1={centerX - slotWidth/2.5} y1={centerY - statorRadius + slotDepth}
                    x2={centerX + slotWidth/2.5} y2={centerY - statorRadius + slotDepth}
                    stroke="#444" strokeWidth="0.5" strokeDasharray="1 1"
                  />
                </g>
              </g>
            );
          })}

          {/* ── AIR GAP ── */}
          <circle 
            cx={centerX} cy={centerY} r={statorRadius - slotDepth} 
            fill="#050505" stroke="#333" className="part-air-gap" 
            onMouseEnter={() => handleHover('Magnetic Air Gap')}
            onMouseLeave={() => handleHover(null)}
          />

          {/* ── ROTOR ASSEMBLY ── */}
          <g
            onMouseEnter={() => handleHover(`${data.motorType.split(' ')[0]} Rotor Core`)}
            onMouseLeave={() => handleHover(null)}
          >
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#1a1a1a" stroke="#00d2ff" strokeWidth="1" strokeDasharray="3 1" className="part-rotor" />
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
          </g>

          {/* ── SHAFT ── */}
          <g
            onMouseEnter={() => handleHover('Main Drive Shaft')}
            onMouseLeave={() => handleHover(null)}
            onTouchStart={() => handleHover('Main Drive Shaft')}
          >
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="1" className="part-shaft" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.3} fill="#111" stroke="#444" strokeWidth="1" />
          </g>

          {/* Labels and Leader Lines */}
          <g className="drawing-labels" pointerEvents="none">
            {/* Labels... */}
            <line x1={centerX - housingRadius} y1={centerY - housingRadius} x2={centerX - housingRadius - 40} y2={centerY - housingRadius - 20} stroke="#666" strokeWidth="1" />
            <text x={centerX - housingRadius - 45} y={centerY - housingRadius - 25} fill="#aaa" fontSize="9" textAnchor="end">HOUSING</text>
            <line x1={centerX + statorRadius - 30} y1={centerY - statorRadius + 30} x2={centerX + statorRadius + 60} y2={centerY - statorRadius + 10} stroke="url(#windingGrad)" strokeWidth="1" />
            <text x={centerX + statorRadius + 65} y={centerY - statorRadius + 15} fill="#b87333" fontSize="9" fontWeight="bold">COPPER SLOTS</text>
            <text x={centerX + statorRadius + 35} y={centerY + 4} fill="#00d2ff" fontSize="10" fontWeight="700">Ø {statorD}mm</text>
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
              <span><strong>Housing:</strong> Optimized for {data.thermal.coolingMethod}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#b87333', border: '1px solid #5c3b16' }}></div>
              <span><strong>Windings:</strong> Copper wire bundles in {slots} slots</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', background: '#ff0055', border: '1px solid #00d2ff' }}></div>
              <span><strong>Poles:</strong> {poles}-Pole magnetic arrangement</span>
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
        
        .pdf-export-mode .drawing-labels text {
          fill: #000 !important;
          font-weight: 900 !important;
          font-size: 10px !important;
        }

        .pdf-export-mode .drawing-labels line {
          stroke: #000 !important;
          stroke-width: 1.5px !important;
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
