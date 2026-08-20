import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, RotateCcw, AlertTriangle, ShieldCheck, Cpu, Box, Wrench } from 'lucide-react';

export function Machine3DViewer({ machine, sensors, health = 85, isSimulation = false }) {
  const mountRef = useRef(null);
  const [exploded, setExploded] = useState(false);
  const [inspectionTarget, setInspectionTarget] = useState('Primary Sub-Assembly Component');

  const sceneRef = useRef(null);
  const meshesRef = useRef({});
  const animationFrameRef = useRef(null);
  const explodedRef = useRef(false);

  const machineId = machine?.id || 'P-101';
  const machineType = machine?.type || 'Centrifugal Pump';

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    const width = mountRef.current.clientWidth || 550;
    const height = 340;

    // 1. WebGL Scene, Camera & Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4.0, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2563eb, 1.4);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 0.8);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xdc2626, 0, 15);
    pointLight.position.set(0, 1, 0);
    scene.add(pointLight);

    // Light Theme Grid Floor
    const gridHelper = new THREE.GridHelper(20, 20, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // High-PBR Industrial Materials
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1 });

    // Dynamic Critical Fault Material (GLOWS RED ON FAILURE)
    const faultMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x000000,
      metalness: 0.8,
      roughness: 0.2
    });

    const assemblyGroup = new THREE.Group();
    const animObjects = {};
    let targetComponentMesh = null;

    // ── HIGH-FIDELITY PARAMETRIC 3D CAD BUILDER ─────────────────────────

    if (machineId === 'P-101' || machineType.includes('Pump')) {
      // ===== 1. CENTRIFUGAL PUMP ASSEMBLY (P-101) =====
      setInspectionTarget('SKF 6205 Bearing Housing');

      // A. Electric Motor (15kW)
      const motorGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.8, 32);
      motorGeo.rotateZ(Math.PI / 2);
      const motorMesh = new THREE.Mesh(motorGeo, motorMat);
      motorMesh.position.set(-3.5, 0, 0);
      assemblyGroup.add(motorMesh);

      // Motor Fins
      for (let i = -1.2; i <= 1.2; i += 0.4) {
        const finGeo = new THREE.TorusGeometry(1.65, 0.05, 16, 32);
        finGeo.rotateY(Math.PI / 2);
        const finMesh = new THREE.Mesh(finGeo, motorMat);
        finMesh.position.set(-3.5 + i, 0, 0);
        assemblyGroup.add(finMesh);
      }

      // B. Drive Shaft & Flexible Coupling
      const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 7.5, 32);
      shaftGeo.rotateZ(Math.PI / 2);
      const shaftMesh = new THREE.Mesh(shaftGeo, silverMat);
      assemblyGroup.add(shaftMesh);

      const couplingGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 32);
      couplingGeo.rotateZ(Math.PI / 2);
      const couplingMesh = new THREE.Mesh(couplingGeo, copperMat);
      couplingMesh.position.set(-1.4, 0, 0);
      assemblyGroup.add(couplingMesh);

      // C. Bearing Housing & Inner Races (FAULT TARGET PART)
      const bearingGeo = new THREE.BoxGeometry(1.4, 1.8, 1.8);
      targetComponentMesh = new THREE.Mesh(bearingGeo, faultMat);
      targetComponentMesh.position.set(0.2, 0, 0);
      assemblyGroup.add(targetComponentMesh);

      const ringGeo = new THREE.TorusGeometry(0.6, 0.1, 16, 32);
      ringGeo.rotateY(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, faultMat);
      ringMesh.position.set(0.2, 0, 0);
      assemblyGroup.add(ringMesh);

      // D. Mechanical Seal
      const sealGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 32);
      sealGeo.rotateZ(Math.PI / 2);
      const sealMesh = new THREE.Mesh(sealGeo, cyanMat);
      sealMesh.position.set(1.3, 0, 0);
      assemblyGroup.add(sealMesh);

      // E. Volute Casing & Flanges
      const casingGeo = new THREE.SphereGeometry(1.8, 32, 32);
      casingGeo.scale(1, 1, 0.7);
      const casingMesh = new THREE.Mesh(casingGeo, cyanMat);
      casingMesh.position.set(2.8, 0, 0);
      assemblyGroup.add(casingMesh);

      // Rotating Impeller
      const impellerGroup = new THREE.Group();
      const impellerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32), silverMat);
      impellerHub.rotation.z = Math.PI / 2;
      impellerGroup.add(impellerHub);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        const vaneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.3), silverMat);
        vaneMesh.position.set(0, Math.cos(a) * 0.7, Math.sin(a) * 0.7);
        vaneMesh.rotation.x = a;
        impellerGroup.add(vaneMesh);
      }
      impellerGroup.position.set(2.8, 0, 0);
      assemblyGroup.add(impellerGroup);

      // Suction & Discharge Flange Rings
      const suctionPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.2, 32), motorMat);
      suctionPipe.position.set(2.8, -2.0, 0);
      assemblyGroup.add(suctionPipe);

      const dischargePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 32), motorMat);
      dischargePipe.rotation.z = Math.PI / 2;
      dischargePipe.position.set(4.1, 0.8, 0);
      assemblyGroup.add(dischargePipe);

      animObjects.impellerGroup = impellerGroup;
      animObjects.motor = motorMesh;
      animObjects.bearing = targetComponentMesh;

    } else if (machineId === 'CNC-001' || machineType.includes('CNC') || machineType.includes('Mill')) {
      // ===== 2. CNC MILLING MACHINE (CNC-001) =====
      setInspectionTarget('High-Speed Spindle Head');

      // Heavy Cabinet Enclosure
      const bodyGeo = new THREE.BoxGeometry(6.5, 4.5, 4.2);
      const bodyMesh = new THREE.Mesh(bodyGeo, darkMat);
      assemblyGroup.add(bodyMesh);

      // Glass Sliding Door
      const doorGeo = new THREE.BoxGeometry(3.6, 2.8, 0.1);
      const doorMesh = new THREE.Mesh(doorGeo, glassMat);
      doorMesh.position.set(0, 0.2, 2.15);
      assemblyGroup.add(doorMesh);

      // Gantry Rails
      const railGeo = new THREE.BoxGeometry(5.0, 0.25, 0.25);
      const rail1 = new THREE.Mesh(railGeo, silverMat);
      rail1.position.set(0, 1.2, 0.6);
      assemblyGroup.add(rail1);

      // Milling Spindle Head (FAULT TARGET PART)
      const spindleGeo = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 32);
      targetComponentMesh = new THREE.Mesh(spindleGeo, faultMat);
      targetComponentMesh.position.set(0, 0.7, 0.6);
      assemblyGroup.add(targetComponentMesh);

      // High-Speed Tool Bit
      const toolGeo = new THREE.ConeGeometry(0.2, 0.9, 16);
      toolGeo.rotateX(Math.PI);
      const toolMesh = new THREE.Mesh(toolGeo, silverMat);
      toolMesh.position.set(0, -0.85, 0.6);
      assemblyGroup.add(toolMesh);

      // T-Slot Slotted Worktable
      const tableGeo = new THREE.BoxGeometry(3.6, 0.5, 2.2);
      const tableMesh = new THREE.Mesh(tableGeo, motorMat);
      tableMesh.position.set(0, -1.3, 0.6);
      assemblyGroup.add(tableMesh);

      animObjects.tool = toolMesh;
      animObjects.spindle = targetComponentMesh;

    } else if (machineId === 'COMP-201' || machineType.includes('Compressor')) {
      // ===== 3. ROTARY SCREW AIR COMPRESSOR (COMP-201) =====
      setInspectionTarget('Twin Helical Screw Air-End Housing');

      // Acoustic Canopy Enclosure
      const canopyGeo = new THREE.BoxGeometry(5.8, 4.2, 3.6);
      const canopyMesh = new THREE.Mesh(canopyGeo, cyanMat);
      assemblyGroup.add(canopyMesh);

      // Air-End Housing (FAULT TARGET PART)
      const airEndGeo = new THREE.CylinderGeometry(1.25, 1.25, 2.8, 32);
      airEndGeo.rotateZ(Math.PI / 2);
      targetComponentMesh = new THREE.Mesh(airEndGeo, faultMat);
      targetComponentMesh.position.set(-0.4, 0.2, 0.2);
      assemblyGroup.add(targetComponentMesh);

      // Oil Separator Tank
      const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 3.2, 32);
      const tankMesh = new THREE.Mesh(tankGeo, silverMat);
      tankMesh.position.set(1.9, 0.2, -0.4);
      assemblyGroup.add(tankMesh);

      // Intake Air Filter Cone
      const filterGeo = new THREE.ConeGeometry(0.7, 1.2, 32);
      filterGeo.rotateZ(-Math.PI / 2);
      const filterMesh = new THREE.Mesh(filterGeo, darkMat);
      filterMesh.position.set(-2.4, 1.0, 0.2);
      assemblyGroup.add(filterMesh);

      animObjects.airEnd = targetComponentMesh;

    } else if (machineId === 'CONV-401' || machineType.includes('Conveyor')) {
      // ===== 4. INDUSTRIAL BELT CONVEYOR (CONV-401) =====
      setInspectionTarget('Drive Motor & Gearbox Assembly');

      // Aluminum Extrusion Side Rails
      const railGeo = new THREE.BoxGeometry(8.5, 0.4, 2.4);
      const frameMesh = new THREE.Mesh(railGeo, motorMat);
      frameMesh.position.set(0, -0.6, 0);
      assemblyGroup.add(frameMesh);

      // Rubber Conveyor Belt
      const beltGeo = new THREE.BoxGeometry(8.3, 0.1, 2.2);
      const beltMesh = new THREE.Mesh(beltGeo, darkMat);
      beltMesh.position.set(0, -0.35, 0);
      assemblyGroup.add(beltMesh);

      // Drive Motor Gearbox (FAULT TARGET PART)
      const motorGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.8, 32);
      targetComponentMesh = new THREE.Mesh(motorGeo, faultMat);
      targetComponentMesh.position.set(-3.6, -0.6, 1.5);
      assemblyGroup.add(targetComponentMesh);

      // Moving Workpiece Cargo Boxes
      const packageGroup = new THREE.Group();
      for (let x = -3.2; x <= 3.2; x += 2.1) {
        const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.0), cyanMat);
        boxMesh.position.set(x, 0.15, 0);
        packageGroup.add(boxMesh);
      }
      assemblyGroup.add(packageGroup);

      animObjects.packages = packageGroup;
      animObjects.motor = targetComponentMesh;

    } else {
      // ===== 5. POWER TRANSFORMER (XFMR-302) =====
      setInspectionTarget('Winding Coils & Oil Distribution Tank');

      // Main Oil Tank (FAULT TARGET PART)
      const tankGeo = new THREE.BoxGeometry(4.6, 3.6, 3.2);
      targetComponentMesh = new THREE.Mesh(tankGeo, faultMat);
      targetComponentMesh.position.set(0, -0.2, 0);
      assemblyGroup.add(targetComponentMesh);

      // Porcelain High-Voltage Bushings
      for (let x of [-1.3, 0, 1.3]) {
        const bushingGeo = new THREE.CylinderGeometry(0.25, 0.38, 2.4, 16);
        const bushingMesh = new THREE.Mesh(bushingGeo, motorMat);
        bushingMesh.position.set(x, 2.5, 0);
        assemblyGroup.add(bushingMesh);
      }

      // Radiator Cooling Panel Stacks
      for (let side of [-2.5, 2.5]) {
        for (let z = -1.2; z <= 1.2; z += 0.5) {
          const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 0.35), silverMat);
          finMesh.position.set(side, -0.2, z);
          assemblyGroup.add(finMesh);
        }
      }

      animObjects.tank = targetComponentMesh;
    }

    scene.add(assemblyGroup);

    meshesRef.current = {
      ...animObjects,
      faultMat,
      targetComponentMesh,
      pointLight,
      assemblyGroup,
    };

    // 4. Mouse Orbit Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      assemblyGroup.rotation.y += deltaX * 0.008;
      assemblyGroup.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging = false; };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 5. Render & Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Animate tool spinning or package transport
      if (animObjects.impellerGroup) {
        animObjects.impellerGroup.rotation.x += 0.08;
      }
      if (animObjects.tool) {
        animObjects.tool.rotation.y += 0.2;
      }
      if (animObjects.packages) {
        animObjects.packages.children.forEach(box => {
          box.position.x += 0.025;
          if (box.position.x > 3.8) box.position.x = -3.8;
        });
      }

      // Exploded Assembly View Interpolation
      const targetOffset = explodedRef.current ? 1.8 : 0;
      if (targetComponentMesh) {
        targetComponentMesh.position.y = (explodedRef.current ? 0.8 : 0.2);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, [machineId, machineType]);

  // Dynamic Material Glow Update on Telemetry Anomaly
  useEffect(() => {
    const { faultMat, pointLight, targetComponentMesh } = meshesRef.current;
    if (!faultMat) return;

    const temp = sensors?.temperature?.value || 40;
    const vib = sensors?.vibration?.value || 0.8;
    const isDamaged = health < 55 || temp > 65 || vib > 3.0 || isSimulation;

    if (isDamaged) {
      // GLOWING RED FOR DAMAGED COMPONENT
      faultMat.color.setHex(0xef4444);
      faultMat.emissive.setHex(0xef4444);
      faultMat.emissiveIntensity = 0.8 + Math.sin(Date.now() / 200) * 0.45;
      if (pointLight) {
        pointLight.color.setHex(0xef4444);
        pointLight.intensity = 4.0;
      }
    } else if (health < 80 || temp > 55) {
      // AMBER WARNING
      faultMat.color.setHex(0xf59e0b);
      faultMat.emissive.setHex(0xf59e0b);
      faultMat.emissiveIntensity = 0.3;
      if (pointLight) pointLight.intensity = 0.8;
    } else {
      // HEALTHY METALLIC STEEL
      faultMat.color.setHex(0x3b82f6);
      faultMat.emissive.setHex(0x000000);
      faultMat.emissiveIntensity = 0;
      if (pointLight) pointLight.intensity = 0;
    }
  }, [sensors, health, isSimulation]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '340px', cursor: 'grab' }} />

      {/* 3D Toolbar Controls */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        display: 'flex', gap: '8px', zIndex: 10
      }}>
        <button
          onClick={() => setExploded(!exploded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: 'var(--radius-md)',
            background: exploded ? 'var(--accent-purple)' : '#ffffff',
            border: '1px solid var(--border-default)',
            color: exploded ? '#ffffff' : 'var(--text-primary)',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Layers size={14} />
          <span>{exploded ? 'Collapse Assembly' : 'Explode CAD View'}</span>
        </button>

        <button
          onClick={() => {
            if (meshesRef.current.assemblyGroup) {
              meshesRef.current.assemblyGroup.rotation.set(0, 0, 0);
            }
          }}
          style={{
            padding: '6px 10px', borderRadius: 'var(--radius-md)',
            background: '#ffffff', border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Reset 3D View"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 3D Dynamic Part Inspection Overlay */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px',
        padding: '8px 14px', borderRadius: 'var(--radius-md)',
        background: '#ffffff', backdropFilter: 'blur(12px)',
        border: `1px solid ${health < 55 ? 'var(--status-critical)' : 'var(--border-default)'}`,
        display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: health < 55 ? 'var(--status-critical)' : health < 80 ? 'var(--status-warning)' : 'var(--status-healthy)',
          boxShadow: `0 0 8px ${health < 55 ? 'var(--status-critical)' : 'var(--status-healthy)'}`
        }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
            3D Inspection Target: {inspectionTarget}
          </div>
          <div style={{ fontSize: '10px', color: health < 55 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
            {health < 55 ? 'CRITICAL ANOMALY — DAMAGED SUB-ASSEMBLY HIGH TEMP' : 'Normal CAD telemetry baseline'}
          </div>
        </div>
      </div>
    </div>
  );
}
