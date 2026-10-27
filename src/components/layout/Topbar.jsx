import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sparkles, ChevronRight, Play, RotateCcw, AlertTriangle, CheckCircle, Info, X, Zap, Menu } from 'lucide-react';
import {
  getFactorySummary, NOTIFICATIONS, markNotificationsRead,
  subscribeToNotifications, triggerFailureSimulation, resetMachineHealth,
  isSimulationActive
} from '../../data/factoryData';

const PAGE_TITLES = {
  '/': 'Factory Overview',
  '/digital-twin': 'Machine Digital Twin',
  '/predictions': 'Predictive Maintenance',
  '/work-orders': 'Decision Engine',
  '/reliability': 'Reliability Analytics',
  '/lifecycle': 'Asset Lifecycle',
  '/gateway': 'IoT Gateway & SCADA',
};

export default function Topbar({ onToggleSidebar = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [simulating, setSimulating] = useState(isSimulationActive());
  const [toast, setToast] = useState(null);

  const summary = getFactorySummary();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    const unsubscribe = subscribeToNotifications((updatedNotifs) => {
      setNotifications(updatedNotifs);
      if (updatedNotifs.length > 0 && !updatedNotifs[0].read) {
        setToast(updatedNotifs[0]);
        setTimeout(() => setToast(null), 4000);
      }
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleToggleSimulation = () => {
    if (simulating) {
      resetMachineHealth('P-101');
      setSimulating(false);
    } else {
      setSimulating(true);
      triggerFailureSimulation('P-101', 20, null, () => {
        setSimulating(false);
      });
      if (location.pathname !== '/digital-twin') {
        navigate('/digital-twin');
      }
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markNotificationsRead();
    }
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="topbar-wrapper">
      <header className="topbar">
        <div className="topbar__left">
          <button
            className="topbar__menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="topbar__breadcrumb">
            <span className="topbar__breadcrumb-root">SmartFactory</span>
            <ChevronRight size={14} className="topbar__breadcrumb-sep" />
            <span className="topbar__breadcrumb-current">{pageTitle}</span>
          </div>
        </div>


        <div className="topbar__right">

          {/* Alert Bell Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="topbar__alert-btn"
              title="Notifications & Alerts"
              onClick={handleOpenNotifications}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="topbar__alert-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '340px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 1000,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                    Alert Notifications
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {notifications.length} total
                  </span>
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          background: item.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                        }}
                      >
                        {item.severity === 'critical' ? (
                          <AlertTriangle size={16} style={{ color: 'var(--status-critical)', marginTop: 2, flexShrink: 0 }} />
                        ) : item.severity === 'warning' ? (
                          <AlertTriangle size={16} style={{ color: 'var(--status-warning)', marginTop: 2, flexShrink: 0 }} />
                        ) : (
                          <Info size={16} style={{ color: 'var(--accent-blue)', marginTop: 2, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.machineId ? `Asset: ${item.machineId} • ` : ''}{item.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="topbar__clock">
            <span className="topbar__clock-time">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="topbar__clock-date">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: `1px solid ${toast.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xl)',
        }}>
          <AlertTriangle size={20} style={{ color: toast.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Telemetry alert triggered in real-time
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
