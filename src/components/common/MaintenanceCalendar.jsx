import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';

export function MaintenanceCalendar() {
  const daysInMonth = 31;
  const currentMonth = 'August 2026';

  // Scheduled events for the month
  const events = {
    5: [{ type: 'completed', title: 'P-101 Oil & Filter Change', tech: 'T-003' }],
    12: [{ type: 'completed', title: 'CNC-002 Spindle Calibration', tech: 'T-001' }],
    18: [{ type: 'planned', title: 'P-101 AI Bearing Replacement', tech: 'T-003', priority: 'HIGH' }],
    24: [{ type: 'planned', title: 'COMP-201 Air Filter Cleaning', tech: 'T-005' }],
    29: [{ type: 'predicted', title: 'CNC-003 Vibration Inspection', tech: 'T-002', priority: 'CRITICAL' }],
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="twin-panel" style={{ marginTop: 'var(--sp-6)' }}>
      <div className="twin-panel__title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <CalendarIcon size={18} style={{ color: 'var(--accent-blue)' }} />
          <span>Interactive Maintenance Calendar — {currentMonth}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}>
          <span style={{ color: 'var(--status-healthy)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-healthy)' }} /> Completed
          </span>
          <span style={{ color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-warning)' }} /> Scheduled PM
          </span>
          <span style={{ color: 'var(--status-critical)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-critical)' }} /> AI Recommended
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        marginTop: 'var(--sp-4)'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '6px 0'
          }}>
            {d}
          </div>
        ))}

        {/* Offset for starting weekday (Friday Aug 1) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: 'transparent' }} />
        ))}

        {days.map(day => {
          const dayEvents = events[day] || [];
          const isToday = day === 6;

          return (
            <div
              key={day}
              style={{
                background: isToday ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                border: `1px solid ${isToday ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                minHeight: '75px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justify: 'space-between',
                fontSize: '11px',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--accent-blue)' : 'var(--text-secondary)'
              }}>
                <span>{day}</span>
                {isToday && <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>Today</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    title={`${ev.title} (${ev.tech})`}
                    style={{
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      background: ev.type === 'completed' ? 'rgba(16, 185, 129, 0.15)'
                        : ev.type === 'planned' ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      borderLeft: `2px solid ${
                        ev.type === 'completed' ? 'var(--status-healthy)'
                          : ev.type === 'planned' ? 'var(--status-warning)'
                          : 'var(--status-critical)'
                      }`,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
