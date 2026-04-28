import React, { useState, useRef } from 'react';

const MotorCrossSection = ({ data }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!data || !data.dimensions) return null;

  const { dimensions, specifications } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const rotorL = parseFloat(dimensions.rotorLength);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;
  const airGapVal = parseFloat(dimensions.airGap);
  const weight = specifications.weightKg;

  const vbWidth = 1400; // Wider viewbox for dimensions
  const vbHeight = 1200;
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
    poleS: '#0b84ff',
    shaft: '#eeeeee',
    dimension: '#00ffff', // BRIGHT NEON CYAN
    label: '#ffffff'
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '3rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: 'rgba(0,180,255,0.1)', padding: '12px 24px', borderRadius: '15px', borderLeft: '5px solid #00ffff' }}>
          <h4 style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem', margin: 0, fontWeight: '900' }}>
            Engineering Blueprint v2.0
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: colors.dimension, fontWeight: '900' }}>
            PREDICTED MEASUREMENTS • INTERACTIVE ASSEMBLY
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={resetView} style={{ background: '#00ffff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '900' }}>RESET ASSEMBLY</button>
          <button onClick={() => handleZoom(-0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>−</button>
          <div style={{ alignSelf: 'center', color: colors.dimension, fontSize: '1rem', fontWeight: '900', width: '60px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.25)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>+</button>
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
          background: '#010101', padding: '2rem', borderRadius: '32px', border: '2px solid #333',
          overflow: 'hidden', minHeight: '950px', cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', position: 'relative'
        }}
      >
        <svg 
          className="motor-svg" 
          width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} 
          style={{ overflow: 'visible', userSelect: 'none' }}
        >
          {/* Main Content Group */}
          <g transform={`translate(${offset.x / (zoom * 0.4)}, ${offset.y / (zoom * 0.4)})`}>
            
            {/* ── EXTERNAL HOUSING ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={housingRadius} fill="#050505" stroke="#333" strokeWidth="12" />
              {[...Array(64)].map((_, i) => {
                const angle = (i * 360) / 64;
                return <rect key={`f-${i}`} x={centerX - 4} y={centerY - housingRadius - 30} width="8" height="35" fill="#2a2a2a" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
              })}
            </g>

            {/* ── STATOR ASSEMBLY ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#444" strokeWidth="2" />
              {[...Array(slots)].map((_, i) => {
                const angle = (i * 360) / slots;
                const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
                const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
                const boxSize = Math.max(24, statorCoreRadius * 0.12);
                return (
                  <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.8} width={boxSize} height={boxSize} rx="4" fill={phaseColor} stroke="#000" strokeWidth="2.5" />
                    <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.8 + boxSize/1.35} fill="#000" fontSize={boxSize * 0.8} textAnchor="middle" fontWeight="950">{phase}</text>
                    <rect x={centerX - 10} y={centerY - statorInnerRadius} width="20" height="35" fill="#000" opacity="0.5" />
                  </g>
                );
              })}
            </g>

            {/* ── AIR GAP ── */}
            <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth="3.5" strokeDasharray="12 8" />

            {/* ── ROTOR ASSEMBLY ── */}
            <g>
              <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#000" stroke="#222" strokeWidth="2" />
              <circle cx={centerX} cy={centerY} r={rotorCoreRadius} fill="#111" stroke="#333" strokeWidth="1" />
              {[...Array(poles)].map((_, i) => {
                const angle = (i * 360) / poles;
                const isNorth = i % 2 === 0;
                const pW = (2 * Math.PI * rotorRadius) / (poles * 1.3);
                return (
                  <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                    <rect x={centerX - pW/2} y={centerY - rotorRadius + 2} width={pW} height={rotorRadius - rotorCoreRadius} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="2" rx="4" />
                    <text x={centerX} y={centerY - rotorRadius + 22} fill="#fff" fontSize="16" textAnchor="middle" fontWeight="950">{isNorth ? 'N' : 'S'}</text>
                  </g>
                );
              })}
            </g>

            {/* ── SHAFT ── */}
            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#000" stroke="#fff" strokeWidth="6" />

            {/* ── MEASUREMENTS (Positioned to avoid merging) ── */}
            <g style={{ fontFamily: 'monospace' }}>
              {/* Total Diameter (Dimensioned well outside the housing) */}
              <line x1={centerX + housingRadius + 180} y1={centerY - housingRadius} x2={centerX + housingRadius + 180} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="2.5" />
              <line x1={centerX + housingRadius + 160} y1={centerY - housingRadius} x2={centerX + housingRadius + 200} y2={centerY - housingRadius} stroke={colors.dimension} strokeWidth="2.5" />
              <line x1={centerX + housingRadius + 160} y1={centerY + housingRadius} x2={centerX + housingRadius + 200} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="2.5" />
              <text x={centerX + housingRadius + 230} y={centerY} fill={colors.dimension} fontSize="24" fontWeight="950" transform={`rotate(90, ${centerX + housingRadius + 230}, ${centerY})`} textAnchor="middle">Ø {(statorD * 1.35).toFixed(1)}mm (TOTAL OD)</text>

              {/* Stator Bore */}
              <line x1={centerX - statorInnerRadius} y1={centerY + statorInnerRadius + 120} x2={centerX + statorInnerRadius} y2={centerY + statorInnerRadius + 120} stroke={colors.dimension} strokeWidth="2.5" />
              <line x1={centerX - statorInnerRadius} y1={centerY + statorInnerRadius + 100} x2={centerX - statorInnerRadius} y2={centerY + statorInnerRadius + 140} stroke={colors.dimension} strokeWidth="2.5" />
              <line x1={centerX + statorInnerRadius} y1={centerY + statorInnerRadius + 100} x2={centerX + statorInnerRadius} y2={centerY + statorInnerRadius + 140} stroke={colors.dimension} strokeWidth="2.5" />
              <text x={centerX} y={centerY + statorInnerRadius + 165} fill={colors.dimension} fontSize="22" fontWeight="950" textAnchor="middle">Ø {statorD}mm (STATOR BORE)</text>

              {/* Shaft Diameter */}
              <line x1={centerX - shaftRadius} y1={centerY - 20} x2={centerX + shaftRadius} y2={centerY - 20} stroke="#fff" strokeWidth="1.5" />
              <text x={centerX} y={centerY - 45} fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">SHAFT: Ø {(statorD * 0.1).toFixed(1)}mm</text>
            </g>

            {/* ── BOLD LABELS ── */}
            <g className="labels" fontSize="22" fontWeight="950" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 200} y2={centerY - 350} stroke="#fff" strokeWidth="4" />
              <text x={centerX - housingRadius - 205} y={centerY - 355} fill="#fff" textAnchor="end">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius + 5} y1={centerY - statorInnerRadius} x2={centerX + statorInnerRadius + 200} y2={centerY - statorInnerRadius - 200} stroke={colors.windingsA} strokeWidth="4" />
              <text x={centerX + statorInnerRadius + 205} y={centerY - statorInnerRadius - 205} fill={colors.windingsA}>STATOR SLOTS (A/B/C)</text>

              <line x1={centerX + rotorRadius + 5} y1={centerY - 50} x2={centerX + statorCoreRadius + 250} y2={centerY - 100} stroke={colors.dimension} strokeWidth="4" />
              <text x={centerX + statorCoreRadius + 255} y={centerY - 105} fill={colors.dimension}>AIR GAP: {airGapVal}mm</text>

              <line x1={centerX + statorCoreRadius} y1={centerY + 100} x2={centerX + statorCoreRadius + 200} y2={centerY + 250} stroke="#888" strokeWidth="4" />
              <text x={centerX + statorCoreRadius + 205} y={centerY + 255} fill="#888">STATOR IRON YOKE</text>

              <line x1={centerX - rotorRadius} y1={centerY + 50} x2={centerX - rotorRadius - 200} y2={centerY + 450} stroke={colors.poleN} strokeWidth="4" />
              <text x={centerX - rotorRadius - 205} y={centerY + 455} fill={colors.poleN} textAnchor="end">ROTOR MAGNET POLES</text>
            </g>
          </g>
        </svg>

        {/* Prediction Data Badge */}
        <div style={{ position: 'absolute', top: '30px', left: '30px', background: 'rgba(0,255,255,0.1)', padding: '15px 25px', borderRadius: '15px', border: '1px solid #00ffff', color: '#00ffff', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: '900', marginBottom: '5px' }}>PREDICTED DATA</div>
          <div>Estimated Weight: <strong>{weight} kg</strong></div>
          <div>Axial Length: <strong>{rotorL} mm</strong></div>
          <div>Max Torque: <strong>{specifications.peakTorqueNm} Nm</strong></div>
        </div>

        {/* Interaction Badge */}
        <div style={{ position: 'absolute', bottom: '30px', right: '30px', color: '#fff', fontSize: '0.85rem', background: 'rgba(0,0,0,0.8)', padding: '12px 20px', borderRadius: '40px', border: '1px solid #444', pointerEvents: 'none', fontWeight: 'bold' }}>
          🖱️ DRAG TO MOVE • USE + / − TO ZOOM
        </div>
      </div>

      <div className="blueprint-legend" style={{ width: '100%', marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', borderTop: '2px solid #222', paddingTop: '3rem' }}>
        <LegendItem color="#fff" title="1. Housing & Fins" desc="Thick frame w/ ribs" />
        <LegendItem color="#444" title="2. Stator Core" desc="Laminated iron back-yoke" />
        <LegendItem color={colors.windingsA} title="3. Phase Windings" desc="A/B/C phased slot boxes" isPhase />
        <LegendItem color={colors.dimension} title="4. Air Gap" desc={`Clearance: ${airGapVal}mm`} isDashed />
        <LegendItem color={colors.poleN} title="5. Rotor Magnets" desc="N/S magnetic pole pairs" isPole />
        <LegendItem color="#fff" title="6. Drive Shaft" desc="High-tensile output" isCircle />
      </div>
    </div>
  );
};

const LegendItem = ({ color, title, desc, isPhase, isPole, isCircle, isDashed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
    {isPhase ? (
      <div style={{ display: 'flex', gap: '4px' }}>
        <div style={{ width: '16px', height: '26px', background: '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '950', border: '1px solid #000' }}>A</div>
        <div style={{ width: '16px', height: '26px', background: '#a29bfe', border: '1px solid #000' }}></div>
      </div>
    ) : isPole ? (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '18px', height: '26px', background: '#ff2d55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '950', color: '#fff' }}>N</div>
        <div style={{ width: '18px', height: '26px', background: '#0b84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '950', color: '#fff' }}>S</div>
      </div>
    ) : isCircle ? (
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${color}`, background: '#000' }}></div>
    ) : isDashed ? (
      <div style={{ width: '35px', height: '4px', borderTop: `3px dashed ${color}` }}></div>
    ) : (
      <div style={{ width: '35px', height: '26px', background: color, border: '1px solid #fff' }}></div>
    )}
    <div>
      <strong style={{ display: 'block', color: '#fff', fontSize: '1rem' }}>{title}</strong>
      <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
