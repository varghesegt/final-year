import { useEffect, useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { calculateWhatIf } from '../../services/api';

export function WhatIfSimulator({
  machineId = 'P-101',
  baseRUL = 120,
  ratedRpm = 1450,
  machineName = 'Centrifugal Pump #1'
}) {
  const isStaticAsset = machineId === 'XFMR-302' || ratedRpm === 0;
  const nominalRpm = ratedRpm > 0 ? ratedRpm : 1450;

  const [rpm, setRpm] = useState(nominalRpm);
  const [ambientTemp, setAmbientTemp] = useState(machineId === 'CNC-001' ? 25 : 32);
  const [loadPercent, setLoadPercent] = useState(100);
  const [lubrication, setLubrication] = useState('good');
  const [projection, setProjection] = useState({
    wearAcceleration: 1.0,
    projectedTemp: 52.0,
    adjustedRUL: baseRUL,
    projectedRisk: 28.0,
    assessment: 'Operating conditions remain safe with nominal service life.',
  });

  useEffect(() => {
    setRpm(nominalRpm);
    setAmbientTemp(machineId === 'CNC-001' ? 25 : 32);
    setLoadPercent(100);
    setLubrication('good');
  }, [machineId, nominalRpm]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      calculateWhatIf(machineId, { rpm, ambientTemp, loadPercent, lubrication })
        .then((res) => { if (active && res) setProjection(res); })
        .catch(() => {});
    }, 80);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [machineId, rpm, ambientTemp, loadPercent, lubrication]);

  const minRpm = Math.max(400, Math.round((nominalRpm * 0.55) / 50) * 50);
  const maxRpm = Math.round((nominalRpm * 1.35) / 50) * 50;
  const rpmStep = nominalRpm >= 3000 ? 100 : 50;

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
            Operating Impact Simulator ({machineName})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Test how speed, load, ambient heat, and oil quality affect expected equipment life.
          </div>
        </div>

        <button onClick={handleReset} className="btn btn--secondary">
          <RotateCcw size={13} strokeWidth={1.75} />
          Reset
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
          {!isStaticAsset && (
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
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Equipment Load</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: loadPercent > 120 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {loadPercent}%
              </span>
            </div>
            <input
              type="range" min="50" max="150" step="5" value={loadPercent}
              onChange={(e) => setLoadPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Room / Bay Temperature</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: ambientTemp > 42 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {ambientTemp}°C
              </span>
            </div>
            <input
              type="range" min="10" max="55" step="1" value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>
              {isStaticAsset ? 'Oil Quality' : 'Lubrication Quality'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'poor', label: 'Degraded' },
                { id: 'good', label: 'Standard' },
                { id: 'premium', label: 'Fresh Synth' }
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
              <span className="metric-card__label">Estimated Life Left</span>
              <span className="metric-card__value" style={{ color: projection.adjustedRUL < 30 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {projection.adjustedRUL}<span className="metric-card__unit">days</span>
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">Wear Rate</span>
              <span className="metric-card__value" style={{ color: projection.wearAcceleration > 1.4 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {projection.wearAcceleration}<span className="metric-card__unit">x</span>
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">Predicted Temp</span>
              <span className="metric-card__value" style={{ color: projection.projectedTemp > 75 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {projection.projectedTemp}<span className="metric-card__unit">°C</span>
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-card__label">Failure Risk</span>
              <span className="metric-card__value" style={{ color: projection.projectedRisk > 60 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                {projection.projectedRisk}<span className="metric-card__unit">%</span>
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: projection.wearAcceleration > 1.5 ? '#fef2f2' : 'var(--bg-tertiary)',
            border: `1px solid ${projection.wearAcceleration > 1.5 ? '#fecaca' : 'var(--border-subtle)'}`,
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Summary: </strong>
            {projection.assessment}
          </div>
        </div>
      </div>
    </div>
  );
}
