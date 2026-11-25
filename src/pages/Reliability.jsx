/* ===================================================================
   Reliability Metrics — Plant Uptime, OEE & Asset Trends
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  BarChart3, Activity, Clock, CheckCircle, Gauge, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { MACHINES as DEFAULT_MACHINES, generateReliabilityMetrics, generateHistoricalData } from '../data/factoryData';
import { fetchReliabilityData } from '../services/api';
import { MetricCard, MachineSelector } from '../components/common';

export default function Reliability() {
  const navigate = useNavigate();
  const [selectedAssetId, setSelectedAssetId] = useState('P-101');
  const [trendDays, setTrendDays] = useState(30);
  const [summary, setSummary] = useState({ avgMtbf: 3800, avgMttr: 2.5, avgAvailability: 98.2, avgOee: 89.4 });
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
      if (data?.summary) setSummary(data.summary);
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

  const barChartData = Object.values(machines).map(m => ({
    name: m.id,
    health: m.health,
    oee: metrics[m.id]?.oee || 0,
  }));

  const selectedMetric = metrics[selectedAssetId] || metrics['P-101'];
  const fullHistory = historyByMachine[selectedAssetId] || historyByMachine['P-101'] || [];
  const assetHistory = fullHistory.slice(-(trendDays + 1));

  return (
    <div className="reliability-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <BarChart3 size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Reliability Metrics
          </h1>
          <p className="section-header__subtitle">
            Equipment uptime, overall efficiency (OEE), and repair performance
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
                {d}D Trend
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="reliability-kpis">
        <MetricCard label="Plant Availability" value={summary.avgAvailability} unit="%" icon={CheckCircle} trend="up" trendValue="Operating uptime" />
        <MetricCard label="Avg. Efficiency (OEE)" value={summary.avgOee} unit="%" icon={Gauge} trend="up" trendValue="Fleet average" />
        <MetricCard label="Mean Repair Time" value={summary.avgMttr} unit="hrs" icon={Activity} trend="stable" trendValue="MTTR average" />
        <MetricCard label="Time Between Failures" value={summary.avgMtbf.toLocaleString()} unit="hrs" icon={Clock} trend="up" trendValue="MTBF average" />
      </div>

      <div className="reliability-charts">
        <div className="chart-panel">
          <div className="chart-panel__title">
            <BarChart3 size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Fleet Health vs Efficiency (%)
          </div>
          <ResponsiveContainer width="100%" height={260}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div className="chart-panel__title">
              <TrendingUp size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              {selectedAssetId} · {trendDays}-Day Health Trend
            </div>
            {selectedMetric && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                <span>Uptime <strong>{selectedMetric.availability}%</strong></span>
                <span>Speed <strong>{selectedMetric.performance}%</strong></span>
                <span>Quality <strong>{selectedMetric.quality}%</strong></span>
              </div>
            )}
          </div>

          {assetHistory.length > 1 && (
            <ResponsiveContainer width="100%" height={260}>
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

        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-panel__title">
            <Gauge size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Asset Performance Summary
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Health</th>
                  <th>Uptime</th>
                  <th>OEE</th>
                  <th>Avg Repair Time</th>
                  <th>Downtime</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(machines).map(m => {
                  const met = metrics[m.id];
                  if (!met) return null;
                  return (
                    <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/digital-twin/${m.id}`)}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>
                        {m.id} — {m.name}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: m.health >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                        {m.health}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.availability}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: met.oee >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)' }}>{met.oee}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.mttr} hrs</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.totalDowntime} hrs</td>
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
