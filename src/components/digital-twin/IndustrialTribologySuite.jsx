import React from 'react';
import {
  Thermometer, Activity, Gauge, Zap, AlertTriangle, CheckCircle2,
  AlertOctagon, Waves, Disc, Flame, Droplets, ArrowUpRight, Cpu
} from 'lucide-react';

export function IndustrialTribologySuite({ machine, sensors }) {
  if (!machine || !sensors) return null;

  const bearingDE = sensors.bearingDE || { value: 68.2, unit: '°C', warning: 72, critical: 82 };
  const bearingNDE = sensors.bearingNDE || { value: 52.4, unit: '°C', warning: 68, critical: 78 };
  const ambientTemp = sensors.ambientTemp || { value: 30.0, unit: '°C' };
  const deltaT = sensors.deltaT || { value: 38.2, unit: '°C Δ', limit: 45, isExceeded: false };

  const vibRMS = sensors.vibration?.value ?? 1.85;
  const vibEnvelope = sensors.vibrationEnvelope?.value ?? 0.42;
  const vibPeak = sensors.vibrationPeak?.value ?? 5.2;
  const crestFactor = sensors.crestFactor?.value ?? 2.8;

  const npshAvail = sensors.npshAvailable?.value ?? 4.2;
  const npshReq = sensors.npshRequired?.value ?? 2.8;
  const npshMargin = sensors.npshMargin?.value ?? 1.4;
  const cavitationRisk = sensors.npshMargin?.risk ?? 'NORMAL';

  const activePower = sensors.activePower?.value ?? 14.2;
  const powerFactor = sensors.powerFactor?.value ?? 0.88;
  const specifics = sensors.specifics || {};

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '24px',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      marginBottom: 'var(--sp-6, 24px)'
    }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.08)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Industrial Machine Tribology & Diagnostics Suite
              </h3>
              <span style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--accent-blue)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}>
                ISO 23247 CLASS-A TWIN
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sub-surface acoustic enveloping, API 610 thermal limits, and hydraulic boundary margins for {machine.name}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--status-healthy)',
              boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)'
            }} />
            Live Stream: 1500ms Tick
          </span>
        </div>
      </div>

      {/* 4 Diagnostic Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* CARD 1: Dual Pt100 RTDs & API 610 Delta-T */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Thermometer size={15} color="var(--accent-amber)" />
                Dual RTD Bearing Thermography
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: deltaT.isExceeded ? 'rgba(220, 38, 38, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                color: deltaT.isExceeded ? 'var(--status-critical)' : 'var(--status-healthy)',
                border: `1px solid ${deltaT.isExceeded ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)'}`
              }}>
                {deltaT.isExceeded ? 'API 610 EXCEEDED' : 'API 610 COMPLIANT'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>DRIVE END (DE)</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: bearingDE.value > bearingDE.critical ? 'var(--status-critical)' : bearingDE.value > bearingDE.warning ? 'var(--status-warning)' : 'var(--text-primary)',
                  marginTop: '2px'
                }}>
                  {bearingDE.value} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>°C</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Pt100 In-Bore Sensor</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NON-DRIVE (NDE)</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: bearingNDE.value > bearingNDE.critical ? 'var(--status-critical)' : bearingNDE.value > bearingNDE.warning ? 'var(--status-warning)' : 'var(--text-primary)',
                  marginTop: '2px'
                }}>
                  {bearingNDE.value} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>°C</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Guide Bearing</div>
              </div>
            </div>

            {/* Differential Bar */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bearing Temp Rise (ΔT):</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: deltaT.isExceeded ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                  +{deltaT.value} °C (Max Limit: 45°C)
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (deltaT.value / 45) * 100)}%`,
                  height: '100%',
                  background: deltaT.isExceeded ? 'var(--status-critical)' : deltaT.value > 38 ? 'var(--status-warning)' : 'var(--status-healthy)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Ambient: {ambientTemp.value}°C</span>
                <span>API 610 Annex H</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: ISO 10816-3 & PeakVue Demodulation */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Waves size={15} color="var(--accent-purple)" />
                Vibration & Enveloping
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: crestFactor > 5.0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                color: crestFactor > 5.0 ? 'var(--status-critical)' : 'var(--accent-purple)',
                border: `1px solid ${crestFactor > 5.0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(124, 58, 237, 0.2)'}`
              }}>
                {crestFactor > 5.0 ? 'IMPACT FAULT' : 'ISO 10816-3 ZONE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>VELOCITY RMS (10-1kHz)</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: vibRMS > 4.5 ? 'var(--status-critical)' : vibRMS > 2.8 ? 'var(--status-warning)' : 'var(--status-healthy)',
                  marginTop: '2px'
                }}>
                  {vibRMS} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>mm/s</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Unbalance & Misalignment</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>PEAKVUE™ ENVELOPE</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: vibEnvelope > 2.0 ? 'var(--status-critical)' : vibEnvelope > 1.2 ? 'var(--status-warning)' : 'var(--accent-purple)',
                  marginTop: '2px'
                }}>
                  {vibEnvelope} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>gE</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Subsurface Bearing Micro-Flake</div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Crest Factor (Pk / RMS):</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: crestFactor > 5.0 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                  {crestFactor} {crestFactor > 5.0 ? '(Spalling Active)' : '(Smooth Rolling)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>True Peak Accel: {vibPeak} g pk</span>
                <span>Demod 1kHz - 20kHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Hydraulic NPSH / Pneumatic / Coolant Dynamics */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Droplets size={15} color="var(--accent-cyan)" />
                {machine.id === 'ROB-001' ? 'Pneumatic Tooling & Kinematics' : machine.id === 'CNC-001' ? 'Coolant Delivery & Pressure' : 'Hydraulic Suction & NPSH'}
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: cavitationRisk === 'CRITICAL' ? 'rgba(220, 38, 38, 0.12)' : cavitationRisk === 'WARNING' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                color: cavitationRisk === 'CRITICAL' ? 'var(--status-critical)' : cavitationRisk === 'WARNING' ? 'var(--status-warning)' : 'var(--status-healthy)',
                border: `1px solid ${cavitationRisk === 'CRITICAL' ? 'rgba(220, 38, 38, 0.2)' : cavitationRisk === 'WARNING' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(5, 150, 105, 0.2)'}`
              }}>
                {machine.id === 'ROB-001' ? 'FEEDBACK STABLE' : cavitationRisk === 'CRITICAL' ? 'CAVITATION ACTIVE' : cavitationRisk === 'WARNING' ? 'CAVITATION RISK' : 'STABLE SUCTION'}
              </span>
            </div>

            {machine.id === 'ROB-001' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>GRIPPER PRESSURE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {specifics.gripperPressure ?? 6.2} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>bar</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Pneumatic Clamp Cylinder</div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TCP VELOCITY</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginTop: '2px' }}>
                    {specifics.tcpVelocity ?? 1250} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>mm/s</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Cartesian Path Speed</div>
                </div>
              </div>
            ) : machine.id === 'CNC-001' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>COOLANT PRESSURE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {specifics.coolantPressure ?? 4.2} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>bar</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Spindle Flood Line</div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>COOLANT FLOW</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {specifics.coolantFlow ?? 28.5} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>L/min</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Nozzle Manifold Delivery</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NPSH AVAILABLE (NPSHa)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {npshAvail} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>m</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Total Suction Head</div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NPSH REQUIRED (NPSHr)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {npshReq} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>m</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Impeller Eye Min Head</div>
                </div>
              </div>
            )}

            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px'
            }}>
              {machine.id === 'ROB-001' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Payload Reserve Capacity:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)' }}>
                      +{210 - (specifics.activePayload ?? 142)} kg ({Math.round(((210 - (specifics.activePayload ?? 142)) / 210) * 100)}% margin)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(5, ((specifics.activePayload ?? 142) / 210) * 100))}%`,
                      height: '100%',
                      background: 'var(--accent-blue)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Rated Max: 210 kg</span>
                    <span>Wrist Moments: Nominal</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Safety Margin (NPSHa - NPSHr):</span>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: npshMargin < 0.5 ? 'var(--status-critical)' : npshMargin < 1.0 ? 'var(--status-warning)' : 'var(--status-healthy)'
                    }}>
                      +{npshMargin} m (Std &ge; 1.0m)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(5, (npshMargin / 2.5) * 100))}%`,
                      height: '100%',
                      background: npshMargin < 0.5 ? 'var(--status-critical)' : npshMargin < 1.0 ? 'var(--status-warning)' : 'var(--status-healthy)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>ISO 9906 Grade 1/2</span>
                    <span>Vapor Bubble Margin</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CARD 4: Electrical Load & Machine Specifics */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Zap size={15} color="var(--accent-blue)" />
                Power & Machine Physics
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(37, 99, 235, 0.2)'
              }}>
                {machine.id} ASSET SPEC
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE POWER (P)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginTop: '2px' }}>
                  {activePower} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>kW</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>√3 · V · I · cos φ</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>POWER FACTOR</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {powerFactor} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>cos φ</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Inductive Phase Lag</div>
              </div>
            </div>

            {/* Asset-Specific Physics Callout */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px'
            }}>
              {machine.id === 'P-101' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mechanical Seal Chamber:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{specifics.sealChamberPressure ?? 3.8} bar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Plan 11 Flush Flow</span>
                    <span>API 682 Seal Plan</span>
                  </div>
                </div>
              )}

              {machine.id === 'CNC-001' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Spindle Dynamic Runout:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: specifics.spindleRunout > 4.0 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                      {specifics.spindleRunout ?? 2.1} µm
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Cutting Torque: {specifics.spindleTorque ?? 45} Nm</span>
                    <span>Z-Drift: {specifics.thermalDriftZ ?? 3.4} µm</span>
                  </div>
                </div>
              )}

              {machine.id === 'ROB-001' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Harmonic Reducer Backlash:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: (specifics.harmonicBacklash ?? 0.42) > 0.8 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                      {specifics.harmonicBacklash ?? 0.42} arcmin
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>TCP Repeatability: ±{specifics.repeatability ?? 0.03} mm</span>
                    <span>Active Payload: {specifics.activePayload ?? 142} kg</span>
                  </div>
                </div>
              )}

              {machine.id === 'COMP-201' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Air Receiver Pressure:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {specifics.tankPressure ?? 7.2} bar (200L Tank)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Belt Tension: {specifics.beltTension ?? 96}%</span>
                    <span>Air Delivery (FAD): {specifics.airDeliveryFAD ?? 850} L/min</span>
                  </div>
                </div>
              )}

              {machine.id === 'CONV-401' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Dynamic Belt Tension:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{specifics.beltTension ?? 95} %</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Rotor Induction Slip: {specifics.motorSlip ?? 2.4}%</span>
                    <span>Take-Up Counterweight</span>
                  </div>
                </div>
              )}

              {machine.id === 'XFMR-302' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>DGA Combustible Gas (H₂):</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: specifics.hydrogenGas > 100 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                      {specifics.hydrogenGas ?? 18} ppm
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>C₂H₂ Acetylene: {specifics.acetyleneGas ?? 2} ppm</span>
                    <span>Dielectric: {specifics.breakdownVoltage ?? 62} kV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
