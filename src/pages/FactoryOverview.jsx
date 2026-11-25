/* ===================================================================
   Factory Overview — Shop Floor & Zone Grid
   =================================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, Activity, AlertTriangle, CheckCircle,
  Gauge, Cog, Waves, Wind, Zap, ArrowRight,
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

  const attentionCount = (summary.warnings || 0) + (summary.critical || 0);

  return (
    <div className="factory-overview">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Factory size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Factory Floor
          </h1>
          <p className="section-header__subtitle">
            Live equipment health and operating status across {zones.length} production zones
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
        />
        <MetricCard
          label="Running Normally"
          value={summary.running}
          icon={CheckCircle}
          trend="stable"
          trendValue={`${summary.uptime ?? 98.5}% uptime`}
        />
        <MetricCard
          label="Needs Attention"
          value={attentionCount}
          icon={AlertTriangle}
          trend={attentionCount > 0 ? 'down' : 'stable'}
          trendValue={attentionCount > 0 ? 'Inspection queued' : 'All systems normal'}
        />
        <MetricCard
          label="Fleet Health"
          value={summary.avgHealth}
          unit="%"
          icon={Gauge}
          trend="up"
          trendValue="Overall score"
        />
      </div>

      {viewMode === '3d' ? (
        <Factory3DFloor />
      ) : (
        <div className="factory-floor">
          {zones.map((zone) => {
            const zoneMachines = zone.machines.map(id => machines[id]).filter(Boolean);
            const hasCritical = zoneMachines.some(m => m.status === 'critical');
            const hasWarning = zoneMachines.some(m => m.status === 'warning');
            const ZoneIcon = ICON_MAP[zone.icon] || Cog;

            return (
              <div key={zone.id} className="zone-card">
                <div className="zone-card__header">
                  <div className="zone-card__icon">
                    <ZoneIcon size={18} strokeWidth={1.75} />
                  </div>
                  <Badge variant={hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy'}>
                    {hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'Healthy'}
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
                        style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}
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
                          <span>{machine.id}</span>
                          <span className="tabular-nums">
                            {liveTemp != null ? `${liveTemp}°C` : '—'}
                            {liveVib != null ? ` · ${liveVib} mm/s` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="zone-card__footer">
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {zoneMachines[0]?.manufacturer} {zoneMachines[0]?.type}
                  </span>
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
                    <span>Open Twin</span>
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
