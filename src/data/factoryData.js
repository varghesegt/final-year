/* ===================================================================
   SMART FACTORY — Simulated Data Engine
   Physics-based sensor simulation with realistic degradation curves.
   Every machine generates its own independent data stream.
   =================================================================== */

// ── Factory Zones ───────────────────────────────────────────────────
export const ZONES = [
  {
    id: 'pump-room',
    name: 'Pump Room',
    icon: 'Waves',
    description: 'Fluid handling & pumping systems',
    machines: ['P-101'],
    color: '#06b6d4',
  },
  {
    id: 'cnc-shop',
    name: 'CNC Shop',
    icon: 'Cog',
    description: 'Precision machining & milling center',
    machines: ['CNC-001'],
    color: '#3b82f6',
  },
  {
    id: 'compressor-room',
    name: 'Compressor Room',
    icon: 'Wind',
    description: 'Compressed air systems',
    machines: ['COMP-201'],
    color: '#8b5cf6',
  },
  {
    id: 'conveyor-line',
    name: 'Conveyor Line',
    icon: 'ArrowRight',
    description: 'Material transport & logistics',
    machines: ['CONV-401'],
    color: '#10b981',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'Zap',
    description: 'Power transformer & distribution',
    machines: ['XFMR-302'],
    color: '#f59e0b',
  },
  {
    id: 'robotic-cell',
    name: 'Robotic Automation Bay',
    icon: 'Bot',
    description: '6-Axis heavy payload articulated robotic manipulator & assembly',
    machines: ['ROB-001'],
    color: '#ec4899',
  },
];

// ── Machine Catalog (Core Industrial Machine Models) ──────────────
export const MACHINES = {
  'P-101': {
    id: 'P-101',
    name: 'Centrifugal Pump #1',
    type: 'Centrifugal Pump',
    zone: 'pump-room',
    manufacturer: 'KSB',
    model: 'Etanorm SYT 065-040-250',
    installDate: '2019-06-12',
    health: 82,
    status: 'warning',
    criticality: 'critical',
  },
  'CNC-001': {
    id: 'CNC-001',
    name: 'Vertical Milling Machine #1',
    type: 'Vertical Milling Machine',
    zone: 'cnc-shop',
    manufacturer: 'Bridgeport / DMG Mori',
    model: 'Series II Heavy Duty Vertical Mill (ISO 40)',
    installDate: '2020-03-15',
    health: 94,
    status: 'running',
    criticality: 'high',
  },
  'COMP-201': {
    id: 'COMP-201',
    name: 'Dual-Stage Air Compressor #1',
    type: 'Air Compressor',
    zone: 'compressor-room',
    manufacturer: 'Atlas Copco',
    model: 'Automan AT Series (200L ASME Receiver)',
    installDate: '2020-09-18',
    health: 91,
    status: 'running',
    criticality: 'high',
  },
  'CONV-401': {
    id: 'CONV-401',
    name: 'Main Belt Conveyor',
    type: 'Belt Conveyor',
    zone: 'conveyor-line',
    manufacturer: 'Dorner',
    model: '2200 Series',
    installDate: '2019-11-30',
    health: 85,
    status: 'running',
    criticality: 'medium',
  },
  'XFMR-302': {
    id: 'XFMR-302',
    name: 'Power Transformer',
    type: 'Transformer',
    zone: 'utilities',
    manufacturer: 'ABB',
    model: 'Oil Distribution 1000kVA',
    installDate: '2018-02-20',
    health: 88,
    status: 'running',
    criticality: 'critical',
  },
  'ROB-001': {
    id: 'ROB-001',
    name: '6-Axis Industrial Robot Arm #1',
    type: 'Articulated Industrial Robot',
    zone: 'robotic-cell',
    manufacturer: 'KUKA / FANUC Robotics',
    model: 'KR 210 R2700 Heavy Payload 6-Axis Manipulator',
    installDate: '2021-04-10',
    health: 96,
    status: 'running',
    criticality: 'critical',
  },
};

// ── Sensor Simulation ───────────────────────────────────────────────

/** Add Gaussian noise to a value */
function noise(amplitude = 1) {
  return (Math.random() - 0.5) * 2 * amplitude;
}

/** Simulate slow sinusoidal cycling (thermal, load, etc.) */
function cyclic(periodMinutes = 10, amplitude = 1) {
  return Math.sin(Date.now() / (periodMinutes * 60000)) * amplitude;
}

/**
 * Generate real-time sensor data for a machine based on its health.
 * Lower health = more degraded readings.
 */
export function generateSensorData(machineId) {
  const machine = MACHINES[machineId];
  if (!machine) return null;

  const h = machine.health / 100; // 0.0 (dead) to 1.0 (perfect)
  const degradation = 1 - h;      // 0.0 (perfect) to 1.0 (dead)

  const ambientTemp = Math.round((30 + cyclic(30, 1.5) + noise(0.5)) * 10) / 10;
  const baseTemp = 35 + degradation * 45 + cyclic(8, 3) + noise(1.5);
  const deTemp = Math.round((baseTemp + degradation * 16 + cyclic(6, 1.5) + noise(1)) * 10) / 10;
  const ndeTemp = Math.round((Math.max(ambientTemp + 4, baseTemp - 8 + degradation * 8 + noise(0.8))) * 10) / 10;
  const deltaT = Math.round(Math.max(0, deTemp - ambientTemp) * 10) / 10;

  const baseVibration = 0.5 + degradation * 4.5 + cyclic(5, 0.3) + noise(0.2);
  const vibRMS = Math.round(baseVibration * 100) / 100;
  const vibPeak = Math.round((vibRMS * (2.8 + degradation * 2.4 + noise(0.2))) * 100) / 100;
  const vibEnvelope = Math.round((Math.max(0.1, 0.25 + degradation * 3.6 + cyclic(4, 0.2) + noise(0.15))) * 100) / 100;
  const crestFactor = Math.round((vibPeak / Math.max(0.1, vibRMS)) * 10) / 10;

  const basePressure = 4.5 - degradation * 1.5 + cyclic(12, 0.2) + noise(0.1);
  const baseFlow = 30 - degradation * 8 + cyclic(15, 0.5) + noise(0.3);
  const baseRPM = 1450 + degradation * 50 + cyclic(6, 10) + noise(5);
  const baseCurrent = 12 + degradation * 8 + cyclic(10, 0.5) + noise(0.3);
  const baseEfficiency = 95 - degradation * 20 + noise(0.5);

  const npshReq = 2.8;
  const npshAvail = Math.round((Math.max(1.2, 5.4 - degradation * 2.8 - cyclic(10, 0.3) + noise(0.15))) * 10) / 10;
  const npshMargin = Math.round((npshAvail - npshReq) * 10) / 10;
  const cavitationRisk = npshMargin < 0.5 ? (npshMargin < 0.1 ? 'CRITICAL' : 'WARNING') : 'NORMAL';

  const powerFactor = Math.round((Math.min(0.94, Math.max(0.72, 0.89 - degradation * 0.12 + noise(0.02)))) * 100) / 100;
  const activePower = Math.round((Math.sqrt(3) * 415 * baseCurrent * powerFactor / 1000) * 10) / 10;

  // Machine-specific parameters
  let specifics = {};
  if (machineId === 'P-101') {
    specifics = {
      npshMargin,
      cavitationRisk,
      sealChamberPressure: Math.round(basePressure * 0.85 * 10) / 10,
    };
  } else if (machineId === 'CNC-001') {
    specifics = {
      spindleSpeed: Math.round(4200 - degradation * 450 + cyclic(5, 30)),
      feedRate: Math.round(650 - degradation * 80 + cyclic(4, 15)),
      spindleTorque: Math.round(38 + degradation * 16 + noise(1)),
      spindleRunout: Math.round((1.2 + degradation * 6.5 + noise(0.2)) * 10) / 10,
      thermalDriftZ: Math.round((degradation * 18 + cyclic(8, 2)) * 10) / 10,
      coolantPressure: Math.round((4.2 - degradation * 0.8 + noise(0.1)) * 10) / 10,
      coolantFlow: Math.round((18.5 - degradation * 3.2 + noise(0.3)) * 10) / 10,
      chatterVib: Math.round((0.85 + degradation * 2.8 + noise(0.1)) * 100) / 100,
      spindleLoad: Math.round(62 + degradation * 22 + noise(2)),
      axisPos: {
        x: Math.round((245.8 + cyclic(2, 40)) * 100) / 100,
        y: Math.round((112.4 + cyclic(3, 25)) * 100) / 100,
        z: Math.round((-45.2 + cyclic(5, 10)) * 100) / 100
      },
    };
  } else if (machineId === 'COMP-201') {
    specifics = {
      tankPressure: Math.round((7.2 + cyclic(10, 0.4) - degradation * 1.5) * 10) / 10, // bar
      stage1Temp: Math.round((68 + degradation * 22 + noise(0.8)) * 10) / 10, // °C
      separatorDeltaP: Math.round((0.2 + degradation * 0.8 + noise(0.04)) * 100) / 100, // bar
      dewPoint: Math.round((3 + degradation * 8) * 10) / 10, // °C
      beltTension: Math.round(96 - degradation * 14), // %
      airDeliveryFAD: Math.round(850 - degradation * 180 + noise(10)), // L/min
    };
  } else if (machineId === 'CONV-401') {
    specifics = {
      beltTension: Math.round(98 - degradation * 18), // %
      motorSlip: Math.round((2.1 + degradation * 3.5) * 10) / 10, // %
    };
  } else if (machineId === 'XFMR-302') {
    specifics = {
      topOilTemp: Math.round((45 + degradation * 32) * 10) / 10, // °C
      hydrogenGas: Math.round(15 + degradation * 120), // ppm
      acetyleneGas: Math.round(degradation > 0.4 ? degradation * 45 : 2), // ppm
      breakdownVoltage: Math.round(65 - degradation * 35), // kV
    };
  } else if (machineId === 'ROB-001') {
    specifics = {
      tcpPosition: {
        x: Math.round((1450.2 + cyclic(4, 60)) * 10) / 10,
        y: Math.round((620.5 + cyclic(3, 40)) * 10) / 10,
        z: Math.round((845.0 + cyclic(5, 30)) * 10) / 10,
      },
      tcpVelocity: Math.round(1250 - degradation * 180 + cyclic(6, 120)), // mm/s
      activePayload: Math.round(142 - degradation * 8 + noise(1)), // kg
      maxPayload: 210, // kg
      payloadRatio: Math.round((142 / 210) * 100), // %
      repeatability: Math.round((0.02 + degradation * 0.05 + noise(0.003)) * 1000) / 1000, // ± mm
      cycleTime: Math.round((14.2 + degradation * 2.8 + noise(0.2)) * 10) / 10, // s
      partsCountToday: 1842,
      gripperPressure: Math.round((6.2 - degradation * 0.4 + noise(0.1)) * 10) / 10, // bar
      harmonicBacklash: Math.round((0.42 + degradation * 1.1 + noise(0.03)) * 100) / 100, // arcmin
      jointAngles: {
        j1: Math.round((42.5 + cyclic(8, 25)) * 10) / 10,
        j2: Math.round((-28.3 + cyclic(6, 18)) * 10) / 10,
        j3: Math.round((74.1 + cyclic(5, 30)) * 10) / 10,
        j4: Math.round((12.4 + cyclic(7, 45)) * 10) / 10,
        j5: Math.round((-45.6 + cyclic(4, 20)) * 10) / 10,
        j6: Math.round((88.2 + cyclic(9, 60)) * 10) / 10,
      },
      jointTorques: {
        j1: Math.round(420 + degradation * 80 + noise(10)),
        j2: Math.round(680 + degradation * 140 + noise(15)),
        j3: Math.round(390 + degradation * 70 + noise(8)),
      },
      servoTemps: {
        j1: Math.round((44.2 + degradation * 18 + noise(0.5)) * 10) / 10,
        j2: Math.round((53.8 + degradation * 24 + noise(0.8)) * 10) / 10,
        j3: Math.round((48.1 + degradation * 20 + noise(0.6)) * 10) / 10,
      },
    };
  }

  return {
    temperature: {
      value: Math.round(baseTemp * 10) / 10,
      unit: '°C',
      min: 20,
      max: 95,
      warning: 70,
      critical: 85,
    },
    bearingDE: {
      value: deTemp,
      unit: '°C',
      warning: 72,
      critical: 82,
      desc: 'Drive-End Bearing Pt100 RTD',
    },
    bearingNDE: {
      value: ndeTemp,
      unit: '°C',
      warning: 68,
      critical: 78,
      desc: 'Non-Drive-End Bearing Pt100 RTD',
    },
    ambientTemp: {
      value: ambientTemp,
      unit: '°C',
    },
    deltaT: {
      value: deltaT,
      unit: '°C Δ',
      limit: 45, // API 610 limit
      isExceeded: deltaT > 45,
    },
    vibration: {
      value: vibRMS,
      unit: 'mm/s',
      min: 0,
      max: 7,
      warning: 3.5,
      critical: 5.5,
      standard: 'ISO 10816-3 Velocity RMS',
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
      max: 8,
      warning: 2.5,
      critical: 1.5,
    },
    flowRate: {
      value: Math.round(baseFlow * 10) / 10,
      unit: 'L/s',
      min: 0,
      max: 40,
      warning: 20,
      critical: 15,
    },
    rpm: {
      value: Math.round(baseRPM),
      unit: 'RPM',
      min: 0,
      max: 1800,
      warning: 1550,
      critical: 1600,
    },
    current: {
      value: Math.round(baseCurrent * 10) / 10,
      unit: 'A',
      min: 0,
      max: 30,
      warning: 20,
      critical: 25,
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
      warning: 80,
      critical: 70,
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
}

// ── Prediction Data ─────────────────────────────────────────────────
export function generatePrediction(machineId) {
  const machine = MACHINES[machineId];
  if (!machine) return null;

  const h = machine.health;
  const degradation = (100 - h) / 100;

  const failureProb = Math.min(95, Math.round(degradation * 100 + noise(5)));
  const rul = Math.max(7, Math.round((h / 100) * 365 + noise(15)));
  const confidence = Math.round(65 + Math.random() * 25);

  let failureModes;
  if (machineId === 'ROB-001') {
    failureModes = [
      {
        mode: 'Harmonic Drive Gear Wear',
        probability: Math.min(95, Math.round(degradation * 85 + noise(8))),
        severity: 'high',
        indicator: 'Backlash trend ▲ +' + Math.round(degradation * 50) + '% (30d)',
      },
      {
        mode: 'Wrist Cable Harness Fatigue',
        probability: Math.min(80, Math.round(degradation * 55 + noise(10))),
        severity: 'medium',
        indicator: 'Cycle count: 1.2M cycles (85% rated life)',
      },
      {
        mode: 'Servo Motor Over-Torque',
        probability: Math.min(70, Math.round(degradation * 45 + noise(7))),
        severity: degradation > 0.4 ? 'high' : 'low',
        indicator: 'Axis J2 peak torque: 580 N·m (85% limit)',
      },
      {
        mode: 'Pneumatic Gripper Leakage',
        probability: Math.min(65, Math.round(degradation * 35 + noise(6))),
        severity: 'medium',
        indicator: 'Clamp pressure delta: -0.4 bar',
      },
      {
        mode: 'TCP Calibration Drift',
        probability: Math.min(50, Math.round(degradation * 25 + noise(5))),
        severity: 'low',
        indicator: 'Laser probe offset: +0.025 mm',
      },
    ];
  } else if (machineId === 'CNC-001') {
    failureModes = [
      {
        mode: 'Spindle Bearing Spalling',
        probability: Math.min(95, Math.round(degradation * 85 + noise(8))),
        severity: 'high',
        indicator: 'Dynamic runout trend ▲ +' + Math.round(degradation * 60) + '% (30d)',
      },
      {
        mode: 'Ball Screw Backlash',
        probability: Math.min(80, Math.round(degradation * 50 + noise(10))),
        severity: 'medium',
        indicator: 'Z-axis lost motion: 4.8 µm',
      },
      {
        mode: 'Spindle Motor Overheating',
        probability: Math.min(70, Math.round(degradation * 40 + noise(7))),
        severity: degradation > 0.4 ? 'high' : 'low',
        indicator: 'Stator winding temp: 68°C',
      },
      {
        mode: 'Coolant Pump Seal Failure',
        probability: Math.min(60, Math.round(degradation * 35 + noise(6))),
        severity: 'medium',
        indicator: 'Coolant pressure drop ▼ 0.6 bar',
      },
      {
        mode: 'Thermal Growth Along Z-Axis',
        probability: Math.min(50, Math.round(degradation * 25 + noise(5))),
        severity: 'low',
        indicator: 'Laser toolsetter delta: +3.2 µm',
      },
    ];
  } else {
    failureModes = [
      {
        mode: 'Bearing Failure',
        probability: Math.min(95, Math.round(degradation * 85 + noise(8))),
        severity: 'high',
        indicator: 'Vibration trend ▲ +' + Math.round(degradation * 60) + '% (30d)',
      },
      {
        mode: 'Seal Leakage',
        probability: Math.min(80, Math.round(degradation * 50 + noise(10))),
        severity: 'medium',
        indicator: 'Pressure drop ▼ ' + (degradation * 0.8).toFixed(1) + ' bar',
      },
      {
        mode: 'Motor Overheating',
        probability: Math.min(70, Math.round(degradation * 40 + noise(7))),
        severity: degradation > 0.4 ? 'high' : 'low',
        indicator: 'Temperature trend ▲ +' + Math.round(degradation * 30) + '% (30d)',
      },
      {
        mode: 'Impeller Wear',
        probability: Math.min(60, Math.round(degradation * 35 + noise(6))),
        severity: 'medium',
        indicator: 'Efficiency ▼ ' + Math.round(degradation * 15) + '%',
      },
      {
        mode: 'Shaft Misalignment',
        probability: Math.min(50, Math.round(degradation * 25 + noise(5))),
        severity: 'low',
        indicator: 'Axial vibration ratio: ' + (1 + degradation * 0.8).toFixed(2),
      },
    ];
  }

  return {
    machineId,
    failureProbability: Math.max(0, failureProb),
    remainingUsefulLife: rul,
    confidence,
    riskLevel: failureProb > 70 ? 'critical' : failureProb > 40 ? 'warning' : 'low',
    failureModes: failureModes.sort((a, b) => b.probability - a.probability),
    recommendation: getRecommendation(failureProb, failureModes[0].mode),
    lastUpdated: new Date().toISOString(),
  };
}

function getRecommendation(failureProb, topMode) {
  if (failureProb > 70) {
    return `Immediate action required. Schedule ${topMode.toLowerCase()} inspection and replacement within next maintenance window.`;
  }
  if (failureProb > 40) {
    return `Monitor closely. Increase inspection frequency for ${topMode.toLowerCase()}. Plan preventive maintenance within 30 days.`;
  }
  return 'Normal operation. Continue standard maintenance schedule.';
}

// ── Work Orders ─────────────────────────────────────────────────────
export const TECHNICIANS = [
  { id: 'T-001', name: 'Rajesh Kumar', skill: 'Mechanical', specialization: 'Rotating Equipment', available: true },
  { id: 'T-002', name: 'Amit Sharma', skill: 'Electrical', specialization: 'Motor & Drives', available: true },
  { id: 'T-003', name: 'Vikram Singh', skill: 'Mechanical', specialization: 'Bearing Specialist', available: true },
  { id: 'T-004', name: 'Suresh Patel', skill: 'Instrumentation', specialization: 'Sensors & Calibration', available: false },
  { id: 'T-005', name: 'Deepak Verma', skill: 'Mechanical', specialization: 'Pump Systems', available: true },
];

export const SPARE_PARTS = [
  { id: 'SP-001', name: 'SKF 6205-2RS Bearing', stock: 3, reorderLevel: 2, cost: 1200, leadTime: '3 days' },
  { id: 'SP-002', name: 'Mechanical Seal Kit', stock: 2, reorderLevel: 1, cost: 4500, leadTime: '5 days' },
  { id: 'SP-003', name: 'Impeller (Bronze)', stock: 1, reorderLevel: 1, cost: 18000, leadTime: '14 days' },
  { id: 'SP-004', name: 'Coupling Spider', stock: 5, reorderLevel: 3, cost: 800, leadTime: '2 days' },
  { id: 'SP-005', name: 'Shaft Sleeve', stock: 2, reorderLevel: 1, cost: 3200, leadTime: '7 days' },
  { id: 'SP-006', name: 'Gasket Set', stock: 8, reorderLevel: 5, cost: 350, leadTime: '1 day' },
  { id: 'SP-007', name: 'Lubricant (Shell Alvania)', stock: 4, reorderLevel: 2, cost: 950, leadTime: '2 days' },
  { id: 'SP-008', name: 'V-Belt (B68)', stock: 6, reorderLevel: 4, cost: 450, leadTime: '1 day' },
  { id: 'SP-009', name: 'Harmonic Drive CSG-25 Reducer', stock: 2, reorderLevel: 1, cost: 34000, leadTime: '5 days' },
  { id: 'SP-010', name: 'Robot Dress Package Cable Harness', stock: 3, reorderLevel: 2, cost: 14000, leadTime: '3 days' },
  { id: 'SP-011', name: 'Festo Parallel Gripper Seal Kit', stock: 4, reorderLevel: 2, cost: 4800, leadTime: '2 days' },
];

export function generateWorkOrder(machineId) {
  const prediction = generatePrediction(machineId);
  const machine = MACHINES[machineId];
  if (!prediction || !machine) return null;

  const topFailure = prediction.failureModes[0];
  const assignedTech = TECHNICIANS.find(t => t.available && t.skill === 'Mechanical') || TECHNICIANS[0];
  const requiredParts = SPARE_PARTS.slice(0, 3);

  const reactiveDowntime = 8 + Math.round(Math.random() * 16);  // 8-24 hours
  const reactiveCost = 50000 + Math.round(Math.random() * 80000);
  const preventiveDowntime = 2 + Math.round(Math.random() * 3);   // 2-5 hours
  const preventiveCost = requiredParts.reduce((sum, p) => sum + p.cost, 0) + 2000; // parts + labor

  return {
    id: `WO-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    machineId,
    machineName: machine.name,
    priority: prediction.riskLevel === 'critical' ? 'CRITICAL' : prediction.riskLevel === 'warning' ? 'HIGH' : 'MEDIUM',
    failureMode: topFailure.mode,
    action: getAction(topFailure.mode),
    assignedTo: assignedTech,
    estimatedDowntime: `${preventiveDowntime} hours`,
    scheduledDate: getNextMaintenanceWindow(),
    deadline: new Date(Date.now() + prediction.remainingUsefulLife * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    spareParts: requiredParts.map(p => ({
      ...p,
      status: p.stock > 0 ? 'In Stock' : 'Order Required',
    })),
    costComparison: {
      preventive: { cost: preventiveCost, downtime: preventiveDowntime },
      reactive: { cost: reactiveCost, downtime: reactiveDowntime },
      savings: reactiveCost - preventiveCost,
      roi: Math.round((reactiveCost - preventiveCost) / preventiveCost * 100) / 100,
    },
    createdAt: new Date().toISOString(),
    status: 'Pending',
  };
}

let ACTIVE_WORK_ORDERS = null;

export function getActiveWorkOrders() {
  if (!ACTIVE_WORK_ORDERS) {
    ACTIVE_WORK_ORDERS = Object.values(MACHINES)
      .filter(m => m.health < 92)
      .map(m => generateWorkOrder(m.id))
      .filter(Boolean)
      .sort((a, b) => {
        const priority = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        return (priority[b.priority] || 0) - (priority[a.priority] || 0);
      });
  }
  return [...ACTIVE_WORK_ORDERS];
}

export function completeWorkOrder(orderId, signOffData) {
  if (!ACTIVE_WORK_ORDERS) getActiveWorkOrders();
  const order = ACTIVE_WORK_ORDERS.find(o => o.id === orderId);
  if (order) {
    order.status = 'Completed';
    order.signOff = signOffData;

    // Restore machine health
    if (MACHINES[order.machineId]) {
      MACHINES[order.machineId].health = 95;
      MACHINES[order.machineId].status = 'running';
    }

    // Add to maintenance history
    if (!MAINTENANCE_HISTORY[order.machineId]) {
      MAINTENANCE_HISTORY[order.machineId] = [];
    }
    MAINTENANCE_HISTORY[order.machineId].unshift({
      date: new Date().toISOString().split('T')[0],
      type: 'Predictive',
      action: `${order.action} (Signed off by ${signOffData.technician})`,
      duration: parseInt(order.estimatedDowntime) || 2,
      cost: order.costComparison?.preventive?.cost || 4500,
      technician: order.assignedTo?.id || 'T-001',
    });

    addNotification({
      title: `Order #${order.id} Completed & Signed Off`,
      machineId: order.machineId,
      severity: 'info',
    });
  }
  return [...ACTIVE_WORK_ORDERS];
}

function getAction(failureMode) {
  const actions = {
    'Bearing Failure': 'Replace bearing assembly and re-grease housing',
    'Seal Leakage': 'Replace mechanical seal kit and inspect shaft sleeve',
    'Motor Overheating': 'Inspect winding insulation, clean cooling fins, check current draw',
    'Impeller Wear': 'Inspect impeller and replace if wear exceeds 10% of vane thickness',
    'Shaft Misalignment': 'Perform laser alignment and replace coupling spider',
    'Harmonic Drive Gear Wear': 'Inspect harmonic flexspline backlash and repack Mobilux EP023 synthetic grease',
    'Wrist Cable Harness Fatigue': 'Replace Axis 4-5-6 dress package flexible cable bundle and test bus continuity',
    'Servo Motor Over-Torque': 'Check joint torque limits, tune velocity loop gains and clear joint friction',
    'Pneumatic Gripper Leakage': 'Replace Festo pneumatic gripper piston seals and lubricate pneumatic cylinder',
    'TCP Calibration Drift': 'Run electronic mastering zero-point calibration with EMT mastering tool',
    'Spindle Bearing Spalling': 'Replace hybrid ceramic angular contact spindle bearings and balance rotor',
    'Ball Screw Backlash': 'Adjust double-nut preloading and check thrust bearings',
    'Spindle Motor Overheating': 'Inspect chiller heat exchanger and clean spindle jacket',
    'Coolant Pump Seal Failure': 'Replace coolant pump mechanical seal and flush swarf trap',
    'Thermal Growth Along Z-Axis': 'Recalibrate CNC thermal growth compensation matrix and spindle chiller',
  };
  return actions[failureMode] || 'General inspection and servicing';
}

function getNextMaintenanceWindow() {
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const nextWindow = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  return nextWindow.toISOString().split('T')[0];
}

// ── Reliability Metrics ─────────────────────────────────────────────
export function generateReliabilityMetrics(machineId) {
  const machine = MACHINES[machineId];
  if (!machine) return null;

  const h = machine.health / 100;

  const mtbf = Math.round(800 + h * 4200 + noise(200));          // hours
  const mttr = Math.round(2 + (1 - h) * 6 + noise(0.5));         // hours
  const availability = (mtbf / (mtbf + mttr) * 100);
  const performance = 85 + h * 12 + noise(1);
  const quality = 95 + h * 4.5 + noise(0.3);
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    machineId,
    mtbf: Math.max(100, mtbf),
    mttr: Math.max(1, mttr),
    availability: Math.min(99.9, Math.round(availability * 100) / 100),
    performance: Math.min(99.5, Math.round(performance * 10) / 10),
    quality: Math.min(99.9, Math.round(quality * 10) / 10),
    oee: Math.min(99, Math.round(oee * 10) / 10),
    failureRate: Math.round(1 / Math.max(100, mtbf) * 10000) / 10000,
    healthIndex: machine.health,
    totalFailures: Math.round((1 - h) * 12 + noise(1)),
    totalDowntime: Math.round((1 - h) * 120 + noise(10)),
  };
}

// ── Historical Data (for charts) ────────────────────────────────────
export function generateHistoricalData(machineId, days = 30) {
  const machine = MACHINES[machineId];
  if (!machine) return [];

  const data = [];
  const baseHealth = machine.health;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Gradual degradation over time
    const dayHealth = Math.min(100, baseHealth + (i / days) * 15 + noise(2));
    const dayDegradation = (100 - dayHealth) / 100;

    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: Math.round((35 + dayDegradation * 40 + noise(3)) * 10) / 10,
      vibration: Math.round((0.5 + dayDegradation * 4 + noise(0.4)) * 100) / 100,
      pressure: Math.round((4.5 - dayDegradation * 1.2 + noise(0.2)) * 100) / 100,
      efficiency: Math.round((95 - dayDegradation * 18 + noise(1)) * 10) / 10,
      health: Math.round(dayHealth),
    });
  }

  return data;
}

// ── Maintenance History ─────────────────────────────────────────────
export const MAINTENANCE_HISTORY = {
  'P-101': [
    { date: '2026-07-15', type: 'Preventive', action: 'Lubrication and alignment check', duration: 1.5, cost: 2500, technician: 'T-003' },
    { date: '2026-06-01', type: 'Corrective', action: 'Bearing replacement (drive end)', duration: 4, cost: 8500, technician: 'T-003' },
    { date: '2026-04-10', type: 'Preventive', action: 'Vibration analysis and oil change', duration: 2, cost: 3200, technician: 'T-005' },
    { date: '2026-02-20', type: 'Predictive', action: 'Seal inspection (AI recommendation)', duration: 1, cost: 1500, technician: 'T-005' },
    { date: '2025-12-05', type: 'Corrective', action: 'Impeller replacement (cavitation damage)', duration: 6, cost: 22000, technician: 'T-005' },
    { date: '2025-09-18', type: 'Preventive', action: 'Full pump overhaul', duration: 8, cost: 15000, technician: 'T-003' },
    { date: '2025-06-30', type: 'Preventive', action: 'Coupling spider replacement', duration: 2, cost: 3800, technician: 'T-001' },
    { date: '2025-03-12', type: 'Corrective', action: 'Motor rewinding', duration: 12, cost: 35000, technician: 'T-002' },
  ],
};

// ── Asset Lifecycle ─────────────────────────────────────────────────
export const ASSET_LIFECYCLE = {
  'P-101': {
    purchaseDate: '2019-04-20',
    purchaseCost: 250000,
    installDate: '2019-06-12',
    installCost: 35000,
    warrantyExpiry: '2021-06-12',
    expectedLife: 15,         // years
    depreciationRate: 10,     // % per year
    currentBookValue: 125000,
    totalMaintenanceCost: 91500,
    totalDowntimeHours: 37.5,
    estimatedReplacementCost: 320000,
    events: [
      { date: '2019-04-20', type: 'purchase', description: 'Purchased from KSB India', cost: 250000 },
      { date: '2019-06-12', type: 'installation', description: 'Installation and commissioning', cost: 35000 },
      { date: '2021-06-12', type: 'warranty', description: 'Warranty period expired', cost: 0 },
      { date: '2022-08-15', type: 'upgrade', description: 'VFD installation for energy optimization', cost: 45000 },
      { date: '2023-04-01', type: 'milestone', description: 'Crossed 25,000 operating hours', cost: 0 },
      { date: '2025-12-05', type: 'major-repair', description: 'Impeller replacement due to cavitation', cost: 22000 },
      { date: '2026-06-01', type: 'repair', description: 'Bearing replacement (drive end)', cost: 8500 },
    ],
  },
};

// ── Asset Lifecycle & History Helpers with Dynamic Fallbacks ───────
export function getAssetLifecycle(machineId) {
  if (ASSET_LIFECYCLE[machineId]) return ASSET_LIFECYCLE[machineId];
  const machine = MACHINES[machineId];
  if (!machine) return null;

  return {
    purchaseDate: '2020-01-15',
    purchaseCost: 180000,
    installDate: machine.installDate || '2020-03-01',
    installCost: 25000,
    warrantyExpiry: '2022-03-01',
    expectedLife: 12,
    depreciationRate: 8,
    currentBookValue: 110000,
    totalMaintenanceCost: 45000,
    totalDowntimeHours: 18.5,
    estimatedReplacementCost: 220000,
    events: [
      { date: machine.installDate || '2020-03-01', type: 'installation', description: 'Commissioning & baseline setup', cost: 25000 },
      { date: '2022-03-01', type: 'warranty', description: 'Warranty period concluded', cost: 0 },
      { date: '2024-05-10', type: 'repair', description: 'Scheduled major servicing & sensor recalibration', cost: 12000 },
      { date: '2025-11-18', type: 'upgrade', description: 'Firmware & predictive telemetry module installation', cost: 8000 },
    ],
  };
}

export function getMaintenanceHistory(machineId) {
  if (MAINTENANCE_HISTORY[machineId]) return MAINTENANCE_HISTORY[machineId];
  const machine = MACHINES[machineId];
  if (!machine) return [];

  return [
    { date: '2026-06-15', type: 'Preventive', action: 'Routine inspection & lubrication', duration: 1.5, cost: 2200, technician: 'T-001' },
    { date: '2026-03-10', type: 'Predictive', action: 'Vibration spectrum analysis (AI flag)', duration: 2.0, cost: 3500, technician: 'T-003' },
    { date: '2025-10-05', type: 'Corrective', action: 'Component recalibration & wear replacement', duration: 4.5, cost: 11000, technician: 'T-005' },
  ];
}

// ── Notifications System ────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'N-101', title: 'Bearing Anomaly Detected', machineId: 'P-101', severity: 'warning', time: '10 mins ago', read: false },
  { id: 'N-102', title: 'Kinematic Payload Calibrated (142kg)', machineId: 'ROB-001', severity: 'info', time: '22 mins ago', read: false },
  { id: 'N-103', title: 'Work Order Auto-Generated', machineId: 'P-101', severity: 'critical', time: '1 hour ago', read: true },
  { id: 'N-104', title: 'Spindle Dynamic Runout In-Spec', machineId: 'CNC-001', severity: 'info', time: '2 hours ago', read: false },
  { id: 'N-105', title: 'Routine Maintenance Due', machineId: 'CONV-401', severity: 'info', time: '3 hours ago', read: true },
];

let listeners = [];
export function subscribeToNotifications(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notifyListeners() {
  listeners.forEach(cb => cb([...NOTIFICATIONS]));
}

export function addNotification(notification) {
  NOTIFICATIONS.unshift({
    id: `N-${Date.now()}`,
    time: 'Just now',
    read: false,
    ...notification,
  });
  notifyListeners();
}

export function markNotificationsRead() {
  NOTIFICATIONS.forEach(n => { n.read = true; });
  notifyListeners();
}

// ── Live Failure Simulation Engine ──────────────────────────────────
let simulationInterval = null;
let activeSimMachineId = null;

export function isSimulationActive() {
  return !!simulationInterval;
}

export function getActiveSimMachine() {
  return activeSimMachineId;
}

export function triggerFailureSimulation(machineId = 'P-101', durationSeconds = 25, onStep, onComplete) {
  if (simulationInterval) clearInterval(simulationInterval);
  activeSimMachineId = machineId;

  const machine = MACHINES[machineId];
  if (!machine) return;

  const initialHealth = machine.health;
  const targetHealth = 28; // Severe critical state
  const stepMs = 500;
  const totalSteps = (durationSeconds * 1000) / stepMs;
  let currentStep = 0;

  addNotification({
    title: `Live Simulation Triggered: ${machine.name}`,
    machineId,
    severity: 'critical',
  });

  simulationInterval = setInterval(() => {
    currentStep++;
    const progress = Math.min(1, currentStep / totalSteps);
    machine.health = Math.max(targetHealth, Math.round(initialHealth - (initialHealth - targetHealth) * progress));

    if (machine.health <= 60 && machine.status !== 'critical') {
      machine.status = 'warning';
    }
    if (machine.health <= 40) {
      machine.status = 'critical';
    }

    if (onStep) onStep({ progress, health: machine.health, status: machine.status });

    if (currentStep >= totalSteps) {
      stopSimulation();
      addNotification({
        title: `Simulation Complete: ${machine.name} in Critical State`,
        machineId,
        severity: 'critical',
      });
      if (onComplete) onComplete();
    }
  }, stepMs);
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export function resetMachineHealth(machineId = 'P-101') {
  stopSimulation();
  if (MACHINES[machineId]) {
    MACHINES[machineId].health = 92;
    MACHINES[machineId].status = 'running';
    addNotification({
      title: `${MACHINES[machineId].name} Reset to Healthy`,
      machineId,
      severity: 'info',
    });
  }
}

// ── Factory Summary Stats ───────────────────────────────────────────
export function getFactorySummary() {
  const machineList = Object.values(MACHINES);
  const totalMachines = machineList.length;
  const running = machineList.filter(m => m.status === 'running').length;
  const warnings = machineList.filter(m => m.status === 'warning').length;
  const critical = machineList.filter(m => m.status === 'critical').length;
  const offline = machineList.filter(m => m.status === 'offline').length;
  const avgHealth = Math.round(machineList.reduce((s, m) => s + m.health, 0) / totalMachines);
  const unreadAlerts = NOTIFICATIONS.filter(n => !n.read).length;

  return {
    totalMachines,
    running,
    warnings,
    critical,
    offline,
    avgHealth,
    uptime: 97.3,
    activeAlerts: unreadAlerts || (warnings + critical * 2),
    openWorkOrders: 3,
    efficiency: 88.5,
  };
}

