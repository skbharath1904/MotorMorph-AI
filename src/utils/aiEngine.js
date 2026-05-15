// MotorMorph AI Engine — Master Version (Strict Power-Drives-Torque Validation)

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
  const vSystem = parseFloat(inputs.voltage) || 400;
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

  // 4. POWER LIMIT GOVERNOR - STEP 1: COMPUTE REQUIRED POWER
  const fDragCruise = 0.5 * airDensity * cd * fa * Math.pow(vMps, 2);
  const fRoll = crr * totalMass * g;
  const fCruise = fDragCruise + fRoll;
  const pCruise = (fCruise * vMps) / 1000;

  const accelTargetKmh = Math.min(vKmh, is2W ? 50 : 100);
  const accelTargetMps = accelTargetKmh / 3.6;
  const accelTime = isNaN(accelTimeRaw) ? (is2W ? 6 : isCar ? 8 : 15) : accelTimeRaw;
  const a = accelTargetMps / accelTime;
  const fAccel = totalMass * a;
  const fDragAccel = 0.5 * airDensity * cd * fa * Math.pow(accelTargetMps, 2);
  const fTotalAccel = fDragAccel + fRoll + fAccel;
  const pAccel = (fTotalAccel * accelTargetMps) / 1000;

  let vGradeMps = vMps;
  const maxGradientRad = Math.atan(gradientPercent / 100);
  const fGrade = totalMass * g * Math.sin(maxGradientRad);
  let fDragGrade = 0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2);
  let fTotalGrade = fDragGrade + fRoll + fGrade;
  let pGrade = (fTotalGrade * vGradeMps) / 1000;

  let pMin, pMax;
  if (is2W) { pMin = 0.25; pMax = 80; }
  else if (isCar) { pMin = 20; pMax = 450; }
  else if (isCV) { pMin = 50; pMax = 2000; }

  // 8. GRADIENT HANDLING RULE
  if (pGrade > pMax) {
      // Reduce climb speed until power required matches pMax
      const pAvailWatts = pMax * 1000;
      vGradeMps = pAvailWatts / fTotalGrade; // Rough reduction
      fDragGrade = 0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2);
      fTotalGrade = fDragGrade + fRoll + fGrade;
      pGrade = (fTotalGrade * vGradeMps) / 1000;
      notes.push(`Hill climb demand exceeded motor limit. Climb speed reduced to ${(vGradeMps * 3.6).toFixed(1)} km/h.`);
  }

  const pRequired = Math.max(pCruise, pAccel, pGrade);

  // 4. POWER LIMIT GOVERNOR - STEP 2: ADD MARGIN
  const margin = is2W ? 1.15 : isCar ? 1.25 : 1.35;
  let peakPowerKw = pRequired * margin;
  peakPowerKw = Math.max(pMin, Math.min(pMax, peakPowerKw));

  // MOTOR SELECTION
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
      if (peakPowerKw < 150) { motorType = MOTOR_TYPES[1]; reason = "IM: Mid-range commercial vehicles, high-speed EVs."; }
      else if (peakPowerKw <= 350) { motorType = MOTOR_TYPES[3]; reason = "SRM: Heavy commercial vehicles, trucks and buses."; }
      else { motorType = MOTOR_TYPES[3]; reason = "SRM: Rugged operation, extreme heavy commercial vehicles."; }
  }

  // GEAR RATIO SELECTION
  let grMin, grMax, grTarget;
  if (is2W) { grMin = 3; grMax = 7; grTarget = 5; }
  else if (isCar) { grMin = 7; grMax = 11; grTarget = 9; }
  else if (isCV) { grMin = 9; grMax = 16; grTarget = 12; }
  let gearRatio = grTarget;

  // RPM DEFINITION
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

  let baseRpm = Math.min(motorRpm * 0.4, rpmMax * 0.5);

  // 4. POWER LIMIT GOVERNOR - STEP 3: DERIVE TORQUE ONLY FROM POWER
  // 1. HARD TORQUE-POWER CONSISTENCY RULE: T = P / w
  let tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);

  // 6. VEHICLE TYPE TORQUE BOUNDS
  let tmMin, tmMax;
  if (is2W) { tmMin = 5; tmMax = 80; }
  else if (isCar) { tmMin = 80; tmMax = 400; }
  else if (isCV) { tmMin = 300; tmMax = 800; }

  if (tMotor < tmMin) {
      tMotor = tmMin;
      peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
      notes.push(`Motor torque increased to class limit (${tmMin} Nm), pushing power class to ${peakPowerKw.toFixed(1)} kW.`);
  } else if (tMotor > tmMax) {
      tMotor = tmMax;
      // 5. TORQUE INFLATION PREVENTION RULE: DO NOT INFLATE TORQUE. Adjust RPM to maintain power, or decrease power.
      baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
      if (baseRpm > motorRpm * 0.8) {
          baseRpm = motorRpm * 0.8;
          peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
          notes.push(`Motor torque capped at ${tmMax} Nm. Peak power adjusted downwards to preserve P = T*w.`);
      } else {
          notes.push(`Motor torque capped at ${tmMax} Nm. Base RPM shifted to maintain power output.`);
      }
  }

  // 3. WHEEL TORQUE VALIDATION RULE
  let tWheel = tMotor * gearRatio;

  let twMin, twMax;
  if (is2W) { twMin = 100; twMax = 500; }
  else if (isCar) { twMin = 1000; twMax = 5000; }
  else if (isCV) { twMin = 3000; twMax = 15000; }

  if (tWheel < twMin) {
      // 8. Increase gear ratio (first priority) to solve hill climb/torque deficits
      const requiredGr = twMin / tMotor;
      if (requiredGr <= grMax) {
          gearRatio = requiredGr;
          tWheel = tMotor * gearRatio;
      } else {
          gearRatio = grMax;
          tMotor = twMin / gearRatio;
          if (tMotor > tmMax) tMotor = tmMax;
          tWheel = tMotor * gearRatio;
          peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
          notes.push(`Wheel torque demand forced gear ratio to max (${grMax}:1) and bumped motor power class.`);
      }
  } else if (tWheel > twMax) {
      tWheel = twMax;
      tMotor = tWheel / gearRatio;
      peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
  }

  // TRACTION LIMIT CHECK
  const mu = 0.85; // coefficient of friction for dry asphalt
  const fTraction = tWheel / wheelRadius;
  const maxTractionForce = mu * totalMass * g;
  if (fTraction > maxTractionForce) {
      tWheel = maxTractionForce * wheelRadius;
      tMotor = tWheel / gearRatio;
      peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
      notes.push(`Traction limit exceeded. Torque & Power constrained to prevent wheel slip (F_trac <= mu*m*g).`);
  }

  // 9. FINAL POWER-TORQUE VALIDATION CHECK (Resynchronization)
  motorRpm = wheelRpm * gearRatio;
  baseRpm = Math.min(motorRpm * 0.4, rpmMax * 0.5);
  // Strictly enforce P = T * w one final time
  peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);

  // Continuous Power Rule
  let contPowerMin, contPowerMax;
  if (is2W) { contPowerMin = 0.55; contPowerMax = 0.75; }
  else if (isCar) { contPowerMin = 0.55; contPowerMax = 0.70; }
  else if (isCV) { contPowerMin = 0.60; contPowerMax = 0.75; }
  const continuousPowerKw = peakPowerKw * ((contPowerMin + contPowerMax) / 2);
  const continuousTorqueNm = tMotor * ((contPowerMin + contPowerMax) / 2);

  // Efficiencies
  let opEff = 0.92;
  if (motorType.includes('BLDC')) opEff = 0.88;
  else if (motorType.includes('PMSM')) opEff = 0.94;
  else if (motorType.includes('IM')) opEff = 0.90;
  else if (motorType.includes('SRM')) opEff = 0.86;

  // ELECTRICAL LIMITS - Current
  let iMin, iMax;
  if (is2W) { iMin = 60; iMax = 220; }
  else if (isCar) { iMin = 150; iMax = 500; }
  else if (isCV) { iMin = 200; iMax = 700; }

  let phaseCurrent = (peakPowerKw * 1000) / (vSystem * opEff);

  if (phaseCurrent > iMax) {
      phaseCurrent = iMax;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
      notes.push(`Current capped at ${iMax} A limit. Power & Torque strictly downgraded to match.`);
  } else if (phaseCurrent < iMin) {
      phaseCurrent = iMin;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
  }

  // ELECTRICAL LIMITS - Stator Resistance & Inductance
  let resMin, resMax, indMin, indMax;
  if (is2W) { resMin = 0.01; resMax = 0.08; indMin = 0.2; indMax = 2.5; }
  else if (isCar) { resMin = 0.005; resMax = 0.04; indMin = 0.3; indMax = 5.0; }
  else if (isCV) { resMin = 0.003; resMax = 0.03; indMin = 0.5; indMax = 8.0; }

  const powerScale = Math.max(0, Math.min(1, (peakPowerKw - pMin) / (pMax - pMin)));
  const statRes = resMax - (resMax - resMin) * powerScale;
  const ind = indMax - (indMax - indMin) * powerScale;

  // THERMAL LIMITS
  let coolingMethod = "Air Cooling";
  if (peakPowerKw > 30 || isCV) coolingMethod = "Liquid Cooling";
  if (peakPowerKw > 150) coolingMethod = "Liquid + Oil Cooling";

  let maxTemp = "120°C";
  if (peakPowerKw > 50) maxTemp = "140°C";
  if (peakPowerKw > 200 || isCV) maxTemp = "155°C";

  let flow = "N/A";
  if (coolingMethod.includes("Liquid")) {
      flow = Math.max(1, Math.min(20, peakPowerKw * 0.05)).toFixed(1) + " L/min";
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

  const peakEff = (opEff * 100 + 2).toFixed(1);

  // 2. RPM-TORQUE-POWER CONSISTENCY CHECK
  const curve = [];
  for (let r = 0; r <= motorRpm + 500; r += 500) {
    // If power is fixed -> torque MUST decrease when RPM increases (above baseRpm)
    const tCurve = r <= baseRpm ? tMotor : tMotor * (baseRpm / r);
    let effCurve = r > 0 ? (opEff * 100) * (1 - Math.pow(r/motorRpm - 0.65, 2) * 0.3) : 0;
    effCurve = Math.max(0, Math.min(parseFloat(peakEff), effCurve));
    curve.push({ rpm: r, torque: Math.round(tCurve), efficiency: Math.round(effCurve * 10) / 10 });
  }

  // 10. FINAL AI BEHAVIOR RULE - Power drives torque, Physics overrides.
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
      thermalResistance: `${(0.05 / (powerScale || 1)).toFixed(3)} K/W`
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
