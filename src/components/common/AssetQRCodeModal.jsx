import { QrCode, Printer, X, ShieldCheck, Factory, Cpu } from 'lucide-react';

export function AssetQRCodeModal({ machine, onClose }) {
  if (!machine) return null;

  const qrUrl = `${window.location.origin}${window.location.pathname}#/digital-twin/${machine.id}`;

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '460px', width: '100%',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              Industrial Asset Identification Tag
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Physical Asset Tag Badge View */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            border: '2px solid #0f172a',
            borderRadius: '12px',
            padding: '20px',
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            {/* Tag Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Factory size={18} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '0.05em', color: '#0f172a' }}>SMARTFACTORY AI</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#0f172a', color: '#ffffff' }}>
                ISO 55001 COMPLIANT
              </span>
            </div>

            {/* Rendered SVG Industrial QR Code */}
            <div style={{
              display: 'inline-flex', padding: '12px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.04)', marginBottom: '16px'
            }}>
              <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                {/* 4 Corner Position Markers */}
                <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="13" y="13" width="10" height="10" rx="1" fill="#0f172a" />

                <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="77" y="13" width="10" height="10" rx="1" fill="#0f172a" />

                <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="13" y="77" width="10" height="10" rx="1" fill="#0f172a" />

                {/* Scannable Grid Matrix Dots */}
                <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="46" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="56" y="8" width="6" height="6" fill="#0f172a" />

                <rect x="36" y="18" width="6" height="6" fill="#0f172a" />
                <rect x="46" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="56" y="18" width="6" height="6" fill="#0f172a" />

                <rect x="8" y="36" width="6" height="6" fill="#0f172a" />
                <rect x="18" y="46" width="6" height="6" fill="#0f172a" />
                <rect x="28" y="36" width="6" height="6" fill="#0f172a" />

                <rect x="38" y="38" width="24" height="24" rx="4" fill="var(--accent-blue)" />
                <circle cx="50" cy="50" r="6" fill="#ffffff" />

                <rect x="66" y="36" width="6" height="6" fill="#0f172a" />
                <rect x="76" y="46" width="6" height="6" fill="#0f172a" />
                <rect x="86" y="36" width="6" height="6" fill="#0f172a" />

                <rect x="36" y="68" width="6" height="6" fill="#0f172a" />
                <rect x="46" y="74" width="6" height="6" fill="#0f172a" />
                <rect x="56" y="68" width="6" height="6" fill="#0f172a" />

                <rect x="68" y="68" width="6" height="6" fill="#0f172a" />
                <rect x="78" y="78" width="6" height="6" fill="#0f172a" />
                <rect x="88" y="88" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>

            {/* Asset Details */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>ASSET TAG:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0f172a' }}>{machine.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>EQUIPMENT:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{machine.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>MANUFACTURER:</span>
                <span style={{ color: '#0f172a' }}>{machine.manufacturer} {machine.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>INSTALLED:</span>
                <span style={{ color: '#0f172a' }}>{machine.installDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ color: '#64748b' }}>HEALTH INDEX:</span>
                <span style={{
                  fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: machine.health >= 80 ? 'var(--status-healthy)' : 'var(--status-critical)'
                }}>
                  {machine.health}% ({machine.status.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.4 }}>
            Scan using any standard smartphone camera or industrial Barcode/QR reader to directly launch the live Digital Twin Telemetry & Maintenance interface.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={handlePrintBadge}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-blue)', color: '#ffffff',
                border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              Print Asset Tag Badge
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: '#f1f5f9', color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
