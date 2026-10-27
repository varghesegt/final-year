/* ===================================================================
   Module 5 — Reliability Analytics
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
import { MACHINES, generateReliabilityMetrics, generateHistoricalData } from '../data/factoryData';
import { MetricCard, ExportPdfButton } from '../components/common';

export default function Reliability() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({});
  const [history] = useState(() => generateHistoricalData('P-101', 30));

  useEffect(() => {
    const mets = {};
    Object.keys(MACHINES).forEach(id => {
      mets[id] = generateReliabilityMetrics(id);
    });
    setMetrics(mets);
  }, []);

  // Aggregate factory-level KPIs
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

  // Chart data: per-machine comparison
  const barChartData = Object.values(MACHINES).map(m => ({
    name: m.id,
    health: m.health,
    mtbf: metrics[m.id]?.mtbf || 0,
    oee: metrics[m.id]?.oee || 0,
    availability: metrics[m.id]?.availability || 0,
  }));

  // Radar chart data for P-101
  const p101 = metrics['P-101'];
  const radarData = p101 ? [
    { metric: 'Availability', value: p101.availability, fullMark: 100 },
    { metric: 'Performance', value: p101.performance, fullMark: 100 },
    { metric: 'Quality', value: p101.quality, fullMark: 100 },
    { metric: 'Health', value: p101.healthIndex, fullMark: 100 },
    { metric: 'OEE', value: p101.oee, fullMark: 100 },
  ] : [];

  return (
    <div className="reliability-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <BarChart3 size={24} style={{ color: 'var(--accent-emerald)' }} />
            Reliability Analytics
          </h1>
          <p className="section-header__subtitle">
            Key reliability metrics and equipment effectiveness indicators
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reliability-kpis">
        <MetricCard
          label="Avg. MTBF"
          value={avgMTBF.toLocaleString()}
          unit="hrs"
          icon={Clock}
          accent="var(--accent-blue)"
          trend="up"
          trendValue="+180 hrs this quarter"
        />
        <MetricCard
          label="Avg. MTTR"
          value={avgMTTR}
          unit="hrs"
          icon={Activity}
          accent="var(--accent-cyan)"
          trend="down"
          trendValue="-0.5 hrs improved"
        />
        <MetricCard
          label="Availability"
          value={avgAvailability}
          unit="%"
          icon={CheckCircle}
          accent="var(--accent-emerald)"
          trend="up"
          trendValue="+1.2% this month"
        />
        <MetricCard
          label="Avg. OEE"
          value={avgOEE}
          unit="%"
          icon={Gauge}
          accent="var(--accent-purple)"
          trend="up"
          trendValue="+2.8% this quarter"
        />
        <MetricCard
          label="Total Failures"
          value={allMetrics.reduce((s, m) => s + m.totalFailures, 0)}
          icon={AlertTriangle}
          accent="var(--accent-amber)"
          trend="down"
          trendValue="-34% vs last year"
        />
        <MetricCard
          label="Total Downtime"
          value={allMetrics.reduce((s, m) => s + m.totalDowntime, 0)}
          unit="hrs"
          icon={TrendingUp}
          accent="var(--accent-red)"
          trend="down"
          trendValue="-62% with predictive"
        />
      </div>

      {/* Charts */}
      <div className="reliability-charts">
        {/* Equipment Health Comparison */}
        <div className="chart-panel">
          <div className="chart-panel__title">
            <BarChart3 size={16} style={{ color: 'var(--accent-blue)', opacity: 0.7 }} />
            Equipment Health & OEE Comparison
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="health" name="Health %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="oee" name="OEE %" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OEE Radar for P-101 */}
        <div className="chart-panel">
          <div className="chart-panel__title">
            <Activity size={16} style={{ color: 'var(--accent-cyan)', opacity: 0.7 }} />
            OEE Breakdown — Pump P-101
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={[0, 100]}
              />
              <Radar
                name="P-101"
                dataKey="value"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Trend */}
        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-panel__title">
            <TrendingUp size={16} style={{ color: 'var(--accent-emerald)', opacity: 0.7 }} />
            30-Day Equipment Health Trend — P-101
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="reliabilityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={4}
              />
              <YAxis
                domain={[60, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f1f5f9'
                }}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#3b82f6"
                fill="url(#reliabilityGrad)"
                strokeWidth={2}
                name="Health %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Machine Reliability Table */}
        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-panel__title">
            <Gauge size={16} style={{ color: 'var(--accent-amber)', opacity: 0.7 }} />
            Equipment Reliability Summary
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Health</th>
                  <th>MTBF (hrs)</th>
                  <th>MTTR (hrs)</th>
                  <th>Availability</th>
                  <th>OEE</th>
                  <th>Failures</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(MACHINES).map(m => {
                  const met = metrics[m.id];
                  if (!met) return null;
                  return (
                    <tr
                      key={m.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/digital-twin/${m.id}`)}
                    >
                      <td style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-medium)' }}>
                        {m.id} — {m.name}
                      </td>
                      <td>{m.type}</td>
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
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{met.totalFailures}</td>
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
