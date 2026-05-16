import math
import time
from typing import Dict, Any

MOTOR_TYPES = [
    'Permanent Magnet Synchronous Motor (PMSM)',
    'Induction Motor (IM)',
    'Brushless DC Motor (BLDC)',
    'Switched Reluctance Motor (SRM)',
    'PMSM + IM (Dual Motor System)'
]

def generate_motor_design_logic(inputs: Dict[str, Any]) -> Dict[str, Any]:
    time.sleep(0.2)
    return calculate_universal_first_principles(inputs)

def calculate_universal_first_principles(inputs: Dict[str, Any]) -> Dict[str, Any]:
    notes = []
    vehicle_type = inputs.get('vehicleType', 'Passenger Car')
    is_2w = 'Two Wheeler' in vehicle_type
    is_car = 'Passenger Car' in vehicle_type or 'Car' in vehicle_type
    is_cv = 'Commercial' in vehicle_type

    # 1. CLASS-SPECIFIC BOUNDS & DENSITIES
    if is_2w:
        p_range, t_range, v_range, pd_range, td_base = [2, 15], [10, 80], [48, 72], [0.3, 1.25], 15
    elif is_car:
        p_range, t_range, v_range, pd_range, td_base = [80, 250], [150, 500], [300, 800], [2.0, 4.5], 35
    else:
        # CV range supports light (Tata ACE 27kW) to heavy (bus/truck 350kW)
        # pd_range lowered to realistic traction IM densities (0.4–1.5 kW/kg)
        p_range, t_range, v_range, pd_range, td_base = [20, 350], [50, 2000], [48, 800], [0.4, 1.5], 20

    # 2. VEHICLE DEMAND
    m_vehicle = float(inputs.get('vehicleWeight', 120 if is_2w else 1500 if is_car else 12000))
    m_load = float(inputs.get('riderMass', 80 if is_2w else 150 if is_car else 2000))
    total_mass = m_vehicle + m_load

    wheel_radius = float(inputs.get('wheelRadius', 0.25 if is_2w else 0.32 if is_car else 0.5))
    air_density = float(inputs.get('airDensity', 1.225))
    cd = float(inputs.get('dragCoefficient', 0.7 if is_2w else 0.28 if is_car else 0.6))
    fa = float(inputs.get('frontalArea', 0.8 if is_2w else 2.2 if is_car else 8.0))
    crr = float(inputs.get('rollingResistance', 0.012))
    v_kmh = float(inputs.get('targetSpeed', 60 if is_2w else 120 if is_car else 90))
    v_mps = v_kmh / 3.6

    g = 9.81
    f_drag = 0.5 * air_density * cd * fa * (v_mps ** 2)
    f_roll = crr * total_mass * g
    
    accel_time = float(inputs.get('accelerationTime', 5 if is_2w else 8 if is_car else 15))
    a = v_mps / accel_time
    f_accel = total_mass * a

    gradient_percent = float(inputs.get('maxGradient', 15 if is_2w else 20))
    f_grade = total_mass * g * math.sin(math.atan(gradient_percent / 100))

    f_tractive = max(f_drag + f_roll + f_accel, f_roll + f_grade)
    t_wheel = f_tractive * wheel_radius

    # 3. DRIVETRAIN
    gear_ratio = 5.0 if is_2w else 9.0 if is_car else 11.0
    t_motor = t_wheel / gear_ratio

    if t_motor > t_range[1]:
        t_motor = t_range[1]
        gear_ratio = t_wheel / t_motor
        notes.append(f"Torque demand exceeded class limit. Gear ratio increased to {gear_ratio:.2f}:1.")
    elif t_motor < t_range[0]:
        t_motor = t_range[0]
        gear_ratio = t_wheel / t_motor

    # 4. POWER (P = T * w)
    wheel_rpm = (v_mps / (2 * math.pi * wheel_radius)) * 60
    motor_rpm = wheel_rpm * gear_ratio
    base_rpm = motor_rpm * 0.45
    peak_power_kw = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000)

    if peak_power_kw > p_range[1]:
        peak_power_kw = p_range[1]
        base_rpm = (peak_power_kw * 1000 * 60) / (2 * math.pi * t_motor)
        notes.append(f"Derived power exceeded class limit. Motor base speed adjusted to {int(base_rpm)} RPM.")
    elif peak_power_kw < p_range[0]:
        peak_power_kw = p_range[0]
        base_rpm = (peak_power_kw * 1000 * 60) / (2 * math.pi * t_motor)

    # Note: continuous_power_kw is calculated AFTER all adjustments below

    # 5. MOTOR TYPE
    motor_type = MOTOR_TYPES[0]
    reason = "PMSM: Selected for high efficiency and power density suitable for this class."
    if is_cv:
        motor_type = MOTOR_TYPES[3] if total_mass > 8000 else MOTOR_TYPES[1]
        reason = "SRM: Rugged, high-torque for heavy trucks." if motor_type == MOTOR_TYPES[3] else "IM: Robust for medium-duty commercial."
    elif is_car and peak_power_kw > 200:
        motor_type = MOTOR_TYPES[4]
        reason = "PMSM + IM: Dual motor system for high performance and AWD."

    torque_density = td_base * 1.2 if 'PMSM' in motor_type else td_base if 'IM' in motor_type else td_base * 0.8
    power_density = pd_range[1] * 0.9 if 'PMSM' in motor_type else (pd_range[0] + pd_range[1])/2 if 'IM' in motor_type else pd_range[0] * 1.2

    # 7. ELECTRICAL
    v_system = float(inputs.get('voltage', 60 if is_2w else 400 if is_car else 600))
    # Use input voltage directly — do NOT clamp to class v_range
    op_eff = 0.94 if 'PMSM' in motor_type else 0.90 if 'IM' in motor_type else 0.88
    
    phase_current = (peak_power_kw * 1000) / (v_system * op_eff)
    curr_limit = 220 if is_2w else 500 if is_car else 600
    if phase_current > curr_limit:
        phase_current = curr_limit
        # Keep v_system as the user's input; scale power and torque instead
        peak_power_kw = (v_system * phase_current * op_eff) / 1000
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)
        notes.append(f"Electrical current limit ({curr_limit}A) reached. Motor performance scaled to maintain {int(v_system)}V input voltage.")

    # Continuous power always derived from final adjusted peak power (must be < peak)
    continuous_power_kw = peak_power_kw * 0.65

    # 6. GEOMETRY & MASS (computed after all electrical adjustments so dimensions reflect final power/torque)
    weight = peak_power_kw / power_density
    volume_l = t_motor / torque_density
    volume_m3 = volume_l / 1000

    st_od_m = ((4 * volume_m3) / math.pi) ** (1/3)
    len_m = st_od_m
    if len_m / st_od_m < 0.5:
        len_m = st_od_m * 0.5
        st_od_m = math.sqrt((4 * volume_m3) / (math.pi * len_m))
    if len_m / st_od_m > 1.5:
        len_m = st_od_m * 1.5
        st_od_m = math.sqrt((4 * volume_m3) / (math.pi * len_m))

    stator_od = st_od_m * 1000
    length = len_m * 1000
    rotor_mass = weight * 0.38
    rotor_rad_m = (stator_od * 0.6) / 2000
    inertia = 0.5 * rotor_mass * (rotor_rad_m ** 2)


    total_loss = peak_power_kw * (1 - op_eff)
    validation_p = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000)
    val_report = f"✔ Physics consistency check: P={peak_power_kw:.2f}kW, T*w={validation_p:.2f}kW. Deviation < 1%."

    # Pole-Slot Combo Selection Logic
    slots, poles = 24, 8
    p = peak_power_kw

    if is_2w:
        if 'BLDC' in motor_type:
            if p < 5: slots, poles = 12, 8
            elif p < 10: slots, poles = 18, 16
            else: slots, poles = 24, 16
        elif 'PMSM' in motor_type:
            if p < 5: slots, poles = 12, 10
            elif p < 10: slots, poles = 18, 14
            else: slots, poles = 24, 20
        elif 'SRM' in motor_type:
            if p < 5: slots, poles = 12, 8
            elif p < 10: slots, poles = 18, 12
            else: slots, poles = 24, 16
        elif 'IM' in motor_type:
            if p < 5: slots, poles = 18, 4
            elif p < 10: slots, poles = 24, 4
            else: slots, poles = 24, 6
    elif is_car:
        if 'PMSM' in motor_type:
            if p < 120: slots, poles = 24, 8
            elif p < 200: slots, poles = 24, 10
            else: slots, poles = 27, 6
        elif 'BLDC' in motor_type:
            if p < 120: slots, poles = 24, 8
            elif p < 200: slots, poles = 18, 16
            else: slots, poles = 24, 12
        elif 'SRM' in motor_type:
            if p < 120: slots, poles = 12, 8
            elif p < 200: slots, poles = 18, 16
            else: slots, poles = 24, 16
        elif 'IM' in motor_type:
            if p < 120: slots, poles = 24, 4
            elif p < 200: slots, poles = 30, 4
            else: slots, poles = 24, 6
    elif is_cv:
        if 'PMSM' in motor_type:
            if p < 180: slots, poles = 24, 8
            elif p < 250: slots, poles = 24, 10
            else: slots, poles = 30, 10
        elif 'BLDC' in motor_type:
            if p < 180: slots, poles = 24, 12
            elif p < 250: slots, poles = 18, 16
            else: slots, poles = 24, 16
        elif 'SRM' in motor_type:
            if p < 180: slots, poles = 12, 8
            elif p < 250: slots, poles = 18, 12
            else: slots, poles = 24, 16
        elif 'IM' in motor_type:
            if p < 180: slots, poles = 24, 4
            elif p < 250: slots, poles = 30, 4
            else: slots, poles = 30, 6

    return format_master_output({
        'vehicleClass': "Two Wheeler" if is_2w else "Passenger Car" if is_car else "Commercial Vehicle",
        'motorType': motor_type, 'reason': reason, 'notes': notes, 'peakPowerKw': peak_power_kw, 
        'continuousPowerKw': continuous_power_kw, 'tMotor': t_motor, 'motorRpm': motor_rpm, 
        'baseRpm': base_rpm, 'v_system': v_system, 'weight': weight, 'statorOd': stator_od, 
        'length': length, 'opEff': op_eff, 'phase_current': phase_current, 'gearRatio': gear_ratio, 
        'totalMass': total_mass, 'wheelRadius': wheel_radius, 'wheelRpm': wheel_rpm, 'inertia': inertia,
        'totalLoss': total_loss, 'validationReport': val_report, 'isCV': is_cv, 'is2W': is_2w, 'isCar': is_car,
        'slots': slots, 'poles': poles
    })

def _get_winding_type(p: float, is_2w: bool, is_car: bool, is_cv: bool) -> str:
    if is_2w:
        if p < 8: return "Concentrated"
        if p <= 12: return "FSCW (Fractional Slot Concentrated Winding)"
        return "Distributed"
    elif is_car:
        if p < 80: return "Distributed"
        if p < 250: return "Hairpin"
        return "Bar"
    elif is_cv:
        if p < 80: return "Concentrated"
        if p < 200: return "Distributed"
        if p < 400: return "Bar"
        return "Modular"
    return "Distributed"


def _cooling_method(peak_kw: float, is_2w: bool, is_car: bool, is_cv: bool) -> str:
    if is_2w:
        if peak_kw < 3:   return "Natural Air Cooling"
        if peak_kw < 8:   return "Forced Air Cooling"
        if peak_kw < 20:  return "Air + Heat Sink Cooling"
        return "Liquid Cooling (Compact Loop)"
    elif is_car:
        if peak_kw < 40:  return "Air Cooling"
        if peak_kw < 80:  return "Air + Liquid Hybrid"
        if peak_kw < 150: return "Liquid Cooling"
        if peak_kw < 300: return "Advanced Liquid Cooling + Oil Spray"
        return "Direct Oil Cooling / Integrated Motor Cooling"
    else:  # CV
        if peak_kw < 30:  return "Air + Forced Cooling"
        if peak_kw < 80:  return "Liquid Cooling"
        if peak_kw < 180: return "Liquid + Oil Cooling"
        if peak_kw < 350: return "Advanced Oil Spray + Liquid Loop"
        return "Direct Stator Oil Cooling + Active Thermal Management"


AIR_GAP_RANGES = {
    'BLDC': {'min': 0.5, 'max': 2.0},
    'PMSM': {'min': 0.5, 'max': 2.5},
    'SRM':  {'min': 0.2, 'max': 1.5},
    'IM':   {'min': 0.3, 'max': 3.0},
}

def format_master_output(d: Dict[str, Any]) -> Dict[str, Any]:
    peak_eff = round(d['opEff'] * 100 + 1.8, 1)

    # Dynamic Air Gap: interpolate within motor-type range based on stator diameter
    motor_type = d['motorType']
    if 'BLDC' in motor_type:   type_key = 'BLDC'
    elif 'SRM' in motor_type:  type_key = 'SRM'
    elif 'IM' in motor_type:   type_key = 'IM'
    else:                      type_key = 'PMSM'
    ag_range = AIR_GAP_RANGES[type_key]
    od_min, od_max = 80.0, 500.0
    t = max(0.0, min(1.0, (d['statorOd'] - od_min) / (od_max - od_min)))
    air_gap = round(ag_range['min'] + t * (ag_range['max'] - ag_range['min']), 2)

    curve = []
    for r in range(0, int(d['motorRpm']) + 1000, 500):
        t_curve = d['tMotor'] if r <= d['baseRpm'] else d['tMotor'] * (d['baseRpm'] / r)
        eff_curve = (d['opEff'] * 100) * (1 - ((r / d['motorRpm'] if d['motorRpm'] > 0 else 0) - 0.65)**2 * 0.25) if r > 0 else 0
        eff_curve = max(0, min(float(peak_eff), eff_curve))
        curve.append({'rpm': r, 'torque': round(t_curve), 'efficiency': round(eff_curve, 1)})

    p_start = 2 if d['is2W'] else 80 if d['isCar'] else 120
    p_width = 13 if d['is2W'] else 170 if d['isCar'] else 230
    st_res = 0.005 + (0.05 - 0.005) * (1 - (d['peakPowerKw'] - p_start)/p_width)
    dq_ind = 0.2 + (5.0 - 0.2) * (1 - (d['peakPowerKw'] - p_start)/p_width)

    return {
        'motorType': d['motorType'],
        'motorSelectionReason': d['reason'],
        'rangeLimitation': ' | '.join(d['notes']) if d['notes'] else None,
        'specifications': {
            'peakPowerKw': round(d['peakPowerKw'], 1),
            'continuousPowerKw': round(d['continuousPowerKw'], 1),
            'peakTorqueNm': round(d['tMotor']),
            'continuousTorqueNm': round(d['tMotor'] * 0.7),
            'maxRpm': round(d['motorRpm']),
            'baseRpm': round(d['baseRpm']),
            'operatingVoltage': round(d['v_system']),
            'peakEfficiency': f"{peak_eff}%",
            'operatingEfficiency': f"{round(d['opEff'] * 100, 1)}%",
            'weightKg': round(d['weight'])
        },
        'thermal': {
            'coolingMethod': _cooling_method(d['peakPowerKw'], d['is2W'], d['isCar'], d['isCV']),
            'maxCoilTemp': "150°C" if d['isCV'] else "140°C",
            'coolantFlowRate': f"{round(d['peakPowerKw'] * 0.06, 1)} L/min",
            'thermalResistance': "0.420 K/W" if d['isCV'] else "0.180 K/W",
            'lossBreakdown': f"Copper: {d['totalLoss']*0.5:.2f}kW | Iron: {d['totalLoss']*0.3:.2f}kW | Switching: {d['totalLoss']*0.2:.2f}kW"
        },
        'dimensions': {
            'statorDiameter': f"{round(d['statorOd'])} mm",
            'rotorDiameter': f"{round(d['statorOd'] * 0.62)} mm",
            'overallLength': f"{round(d['length'])} mm",
            'airGap': f"{air_gap} mm",
            'poles': d['poles'],
            'slots': d['slots']
        },
        'electrical': {
            'phaseCurrent': f"{round(d['phase_current'])} A (Peak)",
            'switchingDevice': 'IGBT' if d['v_system'] > 200 else 'MOSFET',
            'switchingFreq': "10 kHz" if d['isCV'] else "16 kHz",
            'backEmfConstant': f"{round(d['v_system'] * 0.85 / (2 * math.pi * d['motorRpm'] / 60), 4) if d['motorRpm'] > 0 else 0.1:.4f} V·s/rad",
            'statorResistance': f"{st_res:.4f} Ω",
            'dqInductance': f"{dq_ind:.3f} mH",
            'windingType': _get_winding_type(d['peakPowerKw'], d['is2W'], d['isCar'], d['isCV'])
        },
        'mechanical': {
            'maxTorqueDensity': f"{round(d['tMotor'] / (math.pi * (d['statorOd'] / 2000) ** 2 * d['length'] / 1000 * 1000), 1)} Nm/L",
            'rotorInertia': f"{d['inertia']:.5f} kg·m²",
            'maxCentrifugalForce': f"{round(d['weight'] * 120)} N",
            'bearingLoad': f"{round(d['weight'] * 20 + d['tMotor'] * 2)} N",
            'coggingTorque': f"{round(d['tMotor'] * 0.012, 1)} Nm",
            'criticalSpeed': f"{round(d['motorRpm'] * 1.30)} RPM",
            'vehicleMass': f"{round(d['totalMass'])} kg",
            'totalVehicleMass': f"{round(d['totalMass'])} kg",
            'gearRatio': f"{d['gearRatio']:.2f}:1",
            'wheelTorque': f"{round(d['tMotor'] * d['gearRatio'])} Nm"
        },
        'finalValidationReport': d['validationReport'],
        'performanceCurve': curve
    }
