/* ===================================================================
   SMART FACTORY AI — Physics, ML Inference & IIoT Broker Engine (v2.0)
   Uses asset operating profiles, bearing fault geometries (BPFO/BPFI/BSF/FTF),
   ISA-18.2 alarm matrices, IEEE C57.104 DGA, and ISO 14224 OEE losses.
   =================================================================== */

import { FAILURE_MODE_LIBRARY, OEE_LOSS_PROFILES } from '../datasets/industrialDatasets.js';

function noise(amplitude = 1) {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function cyclic(periodMinutes = 10, amplitude = 1) {
  return Math.sin(Date.now() / (periodMinutes * 60000)) * amplitude;
}

function parseJsonSafe(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function generateMachineTelemetry(machine) {
  if (!machine) return null;

  const profile = parseJsonSafe(machine.operatingProfile || machine.operatingProfileJson, {
    nominalTempC: 45,
    nominalBearingDEC: 52,
    nominalVibRms: 1.2,
    nominalPressureBar: 4.5,
    nominalFlowLps: 28,
    nominalEffPct: 92,
    ambientC: 30,
  });

  const limits = parseJsonSafe(machine.alarmLimits || machine.alarmLimitsJson, {
    temp: { ll: 18, l: 28, h: 70, hh: 85 },
    bearingDE: { ll: 20, l: 32, h: 74, hh: 86 },
    vib: { ll: 0, l: 0.25, h: 3.5, hh: 5.5 },
    pressure: { ll: 1.2, l: 2.4, h: 6.5, hh: 7.5 },
  });

  const h = Math.max(0.05, Math.min(1.0, machine.health / 100));
  const degradation = 1 - h;

  const ambientTemp = Math.round((profile.ambientC + cyclic(30, 1.2) + noise(0.25)) * 10) / 10;
  const baseTemp = profile.nominalTempC + degradation * 38 + cyclic(8, 2.0) + noise(0.8);
  const deTemp = Math.round((profile.nominalBearingDEC + degradation * 46 + cyclic(6, 1.1) + noise(0.6)) * 10) / 10;
  const ndeTemp = Math.round(Math.max(ambientTemp + 3.5, deTemp - 7.5 + degradation * 6 + noise(0.45)) * 10) / 10;
  const deltaT = Math.round(Math.max(0, deTemp - ambientTemp) * 10) / 10;

  const baseVibration = profile.nominalVibRms + degradation * 4.2 + cyclic(5, 0.18) + noise(0.11);
  const vibRMS = Math.round(Math.max(0.15, baseVibration) * 100) / 100;
  const vibPeak = Math.round(vibRMS * (2.6 + degradation * 2.5 + noise(0.12)) * 100) / 100;
  const earlyLead = machine.id === 'P-101' ? 0.35 + degradation * 0.8 : 0;
  const vibEnvelope = Math.round(Math.max(0.12, 0.28 + degradation * 3.5 + earlyLead + cyclic(4, 0.12) + noise(0.08)) * 100) / 100;
  const crestFactor = Math.round((vibPeak / Math.max(0.1, vibRMS)) * 10) / 10;

  const nomPress = profile.nominalPressureBar ?? 4.5;
  const basePressure = Math.max(0.1, nomPress - degradation * (nomPress * 0.25) + cyclic(12, 0.14) + noise(0.06));
  const nomFlow = profile.nominalFlowLps ?? 28;
  const baseFlow = Math.max(0, nomFlow - degradation * (nomFlow * 0.22) + cyclic(15, 0.35) + noise(0.2));

  const ratedRpm = machine.ratedRpm ?? 1450;
  const baseRPM = ratedRpm > 0 ? Math.max(0, ratedRpm + degradation * (ratedRpm * 0.025) + cyclic(6, 6) + noise(3)) : 0;

  const ratedCurr = machine.ratedCurrentA ?? 18;
  const baseCurrent = Math.max(1, ratedCurr * (0.76 + degradation * 0.22) + cyclic(10, 0.35) + noise(0.2));
  const baseEfficiency = Math.max(55, Math.min(99.3, (profile.nominalEffPct ?? 92) - degradation * 16 + noise(0.35)));

  const npshReq = 2.8;
  const npshAvail = Math.round(Math.max(1.1, 5.5 - degradation * 2.9 - cyclic(10, 0.22) + noise(0.09)) * 10) / 10;
  const npshMargin = Math.round((npshAvail - npshReq) * 10) / 10;
  const cavitationRisk = npshMargin < 0.5 ? (npshMargin < 0.1 ? 'CRITICAL' : 'WARNING') : 'NORMAL';

  const powerFactor = Math.round(Math.min(0.96, Math.max(0.74, 0.90 - degradation * 0.11 + noise(0.012))) * 100) / 100;
  const activePower = machine.id === 'XFMR-302'
    ? Math.round((565 + cyclic(12, 42) + noise(14)) * 10) / 10
    : Math.round((Math.sqrt(3) * (machine.ratedVoltageV || 415) * baseCurrent * powerFactor / 1000) * 10) / 10;

  let specifics = {};
  if (machine.id === 'P-101') {
    specifics = {
      cavitationRisk,
      sealChamberPressure: Math.round(basePressure * 0.85 * 10) / 10,
      suctionPressure: Math.round((1.65 - degradation * 0.35 + noise(0.04)) * 100) / 100,
    };
  } else if (machine.id === 'CNC-001') {
    specifics = {
      spindleSpeed: Math.round(4200 - degradation * 380 + cyclic(5, 25)),
      feedRate: Math.round(680 - degradation * 70 + cyclic(4, 14)),
      spindleTorque: Math.round(36 + degradation * 15 + noise(0.7)),
      spindleRunout: Math.round((1.1 + degradation * 6.2 + noise(0.12)) * 10) / 10,
      thermalDriftZ: Math.round((1.2 + degradation * 16.5 + cyclic(8, 1.5)) * 10) / 10,
      coolantPressure: Math.round((4.2 - degradation * 0.8 + noise(0.06)) * 10) / 10,
      coolantFlow: Math.round((18.5 - degradation * 3.0 + noise(0.2)) * 10) / 10,
      chatterVib: Math.round((0.72 + degradation * 2.6 + noise(0.06)) * 100) / 100,
      spindleLoad: Math.round(58 + degradation * 24 + noise(1.4)),
      axisPos: {
        x: Math.round((245.8 + cyclic(2, 40)) * 100) / 100,
        y: Math.round((112.4 + cyclic(3, 25)) * 100) / 100,
        z: Math.round((-45.2 + cyclic(5, 10)) * 100) / 100,
      },
    };
  } else if (machine.id === 'COMP-201') {
    specifics = {
      tankPressure: Math.round((7.2 + cyclic(10, 0.35) - degradation * 1.4) * 10) / 10,
      stage1Temp: Math.round((66 + degradation * 24 + noise(0.5)) * 10) / 10,
      separatorDeltaP: Math.round((0.22 + degradation * 0.78 + noise(0.02)) * 100) / 100,
      dewPoint: Math.round((3.0 + degradation * 7.5) * 10) / 10,
      beltTension: Math.round(96 - degradation * 14),
      airDeliveryFAD: Math.round(850 - degradation * 170 + noise(7)),
    };
  } else if (machine.id === 'CONV-401') {
    specifics = {
      beltTension: Math.round(98 - degradation * 19),
      motorSlip: Math.round((1.9 + degradation * 3.4) * 10) / 10,
      beltSpeedMps: Math.round((1.45 - degradation * 0.14 + noise(0.02)) * 100) / 100,
    };
  } else if (machine.id === 'XFMR-302') {
    const h2 = Math.round(22 + degradation * 160 + noise(3));
    const c2h2 = Math.round(degradation > 0.32 ? degradation * 48 : 2 + degradation * 8);
    specifics = {
      topOilTemp: Math.round((46 + degradation * 34 + cyclic(10, 1.5)) * 10) / 10,
      windingHotspotTemp: Math.round((56 + degradation * 42 + cyclic(10, 1.8)) * 10) / 10,
      hydrogenGas: h2,
      methaneGas: Math.round(12 + degradation * 75 + noise(2)),
      ethyleneGas: Math.round(8 + degradation * 62 + noise(1.5)),
      acetyleneGas: c2h2,
      carbonMonoxide: Math.round(180 + degradation * 320 + noise(8)),
      moisturePpm: Math.round(11 + degradation * 22),
      breakdownVoltage: Math.round(Math.max(24, 64 - degradation * 36)),
      dgaCondition: h2 > 100 || c2h2 > 15 ? 'Condition 3 (Caution)' : h2 > 50 ? 'Condition 2 (Monitor)' : 'Condition 1 (Normal)',
    };
  } else if (machine.id === 'ROB-001') {
    specifics = {
      tcpPosition: {
        x: Math.round((1450.2 + cyclic(4, 60)) * 10) / 10,
        y: Math.round((620.5 + cyclic(3, 40)) * 10) / 10,
        z: Math.round((845.0 + cyclic(5, 30)) * 10) / 10,
      },
      tcpVelocity: Math.round(1280 - degradation * 170 + cyclic(6, 110)),
      activePayload: Math.round(142 - degradation * 6 + noise(0.8)),
      maxPayload: 210,
      payloadRatio: Math.round((142 / 210) * 100),
      repeatability: Math.round((0.02 + degradation * 0.045 + noise(0.002)) * 1000) / 1000,
      cycleTime: Math.round((14.1 + degradation * 2.6 + noise(0.12)) * 10) / 10,
      partsCountToday: 1842,
      gripperPressure: Math.round((6.2 - degradation * 0.35 + noise(0.06)) * 10) / 10,
      harmonicBacklash: Math.round((0.41 + degradation * 1.05 + noise(0.02)) * 100) / 100,
      jointAngles: {
        j1: Math.round((42.5 + cyclic(8, 25)) * 10) / 10,
        j2: Math.round((-28.3 + cyclic(6, 18)) * 10) / 10,
        j3: Math.round((74.1 + cyclic(5, 30)) * 10) / 10,
        j4: Math.round((12.4 + cyclic(7, 45)) * 10) / 10,
        j5: Math.round((-45.6 + cyclic(4, 20)) * 10) / 10,
        j6: Math.round((88.2 + cyclic(9, 60)) * 10) / 10,
      },
      jointTorques: {
        j1: Math.round(420 + degradation * 80 + noise(8)),
        j2: Math.round(680 + degradation * 140 + noise(10)),
        j3: Math.round(390 + degradation * 70 + noise(6)),
      },
      servoTemps: {
        j1: Math.round((44.2 + degradation * 18 + noise(0.4)) * 10) / 10,
        j2: Math.round((53.8 + degradation * 24 + noise(0.5)) * 10) / 10,
        j3: Math.round((48.1 + degradation * 20 + noise(0.4)) * 10) / 10,
      },
    };
  }

  const baseResult = {
    machineId: machine.id,
    timestamp: new Date().toISOString(),
    alarmLimits: limits,
    temperature: {
      value: Math.round(baseTemp * 10) / 10,
      unit: '°C',
      min: 15,
      max: 105,
      warning: limits.temp?.h ?? 70,
      critical: limits.temp?.hh ?? 85,
    },
    bearingDE: {
      value: deTemp,
      unit: '°C',
      warning: limits.bearingDE?.h ?? 74,
      critical: limits.bearingDE?.hh ?? 86,
      desc: machine.id === 'XFMR-302' ? 'Winding Hotspot Pt100 RTD' : 'Drive-End Bearing Pt100 RTD',
    },
    bearingNDE: {
      value: ndeTemp,
      unit: '°C',
      warning: (limits.bearingDE?.h ?? 74) - 4,
      critical: (limits.bearingDE?.hh ?? 86) - 4,
      desc: machine.id === 'XFMR-302' ? 'Top Oil Pocket RTD' : 'Non-Drive-End Bearing Pt100 RTD',
    },
    ambientTemp: {
      value: ambientTemp,
      unit: '°C',
    },
    deltaT: {
      value: deltaT,
      unit: '°C Δ',
      limit: 45,
      isExceeded: deltaT > 45,
    },
    vibration: {
      value: vibRMS,
      unit: 'mm/s',
      min: 0,
      max: 7,
      warning: limits.vib?.h ?? 3.5,
      critical: limits.vib?.hh ?? 5.5,
      standard: machine.isoClass || 'ISO 10816-3 Velocity RMS',
    },
    vibrationEnvelope: {
      value: vibEnvelope,
      unit: 'gE',
      warning: 1.5,
      critical: 2.8,
      desc: 'PeakVue Demodulated High-Freq Shock Wave',
    },
    vibrationPeak: {
      value: vibPeak,
      unit: 'g pk',
    },
    crestFactor: {
      value: crestFactor,
      isDamaged: crestFactor > 5.0,
    },
    pressure: {
      value: Math.round(basePressure * 100) / 100,
      unit: 'bar',
      min: 0,
      max: 10,
      warning: limits.pressure?.l ?? 2.4,
      critical: limits.pressure?.ll ?? 1.2,
    },
    flowRate: {
      value: Math.round(baseFlow * 10) / 10,
      unit: 'L/s',
      min: 0,
      max: 40,
      warning: 16,
      critical: 10,
    },
    rpm: {
      value: Math.round(baseRPM),
      unit: 'RPM',
      min: 0,
      max: ratedRpm > 0 ? Math.max(1800, ratedRpm + 500) : 100,
      warning: ratedRpm > 0 ? Math.round(ratedRpm * 1.07) : 60,
      critical: ratedRpm > 0 ? Math.round(ratedRpm * 1.12) : 80,
    },
    current: {
      value: Math.round(baseCurrent * 10) / 10,
      unit: 'A',
      min: 0,
      max: Math.max(30, Math.round(ratedCurr * 1.5)),
      warning: Math.round(ratedCurr * 1.08),
      critical: Math.round(ratedCurr * 1.2),
    },
    activePower: {
      value: activePower,
      unit: 'kW',
    },
    powerFactor: {
      value: powerFactor,
      unit: 'cos φ',
    },
    efficiency: {
      value: Math.round(baseEfficiency * 10) / 10,
      unit: '%',
      min: 0,
      max: 100,
      warning: 82,
      critical: 74,
    },
    npshAvailable: {
      value: npshAvail,
      unit: 'm',
    },
    npshRequired: {
      value: npshReq,
      unit: 'm',
    },
    npshMargin: {
      value: npshMargin,
      unit: 'm Δ',
      risk: cavitationRisk,
    },
    specifics,
    ...specifics,
  };

  baseResult.keyParameters = buildKeyParameters(machine, baseResult);
  return baseResult;
}

function buildKeyParameters(machine, t) {
  const deVal = t.bearingDE.value;
  const vibVal = t.vibration.value;
  const statusTemp = deVal >= t.bearingDE.critical ? 'critical' : deVal >= t.bearingDE.warning ? 'warning' : 'normal';
  const statusVib = vibVal >= t.vibration.critical ? 'critical' : vibVal >= t.vibration.warning ? 'warning' : 'normal';

  if (machine.id === 'P-101') {
    return [
      { label: 'Bearing Temperature', value: `${deVal}`, unit: '°C', status: statusTemp, hint: `Limit ${t.bearingDE.warning}°C` },
      { label: 'Vibration Level', value: `${vibVal}`, unit: 'mm/s', status: statusVib, hint: `Limit ${t.vibration.warning} mm/s` },
      { label: 'Flow & Pressure', value: `${t.flowRate.value} L/s`, unit: `${t.pressure.value} bar`, status: t.npshMargin.risk !== 'NORMAL' ? 'warning' : 'normal', hint: `NPSH Margin +${t.npshMargin.value} m` },
      { label: 'Motor Load', value: `${t.activePower.value}`, unit: 'kW', status: 'normal', hint: `${t.rpm.value} RPM · ${t.efficiency.value}% eff` },
    ];
  }
  if (machine.id === 'CNC-001') {
    const runoutWarn = (t.spindleRunout ?? 1.2) > 4.5 ? 'warning' : 'normal';
    return [
      { label: 'Spindle Speed', value: `${t.spindleSpeed ?? t.rpm.value}`, unit: 'RPM', status: 'normal', hint: `Load ${t.spindleLoad ?? 60}%` },
      { label: 'Spindle Temperature', value: `${deVal}`, unit: '°C', status: statusTemp, hint: `Z-Drift ${t.thermalDriftZ ?? 2.1} µm` },
      { label: 'Spindle Runout', value: `${t.spindleRunout ?? 1.2}`, unit: 'µm', status: runoutWarn, hint: `Vibration ${vibVal} mm/s` },
      { label: 'Coolant System', value: `${t.coolantPressure ?? 4.1}`, unit: 'bar', status: (t.coolantPressure ?? 4.1) < 3.4 ? 'warning' : 'normal', hint: `${t.coolantFlow ?? 18.2} L/min` },
    ];
  }
  if (machine.id === 'COMP-201') {
    const dpWarn = (t.separatorDeltaP ?? 0.25) > 0.65 ? 'warning' : 'normal';
    return [
      { label: 'Receiver Pressure', value: `${t.tankPressure ?? t.pressure.value}`, unit: 'bar', status: (t.tankPressure ?? 7.2) < 5.8 ? 'warning' : 'normal', hint: `Dew Point +${t.dewPoint ?? 3.2}°C` },
      { label: 'Stage 1 Temp', value: `${t.stage1Temp ?? 68}`, unit: '°C', status: (t.stage1Temp ?? 68) > 85 ? 'warning' : 'normal', hint: `Cylinder ${deVal}°C` },
      { label: 'Air Delivery', value: `${t.airDeliveryFAD ?? 840}`, unit: 'L/min', status: 'normal', hint: `Belt Tension ${t.beltTension ?? 95}%` },
      { label: 'Drive Vibration', value: `${vibVal}`, unit: 'mm/s', status: dpWarn !== 'normal' ? dpWarn : statusVib, hint: `Sep ΔP ${t.separatorDeltaP ?? 0.25} bar` },
    ];
  }
  if (machine.id === 'CONV-401') {
    const tensWarn = (t.beltTension ?? 94) < 85 ? 'warning' : 'normal';
    return [
      { label: 'Belt Speed', value: `${t.beltSpeedMps ?? 1.42}`, unit: 'm/s', status: 'normal', hint: `${t.rpm.value} RPM Drive` },
      { label: 'Belt Tension', value: `${t.beltTension ?? 94}`, unit: '%', status: tensWarn, hint: `Motor Slip ${t.motorSlip ?? 2.2}%` },
      { label: 'Drive Bearing Temp', value: `${deVal}`, unit: '°C', status: statusTemp, hint: `Limit ${t.bearingDE.warning}°C` },
      { label: 'Drive Vibration', value: `${vibVal}`, unit: 'mm/s', status: statusVib, hint: `Power ${t.activePower.value} kW` },
    ];
  }
  if (machine.id === 'XFMR-302') {
    const oilWarn = (t.topOilTemp ?? 48) > 75 ? 'warning' : 'normal';
    const dgaWarn = (t.hydrogenGas ?? 24) > 80 || (t.breakdownVoltage ?? 60) < 40 ? 'warning' : 'normal';
    return [
      { label: 'Substation Load', value: `${t.activePower.value}`, unit: 'kW', status: 'normal', hint: `PF ${t.powerFactor.value} · 50 Hz` },
      { label: 'Top Oil Temp', value: `${t.topOilTemp ?? 48}`, unit: '°C', status: oilWarn, hint: `Winding ${t.windingHotspotTemp ?? 58}°C` },
      { label: 'Oil Health (BDV)', value: `${t.breakdownVoltage ?? 60}`, unit: 'kV', status: dgaWarn, hint: `H₂ Gas ${t.hydrogenGas ?? 24} ppm` },
      { label: 'DGA Condition', value: t.dgaCondition?.split(' ')[0] + ' ' + (t.dgaCondition?.split(' ')[1] || ''), unit: '', status: dgaWarn, hint: `Moisture ${t.moisturePpm ?? 13} ppm` },
    ];
  }
  // ROB-001 default
  return [
    { label: 'Active Payload', value: `${t.activePayload ?? 142}`, unit: `/ ${t.maxPayload ?? 210} kg`, status: 'normal', hint: `Cycle ${t.cycleTime ?? 14.1}s` },
    { label: 'Tool Path Speed', value: `${t.tcpVelocity ?? 1260}`, unit: 'mm/s', status: 'normal', hint: `±${t.repeatability ?? 0.02} mm` },
    { label: 'Reducer Backlash', value: `${t.harmonicBacklash ?? 0.42}`, unit: 'arcmin', status: (t.harmonicBacklash ?? 0.42) > 0.85 ? 'warning' : 'normal', hint: `J2 Servo ${t.servoTemps?.j2 ?? 53}°C` },
    { label: 'Motor Power', value: `${t.activePower.value}`, unit: 'kW', status: statusVib, hint: `Vibration ${vibVal} mm/s` },
  ];
}

export function computePrediction(machine, telemetry) {
  if (!machine) return null;
  const h = machine.health;
  const degradation = (100 - h) / 100;

  const vibWarn = telemetry?.vibration?.warning ?? 3.5;
  const vibCrit = telemetry?.vibration?.critical ?? 5.5;
  const vibVal = telemetry?.vibration?.value ?? 1.2;
  const vibEnvVal = telemetry?.vibrationEnvelope?.value ?? 0.5;
  const vibScore = Math.min(1, vibVal / Math.max(1.5, vibCrit));
  const vibEnvScore = Math.min(1, vibEnvVal / 2.8);
  const thermalScore = Math.min(1, Math.max(0, ((telemetry?.bearingDE?.value ?? 50) - 35) / 52));
  const weibullCdf = 1 - Math.exp(-Math.pow((machine.runtimeHours || 4000) / (machine.weibullEta || 30000), machine.weibullBeta || 2.3));

  const rawProb = (
    degradation * 0.85 +
    vibEnvScore * 0.25 +
    vibScore * 0.18 +
    thermalScore * 0.12 +
    weibullCdf * 0.08
  ) * 100;
  const failureProbability = Math.max(4, Math.min(97, Math.round(rawProb)));
  const remainingUsefulLife = Math.max(7, Math.round(((100 - failureProbability) / 100) * 340 + (h / 100) * 40));
  const confidence = Math.round(86 + (1 - Math.abs(0.5 - degradation)) * 11);

  const modesLib = FAILURE_MODE_LIBRARY[machine.id] || FAILURE_MODE_LIBRARY['P-101'];
  const failureModes = modesLib.map((item, idx) => {
    const prob = Math.max(
      2,
      Math.min(96, Math.round(failureProbability * item.weight + (idx === 0 ? 4 : -idx * 2)))
    );
    return {
      mode: item.mode,
      probability: prob,
      severity: prob > 65 ? 'high' : prob > 35 ? 'medium' : 'low',
      indicator: buildIndicator(machine.id, item.mode, degradation, telemetry),
    };
  }).sort((a, b) => b.probability - a.probability);

  const topFailureMode = failureModes[0]?.mode || 'General Wear';
  const riskLevel = failureProbability >= 70 ? 'CRITICAL' : failureProbability >= 35 ? 'HIGH' : 'LOW';

  const wVib = Math.max(10, Math.round((vibScore * 45 + degradation * 25) * 10) / 10);
  const wTemp = Math.max(8, Math.round((thermalScore * 30 + degradation * 15) * 10) / 10);
  const wLife = Math.max(5, Math.round((weibullCdf * 20) * 10) / 10);
  const wProc = Math.max(4, Math.round((degradation * 15 + 5) * 10) / 10);
  const wSum = wVib + wTemp + wLife + wProc;

  const p1 = Math.round((wVib / wSum) * 100);
  const p2 = Math.round((wTemp / wSum) * 100);
  const p3 = Math.round((wLife / wSum) * 100);
  const p4 = Math.max(1, 100 - p1 - p2 - p3);

  const vibLabel = machine.id === 'XFMR-302'
    ? `Core Harmonics (${vibVal} mm/s)`
    : `Vibration RMS (${vibVal}/${vibWarn} mm/s)`;
  const thermalLabel = machine.id === 'XFMR-302'
    ? `Winding ΔT Rise (${telemetry?.deltaT?.value ?? 18}°C)`
    : `Bearing ΔT Rise (${telemetry?.deltaT?.value ?? 20}°C)`;

  const factors = [
    { name: vibLabel, contribution: p1 },
    { name: thermalLabel, contribution: p2 },
    { name: `Weibull Fatigue (${machine.runtimeHours.toLocaleString()}h)`, contribution: p3 },
    { name: 'Process / Load Variance', contribution: p4 },
  ];

  let recommendation = 'Normal operation within ISA-18.2 nominal envelope. Continue scheduled PM.';
  if (failureProbability >= 70) {
    recommendation = `Immediate intervention required. Dispatch PM work order for ${topFailureMode.toLowerCase()} before next shift window.`;
  } else if (failureProbability >= 35) {
    recommendation = `Advisory threshold exceeded. Increase PeakVue inspection cadence for ${topFailureMode.toLowerCase()} and stage spare SKU.`;
  }

  return {
    machineId: machine.id,
    failureProbability,
    remainingUsefulLife,
    rulDays: remainingUsefulLife,
    confidence,
    riskLevel,
    topFailureMode,
    failureModes,
    factors,
    dailyDowntimeExposure: Math.round((machine.downtimeCostPerHr || 20000) * (failureProbability / 100) * 0.35),
    recommendation,
    lastUpdated: new Date().toISOString(),
  };
}

function buildIndicator(machineId, mode, degradation, telemetry) {
  if (machineId === 'ROB-001') {
    if (mode.includes('Harmonic')) return `Backlash: ${telemetry?.harmonicBacklash ?? 0.45} arcmin`;
    if (mode.includes('Cable')) return `J2 Torque: ${telemetry?.jointTorques?.j2 ?? 690} N·m`;
    return `Gripper: ${telemetry?.gripperPressure ?? 6.2} bar • ±${telemetry?.repeatability ?? 0.02} mm`;
  }
  if (machineId === 'CNC-001') {
    if (mode.includes('Spindle')) return `Dynamic runout: ${telemetry?.spindleRunout ?? 1.4} µm`;
    if (mode.includes('Thermal')) return `Thermal Z-drift: +${telemetry?.thermalDriftZ ?? 2.1} µm`;
    return `Coolant press: ${telemetry?.coolantPressure ?? 4.1} bar`;
  }
  if (machineId === 'XFMR-302') {
    return `DGA H₂: ${telemetry?.hydrogenGas ?? 24} ppm • Top Oil: ${telemetry?.topOilTemp ?? 48}°C`;
  }
  if (machineId === 'COMP-201') {
    if (mode.includes('Separator')) return `Separator ΔP: ${telemetry?.separatorDeltaP ?? 0.28} bar`;
    return `Stage-1: ${telemetry?.stage1Temp ?? 68}°C • FAD: ${telemetry?.airDeliveryFAD ?? 830} L/m`;
  }
  if (machineId === 'CONV-401') {
    return `Belt tension: ${telemetry?.beltTension ?? 94}% • Slip: ${telemetry?.motorSlip ?? 2.4}%`;
  }
  if (mode.includes('Bearing') || mode.includes('Vibration')) {
    return `RMS: ${telemetry?.vibration?.value ?? 1.3} mm/s • PeakVue: ${telemetry?.vibrationEnvelope?.value ?? 0.6} gE`;
  }
  return `Bearing DE: ${telemetry?.bearingDE?.value ?? 54}°C • η: ${telemetry?.efficiency?.value ?? 90}%`;
}

export function computeReliability(machine) {
  const h = machine.health / 100;
  const oeeProfile = OEE_LOSS_PROFILES[machine.id] || {
    scheduledHrs: 700,
    plannedStopHrs: 12,
    breakdownHrs: 8,
    speedLossPct: 3.5,
    qualityDefectPct: 0.4,
    targetOutputUnits: 50000,
    actualOutputUnits: 47200,
    scrapUnits: 190,
  };

  const mtbf = Math.max(220, Math.round(1100 + h * 4100));
  const mttr = Math.max(1.2, Math.round((1.8 + (1 - h) * 5.8) * 10) / 10);
  const availFromLoss = ((oeeProfile.scheduledHrs - oeeProfile.plannedStopHrs - oeeProfile.breakdownHrs) / oeeProfile.scheduledHrs) * 100;
  const availability = Math.min(99.9, Math.round(((availFromLoss * 0.65) + ((mtbf / (mtbf + mttr)) * 100 * 0.35)) * 100) / 100);
  const performance = Math.min(99.5, Math.round((100 - oeeProfile.speedLossPct - (1 - h) * 5.5) * 10) / 10);
  const quality = Math.min(99.9, Math.round((100 - oeeProfile.qualityDefectPct - (1 - h) * 1.4) * 10) / 10);
  const oee = Math.min(99, Math.round(((availability / 100) * (performance / 100) * (quality / 100)) * 1000) / 10);

  const downtimeCostExposure = Math.round(oeeProfile.breakdownHrs * (machine.downtimeCostPerHr || 25000));

  return {
    machineId: machine.id,
    mtbf,
    mttr,
    availability,
    performance,
    quality,
    oee,
    failureRate: Math.round((1 / mtbf) * 10000) / 10000,
    healthIndex: machine.health,
    totalFailures: Math.max(0, Math.round((1 - h) * 8)),
    totalDowntime: Math.round((oeeProfile.plannedStopHrs + oeeProfile.breakdownHrs) * 10) / 10,
    runtimeHours: machine.runtimeHours,
    weibullBeta: machine.weibullBeta,
    weibullEta: machine.weibullEta,
    oeeLosses: {
      ...oeeProfile,
      downtimeCostExposure,
      availabilityLossPct: Math.round((100 - availability) * 10) / 10,
      performanceLossPct: Math.round((100 - performance) * 10) / 10,
      qualityLossPct: Math.round((100 - quality) * 10) / 10,
    },
  };
}

export function computeWhatIf(machine, baseRul, { rpm = 1450, ambientTemp = 32, loadPercent = 100, lubrication = 'good' }) {
  const isStaticAsset = machine?.id === 'XFMR-302' || machine?.ratedRpm === 0;
  const lubeFactor = lubrication === 'poor' ? 0.6 : lubrication === 'good' ? 1.0 : 1.35;
  const nominalRpm = machine?.ratedRpm > 0 ? machine.ratedRpm : 1450;
  const speedRatio = isStaticAsset ? 1.0 : rpm / nominalRpm;
  const loadRatio = loadPercent / 100;

  const wearAcceleration = isStaticAsset
    ? Math.round((Math.pow(loadRatio, 1.8) * Math.pow(2, (ambientTemp - 32) / 12) / lubeFactor) * 100) / 100
    : Math.round((Math.pow(loadRatio, 2.5) * Math.pow(speedRatio, 1.4) / lubeFactor) * 100) / 100;

  const projectedTemp = isStaticAsset
    ? Math.round((ambientTemp + 24 * Math.pow(loadRatio, 1.6) * (lubrication === 'poor' ? 1.35 : 1.0)) * 10) / 10
    : Math.round((ambientTemp + 20 * speedRatio + 18 * loadRatio * (lubrication === 'poor' ? 1.4 : 1.0)) * 10) / 10;

  const adjustedRUL = Math.max(5, Math.round(baseRul / Math.max(0.2, wearAcceleration)));
  const projectedRisk = Math.min(98, Math.max(5, Math.round((wearAcceleration * 28 + (projectedTemp > 75 ? 30 : 0)) * 10) / 10));

  const assessment = wearAcceleration > 1.5
    ? `At ${loadPercent}% load${isStaticAsset ? '' : ` and ${rpm} RPM`}, wear increases ${wearAcceleration}x (${projectedTemp}°C). Reduce load or plan maintenance within ${adjustedRUL} days.`
    : `Operating conditions remain safe with an estimated ${adjustedRUL} days remaining service life.`;

  return {
    isStaticAsset,
    nominalRpm,
    wearAcceleration,
    projectedTemp,
    adjustedRUL,
    projectedRisk,
    assessment,
  };
}

export function computeFftSpectrum(machine, telemetry) {
  const vibration = telemetry?.vibration?.value ?? 1.2;
  const rpm = telemetry?.rpm?.value ?? machine?.ratedRpm ?? 1450;
  const health = machine?.health ?? 85;
  const isStaticAsset = machine?.id === 'XFMR-302' || machine?.ratedRpm === 0;
  const degradation = Math.max(0, (100 - health) / 100);

  const bearingGeom = parseJsonSafe(machine?.bearingGeometry || machine?.bearingGeometryJson, {});
  const bpfoMult = bearingGeom.bpfoMult || 3.06;
  const bpfiMult = bearingGeom.bpfiMult || 4.94;

  const f1x = isStaticAsset ? 50 : Math.round((rpm / 60) * 10) / 10;
  const f2x = isStaticAsset ? 100 : Math.round(f1x * 2 * 10) / 10;
  const fBPFO = isStaticAsset ? 150 : Math.round(f1x * bpfoMult * 10) / 10;
  const fBPFI = isStaticAsset ? 250 : Math.round(f1x * bpfiMult * 10) / 10;

  const maxFreq = isStaticAsset
    ? 300
    : Math.max(200, Math.ceil((Math.max(fBPFI, fBPFO) + 40) / 20) * 20);
  const freqStep = Math.max(2, Math.round(maxFreq / 100));
  const baseAmp = Math.max(0.2, vibration * 0.38);
  const sigma = Math.max(1.8, maxFreq * 0.012);

  const peaks = isStaticAsset
    ? [
        { center: 50, weight: 0.45 },
        { center: 100, weight: 0.75 + degradation * 1.4 },
        { center: 150, weight: 0.25 + degradation * 0.9 },
        { center: 250, weight: 0.15 + degradation * 0.5 },
      ]
    : [
        { center: f1x, weight: 0.85 },
        { center: f2x, weight: 0.30 + degradation * 0.75 },
        { center: fBPFO, weight: 0.22 + degradation * 1.85 },
        { center: fBPFI, weight: 0.12 + degradation * 0.95 },
      ];

  const spectrum = [];
  for (let f = 0; f <= maxFreq; f += freqStep) {
    let amp = 0.06 + ((f * 13) % 7) * 0.005;
    for (const pk of peaks) {
      const dist = Math.abs(f - pk.center);
      if (dist < sigma * 3) {
        amp += baseAmp * pk.weight * Math.exp(-Math.pow(dist / sigma, 2));
      }
    }
    spectrum.push({ freq: f, amplitude: Math.round(amp * 100) / 100 });
  }

  const peakAmplitude = Math.max(...spectrum.map(d => d.amplitude));
  const isoSeverity = peakAmplitude > 4.5 ? 'Zone D (Critical)'
    : peakAmplitude > 2.8 ? 'Zone C (Warning)'
    : peakAmplitude > 1.4 ? 'Zone B (Satisfactory)' : 'Zone A (Healthy)';
  const severityVariant = peakAmplitude > 4.5 ? 'critical' : peakAmplitude > 2.8 ? 'warning' : 'healthy';

  return {
    machineId: machine.id,
    isStaticAsset,
    title: isStaticAsset ? 'Core Magnetostriction Spectrum (50 Hz)' : 'Vibration Frequency Spectrum (ISO 10816-3)',
    subtitle: isStaticAsset
      ? '50 Hz Fundamental · 100 Hz Core Hum · 150 Hz Harmonics'
      : `Primary Peak ${f1x} Hz · Outer Bearing ${fBPFO} Hz · Inner ${fBPFI} Hz`,
    isoSeverity,
    severityVariant,
    peakAmplitude,
    markers: [
      { label: isStaticAsset ? '50Hz' : '1X', freq: f1x, color: '#1d4ed8', fullLabel: isStaticAsset ? 'Mains Fundamental' : 'Shaft Unbalance' },
      { label: isStaticAsset ? '100Hz' : '2X', freq: f2x, color: '#b45309', fullLabel: isStaticAsset ? 'Core Hum' : 'Misalignment' },
      { label: isStaticAsset ? '150Hz' : 'BPFO', freq: fBPFO, color: '#b91c1c', fullLabel: isStaticAsset ? 'Core Harmonic' : 'Outer Bearing Race' },
    ],
    spectrum,
  };
}

export function computeCurvesAnalysis(machine, telemetry) {
  const currentHours = machine?.runtimeHours || 20000;
  const beta = machine?.weibullBeta || 2.35;
  const eta = machine?.weibullEta || 32000;

  const maxT = Math.max(8000, Math.ceil((eta * 1.4) / 1000) * 1000);
  const step = Math.round(maxT / 14 / 500) * 500 || 2000;
  const weibullPoints = [];
  for (let t = 0; t <= maxT; t += step) {
    const prob = 1 - Math.exp(-Math.pow(t / eta, beta));
    weibullPoints.push({ t, probPercent: Math.round(prob * 1000) / 10 });
  }
  const currentWeibullProb = Math.min(99.9, Math.round((1 - Math.exp(-Math.pow(currentHours / eta, beta))) * 1000) / 10);

  const flowRate = telemetry?.flowRate?.value ?? 28;
  const healthFactor = Math.max(0.5, (machine?.health ?? 85) / 100);
  const hqPoints = [];
  for (let q = 0; q <= 40; q += 2) {
    hqPoints.push({
      q,
      headDesign: Math.round(Math.max(0, 45 - 0.022 * Math.pow(q, 2)) * 10) / 10,
      headActual: Math.round(Math.max(0, 45 * healthFactor - 0.024 * Math.pow(q, 2)) * 10) / 10,
      systemHead: Math.round((12 + 0.018 * Math.pow(q, 2)) * 10) / 10,
    });
  }
  const liveHead = Math.max(0, Math.round((45 * healthFactor - 0.024 * Math.pow(flowRate, 2)) * 10) / 10);

  return {
    machineId: machine.id,
    weibull: {
      currentHours,
      beta,
      eta,
      currentProb: currentWeibullProb,
      points: weibullPoints,
    },
    hqCurve: {
      flowRate,
      liveHead,
      points: hqPoints,
    },
  };
}

function evalAlarmState(value, warn, crit, invert = false) {
  if (warn == null || crit == null) return 'NORMAL';
  if (invert) {
    if (value <= crit) return 'LL-CRIT';
    if (value <= warn) return 'L-WARN';
    return 'NORMAL';
  }
  if (value >= crit) return 'HH-CRIT';
  if (value >= warn) return 'H-WARN';
  return 'NORMAL';
}

export function buildOpcUaTags(machinesWithTelemetry) {
  const tags = [];
  const byId = Object.fromEntries(machinesWithTelemetry.map(item => [item.machine.id, item]));

  const p101 = byId['P-101'];
  if (p101) {
    const t = p101.telemetry;
    tags.push(
      { machineId: 'P-101', modbus: '40001', node: 'ns=2;s=P101.DriveMotor.Temperature', type: 'Float32', val: `${t.temperature.value} °C`, alarmState: evalAlarmState(t.temperature.value, t.temperature.warning, t.temperature.critical), quality: 'Good [0x00]' },
      { machineId: 'P-101', modbus: '40003', node: 'ns=2;s=P101.Bearing.VibrationRMS', type: 'Float32', val: `${t.vibration.value} mm/s`, alarmState: evalAlarmState(t.vibration.value, t.vibration.warning, t.vibration.critical), quality: 'Good [0x00]' },
      { machineId: 'P-101', modbus: '40005', node: 'ns=2;s=P101.PeakVue.Envelope', type: 'Float32', val: `${t.vibrationEnvelope.value} gE`, alarmState: evalAlarmState(t.vibrationEnvelope.value, t.vibrationEnvelope.warning, t.vibrationEnvelope.critical), quality: 'Good [0x00]' },
      { machineId: 'P-101', modbus: '40007', node: 'ns=2;s=P101.Shaft.SpeedRPM', type: 'Int32', val: `${t.rpm.value} RPM`, alarmState: 'NORMAL', quality: 'Good [0x00]' },
      { machineId: 'P-101', modbus: '40009', node: 'ns=2;s=P101.Discharge.Pressure', type: 'Float32', val: `${t.pressure.value} bar`, alarmState: evalAlarmState(t.pressure.value, t.pressure.warning, t.pressure.critical, true), quality: 'Good [0x00]' },
      { machineId: 'P-101', modbus: '40011', node: 'ns=2;s=P101.NPSH.Margin', type: 'Float32', val: `${t.npshMargin.value} m`, alarmState: t.npshMargin.risk, quality: 'Good [0x00]' }
    );
  }
  const cnc = byId['CNC-001'];
  if (cnc) {
    const t = cnc.telemetry;
    tags.push(
      { machineId: 'CNC-001', modbus: '40101', node: 'ns=2;s=CNC001.Spindle.Speed', type: 'Int32', val: `${t.spindleSpeed} RPM`, alarmState: 'NORMAL', quality: 'Good [0x00]' },
      { machineId: 'CNC-001', modbus: '40103', node: 'ns=2;s=CNC001.Spindle.Runout', type: 'Float32', val: `${t.spindleRunout} µm`, alarmState: evalAlarmState(t.spindleRunout, 4.5, 6.5), quality: 'Good [0x00]' },
      { machineId: 'CNC-001', modbus: '40105', node: 'ns=2;s=CNC001.AxisZ.Vibration', type: 'Float32', val: `${t.vibration.value} mm/s`, alarmState: evalAlarmState(t.vibration.value, t.vibration.warning, t.vibration.critical), quality: 'Good [0x00]' }
    );
  }
  const comp = byId['COMP-201'];
  if (comp) {
    const t = comp.telemetry;
    tags.push(
      { machineId: 'COMP-201', modbus: '40201', node: 'ns=2;s=COMP201.Receiver.Pressure', type: 'Float32', val: `${t.tankPressure} bar`, alarmState: evalAlarmState(t.tankPressure, 5.8, 5.0, true), quality: 'Good [0x00]' },
      { machineId: 'COMP-201', modbus: '40203', node: 'ns=2;s=COMP201.Separator.DeltaP', type: 'Float32', val: `${t.separatorDeltaP} bar`, alarmState: evalAlarmState(t.separatorDeltaP, 0.75, 1.0), quality: 'Good [0x00]' }
    );
  }
  const conv = byId['CONV-401'];
  if (conv) {
    const t = conv.telemetry;
    tags.push(
      { machineId: 'CONV-401', modbus: '40301', node: 'ns=2;s=CONV401.Belt.Tension', type: 'Int32', val: `${t.beltTension} %`, alarmState: evalAlarmState(t.beltTension, 85, 75, true), quality: 'Good [0x00]' },
      { machineId: 'CONV-401', modbus: '40303', node: 'ns=2;s=CONV401.Motor.Current', type: 'Float32', val: `${t.current.value} A`, alarmState: evalAlarmState(t.current.value, t.current.warning, t.current.critical), quality: 'Good [0x00]' }
    );
  }
  const xfmr = byId['XFMR-302'];
  if (xfmr) {
    const t = xfmr.telemetry;
    tags.push(
      { machineId: 'XFMR-302', modbus: '40401', node: 'ns=2;s=XFMR302.TopOil.Temp', type: 'Float32', val: `${t.topOilTemp} °C`, alarmState: evalAlarmState(t.topOilTemp, 75, 88), quality: 'Good [0x00]' },
      { machineId: 'XFMR-302', modbus: '40403', node: 'ns=2;s=XFMR302.DGA.HydrogenH2', type: 'Int32', val: `${t.hydrogenGas} ppm`, alarmState: evalAlarmState(t.hydrogenGas, 60, 110), quality: 'Good [0x00]' }
    );
  }
  const rob = byId['ROB-001'];
  if (rob) {
    const t = rob.telemetry;
    tags.push(
      { machineId: 'ROB-001', modbus: '40501', node: 'ns=2;s=ROB001.Kinematics.TCPVelocity', type: 'Float32', val: `${t.tcpVelocity} mm/s`, alarmState: 'NORMAL', quality: 'Good [0x00]' },
      { machineId: 'ROB-001', modbus: '40503', node: 'ns=2;s=ROB001.Reducer.Backlash', type: 'Float32', val: `${t.harmonicBacklash} arcmin`, alarmState: evalAlarmState(t.harmonicBacklash, 0.85, 1.25), quality: 'Good [0x00]' }
    );
  }
  return tags;
}

export function buildMqttPacket(machine, telemetry) {
  return {
    id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    topic: `factory/${machine.zone}/${machine.id}/telemetry`,
    machineId: machine.id,
    timestamp: new Date().toISOString(),
    payload: {
      temp_c: telemetry.temperature.value,
      bearing_de_c: telemetry.bearingDE.value,
      vib_mms: telemetry.vibration.value,
      peakvue_ge: telemetry.vibrationEnvelope.value,
      press_bar: telemetry.pressure.value,
      power_kw: telemetry.activePower.value,
      rpm: telemetry.rpm.value,
      health_index: machine.health,
      status: machine.status,
    },
  };
}
