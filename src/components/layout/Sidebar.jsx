import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Factory, Cpu, Activity, ClipboardList, BarChart3, Clock, Radio, X
} from 'lucide-react';
import { getFactorySummary } from '../../data/factoryData';
import { subscribeToLiveStream } from '../../services/api';

const NAV_ITEMS = [
  { section: 'Operations' },
  { path: '/', label: 'Factory Overview', icon: Factory },
  { path: '/digital-twin', label: 'Machine Digital Twin', icon: Cpu },
  { section: 'Maintenance' },
  { path: '/predictions', label: 'Condition Forecasts', icon: Activity },
  { path: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { section: 'Analytics' },
  { path: '/reliability', label: 'Reliability Metrics', icon: BarChart3 },
  { path: '/lifecycle', label: 'Asset Lifecycle', icon: Clock },
  { section: 'Infrastructure' },
  { path: '/gateway', label: 'Telemetry Gateway', icon: Radio },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const location = useLocation();
  const [summary, setSummary] = useState(getFactorySummary());

  useEffect(() => {
    const unsubscribe = subscribeToLiveStream((snapshot) => {
      if (snapshot?.summary) {
        setSummary(snapshot.summary);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
            <div className="sidebar__logo">
              <Factory size={16} strokeWidth={1.85} />
            </div>
            <div className="sidebar__brand">
              <span className="sidebar__title">SmartFactory</span>
              <span className="sidebar__subtitle">Operations Console</span>
            </div>
          </div>
          <button
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

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
                onClick={onClose}
                className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              >
                <Icon size={16} strokeWidth={1.75} className="sidebar__icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__status-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: summary.avgHealth >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)',
              }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Fleet Health
              </span>
            </div>
            <span className="tabular-nums" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: summary.avgHealth >= 80 ? 'var(--status-healthy)' : 'var(--status-warning)',
            }}>
              {summary.avgHealth}%
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
