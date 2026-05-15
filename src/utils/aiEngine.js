// MotorMorph AI Engine — Master Version (Strict Power-Drives-Torque + Output Limits)

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

  // LOAD CATEGORY LIMITS
  let pMin, pMax, contMin, contMax, tmMin, tmMax, twMin, twMax;
  let rpmMin, rpmMax, vMin, vMax, iMin, iMax, wMin, wMax;
  let resMin, resMax, indMin, indMax, emfMin, emfMax, trMin, trMax;
  let polesMin, polesMax, slotsMin, slotsMax;

  if (is2W) {
    pMin=0.5; pMax=20; contMin=0.3; contMax=15; tmMin=5; tmMax=80; twMin=50; twMax=500;
    rpmMin=2000; rpmMax=8000; vMin=48; vMax=96; iMin=50; iMax=220; wMin=3; wMax=12;
    resMin=0.01; resMax=0.08; indMin=0.2; indMax=2.0; emfMin=0.05; emfMax=0.25; trMin=0.10; trMax=0.40;
    polesMin=4; polesMax=12; slotsMin=12; slotsMax=36;
  } else if (isCar) {
    pMin=50; pMax=400; contMin=30; contMax=250; tmMin=80; tmMax=450; twMin=1000; twMax=6000;
    rpmMin=3000; rpmMax=16000; vMin=300; vMax=800; iMin=150; iMax=500; wMin=40; wMax=120;
    resMin=0.005; resMax=0.04; indMin=0.3; indMax=5.0; emfMin=0.1; emfMax=0.6; trMin=0.05; trMax=0.20;
    polesMin=4; polesMax=10; slotsMin=24; slotsMax=72;
  } else {
    pMin=80; pMax=1200; contMin=60; contMax=800; tmMin=300; tmMax=1200; twMin=3000; twMax=15000;
    rpmMin=1500; rpmMax=9000; vMin=400; vMax=1200; iMin=200; iMax=800; wMin=120; wMax=600;
    resMin=0.003; resMax=0.03; indMin=0.5; indMax=8.0; emfMin=0.2; emfMax=1.2; trMin=0.03; trMax=0.15;
    polesMin=8; polesMax=24; slotsMin=24; slotsMax=96;
  }

  const vKmh = parseFloat(inputs.targetSpeed) || 120;
  let vSystem = parseFloat(inputs.voltage) || 400;
  
  // CLAMP VOLTAGE
  if (vSystem < vMin) { vSystem = vMin; notes.push(`Voltage clamped to minimum ${vMin}V.`); }
  if (vSystem > vMax) { vSystem = vMax; notes.push(`Voltage clamped to maximum ${vMax}V.`); }

  const mVehicle = parseFloat(inputs.vehicleWeight) || 1500;
  const mLoad = parseFloat(inputs.riderMass) || 150;
  const cd = parseFloat(inputs.dragCoefficient) || 0.3;
  const fa = parseFloat(inputs.frontalArea) || 2.2;
  const crr = parseFloat(inputs.rollingResistance) || 0.015;
  const wheelRadius = parseFloat(inputs.wheelRadius) || 0.3;
  const gradientPercent = parseFloat(inputs.maxGradient) || 10;
  const airDensity = parseFloat(inputs.airDensity) || 1.225;
  const accelTimeRaw = parseFloat(inputs.accelerationTime);

  // 1. VEHICLE DYNAMICS
  const totalMass = mVehicle + mLoad;
  const g = 9.81;
  const vMps = vKmh / 3.6;

  // POWER COMPUTATION
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

  if (pGrade > pMax) {
      const pAvailWatts = pMax * 1000;
      vGradeMps = pAvailWatts / fTotalGrade;
      fDragGrade = 0.5 * airDensity * cd * fa * Math.pow(vGradeMps, 2);
      fTotalGrade = fDragGrade + fRoll + fGrade;
      pGrade = (fTotalGrade * vGradeMps) / 1000;
      notes.push(`Hill climb demand exceeded motor limit. Speed clamped.`);
  }

  const pRequired = Math.max(pCruise, pAccel, pGrade);
  const margin = is2W ? 1.15 : isCar ? 1.25 : 1.35;
  let peakPowerKw = pRequired * margin;

  // CLAMP POWER
  if (peakPowerKw < pMin) { peakPowerKw = pMin; notes.push(`Power clamped to min ${pMin}kW.`); }
  if (peakPowerKw > pMax) { peakPowerKw = pMax; notes.push(`Power clamped to max ${pMax}kW.`); }

  // MOTOR SELECTION
  let motorType = MOTOR_TYPES[0];
  let reason = "";
  if (is2W) {
      if (peakPowerKw < 8) { motorType = MOTOR_TYPES[2]; reason = "BLDC: Low-cost EVs."; }
      else { motorType = MOTOR_TYPES[0]; reason = "PMSM: High efficiency EVs."; }
  } else if (isCar) {
      if (peakPowerKw < 80) { motorType = MOTOR_TYPES[0]; reason = "PMSM: Passenger cars."; }
      else if (peakPowerKw <= 200) { motorType = MOTOR_TYPES[0]; reason = "PMSM: Performance passenger car."; }
      else { motorType = MOTOR_TYPES[4]; reason = "PMSM + IM: Power > 200 kW."; }
  } else if (isCV) {
      if (peakPowerKw < 150) { motorType = MOTOR_TYPES[1]; reason = "IM: Mid-range CV."; }
      else if (peakPowerKw <= 350) { motorType = MOTOR_TYPES[3]; reason = "SRM: Heavy CV."; }
      else { motorType = MOTOR_TYPES[3]; reason = "SRM: Extreme heavy CV."; }
  }

  // RPM DEFINITION & CLAMPING
  const wheelRpm = (vMps / (2 * Math.PI * wheelRadius)) * 60;
  let grTarget = is2W ? 5 : isCar ? 9 : 12;
  let gearRatio = grTarget;
  let motorRpm = wheelRpm * gearRatio;

  if (motorRpm < rpmMin) {
      motorRpm = rpmMin;
      gearRatio = motorRpm / wheelRpm;
      notes.push(`Motor RPM clamped to min ${rpmMin}. Gear ratio adjusted.`);
  } else if (motorRpm > rpmMax) {
      motorRpm = rpmMax;
      gearRatio = motorRpm / wheelRpm;
      notes.push(`Motor RPM clamped to max ${rpmMax}. Gear ratio adjusted.`);
  }

  let baseRpm = Math.min(motorRpm * 0.4, rpmMax * 0.5);

  // TORQUE COMPUTATION
  let tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);

  // CLAMP MOTOR TORQUE & UPSTREAM RECALC
  if (tMotor < tmMin) {
      tMotor = tmMin;
      peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
      notes.push(`Motor torque clamped to min ${tmMin}Nm. Power recalculated.`);
  } else if (tMotor > tmMax) {
      tMotor = tmMax;
      baseRpm = (peakPowerKw * 1000 * 60) / (2 * Math.PI * tMotor);
      if (baseRpm > motorRpm * 0.8) {
          baseRpm = motorRpm * 0.8;
          peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
          notes.push(`Motor torque clamped to max ${tmMax}Nm. Power adjusted.`);
      }
  }

  // WHEEL TORQUE VALIDATION
  let tWheel = tMotor * gearRatio;

  if (tWheel < twMin) {
      const requiredGr = twMin / tMotor;
      gearRatio = requiredGr;
      tWheel = tMotor * gearRatio;
      notes.push(`Gear ratio bumped to meet min wheel torque.`);
  } else if (tWheel > twMax) {
      tWheel = twMax;
      tMotor = tWheel / gearRatio;
      peakPowerKw = (tMotor * 2 * Math.PI * baseRpm) / (60 * 1000);
      notes.push(`Wheel torque clamped to max ${twMax}Nm. Upstream adjusted.`);
  }

  // RE-CLAMP POWER JUST IN CASE
  if (peakPowerKw < pMin) { peakPowerKw = pMin; tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm); }
  if (peakPowerKw > pMax) { peakPowerKw = pMax; tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm); }

  // CONTINUOUS POWER
  let contPowerMinPercent, contPowerMaxPercent;
  if (is2W) { contPowerMinPercent = 0.55; contPowerMaxPercent = 0.75; }
  else if (isCar) { contPowerMinPercent = 0.55; contPowerMaxPercent = 0.70; }
  else if (isCV) { contPowerMinPercent = 0.60; contPowerMaxPercent = 0.75; }
  
  let continuousPowerKw = peakPowerKw * ((contPowerMinPercent + contPowerMaxPercent) / 2);
  // Clamp Continuous Power
  if (continuousPowerKw < contMin) continuousPowerKw = contMin;
  if (continuousPowerKw > contMax) continuousPowerKw = contMax;
  const continuousTorqueNm = tMotor * (continuousPowerKw / peakPowerKw);

  // EFFICIENCIES
  let opEff = 0.92;
  if (motorType.includes('BLDC')) opEff = 0.88;
  else if (motorType.includes('PMSM')) opEff = 0.94;
  else if (motorType.includes('IM')) opEff = 0.90;
  else if (motorType.includes('SRM')) opEff = 0.86;

  // CURRENT CLAMPING
  let phaseCurrent = (peakPowerKw * 1000) / (vSystem * opEff);
  if (phaseCurrent > iMax) {
      phaseCurrent = iMax;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
      notes.push(`Current clamped to max ${iMax}A. Power/Torque adjusted.`);
  } else if (phaseCurrent < iMin) {
      phaseCurrent = iMin;
      peakPowerKw = (phaseCurrent * vSystem * opEff) / 1000;
      tMotor = (peakPowerKw * 1000 * 60) / (2 * Math.PI * baseRpm);
      notes.push(`Current clamped to min ${iMin}A. Power/Torque adjusted.`);
  }

  // ELECTRICAL PARAMETERS
  const powerScale = Math.max(0, Math.min(1, (peakPowerKw - pMin) / (pMax - pMin)));
  let statRes = resMax - (resMax - resMin) * powerScale;
  let ind = indMax - (indMax - indMin) * powerScale;
  
  // Back EMF
  const omegaMax = (2 * Math.PI * motorRpm) / 60;
  let backEmf = omegaMax > 0 ? ((vSystem * 0.9) / omegaMax) : emfMin;
  if (backEmf < emfMin) backEmf = emfMin;
  if (backEmf > emfMax) backEmf = emfMax;

  // THERMAL LIMITS
  let coolingMethod = "Air Cooling";
  if (peakPowerKw > 30 || isCV) coolingMethod = "Liquid Cooling";
  if (peakPowerKw > 150) coolingMethod = "Liquid + Oil Cooling";

  let maxTemp = "120°C";
  if (coolingMethod.includes("Liquid + Oil")) maxTemp = "155°C";
  else if (coolingMethod.includes("Liquid")) maxTemp = "140°C";

  let flow = "N/A";
  if (coolingMethod.includes("Liquid")) {
      flow = Math.max(1, Math.min(20, peakPowerKw * 0.05)).toFixed(1) + " L/min";
  }
  
  let thermalRes = trMax - (trMax - trMin) * powerScale;
  if (thermalRes < trMin) thermalRes = trMin;
  if (thermalRes > trMax) thermalRes = trMax;

  // WEIGHT & DIMENSIONS
  let weight = wMin + (wMax - wMin) * powerScale;
  if (weight < wMin) weight = wMin;
  if (weight > wMax) weight = wMax;

  let statorOd = 100 + weight * 2; 
  if (isCar) statorOd = 200 + weight * 1.5;
  if (isCV) statorOd = 300 + weight * 0.8;

  let length = statorOd * 0.8;
  
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

  // POLE-SLOT LIMIT RULES
  let poles = is2W ? 8 : isCar ? 8 : 16;
  if (motorRpm > 8000 && poles > 12) poles = 12;
  if (poles < polesMin) poles = polesMin;
  if (poles > polesMax) poles = polesMax;
  
  // Ensure pole count <= 24
  if (poles > 24) poles = 24;

  let slots = poles * 3; // Common ratio 3
  if (slots < slotsMin) slots = slotsMin;
  if (slots > slotsMax) slots = slotsMax;

  let ratio = slots / poles;
  if (ratio < 1) slots = poles;
  if (ratio > 6) slots = poles * 6;

  let swFreq = "10 kHz";
  if (motorType.includes('BLDC') || motorType.includes('PMSM')) swFreq = "16 kHz";
  else if (motorType.includes('IM')) swFreq = "8 kHz";

  const peakEff = (opEff * 100 + 2).toFixed(1);
  const curve = [];
  for (let r = 0; r <= motorRpm + 500; r += 500) {
    const tCurve = r <= baseRpm ? tMotor : tMotor * (baseRpm / r);
    let effCurve = r > 0 ? (opEff * 100) * (1 - Math.pow(r/motorRpm - 0.65, 2) * 0.3) : 0;
    effCurve = Math.max(0, Math.min(parseFloat(peakEff), effCurve));
    curve.push({ rpm: r, torque: Math.round(tCurve), efficiency: Math.round(effCurve * 10) / 10 });
  }

  // FORMATTING FINAL OUPUT
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
      thermalResistance: `${thermalRes.toFixed(3)} K/W`
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
      backEmfConstant: `${parseFloat(backEmf).toFixed(4)} V·s/rad`,
      statorResistance: `${statRes.toFixed(4)} Ω`,
      dqInductance: `${ind.toFixed(3)} mH`,
      windingType: motorType.includes('BLDC') ? 'Concentrated' : 'Distributed'
    },
    mechanical: {
      maxTorqueDensity: `${(tMotor / (Math.PI * Math.pow(statorOd / 2000, 2) * (length / 1000) * 1000)).toFixed(1)} Nm/L`,
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
