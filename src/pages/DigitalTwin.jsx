/* ===================================================================
   Machine Digital Twin — 3D CAD, SCADA, FFT, 90D Dataset & Diagnostics
   =================================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Gauge, Waves, Activity, TrendingUp, AlertTriangle, Box, Layers,
  QrCode, Sliders, BarChart2, Bot, Wind, ShieldCheck, Thermometer, Droplets,
  Lock, Zap, RotateCcw, Play, Download
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { MACHINES as DEFAULT_MACHINES, generateSensorData, generatePrediction, generateHistoricalData } from '../data/factoryData';
import {
  fetchMachineTelemetry,
  fetchMachinePrediction,
  subscribeToLiveStream,
  triggerBackendSimulation,
  resetBackendSimulation,
  getDatasetExportUrl,
} from '../services/api';
import {
  HealthRing, ArcGauge, Badge, MachineSelector,
  HQCurve, WeibullPlot, ExportPdfButton, VibrationFFT, WhatIfSimulator
} from '../components/common';
import { Machine3DViewer } from '../components/digital-twin/Machine3DViewer';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { IndustrialTribologySuite } from '../components/digital-twin/IndustrialTribologySuite';
import { PumpSCADAView } from '../components/digital-twin/PumpSCADAView';
import { CNCSCADAView } from '../components/digital-twin/CNCSCADAView';
import { CompressorSCADAView } from '../components/digital-twin/CompressorSCADAView';

function DossierCard({ icon: Icon, title, rows }) {
  return (
    <div className="dossier-card">
      <div className="dossier-card__title">
        {Icon && <Icon size={13} strokeWidth={1.75} />}
        <span>{title}</span>
      </div>
      <div className="dossier-card__rows">
        {rows.map((item, i) => (
          <div key={i} className="dossier-card__row">
            <span className="dossier-card__label">{item.label}</span>
            <span className={`dossier-card__value ${item.warn ? 'dossier-card__value--warn' : ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

  useEffect(() => {
    let active = true;

    const loadAll = async () => {
      const [telData, predData] = await Promise.all([
        fetchMachineTelemetry(selectedMachineId, trendDays),
        fetchMachinePrediction(selectedMachineId),
      ]);
      if (!active) return;
      if (telData?.machine) setMachine(telData.machine);
      if (telData?.telemetry) setSensors(telData.telemetry);
      if (telData?.history?.length) setHistory(telData.history);
      if (predData) setPrediction(predData);
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

  const limits = sensors.alarmLimits || machine.alarmLimits || {};
  const tempAlarm = limits.temp ? `${limits.temp.h}° / ${limits.temp.hh}°C` : '70° / 85°C';
  const vibAlarm = limits.vib ? `${limits.vib.h} / ${limits.vib.hh} mm/s` : '3.5 / 5.5 mm/s';

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
              <span>Installed {machine.installDate}</span>
              <span>·</span>
              <Badge variant={machine.status}>{machine.status}</Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleFaultTest}
            className={simActive || machine.health < 70 ? 'btn btn--secondary' : 'btn btn--danger-outline'}
            title="Run or reset degradation stress simulation"
          >
            {simActive || machine.health < 70 ? <RotateCcw size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />}
            <span>{simActive ? 'Reset Asset' : machine.health < 70 ? 'Restore Baseline' : 'Simulate Fault'}</span>
          </button>

          <a
            href={getDatasetExportUrl(selectedMachineId, 'csv')}
            download={`${selectedMachineId}-telemetry-90d.csv`}
            className="btn btn--secondary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={14} strokeWidth={1.75} />
            <span>90D CSV</span>
          </a>

          <button onClick={() => setShowQRModal(true)} className="btn btn--secondary">
            <QrCode size={14} strokeWidth={1.75} />
            <span>Asset Tag</span>
          </button>

          <ExportPdfButton label="Report" />
          <HealthRing value={machine.health} size={72} label="Health" />
        </div>
      </div>

      {/* OEM Nameplate & ISA-18.2 Alarm Envelope Strip */}
      <div className="nameplate-strip">
        <div className="nameplate-item">
          <span className="nameplate-item__label">OEM Serial No.</span>
          <span className="nameplate-item__value">{machine.serialNumber || `${machine.id}-STD`}</span>
        </div>
        <div className="nameplate-item">
          <span className="nameplate-item__label">Nameplate Rating</span>
          <span className="nameplate-item__value">
            {machine.ratedPowerKw ?? 11} kW · {(machine.ratedVoltageV ?? 415) >= 1000 ? `${(machine.ratedVoltageV || 11000) / 1000} kV` : `${machine.ratedVoltageV ?? 415} V`} · {machine.ratedRpm === 0 ? '50 Hz' : `${machine.ratedRpm ?? 1450} RPM`}
          </span>
        </div>
        <div className="nameplate-item">
          <span className="nameplate-item__label">Bearing / Core Spec</span>
          <span className="nameplate-item__value" title={machine.bearingSpec}>{machine.bearingSpec || 'SKF Industrial'}</span>
        </div>
        <div className="nameplate-item">
          <span className="nameplate-item__label">Cumulative Hours</span>
          <span className="nameplate-item__value">{(machine.runtimeHours || 0).toLocaleString()} hrs</span>
        </div>
        <div className="nameplate-item">
          <span className="nameplate-item__label">ISA-18.2 Temp (H / HH)</span>
          <span className="nameplate-item__value">{tempAlarm}</span>
        </div>
        <div className="nameplate-item">
          <span className="nameplate-item__label">ISO Vib Limit (H / HH)</span>
          <span className="nameplate-item__value">{vibAlarm}</span>
        </div>
      </div>

      <div className="twin-tabs" role="tablist">
        {[
          { id: 'cad', label: '3D CAD & SCADA', icon: Box },
          { id: 'ai', label: 'Risk & 90-Day Trend', icon: TrendingUp },
          { id: 'fft', label: 'Vibration FFT', icon: Activity },
          { id: 'whatif', label: 'Operating Sandbox', icon: Sliders },
          { id: 'curves', label: 'H-Q & Weibull', icon: BarChart2 },
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
                <span>Machine Viewport</span>
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
              ) : (
                <AssetGenericSCADAView sensors={sensors} machine={machine} />
              )
            )}
          </div>

          {(machine.type?.includes('Pump') || selectedMachineId === 'P-101') && sensors.flowRate !== undefined && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Waves size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>Hydraulic & Seal Dossier (ISO 5199 / API 610)</span>
                </div>
                <span className="badge badge--info">KSB Etanorm SYT</span>
              </div>

              <div className="dossier-grid">
                <DossierCard
                  icon={Waves}
                  title="Hydraulic Flow & Head"
                  rows={[
                    { label: 'Discharge Flow', value: `${sensors.flowRate?.value ?? 28.5} L/s` },
                    { label: 'Volumetric Rate', value: `${Math.round((sensors.flowRate?.value ?? 28.5) * 3.6)} m³/h` },
                    { label: 'Discharge Head', value: `${Math.round((sensors.pressure?.value ?? 4.2) * 10.2)} m` },
                    { label: 'Line Pressure', value: `${sensors.pressure?.value ?? 4.2} bar`, warn: (sensors.pressure?.value ?? 4.2) < 3.0 },
                    { label: 'BEP Ratio', value: '88.5%' },
                  ]}
                />
                <DossierCard
                  icon={ShieldCheck}
                  title="Suction & Cavitation"
                  rows={[
                    { label: 'NPSH Available', value: `${sensors.npshAvailable?.value ?? 4.2} m` },
                    { label: 'NPSH Required', value: `${sensors.npshRequired?.value ?? 2.8} m` },
                    { label: 'Safety Margin', value: `+${sensors.npshMargin?.value ?? 1.4} m`, warn: (sensors.npshMargin?.value ?? 1.4) < 1.0 },
                    { label: 'Cavitation Risk', value: sensors.npshMargin?.risk ?? 'NORMAL', warn: sensors.npshMargin?.risk !== 'NORMAL' },
                    { label: 'Suction Specific Speed', value: '8,420 Nss' },
                  ]}
                />
                <DossierCard
                  icon={Lock}
                  title="API 682 Mechanical Seal"
                  rows={[
                    { label: 'Chamber Pressure', value: `${sensors.specifics?.sealChamberPressure ?? 3.8} bar` },
                    { label: 'Flush Plan', value: 'API Plan 11' },
                    { label: 'Recirculation Flow', value: '4.2 L/min' },
                    { label: 'Seal Barrier', value: 'Hermetic (0 ppm)' },
                    { label: 'DE Seal Temp', value: `${sensors.bearingDE?.value ?? 58.2} °C`, warn: (sensors.bearingDE?.value ?? 58.2) > 74 },
                  ]}
                />
                <DossierCard
                  icon={Zap}
                  title="Drive Motor & Tribology"
                  rows={[
                    { label: 'Shaft Speed', value: `${sensors.rpm?.value ?? 1450} RPM` },
                    { label: 'Active Power', value: `${sensors.activePower?.value ?? 10.8} kW` },
                    { label: 'Power Factor', value: `${sensors.powerFactor?.value ?? 0.88}` },
                    { label: 'NDE Bearing Temp', value: `${sensors.bearingNDE?.value ?? 52.4} °C`, warn: (sensors.bearingNDE?.value ?? 52.4) > 70 },
                    { label: 'Vibration RMS', value: `${sensors.vibration?.value ?? 1.85} mm/s`, warn: (sensors.vibration?.value ?? 1.85) > 2.8 },
                  ]}
                />
              </div>
            </div>
          )}

          {(machine.type?.includes('Milling') || machine.type?.includes('CNC') || selectedMachineId === 'CNC-001') && sensors.spindleSpeed !== undefined && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Gauge size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>Vertical Milling Engineering Dossier</span>
                </div>
                <span className="badge badge--info">Bridgeport Series II</span>
              </div>

              <div className="dossier-grid">
                <DossierCard
                  icon={Gauge}
                  title="Spindle Dynamics"
                  rows={[
                    { label: 'Speed', value: `${sensors.spindleSpeed} RPM`, warn: sensors.spindleSpeed > 8000 },
                    { label: 'Load', value: `${sensors.spindleLoad}%`, warn: sensors.spindleLoad > 80 },
                    { label: 'Torque', value: `${sensors.spindleTorque} N·m`, warn: sensors.spindleTorque > 50 },
                    { label: 'TIR Runout', value: `${sensors.spindleRunout} µm`, warn: sensors.spindleRunout > 5 },
                    { label: 'Chatter Vib', value: `${sensors.chatterVib} g`, warn: sensors.chatterVib > 2.5 },
                  ]}
                />
                <DossierCard
                  icon={Activity}
                  title="Axis DRO Position"
                  rows={[
                    { label: 'X-Axis', value: `${(sensors.axisPos?.x ?? 245.8).toFixed(2)} mm` },
                    { label: 'Y-Axis', value: `${(sensors.axisPos?.y ?? 112.4).toFixed(2)} mm` },
                    { label: 'Z-Axis', value: `${(sensors.axisPos?.z ?? -45.2).toFixed(2)} mm` },
                    { label: 'Feed Rate', value: `${sensors.feedRate} mm/min` },
                  ]}
                />
                <DossierCard
                  icon={Thermometer}
                  title="Thermal Compensation"
                  rows={[
                    { label: 'Z-Axis Drift', value: `${sensors.thermalDriftZ} µm`, warn: sensors.thermalDriftZ > 12 },
                    { label: 'DE Bearing', value: `${sensors.bearingDE?.value} °C`, warn: sensors.bearingDE?.value > 64 },
                    { label: 'NDE Bearing', value: `${sensors.bearingNDE?.value} °C`, warn: sensors.bearingNDE?.value > 60 },
                    { label: 'Ambient', value: `${sensors.ambientTemp?.value} °C` },
                    { label: 'ΔT Rise', value: `${sensors.deltaT?.value} °C`, warn: sensors.deltaT?.isExceeded },
                  ]}
                />
                <DossierCard
                  icon={Droplets}
                  title="Coolant & Power"
                  rows={[
                    { label: 'Coolant Pressure', value: `${sensors.coolantPressure} bar`, warn: sensors.coolantPressure < 3.5 },
                    { label: 'Coolant Flow', value: `${sensors.coolantFlow} L/min`, warn: sensors.coolantFlow < 15 },
                    { label: 'Active Power', value: `${sensors.activePower?.value} kW` },
                    { label: 'Power Factor', value: `${sensors.powerFactor?.value}`, warn: sensors.powerFactor?.value < 0.80 },
                    { label: 'Efficiency', value: `${sensors.efficiency?.value}%`, warn: sensors.efficiency?.value < 80 },
                  ]}
                />
              </div>
            </div>
          )}

          {(machine.type?.includes('Compressor') || selectedMachineId === 'COMP-201') && sensors.tankPressure !== undefined && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Wind size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>Pneumatic & Thermodynamic Dossier</span>
                </div>
                <span className="badge badge--info">Atlas Copco Automan</span>
              </div>

              <div className="dossier-grid">
                <DossierCard
                  icon={Wind}
                  title="Receiver Vessel"
                  rows={[
                    { label: 'Receiver Pressure', value: `${sensors.tankPressure} bar`, warn: sensors.tankPressure < 6.0 },
                    { label: 'ASME Rating', value: '16.0 bar' },
                    { label: 'Volume', value: '200 L' },
                    { label: 'Cut-In / Out', value: '6.2 – 8.5 bar' },
                    { label: 'Condensate Purge', value: 'Auto Timed' },
                  ]}
                />
                <DossierCard
                  icon={Thermometer}
                  title="Dual-Stage Compression"
                  rows={[
                    { label: 'Stage 1 Outlet', value: `${sensors.stage1Temp} °C`, warn: sensors.stage1Temp > 85 },
                    { label: 'Intercooler Drop', value: '-44.2 °C' },
                    { label: 'Stage 2 Cylinder', value: `${sensors.bearingDE?.value ?? 64.5} °C` },
                    { label: 'FAD Delivery', value: `${sensors.airDeliveryFAD} L/min`, warn: sensors.airDeliveryFAD < 700 },
                    { label: 'Polytropic n', value: '1.32' },
                  ]}
                />
                <DossierCard
                  icon={Gauge}
                  title="Drive & Vibration"
                  rows={[
                    { label: 'Belt Tension', value: `${sensors.beltTension}%`, warn: sensors.beltTension < 85 },
                    { label: 'Pulley Ratio', value: '4.88 : 1' },
                    { label: 'Motor Rating', value: '22.0 kW TEFC' },
                    { label: 'Vibration RMS', value: `${sensors.vibration?.value ?? 1.75} mm/s` },
                    { label: 'ISO 10816', value: 'Class III' },
                  ]}
                />
                <DossierCard
                  icon={Droplets}
                  title="Air Quality"
                  rows={[
                    { label: 'Dew Point', value: `+${sensors.dewPoint} °C`, warn: sensors.dewPoint > 7.0 },
                    { label: 'ISO 8573-1', value: 'Class 4' },
                    { label: 'Separator ΔP', value: `${sensors.separatorDeltaP} bar`, warn: sensors.separatorDeltaP > 0.6 },
                    { label: 'Oil Carryover', value: '< 3 mg/m³' },
                    { label: 'Unloader State', value: 'Sealed' },
                  ]}
                />
              </div>
            </div>
          )}

          {(machine.type?.includes('Robot') || selectedMachineId === 'ROB-001') && sensors.jointAngles !== undefined && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Bot size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>6-Axis Kinematic Dossier</span>
                </div>
                <span className="badge badge--info">KUKA KR 210 R2700</span>
              </div>

              <div className="dossier-grid">
                <DossierCard
                  icon={Bot}
                  title="Joint Angles"
                  rows={[
                    { label: 'J1 Turntable', value: `${(sensors.jointAngles?.j1 ?? 42.5).toFixed(1)}°` },
                    { label: 'J2 Shoulder', value: `${(sensors.jointAngles?.j2 ?? -28.3).toFixed(1)}°` },
                    { label: 'J3 Elbow', value: `${(sensors.jointAngles?.j3 ?? 74.1).toFixed(1)}°` },
                    { label: 'J4 Wrist Roll', value: `${(sensors.jointAngles?.j4 ?? 12.4).toFixed(1)}°` },
                    { label: 'J5 Wrist Pitch', value: `${(sensors.jointAngles?.j5 ?? -45.6).toFixed(1)}°` },
                    { label: 'J6 Tool Flange', value: `${(sensors.jointAngles?.j6 ?? 88.2).toFixed(1)}°` },
                  ]}
                />
                <DossierCard
                  icon={Activity}
                  title="Tool Center Point"
                  rows={[
                    { label: 'Cartesian X/Y/Z', value: `${sensors.tcpPosition?.x}, ${sensors.tcpPosition?.y}, ${sensors.tcpPosition?.z}` },
                    { label: 'Path Velocity', value: `${sensors.tcpVelocity} mm/s` },
                    { label: 'Repeatability', value: `±${sensors.repeatability} mm` },
                    { label: 'Cycle Time', value: `${sensors.cycleTime} s` },
                  ]}
                />
                <DossierCard
                  icon={Gauge}
                  title="Payload & Torque"
                  rows={[
                    { label: 'Active Payload', value: `${sensors.activePayload} / ${sensors.maxPayload} kg` },
                    { label: 'Payload Ratio', value: `${sensors.payloadRatio}%` },
                    { label: 'J2 Torque', value: `${sensors.jointTorques?.j2} N·m` },
                    { label: 'Harmonic Backlash', value: `${sensors.harmonicBacklash} arcmin` },
                    { label: 'J2 Servo Temp', value: `${sensors.servoTemps?.j2} °C` },
                  ]}
                />
                <DossierCard
                  icon={Zap}
                  title="Gripper & Output"
                  rows={[
                    { label: 'Gripper Pressure', value: `${sensors.gripperPressure} bar` },
                    { label: 'Parts Today', value: `${sensors.partsCountToday} units` },
                    { label: 'Part Detect', value: 'Engaged' },
                    { label: 'Tool Flange RTD', value: `${sensors.bearingNDE?.value} °C` },
                  ]}
                />
              </div>
            </div>
          )}

          {(machine.type?.includes('Transformer') || selectedMachineId === 'XFMR-302') && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Zap size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>IEEE C57.104 Dissolved Gas & Thermal Dossier</span>
                </div>
                <span className="badge badge--info">{sensors.dgaCondition || 'Condition 1 (Normal)'}</span>
              </div>

              <div className="dossier-grid">
                <DossierCard
                  icon={Thermometer}
                  title="Thermal & Winding"
                  rows={[
                    { label: 'Top Oil Temp', value: `${sensors.topOilTemp ?? 48.2} °C`, warn: (sensors.topOilTemp ?? 48) > 75 },
                    { label: 'Winding Hotspot', value: `${sensors.windingHotspotTemp ?? 58.4} °C`, warn: (sensors.windingHotspotTemp ?? 58) > 88 },
                    { label: 'Ambient Sub', value: `${sensors.ambientTemp?.value ?? 35.0} °C` },
                    { label: 'Thermal Rise ΔT', value: `${sensors.deltaT?.value ?? 20.1} °C` },
                  ]}
                />
                <DossierCard
                  icon={Activity}
                  title="DGA Key Gases (ppm)"
                  rows={[
                    { label: 'Hydrogen (H₂)', value: `${sensors.hydrogenGas ?? 24} ppm`, warn: (sensors.hydrogenGas ?? 24) > 80 },
                    { label: 'Methane (CH₄)', value: `${sensors.methaneGas ?? 18} ppm` },
                    { label: 'Ethylene (C₂H₄)', value: `${sensors.ethyleneGas ?? 14} ppm` },
                    { label: 'Acetylene (C₂H₂)', value: `${sensors.acetyleneGas ?? 2} ppm`, warn: (sensors.acetyleneGas ?? 2) > 10 },
                    { label: 'Carbon Monoxide', value: `${sensors.carbonMonoxide ?? 210} ppm` },
                  ]}
                />
                <DossierCard
                  icon={Droplets}
                  title="Dielectric Integrity"
                  rows={[
                    { label: 'BDV Strength', value: `${sensors.breakdownVoltage ?? 60} kV`, warn: (sensors.breakdownVoltage ?? 60) < 40 },
                    { label: 'Moisture Content', value: `${sensors.moisturePpm ?? 13} ppm` },
                    { label: 'Conservator Press', value: `${sensors.pressure?.value ?? 1.15} bar` },
                    { label: 'Buchholz Gas', value: 'Zero Trip' },
                  ]}
                />
                <DossierCard
                  icon={Zap}
                  title="11kV / 415V Load"
                  rows={[
                    { label: 'Active Substation Load', value: `${sensors.activePower?.value ?? 565} kW` },
                    { label: 'Power Factor', value: `${sensors.powerFactor?.value ?? 0.89}` },
                    { label: 'HV Line Current', value: `${sensors.current?.value ?? 42.1} A` },
                    { label: 'Core Magnetostriction', value: `${sensors.vibration?.value ?? 0.52} mm/s` },
                  ]}
                />
              </div>
            </div>
          )}

          {(machine.type?.includes('Conveyor') || selectedMachineId === 'CONV-401') && (
            <div className="twin-panel">
              <div className="twin-panel__title">
                <div className="twin-panel__title-left">
                  <Activity size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                  <span>Belt Drive & Roller Tribology Dossier</span>
                </div>
                <span className="badge badge--info">Dorner 2200 Series</span>
              </div>
              <div className="dossier-grid">
                <DossierCard
                  icon={Gauge}
                  title="Drive & Tracking"
                  rows={[
                    { label: 'Belt Tension', value: `${sensors.beltTension ?? 94}%`, warn: (sensors.beltTension ?? 94) < 85 },
                    { label: 'Motor Slip', value: `${sensors.motorSlip ?? 2.4}%`, warn: (sensors.motorSlip ?? 2.4) > 3.8 },
                    { label: 'Line Speed', value: `${sensors.beltSpeedMps ?? 1.42} m/s` },
                    { label: 'Drive Speed', value: `${sensors.rpm?.value ?? 960} RPM` },
                  ]}
                />
                <DossierCard
                  icon={Thermometer}
                  title="Pillow Bearings & Power"
                  rows={[
                    { label: 'DE Pillow Temp', value: `${sensors.bearingDE?.value ?? 51.2} °C` },
                    { label: 'PeakVue Envelope', value: `${sensors.vibrationEnvelope?.value ?? 0.62} gE` },
                    { label: 'Motor Current', value: `${sensors.current?.value ?? 8.9} A` },
                    { label: 'Line Efficiency', value: `${sensors.efficiency?.value ?? 89.2}%` },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <Activity size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Primary Sensor Gauges</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1.2s telemetry interval</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {[
                { label: selectedMachineId === 'XFMR-302' ? 'Winding Hotspot' : 'Bearing DE', value: sensors.bearingDE?.value ?? sensors.temperature.value, unit: '°C', min: 15, max: 105, warning: sensors.bearingDE?.warning ?? 74, critical: sensors.bearingDE?.critical ?? 86 },
                { label: 'ISO Vibration', value: sensors.vibration.value, unit: sensors.vibration.unit, min: sensors.vibration.min, max: sensors.vibration.max, warning: sensors.vibration.warning, critical: sensors.vibration.critical },
                { label: 'PeakVue Shock', value: sensors.vibrationEnvelope?.value ?? 0.5, unit: 'gE', min: 0, max: 4.5, warning: 1.5, critical: 2.8 },
                { label: 'Active Power', value: sensors.activePower?.value ?? 14, unit: 'kW', min: 0, max: selectedMachineId === 'XFMR-302' ? 1000 : Math.max(30, (machine.ratedPowerKw || 20) * 1.4) },
                { label: selectedMachineId === 'XFMR-302' ? 'Oil Pressure' : 'Motor RPM', value: selectedMachineId === 'XFMR-302' ? sensors.pressure.value : sensors.rpm.value, unit: selectedMachineId === 'XFMR-302' ? 'bar' : 'RPM', min: 0, max: selectedMachineId === 'XFMR-302' ? 2.5 : sensors.rpm.max, warning: selectedMachineId === 'XFMR-302' ? 1.5 : sensors.rpm.warning, critical: selectedMachineId === 'XFMR-302' ? 1.8 : sensors.rpm.critical },
                { label: 'Efficiency', value: sensors.efficiency.value, unit: sensors.efficiency.unit, min: 0, max: 100 },
              ].map((g, idx) => (
                <ArcGauge
                  key={idx}
                  label={g.label}
                  value={g.value}
                  unit={g.unit}
                  min={g.min}
                  max={g.max}
                  warning={g.warning}
                  critical={g.critical}
                  size={132}
                />
              ))}
            </div>
          </div>

          <IndustrialTribologySuite machine={machine} sensors={sensors} />
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="twin-grid">
          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <AlertTriangle size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Failure Risk & Remaining Useful Life</span>
              </div>
              <Badge variant={prediction.riskLevel === 'CRITICAL' ? 'critical' : prediction.riskLevel === 'HIGH' ? 'warning' : 'healthy'}>
                {prediction.riskLevel}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-5)', alignItems: 'center' }}>
              <HealthRing
                value={Math.max(0, 100 - prediction.failureProbability)}
                size={96}
                label="Safety"
              />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Failure Probability</div>
                  <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: prediction.failureProbability > 50 ? 'var(--status-critical)' : 'var(--status-warning)' }}>
                    {prediction.failureProbability}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Remaining Useful Life</div>
                  <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                    {prediction.remainingUsefulLife} <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>days</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Weibull Hazard Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prediction.failureModes.slice(0, 4).map((mode, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  padding: '10px 12px', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--fs-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{mode.mode}</span>
                    <span className="tabular-nums" style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-semibold)',
                      color: mode.probability > 50 ? 'var(--status-critical)'
                        : mode.probability > 25 ? 'var(--status-warning)'
                        : 'var(--status-healthy)'
                    }}>
                      {Math.max(0, mode.probability)}%
                    </span>
                  </div>
                  {mode.indicator && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{mode.indicator}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <TrendingUp size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>{trendDays}-Day Multi-Channel Telemetry</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="segmented-control">
                  {[
                    { id: 'health-temp', label: 'Health & Temp' },
                    { id: 'vib-envelope', label: 'Vib & PeakVue' },
                    { id: 'eff-power', label: 'Eff & Power' },
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
              <ResponsiveContainer width="100%" height={300}>
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
                      <Area type="monotone" dataKey="bearingDE" stroke="#b45309" fill="url(#tempGradient)" strokeWidth={2} name="Bearing DE °C" isAnimationActive={false} />
                    </>
                  )}
                  {trendChannel === 'vib-envelope' && (
                    <>
                      <Area type="monotone" dataKey="vibration" stroke="#1d4ed8" fill="url(#healthGradient)" strokeWidth={2} name="ISO Vibration mm/s" isAnimationActive={false} />
                      <Area type="monotone" dataKey="vibrationEnvelope" stroke="#b91c1c" fill="url(#tempGradient)" strokeWidth={2} name="PeakVue gE" isAnimationActive={false} />
                    </>
                  )}
                  {trendChannel === 'eff-power' && (
                    <>
                      <Area type="monotone" dataKey="efficiency" stroke="#047857" fill="url(#healthGradient)" strokeWidth={2} name="Efficiency %" isAnimationActive={false} />
                      <Area type="monotone" dataKey="activePowerKw" stroke="#1d4ed8" fill="url(#tempGradient)" strokeWidth={2} name="Active Power kW" isAnimationActive={false} />
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
          <VibrationFFT
            machineId={selectedMachineId}
            vibration={sensors.vibration.value}
            rpm={sensors.rpm.value}
            health={machine.health}
            bearingGeometry={machine.bearingGeometry}
            bearingSpec={machine.bearingSpec}
          />
        </div>
      )}

      {activeTab === 'whatif' && (
        <div className="twin-panel">
          <WhatIfSimulator
            machineId={selectedMachineId}
            baseHealth={machine.health}
            baseRUL={prediction.remainingUsefulLife}
            ratedRpm={machine.ratedRpm ?? 1450}
            machineName={machine.name}
          />
        </div>
      )}

      {activeTab === 'curves' && (
        <div className="twin-grid">
          <div className="twin-panel">
            <HQCurve flowRate={sensors.flowRate.value} health={machine.health} />
          </div>
          <div className="twin-panel">
            <WeibullPlot
              currentHours={machine.runtimeHours || 24000}
              beta={machine.weibullBeta || 2.35}
              eta={machine.weibullEta || 32000}
            />
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

function AssetGenericSCADAView({ sensors, machine }) {
  const isRobot = machine.id === 'ROB-001';
  const isTransformer = machine.id === 'XFMR-302';

  const metrics = isRobot
    ? [
        { label: 'TCP Velocity', val: `${sensors.tcpVelocity ?? 1250} mm/s`, status: 'NOMINAL' },
        { label: 'Active Payload', val: `${sensors.activePayload ?? 142} / 210 kg`, status: 'NOMINAL' },
        { label: 'Harmonic Backlash', val: `${sensors.harmonicBacklash ?? 0.42} arcmin`, status: (sensors.harmonicBacklash ?? 0.42) > 0.8 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Gripper Pressure', val: `${sensors.gripperPressure ?? 6.2} bar`, status: 'NOMINAL' },
        { label: 'J2 Servo Temp', val: `${sensors.servoTemps?.j2 ?? 53.8} °C`, status: 'NOMINAL' },
        { label: 'ISO Repeatability', val: `±${sensors.repeatability ?? 0.02} mm`, status: 'NOMINAL' },
      ]
    : isTransformer
    ? [
        { label: 'Top Oil Temp (IEC 60076)', val: `${sensors.topOilTemp ?? 48.2} °C`, status: (sensors.topOilTemp ?? 48) > 65 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Winding Hotspot RTD', val: `${sensors.windingHotspotTemp ?? 58.4} °C`, status: (sensors.windingHotspotTemp ?? 58) > 85 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Dissolved Hydrogen (H₂)', val: `${sensors.hydrogenGas ?? 24} ppm`, status: (sensors.hydrogenGas ?? 24) > 80 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Acetylene (C₂H₂)', val: `${sensors.acetyleneGas ?? 2} ppm`, status: (sensors.acetyleneGas ?? 2) > 10 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Dielectric Strength', val: `${sensors.breakdownVoltage ?? 61} kV`, status: (sensors.breakdownVoltage ?? 61) < 40 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Active Load (11kV)', val: `${sensors.activePower?.value ?? 565} kW`, status: 'NOMINAL' },
      ]
    : [
        { label: 'Belt Tension', val: `${sensors.beltTension ?? 95}%`, status: (sensors.beltTension ?? 95) < 85 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Motor Slip', val: `${sensors.motorSlip ?? 2.4}%`, status: (sensors.motorSlip ?? 2.4) > 3.8 ? 'ADVISORY' : 'NOMINAL' },
        { label: 'Head Pulley Vib', val: `${sensors.vibration?.value ?? 1.2} mm/s`, status: 'NOMINAL' },
        { label: 'Gearbox Bearing DE', val: `${sensors.bearingDE?.value ?? 54.0} °C`, status: 'NOMINAL' },
        { label: 'Motor Current', val: `${sensors.current?.value ?? 9.2} A`, status: 'NOMINAL' },
        { label: 'Line Efficiency', val: `${sensors.efficiency?.value ?? 90.0}%`, status: 'NOMINAL' },
      ];

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: 'var(--radius-md)',
      border: '1px solid #1e293b',
      padding: '20px',
      color: '#f8fafc',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {machine.id} — {machine.name} SCADA Matrix
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {machine.manufacturer} {machine.model}
          </div>
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
          <div key={idx} style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{m.label}</div>
            <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.status === 'ADVISORY' ? '#fbbf24' : '#f8fafc', marginTop: '4px' }}>
              {m.val}
            </div>
            <div style={{ fontSize: '11px', color: m.status === 'ADVISORY' ? '#fbbf24' : '#34d399', marginTop: '4px', fontWeight: 600 }}>
              {m.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
