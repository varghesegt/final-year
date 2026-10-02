import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea
} from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export function VibrationFFT({ vibration = 1.2, rpm = 1450, health = 85 }) {
  // Mechanical Characteristic Harmonics
  const f1x = Math.round((rpm / 60) * 10) / 10;     // 1X unbalance (~24.2 Hz)
  const f2x = Math.round(f1x * 2 * 10) / 10;        // 2X misalignment (~48.3 Hz)
  const fBPFO = Math.round(f1x * 3.08 * 10) / 10;   // BPFO outer race defect (~74.5 Hz)
  const fBPFI = Math.round(f1x * 4.92 * 10) / 10;   // BPFI inner race defect (~119.1 Hz)

  const degradation = Math.max(0, (100 - health) / 100);

  // Generate Frequency Spectrum Points (0 Hz to 200 Hz, step 2 Hz)
  const spectrumData = useMemo(() => {
    const data = [];
    const baseAmp = Math.max(0.2, vibration * 0.35);

    for (let f = 0; f <= 180; f += 2) {
      // Noise floor
      let amp = 0.08 + Math.random() * 0.05;

      // 1X Peak (RPM Unbalance)
      const dist1x = Math.abs(f - f1x);
      if (dist1x < 4) {
        amp += (baseAmp * 0.9) * Math.exp(-Math.pow(dist1x / 1.5, 2));
      }

      // 2X Peak (Shaft Misalignment)
      const dist2x = Math.abs(f - f2x);
      if (dist2x < 4) {
        amp += (baseAmp * (0.3 + degradation * 0.7)) * Math.exp(-Math.pow(dist2x / 1.5, 2));
      }

      // BPFO Peak (Bearing Outer Race - spikes heavily upon failure)
      const distBPFO = Math.abs(f - fBPFO);
      if (distBPFO < 4) {
        amp += (baseAmp * (0.2 + degradation * 1.8)) * Math.exp(-Math.pow(distBPFO / 1.5, 2));
      }

      // BPFI Peak (Bearing Inner Race)
      const distBPFI = Math.abs(f - fBPFI);
      if (distBPFI < 4) {
        amp += (baseAmp * (0.1 + degradation * 0.9)) * Math.exp(-Math.pow(distBPFI / 1.5, 2));
      }

      data.push({
        freq: f,
        amplitude: Math.round(amp * 100) / 100,
      });
    }
    return data;
  }, [vibration, f1x, f2x, fBPFO, fBPFI, degradation]);

  const peakAmplitude = Math.max(...spectrumData.map(d => d.amplitude));
  const isoSeverity = peakAmplitude > 4.5 ? 'Unacceptable (Zone D)'
    : peakAmplitude > 2.8 ? 'Unsatisfactory (Zone C)'
    : peakAmplitude > 1.4 ? 'Satisfactory (Zone B)' : 'Good (Zone A)';

  const severityColor = peakAmplitude > 4.5 ? 'var(--status-critical)'
    : peakAmplitude > 2.8 ? 'var(--status-warning)'
    : 'var(--status-healthy)';

  return (
    <div style={{ width: '100%' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} style={{ color: 'var(--accent-blue)' }} />
            Vibration FFT Frequency Spectrum (ISO 10816)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Fundamental: 1X = {f1x} Hz • Harmonics: 2X = {f2x} Hz • Defect: BPFO = {fBPFO} Hz
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(59, 130, 246, 0.08)', border: `1px solid ${severityColor}`,
            color: severityColor, fontWeight: 700
          }}>
            ISO Class: {isoSeverity}
          </div>
        </div>
      </div>

      {/* Spectrum Chart */}
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={spectrumData} margin={{ top: 10, right: 15, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="freq"
            unit=" Hz"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            unit=" mm/s"
            domain={[0, Math.max(5, Math.ceil(peakAmplitude + 1))]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1f2e',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f1f5f9'
            }}
            formatter={(val) => [`${val} mm/s RMS`, 'Velocity Amplitude']}
            labelFormatter={(label) => `Frequency: ${label} Hz`}
          />

          {/* Fault Harmonic Reference Lines */}
          <ReferenceLine x={f1x} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '1X (Unbalance)', fill: '#3b82f6', fontSize: 9, position: 'top' }} />
          <ReferenceLine x={f2x} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '2X (Misalign)', fill: '#f59e0b', fontSize: 9, position: 'top' }} />
          <ReferenceLine x={fBPFO} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'BPFO (Bearing Defect)', fill: '#ef4444', fontSize: 9, position: 'top' }} />

          <Area
            type="monotone"
            dataKey="amplitude"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#fftGrad)"
            name="Amplitude"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend & Harmonic Breakdown Tags */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px' }}>
        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', fontWeight: 600 }}>
          1X Unbalance: {f1x} Hz
        </span>
        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', fontWeight: 600 }}>
          2X Misalignment: {f2x} Hz
        </span>
        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-critical)', fontWeight: 600 }}>
          BPFO Outer Race: {fBPFO} Hz (Primary Spall Indicator)
        </span>
      </div>
    </div>
  );
}
