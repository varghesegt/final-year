import { useState, useEffect } from 'react';
import {
  Wifi, Activity, Server, Radio, Database, ShieldCheck,
  CheckCircle2, AlertCircle, ArrowUpRight, Terminal, RefreshCw, Cpu
} from 'lucide-react';
import { MACHINES, generateSensorData } from '../data/factoryData';
import { MetricCard, Badge } from '../components/common';

export function IndustrialGateway() {
  const [activeTopicFilter, setActiveTopicFilter] = useState('all');
  const [packets, setPackets] = useState([]);
  const [packetCount, setPacketCount] = useState(1284);
  const [isStreaming, setIsStreaming] = useState(true);

  // Generate simulated live MQTT packets
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const machineIds = Object.keys(MACHINES);
      const randomId = machineIds[Math.floor(Math.random() * machineIds.length)];
      const machine = MACHINES[randomId];
      const sensor = generateSensorData(randomId);

      if (!sensor) return;

      const newPacket = {
        id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        topic: `factory/${machine.zone}/${machine.id}/telemetry`,
        machineId: machine.id,
        timestamp: new Date().toISOString(),
        payload: {
          temp_c: sensor.temperature.value,
          vib_mms: sensor.vibration.value,
          press_bar: sensor.pressure.value,
          flow_lps: sensor.flowRate.value,
          rpm: sensor.rpm.value,
          health_index: machine.health,
          status: machine.status
        }
      };

      setPackets(prev => [newPacket, ...prev.slice(0, 19)]);
      setPacketCount(c => c + 1);
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const filteredPackets = activeTopicFilter === 'all'
    ? packets
    : packets.filter(p => p.machineId === activeTopicFilter);

  return (
    <div className="gateway-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Page Header */}
      <div className="section-header">
        <div className="section-header__left">
          <h1 className="section-header__title">
            <Radio size={24} style={{ color: 'var(--accent-cyan)' }} />
            Industrial IoT Gateway & SCADA Protocol Matrix
          </h1>
          <p className="section-header__subtitle">
            Live MQTT telemetry packet broker and OPC-UA Industrial Automation Tag Mapping
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-healthy)',
            color: 'var(--status-healthy)', fontSize: '11px', fontWeight: 700
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-healthy)', animation: 'breathe 2s infinite' }} />
            MQTT Broker: CONNECTED (QoS 1)
          </div>
        </div>
      </div>

      {/* Gateway KPIs */}
      <div className="factory-stats">
        <MetricCard
          label="Active Broker"
          value="Mosquitto / Edge"
          icon={Server}
          accent="var(--accent-blue)"
        />
        <MetricCard
          label="Packets Emitted"
          value={packetCount.toLocaleString()}
          icon={Radio}
          accent="var(--accent-cyan)"
          trend="up"
          trendValue="1.2 pkt/sec"
        />
        <MetricCard
          label="OPC-UA Nodes"
          value="24 Tags"
          icon={Cpu}
          accent="var(--accent-purple)"
          trend="stable"
          trendValue="100% Quality Good"
        />
        <MetricCard
          label="Edge Latency"
          value="8.4"
          unit="ms"
          icon={Activity}
          accent="var(--accent-emerald)"
          trend="stable"
          trendValue="Zero packet loss"
        />
      </div>

      {/* Dual Section Grid: Left MQTT Terminal, Right OPC-UA Tag Matrix */}
      <div className="twin-grid">
        {/* Left: MQTT Stream Terminal */}
        <div className="twin-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="twin-panel__title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} className="twin-panel__title-icon" />
              <span>Live MQTT Telemetry Stream (tcp://127.0.0.1:1883)</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                  background: isStreaming ? '#f1f5f9' : 'var(--accent-blue)',
                  color: isStreaming ? 'var(--text-secondary)' : '#ffffff',
                  border: '1px solid var(--border-default)', cursor: 'pointer'
                }}
              >
                {isStreaming ? 'Pause Stream' : 'Resume Stream'}
              </button>
            </div>
          </div>

          {/* Topic Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['all', 'P-101', 'CNC-001', 'COMP-201', 'ROB-001', 'CONV-401', 'XFMR-302'].map(f => (
              <button
                key={f}
                onClick={() => setActiveTopicFilter(f)}
                style={{
                  padding: '3px 9px', borderRadius: 'var(--radius-xs)', fontSize: '11px',
                  fontWeight: activeTopicFilter === f ? 700 : 500,
                  background: activeTopicFilter === f ? 'var(--accent-blue)' : '#ffffff',
                  color: activeTopicFilter === f ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${activeTopicFilter === f ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer'
                }}
              >
                {f === 'all' ? 'All Topics' : f}
              </button>
            ))}
          </div>

          {/* Terminal Console Output */}
          <div style={{
            background: '#0a0e17', borderRadius: 'var(--radius-md)', padding: '12px 14px',
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8',
            height: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)', border: '1px solid #1e293b'
          }}>
            {filteredPackets.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
                Waiting for incoming MQTT packets...
              </div>
            ) : (
              filteredPackets.map(p => (
                <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                    <span style={{ color: '#34d399' }}>PUB [QoS 1] → {p.topic}</span>
                    <span>{p.timestamp.split('T')[1].replace('Z', '')}</span>
                  </div>
                  <div style={{ color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {`{ "temp": ${p.payload.temp_c}°C, "vib": ${p.payload.vib_mms}mm/s, "rpm": ${p.payload.rpm}, "press": ${p.payload.press_bar}bar, "health": ${p.payload.health_index}% }`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: OPC-UA Tag Matrix */}
        <div className="twin-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="twin-panel__title">
            <Cpu size={16} className="twin-panel__title-icon" />
            <span>OPC-UA SCADA PLC NodeID Address Space</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>NodeID Identifier</th>
                  <th>Data Type</th>
                  <th>Current Value</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { node: 'ns=2;s=P101.DriveMotor.Temperature', type: 'Double', val: '42.8 °C', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=P101.Bearing.VibrationRMS', type: 'Double', val: '1.25 mm/s', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=P101.Shaft.SpeedRPM', type: 'Int32', val: '1452 RPM', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=P101.Discharge.Pressure', type: 'Double', val: '4.20 bar', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=P101.Efficiency.Realtime', type: 'Double', val: '88.5 %', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=CNC001.Spindle.Speed', type: 'Int32', val: '12000 RPM', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=CNC001.AxisZ.Vibration', type: 'Double', val: '0.85 mm/s', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=COMP201.AirEnd.Pressure', type: 'Double', val: '7.85 bar', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=ROB001.Kinematics.TCPVelocity', type: 'Double', val: '1250 mm/s', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=ROB001.Manipulator.Payload', type: 'Double', val: '142 kg', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=ROB001.Gripper.Pressure', type: 'Double', val: '6.20 bar', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=CONV401.Motor.Current', type: 'Double', val: '14.2 A', quality: 'Good [0x00]' },
                  { node: 'ns=2;s=XFMR302.Winding.Temp', type: 'Double', val: '58.4 °C', quality: 'Good [0x00]' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {row.node}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{row.val}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-healthy)'
                      }}>
                        {row.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <strong>PLC Integration Note:</strong> The OPC-UA server maps physical PLC/DCS registers (Siemens S7-1500 / Allen-Bradley ControlLogix) into standard IEC 62541 industrial objects, providing certified low-latency streaming to the AI Digital Twin inference layer.
          </div>
        </div>
      </div>
    </div>
  );
}
