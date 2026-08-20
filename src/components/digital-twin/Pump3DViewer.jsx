import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, Layers, Maximize2, RotateCcw, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';

export function Pump3DViewer({ sensors, health = 85, isSimulation = false }) {
  const mountRef = useRef(null);
  const [exploded, setExploded] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  const sceneRef = useRef(null);
  const meshesRef = useRef({});
  const animationFrameRef = useRef(null);
  const explodedRef = useRef(false);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    const width = mountRef.current.clientWidth || 550;
    const height = 340;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x3b82f6, 1.5);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.0);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xef4444, 0, 10);
    pointLight.position.set(0, 1, 0);
    scene.add(pointLight);

    // 3. Grid & Floor Glow
    const gridHelper = new THREE.GridHelper(20, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // 4. Materials
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });
    const couplingMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.6, roughness: 0.4 });
    const casingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.85 });

    // Dynamic Materials for Bearing & Seal
    const bearingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x000000,
      metalness: 0.8,
      roughness: 0.2
    });

    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x000000,
      metalness: 0.5,
      roughness: 0.3
    });

    const impellerMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });

    // 5. Construct 3D Assembly Meshes
    const assemblyGroup = new THREE.Group();

    // A. Motor
    const motorGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.8, 32);
    motorGeo.rotateZ(Math.PI / 2);
    const motorMesh = new THREE.Mesh(motorGeo, motorMat);
    motorMesh.position.set(-3.5, 0, 0);
    motorMesh.userData = { name: 'Electric Motor (15kW)', health: 96, temp: '42°C', status: 'Healthy' };
    assemblyGroup.add(motorMesh);

    // Motor Cooling Fins
    for (let i = -1.2; i <= 1.2; i += 0.4) {
      const finGeo = new THREE.TorusGeometry(1.65, 0.05, 16, 32);
      finGeo.rotateY(Math.PI / 2);
      const finMesh = new THREE.Mesh(finGeo, motorMat);
      finMesh.position.set(-3.5 + i, 0, 0);
      assemblyGroup.add(finMesh);
    }

    // B. Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 7.5, 32);
    shaftGeo.rotateZ(Math.PI / 2);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(0, 0, 0);
    shaftMesh.userData = { name: 'Drive Shaft', health: 92, temp: '38°C', status: 'Healthy' };
    assemblyGroup.add(shaftMesh);

    // C. Coupling
    const couplingGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 32);
    couplingGeo.rotateZ(Math.PI / 2);
    const couplingMesh = new THREE.Mesh(couplingGeo, couplingMat);
    couplingMesh.position.set(-1.4, 0, 0);
    couplingMesh.userData = { name: 'Flexible Shaft Coupling', health: 90, temp: '40°C', status: 'Healthy' };
    assemblyGroup.add(couplingMesh);

    // D. Bearing Housing & Races (DAMAGED RED TARGET PART)
    const bearingHousingGeo = new THREE.BoxGeometry(1.4, 1.8, 1.8);
    const bearingHousingMesh = new THREE.Mesh(bearingHousingGeo, bearingMat);
    bearingHousingMesh.position.set(0.2, 0, 0);
    bearingHousingMesh.userData = { name: 'SKF 6205-2RS Bearing Assembly', health: health, temp: sensors?.temperature?.value + '°C', status: health < 50 ? 'DAMAGED CRITICAL' : 'Warning' };
    assemblyGroup.add(bearingHousingMesh);

    // Bearing Ring Ornaments
    const ringGeo = new THREE.TorusGeometry(0.55, 0.1, 16, 32);
    ringGeo.rotateY(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, bearingMat);
    ringMesh.position.set(0.2, 0, 0);
    assemblyGroup.add(ringMesh);

    // E. Mechanical Seal
    const sealGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 32);
    sealGeo.rotateZ(Math.PI / 2);
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.set(1.3, 0, 0);
    sealMesh.userData = { name: 'Mechanical Seal Cartridge', health: 88, temp: '45°C', status: 'Healthy' };
    assemblyGroup.add(sealMesh);

    // F. Volute Pump Casing
    const casingGeo = new THREE.SphereGeometry(1.8, 32, 32);
    casingGeo.scale(1, 1, 0.7);
    const casingMesh = new THREE.Mesh(casingGeo, casingMat);
    casingMesh.position.set(2.8, 0, 0);
    casingMesh.userData = { name: 'Volute Pump Casing', health: 95, temp: '36°C', status: 'Healthy' };
    assemblyGroup.add(casingMesh);

    // G. Impeller (Rotating)
    const impellerGroup = new THREE.Group();
    const impellerHubGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
    impellerHubGeo.rotateZ(Math.PI / 2);
    const impellerHubMesh = new THREE.Mesh(impellerHubGeo, impellerMat);
    impellerGroup.add(impellerHubMesh);

    // 4 Curved Impeller Vanes
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const vaneGeo = new THREE.BoxGeometry(0.1, 1.2, 0.3);
      const vaneMesh = new THREE.Mesh(vaneGeo, impellerMat);
      vaneMesh.position.set(0, Math.cos(a) * 0.7, Math.sin(a) * 0.7);
      vaneMesh.rotation.x = a;
      impellerGroup.add(vaneMesh);
    }
    impellerGroup.position.set(2.8, 0, 0);
    assemblyGroup.add(impellerGroup);

    // H. Suction Pipe (Inlet) & Discharge Pipe (Outlet)
    const suctionGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 32);
    const suctionMesh = new THREE.Mesh(suctionGeo, pipeMat);
    suctionMesh.position.set(2.8, -2.0, 0);
    assemblyGroup.add(suctionMesh);

    const dischargeGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.5, 32);
    dischargeGeo.rotateZ(Math.PI / 2);
    const dischargeMesh = new THREE.Mesh(dischargeGeo, pipeMat);
    dischargeMesh.position.set(4.3, 0.8, 0);
    assemblyGroup.add(dischargeMesh);

    scene.add(assemblyGroup);

    // Store references for animation
    meshesRef.current = {
      motor: motorMesh,
      shaft: shaftMesh,
      coupling: couplingMesh,
      bearing: bearingHousingMesh,
      bearingRing: ringMesh,
      seal: sealMesh,
      casing: casingMesh,
      impellerGroup,
      pointLight,
      bearingMat,
      assemblyGroup,
    };

    // 6. Interactive Mouse Orbit & Raycasting
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

    // 7. Render & Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate Impeller based on RPM
      if (impellerGroup) {
        impellerGroup.rotation.x += 0.08;
      }

      // Smooth Exploded View Interpolation
      const targetMotorX = explodedRef.current ? -5.5 : -3.5;
      const targetBearingX = explodedRef.current ? 1.0 : 0.2;
      const targetSealX = explodedRef.current ? 3.0 : 1.3;
      const targetCasingX = explodedRef.current ? 5.2 : 2.8;

      motorMesh.position.x += (targetMotorX - motorMesh.position.x) * 0.1;
      bearingHousingMesh.position.x += (targetBearingX - bearingHousingMesh.position.x) * 0.1;
      ringMesh.position.x = bearingHousingMesh.position.x;
      sealMesh.position.x += (targetSealX - sealMesh.position.x) * 0.1;
      casingMesh.position.x += (targetCasingX - casingMesh.position.x) * 0.1;
      impellerGroup.position.x = casingMesh.position.x;

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
  }, []);

  // Update Bearing Material Color to GLOWING RED when damaged!
  useEffect(() => {
    const { bearingMat, pointLight } = meshesRef.current;
    if (!bearingMat) return;

    const temp = sensors?.temperature?.value || 40;
    const vib = sensors?.vibration?.value || 0.8;
    const isDamaged = health < 55 || temp > 65 || vib > 3.0 || isSimulation;

    if (isDamaged) {
      // GLOWING RED FOR DAMAGED BEARING!
      bearingMat.color.setHex(0xef4444);
      bearingMat.emissive.setHex(0xef4444);
      bearingMat.emissiveIntensity = 0.8 + Math.sin(Date.now() / 200) * 0.4;
      if (pointLight) {
        pointLight.color.setHex(0xef4444);
        pointLight.intensity = 3.0;
        pointLight.position.set(meshesRef.current.bearing.position.x, 1, 0);
      }
    } else if (health < 80 || temp > 55) {
      // AMBER WARNING
      bearingMat.color.setHex(0xf59e0b);
      bearingMat.emissive.setHex(0xf59e0b);
      bearingMat.emissiveIntensity = 0.3;
      if (pointLight) pointLight.intensity = 0.5;
    } else {
      // HEALTHY METALLIC BLUE/STEEL
      bearingMat.color.setHex(0x3b82f6);
      bearingMat.emissive.setHex(0x000000);
      bearingMat.emissiveIntensity = 0;
      if (pointLight) pointLight.intensity = 0;
    }
  }, [sensors, health, isSimulation]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '340px', cursor: 'grab' }} />

      {/* 3D Floating Control Toolbar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={() => setExploded(!exploded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: 'var(--radius-md)',
            background: exploded ? 'var(--accent-purple)' : 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Layers size={14} />
          <span>{exploded ? 'Collapse CAD View' : 'Explode Assembly View'}</span>
        </button>

        <button
          onClick={() => {
            if (meshesRef.current.assemblyGroup) {
              meshesRef.current.assemblyGroup.rotation.set(0, 0, 0);
            }
          }}
          style={{
            padding: '6px 10px', borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff', fontSize: '11px', cursor: 'pointer'
          }}
          title="Reset 3D Rotation"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 3D Dynamic Part Inspection Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        padding: '8px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${health < 55 ? 'var(--status-critical)' : 'var(--border-subtle)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: health < 55 ? 'var(--status-critical)' : health < 80 ? 'var(--status-warning)' : 'var(--status-healthy)',
          boxShadow: `0 0 10px ${health < 55 ? 'var(--status-critical)' : 'var(--status-healthy)'}`
        }} />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
            3D Inspection Target: SKF 6205 Bearing
          </div>
          <div style={{ fontSize: '10px', color: health < 55 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
            {health < 55 ? 'CRITICAL FAILURE — DAMAGED PART HIGH TEMP ALERT' : 'Normal operating status'}
          </div>
        </div>
      </div>
    </div>
  );
}
