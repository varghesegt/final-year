import { useState } from 'react';
import {
  Activity, ArrowRight, CheckCircle2, Gauge, Power, ShieldCheck,
  Thermometer, X, Zap, AlertTriangle
} from 'lucide-react';

function getNum(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return Number.isNaN(val) ? fallback : val;
  if (typeof val === 'object' && val.value !== undefined) {
    const num = Number(val.value);
    return Number.isNaN(num) ? fallback : num;
  }
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * ISA-101 2D SCADA HMI for CONV-401 (Dorner 2200 Series Heavy Modular Conveyor)
 */
export function ConveyorSCADAView({ sensors, machine }) {
  const [activeFaceplate, setActiveFaceplate] = useState(null);
  const [driveMode, setDriveMode] = useState('AUTO'); // 'AUTO' | 'JOG' | 'STOPPED'
  const [speedSetpointPct, setSpeedSetpointPct] = useState(100);

  const beltTension = getNum(sensors?.beltTension, 94);
  const motorSlip = getNum(sensors?.motorSlip, 2.4);
  const beltSpeed = getNum(sensors?.beltSpeedMps, 1.42) * (speedSetpointPct / 100);
  const bearingDE = getNum(sensors?.bearingDE, 51.2);
  const bearingNDE = getNum(sensors?.bearingNDE, 44.6);
  const vibration = getNum(sensors?.vibration, 1.55);
  const peakVue = getNum(sensors?.vibrationEnvelope, 0.72);
  const motorCurrent = getNum(sensors?.current, 8.8);
  const efficiency = getNum(sensors?.efficiency, 89.4);
  const rpm = Math.round(getNum(sensors?.rpm, 960) * (speedSetpointPct / 100));
  const vfdHz = Math.round((rpm / 960) * 50 * 10) / 10;

  const isRunning = driveMode !== 'STOPPED' && machine?.status !== 'stopped';
  const slipWarn = motorSlip > 3.5;
  const tensionWarn = beltTension < 85;
  const vibWarn = vibration > 2.8;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      background: 'linear-gradient(180deg, #0b1120 0%, #070d18 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(59, 130, 246, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      color: '#f8fafc',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)'
    }}>
      {/* Top ISA-101 Control Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowRight size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                CONV-401 • Dorner 2200 VFD Transfer Conveyor HMI
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                background: isRunning ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                color: isRunning ? '#34d399' : '#fca5a5',
                border: `1px solid ${isRunning ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`
              }}>
                {isRunning ? `RUNNING • ${vfdHz} Hz (${beltSpeed.toFixed(2)} m/s)` : 'STOPPED'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              5.5 kW SEW Helical-Bevel Drive • Timken UC207-20 Bearings • Optical Tracking Guard
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#1e293b', padding: '3px', borderRadius: '6px', border: '1px solid #334155', gap: '2px' }}>
            {['AUTO', 'JOG', 'STOPPED'].map(m => (
              <button
                key={m}
                onClick={() => setDriveMode(m)}
                style={{
                  padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 600,
                  background: driveMode === m ? (m === 'STOPPED' ? '#b91c1c' : '#1d4ed8') : 'transparent',
                  color: driveMode === m ? '#ffffff' : '#94a3b8'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>VFD Ref</span>
            <input
              type="range" min="50" max="115" step="5" value={speedSetpointPct}
              onChange={(e) => setSpeedSetpointPct(Number(e.target.value))}
              style={{ width: '76px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <span className="tabular-nums" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
              {speedSetpointPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Process Schematic */}
      <div style={{ padding: '16px 20px 8px 20px' }}>
        <div style={{ background: '#090f1d', borderRadius: '10px', border: '1px solid #1e293b', padding: '10px' }}>
          <svg viewBox="0 0 800 350" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="convFrameGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="sewMotorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>

            {/* Floor Line */}
            <line x1="40" y1="315" x2="760" y2="315" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />

            {/* 3 H-Stanchion Legs */}
            {[155, 400, 645].map((lx) => (
              <g key={lx}>
                <rect x={lx - 10} y="205" width="20" height="108" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <rect x={lx - 20} y="305" width="40" height="8" rx="2" fill="#475569" />
              </g>
            ))}
            <line x1="155" y1="265" x2="645" y2="265" stroke="#334155" strokeWidth="4" />

            {/* Conveyor Bed Chassis */}
            <rect x="85" y="160" width="630" height="44" rx="8" fill="url(#convFrameGrad)" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Moving Cleated Belt Tracks */}
            <rect x="92" y="152" width="616" height="10" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="92" y="200" width="616" height="8" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            {isRunning && (
              <line
                x1="100" y1="157" x2="700" y2="157"
                stroke="#0284c7" strokeWidth="3" strokeDasharray="10 18"
              >
                <animate attributeName="stroke-dashoffset" from="56" to="0" dur={`${Math.max(0.4, 1.4 / Math.max(0.4, beltSpeed))}s`} repeatCount="indefinite" />
              </line>
            )}

            {/* Animated WIP Totes */}
            <g onClick={() => setActiveFaceplate('belt')} style={{ cursor: 'pointer' }}>
              {[160, 360, 540].map((tx, idx) => (
                <g key={tx}>
                  <rect x={tx} y="114" width="54" height="38" rx="4" fill={idx === 1 ? '#d97706' : '#1d4ed8'} stroke="#f8fafc" strokeWidth="1" />
                  <rect x={tx - 2} y="110" width="58" height="6" rx="2" fill="#334155" />
                  {isRunning && (
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="-30 0"
                      to="60 0"
                      dur={`${Math.max(1.2, 3.2 / Math.max(0.4, beltSpeed))}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </g>
              ))}
            </g>

            {/* Tail Crowned Pulley & Tensioner (Left) */}
            <g onClick={() => setActiveFaceplate('tail')} style={{ cursor: 'pointer' }}>
              <circle cx="95" cy="180" r="24" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="95" cy="180" r="8" fill="#64748b" />
              <g>
                <line x1="78" y1="180" x2="112" y2="180" stroke="#94a3b8" strokeWidth="2" />
                <line x1="95" y1="163" x2="95" y2="197" stroke="#94a3b8" strokeWidth="2" />
                {isRunning && (
                  <animateTransform attributeName="transform" type="rotate" from="0 95 180" to="360 95 180" dur="1.8s" repeatCount="indefinite" />
                )}
              </g>
              {/* Tension Gauge Callout WT-401 */}
              <rect x="35" y="90" width="110" height="44" rx="6" fill="#0f172a" stroke={tensionWarn ? '#f59e0b' : '#38bdf8'} strokeWidth="1.5" />
              <text x="90" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">WT-401 TENSION</text>
              <text x="90" y="125" textAnchor="middle" fill={tensionWarn ? '#fbbf24' : '#38bdf8'} fontSize="13" fontWeight="700">{beltTension}%</text>
              <line x1="90" y1="134" x2="95" y2="156" stroke="#475569" strokeDasharray="2 2" />
            </g>

            {/* Overhead Optical Belt Tracking & Barcode Scanner Portal */}
            <g onClick={() => setActiveFaceplate('portal')} style={{ cursor: 'pointer' }}>
              <rect x="410" y="65" width="12" height="90" fill="#475569" />
              <rect x="360" y="54" width="112" height="18" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="392" y="72" width="48" height="12" rx="2" fill="#0284c7" />
              {/* Scanner Optical Beam */}
              <polygon points="416,84 395,150 437,150" fill="rgba(56, 189, 248, 0.14)" stroke="rgba(56,189,248,0.45)" strokeWidth="1" strokeDasharray="3 3" />
              <text x="416" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">ZT-401 OPTICAL TRACKER</text>
            </g>

            {/* Head Drive Drum, Timken Pillow Bearings & SEW Gearmotor (Right) */}
            <g onClick={() => setActiveFaceplate('drive')} style={{ cursor: 'pointer' }}>
              <circle cx="705" cy="180" r="26" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="705" cy="180" r="9" fill="#cbd5e1" />
              <g>
                <line x1="688" y1="180" x2="722" y2="180" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="705" y1="163" x2="705" y2="197" stroke="#f59e0b" strokeWidth="2.5" />
                {isRunning && (
                  <animateTransform attributeName="transform" type="rotate" from="0 705 180" to="360 705 180" dur="1.6s" repeatCount="indefinite" />
                )}
              </g>
              {/* SEW Helical Gearbox & Motor Silhouette */}
              <rect x="655" y="216" width="84" height="50" rx="6" fill="url(#sewMotorGrad)" stroke="#60a5fa" strokeWidth="1.5" />
              <text x="697" y="238" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">SEW 5.5 kW</text>
              <text x="697" y="254" textAnchor="middle" fill="#93c5fd" fontSize="10">{rpm} RPM • {motorCurrent.toFixed(1)} A</text>

              {/* Instrument Callouts DE Temp & Vibration */}
              <rect x="635" y="64" width="142" height="54" rx="6" fill="#0f172a" stroke={vibWarn ? '#f59e0b' : '#22c55e'} strokeWidth="1.5" />
              <text x="706" y="82" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">TE-401DE / VT-401</text>
              <text x="706" y="99" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
                {bearingDE.toFixed(1)}°C · {vibration.toFixed(2)} mm/s
              </text>
              <text x="706" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9">PeakVue: {peakVue.toFixed(2)} gE</text>
              <line x1="705" y1="118" x2="705" y2="154" stroke="#475569" strokeDasharray="2 2" />
            </g>
          </svg>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span>Click any mechanical zone (Tail Tensioner, Optical Portal, Belt Totes, Head Gearmotor) to open OEM faceplate</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>IEC 61131 VFD Telemetry Active</span>
        </div>
      </div>

      {/* Bottom Diagnostics & Interlock Strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '12px', padding: '12px 20px 18px 20px'
      }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gauge size={13} color="#38bdf8" /> Belt Kinematics & Slip
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><span style={{ color: '#64748b' }}>Line Speed:</span> <strong className="tabular-nums">{beltSpeed.toFixed(2)} m/s</strong></div>
            <div><span style={{ color: '#64748b' }}>Motor Slip:</span> <strong className="tabular-nums" style={{ color: slipWarn ? '#fbbf24' : '#34d399' }}>{motorSlip.toFixed(1)}%</strong></div>
            <div><span style={{ color: '#64748b' }}>Belt Tension:</span> <strong className="tabular-nums" style={{ color: tensionWarn ? '#fbbf24' : '#38bdf8' }}>{beltTension}%</strong></div>
            <div><span style={{ color: '#64748b' }}>Efficiency:</span> <strong className="tabular-nums">{efficiency.toFixed(1)}%</strong></div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={13} color="#f59e0b" /> Timken Pillow Block Bearings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><span style={{ color: '#64748b' }}>DE Head Temp:</span> <strong className="tabular-nums">{bearingDE.toFixed(1)} °C</strong></div>
            <div><span style={{ color: '#64748b' }}>NDE Tail Temp:</span> <strong className="tabular-nums">{bearingNDE.toFixed(1)} °C</strong></div>
            <div><span style={{ color: '#64748b' }}>ISO Vibration:</span> <strong className="tabular-nums">{vibration.toFixed(2)} mm/s</strong></div>
            <div><span style={{ color: '#64748b' }}>PeakVue Shock:</span> <strong className="tabular-nums">{peakVue.toFixed(2)} gE</strong></div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#22c55e" /> Conveyor Safety Interlocks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            {[
              { label: 'Pull-Cord E-Stop Loop', ok: true },
              { label: `Motor Slip Alarm (< 3.5%)`, ok: !slipWarn },
              { label: `Belt Tension Limit (> 85%)`, ok: !tensionWarn },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                <span style={{ color: item.ok ? '#34d399' : '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {item.ok ? 'NORMAL' : 'ADVISORY'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Faceplate Modal */}
      {activeFaceplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px', background: '#0f172a', border: '1px solid #38bdf8',
            borderRadius: '12px', padding: '22px', color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                {activeFaceplate === 'drive' && 'SEW 5.5 kW Helical-Bevel Gearmotor & DE Bearings'}
                {activeFaceplate === 'tail' && 'Crowned Tail Pulley & Take-Up Tensioners'}
                {activeFaceplate === 'portal' && 'Optical Edge Tracker & Barcode Portal'}
                {activeFaceplate === 'belt' && 'Cleated Urethane Modular Belt'}
              </h3>
              <button onClick={() => setActiveFaceplate(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {activeFaceplate === 'drive' && `Direct-mounted 5.5 kW 415V helical-bevel drive operating at ${rpm} RPM (${vfdHz} Hz). Timken UC207-20 spherical pillow block bearings instrumented with Pt100 RTD (${bearingDE.toFixed(1)}°C) and PeakVue shock accelerometer (${peakVue.toFixed(2)} gE).`}
              {activeFaceplate === 'tail' && `Crowned steel tail drum with dual Acme tension take-up rods maintaining ${beltTension}% nominal preload tension to prevent head pulley slip (${motorSlip.toFixed(1)}%).`}
              {activeFaceplate === 'portal' && 'Overhead aluminum gantry housing Sick optical edge-tracking sensors and top-down industrial barcode verification.'}
              {activeFaceplate === 'belt' && `12m cleated FDA polyurethane modular belt riding on a low-friction UHMW-PE wear bed at ${beltSpeed.toFixed(2)} m/s linear speed.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveFaceplate(null)} style={{ padding: '7px 16px', borderRadius: '6px', background: '#1d4ed8', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Close Faceplate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
