import { useState, useEffect } from 'react';
import { Activity, Server, Radio, Terminal, Cpu, Database, Download } from 'lucide-react';
import { fetchGatewaySnapshot, subscribeToLiveStream, fetchDatasetCatalog, getDatasetExportUrl } from '../services/api';
import { MetricCard, Badge } from '../components/common';

export function IndustrialGateway() {
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
          return [snap.latestPacket, ...prev.slice(0, 19)];
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
            Telemetry Gateway & Datasets
          </h1>
          <p className="section-header__subtitle">
            MQTT broker packet stream, IEC 62541 OPC-UA & Modbus TCP register map, and v{catalog?.datasetVersion || '2.0.0'} historical datasets
          </p>
        </div>
        <Badge variant="healthy">MQTT QoS 1 Connected</Badge>
      </div>

      <div className="factory-stats">
        <MetricCard
          label="Active Broker"
          value="Mosquitto"
          icon={Server}
          trend="stable"
          trendValue="Edge QoS 1"
        />
        <MetricCard
          label="Packets Emitted"
          value={packetCount.toLocaleString()}
          icon={Radio}
          trend="up"
          trendValue="0.83 pkt/sec"
        />
        <MetricCard
          label="OPC-UA / Modbus Tags"
          value={opcuaTags.length || 17}
          unit="Nodes"
          icon={Cpu}
          trend="stable"
          trendValue="ISA-18.2 Checked"
        />
        <MetricCard
          label="SQLite Dataset"
          value={(catalog?.stats?.totalHistoryRows || 546).toLocaleString()}
          unit="Rows"
          icon={Database}
          trend="up"
          trendValue={`${catalog?.stats?.historyDaysPerMachine || 91}d × ${catalog?.stats?.totalMachines || 6} assets`}
        />
        <MetricCard
          label="Edge Latency"
          value="8.4"
          unit="ms"
          icon={Activity}
          trend="stable"
          trendValue="0% packet loss"
        />
      </div>

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

      <div className="gateway-grid">
        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Terminal size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>MQTT Stream (127.0.0.1:1883)</span>
            </div>
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className="btn btn--secondary"
              style={{ padding: '4px 10px' }}
            >
              {isStreaming ? 'Pause' : 'Resume'}
            </button>
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#e2e8f0',
            height: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '1px solid #1e293b'
          }}>
            {filteredPackets.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
                Waiting for telemetry packets...
              </div>
            ) : (
              filteredPackets.map(p => (
                <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '2px', gap: '8px' }}>
                    <span style={{ color: '#34d399' }}>PUB [QoS 1] {p.topic}</span>
                    <span>{p.timestamp.split('T')[1].replace('Z', '')}</span>
                  </div>
                  <div style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {`{ "temp": ${p.payload.temp_c}°C, "vib": ${p.payload.vib_mms}mm/s, "peakvue": ${p.payload.peakvue_ge ?? 0.5}gE, "power": ${p.payload.power_kw ?? 14}kW, "rpm": ${p.payload.rpm}, "health": ${p.payload.health_index}% }`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="twin-panel">
          <div className="twin-panel__title">
            <div className="twin-panel__title-left">
              <Cpu size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
              <span>OPC-UA NodeID & Modbus Holding Registers</span>
            </div>
          </div>

          <div className="data-table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Reg</th>
                  <th>NodeID</th>
                  <th>Value</th>
                  <th>Alarm</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {(visibleTags.length > 0 ? visibleTags : opcuaTags).map((row, i) => {
                  const alarmState = row.alarmState || 'NORMAL';
                  const isCrit = alarmState.includes('CRIT');
                  const isWarn = alarmState.includes('WARN') || alarmState === 'WARNING';
                  return (
                    <tr key={i}>
                      <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {row.modbus || '40001'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500, fontSize: '11px' }}>
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {row.quality}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Industrial Dataset Catalog & Export Panel */}
      <div className="twin-panel">
        <div className="twin-panel__title">
          <div className="twin-panel__title-left">
            <Database size={16} strokeWidth={1.75} className="twin-panel__title-icon" />
            <span>Industrial Telemetry & Engineering Datasets (v{catalog?.datasetVersion || '2.0.0'})</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            91-Day Multi-Channel Time Series + OEM Specs (ISO 10816-3 / IEEE C57.104 / ISA-18.2)
          </span>
        </div>

        {catalog?.standards?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {catalog.standards.map((st, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{st.code}</strong>: {st.scope}
              </div>
            ))}
          </div>
        )}

        <div className="data-table-container">
          <table className="data-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>OEM & Model</th>
                <th>Serial No.</th>
                <th>Rating</th>
                <th>Bearing / Core Spec</th>
                <th>Downtime / hr</th>
                <th>90-Day Export</th>
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{m.serialNumber}</td>
                  <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {m.ratedPowerKw} kW · {m.ratedVoltageV >= 1000 ? `${m.ratedVoltageV / 1000} kV` : `${m.ratedVoltageV} V`} · {m.ratedRpm > 0 ? `${m.ratedRpm} RPM` : '50 Hz'}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.bearingSpec}</td>
                  <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>₹{(m.downtimeCostPerHr || 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a
                        href={getDatasetExportUrl(m.id, 'csv')}
                        download={`${m.id}-telemetry-90d.csv`}
                        className="btn btn--secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}
                      >
                        <Download size={12} strokeWidth={1.75} />
                        CSV
                      </a>
                      <a
                        href={getDatasetExportUrl(m.id, 'json')}
                        download={`${m.id}-telemetry-90d.json`}
                        className="btn btn--secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}
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
    </div>
  );
}
