import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine
} from 'recharts';
import { Activity } from 'lucide-react';
import { fetchFftSpectrum } from '../../services/api';

export function VibrationFFT({ machineId = 'P-101' }) {
  const [fftData, setFftData] = useState(null);

  useEffect(() => {
    let active = true;
    fetchFftSpectrum(machineId)
      .then((res) => { if (active && res) setFftData(res); })
      .catch(() => {});

    const interval = setInterval(() => {
      fetchFftSpectrum(machineId)
        .then((res) => { if (active && res) setFftData(res); })
        .catch(() => {});
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [machineId]);

  const spectrum = fftData?.spectrum || [];
  const peakAmplitude = fftData?.peakAmplitude ?? 2.5;
  const markers = fftData?.markers || [];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            {fftData?.title || 'Vibration Frequency Spectrum'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {fftData?.subtitle || 'Real-time frequency peak monitoring from asset sensors'}
          </div>
        </div>

        <span className={`badge badge--${fftData?.severityVariant || 'healthy'}`}>
          {fftData?.isoSeverity || 'Healthy'}
        </span>
      </div>

      {spectrum.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={spectrum} margin={{ top: 14, right: 16, bottom: 8, left: 0 }}>
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
              }}
              formatter={(val) => [`${val} mm/s`, 'Amplitude']}
              labelFormatter={(label) => `${label} Hz`}
            />

            {markers.map((m) => (
              <ReferenceLine
                key={m.label}
                x={m.freq}
                stroke={m.color}
                strokeDasharray="3 3"
                label={{ value: m.label, fill: m.color, fontSize: 10, position: 'top' }}
              />
            ))}

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
      )}

      {markers.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {markers.map((m) => (
            <span key={m.label}>
              {m.fullLabel}: <strong className="tabular-nums">{m.freq} Hz</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
