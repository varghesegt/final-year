/* ===================================================================
   Reusable Common Components
   StatusDot, MetricCard, HealthRing, SensorGauge, ArcGauge, Badge, MachineSelector, HQCurve, WeibullPlot, MaintenanceCalendar, ExportPdfButton
   =================================================================== */

import { TrendingUp, TrendingDown, Minus, Cpu, Download, FileText } from 'lucide-react';
import { MACHINES } from '../../data/factoryData';

export { HQCurve } from './HQCurve';
export { WeibullPlot } from './WeibullPlot';
export { MaintenanceCalendar } from './MaintenanceCalendar';
export { DemoController } from './DemoController';
export { VibrationFFT } from './VibrationFFT';
export { WhatIfSimulator } from './WhatIfSimulator';

// ── Status Dot ──────────────────────────────────────────────────────
export function StatusDot({ status = 'running', size = 'md' }) {
  return (
    <span className={`status-dot status-dot--${status} ${size === 'lg' ? 'status-dot--lg' : ''}`} />
  );
}

// ── Badge ───────────────────────────────────────────────────────────
export function Badge({ variant = 'info', children }) {
  return (
    <span className={`badge badge--${variant}`}>
      {children}
    </span>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, trend, trendValue, icon: Icon, accent }) {
  const trendClass = trend === 'up' ? 'metric-card__trend--up'
    : trend === 'down' ? 'metric-card__trend--down'
    : 'metric-card__trend--stable';

  return (
    <div className="metric-card" style={{ '--metric-accent': accent }}>
      {Icon && (
        <div className="metric-card__icon">
          <Icon size={32} />
        </div>
      )}
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value">
        {value}
        {unit && <span className="metric-card__unit">{unit}</span>}
      </span>
      {trendValue && (
        <div className={`metric-card__trend ${trendClass}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

// ── Health Ring ──────────────────────────────────────────────────────
export function HealthRing({ value = 0, size = 80, strokeWidth = 6, label = 'Health' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = value >= 80 ? 'var(--status-healthy)'
    : value >= 50 ? 'var(--status-warning)'
    : 'var(--status-critical)';

  return (
    <div className="health-ring" style={{ width: size, height: size }}>
      <svg className="health-ring__svg" width={size} height={size}>
        <circle
          className="health-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="health-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="health-ring__label">
        <span className="health-ring__value" style={{ fontSize: size * 0.25 }}>{value}%</span>
        <span className="health-ring__text">{label}</span>
      </div>
    </div>
  );
}

// ── Arc Speedometer Gauge (SCADA style) ──────────────────────────────
export function ArcGauge({ label, value, unit, min = 0, max = 100, warning, critical, size = 130 }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isWarning = warning && value >= warning;
  const isCritical = critical && value >= critical;

  const barColor = isCritical ? 'var(--status-critical)'
    : isWarning ? 'var(--status-warning)'
    : 'var(--status-healthy)';

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const arcLength = Math.PI * radius;
  const strokeOffset = arcLength - (percent / 100) * arcLength;

  return (
    <div className="gauge" style={{ width: '100%', minWidth: '130px', textAlign: 'center' }}>
      <span className="gauge__label">{label}</span>
      <div style={{ position: 'relative', width: size, height: size / 2 + 15, margin: '0 auto' }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={barColor}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          bottom: 2,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-md)',
            fontWeight: 'var(--fw-bold)',
            color: barColor
          }}>
            {value}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ── Sensor Gauge ────────────────────────────────────────────────────
export function SensorGauge({ label, value, unit, min = 0, max = 100, warning, critical }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isWarning = warning && value >= warning;
  const isCritical = critical && value >= critical;

  const barColor = isCritical ? 'var(--status-critical)'
    : isWarning ? 'var(--status-warning)'
    : 'var(--status-healthy)';

  const textColor = isCritical ? 'var(--status-critical)'
    : isWarning ? 'var(--status-warning)'
    : 'var(--text-primary)';

  return (
    <div className="gauge">
      <span className="gauge__label">{label}</span>
      <div className="gauge__value-row">
        <span className="gauge__value" style={{ color: textColor }}>{value}</span>
        <span className="gauge__unit">{unit}</span>
      </div>
      <div className="gauge__bar">
        <div
          className="gauge__bar-fill"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}`,
          }}
        />
      </div>
    </div>
  );
}

// ── Machine Selector Component ──────────────────────────────────────
export function MachineSelector({ selectedId, onChange }) {
  const machinesList = Object.values(MACHINES);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      <Cpu size={16} style={{ color: 'var(--accent-blue)' }} />
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          fontSize: 'var(--fs-sm)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--fw-medium)',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        {machinesList.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id} — {m.name} ({m.health}% Health)
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Export PDF Report Button ────────────────────────────────────────
export function ExportPdfButton({ label = 'Export PDF Report' }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        color: 'var(--accent-blue)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title="Print or Save PDF report for this view"
    >
      <FileText size={14} />
      <span>{label}</span>
    </button>
  );
}
