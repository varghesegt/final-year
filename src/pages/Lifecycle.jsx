/* ===================================================================
   Module 6 — Asset Lifecycle Management (Dynamic per Machine)
   =================================================================== */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, DollarSign, Calendar, Wrench, TrendingUp,
  Shield, Package, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { MACHINES, getAssetLifecycle, getMaintenanceHistory } from '../data/factoryData';
import { MetricCard, Badge, MachineSelector } from '../components/common';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Lifecycle() {
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();

  const selectedMachineId = (paramMachineId && MACHINES[paramMachineId]) ? paramMachineId : 'P-101';
  const machine = MACHINES[selectedMachineId] || MACHINES['P-101'];
  const lifecycle = getAssetLifecycle(selectedMachineId);
  const history = getMaintenanceHistory(selectedMachineId);

  if (!lifecycle) return null;

  const ageYears = ((new Date() - new Date(lifecycle.purchaseDate)) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
  const remainingLife = Math.max(0, lifecycle.expectedLife - parseFloat(ageYears));
  const lifePercent = Math.min(100, Math.round((parseFloat(ageYears) / lifecycle.expectedLife) * 100));

  // TCO breakdown
  const tcoData = [
    { name: 'Purchase', value: lifecycle.purchaseCost },
    { name: 'Installation', value: lifecycle.installCost },
    { name: 'Maintenance', value: lifecycle.totalMaintenanceCost },
    { name: 'Energy (est.)', value: 85000 },
    { name: 'Downtime Loss', value: Math.round(lifecycle.totalDowntimeHours * 5000) },
  ];
  const totalTCO = tcoData.reduce((s, d) => s + d.value, 0);

  // Cumulative cost over time
  const costTimeline = [];
  let cumulative = lifecycle.purchaseCost + lifecycle.installCost;
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedHistory.forEach((entry) => {
    cumulative += entry.cost;
    costTimeline.push({
      date: entry.date,
      label: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      cost: cumulative,
    });
  });

  const handleMachineSelect = (newId) => {
    navigate(`/lifecycle/${newId}`);
  };

  return (
    <div className="lifecycle-page">
      <div className="section-header">
        <div className="section-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
            <h1 className="section-header__title" style={{ margin: 0 }}>
              <Clock size={24} style={{ color: 'var(--accent-cyan)' }} />
              Asset Lifecycle — {machine.name} ({machine.id})
            </h1>
            <MachineSelector selectedId={selectedMachineId} onChange={handleMachineSelect} />
          </div>
          <p className="section-header__subtitle" style={{ marginTop: 'var(--sp-1)' }}>
            Complete lifecycle tracking from procurement to retirement
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="lifecycle-header">
        <MetricCard
          label="Asset Age"
          value={ageYears}
          unit="years"
          icon={Calendar}
          accent="var(--accent-blue)"
        />
        <MetricCard
          label="Remaining Life"
          value={remainingLife.toFixed(1)}
          unit="years"
          icon={Shield}
          accent="var(--accent-emerald)"
          trend={remainingLife > 5 ? 'stable' : 'down'}
          trendValue={remainingLife > 5 ? 'Good condition' : 'Plan replacement'}
        />
        <MetricCard
          label="Life Used"
          value={lifePercent}
          unit="%"
          icon={TrendingUp}
          accent="var(--accent-amber)"
        />
        <MetricCard
          label="Total Maintenance Cost"
          value={`₹${(lifecycle.totalMaintenanceCost / 1000).toFixed(0)}K`}
          icon={DollarSign}
          accent="var(--accent-red)"
        />
        <MetricCard
          label="Current Book Value"
          value={`₹${(lifecycle.currentBookValue / 1000).toFixed(0)}K`}
          icon={Package}
          accent="var(--accent-purple)"
        />
      </div>

      <div className="twin-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        {/* Timeline */}
        <div className="twin-panel">
          <div className="twin-panel__title">
            <Calendar size={16} className="twin-panel__title-icon" />
            Asset Lifecycle Timeline
          </div>
          <div className="timeline">
            {lifecycle.events.map((event, i) => (
              <div key={i} className="timeline__item">
                <div className={`timeline__dot timeline__dot--${event.type}`} />
                <div className="timeline__date">
                  {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="timeline__description">{event.description}</div>
                {event.cost > 0 && (
                  <div className="timeline__cost">₹{event.cost.toLocaleString()}</div>
                )}
              </div>
            ))}
            {/* Current State */}
            <div className="timeline__item">
              <div className="timeline__dot" style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 12px rgba(6,182,212,0.5)' }} />
              <div className="timeline__date">Now — {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
              <div className="timeline__description" style={{ color: 'var(--accent-cyan)' }}>
                Health: {machine.health}% • AI-monitored active asset
              </div>
            </div>
          </div>
        </div>

        {/* TCO Breakdown */}
        <div className="twin-panel">
          <div className="twin-panel__title">
            <DollarSign size={16} className="twin-panel__title-icon" />
            Total Cost of Ownership (TCO) Breakdown
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={tcoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                  stroke="none"
                >
                  {tcoData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 'var(--sp-2)' }}>TOTAL TCO</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--sp-4)' }}>
                ₹{totalTCO.toLocaleString()}
              </div>
              {tcoData.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-2)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                    {item.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    ₹{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Cost Chart */}
          {costTimeline.length > 0 && (
            <div style={{ marginTop: 'var(--sp-5)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-3)' }}>
                Cumulative Maintenance & Lifecycle Expenditure
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={costTimeline} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#f1f5f9' }}
                    formatter={v => `₹${v.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#costGrad)" strokeWidth={2} name="Cumulative Cost" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance History Table */}
      <div className="twin-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="twin-panel__title">
          <Wrench size={16} className="twin-panel__title-icon" />
          Maintenance History Log
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Action</th>
              <th>Duration</th>
              <th>Cost</th>
              <th>Technician</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--sp-4)' }}>
                  No maintenance records logged for this asset.
                </td>
              </tr>
            ) : (
              history.map((entry, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <Badge variant={entry.type === 'Corrective' ? 'critical' : entry.type === 'Predictive' ? 'info' : 'healthy'}>
                      {entry.type}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--text-primary)', maxWidth: '300px' }}>{entry.action}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{entry.duration}h</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>₹{entry.cost.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{entry.technician}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
