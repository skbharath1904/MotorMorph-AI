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
    
    if is_2w:
        p_min, p_max, cont_min, cont_max, tm_min, tm_max, tw_min, tw_max = 0.5, 20, 0.3, 15, 5, 80, 50, 500
        rpm_min, rpm_max, v_min, v_max, i_min, i_max, w_min, w_max = 2000, 8000, 48, 96, 50, 220, 3, 12
        res_min, res_max, ind_min, ind_max, emf_min, emf_max, tr_min, tr_max = 0.01, 0.08, 0.2, 2.0, 0.05, 0.25, 0.10, 0.40
        poles_min, poles_max, slots_min, slots_max = 4, 12, 12, 36
    elif is_car:
        p_min, p_max, cont_min, cont_max, tm_min, tm_max, tw_min, tw_max = 50, 400, 30, 250, 80, 450, 1000, 6000
        rpm_min, rpm_max, v_min, v_max, i_min, i_max, w_min, w_max = 3000, 16000, 300, 800, 150, 500, 40, 120
        res_min, res_max, ind_min, ind_max, emf_min, emf_max, tr_min, tr_max = 0.005, 0.04, 0.3, 5.0, 0.1, 0.6, 0.05, 0.20
        poles_min, poles_max, slots_min, slots_max = 4, 10, 24, 72
    else:
        p_min, p_max, cont_min, cont_max, tm_min, tm_max, tw_min, tw_max = 80, 1200, 60, 800, 300, 1200, 3000, 15000
        rpm_min, rpm_max, v_min, v_max, i_min, i_max, w_min, w_max = 1500, 9000, 400, 1200, 200, 800, 120, 600
        res_min, res_max, ind_min, ind_max, emf_min, emf_max, tr_min, tr_max = 0.003, 0.03, 0.5, 8.0, 0.2, 1.2, 0.03, 0.15
        poles_min, poles_max, slots_min, slots_max = 8, 24, 24, 96
        
    v_kmh = float(inputs.get('targetSpeed', 120))
    v_system = float(inputs.get('voltage', 400))
    
    if v_system < v_min:
        v_system = v_min
        notes.append(f"Voltage clamped to minimum {v_min}V.")
    if v_system > v_max:
        v_system = v_max
        notes.append(f"Voltage clamped to maximum {v_max}V.")
        
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
    p_cruise = (f_cruise * v_mps) / 1000.0
    
    accel_target_kmh = min(v_kmh, 50 if is_2w else 100)
    accel_target_mps = accel_target_kmh / 3.6
    if math.isnan(accel_time_raw):
        accel_time = 6 if is_2w else 8 if is_car else 15
    else:
        accel_time = accel_time_raw
        
    a = accel_target_mps / accel_time
    f_accel = total_mass * a
    f_drag_accel = 0.5 * air_density * cd * fa * (accel_target_mps ** 2)
    f_total_accel = f_drag_accel + f_roll + f_accel
    p_accel = (f_total_accel * accel_target_mps) / 1000.0
    
    v_grade_mps = v_mps
    max_gradient_rad = math.atan(gradient_percent / 100.0)
    f_grade = total_mass * g * math.sin(max_gradient_rad)
    f_drag_grade = 0.5 * air_density * cd * fa * (v_grade_mps ** 2)
    f_total_grade = f_drag_grade + f_roll + f_grade
    p_grade = (f_total_grade * v_grade_mps) / 1000.0
    
    if p_grade > p_max:
        p_avail_watts = p_max * 1000.0
        v_grade_mps = p_avail_watts / f_total_grade if f_total_grade > 0 else v_grade_mps
        f_drag_grade = 0.5 * air_density * cd * fa * (v_grade_mps ** 2)
        f_total_grade = f_drag_grade + f_roll + f_grade
        p_grade = (f_total_grade * v_grade_mps) / 1000.0
        notes.append(f"Hill climb demand exceeded motor limit. Speed clamped.")
        
    p_required = max(p_cruise, p_accel, p_grade)
    margin = 1.15 if is_2w else 1.25 if is_car else 1.35
    peak_power_kw = p_required * margin
    
    if peak_power_kw < p_min:
        peak_power_kw = p_min
        notes.append(f"Power clamped to min {p_min}kW.")
    if peak_power_kw > p_max:
        peak_power_kw = p_max
        notes.append(f"Power clamped to max {p_max}kW.")
        
    motor_type = MOTOR_TYPES[0]
    reason = ""
    if is_2w:
        if peak_power_kw < 8: motor_type, reason = MOTOR_TYPES[2], "BLDC: Low-cost EVs."
        else: motor_type, reason = MOTOR_TYPES[0], "PMSM: High efficiency EVs."
    elif is_car:
        if peak_power_kw < 80: motor_type, reason = MOTOR_TYPES[0], "PMSM: Passenger cars."
        elif peak_power_kw <= 200: motor_type, reason = MOTOR_TYPES[0], "PMSM: Performance passenger car."
        else: motor_type, reason = MOTOR_TYPES[4], "PMSM + IM: Power > 200 kW."
    else:
        if peak_power_kw < 150: motor_type, reason = MOTOR_TYPES[1], "IM: Mid-range CV."
        elif peak_power_kw <= 350: motor_type, reason = MOTOR_TYPES[3], "SRM: Heavy CV."
        else: motor_type, reason = MOTOR_TYPES[3], "SRM: Extreme heavy CV."
            
    wheel_rpm = (v_mps / (2 * math.pi * wheel_radius)) * 60 if wheel_radius > 0 else 0
    gr_target = 5 if is_2w else 9 if is_car else 12
    gear_ratio = gr_target
    motor_rpm = wheel_rpm * gear_ratio
    
    if motor_rpm < rpm_min:
        motor_rpm = rpm_min
        gear_ratio = motor_rpm / wheel_rpm if wheel_rpm > 0 else gear_ratio
        notes.append(f"Motor RPM clamped to min {rpm_min}. Gear ratio adjusted.")
    elif motor_rpm > rpm_max:
        motor_rpm = rpm_max
        gear_ratio = motor_rpm / wheel_rpm if wheel_rpm > 0 else gear_ratio
        notes.append(f"Motor RPM clamped to max {rpm_max}. Gear ratio adjusted.")
        
    base_rpm = min(motor_rpm * 0.4, rpm_max * 0.5)
    
    t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else 0
    
    if t_motor < tm_min:
        t_motor = tm_min
        peak_power_kw = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000.0)
        notes.append(f"Motor torque clamped to min {tm_min}Nm. Power recalculated.")
    elif t_motor > tm_max:
        t_motor = tm_max
        base_rpm = (peak_power_kw * 1000 * 60) / (2 * math.pi * t_motor) if t_motor > 0 else base_rpm
        if base_rpm > motor_rpm * 0.8:
            base_rpm = motor_rpm * 0.8
            peak_power_kw = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000.0)
            notes.append(f"Motor torque clamped to max {tm_max}Nm. Power adjusted.")
            
    t_wheel = t_motor * gear_ratio
    
    if t_wheel < tw_min:
        required_gr = tw_min / t_motor if t_motor > 0 else gear_ratio
        gear_ratio = required_gr
        t_wheel = t_motor * gear_ratio
        notes.append(f"Gear ratio bumped to meet min wheel torque.")
    elif t_wheel > tw_max:
        t_wheel = tw_max
        t_motor = t_wheel / gear_ratio if gear_ratio > 0 else t_motor
        peak_power_kw = (t_motor * 2 * math.pi * base_rpm) / (60 * 1000.0)
        notes.append(f"Wheel torque clamped to max {tw_max}Nm. Upstream adjusted.")
        
    if peak_power_kw < p_min:
        peak_power_kw = p_min
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else 0
    if peak_power_kw > p_max:
        peak_power_kw = p_max
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else 0
        
    cont_power_min_percent = 0.55 if is_2w else 0.55 if is_car else 0.60
    cont_power_max_percent = 0.75 if is_2w else 0.70 if is_car else 0.75
    
    continuous_power_kw = peak_power_kw * ((cont_power_min_percent + cont_power_max_percent) / 2.0)
    if continuous_power_kw < cont_min: continuous_power_kw = cont_min
    if continuous_power_kw > cont_max: continuous_power_kw = cont_max
    
    continuous_torque_nm = t_motor * (continuous_power_kw / peak_power_kw) if peak_power_kw > 0 else 0
    
    op_eff = 0.92
    if 'BLDC' in motor_type: op_eff = 0.88
    elif 'PMSM' in motor_type: op_eff = 0.94
    elif 'IM' in motor_type: op_eff = 0.90
    elif 'SRM' in motor_type: op_eff = 0.86
        
    phase_current = (peak_power_kw * 1000) / (v_system * op_eff) if op_eff > 0 else 0
    if phase_current > i_max:
        phase_current = i_max
        peak_power_kw = (phase_current * v_system * op_eff) / 1000.0
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else 0
        notes.append(f"Current clamped to max {i_max}A. Power/Torque adjusted.")
    elif phase_current < i_min:
        phase_current = i_min
        peak_power_kw = (phase_current * v_system * op_eff) / 1000.0
        t_motor = (peak_power_kw * 1000 * 60) / (2 * math.pi * base_rpm) if base_rpm > 0 else 0
        notes.append(f"Current clamped to min {i_min}A. Power/Torque adjusted.")
        
    power_scale = max(0.0, min(1.0, (peak_power_kw - p_min) / (p_max - p_min))) if p_max > p_min else 0.5
    stat_res = res_max - (res_max - res_min) * power_scale
    ind = ind_max - (ind_max - ind_min) * power_scale
    
    omega_max = (2 * math.pi * motor_rpm) / 60.0
    back_emf = ((v_system * 0.9) / omega_max) if omega_max > 0 else emf_min
    if back_emf < emf_min: back_emf = emf_min
    if back_emf > emf_max: back_emf = emf_max
        
    cooling_method = "Air Cooling"
    if peak_power_kw > 30 or is_cv: cooling_method = "Liquid Cooling"
    if peak_power_kw > 150: cooling_method = "Liquid + Oil Cooling"
        
    max_temp = "120°C"
    if "Liquid + Oil" in cooling_method: max_temp = "155°C"
    elif "Liquid" in cooling_method: max_temp = "140°C"
        
    flow = "N/A"
    if "Liquid" in cooling_method:
        flow = f"{max(1.0, min(20.0, peak_power_kw * 0.05)):.1f} L/min"
        
    thermal_res = tr_max - (tr_max - tr_min) * power_scale
    if thermal_res < tr_min: thermal_res = tr_min
    if thermal_res > tr_max: thermal_res = tr_max
        
    weight = w_min + (w_max - w_min) * power_scale
    if weight < w_min: weight = w_min
    if weight > w_max: weight = w_max
        
    stator_od = 100 + weight * 2
    if is_car: stator_od = 200 + weight * 1.5
    if is_cv: stator_od = 300 + weight * 0.8
        
    length = stator_od * 0.8
    
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
    
    poles = 8 if is_2w else 8 if is_car else 16
    if motor_rpm > 8000 and poles > 12: poles = 12
    if poles < poles_min: poles = poles_min
    if poles > poles_max: poles = poles_max
    if poles > 24: poles = 24
        
    slots = poles * 3
    if slots < slots_min: slots = slots_min
    if slots > slots_max: slots = slots_max
        
    ratio = slots / poles if poles > 0 else 0
    if ratio < 1: slots = poles
    if ratio > 6: slots = poles * 6
        
    sw_freq = "10 kHz"
    if 'BLDC' in motor_type or 'PMSM' in motor_type: sw_freq = "16 kHz"
    elif 'IM' in motor_type: sw_freq = "8 kHz"
        
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
            'thermalResistance': f"{thermal_res:.3f} K/W"
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
            'backEmfConstant': f"{float(back_emf):.4f} V·s/rad",
            'statorResistance': f"{stat_res:.4f} Ω",
            'dqInductance': f"{ind:.3f} mH",
            'windingType': 'Concentrated' if 'BLDC' in motor_type else 'Distributed'
        },
        'mechanical': {
            'maxTorqueDensity': f"{(t_motor / (math.pi * ((stator_od / 2000.0)**2) * (length / 1000.0) * 1000.0)):.1f} Nm/L" if stator_od > 0 else "0 Nm/L",
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
