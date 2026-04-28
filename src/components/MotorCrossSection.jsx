import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  const vbWidth = 1100;
  const vbHeight = 800;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 180 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  // Layer Radii
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreOuter = (statorD / 2 * 1.25) * currentScale;
  const statorCoreInner = (statorD / 2) * currentScale;
  const rotorOuter = ((statorD / 2) - airGap) * currentScale;
  const rotorCoreRadius = rotorOuter * 0.7;
  const shaftRadius = rotorCoreRadius * 0.4;
  
  const slotDepth = (statorCoreInner - rotorOuter) * 0.8; // Slot is mainly in the air gap region for this visual

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const colors = {
    housing: '#444444',
    statorCore: '#222222',
    coil: '#ff9f43',
    rotorCore: '#333333',
    magnetN: '#ff2d55',
    magnetS: '#00d2ff',
    airgap: '#00d2ff',
    shaft: '#eeeeee'
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '3rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.8rem', margin: 0 }}>
            Engineering Assembly Blueprint
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Professional Cross-Sectional Drawing
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleZoom(-0.25)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>−</button>
          <div style={{ alignSelf: 'center', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 'bold', width: '45px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.25)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>+</button>
        </div>
      </div>

      <div className="drawing-layout" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.8)',
        padding: '3rem',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        minHeight: '700px'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible' }}>
          {/* ── EXTERNAL HOUSING & FINS ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0a0a0a" stroke={colors.housing} strokeWidth="8" />
            {[...Array(64)].map((_, i) => {
              const angle = (i * 360) / 64;
              return (
                <rect key={`fin-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 15} width="3" height="18" fill={colors.housing} transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR CORE (Thick ring) ── */}
          <g>
            <path 
              d={`M ${centerX} ${centerY - statorCoreOuter} A ${statorCoreOuter} ${statorCoreOuter} 0 1 1 ${centerX} ${centerY + statorCoreOuter} A ${statorCoreOuter} ${statorCoreOuter} 0 1 1 ${centerX} ${centerY - statorCoreOuter} Z
                 M ${centerX} ${centerY - statorCoreInner} A ${statorCoreInner} ${statorCoreInner} 0 1 0 ${centerX} ${centerY + statorCoreInner} A ${statorCoreInner} ${statorCoreInner} 0 1 0 ${centerX} ${centerY - statorCoreInner} Z`}
              fill="#1a1a1a" stroke="#444" strokeWidth="2" fillRule="evenodd"
            />
            
            {/* Stator Windings (Coils) - Based on reference */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.coil : i % 3 === 1 ? '#a29bfe' : '#ffffff';
              const boxSize = statorRadius * 0.15;

              return (
                <g key={`coil-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  {/* Phase Box */}
                  <rect x={centerX - boxSize/2} y={centerY - statorCoreInner - 20} width={boxSize} height={boxSize} rx="4" fill={phaseColor} stroke="#000" strokeWidth="1" />
                  <text x={centerX} y={centerY - statorCoreInner - 20 + boxSize/1.4} fill="#000" fontSize={boxSize * 0.7} textAnchor="middle" fontWeight="900">{phase}</text>
                  
                  {/* Trapezoidal Coil (Pointing inwards into slots) */}
                  <path 
                    d={`M ${centerX - 12} ${centerY - statorCoreInner} 
                       L ${centerX + 12} ${centerY - statorCoreInner}
                       L ${centerX + 20} ${centerY - statorCoreInner + 30}
                       L ${centerX - 20} ${centerY - statorCoreInner + 30} Z`}
                    fill={phaseColor} fillOpacity="0.8" stroke="#000" strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={(statorCoreInner + rotorOuter)/2} fill="transparent" stroke={colors.airgap} strokeWidth="1" strokeDasharray="5 5" />

          {/* ── ROTOR CORE & MAGNETS ── */}
          <g>
            {/* Rotor Core Circle */}
            <circle cx={centerX} cy={centerY} r={rotorCoreRadius} fill={colors.rotorCore} stroke="#555" strokeWidth="2" />
            
            {/* Magnets mounted on Rotor Core */}
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorOuter) / (poles * 1.2);
              const isNorth = i % 2 === 0;
              return (
                <g key={`magnet-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2.5} y={centerY - rotorOuter} width={pW/1.2} height={rotorOuter - rotorCoreRadius} fill={isNorth ? colors.magnetN : colors.magnetS} stroke="#000" strokeWidth="1" rx="2" />
                  <text x={centerX} y={centerY - rotorOuter + 15} fill="#fff" fontSize="12" textAnchor="middle" fontWeight="900">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#111" stroke={colors.shaft} strokeWidth="3" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.3} fill="#222" stroke="#444" />
          </g>

          {/* ── PROFESSIONAL LABELS ── */}
          <g fontSize="18" fontWeight="900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {/* Stator Core */}
            <line x1={centerX + statorCoreOuter - 10} y1={centerY - 50} x2={centerX + statorCoreOuter + 100} y2={centerY - 100} stroke="#888" strokeWidth="2.5" />
            <text x={centerX + statorCoreOuter + 105} y={centerY - 105} fill="#aaa">STATOR CORE</text>

            {/* Coil */}
            <line x1={centerX + statorCoreInner - 20} y1={centerY + 60} x2={centerX + statorCoreInner + 120} y2={centerY + 140} stroke={colors.coil} strokeWidth="2.5" />
            <text x={centerX + statorCoreInner + 125} y={centerY + 145} fill={colors.coil}>COIL (WINDINGS)</text>

            {/* Magnet */}
            <line x1={centerX - rotorOuter} y1={centerY - 30} x2={centerX - statorCoreOuter - 150} y2={centerY - 80} stroke={colors.magnetN} strokeWidth="2.5" />
            <text x={centerX - statorCoreOuter - 155} y={centerY - 85} fill={colors.magnetN} textAnchor="end">MAGNET (N/S POLES)</text>

            {/* Rotor Core */}
            <line x1={centerX - rotorCoreRadius} y1={centerY + 50} x2={centerX - statorCoreOuter - 120} y2={centerY + 160} stroke="#888" strokeWidth="2.5" />
            <text x={centerX - statorCoreOuter - 125} y={centerY + 165} fill="#aaa" textAnchor="end">ROTOR CORE</text>

            {/* Shaft */}
            <line x1={centerX} y1={centerY + shaftRadius} x2={centerX + 60} y2={centerY + 280} stroke={colors.shaft} strokeWidth="2.5" />
            <text x={centerX + 65} y={centerY + 285} fill="#fff">SHAFT</text>
            
            {/* Housing */}
            <line x1={centerX - housingRadius} y1={centerY - 80} x2={centerX - housingRadius - 80} y2={centerY - 180} stroke={colors.housing} strokeWidth="2.5" />
            <text x={centerX - housingRadius - 85} y={centerY - 185} fill="#aaa" textAnchor="end">HOUSING & FINS</text>
          </g>
        </svg>

        {/* ── DETAILED PARTS LEGEND ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <LegendItem color={colors.housing} title="1. Housing & Fins" desc="Thick external protective casing" />
          <LegendItem color="#1a1a1a" title="2. Stator Core" desc="Thick laminated iron ring" />
          <LegendItem color={colors.coil} title="3. Coil (Windings)" desc={`${slots} phased electromagnetic coils`} />
          <LegendItem color={colors.rotorCore} title="4. Rotor Core" desc="Central rotating magnetic substrate" />
          <LegendItem color={colors.magnetN} title="5. Magnet" desc={`${poles} high-strength N/S poles`} />
          <LegendItem color={colors.shaft} title="6. Drive Shaft" desc="Main mechanical torque output" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .pdf-export-mode .motor-drawing-container {
          page-break-before: always !important;
          background: #fff !important;
          color: #000 !important;
          padding: 50px !important;
        }
        .pdf-export-mode .drawing-layout {
          background: #fff !important;
          border: 1.5px solid #000 !important;
        }
        .pdf-export-mode .motor-svg { filter: grayscale(0) !important; }
        .pdf-export-mode .blueprint-legend strong { color: #000 !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

const LegendItem = ({ color, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ width: '20px', height: '20px', background: color, border: '1px solid #666', borderRadius: '4px' }}></div>
    <div>
      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>{title}</strong>
      <span style={{ fontSize: '0.7rem', color: '#aaa' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
