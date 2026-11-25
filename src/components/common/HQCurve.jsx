import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot } from 'recharts';

export function HQCurve({ hqCurve }) {
  const data = hqCurve?.points || [];
  const flowRate = hqCurve?.flowRate ?? 28;
  const liveHead = hqCurve?.liveHead ?? 32;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
            Operating Efficiency Curve (Head vs Flow)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Rated design output vs current operating performance
          </div>
        </div>
        <div className="tabular-nums" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {flowRate} L/s · {liveHead} m head
        </div>
      </div>

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="q" unit=" L/s" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
            <YAxis unit=" m" domain={[0, 50]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line type="monotone" dataKey="headDesign" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Design Curve" isAnimationActive={false} />
            <Line type="monotone" dataKey="headActual" stroke="#b45309" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Current Output" isAnimationActive={false} />
            <Line type="monotone" dataKey="systemHead" stroke="#047857" strokeWidth={1.75} dot={false} name="System Resistance" isAnimationActive={false} />
            <ReferenceDot x={Math.min(40, Math.max(0, Math.round(flowRate)))} y={liveHead} r={5} fill="#b91c1c" stroke="#ffffff" strokeWidth={2} isFront={true} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
