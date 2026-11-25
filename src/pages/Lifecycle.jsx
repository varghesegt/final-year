/* ===================================================================
   Asset Lifecycle & Total Cost of Ownership
   =================================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, DollarSign, Calendar, Wrench, Shield, Package
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { MACHINES, getAssetLifecycle, getMaintenanceHistory } from '../data/factoryData';
import { fetchLifecycleData } from '../services/api';
import { MetricCard, Badge, MachineSelector } from '../components/common';

const PIE_COLORS = ['#1d4ed8', '#0369a1', '#047857', '#b45309', '#6b7280'];

const EVENT_COLORS = {
  purchase: '#1d4ed8',
  installation: '#0369a1',
  upgrade: '#047857',
  'major-repair': '#b91c1c',
  repair: '#b45309',
  milestone: '#4b5563',
};

export default function Lifecycle() {
  const { machineId: paramMachineId } = useParams();
  const navigate = useNavigate();

  const selectedMachineId = (paramMachineId && MACHINES[paramMachineId]) ? paramMachineId : 'P-101';
  const [machine, setMachine] = useState(() => MACHINES[selectedMachineId] || MACHINES['P-101']);
  const [lifecycle, setLifecycle] = useState(() => getAssetLifecycle(selectedMachineId));
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(() => getMaintenanceHistory(selectedMachineId));

  useEffect(() => {
    let active = true;
    fetchLifecycleData(selectedMachineId).then((data) => {
      if (!active) return;
      if (data?.machine) setMachine(data.machine);
      if (data?.lifecycle) setLifecycle(data.lifecycle);
      if (data?.summary) setSummary(data.summary);
      if (data?.history) setHistory(data.history);
    });
    return () => { active = false; };
  }, [selectedMachineId]);

  if (!lifecycle) return null;

  const ageYears = summary?.ageYears ?? 6.5;
  const remainingYears = summary?.remainingYears ?? Math.max(0, (lifecycle.expectedLife || 12) - ageYears);
  const tcoBreakdown = summary?.tcoBreakdown || [
    { name: 'Purchase', value: lifecycle.purchaseCost },
    { name: 'Installation', value: lifecycle.installCost },
    { name: 'Maintenance', value: lifecycle.totalMaintenanceCost },
  ];
  const totalTco = summary?.totalTco ?? tcoBreakdown.reduce((s, d) => s + d.value, 0);
  const costTimeline = summary?.costTimeline || [];

  return (
    <div className="lifecycle-page">
      <div className="section-header">
        <div className="section-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <h1 className="section-header__title" style={{ margin: 0 }}>
              <Clock size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              {machine.name} Lifecycle
            </h1>
            <MachineSelector selectedId={selectedMachineId} onChange={(id) => navigate(`/lifecycle/${id}`)} />
          </div>
          <p className="section-header__subtitle">
            Asset age, service timeline, and total ownership cost
          </p>
        </div>
      </div>

      <div className="lifecycle-header">
        <MetricCard label="Asset Age" value={ageYears} unit="years" icon={Calendar} />
        <MetricCard
          label="Remaining Service Life"
          value={remainingYears}
          unit="years"
          icon={Shield}
          trend={remainingYears > 4 ? 'stable' : 'down'}
          trendValue={`${summary?.lifeUsedPct ?? 50}% of expected life`}
        />
        <MetricCard label="Repair Spend" value={`₹${(lifecycle.totalMaintenanceCost / 1000).toFixed(0)}K`} icon={DollarSign} />
        <MetricCard label="Current Book Value" value={`₹${(lifecycle.currentBookValue / 1000).toFixed(0)}K`} icon={Package} />
      </div>

      <div className="twin-grid">
        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Calendar size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>Asset History Timeline</span>
            </div>
            <Badge variant={summary?.replaceRecommended ? 'warning' : 'healthy'}>
              {summary?.recommendationLabel || 'Continue Routine Care'}
            </Badge>
          </div>
          <div className="timeline">
            {lifecycle.events.map((event, i) => (
              <div key={i} className="timeline__item">
                <div className="timeline__dot" style={{ background: EVENT_COLORS[event.type] || 'var(--accent-blue)' }} />
                <div className="timeline__date">
                  {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="timeline__description">{event.description}</div>
                {event.cost > 0 && (
                  <div className="timeline__cost">₹{event.cost.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {summary?.recommendationNote || 'Asset remains economical to maintain under current preventive schedule.'}
          </div>
        </div>

        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <DollarSign size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>Total Cost Breakdown</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
            <PieChart width={168} height={168}>
              <Pie
                data={tcoBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={74}
                dataKey="value"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {tcoBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
            </PieChart>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Lifecycle Cost</div>
              <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--sp-3)' }}>
                ₹{totalTco.toLocaleString()}
              </div>
              {tcoBreakdown.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {item.name}
                  </span>
                  <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    ₹{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {costTimeline.length > 1 && (
            <div style={{ marginTop: 'var(--sp-3)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-2)' }}>
                Cumulative Spend
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={costTimeline} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} formatter={v => `₹${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="cost" stroke="#1d4ed8" fill="url(#costGrad)" strokeWidth={2} name="Total Cost" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="twin-panel">
        <div className="twin-panel__title">
          <div className="twin-panel__title-left">
            <Wrench size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
            <span>Service & Repair Log</span>
          </div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Work Performed</th>
                <th>Hours</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--sp-4)' }}>
                    No service records logged for this asset.
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
                    <td style={{ color: 'var(--text-primary)' }}>{entry.action}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{entry.duration}h</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>₹{entry.cost.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
