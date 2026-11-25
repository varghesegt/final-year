/* ===================================================================
   SMART FACTORY — SQLite Persistence Layer (v2.0 Schema & Migrations)
   Stores machine master specs, 90-day multi-channel telemetry series,
   work orders, maintenance logs, spare parts inventory, lifecycle & alerts.
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  DATASET_VERSION,
  INITIAL_MACHINES,
  INITIAL_LIFECYCLE,
  INITIAL_MAINTENANCE_HISTORY,
  INITIAL_NOTIFICATIONS,
  SPARE_PARTS,
  TECHNICIANS,
  FAILURE_MODE_LIBRARY,
} from './datasets/industrialDatasets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'smartfactory.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const verRow = db.prepare("SELECT value FROM dataset_meta WHERE key = 'dataset_version'").get();
  if (!verRow || verRow.value !== DATASET_VERSION) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS telemetry_history;
      DROP TABLE IF EXISTS work_orders;
      DROP TABLE IF EXISTS maintenance_history;
      DROP TABLE IF EXISTS asset_lifecycle;
      DROP TABLE IF EXISTS spare_parts;
      DROP TABLE IF EXISTS technicians;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS machines;
      PRAGMA foreign_keys = ON;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      serialNumber TEXT NOT NULL DEFAULT '',
      installDate TEXT NOT NULL,
      health REAL NOT NULL,
      status TEXT NOT NULL,
      criticality TEXT NOT NULL,
      ratedRpm INTEGER NOT NULL DEFAULT 1450,
      ratedPowerKw REAL NOT NULL DEFAULT 10.0,
      ratedVoltageV INTEGER NOT NULL DEFAULT 400,
      ratedCurrentA REAL NOT NULL DEFAULT 15.0,
      runtimeHours INTEGER NOT NULL DEFAULT 4000,
      weibullBeta REAL NOT NULL DEFAULT 2.5,
      weibullEta INTEGER NOT NULL DEFAULT 5000,
      downtimeCostPerHr REAL NOT NULL DEFAULT 15000,
      isoClass TEXT NOT NULL DEFAULT '',
      bearingSpec TEXT NOT NULL DEFAULT '',
      bearingGeometryJson TEXT NOT NULL DEFAULT '{}',
      operatingProfileJson TEXT NOT NULL DEFAULT '{}',
      alarmLimitsJson TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS telemetry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machineId TEXT NOT NULL,
      date TEXT NOT NULL,
      dateLabel TEXT NOT NULL,
      temperature REAL NOT NULL,
      bearingDE REAL NOT NULL,
      vibration REAL NOT NULL,
      vibrationEnvelope REAL NOT NULL,
      pressure REAL NOT NULL,
      efficiency REAL NOT NULL,
      activePowerKw REAL NOT NULL,
      health REAL NOT NULL,
      FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_machine_date
      ON telemetry_history(machineId, date);

    CREATE TABLE IF NOT EXISTS spare_parts (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL DEFAULT '',
      bin TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      stock INTEGER NOT NULL,
      reorderLevel INTEGER NOT NULL,
      cost REAL NOT NULL,
      leadTime TEXT NOT NULL,
      machinesJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      skill TEXT NOT NULL,
      specialization TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      shift TEXT NOT NULL DEFAULT '',
      certification TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      machineId TEXT NOT NULL,
      machineName TEXT NOT NULL,
      priority TEXT NOT NULL,
      failureMode TEXT NOT NULL,
      action TEXT NOT NULL,
      assignedToJson TEXT NOT NULL,
      estimatedDowntime TEXT NOT NULL,
      scheduledDate TEXT NOT NULL,
      deadline TEXT NOT NULL,
      sparePartsJson TEXT NOT NULL,
      costComparisonJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      signOffJson TEXT,
      FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machineId TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      duration REAL NOT NULL,
      cost REAL NOT NULL,
      technician TEXT NOT NULL,
      FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS asset_lifecycle (
      machineId TEXT PRIMARY KEY,
      purchaseDate TEXT NOT NULL,
      purchaseCost REAL NOT NULL,
      installDate TEXT NOT NULL,
      installCost REAL NOT NULL,
      warrantyExpiry TEXT NOT NULL,
      expectedLife INTEGER NOT NULL,
      depreciationRate REAL NOT NULL,
      currentBookValue REAL NOT NULL,
      totalMaintenanceCost REAL NOT NULL,
      totalDowntimeHours REAL NOT NULL,
      estimatedReplacementCost REAL NOT NULL,
      eventsJson TEXT NOT NULL,
      FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      machineId TEXT,
      severity TEXT NOT NULL,
      time TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );
  `);

  seedIfEmpty();
  db.prepare("INSERT OR REPLACE INTO dataset_meta (key, value) VALUES ('dataset_version', ?)").run(DATASET_VERSION);
}

function deterministicJitter(seed, index, scale) {
  const x = Math.sin(seed * 9301 + index * 49297 + 233280) * 10000;
  return (x - Math.floor(x) - 0.5) * 2 * scale;
}

function getNextSaturdayISO() {
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const nextWindow = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  return nextWindow.toISOString().split('T')[0];
}

function generatePhysicsHistoryPoint(m, mIdx, i, totalDays) {
  const prof = m.operatingProfile;
  const recency = (totalDays - i) / totalDays;

  let dayHealth;
  if (m.id === 'P-101') {
    const lateDrop = recency > 0.72 ? Math.pow((recency - 0.72) / 0.28, 1.6) * 13 : 0;
    dayHealth = Math.round(95 - recency * 2 - lateDrop + deterministicJitter(mIdx + 1, i, 1.0));
  } else if (m.id === 'CONV-401') {
    const stepDrop = recency > 0.8 ? 5 : 0;
    dayHealth = Math.round(93 - recency * 3 - stepDrop + deterministicJitter(mIdx + 1, i, 1.1));
  } else if (m.id === 'XFMR-302') {
    dayHealth = Math.round(92 - recency * 4 + deterministicJitter(mIdx + 1, i, 0.7));
  } else {
    dayHealth = Math.round(Math.min(99, m.health + (1 - recency) * 3 + deterministicJitter(mIdx + 1, i, 0.9)));
  }

  dayHealth = Math.max(25, Math.min(99, dayHealth));
  const deg = (100 - dayHealth) / 100;
  const loadWave = Math.sin(i * 0.45 + mIdx) * 0.5;

  const temperature = Math.round((prof.nominalTempC + deg * 36 + loadWave * 1.8 + deterministicJitter(mIdx + 2, i, 0.9)) * 10) / 10;
  const bearingDE = Math.round((prof.nominalBearingDEC + deg * 44 + loadWave * 2.2 + deterministicJitter(mIdx + 3, i, 1.1)) * 10) / 10;
  const vibration = Math.round(Math.max(0.2, prof.nominalVibRms + deg * 4.1 + loadWave * 0.12 + deterministicJitter(mIdx + 4, i, 0.14)) * 100) / 100;
  const earlyLead = m.id === 'P-101' && recency > 0.65 ? (recency - 0.65) * 1.9 : 0;
  const vibrationEnvelope = Math.round(Math.max(0.15, 0.28 + deg * 3.4 + earlyLead + deterministicJitter(mIdx + 5, i, 0.1)) * 100) / 100;
  const pressure = Math.round(Math.max(0.1, prof.nominalPressureBar - deg * (prof.nominalPressureBar * 0.22) + deterministicJitter(mIdx + 6, i, 0.12)) * 100) / 100;
  const efficiency = Math.round(Math.max(60, Math.min(99.2, prof.nominalEffPct - deg * 14 + deterministicJitter(mIdx + 7, i, 0.6))) * 10) / 10;
  const activePowerKw = m.id === 'XFMR-302'
    ? Math.round((560 + loadWave * 45 + deterministicJitter(mIdx + 8, i, 18)) * 10) / 10
    : Math.round((m.ratedPowerKw * (0.76 + deg * 0.16) + deterministicJitter(mIdx + 8, i, m.ratedPowerKw * 0.04)) * 100) / 100;

  return {
    temperature,
    bearingDE,
    vibration,
    vibrationEnvelope,
    pressure,
    efficiency,
    activePowerKw,
    health: dayHealth,
  };
}

function seedIfEmpty() {
  const machineCount = db.prepare('SELECT COUNT(*) AS cnt FROM machines').get().cnt;
  if (machineCount > 0) return;

  const insertMachine = db.prepare(`
    INSERT INTO machines (
      id, name, type, zone, manufacturer, model, serialNumber, installDate,
      health, status, criticality, ratedRpm, ratedPowerKw, ratedVoltageV, ratedCurrentA,
      runtimeHours, weibullBeta, weibullEta, downtimeCostPerHr, isoClass, bearingSpec,
      bearingGeometryJson, operatingProfileJson, alarmLimitsJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistoryPoint = db.prepare(`
    INSERT INTO telemetry_history (
      machineId, date, dateLabel, temperature, bearingDE, vibration, vibrationEnvelope,
      pressure, efficiency, activePowerKw, health
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLifecycle = db.prepare(`
    INSERT INTO asset_lifecycle (
      machineId, purchaseDate, purchaseCost, installDate, installCost,
      warrantyExpiry, expectedLife, depreciationRate, currentBookValue,
      totalMaintenanceCost, totalDowntimeHours, estimatedReplacementCost, eventsJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMaint = db.prepare(`
    INSERT INTO maintenance_history (
      machineId, date, type, action, duration, cost, technician
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPart = db.prepare(`
    INSERT INTO spare_parts (id, sku, bin, name, stock, reorderLevel, cost, leadTime, machinesJson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTech = db.prepare(`
    INSERT INTO technicians (id, name, skill, specialization, available, shift, certification)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (
      id, machineId, machineName, priority, failureMode, action,
      assignedToJson, estimatedDowntime, scheduledDate, deadline,
      sparePartsJson, costComparisonJson, createdAt, status, signOffJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, title, machineId, severity, time, createdAt, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    for (const t of TECHNICIANS) {
      insertTech.run(t.id, t.name, t.skill, t.specialization, t.available ? 1 : 0, t.shift, t.certification);
    }
    for (const sp of SPARE_PARTS) {
      insertPart.run(sp.id, sp.sku, sp.bin, sp.name, sp.stock, sp.reorderLevel, sp.cost, sp.leadTime, JSON.stringify(sp.machines));
    }

    const totalDays = 90;
    INITIAL_MACHINES.forEach((m, mIdx) => {
      insertMachine.run(
        m.id, m.name, m.type, m.zone, m.manufacturer, m.model, m.serialNumber, m.installDate,
        m.health, m.status, m.criticality, m.ratedRpm, m.ratedPowerKw, m.ratedVoltageV, m.ratedCurrentA,
        m.runtimeHours, m.weibullBeta, m.weibullEta, m.downtimeCostPerHr, m.isoClass, m.bearingSpec,
        JSON.stringify(m.bearingGeometry), JSON.stringify(m.operatingProfile), JSON.stringify(m.alarmLimits)
      );

      for (let i = totalDays; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const pt = generatePhysicsHistoryPoint(m, mIdx, i, totalDays);
        insertHistoryPoint.run(
          m.id, dateStr, dateLabel,
          pt.temperature, pt.bearingDE, pt.vibration, pt.vibrationEnvelope,
          pt.pressure, pt.efficiency, pt.activePowerKw, pt.health
        );
      }

      const lc = INITIAL_LIFECYCLE[m.id];
      if (lc) {
        insertLifecycle.run(
          m.id, lc.purchaseDate, lc.purchaseCost, lc.installDate, lc.installCost,
          lc.warrantyExpiry, lc.expectedLife, lc.depreciationRate, lc.currentBookValue,
          lc.totalMaintenanceCost, lc.totalDowntimeHours, lc.estimatedReplacementCost,
          JSON.stringify(lc.events)
        );
      }

      const hist = INITIAL_MAINTENANCE_HISTORY[m.id] || [];
      for (const h of hist) {
        insertMaint.run(m.id, h.date, h.type, h.action, h.duration, h.cost, h.technician);
      }
    });

    const woTargets = INITIAL_MACHINES.filter(m => m.health < 92);
    woTargets.forEach((m, idx) => {
      const modes = FAILURE_MODE_LIBRARY[m.id] || FAILURE_MODE_LIBRARY['P-101'];
      const top = modes[0];
      const tech = TECHNICIANS.find(t => t.available && t.skill === top.techSkill) || TECHNICIANS[0];
      const parts = SPARE_PARTS.filter(sp => top.parts.includes(sp.id)).map(sp => ({
        ...sp,
        status: sp.stock > 0 ? 'In Stock' : 'Order Required',
      }));
      const preventiveDowntime = 2 + (idx % 3);
      const reactiveDowntime = 10 + idx * 4;
      const preventiveCost = parts.reduce((s, p) => s + p.cost, 0) + 3200;
      const reactiveCost = Math.round(reactiveDowntime * (m.downtimeCostPerHr * 0.45) + preventiveCost * 2.5);
      const rulDays = Math.max(14, Math.round((m.health / 100) * 320));
      const deadline = new Date(Date.now() + rulDays * 86400000).toISOString().split('T')[0];

      insertWorkOrder.run(
        `WO-2026-${8941 + idx}`,
        m.id,
        m.name,
        m.health < 75 ? 'CRITICAL' : m.health < 86 ? 'HIGH' : 'MEDIUM',
        top.mode,
        top.action,
        JSON.stringify(tech),
        `${preventiveDowntime} hours`,
        getNextSaturdayISO(),
        deadline,
        JSON.stringify(parts),
        JSON.stringify({
          preventive: { cost: preventiveCost, downtime: preventiveDowntime },
          reactive: { cost: reactiveCost, downtime: reactiveDowntime },
          savings: reactiveCost - preventiveCost,
          roi: Math.round(((reactiveCost - preventiveCost) / preventiveCost) * 100) / 100,
        }),
        new Date().toISOString(),
        'Pending'
      );
    });

    for (const n of INITIAL_NOTIFICATIONS) {
      insertNotif.run(n.id, n.title, n.machineId, n.severity, n.time, new Date().toISOString(), n.read ? 1 : 0);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
