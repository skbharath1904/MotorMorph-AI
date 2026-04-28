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
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
      <div className="report-root-container" ref={reportRef}>
        
        {/* ── UI DASHBOARD (Hidden in PDF) ── */}
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
            <button onClick={handleDownloadPdf} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Export PDF
            </button>
          </div>

          {/* Stats & Charts in UI */}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="specs-section">
              <h3 className="section-title"><Ruler size={16}/> Physical Dimensions</h3>
              {Object.entries(data.dimensions).map(([k, v], i) => (
                <div key={i} className="spec-row"><span>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span><strong>{v}</strong></div>
              ))}
            </div>
            <div className="specs-section">
              <h3 className="section-title"><Zap size={16}/> Electrical Specs</h3>
              {Object.entries(data.electrical).map(([k, v], i) => (
                <div key={i} className="spec-row"><span>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>

          <div className="ui-visualization" style={{ marginTop: '2rem' }}>
             <button onClick={() => setShowCrossSection(!showCrossSection)} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 800 }}>
                {showCrossSection ? 'HIDE ASSEMBLY VIEW' : 'VIEW INTERACTIVE ASSEMBLY'}
             </button>
             {showCrossSection && <div style={{ marginTop: '1.5rem' }}><MotorCrossSection data={data} /></div>}
          </div>
        </div>

        {/* ── PDF OFFICIAL REPORT (Visible only in PDF) ── */}
        <div className="pdf-only-report">
          
          {/* PAGE 1: TITLE & SUMMARY */}
          <div className="pdf-page">
            <div className="pdf-header-banner">
              <h1 style={{ fontSize: '24pt', fontWeight: 900 }}>MOTOR_MORPH <span style={{ color: '#00d2ff' }}>AI</span></h1>
              <p>OFFICIAL ENGINEERING DESIGN SPECIFICATION REPORT</p>
            </div>

            <div className="pdf-section-box">
              <h2 className="pdf-section-title">01. RECOMMENDED ARCHITECTURE</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20pt', color: '#000' }}>{data.motorType}</h3>
                <div className="pdf-badge">Industry Validated</div>
              </div>
              <p style={{ marginTop: '10px', fontSize: '11pt', fontStyle: 'italic', color: '#333' }}>{data.motorSelectionReason}</p>
            </div>

            <div className="pdf-section-box">
              <h2 className="pdf-section-title">02. INPUT PARAMETERS & PERFORMANCE TARGETS</h2>
              <table className="pdf-table">
                <tbody>
                  <tr>
                    <td><strong>Vehicle Class:</strong> {inputs?.vehicleType}</td>
                    <td><strong>Target Speed:</strong> {inputs?.targetSpeed} km/h</td>
                    <td><strong>Target Range:</strong> {inputs?.range} km</td>
                  </tr>
                  <tr>
                    <td><strong>Vehicle Weight:</strong> {inputs?.vehicleWeight} kg</td>
                    <td><strong>System Voltage:</strong> {inputs?.voltage} V</td>
                    <td><strong>Max Gradient:</strong> {inputs?.maxGradient}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section-box">
              <h2 className="pdf-section-title">03. PRIMARY OUTPUT SPECIFICATIONS</h2>
              <table className="pdf-table-grid">
                <tbody>
                  <tr>
                    <td className="stat-cell">PEAK POWER<br/><span>{data.specifications.peakPowerKw} kW</span></td>
                    <td className="stat-cell">PEAK TORQUE<br/><span>{data.specifications.peakTorqueNm} Nm</span></td>
                    <td className="stat-cell">MAX SPEED<br/><span>{data.specifications.maxRpm} RPM</span></td>
                    <td className="stat-cell">COOLING<br/><span>{data.thermal.coolingMethod}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section-box">
              <h2 className="pdf-section-title">04. PHYSICAL & ELECTRICAL DETAILS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <table className="pdf-table mini">
                  <thead><tr><th colSpan="2">DIMENSIONS</th></tr></thead>
                  <tbody>
                    {Object.entries(data.dimensions).map(([k, v], i) => (
                      <tr key={i}><td>{k.toUpperCase()}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table className="pdf-table mini">
                  <thead><tr><th colSpan="2">ELECTRICAL</th></tr></thead>
                  <tbody>
                    {Object.entries(data.electrical).map(([k, v], i) => (
                      <tr key={i}><td>{k.toUpperCase()}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE 2: CHARTS & MECHANICAL */}
          <div className="pdf-page">
            <div className="pdf-section-box">
              <h2 className="pdf-section-title">05. PERFORMANCE CHARACTERISTICS</h2>
              <div className="pdf-chart-box">
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>EFFICIENCY VS. SPEED PROFILE</h4>
                <div style={{ height: '80mm', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="rpm" stroke="#000" />
                      <YAxis stroke="#000" domain={[0, 100]} />
                      <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="pdf-chart-box" style={{ marginTop: '15px' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>TORQUE VS. SPEED CHARACTERISTICS</h4>
                <div style={{ height: '80mm', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="rpm" stroke="#000" />
                      <YAxis stroke="#000" />
                      <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="pdf-section-box">
              <h2 className="pdf-section-title">06. MECHANICAL & SYSTEM PERFORMANCE</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <table className="pdf-table mini">
                  <thead><tr><th colSpan="2">MECHANICAL</th></tr></thead>
                  <tbody>
                    {Object.entries(data.mechanical).map(([k, v], i) => (
                      <tr key={i}><td>{k.toUpperCase()}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table className="pdf-table mini">
                  <thead><tr><th colSpan="2">SYSTEM</th></tr></thead>
                  <tbody>
                    {Object.entries(data.specifications).slice(0, 6).map(([k, v], i) => (
                      <tr key={i}><td>{k.toUpperCase()}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE 3: TECHNICAL APPENDIX (BLUEPRINT) */}
          <div className="pdf-page">
            <h2 className="pdf-section-title" style={{ textAlign: 'center', fontSize: '18pt' }}>TECHNICAL APPENDIX: ENGINEERING ASSEMBLY BLUEPRINT</h2>
            <div className="pdf-blueprint-frame">
              <MotorCrossSection data={data} isPdfMode={true} />
            </div>
            <div className="pdf-footer-data">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                 <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
                 <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
                 <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
                 <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
                 <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
                 <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
              </div>
            </div>
            <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '2px solid #000', paddingTop: '10px' }}>
              <p style={{ fontWeight: 900 }}>CONFIDENTIAL ENGINEERING DOCUMENT - MOTOR_MORPH AI v2.0</p>
              <p style={{ fontSize: '9pt' }}>Generated on {new Date().toLocaleString()} | Doc ID: MMAI-{Math.floor(Math.random()*90000)+10000}</p>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spec-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .spec-row span { color: var(--text-secondary); font-size: 0.85rem; }
        .spec-row strong { font-size: 0.9rem; }
        .section-title { font-size: 1rem; margin-bottom: 1.2rem; display: flex; alignItems: center; gap: 0.5rem; }
        
        /* ── PDF ONLY STYLES ── */
        .pdf-only-report { display: none; }

        .pdf-export-mode .ui-dashboard { display: none !important; }
        .pdf-export-mode .pdf-only-report { display: block !important; background: #fff !important; width: 210mm !important; }
        
        .pdf-page {
          width: 210mm;
          height: 296mm;
          padding: 15mm;
          background: #fff !important;
          color: #000 !important;
          position: relative;
          box-sizing: border-box;
          page-break-after: always;
        }

        .pdf-header-banner { border-bottom: 4px solid #000; margin-bottom: 15px; padding-bottom: 10px; }
        .pdf-section-box { border: 2px solid #000; padding: 15px; margin-bottom: 15px; }
        .pdf-section-title { background: #000; color: #fff; padding: 5px 10px; font-size: 11pt; margin-bottom: 10px; text-transform: uppercase; }
        
        .pdf-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .pdf-table td { padding: 8px; border: 1px solid #ddd; font-size: 10pt; }
        
        .pdf-table-grid { width: 100%; border-collapse: collapse; }
        .pdf-table-grid td { width: 25%; border: 2px solid #000; padding: 10px; text-align: center; font-weight: bold; }
        .stat-cell { font-size: 9pt; }
        .stat-cell span { font-size: 16pt; display: block; margin-top: 5px; }

        .pdf-table.mini th { background: #f0f0f0; padding: 5px; border: 1px solid #000; font-size: 9pt; }
        .pdf-table.mini td { font-size: 8.5pt; padding: 4px 8px; border: 1px solid #eee; }

        .pdf-badge { border: 2px solid #00d2ff; color: #00d2ff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 10pt; }
        
        .pdf-chart-box { border: 1px solid #000; padding: 10px; background: #fff; }
        .pdf-blueprint-frame { border: 3px solid #000; padding: 15px; height: 180mm; display: flex; align-items: center; justify-content: center; }
        .pdf-footer-data { background: #000; color: #fff; padding: 15px; margin-top: 10px; font-size: 10pt; }

        @media print {
          .pdf-export-mode { width: 210mm !important; }
        }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
