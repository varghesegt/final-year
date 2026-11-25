/* ===================================================================
   Condition Forecasts — Failure Risk & Remaining Useful Life
   =================================================================== */

import { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, ShieldCheck, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES as DEFAULT_MACHINES } from '../data/factoryData';
import { HealthRing, Badge, MetricCard } from '../components/common';
import { fetchAllPredictions, createWorkOrder } from '../services/api';

export default function Predictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState({});
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [riskFilter, setRiskFilter] = useState('all');
  const [dispatchingId, setDispatchingId] = useState(null);

  useEffect(() => {
    let active = true;
    const update = async () => {
      const data = await fetchAllPredictions();
      if (!active) return;
      if (data?.predictions) setPredictions(data.predictions);
      if (data?.machines) setMachines(data.machines);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const sortedMachineIds = Object.keys(machines).sort((a, b) => {
    const riskA = predictions[a]?.failureProbability || 0;
    const riskB = predictions[b]?.failureProbability || 0;
    return riskB - riskA;
  });

  const predList = sortedMachineIds.map(id => ({ id, machine: machines[id], pred: predictions[id] })).filter(x => x.machine && x.pred);
  const highRiskCount = predList.filter(x => {
    const lvl = String(x.pred.riskLevel || '').toUpperCase();
    return lvl === 'CRITICAL' || lvl === 'HIGH' || lvl === 'WARNING';
  }).length;
  const lowestRul = predList.length
    ? Math.min(...predList.map(x => x.pred.rulDays ?? x.pred.remainingUsefulLife ?? 999))
    : 0;
  const totalDailyExposure = predList.reduce((sum, x) => {
    const exp = x.pred.dailyDowntimeExposure ?? Math.round((x.machine.downtimeCostPerHr || 20000) * (x.pred.failureProbability / 100) * 0.35);
    return sum + exp;
  }, 0);

  const visibleItems = predList.filter(({ pred }) => {
    const lvl = String(pred.riskLevel || 'LOW').toUpperCase();
    if (riskFilter === 'elevated') return lvl === 'CRITICAL' || lvl === 'HIGH' || lvl === 'WARNING';
    if (riskFilter === 'nominal') return lvl === 'LOW' || lvl === 'NOMINAL';
    return true;
  });

  const handleDispatchOrder = async (e, machineId) => {
    e.stopPropagation();
    setDispatchingId(machineId);
    try {
      await createWorkOrder(machineId);
      navigate('/work-orders');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="predictions-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Activity size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Condition Forecasts
          </h1>
          <p className="section-header__subtitle">
            Weibull 2-parameter hazard scoring, XAI diagnostic drivers, and Remaining Useful Life across fleet
          </p>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Filter assets by risk">
          {[
            { id: 'all', label: `All (${predList.length})` },
            { id: 'elevated', label: `Advisory (${highRiskCount})` },
            { id: 'nominal', label: `Nominal (${Math.max(0, predList.length - highRiskCount)})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRiskFilter(tab.id)}
              className={`segmented-control__btn ${riskFilter === tab.id ? 'segmented-control__btn--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="factory-stats">
        <MetricCard
          label="Elevated Risk Assets"
          value={highRiskCount}
          unit={`/ ${predList.length}`}
          icon={AlertTriangle}
          trend={highRiskCount > 0 ? 'down' : 'stable'}
          trendValue={highRiskCount > 0 ? 'Preventive action queued' : 'Fleet nominal'}
        />
        <MetricCard
          label="Lowest Fleet RUL"
          value={lowestRul}
          unit="days"
          icon={Clock}
          trend={lowestRul < 90 ? 'down' : 'stable'}
          trendValue="Weibull p50 estimate"
        />
        <MetricCard
          label="Model Confidence"
          value={predList.length ? Math.round(predList.reduce((s, x) => s + (x.pred.confidence || 90), 0) / predList.length) : 92}
          unit="%"
          icon={ShieldCheck}
          trend="up"
          trendValue="Multi-sensor fusion"
        />
        <MetricCard
          label="Daily Risk Exposure"
          value={`₹${(totalDailyExposure / 1000).toFixed(1)}K`}
          icon={DollarSign}
          trend="stable"
          trendValue="Probability-weighted"
        />
      </div>

      <div className="prediction-cards">
        {visibleItems.map(({ id, machine, pred }) => {
          const riskLabel = String(pred.riskLevel || 'LOW').toUpperCase();
          const isCritical = riskLabel === 'CRITICAL';
          const isWarning = riskLabel === 'HIGH' || riskLabel === 'WARNING';
          const badgeVariant = isCritical ? 'critical' : isWarning ? 'warning' : 'healthy';
          const rulDays = pred.rulDays ?? pred.remainingUsefulLife ?? 0;
          const topMode = pred.topFailureMode || pred.failureModes?.[0]?.mode || 'Normal Wear';
          const factors = pred.factors || (pred.failureModes || []).slice(0, 4).map(f => ({
            name: f.mode,
            contribution: f.probability,
          }));
          const barColor = isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--accent-blue)';

          return (
            <div
              key={id}
              className="prediction-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/digital-twin/${id}`)}
            >
              <div className="prediction-card__header">
                <div>
                  <div className="prediction-card__machine">{machine.name}</div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {machine.id} · {machine.manufacturer} · {(machine.runtimeHours || 0).toLocaleString()}h
                  </span>
                </div>
                <Badge variant={badgeVariant}>{riskLabel} RISK</Badge>
              </div>

              <div className="prediction-card__body">
                <HealthRing
                  value={pred.failureProbability}
                  size={76}
                  label="Risk"
                />

                <div className="prediction-card__details">
                  <div className="prediction-card__rul">
                    <Clock size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <div className="prediction-card__rul-value">
                        {rulDays} <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-regular)', color: 'var(--text-muted)' }}>days</span>
                      </div>
                      <div className="prediction-card__rul-label">
                        Remaining Useful Life · {pred.confidence ?? 90}% confidence
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 'var(--fs-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Primary Mode: </span>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
                      {topMode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prediction-card__factors">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  XAI Diagnostic Drivers
                </div>
                {factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="prediction-card__factor">
                      <span className="prediction-card__factor-name">{f.name}</span>
                      <span className="prediction-card__factor-value">{f.contribution}%</span>
                    </div>
                    <div className="driver-bar">
                      <div className="driver-bar__fill" style={{ width: `${Math.min(100, f.contribution)}%`, background: barColor }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="prediction-card__recommendation">
                <div className="prediction-card__recommendation-label">
                  Recommended Action
                </div>
                {pred.recommendation}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={(e) => handleDispatchOrder(e, id)}
                  disabled={dispatchingId === id}
                  className="btn btn--secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  {dispatchingId === id ? 'Dispatching...' : 'Dispatch Work Order'}
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)' }}>
                  Digital Twin <ArrowRight size={13} strokeWidth={1.75} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
