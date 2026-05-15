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
        
    # 1. VEHICLE DYNAMICS (MANDATORY CORE MODEL)
    total_mass = m_vehicle + m_load
    g = 9.81
    
    v_mps = v_kmh / 3.6
    
    # Road Load
    f_drag_cruise = 0.5 * air_density * cd * fa * (v_mps ** 2)
    f_roll = crr * total_mass * g
    f_cruise = f_drag_cruise + f_roll
    
    # Acceleration
    accel_target_kmh = min(v_kmh, 50 if is_2w else 100)
    accel_target_mps = accel_target_kmh / 3.6
    if math.isnan(accel_time_raw):
        accel_time = 6 if is_2w else 8 if is_car else 15
    else:
        accel_time = accel_time_raw
        
    a = accel_target_mps / accel_time
    f_accel = total_mass * a
    
    # Gradeability
    v_grade_mps = v_mps
    max_gradient_rad = math.atan(gradient_percent / 100.0)
    f_grade = total_mass * g * math.sin(max_gradient_rad)
    
    f_drag_accel = 0.5 * air_density * cd * fa * (accel_target_mps ** 2)
    f_total_accel = f_drag_accel + f_roll + f_accel
    
    f_drag_grade = 0.5 * air_density * cd * fa * (v_grade_mps ** 2)
    f_total_grade = f_drag_grade + f_roll + f_grade
    
    # Power Calculation
    p_cruise = (f_cruise * v_mps) / 1000.0
    p_accel = (f_total_accel * accel_target_mps) / 1000.0
    p_grade = (f_total_grade * v_grade_mps) / 1000.0
    
    # 4. POWER VALIDATION (VERY IMPORTANT)
    if is_2w: p_min, p_max = 0.25, 80
    elif is_car: p_min, p_max = 20, 450
    else: p_min, p_max = 50, 2000
        
    raw_peak_power = max(p_cruise, p_accel, p_grade)
    
    # 7. GRADIENT LOGIC (If required power exceeds motor capability)
    if raw_peak_power > p_max and p_grade > p_max:
        p_avail_for_grade = p_max * 1000.0
        v_grade_mps = p_avail_for_grade / f_total_grade if f_total_grade > 0 else v_grade_mps
        v_grade_kmh = v_grade_mps * 3.6
        notes.append(f"Gradient demand exceeded vehicle limits: Climb speed reduced to {v_grade_kmh:.1f} km/h. Prioritizing torque over speed.")
        
        f_total_grade = (0.5 * air_density * cd * fa * (v_grade_mps ** 2)) + f_roll + f_grade
        p_grade = (f_total_grade * v_grade_mps) / 1000.0
        raw_peak_power = max(p_cruise, p_accel, p_grade)
        
    peak_power_kw = max(p_min, min(p_max, raw_peak_power))
    
    # Continuous Power Rule
    if is_2w: cont_power_min, cont_power_max = 0.55, 0.75
    elif is_car: cont_power_min, cont_power_max = 0.55, 0.70
    else: cont_power_min, cont_power_max = 0.60, 0.75
    continuous_power_kw = peak_power_kw * ((cont_power_min + cont_power_max) / 2.0)
    
    # 5 & 6. MOTOR TYPE RECOMMENDATION
    motor_type = MOTOR_TYPES[0]
    reason = ""
    if is_2w:
        if peak_power_kw < 8: motor_type, reason = MOTOR_TYPES[2], "BLDC: Low-cost EVs, Low power applications."
        else: motor_type, reason = MOTOR_TYPES[0], "PMSM: High efficiency EVs, Premium two wheelers."
    elif is_car:
        if peak_power_kw < 80: motor_type, reason = MOTOR_TYPES[0], "PMSM: High efficiency EVs, passenger cars."
        elif peak_power_kw <= 200: motor_type, reason = MOTOR_TYPES[0], "PMSM: High performance passenger car standard."
        else: motor_type, reason = MOTOR_TYPES[4], "PMSM + IM (Dual Motor System): Power > 200 kW, AWD required, High performance vehicle."
    else:
        if peak_power_kw < 150: motor_type, reason = MOTOR_TYPES[1], "IM: Mid-range commercial vehicles, high-speed EVs."
        elif peak_power_kw <= 350: motor_type, reason = MOTOR_TYPES[3], "SRM: Heavy commercial vehicles, trucks and buses."
        else: motor_type, reason = MOTOR_TYPES[3], "SRM: Rugged operation, extreme heavy commercial vehicles."
            
    # 8. GEAR RATIO RULES
    if is_2w: gr_min, gr_max, gr_target = 3, 7, 5
    elif is_car: gr_min, gr_max, gr_target = 7, 11, 9
    else: gr_min, gr_max, gr_target = 9, 16, 12
    gear_ratio = gr_target
    
    f_max_demand = max(f_cruise, f_total_accel, f_total_grade)
    t_wheel = f_max_demand * wheel_radius
    t_motor = t_wheel / gear_ratio
    
    # RPM relation
    wheel_rpm = (v_mps / (2 * math.pi * wheel_radius)) * 60
    motor_rpm = wheel_rpm * gear_ratio
    
    if 'BLDC' in motor_type: rpm_min, rpm_max = 3000, 8000
    elif 'PMSM' in motor_type: rpm_min, rpm_max = 4000, 18000
    elif 'IM' in motor_type: rpm_min, rpm_max = 6000, 20000
    elif 'SRM' in motor_type: rpm_min, rpm_max = 3000, 12000
    else: rpm_min, rpm_max = 4000, 18000 # Dual Motor limit
        
    if motor_rpm > rpm_max:
        motor_rpm = rpm_max
        gear_ratio = motor_rpm / wheel_rpm if wheel_rpm > 0 else gear_ratio
        if gear_ratio < gr_min: gear_ratio = gr_min
    elif motor_rpm < rpm_min:
        motor_rpm = rpm_min
        gear_ratio = motor_rpm / wheel_rpm if wheel_rpm > 0 else gear_ratio
        if gear_ratio > gr_max: gear_ratio = gr_max
            
    # 4. EXACT POWER VALIDATION (Power = Torque * RPM)
    base_rpm = min(motor_rpm * 0.4, rpm_max * 0.5)
    t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else t_motor
    
    op_eff = 0.92
    if 'BLDC' in motor_type: op_eff = 0.88
    elif 'PMSM' in motor_type: op_eff = 0.94
    elif 'IM' in motor_type: op_eff = 0.90
    elif 'SRM' in motor_type: op_eff = 0.86
        
    # 3. ELECTRICAL LIMITS - Current
    if is_2w: i_min, i_max = 60, 220
    elif is_car: i_min, i_max = 150, 500
    else: i_min, i_max = 200, 700
        
    phase_current = (peak_power_kw * 1000) / (v_system * op_eff)
    
    if phase_current > i_max:
        phase_current = i_max
        peak_power_kw = (phase_current * v_system * op_eff) / 1000.0
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)
        notes.append(f"Phase current capped at limit: {i_max} A. Power adjusted to maintain consistency.")
    elif phase_current < i_min:
        phase_current = i_min
        peak_power_kw = (phase_current * v_system * op_eff) / 1000.0
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm)
        
    # 3. ELECTRICAL LIMITS - Stator Resistance & Inductance
    if is_2w: res_min, res_max, ind_min, ind_max = 0.01, 0.08, 0.2, 2.5
    elif is_car: res_min, res_max, ind_min, ind_max = 0.005, 0.04, 0.3, 5.0
    else: res_min, res_max, ind_min, ind_max = 0.003, 0.03, 0.5, 8.0
        
    power_scale = max(0.0, min(1.0, (peak_power_kw - p_min) / (p_max - p_min))) if p_max > p_min else 0.5
    stat_res = res_max - (res_max - res_min) * power_scale
    ind = ind_max - (ind_max - ind_min) * power_scale
    
    # 9. THERMAL LIMITS
    cooling_method = "Air Cooling"
    if peak_power_kw > 30 or is_cv:
        cooling_method = "Liquid Cooling"
    if peak_power_kw > 150:
        cooling_method = "Liquid + Oil Cooling"
        
    max_temp = "120°C"
    if peak_power_kw > 50: max_temp = "140°C"
    if peak_power_kw > 200 or is_cv: max_temp = "155°C"
        
    flow = "N/A"
    if "Liquid" in cooling_method:
        flow = f"{max(1.0, min(20.0, peak_power_kw * 0.05)):.1f} L/min"
        
    # PHYSICAL DIMENSIONS
    if is_2w: od_min, od_max, len_min, len_max, w_min, w_max = 100, 220, 80, 200, 3, 25
    elif is_car: od_min, od_max, len_min, len_max, w_min, w_max = 220, 380, 200, 400, 40, 160
    else: od_min, od_max, len_min, len_max, w_min, w_max = 350, 600, 350, 700, 150, 500
        
    stator_od = od_min + (od_max - od_min) * power_scale
    length = len_min + (len_max - len_min) * power_scale
    weight = w_min + (w_max - w_min) * power_scale
    
    vol_l = math.pi * ((stator_od / 2000.0) ** 2) * (length / 1000.0) * 1000.0
    act_td = t_motor / vol_l if vol_l > 0 else 0
    
    if act_td > 35:
        scale = (act_td / 35.0) ** (1/3)
        stator_od *= scale
        length *= scale
        vol_l *= (scale ** 3)
        act_td = 35.0
        
    air_gap = 0.5
    if stator_od < 160: air_gap = 0.3
    elif stator_od < 320: air_gap = 0.8
    else: air_gap = 1.5
        
    rotor_mass = weight * 0.35
    rotor_rad_m = (stator_od * 0.6) / 2000.0
    inertia = 0.5 * rotor_mass * (rotor_rad_m ** 2)
    
    bearing_load = weight * 9.81 * 2 + t_motor * 4
    critical_speed = motor_rpm * 1.30
    cogging = max(0.1, min(5, t_motor * 0.01))
    
    slots, poles = 24, 16
    if 'BLDC' in motor_type: slots, poles = 18, 16
    elif 'IM' in motor_type: slots, poles = 30, 4
    elif 'SRM' in motor_type: slots, poles = 24, 16
    else: slots, poles = 24, 20
        
    sw_freq = "10 kHz"
    if 'BLDC' in motor_type or 'PMSM' in motor_type: sw_freq = "16 kHz"
    elif 'IM' in motor_type: sw_freq = "8 kHz"
        
    omega_max = (2 * math.pi * motor_rpm) / 60.0
    back_emf = ((v_system * 0.9) / omega_max) if omega_max > 0 else 0.1000
    
    continuous_torque_nm = t_motor * ((cont_power_min + cont_power_max) / 2.0)
    peak_eff = op_eff * 100 + 2
    
    curve = []
    for r in range(0, int(motor_rpm) + 500, 500):
        t_curve = t_motor if r <= base_rpm else t_motor * (base_rpm / r) if r > 0 else t_motor
        eff_curve = (op_eff * 100) * (1 - ((r/motor_rpm if motor_rpm > 0 else 0) - 0.65)**2 * 0.3) if r > 0 else 0
        eff_curve = max(0, min(peak_eff, eff_curve))
        curve.append({'rpm': r, 'torque': round(t_curve), 'efficiency': round(eff_curve, 1)})
        
    return {
        'motorType': motor_type,
        'motorSelectionReason': reason,
        'rangeLimitation': ' | '.join(notes) if notes else None,
        'specifications': {
            'peakPowerKw': float(round(peak_power_kw, 1)),
            'continuousPowerKw': float(round(continuous_power_kw, 1)),
            'peakTorqueNm': int(round(t_motor)),
            'continuousTorqueNm': int(round(continuous_torque_nm)),
            'maxRpm': int(round(motor_rpm)),
            'baseRpm': int(round(base_rpm)),
            'operatingVoltage': int(round(v_system)),
            'peakEfficiency': f"{peak_eff:.1f}%",
            'operatingEfficiency': f"{op_eff * 100:.1f}%",
            'weightKg': int(round(weight))
        },
        'thermal': {
            'coolingMethod': cooling_method,
            'maxCoilTemp': max_temp,
            'coolantFlowRate': flow,
            'thermalResistance': f"{(0.05 / power_scale if power_scale > 0 else 0.05):.3f} K/W"
        },
        'dimensions': {
            'statorDiameter': f"{int(round(stator_od))} mm",
            'rotorDiameter': f"{int(round(stator_od * 0.6))} mm",
            'overallLength': f"{int(round(length))} mm",
            'airGap': f"{air_gap:.2f} mm",
            'poles': int(poles),
            'slots': int(slots)
        },
        'electrical': {
            'phaseCurrent': f"{int(round(phase_current))} A (Peak)",
            'switchingDevice': 'IGBT' if v_system > 200 else 'MOSFET',
            'switchingFreq': sw_freq,
            'backEmfConstant': f"{back_emf:.4f} V·s/rad",
            'statorResistance': f"{stat_res:.4f} Ω",
            'dqInductance': f"{ind:.3f} mH",
            'windingType': 'Concentrated' if 'BLDC' in motor_type else 'Distributed'
        },
        'mechanical': {
            'maxTorqueDensity': f"{act_td:.1f} Nm/L",
            'rotorInertia': f"{inertia:.5f} kg·m²",
            'maxCentrifugalForce': f"{int(round(weight * 150))} N",
            'bearingLoad': f"{int(round(bearing_load))} N",
            'coggingTorque': f"{cogging:.1f} Nm",
            'criticalSpeed': f"{int(round(critical_speed))} RPM",
            'vehicleMass': f"{int(round(total_mass))} kg",
            'totalVehicleMass': f"{int(round(total_mass))} kg",
            'gearRatio': f"{gear_ratio:.2f}:1",
            'wheelTorque': f"{int(round(t_motor * gear_ratio))} Nm"
        },
        'performanceCurve': curve
    }
