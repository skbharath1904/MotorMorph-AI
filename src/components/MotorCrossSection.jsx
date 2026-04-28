import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // ULTRA-WIDE VIEWBOX to ensure labels have massive horizontal clearance
  const vbWidth = 1000;
  const vbHeight = 600;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  // Scale motor to be centered and have plenty of room for side labels
  const scale = 160 / Math.max(statorD, 1);
  
  const housingRadius = (statorD / 2 * 1.15) * scale;
  const statorRadius = (statorD / 2) * scale;
  const rotorRadius = ((statorD / 2) - airGap) * scale;
  const shaftRadius = statorRadius * 0.22;
  
  const slotDepth = statorRadius * 0.22;
  const yokeThickness = statorRadius * 0.12;
  const toothWidth = (2 * Math.PI * (statorRadius - slotDepth)) / (slots * 3.5);
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
            Labeled Cross-Section (Hover to Identify)
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
        overflow: 'visible'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible', cursor: 'crosshair' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#333" />
              <stop offset="100%" stopColor="#121212" />
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
          <g onMouseEnter={() => handleHover('Stator Yoke & Teeth')} onMouseLeave={() => handleHover(null)}>
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
                    {[...Array(6)].map((_, j) => (
                      <circle key={`w-${j}`} cx={centerX - slotWidth/5 + (j % 2) * (slotWidth/2.5)} cy={centerY - statorRadius + yokeThickness + 6 + Math.floor(j/2) * 6} r="1.6" fill="url(#windingGrad)" />
                    ))}
                  </g>
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 3" pointerEvents="all" onMouseEnter={() => handleHover('Magnetic Air Gap')} onMouseLeave={() => handleHover(null)} />

          {/* ── ROTOR ASSEMBLY ── */}
          <g onMouseEnter={() => handleHover('Magnetic Rotor')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#181818" stroke="#444" strokeWidth="1" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 2.2);
              return (
                <rect key={`p-${i}`} x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius * 0.15} fill={i % 2 === 0 ? "#ff2d55" : "#00d2ff"} stroke="rgba(0,0,0,0.3)" transform={`rotate(${angle}, ${centerX}, ${centerY})`} rx="1" />
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g onMouseEnter={() => handleHover('Main Drive Shaft')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="1.5" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#333" stroke="#555" />
          </g>

          {/* ── LEADER LINES & LABELS (Reverted to side style with better clearance) ── */}
          <g className="blueprint-labels" pointerEvents="none" fontSize="11" fontWeight="bold">
            {/* HOUSING - LEFT */}
            <line x1={centerX - housingRadius} y1={centerY - 20} x2={centerX - housingRadius - 60} y2={centerY - 60} stroke="#666" strokeWidth="1" />
            <text x={centerX - housingRadius - 65} y={centerY - 65} fill="#aaa" textAnchor="end">HOUSING & FINS</text>

            {/* WINDINGS - RIGHT */}
            <line x1={centerX + statorRadius - 15} y1={centerY - statorRadius + 20} x2={centerX + statorRadius + 80} y2={centerY - statorRadius - 20} stroke="#cd7f32" strokeWidth="1" />
            <text x={centerX + statorRadius + 85} y={centerY - statorRadius - 25} fill="#cd7f32">STATOR WINDINGS (SLOTS)</text>

            {/* STATOR IRON - RIGHT */}
            <line x1={centerX + statorRadius} y1={centerY + 20} x2={centerX + statorRadius + 80} y2={centerY + 60} stroke="#888" strokeWidth="1" />
            <text x={centerX + statorRadius + 85} y={centerY + 65} fill="#aaa">STATOR IRON (YOKE)</text>

            {/* AIR GAP - LEFT */}
            <line x1={centerX - rotorRadius - 2} y1={centerY + 10} x2={centerX - housingRadius - 100} y2={centerY + 40} stroke="#00d2ff" strokeWidth="1" />
            <text x={centerX - housingRadius - 105} y={centerY + 45} fill="#00d2ff" textAnchor="end">AIR GAP ({airGap}mm)</text>

            {/* ROTOR - LEFT */}
            <line x1={centerX - rotorRadius + 15} y1={centerY + rotorRadius - 15} x2={centerX - housingRadius - 80} y2={centerY + 180} stroke="#ff2d55" strokeWidth="1" />
            <text x={centerX - housingRadius - 85} y={centerY + 185} fill="#ff2d55" textAnchor="end">MAGNETIC POLES</text>

            {/* SHAFT - RIGHT */}
            <line x1={centerX + shaftRadius - 5} y1={centerY + 5} x2={centerX + 60} y2={centerY + 220} stroke="#fff" strokeWidth="1" />
            <text x={centerX + 65} y={centerY + 225} fill="#fff">DRIVE SHAFT</text>
            
            {/* Dimension */}
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 60} y2={centerY} stroke="#00d2ff" strokeWidth="1" strokeDasharray="2 2" />
            <text x={centerX + statorRadius + 65} y={centerY + 4} fill="#00d2ff" fontSize="13" fontWeight="900">Ø {statorD}mm</text>
          </g>
        </svg>

        {/* ── KEY ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#cd7f32', borderRadius: '2px' }}></div>
            <span><strong>Copper Windings:</strong> High-efficiency {slots}-slot array</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#ff2d55', borderRadius: '2px' }}></div>
            <span><strong>Poles:</strong> {poles}-Pole permanent magnet system</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.85rem' }}>
            <div style={{ width: '12px', height: '12px', border: '1px solid #00d2ff', borderRadius: '50%' }}></div>
            <span><strong>Air Gap:</strong> Precise electromagnetic clearance</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdf-export-mode .motor-drawing-container {
          page-break-before: always !important;
          background: #fff !important;
          color: #000 !important;
          padding: 40px !important;
        }
        .pdf-export-mode .drawing-layout {
          background: #fff !important;
          border: 1px solid #000 !important;
          box-shadow: none !important;
        }
        .pdf-export-mode .motor-svg { filter: grayscale(1) !important; }
        .pdf-export-mode .blueprint-labels text { fill: #000 !important; font-weight: 900 !important; font-size: 14px !important; }
        .pdf-export-mode .blueprint-labels line { stroke: #000 !important; stroke-width: 1px !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
