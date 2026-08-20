import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Shield, AlertTriangle, Brain,
  ClipboardList, BarChart3, ChevronRight, Sparkles, CheckCircle, Zap, X
} from 'lucide-react';
import {
  triggerFailureSimulation, resetMachineHealth, isSimulationActive,
  MACHINES, addNotification
} from '../../data/factoryData';

const STAGES = [
  { id: 1, label: '1. Baseline Normal', health: 94, status: 'running', desc: 'Pump P-101 running normally at baseline (1450 RPM, 38°C)' },
  { id: 2, label: '2. Friction Spike', health: 68, status: 'warning', desc: 'Bearing friction heat rises to 68°C; vibration spikes to 3.5 mm/s' },
  { id: 3, label: '3. AI Failure Flag', health: 48, status: 'critical', desc: 'AI anomaly detection triggers: 84% failure risk; RUL drops to 14 days' },
  { id: 4, label: '4. Auto Work Order', health: 28, status: 'critical', desc: 'Decision Engine auto-generates Work Order #WO-2026-8941' },
  { id: 5, label: '5. PM Reset', health: 92, status: 'running', desc: 'Preventive replacement complete; health restored to 92%' }
];

export function DemoController() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStage, setActiveStage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showXaiModal, setShowXaiModal] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      setTimerProgress(0);
      interval = setInterval(() => {
        setTimerProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 5; // 20s total duration
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStageClick = (stageId) => {
    setActiveStage(stageId);
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;

    if (stageId === 5) {
      resetMachineHealth('P-101');
      setIsPlaying(false);
    } else {
      MACHINES['P-101'].health = stage.health;
      MACHINES['P-101'].status = stage.status;
    }

    if (stageId === 3 || stageId === 4) {
      addNotification({
        title: stageId === 4 ? 'Auto Work Order #WO-2026-8941 Generated' : 'AI Alert: Bearing Failure Risk 84%',
        machineId: 'P-101',
        severity: stageId === 4 ? 'critical' : 'warning',
      });
    }

    if (stageId === 4 && location.pathname !== '/work-orders') {
      navigate('/work-orders');
    } else if (stageId !== 4 && !location.pathname.includes('/digital-twin')) {
      navigate('/digital-twin/P-101');
    }
  };

  const handleStartAutoDemo = () => {
    if (isPlaying) {
      setIsPlaying(false);
      resetMachineHealth('P-101');
      setActiveStage(1);
      return;
    }

    setIsPlaying(true);
    setActiveStage(2);
    triggerFailureSimulation('P-101', 20000);

    if (!location.pathname.includes('/digital-twin')) {
      navigate('/digital-twin/P-101');
    }
  };

  return (
    <>
      {/* Top Floating Presentation Demo Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 18px',
        marginBottom: 'var(--sp-6)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: isPlaying ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)',
            border: `1px solid ${isPlaying ? 'var(--status-critical)' : 'var(--accent-blue)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPlaying ? 'var(--status-critical)' : 'var(--accent-blue)'
          }}>
            <Zap size={20} className={isPlaying ? 'animate-pulse-glow' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                Viva Presentation Controller
              </span>
              <span style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '12px',
                background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)',
                color: 'var(--accent-purple)', fontWeight: 600
              }}>
                Interactive Demo
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {STAGES.find(s => s.id === activeStage)?.desc}
            </div>
          </div>
        </div>

        {/* Center 5-Stage Stepper Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStageClick(s.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: activeStage === s.id ? 700 : 500,
                background: activeStage === s.id
                  ? 'var(--accent-blue)'
                  : '#f1f5f9',
                color: activeStage === s.id ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${activeStage === s.id ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowXaiModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)',
              color: 'var(--accent-purple)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Brain size={14} />
            <span>Explainable AI (XAI)</span>
          </button>

          <button
            onClick={handleStartAutoDemo}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: isPlaying ? 'var(--status-critical)' : 'var(--accent-blue)',
              border: 'none', color: '#ffffff',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              boxShadow: isPlaying ? '0 0 12px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Demo' : 'Auto-Play 20s Demo'}</span>
          </button>
        </div>
      </div>

      {/* XAI Feature Importance Modal */}
      {showXaiModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '560px', width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            animation: 'slide-up 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Brain size={22} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Explainable AI (XAI) — Feature Importance
                </h3>
              </div>
              <button onClick={() => setShowXaiModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Random Forest degradation classifier breakdown for Pump P-101. The chart shows key telemetry parameters driving the 84% failure probability score:
            </p>

            {/* Feature Importance Bar Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { feature: 'Vibration Amplitude (BPFO harmonic 3.8 mm/s)', weight: 54, color: 'var(--status-critical)' },
                { feature: 'Bearing Temperature Rise (68°C)', weight: 28, color: 'var(--status-warning)' },
                { feature: 'Cumulative Operating Hours (4,200 hrs)', weight: 12, color: 'var(--accent-blue)' },
                { feature: 'Flow Rate Fluctuation (± 2.5 L/s)', weight: 6, color: 'var(--accent-cyan)' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.feature}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color }}>{item.weight}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.weight}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Engineering Conclusion:</strong> High-frequency vibration amplitude at BPFO (Bearing Pass Frequency Outer Race) is the primary root cause indicator of impending mechanical failure.
            </div>

            <button
              onClick={() => setShowXaiModal(false)}
              style={{
                width: '100%', marginTop: '20px', padding: '10px',
                background: 'var(--accent-purple)', color: '#ffffff',
                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Close Technical Analysis
            </button>
          </div>
        </div>
      )}
    </>
  );
}
