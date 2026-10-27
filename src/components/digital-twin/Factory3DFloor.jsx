import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useNavigate } from 'react-router-dom';
import { MACHINES, generateSensorData } from '../../data/factoryData';
import {
  ChevronRight, Activity, RotateCcw, Box, Compass,
  Waves, Cog, Wind, ArrowRight, Zap, Thermometer, Bot,
  Layers, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { applyCentrifugalPumpPBR, setupCentrifugalPumpKinematics } from './centrifugalPumpPBR';

const MACHINE_POSITIONS = {
  'P-101': {
    x: -9, z: -3,
    label: 'Pump Room Station',
    zone: 'Pump Room',
    icon: Waves,
  },
  'CNC-001': {
    x: -5, z: 5,
    label: 'Vertical Milling Bay',
    zone: 'CNC Shop',
    icon: Cog,
  },
  'COMP-201': {
    x: 6, z: 5,
    label: 'Compressor Bay',
    zone: 'Compressor Room',
    icon: Wind,
  },
  'ROB-001': {
    x: 0, z: -0.5,
    label: 'Robotic Automation Bay',
    zone: 'Robotic Cell',
    icon: Bot,
  },
  'CONV-401': {
    x: -6, z: -7,
    label: 'Logistics Conveyor Line',
    zone: 'Conveyor Line',
    icon: ArrowRight,
  },
  'XFMR-302': {
    x: 9, z: -3,
    label: 'Main Power Distribution',
    zone: 'Utilities',
    icon: Zap,
  },
};

/**
 * Creates a high-DPI floating billboard sprite displaying machine ID,
 * health score, and operational status above each station on the shop floor.
 */
function createStationBillboard(machineId, name, health, status) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  // Background white card with soft shadow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.beginPath();
  const x = 10, y = 10, w = 380, h = 120, r = 18;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Status outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
  ctx.stroke();

  // Status indicator dot
  ctx.beginPath();
  ctx.arc(42, 48, 12, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();

  // Machine ID
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(machineId, 66, 58);

  // Health % badge on right
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillStyle = status === 'critical' ? '#dc2626' : status === 'warning' ? '#d97706' : '#16a34a';
  ctx.fillText(`${health}%`, 280, 58);

  // Subtitle (Machine Type/Zone)
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  const truncated = name.length > 25 ? name.substring(0, 23) + '...' : name;
  ctx.fillText(truncated, 28, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.0, 1.05, 1);
  return sprite;
}

// ── Real Machine 3D Procedural CAD Builders ──────────────────────────

/** P-101: Industrial KSB Centrifugal Pump with Volute, Flanges & TEFC Motor */
function buildPumpModel() {
  const group = new THREE.Group();
  const pumpBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
  const guardYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.3 });
  const baseGrey = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });

  // Channel steel baseplate
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 1.4), baseGrey);
  baseMesh.position.y = 0.08;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // TEFC Electric Motor (Left side)
  const motorMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24), pumpBlue);
  motorMesh.rotation.z = Math.PI / 2;
  motorMesh.position.set(-0.9, 0.75, 0);
  motorMesh.castShadow = true;
  group.add(motorMesh);

  // Motor cooling fins
  for (let i = -0.5; i <= 0.5; i += 0.15) {
    const fin = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.02, 8, 24), pumpBlue);
    fin.rotation.y = Math.PI / 2;
    fin.position.set(-0.9 + i, 0.75, 0);
    group.add(fin);
  }

  // Motor terminal junction box
  const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.3), steelMat);
  jbox.position.set(-0.9, 1.4, 0);
  group.add(jbox);

  // Coupling & OSHA Safety Guard (Center)
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 20), guardYellow);
  guard.rotation.z = Math.PI / 2;
  guard.position.set(0.1, 0.75, 0);
  guard.castShadow = true;
  group.add(guard);

  // Bearing Housing / Pedestal
  const bearing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.6), baseGrey);
  bearing.position.set(0.55, 0.6, 0);
  group.add(bearing);

  // Volute Casing (Right side hydraulic scroll)
  const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.6, 24), pumpBlue);
  volute.rotation.z = Math.PI / 2;
  volute.position.set(1.15, 0.75, 0);
  volute.castShadow = true;
  group.add(volute);

  // Axial Suction Flange (Inlet right)
  const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 20), steelMat);
  suction.rotation.z = Math.PI / 2;
  suction.position.set(1.65, 0.75, 0);
  group.add(suction);

  const suctionFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.1, 20), steelMat);
  suctionFlange.rotation.z = Math.PI / 2;
  suctionFlange.position.set(1.85, 0.75, 0);
  group.add(suctionFlange);

  // Vertical Discharge Flange (Outlet top)
  const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 20), steelMat);
  discharge.position.set(1.15, 1.5, 0);
  group.add(discharge);

  const dischargeFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.1, 20), steelMat);
  dischargeFlange.position.set(1.15, 1.75, 0);
  group.add(dischargeFlange);

  return group;
}

/** CNC-001: DMG Mori CNC Vertical Machining Center with Enclosure & Spindle */
function buildCNCModel() {
  const group = new THREE.Group();
  const frameDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
  const panelWhite = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.4, roughness: 0.1, transmission: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

  // Main machine body enclosure
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 2.2), panelWhite);
  body.position.y = 1.25;
  body.castShadow = true;
  group.add(body);

  // Cast-iron heavy base skirt
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.3), frameDark);
  base.position.y = 0.15;
  group.add(base);

  // Acrylic safety viewing window in front
  const windowPane = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.08), glassMat);
  windowPane.position.set(0, 1.4, 1.12);
  group.add(windowPane);

  // Internal Spindle Column
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.1, 20), steelMat);
  spindle.position.set(0, 1.5, 0.2);
  group.add(spindle);

  // Tool bit / chuck
  const tool = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 16), steelMat);
  tool.rotation.x = Math.PI;
  tool.position.set(0, 0.82, 0.2);
  group.add(tool);

  // T-slot Work Table inside
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 0.9), frameDark);
  table.position.set(0, 0.65, 0.2);
  group.add(table);

  // Operator Control Arm & CNC Screen
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), steelMat);
  arm.position.set(1.4, 1.6, 0.8);
  arm.rotation.z = Math.PI / 4;
  group.add(arm);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), frameDark);
  screen.position.set(1.65, 1.9, 0.9);
  screen.rotation.y = -Math.PI / 6;
  group.add(screen);

  // Andon Status Light Tower on roof (Green/Running)
  const andonPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), steelMat);
  andonPole.position.set(-1.0, 2.65, -0.8);
  group.add(andonPole);

  const andonLight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.15),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  );
  andonLight.position.set(-1.0, 2.9, -0.8);
  group.add(andonLight);

  return group;
}

/** CONV-401: Industrial Logistics Belt Conveyor with Rollers & Geared Motor */
function buildConveyorModel() {
  const group = new THREE.Group();
  const railAlum = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const beltRubber = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
  const motorBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
  const rollerSteel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 });

  // Dual extruded aluminum guide rails (Length 3.6m)
  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 0.06), railAlum);
  rail1.position.set(0, 0.85, 0.55);
  rail1.castShadow = true;
  group.add(rail1);

  const rail2 = rail1.clone();
  rail2.position.set(0, 0.85, -0.55);
  group.add(rail2);

  // Main PVC / Rubber Conveyor Belt
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 1.0), beltRubber);
  beltTop.position.set(0, 0.88, 0);
  beltTop.castShadow = true;
  beltTop.receiveShadow = true;
  group.add(beltTop);

  const beltBottom = beltTop.clone();
  beltBottom.position.set(0, 0.72, 0);
  group.add(beltBottom);

  // End Rollers / Drums
  const rollerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.05, 20), rollerSteel);
  rollerLeft.rotation.x = Math.PI / 2;
  rollerLeft.position.set(-1.7, 0.8, 0);
  group.add(rollerLeft);

  const rollerRight = rollerLeft.clone();
  rollerRight.position.set(1.7, 0.8, 0);
  group.add(rollerRight);

  // Support Legs (4 Stanchions with foot pads)
  for (let x of [-1.3, 1.3]) {
    for (let z of [-0.5, 0.5]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75), railAlum);
      leg.position.set(x, 0.38, z);
      leg.castShadow = true;
      group.add(leg);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04), beltRubber);
      foot.position.set(x, 0.02, z);
      group.add(foot);
    }
  }

  // Cross brace
  const brace = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.04), railAlum);
  brace.position.set(0, 0.35, 0);
  group.add(brace);

  // Geared Drive Motor mounted on side of drive roller
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16), motorBlue);
  motor.rotation.x = Math.PI / 2;
  motor.position.set(1.7, 0.8, 0.8);
  group.add(motor);

  const gearbox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.2), railAlum);
  gearbox.position.set(1.7, 0.8, 0.6);
  group.add(gearbox);

  // Transported items on conveyor (2 industrial parcels)
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), boxMat);
  box1.position.set(-0.6, 1.08, 0.05);
  box1.castShadow = true;
  group.add(box1);

  const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.35), boxMat);
  box2.position.set(0.7, 1.05, -0.08);
  box2.castShadow = true;
  group.add(box2);

  return group;
}

/** XFMR-302: ABB 1000kVA High-Voltage Oil-Filled Distribution Transformer */
function buildTransformerModel() {
  const group = new THREE.Group();
  const tankGrey = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 });
  const finMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
  const bushingBrown = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.2, metalness: 0.1 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

  // Main oil-filled welded tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.4), tankGrey);
  tank.position.y = 0.95;
  tank.castShadow = true;
  group.add(tank);

  // Base skid rails
  const skid1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.15), tankGrey);
  skid1.position.set(0, 0.06, 0.55);
  group.add(skid1);

  const skid2 = skid1.clone();
  skid2.position.set(0, 0.06, -0.55);
  group.add(skid2);

  // Corrugated Radiator Cooling Fin Banks (Front & Back)
  for (let z of [0.82, -0.82]) {
    for (let x = -0.7; x <= 0.7; x += 0.2) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 0.24), finMat);
      fin.position.set(x, 0.95, z);
      group.add(fin);
    }
  }

  // Cylindrical Oil Conservator Drum (Mounted on top)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 20), tankGrey);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, 2.05, -0.35);
  drum.castShadow = true;
  group.add(drum);

  // 3 High-Voltage Ceramic Fluted Bushings on top
  for (let x of [-0.45, 0, 0.45]) {
    const bushingGroup = new THREE.Group();
    bushingGroup.position.set(x, 1.75, 0.35);

    // Fluted ceramic cones
    const b1 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 16), bushingBrown);
    b1.position.y = 0.22;
    bushingGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 16), bushingBrown);
    b2.position.y = 0.5;
    bushingGroup.add(b2);

    // Brass electrode terminal
    const terminal = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25), brassMat);
    terminal.position.y = 0.78;
    bushingGroup.add(terminal);

    group.add(bushingGroup);
  }

  // Marshalling & terminal control cabinet on side
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.6), tankGrey);
  cabinet.position.set(0.98, 1.0, 0);
  group.add(cabinet);

  return group;
}

export function Factory3DFloor() {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const [selectedMachine, setSelectedMachine] = useState('P-101');
  const [telemetry, setTelemetry] = useState(() => generateSensorData('P-101'));
  
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraTargetPos = useRef(new THREE.Vector3(0, 18, 25));
  const controlsTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  // Update telemetry for selected machine
  useEffect(() => {
    setTelemetry(generateSensorData(selectedMachine));
    const interval = setInterval(() => {
      setTelemetry(generateSensorData(selectedMachine));
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedMachine]);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 900;
    const height = 490;

    // 1. Scene, Camera, Renderer (Pure Industrial Light Theme)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Cleanroom slate-50
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 490;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip through floor
    controls.minDistance = 4;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // 3. Balanced 4-Point Daylight Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
    sunLight.position.set(18, 30, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-18, 18, -18);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.35);
    rimLight.position.set(0, 14, -24);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.4);
    scene.add(hemiLight);

    // 4. Factory Floor - Light Industrial Polished Epoxy
    const floorGeo = new THREE.PlaneGeometry(42, 34);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.08
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Architectural Grid Overlay
    const gridHelper = new THREE.GridHelper(42, 42, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = 0.015;
    scene.add(gridHelper);

    // Safety Walkways (High-Visibility Safety Amber Markings)
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    
    // Main longitudinal walkway lines
    const mainWalkGeo = new THREE.PlaneGeometry(36, 0.16);
    const mainLine1 = new THREE.Mesh(mainWalkGeo, yellowMat);
    mainLine1.rotation.x = -Math.PI / 2;
    mainLine1.position.set(0, 0.025, 1.4);
    scene.add(mainLine1);

    const mainLine2 = mainLine1.clone();
    mainLine2.position.set(0, 0.025, -1.4);
    scene.add(mainLine2);

    // Cross walkway lines
    const crossWalkGeo = new THREE.PlaneGeometry(0.16, 28);
    const crossLine1 = new THREE.Mesh(crossWalkGeo, yellowMat);
    crossLine1.rotation.x = -Math.PI / 2;
    crossLine1.position.set(-1.4, 0.025, 0);
    scene.add(crossLine1);

    const crossLine2 = crossLine1.clone();
    crossLine2.position.set(1.4, 0.025, 0);
    scene.add(crossLine2);

    // 5. Build 5 Machine Stations & Load Real Authentic Models
    const beaconRings = [];
    const rotatingElements = [];
    const billboardSprites = [];
    const loader = new GLTFLoader();

    Object.entries(MACHINES).forEach(([id, machine]) => {
      const pos = MACHINE_POSITIONS[id] || { x: 0, z: 0, label: machine.name };
      const stationGroup = new THREE.Group();
      stationGroup.position.set(pos.x, 0, pos.z);
      stationGroup.userData = { machineId: id };

      // Station Cleanroom White Concrete Foundation Plinth
      const pedestalGeo = new THREE.BoxGeometry(4.0, 0.28, 4.0);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.05
      });
      const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestalMesh.position.y = 0.14;
      pedestalMesh.receiveShadow = true;
      pedestalMesh.castShadow = true;
      pedestalMesh.userData = { machineId: id };
      stationGroup.add(pedestalMesh);

      // Station Safety Demarcation Perimeter Border on Floor
      const bTop = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.1), yellowMat);
      bTop.rotation.x = -Math.PI / 2;
      bTop.position.set(0, 0.02, 2.2);
      stationGroup.add(bTop);

      const bBottom = bTop.clone();
      bBottom.position.set(0, 0.02, -2.2);
      stationGroup.add(bBottom);

      const bLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 4.4), yellowMat);
      bLeft.rotation.x = -Math.PI / 2;
      bLeft.position.set(-2.2, 0.02, 0);
      stationGroup.add(bLeft);

      const bRight = bLeft.clone();
      bRight.position.set(2.2, 0.02, 0);
      stationGroup.add(bRight);

      // Build Machine Model:
      // For COMP-201, load the real GLB CAD air compressor model provided by user!
      // For P-101, CNC-001, CONV-401, XFMR-302, build authentic real industrial CAD assemblies!
      if (id === 'COMP-201') {
        loader.load(
          `${import.meta.env.BASE_URL}models/COMP-201.glb`,
          (gltf) => {
            const model = gltf.scene;
            model.name = `realModel_COMP-201`;

            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 2.8 / maxDim;

            model.scale.set(scale, scale, scale);
            const groundedY = 0.28 - (bbox.min.y * scale);
            model.position.set(-center.x * scale, groundedY, -center.z * scale);
            model.rotation.y = -Math.PI / 3;

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.machineId = id;

                if (child.name.includes('Wheel__0')) {
                  child.geometry.computeBoundingBox();
                  const c = child.geometry.boundingBox.getCenter(new THREE.Vector3());
                  child.geometry.translate(-c.x, -c.y, -c.z);
                  child.position.add(c);
                  rotatingElements.push({ mesh: child, axis: 'y', speed: 0.04, machineId: id });
                } else if (child.name.includes('Engine_Drive_Shaft__0')) {
                  child.geometry.computeBoundingBox();
                  const c = child.geometry.boundingBox.getCenter(new THREE.Vector3());
                  child.geometry.translate(-c.x, -c.y, -c.z);
                  child.position.add(c);
                  rotatingElements.push({ mesh: child, axis: 'y', speed: 0.04 * 4.86, machineId: id });
                }
              }
            });

            stationGroup.add(model);
          },
          undefined,
          (err) => {
            console.warn(`Could not load COMP-201.glb:`, err);
          }
        );
      } else if (id === 'P-101') {
        loader.load(
          `${import.meta.env.BASE_URL}models/P-101.glb`,
          (gltf) => {
            const model = gltf.scene;
            model.name = `realModel_P-101`;

            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 2.8 / maxDim;

            const wrapper = new THREE.Group();
            model.scale.set(scale, scale, scale);
            const groundedY = 0.28 - (bbox.min.y * scale);
            model.position.set(-center.x * scale, groundedY, -center.z * scale);
            wrapper.add(model);
            wrapper.rotation.y = Math.PI / 4; // Angled 45° towards aisle for optimal 3D perspective

            const compSubMeshes = {};
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.machineId = id;
                compSubMeshes[child.name] = child;
              }
            });

            applyCentrifugalPumpPBR(model);
            const pumpKin = setupCentrifugalPumpKinematics(model, compSubMeshes);
            if (pumpKin && pumpKin.rotatingAssembly) {
              rotatingElements.push({
                mesh: pumpKin.rotatingAssembly,
                axis: 'z',
                speed: 0.12,
                machineId: 'P-101'
              });
            }

            stationGroup.add(wrapper);
          },
          undefined,
          (err) => {
            console.warn(`Could not load P-101.glb:`, err);
            const pump = buildPumpModel();
            pump.position.y = 0.28;
            pump.rotation.y = Math.PI / 4;
            stationGroup.add(pump);
          }
        );
      } else if (id === 'CNC-001') {
        loader.load(
          `${import.meta.env.BASE_URL}models/CNC-001.glb`,
          (gltf) => {
            const model = gltf.scene;
            model.name = `realModel_CNC-001`;

            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 3.2 / maxDim;

            const wrapper = new THREE.Group();
            model.scale.set(scale, scale, scale);
            const groundedY = 0.28 - (bbox.min.y * scale);
            model.position.set(-center.x * scale, groundedY, -center.z * scale);
            wrapper.add(model);
            wrapper.rotation.y = -Math.PI / 4; // Angled facing the walkway for optimal visibility

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.machineId = id;
              }
            });

            stationGroup.add(wrapper);
          },
          undefined,
          (err) => {
            console.warn(`Could not load CNC-001.glb:`, err);
            const cnc = buildCNCModel();
            cnc.position.y = 0.28;
            stationGroup.add(cnc);
          }
        );
      } else if (id === 'ROB-001') {
        loader.load(
          `${import.meta.env.BASE_URL}models/ROB-001.glb`,
          (gltf) => {
            const model = gltf.scene;
            model.name = `realModel_ROB-001`;

            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 3.0 / maxDim;

            const wrapper = new THREE.Group();
            model.scale.set(scale, scale, scale);
            const groundedY = 0.28 - (bbox.min.y * scale);
            model.position.set(-center.x * scale, groundedY, -center.z * scale);
            wrapper.add(model);
            wrapper.rotation.y = -Math.PI / 2; // Facing the aisle

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.machineId = id;
              }
            });

            stationGroup.add(wrapper);
          },
          undefined,
          (err) => {
            console.warn(`Could not load ROB-001.glb:`, err);
          }
        );
      } else if (id === 'CONV-401') {
        const conveyor = buildConveyorModel();
        conveyor.position.y = 0.28;
        conveyor.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.machineId = id;
          }
        });
        stationGroup.add(conveyor);
      } else {
        const xfmr = buildTransformerModel();
        xfmr.position.y = 0.28;
        xfmr.rotation.y = -Math.PI / 4;
        xfmr.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.machineId = id;
          }
        });
        stationGroup.add(xfmr);
      }

      // Floating Compact Status Beacon Ring at Pedestal Base
      const statusColor = machine.status === 'critical' ? 0xef4444
        : machine.status === 'warning' ? 0xf59e0b : 0x10b981;

      const ringGeo = new THREE.TorusGeometry(1.6, 0.03, 16, 32);
      ringGeo.rotateX(Math.PI / 2);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: statusColor,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeo, beaconMat);
      ringMesh.position.y = 0.29;
      ringMesh.userData = { machineId: id };
      stationGroup.add(ringMesh);
      beaconRings.push(ringMesh);

      // Status Point Light
      const beaconLight = new THREE.PointLight(statusColor, machine.status === 'critical' ? 2.0 : 1.0, 5);
      beaconLight.position.y = 1.6;
      stationGroup.add(beaconLight);

      // Floating 3D Billboard Label
      const labelSprite = createStationBillboard(id, machine.name, machine.health, machine.status);
      labelSprite.position.set(0, 3.4, 0);
      labelSprite.userData = { machineId: id };
      stationGroup.add(labelSprite);
      billboardSprites.push({ sprite: labelSprite, worldPos: new THREE.Vector3(pos.x, 3.4, pos.z) });

      scene.add(stationGroup);
    });

    // 6. Interactive Raycasting Machine Selection on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData?.machineId) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.machineId) {
          const machId = parent.userData.machineId;
          setSelectedMachine(machId);

          const pos = MACHINE_POSITIONS[machId];
          if (pos) {
            cameraTargetPos.current.set(pos.x + 4.2, 3.8, pos.z + 4.8);
            controlsTarget.current.set(pos.x, 1.1, pos.z);
            isTransitioning.current = true;
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera glide towards selected machine
      if (isTransitioning.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08);
        controls.target.lerp(controlsTarget.current, 0.08);
        if (camera.position.distanceTo(cameraTargetPos.current) < 0.05) {
          isTransitioning.current = false;
        }
      }

      controls.update();

      // Subtle pulse on status rings
      beaconRings.forEach((ring, idx) => {
        ring.rotation.z += 0.01;
        const scalePulse = 1.0 + Math.sin(elapsed * 2.0 + idx) * 0.04;
        ring.scale.set(scalePulse, scalePulse, scalePulse);
      });

      // Proximity-based smooth billboard transparency (fades completely when focused to prevent occlusion)
      billboardSprites.forEach(({ sprite, worldPos }) => {
        const dist = camera.position.distanceTo(worldPos);
        if (dist < 12.0) {
          sprite.material.opacity = Math.max(0.0, (dist - 7.0) / 5.0);
        } else {
          sprite.material.opacity = 0.95;
        }
      });

      // Animate rotating subcomponents on running machines
      rotatingElements.forEach((el) => {
        const mach = MACHINES[el.machineId];
        if (mach && mach.status !== 'stopped') {
          if (el.axis === 'x') el.mesh.rotation.x += el.speed;
          else if (el.axis === 'y') el.mesh.rotation.y += el.speed;
          else el.mesh.rotation.z += el.speed;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const activeMachine = MACHINES[selectedMachine] || MACHINES['P-101'];
  const activePosition = MACHINE_POSITIONS[selectedMachine];
  const ActiveIcon = activePosition?.icon || Box;

  // Camera Navigation Handlers
  const handleSelectMachine = (machId) => {
    setSelectedMachine(machId);
    if (machId === 'all') {
      cameraTargetPos.current.set(0, 18, 25);
      controlsTarget.current.set(0, 0, 0);
    } else {
      const pos = MACHINE_POSITIONS[machId];
      if (pos) {
        cameraTargetPos.current.set(pos.x + 3.8, 3.4, pos.z + 4.2);
        controlsTarget.current.set(pos.x, 1.0, pos.z);
      }
    }
    isTransitioning.current = true;
  };

  const handleResetCamera = () => {
    handleSelectMachine('all');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-default)',
      background: '#f8fafc'
    }}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '490px', cursor: 'grab' }} />

      {/* Top Controls Overlay (Light Theme Frosted Glass) */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', right: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '10px', pointerEvents: 'none'
      }}>
        {/* Plant Floor Legend Badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08)',
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(37, 99, 235, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-blue)'
          }}>
            <Compass size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              3D Smart Factory Floor • Spatial Digital Twin
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any machine cell to inspect CAD model • Orbit 360°
            </div>
          </div>
        </div>

        {/* Machine Quick Jump Station Selector Ribbon */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08)',
          pointerEvents: 'auto',
          overflowX: 'auto'
        }}>

          {Object.entries(MACHINE_POSITIONS).map(([id, meta]) => {
            const isSelected = selectedMachine === id;
            const mach = MACHINES[id];
            const statusColor = mach?.status === 'critical' ? 'var(--status-critical)'
              : mach?.status === 'warning' ? 'var(--accent-amber)' : 'var(--accent-emerald)';

            return (
              <button
                key={id}
                onClick={() => handleSelectMachine(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: statusColor
                }} />
                <span>{id}</span>
              </button>
            );
          })}

          <button
            onClick={handleResetCamera}
            title="Reset to overhead factory floor view"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              background: '#f8fafc',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Bottom Selected Machine HUD Card (Light Theme Frosted Glass) */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '16px', right: '16px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px 22px',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px'
      }}>
        {/* Left Machine Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: activeMachine.status === 'critical' ? 'rgba(239, 68, 68, 0.1)'
              : activeMachine.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(37, 99, 235, 0.08)',
            border: `1px solid ${activeMachine.status === 'critical' ? 'rgba(239, 68, 68, 0.3)'
              : activeMachine.status === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activeMachine.status === 'critical' ? 'var(--status-critical)'
              : activeMachine.status === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)'
          }}>
            <ActiveIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeMachine.name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                padding: '2px 8px', borderRadius: '6px',
                background: '#f1f5f9', color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}>
                {activeMachine.id}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px',
                background: activeMachine.status === 'critical' ? '#fee2e2'
                  : activeMachine.status === 'warning' ? '#fef3c7' : '#dcfce7',
                color: activeMachine.status === 'critical' ? '#b91c1c'
                  : activeMachine.status === 'warning' ? '#b45309' : '#15803d',
                border: `1px solid ${activeMachine.status === 'critical' ? '#fca5a5'
                  : activeMachine.status === 'warning' ? '#fde68a' : '#86efac'}`,
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>
                {activeMachine.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Station: {activePosition?.label} • {activeMachine.manufacturer} {activeMachine.model}
            </div>
          </div>
        </div>

        {/* Center Live Telemetry Gauges Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Health Index */}
          <div style={{
            background: '#f8fafc', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Health Index
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700,
              color: activeMachine.health >= 80 ? 'var(--status-healthy)'
                : activeMachine.health >= 50 ? 'var(--status-warning)' : 'var(--status-critical)'
            }}>
              {activeMachine.health}%
            </div>
          </div>

          {/* Temperature */}
          <div style={{
            background: '#f8fafc', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Thermometer size={11} />
              <span>Temp</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)'
            }}>
              {telemetry?.temperature?.value ?? 42.0}°C
            </div>
          </div>

          {/* Vibration */}
          <div style={{
            background: '#f8fafc', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Activity size={11} />
              <span>Vibration</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700,
              color: (telemetry?.vibration?.value ?? 1.5) > 4.5 ? 'var(--status-critical)' : 'var(--text-primary)'
            }}>
              {telemetry?.vibration?.value ?? 1.45} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>mm/s</span>
            </div>
          </div>

          {/* Machine Specific Key Telemetry */}
          <div style={{
            background: '#f8fafc', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedMachine === 'COMP-201' ? 'Air Pressure'
                : selectedMachine === 'P-101' ? 'Pump Flow'
                : selectedMachine === 'CNC-001' ? 'Spindle Runout'
                : selectedMachine === 'ROB-001' ? 'Active Payload'
                : selectedMachine === 'CONV-401' ? 'Belt Tension'
                : 'Transformer Oil'}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700, color: 'var(--accent-blue)'
            }}>
              {selectedMachine === 'COMP-201' ? `${telemetry?.tankPressure ?? 7.2} bar`
                : selectedMachine === 'P-101' ? `${telemetry?.npshMargin ?? 1.8}m NPSH`
                : selectedMachine === 'CNC-001' ? `${telemetry?.spindleRunout ?? 1.2} µm`
                : selectedMachine === 'ROB-001' ? `${telemetry?.activePayload ?? 142} kg`
                : selectedMachine === 'CONV-401' ? `${telemetry?.beltTension ?? 98}%`
                : `${telemetry?.topOilTemp ?? 45}°C`}
            </div>
          </div>

          {selectedMachine === 'CNC-001' && (
            <div style={{
              background: '#f8fafc', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Spindle Speed
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700, color: 'var(--accent-blue)'
              }}>
                {telemetry?.spindleSpeed ?? 4200} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RPM</span>
              </div>
            </div>
          )}

          {selectedMachine === 'ROB-001' && (
            <div style={{
              background: '#f8fafc', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '6px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                TCP Velocity
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '17px', fontWeight: 700, color: 'var(--accent-blue)'
              }}>
                {telemetry?.tcpVelocity ?? 1250} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>mm/s</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Deep Dive Button */}
        <button
          onClick={() => navigate(`/digital-twin/${activeMachine.id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-blue)', border: 'none', color: '#ffffff',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>Open Digital Twin Deep Dive</span>
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
