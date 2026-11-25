/* ===================================================================
   SMART FACTORY AI — Frontend API Client & Live SSE Store
   Connects React UI to Express + SQLite backend (/api/*) with
   real-time Server-Sent Events and clean state synchronization.
   =================================================================== */

import {
  ZONES as FALLBACK_ZONES,
  MACHINES as FALLBACK_MACHINES,
  NOTIFICATIONS as FALLBACK_NOTIFICATIONS,
  generateSensorData,
  generatePrediction,
  generateReliabilityMetrics,
  generateHistoricalData,
  getActiveWorkOrders,
  getAssetLifecycle,
  getMaintenanceHistory,
  getFactorySummary,
} from '../data/factoryData';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function requestJson(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API request failed (${res.status})`);
  }
  return res.json();
}

// ── Shared Live Store synced via SSE (/api/stream) ───────────────────
let eventSource = null;
const streamListeners = new Set();
const notificationListeners = new Set();

let liveSnapshot = {
  connected: false,
  summary: getFactorySummary(),
  machines: { ...FALLBACK_MACHINES },
  telemetryByMachine: {},
  latestPacket: null,
  packetCount: 1284,
  opcuaTags: [],
  simulation: { active: false, machineId: null, progress: 0 },
};

function syncFallbackMachines(machinesMap) {
  if (!machinesMap) return;
  Object.entries(machinesMap).forEach(([id, data]) => {
    if (FALLBACK_MACHINES[id]) {
      Object.assign(FALLBACK_MACHINES[id], data);
    } else {
      FALLBACK_MACHINES[id] = { ...data };
    }
  });
}

function ensureEventStream() {
  if (eventSource || typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  try {
    eventSource = new EventSource(`${API_BASE}/api/stream`);

    eventSource.addEventListener('telemetry', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        syncFallbackMachines(payload.machines);
        liveSnapshot = {
          connected: true,
          summary: payload.summary || liveSnapshot.summary,
          machines: payload.machines || liveSnapshot.machines,
          telemetryByMachine: payload.telemetryByMachine || liveSnapshot.telemetryByMachine,
          latestPacket: payload.latestPacket || null,
          packetCount: payload.packetCount ?? liveSnapshot.packetCount,
          opcuaTags: payload.opcuaTags || liveSnapshot.opcuaTags,
          simulation: payload.simulation || liveSnapshot.simulation,
        };
        streamListeners.forEach(cb => cb(liveSnapshot));
      } catch {
        // Ignore malformed SSE chunk
      }
    });

    eventSource.addEventListener('notifications', (evt) => {
      try {
        const list = JSON.parse(evt.data);
        if (Array.isArray(list)) {
          notificationListeners.forEach(cb => cb(list));
        }
      } catch {
        // Ignore malformed notification chunk
      }
    });

    eventSource.onerror = () => {
      liveSnapshot = { ...liveSnapshot, connected: false };
    };
  } catch {
    // Fallback mode when backend unavailable
  }
}

export function subscribeToLiveStream(cb) {
  ensureEventStream();
  streamListeners.add(cb);
  cb(liveSnapshot);
  return () => {
    streamListeners.delete(cb);
  };
}

export function subscribeToNotificationsFeed(cb) {
  ensureEventStream();
  notificationListeners.add(cb);
  return () => {
    notificationListeners.delete(cb);
  };
}

export function getLiveSnapshot() {
  return liveSnapshot;
}

// ── REST API Methods (with graceful offline fallback) ────────────────
export async function fetchFactoryOverview() {
  try {
    const data = await requestJson('/api/factory/overview');
    syncFallbackMachines(data.machines);
    return data;
  } catch {
    return {
      zones: FALLBACK_ZONES,
      machines: FALLBACK_MACHINES,
      summary: getFactorySummary(),
      simulation: { active: false, machineId: null, progress: 0 },
    };
  }
}

export async function fetchMachineTelemetry(machineId, days = 30) {
  try {
    const data = await requestJson(`/api/telemetry/${encodeURIComponent(machineId)}?days=${days}`);
    if (data.machine) syncFallbackMachines({ [data.machine.id]: data.machine });
    return data;
  } catch {
    return {
      machine: FALLBACK_MACHINES[machineId] || FALLBACK_MACHINES['P-101'],
      telemetry: generateSensorData(machineId),
      history: generateHistoricalData(machineId, days),
    };
  }
}

export async function fetchAllPredictions() {
  try {
    const data = await requestJson('/api/predictions');
    if (data.machines) syncFallbackMachines(data.machines);
    return data;
  } catch {
    const predictions = {};
    Object.keys(FALLBACK_MACHINES).forEach(id => {
      const p = generatePrediction(id);
      if (p) {
        predictions[id] = {
          ...p,
          rulDays: p.remainingUsefulLife,
          topFailureMode: p.failureModes?.[0]?.mode || 'Bearing Wear',
          riskLevel: p.riskLevel === 'critical' ? 'CRITICAL' : p.riskLevel === 'warning' ? 'HIGH' : 'LOW',
          factors: (p.failureModes || []).slice(0, 3).map(m => ({ name: m.mode, contribution: m.probability })),
        };
      }
    });
    return { predictions, machines: FALLBACK_MACHINES };
  }
}

export async function fetchMachinePrediction(machineId) {
  try {
    return await requestJson(`/api/predictions/${encodeURIComponent(machineId)}`);
  } catch {
    return generatePrediction(machineId);
  }
}

export async function fetchWorkOrders() {
  try {
    const data = await requestJson('/api/work-orders');
    return data.workOrders || [];
  } catch {
    return getActiveWorkOrders();
  }
}

export async function createWorkOrder(machineId) {
  return requestJson('/api/work-orders', {
    method: 'POST',
    body: JSON.stringify({ machineId }),
  });
}

export async function signOffWorkOrder(orderId, signOffData) {
  const data = await requestJson(`/api/work-orders/${encodeURIComponent(orderId)}/signoff`, {
    method: 'POST',
    body: JSON.stringify(signOffData),
  });
  if (data.machine) syncFallbackMachines({ [data.machine.id]: data.machine });
  if (data.notifications) {
    notificationListeners.forEach(cb => cb(data.notifications));
  }
  return data.workOrders || [];
}

export async function fetchReliabilityData() {
  try {
    const data = await requestJson('/api/reliability');
    if (data.machines) syncFallbackMachines(data.machines);
    return data;
  } catch {
    const metrics = {};
    const historyByMachine = {};
    Object.keys(FALLBACK_MACHINES).forEach(id => {
      metrics[id] = generateReliabilityMetrics(id);
      historyByMachine[id] = generateHistoricalData(id, 30);
    });
    return {
      metrics,
      machines: FALLBACK_MACHINES,
      history: historyByMachine['P-101'],
      historyByMachine,
    };
  }
}

export async function fetchLifecycleData(machineId) {
  try {
    const data = await requestJson(`/api/lifecycle/${encodeURIComponent(machineId)}`);
    if (data.machine) syncFallbackMachines({ [data.machine.id]: data.machine });
    return data;
  } catch {
    return {
      machine: FALLBACK_MACHINES[machineId] || FALLBACK_MACHINES['P-101'],
      lifecycle: getAssetLifecycle(machineId),
      history: getMaintenanceHistory(machineId),
    };
  }
}

export async function fetchSpareParts() {
  try {
    const data = await requestJson('/api/spare-parts');
    return data.spareParts || [];
  } catch {
    return [];
  }
}

export async function fetchTechnicians() {
  try {
    const data = await requestJson('/api/technicians');
    return data.technicians || [];
  } catch {
    return [];
  }
}

export async function fetchDatasetCatalog() {
  try {
    return await requestJson('/api/datasets/catalog');
  } catch {
    return {
      datasetVersion: '2.0.0',
      standards: [],
      zones: FALLBACK_ZONES,
      machines: Object.values(FALLBACK_MACHINES),
      oeeLossProfiles: {},
      spareParts: [],
      technicians: [],
      stats: { totalMachines: Object.keys(FALLBACK_MACHINES).length, historyDaysPerMachine: 91, totalHistoryRows: 546 },
    };
  }
}

export function getDatasetExportUrl(machineId, format = 'csv') {
  return `${API_BASE}/api/datasets/export/${encodeURIComponent(machineId)}?format=${encodeURIComponent(format)}`;
}

export async function fetchGatewaySnapshot() {
  try {
    return await requestJson('/api/gateway/snapshot');
  } catch {
    return {
      brokerStatus: 'CONNECTED',
      qos: 1,
      packetCount: liveSnapshot.packetCount,
      packets: [],
      opcuaTags: [],
    };
  }
}

export async function fetchNotifications() {
  try {
    const data = await requestJson('/api/notifications');
    return data.notifications || [];
  } catch {
    return [...FALLBACK_NOTIFICATIONS];
  }
}

export async function markAllNotificationsRead() {
  try {
    const data = await requestJson('/api/notifications/read', { method: 'POST' });
    if (data.notifications) {
      notificationListeners.forEach(cb => cb(data.notifications));
    }
    return data.notifications || [];
  } catch {
    return [...FALLBACK_NOTIFICATIONS];
  }
}

export async function triggerBackendSimulation(machineId = 'P-101', durationSeconds = 20) {
  return requestJson('/api/simulation/trigger', {
    method: 'POST',
    body: JSON.stringify({ machineId, durationSeconds }),
  });
}

export async function setBackendDemoStage(machineId = 'P-101', stageId = 1) {
  const data = await requestJson('/api/simulation/stage', {
    method: 'POST',
    body: JSON.stringify({ machineId, stageId }),
  });
  if (data.machine) syncFallbackMachines({ [data.machine.id]: data.machine });
  if (data.notifications) notificationListeners.forEach(cb => cb(data.notifications));
  return data;
}

export async function resetBackendSimulation(machineId = 'P-101') {
  const data = await requestJson('/api/simulation/reset', {
    method: 'POST',
    body: JSON.stringify({ machineId }),
  });
  if (data.machine) syncFallbackMachines({ [data.machine.id]: data.machine });
  return data;
}

export async function calculateWhatIf(machineId, params) {
  return requestJson(`/api/what-if/${encodeURIComponent(machineId)}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
