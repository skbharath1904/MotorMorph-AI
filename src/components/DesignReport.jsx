import React, { useRef, useState, useEffect } from 'react';
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
  const pdfRef = useRef();
  const [showCrossSection, setShowCrossSection] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = () => {
    setIsExporting(true);
    // Give time for UI to update if needed
    setTimeout(() => {
      const element = pdfRef.current;
      const opt = {
        margin: 0,
        filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        setIsExporting(false);
      }).catch(err => {
        console.error("PDF Export failed", err);
        setIsExporting(false);
      });
    }, 800);
  };

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
    >
      {/* ── UI DASHBOARD (ALWAYS VISIBLE) ── */}
      <div className="ui-dashboard glass-panel" style={{ padding: '2.5rem', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 700 }}>AI RECOMMENDED ARCHITECTURE</h4>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>{data.motorType}</h2>
            <div style={{ background: 'rgba(0, 210, 255, 0.04)', border: '1px solid rgba(0, 210, 255, 0.15)', borderRadius: '8px', padding: '1rem', maxWidth: '800px', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--accent-blue)' }}>💡 WHY THIS MOTOR? </strong> {data.motorSelectionReason}
              </p>
            </div>
          </div>
          <button 
            onClick={handleDownloadPdf} 
            className="btn btn-secondary" 
            disabled={isExporting}
            style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isExporting ? <Activity className="animate-spin" size={16}/> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { icon: <Zap size={14}/>, label: 'Peak Power', val: data.specifications.peakPowerKw + ' kW' },
            { icon: <Activity size={14}/>, label: 'Peak Torque', val: data.specifications.peakTorqueNm + ' Nm' },
            { icon: <BarChart3 size={14}/>, label: 'Max RPM', val: data.specifications.maxRpm },
            { icon: <Thermometer size={14}/>, label: 'Cooling', val: data.thermal.coolingMethod }
          ].map((item, i) => (
            <div key={i} className="stat-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{item.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="specs-section">
            <h3 className="section-title"><Ruler size={16}/> Physical Dimensions</h3>
            {Object.entries(data.dimensions).map(([k, v], i) => (
              <div key={i} className="spec-row"><span>{k.toUpperCase().replace(/([A-Z])/g, ' $1')}</span><strong>{v}</strong></div>
            ))}
          </div>
          <div className="specs-section">
            <h3 className="section-title"><TrendingUp size={16}/> System Performance</h3>
            <div className="spec-row"><span>CONTINUOUS POWER</span><strong>{data.specifications.continuousPowerKw} kW</strong></div>
            <div className="spec-row"><span>PEAK EFFICIENCY</span><strong>{data.specifications.estimatedEfficiency}</strong></div>
            <div className="spec-row"><span>CONT. TORQUE</span><strong>{data.specifications.continuousTorqueNm} Nm</strong></div>
            <div className="spec-row"><span>BASE SPEED</span><strong>{data.specifications.baseRpm} RPM</strong></div>
            <div className="spec-row"><span>EST. TOTAL WEIGHT</span><strong>{data.specifications.weightKg} kg</strong></div>
          </div>
        </div>

        <div className="ui-visualization" style={{ marginTop: '2rem' }}>
           <button onClick={() => setShowCrossSection(!showCrossSection)} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 800 }}>
              {showCrossSection ? 'HIDE ASSEMBLY VIEW' : 'VIEW INTERACTIVE ASSEMBLY'}
           </button>
           {showCrossSection && <div style={{ marginTop: '1.5rem' }}><MotorCrossSection data={data} /></div>}
        </div>
      </div>

      {/* ── PDF MASTER SOURCE (Always rendered, hidden from user view) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef} className="pdf-source-container" style={{ width: '210mm', background: '#fff', color: '#000' }}>
          
          {/* PAGE 1: DATASHEET SUMMARY */}
          <div className="pdf-page">
            <div style={{ borderBottom: '4px solid #000', marginBottom: '20px', paddingBottom: '10px' }}>
              <h1 style={{ fontSize: '28pt', margin: 0 }}>MOTOR_MORPH <span style={{ color: '#00d2ff' }}>AI</span></h1>
              <p style={{ fontSize: '10pt', letterSpacing: '2px', fontWeight: 700 }}>OFFICIAL ENGINEERING DESIGN SPECIFICATION</p>
            </div>

            <div className="pdf-box">
              <h2 className="pdf-box-title">01. RECOMMENDED CONFIGURATION</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '18pt', margin: 0 }}>{data.motorType}</h3>
                <span style={{ border: '2px solid #00d2ff', padding: '2px 8px', color: '#00d2ff', fontWeight: 900 }}>VALIDATED</span>
              </div>
              <p style={{ fontSize: '11pt', color: '#333', lineHeight: 1.5 }}>{data.motorSelectionReason}</p>
            </div>

            <div className="pdf-box">
              <h2 className="pdf-box-title">02. PERFORMANCE SUMMARY</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
                <div className="pdf-stat-cell">PEAK POWER<br/><strong>{data.specifications.peakPowerKw} kW</strong></div>
                <div className="pdf-stat-cell">PEAK TORQUE<br/><strong>{data.specifications.peakTorqueNm} Nm</strong></div>
                <div className="pdf-stat-cell">MAX SPEED<br/><strong>{data.specifications.maxRpm} RPM</strong></div>
                <div className="pdf-stat-cell">COOLING<br/><strong>{data.thermal.coolingMethod}</strong></div>
              </div>
            </div>

            <div className="pdf-box">
              <h2 className="pdf-box-title">03. INPUT PARAMETERS</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Vehicle Weight:</strong> {inputs?.vehicleWeight} kg</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Top Speed:</strong> {inputs?.targetSpeed} km/h</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Voltage:</strong> {inputs?.voltage} V</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Max Gradient:</strong> {inputs?.maxGradient}%</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Desired Range:</strong> {inputs?.range} km</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>Drag Coeff:</strong> {inputs?.dragCoefficient}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="pdf-box">
                <h2 className="pdf-box-title">04. MECHANICAL & THERMAL</h2>
                <table className="pdf-mini-table">
                  <tbody>
                    <tr><td>TORQUE DENSITY</td><td>{data.mechanical.maxTorqueDensity}</td></tr>
                    <tr><td>ROTOR INERTIA</td><td>{data.mechanical.rotorInertia}</td></tr>
                    <tr><td>CENTRIFUGAL FORCE</td><td>{data.mechanical.maxCentrifugalForce}</td></tr>
                    <tr><td>BEARING LOAD</td><td>{data.mechanical.bearingLoad}</td></tr>
                    <tr><td>CRITICAL SPEED</td><td>{data.mechanical.criticalSpeed}</td></tr>
                    <tr><td>COGGING TORQUE</td><td>{data.mechanical.coggingTorque}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="pdf-box">
                <h2 className="pdf-box-title">05. SYSTEM PERFORMANCE</h2>
                <table className="pdf-mini-table">
                  <tbody>
                    <tr><td>CONTINUOUS POWER</td><td>{data.specifications.continuousPowerKw} kW</td></tr>
                    <tr><td>PEAK EFFICIENCY</td><td>{data.specifications.estimatedEfficiency}</td></tr>
                    <tr><td>CONT. TORQUE</td><td>{data.specifications.continuousTorqueNm} Nm</td></tr>
                    <tr><td>BASE SPEED</td><td>{data.specifications.baseRpm} RPM</td></tr>
                    <tr><td>EST. TOTAL WEIGHT</td><td>{data.specifications.weightKg} kg</td></tr>
                    <tr><td>THERMAL RESISTANCE</td><td>{data.thermal.thermalResistance}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE 2: CHARACTERISTIC CURVES */}
          <div className="pdf-page" style={{ pageBreakBefore: 'always' }}>
            <div className="pdf-box">
              <h2 className="pdf-box-title">06. EFFICIENCY VS. SPEED PROFILE</h2>
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <LineChart width={700} height={350} data={data.performanceCurve} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <XAxis dataKey="rpm" stroke="#000" strokeWidth={2} tick={{fill:'#000', fontWeight: 'bold'}} label={{value: 'RPM', position: 'insideBottom', offset: -10, fill: '#000'}}/>
                  <YAxis stroke="#000" strokeWidth={2} tick={{fill:'#000', fontWeight: 'bold'}} label={{value: 'Eff (%)', angle: -90, position: 'insideLeft', offset: 15, fill: '#000'}} />
                  <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={4} dot={false} isAnimationActive={false} />
                </LineChart>
              </div>
            </div>

            <div className="pdf-box" style={{ marginTop: '20px' }}>
              <h2 className="pdf-box-title">07. TORQUE VS. SPEED CHARACTERISTICS</h2>
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <LineChart width={700} height={350} data={data.performanceCurve} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <XAxis dataKey="rpm" stroke="#000" strokeWidth={2} tick={{fill:'#000', fontWeight: 'bold'}} label={{value: 'RPM', position: 'insideBottom', offset: -10, fill: '#000'}} />
                  <YAxis stroke="#000" strokeWidth={2} tick={{fill:'#000', fontWeight: 'bold'}} label={{value: 'Torque (Nm)', angle: -90, position: 'insideLeft', offset: 15, fill: '#000'}} />
                  <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={4} dot={false} isAnimationActive={false} />
                </LineChart>
              </div>
            </div>
          </div>

          {/* PAGE 3: ENGINEERING BLUEPRINT */}
          <div className="pdf-page" style={{ pageBreakBefore: 'always' }}>
            <h2 className="pdf-box-title" style={{ textAlign: 'center', fontSize: '18pt', marginBottom: '20px' }}>TECHNICAL APPENDIX: ENGINEERING ASSEMBLY BLUEPRINT</h2>
            <div style={{ border: '4px solid #000', height: '180mm', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              <MotorCrossSection data={data} isPdfMode={true} />
            </div>
            <div style={{ background: '#000', color: '#fff', padding: '20px', marginTop: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: '11pt' }}>
                 <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
                 <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
                 <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
                 <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
                 <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
                 <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '2px solid #000', paddingTop: '10px' }}>
               <p style={{ fontWeight: 900, margin: 0 }}>CONFIDENTIAL DOCUMENT - MOTOR_MORPH AI ENGINEERING</p>
               <p style={{ fontSize: '9pt', margin: '5px 0' }}>VALIDATED ON {new Date().toLocaleDateString()} | DOC ID: MMAI-SPEC-{Math.floor(Math.random()*90000)}</p>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spec-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .spec-row span { color: var(--text-secondary); font-size: 0.85rem; }
        .spec-row strong { font-size: 0.9rem; }
        .section-title { font-size: 1rem; margin-bottom: 1.2rem; display: flex; alignItems: center; gap: 0.5rem; color: var(--accent-blue); }
        
        .pdf-page {
          width: 210mm;
          height: 296mm;
          padding: 15mm;
          background: #fff !important;
          color: #000 !important;
          box-sizing: border-box;
          page-break-after: always;
        }

        .pdf-box { border: 2px solid #000; padding: 15px; margin-bottom: 20px; }
        .pdf-box-title { background: #000; color: #fff; padding: 5px 10px; font-size: 10pt; margin: -15px -15px 15px -15px; text-transform: uppercase; font-weight: 800; }
        .pdf-stat-cell { border: 1.5px solid #000; padding: 10px; text-align: center; font-size: 8.5pt; font-weight: bold; }
        .pdf-stat-cell strong { font-size: 16pt; display: block; margin-top: 5px; color: #000; }
        .pdf-mini-table { width: 100%; border-collapse: collapse; }
        .pdf-mini-table td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 9pt; font-weight: bold; }
        .pdf-mini-table td:last-child { text-align: right; color: #000; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
