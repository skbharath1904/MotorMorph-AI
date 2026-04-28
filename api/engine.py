import math
import time
from typing import Dict, Any, List

MOTOR_TYPES = [
    'Permanent Magnet Synchronous Motor (PMSM)',
    'Induction Motor (IM)',
    'Brushless DC Motor (BLDC)',
    'Switched Reluctance Motor (SRM)'
]
COOLING = ['Air Cooling', 'Liquid Cooling', 'Oil Cooling']

def max_current_for_voltage(v: float) -> int:
    if v <= 48:
        return 300
    if v <= 400:
        return round(300 + (v - 48) / (400 - 48) * 50)
    if v <= 800:
        return round(350 + (v - 400) / (800 - 400) * 150)
    return 500

def generate_motor_design_logic(inputs: Dict[str, Any]) -> Dict[str, Any]:
    # Simulate processing time
    time.sleep(0.5)

    target_speed = float(inputs.get('targetSpeed', 0))
    vehicle_weight = float(inputs.get('vehicleWeight', 0))
    range_km = float(inputs.get('range', 0))
    voltage = float(inputs.get('voltage', 0))
    drag_coefficient = float(inputs.get('dragCoefficient', 0))
    rolling_resistance = float(inputs.get('rollingResistance', 0))
    frontal_area = float(inputs.get('frontalArea', 0))
    vehicle_type = inputs.get('vehicleType', '')

    is_two_wheeler = 'Two Wheeler' in vehicle_type
    is_car = 'Car' in vehicle_type
    is_commercial = 'Commercial' in vehicle_type
    notes = []

    # RULE 4: Voltage-class speed cap
    max_speed_v = 80 if voltage <= 48 else 110 if voltage <= 120 else 200 if voltage <= 400 else 300 if voltage <= 800 else 350
    if target_speed > max_speed_v:
        target_speed = max_speed_v
        notes.append(f"Speed capped at {max_speed_v} km/h for {voltage}V system.")

    # RULE 2 & 4: Determine current & power limits
    i_max = max_current_for_voltage(voltage)
    p_max_vi = (voltage * i_max) / 1000

    p_max_vehicle = 12 if is_two_wheeler else 150 if is_car else 400
    p_max = min(p_max_vi * 1.1, p_max_vehicle)

    # RULE 3: Road-load physics -> required peak power
    v_mps = target_speed / 3.6
    rho, g, eta_dt = 1.225, 9.81, 0.92
    f_aero = 0.5 * rho * drag_coefficient * frontal_area * (v_mps ** 2)
    f_rolling = rolling_resistance * vehicle_weight * g
    f_grade = vehicle_weight * g * math.sin(math.atan(0.10))
    f_cont = f_aero + f_rolling
    f_peak = f_cont + f_grade

    peak_power_kw = (f_peak * v_mps) / (1000 * eta_dt) * 1.15

    p_min_vehicle = 3 if is_two_wheeler else 30 if is_car else 80
    if peak_power_kw < p_min_vehicle:
        peak_power_kw = p_min_vehicle

    if peak_power_kw > p_max:
        notes.append(f"Peak power reduced from {peak_power_kw:.1f} kW to {p_max:.1f} kW (V×I limit: {voltage}V × {i_max}A).")
        peak_power_kw = p_max

    cont_ratio = min(0.70, max(0.50, f_cont / f_peak if f_peak > 0 else 0.6))
    continuous_power_kw = peak_power_kw * cont_ratio

    # RULE 5: RPM limits
    if is_two_wheeler:
        rpm_min, rpm_max = 3000, 8000
        tire_radius = min(0.31, 0.25 + vehicle_weight * 0.00005)
        gear_ratio = 7.0 + (target_speed / 100) * 1.5
    elif is_commercial:
        rpm_min, rpm_max = 2000, 6000
        tire_radius = min(0.60, 0.46 + vehicle_weight * 0.000008)
        gear_ratio = 10.0 + (vehicle_weight / 5000) * 4.0
    else:
        rpm_min, rpm_max = 6000, 11000
        tire_radius = min(0.38, 0.30 + vehicle_weight * 0.000012)
        gear_ratio = 8.0 + (target_speed / 200) * 3.0

    wheel_rpm = (v_mps / (2 * math.pi * tire_radius)) * 60
    max_rpm = round(wheel_rpm * gear_ratio)
    max_rpm = max(rpm_min, min(rpm_max, max_rpm))
    base_rpm = round(max_rpm * 0.35)

    # RULE 3: Torque
    peak_torque_nm = (peak_power_kw * 1000 * 60) / (2 * math.pi * max_rpm)
    continuous_torque_nm = (continuous_power_kw * 1000 * 60) / (2 * math.pi * max_rpm)

    # RULE 8: Torque per kg
    nm_per_kg_min = 0.08 if is_two_wheeler else 0.07 if is_car else 0.05
    min_torq_req = nm_per_kg_min * vehicle_weight
    if peak_torque_nm < min_torq_req:
        notes.append(f"Torque {peak_torque_nm:.1f} Nm below minimum vehicle requirement ({min_torq_req:.1f} Nm for {vehicle_weight} kg). Power/RPM adjusted.")
        new_rpm = round((peak_power_kw * 1000 * 60) / (2 * math.pi * min_torq_req))
        max_rpm = max(rpm_min, min(rpm_max, new_rpm))
        peak_torque_nm = (peak_power_kw * 1000 * 60) / (2 * math.pi * max_rpm)
        continuous_torque_nm = (continuous_power_kw * 1000 * 60) / (2 * math.pi * max_rpm)

    # Phase current
    pf, eta_inv = 0.92, 0.97
    phase_current = round((peak_power_kw * 1000) / (math.sqrt(3) * voltage * pf * eta_inv))
    if phase_current > i_max:
        phase_current = i_max
        notes.append(f"Phase current capped at {i_max} A ({voltage}V class limit).")

    kt = peak_torque_nm / max(phase_current, 1)

    poles = 4 if max_rpm > 10000 else 6 if max_rpm > 6000 else 8
    slots = poles * 3
    elec_freq_hz = (poles / 2) * (max_rpm / 60)

    # RULE 9: Dimensions
    td_min = 8 if is_two_wheeler else 20
    td_max = 20 if is_two_wheeler else 40
    td_target = (td_min + td_max) / 2
    volume_l = peak_torque_nm / td_target
    stator_d = max(55, round((volume_l * 1.06e6 / 1.2)**(1/3)))
    rotor_l = max(55, round(stator_d * 1.2))

    actual_td = peak_torque_nm / ((math.pi * (stator_d / 2000) ** 2) * (rotor_l / 1000))
    if actual_td < td_min or actual_td > td_max:
        clamped_td = min(td_max, max(td_min, actual_td))
        volume_l = peak_torque_nm / clamped_td
        stator_d = max(55, round((volume_l * 1.06e6 / 1.2)**(1/3)))
        rotor_l = max(55, round(stator_d * 1.2))
        actual_td = peak_torque_nm / ((math.pi * (stator_d / 2000) ** 2) * (rotor_l / 1000))
        notes.append(f"Motor volume recalculated. Torque density: {actual_td:.1f} Nm/L.")

    stator_vol_m3 = (math.pi * (stator_d / 2000) ** 2) * (rotor_l / 1000)
    air_gap_mm = f"{max(0.3, stator_d * 0.003):.2f}"

    # Motor type
    if peak_power_kw > 200 and not is_commercial:
        motor_type = MOTOR_TYPES[1]
        reason = f"Induction Motor (IM) selected: peak power {peak_power_kw:.1f} kW > 200 kW."
    elif vehicle_weight < 500 or is_two_wheeler:
        motor_type = MOTOR_TYPES[2]
        reason = f"BLDC selected: vehicle mass {vehicle_weight} kg qualifies as lightweight EV."
    elif peak_torque_nm > 600 or is_commercial:
        motor_type = MOTOR_TYPES[3]
        reason = f"SRM selected: peak torque {round(peak_torque_nm)} Nm."
    else:
        motor_type = MOTOR_TYPES[0]
        reason = f"PMSM selected: {peak_power_kw:.1f} kW, {round(peak_torque_nm)} Nm on {voltage}V."

    # RULE 10: Efficiency
    k_r = 0.025 + (0.015 if peak_power_kw < 20 else 0)
    stator_r = max(0.0005, (voltage * voltage * k_r) / (3 * peak_power_kw * 1000 + 1))
    i_rms = phase_current / math.sqrt(2)
    copper_loss_kw = (3 * (i_rms ** 2) * stator_r) / 1000
    b_peak, k_h, k_e, v_iron = 1.05, 40, 0.8, stator_vol_m3 * 0.45
    iron_loss_kw = (k_h * elec_freq_hz * (b_peak ** 1.8) + k_e * (elec_freq_hz ** 2) * (b_peak ** 2)) * v_iron / 1000
    omega = max_rpm * 2 * math.pi / 60
    mech_loss_kw = (0.006 * peak_torque_nm * omega) / 1000
    total_loss = copper_loss_kw + iron_loss_kw + mech_loss_kw
    peak_eff = (peak_power_kw / (peak_power_kw + total_loss)) * 100

    eff_min = (90 if voltage >= 400 else 85) if 'BLDC' in motor_type or 'PMSM' in motor_type else 88 if 'IM' in motor_type else 85
    eff_max = 96 if 'BLDC' in motor_type or 'PMSM' in motor_type else 95 if 'IM' in motor_type else 92
    peak_eff = min(eff_max, max(eff_min, peak_eff))

    # Cooling
    cooling_method = COOLING[2] if peak_power_kw > 150 or 'SRM' in motor_type else COOLING[1] if peak_power_kw > 8 else COOLING[0]

    # Switching
    switch_device = 'MOSFET' if voltage <= 100 else 'IGBT' if voltage <= 600 else 'SiC MOSFET'
    f_sw_base = 20 if voltage >= 800 else 12 if voltage >= 400 else 10 if voltage >= 100 else 16
    switching_freq_label = f"{f_sw_base} kHz ({switch_device})"

    # Battery
    batt_min = 1 if is_two_wheeler else 50 if is_car else 150
    batt_max = 10 if is_two_wheeler else 100 if is_car else 400
    wh_per_km = (continuous_power_kw * 1000) / max(target_speed, 1)
    required_kwh = (wh_per_km * range_km) / 1000
    final_range = range_km
    if required_kwh > batt_max:
        final_range = round((batt_max * 1000) / wh_per_km)
        notes.append(f"Range adjusted to {final_range} km — battery capped at {batt_max} kWh.")
    battery_kwh = min(batt_max, max(batt_min, round(required_kwh * 10) / 10))

    # Weight
    wt_min = 10 if is_two_wheeler else 40 if is_car else 70
    wt_max = 25 if is_two_wheeler else 70 if is_car else 150
    kg_per_kw = 1.1 if 'PMSM' in motor_type else 1.3 if 'IM' in motor_type else 1.0 if 'BLDC' in motor_type else 1.4
    motor_weight_kg = round(continuous_power_kw * kg_per_kw + 7)
    motor_weight_kg = min(wt_max, max(wt_min, motor_weight_kg))

    # Mechanical
    rho_steel = 7650
    rotor_inertia = (math.pi / 2) * rho_steel * (stator_d / 2000) ** 4 * (rotor_l / 1000)
    rotor_mass = rho_steel * stator_vol_m3 * 0.6
    centrifugal_force = round(rotor_mass * (omega ** 2) * (stator_d / 2000))
    bearing_load = round(motor_weight_kg * g + peak_torque_nm * 0.45)
    critical_speed = round(max_rpm * 1.35)
    cogging_torque = f"{(peak_torque_nm * 0.012):.2f} Nm" if 'PMSM' in motor_type else f"{(peak_torque_nm * 0.018):.2f} Nm" if 'BLDC' in motor_type else '< 0.05 Nm'

    # Performance curves
    step = max(100, round(max_rpm / 25))
    efficiency_data = []
    n_base = base_rpm / max_rpm

    for rpm in range(0, max_rpm + step + 1, step):
        if rpm > max_rpm + step: break
        n = rpm / max_rpm
        eff, torque = 0, 0
        if rpm == 0:
            eff, torque = 0, peak_torque_nm
        elif 'PMSM' in motor_type:
            eff = peak_eff * (0.60 * (n/0.10) if n < 0.10 else (0.60 + (n-0.10)/0.15 * 0.37) if n < 0.25 else (0.97 + math.sin((n-0.25)/0.55 * math.pi)*0.03) if n < 0.80 else (1.0 - (n-0.80)/0.20 * 0.10))
            torque = peak_torque_nm if n <= n_base else peak_torque_nm * (n_base / n)
        elif 'BLDC' in motor_type:
            eff = peak_eff * (0.55 * (n/0.12) if n < 0.12 else (0.55 + (n-0.12)/0.18 * 0.40) if n < 0.30 else (0.95 + math.sin((n-0.30)/0.35 * math.pi)*0.05) if n < 0.65 else (0.95 - (n-0.65)/0.20 * 0.12) if n < 0.85 else (0.83 - (n-0.85)/0.15 * 0.18))
            torque = peak_torque_nm if n <= n_base else (peak_torque_nm * (n_base/n) * 0.95) if n < 0.75 else (peak_torque_nm * (n_base/n) * (1 - (n-0.75)*0.6))
        elif 'IM' in motor_type or 'Induction' in motor_type:
            eff = peak_eff * (0.45 * (n/0.15) if n < 0.15 else (0.45 + (n-0.15)/0.20 * 0.45) if n < 0.35 else (0.90 + math.sin((n-0.35)/0.25 * math.pi)*0.10) if n < 0.60 else (0.92 - (n-0.60)/0.20 * 0.08) if n < 0.80 else (0.84 - (n-0.80)/0.20 * 0.20))
            torque = peak_torque_nm * 0.70 if n < 0.05 else (peak_torque_nm * (0.70 + ((n-0.05)/(n_base-0.05))*0.30 - 0.08*math.sin(((n-0.05)/(n_base-0.05))*math.pi))) if n < n_base else (peak_torque_nm * math.pow(n_base/n, 1.3))
        elif 'SRM' in motor_type:
            eff = peak_eff * (0.50 * (n/0.10) if n < 0.10 else (0.50 + (n-0.10)/0.15 * 0.40) if n < 0.25 else (0.90 + math.sin((n-0.25)/0.25 * math.pi)*0.10) if n < 0.50 else (0.88 - (n-0.50)/0.20 * 0.10) if n < 0.70 else (0.78 - (n-0.70)/0.30 * 0.25))
            torque = peak_torque_nm * 1.10 if n < 0.08 else (peak_torque_nm * (1.10 - (n-0.08)/(n_base-0.08)*0.12)) if n <= n_base else (peak_torque_nm * math.pow(n_base/n, 1.6))
        
        torque = max(0, min(peak_torque_nm * 1.15, torque))
        eff = max(0, min(peak_eff, eff))
        efficiency_data.append({'rpm': round(rpm), 'efficiency': round(eff, 1), 'torque': round(torque)})

    score = 100 - len(notes) * 3
    if voltage in [48, 400, 800]: score += 2
    else: score -= 2
    score = min(100, max(80, score))

    return {
        'motorType': motor_type,
        'motorSelectionReason': reason,
        'rangeLimitation': ' '.join(notes),
        'accuracy': {
            'score': score,
            'label': 'High Confidence' if score > 90 else 'Moderate Confidence',
            'note': notes[0] if notes else 'All inputs within valid engineering ranges.'
        },
        'specifications': {
            'peakPowerKw': round(peak_power_kw, 1),
            'continuousPowerKw': round(continuous_power_kw, 1),
            'peakTorqueNm': round(peak_torque_nm),
            'continuousTorqueNm': round(continuous_torque_nm),
            'maxRpm': max_rpm,
            'baseRpm': base_rpm,
            'operatingVoltage': voltage,
            'estimatedEfficiency': f"{peak_eff:.1f}%",
            'weightKg': motor_weight_kg
        },
        'thermal': {
            'coolingMethod': cooling_method,
            'maxCoilTemp': f"{155 + round(peak_power_kw * 0.04)}°C" if 'Oil' in cooling_method else f"{140 + round(peak_power_kw * 0.03)}°C" if 'Liquid' in cooling_method else f"{118 + round(peak_power_kw * 0.4)}°C",
            'coolantFlowRate': 'N/A' if 'Air' in cooling_method else f"{(peak_power_kw * 0.07 + continuous_power_kw * 0.04):.1f} L/min",
            'thermalResistance': f"{(2.5 / (stator_vol_m3 * 1000 + 0.01)):.3f} K/W"
        },
        'dimensions': {
            'statorDiameter': f"{stator_d} mm",
            'rotorLength': f"{rotor_l} mm",
            'overallLength': f"{rotor_l + round(38 + stator_d * 0.16)} mm",
            'airGap': air_gap_mm,
            'poles': poles,
            'slots': slots
        },
        'electrical': {
            'phaseCurrent': f"{phase_current} A (Peak)",
            'lineVoltage': f"{voltage} V",
            'backEmfConstant': f"{(voltage * 0.95 / max(1, base_rpm * 2 * math.pi / 60)):.4f} V·s/rad",
            'switchingFreq': switching_freq_label,
            'statorResistance': f"{stator_r:.4f} Ω",
            'dqInductance': f"{(voltage / (max_rpm * 0.20 + 1)):.3f} mH",
            'windingType': 'Concentrated Fractional Slot' if 'PMSM' in motor_type else 'Delta / Star Winding' if 'BLDC' in motor_type else 'Distributed Full-Pitch'
        },
        'mechanical': {
            'maxTorqueDensity': f"{actual_td:.1f} Nm/L",
            'rotorInertia': f"{rotor_inertia:.5f} kg·m²",
            'maxCentrifugalForce': f"{centrifugal_force} N",
            'bearingLoad': f"{bearing_load} N",
            'coggingTorque': cogging_torque,
            'criticalSpeed': f"{critical_speed} RPM"
        },
        'performanceCurve': efficiency_data
    }
