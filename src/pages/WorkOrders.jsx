/* ===================================================================
   Work Orders — Dispatch Queue, Schedule & Spare Inventory
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  ClipboardList, User, Package, Wrench, Calendar, TrendingDown,
  Plus, QrCode, FileText, CheckCircle2, Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES } from '../data/factoryData';
import { fetchWorkOrdersBundle, signOffWorkOrder, createWorkOrder, fetchSpareParts } from '../services/api';
import { Badge, MetricCard, MaintenanceCalendar, ExportPdfButton } from '../components/common';
import { WorkOrderSignOffModal } from '../components/common/WorkOrderSignOffModal';
import { AssetQRCodeModal } from '../components/common/AssetQRCodeModal';
import { AuditReportModal } from '../components/common/AuditReportModal';

export default function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [summary, setSummary] = useState({ openCount: 0, completedCount: 0, totalPmCost: 0, totalSavings: 0 });
  const [spareParts, setSpareParts] = useState([]);
  const [activeView, setActiveView] = useState('orders'); // 'orders' | 'calendar' | 'parts'
  const [dispatchMachineId, setDispatchMachineId] = useState('P-101');
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedOrderForSignOff, setSelectedOrderForSignOff] = useState(null);
  const [selectedMachineForQR, setSelectedMachineForQR] = useState(null);
  const [showAuditReport, setShowAuditReport] = useState(false);

  useEffect(() => {
    let active = true;
    fetchWorkOrdersBundle().then((res) => {
      if (!active) return;
      setWorkOrders(res.workOrders || []);
      if (res.summary) setSummary(res.summary);
    });
    fetchSpareParts().then((parts) => {
      if (active) setSpareParts(parts);
    });
    return () => { active = false; };
  }, []);

  const handleConfirmSignOff = async (orderId, signOffData) => {
    const updated = await signOffWorkOrder(orderId, signOffData);
    setWorkOrders(updated);
    const refreshed = await fetchWorkOrdersBundle();
    if (refreshed.summary) setSummary(refreshed.summary);
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
      if (res?.summary) setSummary(res.summary);
      setActiveView('orders');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="workorders-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <ClipboardList size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Work Orders
          </h1>
          <p className="section-header__subtitle">
            Maintenance dispatch queue, schedule calendar, and spare parts stock
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
              <span>{isDispatching ? 'Creating...' : 'Create Order'}</span>
            </button>
          </div>

          <button onClick={() => setShowAuditReport(true)} className="btn btn--secondary">
            <FileText size={14} strokeWidth={1.75} />
            <span>Audit Report</span>
          </button>

          <ExportPdfButton label="Print" />
        </div>
      </div>

      <div className="factory-stats">
        <MetricCard label="Open Orders" value={summary.openCount} icon={ClipboardList} trend={summary.openCount > 0 ? 'down' : 'stable'} trendValue="Pending action" />
        <MetricCard label="Completed" value={summary.completedCount} icon={CheckCircle2} trend="up" trendValue="Signed off" />
        <MetricCard label="Net Savings" value={`₹${(summary.totalSavings / 1000).toFixed(0)}K`} icon={TrendingDown} trend="up" trendValue="Avoided breakdown loss" />
      </div>

      <div className="segmented-control" role="tablist" style={{ alignSelf: 'flex-start' }}>
        <button onClick={() => setActiveView('orders')} className={`segmented-control__btn ${activeView === 'orders' ? 'segmented-control__btn--active' : ''}`}>
          <Wrench size={13} strokeWidth={1.75} />
          <span>Active Queue ({workOrders.length})</span>
        </button>
        <button onClick={() => setActiveView('calendar')} className={`segmented-control__btn ${activeView === 'calendar' ? 'segmented-control__btn--active' : ''}`}>
          <Calendar size={13} strokeWidth={1.75} />
          <span>Schedule Calendar</span>
        </button>
        <button onClick={() => setActiveView('parts')} className={`segmented-control__btn ${activeView === 'parts' ? 'segmented-control__btn--active' : ''}`}>
          <Warehouse size={13} strokeWidth={1.75} />
          <span>Spare Parts ({spareParts.length})</span>
        </button>
      </div>

      {activeView === 'orders' && workOrders.map(wo => (
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
              <button onClick={() => setSelectedMachineForQR(MACHINES[wo.machineId])} className="btn btn--secondary">
                <QrCode size={13} strokeWidth={1.75} />
                <span>Asset Tag</span>
              </button>

              {wo.status !== 'Completed' && (
                <button onClick={() => setSelectedOrderForSignOff(wo)} className="btn btn--success">
                  <Wrench size={13} strokeWidth={1.75} />
                  <span>Sign Off</span>
                </button>
              )}
            </div>
          </div>

          <div className="workorder-card__grid">
            <div className="workorder-card__section">
              <div className="workorder-card__section-title"><Wrench size={13} /> Scope</div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Asset</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => navigate(`/digital-twin/${wo.machineId}`)}>
                  {wo.machineName}
                </span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Issue</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-warning)' }}>{wo.failureMode}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Task</span>
                <span className="workorder-card__row-value">{wo.action}</span>
              </div>
            </div>

            <div className="workorder-card__section">
              <div className="workorder-card__section-title"><Calendar size={13} /> Timing & Crew</div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Target Date</span>
                <span className="workorder-card__row-value">{wo.scheduledDate}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Est. Duration</span>
                <span className="workorder-card__row-value">{wo.estimatedDowntime}</span>
              </div>
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Technician</span>
                <span className="workorder-card__row-value"><User size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{wo.assignedTo.name}</span>
              </div>
            </div>

            <div className="workorder-card__section">
              <div className="workorder-card__section-title"><Package size={13} /> Parts & Cost Savings</div>
              {wo.spareParts.slice(0, 2).map((part, i) => (
                <div key={i} className="workorder-card__row">
                  <span className="workorder-card__row-label">{part.name}</span>
                  <span className="workorder-card__row-value">
                    <Badge variant={part.stock > 0 ? 'healthy' : 'critical'}>{part.status}</Badge>
                  </span>
                </div>
              ))}
              <div className="workorder-card__row">
                <span className="workorder-card__row-label">Planned vs Breakdown</span>
                <span className="workorder-card__row-value" style={{ color: 'var(--status-healthy)' }}>
                  ₹{wo.costComparison.preventive.cost.toLocaleString()} vs ₹{wo.costComparison.reactive.cost.toLocaleString()} (Save ₹{wo.costComparison.savings.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {wo.status === 'Completed' && wo.signOff && (
            <div style={{
              padding: '10px 14px', background: '#ecfdf5', borderRadius: 'var(--radius-md)',
              border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-healthy)', textTransform: 'uppercase' }}>Signed Off</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{wo.signOff.notes} · {wo.signOff.technician}</div>
              </div>
              {wo.signOff.signature && <img src={wo.signOff.signature} alt="Signature" style={{ height: '32px' }} />}
            </div>
          )}
        </div>
      ))}

      {activeView === 'calendar' && <MaintenanceCalendar workOrders={workOrders} />}

      {activeView === 'parts' && (
        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Warehouse size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>Warehouse Spare Parts Inventory</span>
            </div>
          </div>
          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Bin</th>
                  <th>Stock / Min</th>
                  <th>Cost</th>
                  <th>Lead Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map(sp => (
                  <tr key={sp.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{sp.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sp.bin || 'A-01'}</td>
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
        <AssetQRCodeModal machine={selectedMachineForQR} onClose={() => setSelectedMachineForQR(null)} />
      )}

      {showAuditReport && (
        <AuditReportModal workOrders={workOrders} onClose={() => setShowAuditReport(false)} />
      )}
    </div>
  );
}
