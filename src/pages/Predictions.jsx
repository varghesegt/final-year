/* ===================================================================
   Condition Forecasts — Asset Risk & Action Windows
   =================================================================== */

import { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES as DEFAULT_MACHINES } from '../data/factoryData';
import { HealthRing, Badge, MetricCard } from '../components/common';
import { fetchAllPredictions, createWorkOrder } from '../services/api';

export default function Predictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState({});
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [summary, setSummary] = useState(null);
  const [riskFilter, setRiskFilter] = useState('all');
  const [dispatchingId, setDispatchingId] = useState(null);

  useEffect(() => {
    let active = true;
    const update = async () => {
      const data = await fetchAllPredictions();
      if (!active) return;
      if (data?.predictions) setPredictions(data.predictions);
      if (data?.machines) setMachines(data.machines);
      if (data?.summary) setSummary(data.summary);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const predList = Object.keys(machines)
    .map(id => ({ id, machine: machines[id], pred: predictions[id] }))
    .filter(x => x.machine && x.pred)
    .sort((a, b) => (b.pred.failureProbability || 0) - (a.pred.failureProbability || 0));

  const highRiskCount = summary?.atRiskCount
    ?? predList.filter(x => ['CRITICAL', 'HIGH', 'WARNING'].includes(String(x.pred.riskLevel).toUpperCase())).length;
  const earliestDays = summary?.earliestActionDays
    ?? (predList.length ? Math.min(...predList.map(x => x.pred.remainingUsefulLife ?? 999)) : 0);
  const dailyExposure = summary?.dailyRiskCost ?? 0;

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
            Remaining useful life and maintenance priority across monitored assets
          </p>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Filter assets by risk">
          {[
            { id: 'all', label: `All (${predList.length})` },
            { id: 'elevated', label: `At Risk (${highRiskCount})` },
            { id: 'nominal', label: `Healthy (${Math.max(0, predList.length - highRiskCount)})` },
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
          label="Assets Needing Attention"
          value={highRiskCount}
          unit={`/ ${predList.length}`}
          icon={AlertTriangle}
          trend={highRiskCount > 0 ? 'down' : 'stable'}
          trendValue={highRiskCount > 0 ? 'Schedule PM inspection' : 'All systems healthy'}
        />
        <MetricCard
          label="Earliest Action Window"
          value={earliestDays}
          unit="days"
          icon={Clock}
          trend={earliestDays < 90 ? 'down' : 'stable'}
          trendValue="Lowest asset life left"
        />
        <MetricCard
          label="Daily Risk Exposure"
          value={`₹${(dailyExposure / 1000).toFixed(1)}K`}
          icon={DollarSign}
          trend="stable"
          trendValue="Potential downtime cost"
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
          const keyDrivers = (pred.factors || []).slice(0, 2);
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
                    {machine.id}
                  </span>
                </div>
                <Badge variant={badgeVariant}>{riskLabel} RISK</Badge>
              </div>

              <div className="prediction-card__body">
                <HealthRing
                  value={pred.failureProbability}
                  size={74}
                  label="Risk"
                />

                <div className="prediction-card__details">
                  <div className="prediction-card__rul">
                    <Clock size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <div className="prediction-card__rul-value">
                        {rulDays} <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-regular)', color: 'var(--text-muted)' }}>days left</span>
                      </div>
                      <div className="prediction-card__rul-label">Primary issue: {topMode}</div>
                    </div>
                  </div>
                </div>
              </div>

              {keyDrivers.length > 0 && (
                <div className="prediction-card__factors">
                  {keyDrivers.map((f, i) => (
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
              )}

              <div className="prediction-card__recommendation">
                <div className="prediction-card__recommendation-label">Next Step</div>
                {pred.recommendation}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={(e) => handleDispatchOrder(e, id)}
                  disabled={dispatchingId === id}
                  className="btn btn--secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  {dispatchingId === id ? 'Creating...' : 'Create Work Order'}
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)' }}>
                  View Asset <ArrowRight size={13} strokeWidth={1.75} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
