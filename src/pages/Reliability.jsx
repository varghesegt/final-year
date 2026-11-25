/* ===================================================================
   Reliability Metrics — MTBF, MTTR, Availability, OEE & Losses
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  BarChart3, Activity, Clock, CheckCircle, Gauge, AlertTriangle, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { MACHINES as DEFAULT_MACHINES, generateReliabilityMetrics, generateHistoricalData } from '../data/factoryData';
import { fetchReliabilityData } from '../services/api';
import { MetricCard, MachineSelector } from '../components/common';

export default function Reliability() {
  const navigate = useNavigate();
  const [selectedAssetId, setSelectedAssetId] = useState('P-101');
  const [trendDays, setTrendDays] = useState(30);
  const [metrics, setMetrics] = useState(() => {
    const initial = {};
    Object.keys(DEFAULT_MACHINES).forEach(id => {
      initial[id] = generateReliabilityMetrics(id);
    });
    return initial;
  });
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [historyByMachine, setHistoryByMachine] = useState(() => ({
    'P-101': generateHistoricalData('P-101', 90),
  }));

  useEffect(() => {
    let active = true;
    fetchReliabilityData().then((data) => {
      if (!active) return;
      if (data?.metrics) setMetrics(data.metrics);
      if (data?.machines) setMachines(data.machines);
      if (data?.historyByMachine) {
        setHistoryByMachine(data.historyByMachine);
      } else if (data?.history?.length) {
        setHistoryByMachine(prev => ({ ...prev, 'P-101': data.history }));
      }
    });
    return () => { active = false; };
  }, []);

  const allMetrics = Object.values(metrics);
  const avgMTBF = allMetrics.length
    ? Math.round(allMetrics.reduce((s, m) => s + m.mtbf, 0) / allMetrics.length)
    : 0;
  const avgMTTR = allMetrics.length
    ? (allMetrics.reduce((s, m) => s + m.mttr, 0) / allMetrics.length).toFixed(1)
    : 0;
  const avgAvailability = allMetrics.length
    ? (allMetrics.reduce((s, m) => s + m.availability, 0) / allMetrics.length).toFixed(1)
    : 0;
  const avgOEE = allMetrics.length
    ? (allMetrics.reduce((s, m) => s + m.oee, 0) / allMetrics.length).toFixed(1)
    : 0;

  const barChartData = Object.values(machines).map(m => ({
    name: m.id,
    health: m.health,
    mtbf: metrics[m.id]?.mtbf || 0,
    oee: metrics[m.id]?.oee || 0,
    availability: metrics[m.id]?.availability || 0,
  }));

  const selectedMetric = metrics[selectedAssetId] || metrics['P-101'];
  const selectedMachine = machines[selectedAssetId] || machines['P-101'];
  const radarData = selectedMetric ? [
    { metric: 'Availability', value: selectedMetric.availability, fullMark: 100 },
    { metric: 'Performance', value: selectedMetric.performance, fullMark: 100 },
    { metric: 'Quality', value: selectedMetric.quality, fullMark: 100 },
    { metric: 'Health', value: selectedMetric.healthIndex, fullMark: 100 },
    { metric: 'OEE', value: selectedMetric.oee, fullMark: 100 },
  ] : [];

  const fullHistory = historyByMachine[selectedAssetId] || historyByMachine['P-101'] || [];
  const assetHistory = fullHistory.slice(-(trendDays + 1));

  const oeeLosses = selectedMetric?.oeeLosses || {
    scheduledHrs: 720,
    plannedStopHrs: 12,
    breakdownHrs: 6,
    speedLossPct: 3.2,
    qualityDefectPct: 0.4,
    availabilityLossPct: 2.5,
    performanceLossPct: 3.2,
    qualityLossPct: 0.4,
    downtimeCostExposure: 150000,
    actualOutputUnits: 58400,
    targetOutputUnits: 64800,
    scrapUnits: 230,
  };

  return (
    <div className="reliability-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <BarChart3 size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Reliability Metrics
          </h1>
          <p className="section-header__subtitle">
            Fleet availability, mean time between failures, and ISO 14224 OEE loss accounting
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <MachineSelector selectedId={selectedAssetId} onChange={setSelectedAssetId} />
          <div className="segmented-control">
            {[30, 90].map(d => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`segmented-control__btn ${trendDays === d ? 'segmented-control__btn--active' : ''}`}
              >
                {d}D Window
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="reliability-kpis">
        <MetricCard label="Avg. MTBF" value={avgMTBF.toLocaleString()} unit="hrs" icon={Clock} trend="up" trendValue="+180 hrs vs Q2" />
        <MetricCard label="Avg. MTTR" value={avgMTTR} unit="hrs" icon={Activity} trend="up" trendValue="-0.5 hrs repair time" />
        <MetricCard label="Availability" value={avgAvailability} unit="%" icon={CheckCircle} trend="up" trendValue="+1.2% this month" />
        <MetricCard label="Avg. OEE" value={avgOEE} unit="%" icon={Gauge} trend="up" trendValue="+2.8% vs Q2" />
        <MetricCard label="Total Failures" value={allMetrics.reduce((s, m) => s + m.totalFailures, 0)} icon={AlertTriangle} trend="stable" trendValue="12-month window" />
        <MetricCard label="Total Downtime" value={allMetrics.reduce((s, m) => s + m.totalDowntime, 0).toFixed(1)} unit="hrs" icon={TrendingUp} trend="stable" trendValue="Cumulative fleet" />
      </div>

      <div className="reliability-charts">
        <div className="chart-panel">
          <div className="chart-panel__title">
            <BarChart3 size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Equipment Health & OEE Comparison
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barChartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} />
              <Bar dataKey="health" name="Health %" fill="#1d4ed8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="oee" name="OEE %" fill="#047857" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <div className="chart-panel__title">
            <Activity size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            OEE Breakdown — {selectedMachine?.id} ({selectedMachine?.name})
          </div>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 11 }} />
                <PolarRadiusAxis angle={72} tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                <Radar
                  name={selectedAssetId}
                  dataKey="value"
                  stroke="#1d4ed8"
                  fill="#1d4ed8"
                  fillOpacity={0.14}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div className="chart-panel__title">
              <TrendingUp size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              {trendDays}-Day Health & Bearing Trajectory — {selectedAssetId}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Breakdown Exposure: ₹{(oeeLosses.downtimeCostExposure || 0).toLocaleString()} · Output: {(oeeLosses.actualOutputUnits || 0).toLocaleString()} / {(oeeLosses.targetOutputUnits || 0).toLocaleString()} units
            </span>
          </div>

          <div className="twin-grid" style={{ alignItems: 'center' }}>
            <div>
              {assetHistory.length > 1 && (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={assetHistory} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="reliabilityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} interval={trendDays > 45 ? 12 : 4} />
                    <YAxis domain={[60, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} />
                    <Area type="monotone" dataKey="health" stroke="#1d4ed8" fill="url(#reliabilityGrad)" strokeWidth={2} name="Health %" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="waterfall-list">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ISO 14224 Six Big Losses — {selectedAssetId}
              </div>
              {[
                { label: `Planned Stops (${oeeLosses.plannedStopHrs}h)`, pct: Math.min(100, (oeeLosses.plannedStopHrs / oeeLosses.scheduledHrs) * 100), text: `${oeeLosses.plannedStopHrs} hrs`, color: '#1d4ed8' },
                { label: `Breakdowns (${oeeLosses.breakdownHrs}h)`, pct: Math.min(100, (oeeLosses.breakdownHrs / oeeLosses.scheduledHrs) * 100 * 3), text: `${oeeLosses.breakdownHrs} hrs`, color: '#b91c1c' },
                { label: 'Availability Loss', pct: Math.min(100, (oeeLosses.availabilityLossPct || 2.5) * 4), text: `${oeeLosses.availabilityLossPct || 2.5}%`, color: '#b45309' },
                { label: 'Speed / Micro-Stops', pct: Math.min(100, (oeeLosses.performanceLossPct || oeeLosses.speedLossPct) * 4), text: `${oeeLosses.performanceLossPct || oeeLosses.speedLossPct}%`, color: '#0369a1' },
                { label: `Scrap / Quality (${oeeLosses.scrapUnits}u)`, pct: Math.min(100, (oeeLosses.qualityLossPct || oeeLosses.qualityDefectPct) * 8), text: `${oeeLosses.qualityLossPct || oeeLosses.qualityDefectPct}%`, color: '#4b5563' },
              ].map((row, idx) => (
                <div key={idx} className="waterfall-row">
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{row.label}</span>
                  <div className="waterfall-track">
                    <div className="waterfall-fill" style={{ width: `${Math.max(3, row.pct)}%`, background: row.color }} />
                  </div>
                  <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    {row.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-panel__title">
            <Gauge size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Equipment Reliability & Weibull Summary
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Health</th>
                  <th>MTBF (hrs)</th>
                  <th>MTTR (hrs)</th>
                  <th>Availability</th>
                  <th>OEE</th>
                  <th>Weibull β / η</th>
                  <th>Breakdown Loss</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(machines).map(m => {
                  const met = metrics[m.id];
                  if (!met) return null;
                  return (
                    <tr
                      key={m.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/digital-twin/${m.id}`)}
                    >
                      <td style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>
                        {m.id} — {m.name}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'var(--fw-semibold)',
                          color: m.health >= 80 ? 'var(--status-healthy)'
                            : m.health >= 50 ? 'var(--status-warning)'
                            : 'var(--status-critical)'
                        }}>
                          {m.health}%
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.mtbf.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.mttr}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.availability}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: met.oee >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                        {met.oee}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {met.weibullBeta ?? m.weibullBeta ?? '2.4'} / {((met.weibullEta ?? m.weibullEta ?? 30000) / 1000).toFixed(0)}k h
                      </td>
                      <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                        ₹{((met.oeeLosses?.downtimeCostExposure || 0) / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
