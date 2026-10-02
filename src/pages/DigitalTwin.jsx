/* ===================================================================
   Module 2 — Machine Digital Twin (Dynamic per Machine)
   =================================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Thermometer, Gauge, Waves, RotateCw, Zap,
  Activity, Shield, Clock, Wrench, TrendingUp, AlertTriangle, Box, Layers,
  QrCode, Sliders, BarChart2, Bot, Wind
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { MACHINES, generateSensorData, generatePrediction, generateHistoricalData } from '../data/factoryData';
import {
  HealthRing, ArcGauge, SensorGauge, Badge, StatusDot, MachineSelector,
  HQCurve, WeibullPlot, ExportPdfButton, VibrationFFT, WhatIfSimulator
} from '../components/common';
import { Machine3DViewer } from '../components/digital-twin/Machine3DViewer';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { IndustrialTribologySuite } from '../components/digital-twin/IndustrialTribologySuite';
import { PumpSCADAView } from '../components/digital-twin/PumpSCADAView';
import { CNCSCADAView } from '../components/digital-twin/CNCSCADAView';
import { CompressorSCADAView } from '../components/digital-twin/CompressorSCADAView';

export default function DigitalTwin() {
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [activeTab, setActiveTab] = useState('cad'); // 'cad' | 'fft' | 'whatif' | 'curves'
  const [showQRModal, setShowQRModal] = useState(false);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowQRModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              background: '#f8fafc', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <QrCode size={14} />
            <span>Asset QR Tag</span>
          </button>

          <ExportPdfButton label="Export Twin Report" />
          <HealthRing value={machine.health} size={84} label="Health" />
        </div>
      </div>

      {/* Engineering Workbench Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: 'var(--sp-6)', overflowX: 'auto',
        borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px'
      }}>
        {[
          { id: 'cad', label: '3D CAD & SCADA Telemetry', icon: Box },
          { id: 'ai', label: 'AI Risk & 30-Day Trends', icon: TrendingUp },
          { id: 'fft', label: 'Vibration FFT Spectrum', icon: Activity },
          { id: 'whatif', label: '"What-If" Stress Sandbox', icon: Sliders },
          { id: 'curves', label: 'H-Q & Reliability Curves', icon: BarChart2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--accent-blue)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.25)' : 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))',
                transition: 'all 0.2s ease'
              }}
            >
              <TabIcon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 3D CAD & SCADA Telemetry View */}
      {activeTab === 'cad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {/* Hero 3D Digital Twin Viewer */}
          <div className="twin-panel" style={{ padding: '24px' }}>
            <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} className="twin-panel__title-icon" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Interactive 3D Machine Digital Twin
                </span>
                <span style={{
                  fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)',
                  padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 500
                }}>
                  WebGL CAD Mesh • Real-Time Spatial Heat Conduction
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('3D')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                    background: viewMode === '3D' ? 'var(--accent-blue)' : '#f1f5f9',
                    color: viewMode === '3D' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Box size={14} />
                  3D CAD Twin
                </button>
                <button
                  onClick={() => setViewMode('2D')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                    background: viewMode === '2D' ? 'var(--accent-blue)' : '#f1f5f9',
                    color: viewMode === '2D' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={14} />
                  2D SCADA View
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
                <div className="pump-diagram">
                  <PumpSVG sensors={sensors} machine={machine} />
                </div>
              )
            )}
          </div>

          {/* P-101 Machine Engineering Dossier (Only for Centrifugal Pumps) */}
          {(machine.type?.includes('Pump') || selectedMachineId === 'P-101') && sensors.flowRate !== undefined && (
            <div className="twin-panel" style={{ padding: '24px' }}>
              <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Waves size={18} className="twin-panel__title-icon" style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ISO 5199 / API 610 Centrifugal Pump — Hydraulic Engineering Dossier
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.08)',
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 700, letterSpacing: '0.04em'
                  }}>
                    KSB ETANORM SYT 065-040-250
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
                  Live Hydraulic Stream
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Hydraulic Flow & Head Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🌊 Hydraulic Flow & Head
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Discharge Flow', value: `${sensors.flowRate?.value ?? 48.5} L/s`, warn: false },
                      { label: 'Volumetric Rate', value: `${Math.round((sensors.flowRate?.value ?? 48.5) * 3.6)} m³/h`, warn: false },
                      { label: 'Discharge Head', value: `${Math.round((sensors.pressure?.value ?? 4.2) * 10.2)} m`, warn: false },
                      { label: 'System Pressure', value: `${sensors.pressure?.value ?? 4.2} bar`, warn: (sensors.pressure?.value ?? 4.2) < 3.0 },
                      { label: 'BEP Operating Point', value: '88.5% (Optimal)', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cavitation Inception & NPSH Margin Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-healthy)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🛡 Suction & Cavitation (NPSH)
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'NPSH Available (a)', value: `${sensors.npshAvailable?.value ?? 4.2} m`, warn: false },
                      { label: 'NPSH Required (r)', value: `${sensors.npshRequired?.value ?? 2.8} m`, warn: false },
                      { label: 'Safety Margin (a - r)', value: `+${sensors.npshMargin?.value ?? 1.4} m`, warn: (sensors.npshMargin?.value ?? 1.4) < 1.0 },
                      { label: 'Cavitation Risk', value: sensors.npshMargin?.risk ?? 'NORMAL', warn: sensors.npshMargin?.risk !== 'NORMAL' },
                      { label: 'Suction Specific Speed', value: '8,420 Nss', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API 682 Mechanical Seal Tribology Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.03) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🔒 API 682 Mechanical Seal
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Chamber Pressure', value: `${sensors.specifics?.sealChamberPressure ?? 3.8} bar`, warn: false },
                      { label: 'Flush Piping Plan', value: 'API Plan 11', warn: false },
                      { label: 'Flush Recirc Flow', value: '4.2 L/min', warn: false },
                      { label: 'Seal Face Barrier', value: 'Hermetic / 0 ppm', warn: false },
                      { label: 'DE Seal Temp', value: `${sensors.bearingDE?.value ?? 68.2} °C`, warn: (sensors.bearingDE?.value ?? 68.2) > 75 },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drive Motor & ISO 10816 Tribology Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(239, 68, 68, 0.03) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ⚡ Drive Motor & Tribology
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Shaft Speed', value: `${sensors.rpm?.value ?? 2950} RPM`, warn: false },
                      { label: 'Active Power', value: `${sensors.activePower?.value ?? 14.2} kW`, warn: false },
                      { label: 'Power Factor', value: `${sensors.powerFactor?.value ?? 0.88} cos φ`, warn: false },
                      { label: 'NDE Bearing Temp', value: `${sensors.bearingNDE?.value ?? 52.4} °C`, warn: (sensors.bearingNDE?.value ?? 52.4) > 70 },
                      { label: 'Vibration RMS', value: `${sensors.vibration?.value ?? 1.85} mm/s`, warn: (sensors.vibration?.value ?? 1.85) > 2.8 },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CNC-001 Machine Engineering Dossier (Only for Milling Machines) */}
          {(machine.type?.includes('Milling') || machine.type?.includes('CNC') || selectedMachineId === 'CNC-001') && sensors.spindleSpeed !== undefined && (
            <div className="twin-panel" style={{ padding: '24px' }}>
              <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gauge size={18} className="twin-panel__title-icon" />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    CNC Vertical Milling — Machine Engineering Dossier
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#3b82f6', background: 'rgba(37, 99, 235, 0.08)',
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 700, letterSpacing: '0.04em'
                  }}>
                    BRIDGEPORT SERIES II
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
                  Live Telemetry
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Spindle Dynamics Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(139, 92, 246, 0.03) 100%)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ⚙ Spindle Dynamics
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Speed', value: `${sensors.spindleSpeed} RPM`, warn: sensors.spindleSpeed > 8000 },
                      { label: 'Load', value: `${sensors.spindleLoad}%`, warn: sensors.spindleLoad > 80 },
                      { label: 'Torque', value: `${sensors.spindleTorque} N·m`, warn: sensors.spindleTorque > 50 },
                      { label: 'TIR Runout', value: `${sensors.spindleRunout} µm`, warn: sensors.spindleRunout > 5 },
                      { label: 'Chatter Vib', value: `${sensors.chatterVib} g`, warn: sensors.chatterVib > 2.5 },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Axis Position Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(16, 185, 129, 0.03) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan, #06b6d4)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    📐 Axis DRO Position (mm)
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { axis: 'X', value: sensors.axisPos?.x ?? 245.80, color: '#ef4444' },
                      { axis: 'Y', value: sensors.axisPos?.y ?? 112.40, color: '#10b981' },
                      { axis: 'Z', value: sensors.axisPos?.z ?? -45.20, color: '#3b82f6' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            background: `${item.color}15`, color: item.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 800
                          }}>{item.axis}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.axis}-Axis</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Feed Rate</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {sensors.feedRate} mm/min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thermal Compensation Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(239, 68, 68, 0.03) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🌡 Thermal Compensation
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Z-Axis Drift', value: `${sensors.thermalDriftZ} µm`, warn: sensors.thermalDriftZ > 12 },
                      { label: 'DE Bearing', value: `${sensors.bearingDE?.value} °C`, warn: sensors.bearingDE?.value > 72 },
                      { label: 'NDE Bearing', value: `${sensors.bearingNDE?.value} °C`, warn: sensors.bearingNDE?.value > 68 },
                      { label: 'Ambient', value: `${sensors.ambientTemp?.value} °C`, warn: false },
                      { label: 'ΔT Rise', value: `${sensors.deltaT?.value} °C`, warn: sensors.deltaT?.isExceeded },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coolant System Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-healthy)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    💧 Coolant & Lubrication System
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Coolant Pressure', value: `${sensors.coolantPressure} bar`, warn: sensors.coolantPressure < 3.5 },
                      { label: 'Coolant Flow', value: `${sensors.coolantFlow} L/min`, warn: sensors.coolantFlow < 15 },
                      { label: 'Active Power', value: `${sensors.activePower?.value} kW`, warn: false },
                      { label: 'Power Factor', value: `${sensors.powerFactor?.value} cos φ`, warn: sensors.powerFactor?.value < 0.80 },
                      { label: 'Efficiency', value: `${sensors.efficiency?.value}%`, warn: sensors.efficiency?.value < 80 },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMP-201 Machine Engineering Dossier (Only for Air Compressors) */}
          {(machine.type?.includes('Compressor') || selectedMachineId === 'COMP-201') && sensors.tankPressure !== undefined && (
            <div className="twin-panel" style={{ padding: '24px' }}>
              <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wind size={18} className="twin-panel__title-icon" style={{ color: 'var(--accent-blue)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Dual-Stage Air Compressor — Pneumatic & Thermodynamic Dossier
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#0284c7', background: 'rgba(2, 132, 199, 0.08)',
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 700, letterSpacing: '0.04em'
                  }}>
                    ATLAS COPCO AUTOMAN AT-SERIES
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
                  Live Pneumatic Stream
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Receiver Vessel Dynamics */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  border: '1px solid rgba(2, 132, 199, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    💨 Pneumatic Storage & Vessel
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Receiver Pressure', value: `${sensors.tankPressure} bar`, warn: sensors.tankPressure < 6.0 },
                      { label: 'ASME Design Rating', value: '16.0 bar (Hydrotested)', warn: false },
                      { label: 'Storage Capacity', value: '200 L (Water Volume)', warn: false },
                      { label: 'Cut-In / Cut-Out Band', value: '6.2 - 8.5 bar', warn: false },
                      { label: 'Condensate Purge', value: 'Auto Timed / Low Sump', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thermodynamic Stage 1 & 2 Compression */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(239, 68, 68, 0.03) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🔥 Dual-Stage Compression Head
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Stage 1 (LP) Outlet', value: `${sensors.stage1Temp} °C`, warn: sensors.stage1Temp > 85 },
                      { label: 'Intercooler Heat Drop', value: '-44.2 °C (Forced Air)', warn: false },
                      { label: 'Stage 2 (HP) Cylinder', value: `${sensors.bearingDE?.value ?? 74.5} °C`, warn: false },
                      { label: 'FAD Air Delivery', value: `${sensors.airDeliveryFAD} L/min`, warn: sensors.airDeliveryFAD < 700 },
                      { label: 'Polytropic Exponent (n)', value: '1.32 (Intercooled)', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* V-Belt & Drive Transmission */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-healthy)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ⚙ V-Belt Transmission & Pulleys
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'V-Belt Tension', value: `${sensors.beltTension}%`, warn: sensors.beltTension < 85 },
                      { label: 'Pulley Speed Ratio', value: '4.88 : 1 (1450 → 297 RPM)', warn: false },
                      { label: 'Motor Rating', value: '5.5 kW TEFC (400V 3Ø)', warn: false },
                      { label: 'RMS Vibration', value: `${sensors.vibration?.value ?? 1.45} mm/s`, warn: false },
                      { label: 'ISO 10816 Zone', value: 'Zone A (Newly Commissioned)', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Air Quality & Separation Filter */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    💧 Air Quality & Sintered Filter
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { label: 'Pressure Dew Point', value: `+${sensors.dewPoint} °C`, warn: sensors.dewPoint > 7.0 },
                      { label: 'ISO 8573-1 Class', value: 'Class 4 (Industrial Clean)', warn: false },
                      { label: 'Separator Delta P', value: `${sensors.separatorDeltaP} bar`, warn: sensors.separatorDeltaP > 0.6 },
                      { label: 'Oil Carryover', value: '< 3 mg/m³', warn: false },
                      { label: 'Condor Unloader State', value: 'Sealed (Normal Charging)', warn: false },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                          color: item.warn ? 'var(--status-warning)' : 'var(--text-primary)'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROB-001 Machine Engineering Dossier (Only for Robotic Manipulators) */}
          {(machine.type?.includes('Robot') || selectedMachineId === 'ROB-001') && sensors.jointAngles !== undefined && (
            <div className="twin-panel" style={{ padding: '24px' }}>
              <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bot size={18} className="twin-panel__title-icon" />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    6-Axis Industrial Robotic Manipulator — Kinematic Engineering Dossier
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#ec4899', background: 'rgba(236, 72, 153, 0.08)',
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 700, letterSpacing: '0.04em'
                  }}>
                    KUKA KR 210 R2700
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
                  Live Kinematics
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* 6-Axis Joint DRO Angles Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.04) 0%, rgba(139, 92, 246, 0.03) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#ec4899', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🤖 6-Axis Joint Positions (°)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { axis: 'J1', name: 'Base Turntable', val: sensors.jointAngles?.j1 ?? 42.5, color: '#ec4899' },
                      { axis: 'J2', name: 'Shoulder Link', val: sensors.jointAngles?.j2 ?? -28.3, color: '#f59e0b' },
                      { axis: 'J3', name: 'Elbow Joint', val: sensors.jointAngles?.j3 ?? 74.1, color: '#3b82f6' },
                      { axis: 'J4', name: 'Wrist Roll', val: sensors.jointAngles?.j4 ?? 12.4, color: '#8b5cf6' },
                      { axis: 'J5', name: 'Wrist Pitch', val: sensors.jointAngles?.j5 ?? -45.6, color: '#06b6d4' },
                      { axis: 'J6', name: 'Tool Flange', val: sensors.jointAngles?.j6 ?? 88.2, color: '#10b981' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.axis}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.val.toFixed(1)}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tool Center Point (TCP) Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(16, 185, 129, 0.03) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#06b6d4', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🎯 Tool Center Point (TCP)
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cartesian (mm)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        X:{sensors.tcpPosition?.x} Y:{sensors.tcpPosition?.y} Z:{sensors.tcpPosition?.z}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Path Velocity</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {sensors.tcpVelocity} mm/s
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Repeatability</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                        ±{sensors.repeatability} mm
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cycle Time</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sensors.cycleTime} s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payload & Joint Dynamics Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(239, 68, 68, 0.03) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-amber)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ⚖ Payload & Joint Torques
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Payload</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sensors.activePayload} / {sensors.maxPayload} kg ({sensors.payloadRatio}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>J2 Shoulder Torque</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--status-warning)' }}>
                        {sensors.jointTorques?.j2} N·m
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Harmonic Backlash</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sensors.harmonicBacklash} arcmin
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Shoulder Servo Temp</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                        {sensors.servoTemps?.j2} °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gripper Tooling & End-Effector Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-healthy)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ⚡ Gripper Tooling & Production
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gripper Pressure</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                        {sensors.gripperPressure} bar
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Parts Picked Today</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {sensors.partsCountToday} units
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Part Detect Sensor</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                        ✓ Locked / Engaged
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tool Flange RTD</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sensors.bearingNDE?.value} °C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-time SCADA Speedometer Arc Gauges (Spacious Full-Width 6-Column Ribbon) */}
          <div className="twin-panel" style={{ padding: '24px' }}>
            <div className="twin-panel__title" style={{ justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} className="twin-panel__title-icon" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live SCADA Speedometer Telemetry
                </span>
                <span style={{
                  fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)',
                  padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 500
                }}>
                  Calibrated Continuous Plant Sensor Stream
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)' }} />
                Streaming Live: 1500ms
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {[
                { label: "Bearing Temp", value: sensors.temperature.value, unit: sensors.temperature.unit, min: sensors.temperature.min, max: sensors.temperature.max, warning: sensors.temperature.warning, critical: sensors.temperature.critical, badge: "THERMAL" },
                { label: "ISO Vibration", value: sensors.vibration.value, unit: sensors.vibration.unit, min: sensors.vibration.min, max: sensors.vibration.max, warning: sensors.vibration.warning, critical: sensors.vibration.critical, badge: "VELOCITY RMS" },
                { label: "Line Pressure", value: sensors.pressure.value, unit: sensors.pressure.unit, min: sensors.pressure.min, max: sensors.pressure.max, badge: "HYDRAULIC" },
                { label: "Flow Rate", value: sensors.flowRate.value, unit: sensors.flowRate.unit, min: sensors.flowRate.min, max: sensors.flowRate.max, badge: "VOLUMETRIC" },
                { label: "Motor RPM", value: sensors.rpm.value, unit: sensors.rpm.unit, min: sensors.rpm.min, max: sensors.rpm.max, warning: sensors.rpm.warning, critical: sensors.rpm.critical, badge: "SPEED" },
                { label: "Efficiency", value: sensors.efficiency.value, unit: sensors.efficiency.unit, min: sensors.efficiency.min, max: sensors.efficiency.max, warning: sensors.efficiency.warning, critical: sensors.efficiency.critical, badge: "η RATIO" },
              ].map((g, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.03))'
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    {g.badge}
                  </span>
                  <ArcGauge
                    label={g.label}
                    value={g.value}
                    unit={g.unit}
                    min={g.min}
                    max={g.max}
                    warning={g.warning}
                    critical={g.critical}
                    size={135}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Industrial Machine Tribology & Telemetry Suite */}
          <IndustrialTribologySuite machine={machine} sensors={sensors} />
        </div>
      )}

      {/* Tab 2: AI Health Risk Assessment & 30-Day Trends */}
      {activeTab === 'ai' && (
        <div className="twin-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          {/* AI Prediction Panel */}
          <div className="twin-panel" style={{ padding: '24px' }}>
            <div className="twin-panel__title" style={{ paddingBottom: '16px', marginBottom: '16px' }}>
              <AlertTriangle size={18} className="twin-panel__title-icon" />
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Failure Risk Assessment & RUL
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
              <HealthRing
                value={Math.max(0, 100 - prediction.failureProbability)}
                size={110}
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
              Predicted Failure Modes (Weibull Hazard Breakdown)
            </div>
            {prediction.failureModes.slice(0, 4).map((mode, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--sp-3)', background: 'var(--bg-secondary)',
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
          <div className="twin-panel" style={{ padding: '24px' }}>
            <div className="twin-panel__title" style={{ paddingBottom: '16px', marginBottom: '16px' }}>
              <TrendingUp size={18} className="twin-panel__title-icon" />
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                30-Day Degradation & Temperature Trend
              </span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
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
      )}

      {/* Tab 3: Vibration FFT Spectrum Analysis */}
      {activeTab === 'fft' && (
        <div className="twin-panel" style={{ marginBottom: 'var(--sp-6)', padding: '24px' }}>
          <VibrationFFT
            vibration={sensors.vibration.value}
            rpm={sensors.rpm.value}
            health={machine.health}
          />
        </div>
      )}

      {/* Tab 4: What-If Stress Simulator */}
      {activeTab === 'whatif' && (
        <div className="twin-panel" style={{ marginBottom: 'var(--sp-6)', padding: '24px' }}>
          <WhatIfSimulator
            baseHealth={machine.health}
            baseRUL={prediction.remainingUsefulLife}
            machineName={machine.name}
          />
        </div>
      )}

      {/* Tab 5: H-Q Curve & Weibull Distribution */}
      {activeTab === 'curves' && (
        <div className="twin-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="twin-panel" style={{ padding: '24px' }}>
            <HQCurve flowRate={sensors.flowRate.value} health={machine.health} />
          </div>
          <div className="twin-panel" style={{ padding: '24px' }}>
            <WeibullPlot currentHours={4200} beta={2.5} eta={5000} />
          </div>
        </div>
      )}

      {/* Asset QR Tag Modal */}
      {showQRModal && (
        <AssetQRCodeModal
          machine={machine}
          onClose={() => setShowQRModal(false)}
        />
      )}
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
        fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.2)" />
      <text x="310" y="31" textAnchor="middle" fill="var(--status-healthy)" fontSize="10" fontWeight="600">
        η {sensors.efficiency.value}%
      </text>
    </svg>
  );
}
