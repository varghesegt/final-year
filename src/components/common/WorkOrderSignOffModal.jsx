import { useState } from 'react';
import { X, CheckCircle2, Wrench, Shield, ClipboardCheck, AlertCircle } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

export function WorkOrderSignOffModal({ workOrder, onClose, onConfirmSignOff }) {
  const [signatureData, setSignatureData] = useState(null);
  const [notes, setNotes] = useState('Replacement completed according to manufacturer OEM specifications. Post-maintenance vibration test verified normal.');
  const [checklist, setChecklist] = useState({
    partsFitted: true,
    laserAligned: true,
    lubricationDone: true,
    vibrationRetested: true,
  });

  if (!workOrder) return null;

  const handleToggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!signatureData) {
      alert('Please provide a technician signature before submitting.');
      return;
    }
    onConfirmSignOff(workOrder.id, {
      signature: signatureData,
      notes,
      technician: workOrder.assignedTo?.name || 'Chief Technician',
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '520px', width: '100%', maxHeight: '90vh',
        boxShadow: 'var(--shadow-2xl)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={20} style={{ color: 'var(--status-healthy)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                Field Sign-Off & Maintenance Completion
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Order #{workOrder.id} • {workOrder.machineName} ({workOrder.machineId})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Reminder Banner */}
          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '12px', color: 'var(--text-primary)'
          }}>
            <strong>Prescribed Action:</strong> {workOrder.action}
          </div>

          {/* Quality Assurance Checklist */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Field Quality & Commissioning Checklist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                { key: 'partsFitted', label: 'OEM replacement spare parts fitted and torqued to specification' },
                { key: 'laserAligned', label: 'Laser shaft alignment checked (< 0.05 mm angular/radial offset)' },
                { key: 'lubricationDone', label: 'Bearings flushed and replenished with certified lubricant' },
                { key: 'vibrationRetested', label: 'Post-overhaul test run performed; baseline vibration normal' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => handleToggleCheck(item.key)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--status-healthy)' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Technician Maintenance Log Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)', fontSize: '12px',
                fontFamily: 'var(--font-sans)', outline: 'none'
              }}
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Technician Digital Signature Sign-Off: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{workOrder.assignedTo?.name || 'Rajesh Kumar'}</span>
            </label>
            <SignaturePad onSign={setSignatureData} width={480} height={120} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={!allChecked || !signatureData}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: (!allChecked || !signatureData) ? 'var(--border-default)' : 'var(--status-healthy)',
                color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: 700,
                cursor: (!allChecked || !signatureData) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: (allChecked && signatureData) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <CheckCircle2 size={16} />
              Submit Sign-Off & Restore Asset Health (95%)
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: '#f1f5f9', color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
