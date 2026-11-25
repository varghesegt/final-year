import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot } from 'recharts';

export function HQCurve({ flowRate = 28, health = 85 }) {
  const data = [];
  const healthFactor = Math.max(0.5, health / 100);

  for (let q = 0; q <= 40; q += 2) {
    const headDesign = Math.max(0, 45 - 0.022 * Math.pow(q, 2));
    const headActual = Math.max(0, 45 * healthFactor - 0.024 * Math.pow(q, 2));
    const systemHead = 12 + 0.018 * Math.pow(q, 2);

    data.push({
      q,
      headDesign: Math.round(headDesign * 10) / 10,
      headActual: Math.round(headActual * 10) / 10,
      systemHead: Math.round(systemHead * 10) / 10,
    });
  }

  const liveHead = Math.max(0, Math.round((45 * healthFactor - 0.024 * Math.pow(flowRate, 2)) * 10) / 10);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
          Head–Flow (H–Q) Characteristic Curve
        </div>
        <div className="tabular-nums" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Q = {flowRate} L/s · H = {liveHead} m
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="q" unit=" L/s" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
          <YAxis unit=" m" domain={[0, 50]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Line type="monotone" dataKey="headDesign" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Design Curve" isAnimationActive={false} />
          <Line type="monotone" dataKey="headActual" stroke="#b45309" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Actual Curve" isAnimationActive={false} />
          <Line type="monotone" dataKey="systemHead" stroke="#047857" strokeWidth={1.75} dot={false} name="System Resistance" isAnimationActive={false} />
          <ReferenceDot x={Math.min(40, Math.max(0, Math.round(flowRate)))} y={liveHead} r={5} fill="#b91c1c" stroke="#ffffff" strokeWidth={2} isFront={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
