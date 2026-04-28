import React, { useState } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;
  const airGapVal = parseFloat(dimensions.airGap);

  const vbWidth = 1400; 
  const vbHeight = 1200;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  const visualAirGap = Math.max(30, currentScale * 18); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3)); // CAP AT 3.0 (300%)
  };

  const startDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const colors = {
    housing: '#444444',
    statorIron: '#111',
    windingsA: '#ff9f43',
    windingsB: '#a29bfe',
    windingsC: '#ffffff',
    airgap: '#00ffff',
    poleN: '#ff3b30',
    poleS: '#007aff',
    shaft: '#ffffff',
    dimension: '#00ff00' 
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '4rem', width: '100%' }}>
      {/* HEADER REMOVED AS REQUESTED */}
      
      <div 
        className="drawing-layout" 
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={() => setIsDragging(false)}
        style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',
          background: '#000', padding: '2rem', borderRadius: '32px', border: '2px solid #222',
          overflow: 'hidden', minHeight: '850px', cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', position: 'relative'
        }}
      >
        {/* Floating Mini Controls */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>RESET</button>
          <button onClick={() => handleZoom(-0.25)} style={{ background: '#444', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>−</button>
          <div style={{ color: '#00ffff', fontSize: '0.8rem', alignSelf: 'center', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.25)} style={{ background: '#444', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>+</button>
        </div>

        <svg 
          className="motor-svg" 
          width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} 
          style={{ overflow: 'visible', userSelect: 'none' }}
        >
          {/* Main Content Group */}
          <g transform={`translate(${offset.x / (zoom * 0.4)}, ${offset.y / (zoom * 0.4)})`}>
            
            {/* ── HOUSING ── */}
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0d0d0d" stroke="#333" strokeWidth="12" />
            {[...Array(64)].map((_, i) => {
              const angle = (i * 360) / 64;
              return <rect key={`f-${i}`} x={centerX - 4} y={centerY - housingRadius - 25} width="8" height="30" fill="#2a2a2a" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
            })}

            {/* ── STATOR ── */}
            <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#444" strokeWidth="2" />
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
              const boxSize = Math.max(24, statorCoreRadius * 0.14);
              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.85} width={boxSize} height={boxSize} rx="5" fill={phaseColor} stroke="#000" strokeWidth="3" />
                  <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.85 + boxSize/1.3} fill="#000" fontSize={boxSize * 0.8} textAnchor="middle" fontWeight="900">{phase}</text>
                </g>
              );
            })}

            {/* ── AIR GAP ── */}
            <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth="4" strokeDasharray="15 10" />

            {/* ── ROTOR ── */}
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#000" stroke="#222" strokeWidth="3" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const isNorth = i % 2 === 0;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 1.35);
              return (
                <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius - rotorCoreRadius} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="2.5" rx="5" />
                  <text x={centerX} y={centerY - rotorRadius + 20} fill="#fff" fontSize="16" textAnchor="middle" fontWeight="900">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}

            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#000" stroke="#fff" strokeWidth="8" />

            {/* ── DIAMETER MEASUREMENTS (NORMAL FONT) ── */}
            <g style={{ fontFamily: 'monospace' }}>
              <g transform={`translate(${housingRadius + 250}, 0)`}>
                <line x1={centerX} y1={centerY - housingRadius} x2={centerX} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY - housingRadius} x2={centerX + 30} y2={centerY - housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY + housingRadius} x2={centerX + 30} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX + 40} y={centerY - 35} width="350" height="70" rx="10" fill="#000" stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX + 215} y={centerY - 5} fill={colors.dimension} fontSize="24" fontWeight="bold" textAnchor="middle">Ø {(statorD * 1.35).toFixed(1)}mm</text>
                <text x={centerX + 215} y={centerY + 22} fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">TOTAL OUTER DIAMETER</text>
              </g>

              <g transform={`translate(0, ${statorInnerRadius + 250})`}>
                <line x1={centerX - statorInnerRadius} y1={centerY} x2={centerX + statorInnerRadius} y2={centerY} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - statorInnerRadius} y1={centerY - 30} x2={centerX - statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX + statorInnerRadius} y1={centerY - 30} x2={centerX + statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX - 175} y={centerY + 40} width="350" height="70" rx="10" fill="#000" stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX} y={centerY + 82} fill={colors.dimension} fontSize="24" fontWeight="bold" textAnchor="middle">Ø {statorD}mm</text>
                <text x={centerX} y={centerY + 102} fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">STATOR INNER BORE DIAMETER</text>
              </g>
            </g>

            {/* ── ASSEMBLY LABELS (NORMAL FONT) ── */}
            <g className="labels" fontSize="18" fontWeight="bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 150} y2={centerY - 250} stroke="#fff" strokeWidth="4" />
              <text x={centerX - housingRadius - 155} y={centerY - 255} fill="#fff" textAnchor="end">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius} y1={centerY - statorInnerRadius} x2={centerX + 250} y2={centerY - 450} stroke={colors.windingsA} strokeWidth="4" />
              <text x={centerX + 255} y={centerY - 455} fill={colors.windingsA}>STATOR WINDINGS (ABC)</text>

              <line x1={centerX + rotorRadius + 5} y1={centerY - 50} x2={centerX + 350} y2={centerY - 150} stroke="#00ffff" strokeWidth="4" />
              <text x={centerX + 355} y={centerY - 155} fill="#00ffff">AIR GAP: {airGapVal}mm</text>

              <line x1={centerX - rotorRadius} y1={centerY + 100} x2={centerX - 250} y2={centerY + 400} stroke={colors.poleN} strokeWidth="4" />
              <text x={centerX - 255} y={centerY + 405} fill={colors.poleN} textAnchor="end">ROTOR MAGNET POLES</text>
            </g>
          </g>
        </svg>
      </div>

      {/* ── PARTS LEGEND ── */}
      <div className="blueprint-legend" style={{ width: '100%', marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '20px', border: '1px solid #333' }}>
        <LegendItem color="#333" title="1. External Housing" desc="Frame w/ cooling fins" />
        <LegendItem color="#1a1a1a" title="2. Stator Core" desc="Laminated silicon steel yoke" />
        <LegendItem color={colors.windingsA} title="3. Stator Windings" desc="3-Phase (A/B/C) slot boxes" isPhase />
        <LegendItem color={colors.airgap} title="4. Air Gap" desc={`Flux region: ${airGapVal}mm`} isDashed />
        <LegendItem color={colors.poleN} title="5. Rotor Poles" desc="Permanent magnets (N/S)" isPole />
        <LegendItem color="#fff" title="6. Drive Shaft" desc="Main torque output shaft" isCircle />
      </div>
    </div>
  );
};

const LegendItem = ({ color, title, desc, isPhase, isPole, isCircle, isDashed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {isPhase ? (
      <div style={{ display: 'flex', gap: '3px' }}>
        <div style={{ width: '16px', height: '24px', background: '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', border: '1px solid #000' }}>A</div>
        <div style={{ width: '16px', height: '24px', background: '#a29bfe', border: '1px solid #000' }}></div>
      </div>
    ) : isPole ? (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '18px', height: '24px', background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>N</div>
        <div style={{ width: '18px', height: '24px', background: '#007aff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>S</div>
      </div>
    ) : isCircle ? (
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${color}`, background: '#000' }}></div>
    ) : isDashed ? (
      <div style={{ width: '35px', height: '4px', borderTop: `2px dashed ${color}` }}></div>
    ) : (
      <div style={{ width: '35px', height: '24px', background: color, border: '1px solid #555' }}></div>
    )}
    <div>
      <strong style={{ display: 'block', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{title}</strong>
      <span style={{ fontSize: '0.75rem', color: '#888' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
