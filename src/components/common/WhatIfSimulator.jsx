import { useEffect, useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';

export function WhatIfSimulator({
  machineId = 'P-101',
  baseRUL = 120,
  ratedRpm = 1450,
  machineName = 'Centrifugal Pump #1'
}) {
  const isStaticAsset = machineId === 'XFMR-302' || ratedRpm === 0;
  const nominalRpm = ratedRpm > 0 ? ratedRpm : 1450;

  const [rpm, setRpm] = useState(nominalRpm);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [loadPercent, setLoadPercent] = useState(100);
  const [lubrication, setLubrication] = useState('good');

  useEffect(() => {
    setRpm(nominalRpm);
    setAmbientTemp(machineId === 'CNC-001' ? 25 : 32);
    setLoadPercent(100);
    setLubrication('good');
  }, [machineId, nominalRpm]);

  const minRpm = Math.max(400, Math.round((nominalRpm * 0.55) / 50) * 50);
  const maxRpm = Math.round((nominalRpm * 1.35) / 50) * 50;
  const rpmStep = nominalRpm >= 3000 ? 100 : 50;

  const lubeFactor = lubrication === 'poor' ? 0.6 : lubrication === 'good' ? 1.0 : 1.35;
  const speedRatio = isStaticAsset ? 1.0 : rpm / nominalRpm;
  const loadRatio = loadPercent / 100;

  // Static transformer follows IEEE C57.91 thermal aging; rotating assets follow Archard + L10 fatigue
  const wearAcceleration = isStaticAsset
    ? Math.round((Math.pow(loadRatio, 1.8) * Math.pow(2, (ambientTemp - 32) / 12) / lubeFactor) * 100) / 100
    : Math.round((Math.pow(loadRatio, 2.5) * Math.pow(speedRatio, 1.4) / lubeFactor) * 100) / 100;

  const projectedTemp = isStaticAsset
    ? Math.round((ambientTemp + 24 * Math.pow(loadRatio, 1.6) * (lubrication === 'poor' ? 1.35 : 1.0)) * 10) / 10
    : Math.round((ambientTemp + 20 * speedRatio + 18 * loadRatio * (lubrication === 'poor' ? 1.4 : 1.0)) * 10) / 10;

  const adjustedRUL = Math.max(5, Math.round(baseRUL / Math.max(0.2, wearAcceleration)));
  const projectedRisk = Math.min(98, Math.max(5, Math.round((wearAcceleration * 28 + (projectedTemp > 75 ? 30 : 0)) * 10) / 10));

  const handleReset = () => {
    setRpm(nominalRpm);
    setAmbientTemp(machineId === 'CNC-001' ? 25 : 32);
    setLoadPercent(100);
    setLubrication('good');
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Operating Envelope Sensitivity ({machineName})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isStaticAsset
              ? 'Simulate MVA load factor, substation ambient temperature, and dielectric oil condition (IEEE C57.91).'
              : 'Adjust shaft speed, radial load, ambient temperature, and lubricant grade to evaluate Archard wear impact.'}
          </div>
        </div>

        <button onClick={handleReset} className="btn btn--secondary">
          <RotateCcw size={13} strokeWidth={1.75} />
          Reset Nominal
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {isStaticAsset ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Supply Frequency</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>50.0 Hz (Static Core)</span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Operating Speed</span>
                <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{rpm} RPM</span>
              </div>
              <input
                type="range" min={minRpm} max={maxRpm} step={rpmStep} value={rpm}
                onChange={(e) => setRpm(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{minRpm} RPM</span>
                <span>{nominalRpm} Nominal</span>
                <span>{maxRpm} RPM</span>
              </div>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{isStaticAsset ? 'Transformer MVA Load' : 'Radial / Process Load'}</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: loadPercent > 120 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {loadPercent}%
              </span>
            </div>
            <input
              type="range" min="50" max="150" step="5" value={loadPercent}
              onChange={(e) => setLoadPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>50% Idle</span>
              <span>100% Rated</span>
              <span>150% Peak</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Ambient Temperature</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: ambientTemp > 42 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {ambientTemp}°C
              </span>
            </div>
            <input
              type="range" min="10" max="55" step="1" value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>10°C</span>
              <span>32°C Shop</span>
              <span>55°C Max</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>
              {isStaticAsset ? 'Dielectric Oil Condition' : 'Lubrication Condition'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'poor', label: isStaticAsset ? 'Aged Oil' : 'Degraded' },
                { id: 'good', label: 'Standard' },
                { id: 'premium', label: isStaticAsset ? 'Fresh BDV' : 'ISO VG Synth' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLubrication(opt.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: lubrication === opt.id ? 600 : 500,
                    background: lubrication === opt.id ? 'var(--accent-blue-soft)' : 'var(--bg-primary)',
                    color: lubrication === opt.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: `1px solid ${lubrication === opt.id ? '#bfdbfe' : 'var(--border-default)'}`,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
            <div className="metric-card">
              <span className="metric-card__label">Projected RUL</span>
              <span className="metric-card__value" style={{ color: adjustedRUL < 30 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {adjustedRUL}<span className="metric-card__unit">days</span>
              </span>
              <span style={{ fontSize: '11px', color: adjustedRUL < baseRUL ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                {adjustedRUL < baseRUL ? `-${baseRUL - adjustedRUL} days vs baseline` : `+${adjustedRUL - baseRUL} days vs baseline`}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">{isStaticAsset ? 'Aging Factor' : 'Wear Factor (Kw)'}</span>
              <span className="metric-card__value" style={{ color: wearAcceleration > 1.4 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {wearAcceleration}<span className="metric-card__unit">x</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1.00x nominal</span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">{isStaticAsset ? 'Winding Hotspot' : 'Equilibrium Temp'}</span>
              <span className="metric-card__value" style={{ color: projectedTemp > 75 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {projectedTemp}<span className="metric-card__unit">°C</span>
              </span>
              <span style={{ fontSize: '11px', color: projectedTemp > 75 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                {projectedTemp > 75 ? 'Above 75°C limit' : 'Within thermal limit'}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">Failure Risk</span>
              <span className="metric-card__value" style={{ color: projectedRisk > 60 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                {projectedRisk}<span className="metric-card__unit">%</span>
              </span>
              <span style={{ fontSize: '11px', color: projectedRisk > 60 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                {projectedRisk > 60 ? 'Schedule intervention' : 'Acceptable stress'}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: wearAcceleration > 1.5 ? '#fef2f2' : 'var(--bg-tertiary)',
            border: `1px solid ${wearAcceleration > 1.5 ? '#fecaca' : 'var(--border-subtle)'}`,
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Assessment: </strong>
            {wearAcceleration > 1.5
              ? `Operating at ${loadPercent}% load${isStaticAsset ? '' : ` and ${rpm} RPM`} accelerates fatigue by ${wearAcceleration}x. At ${projectedTemp}°C, reduce load or service insulation/lubrication within ${adjustedRUL} days.`
              : `Selected parameters remain within rated operating limits with a projected service life of ${adjustedRUL} days.`}
          </div>
        </div>
      </div>
    </div>
  );
}
