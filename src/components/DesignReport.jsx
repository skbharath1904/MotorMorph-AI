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
      margin: [5, 10, 5, 10],
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, windowWidth: 1200 },
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
              marginBottom: '2rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                  💡 Why This Motor?
                </span>
                {data.motorSelectionReason}
              </p>
            </div>
          </div>
          
          <button onClick={handleDownloadPdf} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--glass-border)' }}>
            <Download size={16} />
            Export PDF
          </button>
        </div>

        {/* Input Parameters Table Style */}
        <div className="report-section" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            Input Parameters
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '1.5rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1.5rem', 
            borderRadius: '12px',
            border: '1px solid var(--glass-border)'
          }}>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Vehicle Type</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.vehicleType}</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Vehicle Weight</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.vehicleWeight} kg</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Target Speed</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.targetSpeed} km/h</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Desired Range</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.range} km</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>System Voltage</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.voltage} V</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Drag Coeff (Cd)</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.dragCoefficient}</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Frontal Area</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.frontalArea} m²</strong>
            </div>
            <div className="input-item">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Rolling Resistance</span>
              <strong style={{ fontSize: '1rem' }}>{inputs?.rollingResistance}</strong>
            </div>
          </div>
        </div>

        {/* Constraint Notice - Image Style */}
        {data.rangeLimitation && (
          <div style={{ 
            background: 'rgba(255, 60, 60, 0.08)', 
            border: '1px solid rgba(255, 60, 60, 0.2)', 
            padding: '1.2rem', 
            borderRadius: '10px', 
            marginBottom: '2rem', 
            color: '#ff9a9a',
            fontSize: '0.9rem',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#ff6b6b' }}>Constraint Notice:</strong> {data.rangeLimitation}
          </div>
        )}

        {/* Primary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Zap size={14} /> Peak Power
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{data.specifications.peakPowerKw} kW</span>
          </div>
          <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Activity size={14} /> Peak Torque
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{data.specifications.peakTorqueNm} Nm</span>
          </div>
          <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <BarChart3 size={14} /> Max RPM
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{data.specifications.maxRpm}</span>
          </div>
          <div className="stat-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Thermometer size={14} /> Cooling
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'block' }}>{data.thermal.coolingMethod}</span>
          </div>
        </div>

        {/* Accuracy Score */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.15)',
          borderRadius: '12px', padding: '1.25rem', marginBottom: '2.5rem'
        }}>
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="5"/>
              <circle cx="28" cy="28" r="24" fill="none" stroke="#00d2ff" strokeWidth="5" strokeDasharray={`${(data.accuracy.score / 100) * 150.8} 150.8`} transform="rotate(-90 28 28)"/>
            </svg>
            <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'0.9rem', fontWeight:800, color: '#00d2ff' }}>{data.accuracy.score}%</span>
          </div>
          <div>
            <p style={{ margin:0, fontWeight:800, fontSize:'1.05rem' }}>Prediction Accuracy: <span style={{ color: '#00d2ff' }}>{data.accuracy.score}%</span></p>
            <p style={{ margin:'4px 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>{data.accuracy.note}</p>
          </div>
        </div>

        {/* Detailed Specs Grids - Exactly as in image */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
          
          {/* Physical Dimensions */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-purple)' }}>
              <Ruler size={18} /> Physical Dimensions
            </h3>
            <div className="specs-list">
              {[
                { l: 'Stator Diameter', v: data.dimensions.statorDiameter },
                { l: 'Rotor Length', v: data.dimensions.rotorLength },
                { l: 'Overall Length', v: data.dimensions.overallLength },
                { l: 'Air Gap', v: data.dimensions.airGap },
                { l: 'Pole/Slot Combo', v: `${data.dimensions.slots}S / ${data.dimensions.poles}P` }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.l}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{item.v}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Electrical Specs */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-purple)' }}>
              <Zap size={18} /> Electrical Specs
            </h3>
            <div className="specs-list">
              {[
                { l: 'Operating Voltage', v: data.specifications.operatingVoltage + 'V' },
                { l: 'Phase Current', v: data.electrical.phaseCurrent },
                { l: 'Stator Resistance', v: data.electrical.statorResistance },
                { l: 'd-q Inductance', v: data.electrical.dqInductance },
                { l: 'Back EMF Const.', v: data.electrical.backEmfConstant },
                { l: 'Switching Freq.', v: data.electrical.switchingFreq },
                { l: 'Winding Type', v: data.electrical.windingType }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.l}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{item.v}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Mechanical & Thermal */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-purple)' }}>
              <Settings size={18} /> Mechanical & Thermal
            </h3>
            <div className="specs-list">
              {[
                { l: 'Torque Density', v: data.mechanical.maxTorqueDensity },
                { l: 'Rotor Inertia', v: data.mechanical.rotorInertia },
                { l: 'Centrifugal Force', v: data.mechanical.maxCentrifugalForce },
                { l: 'Bearing Load', v: data.mechanical.bearingLoad },
                { l: 'Critical Speed', v: data.mechanical.criticalSpeed },
                { l: 'Cogging Torque', v: data.mechanical.coggingTorque }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.l}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{item.v}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* System Performance */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-purple)' }}>
              <TrendingUp size={18} /> System Performance
            </h3>
            <div className="specs-list">
              {[
                { l: 'Continuous Power', v: data.specifications.continuousPowerKw + ' kW' },
                { l: 'Peak Efficiency', v: data.specifications.estimatedEfficiency },
                { l: 'Cont. Torque', v: data.specifications.continuousTorqueNm + ' Nm' },
                { l: 'Base Speed', v: data.specifications.baseRpm + ' RPM' },
                { l: 'Est. Total Weight', v: data.specifications.weightKg + ' kg' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.l}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{item.v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thermal Management Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>{item.l}</span>
                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{item.v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ── Engineering Visualization UI Toggle ── */}
        <div className="ui-only-diagram-toggle" style={{ 
          marginTop: '2.5rem', 
          marginBottom: '1rem', 
          padding: '1.5rem', 
          background: 'rgba(0, 210, 255, 0.03)', 
          border: '1px solid rgba(0, 210, 255, 0.1)', 
          borderRadius: '12px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
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
          <div className="ui-only-diagram" style={{ marginTop: '1rem', marginBottom: '2.5rem' }}>
            <MotorCrossSection data={data} />
          </div>
        )}

        {/* Performance Characteristics Section */}
        <div className="pdf-page-break">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--accent-purple)"/> Performance Characteristics
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Efficiency Chart */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Efficiency vs. Speed
              </h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve}>
                    <XAxis dataKey="rpm" stroke="#666" fontSize={10} hide={false} />
                    <YAxis stroke="#00d2ff" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Torque Chart */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Torque vs. Speed
              </h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve}>
                    <XAxis dataKey="rpm" stroke="#666" fontSize={10} />
                    <YAxis stroke="#ff9f43" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="torque" stroke="#ff9f43" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Assembly Blueprint (PDF Only) */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: '12px', color: '#000' }}>
               <div><strong>STATOR BORE:</strong> {data.dimensions.statorDiameter}</div>
               <div><strong>ROTOR LENGTH:</strong> {data.dimensions.rotorLength}</div>
               <div><strong>AIR GAP:</strong> {data.dimensions.airGap}</div>
               <div><strong>POLE COUNT:</strong> {data.dimensions.poles}P</div>
               <div><strong>SLOT COUNT:</strong> {data.dimensions.slots}S</div>
               <div><strong>PEAK TORQUE:</strong> {data.specifications.peakTorqueNm} Nm</div>
            </div>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '10px', textAlign: 'center', color: '#000', fontWeight: 'bold' }}>
            © MOTOR_MORPH AI ENGINEERING | DESIGN VALIDATED BY PHYSICS ENGINE
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
        }

        .pdf-export-mode {
          background: #ffffff !important;
          color: #000000 !important;
          padding: 8mm !important;
          width: 100% !important;
        }
        
        .pdf-export-mode .glass-panel { background: #fff !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .pdf-export-mode .stat-card { border: 2px solid #000 !important; background: #fff !important; margin-bottom: 5px !important; color: #000 !important; }
        .pdf-export-mode .stat-value, .pdf-export-mode .stat-label { color: #000 !important; opacity: 1 !important; }
        .pdf-export-mode h2, .pdf-export-mode h3, .pdf-export-mode h4 { color: #000 !important; border-bottom: 2px solid #000 !important; margin-bottom: 10px !important; }
        .pdf-export-mode strong { color: #000 !important; }
        .pdf-export-mode span { color: #333 !important; }
        .pdf-export-mode .specs-list div { border-bottom: 1px solid #ddd !important; }
        
        /* Chart Overrides for PDF */
        .pdf-export-mode .recharts-cartesian-axis-line { stroke: #000 !important; stroke-width: 2px !important; }
        .pdf-export-mode .recharts-text { fill: #000 !important; font-weight: bold !important; }
        .pdf-export-mode .recharts-line-curve { stroke: #000 !important; stroke-width: 3px !important; }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
