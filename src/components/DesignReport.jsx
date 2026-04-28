import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, Cpu, Thermometer, Zap, BarChart3, Activity, 
  Settings, Ruler, TrendingUp, Gauge, Weight, Wind, Square, 
  CircleDashed, Timer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import MotorCrossSection from './MotorCrossSection';

const DesignReport = ({ data, inputs }) => {
  const reportRef = useRef();
  const [showCrossSection, setShowCrossSection] = useState(false);

  const handleDownloadPdf = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.new-page' }
    };
    
    element.classList.add('pdf-export-mode');
    html2pdf().from(element).set(opt).save().then(() => {
      element.classList.remove('pdf-export-mode');
    });
  };

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
    >
      <div className="glass-panel main-report-container" ref={reportRef} style={{ background: 'var(--card-bg)', padding: '2.5rem' }}>
        
        {/* PAGE 1: EXECUTIVE SUMMARY */}
        <div className="pdf-page-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 700 }}>AI RECOMMENDED ARCHITECTURE</h4>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>{data.motorType}</h2>
              <div style={{ background: 'rgba(0, 210, 255, 0.04)', border: '1px solid rgba(0, 210, 255, 0.15)', borderRadius: '8px', padding: '1rem', maxWidth: '800px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent-blue)' }}>💡 WHY THIS MOTOR? </strong> {data.motorSelection_reason || data.motorSelectionReason}
                </p>
              </div>
            </div>
            <button onClick={handleDownloadPdf} className="btn btn-secondary ui-only" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Export PDF
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>INPUT PARAMETERS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {[
                { l: 'Type', v: inputs?.vehicleType },
                { l: 'Weight', v: inputs?.vehicleWeight + ' kg' },
                { l: 'Speed', v: inputs?.targetSpeed + ' km/h' },
                { l: 'Range', v: inputs?.range + ' km' },
                { l: 'Voltage', v: inputs?.voltage + ' V' },
                { l: 'Drag (Cd)', v: inputs?.dragCoefficient },
                { l: 'Area', v: inputs?.frontalArea + ' m²' },
                { l: 'Gradient', v: inputs?.maxGradient + '%' }
              ].map((item, i) => (
                <div key={i}><span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'block' }}>{item.l}</span><strong>{item.v}</strong></div>
              ))}
            </div>
          </div>

          {data.rangeLimitation && (
            <div style={{ background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', color: '#ff9a9a', fontSize: '0.85rem' }}>
              <strong>Constraint Notice:</strong> {data.rangeLimitation}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: <Zap size={14}/>, label: 'Peak Power', val: data.specifications.peakPowerKw + ' kW' },
              { icon: <Activity size={14}/>, label: 'Peak Torque', val: data.specifications.peakTorqueNm + ' Nm' },
              { icon: <BarChart3 size={14}/>, label: 'Max RPM', val: data.specifications.maxRpm },
              { icon: <Thermometer size={14}/>, label: 'Cooling', val: data.thermal.coolingMethod }
            ].map((item, i) => (
              <div key={i} className="stat-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{item.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 className="section-title"><Ruler size={16}/> PHYSICAL DIMENSIONS</h3>
              <div className="specs-list">
                {[
                  { l: 'Stator Diameter', v: data.dimensions.statorDiameter },
                  { l: 'Rotor Length', v: data.dimensions.rotorLength },
                  { l: 'Overall Length', v: data.dimensions.overallLength },
                  { l: 'Air Gap', v: data.dimensions.airGap },
                  { l: 'Pole/Slot Combo', v: `${data.dimensions.slots}S / ${data.dimensions.poles}P` }
                ].map((it, idx) => (
                  <div key={idx} className="spec-row"><span>{it.l}</span><strong>{it.v}</strong></div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="section-title"><Zap size={16}/> ELECTRICAL SPECS</h3>
              <div className="specs-list">
                {[
                  { l: 'Phase Current', v: data.electrical.phaseCurrent },
                  { l: 'Stator Resistance', v: data.electrical.statorResistance },
                  { l: 'd-q Inductance', v: data.electrical.dqInductance },
                  { l: 'Back EMF Const.', v: data.electrical.backEmfConstant },
                  { l: 'Switching Freq.', v: data.electrical.switchingFreq || '16 kHz' }
                ].map((it, idx) => (
                  <div key={idx} className="spec-row"><span>{it.l}</span><strong>{it.v}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: PERFORMANCE CURVES */}
        <div className="new-page pdf-page-wrapper" style={{ marginTop: '3rem' }}>
          <h3 className="section-title" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <Activity size={20} color="var(--accent-purple)"/> PERFORMANCE CHARACTERISTICS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="chart-container">
              <h4 className="chart-label">Efficiency vs. Speed Profile</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                    <YAxis stroke="#00d2ff" fontSize={11} domain={[0, 105]} />
                    <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={4} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-container">
              <h4 className="chart-label">Torque vs. Speed Characteristics</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                    <YAxis stroke="#ff9f43" fontSize={11} />
                    <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={4} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="ui-only" style={{ marginTop: '2rem' }}>
             <button onClick={() => setShowCrossSection(!showCrossSection)} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 800 }}>
                {showCrossSection ? 'HIDE ASSEMBLY VIEW' : 'VIEW INTERACTIVE ASSEMBLY'}
             </button>
             {showCrossSection && <div style={{ marginTop: '1.5rem' }}><MotorCrossSection data={data} /></div>}
          </div>
        </div>

        {/* PAGE 3: ENGINEERING BLUEPRINT (PDF ONLY) */}
        <div className="new-page blueprint-pdf-section">
          <div className="blueprint-container">
            <h2 className="blueprint-header">Technical Appendix: Engineering Assembly Blueprint</h2>
            <div className="blueprint-svg-wrapper">
              <MotorCrossSection data={data} isPdfMode={true} />
            </div>
            <div className="blueprint-footer-table">
              <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase' }}>Validated Parameters</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '10pt' }}>
                 <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
                 <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
                 <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
                 <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
                 <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
                 <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
              </div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '8pt', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
              © MOTOR_MORPH AI ENGINEERING | GENERATED ON {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .section-title { font-size: 1rem; margin-bottom: 1.2rem; display: flex; alignItems: center; gap: 0.5rem; }
        .spec-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .spec-row span { color: var(--text-secondary); font-size: 0.85rem; }
        .spec-row strong { font-size: 0.9rem; }
        .chart-container { background: rgba(255,255,255,0.01); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--glass-border); }
        .chart-label { margin-bottom: 1rem; font-size: 0.9rem; color: #fff; text-transform: uppercase; text-align: center; }
        
        .blueprint-pdf-section { display: none; }

        .pdf-export-mode { background: #fff !important; width: 210mm !important; padding: 0 !important; }
        .pdf-export-mode .main-report-container { background: #fff !important; padding: 15mm !important; box-shadow: none !important; width: 100% !important; border: none !important; }
        .pdf-export-mode .ui-only { display: none !important; }
        .pdf-export-mode .blueprint-pdf-section { display: block !important; padding-top: 10mm; }
        .pdf-export-mode .pdf-page-wrapper { color: #000 !important; }
        .pdf-export-mode .stat-card { background: #fff !important; border: 1px solid #000 !important; color: #000 !important; }
        .pdf-export-mode h2, .pdf-export-mode h3, .pdf-export-mode h4 { color: #000 !important; border-bottom: 2px solid #000 !important; }
        .pdf-export-mode strong, .pdf-export-mode span { color: #000 !important; }
        .pdf-export-mode .spec-row { border-bottom: 1px solid #eee !important; }
        .pdf-export-mode .chart-container { background: #fff !important; border: 1px solid #ccc !important; }
        .pdf-export-mode .chart-label { color: #000 !important; }
        
        /* Blueprint Specific Styles */
        .blueprint-container { border: 3px solid #000; padding: 15px; background: #fff; color: #000; height: 260mm; display: flex; flexDirection: column; }
        .blueprint-header { text-align: center; margin-bottom: 1rem; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 10px; font-size: 16pt !important; }
        .blueprint-svg-wrapper { flex: 1; border: 1px solid #000; padding: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .blueprint-svg-wrapper svg { max-height: 100%; width: auto; }
        .blueprint-footer-table { margin-top: 15px; padding: 15px; background: #f0f0f0; border: 2px solid #000; }
        
        .pdf-export-mode .recharts-cartesian-axis-line { stroke: #000 !important; }
        .pdf-export-mode .recharts-text { fill: #000 !important; font-weight: bold !important; }
        .pdf-export-mode .recharts-line-curve { stroke: #000 !important; stroke-width: 3px !important; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
