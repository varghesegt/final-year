import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine
} from 'recharts';
import { Activity } from 'lucide-react';

export function VibrationFFT({
  vibration = 1.2,
  rpm = 1450,
  health = 85,
  machineId = 'P-101',
  bearingGeometry = null,
  bearingSpec = ''
}) {
  const isStaticAsset = machineId === 'XFMR-302' || rpm === 0;
  const degradation = Math.max(0, (100 - health) / 100);

  const bpfoMult = bearingGeometry?.bpfoMult || 3.06;
  const bpfiMult = bearingGeometry?.bpfiMult || 4.94;

  const f1x = isStaticAsset ? 50 : Math.round((rpm / 60) * 10) / 10;
  const f2x = isStaticAsset ? 100 : Math.round(f1x * 2 * 10) / 10;
  const fBPFO = isStaticAsset ? 150 : Math.round(f1x * bpfoMult * 10) / 10;
  const fBPFI = isStaticAsset ? 250 : Math.round(f1x * bpfiMult * 10) / 10;

  const maxFreq = isStaticAsset
    ? 300
    : Math.max(200, Math.ceil((Math.max(fBPFI, fBPFO) + 40) / 20) * 20);
  const freqStep = Math.max(2, Math.round(maxFreq / 100));

  const spectrumData = useMemo(() => {
    const data = [];
    const baseAmp = Math.max(0.2, vibration * 0.38);
    const sigma = Math.max(1.8, maxFreq * 0.012);

    for (let f = 0; f <= maxFreq; f += freqStep) {
      let amp = 0.06 + ((f * 13) % 7) * 0.005;

      const peaks = isStaticAsset
        ? [
            { center: 50, weight: 0.45 },
            { center: 100, weight: 0.75 + degradation * 1.4 }, // Magnetostriction 2f
            { center: 150, weight: 0.25 + degradation * 0.9 },
            { center: 250, weight: 0.15 + degradation * 0.5 },
          ]
        : [
            { center: f1x, weight: 0.85 },
            { center: f2x, weight: 0.30 + degradation * 0.75 },
            { center: fBPFO, weight: 0.22 + degradation * 1.85 },
            { center: fBPFI, weight: 0.12 + degradation * 0.95 },
          ];

      for (const pk of peaks) {
        const dist = Math.abs(f - pk.center);
        if (dist < sigma * 3) {
          amp += baseAmp * pk.weight * Math.exp(-Math.pow(dist / sigma, 2));
        }
      }

      data.push({
        freq: f,
        amplitude: Math.round(amp * 100) / 100,
      });
    }
    return data;
  }, [vibration, f1x, f2x, fBPFO, fBPFI, degradation, maxFreq, freqStep, isStaticAsset]);

  const peakAmplitude = Math.max(...spectrumData.map(d => d.amplitude));
  const isoSeverity = peakAmplitude > 4.5 ? 'Zone D (Unacceptable)'
    : peakAmplitude > 2.8 ? 'Zone C (Unsatisfactory)'
    : peakAmplitude > 1.4 ? 'Zone B (Satisfactory)' : 'Zone A (Good)';

  const severityBadge = peakAmplitude > 4.5 ? 'critical'
    : peakAmplitude > 2.8 ? 'warning'
    : 'healthy';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            {isStaticAsset ? 'Tank Magnetostriction & Harmonic Spectrum (50 Hz)' : 'Bearing & Shaft Vibration FFT Spectrum (ISO 10816-3)'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isStaticAsset
              ? '1f = 50 Hz · 2f Magnetostriction = 100 Hz · 3f Core = 150 Hz'
              : `1X = ${f1x} Hz · BPFO = ${fBPFO} Hz (${bpfoMult}x) · BPFI = ${fBPFI} Hz (${bpfiMult}x)${bearingSpec ? ` · ${bearingSpec}` : ''}`}
          </div>
        </div>

        <span className={`badge badge--${severityBadge}`}>
          {isoSeverity}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={spectrumData} margin={{ top: 14, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="freq"
            unit=" Hz"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={false}
          />
          <YAxis
            unit=" mm/s"
            domain={[0, Math.max(5, Math.ceil(peakAmplitude + 1))]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#111827',
              boxShadow: '0 4px 12px rgba(16,24,40,0.08)'
            }}
            formatter={(val) => [`${val} mm/s RMS`, 'Amplitude']}
            labelFormatter={(label) => `${label} Hz`}
          />

          <ReferenceLine x={f1x} stroke="#1d4ed8" strokeDasharray="3 3" label={{ value: isStaticAsset ? '50Hz' : '1X', fill: '#1d4ed8', fontSize: 10, position: 'top' }} />
          <ReferenceLine x={f2x} stroke="#b45309" strokeDasharray="3 3" label={{ value: isStaticAsset ? '100Hz' : '2X', fill: '#b45309', fontSize: 10, position: 'top' }} />
          <ReferenceLine x={fBPFO} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: isStaticAsset ? '150Hz' : 'BPFO', fill: '#b91c1c', fontSize: 10, position: 'top' }} />

          <Area
            type="monotone"
            dataKey="amplitude"
            stroke="#1d4ed8"
            strokeWidth={2}
            fill="url(#fftGrad)"
            name="Amplitude"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>{isStaticAsset ? '50Hz Fundamental' : '1X Unbalance'}: <strong className="tabular-nums">{f1x} Hz</strong></span>
        <span>{isStaticAsset ? '2f Core Striction' : '2X Misalignment'}: <strong className="tabular-nums">{f2x} Hz</strong></span>
        <span>{isStaticAsset ? '3f Zero-Seq' : 'BPFO Outer Race'}: <strong className="tabular-nums">{fBPFO} Hz</strong></span>
        <span>{isStaticAsset ? '5f Saturation' : 'BPFI Inner Race'}: <strong className="tabular-nums">{fBPFI} Hz</strong></span>
      </div>
    </div>
  );
}
