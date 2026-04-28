import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  const vbWidth = 1200;
  const vbHeight = 1000;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  
  // FIXED VISUAL CLEARANCE for Air Gap to prevent merging
  const visualAirGap = Math.max(25, currentScale * 12); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const colors = {
    housing: '#444444',
    statorIron: '#1a1a1a',
    windingsA: '#ff9f43',
    windingsB: '#a29bfe',
    windingsC: '#ffffff',
    airgap: '#00d2ff',
    poleN: '#ff2d55',
    poleS: '#00d2ff',
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
            High-Fidelity Motor Cross-Section
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
        background: 'rgba(0,0,0,0.92)',
        padding: '3rem',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        minHeight: '900px'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible' }}>
          {/* ── DIMENSIONS ── */}
          <g stroke="#555" strokeWidth="1" opacity="0.5">
            <line x1={centerX + housingRadius + 80} y1={centerY - housingRadius} x2={centerX + housingRadius + 80} y2={centerY + housingRadius} />
            <line x1={centerX + housingRadius + 70} y1={centerY - housingRadius} x2={centerX + housingRadius + 90} y2={centerY - housingRadius} />
            <line x1={centerX + housingRadius + 70} y1={centerY + housingRadius} x2={centerX + housingRadius + 90} y2={centerY + housingRadius} />
            <text x={centerX + housingRadius + 105} y={centerY} fill="var(--accent-blue)" fontSize="18" fontWeight="bold" transform={`rotate(90, ${centerX + housingRadius + 105}, ${centerY})`}>Ø {statorD * 1.35}mm</text>
          </g>

          {/* ── HOUSING ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0d0d0d" stroke={colors.housing} strokeWidth="10" />
            {[...Array(64)].map((_, i) => {
              const angle = (i * 360) / 64;
              return <rect key={`f-${i}`} x={centerX - 2.5} y={centerY - housingRadius - 22} width="5" height="26" fill={colors.housing} transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
            })}
          </g>

          {/* ── STATOR ASSEMBLY ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#333" strokeWidth="2" />
            
            {/* Phased Boxes (ABC) - Restored and Improved */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
              const boxSize = Math.max(22, statorCoreRadius * 0.12);

              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  {/* BOXED ABC LABEL */}
                  <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.8} width={boxSize} height={boxSize} rx="4" fill={phaseColor} stroke="#000" strokeWidth="2" />
                  <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.8 + boxSize/1.35} fill="#000" fontSize={boxSize * 0.75} textAnchor="middle" fontWeight="900">{phase}</text>
                  
                  {/* Slot cavity visualization */}
                  <rect x={centerX - 8} y={centerY - statorInnerRadius} width="16" height="30" fill="#000" opacity="0.3" />
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth="2.5" strokeDasharray="8 6" />

          {/* ── ROTOR ASSEMBLY ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#111" stroke="#222" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r={rotorCoreRadius} fill="#222" stroke="#333" strokeWidth="1" />
            
            {/* Magnets */}
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const isNorth = i % 2 === 0;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 1.3);
              return (
                <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius - rotorCoreRadius} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="1" rx="3" />
                  <text x={centerX} y={centerY - rotorRadius + 18} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="900">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#0a0a0a" stroke={colors.shaft} strokeWidth="5" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.35} fill="#1a1a1a" stroke="#444" />
          </g>

          {/* ── BOLD ASSEMBLY LABELS ── */}
          <g className="labels" fontSize="18" fontWeight="900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 150} y2={centerY - 250} stroke={colors.housing} strokeWidth="3" />
            <text x={centerX - housingRadius - 155} y={centerY - 255} fill="#aaa" textAnchor="end">HOUSING & FINS</text>

            <line x1={centerX + statorInnerRadius + 10} y1={centerY - statorInnerRadius} x2={centerX + 250} y2={centerY - 450} stroke={colors.windingsA} strokeWidth="3" />
            <text x={centerX + 255} y={centerY - 455} fill={colors.windingsA}>PHASED STATOR SLOTS (A, B, C)</text>

            <line x1={centerX + rotorRadius + 5} y1={centerY - 40} x2={centerX + statorCoreRadius + 150} y2={centerY - 80} stroke={colors.airgap} strokeWidth="3" />
            <text x={centerX + statorCoreRadius + 155} y={centerY - 85} fill={colors.airgap}>AIR GAP ({dimensions.airGap}mm)</text>

            <line x1={centerX + statorCoreRadius} y1={centerY + 50} x2={centerX + statorCoreRadius + 150} y2={centerY + 140} stroke="#666" strokeWidth="3" />
            <text x={centerX + statorCoreRadius + 155} y={centerY + 145} fill="#888">STATOR IRON CORE</text>

            <line x1={centerX - rotorRadius} y1={centerY + 50} x2={centerX - 250} y2={centerY + 400} stroke={colors.poleN} strokeWidth="3" />
            <text x={centerX - 255} y={centerY + 405} fill={colors.poleN} textAnchor="end">ROTOR MAGNET POLES (N/S)</text>

            <line x1={centerX} y1={centerY + shaftRadius} x2={centerX + 150} y2={centerY + 420} stroke={colors.shaft} strokeWidth="3" />
            <text x={centerX + 155} y={centerY + 425} fill="#fff">MAIN DRIVE SHAFT</text>
          </g>
        </svg>

        {/* ── PARTS LEGEND ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <LegendItem color={colors.housing} title="1. Housing & Fins" desc="External frame" />
          <LegendItem color={colors.statorIron} title="2. Stator Core" desc="Iron back-yoke" />
          <LegendItem color={colors.windingsA} title="3. Phase Windings" desc="A/B/C phased slots" isPhase />
          <LegendItem color={colors.airgap} title="4. Air Gap" desc="Flux transfer space" isDashed />
          <LegendItem color={colors.poleN} title="5. Rotor Magnets" desc="Alternating N/S poles" isPole />
          <LegendItem color={colors.shaft} title="6. Drive Shaft" desc="Torque output" isCircle />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, title, desc, isPhase, isPole, isCircle, isDashed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {isPhase ? (
      <div style={{ display: 'flex', gap: '3px' }}>
        <div style={{ width: '14px', height: '24px', background: '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', border: '1px solid #000' }}>A</div>
        <div style={{ width: '14px', height: '24px', background: '#a29bfe', border: '1px solid #000' }}></div>
      </div>
    ) : isPole ? (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '15px', height: '24px', background: '#ff2d55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>N</div>
        <div style={{ width: '15px', height: '24px', background: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>S</div>
      </div>
    ) : isCircle ? (
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${color}`, background: '#222' }}></div>
    ) : isDashed ? (
      <div style={{ width: '30px', height: '4px', borderTop: `2px dashed ${color}` }}></div>
    ) : (
      <div style={{ width: '30px', height: '24px', background: color, border: '1.5px solid #666' }}></div>
    )}
    <div>
      <strong style={{ display: 'block', color: '#fff', fontSize: '0.9rem' }}>{title}</strong>
      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
