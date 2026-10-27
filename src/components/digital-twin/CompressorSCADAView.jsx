import { useState, useMemo } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Gauge,
  Layers, Play, Power, Radio, RefreshCw, RotateCcw, Settings,
  ShieldCheck, Sliders, Thermometer, Waves, Wind, X, Zap,
  BarChart3, Cpu, ArrowRight, CornerDownRight, Disc, Flame,
  Compass, Crosshair, Box, Wrench, Shield, Lock, Eye, Check,
  Droplets, Filter, Airplay
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
 * World-Class ISA-101 2D SCADA HMI for Atlas Copco Automan AT Series COMP-201
 * Dual-Stage Intercooled Air Compressor & 200L ASME Air Receiver.
 */
export function CompressorSCADAView({ sensors, machine }) {
  const [activeFaceplate, setActiveFaceplate] = useState(null);
  const [compressorMode, setCompressorMode] = useState('AUTO'); // 'AUTO' | 'CONTINUOUS' | 'UNLOADED'
  const [cutInPressure, setCutInPressure] = useState(6.2);
  const [cutOutPressure, setCutOutPressure] = useState(8.5);
  const [purgingDrain, setPurgingDrain] = useState(false);
  const [systemRunning, setSystemRunning] = useState(true);

  // Unwrapped dynamic telemetry values
  const tankPressure = getNum(sensors?.tankPressure, 7.4);
  const stage1Temp = getNum(sensors?.stage1Temp, 68.2);
  const airDelivery = getNum(sensors?.airDeliveryFAD, 850);
  const beltTension = getNum(sensors?.beltTension, 96);
  const separatorDeltaP = getNum(sensors?.separatorDeltaP, 0.22);
  const dewPoint = getNum(sensors?.dewPoint, 3.2);
  const motorTemp = getNum(sensors?.bearingNDE, 54.8);
  const cylinderTemp = getNum(sensors?.bearingDE, 74.5);
  const ambientTemp = getNum(sensors?.ambientTemp, 24.2);
  const vibration = getNum(sensors?.vibration, 1.45);
  const vibrationEnvelope = getNum(sensors?.vibrationEnvelope, 2.1);
  const motorCurrent = getNum(sensors?.current, 11.2);
  const motorVoltage = getNum(sensors?.voltage, 400);

  const isCompressing = systemRunning && machine?.status !== 'stopped' && tankPressure < cutOutPressure;
  const isUnloaded = systemRunning && tankPressure >= cutOutPressure;

  const triggerDrainPurge = () => {
    setPurgingDrain(true);
    setTimeout(() => setPurgingDrain(false), 2400);
  };

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
      {/* ── Top Header Ribbon: Machine Identification & Status ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
          }}>
            <Wind size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                COMP-201 • Dual-Stage Reciprocating Air Compressor HMI
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                background: isCompressing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: isCompressing ? '#4ade80' : '#38bdf8',
                border: `1px solid ${isCompressing ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
              }}>
                {isCompressing ? '● CHARGING (STAGE 1 & 2)' : isUnloaded ? '○ UNLOADED (STANDBY)' : 'IDLE'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Atlas Copco Automan AT Series • 200L ASME Sec VIII Receiver • 5.5 kW TEFC Motor (1450 RPM)
            </div>
          </div>
        </div>

        {/* Mode Selector & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['AUTO', 'CONTINUOUS', 'UNLOADED'].map(mode => (
              <button
                key={mode}
                onClick={() => setCompressorMode(mode)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: compressorMode === mode ? '#2563eb' : 'transparent',
                  color: compressorMode === mode ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={triggerDrainPurge}
            disabled={purgingDrain}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              background: purgingDrain ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              cursor: purgingDrain ? 'default' : 'pointer'
            }}
          >
            <Droplets size={13} color={purgingDrain ? '#ffffff' : '#38bdf8'} />
            {purgingDrain ? 'PURGING CONDENSATE...' : 'PURGE DRAIN'}
          </button>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '0px',
        minHeight: '480px'
      }}>
        {/* Left Column: Interactive Animated 2D Compressor System Schematic */}
        <div style={{
          position: 'relative',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.04) 0%, transparent 70%)',
          borderRight: '1px solid rgba(59, 130, 246, 0.15)'
        }}>
          {/* Animated SVG Air Compressor Schematic */}
          <svg viewBox="0 0 800 460" style={{ width: '100%', maxWidth: '720px', height: 'auto' }}>
            <defs>
              {/* Receiver Tank Gradients */}
              <linearGradient id="tankBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="35%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </linearGradient>
              <linearGradient id="tankPressureFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0.35)" />
              </linearGradient>
              {/* Copper Tube Gradient */}
              <linearGradient id="copperTubeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              {/* Cast Iron Fin Gradient */}
              <linearGradient id="castIronGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              {/* High-Torque Belt Texture Pattern */}
              <pattern id="beltPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="12" y2="12" stroke="#475569" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* ── 1. Floor Foundation Level & Feet ── */}
            <line x1="80" y1="410" x2="720" y2="410" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            {/* Left Foot */}
            <rect x="180" y="360" width="40" height="50" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="200" cy="405" r="4" fill="#64748b" />
            {/* Right Foot */}
            <rect x="580" y="360" width="40" height="50" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="600" cy="405" r="4" fill="#64748b" />

            {/* ── 2. 200L ASME Air Receiver Horizontal Cylinder ── */}
            <g
              onClick={() => setActiveFaceplate('tank')}
              style={{ cursor: 'pointer' }}
            >
              {/* Tank Main Cylindrical Shell */}
              <rect x="120" y="240" width="560" height="130" rx="45" fill="url(#tankBodyGrad)" stroke="#38bdf8" strokeWidth="2.5" />
              {/* Tank Pressure Level Horizon */}
              <rect
                x="140"
                y={370 - (tankPressure / 10) * 110}
                width="520"
                height={(tankPressure / 10) * 110}
                rx="12"
                fill="url(#tankPressureFill)"
              />
              {/* Tank Spec Stencil */}
              <text x="400" y="300" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="800" letterSpacing="0.08em">
                200L ASME SEC VIII • 16 BAR RATED
              </text>
              <text x="400" y="322" textAnchor="middle" fill="#93c5fd" fontSize="13" fontWeight="600">
                P = {tankPressure.toFixed(1)} bar • Dew Point = {dewPoint.toFixed(1)}°C
              </text>

              {/* Bottom Condensate Drain Valve */}
              <rect x="385" y="370" width="30" height="25" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="400" cy="385" r="6" fill={purgingDrain ? '#0284c7' : '#64748b'} />
              {purgingDrain && (
                <path d="M 400 395 L 400 425 M 394 415 L 400 425 L 406 415" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
              )}
            </g>

            {/* ── 3. Electric Motor Assembly (Right Side) ── */}
            <g
              onClick={() => setActiveFaceplate('motor')}
              style={{ cursor: 'pointer' }}
            >
              {/* Motor Stator Housing with Cooling Fins */}
              <rect x="520" y="110" width="130" height="110" rx="8" fill="url(#castIronGrad)" stroke="#60a5fa" strokeWidth="2" />
              {/* Cooling Ribs */}
              {[125, 140, 155, 170, 185, 200].map(y => (
                <line key={y} x1="530" y1={y} x2="640" y2={y} stroke="#475569" strokeWidth="2" />
              ))}
              {/* Motor Terminal Box */}
              <rect x="555" y="90" width="60" height="24" rx="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="585" y="106" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">400V 3Ø</text>
              <text x="585" y="165" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">5.5 kW</text>
              <text x="585" y="180" textAnchor="middle" fill="#94a3b8" fontSize="10">1450 RPM</text>

              {/* Motor Small Drive Pulley */}
              <circle cx="505" cy="165" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="505" cy="165" r="8" fill="#475569" />
              {/* Pulley Rotation Indicator */}
              <g transform={`rotate(${isCompressing ? '-45' : '0'} 505 165)`}>
                <line x1="490" y1="165" x2="520" y2="165" stroke="#94a3b8" strokeWidth="2" />
                <line x1="505" y1="150" x2="505" y2="180" stroke="#94a3b8" strokeWidth="2" />
              </g>
            </g>

            {/* ── 4. Twin-Cylinder Compressor Pump Head (Left Side) ── */}
            <g
              onClick={() => setActiveFaceplate('cylinders')}
              style={{ cursor: 'pointer' }}
            >
              {/* Crankcase Base */}
              <rect x="220" y="170" width="130" height="60" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              <circle cx="285" cy="200" r="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <text x="285" y="204" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">OIL</text>

              {/* Stage 1 LP Cylinder (Left, Larger) */}
              <rect x="210" y="80" width="65" height="90" rx="4" fill="url(#castIronGrad)" stroke="#f59e0b" strokeWidth="2" />
              {[95, 110, 125, 140, 155].map(y => (
                <line key={y} x1="205" y1={y} x2="280" y2={y} stroke="#475569" strokeWidth="2" />
              ))}
              <text x="242" y="105" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">STAGE 1</text>
              <text x="242" y="122" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">{stage1Temp.toFixed(1)}°C</text>

              {/* Stage 2 HP Cylinder (Right, High Pressure) */}
              <rect x="290" y="95" width="55" height="75" rx="4" fill="url(#castIronGrad)" stroke="#ef4444" strokeWidth="2" />
              {[108, 122, 136, 150].map(y => (
                <line key={y} x1="285" y1={y} x2="350" y2={y} stroke="#475569" strokeWidth="2" />
              ))}
              <text x="317" y="118" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">STAGE 2</text>
              <text x="317" y="134" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">{cylinderTemp.toFixed(1)}°C</text>

              {/* Copper Intercooler Pipe connecting Stage 1 to Stage 2 */}
              <path
                d="M 242 75 C 242 50, 317 50, 317 90"
                fill="none"
                stroke="url(#copperTubeGrad)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 317 90 C 317 65, 410 65, 410 235"
                fill="none"
                stroke="url(#copperTubeGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>

            {/* ── 5. Aerodynamic Cooling Flywheel & Pulley ── */}
            <g
              onClick={() => setActiveFaceplate('flywheel')}
              style={{ cursor: 'pointer' }}
            >
              {/* Large Flywheel Outer Rim (Ø1190mm scale) */}
              <circle cx="285" cy="165" r="70" fill="none" stroke="#0284c7" strokeWidth="8" />
              <circle cx="285" cy="165" r="62" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" />
              <circle cx="285" cy="165" r="20" fill="#0f172a" stroke="#60a5fa" strokeWidth="3" />
              <circle cx="285" cy="165" r="7" fill="#f8fafc" />

              {/* Flywheel Aerodynamic Fan Spokes */}
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <g key={deg} transform={`rotate(${deg} 285 165)`}>
                  <path d="M 285 145 C 275 125, 275 105, 285 95" stroke="#38bdf8" strokeWidth="3" fill="none" />
                </g>
              ))}

              <text x="285" y="248" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                FLYWHEEL (297 RPM)
              </text>
            </g>

            {/* ── 6. Reinforced V-Belt Transmission Loop ── */}
            <g
              onClick={() => setActiveFaceplate('belt')}
              style={{ cursor: 'pointer' }}
            >
              {/* Top Belt Span */}
              <line x1="285" y1="95" x2="505" y2="141" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
              <line x1="285" y1="95" x2="505" y2="141" stroke="#0284c7" strokeWidth="4" strokeDasharray={isCompressing ? '8 4' : 'none'} />
              {/* Bottom Belt Span */}
              <line x1="285" y1="235" x2="505" y2="189" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
              <line x1="285" y1="235" x2="505" y2="189" stroke="#0284c7" strokeWidth="4" strokeDasharray={isCompressing ? '8 4' : 'none'} />

              {/* Belt Tension Badge */}
              <rect x="365" y="150" width="80" height="26" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="405" y="167" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700">
                TENSION: {beltTension}%
              </text>
            </g>

            {/* ── 7. Condor MDR Pressure Switch & Regulator Manifold ── */}
            <g
              onClick={() => setActiveFaceplate('switch')}
              style={{ cursor: 'pointer' }}
            >
              {/* Right Side Pressure Switch */}
              <rect x="650" y="200" width="40" height="55" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="670" cy="220" r="10" fill={isCompressing ? '#22c55e' : '#eab308'} />
              <text x="670" y="245" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="700">MDR-3</text>
            </g>

            {/* Left Side Micrometer Regulator & Dual Gauges */}
            <g
              onClick={() => setActiveFaceplate('regulator')}
              style={{ cursor: 'pointer' }}
            >
              <rect x="80" y="200" width="40" height="55" rx="4" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="100" cy="220" r="10" fill="#0284c7" />
              <line x1="100" y1="220" x2="106" y2="216" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <text x="100" y="245" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="700">0-12 BAR</text>
            </g>
          </svg>

          {/* Sub-assembly Inspection Callout Hint */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <Eye size={13} color="#38bdf8" />
            <span>Click any mechanical component in the SCADA diagram to open real-time engineering faceplate</span>
          </div>
        </div>

        {/* Right Column: Hero SCADA Process Telemetry & Interlocks */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(11, 17, 32, 0.75)',
          padding: '20px',
          gap: '14px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Pneumatic Stream
            </span>
            <span style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} />
              100 ms Refresh
            </span>
          </div>

          {/* Hero KPI Card: Receiver Pressure */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '14px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>AIR TANK PRESSURE</span>
              <Gauge size={15} color="#38bdf8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {tankPressure.toFixed(1)}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>bar (g)</span>
            </div>
            {/* Visual Pressure Range Bar */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                <span>Cut-in: {cutInPressure} bar</span>
                <span>Cut-out: {cutOutPressure} bar</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (tankPressure / 10) * 100)}%`,
                  height: '100%',
                  background: tankPressure >= cutOutPressure ? '#38bdf8' : '#22c55e',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Free Air Delivery (FAD) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>AIR DELIVERY</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {airDelivery} <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>L/min</span>
              </div>
              <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px' }}>ISO 1217 Standard</div>
            </div>

            {/* Stage 1 Intercooler Temp */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>STAGE 1 TEMP</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                {stage1Temp.toFixed(1)} <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>°C</span>
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Intercooled Delta: 44°C</div>
            </div>

            {/* V-Belt Dynamic Tension */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>BELT TENSION</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {beltTension}%
              </div>
              <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px' }}>Nominal (90-98%)</div>
            </div>

            {/* Pressure Dew Point */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>DEW POINT</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                +{dewPoint.toFixed(1)} <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b' }}>°C</span>
              </div>
              <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px' }}>Class 4 ISO 8573-1</div>
            </div>
          </div>

          {/* Motor Electrical & Mechanical Telemetry */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Motor Drive & Vibration Spectrum
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Current (3-Phase):</span>
              <strong style={{ color: '#ffffff' }}>{motorCurrent.toFixed(1)} A ({((motorCurrent / 12) * 100).toFixed(0)}% FLA)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Motor Bearing Temp:</span>
              <strong style={{ color: '#f59e0b' }}>{motorTemp.toFixed(1)} °C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>RMS Vibration:</span>
              <strong style={{ color: '#22c55e' }}>{vibration.toFixed(2)} mm/s (ISO Class A)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Bearing Peak Demod:</span>
              <strong style={{ color: '#38bdf8' }}>{vibrationEnvelope.toFixed(1)} gE</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Component SCADA Faceplate Modal Overlay ── */}
      {activeFaceplate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#0f172a',
            border: '1px solid #38bdf8',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  {activeFaceplate === 'tank' && '200L ASME Section VIII Pressure Vessel'}
                  {activeFaceplate === 'cylinders' && 'Twin-Cylinder Meehanite Pump & Intercooler'}
                  {activeFaceplate === 'motor' && '5.5 kW TEFC 3-Phase Induction Motor'}
                  {activeFaceplate === 'flywheel' && 'Aerodynamic Cooling Flywheel & Pulley'}
                  {activeFaceplate === 'belt' && 'High-Torque Multi-Rib V-Belt Transmission'}
                  {activeFaceplate === 'switch' && 'Condor MDR Pressure Switch & Unloader'}
                  {activeFaceplate === 'regulator' && 'Micrometer Dual Regulator & Sintered Filter'}
                </h3>
              </div>
              <button
                onClick={() => setActiveFaceplate(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
              {activeFaceplate === 'tank' && 'Horizontal cylindrical 200L receiver manufactured to ASME Sec VIII Division 1. Hydrotested at 16 bar. Acts as a pneumatic pulsation dampener and thermal cooling capacitor for compressed air discharge.'}
              {activeFaceplate === 'cylinders' && 'Dual-stage reciprocating design. Stage 1 (LP) draws ambient air and compresses to ~3 bar. Intercooler copper tube removes compression heat before Stage 2 (HP) compresses air to final 8.5 bar storage pressure.'}
              {activeFaceplate === 'motor' && 'Heavy-duty 5.5 kW 400V 50Hz 3-phase induction motor running at 1450 RPM synchronous speed. Sealed-for-life deep groove ball bearings (SKF 6206-2Z) monitored with continuous vibration envelopes.'}
              {activeFaceplate === 'flywheel' && 'Balanced cast-iron cooling flywheel with aerodynamic airfoil fan blades that direct high-velocity cooling air across cylinder heads and finned intercooler coils.'}
              {activeFaceplate === 'belt' && 'Chloroprene reinforced high-torque V-belt. Dynamic tension is continuously tracked at 96% to prevent slip-induced heat generation and ensure maximum mechanical power transfer efficiency.'}
              {activeFaceplate === 'switch' && 'German Condor MDR-3 pressure switch with automatic unloader valve EV-3 that vents head pressure during off-cycles to ensure zero-torque motor restarts.'}
              {activeFaceplate === 'regulator' && 'Precision dual-stage diaphragm regulator with 5-micron sintered bronze filter element for coalescing oil-water condensate removal prior to factory manifold delivery.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveFaceplate(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Dismiss Faceplate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
