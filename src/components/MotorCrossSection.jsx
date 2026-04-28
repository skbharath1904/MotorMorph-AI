import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [hoveredPart, setHoveredPart] = useState(null);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Viewbox 400x400 - Compact and centered
  const size = 400;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Scale motor to fit well within 400x400
  const scale = 150 / Math.max(statorD, 1);
  
  const housingRadius = (statorD / 2 * 1.15) * scale;
  const statorRadius = (statorD / 2) * scale;
  const rotorRadius = ((statorD / 2) - airGap) * scale;
  const shaftRadius = statorRadius * 0.22;
  
  const slotDepth = statorRadius * 0.22;
  const yokeThickness = statorRadius * 0.12;
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
            Numbered Identification System
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
          minWidth: '200px',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          {hoveredPart ? hoveredPart.toUpperCase() : 'INTERACTIVE VIEW'}
        </div>
      </div>

      <div className="drawing-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.6)',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '500px' }}>
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
          <g onMouseEnter={() => handleHover('1. External Housing')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            {[...Array(32)].map((_, i) => {
              const angle = (i * 360) / 32;
              return (
                <rect key={`f-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 6} width="3" height="8" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
            {/* Number Tag 1 */}
            <circle cx={centerX - housingRadius} cy={centerY - housingRadius} r="10" fill="#222" stroke="#666" />
            <text x={centerX - housingRadius} y={centerY - housingRadius + 3.5} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">1</text>
          </g>

          {/* ── STATOR STRUCTURE ── */}
          <g onMouseEnter={() => handleHover('2. Stator Iron Core')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#555" strokeWidth="1" />
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              return (
                <g key={`s-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <path d={`M ${-toothWidth/2} ${-statorRadius + yokeThickness} L ${toothWidth/2} ${-statorRadius + yokeThickness} L ${toothWidth/1.3} ${-statorRadius + slotDepth} L ${-toothWidth/1.3} ${-statorRadius + slotDepth} Z`} fill="#151515" stroke="#333" strokeWidth="0.5" transform={`translate(${centerX}, ${centerY})`} />
                  <g transform={`rotate(${180/slots}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - slotWidth/2.4} y={centerY - statorRadius + yokeThickness + 2} width={slotWidth/1.2} height={slotDepth - yokeThickness - 4} fill="#0a0a0a" stroke="#222" />
                    {[...Array(6)].map((_, j) => (
                      <circle key={`w-${j}`} cx={centerX - slotWidth/5 + (j % 2) * (slotWidth/2.5)} cy={centerY - statorRadius + yokeThickness + 6 + Math.floor(j/2) * 6} r="1.6" fill="url(#windingGrad)" />
                    ))}
                  </g>
                </g>
              );
            })}
            {/* Number Tag 2 (Stator Iron) */}
            <circle cx={centerX + statorRadius - 20} cy={centerY + 20} r="10" fill="#222" stroke="#888" />
            <text x={centerX + statorRadius - 20} y={centerY + 23.5} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">2</text>
            
            {/* Number Tag 3 (Windings) */}
            <g onMouseEnter={() => handleHover('3. Copper Windings')} onMouseLeave={() => handleHover(null)}>
              <circle cx={centerX + statorRadius - 20} cy={centerY - statorRadius + 30} r="10" fill="#222" stroke="#cd7f32" />
              <text x={centerX + statorRadius - 20} y={centerY - statorRadius + 33.5} fill="#cd7f32" fontSize="10" textAnchor="middle" fontWeight="bold">3</text>
            </g>
          </g>

          {/* ── AIR GAP ── */}
          <g onMouseEnter={() => handleHover('4. Magnetic Air Gap')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 3" />
            {/* Number Tag 4 */}
            <circle cx={centerX - statorRadius + 15} cy={centerY + 15} r="10" fill="#222" stroke="#00d2ff" />
            <text x={centerX - statorRadius + 15} y={centerY + 18.5} fill="#00d2ff" fontSize="10" textAnchor="middle" fontWeight="bold">4</text>
          </g>

          {/* ── ROTOR ASSEMBLY ── */}
          <g onMouseEnter={() => handleHover('5. Magnetic Rotor')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#181818" stroke="#444" strokeWidth="1" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 2.2);
              return (
                <rect key={`p-${i}`} x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius * 0.15} fill={i % 2 === 0 ? "#ff2d55" : "#00d2ff"} stroke="rgba(0,0,0,0.3)" transform={`rotate(${angle}, ${centerX}, ${centerY})`} rx="1" />
              );
            })}
            {/* Number Tag 5 */}
            <circle cx={centerX} cy={centerY + rotorRadius - 25} r="10" fill="#222" stroke="#ff2d55" />
            <text x={centerX} y={centerY + rotorRadius - 21.5} fill="#ff2d55" fontSize="10" textAnchor="middle" fontWeight="bold">5</text>
          </g>

          {/* ── SHAFT ── */}
          <g onMouseEnter={() => handleHover('6. Drive Shaft')} onMouseLeave={() => handleHover(null)}>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="1.5" />
            {/* Number Tag 6 */}
            <circle cx={centerX} cy={centerY} r="10" fill="#222" stroke="#fff" />
            <text x={centerX} y={centerY + 3.5} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">6</text>
          </g>

          {/* Dimension */}
          <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 40} y2={centerY} stroke="#00d2ff" strokeWidth="1" strokeDasharray="2 2" />
          <text x={centerX + statorRadius + 45} y={centerY + 4} fill="#00d2ff" fontSize="11" fontWeight="900">Ø {statorD}mm</text>
        </svg>

        {/* ── UNIFIED LEGEND WITH ICONS ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <LegendItem num="1" title="Housing & Fins" color="#666" desc="External structural frame" />
          <LegendItem num="2" title="Stator Yoke" color="#888" desc="Magnetic back-iron core" />
          <LegendItem num="3" title="Copper Slots" color="#cd7f32" desc={`${slots} winding locations`} />
          <LegendItem num="4" title="Air Gap" color="#00d2ff" desc={`${airGap}mm flux clearance`} />
          <LegendItem num="5" title="Magnetic Poles" color="#ff2d55" desc={`${poles} poles (N/S pairs)`} />
          <LegendItem num="6" title="Drive Shaft" color="#fff" desc="Main mechanical output" />
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
        .pdf-export-mode .blueprint-legend strong { color: #000 !important; }
        .pdf-export-mode .blueprint-legend span { color: #444 !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

const LegendItem = ({ num, title, color, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ 
      width: '24px', 
      height: '24px', 
      borderRadius: '50%', 
      background: '#222', 
      border: `2px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      color: color === '#fff' ? '#fff' : color,
      flexShrink: 0
    }}>
      {num}
    </div>
    <div>
      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>{title}</strong>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
