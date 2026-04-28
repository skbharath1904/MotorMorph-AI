import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // LARGE VIEWBOX to prevent any clipping (800x500)
  const vbWidth = 800;
  const vbHeight = 500;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  // Scale motor down so there is plenty of room for labels on the sides
  // Stator D should be ~180px in an 800px wide box
  const scale = 180 / Math.max(statorD, 1);
  
  const housingRadius = (statorD / 2 * 1.15) * scale;
  const statorRadius = (statorD / 2) * scale;
  const rotorRadius = ((statorD / 2) - airGap) * scale;
  const shaftRadius = statorRadius * 0.22;
  
  const slotDepth = statorRadius * 0.2;
  const yokeThickness = statorRadius * 0.1;
  const toothWidth = (2 * Math.PI * (statorRadius - slotDepth)) / (slots * 3);
  const slotWidth = (2 * Math.PI * (statorRadius - slotDepth/2)) / (slots * 2);

  const handleHover = (part) => setHoveredPart(part);

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '3rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.8rem', margin: 0 }}>
            Engineering Assembly Blueprint
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Interactive Radial Cross-Section
          </p>
        </div>
        <div style={{ 
          background: hoveredPart ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255,255,255,0.05)', 
          padding: '0.5rem 1.2rem', 
          borderRadius: '30px',
          border: `1px solid ${hoveredPart ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'}`,
          fontSize: '0.85rem',
          fontWeight: '700',
          color: hoveredPart ? 'var(--accent-blue)' : 'var(--text-secondary)',
          minWidth: '220px',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          {hoveredPart ? hoveredPart.toUpperCase() : 'HOVER COMPONENT'}
        </div>
      </div>

      <div className="drawing-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.6)',
        padding: '1rem',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        overflow: 'visible' // CRITICAL: Ensure SVG content isn't clipped by container
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible', cursor: 'crosshair' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#333" />
              <stop offset="100%" stopColor="#151515" />
            </radialGradient>
            <linearGradient id="windingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9f43" />
              <stop offset="100%" stopColor="#cd7f32" />
            </linearGradient>
          </defs>

          {/* ── EXTERNAL HOUSING ── */}
          <g onMouseEnter={() => handleHover('External Housing')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            {[...Array(36)].map((_, i) => {
              const angle = (i * 360) / 36;
              return (
                <rect key={`f-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 8} width="3" height="10" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR STRUCTURE ── */}
          <g onMouseEnter={() => handleHover('Stator (Iron Yoke & Teeth)')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#555" strokeWidth="1" />
            
            {/* Teeth & Slots */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              return (
                <g key={`s-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  {/* Iron Tooth */}
                  <path 
                    d={`M ${-toothWidth/2} ${-statorRadius + yokeThickness} 
                       L ${toothWidth/2} ${-statorRadius + yokeThickness}
                       L ${toothWidth/1.3} ${-statorRadius + slotDepth}
                       L ${-toothWidth/1.3} ${-statorRadius + slotDepth} Z`}
                    fill="#151515" stroke="#333" strokeWidth="0.5"
                    transform={`translate(${centerX}, ${centerY})`}
                  />
                  
                  {/* Windings */}
                  <g transform={`rotate(${180/slots}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - slotWidth/2.4} y={centerY - statorRadius + yokeThickness + 2} width={slotWidth/1.2} height={slotDepth - yokeThickness - 4} fill="#0a0a0a" stroke="#222" />
                    {/* Copper wire representation */}
                    {[...Array(6)].map((_, j) => (
                      <circle key={`w-${j}`} cx={centerX - slotWidth/5 + (j % 2) * (slotWidth/2.5)} cy={centerY - statorRadius + yokeThickness + 6 + Math.floor(j/2) * 6} r="1.8" fill="url(#windingGrad)" />
                    ))}
                  </g>
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 3" pointerEvents="all" onMouseEnter={() => handleHover('Magnetic Air Gap')} onMouseLeave={() => handleHover(null)} />

          {/* ── ROTOR ASSEMBLY ── */}
          <g onMouseEnter={() => handleHover(`${motorType.split(' ')[0]} Rotor`)} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#181818" stroke="#444" strokeWidth="1" />
            {/* Magnetic Poles */}
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 2.2);
              return (
                <rect key={`p-${i}`} x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius * 0.15} fill={i % 2 === 0 ? "#ff2d55" : "#00d2ff"} stroke="rgba(0,0,0,0.3)" transform={`rotate(${angle}, ${centerX}, ${centerY})`} rx="1" />
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g onMouseEnter={() => handleHover('Main Transmission Shaft')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="1.5" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#333" stroke="#555" />
          </g>

          {/* ── LEADER LINES & LABELS ── */}
          <g className="blueprint-labels" pointerEvents="none" fontSize="11" fontWeight="bold">
            {/* HOUSING - LEFT TOP */}
            <path d={`M ${centerX - housingRadius} ${centerY - 20} L ${centerX - housingRadius - 80} ${centerY - 100}`} stroke="#666" fill="none" strokeWidth="1" />
            <text x={centerX - housingRadius - 85} y={centerY - 105} fill="#aaa" textAnchor="end">EXTERNAL HOUSING / FINS</text>

            {/* WINDINGS - RIGHT TOP */}
            <path d={`M ${centerX + statorRadius - 15} ${centerY - statorRadius + 20} L ${centerX + statorRadius + 80} ${centerY - 120}`} stroke="#cd7f32" fill="none" strokeWidth="1" />
            <text x={centerX + statorRadius + 85} y={centerY - 125} fill="#cd7f32">STATOR WINDINGS (SLOTS)</text>

            {/* STATOR IRON - RIGHT BOTTOM */}
            <path d={`M ${centerX + statorRadius} ${centerY + 20} L ${centerX + statorRadius + 80} ${centerY + 60}`} stroke="#888" fill="none" strokeWidth="1" />
            <text x={centerX + statorRadius + 85} y={centerY + 65} fill="#aaa">STATOR IRON (YOKE)</text>

            {/* AIR GAP - LEFT MIDDLE */}
            <path d={`M ${centerX - rotorRadius - 2} ${centerY + 10} L ${centerX - housingRadius - 100} ${centerY + 40}`} stroke="#00d2ff" fill="none" strokeWidth="1" />
            <text x={centerX - housingRadius - 105} y={centerY + 45} fill="#00d2ff" textAnchor="end">AIR GAP ({airGap}mm)</text>

            {/* MAGNETIC POLES - LEFT BOTTOM */}
            <path d={`M ${centerX - rotorRadius + 15} ${centerY + rotorRadius - 15} L ${centerX - housingRadius - 80} ${centerY + 160}`} stroke="#ff2d55" fill="none" strokeWidth="1" />
            <text x={centerX - housingRadius - 85} y={centerY + 165} fill="#ff2d55" textAnchor="end">MAGNETIC POLES (N/S)</text>

            {/* SHAFT - CENTER BOTTOM */}
            <path d={`M ${centerX} ${centerY} L ${centerX + 40} ${centerY + 180}`} stroke="#888" fill="none" strokeWidth="1" />
            <text x={centerX + 45} y={centerY + 185} fill="#888">MAIN DRIVE SHAFT</text>
            
            {/* Dimension */}
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 60} y2={centerY} stroke="#00d2ff" strokeWidth="1" strokeDasharray="2 2" />
            <text x={centerX + statorRadius + 65} y={centerY + 4} fill="#00d2ff" fontSize="12" fontWeight="900">Ø {statorD}mm</text>
          </g>
        </svg>

        {/* ── DETAILED LEGEND WITH SYMBOLS ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '20px', height: '20px', background: '#333', border: '2px solid #555' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Housing & Frame</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>External structural casing</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ width: '8px', height: '16px', background: '#cd7f32' }}></div>
              <div style={{ width: '8px', height: '16px', background: '#cd7f32' }}></div>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Slots & Windings</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Copper coil bundles in {slots} slots</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '20px', height: '20px', border: '2px dashed #00d2ff', borderRadius: '50%' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Magnetic Air Gap</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clearance for electromagnetic flux</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '10px', height: '16px', background: '#ff2d55' }}></div>
              <div style={{ width: '10px', height: '16px', background: '#00d2ff' }}></div>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Magnetic Poles</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{poles} alternating N/S poles</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdf-export-mode .motor-drawing-container {
          page-break-before: always !important;
          background: #fff !important;
          color: #000 !important;
          padding: 30px !important;
        }
        .pdf-export-mode .drawing-layout {
          background: #fff !important;
          border: 1px solid #000 !important;
          box-shadow: none !important;
          padding: 10px !important;
        }
        .pdf-export-mode .motor-svg {
          filter: grayscale(1) !important;
        }
        .pdf-export-mode .blueprint-labels text {
          fill: #000 !important;
          font-weight: 900 !important;
          font-size: 12px !important;
        }
        .pdf-export-mode .blueprint-labels path {
          stroke: #000 !important;
          stroke-width: 1px !important;
        }
        .pdf-export-mode .blueprint-legend strong { color: #000 !important; }
        .pdf-export-mode .blueprint-legend span { color: #555 !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
