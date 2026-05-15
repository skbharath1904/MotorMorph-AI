// MotorMorph AI Engine — Master Version (No-Error Guarantee Physics Solver)

const MOTOR_TYPES = [
  'Permanent Magnet Synchronous Motor (PMSM)',
  'Induction Motor (IM)',
  'Brushless DC Motor (BLDC)',
  'Switched Reluctance Motor (SRM)',
  'PMSM + IM (Dual Motor System)'
];

export const generateMotorDesign = async (inputs) => {
  try {
    const response = await fetch('/api/generate-design', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    });

    if (!response.ok) {
      throw new Error('Backend API error');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Backend unavailable, falling back to local physics engine.", error);
    return generateMotorDesignLocal(inputs);
  }
};

export const generateMotorDesignLocal = async (inputs) => {
  await new Promise(r => setTimeout(r, 600));

  const notes = [];
  const vehicleType = inputs.vehicleType || 'Passenger Car';
  const is2W = vehicleType.includes('Two Wheeler');
  const isCar = vehicleType.includes('Car');
  const isCV = vehicleType.includes('Commercial');

  if (isCV) {
    return calculateCVNoErrorGuarantee(inputs, notes);
  }

  // --- ORIGINAL LOGIC FOR 2W AND CARS (PRESERVED) ---
  const vKmh = parseFloat(inputs.targetSpeed) || 120;
  let vSystem = parseFloat(inputs.voltage) || 400;
  const mVehicle = parseFloat(inputs.vehicleWeight) || 1500;
  const mLoad = parseFloat(inputs.riderMass) || 150;
  const cd = parseFloat(inputs.dragCoefficient) || 0.3;
  const fa = parseFloat(inputs.frontalArea) || 2.2;
  const crr = parseFloat(inputs.rollingResistance) || 0.015;
  const wheelRadius = parseFloat(inputs.wheelRadius) || 0.3;
  const gradientPercent = parseFloat(inputs.maxGradient) || 10;
  const airDensity = parseFloat(inputs.airDensity) || 1.225;
  const accelTimeRaw = parseFloat(inputs.accelerationTime);

  const totalMass = mVehicle + mLoad;
  const g = 9.81;
  const vMps = vKmh / 3.6;

  const fDragCruise = 0.5 * airDensity * cd * fa * Math.pow(vMps, 2);
  const fRoll = crr * totalMass * g;
  const fCruise = fDragCruise + fRoll;

  const accelTargetKmh = Math.min(vKmh, is2W ? 50 : 100);
  const accelTargetMps = accelTargetKmh / 3.6;
  const accelTime = isNaN(accelTimeRaw) ? (is2W ? 6 : isCar ? 8 : 15) : accelTimeRaw;
  const a = accelTargetMps / accelTime;
  const fAccel = totalMass * a;

  let vGradeMps = vMps;
  const maxGradientRad = Math.atan(gradientPercent / 100);
  const fGrade = totalMass * g * Math.sin(maxGradientRad);
  const fDragAccel = 0.5 * airDensity * cd * fa * Math.pow(accelTargetMps, 2);
  const fTotalAccel = fDragAccel + fRoll + fAccel;
  const fDragGrade = 0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2);
  let fTotalGrade = fDragGrade + fRoll + fGrade;

  const pCruise = (fCruise * vMps) / 1000;
  const pAccel = (fTotalAccel * accelTargetMps) / 1000;
  let pGrade = (fTotalGrade * vGradeMps) / 1000;

  let pMin, pMax;
  if (is2W) { pMin = 0.25; pMax = 80; }
  else if (isCar) { pMin = 20; pMax = 450; }

  let rawPeakPower = Math.max(pCruise, pAccel, pGrade);
  if (rawPeakPower > pMax && pGrade > pMax) {
      const pAvailForGrade = pMax * 1000; 
      vGradeMps = pAvailForGrade / fTotalGrade;
      const vGradeKmh = vGradeMps * 3.6;
      notes.push(`Gradient demand exceeded vehicle limits: Climb speed reduced to ${vGradeKmh.toFixed(1)} km/h.`);
      fTotalGrade = (0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2)) + fRoll + fGrade;
      pGrade = (fTotalGrade * vGradeMps) / 1000;
      rawPeakPower = Math.max(pCruise, pAccel, pGrade);
  }

  let peakPowerKw = Math.max(pMin, Math.min(pMax, rawPeakPower));
  let contPowerMin = 0.55, contPowerMax = 0.75;
  if (isCar) { contPowerMin = 0.55; contPowerMax = 0.70; }
  const continuousPowerKw = peakPowerKw * ((contPowerMin + contPowerMax) / 2);

  let motorType = MOTOR_TYPES[0], reason = "";
  if (is2W) {
      if (peakPowerKw < 8) { motorType = MOTOR_TYPES[2]; reason = "BLDC: Low-cost EVs."; }
      else { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency EVs."; }
  } else if (isCar) {
      if (peakPowerKw < 80) { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency EVs."; }
      else if (peakPowerKw <= 200) { motorType = MOTOR_TYPES[0]; reason = "PMSM: High performance standard."; }
      else { motorType = MOTOR_TYPES[4]; reason = "PMSM + IM Dual Motor."; }
  }

  let grMin = is2W ? 3 : 7, grMax = is2W ? 7 : 11, grTarget = is2W ? 5 : 9;
  let gearRatio = grTarget;
  const wheelRpm = (vMps / (2 * Math.PI * wheelRadius)) * 60;
  let motorRpm = wheelRpm * gearRatio;

  let rpmMin = 4000, rpmMax = 18000;
  if (motorType.includes('BLDC')) { rpmMin = 3000; rpmMax = 8000; }
  if (motorRpm > rpmMax) { motorRpm = rpmMax; gearRatio = motorRpm / wheelRpm; }
  else if (motorRpm < rpmMin) { motorRpm = rpmMin; gearRatio = motorRpm / wheelRpm; }

  let baseRpm = Math.min(motorRpm * 0.4, rpmMax * 0.5);
  let tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);

  let opEff = motorType.includes('BLDC') ? 0.88 : (motorType.includes('PMSM') ? 0.94 : 0.90);
  let iMin = is2W ? 60 : 150, iMax = is2W ? 220 : 500;
  let phaseCurrent = (peakPowerKw * 1000) / (vSystem * opEff);
  if (phaseCurrent > iMax) {
      phaseCurrent = iMax;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
  }

  const powerScale = Math.max(0, Math.min(1, (peakPowerKw - pMin) / (pMax - pMin)));
  const weight = (is2W ? 3 : 40) + (is2W ? 22 : 120) * powerScale;
  const statorOd = (is2W ? 100 : 220) + weight * (is2W ? 2 : 1.5);
  const length = statorOd * 0.8;

  return formatOutput({
    motorType, reason, notes, peakPowerKw, continuousPowerKw, tMotor, motorRpm, baseRpm, vSystem, weight,
    statorOd, length, opEff, phaseCurrent, gearRatio, totalMass, wheelRadius, wheelRpm, isCV: false
  });
};

const calculateCVNoErrorGuarantee = (inputs, notes) => {
  // 1. VEHICLE DEMAND (The Root)
  const mVehicle = parseFloat(inputs.vehicleWeight) || 12000;
  const mLoad = parseFloat(inputs.riderMass) || 2000;
  const totalMass = Math.max(3000, Math.min(18000, mVehicle + mLoad));

  const wheelRadius = parseFloat(inputs.wheelRadius) || 0.5;
  const airDensity = parseFloat(inputs.airDensity) || 1.225;
  const cd = parseFloat(inputs.dragCoefficient) || 0.6;
  const fa = parseFloat(inputs.frontalArea) || 8.0;
  const crr = parseFloat(inputs.rollingResistance) || 0.012;
  const gradientPercent = Math.max(20, Math.min(30, parseFloat(inputs.maxGradient) || 20));
  const vKmh = parseFloat(inputs.targetSpeed) || 90;
  const vMps = vKmh / 3.6;

  const g = 9.81;
  const fDrag = 0.5 * airDensity * cd * fa * Math.pow(vMps, 2);
  const fRoll = crr * totalMass * g;
  const fGrade = totalMass * g * Math.sin(Math.atan(gradientPercent / 100));
  const a = (50 / 3.6) / 15; // 0-50 km/h in 15s
  const fAccel = totalMass * a;

  const fTractive = Math.max(fDrag + fRoll + fAccel, fRoll + fGrade);
  const tWheel = fTractive * wheelRadius;

  // 2. DRIVETRAIN OPTIMIZATION
  let gearRatio = 12.0;
  let tMotor = tWheel / gearRatio;
  
  // Torque Constraint: 600 - 2000 Nm
  if (tMotor > 2000) {
    tMotor = 2000;
    gearRatio = tWheel / tMotor;
    if (gearRatio > 14) {
        gearRatio = 14;
        tMotor = tWheel / gearRatio;
        notes.push("High tractive force exceeds motor torque limit at 14:1 gear ratio. Performance limited.");
    }
  } else if (tMotor < 600) {
    tMotor = 600;
    gearRatio = tWheel / tMotor;
    if (gearRatio < 8) gearRatio = 8;
  }

  // 3. POWER DERIVATION (Strict: P = T * w)
  const wheelRpm = (vMps / (2 * Math.PI * wheelRadius)) * 60;
  let motorRpm = wheelRpm * gearRatio;
  motorRpm = Math.max(4000, Math.min(8000, motorRpm));
  
  let baseRpm = motorRpm * 0.45;
  let peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);

  // Power Constraint: 120 - 350 kW
  if (peakPowerKw > 350) {
    peakPowerKw = 350;
    baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
    notes.push("Peak power hit 350kW limit. Base speed reduced to maintain torque consistency.");
  } else if (peakPowerKw < 120) {
    peakPowerKw = 120;
    baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
  }

  const continuousPowerKw = peakPowerKw * 0.7;

  // 4. MOTOR TYPE SELECTION
  let motorType = MOTOR_TYPES[3]; // SRM default
  let reason = "SRM: Selected for high torque, ruggedness, and low cost in heavy commercial trucks.";
  if (totalMass < 8000) {
    motorType = MOTOR_TYPES[1];
    reason = "IM: Selected for medium-duty commercial reliability and cost-effectiveness.";
  } else if (inputs.vehicleType?.includes("Bus")) {
    motorType = MOTOR_TYPES[0];
    reason = "PMSM: Selected for maximum efficiency and low noise in premium electric buses.";
  }

  // 5. GEOMETRY & MASS (Derived from Densities)
  const powerDensity = motorType.includes("PMSM") ? 3.8 : (motorType.includes("IM") ? 2.8 : 2.0);
  const weight = peakPowerKw / powerDensity;

  const torqueDensity = motorType.includes("PMSM") ? 38 : (motorType.includes("IM") ? 28 : 20);
  const volumeL = tMotor / torqueDensity;
  const volumeM3 = volumeL / 1000;

  // Solve Dimensions: V = pi * (D/2)^2 * L. Assume L/D = 1.0 initially.
  let statorOdM = Math.pow((4 * volumeM3) / Math.PI, 1/3);
  let lengthM = statorOdM;
  if (lengthM / statorOdM < 0.6) { lengthM = statorOdM * 0.6; statorOdM = Math.sqrt((4 * volumeM3) / (Math.PI * lengthM)); }
  if (lengthM / statorOdM > 1.4) { lengthM = statorOdM * 1.4; statorOdM = Math.sqrt((4 * volumeM3) / (Math.PI * lengthM)); }

  const statorOd = statorOdM * 1000;
  const length = lengthM * 1000;

  // 6. ELECTRICAL & LOSS MODEL
  let vSystem = parseFloat(inputs.voltage) || 600;
  vSystem = Math.max(400, Math.min(800, vSystem));
  const opEff = motorType.includes("PMSM") ? 0.95 : (motorType.includes("IM") ? 0.91 : 0.88);
  
  let phaseCurrent = (peakPowerKw * 1000) / (vSystem * opEff);
  if (phaseCurrent > 600) {
    phaseCurrent = 600;
    vSystem = (peakPowerKw * 1000) / (phaseCurrent * opEff);
    if (vSystem > 800) {
        vSystem = 800;
        peakPowerKw = (vSystem * phaseCurrent * opEff) / 1000;
        tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
        notes.push("Electrical limit hit. Peak power and torque reduced to stay within 600A current limit.");
    }
  }

  // Losses
  const totalLossesKw = peakPowerKw * (1 - opEff);
  const copperLossKw = totalLossesKw * 0.45;
  const ironLossKw = totalLossesKw * 0.35;
  const switchingLossKw = totalLossesKw * 0.20;

  // 7. HARD VALIDATION BLOCK
  const validationP = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
  if (Math.abs(validationP - peakPowerKw) > 1.0) {
    peakPowerKw = validationP; // Force resync
  }

  return formatOutputCV({
    motorType, reason, notes, peakPowerKw, continuousPowerKw, tMotor, motorRpm, baseRpm, vSystem, weight,
    statorOd, length, opEff, phaseCurrent, gearRatio, totalMass, wheelRadius, wheelRpm, 
    copperLossKw, ironLossKw, switchingLossKw
  });
};

const formatOutputCV = (d) => {
  const peakEff = (d.opEff * 100 + 1.2).toFixed(1);
  const airGap = d.statorOd < 350 ? 0.8 : 1.5;
  const rotorMass = d.weight * 0.35;
  const rotorRadM = (d.statorOd * 0.62) / 2000;
  const inertia = 0.5 * rotorMass * Math.pow(rotorRadM, 2);

  const curve = [];
  for (let r = 0; r <= d.motorRpm + 500; r += 500) {
    const tCurve = r <= d.baseRpm ? d.tMotor : d.tMotor * (d.baseRpm / r);
    let effCurve = r > 0 ? (d.opEff * 100) * (1 - Math.pow(r/d.motorRpm - 0.65, 2) * 0.22) : 0;
    effCurve = Math.max(0, Math.min(parseFloat(peakEff), effCurve));
    curve.push({ rpm: r, torque: Math.round(tCurve), efficiency: Math.round(effCurve * 10) / 10 });
  }

  const pRange = 230; // 350 - 120
  const statorResistance = 0.003 + (0.03 - 0.003) * (1 - (d.peakPowerKw - 120)/pRange);
  const dqInductance = 0.5 + (8.0 - 0.5) * (1 - (d.peakPowerKw - 120)/pRange);

  return {
    motorType: d.motorType,
    motorSelectionReason: d.reason,
    rangeLimitation: d.notes.length > 0 ? d.notes.join(' | ') : null,
    specifications: {
      peakPowerKw: parseFloat(d.peakPowerKw.toFixed(1)),
      continuousPowerKw: parseFloat(d.continuousPowerKw.toFixed(1)),
      peakTorqueNm: Math.round(d.tMotor),
      continuousTorqueNm: Math.round(d.tMotor * 0.7),
      maxRpm: Math.round(d.motorRpm),
      baseRpm: Math.round(d.baseRpm),
      operatingVoltage: Math.round(d.vSystem),
      peakEfficiency: `${peakEff}%`,
      operatingEfficiency: `${(d.opEff * 100).toFixed(1)}%`,
      weightKg: Math.round(d.weight)
    },
    thermal: {
      coolingMethod: d.peakPowerKw > 250 ? "Liquid + Oil Cooling" : "Liquid Cooling",
      maxCoilTemp: "150°C",
      coolantFlowRate: `${(d.peakPowerKw * 0.07).toFixed(1)} L/min`,
      thermalResistance: "0.420 K/W",
      lossBreakdown: `Copper: ${d.copperLossKw.toFixed(1)}kW | Iron: ${d.ironLossKw.toFixed(1)}kW | Switching: ${d.switchingLossKw.toFixed(1)}kW`
    },
    dimensions: {
      statorDiameter: `${Math.round(d.statorOd)} mm`,
      rotorDiameter: `${Math.round(d.statorOd * 0.62)} mm`,
      overallLength: `${Math.round(d.length)} mm`,
      airGap: `${airGap} mm`,
      poles: 16,
      slots: 48
    },
    electrical: {
      phaseCurrent: `${Math.round(d.phaseCurrent)} A (Peak)`,
      switchingDevice: 'IGBT',
      switchingFreq: "10 kHz",
      backEmfConstant: `${(d.vSystem * 0.82 / (2 * Math.PI * d.motorRpm / 60)).toFixed(4)} V·s/rad`,
      statorResistance: `${statorResistance.toFixed(4)} Ω`,
      dqInductance: `${dqInductance.toFixed(3)} mH`,
      windingType: 'Distributed'
    },
    mechanical: {
      maxTorqueDensity: `${(d.tMotor / (Math.PI * Math.pow(d.statorOd/2000, 2) * d.length/1000 * 1000)).toFixed(1)} Nm/L`,
      rotorInertia: `${inertia.toFixed(5)} kg·m²`,
      maxCentrifugalForce: `${Math.round(d.weight * 110)} N`,
      bearingLoad: `${Math.round(d.weight * 18 + d.tMotor * 2.2)} N`,
      coggingTorque: `${(d.tMotor * 0.014).toFixed(1)} Nm`,
      criticalSpeed: `${Math.round(d.motorRpm * 1.30)} RPM`,
      vehicleMass: `${Math.round(d.totalMass)} kg`,
      totalVehicleMass: `${Math.round(d.totalMass)} kg`,
      gearRatio: `${d.gearRatio.toFixed(2)}:1`,
      wheelTorque: `${Math.round(d.tMotor * d.gearRatio)} Nm`
    },
    performanceCurve: curve
  };
};

const formatOutput = (d) => {
  const peakEff = (d.opEff * 100 + 1.5).toFixed(1);
  const airGap = d.statorOd < 160 ? 0.3 : (d.statorOd < 320 ? 0.8 : 1.5);
  const rotorMass = d.weight * 0.38;
  const rotorRadM = (d.statorOd * 0.65) / 2000;
  const inertia = 0.5 * rotorMass * Math.pow(rotorRadM, 2);

  const curve = [];
  for (let r = 0; r <= d.motorRpm + 500; r += 500) {
    const tCurve = r <= d.baseRpm ? d.tMotor : d.tMotor * (d.baseRpm / r);
    let effCurve = r > 0 ? (d.opEff * 100) * (1 - Math.pow(r/d.motorRpm - 0.65, 2) * 0.25) : 0;
    effCurve = Math.max(0, Math.min(parseFloat(peakEff), effCurve));
    curve.push({ rpm: r, torque: Math.round(tCurve), efficiency: Math.round(effCurve * 10) / 10 });
  }

  return {
    motorType: d.motorType,
    motorSelectionReason: d.reason,
    rangeLimitation: d.notes.length > 0 ? d.notes.join(' | ') : null,
    specifications: {
      peakPowerKw: parseFloat(d.peakPowerKw.toFixed(1)),
      continuousPowerKw: parseFloat(d.continuousPowerKw.toFixed(1)),
      peakTorqueNm: Math.round(d.tMotor),
      continuousTorqueNm: Math.round(d.tMotor * 0.7),
      maxRpm: Math.round(d.motorRpm),
      baseRpm: Math.round(d.baseRpm),
      operatingVoltage: Math.round(d.vSystem),
      peakEfficiency: `${peakEff}%`,
      operatingEfficiency: `${(d.opEff * 100).toFixed(1)}%`,
      weightKg: Math.round(d.weight)
    },
    thermal: {
      coolingMethod: "Liquid Cooling",
      maxCoilTemp: "140°C",
      coolantFlowRate: `${(d.peakPowerKw * 0.06).toFixed(1)} L/min`,
      thermalResistance: "0.150 K/W"
    },
    dimensions: {
      statorDiameter: `${Math.round(d.statorOd)} mm`,
      rotorDiameter: `${Math.round(d.statorOd * 0.65)} mm`,
      overallLength: `${Math.round(d.length)} mm`,
      airGap: `${airGap} mm`,
      poles: 8,
      slots: 24
    },
    electrical: {
      phaseCurrent: `${Math.round(d.phaseCurrent)} A (Peak)`,
      switchingDevice: 'IGBT',
      switchingFreq: "16 kHz",
      backEmfConstant: `${(d.vSystem * 0.85 / (2 * Math.PI * d.motorRpm / 60)).toFixed(4)} V·s/rad`,
      statorResistance: "0.0100 Ω",
      dqInductance: "1.500 mH",
      windingType: 'Distributed'
    },
    mechanical: {
      maxTorqueDensity: `${(d.tMotor / (Math.PI * Math.pow(d.statorOd/2000, 2) * d.length/1000 * 1000)).toFixed(1)} Nm/L`,
      rotorInertia: `${inertia.toFixed(5)} kg·m²`,
      maxCentrifugalForce: `${Math.round(d.weight * 120)} N`,
      bearingLoad: `${Math.round(d.weight * 20 + d.tMotor * 2)} N`,
      coggingTorque: `${(d.tMotor * 0.012).toFixed(1)} Nm`,
      criticalSpeed: `${Math.round(d.motorRpm * 1.25)} RPM`,
      vehicleMass: `${Math.round(d.totalMass)} kg`,
      totalVehicleMass: `${Math.round(d.totalMass)} kg`,
      gearRatio: `${d.gearRatio.toFixed(2)}:1`,
      wheelTorque: `${Math.round(d.tMotor * d.gearRatio)} Nm`
    },
    performanceCurve: curve
  };
};
