import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';

export function WeibullPlot({ currentHours = 4200, beta = 2.5, eta = 5000 }) {
  // Weibull CDF F(t) = 1 - exp( - (t / eta)^beta )
  const data = [];
  for (let t = 0; t <= 7000; t += 500) {
    const prob = 1 - Math.exp(-Math.pow(t / eta, beta));
    data.push({
      t,
      probPercent: Math.round(prob * 1000) / 10,
    });
  }

  const currentProb = Math.min(99.9, Math.round((1 - Math.exp(-Math.pow(currentHours / eta, beta))) * 1000) / 10);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Weibull Reliability Distribution
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Shape β = {beta} (Wear-out) | Scale η = {eta} hrs
          </div>
        </div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--status-warning)' }}>
          Runtime: {currentHours} hrs | Cumulative Fail Prob: {currentProb}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="t" unit=" hrs" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
          <Line type="monotone" dataKey="probPercent" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="Failure Probability F(t)" />
          <ReferenceLine x={currentHours} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Current Runtime', fill: '#ef4444', fontSize: 10, position: 'top' }} />
          <ReferenceDot x={currentHours} y={currentProb} r={5} fill="#ef4444" stroke="#ffffff" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
