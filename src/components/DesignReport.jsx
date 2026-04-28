import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Cpu, Thermometer, Maximize, Zap, BarChart3, Activity, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import MotorCrossSection from './MotorCrossSection';

const DesignReport = ({ data, inputs }) => {
  const reportRef = useRef();
  const [showCrossSection, setShowCrossSection] = useState(false);

  const handleDownloadPdf = () => {
    const element = reportRef.current;
    const opt = {
      margin: [8, 10, 8, 10],
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        windowWidth: 1200 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    element.classList.add('pdf-export-mode');
    html2pdf().from(element).set(opt).save().then(() => {
      element.classList.remove('pdf-export-mode');
    });
  };

  if (!data) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Cpu size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <h3>Awaiting Parameters</h3>
          <p>Input vehicle requirements to generate an AI-optimized motor design.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
    >
      <div className="glass-panel" style={{ padding: '2rem', flex: 1 }} ref={reportRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              AI Recommended Architecture
            </h4>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{data.motorType}</h2>
            <div className="justification-box" style={{
              background: 'rgba(0, 210, 255, 0.05)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              borderLeft: '4px solid var(--accent-blue)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              maxWidth: '650px'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '0.4rem' }}>
                  💡 Why This Motor?
                </strong>
                {data.motorSelectionReason}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDownloadPdf} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="pdf-only">
          <h1 style={{ fontSize: '24px', margin: 0, textTransform: 'uppercase' }}>Engineering Design Report</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {inputs && (
          <div className="inputs-section" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Input Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Vehicle Type</span> <strong>{inputs.vehicleType}</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Vehicle Weight</span> <strong>{inputs.vehicleWeight} kg</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Target Speed</span> <strong>{inputs.targetSpeed} km/h</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>System Voltage</span> <strong>{inputs.voltage} V</strong></div>
            </div>
          </div>
        )}

        {data.rangeLimitation && (
          <div style={{ background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#ffb3b3' }}>
            <strong>Constraint Notice:</strong> {data.rangeLimitation}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="stat-card">
            <span className="stat-label"><Zap size={14} style={{display:'inline', marginRight:'4px'}}/> Peak Power</span>
            <span className="stat-value">{data.specifications.peakPowerKw} kW</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><Activity size={14} style={{display:'inline', marginRight:'4px'}}/> Peak Torque</span>
            <span className="stat-value">{data.specifications.peakTorqueNm} Nm</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><BarChart3 size={14} style={{display:'inline', marginRight:'4px'}}/> Max RPM</span>
            <span className="stat-value">{data.specifications.maxRpm}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><Thermometer size={14} style={{display:'inline', marginRight:'4px'}}/> Cooling</span>
            <span className="stat-value">{data.thermal.coolingMethod || 'Air Cooling'}</span>
          </div>
        </div>

        {/* Accuracy Banner */}
        <div className="accuracy-banner" style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(0, 210, 255, 0.06)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem'
        }}>
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="6"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#00d2ff" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(data.accuracy.score / 100) * 163.4} 163.4`} transform="rotate(-90 32 32)"/>
            </svg>
            <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'0.85rem', fontWeight:700, color: '#00d2ff' }}>{data.accuracy.score}%</span>
          </div>
          <div>
            <p style={{ margin:0, fontWeight:700, fontSize:'1rem' }}>Prediction Accuracy: <span style={{ color: '#00d2ff' }}>{data.accuracy.score}%</span></p>
            <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>{data.accuracy.note}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Maximize size={18} color="var(--accent-purple)"/> Physical Dimensions</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Stator Diameter</span><strong>{data.dimensions.statorDiameter}</strong></li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Rotor Length</span><strong>{data.dimensions.rotorLength}</strong></li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Overall Length</span><strong>{data.dimensions.overallLength}</strong></li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Pole/Slot Combo</span><strong>{data.dimensions.slots}S / {data.dimensions.poles}P</strong></li>
            </ul>
          </div>
          
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18} color="var(--accent-purple)"/> Electrical Specs</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Switching Device</span><strong style={{ color: '#fff' }}>{data.electrical.switchingDevice}</strong></li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Stator Resistance</span><strong>{data.electrical.statorResistance}</strong></li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Torque Density</span><strong style={{ color: '#fff' }}>{data.mechanical.maxTorqueDensity}</strong></li>
            </ul>
          </div>
        </div>

        {/* Engineering Visualization UI Toggle */}
        <div className="ui-only-diagram-toggle" style={{ marginTop: '2.5rem', marginBottom: '1rem', padding: '1.5rem', background: 'rgba(0, 210, 255, 0.03)', border: '1px solid rgba(0, 210, 255, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Live Design Preview</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle interactive CAD-style cross-section view</p>
          </div>
          <button onClick={() => setShowCrossSection(!showCrossSection)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', background: showCrossSection ? 'var(--accent-blue)' : 'transparent', color: showCrossSection ? '#000' : 'var(--accent-blue)', border: `2px solid var(--accent-blue)`, fontWeight: 'bold' }}>
            <Settings size={18} />
            {showCrossSection ? 'HIDE PREVIEW' : 'VIEW ASSEMBLY'}
          </button>
        </div>

        {showCrossSection && (
          <div className="ui-only-diagram" style={{ marginTop: '1rem' }}>
            <MotorCrossSection data={data} />
          </div>
        )}

        {/* Graphs Section */}
        <div className="pdf-page-break">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--accent-purple)"/> Performance Characteristics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Efficiency Curve</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve}>
                    <XAxis dataKey="rpm" stroke="#a0a0a0" fontSize={10} />
                    <YAxis stroke="#00d2ff" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Torque Curve</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve}>
                    <XAxis dataKey="rpm" stroke="#a0a0a0" fontSize={10} />
                    <YAxis stroke="#3a7bd5" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="torque" stroke="#3a7bd5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── PDF-only Dedicated Blueprint Page (LAST PAGE) ── */}
        <div className="pdf-only-blueprint-page">
          <div style={{ pageBreakBefore: 'always', height: '10mm' }}></div>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#000', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            Technical Appendix: Engineering Assembly Blueprint
          </h2>
          <div className="blueprint-print-container" style={{ background: '#fff', padding: '20px', border: '4px solid #000' }}>
            <MotorCrossSection data={data} isPdfMode={true} />
          </div>
          <div style={{ marginTop: '2rem', padding: '15px', background: '#f9f9f9', border: '2px solid #000' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#000', textTransform: 'uppercase' }}>Validated Engineering Parameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '12px', color: '#000' }}>
               <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
               <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
               <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
               <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
               <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
               <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
            </div>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '10px', textAlign: 'center', color: '#000', fontWeight: 'bold' }}>
            © MOTOR_MORPH AI ENGINEERING | DESIGN VALIDATED FOR {inputs?.vehicleType?.toUpperCase() || 'GENERAL'} CLASS
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .pdf-only { display: none; }
        .pdf-only-blueprint-page { display: none; }

        .pdf-export-mode .ui-only-diagram-toggle, 
        .pdf-export-mode .ui-only-diagram { display: none !important; }

        .pdf-export-mode .pdf-only-blueprint-page {
          display: block !important;
          page-break-before: always !important;
          background: #ffffff !important;
          color: #000000 !important;
          width: 100% !important;
        }

        .pdf-export-mode {
          background: #ffffff !important;
          color: #000000 !important;
          padding: 10mm !important;
          width: 100% !important;
        }
        
        .pdf-export-mode .glass-panel { background: #fff !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .pdf-export-mode .pdf-only { display: block; border-bottom: 3px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
        .pdf-export-mode .stat-card { border: 2px solid #000 !important; background: #fff !important; margin-bottom: 10px !important; color: #000 !important; }
        .pdf-export-mode .stat-value, .pdf-export-mode .stat-label { color: #000 !important; opacity: 1 !important; }
        .pdf-export-mode h2, .pdf-export-mode h3, .pdf-export-mode h4 { color: #000 !important; border-bottom: 2px solid #000 !important; }
        .pdf-export-mode strong { color: #000 !important; }
        .pdf-export-mode span { color: #333 !important; }
        
        /* Chart Overrides */
        .pdf-export-mode .recharts-cartesian-axis-line { stroke: #000 !important; stroke-width: 2px !important; }
        .pdf-export-mode .recharts-text { fill: #000 !important; font-weight: bold !important; }
        .pdf-export-mode .recharts-line-curve { stroke: #000 !important; stroke-width: 3px !important; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
