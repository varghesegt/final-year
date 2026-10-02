import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Factory, Cpu, Brain, ClipboardList, BarChart3, Clock,
  Activity, ShieldCheck, Zap, Radio
} from 'lucide-react';
import { getFactorySummary } from '../../data/factoryData';

const NAV_ITEMS = [
  { section: 'Monitoring' },
  { path: '/', label: 'Factory Overview', icon: Factory, description: 'Digital factory floor' },
  { path: '/digital-twin', label: 'Machine Digital Twin', icon: Cpu, description: 'Asset deep dive' },
  { section: 'Intelligence' },
  { path: '/predictions', label: 'Predictive Maintenance', icon: Brain, description: 'AI failure predictions' },
  { path: '/work-orders', label: 'Decision Engine', icon: ClipboardList, description: 'Maintenance planning' },
  { section: 'Analytics' },
  { path: '/reliability', label: 'Reliability Analytics', icon: BarChart3, description: 'KPIs & metrics' },
  { path: '/lifecycle', label: 'Asset Lifecycle', icon: Clock, description: 'Asset management' },
  { section: 'Connectivity' },
  { path: '/gateway', label: 'IoT Gateway & SCADA', icon: Radio, description: 'MQTT & OPC-UA tags' },
];

export default function Sidebar() {
  const location = useLocation();
  const [summary, setSummary] = useState(getFactorySummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getFactorySummary());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Factory size={22} />
        </div>
        <div className="sidebar__brand">
          <span className="sidebar__title">SmartFactory</span>
          <span className="sidebar__subtitle">Industry 4.0 Platform</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item, index) => {
          if (item.section) {
            return (
              <div key={index} className="sidebar__section-label">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <Icon size={18} className="sidebar__icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Live System Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__status-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--status-healthy)',
              boxShadow: '0 0 8px var(--status-healthy)',
              animation: 'breathe 2.5s infinite'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Factory Health
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            color: summary.avgHealth >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)'
          }}>
            {summary.avgHealth}%
          </span>
        </div>
      </div>
    </aside>
  );
}
