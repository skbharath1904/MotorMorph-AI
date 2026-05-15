// MotorMorph AI Engine — Master Version (Strict Physics Validation)

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

  const vKmh = parseFloat(inputs.targetSpeed) || 120;
  let vSystem = parseFloat(inputs.voltage) || 400;
  
  if (isCV) {
      if (vSystem < 400) { vSystem = 400; notes.push("CV voltage clamped to min 400V."); }
      if (vSystem > 800) { vSystem = 800; notes.push("CV voltage clamped to max 800V."); }
  }

  const mVehicle = parseFloat(inputs.vehicleWeight) || 1500;
  const mLoad = parseFloat(inputs.riderMass) || 150;
  
  const cd = parseFloat(inputs.dragCoefficient) || 0.3;
  const fa = parseFloat(inputs.frontalArea) || 2.2;
  const crr = parseFloat(inputs.rollingResistance) || 0.015;
  const wheelRadius = parseFloat(inputs.wheelRadius) || 0.3;
  const gradientPercent = parseFloat(inputs.maxGradient) || 10;
  const airDensity = parseFloat(inputs.airDensity) || 1.225;
  const accelTimeRaw = parseFloat(inputs.accelerationTime);

  // 1. VEHICLE DYNAMICS (MANDATORY CORE MODEL)
  const totalMass = mVehicle + mLoad;
  const g = 9.81;

  const vMps = vKmh / 3.6;

  // Road Load
  const fDragCruise = 0.5 * airDensity * cd * fa * Math.pow(vMps, 2);
  const fRoll = crr * totalMass * g;
  const fCruise = fDragCruise + fRoll;

  // Acceleration
  const accelTargetKmh = Math.min(vKmh, is2W ? 50 : 100);
  const accelTargetMps = accelTargetKmh / 3.6;
  const accelTime = isNaN(accelTimeRaw) ? (is2W ? 6 : isCar ? 8 : 15) : accelTimeRaw;
  const a = accelTargetMps / accelTime;
  const fAccel = totalMass * a;

  // Gradeability
  let vGradeMps = vMps;
  const maxGradientRad = Math.atan(gradientPercent / 100);
  const fGrade = totalMass * g * Math.sin(maxGradientRad);

  const fDragAccel = 0.5 * airDensity * cd * fa * Math.pow(accelTargetMps, 2);
  const fTotalAccel = fDragAccel + fRoll + fAccel;

  const fDragGrade = 0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2);
  let fTotalGrade = fDragGrade + fRoll + fGrade;

  // Power Calculation
  const pCruise = (fCruise * vMps) / 1000;
  const pAccel = (fTotalAccel * accelTargetMps) / 1000;
  let pGrade = (fTotalGrade * vGradeMps) / 1000;

  // 4. POWER VALIDATION (VERY IMPORTANT)
  let pMin, pMax;
  if (is2W) { pMin = 0.25; pMax = 80; }
  else if (isCar) { pMin = 20; pMax = 450; }
  else if (isCV) { pMin = 120; pMax = 350; } // COMMERCIAL EV SPECIFIC: MAX 350 kW

  let rawPeakPower = Math.max(pCruise, pAccel, pGrade);

  // 7. GRADIENT LOGIC (If required power exceeds motor capability)
  if (rawPeakPower > pMax && pGrade > pMax) {
      const pAvailForGrade = pMax * 1000; 
      vGradeMps = pAvailForGrade / fTotalGrade;
      const vGradeKmh = vGradeMps * 3.6;
      notes.push(`Gradient demand exceeded vehicle limits: Climb speed reduced to ${vGradeKmh.toFixed(1)} km/h. Prioritizing torque over speed.`);
      
      fTotalGrade = (0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2)) + fRoll + fGrade;
      pGrade = (fTotalGrade * vGradeMps) / 1000;
      rawPeakPower = Math.max(pCruise, pAccel, pGrade);
  }

  let peakPowerKw = Math.max(pMin, Math.min(pMax, rawPeakPower));

  // Continuous Power Rule
  let contPowerMin, contPowerMax;
  if (is2W) { contPowerMin = 0.55; contPowerMax = 0.75; }
  else if (isCar) { contPowerMin = 0.55; contPowerMax = 0.70; }
  else if (isCV) { contPowerMin = 0.60; contPowerMax = 0.75; }
  const continuousPowerKw = peakPowerKw * ((contPowerMin + contPowerMax) / 2);

  // 5 & 6. MOTOR TYPE RECOMMENDATION
  let motorType = MOTOR_TYPES[0];
  let reason = "";
  if (is2W) {
      if (peakPowerKw < 8) { motorType = MOTOR_TYPES[2]; reason = "BLDC: Low-cost EVs, Low power applications."; }
      else { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency EVs, Premium two wheelers."; }
  } else if (isCar) {
      if (peakPowerKw < 80) { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency EVs, passenger cars."; }
      else if (peakPowerKw <= 200) { motorType = MOTOR_TYPES[0]; reason = "PMSM: High performance passenger car standard."; }
      else { motorType = MOTOR_TYPES[4]; reason = "PMSM + IM (Dual Motor System): Power > 200 kW, AWD required, High performance vehicle."; }
  } else if (isCV) {
      if (peakPowerKw < 180) { motorType = MOTOR_TYPES[1]; reason = "IM: Medium-duty commercial delivery vehicles."; }
      else if (peakPowerKw <= 250) { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency premium buses."; }
      else { motorType = MOTOR_TYPES[3]; reason = "SRM: Heavy trucks (rugged, high torque, low cost)."; }
  }

  // 8. GEAR RATIO RULES
  let grMin, grMax, grTarget;
  if (is2W) { grMin = 3; grMax = 7; grTarget = 5; }
  else if (isCar) { grMin = 7; grMax = 11; grTarget = 9; }
  else if (isCV) { grMin = 8; grMax = 14; grTarget = 11; } // COMMERCIAL EV GEAR RATIO
  let gearRatio = grTarget;

  const fMaxDemand = Math.max(fCruise, fTotalAccel, fTotalGrade);
  const tWheel = fMaxDemand * wheelRadius;
  let tMotor = tWheel / gearRatio;

  // RPM relation
  const wheelRpm = (vMps / (2 * Math.PI * wheelRadius)) * 60;
  let motorRpm = wheelRpm * gearRatio;

  let rpmMin, rpmMax;
  if (motorType.includes('BLDC')) { rpmMin = 3000; rpmMax = 8000; }
  else if (motorType.includes('PMSM')) { rpmMin = 4000; rpmMax = 18000; }
  else if (motorType.includes('IM')) { rpmMin = 6000; rpmMax = 20000; }
  else if (motorType.includes('SRM')) { rpmMin = 3000; rpmMax = 12000; }
  else { rpmMin = 4000; rpmMax = 18000; } 

  if (motorRpm > rpmMax) {
      motorRpm = rpmMax;
      gearRatio = motorRpm / wheelRpm;
      if (gearRatio < grMin) gearRatio = grMin;
  } else if (motorRpm < rpmMin) {
      motorRpm = rpmMin;
      gearRatio = motorRpm / wheelRpm;
      if (gearRatio > grMax) gearRatio = grMax;
  }

  // 4. EXACT POWER VALIDATION (Power = Torque * RPM)
  let baseRpm = Math.min(motorRpm * 0.4, rpmMax * 0.5);
  tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);

  // COMMERCIAL EV TORQUE CONSTRAINTS (600 - 2000 Nm)
  if (isCV) {
      if (tMotor < 600) {
          tMotor = 600;
          baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
          notes.push(`CV motor torque bumped to minimum 600 Nm. RPM adjusted to maintain power consistency.`);
      } else if (tMotor > 2000) {
          tMotor = 2000;
          baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
          if (baseRpm > motorRpm) {
              baseRpm = motorRpm * 0.8;
              peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
              notes.push(`CV motor torque capped at 2000 Nm max. Peak power reduced to ${peakPowerKw.toFixed(1)} kW to enforce P = Tw consistency.`);
          }
      }
  }
  
  let opEff = 0.92;
  if (motorType.includes('BLDC')) opEff = 0.88;
  else if (motorType.includes('PMSM')) opEff = 0.94;
  else if (motorType.includes('IM')) opEff = 0.90;
  else if (motorType.includes('SRM')) opEff = 0.86;

  // 3. ELECTRICAL LIMITS - Current
  let iMin, iMax;
  if (is2W) { iMin = 60; iMax = 220; }
  else if (isCar) { iMin = 150; iMax = 500; }
  else if (isCV) { iMin = 300; iMax = 600; } // COMMERCIAL EV CURRENT LIMIT (MAX 600A)

  let phaseCurrent = (peakPowerKw * 1000) / (vSystem * opEff);

  if (phaseCurrent > iMax) {
      phaseCurrent = iMax;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
      notes.push(`Phase current capped at limit: ${iMax} A. Power adjusted to maintain consistency.`);
  } else if (phaseCurrent < iMin) {
      phaseCurrent = iMin;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
  }

  // 3. ELECTRICAL LIMITS - Stator Resistance & Inductance
  let resMin, resMax, indMin, indMax;
  if (is2W) { resMin = 0.01; resMax = 0.08; indMin = 0.2; indMax = 2.5; }
  else if (isCar) { resMin = 0.005; resMax = 0.04; indMin = 0.3; indMax = 5.0; }
  else if (isCV) { resMin = 0.003; resMax = 0.03; indMin = 0.5; indMax = 8.0; }

  const powerScale = Math.max(0, Math.min(1, (peakPowerKw - pMin) / (pMax - pMin)));
  const statRes = resMax - (resMax - resMin) * powerScale;
  const ind = indMax - (indMax - indMin) * powerScale;

  // 9. THERMAL LIMITS
  let coolingMethod = "Air Cooling";
  let maxTemp = "120°C";
  let thermalResStr = `${(0.05 / powerScale).toFixed(3)} K/W`;
  let flow = "N/A";

  if (isCV) {
      coolingMethod = peakPowerKw > 200 ? "Liquid + Oil Cooling" : "Liquid Cooling";
      maxTemp = "150°C"; // CV specific max temp
      const tr = 0.6 - powerScale * 0.3; // 0.6 to 0.3 K/W
      thermalResStr = `${Math.max(0.3, Math.min(0.6, tr)).toFixed(3)} K/W`;
      flow = Math.max(5, Math.min(30, peakPowerKw * 0.08)).toFixed(1) + " L/min";
  } else {
      if (peakPowerKw > 30) coolingMethod = "Liquid Cooling";
      if (peakPowerKw > 150) coolingMethod = "Liquid + Oil Cooling";
      if (peakPowerKw > 50) maxTemp = "140°C";
      if (peakPowerKw > 200) maxTemp = "155°C";
      thermalResStr = `${(0.05 / powerScale).toFixed(3)} K/W`;
      if (coolingMethod.includes("Liquid")) {
          flow = Math.max(1, Math.min(20, peakPowerKw * 0.05)).toFixed(1) + " L/min";
      }
  }

  // PHYSICAL DIMENSIONS
  let odMin, odMax, lenMin, lenMax, wMin, wMax;
  if (is2W) { odMin=100; odMax=220; wMin=3; wMax=25; lenMin=80; lenMax=200; }
  else if (isCar) { odMin=220; odMax=380; wMin=40; wMax=160; lenMin=200; lenMax=400; }
  else { odMin=350; odMax=600; wMin=150; wMax=500; lenMin=350; lenMax=700; }

  let statorOd = odMin + (odMax - odMin) * powerScale;
  let length = lenMin + (lenMax - lenMin) * powerScale;
  let weight = wMin + (wMax - wMin) * powerScale;

  let volL = Math.PI * Math.pow(statorOd / 2000, 2) * (length / 1000) * 1000;
  let actTd = tMotor / volL;

  if (actTd > 35) {
      const scale = Math.pow(actTd / 35, 1/3);
      statorOd *= scale; length *= scale; volL *= scale*scale*scale; actTd = 35;
  }

  let airGap = 0.5;
  if (statorOd < 160) airGap = 0.3;
  else if (statorOd < 320) airGap = 0.8;
  else airGap = 1.5;

  const rotorMass = weight * 0.35;
  const rotorRadM = (statorOd * 0.6) / 2000;
  const inertia = 0.5 * rotorMass * Math.pow(rotorRadM, 2);
  const bearingLoad = weight * 9.81 * 2 + tMotor * 4;
  const criticalSpeed = motorRpm * 1.30;
  const cogging = Math.max(0.1, Math.min(5, tMotor * 0.01));

  let slots = 24, poles = 16;
  if (motorType.includes('BLDC')) { slots = 18; poles = 16; }
  else if (motorType.includes('IM')) { slots = 30; poles = 4; }
  else if (motorType.includes('SRM')) { slots = 24; poles = 16; }
  else { slots = 24; poles = 20; }

  let swFreq = "10 kHz";
  if (motorType.includes('BLDC') || motorType.includes('PMSM')) swFreq = "16 kHz";
  else if (motorType.includes('IM')) swFreq = "8 kHz";

  const omegaMax = (2 * Math.PI * motorRpm) / 60;
  const backEmf = omegaMax > 0 ? ((vSystem * 0.9) / omegaMax).toFixed(4) : "0.1000";
  const continuousTorqueNm = tMotor * ((contPowerMin + contPowerMax) / 2);
  const peakEff = (opEff * 100 + 2).toFixed(1);

  const curve = [];
  for (let r = 0; r <= motorRpm + 500; r += 500) {
    const tCurve = r <= baseRpm ? tMotor : tMotor * (baseRpm / r);
    let effCurve = r > 0 ? (opEff * 100) * (1 - Math.pow(r/motorRpm - 0.65, 2) * 0.3) : 0;
    effCurve = Math.max(0, Math.min(parseFloat(peakEff), effCurve));
    curve.push({ rpm: r, torque: Math.round(tCurve), efficiency: Math.round(effCurve * 10) / 10 });
  }

  return {
    motorType,
    motorSelectionReason: reason,
    rangeLimitation: notes.length > 0 ? notes.join(' | ') : null,
    specifications: {
      peakPowerKw: parseFloat(peakPowerKw.toFixed(1)),
      continuousPowerKw: parseFloat(continuousPowerKw.toFixed(1)),
      peakTorqueNm: Math.round(tMotor),
      continuousTorqueNm: Math.round(continuousTorqueNm),
      maxRpm: Math.round(motorRpm),
      baseRpm: Math.round(baseRpm),
      operatingVoltage: Math.round(vSystem),
      peakEfficiency: `${peakEff}%`,
      operatingEfficiency: `${(opEff * 100).toFixed(1)}%`,
      weightKg: Math.round(weight)
    },
    thermal: {
      coolingMethod,
      maxCoilTemp: maxTemp,
      coolantFlowRate: flow,
      thermalResistance: thermalResStr
    },
    dimensions: {
      statorDiameter: `${Math.round(statorOd)} mm`,
      rotorDiameter: `${Math.round(statorOd * 0.6)} mm`,
      overallLength: `${Math.round(length)} mm`,
      airGap: `${parseFloat(airGap).toFixed(2)} mm`,
      poles,
      slots
    },
    electrical: {
      phaseCurrent: `${Math.round(phaseCurrent)} A (Peak)`,
      switchingDevice: vSystem > 200 ? 'IGBT' : 'MOSFET',
      switchingFreq: swFreq,
      backEmfConstant: `${backEmf} V·s/rad`,
      statorResistance: `${statRes.toFixed(4)} Ω`,
      dqInductance: `${ind.toFixed(3)} mH`,
      windingType: motorType.includes('BLDC') ? 'Concentrated' : 'Distributed'
    },
    mechanical: {
      maxTorqueDensity: `${parseFloat(actTd).toFixed(1)} Nm/L`,
      rotorInertia: `${parseFloat(inertia).toFixed(5)} kg·m²`,
      maxCentrifugalForce: `${Math.round(weight * 150)} N`,
      bearingLoad: `${Math.round(bearingLoad)} N`,
      coggingTorque: `${parseFloat(cogging).toFixed(1)} Nm`,
      criticalSpeed: `${Math.round(criticalSpeed)} RPM`,
      vehicleMass: `${Math.round(totalMass)} kg`,
      totalVehicleMass: `${Math.round(totalMass)} kg`,
      gearRatio: `${parseFloat(gearRatio).toFixed(2)}:1`,
      wheelTorque: `${Math.round(tMotor * gearRatio)} Nm`
    },
    performanceCurve: curve
  };
};
