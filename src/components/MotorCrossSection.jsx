import React, { useState } from 'react';

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

  const vbWidth = 1400; 
  const vbHeight = 1200;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  const visualAirGap = Math.max(28, currentScale * 16); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 6));
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
    statorIron: '#111111',
    windingsA: '#ff9f43',
    windingsB: '#a29bfe',
    windingsC: '#ffffff',
    airgap: '#00ffff',
    poleN: '#ff3b30',
    poleS: '#007aff',
    shaft: '#ffffff',
    dimension: '#00ff00', // Bright Green for measurements
    label: '#ffffff'
  };

  return (
    <div className="motor-drawing-container" style={{ marginBottom: '4rem', width: '100%' }}>
      <div className="no-pdf" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px' }}>
        <div>
          <h4 style={{ color: '#00ffff', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem', margin: 0, fontWeight: '900' }}>
            Interactive Engineering Blueprint
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa' }}>
            PAN: Click & Drag • ZOOM: + / −
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '900' }}>RESET</button>
          <button onClick={() => handleZoom(-0.25)} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.4rem' }}>−</button>
          <div style={{ alignSelf: 'center', color: '#00ffff', fontSize: '1.1rem', fontWeight: '900', width: '70px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.25)} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.4rem' }}>+</button>
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
          background: '#000000', padding: '3rem', borderRadius: '40px', border: '4px solid #1a1a1a',
          overflow: 'hidden', minHeight: '900px', cursor: isDragging ? 'grabbing' : 'grab',
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
            
            {/* ── HOUSING & CORE ── */}
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#050505" stroke="#333" strokeWidth="15" />
            <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#444" strokeWidth="2" />
            
            {/* Phased boxes (ABC) */}
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
              const boxSize = Math.max(26, statorCoreRadius * 0.14);
              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.85} width={boxSize} height={boxSize} rx="5" fill={phaseColor} stroke="#000" strokeWidth="3" />
                  <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.85 + boxSize/1.3} fill="#000" fontSize={boxSize * 0.85} textAnchor="middle" fontWeight="1000">{phase}</text>
                  <rect x={centerX - 10} y={centerY - statorInnerRadius} width="20" height="40" fill="#000" opacity="0.6" />
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
                  <text x={centerX} y={centerY - rotorRadius + 25} fill="#fff" fontSize="18" textAnchor="middle" fontWeight="1000">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}

            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#000" stroke="#fff" strokeWidth="8" />

            {/* ── BRIGHT MEASUREMENTS (Positioned far from motor to avoid merging) ── */}
            <g style={{ fontFamily: 'monospace' }}>
              {/* Outer Diameter Measurement */}
              <g transform={`translate(${housingRadius + 250}, 0)`}>
                <line x1={centerX} y1={centerY - housingRadius} x2={centerX} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY - housingRadius} x2={centerX + 30} y2={centerY - housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY + housingRadius} x2={centerX + 30} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX + 40} y={centerY - 25} width="220" height="50" rx="10" fill="#000" stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX + 150} y={centerY + 12} fill={colors.dimension} fontSize="28" fontWeight="1000" textAnchor="middle">Ø {(statorD * 1.35).toFixed(1)}mm</text>
              </g>

              {/* Stator ID Measurement */}
              <g transform={`translate(0, ${statorInnerRadius + 250})`}>
                <line x1={centerX - statorInnerRadius} y1={centerY} x2={centerX + statorInnerRadius} y2={centerY} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - statorInnerRadius} y1={centerY - 30} x2={centerX - statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX + statorInnerRadius} y1={centerY - 30} x2={centerX + statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX - 110} y={centerY + 40} width="220" height="50" rx="10" fill="#000" stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX} y={centerY + 78} fill={colors.dimension} fontSize="28" fontWeight="1000" textAnchor="middle">Ø {statorD}mm</text>
              </g>
            </g>

            {/* ── BOLD ASSEMBLY LABELS ── */}
            <g className="labels" fontSize="24" fontWeight="1000" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 200} y2={centerY - 450} stroke="#fff" strokeWidth="5" />
              <text x={centerX - housingRadius - 205} y={centerY - 455} fill="#fff" textAnchor="end">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius + 5} y1={centerY - statorInnerRadius} x2={centerX + 300} y2={centerY - 550} stroke={colors.windingsA} strokeWidth="5" />
              <text x={centerX + 305} y={centerY - 555} fill={colors.windingsA}>STATOR WINDINGS (ABC)</text>

              <line x1={centerX + rotorRadius + 5} y1={centerY - 50} x2={centerX + 400} y2={centerY - 200} stroke="#00ffff" strokeWidth="5" />
              <text x={centerX + 405} y={centerY - 205} fill="#00ffff">AIR GAP: {airGapVal}mm</text>

              <line x1={centerX - rotorRadius} y1={centerY + 100} x2={centerX - 350} y2={centerY + 500} stroke={colors.poleN} strokeWidth="5" />
              <text x={centerX - 355} y={centerY + 505} fill={colors.poleN} textAnchor="end">ROTOR MAGNET POLES</text>
            </g>
          </g>
        </svg>

        {/* HUD Stats */}
        <div style={{ position: 'absolute', top: '40px', right: '40px', background: 'rgba(0,0,0,0.85)', padding: '20px 30px', borderRadius: '25px', border: '3px solid #00ffff', color: '#fff', fontSize: '1rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ color: '#00ffff', fontWeight: '1000', marginBottom: '10px', fontSize: '1.2rem' }}>PREDICTED SPECS</div>
          <div style={{ marginBottom: '5px' }}>Mass: <strong style={{color: '#ff9f43'}}>{specifications.weightKg} kg</strong></div>
          <div style={{ marginBottom: '5px' }}>Length: <strong style={{color: '#ff9f43'}}>{rotorL} mm</strong></div>
          <div style={{ marginBottom: '5px' }}>Peak Torque: <strong style={{color: '#ff9f43'}}>{specifications.peakTorqueNm} Nm</strong></div>
          <div>Efficiency: <strong style={{color: '#00ff00'}}>{specifications.estimatedEfficiency}</strong></div>
        </div>

        {/* Floating Hint */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', background: 'rgba(255,255,255,0.1)', padding: '15px 30px', borderRadius: '50px', color: '#fff', fontWeight: '1000', border: '1px solid rgba(255,255,255,0.2)' }}>
          🖐️ DRAG TO EXPLORE • +/- TO ZOOM
        </div>
      </div>
    </div>
  );
};

export default MotorCrossSection;
