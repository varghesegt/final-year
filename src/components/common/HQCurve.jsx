import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot } from 'recharts';

export function HQCurve({ flowRate = 28, health = 85 }) {
  // Generate curve points for Q from 0 to 45 L/s
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

  // Calculate live head at current flow rate
  const liveHead = Math.max(0, Math.round((45 * healthFactor - 0.024 * Math.pow(flowRate, 2)) * 10) / 10);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Head-Flow (H-Q) Characteristic Curve
        </div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
          Operating Point: Q = {flowRate} L/s | H = {liveHead} m
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="q" unit=" L/s" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <YAxis unit=" m" domain={[0, 50]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Line type="monotone" dataKey="headDesign" stroke="#3b82f6" strokeWidth={2} dot={false} name="Design H-Q Curve" />
          <Line type="monotone" dataKey="headActual" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Actual Degraded Curve" />
          <Line type="monotone" dataKey="systemHead" stroke="#10b981" strokeWidth={1.5} dot={false} name="System Resistance Curve" />
          <ReferenceDot x={Math.min(40, Math.max(0, Math.round(flowRate)))} y={liveHead} r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={2} isFront={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
