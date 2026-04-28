import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Viewbox is 500x500 to allow for labels without clipping
  const size = 500;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Scaling (Stator D should be about 220px in a 500px viewbox)
  const scale = 220 / Math.max(statorD, 1);
  
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
    <div className="motor-drawing-container" style={{ marginBottom: '3rem' }}>
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {hoveredPart ? hoveredPart.toUpperCase() : 'HOVER COMPONENT'}
        </div>
      </div>

      <div className="drawing-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.5)',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '600px', cursor: 'crosshair' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#121212" />
            </radialGradient>
            <linearGradient id="windingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cd7f32" />
              <stop offset="100%" stopColor="#8b4513" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ── EXTERNAL HOUSING ── */}
          <g onMouseEnter={() => handleHover('External Housing')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            {[...Array(32)].map((_, i) => {
              const angle = (i * 360) / 32;
              return (
                <rect key={`f-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 8} width="3" height="10" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR STRUCTURE ── */}
          <g onMouseEnter={() => handleHover('Stator Assembly (Yoke & Teeth)')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#555" strokeWidth="1" />
            
            {/* Stator Teeth & Slots */}
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
                  
                  {/* Winding Slots (B/W teeth) */}
                  <g transform={`rotate(${180/slots}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - slotWidth/2.4} y={centerY - statorRadius + yokeThickness + 2} width={slotWidth/1.2} height={slotDepth - yokeThickness - 4} fill="#0a0a0a" stroke="#222" />
                    {/* Copper Bundles */}
                    {[...Array(8)].map((_, j) => (
                      <circle 
                        key={`w-${j}`} 
                        cx={centerX - slotWidth/4 + (j % 2) * (slotWidth/2)} 
                        cy={centerY - statorRadius + yokeThickness + 6 + Math.floor(j/2) * 5} 
                        r="1.8" fill="url(#windingGrad)" 
                      />
                    ))}
                  </g>
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 1} fill="transparent" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="2 2" pointerEvents="all" onMouseEnter={() => handleHover('Magnetic Air Gap')} onMouseLeave={() => handleHover(null)} />

          {/* ── ROTOR ASSEMBLY ── */}
          <g onMouseEnter={() => handleHover(`${motorType.split(' ')[0]} Rotor Core`)} onMouseLeave={() => handleHover(null)}>
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
          <g className="blue-blueprint-labels" pointerEvents="none">
            {/* Housing */}
            <path d={`M ${centerX - housingRadius} ${centerY - 20} L ${centerX - housingRadius - 60} ${centerY - 40}`} stroke="#666" fill="none" />
            <text x={centerX - housingRadius - 65} y={centerY - 42} fill="#aaa" fontSize="10" textAnchor="end" fontWeight="bold">HOUSING / FINS</text>

            {/* Stator Windings */}
            <path d={`M ${centerX + statorRadius - 15} ${centerY - statorRadius + 20} L ${centerX + statorRadius + 50} ${centerY - statorRadius - 20}`} stroke="#cd7f32" fill="none" />
            <text x={centerX + statorRadius + 55} y={centerY - statorRadius - 22} fill="#cd7f32" fontSize="10" fontWeight="bold">STATOR WINDINGS (SLOTS)</text>

            {/* Stator Iron */}
            <path d={`M ${centerX + statorRadius - 5} ${centerY + 20} L ${centerX + statorRadius + 60} ${centerY + 40}`} stroke="#888" fill="none" />
            <text x={centerX + statorRadius + 65} y={centerY + 42} fill="#aaa" fontSize="10" fontWeight="bold">STATOR IRON (YOKE)</text>

            {/* Air Gap */}
            <path d={`M ${centerX - rotorRadius - 2} ${centerY + 20} L ${centerX - size/2 + 40} ${centerY + 80}`} stroke="#00d2ff" fill="none" />
            <text x={centerX - size/2 + 35} y={centerY + 82} fill="#00d2ff" fontSize="10" textAnchor="end" fontWeight="bold">AIR GAP ({airGap}mm)</text>

            {/* Rotor Poles */}
            <path d={`M ${centerX} ${centerY + rotorRadius - 10} L ${centerX + 40} ${centerY + size/2 - 40}`} stroke="#ff2d55" fill="none" />
            <text x={centerX + 45} y={centerY + size/2 - 38} fill="#ff2d55" fontSize="10" fontWeight="bold">MAGNETIC POLES</text>

            {/* Shaft */}
            <path d={`M ${centerX} ${centerY} L ${centerX - 50} ${centerY + size/2 - 60}`} stroke="#888" fill="none" />
            <text x={centerX - 55} y={centerY + size/2 - 58} fill="#888" fontSize="10" textAnchor="end" fontWeight="bold">MAIN SHAFT</text>
            
            {/* Main Dimension */}
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 40} y2={centerY} stroke="#00d2ff" strokeWidth="1" strokeDasharray="2 2" />
            <text x={centerX + statorRadius + 45} y={centerY + 4} fill="#00d2ff" fontSize="11" fontWeight="900">Ø {statorD}mm</text>
          </g>
        </svg>

        {/* ── EXTENDED LEGEND ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#333', border: '2px solid #555', marginTop: '2px' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>1. External Housing</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Protective frame with optimized cooling fins.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '16px', height: '16px', background: 'url(#windingGrad)', backgroundColor: '#cd7f32', border: '1px solid #8b4513', marginTop: '2px' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>2. Stator Windings</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{slots} slots filled with high-purity copper coils.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px dashed #00d2ff', borderRadius: '50%', marginTop: '2px' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>3. Magnetic Air Gap</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High-precision {airGap}mm clearance for flux transfer.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#ff2d55', border: '1px solid #fff', marginTop: '2px' }}></div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>4. Magnetic Poles</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{poles} poles configured for {motorType.split(' ')[0]}.</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdf-export-mode .motor-drawing-container {
          page-break-before: always !important;
          background: #fff !important;
          color: #000 !important;
          padding: 20px !important;
        }
        .pdf-export-mode .drawing-layout {
          background: #fff !important;
          border: 2px solid #000 !important;
          box-shadow: none !important;
        }
        .pdf-export-mode .motor-svg {
          filter: grayscale(1) brightness(0.8) !important;
        }
        .pdf-export-mode .blue-blueprint-labels text {
          fill: #000 !important;
          font-weight: 900 !important;
        }
        .pdf-export-mode .blue-blueprint-labels path {
          stroke: #000 !important;
          stroke-width: 2px !important;
        }
        .pdf-export-mode .blueprint-legend strong {
          color: #000 !important;
        }
        .pdf-export-mode .blueprint-legend span {
          color: #333 !important;
        }
        .pdf-export-mode .no-pdf {
          display: none !important;
        }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
