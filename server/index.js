/* ===================================================================
   SMART FACTORY AI — Enterprise Backend Server (v2.0)
   Express REST API + SQLite Persistence + Live SSE Telemetry & MQTT
   =================================================================== */

import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';
import {
  DATASET_VERSION,
  DATASET_STANDARDS,
  ZONES,
  FAILURE_MODE_LIBRARY,
  INITIAL_MACHINES,
  OEE_LOSS_PROFILES,
} from './datasets/industrialDatasets.js';
import {
  generateMachineTelemetry,
  computePrediction,
  computeReliability,
  computeWhatIf,
  computeFftSpectrum,
  computeCurvesAnalysis,
  buildOpcUaTags,
  buildMqttPacket,
} from './engine/analyticsEngine.js';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ── Database Query Helpers ───────────────────────────────────────────
function parseMachineRow(row) {
  if (!row) return null;
  let bearingGeometry = {};
  let operatingProfile = {};
  let alarmLimits = {};
  try { bearingGeometry = JSON.parse(row.bearingGeometryJson || '{}'); } catch { /* noop */ }
  try { operatingProfile = JSON.parse(row.operatingProfileJson || '{}'); } catch { /* noop */ }
  try { alarmLimits = JSON.parse(row.alarmLimitsJson || '{}'); } catch { /* noop */ }
  return {
    ...row,
    bearingGeometry,
    operatingProfile,
    alarmLimits,
  };
}

function getAllMachines() {
  return db.prepare('SELECT * FROM machines ORDER BY id').all().map(parseMachineRow);
}

function getMachineById(id) {
  return parseMachineRow(db.prepare('SELECT * FROM machines WHERE id = ?').get(id));
}

function getAllNotifications() {
  return db.prepare('SELECT * FROM notifications ORDER BY rowid DESC LIMIT 50').all().map(n => ({
    ...n,
    read: Boolean(n.read),
  }));
}

function addNotificationRow({ title, machineId = null, severity = 'info' }) {
  const id = `N-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const nowIso = new Date().toISOString();
  db.prepare(`
    INSERT INTO notifications (id, title, machineId, severity, time, createdAt, read)
    VALUES (?, ?, ?, ?, 'Just now', ?, 0)
  `).run(id, title, machineId, severity, nowIso);
  return { id, title, machineId, severity, time: 'Just now', createdAt: nowIso, read: false };
}

function parseWorkOrderRow(row) {
  return {
    id: row.id,
    machineId: row.machineId,
    machineName: row.machineName,
    priority: row.priority,
    failureMode: row.failureMode,
    action: row.action,
    assignedTo: JSON.parse(row.assignedToJson),
    estimatedDowntime: row.estimatedDowntime,
    scheduledDate: row.scheduledDate,
    deadline: row.deadline,
    spareParts: JSON.parse(row.sparePartsJson),
    costComparison: JSON.parse(row.costComparisonJson),
    createdAt: row.createdAt,
    status: row.status,
    signOff: row.signOffJson ? JSON.parse(row.signOffJson) : null,
  };
}

function getAllWorkOrders() {
  const priorityRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
  const rows = db.prepare('SELECT * FROM work_orders ORDER BY createdAt DESC').all().map(parseWorkOrderRow);
  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1;
    return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
  });
}

function getFactorySummary() {
  const machines = getAllMachines();
  const totalMachines = machines.length;
  const running = machines.filter(m => m.status === 'running').length;
  const warnings = machines.filter(m => m.status === 'warning').length;
  const critical = machines.filter(m => m.status === 'critical').length;
  const offline = machines.filter(m => m.status === 'offline').length;
  const avgHealth = totalMachines
    ? Math.round(machines.reduce((s, m) => s + m.health, 0) / totalMachines)
    : 0;
  const unreadAlerts = db.prepare('SELECT COUNT(*) AS cnt FROM notifications WHERE read = 0').get().cnt;
  const openWorkOrders = db.prepare("SELECT COUNT(*) AS cnt FROM work_orders WHERE status != 'Completed'").get().cnt;
  const fleetPowerKw = Math.round(
    machines.reduce((s, m) => s + (liveTelemetryCache[m.id]?.activePower?.value || m.ratedPowerKw * 0.78), 0) * 10
  ) / 10;
  const hourlyDowntimeExposure = machines
    .filter(m => m.status !== 'running')
    .reduce((s, m) => s + (m.downtimeCostPerHr || 20000), 0);

  return {
    totalMachines,
    running,
    warnings,
    critical,
    offline,
    avgHealth,
    uptime: Math.round((95.0 + (avgHealth / 100) * 4.5) * 10) / 10,
    activeAlerts: unreadAlerts || (warnings + critical * 2),
    openWorkOrders,
    efficiency: Math.round((80 + (avgHealth / 100) * 14) * 10) / 10,
    fleetPowerKw,
    hourlyDowntimeExposure,
    datasetVersion: DATASET_VERSION,
  };
}

function createWorkOrderForMachine(machineId, customId = null) {
  const machine = getMachineById(machineId);
  if (!machine) return null;

  const telemetry = liveTelemetryCache[machineId] || generateMachineTelemetry(machine);
  const prediction = computePrediction(machine, telemetry);
  const lib = FAILURE_MODE_LIBRARY[machineId] || FAILURE_MODE_LIBRARY['P-101'];
  const topModeInfo = lib.find(l => l.mode === prediction.topFailureMode) || lib[0];

  const techRow = db.prepare('SELECT * FROM technicians WHERE available = 1 AND skill = ? LIMIT 1').get(topModeInfo.techSkill)
    || db.prepare('SELECT * FROM technicians WHERE available = 1 LIMIT 1').get()
    || db.prepare('SELECT * FROM technicians LIMIT 1').get();
  const assignedTo = {
    id: techRow.id,
    name: techRow.name,
    skill: techRow.skill,
    specialization: techRow.specialization,
    shift: techRow.shift,
    certification: techRow.certification,
    available: Boolean(techRow.available),
  };

  const allParts = db.prepare('SELECT * FROM spare_parts').all();
  const matchedParts = allParts
    .filter(p => topModeInfo.parts.includes(p.id))
    .map(p => ({
      id: p.id,
      sku: p.sku,
      bin: p.bin,
      name: p.name,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      cost: p.cost,
      leadTime: p.leadTime,
      status: p.stock > 0 ? 'In Stock' : 'Order Required',
    }));

  const preventiveDowntime = 3;
  const reactiveDowntime = 14;
  const preventiveCost = matchedParts.reduce((s, p) => s + p.cost, 0) + 3200;
  const reactiveCost = Math.round(reactiveDowntime * ((machine.downtimeCostPerHr || 24000) * 0.45) + preventiveCost * 2.4);
  const nextSat = new Date(Date.now() + (((6 - new Date().getDay() + 7) % 7) || 7) * 86400000).toISOString().split('T')[0];
  const deadline = new Date(Date.now() + prediction.remainingUsefulLife * 86400000).toISOString().split('T')[0];
  const orderId = customId || `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const priority = prediction.riskLevel === 'CRITICAL' ? 'CRITICAL' : prediction.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO work_orders (
      id, machineId, machineName, priority, failureMode, action,
      assignedToJson, estimatedDowntime, scheduledDate, deadline,
      sparePartsJson, costComparisonJson, createdAt, status, signOffJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL)
  `).run(
    orderId,
    machine.id,
    machine.name,
    priority,
    topModeInfo.mode,
    topModeInfo.action,
    JSON.stringify(assignedTo),
    `${preventiveDowntime} hours`,
    nextSat,
    deadline,
    JSON.stringify(matchedParts),
    JSON.stringify({
      preventive: { cost: preventiveCost, downtime: preventiveDowntime },
      reactive: { cost: reactiveCost, downtime: reactiveDowntime },
      savings: reactiveCost - preventiveCost,
      roi: Math.round(((reactiveCost - preventiveCost) / preventiveCost) * 100) / 100,
    }),
    createdAt
  );

  return parseWorkOrderRow(db.prepare('SELECT * FROM work_orders WHERE id = ?').get(orderId));
}

// ── Live Telemetry Broker & Simulation State ─────────────────────────
const liveTelemetryCache = {};
const mqttPacketBuffer = [];
let totalPacketCount = 1284;
const sseClients = new Set();

let simInterval = null;
let activeSimulation = { active: false, machineId: null, progress: 0 };

function stopFailureSimulation() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  activeSimulation = { active: false, machineId: null, progress: 0 };
}

function broadcastSseEvent(eventName, payload) {
  const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(serialized);
    } catch {
      sseClients.delete(res);
    }
  }
}

function tickTelemetryBroker() {
  const machines = getAllMachines();
  const machinesWithTelemetry = machines.map(m => {
    const telemetry = generateMachineTelemetry(m);
    liveTelemetryCache[m.id] = telemetry;
    return { machine: m, telemetry };
  });

  if (machinesWithTelemetry.length > 0) {
    const pick = machinesWithTelemetry[Math.floor(Math.random() * machinesWithTelemetry.length)];
    const pkt = buildMqttPacket(pick.machine, pick.telemetry);
    mqttPacketBuffer.unshift(pkt);
    if (mqttPacketBuffer.length > 40) mqttPacketBuffer.pop();
    totalPacketCount += 1;

    broadcastSseEvent('telemetry', {
      timestamp: new Date().toISOString(),
      summary: getFactorySummary(),
      machines: Object.fromEntries(machines.map(m => [m.id, m])),
      telemetryByMachine: liveTelemetryCache,
      latestPacket: pkt,
      packetCount: totalPacketCount,
      opcuaTags: buildOpcUaTags(machinesWithTelemetry),
      simulation: activeSimulation,
    });
  }
}

// Prime cache immediately and run broker tick every 1200ms
tickTelemetryBroker();
setInterval(tickTelemetryBroker, 1200);

// ── REST API Routes ──────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  const machineCount = db.prepare('SELECT COUNT(*) AS cnt FROM machines').get().cnt;
  const historyRows = db.prepare('SELECT COUNT(*) AS cnt FROM telemetry_history').get().cnt;
  res.json({
    status: 'ok',
    service: 'SmartFactory AI Digital Twin Engine',
    datasetVersion: DATASET_VERSION,
    sqlite: 'connected',
    machinesCount: machineCount,
    historyRows,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/factory/overview', (_req, res) => {
  const machinesList = getAllMachines();
  const machinesMap = Object.fromEntries(machinesList.map(m => [m.id, m]));
  res.json({
    datasetVersion: DATASET_VERSION,
    zones: ZONES,
    machines: machinesMap,
    summary: getFactorySummary(),
    simulation: activeSimulation,
  });
});

app.get('/api/machines', (_req, res) => {
  const machinesList = getAllMachines();
  const data = machinesList.map(m => ({
    ...m,
    telemetry: liveTelemetryCache[m.id] || generateMachineTelemetry(m),
  }));
  res.json({ machines: Object.fromEntries(data.map(m => [m.id, m])), list: data });
});

app.get('/api/machines/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  const prediction = computePrediction(machine, telemetry);
  res.json({ machine, telemetry, prediction });
});

app.get('/api/telemetry/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });

  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  // Fetch the MOST RECENT (days + 1) rows, then reverse to chronological ascending order
  const history = db
    .prepare(`
      SELECT date, dateLabel, temperature, bearingDE, vibration, vibrationEnvelope,
             pressure, efficiency, activePowerKw, health
      FROM telemetry_history
      WHERE machineId = ?
      ORDER BY date DESC
      LIMIT ?
    `)
    .all(machine.id, days + 1)
    .reverse();

  res.json({ machine, telemetry, history });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  const machines = getAllMachines();
  const machinesWithTelemetry = machines.map(m => ({
    machine: m,
    telemetry: liveTelemetryCache[m.id] || generateMachineTelemetry(m),
  }));
  res.write(`event: telemetry\ndata: ${JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: getFactorySummary(),
    machines: Object.fromEntries(machines.map(m => [m.id, m])),
    telemetryByMachine: liveTelemetryCache,
    latestPacket: mqttPacketBuffer[0] || null,
    packetCount: totalPacketCount,
    opcuaTags: buildOpcUaTags(machinesWithTelemetry),
    simulation: activeSimulation,
  })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/predictions', (_req, res) => {
  const machines = getAllMachines();
  const predictions = {};
  for (const m of machines) {
    const telemetry = liveTelemetryCache[m.id] || generateMachineTelemetry(m);
    predictions[m.id] = computePrediction(m, telemetry);
  }
  const predList = Object.values(predictions);
  const atRiskCount = predList.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').length;
  const earliestActionDays = predList.length ? Math.min(...predList.map(p => p.remainingUsefulLife)) : 0;
  const avgConfidence = predList.length ? Math.round(predList.reduce((s, p) => s + p.confidence, 0) / predList.length) : 92;
  const dailyRiskCost = predList.reduce((s, p) => s + (p.dailyDowntimeExposure || 0), 0);

  res.json({
    summary: {
      totalAssets: machines.length,
      atRiskCount,
      earliestActionDays,
      avgConfidence,
      dailyRiskCost,
    },
    predictions,
    machines: Object.fromEntries(machines.map(m => [m.id, m])),
  });
});

app.get('/api/predictions/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  res.json(computePrediction(machine, telemetry));
});

app.get('/api/analytics/fft/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  res.json(computeFftSpectrum(machine, telemetry));
});

app.get('/api/analytics/curves/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  res.json(computeCurvesAnalysis(machine, telemetry));
});

function summarizeWorkOrders(orders) {
  return {
    totalCount: orders.length,
    openCount: orders.filter(w => w.status !== 'Completed').length,
    completedCount: orders.filter(w => w.status === 'Completed').length,
    totalPmCost: orders.reduce((s, w) => s + (w.costComparison?.preventive?.cost || 0), 0),
    totalSavings: orders.reduce((s, w) => s + (w.costComparison?.savings || 0), 0),
  };
}

app.get('/api/work-orders', (_req, res) => {
  const workOrders = getAllWorkOrders();
  res.json({ summary: summarizeWorkOrders(workOrders), workOrders });
});

app.post('/api/work-orders', (req, res) => {
  const { machineId } = req.body || {};
  if (!machineId || !getMachineById(machineId)) {
    return res.status(400).json({ error: 'Valid machineId is required' });
  }
  const order = createWorkOrderForMachine(machineId);
  const notif = addNotificationRow({
    title: `Work Order #${order.id} Dispatched (${machineId})`,
    machineId,
    severity: order.priority === 'CRITICAL' ? 'critical' : 'warning',
  });
  broadcastSseEvent('notifications', getAllNotifications());
  const workOrders = getAllWorkOrders();
  res.status(201).json({ workOrder: order, notification: notif, summary: summarizeWorkOrders(workOrders), workOrders });
});

app.post('/api/work-orders/:id/signoff', (req, res) => {
  const orderId = req.params.id;
  const row = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(orderId);
  if (!row) return res.status(404).json({ error: `Work order ${orderId} not found` });

  const { signature, notes, technician, completedAt } = req.body || {};
  if (!signature) {
    return res.status(400).json({ error: 'Technician digital signature is required' });
  }

  const order = parseWorkOrderRow(row);
  const signOffPayload = {
    signature,
    notes: notes || 'Maintenance completed and verified.',
    technician: technician || order.assignedTo?.name || 'Chief Technician',
    completedAt: completedAt || new Date().toISOString(),
  };

  const todayISO = new Date().toISOString().split('T')[0];
  const durationHours = parseInt(order.estimatedDowntime, 10) || 2;
  const maintCost = order.costComparison?.preventive?.cost || 4500;

  db.exec('BEGIN');
  try {
    db.prepare("UPDATE work_orders SET status = 'Completed', signOffJson = ? WHERE id = ?")
      .run(JSON.stringify(signOffPayload), orderId);

    db.prepare("UPDATE machines SET health = 95, status = 'running' WHERE id = ?")
      .run(order.machineId);

    for (const part of order.spareParts || []) {
      db.prepare('UPDATE spare_parts SET stock = MAX(0, stock - 1) WHERE id = ?').run(part.id);
    }

    db.prepare(`
      INSERT INTO maintenance_history (machineId, date, type, action, duration, cost, technician)
      VALUES (?, ?, 'Predictive', ?, ?, ?, ?)
    `).run(
      order.machineId,
      todayISO,
      `${order.action} (Signed off by ${signOffPayload.technician})`,
      durationHours,
      maintCost,
      order.assignedTo?.id || 'T-001'
    );

    const lc = db.prepare('SELECT * FROM asset_lifecycle WHERE machineId = ?').get(order.machineId);
    if (lc) {
      const events = JSON.parse(lc.eventsJson);
      events.push({
        date: todayISO,
        type: 'repair',
        description: `Completed ${order.id}: ${order.failureMode}`,
        cost: maintCost,
      });
      db.prepare(`
        UPDATE asset_lifecycle
        SET totalMaintenanceCost = totalMaintenanceCost + ?,
            totalDowntimeHours = totalDowntimeHours + ?,
            eventsJson = ?
        WHERE machineId = ?
      `).run(maintCost, durationHours, JSON.stringify(events), order.machineId);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: err.message });
  }

  addNotificationRow({
    title: `Order #${order.id} Completed & Signed Off`,
    machineId: order.machineId,
    severity: 'info',
  });
  tickTelemetryBroker();
  broadcastSseEvent('notifications', getAllNotifications());

  res.json({
    workOrders: getAllWorkOrders(),
    machine: getMachineById(order.machineId),
    notifications: getAllNotifications(),
  });
});

app.get('/api/reliability', (_req, res) => {
  const machines = getAllMachines();
  const metrics = {};
  const historyByMachine = {};
  const histStmt = db.prepare(`
    SELECT date, dateLabel, temperature, bearingDE, vibration, vibrationEnvelope,
           pressure, efficiency, activePowerKw, health
    FROM telemetry_history
    WHERE machineId = ?
    ORDER BY date ASC
  `);

  for (const m of machines) {
    metrics[m.id] = computeReliability(m);
    historyByMachine[m.id] = histStmt.all(m.id);
  }
  const allMetrics = Object.values(metrics);
  const summary = {
    avgMtbf: allMetrics.length ? Math.round(allMetrics.reduce((s, m) => s + m.mtbf, 0) / allMetrics.length) : 0,
    avgMttr: allMetrics.length ? Number((allMetrics.reduce((s, m) => s + m.mttr, 0) / allMetrics.length).toFixed(1)) : 0,
    avgAvailability: allMetrics.length ? Number((allMetrics.reduce((s, m) => s + m.availability, 0) / allMetrics.length).toFixed(1)) : 0,
    avgOee: allMetrics.length ? Number((allMetrics.reduce((s, m) => s + m.oee, 0) / allMetrics.length).toFixed(1)) : 0,
    totalFailures: allMetrics.reduce((s, m) => s + m.totalFailures, 0),
    totalDowntime: Number(allMetrics.reduce((s, m) => s + m.totalDowntime, 0).toFixed(1)),
  };

  res.json({
    summary,
    metrics,
    machines: Object.fromEntries(machines.map(m => [m.id, m])),
    history: historyByMachine['P-101'] || [],
    historyByMachine,
  });
});

app.get('/api/lifecycle/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });

  const lcRow = db.prepare('SELECT * FROM asset_lifecycle WHERE machineId = ?').get(machine.id);
  const history = db
    .prepare('SELECT date, type, action, duration, cost, technician FROM maintenance_history WHERE machineId = ? ORDER BY date DESC, id DESC')
    .all(machine.id);

  const lifecycle = lcRow
    ? { ...lcRow, events: JSON.parse(lcRow.eventsJson) }
    : null;

  let summary = null;
  if (lifecycle) {
    const ageYears = Number(((Date.now() - new Date(lifecycle.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1));
    const remainingYears = Math.max(0, Number((lifecycle.expectedLife - ageYears).toFixed(1)));
    const lifeUsedPct = Math.min(100, Math.round((ageYears / Math.max(1, lifecycle.expectedLife)) * 100));
    const downtimeCost = Math.round(lifecycle.totalDowntimeHours * ((machine.downtimeCostPerHr || 20000) * 0.35));
    const energyEstCost = Math.round((machine.ratedPowerKw || 12) * 8500);
    const maintToValuePct = Math.round((lifecycle.totalMaintenanceCost / Math.max(1, lifecycle.currentBookValue)) * 100);
    const replaceRecommended = maintToValuePct > 60 || lifeUsedPct > 80;

    const tcoBreakdown = [
      { name: 'Purchase', value: lifecycle.purchaseCost },
      { name: 'Installation', value: lifecycle.installCost },
      { name: 'Maintenance', value: lifecycle.totalMaintenanceCost },
      { name: 'Energy (Est.)', value: energyEstCost },
      { name: 'Downtime Cost', value: downtimeCost },
    ];
    const totalTco = tcoBreakdown.reduce((s, d) => s + d.value, 0);

    let cumulative = lifecycle.purchaseCost + lifecycle.installCost;
    const costTimeline = [...history]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(entry => {
        cumulative += entry.cost;
        return {
          date: entry.date,
          label: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          cost: cumulative,
        };
      });

    summary = {
      ageYears,
      remainingYears,
      lifeUsedPct,
      maintToValuePct,
      replaceRecommended,
      recommendationLabel: replaceRecommended ? 'Plan Replacement' : 'Continue Routine Care',
      recommendationNote: replaceRecommended
        ? 'Maintenance spending and operating age are approaching replacement threshold.'
        : 'Asset remains economical to maintain under current preventive schedule.',
      totalTco,
      tcoBreakdown,
      costTimeline,
    };
  }

  res.json({ machine, lifecycle, summary, history });
});

app.get('/api/spare-parts', (_req, res) => {
  const parts = db.prepare('SELECT * FROM spare_parts ORDER BY id').all().map(p => ({
    ...p,
    machines: JSON.parse(p.machinesJson),
    status: p.stock > 0 ? 'In Stock' : 'Order Required',
  }));
  res.json({ spareParts: parts });
});

app.get('/api/technicians', (_req, res) => {
  const technicians = db.prepare('SELECT * FROM technicians ORDER BY id').all().map(t => ({
    ...t,
    available: Boolean(t.available),
  }));
  res.json({ technicians });
});

app.get('/api/gateway/snapshot', (_req, res) => {
  const machines = getAllMachines();
  const machinesWithTelemetry = machines.map(m => ({
    machine: m,
    telemetry: liveTelemetryCache[m.id] || generateMachineTelemetry(m),
  }));
  res.json({
    brokerStatus: 'CONNECTED',
    qos: 1,
    packetCount: totalPacketCount,
    packets: mqttPacketBuffer.slice(0, 20),
    opcuaTags: buildOpcUaTags(machinesWithTelemetry),
  });
});

// ── Industrial Dataset Catalog & Export Endpoints ────────────────────
app.get('/api/datasets/catalog', (_req, res) => {
  const machines = getAllMachines();
  const totalHistoryRows = db.prepare('SELECT COUNT(*) AS cnt FROM telemetry_history').get().cnt;
  const totalWorkOrders = db.prepare('SELECT COUNT(*) AS cnt FROM work_orders').get().cnt;
  const totalMaintenanceLogs = db.prepare('SELECT COUNT(*) AS cnt FROM maintenance_history').get().cnt;
  const spareParts = db.prepare('SELECT * FROM spare_parts ORDER BY id').all().map(p => ({
    ...p,
    machines: JSON.parse(p.machinesJson),
    status: p.stock > 0 ? 'In Stock' : 'Order Required',
  }));
  const technicians = db.prepare('SELECT * FROM technicians ORDER BY id').all().map(t => ({
    ...t,
    available: Boolean(t.available),
  }));

  res.json({
    datasetVersion: DATASET_VERSION,
    standards: DATASET_STANDARDS,
    zones: ZONES,
    machines,
    oeeLossProfiles: OEE_LOSS_PROFILES,
    spareParts,
    technicians,
    stats: {
      totalMachines: machines.length,
      historyDaysPerMachine: Math.round(totalHistoryRows / Math.max(1, machines.length)),
      totalHistoryRows,
      totalSpareParts: spareParts.length,
      totalTechnicians: technicians.length,
      totalWorkOrders,
      totalMaintenanceLogs,
    },
  });
});

app.get('/api/datasets/export/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });

  const rows = db.prepare(`
    SELECT date, machineId, temperature, bearingDE, vibration, vibrationEnvelope,
           pressure, efficiency, activePowerKw, health
    FROM telemetry_history
    WHERE machineId = ?
    ORDER BY date ASC
  `).all(machine.id);

  if (String(req.query.format).toLowerCase() === 'csv') {
    const header = 'date,machineId,temperature_C,bearingDE_C,vibration_mms,vibrationEnvelope_gE,pressure_bar,efficiency_pct,activePower_kW,health_pct';
    const lines = rows.map(r => [
      r.date, r.machineId, r.temperature, r.bearingDE, r.vibration,
      r.vibrationEnvelope, r.pressure, r.efficiency, r.activePowerKw, r.health,
    ].join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${machine.id}-telemetry-90d.csv"`);
    return res.send([header, ...lines].join('\n'));
  }

  return res.json({
    datasetVersion: DATASET_VERSION,
    machine,
    rowCount: rows.length,
    series: rows,
  });
});

app.get('/api/notifications', (_req, res) => {
  res.json({ notifications: getAllNotifications() });
});

app.post('/api/notifications/read', (_req, res) => {
  db.prepare('UPDATE notifications SET read = 1').run();
  const list = getAllNotifications();
  broadcastSseEvent('notifications', list);
  res.json({ notifications: list });
});

app.post('/api/simulation/trigger', (req, res) => {
  const machineId = req.body?.machineId || 'P-101';
  const durationSeconds = Math.min(120, Math.max(5, Number(req.body?.durationSeconds) || 20));
  const machine = getMachineById(machineId);
  if (!machine) return res.status(404).json({ error: `Machine ${machineId} not found` });

  stopFailureSimulation();
  const initialHealth = machine.health;
  const targetHealth = 28;
  const stepMs = 500;
  const totalSteps = (durationSeconds * 1000) / stepMs;
  let currentStep = 0;

  activeSimulation = { active: true, machineId, progress: 0 };
  addNotificationRow({
    title: `Live Simulation Triggered: ${machine.name}`,
    machineId,
    severity: 'critical',
  });
  broadcastSseEvent('notifications', getAllNotifications());

  simInterval = setInterval(() => {
    currentStep += 1;
    const progress = Math.min(1, currentStep / totalSteps);
    const nextHealth = Math.max(targetHealth, Math.round(initialHealth - (initialHealth - targetHealth) * progress));
    const nextStatus = nextHealth <= 40 ? 'critical' : nextHealth <= 60 ? 'warning' : 'running';

    db.prepare('UPDATE machines SET health = ?, status = ? WHERE id = ?').run(nextHealth, nextStatus, machineId);
    activeSimulation = { active: true, machineId, progress };

    if (currentStep >= totalSteps) {
      stopFailureSimulation();
      createWorkOrderForMachine(machineId);
      addNotificationRow({
        title: `Simulation Complete: ${machine.name} in Critical State`,
        machineId,
        severity: 'critical',
      });
      broadcastSseEvent('notifications', getAllNotifications());
    }
  }, stepMs);

  res.json({ simulation: activeSimulation, machine: getMachineById(machineId) });
});

app.post('/api/simulation/stage', (req, res) => {
  const machineId = req.body?.machineId || 'P-101';
  const stageId = Number(req.body?.stageId);
  const machine = getMachineById(machineId);
  if (!machine) return res.status(404).json({ error: `Machine ${machineId} not found` });

  stopFailureSimulation();

  const STAGE_MAP = {
    1: { health: 94, status: 'running' },
    2: { health: 68, status: 'warning' },
    3: { health: 48, status: 'critical' },
    4: { health: 28, status: 'critical' },
    5: { health: 92, status: 'running' },
  };
  const cfg = STAGE_MAP[stageId];
  if (!cfg) return res.status(400).json({ error: 'stageId must be 1..5' });

  db.prepare('UPDATE machines SET health = ?, status = ? WHERE id = ?').run(cfg.health, cfg.status, machineId);

  if (stageId === 3) {
    addNotificationRow({ title: 'AI Alert: Bearing Failure Risk 84%', machineId, severity: 'warning' });
  } else if (stageId === 4) {
    createWorkOrderForMachine(machineId, 'WO-2026-8941');
    addNotificationRow({ title: 'Auto Work Order #WO-2026-8941 Generated', machineId, severity: 'critical' });
  } else if (stageId === 5) {
    addNotificationRow({ title: `${machine.name} Reset to Healthy`, machineId, severity: 'info' });
  }

  tickTelemetryBroker();
  broadcastSseEvent('notifications', getAllNotifications());

  res.json({
    machine: getMachineById(machineId),
    notifications: getAllNotifications(),
    workOrders: getAllWorkOrders(),
  });
});

app.post('/api/simulation/reset', (req, res) => {
  const machineId = req.body?.machineId || 'P-101';
  const machine = getMachineById(machineId);
  if (!machine) return res.status(404).json({ error: `Machine ${machineId} not found` });

  stopFailureSimulation();
  const baseline = INITIAL_MACHINES.find(m => m.id === machineId);
  const resetHealth = baseline ? Math.max(92, baseline.health) : 92;

  db.prepare("UPDATE machines SET health = ?, status = 'running' WHERE id = ?").run(resetHealth, machineId);
  addNotificationRow({
    title: `${machine.name} Reset to Healthy`,
    machineId,
    severity: 'info',
  });
  tickTelemetryBroker();
  broadcastSseEvent('notifications', getAllNotifications());

  res.json({ machine: getMachineById(machineId), simulation: activeSimulation });
});

app.post('/api/what-if/:id', (req, res) => {
  const machine = getMachineById(req.params.id);
  if (!machine) return res.status(404).json({ error: `Machine ${req.params.id} not found` });
  const telemetry = liveTelemetryCache[machine.id] || generateMachineTelemetry(machine);
  const pred = computePrediction(machine, telemetry);
  const result = computeWhatIf(machine, pred.remainingUsefulLife, req.body || {});
  res.json({ machineId: machine.id, baseRUL: pred.remainingUsefulLife, ...result });
});

app.use((err, _req, res, _next) => {
  console.error('[SmartFactory Backend Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`[SmartFactory AI Backend] Listening on http://localhost:${PORT}`);
  console.log(`[SmartFactory AI Backend] SQLite v${DATASET_VERSION} initialized and seeded.`);
});

function shutdown() {
  stopFailureSimulation();
  server.close(() => {
    try {
      db.close();
    } catch {
      // ignore close errors
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
