import * as THREE from 'three';

// ── Industrial Probe Spatial Hotspot Definitions (World / Assembly Space) ──
export const MACHINE_THERMAL_PROBES = {
  'P-101': [
    { id: 'de_bearing', name: 'Drive-End SKF 6205 Bearing Bracket', pos: [0.0, -0.80, -0.83], radius: 1.4, key: 'bearingDE' },
    { id: 'stator', name: 'Motor Stator Core & Cooling Fins', pos: [0.0, -0.80, 0.95], radius: 1.6, key: 'temperature' },
    { id: 'nde_bearing', name: 'Non-Drive-End Bearing Support & Fan', pos: [0.0, -0.80, 2.26], radius: 1.3, key: 'bearingNDE' },
    { id: 'volute', name: 'Volute Casing & Suction Eye (Hydraulic Cold Sink)', pos: [0.0, -0.66, -1.90], radius: 1.8, key: 'ambientTemp' },
  ],
  'CNC-001': [
    { id: 'spindle_nose', name: 'Spindle High-Speed Bearing & Quill (ISO 40)', pos: [0.0, 1.1, 0.4], radius: 1.3, key: 'bearingDE' },
    { id: 'spindle_motor', name: '3.7kW Inverter Spindle Motor & Headstock', pos: [0.0, 2.2, -0.1], radius: 1.4, key: 'temperature' },
    { id: 'table_workpiece', name: 'T-Slot Precision Worktable & Vise Interface', pos: [0.0, 0.1, 0.5], radius: 1.2, key: 'bearingNDE' },
    { id: 'coolant_sump', name: 'Meehanite Monoblock Base & Coolant Sump (Heat Sink)', pos: [0.0, -1.8, 0.0], radius: 2.2, key: 'ambientTemp' },
  ],
  'COMP-201': [
    { id: 'cylinder_head', name: 'Dual-Stage Piston Cylinder Head (Stage-1/2)', pos: [-0.6, 0.9, 0.5], radius: 1.5, key: 'bearingDE' },
    { id: 'drive_motor', name: 'TEFC Electric Drive Motor & Crankshaft', pos: [1.1, 0.6, 0.5], radius: 1.6, key: 'bearingNDE' },
    { id: 'intercooler', name: 'Intercooler Copper Finned Tubing', pos: [0.1, 0.9, 0.4], radius: 1.3, key: 'temperature' },
    { id: 'air_tank', name: 'Air Receiver Pressure Vessel Tank (Heat Sink)', pos: [0.0, -1.0, 0.0], radius: 2.2, key: 'ambientTemp' },
  ],
  'CONV-401': [
    { id: 'gearbox', name: 'Helical Reducer Gearbox & Motor', pos: [-3.6, -0.6, 1.5], radius: 2.0, key: 'bearingDE' },
    { id: 'head_pulley', name: 'Head Drive Pulley Pillow Block Bearing', pos: [3.6, -0.3, 0.0], radius: 1.6, key: 'bearingNDE' },
    { id: 'belt_friction', name: 'Main Slider Bed Friction Zone', pos: [0.0, -0.3, 0.0], radius: 3.5, key: 'temperature' },
  ],
  'XFMR-302': [
    { id: 'winding_core', name: 'High-Voltage Winding Hotspot (IEC 60076-7)', pos: [0.0, 0.0, 0.0], radius: 2.4, key: 'bearingDE' },
    { id: 'top_oil', name: 'Top Dielectric Mineral Oil Layer', pos: [0.0, 1.4, 0.0], radius: 2.2, key: 'temperature' },
    { id: 'radiator_l', name: 'Radiator Natural Convection Bank L', pos: [-2.5, -0.2, 0.0], radius: 1.8, key: 'ambientTemp' },
    { id: 'radiator_r', name: 'Radiator Natural Convection Bank R', pos: [2.5, -0.2, 0.0], radius: 1.8, key: 'ambientTemp' },
  ],
  'ROB-001': [
    { id: 'j2_shoulder', name: 'J2 Shoulder High-Torque Servo Motor & Harmonic Drive', pos: [0.0, -0.5, -0.8], radius: 1.5, key: 'bearingDE' },
    { id: 'j3_elbow', name: 'J3 Elbow Articulation Servo & Reducer', pos: [0.0, 0.5, 0.6], radius: 1.4, key: 'temperature' },
    { id: 'wrist_gripper', name: 'Wrist Cluster J4-J6 & Servo Gripper Tooling', pos: [0.0, -0.2, 2.2], radius: 1.2, key: 'bearingNDE' },
    { id: 'j1_turntable', name: 'J1 Heavy Slewing Ring & Turntable Base (Heat Sink)', pos: [0.0, -1.9, 0.0], radius: 1.8, key: 'ambientTemp' },
  ],
};

const MAX_PROBES = 4;

// ── Three.js Custom GLSL Distance-Field Heat Conduction Shader ───────────
export function createThermalShaderMaterial(machineId, sensorValues = {}, ambientTemp = 30) {
  const probes = MACHINE_THERMAL_PROBES[machineId] || MACHINE_THERMAL_PROBES['P-101'];

  const probePositions = [];
  const probeRadii = [];
  const probeTemps = [];

  let maxObservedTemp = ambientTemp;

  for (let i = 0; i < MAX_PROBES; i++) {
    if (i < probes.length) {
      const p = probes[i];
      probePositions.push(new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]));
      probeRadii.push(p.radius);

      let tempVal = sensorValues[p.key]?.value ?? sensorValues[p.key] ?? ambientTemp;
      if (p.key === 'ambientTemp') tempVal = ambientTemp;
      probeTemps.push(tempVal);
      if (tempVal > maxObservedTemp) maxObservedTemp = tempVal;
    } else {
      probePositions.push(new THREE.Vector3(0, 0, 0));
      probeRadii.push(1.0);
      probeTemps.push(ambientTemp);
    }
  }

  // Dynamic range calibrated for clear visual gradients: min near ambient, max covering hotspots
  const minTemp = Math.min(22.0, ambientTemp - 2.0);
  const maxTemp = Math.max(65.0, maxObservedTemp + 5.0);

  const uniforms = {
    uAmbientTemp: { value: ambientTemp },
    uProbePositions: { value: probePositions },
    uProbeRadii: { value: probeRadii },
    uProbeTemps: { value: probeTemps },
    uNumProbes: { value: probes.length },
    uMinTemp: { value: minTemp },
    uMaxTemp: { value: maxTemp },
  };

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uAmbientTemp;
    uniform vec3 uProbePositions[4];
    uniform float uProbeRadii[4];
    uniform float uProbeTemps[4];
    uniform int uNumProbes;
    uniform float uMinTemp;
    uniform float uMaxTemp;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Enhanced FLIR Ironbow / Jet 7-Stop Industrial Thermography Color Scale
    vec3 flirIronbow(float u) {
      u = clamp(u, 0.0, 1.0);
      vec3 c0 = vec3(0.08, 0.04, 0.28); // 0.00: Deep Indigo Ambient Cold
      vec3 c1 = vec3(0.02, 0.28, 0.78); // 0.18: Cool Cobalt Blue
      vec3 c2 = vec3(0.00, 0.68, 0.65); // 0.35: Cyan / Teal Conductive Zone
      vec3 c3 = vec3(0.12, 0.78, 0.22); // 0.50: Emerald Green Nominal Run
      vec3 c4 = vec3(0.96, 0.82, 0.08); // 0.65: Golden Amber Warning
      vec3 c5 = vec3(0.96, 0.36, 0.04); // 0.80: Radiant Orange High Load
      vec3 c6 = vec3(0.92, 0.06, 0.12); // 0.92: Intense Crimson Hotspot
      vec3 c7 = vec3(1.00, 1.00, 0.95); // 1.00: Incandescent White Hot

      if (u < 0.18) {
        return mix(c0, c1, u / 0.18);
      } else if (u < 0.35) {
        return mix(c1, c2, (u - 0.18) / 0.17);
      } else if (u < 0.50) {
        return mix(c2, c3, (u - 0.35) / 0.15);
      } else if (u < 0.65) {
        return mix(c3, c4, (u - 0.50) / 0.15);
      } else if (u < 0.80) {
        return mix(c4, c5, (u - 0.65) / 0.15);
      } else if (u < 0.92) {
        return mix(c5, c6, (u - 0.80) / 0.12);
      } else {
        return mix(c6, c7, (u - 0.92) / 0.08);
      }
    }

    void main() {
      // Gaussian Distance-Field Heat Conduction: T(P) = T_amb + sum (T_i - T_amb) * exp(-d^2 / 2r^2)
      float localTemp = uAmbientTemp;

      for (int i = 0; i < 4; i++) {
        if (i >= uNumProbes) break;
        float d = distance(vWorldPosition, uProbePositions[i]);
        float r = max(0.5, uProbeRadii[i]);
        float weight = exp(-(d * d) / (2.0 * r * r));
        localTemp += (uProbeTemps[i] - uAmbientTemp) * weight;
      }

      // Map temperature to FLIR Ironbow colormap scalar
      float norm = clamp((localTemp - uMinTemp) / max(1.0, uMaxTemp - uMinTemp), 0.0, 1.0);
      vec3 thermalColor = flirIronbow(norm);

      // Subtle FEA Isoline contour rings (every ~4°C)
      float isoVal = fract(localTemp / 4.0);
      float isoLine = smoothstep(0.0, 0.06, abs(isoVal - 0.5) * 2.0);
      thermalColor = mix(thermalColor * 0.82, thermalColor, 0.75 + 0.25 * isoLine);

      // 3D Phong Lighting to reveal detailed mechanical contours and geometric features
      vec3 lightDir = normalize(vec3(0.5, 1.2, 0.8));
      vec3 normal = normalize(vNormal);
      float diff = max(0.28, dot(normal, lightDir));

      vec3 viewDir = normalize(vViewPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(normal, halfDir)), 16.0) * 0.25;

      vec3 finalColor = thermalColor * (diff * 0.72 + 0.32) + vec3(spec);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });

  mat.userData = {
    isThermalShader: true,
    machineId,
    uniforms,
  };

  return mat;
}

// ── Update Existing Thermal Shader Material Uniforms (Zero Allocation) ────
export function updateThermalUniforms(material, machineId, sensorValues = {}, ambientTemp = 30) {
  if (!material?.userData?.isThermalShader) return;
  const uniforms = material.userData.uniforms;
  const probes = MACHINE_THERMAL_PROBES[machineId] || MACHINE_THERMAL_PROBES['P-101'];

  uniforms.uAmbientTemp.value = ambientTemp;
  let maxObservedTemp = ambientTemp;

  for (let i = 0; i < MAX_PROBES; i++) {
    if (i < probes.length) {
      const p = probes[i];
      let tempVal = sensorValues[p.key]?.value ?? sensorValues[p.key] ?? ambientTemp;
      if (p.key === 'ambientTemp') tempVal = ambientTemp;
      uniforms.uProbeTemps.value[i] = tempVal;
      if (tempVal > maxObservedTemp) maxObservedTemp = tempVal;
    }
  }

  uniforms.uMinTemp.value = Math.min(22.0, ambientTemp - 2.0);
  uniforms.uMaxTemp.value = Math.max(65.0, maxObservedTemp + 5.0);
}

// ── Precise Surface Temperature Probe Calculation at Raycast Point ───────
export function computeSurfaceTemperature(machineId, worldPoint, sensorValues = {}, ambientTemp = 30) {
  const probes = MACHINE_THERMAL_PROBES[machineId] || MACHINE_THERMAL_PROBES['P-101'];
  if (!worldPoint) return { temp: ambientTemp, nearestComponent: 'Surface Base' };

  let localTemp = ambientTemp;
  let minDistance = Infinity;
  let nearestComponent = 'Chassis Shell';

  probes.forEach((p) => {
    const probePos = new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]);
    const d = worldPoint.distanceTo(probePos);
    const r = p.radius;
    const weight = Math.exp(-(d * d) / (2 * r * r));

    let probeTemp = sensorValues[p.key]?.value ?? sensorValues[p.key] ?? ambientTemp;
    if (p.key === 'ambientTemp') probeTemp = ambientTemp;

    localTemp += (probeTemp - ambientTemp) * weight;

    if (d < minDistance) {
      minDistance = d;
      nearestComponent = p.name;
    }
  });

  return {
    temp: Math.round(localTemp * 10) / 10,
    nearestComponent,
    distanceToHotspot: Math.round(minDistance * 100) / 100,
  };
}
