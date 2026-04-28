import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Wide Viewbox to accommodate labels
  const vbWidth = 1100;
  const vbHeight = 700;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  // Base scale and dynamic zoom
  const baseScale = 180 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.22) * currentScale;
  const statorRadius = (statorD / 2) * currentScale;
  const rotorRadius = ((statorD / 2) - airGap) * currentScale;
  const shaftRadius = statorRadius * 0.25;
  
  const yokeThickness = statorRadius * 0.15;
  const slotDepth = statorRadius * 0.32;
  const toothWidthFactor = 0.45;

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
            Zoomable High-Resolution Cross-Section
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
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
        minHeight: '650px'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible' }}>
          <defs>
            <pattern id="housingPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#333" strokeWidth="1" />
            </pattern>
          </defs>

          {/* ── EXTERNAL HOUSING ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0d0d0d" stroke={colors.housing} strokeWidth="6" />
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="url(#housingPattern)" opacity="0.6" />
            {[...Array(60)].map((_, i) => {
              const angle = (i * 360) / 60;
              return (
                <rect key={`f-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 12} width="3" height="15" fill={colors.housing} transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR YOKE (IRON CORE) ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={statorRadius} fill={colors.statorIron} stroke="#666" strokeWidth="2" />
            
            {/* Phased Slots & Boxes */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const halfSlotWidth = (Math.PI * (statorRadius - slotDepth)) / slots * (1 - toothWidthFactor);
              const halfYokeWidth = (Math.PI * (statorRadius - yokeThickness)) / slots * (1 - toothWidthFactor);
              
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;

              // Box size relative to motor scale to prevent "becoming small"
              const boxSize = Math.max(22, statorRadius * 0.12);

              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  {/* PHASE BOXES - Sized proportionally to motor scale */}
                  <rect 
                    x={centerX - boxSize/2} y={centerY - statorRadius - boxSize * 1.2} 
                    width={boxSize} height={boxSize} 
                    rx="4" fill={phaseColor} stroke="#000" strokeWidth="1.5"
                  />
                  <text 
                    x={centerX} y={centerY - statorRadius - boxSize * 1.2 + boxSize/1.4} 
                    fill="#000" fontSize={boxSize * 0.7} textAnchor="middle" fontWeight="900"
                  >
                    {phase}
                  </text>
                  
                  {/* Slot Path */}
                  <path 
                    d={`M ${centerX - halfYokeWidth} ${centerY - statorRadius + yokeThickness} 
                       L ${centerX + halfYokeWidth} ${centerY - statorRadius + yokeThickness}
                       L ${centerX + halfSlotWidth} ${centerY - statorRadius + slotDepth}
                       L ${centerX - halfSlotWidth} ${centerY - statorRadius + slotDepth} Z`}
                    fill="#050505" stroke="#444" strokeWidth="1.5"
                  />
                  
                  {/* Windings */}
                  <rect x={centerX - halfYokeWidth + 2} y={centerY - statorRadius + yokeThickness + 2} width={halfYokeWidth} height={slotDepth - yokeThickness - 4} fill={phaseColor} fillOpacity="0.8" />
                  <rect x={centerX} y={centerY - statorRadius + yokeThickness + 2} width={halfYokeWidth} height={slotDepth - yokeThickness - 4} fill={phaseColor} fillOpacity="0.4" />
                </g>
              );
            })}
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke={colors.airgap} strokeWidth="1.5" strokeDasharray="6 3" />

          {/* ── ROTOR ASSEMBLY ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#111" stroke="#444" strokeWidth="2" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 1.4);
              const isNorth = i % 2 === 0;
              return (
                <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2} y={centerY - rotorRadius + 3} width={pW} height={rotorRadius * 0.22} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="1" rx="3" />
                  <text x={centerX} y={centerY - rotorRadius + rotorRadius * 0.16} fill="#fff" fontSize={rotorRadius * 0.12} textAnchor="middle" fontWeight="900">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#1a1a1a" stroke={colors.shaft} strokeWidth="3" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#2a2a2a" stroke="#444" />
          </g>

          {/* ── PRIMARY SECTION LABELS ── */}
          <g fontSize="22" fontWeight="900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {/* STATOR ASSEMBLY LABEL */}
            <path d={`M ${centerX} ${centerY - housingRadius - 40} L ${centerX + 150} ${centerY - housingRadius - 100}`} stroke="#fff" strokeWidth="3" fill="none" />
            <text x={centerX + 155} y={centerY - housingRadius - 105} fill="#fff">STATOR ASSEMBLY</text>

            {/* ROTOR ASSEMBLY LABEL */}
            <path d={`M ${centerX} ${centerY + rotorRadius - 60} L ${centerX - 150} ${centerY + rotorRadius + 120}`} stroke="#fff" strokeWidth="3" fill="none" />
            <text x={centerX - 155} y={centerY + rotorRadius + 125} fill="#fff" textAnchor="end">ROTOR ASSEMBLY</text>
          </g>

          {/* ── DETAILED LABELS ── */}
          <g className="blueprint-labels" fontSize="16" fontWeight="900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <line x1={centerX + statorRadius} y1={centerY - statorRadius + 50} x2={centerX + statorRadius + 220} y2={centerY - statorRadius - 30} stroke={colors.windingsA} strokeWidth="2.5" />
            <text x={centerX + statorRadius + 225} y={centerY - statorRadius - 35} fill={colors.windingsA}>PHASE WINDINGS (SLOTS)</text>

            <line x1={centerX - housingRadius} y1={centerY - 50} x2={centerX - housingRadius - 200} y2={centerY - 80} stroke={colors.housing} strokeWidth="2.5" />
            <text x={centerX - housingRadius - 205} y={centerY - 85} fill="#aaa" textAnchor="end">HOUSING & FINS</text>

            <line x1={centerX + statorRadius} y1={centerY + 60} x2={centerX + statorRadius + 200} y2={centerY + 140} stroke="#888" strokeWidth="2.5" />
            <text x={centerX + statorRadius + 205} y={centerY + 145} fill="#aaa">STATOR YOKE (IRON)</text>

            <line x1={centerX - rotorRadius} y1={centerY + 30} x2={centerX - housingRadius - 220} y2={centerY + 80} stroke={colors.airgap} strokeWidth="2.5" />
            <text x={centerX - housingRadius - 225} y={centerY + 85} fill={colors.airgap} textAnchor="end">AIR GAP ({airGap}mm)</text>

            <line x1={centerX - rotorRadius + 30} y1={centerY + rotorRadius - 30} x2={centerX - housingRadius - 200} y2={centerY + 280} stroke={colors.poleN} strokeWidth="2.5" />
            <text x={centerX - housingRadius - 205} y={centerY + 285} fill={colors.poleN} textAnchor="end">MAGNETIC POLES (N/S)</text>

            <line x1={centerX} y1={centerY + shaftRadius} x2={centerX + 150} y2={centerY + 320} stroke={colors.shaft} strokeWidth="2.5" />
            <text x={centerX + 155} y={centerY + 325} fill="#fff">DRIVE SHAFT</text>
          </g>
        </svg>

        {/* ── EXPANDED LEGEND WITH SYMBOLS ── */}
        <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '30px', height: '24px', background: colors.housing, border: '1px solid #666', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-6px', left: '14px', width: '2px', height: '6px', background: colors.housing }}></div>
            </div>
            <div><strong style={{ display: 'block', color: '#fff' }}>1. Housing & Fins</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>External frame with cooling ribs</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '30px', height: '24px', background: colors.statorIron, border: '1.5px solid #666' }}></div>
            <div><strong style={{ display: 'block', color: '#fff' }}>2. Stator Yoke</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>Magnetic iron core (laminated)</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '12px', height: '24px', background: colors.windingsA, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>A</div>
              <div style={{ width: '12px', height: '24px', background: colors.windingsB }}></div>
            </div>
            <div><strong style={{ display: 'block', color: '#fff' }}>3. Phase Windings</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>{slots} slots with A/B/C phasing</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '30px', height: '10px', border: '2px dashed #00d2ff' }}></div>
            <div><strong style={{ display: 'block', color: '#fff' }}>4. Air Gap</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>Flux transfer clearance</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '16px', height: '24px', background: colors.poleN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>N</div>
              <div style={{ width: '16px', height: '24px', background: colors.poleS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>S</div>
            </div>
            <div><strong style={{ display: 'block', color: '#fff' }}>5. Magnetic Poles</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>{poles} alternating N/S poles</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: colors.shaft, border: '2px solid #666' }}></div>
            <div><strong style={{ display: 'block', color: '#fff' }}>6. Drive Shaft</strong><span style={{ fontSize: '0.75rem', color: '#aaa' }}>Torque transmission output</span></div>
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
          border: 1.5px solid #000 !important;
        }
        .pdf-export-mode .motor-svg { filter: grayscale(0) !important; }
        .pdf-export-mode .blueprint-labels text { font-size: 24px !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
