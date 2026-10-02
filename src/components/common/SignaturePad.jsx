import { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, Eraser } from 'lucide-react';

export function SignaturePad({ onSign, width = 420, height = 140 }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (onSign && canvasRef.current) {
      onSign(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onSign) onSign(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: `${width}px` }}>
      <div style={{
        position: 'relative',
        background: '#ffffff',
        border: '1.5px dashed var(--border-default)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: `${height}px`, cursor: 'crosshair', display: 'block' }}
        />

        {/* Signature Guideline */}
        <div style={{
          position: 'absolute', bottom: '26px', left: '20px', right: '20px',
          borderBottom: '1px solid #e2e8f0', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '8px', left: '20px',
          fontSize: '10px', color: '#94a3b8', pointerEvents: 'none'
        }}>
          ✕ Sign above the line (Draw with mouse or touchscreen)
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: '#f1f5f9', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Eraser size={12} />
          Clear Signature
        </button>

        <span style={{ fontSize: '11px', color: hasDrawn ? 'var(--status-healthy)' : 'var(--text-muted)', fontWeight: 600 }}>
          {hasDrawn ? '✓ Signature Recorded' : 'Signature Required'}
        </span>
      </div>
    </div>
  );
}
