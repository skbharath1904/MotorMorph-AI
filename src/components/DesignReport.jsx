import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, Cpu, Thermometer, Maximize, Zap, BarChart3, Activity, 
  Settings, Shield, Ruler, Box, Gauge, Weight, Wind, Square, 
  CircleDashed, Clock, TrendingUp
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
      margin: [0, 0, 0, 0], // Strict control via CSS
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
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
      <div className="glass-panel" style={{ padding: '2.5rem', flex: 1, background: 'var(--card-bg)' }} ref={reportRef}>
        
        <div className="pdf-page-container">
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                AI RECOMMENDED ARCHITECTURE
              </h4>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>{data.motorType}</h2>
              
              <div className="justification-box" style={{
                background: 'rgba(0, 210, 255, 0.04)',
                border: '1px solid rgba(0, 210, 255, 0.15)',
                borderRadius: '8px',
                padding: '1rem',
                maxWidth: '750px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                    💡 Why This Motor?
                  </span>
                  {data.motorSelectionReason}
                </p>
              </div>
            </div>
            
            <button onClick={handleDownloadPdf} className="btn btn-secondary ui-only" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--glass-border)' }}>
              <Download size={16} />
              Export PDF
            </button>
          </div>

          {/* Input Parameters Grid */}
          <div className="report-section" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>Input Parameters</h3>
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', 
              background: 'rgba(255,255,255,0.02)', padding: '1.2rem', 
              borderRadius: '12px', border: '1px solid var(--glass-border)'
            }}>
              {[
                { l: 'Vehicle Type', v: inputs?.vehicleType },
                { l: 'Vehicle Weight', v: inputs?.vehicleWeight + ' kg' },
                { l: 'Target Speed', v: inputs?.targetSpeed + ' km/h' },
                { l: 'Desired Range', v: inputs?.range + ' km' },
                { l: 'System Voltage', v: inputs?.voltage + ' V' },
                { l: 'Drag Coeff (Cd)', v: inputs?.dragCoefficient },
                { l: 'Frontal Area', v: inputs?.frontalArea + ' m²' },
                { l: 'Rolling Resistance', v: inputs?.rollingResistance }
              ].map((item, i) => (
                <div key={i} className="input-item">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>{item.l}</span>
                  <strong style={{ fontSize: '0.9rem' }}>{item.v}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Constraint Notice */}
          {data.rangeLimitation && (
            <div style={{ 
              background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.2)', 
              padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', 
              color: '#ff9a9a', fontSize: '0.85rem'
            }}>
              <strong style={{ color: '#ff6b6b' }}>Constraint Notice:</strong> {data.rangeLimitation}
            </div>
          )}

          {/* Primary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: <Zap size={14}/>, label: 'Peak Power', val: data.specifications.peakPowerKw + ' kW' },
              { icon: <Activity size={14}/>, label: 'Peak Torque', val: data.specifications.peakTorqueNm + ' Nm' },
              { icon: <BarChart3 size={14}/>, label: 'Max RPM', val: data.specifications.maxRpm },
              { icon: <Thermometer size={14}/>, label: 'Cooling', val: data.thermal.coolingMethod }
            ].map((item, i) => (
              <div key={i} className="stat-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  {item.icon} {item.label}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* Accuracy Score */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.15)',
            borderRadius: '12px', padding: '1rem', marginBottom: '2rem'
          }}>
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
              <svg width="48" height="48" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="5"/>
                <circle cx="28" cy="28" r="24" fill="none" stroke="#00d2ff" strokeWidth="5" strokeDasharray={`${(data.accuracy.score / 100) * 150.8} 150.8`} transform="rotate(-90 28 28)"/>
              </svg>
              <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'0.8rem', fontWeight:800, color: '#00d2ff' }}>{data.accuracy.score}%</span>
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:'1rem' }}>Prediction Accuracy: <span style={{ color: '#00d2ff' }}>{data.accuracy.score}%</span></p>
              <p style={{ margin:'2px 0 0', fontSize:'0.8rem', color:'var(--text-secondary)' }}>{data.accuracy.note}</p>
            </div>
          </div>
        </div>

        {/* Detailed Specs Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {[
            { title: 'Physical Dimensions', icon: <Ruler size={16}/>, color: 'var(--accent-purple)', items: [
              { l: 'Stator Diameter', v: data.dimensions.statorDiameter },
              { l: 'Rotor Length', v: data.dimensions.rotorLength },
              { l: 'Overall Length', v: data.dimensions.overallLength },
              { l: 'Air Gap', v: data.dimensions.airGap },
              { l: 'Pole/Slot Combo', v: `${data.dimensions.slots}S / ${data.dimensions.poles}P` }
            ]},
            { title: 'Electrical Specs', icon: <Zap size={16}/>, color: 'var(--accent-purple)', items: [
              { l: 'Operating Voltage', v: data.specifications.operatingVoltage + 'V' },
              { l: 'Phase Current', v: data.electrical.phaseCurrent },
              { l: 'Stator Resistance', v: data.electrical.statorResistance },
              { l: 'd-q Inductance', v: data.electrical.dqInductance },
              { l: 'Back EMF Const.', v: data.electrical.backEmfConstant },
              { l: 'Switching Freq.', v: data.electrical.switchingFreq },
              { l: 'Winding Type', v: data.electrical.windingType }
            ]},
            { title: 'Mechanical & Thermal', icon: <Settings size={16}/>, color: 'var(--accent-purple)', items: [
              { l: 'Torque Density', v: data.mechanical.maxTorqueDensity },
              { l: 'Rotor Inertia', v: data.mechanical.rotorInertia },
              { l: 'Centrifugal Force', v: data.mechanical.maxCentrifugalForce },
              { l: 'Bearing Load', v: data.mechanical.bearingLoad },
              { l: 'Critical Speed', v: data.mechanical.criticalSpeed },
              { l: 'Cogging Torque', v: data.mechanical.coggingTorque }
            ]},
            { title: 'System Performance', icon: <TrendingUp size={16}/>, color: 'var(--accent-purple)', items: [
              { l: 'Continuous Power', v: data.specifications.continuousPowerKw + ' kW' },
              { l: 'Peak Efficiency', v: data.specifications.estimatedEfficiency },
              { l: 'Cont. Torque', v: data.specifications.continuousTorqueNm + ' Nm' },
              { l: 'Base Speed', v: data.specifications.baseRpm + ' RPM' },
              { l: 'Est. Total Weight', v: data.specifications.weightKg + ' kg' }
            ]}
          ].map((sec, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: sec.color }}>
                {sec.icon} {sec.title}
              </h3>
              <div className="specs-list">
                {sec.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.l}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{item.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Thermal Management Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Thermometer size={18} /> Thermal Management
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { l: 'Primary Cooling', v: data.thermal.coolingMethod },
              { l: 'Max Coil Temp', v: data.thermal.maxCoilTemp },
              { l: 'Coolant Flow', v: data.thermal.coolantFlowRate },
              { l: 'Thermal Resistance', v: data.thermal.thermalResistance }
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>{item.l}</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{item.v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Live Design Preview UI Only */}
        <div className="ui-only">
          <div className="ui-only-diagram-toggle" style={{ 
            marginTop: '2rem', marginBottom: '1rem', padding: '1.2rem', 
            background: 'rgba(0, 210, 255, 0.03)', border: '1px solid rgba(0, 210, 255, 0.1)', 
            borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <div>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>Live Design Preview</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toggle interactive CAD-style cross-section view</p>
            </div>
            <button onClick={() => setShowCrossSection(!showCrossSection)} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {showCrossSection ? 'HIDE PREVIEW' : 'VIEW ASSEMBLY'}
            </button>
          </div>
          {showCrossSection && (
            <div className="ui-only-diagram" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              <MotorCrossSection data={data} />
            </div>
          )}
        </div>

        {/* Performance Characteristics Section */}
        <div className="pdf-page-break" style={{ pageBreakBefore: 'always' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <Activity size={20} color="var(--accent-purple)"/> Performance Characteristics
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Efficiency Chart */}
            <div className="chart-container" style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>Efficiency vs. Speed Profile</h4>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                    <YAxis stroke="#00d2ff" fontSize={11} domain={[0, 100]} label={{ value: 'Eff (%)', angle: -90, position: 'insideLeft', offset: 15, fill: '#00d2ff' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={4} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Torque Chart */}
            <div className="pdf-page-break chart-container" style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>Torque vs. Speed Characteristics</h4>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <XAxis dataKey="rpm" stroke="#888" fontSize={11} label={{ value: 'RPM', position: 'insideBottom', offset: -10, fill: '#888' }} />
                    <YAxis stroke="#ff9f43" fontSize={11} label={{ value: 'Torque (Nm)', angle: -90, position: 'insideLeft', offset: 15, fill: '#ff9f43' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={4} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Engineering Blueprint Page (PDF ONLY) ── */}
        <div className="blueprint-pdf-page" style={{ pageBreakBefore: 'always', padding: '10mm 0' }}>
          <div className="pdf-page-container" style={{ border: '4px solid #000', padding: '15px', background: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', color: '#000', borderBottom: '3px solid #000', paddingBottom: '10px', fontSize: '18pt' }}>
              Technical Appendix: Engineering Assembly Blueprint
            </h2>
            
            {/* The Drawing - Forced to stay with heading */}
            <div className="blueprint-drawing-box" style={{ border: '2px solid #000', padding: '10px', marginBottom: '15px', background: '#fff' }}>
              <MotorCrossSection data={data} isPdfMode={true} />
            </div>

            {/* Parameters Table - Forced to stay on same page if possible */}
            <div style={{ marginTop: '10px', padding: '15px', background: '#f5f5f5', border: '2px solid #000' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#000', textTransform: 'uppercase', fontSize: '14pt' }}>Validated Engineering Parameters</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '11pt', color: '#000' }}>
                 <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
                 <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
                 <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
                 <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
                 <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
                 <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
              </div>
            </div>
            
            <p style={{ marginTop: '1.5rem', fontSize: '9pt', textAlign: 'center', color: '#000', fontWeight: 'bold' }}>
              © MOTOR_MORPH AI ENGINEERING | DESIGN VALIDATED BY PHYSICS ENGINE
            </p>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .ui-only { display: block; }
        .blueprint-pdf-page { display: none; }

        @media print {
          .ui-only { display: none !important; }
        }

        .pdf-export-mode .ui-only { display: none !important; }
        
        .pdf-export-mode .blueprint-pdf-page { 
          display: block !important; 
          background: #fff !important;
          width: 100% !important;
        }

        .pdf-export-mode {
          background: #fff !important;
          color: #000 !important;
          width: 210mm !important;
          padding: 10mm !important;
        }

        .pdf-export-mode .glass-panel { 
          background: #fff !important; 
          border: none !important; 
          box-shadow: none !important; 
          padding: 0 !important;
          width: 100% !important;
        }

        .pdf-export-mode .stat-card { 
          background: #fff !important; 
          border: 1px solid #000 !important; 
          color: #000 !important;
        }

        .pdf-export-mode .report-section div {
          background: #f9f9f9 !important;
          border: 1px solid #ddd !important;
          color: #000 !important;
        }

        .pdf-export-mode h2, .pdf-export-mode h3, .pdf-export-mode h4 { 
          color: #000 !important; 
          border-bottom: 2px solid #000 !important; 
        }

        .pdf-export-mode strong, .pdf-export-mode span { color: #000 !important; }
        .pdf-export-mode .specs-list div { border-bottom: 1px solid #eee !important; }

        .pdf-export-mode .chart-container {
          background: #fff !important;
          border: 1px solid #ccc !important;
          page-break-inside: avoid !important;
        }

        .pdf-export-mode .recharts-cartesian-axis-line { stroke: #000 !important; }
        .pdf-export-mode .recharts-text { fill: #000 !important; font-weight: bold !important; }
        .pdf-export-mode .recharts-line-curve { stroke: #000 !important; stroke-width: 3px !important; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
