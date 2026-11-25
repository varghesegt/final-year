import { Thermometer, Waves, Zap, Droplets, Cpu } from 'lucide-react';

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
    <div className="twin-panel">
      <div className="twin-panel__title">
        <div className="twin-panel__title-left">
          <Cpu size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
          <span>Tribology & Bearing Diagnostics ({machine.name})</span>
        </div>
        <span className="badge badge--info">ISO 23247 / API 610</span>
      </div>

      <div className="dossier-grid">
        <div className="dossier-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="dossier-card__title" style={{ marginBottom: 0 }}>
              <Thermometer size={13} strokeWidth={1.75} /> Bearing RTDs
            </span>
            <span className={`badge ${deltaT.isExceeded ? 'badge--critical' : 'badge--healthy'}`}>
              {deltaT.isExceeded ? 'ΔT Exceeded' : 'Within Limit'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>DRIVE END</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: bearingDE.value > bearingDE.critical ? 'var(--status-critical)' : bearingDE.value > bearingDE.warning ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                {bearingDE.value} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>°C</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NON-DRIVE</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: bearingNDE.value > bearingNDE.critical ? 'var(--status-critical)' : bearingNDE.value > bearingNDE.warning ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                {bearingNDE.value} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>°C</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '6px', padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Temp Rise (ΔT)</span>
              <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: deltaT.isExceeded ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                +{deltaT.value} °C / 45°C
              </span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (deltaT.value / 45) * 100)}%`,
                height: '100%',
                background: deltaT.isExceeded ? 'var(--status-critical)' : deltaT.value > 38 ? 'var(--status-warning)' : 'var(--status-healthy)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Ambient {ambientTemp.value}°C</span>
              <span>API 610</span>
            </div>
          </div>
        </div>

        <div className="dossier-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="dossier-card__title" style={{ marginBottom: 0 }}>
              <Waves size={13} strokeWidth={1.75} /> Vibration & Envelope
            </span>
            <span className={`badge ${crestFactor > 5.0 ? 'badge--critical' : 'badge--info'}`}>
              {crestFactor > 5.0 ? 'Impact Fault' : 'ISO 10816-3'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>VELOCITY RMS</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: vibRMS > 4.5 ? 'var(--status-critical)' : vibRMS > 2.8 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                {vibRMS} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>mm/s</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ENVELOPE</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: vibEnvelope > 2.0 ? 'var(--status-critical)' : vibEnvelope > 1.2 ? 'var(--status-warning)' : 'var(--text-primary)', marginTop: '2px' }}>
                {vibEnvelope} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>gE</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '6px', padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Crest Factor</span>
              <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: crestFactor > 5.0 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {crestFactor}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>Peak {vibPeak} g</span>
              <span>1–20 kHz Band</span>
            </div>
          </div>
        </div>

        <div className="dossier-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="dossier-card__title" style={{ marginBottom: 0 }}>
              <Droplets size={13} strokeWidth={1.75} />
              {machine.id === 'ROB-001' ? 'Tooling Kinematics' : machine.id === 'CNC-001' ? 'Coolant Circuit' : 'Suction & NPSH'}
            </span>
            <span className={`badge ${cavitationRisk === 'CRITICAL' ? 'badge--critical' : cavitationRisk === 'WARNING' ? 'badge--warning' : 'badge--healthy'}`}>
              {machine.id === 'ROB-001' ? 'Stable' : cavitationRisk}
            </span>
          </div>

          {machine.id === 'ROB-001' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>GRIPPER</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {specifics.gripperPressure ?? 6.2} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>bar</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>TCP SPEED</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {specifics.tcpVelocity ?? 1250} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>mm/s</span>
                </div>
              </div>
            </div>
          ) : machine.id === 'CNC-001' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>PRESSURE</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {specifics.coolantPressure ?? 4.2} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>bar</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>FLOW</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {specifics.coolantFlow ?? 18.5} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>L/m</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NPSHa</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {npshAvail} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>m</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>NPSHr</div>
                <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {npshReq} <span style={{ fontSize: '11px', fontWeight: 400 }}>m</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-primary)', borderRadius: '6px', padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
            {machine.id === 'ROB-001' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payload Margin</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)' }}>
                  +{210 - (specifics.activePayload ?? 142)} kg
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>NPSH Margin</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: npshMargin < 0.5 ? 'var(--status-critical)' : npshMargin < 1.0 ? 'var(--status-warning)' : 'var(--status-healthy)' }}>
                  +{npshMargin} m (≥ 1.0m)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="dossier-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="dossier-card__title" style={{ marginBottom: 0 }}>
              <Zap size={13} strokeWidth={1.75} /> Electrical Load
            </span>
            <span className="badge badge--info">{machine.id}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE POWER</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {activePower} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>kW</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>POWER FACTOR</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {powerFactor}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '6px', padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
            {machine.id === 'P-101' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Seal Chamber</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.sealChamberPressure ?? 3.8} bar</span>
              </div>
            )}
            {machine.id === 'CNC-001' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Spindle Runout</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.spindleRunout ?? 1.2} µm</span>
              </div>
            )}
            {machine.id === 'ROB-001' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Harmonic Backlash</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.harmonicBacklash ?? 0.42} arcmin</span>
              </div>
            )}
            {machine.id === 'COMP-201' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receiver Tank</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.tankPressure ?? 7.2} bar</span>
              </div>
            )}
            {machine.id === 'CONV-401' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Belt Tension</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.beltTension ?? 95}%</span>
              </div>
            )}
            {machine.id === 'XFMR-302' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>DGA Hydrogen</span>
                <span className="tabular-nums" style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{specifics.hydrogenGas ?? 18} ppm</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
