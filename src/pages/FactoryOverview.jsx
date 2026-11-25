/* ===================================================================
   Factory Overview — Shop Floor & Zone Grid
   =================================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, Activity, AlertTriangle, CheckCircle,
  Gauge, TrendingUp, Cog, Waves, Wind, Zap, ArrowRight,
  Package, Microscope, ChevronRight, Box, Grid, Bot
} from 'lucide-react';
import { ZONES as DEFAULT_ZONES, MACHINES as DEFAULT_MACHINES, getFactorySummary } from '../data/factoryData';
import { MetricCard, StatusDot, Badge } from '../components/common';
import { Factory3DFloor } from '../components/digital-twin/Factory3DFloor';
import { fetchFactoryOverview, subscribeToLiveStream } from '../services/api';

const ICON_MAP = {
  Cog, Waves, Wind, Zap, ArrowRight, Package, Microscope, Bot,
};

export default function FactoryOverview() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(getFactorySummary());
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [telemetryByMachine, setTelemetryByMachine] = useState({});
  const [viewMode, setViewMode] = useState('3d');

  useEffect(() => {
    let active = true;
    fetchFactoryOverview().then((data) => {
      if (!active) return;
      if (data.zones) setZones(data.zones);
      if (data.machines) setMachines(data.machines);
      if (data.summary) setSummary(data.summary);
    });

    const unsubscribe = subscribeToLiveStream((snap) => {
      if (snap?.summary) setSummary(snap.summary);
      if (snap?.machines) setMachines(snap.machines);
      if (snap?.telemetryByMachine) setTelemetryByMachine(snap.telemetryByMachine);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const totalPowerKw = summary.fleetPowerKw
    ?? Math.round(Object.values(machines).reduce((s, m) => s + (m.ratedPowerKw || 12) * 0.78, 0) * 10) / 10;

  return (
    <div className="factory-overview">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Factory size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Factory Floor
          </h1>
          <p className="section-header__subtitle">
            Live equipment telemetry across six industrial zones · Fleet Draw{' '}
            <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{totalPowerKw} kW</strong>
            {summary.hourlyDowntimeExposure > 0 && (
              <>
                {' '}· Exposure{' '}
                <strong className="tabular-nums" style={{ color: 'var(--status-warning)' }}>
                  ₹{(summary.hourlyDowntimeExposure / 1000).toFixed(1)}K/hr
                </strong>
              </>
            )}
          </p>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Floor view mode">
          <button
            onClick={() => setViewMode('3d')}
            className={`segmented-control__btn ${viewMode === '3d' ? 'segmented-control__btn--active' : ''}`}
          >
            <Box size={14} strokeWidth={1.75} />
            <span>3D Floor</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`segmented-control__btn ${viewMode === 'grid' ? 'segmented-control__btn--active' : ''}`}
          >
            <Grid size={14} strokeWidth={1.75} />
            <span>Zone Grid</span>
          </button>
        </div>
      </div>

      <div className="factory-stats">
        <MetricCard
          label="Total Assets"
          value={summary.totalMachines}
          icon={Activity}
          trend="stable"
          trendValue={`${zones.length} monitored bays`}
        />
        <MetricCard
          label="Running"
          value={summary.running}
          icon={CheckCircle}
          trend="stable"
          trendValue="Within rated limits"
        />
        <MetricCard
          label="Advisories"
          value={summary.warnings + (summary.critical || 0)}
          icon={AlertTriangle}
          trend={summary.warnings + (summary.critical || 0) > 0 ? 'down' : 'stable'}
          trendValue={summary.warnings + (summary.critical || 0) > 0 ? 'Inspection queued' : 'No active faults'}
        />
        <MetricCard
          label="Fleet Health"
          value={summary.avgHealth}
          unit="%"
          icon={Gauge}
          trend="up"
          trendValue="Weighted index"
        />
        <MetricCard
          label="Plant Availability"
          value={summary.uptime}
          unit="%"
          icon={TrendingUp}
          trend="up"
          trendValue="90-day rolling"
        />
      </div>

      {viewMode === '3d' ? (
        <Factory3DFloor />
      ) : (
        <div className="factory-floor">
          {zones.map((zone) => {
            const zoneMachines = zone.machines.map(id => machines[id]).filter(Boolean);
            const avgHealth = zoneMachines.length
              ? Math.round(zoneMachines.reduce((s, m) => s + m.health, 0) / zoneMachines.length)
              : 0;
            const hasCritical = zoneMachines.some(m => m.status === 'critical');
            const hasWarning = zoneMachines.some(m => m.status === 'warning');
            const ZoneIcon = ICON_MAP[zone.icon] || Cog;

            return (
              <div key={zone.id} className="zone-card">
                <div className="zone-card__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="zone-card__icon">
                      <ZoneIcon size={18} strokeWidth={1.75} />
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {zone.code || zone.id.toUpperCase()}
                      {zone.ambientTargetC ? ` · ${zone.ambientTargetC}°C Bay` : ''}
                    </div>
                  </div>
                  <Badge variant={hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy'}>
                    {hasCritical ? 'Critical' : hasWarning ? 'Advisory' : 'Nominal'}
                  </Badge>
                </div>

                <h3 className="zone-card__name">{zone.name}</h3>
                <p className="zone-card__description">{zone.description}</p>

                <div className="zone-card__machines">
                  {zoneMachines.map(machine => {
                    const liveTel = telemetryByMachine[machine.id];
                    const liveTemp = liveTel?.temperature?.value;
                    const liveVib = liveTel?.vibration?.value;
                    return (
                      <div
                        key={machine.id}
                        className="zone-card__machine-row"
                        style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}
                        onClick={() => navigate(`/digital-twin/${machine.id}`)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div className="zone-card__machine-info">
                            <StatusDot status={machine.status} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{machine.name}</span>
                          </div>
                          <span
                            className="zone-card__machine-health"
                            style={{
                              color: machine.health >= 80 ? 'var(--status-healthy)'
                                : machine.health >= 50 ? 'var(--status-warning)'
                                : 'var(--status-critical)'
                            }}
                          >
                            {machine.health}%
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          <span>{machine.manufacturer} · {machine.id}</span>
                          <span className="tabular-nums">
                            {liveTemp != null ? `${liveTemp}°C` : `${machine.ratedPowerKw ?? '—'} kW`}
                            {liveVib != null ? ` · ${liveVib} mm/s` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="zone-card__footer">
                  <div className="zone-card__stat">
                    <span className="zone-card__stat-value">
                      {(zoneMachines[0]?.runtimeHours || 0).toLocaleString()}h
                    </span>
                    <span className="zone-card__stat-label">Runtime</span>
                  </div>
                  <div className="zone-card__stat">
                    <span className="zone-card__stat-value" style={{
                      color: avgHealth >= 80 ? 'var(--status-healthy)'
                        : avgHealth >= 50 ? 'var(--status-warning)'
                        : 'var(--status-critical)'
                    }}>
                      {avgHealth}%
                    </span>
                    <span className="zone-card__stat-label">Health</span>
                  </div>
                  <button
                    onClick={() => navigate(`/digital-twin/${zoneMachines[0]?.id || ''}`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>Inspect</span>
                    <ChevronRight size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
