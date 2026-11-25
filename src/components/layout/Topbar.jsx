import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronRight, AlertTriangle, Info, X, Menu } from 'lucide-react';
import { NOTIFICATIONS } from '../../data/factoryData';
import {
  fetchNotifications,
  markAllNotificationsRead,
  subscribeToNotificationsFeed,
  subscribeToLiveStream,
} from '../../services/api';

const PAGE_TITLES = {
  '/': 'Factory Overview',
  '/digital-twin': 'Machine Digital Twin',
  '/predictions': 'Condition Forecasts',
  '/work-orders': 'Work Orders',
  '/reliability': 'Reliability Metrics',
  '/lifecycle': 'Asset Lifecycle',
  '/gateway': 'Telemetry Gateway',
};

function resolvePageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const prefix = Object.keys(PAGE_TITLES).find(k => k !== '/' && pathname.startsWith(k));
  return prefix ? PAGE_TITLES[prefix] : 'Operations';
}

export default function Topbar({ onToggleSidebar = () => {} }) {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [backendConnected, setBackendConnected] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    fetchNotifications().then(list => {
      if (active && Array.isArray(list)) setNotifications(list);
    });

    const interval = setInterval(() => setTime(new Date()), 1000);
    const unsubNotif = subscribeToNotificationsFeed((updatedNotifs) => {
      setNotifications(updatedNotifs);
      if (updatedNotifs.length > 0 && !updatedNotifs[0].read) {
        setToast(updatedNotifs[0]);
        setTimeout(() => setToast(null), 4000);
      }
    });
    const unsubStream = subscribeToLiveStream((snap) => {
      setBackendConnected(Boolean(snap?.connected));
    });

    return () => {
      active = false;
      clearInterval(interval);
      unsubNotif();
      unsubStream();
    };
  }, []);

  const handleOpenNotifications = async () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    if (nextOpen) {
      const updated = await markAllNotificationsRead();
      setNotifications(updated);
    }
  };

  const pageTitle = resolvePageTitle(location.pathname);
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
            <Menu size={16} strokeWidth={1.75} />
          </button>
          <div className="topbar__breadcrumb">
            <span className="topbar__breadcrumb-root">Plant 01</span>
            <ChevronRight size={14} strokeWidth={1.75} className="topbar__breadcrumb-sep" />
            <span className="topbar__breadcrumb-current">{pageTitle}</span>
          </div>
        </div>

        <div className="topbar__right">
          <div
            className="topbar__status-pill"
            title={backendConnected ? 'Connected to telemetry database' : 'Running with local telemetry'}
          >
            <span
              className="topbar__status-dot"
              style={{
                background: backendConnected ? 'var(--status-healthy)' : 'var(--status-warning)',
              }}
            />
            <span>{backendConnected ? 'Telemetry Live' : 'Offline Mode'}</span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="topbar__alert-btn"
              title="Notifications"
              onClick={handleOpenNotifications}
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="topbar__alert-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
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
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {notifications.length} logged
                  </span>
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No alerts recorded
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
                          background: item.read ? 'transparent' : 'var(--accent-blue-soft)',
                        }}
                      >
                        {item.severity === 'critical' ? (
                          <AlertTriangle size={16} strokeWidth={1.75} style={{ color: 'var(--status-critical)', marginTop: 2, flexShrink: 0 }} />
                        ) : item.severity === 'warning' ? (
                          <AlertTriangle size={16} strokeWidth={1.75} style={{ color: 'var(--status-warning)', marginTop: 2, flexShrink: 0 }} />
                        ) : (
                          <Info size={16} strokeWidth={1.75} style={{ color: 'var(--accent-blue)', marginTop: 2, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.machineId ? `${item.machineId} · ` : ''}{item.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderLeft: `3px solid ${toast.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <AlertTriangle size={16} strokeWidth={1.75} style={{ color: toast.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {toast.machineId ? `Asset ${toast.machineId}` : 'Plant alert'}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px', display: 'flex' }}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
