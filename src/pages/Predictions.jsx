/* ===================================================================
   Module 3 — Predictive Maintenance
   =================================================================== */

import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, Shield, Clock, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES, generatePrediction } from '../data/factoryData';
import { HealthRing, Badge } from '../components/common';

export default function Predictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const update = () => {
      const preds = {};
      Object.keys(MACHINES).forEach(id => {
        preds[id] = generatePrediction(id);
      });
      setPredictions(preds);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  const sortedMachineIds = Object.keys(MACHINES).sort((a, b) => {
    const riskA = predictions[a]?.failureProbability || 0;
    const riskB = predictions[b]?.failureProbability || 0;
    return riskB - riskA;
  });

  return (
    <div className="predictions-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Brain size={24} style={{ color: 'var(--accent-purple)' }} />
            AI Predictive Maintenance
          </h1>
          <p className="section-header__subtitle">
            Real-time machine learning failure predictions and Remaining Useful Life (RUL) estimation
          </p>
        </div>
        <div className="topbar__ai-badge" style={{ fontSize: 'var(--fs-sm)' }}>
          <span className="topbar__ai-dot" />
          Models Running
        </div>
      </div>

      <div className="prediction-cards">
        {sortedMachineIds.map(id => {
          const machine = MACHINES[id];
          const pred = predictions[id];
          if (!pred) return null;

          const isCritical = pred.riskLevel === 'CRITICAL' || pred.riskLevel === 'HIGH';

          return (
            <div
              key={id}
              className="prediction-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/digital-twin/${id}`)}
            >
              {/* Header */}
              <div className="prediction-card__header">
                <div>
                  <div className="prediction-card__machine">{machine.name}</div>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {machine.id} • {machine.type}
                  </span>
                </div>
                <Badge variant={isCritical ? 'critical' : 'healthy'}>{pred.riskLevel} RISK</Badge>
              </div>

              {/* Body */}
              <div className="prediction-card__body">
                <div className="prediction-card__gauge-section">
                  <HealthRing
                    value={pred.failureProbability}
                    size={80}
                    label="Failure Risk"
                  />
                </div>

                <div className="prediction-card__details">
                  {/* RUL */}
                  <div className="prediction-card__rul">
                    <Clock size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                    <div>
                      <div className="prediction-card__rul-value">
                        {pred.rulDays} <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-regular)' }}>days</span>
                      </div>
                      <div className="prediction-card__rul-label">Remaining Useful Life (RUL)</div>
                    </div>
                  </div>

                  {/* Top Failure Mode */}
                  <div style={{ fontSize: 'var(--fs-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Top Failure Mode: </span>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
                      {pred.topFailureMode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Factors */}
              <div className="prediction-card__factors">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Contributing Anomaly Factors:
                </div>
                {pred.factors?.map((f, i) => (
                  <div key={i} className="prediction-card__factor">
                    <span className="prediction-card__factor-name">{f.name}</span>
                    <span className="prediction-card__factor-value">{f.contribution}%</span>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="prediction-card__recommendation">
                <div className="prediction-card__recommendation-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
                  Actionable Recommendation
                </div>
                {pred.recommendation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
