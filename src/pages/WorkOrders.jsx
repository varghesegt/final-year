/* ===================================================================
   Work Orders — CMMS Dispatch, Spare Inventory & Field Sign-Off
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  ClipboardList, User, Package, DollarSign,
  Wrench, Calendar, TrendingDown, Plus,
  QrCode, FileText, CheckCircle2, Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES } from '../data/factoryData';
import { fetchWorkOrders, signOffWorkOrder, createWorkOrder, fetchSpareParts } from '../services/api';
import { Badge, MetricCard, MaintenanceCalendar, ExportPdfButton } from '../components/common';
import { WorkOrderSignOffModal } from '../components/common/WorkOrderSignOffModal';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { AuditReportModal } from '../components/common/AuditReportModal';

export default function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [dispatchMachineId, setDispatchMachineId] = useState('P-101');
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedOrderForSignOff, setSelectedOrderForSignOff] = useState(null);
  const [selectedMachineForQR, setSelectedMachineForQR] = useState(null);
  const [showAuditReport, setShowAuditReport] = useState(false);

  useEffect(() => {
    let active = true;
    fetchWorkOrders().then((orders) => {
      if (active) setWorkOrders(orders);
    });
    fetchSpareParts().then((parts) => {
      if (active) setSpareParts(parts);
    });
    return () => { active = false; };
  }, []);

  const handleConfirmSignOff = async (orderId, signOffData) => {
    const updated = await signOffWorkOrder(orderId, signOffData);
    setWorkOrders(updated);
    const updatedParts = await fetchSpareParts();
    if (updatedParts.length) setSpareParts(updatedParts);
    setSelectedOrderForSignOff(null);
  };

  const handleDispatchOrder = async () => {
    if (!dispatchMachineId) return;
    setIsDispatching(true);
    try {
      const res = await createWorkOrder(dispatchMachineId);
      if (res?.workOrders) setWorkOrders(res.workOrders);
    } finally {
      setIsDispatching(false);
    }
  };

  const pendingCount = workOrders.filter(w => w.status !== 'Completed').length;
  const completedCount = workOrders.filter(w => w.status === 'Completed').length;
  const totalPmSpend = workOrders.reduce((s, w) => s + (w.costComparison?.preventive?.cost || 0), 0);
  const totalAvoidedLoss = workOrders.reduce((s, w) => s + (w.costComparison?.savings || 0), 0);

  return (
    <div className="workorders-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <ClipboardList size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Work Orders & Dispatch
          </h1>
          <p className="section-header__subtitle">
            Preventive maintenance scheduling, OEM SKU inventory verification, and technician sign-off
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '3px 4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <select
              value={dispatchMachineId}
              onChange={(e) => setDispatchMachineId(e.target.value)}
              aria-label="Select machine for new work order"
              style={{ border: 'none', background: 'transparent', fontSize: '12px', color: 'var(--text-primary)', padding: '4px 6px', fontFamily: 'var(--font-mono)', outline: 'none' }}
            >
              {Object.values(MACHINES).map(m => (
                <option key={m.id} value={m.id}>{m.id} · {m.name}</option>
              ))}
            </select>
            <button onClick={handleDispatchOrder} disabled={isDispatching} className="btn btn--primary" style={{ padding: '5px 10px', fontSize: '12px' }}>
              <Plus size={13} strokeWidth={2} />
              <span>{isDispatching ? 'Creating...' : 'Dispatch WO'}</span>
            </button>
          </div>

          <button onClick={() => setShowAuditReport(true)} className="btn btn--secondary">
            <FileText size={14} strokeWidth={1.75} />
            <span>ISO 55001 Audit</span>
          </button>

          <ExportPdfButton label="Print Orders" />
        </div>
      </div>

      <div className="factory-stats">
        <MetricCard label="Open Dispatches" value={pendingCount} icon={ClipboardList} trend={pendingCount > 0 ? 'down' : 'stable'} trendValue="Active queue" />
        <MetricCard label="Completed PMs" value={completedCount} icon={CheckCircle2} trend="up" trendValue="Digitally signed off" />
        <MetricCard label="Planned PM Cost" value={`₹${(totalPmSpend / 1000).toFixed(1)}K`} icon={Wrench} trend="stable" trendValue="Labor + parts" />
        <MetricCard label="Net Avoided Loss" value={`₹${(totalAvoidedLoss / 1000).toFixed(1)}K`} icon={TrendingDown} trend="up" trendValue="vs reactive failure" />
      </div>

      {workOrders.map(wo => (
        <div key={wo.id} className="workorder-card">
          <div className="workorder-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <span className="workorder-card__id">{wo.id}</span>
              <Badge variant={wo.priority === 'CRITICAL' ? 'critical' : wo.priority === 'HIGH' ? 'warning' : 'info'}>
                {wo.priority}
              </Badge>
              {wo.status === 'Completed' ? (
                <Badge variant="healthy">
                  <CheckCircle2 size={12} strokeWidth={2} />
                  Completed
                </Badge>
              ) : (
                <Badge variant="info">{wo.status}</Badge>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedMachineForQR(MACHINES[wo.machineId])}
                className="btn btn--secondary"
              >
                <QrCode size={13} strokeWidth={1.75} />
                <span>Asset Tag</span>
              </button>

              {wo.status !== 'Completed' && (
                <button
                  onClick={() => setSelectedOrderForSignOff(wo)}
                  className="btn btn--success"
                >
                  <Wrench size={13} strokeWidth={1.75} />
                  <span>Sign Off</span>
                </button>
              )}
            </div>
          </div>

          <div className="workorder-card__grid">
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Wrench size={13} strokeWidth={1.75} /> Asset & Scope
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Machine</span>
                <span
                  className="workorder-card__row-value"
                  style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                  onClick={() => navigate(`/digital-twin/${wo.machineId}`)}
                >
                  {wo.machineName} ({wo.machineId})
                </span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Fault Mode</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-warning)' }}>{wo.failureMode}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Action</span>
                <span className="workorder-card__row-value">{wo.action}</span>
              </div>
            </div>

            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Calendar size={13} strokeWidth={1.75} /> Schedule
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Window</span>
                <span className="workorder-card__row-value">{wo.scheduledDate}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Deadline</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-critical)' }}>{wo.deadline}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Downtime</span>
                <span className="workorder-card__row-value">{wo.estimatedDowntime}</span>
              </div>
            </div>

            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <User size={13} strokeWidth={1.75} /> Technician
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Assigned</span>
                <span className="workorder-card__row-value">{wo.assignedTo.name}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Badge / Shift</span>
                <span className="workorder-card__row-value" style={{ fontFamily: 'var(--font-mono)' }}>
                  {wo.assignedTo.id}{wo.assignedTo.shift ? ` · ${wo.assignedTo.shift.split(' ')[1]}` : ''}
                </span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Certification</span>
                <span className="workorder-card__row-value">{wo.assignedTo.certification || wo.assignedTo.specialization}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Availability</span>
                <span className="workorder-card__row-value" style={{ color: wo.status === 'Completed' || wo.assignedTo.available ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
                  {wo.status === 'Completed' ? 'Certified' : wo.assignedTo.available ? 'Available' : 'On Call'}
                </span>
              </div>
            </div>

            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Package size={13} strokeWidth={1.75} /> Spare Parts & Bins
              </div>
              {wo.spareParts.map((part, i) => (
                <div key={i} className="workorder-card__row">
                  <span className="workorder-card__row-label">
                    {part.name}
                    {part.bin && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', marginLeft: '6px', color: 'var(--text-muted)' }}>[{part.bin}]</span>}
                  </span>
                  <span className="workorder-card__row-value">
                    <Badge variant={part.stock > 0 ? 'healthy' : 'critical'}>
                      {part.status} ({part.stock})
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {wo.status === 'Completed' && wo.signOff && (
            <div style={{
              padding: '12px 16px',
              background: '#ecfdf5',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #a7f3d0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-healthy)', textTransform: 'uppercase' }}>
                  Completion Sign-Off Record
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {wo.signOff.notes}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Signed by {wo.signOff.technician} · {new Date(wo.signOff.completedAt).toLocaleString()}
                </div>
              </div>
              {wo.signOff.signature && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Technician Signature</div>
                  <img src={wo.signOff.signature} alt="Technician Signature" style={{ height: '36px', borderBottom: '1px solid var(--border-default)' }} />
                </div>
              )}
            </div>
          )}

          <div style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="workorder-card__section-title" style={{ marginBottom: 'var(--sp-2)' }}>
              <DollarSign size={13} strokeWidth={1.75} /> Preventive vs. Reactive Cost Impact
            </div>
            <div className="workorder-card__cost-comparison">
              <div className="cost-box cost-box--preventive">
                <div className="cost-box__label">Planned Intervention</div>
                <div className="cost-box__amount">₹{wo.costComparison.preventive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.preventive.downtime}h planned downtime</div>
              </div>
              <div className="cost-box cost-box--reactive">
                <div className="cost-box__label">Unplanned Breakdown</div>
                <div className="cost-box__amount">₹{wo.costComparison.reactive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.reactive.downtime}h unplanned downtime</div>
              </div>
            </div>
            <div className="savings-banner">
              <TrendingDown size={15} strokeWidth={1.75} />
              Net savings: ₹{wo.costComparison.savings.toLocaleString()} ({wo.costComparison.roi}x ROI)
            </div>
          </div>
        </div>
      ))}

      <MaintenanceCalendar workOrders={workOrders} />

      {spareParts.length > 0 && (
        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Warehouse size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>Warehouse OEM Spare Parts & Bin Inventory ({spareParts.length} SKUs)</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Live SQLite CMMS Stock Ledger</span>
          </div>
          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Bin</th>
                  <th>Part Description</th>
                  <th>Assets</th>
                  <th>Stock / Min</th>
                  <th>Unit Cost</th>
                  <th>Lead Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map(sp => (
                  <tr key={sp.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.sku || sp.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sp.bin || 'A-01'}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sp.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{(sp.machines || []).join(', ')}</td>
                    <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{sp.stock} / {sp.reorderLevel}</td>
                    <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>₹{sp.cost.toLocaleString()}</td>
                    <td>{sp.leadTime}</td>
                    <td>
                      <Badge variant={sp.stock <= sp.reorderLevel ? 'warning' : 'healthy'}>
                        {sp.stock === 0 ? 'Order Required' : sp.stock <= sp.reorderLevel ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrderForSignOff && (
        <WorkOrderSignOffModal
          workOrder={selectedOrderForSignOff}
          onClose={() => setSelectedOrderForSignOff(null)}
          onConfirmSignOff={handleConfirmSignOff}
        />
      )}

      {selectedMachineForQR && (
        <AssetQRCodeModal
          machine={selectedMachineForQR}
          onClose={() => setSelectedMachineForQR(null)}
        />
      )}

      {showAuditReport && (
        <AuditReportModal
          workOrders={workOrders}
          onClose={() => setShowAuditReport(false)}
        />
      )}
    </div>
  );
}
