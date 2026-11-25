import { useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Droplets, Flame,
  ShieldCheck, Thermometer, Wind, X, Zap
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
 * ISA-101 2D Substation & Transformer SCADA HMI for XFMR-302
 * ABB 1000 kVA 11 kV / 415 V Dyn11 ONAN/ONAF Power Transformer + IEEE C57.104 DGA
 */
export function TransformerSCADAView({ sensors, machine }) {
  const [activeFaceplate, setActiveFaceplate] = useState(null);
  const [fanMode, setFanMode] = useState('AUTO'); // 'AUTO' | 'FORCED' | 'OFF'
  const [tapStep, setTapStep] = useState(3); // 1..5 OLTC tap position

  const topOilTemp = getNum(sensors?.topOilTemp, 48.2);
  const hotspotTemp = getNum(sensors?.windingHotspotTemp, 58.6);
  const ambientTemp = getNum(sensors?.ambientTemp, 35.0);
  const activePowerKw = getNum(sensors?.activePower, 565);
  const powerFactor = getNum(sensors?.powerFactor, 0.89);
  const hvCurrent = getNum(sensors?.current, 42.1);
  const h2 = getNum(sensors?.hydrogenGas, 24);
  const ch4 = getNum(sensors?.methaneGas, 18);
  const c2h4 = getNum(sensors?.ethyleneGas, 14);
  const c2h2 = getNum(sensors?.acetyleneGas, 2);
  const co = getNum(sensors?.carbonMonoxide, 210);
  const bdv = getNum(sensors?.breakdownVoltage, 60);
  const moisture = getNum(sensors?.moisturePpm, 13);
  const conservatorPress = getNum(sensors?.pressure, 1.15);

  const fansRunning = fanMode === 'FORCED' || (fanMode === 'AUTO' && topOilTemp > 45);
  const dgaCondition = sensors?.dgaCondition || (h2 > 100 || c2h2 > 15 ? 'Condition 3 (Caution)' : h2 > 50 ? 'Condition 2 (Monitor)' : 'Condition 1 (Normal)');
  const loadPct = Math.min(125, Math.round((activePowerKw / (1000 * powerFactor)) * 100));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      background: 'linear-gradient(180deg, #0b1120 0%, #070d18 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      color: '#f8fafc',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)'
    }}>
      {/* Top Substation Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                XFMR-302 • 1000 kVA 11 kV / 415 V Substation Transformer HMI
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.16)', color: '#34d399',
                border: '1px solid rgba(16,185,129,0.35)'
              }}>
                ENERGIZED • {loadPct}% MVA ({activePowerKw.toFixed(0)} kW)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Vector Group Dyn11 · IEEE C57.104: {dgaCondition} · Core 50 Hz Static
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1e293b', padding: '3px', borderRadius: '6px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', padding: '0 6px' }}>ONAF Fans:</span>
            {['AUTO', 'FORCED', 'OFF'].map(mode => (
              <button
                key={mode}
                onClick={() => setFanMode(mode)}
                style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  fontSize: '10px', fontWeight: 700,
                  background: fanMode === mode ? '#1d4ed8' : 'transparent',
                  color: fanMode === mode ? '#ffffff' : '#94a3b8'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>OLTC Tap:</span>
            <button onClick={() => setTapStep(s => Math.max(1, s - 1))} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', width: 20, height: 20, cursor: 'pointer' }}>-</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>{tapStep}/5</span>
            <button onClick={() => setTapStep(s => Math.min(5, s + 1))} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', width: 20, height: 20, cursor: 'pointer' }}>+</button>
          </div>
        </div>
      </div>

      {/* Interactive Substation Schematic */}
      <div style={{ padding: '16px 20px 8px 20px' }}>
        <div style={{ background: '#090f1d', borderRadius: '10px', border: '1px solid #1e293b', padding: '10px' }}>
          <svg viewBox="0 0 800 360" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="xfmrTankGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="oilCoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* 11 kV Primary Feeder Bus */}
            <line x1="250" y1="24" x2="550" y2="24" stroke="#f59e0b" strokeWidth="3" />
            <text x="400" y="16" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">11 kV PRIMARY FEEDER BUS (52-MV CLOSED)</text>

            {/* 3 Porcelain HV Bushings */}
            <g onClick={() => setActiveFaceplate('bushings')} style={{ cursor: 'pointer' }}>
              {[335, 400, 465].map((bx, i) => (
                <g key={bx}>
                  <line x1={bx} y1="24" x2={bx} y2="62" stroke="#f59e0b" strokeWidth="2.5" />
                  <rect x={bx - 10} y="62" width="20" height="44" rx="4" fill="#9a3412" stroke="#fdba74" strokeWidth="1.2" />
                  <line x1={bx - 13} y1="74" x2={bx + 13} y2="74" stroke="#fdba74" strokeWidth="1.5" />
                  <line x1={bx - 13} y1="88" x2={bx + 13} y2="88" stroke="#fdba74" strokeWidth="1.5" />
                  <text x={bx} y="56" textAnchor="middle" fill="#94a3b8" fontSize="9">HV-{['A','B','C'][i]}</text>
                </g>
              ))}
            </g>

            {/* Overhead Oil Conservator + Buchholz + Silica Breather (Left Top) */}
            <g onClick={() => setActiveFaceplate('conservator')} style={{ cursor: 'pointer' }}>
              <rect x="60" y="45" width="160" height="42" rx="18" fill="url(#xfmrTankGrad)" stroke="#38bdf8" strokeWidth="1.8" />
              <text x="140" y="64" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700">CONSERVATOR DRUM</text>
              <text x="140" y="78" textAnchor="middle" fill="#38bdf8" fontSize="9">P = {conservatorPress.toFixed(2)} bar · MOG OK</text>
              {/* Equalizer Pipe & Buchholz Relay */}
              <path d="M 205 87 L 265 128" stroke="#64748b" strokeWidth="6" />
              <rect x="216" y="96" width="28" height="20" rx="4" fill="#d97706" stroke="#fde68a" strokeWidth="1.5" />
              <text x="208" y="110" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="700">BUCHHOLZ</text>
              {/* Silica Gel Breather */}
              <line x1="78" y1="87" x2="78" y2="128" stroke="#94a3b8" strokeWidth="2.5" />
              <rect x="66" y="128" width="24" height="36" rx="4" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.5" />
              <text x="78" y="178" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="600">SILICA BREATHER</text>
            </g>

            {/* Main Hermetic Tank & Core Winding Cutaway */}
            <g onClick={() => setActiveFaceplate('core')} style={{ cursor: 'pointer' }}>
              <rect x="255" y="106" width="290" height="200" rx="8" fill="url(#xfmrTankGrad)" stroke="#94a3b8" strokeWidth="2" />
              {/* Internal Oil & Magnetic Core Visualization */}
              <rect x="275" y="124" width="250" height="164" rx="4" fill="url(#oilCoreGrad)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
              {/* 3 Phase Laminated Core & Windings */}
              {[335, 400, 465].map((cx) => (
                <g key={cx}>
                  <rect x={cx - 18} y="148" width="36" height="114" rx="3" fill="#b45309" stroke="#fbbf24" strokeWidth="1.5" />
                  {[165, 185, 205, 225, 245].map(wy => (
                    <line key={wy} x1={cx - 18} y1={wy} x2={cx + 18} y2={wy} stroke="#fde68a" strokeWidth="1.5" opacity="0.7" />
                  ))}
                </g>
              ))}
              <text x="400" y="138" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="700">
                TOP OIL: {topOilTemp.toFixed(1)}°C · HOTSPOT: {hotspotTemp.toFixed(1)}°C
              </text>
              <text x="400" y="280" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="600">
                1000 kVA Dyn11 • Shell Diala S4 (BDV {bdv} kV)
              </text>
            </g>

            {/* Radiator Fin Banks + Animated ONAF Cooling Fans */}
            <g onClick={() => setActiveFaceplate('radiators')} style={{ cursor: 'pointer' }}>
              {[185, 565].map((rx, idx) => (
                <g key={rx}>
                  <rect x={rx} y="142" width="50" height="130" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  {[0, 10, 20, 30, 40].map(off => (
                    <line key={off} x1={rx + 5 + off} y1="146" x2={rx + 5 + off} y2="268" stroke="#94a3b8" strokeWidth="2" />
                  ))}
                  {/* Manifold pipes */}
                  <line x1={idx === 0 ? 235 : 545} y1="158" x2={idx === 0 ? 255 : 565} y2="158" stroke="#64748b" strokeWidth="6" />
                  <line x1={idx === 0 ? 235 : 545} y1="256" x2={idx === 0 ? 255 : 565} y2="256" stroke="#64748b" strokeWidth="6" />
                  {/* ONAF Fan Hub */}
                  <circle cx={rx + 25} cy="207" r="18" fill="#0f172a" stroke={fansRunning ? '#34d399' : '#64748b'} strokeWidth="2" />
                  <g>
                    <line x1={rx + 12} y1="207" x2={rx + 38} y2="207" stroke="#e2e8f0" strokeWidth="2.5" />
                    <line x1={rx + 25} y1="194" x2={rx + 25} y2="220" stroke="#e2e8f0" strokeWidth="2.5" />
                    {fansRunning && (
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${rx + 25} 207`} to={`360 ${rx + 25} 207`} dur="0.7s" repeatCount="indefinite" />
                    )}
                  </g>
                </g>
              ))}
              <text x="590" y="290" textAnchor="middle" fill={fansRunning ? '#34d399' : '#94a3b8'} fontSize="10" fontWeight="700">
                ONAF FANS: {fansRunning ? 'RUNNING' : 'STANDBY'}
              </text>
            </g>

            {/* LV 415 V Bus & DGA Analyzer Panel (Right Side) */}
            <g onClick={() => setActiveFaceplate('dga')} style={{ cursor: 'pointer' }}>
              <rect x="645" y="106" width="135" height="192" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="712" y="126" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">IEEE C57.104 DGA</text>
              {[
                { label: 'H₂', val: `${h2} ppm`, warn: h2 > 80 },
                { label: 'CH₄', val: `${ch4} ppm`, warn: false },
                { label: 'C₂H₄', val: `${c2h4} ppm`, warn: false },
                { label: 'C₂H₂', val: `${c2h2} ppm`, warn: c2h2 > 10 },
                { label: 'CO', val: `${co} ppm`, warn: false },
                { label: 'H₂O', val: `${moisture} ppm`, warn: moisture > 25 },
              ].map((g, i) => (
                <g key={g.label}>
                  <text x="658" y={150 + i * 23} fill="#94a3b8" fontSize="10">{g.label}</text>
                  <text x="768" y={150 + i * 23} textAnchor="end" fill={g.warn ? '#fbbf24' : '#f8fafc'} fontSize="11" fontWeight="700">{g.val}</text>
                </g>
              ))}
            </g>

            {/* LV Secondary Output Bar */}
            <line x1="255" y1="332" x2="545" y2="332" stroke="#38bdf8" strokeWidth="3" />
            <text x="400" y="350" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
              415 V LV PLANT MCC FEEDER • {hvCurrent.toFixed(1)} A HV · cos φ {powerFactor}
            </text>
          </svg>
        </div>
      </div>

      {/* Bottom Diagnostics & Safety Trips */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '12px', padding: '12px 20px 18px 20px'
      }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={13} color="#f59e0b" /> IEC 60076-7 Thermal Model
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><span style={{ color: '#64748b' }}>Top Oil:</span> <strong className="tabular-nums">{topOilTemp.toFixed(1)} °C</strong></div>
            <div><span style={{ color: '#64748b' }}>Hotspot:</span> <strong className="tabular-nums" style={{ color: hotspotTemp > 88 ? '#fbbf24' : '#34d399' }}>{hotspotTemp.toFixed(1)} °C</strong></div>
            <div><span style={{ color: '#64748b' }}>Ambient:</span> <strong className="tabular-nums">{ambientTemp.toFixed(1)} °C</strong></div>
            <div><span style={{ color: '#64748b' }}>OLTC Tap:</span> <strong className="tabular-nums">Pos {tapStep}/5</strong></div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Droplets size={13} color="#38bdf8" /> Oil Dielectric Quality
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><span style={{ color: '#64748b' }}>BDV Strength:</span> <strong className="tabular-nums" style={{ color: bdv < 40 ? '#fbbf24' : '#34d399' }}>{bdv} kV</strong></div>
            <div><span style={{ color: '#64748b' }}>Moisture:</span> <strong className="tabular-nums">{moisture} ppm</strong></div>
            <div><span style={{ color: '#64748b' }}>H₂ Gas:</span> <strong className="tabular-nums">{h2} ppm</strong></div>
            <div><span style={{ color: '#64748b' }}>C₂H₂ Arc Gas:</span> <strong className="tabular-nums">{c2h2} ppm</strong></div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#22c55e" /> Substation Protection Trips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            {[
              { label: 'Buchholz Gas Surge (63G)', ok: true },
              { label: 'Winding Hotspot (< 98°C)', ok: hotspotTemp < 98 },
              { label: 'Dielectric BDV (> 40 kV)', ok: bdv >= 40 },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                <span style={{ color: item.ok ? '#34d399' : '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {item.ok ? 'ARMED' : 'ALARM'}
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
            width: '100%', maxWidth: '480px', background: '#0f172a', border: '1px solid #f59e0b',
            borderRadius: '12px', padding: '22px', color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                {activeFaceplate === 'bushings' && '11 kV Glazed Porcelain Bushings & Arc Horns'}
                {activeFaceplate === 'conservator' && 'Oil Conservator, Buchholz Relay & Silica Breather'}
                {activeFaceplate === 'core' && 'Dyn11 Laminated Copper Core & Oil Bath'}
                {activeFaceplate === 'radiators' && 'ONAN/ONAF Corrugated Cooling Fin Banks'}
                {activeFaceplate === 'dga' && 'Online IEEE C57.104 DGA Gas Monitor'}
              </h3>
              <button onClick={() => setActiveFaceplate(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {activeFaceplate === 'bushings' && '3-phase 11 kV porcelain shedded condenser bushings fitted with calibrated horn gaps to protect winding insulation from switching and lightning impulses.'}
              {activeFaceplate === 'conservator' && `Overhead thermal oil expansion vessel (${conservatorPress.toFixed(2)} bar). Inclined manifold routes nascent decomposition gas bubbles through the dual-float Buchholz surge relay while silica gel dehydrates breather intake air.`}
              {activeFaceplate === 'core' && `CRGO silicon-steel stepped magnetic core immersed in Shell Diala S4 ZX-I inhibited mineral oil (BDV ${bdv} kV, ${moisture} ppm H₂O). Winding hotspot currently measures ${hotspotTemp.toFixed(1)}°C.`}
              {activeFaceplate === 'radiators' && `Four detachable pressed-steel finned banks with butterfly isolation valves and thermostat-switched ONAF axial blowers (currently ${fansRunning ? 'Running' : 'Standby'}).`}
              {activeFaceplate === 'dga' && `Continuous photo-acoustic / solid-state DGA bridge reporting ${dgaCondition}: H₂ ${h2} ppm, CH₄ ${ch4} ppm, C₂H₄ ${c2h4} ppm, C₂H₂ ${c2h2} ppm, CO ${co} ppm.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveFaceplate(null)} style={{ padding: '7px 16px', borderRadius: '6px', background: '#d97706', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Close Faceplate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
