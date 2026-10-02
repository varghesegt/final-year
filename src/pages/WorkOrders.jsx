/* ===================================================================
   Module 4 — Maintenance Decision Engine (Work Orders)
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  ClipboardList, User, Package, DollarSign, Clock,
  AlertTriangle, CheckCircle, Wrench, Calendar, TrendingDown,
  QrCode, FileText, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES, getActiveWorkOrders, completeWorkOrder } from '../data/factoryData';
import { Badge, MaintenanceCalendar, ExportPdfButton } from '../components/common';
import { WorkOrderSignOffModal } from '../components/common/WorkOrderSignOffModal';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { AuditReportModal } from '../components/common/AuditReportModal';

export default function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOrderForSignOff, setSelectedOrderForSignOff] = useState(null);
  const [selectedMachineForQR, setSelectedMachineForQR] = useState(null);
  const [showAuditReport, setShowAuditReport] = useState(false);

  useEffect(() => {
    setWorkOrders(getActiveWorkOrders());
  }, []);

  const handleConfirmSignOff = (orderId, signOffData) => {
    const updated = completeWorkOrder(orderId, signOffData);
    setWorkOrders(updated);
    setSelectedOrderForSignOff(null);
  };

  return (
    <div className="workorders-page">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <ClipboardList size={24} style={{ color: 'var(--accent-amber)' }} />
            Maintenance Decision Engine & Technician Dispatch
          </h1>
          <p className="section-header__subtitle">
            AI-generated work orders, spare parts verification, cost analysis & certified field sign-off
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAuditReport(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)',
              color: 'var(--accent-purple)', fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <FileText size={14} />
            <span>ISO 55000 Audit Report</span>
          </button>

          <ExportPdfButton label="Print Work Orders View" />
          <Badge variant="info">{workOrders.length} Orders Logged</Badge>
        </div>
      </div>

      {/* Work Order Cards List */}
      {workOrders.map(wo => (
        <div key={wo.id} className="workorder-card" style={{ borderLeft: wo.status === 'Completed' ? '4px solid var(--status-healthy)' : '4px solid var(--accent-amber)' }}>
          {/* Header */}
          <div className="workorder-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <span className="workorder-card__id">{wo.id}</span>
              <Badge variant={wo.priority === 'CRITICAL' ? 'critical' : wo.priority === 'HIGH' ? 'warning' : 'info'}>
                {wo.priority}
              </Badge>
              {wo.status === 'Completed' ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--status-healthy)', fontSize: '11px', fontWeight: 700
                }}>
                  <CheckCircle2 size={13} /> COMPLETED & SIGNED OFF
                </span>
              ) : (
                <Badge variant="info">{wo.status}</Badge>
              )}
            </div>

            {/* Header Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedMachineForQR(MACHINES[wo.machineId])}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                  background: '#f8fafc', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                }}
                title="View physical asset identification badge and QR code"
              >
                <QrCode size={13} />
                <span>Asset QR Badge</span>
              </button>

              {wo.status !== 'Completed' && (
                <button
                  onClick={() => setSelectedOrderForSignOff(wo)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--status-healthy)', border: 'none',
                    color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Wrench size={13} />
                  <span>Sign Off & Complete</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="workorder-card__grid">
            {/* Asset Info */}
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Wrench size={14} /> Asset & Action
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Machine</span>
                <span
                  className="workorder-card__row-value"
                  style={{ color: 'var(--accent-blue)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/digital-twin/${wo.machineId}`)}
                >
                  {wo.machineName} ({wo.machineId})
                </span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Failure Mode</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-warning)' }}>{wo.failureMode}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Action</span>
                <span className="workorder-card__row-value">{wo.action}</span>
              </div>
            </div>

            {/* Schedule */}
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Calendar size={14} /> Schedule
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Recommended</span>
                <span className="workorder-card__row-value">{wo.scheduledDate}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Deadline</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-critical)' }}>{wo.deadline}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Est. Downtime</span>
                <span className="workorder-card__row-value">{wo.estimatedDowntime}</span>
              </div>
            </div>

            {/* Technician */}
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <User size={14} /> Technician
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Assigned</span>
                <span className="workorder-card__row-value">{wo.assignedTo.name}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">ID</span>
                <span className="workorder-card__row-value" style={{ fontFamily: 'var(--font-mono)' }}>{wo.assignedTo.id}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Specialization</span>
                <span className="workorder-card__row-value">{wo.assignedTo.specialization}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Status</span>
                <span className="workorder-card__row-value">
                  {wo.status === 'Completed' ? (
                    <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>Work Certified</span>
                  ) : wo.assignedTo.available ? (
                    <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>Available</span>
                  ) : (
                    <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>On Call</span>
                  )}
                </span>
              </div>
            </div>

            {/* Spare Parts */}
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Package size={14} /> Spare Parts Inventory
              </div>
              {wo.spareParts.map((part, i) => (
                <div key={i} className="workorder-card__row">
                  <span className="workorder-card__row-label">{part.name}</span>
                  <span className="workorder-card__row-value">
                    <Badge variant={part.stock > 0 ? 'healthy' : 'critical'}>
                      {part.status}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign-off Details if Completed */}
          {wo.status === 'Completed' && wo.signOff && (
            <div style={{ marginTop: 'var(--sp-4)', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-healthy)' }}>
                  CERTIFIED FIELD COMPLETION RECORD
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {wo.signOff.notes}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Signed by {wo.signOff.technician} at {new Date(wo.signOff.completedAt).toLocaleString()}
                </div>
              </div>
              {wo.signOff.signature && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Verified Signature</div>
                  <img src={wo.signOff.signature} alt="Technician Signature" style={{ height: '36px', borderBottom: '1px solid var(--text-muted)' }} />
                </div>
              )}
            </div>
          )}

          {/* Cost Comparison */}
          <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="workorder-card__section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              <DollarSign size={14} /> Financial Impact & ROI Analysis
            </div>
            <div className="workorder-card__cost-comparison">
              <div className="cost-box cost-box--preventive">
                <div className="cost-box__label">Preventive Intervention</div>
                <div className="cost-box__amount">₹{wo.costComparison.preventive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.preventive.downtime}h planned downtime</div>
              </div>
              <div className="cost-box cost-box--reactive">
                <div className="cost-box__label">Catastrophic Reactive Loss</div>
                <div className="cost-box__amount">₹{wo.costComparison.reactive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.reactive.downtime}h unplanned downtime</div>
              </div>
            </div>
            <div className="savings-banner">
              <TrendingDown size={16} />
              Proactive scheduling prevents catastrophic breakdown: Saves ₹{wo.costComparison.savings.toLocaleString()} (ROI: {wo.costComparison.roi}x)
            </div>
          </div>
        </div>
      ))}

      {/* Interactive Maintenance Calendar View */}
      <MaintenanceCalendar />

      {/* Sign-Off Modal */}
      {selectedOrderForSignOff && (
        <WorkOrderSignOffModal
          workOrder={selectedOrderForSignOff}
          onClose={() => setSelectedOrderForSignOff(null)}
          onConfirmSignOff={handleConfirmSignOff}
        />
      )}

      {/* Asset QR Badge Modal */}
      {selectedMachineForQR && (
        <AssetQRCodeModal
          machine={selectedMachineForQR}
          onClose={() => setSelectedMachineForQR(null)}
        />
      )}

      {/* ISO 55000 Audit Report Modal */}
      {showAuditReport && (
        <AuditReportModal
          workOrders={workOrders}
          onClose={() => setShowAuditReport(false)}
        />
      )}
    </div>
  );
}
