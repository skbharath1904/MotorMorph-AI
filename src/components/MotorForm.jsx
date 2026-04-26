import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Weight, Gauge, Car, Wind, CircleDashed, Square, AlertCircle } from 'lucide-react';

const FIELD_LABELS = {
  vehicleType:       'Vehicle Type',
  voltage:           'Battery Voltage',
  targetSpeed:       'Top Speed',
  vehicleWeight:     'Vehicle Weight',
  dragCoefficient:   'Drag Coefficient (Cd)',
  frontalArea:       'Frontal Area',
  rollingResistance: 'Rolling Resistance (Crr)',
  range:             'Desired Range',
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
    frontalArea:       ''
  });
  const [isCustomVoltage, setIsCustomVoltage] = useState(false);
  const [customVoltage, setCustomVoltage] = useState('');
  const [errors, setErrors] = useState({});       // per-field errors
  const [submitError, setSubmitError] = useState(''); // banner message

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      [name]: parseFloat(value) || value
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    const missing = [];

    if (!inputs.vehicleType) {
      newErrors.vehicleType = 'Required';
      missing.push(FIELD_LABELS.vehicleType);
    }

    const finalVoltage = isCustomVoltage ? parseFloat(customVoltage) : inputs.voltage;
    if (!finalVoltage || finalVoltage <= 0) {
      newErrors.voltage = isCustomVoltage ? 'Enter a valid voltage' : 'Required';
      missing.push(FIELD_LABELS.voltage);
    }

    const numericFields = [
      { key: 'targetSpeed',       min: 1,     max: 400,  label: FIELD_LABELS.targetSpeed },
      { key: 'vehicleWeight',     min: 1,     max: 50000,label: FIELD_LABELS.vehicleWeight },
      { key: 'dragCoefficient',   min: 0.001, max: 5,    label: FIELD_LABELS.dragCoefficient },
      { key: 'frontalArea',       min: 0.1,   max: 20,   label: FIELD_LABELS.frontalArea },
      { key: 'rollingResistance', min: 0.001, max: 0.5,  label: FIELD_LABELS.rollingResistance },
      { key: 'range',             min: 1,     max: 5000, label: FIELD_LABELS.range },
    ];

    for (const { key, min, max, label } of numericFields) {
      const val = parseFloat(inputs[key]);
      if (inputs[key] === '' || isNaN(val)) {
        newErrors[key] = 'Required';
        missing.push(label);
      } else if (val < min || val > max) {
        newErrors[key] = `Must be ${min}–${max}`;
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
      setSubmitError(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    const finalVoltage = isCustomVoltage ? parseFloat(customVoltage) : inputs.voltage;
    setErrors({});
    setSubmitError('');
    onSubmit({ ...inputs, voltage: finalVoltage });
  };

  // Block non-numeric keystrokes on number fields
  const numbersOnly = (e) => {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','.'];
    if (allowed.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  // Helper: error border style
  const fieldStyle = (key) => ({
    borderColor: errors[key] ? '#ff5a5a' : undefined,
    boxShadow:   errors[key] ? '0 0 0 2px rgba(255,90,90,0.25)' : undefined,
  });

  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem' }}
    >
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={24} />
        Vehicle Parameters
      </h2>

      {/* Submit error banner */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              background: 'rgba(255,90,90,0.1)',
              border: '1px solid rgba(255,90,90,0.4)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#ff8080',
              lineHeight: 1.5
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{submitError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Vehicle Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Car size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Vehicle Type {errors.vehicleType && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.vehicleType}</span>}
            </label>
            <select
              name="vehicleType"
              className="form-input"
              value={inputs.vehicleType}
              onChange={handleTypeChange}
              style={{ appearance: 'none', ...fieldStyle('vehicleType') }}
            >
              <option value="" disabled>Select vehicle type</option>
              <option value="Two Wheeler">Two Wheeler</option>
              <option value="Car">Passenger Car</option>
              <option value="Commercial">Commercial Vehicle</option>
            </select>
          </div>

          {/* Battery Voltage */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Zap size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Battery Voltage (V) {errors.voltage && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.voltage}</span>}
            </label>
            <select
              name="voltage"
              className="form-input"
              value={isCustomVoltage ? 'others' : inputs.voltage}
              onChange={handleChange}
              style={{ appearance: 'none', ...fieldStyle('voltage') }}
            >
              <option value="" disabled>Select voltage</option>
              <option value="48">48V (Light EV)</option>
              <option value="400">400V (Standard EV)</option>
              <option value="800">800V (High Performance)</option>
              <option value="others">Others (Custom)</option>
            </select>
            {isCustomVoltage && (
              <input
                type="number"
                className="form-input"
                placeholder="Enter voltage (e.g. 96, 144, 600)"
                value={customVoltage}
                onChange={(e) => { setCustomVoltage(e.target.value); setErrors(p => ({...p, voltage:''})); setSubmitError(''); }}
                onKeyDown={numbersOnly}
                min="12" max="1500"
                style={{ marginTop: '0.5rem', ...fieldStyle('voltage') }}
              />
            )}
          </div>

          {/* Top Speed */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Gauge size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Top Speed (km/h) {errors.targetSpeed && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.targetSpeed}</span>}
            </label>
            <input
              type="number" name="targetSpeed" className="form-input"
              value={inputs.targetSpeed} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 120"
              min="1" max="400"
              style={fieldStyle('targetSpeed')}
            />
          </div>

          {/* Vehicle Weight */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Weight size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Weight (kg) {errors.vehicleWeight && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.vehicleWeight}</span>}
            </label>
            <input
              type="number" name="vehicleWeight" className="form-input"
              value={inputs.vehicleWeight} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 1500"
              min="1" max="50000"
              style={fieldStyle('vehicleWeight')}
            />
          </div>

          {/* Drag Coefficient */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Wind size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Drag Coeff. (Cd) {errors.dragCoefficient && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.dragCoefficient}</span>}
            </label>
            <input
              type="number" step="0.01" name="dragCoefficient" className="form-input"
              value={inputs.dragCoefficient} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 0.28"
              style={fieldStyle('dragCoefficient')}
            />
          </div>

          {/* Frontal Area */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Square size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Frontal Area (m²) {errors.frontalArea && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.frontalArea}</span>}
            </label>
            <input
              type="number" step="0.1" name="frontalArea" className="form-input"
              value={inputs.frontalArea} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 2.2"
              style={fieldStyle('frontalArea')}
            />
          </div>

          {/* Rolling Resistance */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <CircleDashed size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Rolling Res. (Crr) {errors.rollingResistance && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.rollingResistance}</span>}
            </label>
            <input
              type="number" step="0.001" name="rollingResistance" className="form-input"
              value={inputs.rollingResistance} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 0.015"
              style={fieldStyle('rollingResistance')}
            />
          </div>

          {/* Desired Range */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Activity size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
              Desired Range (km) {errors.range && <span style={{ color: '#ff5a5a', fontSize: '0.78rem' }}>— {errors.range}</span>}
            </label>
            <input
              type="number" name="range" className="form-input"
              value={inputs.range} onChange={handleChange} onKeyDown={numbersOnly}
              placeholder="e.g. 300"
              min="1" max="5000"
              style={fieldStyle('range')}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Activity size={20} />
              </motion.div>
              Generating Design...
            </>
          ) : (
            <>
              <Zap size={20} />
              Generate Motor Design
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default MotorForm;
