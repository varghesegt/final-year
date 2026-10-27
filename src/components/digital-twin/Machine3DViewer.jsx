import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Layers, RotateCcw, Flame, Box, ShieldCheck,
  Eye, RefreshCw, ZoomIn, Info, Crosshair, Thermometer
} from 'lucide-react';
import {
  createThermalShaderMaterial,
  updateThermalUniforms,
  computeSurfaceTemperature,
  MACHINE_THERMAL_PROBES
} from './thermalShader';
import {
  PUMP_COMPONENT_INFO,
  applyCentrifugalPumpPBR,
  setupCentrifugalPumpKinematics,
  updateCentrifugalPumpKinematics
} from './centrifugalPumpPBR';
import {
  setupCNCMillKinematics,
  updateCNCMillKinematics
} from './cncMillKinematics';
import {
  setupCompressorKinematics,
  updateCompressorKinematics
} from './compressorKinematics';
import {
  setupRobotKinematics,
  updateRobotKinematics
} from './robotKinematics';

// ── Industrial Sub-Assembly Nomenclature & Telemetry Mapping ───────────────
const INDUSTRIAL_COMPONENT_INFO = {
  ...PUMP_COMPONENT_INFO,
  // COMP-201 Real Industrial Air Compressor Sub-assemblies
  'Compressor__0': {
    name: 'Cast-Iron Twin Cylinder & 200L Pressure Receiver',
    spec: 'Dual-Stage Intercooled Piston Castings • ASME Sec VIII Air Tank',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope'
  },
  'Engine_Drive_Shaft__0': {
    name: 'TEFC Electric Motor & Crankshaft Assembly',
    spec: '5.5 kW 400V 3-Phase Induction Motor • 1450 RPM • Bearing Pt100 RTD',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibration'
  },
  'Belt__0': {
    name: 'High-Torque V-Belt & Protective Wire Mesh Guard',
    spec: 'Chloroprene Reinforced V-Belt • Dynamic Tension: 96% • ISO 10816-3 Normal',
    tempSensor: 'temperature',
    vibSensor: 'vibrationEnvelope'
  },
  'Wheel__0': {
    name: 'Aerodynamic Cooling Flywheel & Cast-Iron Pulley',
    spec: 'Directional Air-Blast Fan Blades • Dynamic Balance Grade G2.5',
    tempSensor: 'temperature',
    vibSensor: 'vibration'
  },
  'Switch__0': {
    name: 'Condor MDR Auto Cut-off Pressure Switch & Unloader',
    spec: 'Auto Cut-In 6.2 bar / Cut-Out 8.5 bar • Solenoid Pressure Relief',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration'
  },
  'Knob__0': {
    name: 'Micrometer Dual Pressure Regulator & Filter Manifold',
    spec: '0 - 12 bar Fine Regulator with Coalescing Air-Water Filter',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration'
  }
};

// ── CNC-001 Virtual Sub-Assembly Zone Definitions ─────────────────────────
// Based on actual GLB geometry bounds: Y spans ~-2.3 to +1.6 (normalized to fit ~5.2 units)
// The model is a single mesh, so we define virtual zones by Y-height intervals
const CNC_VIRTUAL_ZONES = [
  {
    id: 'spindle-head',
    name: 'Spindle Head & Variable Frequency Drive Motor',
    spec: '3.7 kW Vector AC Motor • 10,000 RPM Max • ISO 40 Taper Spindle • Hybrid Angular Contact Bearings (ABEC-7)',
    yMin: 1.2, yMax: 2.8,
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    color: 0x3b82f6,
    explodeOffset: [0, 1.4, 0],
    criticalParams: ['spindleSpeed', 'spindleRunout', 'spindleLoad', 'chatterVib']
  },
  {
    id: 'column',
    name: 'Vertical Column & Overarm Assembly',
    spec: 'Heavy Meehanite Cast-Iron Precision Scraped Column • Rigid Box-Way Guides • Ram Travel: 450mm',
    yMin: 0.4, yMax: 1.2,
    tempSensor: 'temperature',
    vibSensor: 'vibrationEnvelope',
    color: 0x8b5cf6,
    explodeOffset: [1.2, 0.6, 0],
    criticalParams: ['thermalDriftZ']
  },
  {
    id: 'work-table',
    name: 'T-Slot Precision Work Table & Machine Vise (X/Y Axis)',
    spec: '1270×254mm Hardened Ground Table • C3 Ball Screws • 0.001mm Repeatability • Power Feed X/Y',
    yMin: -0.3, yMax: 0.4,
    tempSensor: 'bearingNDE',
    vibSensor: 'vibration',
    color: 0x06b6d4,
    explodeOffset: [0, 0, 1.2],
    criticalParams: ['feedRate', 'coolantFlow', 'coolantPressure']
  },
  {
    id: 'knee',
    name: 'Vertical Knee & Elevating Lead Screw (Z-Axis)',
    spec: 'Heavy Cast-Iron Knee • Hand-Scraped Turcite-B Box Ways • Telescopic Hydraulic Counterbalance • Z Travel: 400mm',
    yMin: -1.2, yMax: -0.3,
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    color: 0xf59e0b,
    explodeOffset: [-1.0, -0.5, 0],
    criticalParams: ['axisPos']
  },
  {
    id: 'base',
    name: 'Cast-Iron Monoblock Base & Coolant Sump',
    spec: 'Heavy Ribbed Meehanite Casting • 60L Flood Coolant Reservoir • Magnetic Swarf Strainer • Anti-Vibration Pads',
    yMin: -2.3, yMax: -1.2,
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    color: 0x10b981,
    explodeOffset: [0, -0.8, 0],
    criticalParams: ['coolantPressure', 'coolantFlow']
  }
];

// ── ROB-001 6-Axis Articulated Robot Arm Virtual Sub-Assembly Zones ────────
const ROBOT_VIRTUAL_ZONES = [
  {
    id: 'gripper-tool',
    name: 'Wrist J5/J6 Flange & Servo Gripper Tooling',
    spec: 'Parallel Servo Gripper • Pneumatic 6.2 bar • Laser Part-Detect Sensor • ISO 9283 ±0.03mm',
    zMin: 1.0, zMax: 3.5,
    tempSensor: 'bearingNDE',
    vibSensor: 'vibration',
    color: 0xec4899,
    explodeOffset: [0, 0.4, 1.4],
    criticalParams: ['gripperPressure', 'repeatability', 'tcpVelocity', 'partsCountToday']
  },
  {
    id: 'wrist-cluster',
    name: '3-Axis Integrated Wrist Assembly (J4/J5/J6)',
    spec: 'In-Line Epicyclic Gearbox • Dual Hollow Shaft • Roll/Pitch/Yaw Drives',
    zMin: 0.1, zMax: 1.0,
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    color: 0x8b5cf6,
    explodeOffset: [0, 0.6, 0.8],
    criticalParams: ['jointAngles', 'harmonicBacklash']
  },
  {
    id: 'elbow-joint',
    name: 'Elbow Articulation Joint (J3) & Counterbalance Link',
    spec: 'High-Ratio Cycloidal Reducer • 390 N·m Torque • Pneumatic Balancing Cylinder',
    zMin: -0.8, zMax: 0.1,
    tempSensor: 'temperature',
    vibSensor: 'vibration',
    color: 0x3b82f6,
    explodeOffset: [0, 1.0, 0],
    criticalParams: ['jointTorques', 'servoTemps']
  },
  {
    id: 'shoulder-arm',
    name: 'Heavy-Duty Shoulder Linkage & Servo Motor (J2)',
    spec: 'High-Torque Synchronous AC Servo (680 N·m) • Dual Preloaded Roller Bearings • Rigid Cast Steel',
    zMin: -1.8, zMax: -0.8,
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    color: 0xf59e0b,
    explodeOffset: [0.8, 0.6, -0.6],
    criticalParams: ['activePayload', 'payloadRatio', 'jointTorques']
  },
  {
    id: 'base-turntable',
    name: 'Monoblock Base Pedestal & J1 Slewing Turntable',
    spec: '360° Continuous Slew Ring Bearing • Multi-Stage Epicyclic Drive • Anchor Foundation Mounting',
    zMin: -3.5, zMax: -1.8,
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    color: 0x10b981,
    explodeOffset: [0, -0.8, 0],
    criticalParams: ['cycleTime', 'tcpPosition']
  }
];

// ── P-101 Centrifugal Pump Virtual Sub-Assembly Zones ───────────────
// Based on actual GLB geometry bounds: length along Z spans ~ -2.8 to +2.8
const PUMP_VIRTUAL_ZONES = [
  {
    id: 'volute-casing',
    name: 'Cast-Iron Volute Casing & Suction / Discharge Flanges',
    spec: 'ISO 2858 Volute Casing • Cast Bronze Impeller • DN 65 Flanges • 45m Rated Head • 120 m³/h',
    zMin: -2.8, zMax: -1.3,
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    color: 0x06b6d4,
    explodeOffset: [0, 0, -1.2],
    criticalParams: ['flowRate', 'pressure', 'npshMargin']
  },
  {
    id: 'bearing-seal-bracket',
    name: 'Bearing Bracket, Mechanical Seal & Drive-End Bearing',
    spec: 'SKF 6205 C3 Angular Contact Bearings • API 682 Cartridge Mechanical Seal Plan 11 • Splash Oil Bath',
    zMin: -1.3, zMax: -0.1,
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    color: 0x3b82f6,
    explodeOffset: [0, 0.6, -0.6],
    criticalParams: ['bearingDE', 'vibrationEnvelope', 'sealChamberPressure']
  },
  {
    id: 'coupling-guard',
    name: 'Flexible Jaw Shaft Coupling & Safety Enclosure',
    spec: 'Curved Jaw Coupling • Precision Polyurethane Spider • Dynamic Balancing Grade G2.5',
    zMin: -0.1, zMax: 0.5,
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    color: 0xf59e0b,
    explodeOffset: [0, 0.8, 0],
    criticalParams: ['shaftSpeed', 'vibration']
  },
  {
    id: 'electric-motor',
    name: '15kW IE3 Premium Induction Drive Motor & Stator',
    spec: '400V 50Hz 3-Phase • 2950 RPM • Class F Insulation • IP55 TEFC Cast-Iron Stator Core',
    zMin: 0.5, zMax: 1.8,
    tempSensor: 'temperature',
    vibSensor: 'vibration',
    color: 0x8b5cf6,
    explodeOffset: [0, 0.5, 0.8],
    criticalParams: ['activePower', 'powerFactor', 'motorCurrent']
  },
  {
    id: 'fan-nde-bracket',
    name: 'Motor Cooling Fan Cowl & Non-Drive End Bearing',
    spec: 'Bi-directional Polypropylene Fan • Pressed Steel Cowl • Deep Groove Ball Bearing',
    zMin: 1.8, zMax: 3.0,
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    color: 0xec4899,
    explodeOffset: [0, 0, 1.2],
    criticalParams: ['bearingNDE', 'vibrationPeak']
  }
];

export function Machine3DViewer({ machine, sensors, health = 85, isSimulation = false }) {
  const mountRef = useRef(null);
  const [shadingMode, setShadingMode] = useState('cad'); // 'cad' | 'thermal' | 'exploded'
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelTypeLoaded, setModelTypeLoaded] = useState('procedural'); // 'glb' | 'procedural'
  const [inspectionTarget, setInspectionTarget] = useState('Primary Assembly Body');
  const [inspectedPartData, setInspectedPartData] = useState(null);
  const [hoverProbe, setHoverProbe] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState(null);

  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef({});
  const animationFrameRef = useRef(null);
  const shadingModeRef = useRef(shadingMode);

  const machineId = machine?.id || 'P-101';
  const machineType = machine?.type || 'Centrifugal Pump';

  useEffect(() => {
    shadingModeRef.current = shadingMode;
  }, [shadingMode]);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 800;
    const height = 480;

    // 1. WebGL Scene, Camera & Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    if (machineId === 'CNC-001' || machineType.includes('Milling') || machineType.includes('CNC')) {
      camera.position.set(3.4, 2.2, 7.8);
      camera.lookAt(0, 0.35, 0);
    } else if (machineId === 'ROB-001' || machineType.includes('Robot')) {
      camera.position.set(4.5, 3.0, 6.8);
      camera.lookAt(0, 0.2, 0);
    } else if (machineId === 'P-101' || machineType.includes('Pump')) {
      camera.position.set(4.8, 2.2, 5.2);
      camera.lookAt(0, -0.6, 0);
    } else if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
      camera.position.set(0, 1.4, 6.8);
      camera.lookAt(0, 0.15, 0);
    } else {
      camera.position.set(0, 3.5, 10);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // High-End Studio PBR Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 480;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 3;
    controls.maxDistance = 22;
    if (machineId === 'CNC-001' || machineType.includes('Milling') || machineType.includes('CNC')) {
      controls.target.set(0, 0.35, 0);
    } else if (machineId === 'ROB-001' || machineType.includes('Robot')) {
      controls.target.set(0, 0.2, 0);
    } else if (machineId === 'P-101' || machineType.includes('Pump')) {
      controls.target.set(0, -0.6, 0);
    } else if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
      controls.target.set(0, 0.15, 0);
    }
    controls.update();
    controlsRef.current = controls;

    // 3. Studio Lighting Rig (Neutral High-CRI Studio Lighting for Accurate PBR Materials)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(10, 16, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
    rimLight.position.set(0, -6, -10);
    scene.add(rimLight);

    const faultPointLight = new THREE.PointLight(0xdc2626, 0, 15);
    faultPointLight.position.set(0, 1.5, 0);
    scene.add(faultPointLight);

    // Grid Floor & Shadow Plane
    const gridHelper = new THREE.GridHelper(22, 22, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.21;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // PBR Materials
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1 });

    const faultMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x000000,
      metalness: 0.8,
      roughness: 0.2
    });

    const rootAssemblyGroup = new THREE.Group();
    scene.add(rootAssemblyGroup);

    let glbLoadedMesh = null;
    let proceduralGroup = new THREE.Group();
    let targetComponentMesh = null;
    const animObjects = {};

    // ── Load Real GLB Model First ─────────────────────────────────────
    setLoadingModel(true);
    const loader = new GLTFLoader();
    const glbPath = `${import.meta.env.BASE_URL}models/${machineId}.glb`;

    loader.load(
      glbPath,
      (gltf) => {
        setLoadingModel(false);
        setModelTypeLoaded('glb');
        glbLoadedMesh = gltf.scene;

        // Auto-scale and center the loaded CAD model
        const bbox = new THREE.Box3().setFromObject(glbLoadedMesh);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 5.2 / maxDim;

        glbLoadedMesh.scale.set(scale, scale, scale);
        // Ground the machine so its base rests firmly on the floor grid (y = -2.2)
        const groundedY = -2.2 - (bbox.min.y * scale);
        glbLoadedMesh.position.set(-center.x * scale, groundedY, -center.z * scale);

        const compSubMeshes = {};
        glbLoadedMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.originalMaterial = child.material;

            const info = INDUSTRIAL_COMPONENT_INFO[child.name];
            child.userData.partName = info ? info.name : (child.name || `${machineType} Sub-Assembly`);
            child.userData.partSpec = info ? info.spec : 'Standard Industrial OEM Sub-Assembly';
            child.userData.tempKey = info?.tempSensor || 'temperature';
            child.userData.vibKey = info?.vibSensor || 'vibration';

            child.userData.originalLocalPos = child.position.clone();
            compSubMeshes[child.name] = child;
          }
        });

        // ── COMP-201: Setup Compressor Kinematics, Pulleys, Belt & Exploded CAD ──
        if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
          const compressorKinematics = setupCompressorKinematics(glbLoadedMesh, compSubMeshes, rootAssemblyGroup);
          meshesRef.current.compressorKinematics = compressorKinematics;
        }

        // ── P-101: Apply Centrifugal Pump Industrial PBR Materials & Kinematics ──
        if (machineId === 'P-101' || machineType.includes('Pump')) {
          applyCentrifugalPumpPBR(glbLoadedMesh);
          const pumpKinematics = setupCentrifugalPumpKinematics(glbLoadedMesh, compSubMeshes);
          meshesRef.current.pumpKinematics = pumpKinematics;
        }

        // ── CNC-001: Setup Milling Machine Geometry Decomposition & Kinematics ──
        if (machineId === 'CNC-001' || machineType.includes('Milling') || machineType.includes('CNC')) {
          const cncKinematics = setupCNCMillKinematics(glbLoadedMesh);
          meshesRef.current.cncKinematics = cncKinematics;
        }

        // ── ROB-001: Setup Robot Arm Geometry Decomposition & Joint Kinematics ──
        if (machineId === 'ROB-001' || machineType.includes('Robot')) {
          const robotKinematics = setupRobotKinematics(glbLoadedMesh, compSubMeshes, rootAssemblyGroup);
          meshesRef.current.robotKinematics = robotKinematics;
        }

        rootAssemblyGroup.add(glbLoadedMesh);
        meshesRef.current.glbMesh = glbLoadedMesh;
        meshesRef.current.compSubMeshes = compSubMeshes;
        meshesRef.current.groundedY = groundedY;
        meshesRef.current.glbScale = scale;
        meshesRef.current.glbCenter = center.clone();
        meshesRef.current.glbBBox = bbox.clone();

        // ── CNC-001, ROB-001, COMP-201 & P-101: Build Virtual Sub-Assembly Zone Highlight Boxes ─────────
        const isCNC = machineId === 'CNC-001' || machineType.includes('Milling');
        const isCompressor = machineId === 'COMP-201' || machineType.includes('Compressor');
        const isRobot = machineId === 'ROB-001' || machineType.includes('Robot');
        const isPump = machineId === 'P-101' || machineType.includes('Pump');
        // Disable virtual zone translucent box for CNC-001, COMP-201 & ROB-001 as they have real decomposed subassemblies
        const activeZoneList = (isCNC || isCompressor || isRobot) ? null : isPump ? PUMP_VIRTUAL_ZONES : null;

        if (activeZoneList) {
          const zoneHighlights = {};
          activeZoneList.forEach((zone) => {
            const zoneMat = new THREE.MeshBasicMaterial({
              color: zone.color,
              transparent: true,
              opacity: 0,
              depthWrite: false,
              side: THREE.DoubleSide
            });

            let zoneMesh;
            if (isCNC) {
              const zoneHeight = zone.yMax - zone.yMin;
              const zoneGeo = new THREE.BoxGeometry(3.2, zoneHeight, 3.2);
              zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
              zoneMesh.position.y = (zone.yMin + zone.yMax) / 2;
            } else if (isPump) {
              const zoneDepth = Math.max(0.6, zone.zMax - zone.zMin);
              const zoneGeo = new THREE.BoxGeometry(2.4, 2.2, zoneDepth);
              zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
              zoneMesh.position.set(0, -0.6, (zone.zMin + zone.zMax) / 2);
            } else {
              const zoneDepth = Math.max(0.6, zone.zMax - zone.zMin);
              const zoneGeo = new THREE.BoxGeometry(2.4, 2.2, zoneDepth);
              zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
              zoneMesh.position.set(0, 0.2, (zone.zMin + zone.zMax) / 2);
            }

            zoneMesh.userData.zoneId = zone.id;
            zoneMesh.userData.zoneName = zone.name;
            zoneMesh.userData.zoneSpec = zone.spec;
            zoneMesh.userData.tempKey = zone.tempSensor;
            zoneMesh.userData.vibKey = zone.vibSensor;
            zoneMesh.userData.isZoneBox = true;
            zoneMesh.renderOrder = 999;
            rootAssemblyGroup.add(zoneMesh);
            zoneHighlights[zone.id] = { mesh: zoneMesh, mat: zoneMat, zone };
          });
          meshesRef.current.zoneHighlights = zoneHighlights;
        }
      },
      undefined,
      () => {
        setLoadingModel(false);
        setModelTypeLoaded('procedural');
        buildProceduralAssembly();
      }
    );

    // ── Procedural CAD Assembly (Fallback / Hybrid) ───────────────────
    function buildProceduralAssembly() {
      proceduralGroup = new THREE.Group();

      if (machineId === 'P-101' || machineType.includes('Pump')) {
        setInspectionTarget('SKF 6205 Bearing Housing');

        const motorGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.8, 32);
        motorGeo.rotateZ(Math.PI / 2);
        const motorMesh = new THREE.Mesh(motorGeo, motorMat);
        motorMesh.position.set(-3.5, 0, 0);
        motorMesh.userData = { partName: 'Electric Drive Motor (15kW)', originalMaterial: motorMat };
        proceduralGroup.add(motorMesh);

        for (let i = -1.2; i <= 1.2; i += 0.4) {
          const finGeo = new THREE.TorusGeometry(1.65, 0.05, 16, 32);
          finGeo.rotateY(Math.PI / 2);
          const finMesh = new THREE.Mesh(finGeo, motorMat);
          finMesh.position.set(-3.5 + i, 0, 0);
          finMesh.userData = { partName: 'Motor Cooling Fin', originalMaterial: motorMat };
          proceduralGroup.add(finMesh);
        }

        const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 7.5, 32);
        shaftGeo.rotateZ(Math.PI / 2);
        const shaftMesh = new THREE.Mesh(shaftGeo, silverMat);
        shaftMesh.userData = { partName: 'Drive Shaft', originalMaterial: silverMat };
        proceduralGroup.add(shaftMesh);

        const couplingGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 32);
        couplingGeo.rotateZ(Math.PI / 2);
        const couplingMesh = new THREE.Mesh(couplingGeo, copperMat);
        couplingMesh.position.set(-1.4, 0, 0);
        couplingMesh.userData = { partName: 'Flexible Coupling', originalMaterial: copperMat };
        proceduralGroup.add(couplingMesh);

        const bearingGeo = new THREE.BoxGeometry(1.4, 1.8, 1.8);
        targetComponentMesh = new THREE.Mesh(bearingGeo, faultMat);
        targetComponentMesh.position.set(0.2, 0, 0);
        targetComponentMesh.userData = { partName: 'SKF 6205 Bearing Assembly', originalMaterial: faultMat };
        proceduralGroup.add(targetComponentMesh);

        const ringGeo = new THREE.TorusGeometry(0.6, 0.1, 16, 32);
        ringGeo.rotateY(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringGeo, faultMat);
        ringMesh.position.set(0.2, 0, 0);
        ringMesh.userData = { partName: 'Bearing Outer Ring', originalMaterial: faultMat };
        proceduralGroup.add(ringMesh);

        const sealGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 32);
        sealGeo.rotateZ(Math.PI / 2);
        const sealMesh = new THREE.Mesh(sealGeo, cyanMat);
        sealMesh.position.set(1.3, 0, 0);
        sealMesh.userData = { partName: 'Mechanical Seal Cartridge', originalMaterial: cyanMat };
        proceduralGroup.add(sealMesh);

        const casingGeo = new THREE.SphereGeometry(1.8, 32, 32);
        casingGeo.scale(1, 1, 0.7);
        const casingMesh = new THREE.Mesh(casingGeo, cyanMat);
        casingMesh.position.set(2.8, 0, 0);
        casingMesh.userData = { partName: 'Volute Casing', originalMaterial: cyanMat };
        proceduralGroup.add(casingMesh);

        const impellerGroup = new THREE.Group();
        const impellerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32), silverMat);
        impellerHub.rotation.z = Math.PI / 2;
        impellerHub.userData = { originalMaterial: silverMat };
        impellerGroup.add(impellerHub);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
          const vaneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.3), silverMat);
          vaneMesh.position.set(0, Math.cos(a) * 0.7, Math.sin(a) * 0.7);
          vaneMesh.rotation.x = a;
          vaneMesh.userData = { originalMaterial: silverMat };
          impellerGroup.add(vaneMesh);
        }
        impellerGroup.position.set(2.8, 0, 0);
        proceduralGroup.add(impellerGroup);

        animObjects.impellerGroup = impellerGroup;
        animObjects.bearing = targetComponentMesh;

      } else if (machineId === 'CNC-001' || machineType.includes('CNC')) {
        setInspectionTarget('High-Speed Spindle Head');

        const bodyGeo = new THREE.BoxGeometry(6.5, 4.5, 4.2);
        const bodyMesh = new THREE.Mesh(bodyGeo, darkMat);
        bodyMesh.userData = { partName: 'Milling Enclosure', originalMaterial: darkMat };
        proceduralGroup.add(bodyMesh);

        const doorGeo = new THREE.BoxGeometry(3.6, 2.8, 0.1);
        const doorMesh = new THREE.Mesh(doorGeo, glassMat);
        doorMesh.position.set(0, 0.2, 2.15);
        doorMesh.userData = { partName: 'Enclosure Door', originalMaterial: glassMat };
        proceduralGroup.add(doorMesh);

        const spindleGeo = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 32);
        targetComponentMesh = new THREE.Mesh(spindleGeo, faultMat);
        targetComponentMesh.position.set(0, 0.7, 0.6);
        targetComponentMesh.userData = { partName: 'Electro-Spindle Head', originalMaterial: faultMat };
        proceduralGroup.add(targetComponentMesh);

        const toolGeo = new THREE.ConeGeometry(0.2, 0.9, 16);
        toolGeo.rotateX(Math.PI);
        const toolMesh = new THREE.Mesh(toolGeo, silverMat);
        toolMesh.position.set(0, -0.85, 0.6);
        toolMesh.userData = { partName: 'Cutting Tool Bit', originalMaterial: silverMat };
        proceduralGroup.add(toolMesh);

        animObjects.tool = toolMesh;
        animObjects.spindle = targetComponentMesh;

      } else {
        const baseGeo = new THREE.BoxGeometry(5.4, 3.8, 3.4);
        targetComponentMesh = new THREE.Mesh(baseGeo, faultMat);
        targetComponentMesh.userData = { partName: `${machine.name} Core`, originalMaterial: faultMat };
        proceduralGroup.add(targetComponentMesh);

        for (let x of [-1.5, 0, 1.5]) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.8), silverMat);
          fin.position.set(x, 0, 1.8);
          fin.userData = { partName: 'Cooling Fin Stack', originalMaterial: silverMat };
          proceduralGroup.add(fin);
        }
      }

      rootAssemblyGroup.add(proceduralGroup);
      meshesRef.current.proceduralGroup = proceduralGroup;
      meshesRef.current.targetComponentMesh = targetComponentMesh;
    }

    meshesRef.current = {
      ...meshesRef.current,
      faultMat,
      targetComponentMesh,
      faultPointLight,
      rootAssemblyGroup,
    };

    // 4. Raycasting for Part Click & Live Thermal Hover Probe
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const rawIntersects = raycaster.intersectObjects(rootAssemblyGroup.children, true);
      const intersects = rawIntersects.filter(i => !i.object.userData.isZoneBox);
      const effectiveIntersects = intersects.length > 0 ? intersects : rawIntersects;

      if (effectiveIntersects.length > 0) {
        const hit = effectiveIntersects[0];
        let partName = hit.object.userData.partName || hit.object.name || 'Component Assembly';
        let partSpec = hit.object.userData.partSpec || 'Standard Industrial OEM Assembly';
        let tempKey = hit.object.userData.tempKey || 'temperature';
        let vibKey = hit.object.userData.vibKey || 'vibration';
        let matchedZoneId = null;

        // Precise spatial component resolution for Milling Machine & Robot Arm
        if (hit.object.userData.isSubAssembly && hit.object.userData.subKey !== 'column') {
          partName = hit.object.userData.partName;
          partSpec = hit.object.userData.partSpec;
          tempKey = hit.object.userData.tempKey;
          vibKey = hit.object.userData.vibKey;
          matchedZoneId = hit.object.userData.subKey;

          if (hit.object.material && hit.object.material.emissive) {
            const origColor = hit.object.material.emissive.clone();
            hit.object.material.emissive.setHex(0x0284c7);
            setTimeout(() => {
              if (hit.object?.material?.emissive) {
                hit.object.material.emissive.copy(origColor);
              }
            }, 350);
          }
        } else if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
          const y = hit.point.y;
          if (hit.object.userData.subKey === 'flywheel' || hit.object.name?.includes('Wheel')) {
            partName = 'Aerodynamic Cooling Flywheel & Crankshaft Pulley';
            partSpec = 'Ø1190mm Dynamic Balance G2.5 • Directional Fan Blades • Integrated Counterbalance';
            tempKey = 'temperature';
            vibKey = 'vibration';
            matchedZoneId = 'flywheel';
          } else if (hit.object.userData.subKey === 'motor-pulley' || hit.object.name?.includes('Shaft')) {
            partName = '5.5 kW TEFC Motor Drive Pulley & Keyed Journal';
            partSpec = '5.5 kW 400V 3-Phase Induction Motor • 1450 RPM • Keyed Ground Hub • DIN 6885';
            tempKey = 'bearingNDE';
            vibKey = 'vibration';
            matchedZoneId = 'motor-pulley';
          } else if (hit.object.userData.subKey === 'belt' || hit.object.name?.includes('Belt')) {
            partName = 'High-Torque Chloroprene V-Belt Transmission';
            partSpec = 'Reinforced Multi-Ribbed Cord • Dynamic Tension: 96% • ISO 10816-3 Normal';
            tempKey = 'temperature';
            vibKey = 'vibrationEnvelope';
            matchedZoneId = 'belt';
          } else if (hit.object.userData.subKey === 'switch' || hit.object.name?.includes('Switch')) {
            partName = 'Condor MDR-3 Pressure Switch & Automatic Unloader Valve';
            partSpec = 'Cut-In 6.2 bar / Cut-Out 8.5 bar • Automatic Pneumatic Venting Solenoid';
            tempKey = 'ambientTemp';
            vibKey = 'vibration';
            matchedZoneId = 'switch';
          } else if (hit.object.userData.subKey === 'regulator' || hit.object.name?.includes('Knob')) {
            partName = 'Micrometer Dual Pressure Regulator & Filter Manifold';
            partSpec = '0 - 12 bar Fine Regulator • 5-Micron Coalescing Filter • Sump Drain';
            tempKey = 'ambientTemp';
            vibKey = 'vibration';
            matchedZoneId = 'regulator';
          } else if (y > 0.8) {
            partName = 'Dual-Stage Cast-Iron Twin Cylinder Heads & Intercooler Pipe';
            partSpec = 'Heavy Finned Meehanite Castings • Dual-Stage Compression • 850 L/min FAD';
            tempKey = 'stage1Temp';
            vibKey = 'vibrationEnvelope';
            matchedZoneId = 'cylinders';
          } else {
            partName = '200L ASME Section VIII Pressure Receiver Tank';
            partSpec = '200L Capacity • 16 bar Hydrotest Pressure • Pulsation Dampening Vessel';
            tempKey = 'bearingDE';
            vibKey = 'vibration';
            matchedZoneId = 'tank';
          }
        } else if (machineId === 'CNC-001' || machineType.includes('Milling')) {
          const y = hit.point.y;
          const z = hit.point.z;
          if (y > 1.2) {
            partName = 'Spindle Headstock & 3.7 kW Vector AC Motor Assembly';
            partSpec = 'ISO 40 Taper Spindle • 10,000 RPM Max • Hybrid Ceramic ABEC-7 Bearings • Runout < 1.2 µm';
            tempKey = 'bearingDE';
            vibKey = 'vibration';
            matchedZoneId = 'head';
          } else if (y >= -0.55 && y <= 0.35 && z > 0.0) {
            partName = 'T-Slot Precision Worktable (X/Y Axis) & Vise Interface';
            partSpec = '1270 × 254 mm Hardened Ground Table • C3 Preloaded Ball Screws • 0.001 mm Resolution';
            tempKey = 'bearingNDE';
            vibKey = 'vibration';
            matchedZoneId = 'table';
          } else if (y < -0.55 && y > -1.75) {
            partName = 'Heavy Vertical Knee & Elevating Lead Screw (Z-Axis)';
            partSpec = 'Heavy Meehanite Knee Casting • Telescopic Hydraulic Counterbalance • Z-Travel: 400 mm';
            tempKey = 'bearingNDE';
            vibKey = 'vibrationEnvelope';
            matchedZoneId = 'knee';
          } else if (y <= -1.75) {
            partName = 'Monoblock Foundation Base & Flood Coolant Sump';
            partSpec = '60L Sump Reservoir • Magnetic Swarf Strainer • Ground Vibration Leveling Pads';
            tempKey = 'ambientTemp';
            vibKey = 'vibration';
            matchedZoneId = 'base';
          } else {
            partName = 'Rigid Meehanite Column & Precision Dovetail Box Ways';
            partSpec = 'Heavy Ribbed Meehanite Casting • Hand-Scraped Turcite-B Guides • Ram Travel: 450 mm';
            tempKey = 'temperature';
            vibKey = 'vibrationEnvelope';
            matchedZoneId = 'column';
          }
        } else if (machineId === 'ROB-001' || machineType.includes('Robot')) {
          // Use decomposed sub-assembly userData if robot kinematics is active
          if (meshesRef.current.robotKinematics && hit.object.userData.isSubAssembly) {
            partName = hit.object.userData.partName || 'Robot Sub-Assembly';
            partSpec = hit.object.userData.partSpec || 'Industrial Robot Component';
            tempKey = hit.object.userData.tempSensor || 'temperature';
            vibKey = hit.object.userData.vibSensor || 'vibration';
            matchedZoneId = hit.object.userData.subKey || 'base-turntable';
          } else {
            // Fallback to virtual zone Z-range classification
            const z = hit.point.z;
            for (const zone of ROBOT_VIRTUAL_ZONES) {
              if (z >= zone.zMin && z < zone.zMax) {
                partName = zone.name;
                partSpec = zone.spec;
                tempKey = zone.tempSensor;
                vibKey = zone.vibSensor;
                matchedZoneId = zone.id;
                break;
              }
            }
            if (!matchedZoneId) {
              const baseZone = ROBOT_VIRTUAL_ZONES[ROBOT_VIRTUAL_ZONES.length - 1];
              partName = baseZone.name;
              partSpec = baseZone.spec;
              tempKey = baseZone.tempSensor;
              vibKey = baseZone.vibSensor;
              matchedZoneId = baseZone.id;
            }
          }
        } else if (machineId === 'P-101' || machineType.includes('Pump')) {
          const z = hit.point.z;
          for (const zone of PUMP_VIRTUAL_ZONES) {
            if (z >= zone.zMin && z < zone.zMax) {
              matchedZoneId = zone.id;
              if (!hit.object.userData.partName || hit.object.userData.partName.includes('Sub-Assembly')) {
                partName = zone.name;
                partSpec = zone.spec;
                tempKey = zone.tempSensor;
                vibKey = zone.vibSensor;
              }
              break;
            }
          }
          if (!matchedZoneId) {
            const baseZone = PUMP_VIRTUAL_ZONES[0];
            matchedZoneId = baseZone.id;
            if (!hit.object.userData.partName || hit.object.userData.partName.includes('Sub-Assembly')) {
              partName = baseZone.name;
              partSpec = baseZone.spec;
              tempKey = baseZone.tempSensor;
              vibKey = baseZone.vibSensor;
            }
          }
        }

        // Activate zone highlight effect
        setActiveZoneId(matchedZoneId);
        const zoneHighlights = meshesRef.current.zoneHighlights;
        if (zoneHighlights) {
          Object.values(zoneHighlights).forEach(({ mat, zone }) => {
            mat.opacity = zone.id === matchedZoneId ? 0.18 : 0;
          });
        }

        const tempVal = sensors[tempKey]?.value ? `${sensors[tempKey].value} ${sensors[tempKey].unit || '°C'}` : `${sensors?.temperature?.value || 42}°C`;
        const vibVal = sensors[vibKey]?.value ? `${sensors[vibKey].value} ${sensors[vibKey].unit || 'mm/s'}` : '1.2 mm/s';

        setInspectionTarget(partName);
        setInspectedPartData({
          name: partName,
          spec: partSpec,
          health: Math.max(75, health - Math.round(Math.random() * 5)),
          temp: tempVal,
          vibration: vibVal,
          zoneId: matchedZoneId,
          runout: machineId === 'CNC-001' ? `${sensors?.spindleRunout ?? 1.2} µm` : undefined,
          speed: machineId === 'CNC-001' ? `${sensors?.spindleSpeed ?? 4200} RPM` : undefined,
          feedRate: machineId === 'CNC-001' ? `${sensors?.feedRate ?? 650} mm/min` : undefined,
          spindleLoad: machineId === 'CNC-001' ? `${sensors?.spindleLoad ?? 62}%` : undefined,
          coolantPressure: machineId === 'CNC-001' ? `${sensors?.coolantPressure ?? 4.2} bar` : undefined,
          thermalDrift: machineId === 'CNC-001' ? `${sensors?.thermalDriftZ ?? 0} µm` : undefined,
          tcpVelocity: (machineId === 'ROB-001' || machineType.includes('Robot')) ? `${sensors?.tcpVelocity ?? 1250} mm/s` : undefined,
          payload: (machineId === 'ROB-001' || machineType.includes('Robot')) ? `${sensors?.activePayload ?? 142} kg (${sensors?.payloadRatio ?? 68}%)` : undefined,
          repeatability: (machineId === 'ROB-001' || machineType.includes('Robot')) ? `±${sensors?.repeatability ?? 0.03} mm` : undefined,
          gripperPressure: (machineId === 'ROB-001' || machineType.includes('Robot')) ? `${sensors?.gripperPressure ?? 6.2} bar` : undefined,
          cycleTime: (machineId === 'ROB-001' || machineType.includes('Robot')) ? `${sensors?.cycleTime ?? 14.2} s` : undefined,
          flowRate: (machineId === 'P-101' || machineType.includes('Pump')) ? `${sensors?.flowRate?.value ?? 48.5} L/s` : undefined,
          dischargePressure: (machineId === 'P-101' || machineType.includes('Pump')) ? `${sensors?.pressure?.value ?? 4.2} bar` : undefined,
          npshMargin: (machineId === 'P-101' || machineType.includes('Pump')) ? `+${sensors?.npshMargin?.value ?? 1.4} m` : undefined,
          sealPressure: (machineId === 'P-101' || machineType.includes('Pump')) ? `${sensors?.specifics?.sealChamberPressure ?? 3.8} bar` : undefined,
          tankPressure: (machineId === 'COMP-201' || machineType.includes('Compressor')) ? `${sensors?.tankPressure ?? 7.2} bar` : undefined,
          stage1Temp: (machineId === 'COMP-201' || machineType.includes('Compressor')) ? `${sensors?.stage1Temp ?? 68.2} °C` : undefined,
          airDelivery: (machineId === 'COMP-201' || machineType.includes('Compressor')) ? `${sensors?.airDeliveryFAD ?? 850} L/min` : undefined,
          beltTension: (machineId === 'COMP-201' || machineType.includes('Compressor')) ? `${sensors?.beltTension ?? 96}%` : undefined,
          dewPoint: (machineId === 'COMP-201' || machineType.includes('Compressor')) ? `${sensors?.dewPoint ?? 3.2} °C` : undefined,
        });
      }
    };

    const handlePointerMove = (e) => {
      if (shadingModeRef.current !== 'thermal') {
        if (hoverProbe) setHoverProbe(null);
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const rawIntersects = raycaster.intersectObjects(rootAssemblyGroup.children, true);
      const intersects = rawIntersects.filter(i => !i.object.userData.isZoneBox);
      const effectiveIntersects = intersects.length > 0 ? intersects : rawIntersects;

      if (effectiveIntersects.length > 0) {
        const hit = effectiveIntersects[0];
        const ambient = sensors?.ambientTemp?.value || 30;
        const probeResult = computeSurfaceTemperature(machineId, hit.point, sensors, ambient);

        setHoverProbe({
          temp: probeResult.temp,
          component: probeResult.nearestComponent,
          distance: probeResult.distanceToHotspot,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
          worldPos: [
            Math.round(hit.point.x * 10) / 10,
            Math.round(hit.point.y * 10) / 10,
            Math.round(hit.point.z * 10) / 10
          ]
        });
      } else {
        setHoverProbe(null);
      }
    };

    const handlePointerLeave = () => {
      setHoverProbe(null);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handleCanvasClick);
    domEl.addEventListener('mousemove', handlePointerMove);
    domEl.addEventListener('mouseleave', handlePointerLeave);

    // 5. Render & Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      controls.update();

      if (animObjects.impellerGroup) {
        animObjects.impellerGroup.rotation.x += 0.08;
      }
      if (animObjects.tool) {
        animObjects.tool.rotation.y += 0.2;
      }

      // ── CNC-001 & ROB-001 GLB Idle Animation ──────────────────────
      if (glbLoadedMesh && (machineId === 'CNC-001' || machineType.includes('Milling'))) {
        if (shadingModeRef.current !== 'exploded') {
          const microVib = Math.sin(elapsed * 60) * 0.0003;
          glbLoadedMesh.position.x = (-meshesRef.current.glbCenter?.x || 0) * (meshesRef.current.glbScale || 1) + microVib;
        }
      } else if (glbLoadedMesh && (machineId === 'ROB-001' || machineType.includes('Robot'))) {
        // Robot idle animation is now handled by robotKinematics updateRobotKinematics()
        // Only apply subtle whole-model oscillation if kinematics not available
        if (!meshesRef.current.robotKinematics && shadingModeRef.current !== 'exploded') {
          const armOsc = Math.sin(elapsed * 1.5) * 0.004;
          glbLoadedMesh.rotation.y = armOsc;
        }
      } else if (glbLoadedMesh && (machineId === 'P-101' || machineType.includes('Pump'))) {
        if (shadingModeRef.current !== 'exploded') {
          // Subtle high-frequency hydraulic running micro-vibration (49.2 Hz motor rotation)
          const pumpVib = Math.sin(elapsed * 50) * 0.00025;
          glbLoadedMesh.position.y = (meshesRef.current.groundedY || -0.6) + pumpVib;
        }
      } else if (glbLoadedMesh && (machineId === 'COMP-201' || machineType.includes('Compressor'))) {
        if (shadingModeRef.current !== 'exploded') {
          // Dual-stage reciprocating compression micro-pulse (24 Hz)
          const compPulse = Math.sin(elapsed * 48) * 0.0002;
          glbLoadedMesh.position.y = (meshesRef.current.groundedY || -2.19) + compPulse;
        }
      }

      // ── Zone Highlight Pulse Animation ───────────────────────────────
      const zoneHighlights = meshesRef.current.zoneHighlights;
      if (zoneHighlights) {
        Object.values(zoneHighlights).forEach(({ mat, zone }) => {
          if (mat.opacity > 0) {
            // Subtle breathing pulse on the active zone
            mat.opacity = 0.12 + Math.sin(elapsed * 3) * 0.06;
          }
        });
      }

      // Multi-part Exploded CAD View disassembly animation
      const isExploded = shadingModeRef.current === 'exploded';
      const targetExplode = isExploded ? 1.0 : 0.0;
      animObjects.explodeProgress = THREE.MathUtils.lerp(animObjects.explodeProgress || 0, targetExplode, 0.08);
      const ex = animObjects.explodeProgress;

      if (targetComponentMesh) {
        targetComponentMesh.position.y = isExploded ? 1.2 : 0;
      }

      const sm = meshesRef.current.compSubMeshes;
      if (sm && Object.keys(sm).length > 0) {
        // ── COMP-201 Air Compressor Kinematics & Exploded Disassembly ──
        if (meshesRef.current.compressorKinematics) {
          updateCompressorKinematics(
            meshesRef.current.compressorKinematics,
            elapsed,
            isExploded,
            ex,
            sensors,
            health
          );
        }

        // ── P-101 Centrifugal Pump Kinematics Updates ──
        if (meshesRef.current.pumpKinematics) {
          updateCentrifugalPumpKinematics(
            meshesRef.current.pumpKinematics,
            elapsed,
            isExploded,
            ex,
            sensors,
            health
          );
        }
      } else if (glbLoadedMesh && meshesRef.current.groundedY !== undefined) {
        // ROB-001 & procedural models virtual exploded view — move zone highlight boxes to show assembly separation
        const isCNC = !meshesRef.current.cncKinematics && (machineId === 'CNC-001' || machineType.includes('Milling'));
        const isPump = machineId === 'P-101' || machineType.includes('Pump');
        if (zoneHighlights && isExploded && !meshesRef.current.cncKinematics) {
          Object.values(zoneHighlights).forEach(({ mesh, zone }) => {
            const baseY = isCNC ? (zone.yMin + zone.yMax) / 2 : isPump ? -0.6 : 0.2;
            const baseZ = isCNC ? 0 : (zone.zMin + zone.zMax) / 2;
            mesh.position.x = zone.explodeOffset[0] * ex;
            mesh.position.y = baseY + zone.explodeOffset[1] * ex;
            mesh.position.z = baseZ + zone.explodeOffset[2] * ex;
            mesh.material.opacity = 0.15;
          });
        } else if (zoneHighlights && !isExploded && !meshesRef.current.cncKinematics) {
          // Reset zone positions
          Object.values(zoneHighlights).forEach(({ mesh, mat, zone }) => {
            const baseY = isCNC ? (zone.yMin + zone.yMax) / 2 : isPump ? -0.6 : 0.2;
            const baseZ = isCNC ? 0 : (zone.zMin + zone.zMax) / 2;
            mesh.position.x = 0;
            mesh.position.y = baseY;
            mesh.position.z = baseZ;
          });
        }
        if (!meshesRef.current.cncKinematics) {
          glbLoadedMesh.position.y = meshesRef.current.groundedY + (isExploded ? 0.6 : 0);
        }
      }

      // ── ROB-001 Robot Joint Kinematics & Exploded Disassembly ──
      if (meshesRef.current.robotKinematics) {
        updateRobotKinematics(
          meshesRef.current.robotKinematics,
          elapsed,
          isExploded,
          ex,
          sensors,
          health
        );
      }

      // ── CNC-001 Dynamic Spindle Rotation, Table Feeds & Exploded Disassembly ──
      if (meshesRef.current.cncKinematics) {
        updateCNCMillKinematics(
          meshesRef.current.cncKinematics,
          elapsed,
          isExploded,
          ex,
          sensors,
          health
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      domEl.removeEventListener('click', handleCanvasClick);
      domEl.removeEventListener('mousemove', handlePointerMove);
      domEl.removeEventListener('mouseleave', handlePointerLeave);
      controls.dispose();
      renderer.dispose();
    };
  }, [machineId, machineType]);

  // ── Spatial FEA Thermal Shader Material Management ───────────────────
  useEffect(() => {
    const { rootAssemblyGroup, faultMat, faultPointLight } = meshesRef.current;
    if (!rootAssemblyGroup) return;

    const ambient = sensors?.ambientTemp?.value || 30;
    const isCritical = health < 55 || (sensors?.temperature?.value || 40) > 65 || isSimulation;

    if (shadingMode === 'thermal') {
      // 1. Create or Update Three.js Spatial Heat Conduction Shader Material
      if (!meshesRef.current.thermalShaderMat) {
        meshesRef.current.thermalShaderMat = createThermalShaderMaterial(machineId, sensors, ambient);
      } else {
        updateThermalUniforms(meshesRef.current.thermalShaderMat, machineId, sensors, ambient);
      }

      const shaderMat = meshesRef.current.thermalShaderMat;

      rootAssemblyGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.userData.isZoneBox) {
            child.visible = false;
            return;
          }
          if (!child.userData.cadMaterial) {
            child.userData.cadMaterial = child.material;
          }
          child.material = shaderMat;
        }
      });

      if (faultPointLight) {
        faultPointLight.intensity = 0; // Shader produces realistic glow directly
      }

    } else {
      // 2. CAD or Exploded Shading Mode (Restore PBR Materials)
      rootAssemblyGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.userData.isZoneBox) {
            child.visible = true;
            return;
          }
          if (child.userData.cadMaterial) {
            child.material = child.userData.cadMaterial;
          }
        }
      });

      // Anomaly Fault Illumination
      if (faultMat) {
        if (isCritical) {
          faultMat.color.setHex(0xef4444);
          faultMat.emissive.setHex(0xef4444);
          faultMat.emissiveIntensity = 0.85 + Math.sin(Date.now() / 200) * 0.4;
          if (faultPointLight) {
            faultPointLight.color.setHex(0xef4444);
            faultPointLight.intensity = 4.0;
          }
        } else if (health < 80) {
          faultMat.color.setHex(0xf59e0b);
          faultMat.emissive.setHex(0xf59e0b);
          faultMat.emissiveIntensity = 0.35;
          if (faultPointLight) faultPointLight.intensity = 1.0;
        } else {
          faultMat.color.setHex(0x3b82f6);
          faultMat.emissive.setHex(0x000000);
          faultMat.emissiveIntensity = 0;
          if (faultPointLight) faultPointLight.intensity = 0;
        }
      }
    }
  }, [sensors, health, isSimulation, shadingMode, machineId]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
    }}>
      {/* 3D Canvas Mount (Spacious 480px) */}
      <div ref={mountRef} style={{ width: '100%', height: '480px', cursor: shadingMode === 'thermal' ? 'crosshair' : 'grab' }} />

      {/* Loading Overlay */}
      {loadingModel && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', zIndex: 20
        }}>
          <RefreshCw size={16} className="animate-spin" />
          Loading Industrial CAD Geometry ({machineId}.glb)...
        </div>
      )}

      {/* FLIR Ironbow Vertical Calibrated Thermal Legend Bar (Visible in Thermal Mode) */}
      {shadingMode === 'thermal' && (
        <div style={{
          position: 'absolute', top: '56px', left: '16px',
          background: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-md)', padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '12px', height: '180px', borderRadius: '4px',
            background: 'linear-gradient(to bottom, #fffdf2, #ea1020, #f55a0a, #f7d014, #10c538, #00adcf, #0547c7, #150a47)',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.3)'
          }} />

          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            height: '180px', fontSize: '10px', fontFamily: 'var(--font-mono)',
            color: '#e2e8f0', fontWeight: 700
          }}>
            <span style={{ color: '#ffffff' }}>75°C Overload</span>
            <span style={{ color: '#f87171' }}>65°C Hotspot</span>
            <span style={{ color: '#fb923c' }}>55°C Bearing Warm</span>
            <span style={{ color: '#facc15' }}>45°C Motor Load</span>
            <span style={{ color: '#4ade80' }}>35°C Table / Ways</span>
            <span style={{ color: '#67e8f9' }}>25°C Coolant Sump</span>
          </div>
        </div>
      )}

      {/* Floating Hover Crosshair Thermal Probe Tooltip */}
      {shadingMode === 'thermal' && hoverProbe && (
        <div style={{
          position: 'absolute',
          top: Math.min(370, Math.max(12, hoverProbe.screenY - 70)),
          left: Math.min(mountRef.current?.clientWidth ? mountRef.current.clientWidth - 260 : 500, Math.max(12, hoverProbe.screenX + 15)),
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          border: `1.5px solid ${hoverProbe.temp > 70 ? 'var(--status-critical)' : hoverProbe.temp > 55 ? 'var(--status-warning)' : 'var(--accent-cyan)'}`,
          borderRadius: 'var(--radius-md)', padding: '8px 12px',
          pointerEvents: 'none', zIndex: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800 }}>
            <Crosshair size={13} style={{ color: hoverProbe.temp > 70 ? '#f87171' : '#38bdf8' }} />
            <span>FLIR Proximity Probe:</span>
            <span style={{ color: hoverProbe.temp > 70 ? '#f87171' : hoverProbe.temp > 55 ? '#fbbf24' : '#34d399', fontSize: '13px' }}>
              {hoverProbe.temp}°C
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
            Zone: <strong style={{ color: '#e2e8f0' }}>{hoverProbe.component}</strong>
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Coord: [{hoverProbe.worldPos.join(', ')}] • {hoverProbe.distance}m to center
          </div>
        </div>
      )}

      {/* 3D Top-Right Toolbar Controls */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10
      }}>
        {/* Shading Mode Toggle Pill */}
        <div style={{
          display: 'flex', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-md)', padding: '3px',
          border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <button
            onClick={() => setShadingMode('cad')}
            style={{
              padding: '6px 12px', fontSize: '11px', fontWeight: 600,
              borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer',
              background: shadingMode === 'cad' ? 'var(--accent-blue)' : 'transparent',
              color: shadingMode === 'cad' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Box size={13} />
            PBR CAD
          </button>

          <button
            onClick={() => setShadingMode('thermal')}
            style={{
              padding: '6px 12px', fontSize: '11px', fontWeight: 600,
              borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer',
              background: shadingMode === 'thermal' ? 'var(--accent-amber)' : 'transparent',
              color: shadingMode === 'thermal' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Flame size={13} />
            FEA Thermal Heatmap
          </button>

          <button
            onClick={() => setShadingMode('exploded')}
            style={{
              padding: '6px 12px', fontSize: '11px', fontWeight: 600,
              borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer',
              background: shadingMode === 'exploded' ? 'var(--accent-purple)' : 'transparent',
              color: shadingMode === 'exploded' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={13} />
            Exploded CAD
          </button>
        </div>

        {/* Reset Camera Button */}
        <button
          onClick={() => {
            if (controlsRef.current && cameraRef.current) {
              controlsRef.current.reset();
              if (machineId === 'CNC-001' || machineType.includes('Milling') || machineType.includes('CNC')) {
                controlsRef.current.target.set(0, 0.35, 0);
                cameraRef.current.position.set(3.4, 2.2, 7.8);
                cameraRef.current.lookAt(0, 0.35, 0);
              } else if (machineId === 'ROB-001' || machineType.includes('Robot')) {
                controlsRef.current.target.set(0, 0.2, 0);
                cameraRef.current.position.set(4.5, 3.0, 6.8);
                cameraRef.current.lookAt(0, 0.2, 0);
              } else if (machineId === 'P-101' || machineType.includes('Pump')) {
                controlsRef.current.target.set(0, -0.6, 0);
                cameraRef.current.position.set(4.8, 2.2, 5.2);
                cameraRef.current.lookAt(0, -0.6, 0);
              } else if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
                controlsRef.current.target.set(0, 0.15, 0);
                cameraRef.current.position.set(0, 1.4, 6.8);
                cameraRef.current.lookAt(0, 0.15, 0);
              } else {
                cameraRef.current.position.set(0, 3.5, 10);
                cameraRef.current.lookAt(0, 0, 0);
              }
              controlsRef.current.update();
            }
          }}
          style={{
            padding: '8px 10px', borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Reset 360° Camera View"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Model Asset Source Badge (Top Left) */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        padding: '5px 12px', borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-subtle)',
        fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: modelTypeLoaded === 'glb' ? 'var(--status-healthy)' : 'var(--accent-blue)',
          boxShadow: modelTypeLoaded === 'glb' ? '0 0 6px rgba(5, 150, 105, 0.6)' : 'none'
        }} />
        <span>Source: {modelTypeLoaded === 'glb' ? `Industrial GLB (${machineId}.glb)` : 'Parametric CAD'}</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          {shadingMode === 'thermal' ? 'Hover surface to probe local temperature' : 'Orbit & Drag to rotate 360°'}
        </span>
      </div>

      {/* Dynamic Raycast Part Inspection Overlay (Bottom Floating Dock) */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px', right: '12px',
        padding: '9px 16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(12px)',
        border: `1px solid ${health < 55 ? 'var(--status-critical)' : 'var(--border-subtle)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: health < 55 ? 'var(--status-critical)' : health < 80 ? 'var(--status-warning)' : 'var(--status-healthy)',
            boxShadow: `0 0 8px ${health < 55 ? 'var(--status-critical)' : 'var(--status-healthy)'}`
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Inspection Focus:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{inspectionTarget}</span>
            {inspectedPartData?.spec && (
              <>
                <span style={{ color: 'var(--border-default)' }}>|</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inspectedPartData.spec}</span>
              </>
            )}
          </div>
        </div>

        {inspectedPartData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>Health: <strong style={{ color: 'var(--status-healthy)' }}>{inspectedPartData.health}%</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Local Temp: <strong style={{ color: 'var(--accent-amber)' }}>{inspectedPartData.temp}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>Vibration: <strong style={{ color: 'var(--accent-blue)' }}>{inspectedPartData.vibration}</strong></span>
            {inspectedPartData.speed && (
              <span style={{ color: 'var(--text-muted)' }}>Spindle: <strong style={{ color: 'var(--accent-blue)' }}>{inspectedPartData.speed}</strong></span>
            )}
            {inspectedPartData.runout && (
              <span style={{ color: 'var(--text-muted)' }}>Runout: <strong style={{ color: 'var(--status-healthy)' }}>{inspectedPartData.runout}</strong></span>
            )}
            {inspectedPartData.feedRate && (
              <span style={{ color: 'var(--text-muted)' }}>Feed: <strong style={{ color: 'var(--accent-blue)' }}>{inspectedPartData.feedRate}</strong></span>
            )}
            {inspectedPartData.spindleLoad && (
              <span style={{ color: 'var(--text-muted)' }}>Load: <strong style={{ color: 'var(--accent-amber)' }}>{inspectedPartData.spindleLoad}</strong></span>
            )}
            {inspectedPartData.thermalDrift && (
              <span style={{ color: 'var(--text-muted)' }}>Z-Drift: <strong style={{ color: 'var(--accent-amber)' }}>{inspectedPartData.thermalDrift}</strong></span>
            )}
            {inspectedPartData.flowRate && (
              <span style={{ color: 'var(--text-muted)' }}>Flow: <strong style={{ color: 'var(--accent-blue)' }}>{inspectedPartData.flowRate}</strong></span>
            )}
            {inspectedPartData.dischargePressure && (
              <span style={{ color: 'var(--text-muted)' }}>Press: <strong style={{ color: 'var(--accent-cyan)' }}>{inspectedPartData.dischargePressure}</strong></span>
            )}
            {inspectedPartData.tankPressure && (
              <span style={{ color: 'var(--text-muted)' }}>Tank Press: <strong style={{ color: 'var(--accent-blue)' }}>{inspectedPartData.tankPressure}</strong></span>
            )}
            {inspectedPartData.stage1Temp && (
              <span style={{ color: 'var(--text-muted)' }}>Stage 1: <strong style={{ color: 'var(--accent-amber)' }}>{inspectedPartData.stage1Temp}</strong></span>
            )}
            {inspectedPartData.airDelivery && (
              <span style={{ color: 'var(--text-muted)' }}>FAD: <strong style={{ color: 'var(--status-healthy)' }}>{inspectedPartData.airDelivery}</strong></span>
            )}
            {inspectedPartData.beltTension && (
              <span style={{ color: 'var(--text-muted)' }}>Belt: <strong style={{ color: 'var(--accent-cyan)' }}>{inspectedPartData.beltTension}</strong></span>
            )}
            {inspectedPartData.dewPoint && (
              <span style={{ color: 'var(--text-muted)' }}>Dew Point: <strong style={{ color: 'var(--status-healthy)' }}>{inspectedPartData.dewPoint}</strong></span>
            )}
            {inspectedPartData.npshMargin && (
              <span style={{ color: 'var(--text-muted)' }}>NPSH Margin: <strong style={{ color: 'var(--status-healthy)' }}>{inspectedPartData.npshMargin}</strong></span>
            )}
            {inspectedPartData.sealPressure && (
              <span style={{ color: 'var(--text-muted)' }}>Seal Press: <strong style={{ color: 'var(--text-primary)' }}>{inspectedPartData.sealPressure}</strong></span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Click 3D mesh to inspect virtual sub-assembly zones
          </div>
        )}
      </div>
    </div>
  );
}
