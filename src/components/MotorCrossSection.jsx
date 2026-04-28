const MotorCrossSection = ({ data, isPdfMode = false }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!data || !data.dimensions) return null;

  const { dimensions, specifications, motorType } = data;
  const statorD = parseFloat(dimensions.statorDiameter);
  const poles = parseInt(dimensions.poles) || 8;
  const slots = parseInt(dimensions.slots) || 12;
  const airGapVal = parseFloat(dimensions.airGap);

  const vbWidth = 1400; 
  const vbHeight = 1200;
  const centerX = vbWidth / 2;
  const centerY = vbHeight / 2;
  
  const activeZoom = isPdfMode ? 1.0 : zoom;
  const activeOffset = isPdfMode ? { x: 0, y: 0 } : offset;
  
  const baseScale = 220 / Math.max(statorD, 1);
  const currentScale = baseScale * activeZoom;
  
  const housingRadius = (statorD / 2 * 1.35) * currentScale;
  const statorCoreRadius = (statorD / 2 * 1.25) * currentScale;
  const statorInnerRadius = (statorD / 2) * currentScale;
  const visualAirGap = Math.max(30, currentScale * 18); 
  const rotorRadius = statorInnerRadius - visualAirGap;
  const rotorCoreRadius = rotorRadius * 0.75;
  const shaftRadius = rotorCoreRadius * 0.4;

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3)); 
  };

  const startDrag = (clientX, clientY) => {
    if (isPdfMode) return;
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging || isPdfMode) return;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const colors = isPdfMode ? {
    bg: '#ffffff',
    housing: '#000000',
    housingFill: '#ffffff',
    statorIron: '#f0f0f0',
    windingsA: '#666666',
    windingsB: '#333333',
    windingsC: '#999999',
    airgap: '#000000',
    poleN: '#1a1a1a',
    poleS: '#4a4a4a',
    shaft: '#000000',
    dimension: '#000000',
    text: '#000000',
    labelLine: '#000000'
  } : {
    bg: '#000000',
    housing: '#333',
    housingFill: '#0d0d0d',
    statorIron: '#111',
    windingsA: '#ff9f43',
    windingsB: '#a29bfe',
    windingsC: '#ffffff',
    airgap: '#00ffff',
    poleN: '#ff3b30',
    poleS: '#007aff',
    shaft: '#ffffff',
    dimension: '#00ff00',
    text: '#ffffff',
    labelLine: '#ffffff'
  };

  return (
    <div className="motor-drawing-container" style={{ width: '100%' }}>
      <div 
        className="drawing-layout" 
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',
          background: colors.bg, padding: isPdfMode ? '0' : '2rem', borderRadius: isPdfMode ? '0' : '32px', 
          border: isPdfMode ? '1px solid #000' : '2px solid #222',
          overflow: 'hidden', minHeight: isPdfMode ? '750px' : '850px', 
          cursor: isDragging ? 'grabbing' : (isPdfMode ? 'default' : 'grab'),
          touchAction: 'none', position: 'relative'
        }}
      >
        {/* ── ENGINEERING DATA BLOCK (PDF ONLY) ── */}
        {isPdfMode && (
          <g transform="translate(50, 50)" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <rect x="0" y="0" width="350" height="120" fill="none" stroke="#000" strokeWidth="2" />
            <text x="10" y="25" fontWeight="bold">ENGINEERING ASSEMBLY DRAWING</text>
            <line x1="0" y1="35" x2="350" y2="35" stroke="#000" strokeWidth="1" />
            <text x="10" y="55">MOTOR TYPE: {motorType.split(' ')[0]}</text>
            <text x="10" y="75">DATE: {new Date().toLocaleDateString()}</text>
            <text x="10" y="95">POWER: {specifications.peakPowerKw}kW | {specifications.operatingVoltage}V</text>
            <text x="10" y="112">DOC ID: MM-AI-{(Math.random() * 10000).toFixed(0)}</text>
          </g>
        )}

        {!isPdfMode && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '12px', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <button onClick={() => { setZoom(1); setOffset({x:0, y:0}); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>RESET</button>
            <button onClick={() => handleZoom(-0.25)} style={{ background: '#444', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>−</button>
            <div style={{ color: '#00ffff', fontSize: '0.8rem', alignSelf: 'center', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
            <button onClick={() => handleZoom(0.25)} style={{ background: '#444', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer' }}>+</button>
          </div>
        )}

        <svg 
          className="motor-svg" 
          width="100%" height="auto" viewBox={`0 0 ${vbWidth} ${vbHeight}`} 
          style={{ overflow: 'visible', userSelect: 'none' }}
        >
          {/* Engineering Block for PDF (rendered inside SVG for scale) */}
          {isPdfMode && (
             <g transform="translate(950, 950)">
               <rect x="0" y="0" width="400" height="200" fill="#fff" stroke="#000" strokeWidth="3" />
               <text x="20" y="40" fontSize="24" fontWeight="bold">DESIGN SUMMARY</text>
               <text x="20" y="80" fontSize="18">ST_DIAMETER: {dimensions.statorDiameter}</text>
               <text x="20" y="110" fontSize="18">RT_LENGTH: {dimensions.rotorLength}</text>
               <text x="20" y="140" fontSize="18">POLES/SLOTS: {dimensions.poles}P/{dimensions.slots}S</text>
               <text x="20" y="170" fontSize="18">AIR_GAP: {dimensions.airGap}</text>
             </g>
          )}

          <g transform={`translate(${activeOffset.x / (activeZoom * 0.4)}, ${activeOffset.y / (activeZoom * 0.4)})`}>
            
            {/* ── HOUSING ── */}
            <circle cx={centerX} cy={centerY} r={housingRadius} fill={colors.housingFill} stroke={colors.housing} strokeWidth={isPdfMode ? "3" : "12"} />
            {[...Array(64)].map((_, i) => {
              const angle = (i * 360) / 64;
              return <rect key={`f-${i}`} x={centerX - 4} y={centerY - housingRadius - 25} width="8" height="30" fill={isPdfMode ? "#666" : "#2a2a2a"} transform={`rotate(${angle}, ${centerX}, ${centerY})`} />;
            })}

            {/* ── STATOR ── */}
            <circle cx={centerX} cy={centerY} r={statorCoreRadius} fill={colors.statorIron} stroke={isPdfMode ? "#000" : "#444"} strokeWidth="2" />
            {[...Array(slots)].map((_, i) => {
              const angle = (i * 360) / slots;
              const phase = i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
              const phaseColor = i % 3 === 0 ? colors.windingsA : i % 3 === 1 ? colors.windingsB : colors.windingsC;
              const boxSize = Math.max(24, statorCoreRadius * 0.14);
              return (
                <g key={`slot-${i}`} transform={`rotate(${angle}, ${centerX}, ${centerY})`}>
                  <rect x={centerX - boxSize/2} y={centerY - statorInnerRadius - boxSize * 0.85} width={boxSize} height={boxSize} rx="5" fill={phaseColor} stroke="#000" strokeWidth="3" />
                  <text x={centerX} y={centerY - statorInnerRadius - boxSize * 0.85 + boxSize/1.3} fill="#fff" fontSize={boxSize * 0.8} textAnchor="middle" fontWeight="900">{phase}</text>
                </g>
              );
            })}

            {/* ── AIR GAP ── */}
            <circle cx={centerX} cy={centerY} r={(statorInnerRadius + rotorRadius) / 2} fill="transparent" stroke={colors.airgap} strokeWidth={isPdfMode ? "1" : "4"} strokeDasharray="15 10" />

            {/* ── ROTOR ── */}
            <circle cx={centerX} cy={centerY} r={rotorRadius} fill={isPdfMode ? "#fff" : "#000"} stroke="#000" strokeWidth="3" />
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

            <circle cx={centerX} cy={centerY} r={shaftRadius} fill={isPdfMode ? "#eee" : "#000"} stroke={colors.shaft} strokeWidth="8" />

            {/* ── MEASUREMENTS ── */}
            <g style={{ fontFamily: 'monospace' }}>
              <g transform={`translate(${housingRadius + 250}, 0)`}>
                <line x1={centerX} y1={centerY - housingRadius} x2={centerX} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY - housingRadius} x2={centerX + 30} y2={centerY - housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - 30} y1={centerY + housingRadius} x2={centerX + 30} y2={centerY + housingRadius} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX + 40} y={centerY - 35} width="350" height="70" rx="10" fill={isPdfMode ? "#fff" : "#000"} stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX + 215} y={centerY - 5} fill={colors.dimension} fontSize="24" fontWeight="bold" textAnchor="middle">Ø {(statorD * 1.35).toFixed(1)}mm</text>
                <text x={centerX + 215} y={centerY + 22} fill={colors.text} fontSize="16" fontWeight="bold" textAnchor="middle">TOTAL OUTER DIAMETER</text>
              </g>

              <g transform={`translate(0, ${statorInnerRadius + 250})`}>
                <line x1={centerX - statorInnerRadius} y1={centerY} x2={centerX + statorInnerRadius} y2={centerY} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX - statorInnerRadius} y1={centerY - 30} x2={centerX - statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <line x1={centerX + statorInnerRadius} y1={centerY - 30} x2={centerX + statorInnerRadius} y2={centerY + 30} stroke={colors.dimension} strokeWidth="4" />
                <rect x={centerX - 175} y={centerY + 40} width="350" height="70" rx="10" fill={isPdfMode ? "#fff" : "#000"} stroke={colors.dimension} strokeWidth="2" />
                <text x={centerX} y={centerY + 82} fill={colors.dimension} fontSize="24" fontWeight="bold" textAnchor="middle">Ø {statorD}mm</text>
                <text x={centerX} y={centerY + 102} fill={colors.text} fontSize="16" fontWeight="bold" textAnchor="middle">STATOR INNER BORE DIAMETER</text>
              </g>
            </g>

            {/* ── ASSEMBLY LABELS ── */}
            <g className="labels" fontSize="18" fontWeight="bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <line x1={centerX - housingRadius} y1={centerY - 100} x2={centerX - housingRadius - 150} y2={centerY - 250} stroke={colors.labelLine} strokeWidth="4" />
              <text x={centerX - housingRadius - 155} y={centerY - 255} fill={colors.text} textAnchor="end">EXTERNAL HOUSING</text>

              <line x1={centerX + statorInnerRadius} y1={centerY - statorInnerRadius} x2={centerX + 250} y2={centerY - 450} stroke={isPdfMode ? "#000" : colors.windingsA} strokeWidth="4" />
              <text x={centerX + 255} y={centerY - 455} fill={colors.text}>STATOR WINDINGS (ABC)</text>

              <line x1={centerX + rotorRadius + 5} y1={centerY - 50} x2={centerX + 350} y2={centerY - 150} stroke={colors.labelLine} strokeWidth="4" />
              <text x={centerX + 355} y={centerY - 155} fill={colors.text}>AIR GAP: {airGapVal}mm</text>

              <line x1={centerX - rotorRadius} y1={centerY + 100} x2={centerX - 250} y2={centerY + 400} stroke={colors.labelLine} strokeWidth="4" />
              <text x={centerX - 255} y={centerY + 405} fill={colors.text} textAnchor="end">ROTOR MAGNET POLES</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="blueprint-legend" style={{ 
        width: '100%', marginTop: '1rem', 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem', background: isPdfMode ? '#fff' : 'rgba(0,0,0,0.3)', 
        padding: '1.5rem', borderRadius: '20px', 
        border: isPdfMode ? '2px solid #000' : '1px solid #333' 
      }}>
        <LegendItem color={isPdfMode ? "#eee" : "#333"} title="1. External Housing" desc="Frame w/ cooling fins" isPdf={isPdfMode} />
        <LegendItem color={isPdfMode ? "#f0f0f0" : "#1a1a1a"} title="2. Stator Core" desc="Laminated silicon steel yoke" isPdf={isPdfMode} />
        <LegendItem color={isPdfMode ? "#666" : colors.windingsA} title="3. Stator Windings" desc="3-Phase (A/B/C) slot boxes" isPhase isPdf={isPdfMode} />
        <LegendItem color={isPdfMode ? "#000" : colors.airgap} title="4. Air Gap" desc={`Flux region: ${airGapVal}mm`} isDashed isPdf={isPdfMode} />
        <LegendItem color={isPdfMode ? "#333" : colors.poleN} title="5. Rotor Poles" desc="Permanent magnets (N/S)" isPole isPdf={isPdfMode} />
        <LegendItem color={isPdfMode ? "#000" : "#fff"} title="6. Drive Shaft" desc="Main torque output shaft" isCircle isPdf={isPdfMode} />
      </div>
    </div>
  );
};

const LegendItem = ({ color, title, desc, isPhase, isPole, isCircle, isDashed, isPdf }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    {isPhase ? (
      <div style={{ display: 'flex', gap: '3px' }}>
        <div style={{ width: '16px', height: '24px', background: isPdf ? '#666' : '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', border: '1px solid #000' }}>A</div>
        <div style={{ width: '16px', height: '24px', background: isPdf ? '#999' : '#a29bfe', border: '1px solid #000' }}></div>
      </div>
    ) : isPole ? (
      <div style={{ display: 'flex' }}>
        <div style={{ width: '18px', height: '24px', background: isPdf ? '#1a1a1a' : '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>N</div>
        <div style={{ width: '18px', height: '24px', background: isPdf ? '#4a4a4a' : '#007aff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#fff' }}>S</div>
      </div>
    ) : isCircle ? (
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${color}`, background: isPdf ? '#fff' : '#000' }}></div>
    ) : isDashed ? (
      <div style={{ width: '35px', height: '4px', borderTop: `2px dashed ${color}` }}></div>
    ) : (
      <div style={{ width: '35px', height: '24px', background: color, border: '1px solid #555' }}></div>
    )}
    <div>
      <strong style={{ display: 'block', color: isPdf ? '#000' : '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{title}</strong>
      <span style={{ fontSize: '0.75rem', color: isPdf ? '#444' : '#888' }}>{desc}</span>
    </div>
  </div>
);

export default MotorCrossSection;
