import { Calendar as CalendarIcon } from 'lucide-react';

export function MaintenanceCalendar({ workOrders = [] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayDate = now.getDate();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const events = {
    5: [{ type: 'completed', title: 'P-101 Oil & Filter Change', tech: 'T-003' }],
    12: [{ type: 'completed', title: 'CNC-001 Spindle Calibration', tech: 'T-001' }],
    24: [{ type: 'planned', title: 'COMP-201 Air Filter Cleaning', tech: 'T-005' }],
  };

  workOrders.forEach((wo) => {
    const sched = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
    const dayNum = sched && sched.getMonth() === month ? sched.getDate() : Math.min(daysInMonth, todayDate + 3);
    if (!events[dayNum]) events[dayNum] = [];
    events[dayNum].push({
      type: wo.status === 'Completed' ? 'completed' : wo.priority === 'CRITICAL' ? 'predicted' : 'planned',
      title: `${wo.machineId} ${wo.failureMode}`,
      tech: wo.assignedTo?.id || 'T-001',
    });
  });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="twin-panel">
      <div className="twin-panel__title">
        <div className="twin-panel__title-left">
          <CalendarIcon size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
          <span>Maintenance Schedule — {currentMonth}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-healthy)' }} /> Completed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-warning)' }} /> Scheduled
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-critical)' }} /> Critical
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: '6px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            padding: '4px 0'
          }}>
            {d}
          </div>
        ))}

        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const dayEvents = events[day] || [];
          const isToday = day === todayDate;

          return (
            <div
              key={day}
              style={{
                background: isToday ? 'var(--accent-blue-soft)' : 'var(--bg-tertiary)',
                border: `1px solid ${isToday ? '#bfdbfe' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                minHeight: '72px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent-blue)' : 'var(--text-secondary)'
              }}>
                <span>{day}</span>
                {isToday && <span style={{ fontSize: '10px' }}>Today</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    title={`${ev.title} (${ev.tech})`}
                    style={{
                      fontSize: '10px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
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
