import { QrCode, Printer, X, Factory } from 'lucide-react';

function buildMatrix(seedStr) {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 17;
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 5 && c < 5;
      const inTopRight = r < 5 && c >= size - 5;
      const inBottomLeft = r >= size - 5 && c < 5;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      hash = (Math.imul(hash ^ (r * 31 + c), 1664525) + 1013904223) >>> 0;
      if ((hash & 1) === 1) cells.push({ r, c });
    }
  }
  return cells;
}

export function AssetQRCodeModal({ machine, onClose }) {
  if (!machine) return null;

  const qrUrl = `${window.location.origin}${window.location.pathname}#/digital-twin/${machine.id}`;
  const dataCells = buildMatrix(qrUrl);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(17, 24, 39, 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '420px', width: '100%',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              Asset Identification Tag
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{
            border: '1.5px solid #111827',
            borderRadius: '10px',
            padding: '16px',
            background: '#ffffff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #111827', paddingBottom: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Factory size={15} strokeWidth={1.75} />
                <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.04em', color: '#111827' }}>SMARTFACTORY</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#111827', color: '#ffffff' }}>
                ISO 55001
              </span>
            </div>

            <div style={{
              display: 'inline-flex', padding: '10px',
              background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <svg width="144" height="144" viewBox="0 0 17 17" shapeRendering="crispEdges">
                <rect x="0" y="0" width="5" height="5" fill="#111827" />
                <rect x="1" y="1" width="3" height="3" fill="#ffffff" />
                <rect x="2" y="2" width="1" height="1" fill="#111827" />

                <rect x="12" y="0" width="5" height="5" fill="#111827" />
                <rect x="13" y="1" width="3" height="3" fill="#ffffff" />
                <rect x="14" y="2" width="1" height="1" fill="#111827" />

                <rect x="0" y="12" width="5" height="5" fill="#111827" />
                <rect x="1" y="13" width="3" height="3" fill="#ffffff" />
                <rect x="2" y="14" width="1" height="1" fill="#111827" />

                {dataCells.map((cell, idx) => (
                  <rect key={idx} x={cell.c} y={cell.r} width="1" height="1" fill="#111827" />
                ))}
              </svg>
            </div>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Asset ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{machine.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Equipment</span>
                <span style={{ fontWeight: 600 }}>{machine.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Model</span>
                <span>{machine.manufacturer} {machine.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Health Index</span>
                <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {machine.health}% ({machine.status.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.4 }}>
            Route: <span style={{ fontFamily: 'var(--font-mono)' }}>#/digital-twin/{machine.id}</span>
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => window.print()} className="btn btn--primary" style={{ flex: 1 }}>
              <Printer size={14} strokeWidth={1.75} />
              <span>Print Asset Tag</span>
            </button>
            <button onClick={onClose} className="btn btn--secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
