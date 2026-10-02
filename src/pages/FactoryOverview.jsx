/* ===================================================================
   Module 1 — Factory Overview (Digital Factory Floor)
   =================================================================== */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory, Activity, AlertTriangle, CheckCircle, XCircle,
  Gauge, TrendingUp, Cog, Waves, Wind, Zap, ArrowRight,
  Package, Microscope, ChevronRight, Box, Grid
} from 'lucide-react';
import { ZONES, MACHINES, getFactorySummary } from '../data/factoryData';
import { MetricCard, StatusDot, Badge, HealthRing, DemoController } from '../components/common';
import { Factory3DFloor } from '../components/digital-twin/Factory3DFloor';

const ICON_MAP = {
  Cog, Waves, Wind, Zap, ArrowRight, Package, Microscope,
};

export default function FactoryOverview() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(getFactorySummary());
  const [viewMode, setViewMode] = useState('3d'); // '3d' or 'grid'

  // Update stats every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getFactorySummary());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="factory-overview">
      {/* Viva Presentation Demo Controller Bar */}
      <DemoController />

      {/* Section Header */}
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Factory size={24} style={{ color: 'var(--accent-blue)' }} />
            Digital Factory Floor
          </h1>
          <p className="section-header__subtitle">
            Real-time monitoring of all factory zones, 3D shop floor spatial layout, and operational status
          </p>
        </div>

        {/* 2D Grid vs 3D Floor Switcher */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            onClick={() => setViewMode('3d')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: viewMode === '3d' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === '3d' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Box size={14} />
            3D Shop Floor
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: viewMode === 'grid' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Grid size={14} />
            Zone Grid
          </button>
        </div>
      </div>

      {/* Factory KPIs */}
      <div className="factory-stats">
        <MetricCard
          label="Total Assets"
          value={summary.totalMachines}
          icon={Activity}
          accent="var(--accent-blue)"
        />
        <MetricCard
          label="Running"
          value={summary.running}
          icon={CheckCircle}
          accent="var(--accent-emerald)"
          trend="stable"
          trendValue="All systems normal"
        />
        <MetricCard
          label="Warnings"
          value={summary.warnings}
          icon={AlertTriangle}
          accent="var(--accent-amber)"
          trend={summary.warnings > 0 ? 'up' : 'stable'}
          trendValue={summary.warnings > 0 ? 'Needs attention' : 'None'}
        />
        <MetricCard
          label="Avg. Health"
          value={summary.avgHealth}
          unit="%"
          icon={Gauge}
          accent="var(--accent-cyan)"
          trend="up"
          trendValue="+2.1% this week"
        />
        <MetricCard
          label="Factory Uptime"
          value={summary.uptime}
          unit="%"
          icon={TrendingUp}
          accent="var(--accent-emerald)"
          trend="up"
          trendValue="+0.8% this month"
        />
      </div>

      {/* Main View: 3D Shop Floor Walkthrough or 2D Zone Grid */}
      {viewMode === '3d' ? (
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Factory3DFloor />
        </div>
      ) : (
        <div className="factory-floor">
          {ZONES.map((zone) => {
            const zoneMachines = zone.machines.map(id => MACHINES[id]).filter(Boolean);
            const avgHealth = Math.round(
              zoneMachines.reduce((s, m) => s + m.health, 0) / zoneMachines.length
            );
            const hasWarning = zoneMachines.some(m => m.status === 'warning' || m.status === 'critical');
            const ZoneIcon = ICON_MAP[zone.icon] || Cog;

            return (
              <div
                key={zone.id}
                className="zone-card"
                style={{ '--zone-color': zone.color }}
              >
                <div className="zone-card__header">
                  <div className="zone-card__icon">
                    <ZoneIcon size={22} />
                  </div>
                  <Badge variant={hasWarning ? 'warning' : 'healthy'}>
                    {hasWarning ? 'Warning' : 'Healthy'}
                  </Badge>
                </div>

                <h3 className="zone-card__name">{zone.name}</h3>
                <p className="zone-card__description">{zone.description}</p>

                {/* Machine List */}
                <div className="zone-card__machines">
                  {zoneMachines.map(machine => (
                    <div
                      key={machine.id}
                      className="zone-card__machine-row"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/digital-twin/${machine.id}`);
                      }}
                    >
                      <div className="zone-card__machine-info">
                        <StatusDot status={machine.status} />
                        <span style={{ color: 'var(--text-secondary)' }}>{machine.name}</span>
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
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="zone-card__footer">
                  <div className="zone-card__stat">
                    <span className="zone-card__stat-value">{zoneMachines.length}</span>
                    <span className="zone-card__stat-label">Assets</span>
                  </div>
                  <div className="zone-card__stat">
                    <span className="zone-card__stat-value" style={{
                      color: avgHealth >= 80 ? 'var(--status-healthy)'
                        : avgHealth >= 50 ? 'var(--status-warning)'
                        : 'var(--status-critical)'
                    }}>
                      {avgHealth}%
                    </span>
                    <span className="zone-card__stat-label">Avg Health</span>
                  </div>
                  <div
                    className="zone-card__stat"
                    style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                    onClick={() => navigate(`/digital-twin/${zoneMachines[0]?.id || ''}`)}
                  >
                    <ChevronRight size={18} />
                    <span className="zone-card__stat-label">Details</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
