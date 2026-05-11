import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Weight, Gauge, Car, Wind, CircleDashed, Square, AlertCircle, TrendingUp, Timer, Cloud } from 'lucide-react';

const FIELD_LABELS = {
  vehicleType:       'VEHICLE TYPE',
  voltage:           'BATTERY VOLTAGE (V)',
  targetSpeed:       'TOP SPEED (KM/H)',
  vehicleWeight:     'WEIGHT (KG)',
  dragCoefficient:   'DRAG COEFF. (CD)',
  frontalArea:       'FRONTAL AREA (M²)',
  rollingResistance: 'ROLLING RES. (CRR)',
  range:             'DESIRED RANGE (KM)',
  accelerationTime:  '0-100 KM/H TIME',
  maxGradient:       'MAX GRADIENT (%)',
  riderMass:         'RIDER MASS (KG)',
  wheelRadius:       'WHEEL RADIUS (M)',
  airDensity:        'AIR DENSITY (KG/M³)'
};

const MotorForm = ({ onSubmit, isGenerating }) => {
  const [inputs, setInputs] = useState({
    vehicleType:       '',
    targetSpeed:       '',
    vehicleWeight:     '',
    range:             '',
    voltage:           '',
    dragCoefficient:   '',
    rollingResistance: '',
    frontalArea:       '',
    accelerationTime:  '',
    maxGradient:       '',
    riderMass:         '',
    wheelRadius:       '',
    airDensity:        '1.225'
  });
  const [isCustomVoltage, setIsCustomVoltage] = useState(false);
  const [customVoltage, setCustomVoltage] = useState('');
  const [errors, setErrors] = useState({});       
  const [submitError, setSubmitError] = useState(''); 

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setInputs(prev => ({ ...prev, vehicleType: type }));
    setErrors(prev => ({ ...prev, vehicleType: '' }));
    setSubmitError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSubmitError('');

    if (name === 'voltage') {
      if (value === 'others') {
        setIsCustomVoltage(true);
        setCustomVoltage('');
      } else {
        setIsCustomVoltage(false);
        setInputs(prev => ({ ...prev, voltage: parseFloat(value) }));
      }
      setErrors(prev => ({ ...prev, voltage: '' }));
      return;
    }
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!inputs.vehicleType) {
      newErrors.vehicleType = 'Required';
      missing.push(FIELD_LABELS.vehicleType);
    }

    const finalVoltage = isCustomVoltage ? parseFloat(customVoltage) : inputs.voltage;
    if (!finalVoltage || finalVoltage < 40 || finalVoltage > 1000) {
      newErrors.voltage = isCustomVoltage ? 'Must be 40-1000V' : 'Required';
      missing.push(FIELD_LABELS.voltage);
    }

    const numericFields = [
      { key: 'targetSpeed',       min: 40,    max: 300,   label: FIELD_LABELS.targetSpeed },
      { key: 'vehicleWeight',     min: 50,    max: 20000, label: FIELD_LABELS.vehicleWeight },
      { key: 'dragCoefficient',   min: 0.1,   max: 1.0,   label: FIELD_LABELS.dragCoefficient },
      { key: 'frontalArea',       min: 0.1,   max: 10,    label: FIELD_LABELS.frontalArea },
      { key: 'rollingResistance', min: 0.001, max: 1.0,   label: FIELD_LABELS.rollingResistance },
      { key: 'range',             min: 40,    max: 1000,  label: FIELD_LABELS.range },
      { key: 'accelerationTime',  min: 3,     max: 60,    label: FIELD_LABELS.accelerationTime },
      { key: 'maxGradient',       min: 5,     max: 50,    label: FIELD_LABELS.maxGradient },
      { key: 'riderMass',         min: 0,     max: 300,   label: FIELD_LABELS.riderMass },
      { key: 'wheelRadius',       min: 0.1,   max: 1.5,   label: FIELD_LABELS.wheelRadius },
      { key: 'airDensity',        min: 0.5,   max: 2.0,   label: FIELD_LABELS.airDensity },
    ];

    for (const { key, min, max, label } of numericFields) {
      const val = parseFloat(inputs[key]);
      if (inputs[key] === '' || isNaN(val)) {
        newErrors[key] = 'Required';
        missing.push(label);
      } else if (val < min || val > max) {
        newErrors[key] = `Invalid Range`;
        missing.push(label);
      }
    }

    return { newErrors, missing };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { newErrors, missing } = validate();

    if (missing.length > 0) {
      setErrors(newErrors);
      setSubmitError(`Please check required fields: ${missing.slice(0, 3).join(', ')}...`);
      // Scroll to top of form to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalVoltage = isCustomVoltage ? parseFloat(customVoltage) : inputs.voltage;
    setErrors({});
    setSubmitError('');
    onSubmit({ ...inputs, voltage: finalVoltage });
  };

  const numbersOnly = (e) => {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','.'];
    if (allowed.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2.5rem' }}
    >
      <h3 style={{ color: 'var(--accent-blue)', marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', fontWeight: 800 }}>
        Vehicle Parameters
      </h3>

      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)',
              borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.85rem', color: '#ff7a7a'
            }}
          >
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '8px' }} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>

          {/* Vehicle Type */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Car size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.vehicleType}
            </label>
            <select name="vehicleType" className="form-input" value={inputs.vehicleType} onChange={handleTypeChange}>
              <option value="" disabled>Select Type</option>
              <option value="Two Wheeler">Two Wheeler</option>
              <option value="Car">Passenger Car</option>
              <option value="Commercial">Commercial Vehicle</option>
            </select>
          </div>

          {/* Voltage */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Zap size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.voltage}
            </label>
            <select name="voltage" className="form-input" value={isCustomVoltage ? 'others' : inputs.voltage} onChange={handleChange}>
              <option value="" disabled>Select Voltage</option>
              <option value="48">48V (Light EV)</option>
              <option value="400">400V (Standard EV)</option>
              <option value="800">800V (High Performance)</option>
              <option value="others">Others (Custom)</option>
            </select>
            {isCustomVoltage && (
              <input type="number" className="form-input" placeholder="e.g. 600" value={customVoltage} onChange={(e) => setCustomVoltage(e.target.value)} onKeyDown={numbersOnly} style={{ marginTop: '0.6rem' }} />
            )}
          </div>

          {/* Top Speed */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Gauge size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.targetSpeed}
            </label>
            <input type="number" name="targetSpeed" className="form-input" value={inputs.targetSpeed} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Weight */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Weight size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.vehicleWeight}
            </label>
            <input type="number" name="vehicleWeight" className="form-input" value={inputs.vehicleWeight} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Drag Coeff */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Wind size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.dragCoefficient}
            </label>
            <input type="number" step="0.01" name="dragCoefficient" className="form-input" value={inputs.dragCoefficient} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Frontal Area */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Square size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.frontalArea}
            </label>
            <input type="number" step="0.1" name="frontalArea" className="form-input" value={inputs.frontalArea} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Rolling Res */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <CircleDashed size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.rollingResistance}
            </label>
            <input type="number" step="0.001" name="rollingResistance" className="form-input" value={inputs.rollingResistance} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Desired Range */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Activity size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.range}
            </label>
            <input type="number" name="range" className="form-input" value={inputs.range} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Acceleration */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Timer size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.accelerationTime}
            </label>
            <input type="number" step="0.1" name="accelerationTime" className="form-input" value={inputs.accelerationTime} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Gradient */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <TrendingUp size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.maxGradient}
            </label>
            <input type="number" name="maxGradient" className="form-input" value={inputs.maxGradient} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Rider Mass */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Weight size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.riderMass}
            </label>
            <input type="number" name="riderMass" className="form-input" value={inputs.riderMass} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Wheel Radius */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <CircleDashed size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.wheelRadius}
            </label>
            <input type="number" step="0.01" name="wheelRadius" className="form-input" value={inputs.wheelRadius} onChange={handleChange} onKeyDown={numbersOnly} />
          </div>

          {/* Air Density */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <Cloud size={12} style={{ marginRight: '6px' }}/> {FIELD_LABELS.airDensity}
            </label>
            <input type="number" step="0.001" name="airDensity" className="form-input" value={inputs.airDensity} onChange={handleChange} onKeyDown={numbersOnly} placeholder="1.225" />
          </div>

        </div>

        <button
          type="submit"
          className="btn"
          style={{ 
            width: '100%', padding: '1.2rem', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)', border: 'none', borderRadius: '12px'
          }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                <Activity size={20} />
              </motion.div>
              <span style={{ fontSize: '0.9rem', letterSpacing: '0.1em' }}>FORMULATING DESIGN...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={20} color="#fff" fill="#fff" />
              <span style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>GENERATE MOTOR DESIGN</span>
            </div>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default MotorForm;
