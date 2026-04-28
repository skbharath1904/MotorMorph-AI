import React, { useState, useRef } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!data || !data.dimensions) return null;

  const { dimensions } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;
  const airGapVal = parseFloat(dimensions.airGap);

  const vbWidth = 1200;
  const vbHeight = 1100;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  const visualAirGap = Math.max(25, currentScale * 14); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const startDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const colors = {
    housing: '#444444',
    statorIron: '#1a1a1a',
    windingsA: '#ff9f43',
    windingsB: '#a29bfe',
    windingsC: '#ffffff',
    airgap: '#00d2ff',
    poleN: '#ff2d55',
    poleS: '#0b84ff', // Brighter Blue
    shaft: '#eeeeee',
    dimension: '#00ffff' // NEON CYAN for measurements
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '3rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
          <h4 style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', margin: 0, fontWeight: '900' }}>
            Engineering Assembly Blueprint
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: colors.dimension, fontWeight: 'bold' }}>
            BRIGHT ASSEMBLY • DIMENSIONED MODEL
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={resetView} style={{ background: 'var(--accent-blue)', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Reset View</button>
          <button onClick={() => handleZoom(-0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>−</button>
          <div style={{ alignSelf: 'center', color: colors.dimension, fontSize: '0.9rem', fontWeight: '900', width: '50px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>+</button>
        </div>
      </div>

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
          background: '#020202', padding: '2rem', borderRadius: '28px', border: '2px solid #222',
          overflow: 'hidden', minHeight: '900px', cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', position: 'relative'
        }}
      >
        <svg 
          className="motor-svg" 
          width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} 
          style={{ overflow: 'visible', userSelect: 'none' }}
        >
          {/* Main Content Group for Panning */}
          <g transform={`translate(${offset.x / (zoom * 0.5)}, ${offset.y / (zoom * 0.5)})`}>
            
            {/* ── MEASUREMENTS (Inside Diagram) ── */}
            <g stroke={colors.dimension} strokeWidth="1.5" opacity="0.8" style={{ fontFamily: 'monospace' }}>
              {/* Outer Diameter */}
              <line x1={centerX + housingRadius + 120} y1={centerY - housingRadius} x2={centerX + housingRadius + 120} y2={centerY + housingRadius} />
              <line x1={centerX + housingRadius + 110} y1={centerY - housingRadius} x2={centerX + housingRadius + 130} y2={centerY - housingRadius} />
              <line x1={centerX + housingRadius + 110} y1={centerY + housingRadius} x2={centerX + housingRadius + 130} y2={centerY + housingRadius} />
              <text x={centerX + housingRadius + 145} y={centerY} fill={colors.dimension} fontSize="20" fontWeight="900" transform={`rotate(90, ${centerX + housingRadius + 145}, ${centerY})`}>Ø {(statorD * 1.35).toFixed(1)}mm (TOTAL)</text>

              {/* Stator Inner */}
              <line x1={centerX - statorInnerRadius} y1={centerY + statorInnerRadius + 50} x2={centerX + statorInnerRadius} y2={centerY + statorInnerRadius + 50} />
              <line x1={centerX - statorInnerRadius} y1={centerY + statorInnerRadius + 40} x2={centerX - statorInnerRadius} y2={centerY + statorInnerRadius + 60} />
              <line x1={centerX + statorInnerRadius} y1={centerY + statorInnerRadius + 40} x2={centerX + statorInnerRadius} y2={centerY + statorInnerRadius + 60} />
              <text x={centerX} y={centerY + statorInnerRadius + 85} fill={colors.dimension} fontSize="18" fontWeight="bold" textAnchor="middle">Ø {statorD}mm (STATOR ID)</text>
            </g>

            {/* ── HOUSING ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0a0a0a" stroke="#333" strokeWidth="12" />
              {[...Array(64)].map((_, i) => {
                const angle = (i * 360) / 64;
                return <rect key={`f-${i}`} x={centerX - 3} y={centerY - housingRadius - 25} width="6" height="30" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
              })}
            </g>

            {/* ── STATOR CORE ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#444" strokeWidth="2" />
              {[...Array(slots)].map((_, i) => {
                const angle = (i * 360) / slots;
                const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
                const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
                const boxSize = Math.max(22, statorCoreRadius * 0.12);
                return (
                  <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.8} width={boxSize} height={boxSize} rx="4" fill={phaseColor} stroke="#000" strokeWidth="2" />
                    <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.8 + boxSize/1.35} fill="#000" fontSize={boxSize * 0.75} textAnchor="middle" fontWeight="900">{phase}</text>
                    <rect x={centerX - 8} y={centerY - statorInnerRadius} width="16" height="30" fill="#000" opacity="0.4" />
                  </g>
                );
              })}
            </g>

            {/* ── AIR GAP ── */}
            <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth="3" strokeDasharray="10 6" />

            {/* ── ROTOR ASSEMBLY ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#050505" stroke="#333" strokeWidth="2" />
              <circle cx={centerX} cy={centerY} r={rotorCoreRadius} fill="#111" stroke="#444" strokeWidth="1" />
              {[...Array(poles)].map((_, i) => {
                const angle = (i * 360) / poles;
                const isNorth = i % 2 === 0;
                const pW = (2 * Math.PI * rotorRadius) / (poles * 1.3);
                return (
                  <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius - rotorCoreRadius} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="1.5" rx="3" />
                    <text x={centerX} y={centerY - rotorRadius + 18} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="900">{isNorth ? 'N' : 'S'}</text>
                  </g>
                );
              })}
            </g>

            {/* ── SHAFT ── */}
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#000" stroke={colors.shaft} strokeWidth="6" />

            {/* ── BRIGHT LABELS (High Visibility) ── */}
            <g className="labels" fontSize="20" fontWeight="900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 150} y2={centerY - 300} stroke="#fff" strokeWidth="3" />
              <text x={centerX - housingRadius - 155} y={centerY - 305} fill="#fff" textAnchor="end">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius + 5} y1={centerY - statorInnerRadius} x2={centerX + statorInnerRadius + 150} y2={centerY - statorInnerRadius - 150} stroke={colors.windingsA} strokeWidth="3" />
              <text x={centerX + statorInnerRadius + 155} y={centerY - statorInnerRadius - 155} fill={colors.windingsA}>STATOR SLOTS (A/B/C)</text>

              <line x1={centerX + rotorRadius + 5} y1={centerY - 40} x2={centerX + statorCoreRadius + 200} y2={centerY - 80} stroke={colors.dimension} strokeWidth="3" />
              <text x={centerX + statorCoreRadius + 205} y={centerY - 85} fill={colors.dimension}>AIR GAP REGION ({airGapVal}mm)</text>

              <line x1={centerX + statorCoreRadius} y1={centerY + 50} x2={centerX + statorCoreRadius + 150} y2={centerY + 140} stroke="#fff" strokeWidth="3" />
              <text x={centerX + statorCoreRadius + 155} y={centerY + 145} fill="#fff">STATOR IRON YOKE</text>

              <line x1={centerX - rotorRadius} y1={centerY + 50} x2={centerX - rotorRadius - 150} y2={centerY + 350} stroke={colors.poleN} strokeWidth="3" />
              <text x={centerX - rotorRadius - 155} y={centerY + 355} fill={colors.poleN} textAnchor="end">ROTOR MAGNET POLES</text>

              <line x1={centerX} y1={centerY + shaftRadius} x2={centerX + 150} y2={centerY + 450} stroke="#fff" strokeWidth="3" />
              <text x={centerX + 155} y={centerY + 455} fill="#fff">DRIVE SHAFT (Ø { (statorD * 0.1).toFixed(1) }mm)</text>
            </g>
          </g>
        </svg>

        {/* Drag Hint */}
        <div style={{ position: 'absolute', bottom: '25px', left: '25px', color: '#fff', fontSize: '0.8rem', background: 'rgba(0,0,0,0.7)', padding: '10px 18px', borderRadius: '30px', border: '1px solid #333', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '1.2rem' }}>🖐️</span> HOLD & DRAG TO EXPLORE ASSEMBLY
        </div>
      </div>

      <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', borderTop: '1px solid #333', paddingTop: '2.5rem' }}>
        <LegendItem color="#fff" title="1. Housing & Fins" desc="Thick structural frame" />
        <LegendItem color="#666" title="2. Stator Core" desc="Laminated iron back-yoke" />
        <LegendItem color={colors.windingsA} title="3. Phase Windings" desc="A/B/C phased slot boxes" isPhase />
        <LegendItem color={colors.dimension} title="4. Air Gap" desc={`Clearance: ${airGapVal}mm`} isDashed />
        <LegendItem color={colors.poleN} title="5. Rotor Magnets" desc="N/S magnetic pole pairs" isPole />
        <LegendItem color="#fff" title="6. Drive Shaft" desc="High-tensile output shaft" isCircle />
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
        <div style={{ width: '15px', height: '24px', background: '#0b84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>S</div>
      </div>
    ) : isCircle ? (
      <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: `3px solid ${color}`, background: '#000' }}></div>
    ) : isDashed ? (
      <div style={{ width: '30px', height: '4px', borderTop: `2px dashed ${color}` }}></div>
    ) : (
      <div style={{ width: '30px', height: '24px', background: color, border: '1px solid #fff' }}></div>
    )}
    <div>
      <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>{title}</strong>
      <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
