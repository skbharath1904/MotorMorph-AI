import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  if (!data || !data.dimensions) return null;

  const { dimensions, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const airGap = parseFloat(dimensions.airGap);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;

  // Viewbox is the "canvas"
  const vbWidth = 1000;
  const vbHeight = 600;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  // Base scale
  const baseScale = 160 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.15) * currentScale;
  const statorRadius = (statorD / 2) * currentScale;
  const rotorRadius = ((statorD / 2) - airGap) * currentScale;
  const shaftRadius = statorRadius * 0.22;
  
  const slotDepth = statorRadius * 0.22;
  const yokeThickness = statorRadius * 0.12;
  const toothWidth = (2 * Math.PI * (statorRadius - slotDepth)) / (slots * 3.5);
  const slotWidth = (2 * Math.PI * (statorRadius - slotDepth/2)) / (slots * 2);

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  // Color Palette for Components & Labels
  const colors = {
    housing: '#666666',
    windings: '#ff9f43',
    yoke: '#999999',
    airgap: '#00d2ff',
    poles: '#ff2d55',
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
            High-Fidelity 2D Cross-Section
          </p>
        </div>
        
        {/* Zoom Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleZoom(-0.25)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', 
              padding: '8px 15px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            −
          </button>
          <div style={{ alignSelf: 'center', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 'bold', width: '45px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => handleZoom(0.25)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', 
              padding: '8px 15px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
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
        overflow: 'hidden',
        minHeight: '500px'
      }}>
        <svg className="motor-svg" width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} style={{ overflow: 'visible' }}>
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
          <g>
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#1a1a1a" stroke={colors.housing} strokeWidth="2" />
            {[...Array(36)].map((_, i) => {
              const angle = (i * 360) / 36;
              return (
                <rect key={`f-${i}`} x={centerX - 1.5} y={centerY - housingRadius - 8} width="3" height="10" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />
              );
            })}
          </g>

          {/* ── STATOR STRUCTURE ── */}
          <g>
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
          </g>

          {/* ── AIR GAP ── */}
          <circle cx={centerX} cy={centerY} r={statorRadius - slotDepth + 0.5} fill="transparent" stroke={colors.airgap} strokeWidth="0.5" strokeDasharray="3 3" />

          {/* ── ROTOR ASSEMBLY ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#181818" stroke="#444" strokeWidth="1" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 2.2);
              return (
                <rect key={`p-${i}`} x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius * 0.15} fill={i % 2 === 0 ? colors.poles : colors.airgap} stroke="rgba(0,0,0,0.3)" transform={`rotate(${angle}, ${centerX}, ${centerY})`} rx="1" />
              );
            })}
          </g>

          {/* ── SHAFT ── */}
          <g>
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#222" stroke={colors.shaft} strokeWidth="1.5" />
            <circle cx={centerX} cy={centerY} r={shaftRadius * 0.4} fill="#333" stroke="#555" />
          </g>

          {/* ── COLOR-MATCHED LABELS ── */}
          <g className="blueprint-labels" fontSize="15" fontWeight="900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* HOUSING - LEFT */}
            <line x1={centerX - housingRadius} y1={centerY - 20} x2={centerX - housingRadius - 60} y2={centerY - 80} stroke={colors.housing} strokeWidth="1.5" />
            <text x={centerX - housingRadius - 65} y={centerY - 85} fill={colors.housing} textAnchor="end">HOUSING & FINS</text>

            {/* WINDINGS - RIGHT */}
            <line x1={centerX + statorRadius - 15} y1={centerY - statorRadius + 20} x2={centerX + statorRadius + 80} y2={centerY - statorRadius - 40} stroke={colors.windings} strokeWidth="1.5" />
            <text x={centerX + statorRadius + 85} y={centerY - statorRadius - 45} fill={colors.windings}>STATOR WINDINGS (SLOTS)</text>

            {/* STATOR IRON - RIGHT */}
            <line x1={centerX + statorRadius} y1={centerY + 20} x2={centerX + statorRadius + 80} y2={centerY + 80} stroke={colors.yoke} strokeWidth="1.5" />
            <text x={centerX + statorRadius + 85} y={centerY + 85} fill={colors.yoke}>STATOR IRON (YOKE)</text>

            {/* AIR GAP - LEFT */}
            <line x1={centerX - rotorRadius - 2} y1={centerY + 10} x2={centerX - housingRadius - 100} y2={centerY + 60} stroke={colors.airgap} strokeWidth="1.5" />
            <text x={centerX - housingRadius - 105} y={centerY + 65} fill={colors.airgap} textAnchor="end">AIR GAP ({airGap}mm)</text>

            {/* ROTOR - LEFT */}
            <line x1={centerX - rotorRadius + 15} y1={centerY + rotorRadius - 15} x2={centerX - housingRadius - 80} y2={centerY + 200} stroke={colors.poles} strokeWidth="1.5" />
            <text x={centerX - housingRadius - 85} y={centerY + 205} fill={colors.poles} textAnchor="end">MAGNETIC POLES</text>

            {/* SHAFT - RIGHT */}
            <line x1={centerX + shaftRadius - 5} y1={centerY + 5} x2={centerX + 60} y2={centerY + 240} stroke={colors.shaft} strokeWidth="1.5" />
            <text x={centerX + 65} y={centerY + 245} fill={colors.shaft}>DRIVE SHAFT</text>
            
            {/* Dimension */}
            <line x1={centerX + statorRadius} y1={centerY} x2={centerX + statorRadius + 60} y2={centerY} stroke="var(--accent-blue)" strokeWidth="2" strokeDasharray="4 2" />
            <text x={centerX + statorRadius + 65} y={centerY + 6} fill="var(--accent-blue)" fontSize="18" fontWeight="900">Ø {statorD}mm</text>
          </g>
        </svg>
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
        .pdf-export-mode .motor-svg { filter: grayscale(0) !important; }
        .pdf-export-mode .blueprint-labels text { font-weight: 900 !important; font-size: 16px !important; }
        .pdf-export-mode .blueprint-labels line { stroke-width: 1.5px !important; }
        .pdf-export-mode .no-pdf { display: none !important; }
      `}} />
    </div>
  );
};

export default MotorCrossSection;
