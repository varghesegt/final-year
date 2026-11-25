import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';

export function WeibullPlot({ weibull }) {
  const data = weibull?.points || [];
  const currentHours = weibull?.currentHours ?? 20000;
  const currentProb = weibull?.currentProb ?? 25;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
            Service Life Wear Curve
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Cumulative failure likelihood over total running hours
          </div>
        </div>
        <div className="tabular-nums" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {currentHours.toLocaleString()} hrs · Risk {currentProb}%
        </div>
      </div>

      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="t" unit="h" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }}
              formatter={(v) => [`${v}%`, 'Failure Likelihood']}
            />
            <Line type="monotone" dataKey="probPercent" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Failure Risk %" isAnimationActive={false} />
            <ReferenceLine x={currentHours} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: 'Now', fill: '#b91c1c', fontSize: 10, position: 'top' }} />
            <ReferenceDot x={currentHours} y={currentProb} r={4} fill="#b91c1c" stroke="#ffffff" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
