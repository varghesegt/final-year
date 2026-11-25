import { useState, useEffect } from 'react';
import { Server, Radio, Terminal, Cpu, Database, Download } from 'lucide-react';
import { fetchGatewaySnapshot, subscribeToLiveStream, fetchDatasetCatalog, getDatasetExportUrl } from '../services/api';
import { MetricCard, Badge } from '../components/common';

export function IndustrialGateway() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'exports'
  const [activeTopicFilter, setActiveTopicFilter] = useState('all');
  const [packets, setPackets] = useState([]);
  const [packetCount, setPacketCount] = useState(1284);
  const [opcuaTags, setOpcuaTags] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    let active = true;
    fetchGatewaySnapshot().then((snap) => {
      if (!active) return;
      if (snap?.packets) setPackets(snap.packets);
      if (snap?.packetCount) setPacketCount(snap.packetCount);
      if (snap?.opcuaTags) setOpcuaTags(snap.opcuaTags);
    });

    fetchDatasetCatalog().then((cat) => {
      if (active && cat) setCatalog(cat);
    });

    const unsub = subscribeToLiveStream((snap) => {
      if (!active || !isStreaming) return;
      if (snap?.latestPacket) {
        setPackets(prev => {
          if (prev[0]?.id === snap.latestPacket.id) return prev;
          return [snap.latestPacket, ...prev.slice(0, 14)];
        });
      }
      if (snap?.packetCount) setPacketCount(snap.packetCount);
      if (snap?.opcuaTags?.length) setOpcuaTags(snap.opcuaTags);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [isStreaming]);

  const filteredPackets = activeTopicFilter === 'all'
    ? packets
    : packets.filter(p => p.machineId === activeTopicFilter);

  const visibleTags = activeTopicFilter === 'all'
    ? opcuaTags
    : opcuaTags.filter(t => t.machineId === activeTopicFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Radio size={20} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            Telemetry Gateway
          </h1>
          <p className="section-header__subtitle">
            Live equipment sensor feeds and downloadable plant history datasets
          </p>
        </div>

        <div className="segmented-control" role="tablist">
          <button
            onClick={() => setActiveTab('live')}
            className={`segmented-control__btn ${activeTab === 'live' ? 'segmented-control__btn--active' : ''}`}
          >
            <Terminal size={13} strokeWidth={1.75} />
            <span>Live Feeds & Tags</span>
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`segmented-control__btn ${activeTab === 'exports' ? 'segmented-control__btn--active' : ''}`}
          >
            <Database size={13} strokeWidth={1.75} />
            <span>Export Datasets</span>
          </button>
        </div>
      </div>

      <div className="factory-stats">
        <MetricCard label="Connection" value="Online" icon={Server} trend="stable" trendValue="MQTT + OPC-UA active" />
        <MetricCard label="Messages Received" value={packetCount.toLocaleString()} icon={Radio} trend="up" trendValue="Live stream" />
        <MetricCard label="Monitored Tags" value={opcuaTags.length || 17} unit="Channels" icon={Cpu} trend="stable" trendValue="6 assets connected" />
      </div>

      {activeTab === 'live' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'P-101', 'CNC-001', 'COMP-201', 'CONV-401', 'XFMR-302', 'ROB-001'].map(f => (
              <button
                key={f}
                onClick={() => setActiveTopicFilter(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: activeTopicFilter === f ? 600 : 500,
                  background: activeTopicFilter === f ? 'var(--accent-blue-soft)' : 'var(--bg-primary)',
                  color: activeTopicFilter === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: `1px solid ${activeTopicFilter === f ? '#bfdbfe' : 'var(--border-subtle)'}`,
                  cursor: 'pointer'
                }}
              >
                {f === 'all' ? 'All Assets' : f}
              </button>
            ))}
          </div>

          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <Cpu size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>Live Sensor Registers</span>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Register</th>
                    <th>Channel Tag</th>
                    <th>Live Reading</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTags.map((row, i) => {
                    const alarmState = row.alarmState || 'NORMAL';
                    const isCrit = alarmState.includes('CRIT');
                    const isWarn = alarmState.includes('WARN') || alarmState === 'WARNING';
                    return (
                      <tr key={i}>
                        <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {row.modbus || '40001'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {row.node}
                        </td>
                        <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {row.val}
                        </td>
                        <td>
                          <Badge variant={isCrit ? 'critical' : isWarn ? 'warning' : 'healthy'}>
                            {alarmState}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="twin-panel">
            <div className="twin-panel__title">
              <div className="twin-panel__title-left">
                <Terminal size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
                <span>MQTT Telemetry Feed</span>
              </div>
              <button onClick={() => setIsStreaming(!isStreaming)} className="btn btn--secondary" style={{ padding: '4px 10px' }}>
                {isStreaming ? 'Pause' : 'Resume'}
              </button>
            </div>

            <div style={{
              background: '#0f172a', borderRadius: 'var(--radius-md)', padding: '12px 14px',
              fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e2e8f0',
              height: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #1e293b'
            }}>
              {filteredPackets.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>Waiting for incoming telemetry...</div>
              ) : (
                filteredPackets.map(p => (
                  <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                      <span style={{ color: '#34d399' }}>{p.topic}</span>
                      <span>{p.timestamp.split('T')[1].replace('Z', '')}</span>
                    </div>
                    <div style={{ color: '#f8fafc', lineHeight: 1.4 }}>
                      {`temp: ${p.payload.temp_c}°C · vib: ${p.payload.vib_mms} mm/s · power: ${p.payload.power_kw ?? 14} kW · health: ${p.payload.health_index}%`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Database size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>90-Day Asset History Datasets</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {catalog?.stats?.totalHistoryRows || 546} verified telemetry rows stored in backend
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Equipment Model</th>
                  <th>Rating</th>
                  <th>Download Dataset</th>
                </tr>
              </thead>
              <tbody>
                {(catalog?.machines || []).map(m => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{m.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.manufacturer} {m.model}</div>
                    </td>
                    <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {m.ratedPowerKw} kW · {m.ratedRpm > 0 ? `${m.ratedRpm} RPM` : '50 Hz'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={getDatasetExportUrl(m.id, 'csv')}
                          download={`${m.id}-telemetry-90d.csv`}
                          className="btn btn--secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}
                        >
                          <Download size={12} strokeWidth={1.75} />
                          CSV
                        </a>
                        <a
                          href={getDatasetExportUrl(m.id, 'json')}
                          download={`${m.id}-telemetry-90d.json`}
                          className="btn btn--secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}
                        >
                          JSON
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
