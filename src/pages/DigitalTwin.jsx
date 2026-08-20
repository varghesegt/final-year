/* ===================================================================
   Module 2 — Machine Digital Twin (Dynamic per Machine)
   =================================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Thermometer, Gauge, Waves, RotateCw, Zap,
  Activity, Shield, Clock, Wrench, TrendingUp, AlertTriangle, Box, Layers
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { MACHINES, generateSensorData, generatePrediction, generateHistoricalData } from '../data/factoryData';
import { HealthRing, ArcGauge, SensorGauge, Badge, StatusDot, MachineSelector, HQCurve, WeibullPlot, ExportPdfButton } from '../components/common';
import { Machine3DViewer } from '../components/digital-twin/Machine3DViewer';

export default function DigitalTwin() {
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'

  const selectedMachineId = (paramMachineId && MACHINES[paramMachineId]) ? paramMachineId : 'P-101';
  const machine = MACHINES[selectedMachineId] || MACHINES['P-101'];

  const [sensors, setSensors] = useState(() => generateSensorData(selectedMachineId));
  const [prediction, setPrediction] = useState(() => generatePrediction(selectedMachineId));
  const [history, setHistory] = useState(() => generateHistoricalData(selectedMachineId, 30));

  useEffect(() => {
    setSensors(generateSensorData(selectedMachineId));
    setPrediction(generatePrediction(selectedMachineId));
    setHistory(generateHistoricalData(selectedMachineId, 30));

    const interval = setInterval(() => {
      setSensors(generateSensorData(selectedMachineId));
      setPrediction(generatePrediction(selectedMachineId));
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedMachineId]);

  const handleMachineSelect = (newId) => {
    navigate(`/digital-twin/${newId}`);
  };

  return (
    <div className="digital-twin">

      {/* Header */}
      <div className="twin-header">
        <div className="twin-header__info">
          <div className="twin-header__icon">
            <Cpu size={28} />
          </div>
          <div className="twin-header__text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>{machine.name} — {machine.id}</h1>
              <MachineSelector selectedId={selectedMachineId} onChange={handleMachineSelect} />
            </div>
            <div className="twin-header__meta" style={{ marginTop: 'var(--sp-2)' }}>
              <span>{machine.manufacturer} {machine.model}</span>
              <span>•</span>
              <span>Installed: {machine.installDate}</span>
              <span>•</span>
              <Badge variant={machine.status}>{machine.status}</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <ExportPdfButton label="Export Twin Report" />
          <HealthRing value={machine.health} size={90} label="Health" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="twin-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        {/* 3D / 2D Pump Digital Twin Viewer */}
        <div className="twin-panel">
          <div className="twin-panel__title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <Shield size={16} className="twin-panel__title-icon" />
              Machine Digital Twin — Telemetry & CAD View
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setViewMode('3D')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600,
                  background: viewMode === '3D' ? 'var(--accent-blue)' : '#f1f5f9',
                  color: viewMode === '3D' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)', cursor: 'pointer'
                }}
              >
                <Box size={13} />
                3D CAD Twin
              </button>
              <button
                onClick={() => setViewMode('2D')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600,
                  background: viewMode === '2D' ? 'var(--accent-blue)' : '#f1f5f9',
                  color: viewMode === '2D' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)', cursor: 'pointer'
                }}
              >
                <Layers size={13} />
                2D SCADA View
              </button>
            </div>
          </div>

          {viewMode === '3D' ? (
            <Machine3DViewer machine={machine} sensors={sensors} health={machine.health} isSimulation={machine.health < 55} />
          ) : (
            <div className="pump-diagram">
              <PumpSVG sensors={sensors} machine={machine} />
            </div>
          )}
        </div>

        {/* Real-time SCADA Speedometer Arc Gauges */}
        <div className="twin-panel">
          <div className="twin-panel__title">
            <Activity size={16} className="twin-panel__title-icon" />
            Live SCADA Speedometer Gauges
          </div>
          <div className="sensor-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            <ArcGauge
              label="Temperature"
              value={sensors.temperature.value}
              unit={sensors.temperature.unit}
              min={sensors.temperature.min}
              max={sensors.temperature.max}
              warning={sensors.temperature.warning}
              critical={sensors.temperature.critical}
            />
            <ArcGauge
              label="Vibration"
              value={sensors.vibration.value}
              unit={sensors.vibration.unit}
              min={sensors.vibration.min}
              max={sensors.vibration.max}
              warning={sensors.vibration.warning}
              critical={sensors.vibration.critical}
            />
            <ArcGauge
              label="Pressure"
              value={sensors.pressure.value}
              unit={sensors.pressure.unit}
              min={sensors.pressure.min}
              max={sensors.pressure.max}
            />
            <ArcGauge
              label="Flow Rate"
              value={sensors.flowRate.value}
              unit={sensors.flowRate.unit}
              min={sensors.flowRate.min}
              max={sensors.flowRate.max}
            />
            <ArcGauge
              label="RPM"
              value={sensors.rpm.value}
              unit={sensors.rpm.unit}
              min={sensors.rpm.min}
              max={sensors.rpm.max}
              warning={sensors.rpm.warning}
              critical={sensors.rpm.critical}
            />
            <ArcGauge
              label="Efficiency"
              value={sensors.efficiency.value}
              unit={sensors.efficiency.unit}
              min={sensors.efficiency.min}
              max={sensors.efficiency.max}
              warning={sensors.efficiency.warning}
              critical={sensors.efficiency.critical}
            />
          </div>
        </div>
      </div>

      {/* AI Prediction + History Chart */}
      <div className="twin-grid">
        {/* AI Prediction Panel */}
        <div className="twin-panel">
          <div className="twin-panel__title">
            <AlertTriangle size={16} className="twin-panel__title-icon" />
            AI Failure Risk Assessment
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
            <HealthRing
              value={Math.max(0, 100 - prediction.failureProbability)}
              size={100}
              label="Safety"
            />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>FAILURE PROBABILITY</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: prediction.failureProbability > 50 ? 'var(--status-critical)' : 'var(--status-warning)' }}>
                  {prediction.failureProbability}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>REMAINING USEFUL LIFE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                  {prediction.remainingUsefulLife} <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Failure Modes */}
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-3)' }}>
            Predicted Failure Modes
          </div>
          {prediction.failureModes.slice(0, 4).map((mode, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--sp-2) var(--sp-3)', background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-2)',
              fontSize: 'var(--fs-sm)'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{mode.mode}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-semibold)',
                color: mode.probability > 50 ? 'var(--status-critical)'
                  : mode.probability > 25 ? 'var(--status-warning)'
                  : 'var(--status-healthy)'
              }}>
                {Math.max(0, mode.probability)}%
              </span>
            </div>
          ))}
        </div>

        {/* History Chart */}
        <div className="twin-panel">
          <div className="twin-panel__title">
            <TrendingUp size={16} className="twin-panel__title-icon" />
            30-Day Degradation & Temperature Trend
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f1f5f9'
                }}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#10b981"
                fill="url(#healthGradient)"
                strokeWidth={2}
                name="Health %"
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                fill="url(#tempGradient)"
                strokeWidth={2}
                name="Temp °C"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced Engineering Analysis Grid (H-Q Curve & Weibull Distribution) */}
      <div className="twin-grid" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="twin-panel">
          <HQCurve flowRate={sensors.flowRate.value} health={machine.health} />
        </div>
        <div className="twin-panel">
          <WeibullPlot currentHours={4200} beta={2.5} eta={5000} />
        </div>
      </div>
    </div>
  );
}

// ── Enhanced Pump SVG Diagram with Fluid Particle Motion ────────────
function PumpSVG({ sensors, machine }) {
  const tempColor = sensors.temperature.value > sensors.temperature.warning
    ? 'var(--status-warning)' : 'var(--status-healthy)';
  const vibColor = sensors.vibration.value > sensors.vibration.warning
    ? 'var(--status-warning)' : 'var(--status-healthy)';

  // Calculate dynamic impeller rotation speed (higher RPM = faster rotation)
  const animDuration = Math.max(0.5, (1800 / (sensors.rpm.value || 1450)).toFixed(1));

  return (
    <svg viewBox="0 0 500 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fluidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Motor Housing */}
      <rect x="30" y="80" width="120" height="80" rx="6"
        stroke="var(--accent-blue)" strokeWidth="2" fill="rgba(59,130,246,0.05)" />
      <text x="90" y="115" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontFamily="var(--font-mono)">MOTOR</text>
      <text x="90" y="135" textAnchor="middle" fill="var(--text-muted)" fontSize="9">15kW / {sensors.rpm.value} RPM</text>

      {/* Motor Heat Glow Pulsing Indicator */}
      <circle cx="130" cy="90" r="6" fill={tempColor}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <text x="142" y="93" fill="var(--text-muted)" fontSize="8">{sensors.temperature.value}°C</text>

      {/* Flexible Shaft Coupling */}
      <rect x="150" y="100" width="30" height="40" rx="4"
        stroke="var(--accent-purple)" strokeWidth="1.5" fill="rgba(139,92,246,0.05)" />
      <text x="165" y="125" textAnchor="middle" fill="var(--text-muted)" fontSize="8">CPL</text>

      {/* Bearing Housing */}
      <rect x="180" y="90" width="50" height="60" rx="4"
        stroke="var(--accent-amber)" strokeWidth="1.5" fill="rgba(245,158,11,0.05)" />
      <text x="205" y="115" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono)">BRG</text>
      <text x="205" y="130" textAnchor="middle" fill="var(--text-muted)" fontSize="8">SKF 6205</text>

      {/* Vibration sensor indicator */}
      <circle cx="215" cy="95" r="6" fill={vibColor}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x="227" y="98" fill="var(--text-muted)" fontSize="8">{sensors.vibration.value} mm/s</text>

      {/* Pump Casing (Volute) */}
      <ellipse cx="310" cy="120" rx="65" ry="55"
        stroke="var(--accent-cyan)" strokeWidth="2" fill="rgba(6,182,212,0.05)" />
      <text x="310" y="110" textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontFamily="var(--font-mono)">
        {machine.type.toUpperCase()}
      </text>
      <text x="310" y="130" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Volute Casing</text>

      {/* Animated Rotating Impeller */}
      <g>
        <circle cx="310" cy="120" r="22" stroke="var(--accent-cyan)" strokeWidth="1.5"
          fill="rgba(6,182,212,0.12)" strokeDasharray="6 3">
          <animateTransform attributeName="transform" type="rotate"
            from="0 310 120" to="360 310 120" dur={`${animDuration}s`} repeatCount="indefinite" />
        </circle>
        {/* Impeller Vanes */}
        <line x1="310" y1="98" x2="310" y2="142" stroke="var(--accent-cyan)" strokeWidth="1.5">
          <animateTransform attributeName="transform" type="rotate"
            from="0 310 120" to="360 310 120" dur={`${animDuration}s`} repeatCount="indefinite" />
        </line>
      </g>

      {/* Suction Pipe (Inlet) */}
      <line x1="310" y1="175" x2="310" y2="240" stroke="var(--accent-blue)" strokeWidth="3" />
      <rect x="290" y="240" width="40" height="20" rx="3"
        stroke="var(--accent-blue)" strokeWidth="1.5" fill="rgba(59,130,246,0.05)" />
      <text x="310" y="255" textAnchor="middle" fill="var(--text-muted)" fontSize="8">INLET</text>
      <text x="310" y="218" textAnchor="middle" fill="var(--accent-blue)" fontSize="9" fontFamily="var(--font-mono)">
        {sensors.pressure.value} bar
      </text>

      {/* Fluid Motion Animated Dash Line in Inlet */}
      <line x1="310" y1="240" x2="310" y2="175" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="6 6">
        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
      </line>

      {/* Discharge Pipe (Outlet) */}
      <line x1="375" y1="120" x2="450" y2="120" stroke="var(--accent-emerald)" strokeWidth="3" />
      <rect x="450" y="108" width="40" height="24" rx="3"
        stroke="var(--accent-emerald)" strokeWidth="1.5" fill="rgba(16,185,129,0.05)" />
      <text x="470" y="124" textAnchor="middle" fill="var(--text-muted)" fontSize="8">OUT</text>

      {/* Fluid Motion Animated Dash Line in Outlet */}
      <line x1="375" y1="120" x2="450" y2="120" stroke="var(--accent-emerald)" strokeWidth="2" strokeDasharray="6 6">
        <animate attributeName="stroke-dashoffset" from="0" to="24" dur="0.8s" repeatCount="indefinite" />
      </line>

      <text x="415" y="108" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
        {sensors.flowRate.value} L/s
      </text>

      {/* Drive Shaft */}
      <line x1="150" y1="120" x2="245" y2="120" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round" />

      {/* Live RPM readout */}
      <text x="90" y="175" textAnchor="middle" fill="var(--accent-blue)" fontSize="10" fontFamily="var(--font-mono)">
        ⟳ {sensors.rpm.value} RPM
      </text>

      {/* Efficiency Badge overlay */}
      <rect x="280" y="15" width="60" height="24" rx="12"
        fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.2)" />
      <text x="310" y="31" textAnchor="middle" fill="var(--status-healthy)" fontSize="10" fontWeight="600">
        η {sensors.efficiency.value}%
      </text>
    </svg>
  );
}
