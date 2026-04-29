import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Cpu, Thermometer, Zap, BarChart3, Activity, 
  Settings, Ruler, TrendingUp, Gauge, Weight, Wind, Square, 
  CircleDashed, Timer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import MotorCrossSection from './MotorCrossSection';

const AwaitingDesign = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="awaiting-container glass-panel"
    >
      <div className="ambient-glow"></div>
      <div className="awaiting-content">
        <div className="radar-animation">
           <div className="radar-circle"></div>
           <div className="radar-circle"></div>
           <div className="radar-circle"></div>
           <Cpu size={48} className="awaiting-icon" />
        </div>
        <h3>Awaiting <span className="text-gradient">Parameters</span></h3>
        <p>Configure the vehicle's core requirements on the left to initialize the physics-based AI engine and generate a powertrain design.</p>
        
        <div className="status-grid">
           <div className="status-item"><span className="dot"></span> Neural Engine Status: Ready</div>
           <div className="status-item"><span className="dot"></span> Physics-Based Solver: Standby</div>
           <div className="status-item" style={{ color: 'var(--accent-blue)' }}><span className="dot"></span> Waiting for Input Data...</div>
        </div>
      </div>
    </motion.div>
  );
};

const DesignReport = ({ data, inputs }) => {
  const reportRef = useRef();
  const [isExporting, setIsExporting] = useState(false);
  const [showCrossSection, setShowCrossSection] = useState(true);

  const handleDownloadPdf = () => {
    setIsExporting(true);
    const element = reportRef.current;
    element.classList.add('pdf-export-mode');
    
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', windowWidth: 1000 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().from(element).set(opt).save().then(() => {
      element.classList.remove('pdf-export-mode');
      setIsExporting(false);
    });
  };

  if (!data) return <AwaitingDesign />;

  // Derived dimensions for consistency
  const statorD = parseInt(data.dimensions.statorDiameter);
  const boreD = Math.round(statorD * 0.72);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
    >
      <div className="report-container" ref={reportRef} style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '16px' }}>
        
        {/* 01. HEADER */}
        <div className="pdf-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 className="label-accent">AI RECOMMENDED ARCHITECTURE</h4>
              <h2 className="report-title">{data.motorType}</h2>
            </div>
            <button onClick={handleDownloadPdf} className="btn btn-secondary ui-only" disabled={isExporting}>
              <Download size={16} /> {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>

          <div className="justification-box">
             <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 800, marginRight: '8px' }}>💡 Why This Motor?</span>
                {data.motorSelectionReason}
             </p>
          </div>
        </div>

        {/* 02. INPUT PARAMETERS */}
        <div className="pdf-section" style={{ marginBottom: '2rem' }}>
          <h3 className="section-header">Input Parameters</h3>
          <div className="input-grid">
             {[
               { l: 'Vehicle Type', v: inputs?.vehicleType }, { l: 'Vehicle Weight', v: inputs?.vehicleWeight + ' kg' }, { l: 'Target Speed', v: inputs?.targetSpeed + ' km/h' },
               { l: 'Desired Range', v: inputs?.range + ' km' }, { l: 'System Voltage', v: inputs?.voltage + ' V' }, { l: 'Drag Coeff (Cd)', v: inputs?.dragCoefficient },
               { l: 'Frontal Area', v: inputs?.frontalArea + ' m²' }, { l: 'Rolling Resistance', v: inputs?.rollingResistance }
             ].map((item, i) => (
               <div key={i}><span className="stat-label">{item.l}</span><strong>{item.v}</strong></div>
             ))}
          </div>
        </div>

        {/* 03. STAT CARDS */}
        <div className="pdf-section stat-cards-row">
           {[
             { icon: <Zap size={14}/>, label: 'Peak Power', val: data.specifications.peakPowerKw + ' kW' },
             { icon: <Activity size={14}/>, label: 'Peak Torque', val: data.specifications.peakTorqueNm + ' Nm' },
             { icon: <BarChart3 size={14}/>, label: 'Max RPM', val: data.specifications.maxRpm },
             { icon: <Thermometer size={14}/>, label: 'Cooling', val: data.thermal.coolingMethod }
           ].map((item, i) => (
             <div key={i} className="stat-card">
               <div className="stat-card-label">{item.icon} {item.label}</div>
               <div className="stat-card-val">{item.val}</div>
             </div>
           ))}
        </div>

        {/* 04. SPECS GRIDS */}
        <div className="pdf-section specs-grid-row">
           <div className="specs-col">
             <h3 className="section-header"><Ruler size={18}/> Physical Dimensions</h3>
             <div className="specs-list">
               {[
                 { l: 'Stator Outer Dia.', v: data.dimensions.statorDiameter }, 
                 { l: 'Stator Bore Dia.', v: `${boreD} mm` },
                 { l: 'Rotor Length', v: data.dimensions.rotorLength }, 
                 { l: 'Overall Length', v: data.dimensions.overallLength }, 
                 { l: 'Air Gap', v: data.dimensions.airGap }, 
                 { l: 'Pole/Slot Combo', v: `${data.dimensions.slots}S / ${data.dimensions.poles}P` }
               ].map((it, i) => (
                 <div key={i} className="spec-item"><span>{it.l}</span><strong>{it.v}</strong></div>
               ))}
             </div>
           </div>
           <div className="specs-col">
             <h3 className="section-header"><Zap size={18}/> Electrical Specs</h3>
             <div className="specs-list">
               {[{ l: 'Operating Voltage', v: data.specifications.operatingVoltage + 'V' }, { l: 'Phase Current', v: data.electrical.phaseCurrent }, { l: 'Stator Resistance', v: data.electrical.statorResistance }, { l: 'd-q Inductance', v: data.electrical.dqInductance }, { l: 'Back EMF Const.', v: data.electrical.backEmfConstant }, { l: 'Switching Freq.', v: data.electrical.switchingFreq }, { l: 'Winding Type', v: data.electrical.windingType }].map((it, i) => (
                 <div key={i} className="spec-item"><span>{it.l}</span><strong>{it.v}</strong></div>
               ))}
             </div>
           </div>
        </div>

        <div className="pdf-section specs-grid-row">
           <div className="specs-col">
             <h3 className="section-header"><Settings size={18}/> Mechanical & Thermal</h3>
             <div className="specs-list">
               {[{ l: 'Torque Density', v: data.mechanical.maxTorqueDensity }, { l: 'Rotor Inertia', v: data.mechanical.rotorInertia }, { l: 'Centrifugal Force', v: data.mechanical.maxCentrifugalForce }, { l: 'Bearing Load', v: data.mechanical.bearingLoad }, { l: 'Critical Speed', v: data.mechanical.criticalSpeed }, { l: 'Cogging Torque', v: data.mechanical.coggingTorque }].map((it, i) => (
                 <div key={i} className="spec-item"><span>{it.l}</span><strong>{it.v}</strong></div>
               ))}
             </div>
           </div>
           <div className="specs-col">
             <h3 className="section-header"><TrendingUp size={18}/> System Performance</h3>
             <div className="specs-list">
               {[{ l: 'Continuous Power', v: data.specifications.continuousPowerKw + ' kW' }, { l: 'Peak Efficiency', v: data.specifications.estimatedEfficiency }, { l: 'Cont. Torque', v: data.specifications.continuousTorqueNm + ' Nm' }, { l: 'Base Speed', v: data.specifications.baseRpm + ' RPM' }, { l: 'Est. Total Weight', v: data.specifications.weightKg + ' kg' }].map((it, i) => (
                 <div key={i} className="spec-item"><span>{it.l}</span><strong>{it.v}</strong></div>
               ))}
             </div>
           </div>
        </div>

        {/* 05. THERMAL MANAGEMENT */}
        <div className="pdf-section" style={{ marginBottom: '3rem' }}>
          <h3 className="section-header"><Thermometer size={18}/> Thermal Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
             {[
               { l: 'Primary Cooling', v: data.thermal.coolingMethod }, { l: 'Max Coil Temp', v: data.thermal.maxCoilTemp }, { l: 'Coolant Flow', v: data.thermal.coolantFlowRate }, { l: 'Thermal Resistance', v: data.thermal.thermalResistance }
             ].map((item, i) => (
               <div key={i} className="thermal-card">
                 <span className="stat-label">{item.l}</span>
                 <strong>{item.v}</strong>
               </div>
             ))}
          </div>
        </div>

        {/* 06. LIVE DESIGN PREVIEW */}
        <div className="pdf-section ui-only" style={{ marginBottom: '3rem' }}>
           <div style={{ 
             display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
             padding: '1.5rem', background: 'rgba(255,255,255,0.02)', 
             borderRadius: '16px 16px 0 0', border: '1px solid var(--glass-border)',
             borderBottom: 'none'
           }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Live Design Preview</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle interactive CAD-style cross-section view</p>
              </div>
              <button 
                onClick={() => setShowCrossSection(!showCrossSection)} 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Settings size={18} />
                {showCrossSection ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
              </button>
           </div>
           
           <AnimatePresence>
             {showCrossSection && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 style={{ overflow: 'hidden' }}
               >
                 <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0 0 16px 16px', border: '1px solid var(--glass-border)' }}>
                    <MotorCrossSection data={data} isPdfMode={false} />
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* 07. PERFORMANCE GRAPHS */}
        <div className="pdf-section page-break" style={{ marginBottom: '3rem' }}>
          <h3 className="section-header"><Activity size={18}/> Performance Characteristics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div className="pdf-chart-container">
                <h4 className="chart-label">EFFICIENCY VS. SPEED</h4>
                <div style={{ width: '100%', height: 350 }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                         <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                         <YAxis stroke="#00d2ff" fontSize={11} domain={[0, 100]} />
                         <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={4} dot={false} isAnimationActive={false} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="pdf-chart-container">
                <h4 className="chart-label">TORQUE VS. SPEED</h4>
                <div style={{ width: '100%', height: 350 }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                         <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                         <YAxis stroke="#ff9f43" fontSize={11} />
                         <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={4} dot={false} isAnimationActive={false} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>

        {/* 08. PDF ONLY BLUEPRINT */}
        <div className="pdf-only-blueprint" style={{ display: 'none' }}>
           <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '20px', color: '#000' }}>Technical Appendix: Assembly Blueprint</h2>
           <div style={{ border: '3px solid #000', padding: '20px', background: '#fff' }}>
              <MotorCrossSection data={data} isPdfMode={true} />
           </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .label-accent { color: var(--accent-blue); text-transform: uppercase; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.5rem; }
        .report-title { fontSize: 2.2rem; fontWeight: 800; margin-bottom: 1rem; color: #fff; }
        .justification-box { background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.15); borderRadius: 10px; padding: 1.2rem; margin-bottom: 2rem; }
        .section-header { font-size: 1rem; margin-bottom: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; color: #fff; }
        .input-grid { display: grid; gridTemplateColumns: repeat(3, 1fr); gap: 1.5rem; background: rgba(255,255,255,0.02); padding: 1.5rem; borderRadius: 12px; border: 1px solid var(--glass-border); }
        .stat-label { color: var(--text-secondary); font-size: 0.75rem; display: block; }
        .stat-cards-row { display: grid; gridTemplateColumns: repeat(4, 1fr); gap: 1rem; marginBottom: 2rem; }
        .stat-card { padding: 1.5rem; background: rgba(255,255,255,0.03); borderRadius: 12px; border: 1px solid var(--glass-border); }
        .stat-card-label { fontSize: 0.7rem; color: var(--text-secondary); marginBottom: 10px; display: flex; align-items: center; gap: 6px; }
        .stat-card-val { fontSize: 1.6rem; fontWeight: 800; color: var(--accent-blue); }
        .specs-grid-row { display: grid; gridTemplateColumns: 1fr 1fr; gap: 2.5rem; marginBottom: 2.5rem; }
        .spec-item { display: flex; justify-content: space-between; padding: 0.7rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .spec-item span { color: var(--text-secondary); font-size: 0.9rem; }
        .spec-item strong { font-size: 0.95rem; color: #fff; }
        .thermal-card { padding: 1rem; background: rgba(255,255,255,0.02); borderRadius: 10px; border: 1px solid var(--glass-border); }
        .chart-label { textAlign: center; marginBottom: 1rem; fontSize: 0.9rem; color: var(--text-secondary); }
        .pdf-chart-container { background: rgba(255,255,255,0.01); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--glass-border); }

        .pdf-export-mode { background: #ffffff !important; color: #000000 !important; width: 210mm !important; padding: 10mm !important; }
        .pdf-export-mode .report-container { background: #fff !important; border: none !important; padding: 0 !important; }
        .pdf-export-mode .report-title, .pdf-export-mode .section-header { color: #000 !important; }
        .pdf-export-mode .section-header { border-bottom: 2px solid #000 !important; }
        .pdf-export-mode .spec-item { border-bottom: 1px solid #eee !important; }
        .pdf-export-mode .spec-item span, .pdf-export-mode .spec-item strong { color: #000 !important; }
        .pdf-export-mode .stat-label, .pdf-export-mode .stat-card-label { color: #555 !important; }
        .pdf-export-mode .stat-card-val { color: #000 !important; }
        .pdf-export-mode .stat-card { border: 1.5px solid #000 !important; background: #fff !important; }
        .pdf-export-mode .input-grid { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
        .pdf-export-mode .justification-box { background: #f0f0f0 !important; border: 1px solid #ccc !important; }
        .pdf-export-mode .pdf-chart-container { background: #fff !important; border: 1px solid #000 !important; }
        .pdf-export-mode .ui-only { display: none !important; }
        .pdf-export-mode .pdf-only-blueprint { display: block !important; page-break-before: always !important; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
