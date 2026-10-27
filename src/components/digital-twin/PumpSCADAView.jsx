import { useState, useEffect, useMemo } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Gauge,
  Layers, Play, Power, Radio, RefreshCw, RotateCcw, Settings,
  ShieldCheck, Sliders, Thermometer, Waves, Wind, X, Zap,
  BarChart3, Cpu, ArrowRight, CornerDownRight, Disc
} from 'lucide-react';

/**
 * Professional ISA-101 High-Performance 2D SCADA HMI for Centrifugal Pump P-101
 * Includes P&ID Schematic, Process Flow, Transmitter Faceplates, PID Loop Control, and Interlocks.
 */
export function PumpSCADAView({ sensors, machine }) {
  const [activeFaceplate, setActiveFaceplate] = useState(null);
  const [valveOpening, setValveOpening] = useState(74.2);
  const [controlMode, setControlMode] = useState('AUTO'); // 'AUTO' | 'MANUAL' | 'CASCADE'
  const [activeTab, setActiveTab] = useState('schematic'); // 'schematic' | 'pid' | 'interlocks'
  const [flowSetpoint, setFlowSetpoint] = useState(48.0);
  const [valveOverride, setValveOverride] = useState(null);

  // Dynamic telemetry values
  const flowVal = sensors?.flowRate?.value ?? 48.5;
  const pressVal = sensors?.pressure?.value ?? 4.22;
  const suctionPress = (pressVal * 0.34).toFixed(2);
  const rpmVal = sensors?.rpm?.value ?? 2950;
  const tempVal = sensors?.temperature?.value ?? 54.2;
  const vibVal = sensors?.vibration?.value ?? 1.48;
  const npshMargin = sensors?.npshMargin?.value ?? 1.4;
  const effVal = sensors?.efficiency?.value ?? 78.4;
  const powerVal = ((flowVal * pressVal * 0.1) / (effVal / 100)).toFixed(1);
  const isRunning = machine?.status !== 'stopped' && machine?.health > 20;

  // Fluid speed calculation for animated stroke dashoffset
  const animSpeed = Math.max(0.4, 2.2 - (flowVal / 60));

  // Current valve position
  const currentValvePos = valveOverride !== null ? valveOverride : (controlMode === 'AUTO' ? (flowVal / 65 * 100).toFixed(1) : valveOpening);

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
      {/* ── Top SCADA Control Banner & Substation Status Bar ────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Plant Loop Identification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#38bdf8'
          }}>
            <Radio size={13} className="animate-pulse" />
            LOOP: FIC-101 / P-101-FCV
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isRunning ? '#10b981' : '#ef4444',
              boxShadow: isRunning ? '0 0 10px #10b981' : '0 0 10px #ef4444'
            }} />
            <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              {isRunning ? 'RUNNING AUTO (VFD 49.2 Hz)' : 'STANDBY / STOPPED'}
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>MCC-04 / FEED PUMP ROOM</span>
          </div>
        </div>

        {/* Center: Quick Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0b1329', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
          {[
            { id: 'schematic', label: 'P&ID Schematic', icon: Layers },
            { id: 'pid', label: 'PID Loop Controller', icon: Sliders },
            { id: 'interlocks', label: 'Safety Interlocks (ESD)', icon: ShieldCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Telemetry Health & OPC-UA Tag Poll Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <Cpu size={13} style={{ color: '#38bdf8' }} />
            <span>OPC-UA:</span>
            <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>20 Hz • 12ms</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: machine.health < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${machine.health < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            color: machine.health < 60 ? '#f87171' : '#34d399'
          }}>
            <ShieldCheck size={12} />
            <span>ISO 10816: {machine.health}%</span>
          </div>
        </div>
      </div>

      {/* ── Tab 1: Interactive P&ID Schematic ──────────────────────── */}
      {activeTab === 'schematic' && (
        <div style={{ position: 'relative', width: '100%', minHeight: '480px', padding: '16px' }}>
          {/* SCADA Schematic Canvas */}
          <svg
            viewBox="0 0 1000 460"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Pipe Metal Gradients */}
              <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="35%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="65%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Water Stream Gradient */}
              <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Pressurized High Head Stream Gradient */}
              <linearGradient id="pressurizedFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>

              {/* Volute Glow Filter */}
              <filter id="voluteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ── Background Grid & Architectural Plant Boundaries ── */}
            <pattern id="scadaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
            </pattern>
            <rect width="1000" height="460" fill="url(#scadaGrid)" />

            {/* Skid Outline Box */}
            <rect x="270" y="90" width="460" height="290" rx="10"
              fill="rgba(15, 23, 42, 0.4)" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x="285" y="112" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">
              EQUIPMENT SKID BOUNDARY (SKID-P-101 / ISO 3661 BASEPLATE)
            </text>

            {/* ── 1. SUCTION PIPING LINE (DN 65 Flanged Header) ───────── */}
            {/* Suction Storage Reservoir Vessel */}
            <rect x="25" y="160" width="75" height="150" rx="6"
              fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="62" y="215" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">SUCTION</text>
            <text x="62" y="232" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)">TK-101</text>
            <text x="62" y="252" textAnchor="middle" fill="#94a3b8" fontSize="9">Level: 78%</text>

            {/* Pipe Segment: Tank -> XV-101 */}
            <rect x="100" y="224" width="80" height="16" fill="url(#pipeGrad)" stroke="#1e293b" />
            {isRunning && (
              <line x1="100" y1="232" x2="180" y2="232" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 8">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur={`${animSpeed}s`} repeatCount="indefinite" />
              </line>
            )}

            {/* XV-101 Suction Emergency Shutdown Valve */}
            <g
              onClick={() => setActiveFaceplate({
                tag: 'XV-101', name: 'Suction Emergency Isolation Valve',
                type: 'Actuated Ball Valve', state: 'OPEN (100%)', status: 'Healthy',
                interlock: 'Permissive Confirmed', action: 'Trip / Close Interlock'
              })}
              style={{ cursor: 'pointer' }}
            >
              <polygon points="180,220 205,232 180,244" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
              <polygon points="205,220 180,232 205,244" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
              <circle cx="192" cy="232" r="4" fill="#ffffff" />
              {/* Actuator Top */}
              <line x1="192" y1="220" x2="192" y2="204" stroke="#64748b" strokeWidth="2" />
              <rect x="180" y="194" width="24" height="10" rx="3" fill="#334155" stroke="#10b981" strokeWidth="1.5" />
              <text x="192" y="186" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">XV-101</text>
              <text x="192" y="258" textAnchor="middle" fill="#94a3b8" fontSize="8">OPEN</text>
            </g>

            {/* Pipe Segment: XV-101 -> Strainer -> Suction Flange */}
            <rect x="205" y="224" width="135" height="16" fill="url(#pipeGrad)" stroke="#1e293b" />
            {isRunning && (
              <line x1="205" y1="232" x2="340" y2="232" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 8">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur={`${animSpeed}s`} repeatCount="indefinite" />
              </line>
            )}

            {/* Y-Strainer (STR-101) */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'STR-101', name: 'Suction Inline Y-Strainer',
              type: '40-Mesh Stainless Basket', state: 'Clean',
              diffPress: '0.08 bar', maxAllowed: '0.35 bar'
            })}>
              <polygon points="230,224 250,246 250,224" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <text x="240" y="260" textAnchor="middle" fill="#94a3b8" fontSize="8">STR-101</text>
            </g>

            {/* Suction PT-101 Transmitter Instrument Bubble */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'PT-101', name: 'Suction Pressure Transmitter',
              pv: `${suctionPress} bar`, sp: '1.20 bar', range: '0 - 6 bar',
              unit: 'bar', limits: { LL: '0.50', L: '0.80', H: '2.50', HH: '3.50' }
            })}>
              <line x1="285" y1="224" x2="285" y2="175" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="285" cy="160" r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
              <line x1="269" y1="160" x2="301" y2="160" stroke="#06b6d4" strokeWidth="1" />
              <text x="285" y="154" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">PT</text>
              <text x="285" y="170" textAnchor="middle" fill="#06b6d4" fontSize="8">101</text>
              {/* Live Readout Badge */}
              <rect x="257" y="126" width="56" height="16" rx="3" fill="#0b1329" stroke="rgba(6,182,212,0.4)" />
              <text x="285" y="138" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                {suctionPress} bar
              </text>
            </g>

            {/* ── 2. CENTRIFUGAL PUMP ASSEMBLY & IMPELLER ──────────────── */}
            {/* Pump Volute Casing Cutaway */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'P-101', name: 'KSB Etanorm SYT 065-040-250 Centrifugal Pump',
              type: 'Single-Stage Back-Pull-Out End-Suction Process Pump',
              speed: `${rpmVal} RPM`, flow: `${flowVal} L/s`, head: '42.8 m',
              efficiency: `${effVal}%`, power: `${powerVal} kW`
            })}>
              {/* Outer Volute Enamel Blue Body */}
              <circle cx="395" cy="232" r="55" fill="#0369a1" stroke="#0284c7" strokeWidth="3" filter="url(#voluteGlow)" />
              <circle cx="395" cy="232" r="48" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />

              {/* Rotating Bronze Impeller */}
              <g>
                <circle cx="395" cy="232" r="28" fill="rgba(217, 119, 6, 0.15)" stroke="#d97706" strokeWidth="2" strokeDasharray="8 4">
                  {isRunning && (
                    <animateTransform attributeName="transform" type="rotate"
                      from="0 395 232" to="360 395 232" dur={`${(60 / (rpmVal || 2950)).toFixed(2)}s`} repeatCount="indefinite" />
                  )}
                </circle>

                {/* Impeller 5 Curved Vanes */}
                {[0, 72, 144, 216, 288].map(deg => (
                  <path
                    key={deg}
                    d={`M 395 232 Q ${395 + Math.cos(deg * Math.PI / 180) * 16} ${232 + Math.sin(deg * Math.PI / 180) * 16} ${395 + Math.cos((deg + 45) * Math.PI / 180) * 26} ${232 + Math.sin((deg + 45) * Math.PI / 180) * 26}`}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    fill="none"
                  >
                    {isRunning && (
                      <animateTransform attributeName="transform" type="rotate"
                        from="0 395 232" to="360 395 232" dur={`${(60 / (rpmVal || 2950)).toFixed(2)}s`} repeatCount="indefinite" />
                    )}
                  </path>
                ))}
              </g>

              {/* Center Shaft Eye */}
              <circle cx="395" cy="232" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="395" y="304" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">PUMP P-101</text>
              <text x="395" y="318" textAnchor="middle" fill="#94a3b8" fontSize="9">ISO 5199 End-Suction</text>
            </g>

            {/* ── 3. BEARING BRACKET & DRIVE SHAFT ──────────────────────── */}
            {/* Bearing Bracket Body (Gunmetal Slate) */}
            <rect x="450" y="206" width="90" height="52" rx="4"
              fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="495" y1="206" x2="495" y2="258" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <text x="495" y="222" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">BRG BRACKET</text>

            {/* Drive Shaft (Polished Stainless Steel) */}
            <rect x="445" y="228" width="150" height="8" fill="#e2e8f0" stroke="#94a3b8" />

            {/* TE-101A Bearing Drive-End Temp Transmitter */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'TE-101A', name: 'Drive-End SKF 6205 Bearing Temp',
              pv: `${tempVal}°C`, sp: '65°C Warning', range: '0 - 120°C',
              unit: '°C', limits: { LL: '10', L: '20', H: '68', HH: '78' }
            })}>
              <line x1="472" y1="206" x2="472" y2="155" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="472" cy="140" r="15" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="457" y1="140" x2="487" y2="140" stroke="#f59e0b" strokeWidth="1" />
              <text x="472" y="134" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">TE</text>
              <text x="472" y="150" textAnchor="middle" fill="#f59e0b" fontSize="8">101A</text>
              <rect x="447" y="106" width="50" height="16" rx="3" fill="#0b1329" stroke="rgba(245,158,11,0.4)" />
              <text x="472" y="118" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                {tempVal}°C
              </text>
            </g>

            {/* VT-101A Accelerometer Vibration Sensor */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'VT-101A', name: 'Bearing DE Vibration Accelerometer',
              pv: `${vibVal} mm/s`, sp: '2.8 mm/s Warning', range: '0 - 15 mm/s',
              unit: 'mm/s', limits: { LL: '0.1', L: '0.2', H: '2.8', HH: '4.5' }
            })}>
              <line x1="518" y1="206" x2="518" y2="155" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="518" cy="140" r="15" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="503" y1="140" x2="533" y2="140" stroke="#3b82f6" strokeWidth="1" />
              <text x="518" y="134" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">VT</text>
              <text x="518" y="150" textAnchor="middle" fill="#3b82f6" fontSize="8">101A</text>
              <rect x="491" y="106" width="54" height="16" rx="3" fill="#0b1329" stroke="rgba(59,130,246,0.4)" />
              <text x="518" y="118" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                {vibVal} mm/s
              </text>
            </g>

            {/* Flexible Coupling Hub (Safety Orange) */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'CPL-101', name: 'Flexible Jaw Spider Coupling (DIN 740)',
              spider: '98 Shore-A Polyurethane', alignment: 'Angular 0.02°, Radial 0.01mm',
              condition: 'Dynamic Balance Grade G2.5 Verified'
            })}>
              <rect x="540" y="218" width="22" height="28" rx="3" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
              <text x="551" y="258" textAnchor="middle" fill="#fb923c" fontSize="8" fontWeight="700">CPL</text>
            </g>

            {/* ── 4. 15kW ELECTRIC DRIVE MOTOR (M-101) ────────────────── */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'M-101', name: '15kW IE3 TEFC 3-Phase Induction Motor',
              rating: '400V 50Hz • 2950 RPM • Full Load Current: 27.5 A',
              current: '26.4 A', frequency: '49.2 Hz', vfd: 'ABB ACS880 Drive Active'
            })}>
              {/* Motor Stator Body */}
              <rect x="565" y="196" width="130" height="72" rx="6"
                fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
              {/* Cooling Fins */}
              {[585, 605, 625, 645, 665].map(x => (
                <line key={x} x1={x} y1="196" x2={x} y2="268" stroke="#1e293b" strokeWidth="2" />
              ))}
              <text x="630" y="226" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="800">MOTOR M-101</text>
              <text x="630" y="242" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="var(--font-mono)">
                15kW • {rpmVal} RPM
              </text>
              <text x="630" y="256" textAnchor="middle" fill="#94a3b8" fontSize="8">
                P = {powerVal} kW (94.2% η)
              </text>
            </g>

            {/* ── 5. DISCHARGE PIPING LINE (DN 50 Flanged Header) ───────── */}
            {/* Vertical Discharge Neck from Volute */}
            <rect x="387" y="90" width="16" height="90" fill="url(#pipeGrad)" stroke="#1e293b" />
            {isRunning && (
              <line x1="395" y1="180" x2="395" y2="90" stroke="#3b82f6" strokeWidth="4" strokeDasharray="8 8">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur={`${animSpeed}s`} repeatCount="indefinite" />
              </line>
            )}

            {/* Discharge Elbow 90° Turn to Right */}
            <path d="M 387 90 Q 387 74 403 74 L 920 74 L 920 90 L 403 90 Q 387 90 387 106 Z" fill="url(#pipeGrad)" stroke="#1e293b" />
            {isRunning && (
              <path d="M 395 90 Q 395 82 403 82 L 920 82" stroke="#3b82f6" strokeWidth="4" strokeDasharray="8 8" fill="none">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur={`${animSpeed}s`} repeatCount="indefinite" />
              </path>
            )}

            {/* Discharge PT-103 Pressure Transmitter */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'PT-103', name: 'Discharge Pressure Transmitter',
              pv: `${pressVal} bar`, sp: '4.20 bar', range: '0 - 10 bar',
              unit: 'bar', limits: { LL: '1.50', L: '2.80', H: '5.20', HH: '6.50' }
            })}>
              <line x1="440" y1="74" x2="440" y2="35" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="440" cy="24" r="15" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="425" y1="24" x2="455" y2="24" stroke="#3b82f6" strokeWidth="1" />
              <text x="440" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">PT</text>
              <text x="440" y="34" textAnchor="middle" fill="#3b82f6" fontSize="8">103</text>
              <rect x="462" y="16" width="60" height="16" rx="3" fill="#0b1329" stroke="rgba(59,130,246,0.4)" />
              <text x="492" y="28" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                {pressVal} bar
              </text>
            </g>

            {/* Non-Return Check Valve (NRV-101) */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'NRV-101', name: 'Non-Return Dual-Plate Check Valve',
              type: 'Wafer Check Valve (DN 50)', state: 'Forward Flow Permitted',
              crackingPressure: '0.05 bar'
            })}>
              <rect x="545" y="70" width="22" height="24" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <polygon points="551,74 561,82 551,90" fill="#60a5fa" />
              <line x1="561" y1="74" x2="561" y2="90" stroke="#60a5fa" strokeWidth="2" />
              <text x="556" y="105" textAnchor="middle" fill="#94a3b8" fontSize="8">NRV-101</text>
            </g>

            {/* FCV-101 Modulating Flow Control Valve */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'FCV-101', name: 'Modulating Flow Control Valve (Diaphragm)',
              pv: `${currentValvePos}%`, sp: `${flowSetpoint} L/s`, range: '0 - 100%',
              mode: controlMode, status: 'Active Control'
            })}>
              {/* Valve Body Triangles */}
              <polygon points="615,70 640,82 615,94" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" />
              <polygon points="640,70 615,82 640,94" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" />
              {/* Stem & Diaphragm Actuator */}
              <line x1="627" y1="70" x2="627" y2="48" stroke="#64748b" strokeWidth="2" />
              <path d="M 612 48 Q 627 34 642 48 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
              <text x="627" y="30" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="700">FCV-101</text>
              {/* Valve Position % Badge */}
              <rect x="607" y="100" width="40" height="15" rx="3" fill="#0b1329" stroke="rgba(59,130,246,0.3)" />
              <text x="627" y="111" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="700" fontFamily="var(--font-mono)">
                {currentValvePos}%
              </text>
            </g>

            {/* FT-101 Magnetic Flowmeter */}
            <g style={{ cursor: 'pointer' }} onClick={() => setActiveFaceplate({
              tag: 'FT-101', name: 'Electromagnetic Discharge Flowmeter',
              pv: `${flowVal} L/s`, sp: `${flowSetpoint} L/s`, range: '0 - 75 L/s',
              unit: 'L/s', limits: { LL: '5.0', L: '15.0', H: '58.0', HH: '68.0' }
            })}>
              <line x1="710" y1="74" x2="710" y2="35" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="710" cy="24" r="15" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
              <line x1="695" y1="24" x2="725" y2="24" stroke="#10b981" strokeWidth="1" />
              <text x="710" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="700">FT</text>
              <text x="710" y="34" textAnchor="middle" fill="#10b981" fontSize="8">101</text>
              <rect x="732" y="16" width="60" height="16" rx="3" fill="#0b1329" stroke="rgba(16,185,129,0.4)" />
              <text x="762" y="28" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                {flowVal} L/s
              </text>
            </g>

            {/* Delivery Destination Plant Header */}
            <rect x="860" y="55" width="105" height="54" rx="6"
              fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
            <text x="912" y="78" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">PROCESS</text>
            <text x="912" y="94" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="var(--font-mono)">HEADER MAIN</text>

            {/* ── 6. MINIMUM FLOW SPILLBACK BYPASS LINE ─────────────────── */}
            <path d="M 680 90 L 680 340 L 70 340 L 70 310" stroke="#475569" strokeWidth="4" strokeDasharray="6 4" fill="none" />
            <rect x="360" y="332" width="22" height="16" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
            <text x="371" y="360" textAnchor="middle" fill="#64748b" fontSize="8">ARV-101 (ANTI-CAVITATION RECIRC)</text>
          </svg>

          {/* Interactive Floating Instrument Faceplate Drawer */}
          {activeFaceplate && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '320px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              padding: '16px',
              zIndex: 30,
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                    {activeFaceplate.tag}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                    {activeFaceplate.name}
                  </div>
                </div>
                <button
                  onClick={() => setActiveFaceplate(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Faceplate Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {activeFaceplate.pv && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Process Variable (PV):</span>
                    <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {activeFaceplate.pv}
                    </span>
                  </div>
                )}

                {activeFaceplate.sp && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Setpoint Target (SP):</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {activeFaceplate.sp}
                    </span>
                  </div>
                )}

                {activeFaceplate.limits && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.04em' }}>
                      ISA-18.2 ALARM THRESHOLDS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '4px', borderRadius: '3px' }}>
                        LL: {activeFaceplate.limits.LL}
                      </div>
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px', borderRadius: '3px' }}>
                        L: {activeFaceplate.limits.L}
                      </div>
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px', borderRadius: '3px' }}>
                        H: {activeFaceplate.limits.H}
                      </div>
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '4px', borderRadius: '3px' }}>
                        HH: {activeFaceplate.limits.HH}
                      </div>
                    </div>
                  </div>
                )}

                {/* Valve Position Override Slider for FCV-101 */}
                {activeFaceplate.tag === 'FCV-101' && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8' }}>Manual Override Output:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{valveOpening}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={valveOpening}
                      onChange={(e) => {
                        setValveOpening(parseFloat(e.target.value));
                        setValveOverride(parseFloat(e.target.value));
                      }}
                      style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <button
                        onClick={() => { setControlMode('AUTO'); setValveOverride(null); }}
                        style={{
                          flex: 1, marginRight: '4px', padding: '5px', borderRadius: '4px',
                          background: controlMode === 'AUTO' ? '#2563eb' : '#1e293b',
                          border: 'none', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        CASCADE AUTO
                      </button>
                      <button
                        onClick={() => setControlMode('MANUAL')}
                        style={{
                          flex: 1, marginLeft: '4px', padding: '5px', borderRadius: '4px',
                          background: controlMode === 'MANUAL' ? '#ea580c' : '#1e293b',
                          border: 'none', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        HAND MANUAL
                      </button>
                    </div>
                  </div>
                )}

                {/* General Information Key-Values */}
                {Object.entries(activeFaceplate)
                  .filter(([k]) => !['tag', 'name', 'pv', 'sp', 'range', 'limits'].includes(k))
                  .map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{key}:</span>
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{String(val)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: PID Loop Controller (FIC-101 Cascade Station) ── */}
      {activeTab === 'pid' && (
        <div style={{ padding: 'clamp(14px, 3vw, 24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          {/* Controller Card */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>FIC-101 Discharge Flow Control</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                PID ACTIVE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Flow Setpoint (SP):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{flowSetpoint.toFixed(1)} L/s</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  step="0.5"
                  value={flowSetpoint}
                  onChange={(e) => setFlowSetpoint(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>GAIN (Kp)</div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>2.45</div>
                </div>
                <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>INTEGRAL (Ti)</div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>14.2s</div>
                </div>
                <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#64748b', fontSize: '10px' }}>DERIVATIVE (Td)</div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>0.48s</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Control Error (e = SP - PV):</span>
                  <span style={{ color: Math.abs(flowSetpoint - flowVal) < 2 ? '#34d399' : '#fbbf24', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {(flowSetpoint - flowVal).toFixed(2)} L/s
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valve Position Demand (CV):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{currentValvePos}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* VFD Inverter Station */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: '#eab308' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>VFD Speed Controller (SIC-101)</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                MODBUS TCP
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>OUTPUT FREQUENCY</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#eab308', fontFamily: 'var(--font-mono)' }}>49.2 Hz</div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>SYNCHRONOUS SPEED</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{rpmVal} RPM</div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>MOTOR CURRENT</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>26.4 A</div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>BUS DC VOLTAGE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>565 V</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Emergency Shutdown & Safety Interlocks (ESD Matrix) ── */}
      {activeTab === 'interlocks' && (
        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                API 610 Machinery Protection Cause & Effect Matrix (SIL-2 Certified)
              </span>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} />
                ALL INTERLOCKS ARMED & HEALTHY
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
              {[
                { name: 'Low Suction Pressure (Anti-Cavitation)', tag: 'PALL-101', trip: '< 0.50 bar', current: `${suctionPress} bar`, status: 'OK' },
                { name: 'Bearing High Temperature (DE)', tag: 'TAHH-101A', trip: '> 78.0 °C', current: `${tempVal} °C`, status: 'OK' },
                { name: 'Tri-Axial High Overall Vibration', tag: 'VAHH-101', trip: '> 4.50 mm/s', current: `${vibVal} mm/s`, status: 'OK' },
                { name: 'High Discharge Overpressure', tag: 'PAHH-103', trip: '> 6.50 bar', current: `${pressVal} bar`, status: 'OK' },
                { name: 'Mechanical Seal Barrier Fluid Press', tag: 'PSL-102', trip: '< 2.00 bar', current: '3.80 bar', status: 'OK' },
                { name: 'Motor Winding Thermal Overload', tag: 'TSHH-102', trip: '> 130 °C', current: '74.5 °C', status: 'OK' }
              ].map(int => (
                <div key={int.tag} style={{ background: '#0b1329', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{int.tag}</span>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>{int.status}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>{int.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                    <span>Trip: {int.trip}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>PV: {int.current}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom SCADA Diagnostics & Engineering Metric Strip ─────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
        gap: '1px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px'
      }}>
        {/* NPSH Margin */}
        <div style={{ background: '#070d18', padding: '10px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>NPSH MARGIN (NPSHa - NPSHr)</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            +{npshMargin} m <span style={{ fontSize: '10px', color: '#64748b' }}>(&gt;1.0m Safe)</span>
          </div>
        </div>

        {/* Pump Efficiency */}
        <div style={{ background: '#070d18', padding: '10px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>HYDRAULIC EFFICIENCY (η)</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {effVal}% <span style={{ fontSize: '10px', color: '#64748b' }}>(BEP: 81.2%)</span>
          </div>
        </div>

        {/* Electrical vs Hydraulic Power */}
        <div style={{ background: '#070d18', padding: '10px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>INPUT POWER CONSUMPTION</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {powerVal} kW <span style={{ fontSize: '10px', color: '#64748b' }}>(0.29 kWh/m³)</span>
          </div>
        </div>

        {/* Totalized Delivery Today */}
        <div style={{ background: '#070d18', padding: '10px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>TOTALIZED VOLUME TODAY</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            4,186 m³ <span style={{ fontSize: '10px', color: '#64748b' }}>(174 m³/h avg)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
