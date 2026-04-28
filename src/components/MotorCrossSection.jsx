import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  const vbWidth = 1000;
  const vbHeight = 700;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 180 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.18) * currentScale;
  const statorRadius = (statorD / 2) * currentScale;
  const rotorRadius = ((statorD / 2) - airGap) * currentScale;
  const shaftRadius = statorRadius * 0.25;
  
  const yokeThickness = statorRadius * 0.12;
  const slotDepth = statorRadius * 0.28;
  const toothWidthFactor = 0.4; // Ratio of tooth width to total slot+tooth space

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const colors = {
    housing: '#555555',
    windingsA: '#ff9f43', // Phase A
    windingsB: '#a29bfe', // Phase B
    windingsC: '#ffffff', // Phase C
    yoke: '#999999',
    airgap: '#00d2ff',
    poleN: '#ff2d55',
    poleS: '#00d2ff',
    shaft: '#ffffff'
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '3rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.8rem', margin: 0 }}>
            Engineering Assembly Blueprint
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            High-Fidelity Cross-Section (Phased Windings & Poles)
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
        background: 'rgba(0,0,0,0.7)',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="statorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#111" />
            </radialGradient>
          </defs>

          {/* ── EXTERNAL HOUSING ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#111" stroke={colors.housing} strokeWidth="2" />
            {[...Array(48)].map((_, i) => {
              const angle = (i * 360) / 48;
              return (
                <rect key={`f-${i}`} x={centerX - 1} y={centerY - housingRadius - 10} width="2" height="12" fill={colors.housing} transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR STRUCTURE ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={statorRadius} fill="url(#statorGrad)" stroke="#444" strokeWidth="1.5" />
            
            {/* Redrawn Trapezoidal Slots & Windings */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const slotAngle = 360 / slots;
              const halfSlotWidth = (Math.PI * (statorRadius - slotDepth)) / slots * (1 - toothWidthFactor);
              const halfYokeWidth = (Math.PI * (statorRadius - yokeThickness)) / slots * (1 - toothWidthFactor);
              
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;

              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  {/* Larger Slot Opening / Phase Label Box */}
                  <rect 
                    x={centerX - 10} y={centerY - statorRadius - 28} 
                    width="20" height="20" 
                    rx="3" fill={phaseColor} stroke="#000" strokeWidth="1"
                  />
                  <text 
                    x={centerX} y={centerY - statorRadius - 13.5} 
                    fill="#000" fontSize="14" textAnchor="middle" fontWeight="900"
                  >
                    {phase}
                  </text>
                  
                  {/* Trapezoidal Slot */}
                  <path 
                    d={`M ${centerX - halfYokeWidth} ${centerY - statorRadius + yokeThickness} 
                       L ${centerX + halfYokeWidth} ${centerY - statorRadius + yokeThickness}
                       L ${centerX + halfSlotWidth} ${centerY - statorRadius + slotDepth}
                       L ${centerX - halfSlotWidth} ${centerY - statorRadius + slotDepth} Z`}
                    fill="#050505" stroke="#333" strokeWidth="1"
                  />
                  
                  {/* Windings (split like reference) */}
                  <path 
                    d={`M ${centerX - halfYokeWidth + 2} ${centerY - statorRadius + yokeThickness + 2} 
                       L ${centerX} ${centerY - statorRadius + yokeThickness + 2}
                       L ${centerX} ${centerY - statorRadius + slotDepth - 2}
                       L ${centerX - halfSlotWidth + 2} ${centerY - statorRadius + slotDepth - 2} Z`}
                    fill={phaseColor} fillOpacity="0.8"
                  />
                  <path 
                    d={`M ${centerX} ${centerY - statorRadius + yokeThickness + 2} 
                       L ${centerX + halfYokeWidth - 2} ${centerY - statorRadius + yokeThickness + 2}
                       L ${centerX + halfSlotWidth - 2} ${centerY - statorRadius + slotDepth - 2}
                       L ${centerX} ${centerY - statorRadius + slotDepth - 2} Z`}
                    fill={phaseColor} fillOpacity="0.4"
                  />
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke={colors.airgap} strokeWidth="1" strokeDasharray="4 2" />

          {/* ── ROTOR ASSEMBLY ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#181818" stroke="#555" strokeWidth="1.5" />
            {/* Magnetic Poles with N/S Labels */}
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 1.5);
              const isNorth = i % 2 === 0;
              return (
                <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius * 0.18} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="0.5" rx="2" />
                  <text x={centerX} y={centerY - rotorRadius + rotorRadius * 0.13} fill="#fff" fontSize="12" textAnchor="middle" fontWeight="900" pointerEvents="none">
                    {isNorth ? 'N' : 'S'}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke="#666" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#333" stroke="#444" />
          </g>

          {/* ── EXTENDED LEADER LINES & LABELS ── */}
          <g className="blueprint-labels" fontSize="16" fontWeight="900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* STATOR WINDINGS - TOP RIGHT */}
            <line x1={centerX + statorRadius - 10} y1={centerY - statorRadius + 30} x2={centerX + statorRadius + 180} y2={centerY - statorRadius - 60} stroke={colors.windingsA} strokeWidth="2" />
            <text x={centerX + statorRadius + 185} y={centerY - statorRadius - 65} fill={colors.windingsA}>STATOR WINDINGS (SLOTS)</text>

            {/* HOUSING - LEFT TOP */}
            <line x1={centerX - housingRadius} y1={centerY - 30} x2={centerX - housingRadius - 180} y2={centerY - 100} stroke={colors.housing} strokeWidth="2" />
            <text x={centerX - housingRadius - 185} y={centerY - 105} fill="#aaa" textAnchor="end">HOUSING & FINS</text>

            {/* STATOR IRON - RIGHT MIDDLE */}
            <line x1={centerX + statorRadius} y1={centerY + 40} x2={centerX + statorRadius + 160} y2={centerY + 100} stroke={colors.yoke} strokeWidth="2" />
            <text x={centerX + statorRadius + 165} y={centerY + 105} fill="#aaa">STATOR IRON (YOKE)</text>

            {/* AIR GAP - LEFT MIDDLE */}
            <line x1={centerX - rotorRadius - 2} y1={centerY + 15} x2={centerX - housingRadius - 200} y2={centerY + 50} stroke={colors.airgap} strokeWidth="2" />
            <text x={centerX - housingRadius - 205} y={centerY + 55} fill={colors.airgap} textAnchor="end">AIR GAP ({airGap}mm)</text>

            {/* MAGNETIC POLES - LEFT BOTTOM */}
            <line x1={centerX - rotorRadius + 20} y1={centerY + rotorRadius - 25} x2={centerX - housingRadius - 180} y2={centerY + 240} stroke={colors.poleN} strokeWidth="2" />
            <text x={centerX - housingRadius - 185} y={centerY + 245} fill={colors.poleN} textAnchor="end">MAGNETIC POLES (N & S)</text>

            {/* SHAFT - BOTTOM RIGHT */}
            <line x1={centerX} y1={centerY + shaftRadius} x2={centerX + 120} y2={centerY + 280} stroke={colors.shaft} strokeWidth="2" />
            <text x={centerX + 125} y={centerY + 285} fill={colors.shaft}>MAIN DRIVE SHAFT</text>
            
            {/* Dimension */}
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 80} y2={centerY} stroke="var(--accent-blue)" strokeWidth="2.5" strokeDasharray="6 3" />
            <text x={centerX + statorRadius + 85} y={centerY + 6} fill="var(--accent-blue)" fontSize="20" fontWeight="900">Ø {statorD}mm</text>
          </g>
        </svg>

        {/* Legend */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ width: '10px', height: '16px', background: colors.windingsA }}></div>
              <div style={{ width: '10px', height: '16px', background: colors.windingsB }}></div>
              <div style={{ width: '10px', height: '16px', background: colors.windingsC }}></div>
            </div>
            <span><strong>3-Phase Windings:</strong> {slots} Trapezoidal Slots</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '15px', height: '16px', background: colors.poleN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: '#fff' }}>N</div>
              <div style={{ width: '15px', height: '16px', background: colors.poleS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: '#fff' }}>S</div>
            </div>
            <span><strong>Poles:</strong> {poles} Alternating Magnets</span>
          </div>
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
          border: 1px solid #000 !important;
          box-shadow: none !important;
        }
        .pdf-export-mode .motor-svg { filter: grayscale(0) !important; }
        .pdf-export-mode .blueprint-labels text { font-size: 20px !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
