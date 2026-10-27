import { useState, useMemo } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Gauge,
  Layers, Play, Power, Radio, RefreshCw, RotateCcw, Settings,
  ShieldCheck, Sliders, Thermometer, Waves, Wind, X, Zap,
  BarChart3, Cpu, ArrowRight, CornerDownRight, Disc, Flame,
  Compass, Crosshair, Box, Wrench, Shield, Lock, Eye, Check
} from 'lucide-react';

/**
 * Safely extracts numeric value from sensor data, whether it's a number or { value: ... } object
 */
function getNum(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'object' && val.value !== undefined) {
    const num = Number(val.value);
    return isNaN(num) ? fallback : num;
  }
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Simplified, Ultra-Professional ISA-101 2D SCADA HMI for CNC Machining Center CNC-001
 * Modeled after DMG MORI CELOS & Siemens SINUMERIK ONE.
 * Presents a clean, unified widescreen dashboard combining the 2D machine schematic,
 * precision 3-axis DRO, hero spindle/feed telemetry, live G-code execution ticker, and faceplates.
 */
export function CNCSCADAView({ sensors, machine }) {
  const [activeFaceplate, setActiveFaceplate] = useState(null);
  const [ncMode, setNcMode] = useState('AUTO'); // 'AUTO' | 'MDI' | 'JOG'
  const [spindleOverride, setSpindleOverride] = useState(100);
  const [feedOverride, setFeedOverride] = useState(100);
  const [floodCoolantState, setFloodCoolantState] = useState(true);
  const [cycleRunning, setCycleRunning] = useState(true);

  // Dynamic telemetry values strictly unwrapped as numbers
  const spindleRpm = getNum(sensors?.spindleSpeed, 4200);
  const targetRpm = Math.round(spindleRpm * (spindleOverride / 100));
  const feedRate = getNum(sensors?.feedRate, 650);
  const targetFeed = Math.round(feedRate * (feedOverride / 100));
  const spindleLoad = getNum(sensors?.spindleLoad, 62);
  const spindleTorque = getNum(sensors?.spindleTorque, 38);
  const spindleRunout = getNum(sensors?.spindleRunout, 1.2);
  const thermalDrift = getNum(sensors?.thermalDriftZ, 0.8);
  const coolantPress = getNum(sensors?.coolantPressure, 4.2);
  const coolantFlow = getNum(sensors?.coolantFlow, 18.5);
  const spindleBearingTemp = getNum(sensors?.bearingDE, 52.4);
  const columnTemp = getNum(sensors?.temperature, 44.8);
  const ambientTemp = getNum(sensors?.ambientTemp, 23.5);
  const vibrationVal = getNum(sensors?.vibration, 1.2);

  const axisX = Number(sensors?.axisPos?.x ?? (typeof sensors?.axisX === 'number' ? sensors.axisX : 142.65)) || 142.65;
  const axisY = Number(sensors?.axisPos?.y ?? (typeof sensors?.axisY === 'number' ? sensors.axisY : -34.82)) || -34.82;
  const axisZ = Number(sensors?.axisPos?.z ?? (typeof sensors?.axisZ === 'number' ? sensors.axisZ : -12.45)) || -12.45;

  const isRunning = machine?.status !== 'stopped' && machine?.health > 20 && cycleRunning;

  // Active G-Code Execution Blocks
  const gcodeBlocks = useMemo(() => [
    { line: 'N0415', code: 'G01 Z-12.450 F250', desc: 'Helical ramp plunge' },
    { line: 'N0420', code: `G01 X${axisX.toFixed(3)} Y${axisY.toFixed(3)} F${targetFeed}`, desc: 'Trochoidal Pocket Milling', active: true },
    { line: 'N0425', code: 'G02 X156.400 Y-48.570 I13.750 J0.000', desc: 'Pocket circular contour' }
  ], [axisX, axisY, targetFeed]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      background: 'linear-gradient(180deg, #0b1120 0%, #070d18 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(59, 130, 246, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      overflow: 'hidden',
      color: '#f8fafc',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
    }}>
      {/* ── Top Header Ribbon: Machine Identification & Cycle Controls ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Machine Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#60a5fa'
          }}>
            <Cpu size={13} className="animate-pulse" />
            SINUMERIK 840D sl
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: isRunning ? '#10b981' : '#ef4444',
              boxShadow: isRunning ? '0 0 10px #10b981' : '0 0 10px #ef4444'
            }} />
            <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              {isRunning ? 'CYCLE ACTIVE (AUTOMATIC)' : 'FEED HOLD / STANDBY'}
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              PROG: O0824_POCKET_FINISH.NC
            </span>
          </div>
        </div>

        {/* Mode Selector & Cycle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#0b1329', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['AUTO', 'MDI', 'JOG'].map(m => (
              <button
                key={m}
                onClick={() => setNcMode(m)}
                style={{
                  background: ncMode === m ? '#2563eb' : 'transparent',
                  color: ncMode === m ? '#ffffff' : '#64748b',
                  border: 'none', padding: '4px 10px', borderRadius: '4px',
                  fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCycleRunning(!cycleRunning)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: cycleRunning ? '#dc2626' : '#16a34a',
              color: '#ffffff', border: 'none',
              padding: '6px 14px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              boxShadow: cycleRunning ? '0 0 12px rgba(220, 38, 38, 0.4)' : '0 0 12px rgba(22, 163, 74, 0.4)'
            }}
          >
            <Power size={13} />
            {cycleRunning ? 'FEED HOLD' : 'CYCLE START'}
          </button>
        </div>
      </div>

      {/* ── 4 Hero Telemetry Cards Strip ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
        gap: '12px',
        padding: '16px 20px',
        background: '#090e1a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Card 1: Spindle Speed */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px', padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>SPINDLE SPEED</span>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>S-OVERRIDE {spindleOverride}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {targetRpm.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>RPM</span>
          </div>
        </div>

        {/* Card 2: Feed Velocity */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px', padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>FEED VELOCITY</span>
            <span style={{ fontSize: '10px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>F-OVERRIDE {feedOverride}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              {targetFeed}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>mm/min</span>
          </div>
        </div>

        {/* Card 3: Spindle Load & Power */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px', padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>SPINDLE LOAD</span>
            <span style={{ fontSize: '10px', color: spindleLoad > 80 ? '#ef4444' : '#f8fafc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {spindleLoad}% ({(spindleLoad * 3.7 / 100).toFixed(1)} kW)
            </span>
          </div>
          <div style={{
            height: '6px', background: '#1e293b', borderRadius: '3px',
            overflow: 'hidden', marginTop: '10px'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, spindleLoad))}%`,
              background: spindleLoad > 80
                ? 'linear-gradient(90deg, #10b981 60%, #eab308 80%, #ef4444 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Card 4: Flood Coolant */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '8px', padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
              FLOOD COOLANT
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#06b6d4' }}>
                {coolantPress}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>bar ({coolantFlow} L/m)</span>
            </div>
          </div>
          <button
            onClick={() => setFloodCoolantState(!floodCoolantState)}
            style={{
              background: floodCoolantState ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.06)',
              border: floodCoolantState ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
              color: floodCoolantState ? '#38bdf8' : '#64748b',
              padding: '6px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {floodCoolantState ? 'M08 ON' : 'M09 OFF'}
          </button>
        </div>
      </div>

      {/* ── Main Unified View: Simplified 2D Machine Visual & 3-Axis DRO ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        minHeight: '440px',
        background: '#070d18'
      }}>
        {/* Left: Clean Architectural 2D Machine Schematic */}
        <div style={{
          position: 'relative',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'radial-gradient(ellipse at center, #0f1c35 0%, #070d18 100%)'
        }}>
          {/* Quick Inspector Hint */}
          <div style={{
            position: 'absolute', top: '14px', left: '20px',
            fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Wrench size={13} style={{ color: '#38bdf8' }} />
            <span>Click any assembly tag (Spindle, Tool, Table, Sump) for engineering faceplate</span>
          </div>

          <SimplifiedMachineSVG
            isRunning={isRunning}
            floodCoolantState={floodCoolantState}
            spindleRpm={targetRpm}
            axisX={axisX}
            axisY={axisY}
            axisZ={axisZ}
            spindleBearingTemp={spindleBearingTemp}
            coolantPress={coolantPress}
            onSelectPart={(key) => setActiveFaceplate(key)}
          />
        </div>

        {/* Right: Integrated Precision 3-Axis DRO & Live G-Code Ticker */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '18px',
          gap: '16px',
          background: 'rgba(11, 17, 32, 0.98)'
        }}>
          {/* 3-Axis DRO Panel */}
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '10px', paddingBottom: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                3-AXIS PRECISION DRO
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                WCS: G54
              </span>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { axis: 'X', val: axisX, color: '#ef4444' },
                { axis: 'Y', val: axisY, color: '#10b981' },
                { axis: 'Z', val: axisZ, color: '#3b82f6' }
              ].map(item => (
                <div key={item.axis} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#070d18', padding: '8px 12px', borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <span style={{
                    fontWeight: 900, fontSize: '14px', color: item.color,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    AXIS {item.axis}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700,
                      color: '#f8fafc', letterSpacing: '0.02em'
                    }}>
                      {item.val >= 0 ? `+${item.val.toFixed(3)}` : item.val.toFixed(3)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Live G-Code Ticker */}
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px'
          }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              ACTIVE G-CODE EXECUTION BLOCK
            </span>
            <div style={{ display: 'grid', gap: '4px' }}>
              {gcodeBlocks.map((blk) => (
                <div
                  key={blk.line}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', borderRadius: '4px',
                    background: blk.active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    border: blk.active ? '1px solid #3b82f6' : '1px solid transparent',
                    color: blk.active ? '#60a5fa' : '#64748b',
                    fontWeight: blk.active ? 700 : 500
                  }}
                >
                  <span style={{ color: blk.active ? '#38bdf8' : '#64748b' }}>{blk.line}</span>
                  <span style={{ color: blk.active ? '#ffffff' : '#94a3b8' }}>{blk.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Sliders */}
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Spindle Override</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{spindleOverride}%</span>
            </div>
            <input
              type="range" min="50" max="120" step="5"
              value={spindleOverride}
              onChange={(e) => setSpindleOverride(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6', height: '4px', cursor: 'pointer', marginBottom: '10px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Feedrate Override</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>{feedOverride}%</span>
            </div>
            <input
              type="range" min="0" max="150" step="5"
              value={feedOverride}
              onChange={(e) => setFeedOverride(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', height: '4px', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* ── Component Technical Faceplate Modal ────────────────────────── */}
      {activeFaceplate && (
        <SimplifiedFaceplateModal
          partKey={activeFaceplate}
          onClose={() => setActiveFaceplate(null)}
          spindleRpm={targetRpm}
          feedRate={targetFeed}
          spindleLoad={spindleLoad}
          spindleTorque={spindleTorque}
          spindleRunout={spindleRunout}
          spindleBearingTemp={spindleBearingTemp}
          columnTemp={columnTemp}
          thermalDrift={thermalDrift}
          ambientTemp={ambientTemp}
          coolantPress={coolantPress}
          coolantFlow={coolantFlow}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplified, Elegant 2D Machining Center SVG Visual
// ─────────────────────────────────────────────────────────────────────────────
function SimplifiedMachineSVG({
  isRunning, floodCoolantState, spindleRpm, axisX, axisY, axisZ,
  spindleBearingTemp, coolantPress, onSelectPart
}) {
  return (
    <svg
      viewBox="0 0 700 460"
      style={{ width: '100%', maxWidth: '680px', height: 'auto', userSelect: 'none' }}
    >
      <defs>
        {/* Subtle glow filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="coolantFlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* 1. Rigid Column Base */}
      <rect x="290" y="40" width="120" height="340" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      {/* Precision Box Ways */}
      <line x1="315" y1="60" x2="315" y2="360" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
      <line x1="385" y1="60" x2="385" y2="360" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />

      {/* 2. Spindle Headstock Assembly (Clickable) */}
      <g onClick={() => onSelectPart('spindle')} style={{ cursor: 'pointer' }}>
        <path
          d="M 305 70 L 395 70 L 395 170 L 375 180 L 325 180 L 305 170 Z"
          fill="#dc2626" stroke="#ef4444" strokeWidth="2"
        />
        {/* Spindle Motor Block */}
        <rect x="325" y="48" width="50" height="28" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="350" y="66" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
          3.7kW
        </text>

        {/* Bearing Temperature Badge */}
        <rect x="405" y="115" width="70" height="20" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1.2" />
        <text x="440" y="129" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
          {spindleBearingTemp}°C
        </text>
        <line x1="395" y1="125" x2="405" y2="125" stroke="#ef4444" strokeWidth="1.2" />

        {/* Tag Pill */}
        <rect x="220" y="115" width="75" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
        <text x="257" y="129" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
          SPINDLE HEAD
        </text>
        <line x1="295" y1="125" x2="305" y2="125" stroke="#38bdf8" strokeWidth="1.2" />
      </g>

      {/* 3. ISO 40 Tool Holder & Cutter (Clickable) */}
      <g onClick={() => onSelectPart('tool')} style={{ cursor: 'pointer' }}>
        {/* Tool Holder */}
        <polygon points="335,180 365,180 360,205 340,205" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Collet Nut */}
        <rect x="342" y="205" width="16" height="10" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
        {/* 4-Flute End Mill Cutter */}
        <rect x="347" y="215" width="6" height="22" rx="1" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />

        {/* Dynamic Rotation Effect */}
        {isRunning && (
          <ellipse
            cx="350" cy="225" rx="14" ry="4"
            fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3"
          />
        )}
      </g>

      {/* 4. High-Pressure Coolant Nozzle Jet */}
      {floodCoolantState && (
        <g>
          {/* Loc-Line Nozzle */}
          <path d="M 325 180 Q 315 200 340 226" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          {/* Coolant Jet Stream */}
          {isRunning && (
            <polygon points="340,226 348,235 352,234" fill="url(#coolantFlow)" filter="url(#softGlow)" />
          )}
        </g>
      )}

      {/* 5. Compound Worktable & Clamped Workpiece (Clickable) */}
      <g onClick={() => onSelectPart('table')} style={{ cursor: 'pointer' }}>
        {/* Cross Saddle & Knee */}
        <rect x="250" y="290" width="200" height="70" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />

        {/* Moving T-Slot Precision Table */}
        <g transform={`translate(${isRunning ? Math.sin(axisX * 0.1) * 20 : 0}, 0)`}>
          <rect x="160" y="260" width="380" height="30" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <line x1="180" y1="275" x2="520" y2="275" stroke="#0f172a" strokeWidth="3" />

          {/* Kurt Vise & Aerospace Workpiece */}
          <rect x="305" y="240" width="90" height="20" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="325" y="228" width="50" height="14" rx="2" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1.5" />
          <text x="350" y="239" textAnchor="middle" fill="#0f172a" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
            7075-T6
          </text>
        </g>

        {/* Dual Handwheels on Knee Front */}
        {/* Left Handwheel (X-Axis Feed) */}
        <g onClick={(e) => { e.stopPropagation(); onSelectPart('table'); }} style={{ cursor: 'pointer' }}>
          <circle cx="290" cy="325" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <circle cx="290" cy="325" r="7" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          {/* Rotating Handwheel Handle */}
          <g transform={`rotate(${isRunning ? (axisX * 18) % 360 : 0}, 290, 325)`}>
            <line x1="290" y1="325" x2="290" y2="311" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="290" cy="311" r="3.5" fill="#f8fafc" />
          </g>
          <text x="290" y="352" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="var(--font-mono)" fontWeight="700">
            HANDWHEEL X
          </text>
        </g>

        {/* Right Handwheel (Y-Axis Feed) */}
        <g onClick={(e) => { e.stopPropagation(); onSelectPart('table'); }} style={{ cursor: 'pointer' }}>
          <circle cx="410" cy="325" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <circle cx="410" cy="325" r="7" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          {/* Rotating Handwheel Handle */}
          <g transform={`rotate(${isRunning ? (axisY * 18) % 360 : 45}, 410, 325)`}>
            <line x1="410" y1="325" x2="410" y2="311" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="410" cy="311" r="3.5" fill="#f8fafc" />
          </g>
          <text x="410" y="352" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="var(--font-mono)" fontWeight="700">
            HANDWHEEL Y
          </text>
        </g>

        {/* Table Tag Pill */}
        <rect x="70" y="265" width="80" height="20" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
        <text x="110" y="279" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
          X/Y TABLE
        </text>
        <line x1="150" y1="275" x2="160" y2="275" stroke="#10b981" strokeWidth="1.2" />
      </g>

      {/* 6. Foundation Base & Coolant Sump (Clickable) */}
      <g onClick={() => onSelectPart('coolant')} style={{ cursor: 'pointer' }}>
        <path d="M 210 370 L 490 370 L 510 430 L 190 430 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        {/* Coolant Liquid Level */}
        <rect x="220" y="388" width="260" height="32" rx="3" fill="rgba(6, 182, 212, 0.25)" stroke="#0891b2" strokeWidth="1" />
        {/* Animated surface wave */}
        <path d="M 220 388 Q 280 385 350 388 T 480 388" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-pulse" />
        <text x="350" y="408" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
          COOLANT SUMP: 60L (4.2 bar)
        </text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplified Technical Faceplate Modal
// ─────────────────────────────────────────────────────────────────────────────
function SimplifiedFaceplateModal({
  partKey, onClose, spindleRpm, feedRate, spindleLoad, spindleTorque,
  spindleRunout, spindleBearingTemp, columnTemp, thermalDrift, ambientTemp,
  coolantPress, coolantFlow
}) {
  const SPECS = {
    spindle: {
      title: 'Spindle Headstock & Vector Motor',
      tag: 'ISO 40 CARTRIDGE',
      items: [
        { label: 'Spindle Drive Motor', val: '3.7 kW Vector AC Motor' },
        { label: 'Operating Speed', val: `${spindleRpm} RPM` },
        { label: 'Dynamic Spindle Torque', val: `${spindleTorque} N·m` },
        { label: 'Hybrid Ceramic Bearing Temp', val: `${spindleBearingTemp}°C (Pt100)` },
        { label: 'Dynamic Runout (TIR)', val: `${spindleRunout} µm (Limit: 5.0 µm)` }
      ]
    },
    tool: {
      title: 'Active ISO 40 Tool Holder & Cutter',
      tag: 'TOOL T04 • Ø16mm',
      items: [
        { label: 'Tool Type', val: 'Solid Carbide 4-Flute End Mill' },
        { label: 'Coating', val: 'AlTiN Nanocomposite Bronze' },
        { label: 'Collet Chuck', val: 'ER32 Precision Chuck' },
        { label: 'Feed per Tooth (fz)', val: '0.038 mm/z' },
        { label: 'Remaining Tool Life', val: '74% (148 min remaining)' }
      ]
    },
    table: {
      title: 'Compound Worktable & Servos',
      tag: 'X/Y C3 BALL SCREWS',
      items: [
        { label: 'Dimensions', val: '1270 mm × 254 mm Hardened' },
        { label: 'Active Feedrate', val: `${feedRate} mm/min` },
        { label: 'Ball Screws', val: 'C3 Ground Double Preloaded' },
        { label: 'Fixturing', val: 'Kurt AngLock Precision Vise' },
        { label: 'Clamped Workpiece', val: '7075-T6 Aerospace Aluminum' }
      ]
    },
    coolant: {
      title: 'Flood Coolant & Sump System',
      tag: 'P-02 • 60L RESERVOIR',
      items: [
        { label: 'Pump Model', val: 'Multi-Stage Immersion P-02' },
        { label: 'Discharge Pressure', val: `${coolantPress} bar` },
        { label: 'Delivery Flow', val: `${coolantFlow} L/min` },
        { label: 'Reservoir Capacity', val: '60 Liters Emulsion' },
        { label: 'Chiller Temp', val: '22.4°C Target' }
      ]
    }
  };

  const current = SPECS[partKey] || SPECS.spindle;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#0b1120',
        border: '1px solid #3b82f6',
        borderRadius: '12px',
        padding: '24px',
        width: '480px',
        maxWidth: '90vw',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        color: '#f8fafc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
              {current.tag}
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0 0', color: '#f8fafc' }}>
              {current.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#94a3b8', padding: '6px', borderRadius: '6px', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
          {current.items.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#070d18', padding: '8px 12px', borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.04)', fontSize: '12px'
            }}>
              <span style={{ color: '#94a3b8' }}>{item.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                {item.val}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#2563eb', color: '#ffffff', border: 'none',
              padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Faceplate
          </button>
        </div>
      </div>
    </div>
  );
}
