/* ===================================================================
   Machine Digital Twin — 3D CAD, 2D SCADA & Essential Diagnostics
   =================================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Activity, TrendingUp, AlertTriangle, Box, Layers,
  QrCode, Sliders, BarChart2, ShieldCheck, RotateCcw, Play, Download
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { MACHINES as DEFAULT_MACHINES, generateSensorData, generatePrediction, generateHistoricalData } from '../data/factoryData';
import {
  fetchMachineTelemetry,
  fetchMachinePrediction,
  fetchCurvesAnalysis,
  subscribeToLiveStream,
  triggerBackendSimulation,
  resetBackendSimulation,
  getDatasetExportUrl,
} from '../services/api';
import {
  HealthRing, Badge, MachineSelector,
  HQCurve, WeibullPlot, ExportPdfButton, VibrationFFT, WhatIfSimulator
} from '../components/common';
import { Machine3DViewer } from '../components/digital-twin/Machine3DViewer';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { PumpSCADAView } from '../components/digital-twin/PumpSCADAView';
import { CNCSCADAView } from '../components/digital-twin/CNCSCADAView';
import { CompressorSCADAView } from '../components/digital-twin/CompressorSCADAView';
import { ConveyorSCADAView } from '../components/digital-twin/ConveyorSCADAView';
import { TransformerSCADAView } from '../components/digital-twin/TransformerSCADAView';

function buildFallbackKeyParams(machineId, sensors) {
  return [
    { label: 'Temperature', value: `${sensors?.temperature?.value ?? 45}`, unit: '°C', status: 'normal', hint: 'Nominal range' },
    { label: 'Vibration', value: `${sensors?.vibration?.value ?? 1.2}`, unit: 'mm/s', status: 'normal', hint: 'ISO limit check' },
    { label: 'Efficiency', value: `${sensors?.efficiency?.value ?? 92}`, unit: '%', status: 'normal', hint: 'Operating rate' },
    { label: 'Power Load', value: `${sensors?.activePower?.value ?? 14}`, unit: 'kW', status: 'normal', hint: machineId === 'XFMR-302' ? '50 Hz Supply' : `${sensors?.rpm?.value ?? 1450} RPM` },
  ];
}

export default function DigitalTwin() {
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('3D');
  const [activeTab, setActiveTab] = useState('cad');
  const [trendDays, setTrendDays] = useState(30);
  const [trendChannel, setTrendChannel] = useState('health-temp');
  const [showQRModal, setShowQRModal] = useState(false);
  const [simActive, setSimActive] = useState(false);

  const selectedMachineId = (paramMachineId && DEFAULT_MACHINES[paramMachineId]) ? paramMachineId : 'P-101';
  const [machine, setMachine] = useState(() => DEFAULT_MACHINES[selectedMachineId] || DEFAULT_MACHINES['P-101']);
  const [sensors, setSensors] = useState(() => generateSensorData(selectedMachineId));
  const [prediction, setPrediction] = useState(() => generatePrediction(selectedMachineId));
  const [history, setHistory] = useState(() => generateHistoricalData(selectedMachineId, 30));
  const [curvesData, setCurvesData] = useState(null);

  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      const [telData, predData, curvesRes] = await Promise.all([
        fetchMachineTelemetry(selectedMachineId, trendDays),
        fetchMachinePrediction(selectedMachineId),
        fetchCurvesAnalysis(selectedMachineId).catch(() => null),
      ]);
      if (!active) return;
      if (telData?.machine) setMachine(telData.machine);
      if (telData?.telemetry) setSensors(telData.telemetry);
      if (telData?.history?.length) setHistory(telData.history);
      if (predData) setPrediction(predData);
      if (curvesRes) setCurvesData(curvesRes);
    };

    loadAll();

    const unsub = subscribeToLiveStream((snap) => {
      if (!active || !snap?.connected) return;
      const liveM = snap.machines?.[selectedMachineId];
      const liveTel = snap.telemetryByMachine?.[selectedMachineId];
      if (liveM) setMachine(liveM);
      if (liveTel) setSensors(liveTel);
      if (snap.simulation) {
        setSimActive(Boolean(snap.simulation.active && snap.simulation.machineId === selectedMachineId));
      }
    });

    const predInterval = setInterval(async () => {
      const predData = await fetchMachinePrediction(selectedMachineId);
      if (active && predData) setPrediction(predData);
    }, 3000);

    return () => {
      active = false;
      unsub();
      clearInterval(predInterval);
    };
  }, [selectedMachineId, trendDays]);

  const handleMachineSelect = (newId) => {
    navigate(`/digital-twin/${newId}`);
  };

  const handleToggleFaultTest = async () => {
    if (simActive || machine.health < 70) {
      await resetBackendSimulation(selectedMachineId).catch(() => {});
      setSimActive(false);
    } else {
      setSimActive(true);
      await triggerBackendSimulation(selectedMachineId, 20).catch(() => {});
    }
  };

  const keyParams = sensors?.keyParameters?.length
    ? sensors.keyParameters
    : buildFallbackKeyParams(selectedMachineId, sensors);

  return (
    <div className="digital-twin">
      <div className="twin-header">
        <div className="twin-header__info">
          <div className="twin-header__icon">
            <Cpu size={20} strokeWidth={1.75} />
          </div>
          <div className="twin-header__text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>{machine.name}</h1>
              <MachineSelector selectedId={selectedMachineId} onChange={handleMachineSelect} />
            </div>
            <div className="twin-header__meta">
              <span>{machine.manufacturer} {machine.model}</span>
              <span>·</span>
              <span>{(machine.runtimeHours || 0).toLocaleString()} hrs runtime</span>
              <span>·</span>
              <Badge variant={machine.status}>{machine.status}</Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleFaultTest}
            className={simActive || machine.health < 70 ? 'btn btn--secondary' : 'btn btn--danger-outline'}
          >
            {simActive || machine.health < 70 ? <RotateCcw size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />}
            <span>{simActive ? 'Reset Asset' : machine.health < 70 ? 'Restore Healthy' : 'Test Fault'}</span>
          </button>

          <a
            href={getDatasetExportUrl(selectedMachineId, 'csv')}
            download={`${selectedMachineId}-telemetry-90d.csv`}
            className="btn btn--secondary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={14} strokeWidth={1.75} />
            <span>CSV</span>
          </a>

          <button onClick={() => setShowQRModal(true)} className="btn btn--secondary">
            <QrCode size={14} strokeWidth={1.75} />
            <span>Tag</span>
          </button>

          <ExportPdfButton label="Report" />
          <HealthRing value={machine.health} size={68} label="Health" />
        </div>
      </div>

      <div className="twin-tabs" role="tablist">
        {[
          { id: 'cad', label: '3D CAD & Live View', icon: Box },
          { id: 'ai', label: 'Health & History', icon: TrendingUp },
          { id: 'fft', label: 'Vibration Spectrum', icon: Activity },
          { id: 'whatif', label: 'Impact Simulator', icon: Sliders },
          { id: 'curves', label: 'Performance Curves', icon: BarChart2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`twin-tab-btn ${isActive ? 'twin-tab-btn--active' : ''}`}
            >
              <TabIcon size={15} strokeWidth={1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'cad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <ShieldCheck size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Interactive Equipment View</span>
              </div>
              <div className="segmented-control">
                <button
                  onClick={() => setViewMode('3D')}
                  className={`segmented-control__btn ${viewMode === '3D' ? 'segmented-control__btn--active' : ''}`}
                >
                  <Box size={13} strokeWidth={1.75} />
                  <span>3D CAD</span>
                </button>
                <button
                  onClick={() => setViewMode('2D')}
                  className={`segmented-control__btn ${viewMode === '2D' ? 'segmented-control__btn--active' : ''}`}
                >
                  <Layers size={13} strokeWidth={1.75} />
                  <span>2D SCADA</span>
                </button>
              </div>
            </div>

            {viewMode === '3D' ? (
              <Machine3DViewer machine={machine} sensors={sensors} health={machine.health} isSimulation={machine.health < 55} />
            ) : (
              (selectedMachineId === 'P-101' || machine.type?.includes('Pump')) ? (
                <PumpSCADAView sensors={sensors} machine={machine} />
              ) : (selectedMachineId === 'CNC-001' || machine.type?.includes('Milling') || machine.type?.includes('CNC')) ? (
                <CNCSCADAView sensors={sensors} machine={machine} />
              ) : (selectedMachineId === 'COMP-201' || machine.type?.includes('Compressor')) ? (
                <CompressorSCADAView sensors={sensors} machine={machine} />
              ) : (selectedMachineId === 'CONV-401' || machine.type?.includes('Conveyor')) ? (
                <ConveyorSCADAView sensors={sensors} machine={machine} />
              ) : (selectedMachineId === 'XFMR-302' || machine.type?.includes('Transformer')) ? (
                <TransformerSCADAView sensors={sensors} machine={machine} />
              ) : (
                <RobotSummarySCADAView sensors={sensors} machine={machine} />
              )
            )}
          </div>

          {/* Single Unified Key Parameters Grid (replaces duplicate Dossier + ArcGauges + Tribology) */}
          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <Activity size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Essential Live Parameters</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Updated live from plant sensors
              </span>
            </div>

            <div className="factory-stats">
              {keyParams.map((item, idx) => (
                <div key={idx} className="metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-card__label">{item.label}</span>
                    <Badge variant={item.status === 'critical' ? 'critical' : item.status === 'warning' ? 'warning' : 'healthy'}>
                      {item.status === 'normal' ? 'OK' : item.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="metric-card__value">
                    {item.value}
                    {item.unit && <span className="metric-card__unit">{item.unit}</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="twin-grid">
          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <AlertTriangle size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Failure Risk & Service Window</span>
              </div>
              <Badge variant={prediction.riskLevel === 'CRITICAL' ? 'critical' : prediction.riskLevel === 'HIGH' ? 'warning' : 'healthy'}>
                {prediction.riskLevel}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-5)', alignItems: 'center' }}>
              <HealthRing
                value={Math.max(0, 100 - prediction.failureProbability)}
                size={90}
                label="Safety"
              />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Failure Risk</div>
                  <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: prediction.failureProbability > 50 ? 'var(--status-critical)' : 'var(--status-warning)' }}>
                    {prediction.failureProbability}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Life Left</div>
                  <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                    {prediction.remainingUsefulLife} <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>days</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Likely Wear Areas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prediction.failureModes.slice(0, 3).map((mode, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--fs-sm)'
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{mode.mode}</span>
                  <span className="tabular-nums" style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-semibold)',
                    color: mode.probability > 50 ? 'var(--status-critical)' : mode.probability > 25 ? 'var(--status-warning)' : 'var(--status-healthy)'
                  }}>
                    {Math.max(0, mode.probability)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <TrendingUp size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>{trendDays}-Day Sensor History</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="segmented-control">
                  {[
                    { id: 'health-temp', label: 'Health & Temp' },
                    { id: 'vib-envelope', label: 'Vibration' },
                    { id: 'eff-power', label: 'Efficiency' },
                  ].map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setTrendChannel(ch.id)}
                      className={`segmented-control__btn ${trendChannel === ch.id ? 'segmented-control__btn--active' : ''}`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
                <div className="segmented-control">
                  {[7, 30, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => setTrendDays(d)}
                      className={`segmented-control__btn ${trendDays === d ? 'segmented-control__btn--active' : ''}`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {history.length > 1 && (
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={history} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b45309" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#b45309" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} interval={trendDays >= 90 ? 12 : trendDays >= 30 ? 4 : 0} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} />
                  {trendChannel === 'health-temp' && (
                    <>
                      <Area type="monotone" dataKey="health" stroke="#047857" fill="url(#healthGradient)" strokeWidth={2} name="Health %" isAnimationActive={false} />
                      <Area type="monotone" dataKey="bearingDE" stroke="#b45309" fill="url(#tempGradient)" strokeWidth={2} name="Temperature °C" isAnimationActive={false} />
                    </>
                  )}
                  {trendChannel === 'vib-envelope' && (
                    <>
                      <Area type="monotone" dataKey="vibration" stroke="#1d4ed8" fill="url(#healthGradient)" strokeWidth={2} name="Vibration mm/s" isAnimationActive={false} />
                      <Area type="monotone" dataKey="vibrationEnvelope" stroke="#b91c1c" fill="url(#tempGradient)" strokeWidth={2} name="Shock Energy gE" isAnimationActive={false} />
                    </>
                  )}
                  {trendChannel === 'eff-power' && (
                    <>
                      <Area type="monotone" dataKey="efficiency" stroke="#047857" fill="url(#healthGradient)" strokeWidth={2} name="Efficiency %" isAnimationActive={false} />
                      <Area type="monotone" dataKey="activePowerKw" stroke="#1d4ed8" fill="url(#tempGradient)" strokeWidth={2} name="Power kW" isAnimationActive={false} />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fft' && (
        <div className="twin-panel">
          <VibrationFFT machineId={selectedMachineId} />
        </div>
      )}

      {activeTab === 'whatif' && (
        <div className="twin-panel">
          <WhatIfSimulator
            machineId={selectedMachineId}
            baseRUL={prediction.remainingUsefulLife}
            ratedRpm={machine.ratedRpm ?? 1450}
            machineName={machine.name}
          />
        </div>
      )}

      {activeTab === 'curves' && (
        <div className="twin-grid">
          <div className="twin-panel">
            <HQCurve hqCurve={curvesData?.hqCurve} />
          </div>
          <div className="twin-panel">
            <WeibullPlot weibull={curvesData?.weibull} />
          </div>
        </div>
      )}

      {showQRModal && (
        <AssetQRCodeModal
          machine={machine}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}

function RobotSummarySCADAView({ sensors, machine }) {
  const metrics = [
    { label: 'TCP Velocity', val: `${sensors.tcpVelocity ?? 1250} mm/s`, status: 'NOMINAL' },
    { label: 'Active Payload', val: `${sensors.activePayload ?? 142} / 210 kg`, status: 'NOMINAL' },
    { label: 'Reducer Backlash', val: `${sensors.harmonicBacklash ?? 0.42} arcmin`, status: (sensors.harmonicBacklash ?? 0.42) > 0.8 ? 'ADVISORY' : 'NOMINAL' },
    { label: 'Gripper Pressure', val: `${sensors.gripperPressure ?? 6.2} bar`, status: 'NOMINAL' },
    { label: 'J2 Servo Temp', val: `${sensors.servoTemps?.j2 ?? 53.8} °C`, status: 'NOMINAL' },
    { label: 'Repeatability', val: `±${sensors.repeatability ?? 0.02} mm`, status: 'NOMINAL' },
  ];

  return (
    <div style={{
      background: '#0f172a', borderRadius: 'var(--radius-md)', border: '1px solid #1e293b', padding: '20px', color: '#f8fafc',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{machine.id} — {machine.name} Controller HMI</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{machine.manufacturer} {machine.model}</div>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
          background: machine.status === 'critical' ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.16)',
          color: machine.status === 'critical' ? '#fca5a5' : '#6ee7b7',
        }}>
          {machine.status.toUpperCase()} · {machine.health}%
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {metrics.map((m, idx) => (
          <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{m.label}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.status === 'ADVISORY' ? '#fbbf24' : '#f8fafc', marginTop: '4px' }}>
              {m.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
