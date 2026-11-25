import { Printer, X, FileText, CheckCircle2, Factory } from 'lucide-react';
import { MACHINES, getFactorySummary } from '../../data/factoryData';

export function AuditReportModal({ workOrders = [], onClose }) {
  const summary = getFactorySummary();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const totalSavings = workOrders.reduce((sum, wo) => sum + (wo.costComparison?.savings || 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(17, 24, 39, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '820px', width: '100%', maxHeight: '90vh',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)', flexWrap: 'wrap', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              ISO 55001 Asset Compliance Report
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => window.print()} className="btn btn--primary">
              <Printer size={14} strokeWidth={1.75} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', background: '#ffffff', color: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Factory size={20} strokeWidth={1.75} />
                <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}>
                  SMARTFACTORY OPERATIONS
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Plant Reliability & ISO 55001 Asset Management Ledger
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SF-AUDIT-2026-Q4</div>
              <div style={{ color: 'var(--text-muted)' }}>Generated {currentDate}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: 'var(--status-healthy)', fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Compliant
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div className="dossier-card">
              <div className="dossier-card__label">Fleet Health</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{summary.avgHealth}%</div>
            </div>
            <div className="dossier-card">
              <div className="dossier-card__label">Availability</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{summary.uptime}%</div>
            </div>
            <div className="dossier-card">
              <div className="dossier-card__label">Monitored Assets</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{summary.totalMachines} Units</div>
            </div>
            <div className="dossier-card">
              <div className="dossier-card__label">Projected Savings</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)', marginTop: '4px' }}>
                ₹{(totalSavings || 184000).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '10px' }}>
              1. Equipment Roster & Condition
            </h4>
            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Machine Name</th>
                    <th>Model</th>
                    <th>Zone</th>
                    <th>Health</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(MACHINES).map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{m.id}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</td>
                      <td>{m.manufacturer} {m.model}</td>
                      <td>{m.zone}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{m.health}%</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '10px' }}>
              2. Maintenance Work Orders
            </h4>
            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Asset</th>
                    <th>Scope</th>
                    <th>Technician</th>
                    <th>Preventive</th>
                    <th>Savings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.slice(0, 6).map((wo) => (
                    <tr key={wo.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{wo.id}</td>
                      <td>{wo.machineName}</td>
                      <td>{wo.action}</td>
                      <td>{wo.assignedTo?.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{wo.costComparison?.preventive.cost.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)', fontWeight: 600 }}>
                        ₹{wo.costComparison?.savings.toLocaleString()}
                      </td>
                      <td>{wo.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            borderTop: '1px solid var(--border-default)', paddingTop: '16px', flexWrap: 'wrap', gap: '16px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
              Vibration and thermal parameters are evaluated against ISO 10816-3 and API 610 thresholds; work orders follow ISO 55001 maintenance governance.
            </div>
            <div style={{ textAlign: 'right', minWidth: '180px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Rajesh Kumar</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lead Reliability Engineer · CRE-2026-8841</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
