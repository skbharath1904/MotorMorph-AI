import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Cpu, Thermometer, Maximize, Zap, BarChart3, Activity, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import MotorCrossSection from './MotorCrossSection';

const DesignReport = ({ data, inputs }) => {
  const reportRef = useRef();
  const [showCrossSection, setShowCrossSection] = useState(false);

  const handleDownloadPdf = () => {
    const element = reportRef.current;
    const opt = {
      margin: [8, 10, 8, 10], // Slightly more for safety
      filename: `MotorMorph_Report_${data.motorType.split(' ')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        windowWidth: 1200 // Force a specific width for capture
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // Add a temporary class to fix text colors for PDF if needed
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
            <button 
              onClick={() => setShowCrossSection(!showCrossSection)} 
              className={`btn ${showCrossSection ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Settings size={16} />
              {showCrossSection ? 'Hide Cross-Section' : 'Motor Cross-Section View'}
            </button>

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
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Desired Range</span> <strong>{inputs.range} km</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>System Voltage</span> <strong>{inputs.voltage} V</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Drag Coeff (Cd)</span> <strong>{inputs.dragCoefficient}</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Frontal Area</span> <strong>{inputs.frontalArea} m²</strong></div>
              <div><span style={{color:'var(--text-secondary)', display:'block', fontSize:'0.85rem'}}>Rolling Resistance</span> <strong>{inputs.rollingResistance}</strong></div>
            </div>
          </div>
        )}

        {data.rangeLimitation && (
          <div style={{ background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#ffb3b3' }}>
            <strong>Constraint Notice:</strong> {data.rangeLimitation}
          </div>
        )}

        {/* ── Engineering Visualization Option ── */}
        <div style={{ 
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
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Engineering Cross-Section</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Generate high-fidelity 2D internal assembly blueprint</p>
          </div>
          <button 
            onClick={() => setShowCrossSection(!showCrossSection)} 
            className="btn btn-primary"
            style={{ 
              padding: '0.75rem 1.5rem', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              background: showCrossSection ? 'var(--accent-blue)' : 'transparent',
              color: showCrossSection ? '#000' : 'var(--accent-blue)',
              border: `2px solid var(--accent-blue)`,
              fontWeight: 'bold'
            }}
          >
            <Settings size={18} />
            {showCrossSection ? 'HIDE DIAGRAM' : 'GENERATE CROSS-SECTION VIEW'}
          </button>
        </div>

        {/* ── Engineering Cross-Section Section (CONDITIONAL) ── */}
        {showCrossSection && <MotorCrossSection data={data} />}

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

        {/* ── Prediction Accuracy Banner ── */}
        <div className="accuracy-banner" style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(0, 210, 255, 0.06)',
          border: '1px solid rgba(0, 210, 255, 0.25)',
          borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem'
        }}>
          {/* Circular progress */}
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="6"/>
              <circle cx="32" cy="32" r="26" fill="none"
                stroke="#00d2ff"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(data.accuracy.score / 100) * 163.4} 163.4`}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span style={{
              position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)',
              fontSize:'0.85rem', fontWeight:700,
              color: '#00d2ff'
            }}>{data.accuracy.score}%</span>
          </div>
          <div>
            <p style={{ margin:0, fontWeight:700, fontSize:'1rem' }}>
              Prediction Accuracy: <span style={{ color: '#00d2ff' }}>{data.accuracy.score}%</span>
            </p>
            <p style={{ margin:'0.25rem 0 0', fontSize:'0.85rem', color:'var(--text-secondary)' }}>{data.accuracy.note}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Maximize size={18} color="var(--accent-purple)"/> Physical Dimensions
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stator Diameter</span>
                <strong>{data.dimensions.statorDiameter}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rotor Length</span>
                <strong>{data.dimensions.rotorLength}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overall Length</span>
                <strong>{data.dimensions.overallLength}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Air Gap</span>
                <strong>{data.dimensions.airGap}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pole/Slot Combo</span>
                <strong>{data.dimensions.slots}S / {data.dimensions.poles}P</strong>
              </li>
            </ul>
          </div>
          
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--accent-purple)"/> Electrical Specs
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Operating Voltage</span>
                <strong>{data.specifications.operatingVoltage}V</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Phase Current</span>
                <strong>{data.electrical.phaseCurrent}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Switching Device</span>
                <strong style={{ color: 'var(--accent-blue)' }}>{data.electrical.switchingDevice}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stator Resistance</span>
                <strong>{data.electrical.statorResistance}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Back EMF Const.</span>
                <strong>{data.electrical.backEmfConstant}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Winding Type</span>
                <strong>{data.electrical.windingType}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} color="var(--accent-purple)"/> Mechanical & Thermal
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Torque Density</span>
                <strong style={{ color: 'var(--accent-blue)' }}>{data.mechanical.maxTorqueDensity}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rotor Inertia</span>
                <strong>{data.mechanical.rotorInertia}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Centrifugal Force</span>
                <strong>{data.mechanical.maxCentrifugalForce}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Critical Speed</span>
                <strong>{data.mechanical.criticalSpeed}</strong>
              </li>
            </ul>
          </div>
          
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-purple)"/> System Performance
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Continuous Power</span>
                <strong>{data.specifications.continuousPowerKw} kW</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Peak Efficiency</span>
                <strong style={{ color: 'var(--text-primary)' }}>{data.specifications.estimatedEfficiency}</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cont. Torque</span>
                <strong>{data.specifications.continuousTorqueNm} Nm</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Base Speed</span>
                <strong>{data.specifications.baseRpm} RPM</strong>
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Est. Total Weight</span>
                <strong>{data.specifications.weightKg} kg</strong>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="data-section">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Thermometer size={18} color="var(--accent-purple)"/> Thermal Management
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Primary Cooling</span>
                <strong style={{ fontSize: '1.1rem' }}>{data.thermal.coolingMethod}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Max Coil Temp</span>
                <strong style={{ fontSize: '1.1rem' }}>{data.thermal.maxCoilTemp}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Coolant Flow</span>
                <strong style={{ fontSize: '1.1rem' }}>{data.thermal.coolantFlowRate}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Thermal Resistance</span>
                <strong style={{ fontSize: '1.1rem' }}>{data.thermal.thermalResistance}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="pdf-page-break">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--accent-purple)"/> Performance Characteristics
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
            {/* Efficiency vs Speed Chart */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Efficiency vs. Speed</h4>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                    <XAxis 
                      dataKey="rpm" 
                      stroke="#a0a0a0" 
                      allowDecimals={false}
                      label={{ value: 'Speed (RPM)', position: 'insideBottom', offset: -10, fill: '#a0a0a0', fontSize: 12 }} 
                    />
                    <YAxis 
                      stroke="#00d2ff" 
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      allowDecimals={false}
                      label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: '#00d2ff', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="efficiency" stroke="#00d2ff" strokeWidth={3} dot={false} name="Efficiency %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Torque vs Speed Chart */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Torque vs. Speed Characteristic</h4>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <LineChart data={data.performanceCurve} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                    <XAxis 
                      dataKey="rpm" 
                      stroke="#a0a0a0" 
                      allowDecimals={false}
                      label={{ value: 'Speed (RPM)', position: 'insideBottom', offset: -10, fill: '#a0a0a0', fontSize: 12 }} 
                    />
                    <YAxis 
                      stroke="#3a7bd5" 
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      label={{ value: 'Torque (Nm)', angle: -90, position: 'insideLeft', fill: '#3a7bd5', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="torque" stroke="#3a7bd5" strokeWidth={3} dot={false} name="Torque (Nm)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .pdf-only {
          display: none;
        }
        .pdf-export-mode {
          background: #ffffff !important;
          color: #000000 !important;
          padding: 5mm !important;
          width: 190mm !important; /* Ensure it fits A4 roughly */
          margin: 0 auto !important;
        }
        .pdf-export-mode .pdf-only {
          display: block;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .pdf-export-mode .stat-card {
          padding: 8px !important;
          margin-bottom: 0 !important;
          border: 1.5px solid #000 !important;
          background: #ffffff !important;
          page-break-inside: avoid !important;
        }
        .pdf-export-mode .stat-value {
          color: #000000 !important;
          font-weight: 900 !important;
          font-size: 1.1rem !important;
          display: block !important;
        }
        .pdf-export-mode .stat-label {
          color: #000000 !important;
          font-weight: 800 !important;
          opacity: 1 !important;
          font-size: 0.8rem !important;
        }
        .pdf-export-mode .inputs-section {
          padding: 10px !important;
          margin-bottom: 12px !important;
          border: 1.5px solid #000 !important;
          background: #ffffff !important;
          page-break-inside: avoid !important;
        }
        .pdf-export-mode .justification-box {
          padding: 10px !important;
          margin-bottom: 12px !important;
          border: 1.5px solid #000 !important;
          background: #f9f9f9 !important;
          page-break-inside: avoid !important;
        }
        .pdf-export-mode .accuracy-banner {
          padding: 10px !important;
          margin-bottom: 12px !important;
          border: 1.5px solid #000 !important;
          background: #f9f9f9 !important;
          page-break-inside: avoid !important;
        }
        .pdf-export-mode h2 { fontSize: 1.5rem !important; margin-bottom: 10px !important; font-weight: 900 !important; color: #000 !important; }
        .pdf-export-mode h3 { fontSize: 1.1rem !important; margin-bottom: 8px !important; font-weight: 900 !important; color: #000 !important; border-bottom: 2px solid #000 !important; }
        .pdf-export-mode h4 { fontSize: 0.8rem !important; font-weight: 900 !important; color: #000 !important; margin-bottom: 4px !important; }
        
        .pdf-export-mode .data-section {
          margin-bottom: 25px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          width: 100% !important;
          display: block !important;
        }
        .pdf-export-mode div[style*="display: grid"] {
          display: block !important;
          width: 100% !important;
        }
        .pdf-export-mode .stat-card {
          width: 100% !important;
          margin-bottom: 10px !important;
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        .pdf-export-mode .pdf-page-break {
          display: flex !important;
          flex-direction: column !important;
          gap: 30px !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
          margin-top: 20px !important;
          width: 100% !important;
        }
        .pdf-export-mode .recharts-responsive-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          height: 250px !important;
          width: 100% !important;
          margin-bottom: 40px !important;
        }
        .pdf-export-mode .pdf-page-break > div {
          width: 100% !important;
          margin-bottom: 20px !important;
          page-break-inside: avoid !important;
        }
        .pdf-export-mode span { font-size: 0.85rem !important; color: #000000 !important; font-weight: 800 !important; }
        .pdf-export-mode strong { font-size: 0.95rem !important; color: #000000 !important; font-weight: 900 !important; }
        .pdf-export-mode p { color: #000000 !important; font-weight: 700 !important; line-height: 1.4 !important; }
        .pdf-export-mode li { page-break-inside: avoid !important; padding: 4px 0 !important; }

        /* Graph Fixes for PDF */
        .pdf-export-mode .recharts-cartesian-axis-line,
        .pdf-export-mode .recharts-cartesian-axis-tick-line {
          stroke: #000000 !important;
          stroke-width: 3px !important;
        }
        .pdf-export-mode .recharts-text {
          fill: #000000 !important;
          font-weight: 800 !important;
          font-size: 12px !important;
        }
        .pdf-export-mode .recharts-cartesian-grid-horizontal line,
        .pdf-export-mode .recharts-cartesian-grid-vertical line {
          stroke: #cccccc !important;
          stroke-width: 1px !important;
        }
        .pdf-export-mode .recharts-legend-item-text {
          color: #000 !important;
          font-weight: 800 !important;
          font-size: 14px !important;
        }
        .pdf-export-mode .recharts-line .recharts-curve {
          stroke: #000 !important;
          stroke-width: 4px !important;
        }
      `}} />
    </motion.div>
  );
};

export default DesignReport;
