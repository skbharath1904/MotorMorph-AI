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
    
    notes = []
    vehicle_type = inputs.get('vehicleType', 'Passenger Car')
    is_2w = 'Two Wheeler' in vehicle_type
    is_car = 'Passenger Car' in vehicle_type or 'Car' in vehicle_type
    is_cv = 'Commercial' in vehicle_type

    if is_cv:
        return calculate_commercial_first_principles(inputs, notes)

    # --- ORIGINAL LOGIC FOR 2W AND CARS ---
    v_kmh = float(inputs.get('targetSpeed', 120))
    v_system = float(inputs.get('voltage', 400))
    m_vehicle = float(inputs.get('vehicleWeight', 1500))
    m_load = float(inputs.get('riderMass', 150))
    cd = float(inputs.get('dragCoefficient', 0.3))
    fa = float(inputs.get('frontalArea', 2.2))
    crr = float(inputs.get('rollingResistance', 0.015))
    wheel_radius = float(inputs.get('wheelRadius', 0.3))
    gradient_percent = float(inputs.get('maxGradient', 10))
    air_density = float(inputs.get('airDensity', 1.225))
    
    try:
        accel_time_raw = float(inputs.get('accelerationTime', '8'))
    except ValueError:
        accel_time_raw = float('nan')

    total_mass = m_vehicle + m_load
    g = 9.81
    v_mps = v_kmh / 3.6

    f_drag_cruise = 0.5 * air_density * cd * fa * (v_mps ** 2)
    f_roll = crr * total_mass * g
    f_cruise = f_drag_cruise + f_roll

    accel_target_kmh = min(v_kmh, 50 if is_2w else 100)
    accel_target_mps = accel_target_kmh / 3.6
    accel_time = 6 if is_2w else 8 if is_car else 15
    if not math.isnan(accel_time_raw):
        accel_time = accel_time_raw
    
    a = accel_target_mps / accel_time
    f_accel = total_mass * a

    v_grade_mps = v_mps
    max_gradient_rad = math.atan(gradient_percent / 100)
    f_grade = total_mass * g * math.sin(max_gradient_rad)
    f_drag_accel = 0.5 * air_density * cd * fa * (accel_target_mps ** 2)
    f_total_accel = f_drag_accel + f_roll + f_accel
    f_drag_grade = 0.5 * air_density * cd * fa * (v_grade_mps ** 2)
    f_total_grade = f_drag_grade + f_roll + f_grade

    p_cruise = (f_cruise * v_mps) / 1000
    p_accel = (f_total_accel * accel_target_mps) / 1000
    p_grade = (f_total_grade * v_grade_mps) / 1000

    p_min, p_max = (0.25, 80) if is_2w else (20, 450)
    raw_peak_power = max(p_cruise, p_accel, p_grade)

    if raw_peak_power > p_max and p_grade > p_max:
        p_avail_for_grade = p_max * 1000
        v_grade_mps = p_avail_for_grade / f_total_grade
        notes.append(f"Gradient demand exceeded vehicle limits: Climb speed reduced to {v_grade_mps * 3.6:.1f} km/h.")
        f_total_grade = (0.5 * air_density * cd * fa * (v_grade_mps ** 2)) + f_roll + f_grade
        p_grade = (f_total_grade * v_grade_mps) / 1000
        raw_peak_power = max(p_cruise, p_accel, p_grade)

    peak_power_kw = max(p_min, min(p_max, raw_peak_power))
    cont_power_min, cont_power_max = (0.55, 0.75) if is_2w else (0.55, 0.70)
    continuous_power_kw = peak_power_kw * ((cont_power_min + cont_power_max) / 2)

    motor_type, reason = (MOTOR_TYPES[2], "BLDC: Low-cost EVs.") if is_2w and peak_power_kw < 8 else \
                        (MOTOR_TYPES[0], "PMSM: High efficiency EVs.") if is_2w else \
                        (MOTOR_TYPES[0], "PMSM: High efficiency EVs.") if is_car and peak_power_kw < 80 else \
                        (MOTOR_TYPES[0], "PMSM: High performance standard.") if is_car and peak_power_kw <= 200 else \
                        (MOTOR_TYPES[4], "PMSM + IM Dual Motor.")

    gr_min, gr_max, gr_target = (3, 7, 5) if is_2w else (7, 11, 9)
    gear_ratio = gr_target
    wheel_rpm = (v_mps / (2 * math.pi * wheel_radius)) * 60
    motor_rpm = wheel_rpm * gear_ratio

    rpm_min, rpm_max = (3000, 8000) if 'BLDC' in motor_type else (4000, 18000)
    if motor_rpm > rpm_max:
        motor_rpm = rpm_max
        gear_ratio = motor_rpm / wheel_rpm
    elif motor_rpm < rpm_min:
        motor_rpm = rpm_min
        gear_ratio = motor_rpm / wheel_rpm

    base_rpm = min(motor_rpm * 0.4, rpm_max * 0.5)
    t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)

    op_eff = 0.88 if 'BLDC' in motor_type else 0.94 if 'PMSM' in motor_type else 0.90
    i_min, i_max = (60, 220) if is_2w else (150, 500)
    phase_current = (peak_power_kw * 1000) / (v_system * op_eff)
    if phase_current > i_max:
        phase_current = i_max
        peak_power_kw = (phase_current * v_system * op_eff) / 1000
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)

    power_scale = max(0.0, min(1.0, (peak_power_kw - p_min) / (p_max - p_min)))
    weight = (3 if is_2w else 40) + (22 if is_2w else 120) * power_scale
    stator_od = (100 if is_2w else 220) + weight * (2 if is_2w else 1.5)
    length = stator_od * 0.8

    return format_output({
        'motorType': motor_type, 'reason': reason, 'notes': notes, 'peakPowerKw': peak_power_kw, 
        'continuousPowerKw': continuous_power_kw, 'tMotor': t_motor, 'motorRpm': motor_rpm, 
        'baseRpm': base_rpm, 'v_system': v_system, 'weight': weight, 'statorOd': stator_od, 
        'length': length, 'opEff': op_eff, 'phaseCurrent': phase_current, 'gearRatio': gear_ratio, 
        'totalMass': total_mass, 'wheelRadius': wheel_radius, 'wheelRpm': wheel_rpm, 'isCV': False
    })

def calculate_commercial_first_principles(inputs: Dict[str, Any], notes: list) -> Dict[str, Any]:
    v_kmh = float(inputs.get('targetSpeed', 90))
    v_system = float(inputs.get('voltage', 600))
    v_system = max(400, min(800, v_system))

    m_vehicle = float(inputs.get('vehicleWeight', 12000))
    m_load = float(inputs.get('riderMass', 2000))
    total_mass = max(3000, min(18000, m_vehicle + m_load))

    cd = float(inputs.get('dragCoefficient', 0.6))
    fa = float(inputs.get('frontalArea', 8.0))
    crr = float(inputs.get('rollingResistance', 0.012))
    wheel_radius = float(inputs.get('wheelRadius', 0.5))
    air_density = float(inputs.get('airDensity', 1.225))
    gradient_percent = max(20, min(30, float(inputs.get('maxGradient', 20))))

    g = 9.81
    v_mps = v_kmh / 3.6
    f_drag = 0.5 * air_density * cd * fa * (v_mps ** 2)
    f_roll = crr * total_mass * g
    f_grade = total_mass * g * math.sin(math.atan(gradient_percent / 100))
    
    a = (50 / 3.6) / 15
    f_accel = total_mass * a

    f_tractive = max(f_drag + f_roll + f_accel, f_roll + f_grade)
    t_wheel = f_tractive * wheel_radius

    gear_ratio = 12.0
    t_motor = t_wheel / gear_ratio
    
    if t_motor > 2000:
        t_motor = 2000
        gear_ratio = t_wheel / t_motor
        if gear_ratio > 14:
            gear_ratio = 14
            t_motor = t_wheel / gear_ratio
            notes.append("Torque demand exceeds 2000Nm limit even at 14:1 gear ratio. Performance may be limited.")
    elif t_motor < 600:
        t_motor = 600
        gear_ratio = t_wheel / t_motor
        if gear_ratio < 8:
            gear_ratio = 8

    wheel_rpm = (v_mps / (2 * math.pi * wheel_radius)) * 60
    motor_rpm = wheel_rpm * gear_ratio
    motor_rpm = max(4000, min(8000, motor_rpm))
    
    base_rpm = motor_rpm * 0.45
    peak_power_kw = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000)

    if peak_power_kw > 350:
        peak_power_kw = 350
        base_rpm = (peak_power_kw * 1000 * 60) / (2 * math.pi * t_motor)
        notes.append("Peak power capped at 350 kW limit. Base speed adjusted.")
    elif peak_power_kw < 120:
        peak_power_kw = 120
        base_rpm = (peak_power_kw * 1000 * 60) / (2 * math.pi * t_motor)

    continuous_power_kw = peak_power_kw * 0.7

    motor_type = MOTOR_TYPES[3]
    reason = "SRM: High torque, rugged, and low cost for heavy-duty commercial trucks."
    if total_mass < 8000:
        motor_type = MOTOR_TYPES[1]
        reason = "IM: Suitable for medium-duty commercial delivery vehicles."
    elif 'Bus' in inputs.get('vehicleType', ''):
        motor_type = MOTOR_TYPES[0]
        reason = "PMSM: High efficiency and low noise for premium electric buses."

    power_density = 3.5 if 'PMSM' in motor_type else 2.5 if 'IM' in motor_type else 1.8
    weight = peak_power_kw / power_density

    torque_density = 35 if 'PMSM' in motor_type else 25 if 'IM' in motor_type else 20
    volume_l = t_motor / torque_density
    volume_m3 = volume_l / 1000

    stator_od_m = ((4 * volume_m3) / math.pi) ** (1/3)
    length_m = stator_od_m
    
    if length_m / stator_od_m < 0.5:
        length_m = stator_od_m * 0.5
        stator_od_m = math.sqrt((4 * volume_m3) / (math.pi * length_m))
    if length_m / stator_od_m > 1.5:
        length_m = stator_od_m * 1.5
        stator_od_m = math.sqrt((4 * volume_m3) / (math.pi * length_m))

    stator_od = stator_od_m * 1000
    length = length_m * 1000

    op_eff = 0.95 if 'PMSM' in motor_type else 0.91 if 'IM' in motor_type else 0.88
    phase_current = (peak_power_kw * 1000) / (v_system * op_eff)
    
    if phase_current > 600:
        phase_current = 600
        v_system = (peak_power_kw * 1000) / (phase_current * op_eff)
        if v_system > 800:
            v_system = 800
            peak_power_kw = (v_system * phase_current * op_eff) / 1000
            t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)
            notes.append("Current limit hit. Power and Torque reduced to maintain electrical feasibility.")
        else:
            notes.append("Current limit hit. System voltage increased to compensate.")

    return format_output({
        'motorType': motor_type, 'reason': reason, 'notes': notes, 'peakPowerKw': peak_power_kw, 
        'continuousPowerKw': continuous_power_kw, 'tMotor': t_motor, 'motorRpm': motor_rpm, 
        'baseRpm': base_rpm, 'v_system': v_system, 'weight': weight, 'statorOd': stator_od, 
        'length': length, 'opEff': op_eff, 'phaseCurrent': phase_current, 'gearRatio': gear_ratio, 
        'totalMass': total_mass, 'wheelRadius': wheel_radius, 'wheelRpm': wheel_rpm, 'isCV': True
    })

def format_output(d: Dict[str, Any]) -> Dict[str, Any]:
    peak_eff = round(d['opEff'] * 100 + 1.5, 1)
    air_gap = 0.3 if d['statorOd'] < 160 else 0.8 if d['statorOd'] < 320 else 1.5
    rotor_mass = d['weight'] * 0.38
    rotor_rad_m = (d['statorOd'] * 0.65) / 2000
    inertia = 0.5 * rotor_mass * (rotor_rad_m ** 2)

    curve = []
    for r in range(0, int(d['motorRpm']) + 1000, 500):
        t_curve = d['tMotor'] if r <= d['baseRpm'] else d['tMotor'] * (d['baseRpm'] / r)
        eff_curve = (d['opEff'] * 100) * (1 - ((r / d['motorRpm'] - 0.65) ** 2) * 0.25) if r > 0 else 0
        eff_curve = max(0, min(float(peak_eff), eff_curve))
        curve.append({'rpm': r, 'torque': round(t_curve), 'efficiency': round(eff_curve, 1)})

    power_range = 230 if d['isCV'] else 100
    power_start = 120 if d['isCV'] else 20
    stator_resistance = 0.003 + (0.03 - 0.003) * (1 - (d['peakPowerKw'] - power_start) / power_range) if d['isCV'] else 0.01
    dq_inductance = 0.5 + (8.0 - 0.5) * (1 - (d['peakPowerKw'] - power_start) / power_range) if d['isCV'] else 1.5

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
            'coolingMethod': "Liquid + Oil Cooling" if d['isCV'] and d['peakPowerKw'] > 250 else "Liquid Cooling",
            'maxCoilTemp': "150°C" if d['isCV'] else "140°C",
            'coolantFlowRate': f"{round(d['peakPowerKw'] * 0.06, 1)} L/min",
            'thermalResistance': "0.450 K/W" if d['isCV'] else "0.150 K/W"
        },
        'dimensions': {
            'statorDiameter': f"{round(d['statorOd'])} mm",
            'rotorDiameter': f"{round(d['statorOd'] * 0.65)} mm",
            'overallLength': f"{round(d['length'])} mm",
            'airGap': f"{air_gap} mm",
            'poles': 16 if d['isCV'] else 8,
            'slots': 48 if d['isCV'] else 24
        },
        'electrical': {
            'phaseCurrent': f"{round(d['phaseCurrent'])} A (Peak)",
            'switchingDevice': 'IGBT',
            'switchingFreq': "10 kHz" if d['isCV'] else "16 kHz",
            'backEmfConstant': f"{round(d['v_system'] * 0.85 / (2 * math.pi * d['motor_rpm'] / 60), 4) if d['motor_rpm'] > 0 else 0.1:.4f} V·s/rad",
            'statorResistance': f"{stator_resistance:.4f} Ω",
            'dqInductance': f"{dq_inductance:.3f} mH",
            'windingType': 'Distributed'
        },
        'mechanical': {
            'maxTorqueDensity': f"{round(d['tMotor'] / (math.pi * (d['statorOd'] / 2000) ** 2 * d['length'] / 1000 * 1000), 1)} Nm/L",
            'rotorInertia': f"{inertia:.5f} kg·m²",
            'maxCentrifugalForce': f"{round(d['weight'] * 120)} N",
            'bearingLoad': f"{round(d['weight'] * 20 + d['tMotor'] * 2)} N",
            'coggingTorque': f"{round(d['tMotor'] * 0.012, 1)} Nm",
            'criticalSpeed': f"{round(d['motorRpm'] * 1.25)} RPM",
            'vehicleMass': f"{round(d['totalMass'])} kg",
            'totalVehicleMass': f"{round(d['totalMass'])} kg",
            'gearRatio': f"{round(d['gearRatio'], 2)}:1",
            'wheelTorque': f"{round(d['tMotor'] * d['gearRatio'])} Nm"
        },
        'performanceCurve': curve
    }
