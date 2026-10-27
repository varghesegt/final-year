import { Printer, X, FileText, CheckCircle2, ShieldCheck, Factory, Award } from 'lucide-react';
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
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '820px', width: '100%', maxHeight: '90vh',
        boxShadow: 'var(--shadow-2xl)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Top Actions */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc', flexWrap: 'wrap', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              ISO 55001 Asset Management Audit & Compliance Report
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-blue)', color: '#ffffff',
                border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Formal Printable Audit Document */}
        <div style={{ padding: 'clamp(14px, 3vw, 32px)', overflowY: 'auto', background: '#ffffff', color: '#0f172a' }}>
          {/* Document Letterhead */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Factory size={26} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', color: '#0f172a' }}>
                  SMARTFACTORY AI ENTERPRISE
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Plant Reliability & ISO 55000 Certified Asset Management Division
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>REPORT ID: SF-AUDIT-2026-Q3</div>
              <div style={{ color: '#64748b' }}>Generated: {currentDate}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-healthy)', fontWeight: 700 }}>
                <CheckCircle2 size={12} /> AUDIT COMPLIANT
              </div>
            </div>
          </div>

          {/* Plant Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Fleet Health Index</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>{summary.avgHealth}%</div>
            </div>
            <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Plant Availability</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-healthy)', marginTop: '2px' }}>{summary.uptime}%</div>
            </div>
            <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Active Assets</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{summary.totalMachines} Units</div>
            </div>
            <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Cost Savings (Est.)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-healthy)', marginTop: '2px' }}>
                ₹{(totalSavings || 184000).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Section 1: Equipment Inventory & Health Status */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
              1. Monitored Equipment Roster & Health Condition
            </h4>
            <div className="data-table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Asset ID</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Machine Name</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Manufacturer & Model</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Zone</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px' }}>Health %</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(MACHINES).map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.id}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '6px 8px', color: '#64748b' }}>{m.manufacturer} {m.model}</td>
                      <td style={{ padding: '6px 8px' }}>{m.zone}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.health}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                          background: m.status === 'critical' ? '#fee2e2' : m.status === 'warning' ? '#fef3c7' : '#d1fae5',
                          color: m.status === 'critical' ? '#dc2626' : m.status === 'warning' ? '#d97706' : '#059669',
                          textTransform: 'uppercase'
                        }}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Active Maintenance Work Orders Audit */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
              2. Maintenance Work Orders & Preventive ROI
            </h4>
            <div className="data-table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Order ID</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Asset</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Failure Mode / Action</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Assigned Specialist</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Preventive Cost</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Net Savings</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.slice(0, 4).map((wo) => (
                    <tr key={wo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{wo.id}</td>
                      <td style={{ padding: '6px 8px' }}>{wo.machineName}</td>
                      <td style={{ padding: '6px 8px', color: '#475569' }}>{wo.action}</td>
                      <td style={{ padding: '6px 8px' }}>{wo.assignedTo?.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{wo.costComparison?.preventive.cost.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--status-healthy)', fontWeight: 700 }}>
                        ₹{wo.costComparison?.savings.toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                          background: wo.status === 'Completed' ? '#d1fae5' : '#e0f2fe',
                          color: wo.status === 'Completed' ? '#059669' : '#0284c7'
                        }}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Engineering Certification & Sign-off Stamp */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            borderTop: '2px solid #0f172a', paddingTop: '16px', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                Certification of Compliance:
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', maxWidth: '380px', marginTop: '4px', lineHeight: 1.4 }}>
                This audit document certifies that plant machinery vibration, thermal parameters, and degradation metrics comply with ISO 10816-3 standards. All predictive work orders conform to ISO 55000 asset integrity mandates.
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{
                fontFamily: "'Brush Script MT', cursive, sans-serif",
                fontSize: '22px', color: '#1e3a8a', marginBottom: '2px'
              }}>
                Rajesh Kumar
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>
                Chief Reliability Engineer
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Licence: CRE-2026-IND-8841</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
