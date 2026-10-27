import { useState } from 'react';
import { Sliders, RotateCcw, AlertTriangle, ShieldCheck, Gauge, Flame, Activity, Zap } from 'lucide-react';
import { HealthRing } from './index';

export function WhatIfSimulator({ baseHealth = 82, baseRUL = 120, machineName = 'Centrifugal Pump #1' }) {
  const [rpm, setRpm] = useState(1450);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [loadPercent, setLoadPercent] = useState(100);
  const [lubrication, setLubrication] = useState('good'); // 'poor' | 'good' | 'premium'

  // Physics calculation
  const lubeFactor = lubrication === 'poor' ? 0.6 : lubrication === 'good' ? 1.0 : 1.35;
  const speedRatio = rpm / 1450;
  const loadRatio = loadPercent / 100;

  // Mechanical Wear Factor Kw (Archard's wear / ISO bearing life formula L10 = (C/P)^p)
  const wearAcceleration = Math.round((Math.pow(loadRatio, 2.5) * Math.pow(speedRatio, 1.4) / lubeFactor) * 100) / 100;

  // Projected operating temperature (°C)
  const projectedTemp = Math.round((ambientTemp + 22 * speedRatio + 18 * loadRatio * (lubrication === 'poor' ? 1.4 : 1.0)) * 10) / 10;

  // Adjusted Remaining Useful Life (RUL)
  const adjustedRUL = Math.max(5, Math.round(baseRUL / wearAcceleration));

  // Projected Failure Probability
  const projectedRisk = Math.min(98, Math.max(5, Math.round((wearAcceleration * 28 + (projectedTemp > 75 ? 30 : 0)) * 10) / 10));

  const handleReset = () => {
    setRpm(1450);
    setAmbientTemp(32);
    setLoadPercent(100);
    setLubrication('good');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Title & Reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={14} style={{ color: 'var(--accent-purple)' }} />
            Operational Stress & "What-If" Digital Sandbox
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manipulate operational variables to project ISO accelerated degradation and revised RUL
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: '#ffffff', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <RotateCcw size={12} />
          Reset Nominal
        </button>
      </div>

      {/* Main Grid: Controls Left, Live Projections Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Interactive Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {/* Slider 1: RPM */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Operating Speed</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>{rpm} RPM</span>
            </div>
            <input
              type="range"
              min="800"
              max="2200"
              step="50"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>800 RPM (Low)</span>
              <span>1450 (Nominal)</span>
              <span>2200 RPM (Overdrive)</span>
            </div>
          </div>

          {/* Slider 2: Dynamic Radial Load */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Dynamic Radial Load</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: loadPercent > 120 ? 'var(--status-critical)' : 'var(--accent-cyan)' }}>
                {loadPercent}% {loadPercent > 100 ? '(Overload)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              value={loadPercent}
              onChange={(e) => setLoadPercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>50% (Idle)</span>
              <span>100% (Rated)</span>
              <span>160% (Severe)</span>
            </div>
          </div>

          {/* Slider 3: Ambient Temperature */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Ambient Environmental Temp</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: ambientTemp > 42 ? 'var(--status-critical)' : 'var(--accent-amber)' }}>
                {ambientTemp}°C
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="55"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>10°C (HVAC Cool)</span>
              <span>32°C (Shop Average)</span>
              <span>55°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Selector: Lubrication Quality */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
              Lubricant Oil Quality
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: 'poor', label: 'Degraded / Metal Debris' },
                { id: 'good', label: 'Standard Mineral' },
                { id: 'premium', label: 'Synthetic ISO VG 46' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLubrication(opt.id)}
                  style={{
                    padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                    fontSize: '10px', fontWeight: lubrication === opt.id ? 700 : 500,
                    background: lubrication === opt.id ? 'rgba(124, 58, 237, 0.12)' : '#f8fafc',
                    color: lubrication === opt.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    border: `1px solid ${lubrication === opt.id ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Real-time Physics Output Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Key Output Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
            {/* Projected RUL */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROJECTED RUL</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: adjustedRUL < 30 ? 'var(--status-critical)' : 'var(--text-primary)', marginTop: '4px' }}>
                {adjustedRUL} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>days</span>
              </div>
              <div style={{ fontSize: '10px', color: adjustedRUL < baseRUL ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '4px' }}>
                {adjustedRUL < baseRUL ? `▼ Reduced by ${baseRUL - adjustedRUL} days` : `▲ Extended by ${adjustedRUL - baseRUL} days`}
              </div>
            </div>

            {/* Wear Acceleration Factor */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WEAR ACCELERATION (Kw)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: wearAcceleration > 1.4 ? 'var(--status-critical)' : 'var(--accent-blue)', marginTop: '4px' }}>
                {wearAcceleration}x
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Baseline wear: 1.00x nominal
              </div>
            </div>

            {/* Projected Equilibrium Temp */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PROJECTED THERMAL</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: projectedTemp > 75 ? 'var(--status-critical)' : 'var(--accent-amber)', marginTop: '4px' }}>
                {projectedTemp}°C
              </div>
              <div style={{ fontSize: '10px', color: projectedTemp > 75 ? 'var(--status-critical)' : 'var(--text-muted)', marginTop: '4px' }}>
                {projectedTemp > 75 ? 'Exceeds winding thermal limit' : 'Safe thermal dissipation'}
              </div>
            </div>

            {/* Failure Risk Score */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SIMULATED RISK</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: projectedRisk > 60 ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '4px' }}>
                {projectedRisk}%
              </div>
              <div style={{ fontSize: '10px', color: projectedRisk > 60 ? 'var(--status-critical)' : 'var(--status-healthy)', marginTop: '4px' }}>
                {projectedRisk > 60 ? 'Immediate PM Required' : 'Acceptable Stress Range'}
              </div>
            </div>
          </div>

          {/* Actionable Engineering Diagnosis Box */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: wearAcceleration > 1.5 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${wearAcceleration > 1.5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            fontSize: '12px',
            color: 'var(--text-primary)',
            lineHeight: 1.5
          }}>
            <strong>Engineering Verdict: </strong>
            {wearAcceleration > 1.5
              ? `Running at ${loadPercent}% radial load combined with ${rpm} RPM accelerates bearing fatigue spalling by ${wearAcceleration}x. Projected temperature of ${projectedTemp}°C will cause rapid lubricant breakdown. Reduce operating speed or schedule grease replenishment within ${adjustedRUL} days.`
              : `Operating parameters are within sustainable design envelopes. Projected RUL of ${adjustedRUL} days maintains high plant availability.`}
          </div>
        </div>
      </div>
    </div>
  );
}
