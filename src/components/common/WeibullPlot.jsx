import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';

export function WeibullPlot({ currentHours = 4200, beta = 2.5, eta = 5000 }) {
  const data = [];
  const maxT = Math.max(7000, Math.ceil((eta * 1.4) / 500) * 500);
  const step = Math.round(maxT / 14 / 100) * 100 || 500;

  for (let t = 0; t <= maxT; t += step) {
    const prob = 1 - Math.exp(-Math.pow(t / eta, beta));
    data.push({
      t,
      probPercent: Math.round(prob * 1000) / 10,
    });
  }

  const currentProb = Math.min(99.9, Math.round((1 - Math.exp(-Math.pow(currentHours / eta, beta))) * 1000) / 10);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
            Weibull Failure Distribution
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Shape β = {beta} · Scale η = {eta} hrs
          </div>
        </div>
        <div className="tabular-nums" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {currentHours} hrs · F(t) = {currentProb}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="t" unit="h" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#d1d5db' }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#111827' }}
            formatter={(v) => [`${v}%`, 'Failure Prob F(t)']}
          />
          <Line type="monotone" dataKey="probPercent" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Failure Probability F(t)" isAnimationActive={false} />
          <ReferenceLine x={currentHours} stroke="#b91c1c" strokeDasharray="3 3" label={{ value: 'Current', fill: '#b91c1c', fontSize: 10, position: 'top' }} />
          <ReferenceDot x={currentHours} y={currentProb} r={4} fill="#b91c1c" stroke="#ffffff" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
