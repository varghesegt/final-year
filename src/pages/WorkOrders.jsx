/* ===================================================================
   Module 4 — Maintenance Decision Engine (Work Orders)
   =================================================================== */

import { useState, useEffect } from 'react';
import {
  ClipboardList, User, Package, DollarSign, Clock,
  AlertTriangle, CheckCircle, Wrench, Calendar, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MACHINES, generateWorkOrder } from '../data/factoryData';
import { Badge, MaintenanceCalendar, ExportPdfButton } from '../components/common';

export default function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);

  useEffect(() => {
    const orders = Object.values(MACHINES)
      .filter(m => m.health < 92)
      .map(m => generateWorkOrder(m.id))
      .filter(Boolean)
      .sort((a, b) => {
        const priority = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        return (priority[b.priority] || 0) - (priority[a.priority] || 0);
      });
    setWorkOrders(orders);
  }, []);

  return (
    <div className="workorders-page">
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <ClipboardList size={24} style={{ color: 'var(--accent-amber)' }} />
            Maintenance Decision Engine
          </h1>
          <p className="section-header__subtitle">
            AI-generated work orders with technician assignment, spare parts, and cost analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <ExportPdfButton label="Export Work Orders PDF" />
          <Badge variant="info">{workOrders.length} Active Orders</Badge>
        </div>
      </div>

      {workOrders.map(wo => (
        <div key={wo.id} className="workorder-card">
          {/* Header */}
          <div className="workorder-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
              <span className="workorder-card__id">{wo.id}</span>
              <Badge variant={wo.priority === 'CRITICAL' ? 'critical' : wo.priority === 'HIGH' ? 'warning' : 'info'}>
                {wo.priority}
              </Badge>
            </div>
            <Badge variant="info">{wo.status}</Badge>
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
                <span className="workorder-card__row-label">Available</span>
                <span className="workorder-card__row-value">
                  {wo.assignedTo.available
                    ? <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>Available</span>
                    : <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>On Call</span>}
                </span>
              </div>
            </div>

            {/* Spare Parts */}
            <div className="workorder-card__section">
              <div className="workorder-card__section-title">
                <Package size={14} /> Spare Parts
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

          {/* Cost Comparison */}
          <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="workorder-card__section-title" style={{ marginBottom: 'var(--sp-3)' }}>
              <DollarSign size={14} /> Cost Analysis
            </div>
            <div className="workorder-card__cost-comparison">
              <div className="cost-box cost-box--preventive">
                <div className="cost-box__label">Preventive Cost</div>
                <div className="cost-box__amount">₹{wo.costComparison.preventive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.preventive.downtime}h downtime</div>
              </div>
              <div className="cost-box cost-box--reactive">
                <div className="cost-box__label">Reactive Cost</div>
                <div className="cost-box__amount">₹{wo.costComparison.reactive.cost.toLocaleString()}</div>
                <div className="cost-box__downtime">{wo.costComparison.reactive.downtime}h downtime</div>
              </div>
            </div>
            <div className="savings-banner">
              <TrendingDown size={16} />
              Predictive maintenance saves ₹{wo.costComparison.savings.toLocaleString()} — ROI: {wo.costComparison.roi}x
            </div>
          </div>
        </div>
      ))}

      {/* Interactive Maintenance Calendar View (#19) */}
      <MaintenanceCalendar />
    </div>
  );
}
