import { useState } from 'react';
import { X, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { SignaturePad } from './SignaturePad';

export function WorkOrderSignOffModal({ workOrder, onClose, onConfirmSignOff }) {
  const [signatureData, setSignatureData] = useState(null);
  const [notes, setNotes] = useState('Replacement completed to OEM torque specification; post-overhaul vibration verified within Zone A.');
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
    if (!signatureData) return;
    onConfirmSignOff(workOrder.id, {
      signature: signatureData,
      notes,
      technician: workOrder.assignedTo?.name || 'Lead Technician',
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(17, 24, 39, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '520px', width: '100%', maxHeight: '90vh',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={16} strokeWidth={1.75} style={{ color: 'var(--status-healthy)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                Work Order Sign-Off
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {workOrder.id} · {workOrder.machineName} ({workOrder.machineId})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '12px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
            fontSize: '12px', color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Scope:</strong> {workOrder.action}
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Commissioning Checklist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                { key: 'partsFitted', label: 'OEM spare parts fitted and torqued to specification' },
                { key: 'laserAligned', label: 'Laser shaft alignment verified (< 0.05 mm offset)' },
                { key: 'lubricationDone', label: 'Bearing housing flushed and replenished' },
                { key: 'vibrationRetested', label: 'Post-maintenance test run within baseline limits' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => handleToggleCheck(item.key)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--accent-blue)' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Technician Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)', fontSize: '12px',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Signature ({workOrder.assignedTo?.name || 'Rajesh Kumar'})
            </label>
            <SignaturePad onSign={setSignatureData} width={480} height={120} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={!allChecked || !signatureData}
              className="btn btn--success"
              style={{
                flex: '2 1 220px',
                padding: '9px 16px',
                opacity: (!allChecked || !signatureData) ? 0.5 : 1,
                cursor: (!allChecked || !signatureData) ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCircle2 size={15} strokeWidth={1.75} />
              <span>Complete & Restore Health (95%)</span>
            </button>
            <button type="button" onClick={onClose} className="btn btn--secondary" style={{ flex: '1 1 90px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
