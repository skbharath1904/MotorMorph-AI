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

  const vbWidth = 1600; // Even wider
  const vbHeight = 1300;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * zoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  const visualAirGap = Math.max(30, currentScale * 20); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 7));
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
      <div className="no-pdf" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '15px' }}>
        <div>
          <h4 style={{ color: '#00ffff', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '1.2rem', margin: 0, fontWeight: '1000' }}>
            Interactive Engineering Assembly
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#00ff00', fontWeight: 'bold' }}>
            DRAG TO MOVE • ZOOM UP TO 700%
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} style={{ background: '#00ffff', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '1000' }}>RESET VIEW</button>
          <button onClick={() => handleZoom(-0.5)} style={{ background: '#333', border: '1px solid #444', color: '#fff', padding: '10px 30px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.8rem' }}>−</button>
          <div style={{ alignSelf: 'center', color: '#00ffff', fontSize: '1.4rem', fontWeight: '1000', width: '90px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => handleZoom(0.5)} style={{ background: '#333', border: '1px solid #444', color: '#fff', padding: '10px 30px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.8rem' }}>+</button>
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
          background: '#000', padding: '3rem', borderRadius: '40px', border: '5px solid #222',
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
          <g transform={`translate(${offset.x / (zoom * 0.35)}, ${offset.y / (zoom * 0.35)})`}>
            
            {/* ── HOUSING ── */}
            <circle cx={centerX} cy={centerY} r={housingRadius} fill="#0a0a0a" stroke="#444" strokeWidth="15" />
            {[...Array(64)].map((_, i) => {
              const angle = (i * 360) / 64;
              return <rect key={`f-${i}`} x={centerX - 5} y={centerY - housingRadius - 35} width="10" height="40" fill="#333" transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
            })}

            {/* ── STATOR ── */}
            <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke="#555" strokeWidth="3" />
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
              const boxSize = Math.max(30, statorCoreRadius * 0.15);
              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.9} width={boxSize} height={boxSize} rx="6" fill={phaseColor} stroke="#000" strokeWidth="4" />
                  <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.9 + boxSize/1.25} fill="#000" fontSize={boxSize * 0.9} textAnchor="middle" fontWeight="1000">{phase}</text>
                  <rect x={centerX - 12} y={centerY - statorInnerRadius} width="24" height="45" fill="#000" opacity="0.7" />
                </g>
              );
            })}

            {/* ── AIR GAP ── */}
            <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth="5" strokeDasharray="18 12" />

            {/* ── ROTOR ── */}
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill="#000" stroke="#333" strokeWidth="3" />
            {[...Array(poles)].map((_, i) => {
              const angle = (i * 360) / poles;
              const isNorth = i % 2 === 0;
              const pW = (2 * Math.PI * rotorRadius) / (poles * 1.4);
              return (
                <g key={`pole-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - pW/2} y={centerY - rotorRadius + 3} width={pW} height={rotorRadius - rotorCoreRadius} fill={isNorth ? colors.poleN : colors.poleS} stroke="#000" strokeWidth="3" rx="6" />
                  <text x={centerX} y={centerY - rotorRadius + 30} fill="#fff" fontSize="22" textAnchor="middle" fontWeight="1000">{isNorth ? 'N' : 'S'}</text>
                </g>
              );
            })}

            <circle cx={centerX} cy={centerY} r={shaftRadius} fill="#000" stroke="#fff" strokeWidth="10" />

            {/* ── NON-MERGING DYNAMIC DIMENSIONS ── */}
            <g style={{ fontFamily: 'monospace' }}>
              {/* TOTAL OUTER DIAMETER (Far offset) */}
              <g transform={`translate(${housingRadius + 350}, 0)`}>
                <line x1={centerX} y1={centerY - housingRadius} x2={centerX} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="6" />
                <line x1={centerX - 50} y1={centerY - housingRadius} x2={centerX + 50} y2={centerY - housingRadius} stroke={colors.dimension} strokeWidth="6" />
                <line x1={centerX - 50} y1={centerY + housingRadius} x2={centerX + 50} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="6" />
                <rect x={centerX + 60} y={centerY - 60} width="550" height="120" rx="20" fill="#000" stroke={colors.dimension} strokeWidth="4" />
                <text x={centerX + 335} y={centerY - 10} fill={colors.dimension} fontSize="42" fontWeight="1000" textAnchor="middle">Ø {(statorD * 1.35).toFixed(1)}mm</text>
                <text x={centerX + 335} y={centerY + 40} fill="#fff" fontSize="28" fontWeight="1000" textAnchor="middle">TOTAL OUTER DIAMETER</text>
              </g>

              {/* STATOR BORE DIAMETER (Far offset) */}
              <g transform={`translate(0, ${statorInnerRadius + 350})`}>
                <line x1={centerX - statorInnerRadius} y1={centerY} x2={centerX + statorInnerRadius} y2={centerY} stroke={colors.dimension} strokeWidth="6" />
                <line x1={centerX - statorInnerRadius} y1={centerY - 50} x2={centerX - statorInnerRadius} y2={centerY + 50} stroke={colors.dimension} strokeWidth="6" />
                <line x1={centerX + statorInnerRadius} y1={centerY - 50} x2={centerX + statorInnerRadius} y2={centerY + 50} stroke={colors.dimension} strokeWidth="6" />
                <rect x={centerX - 275} y={centerY + 60} width="550" height="120" rx="20" fill="#000" stroke={colors.dimension} strokeWidth="4" />
                <text x={centerX} y={centerY + 130} fill={colors.dimension} fontSize="42" fontWeight="1000" textAnchor="middle">Ø {statorD}mm</text>
                <text x={centerX} y={centerY + 165} fill="#fff" fontSize="28" fontWeight="1000" textAnchor="middle">STATOR INNER BORE DIAMETER</text>
              </g>
            </g>

            {/* ── ULTRA-BOLD LABELS ── */}
            <g className="labels" fontSize="28" fontWeight="1000" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 300} y2={centerY - 550} stroke="#fff" strokeWidth="6" />
              <text x={centerX - housingRadius - 305} y={centerY - 555} fill="#fff" textAnchor="end" fontSize="32">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius} y1={centerY - statorInnerRadius} x2={centerX + 400} y2={centerY - 750} stroke={colors.windingsA} strokeWidth="6" />
              <text x={centerX + 405} y={centerY - 755} fill={colors.windingsA} fontSize="32">STATOR WINDINGS (ABC)</text>

              <line x1={centerX + rotorRadius + 10} y1={centerY - 80} x2={centerX + 500} y2={centerY - 150} stroke="#00ffff" strokeWidth="6" />
              <text x={centerX + 505} y={centerY - 155} fill="#00ffff" fontSize="32">AIR GAP: {airGapVal}mm</text>

              <line x1={centerX - rotorRadius} y1={centerY + 100} x2={centerX - 400} y2={centerY + 650} stroke={colors.poleN} strokeWidth="6" />
              <text x={centerX - 405} y={centerY + 655} fill={colors.poleN} textAnchor="end" fontSize="32">ROTOR MAGNET POLES</text>
            </g>
          </g>
        </svg>

        {/* Hover Hint */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', background: '#00ffff', padding: '15px 40px', borderRadius: '50px', color: '#000', fontWeight: '1000', fontSize: '1rem', border: '3px solid #fff' }}>
          🖐️ CLICK & DRAG TO PAN • +/- TO ZOOM (700% MAX)
        </div>
      </div>
    </div>
  );
};

export default MotorCrossSection;
