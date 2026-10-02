import * as THREE from 'three';

// Helper to create a crisp technical CAD callout badge sprite
function createCalloutSprite(badgeNumber, title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background rounded box with technical border
  ctx.fillStyle = 'rgba(11, 17, 32, 0.92)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.stroke();

  // Number badge circle
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(60, 64, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Badge number text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeNumber, 60, 65);

  // Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(title, 115, 50);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 22px monospace';
  ctx.fillText(subtitle, 115, 86);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

// ── CNC-001 Vertical Milling Machine Geometry & Kinematics ──
// Strictly preserves the monolithic machine structural integrity (zero torn quads, zero spikes)
export function setupCNCMillKinematics(glbScene) {
  // Find the primary mesh in the loaded GLB
  let targetMesh = null;
  glbScene.traverse((child) => {
    if (child.isMesh && !targetMesh) {
      targetMesh = child;
    }
  });

  if (!targetMesh || !targetMesh.geometry) return null;

  glbScene.updateMatrixWorld(true);

  // Bake the transformation matrix directly into a clean geometry copy
  const bakedGeo = targetMesh.geometry.clone();
  bakedGeo.applyMatrix4(targetMesh.matrixWorld);
  bakedGeo.computeVertexNormals();

  const originalMat = targetMesh.material;
  const posAttr = bakedGeo.attributes.position;
  const indAttr = bakedGeo.index;
  if (!posAttr || !indAttr) return null;

  const positions = posAttr.array;
  const indices = indAttr.array;

  // 1. Precise extraction of the two handwheels on the front of the knee
  // Left Wheel Center: [-0.4967, -0.6463, 1.5082]
  // Right Wheel Center: [0.5460, -0.6463, 1.5082]
  const leftWheelCenter = new THREE.Vector3(-0.4967, -0.6463, 1.5082);
  const rightWheelCenter = new THREE.Vector3(0.5460, -0.6463, 1.5082);

  const bodyIndices = [];
  const leftWheelIndices = [];
  const rightWheelIndices = [];

  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i], i2 = indices[i + 1], i3 = indices[i + 2];
    const x = (positions[i1 * 3] + positions[i2 * 3] + positions[i3 * 3]) / 3;
    const y = (positions[i1 * 3 + 1] + positions[i2 * 3 + 1] + positions[i3 * 3 + 1]) / 3;
    const z = (positions[i1 * 3 + 2] + positions[i2 * 3 + 2] + positions[i3 * 3 + 2]) / 3;

    // Check if triangle belongs to Left or Right Handwheel on the front knee face (z > 1.34)
    if (z > 1.34 && y < -0.25 && y > -1.05) {
      const dL = Math.hypot(x - (-0.4967), y - (-0.6463));
      const dR = Math.hypot(x - 0.5460, y - (-0.6463));
      if (dL < 0.32) {
        leftWheelIndices.push(i1, i2, i3);
        continue;
      }
      if (dR < 0.32) {
        rightWheelIndices.push(i1, i2, i3);
        continue;
      }
    }

    // All other triangles belong to the unified, unbroken machine body
    bodyIndices.push(i1, i2, i3);
  }

  // Create assembly group directly in glbScene
  const assemblyGroup = new THREE.Group();
  assemblyGroup.name = 'CNC_Kinematics_Assembly';

  const subAssemblies = {};

  // ── 1. Create Complete, Undisturbed Monoblock Machine Body ──
  // Contains Column, Headstock, Knee, Table, Vise & Foundation Base with 100% structural integrity
  const bodyGeo = bakedGeo.clone();
  bodyGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(bodyIndices), 1));
  bodyGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeo, originalMat);
  bodyMesh.name = 'CNC_Monoblock_Machine_Body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData = {
    isSubAssembly: true,
    subKey: 'column',
    partName: 'Meehanite Monoblock Structural Casting (Column, Table, Knee & Foundation)',
    partSpec: 'Precision Scraped Turcite-B Guides • C3 Ball Screws • Monoblock Meehanite Structure • Zero Resonance',
    tempSensor: 'temperature',
    vibSensor: 'vibrationEnvelope',
    originalLocalPos: new THREE.Vector3(0, 0, 0)
  };
  assemblyGroup.add(bodyMesh);
  subAssemblies.body = bodyMesh;

  // ── 2. Create Left Handwheel Sub-Assembly (Longitudinal Feed) ──
  const leftGeo = bakedGeo.clone();
  leftGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(leftWheelIndices), 1));
  leftGeo.computeVertexNormals();
  // Center geometry on its rotational axis
  leftGeo.translate(-leftWheelCenter.x, -leftWheelCenter.y, -leftWheelCenter.z);

  const leftWheelMesh = new THREE.Mesh(leftGeo, originalMat);
  leftWheelMesh.name = 'CNC_Left_Handwheel';
  leftWheelMesh.position.copy(leftWheelCenter);
  leftWheelMesh.castShadow = true;
  leftWheelMesh.receiveShadow = true;
  leftWheelMesh.userData = {
    isSubAssembly: true,
    subKey: 'wheel-x',
    partName: 'Longitudinal X-Axis Handwheel & Calibrated Micrometer Dial',
    partSpec: 'Balanced Cast-Iron Handwheel • 0.02 mm Graduated Dial • Direct Lead Screw Drive',
    tempSensor: 'temperature',
    vibSensor: 'vibration',
    originalLocalPos: leftWheelCenter.clone()
  };
  assemblyGroup.add(leftWheelMesh);

  // ── 3. Create Right Handwheel Sub-Assembly (Cross-Feed) ──
  const rightGeo = bakedGeo.clone();
  rightGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(rightWheelIndices), 1));
  rightGeo.computeVertexNormals();
  // Center geometry on its rotational axis
  rightGeo.translate(-rightWheelCenter.x, -rightWheelCenter.y, -rightWheelCenter.z);

  const rightWheelMesh = new THREE.Mesh(rightGeo, originalMat);
  rightWheelMesh.name = 'CNC_Right_Handwheel';
  rightWheelMesh.position.copy(rightWheelCenter);
  rightWheelMesh.castShadow = true;
  rightWheelMesh.receiveShadow = true;
  rightWheelMesh.userData = {
    isSubAssembly: true,
    subKey: 'wheel-y',
    partName: 'Cross-Feed Y-Axis Handwheel & Calibrated Micrometer Dial',
    partSpec: 'Balanced Cast-Iron Handwheel • 0.02 mm Graduated Dial • Direct Saddle Screw Drive',
    tempSensor: 'temperature',
    vibSensor: 'vibration',
    originalLocalPos: rightWheelCenter.clone()
  };
  assemblyGroup.add(rightWheelMesh);

  // ── 4. High-Precision Active Spindle Tool Holder & Cutter ──
  const toolAssembly = new THREE.Group();
  toolAssembly.name = 'CNC_Active_Spindle_Tool';
  toolAssembly.position.set(-0.57, 1.35, 0.48);

  const holderMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.15,
    name: 'Tool_Holder_Steel'
  });
  const holderGeo = new THREE.CylinderGeometry(0.14, 0.09, 0.26, 24);
  const holderMesh = new THREE.Mesh(holderGeo, holderMat);
  toolAssembly.add(holderMesh);

  const colletMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
    name: 'Collet_Nut_Black'
  });
  const colletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.09, 24);
  const colletMesh = new THREE.Mesh(colletGeo, colletMat);
  colletMesh.position.y = -0.16;
  toolAssembly.add(colletMesh);

  const cutterMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.92,
    roughness: 0.18,
    name: 'End_Mill_AlTiN'
  });
  const cutterGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 16);
  const cutterMesh = new THREE.Mesh(cutterGeo, cutterMat);
  cutterMesh.position.y = -0.32;
  toolAssembly.add(cutterMesh);

  toolAssembly.userData = {
    isSubAssembly: true,
    subKey: 'tool',
    partName: 'ISO 40 Tool Holder & 4-Flute AlTiN Carbide End Mill (Ø16mm)',
    partSpec: 'DIN 69871 Form A • ER32 Collet Chuck • AlTiN Nanocomposite Coating • Runout < 1.0 µm',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    originalLocalPos: toolAssembly.position.clone()
  };
  assemblyGroup.add(toolAssembly);

  // ── 5. Technical Exploded CAD Guideline Leader Lines ──
  const lineCount = 6;
  const traceLinePositions = new Float32Array(lineCount * 2 * 3);
  const traceLineGeo = new THREE.BufferGeometry();
  traceLineGeo.setAttribute('position', new THREE.BufferAttribute(traceLinePositions, 3));

  const traceLineMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 0.06,
    gapSize: 0.04,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    linewidth: 2
  });
  const traceLines = new THREE.LineSegments(traceLineGeo, traceLineMat);
  traceLines.computeLineDistances();
  assemblyGroup.add(traceLines);

  // ── 6. 3D BOM Technical Callout Badges ──
  const calloutSprites = [];
  const BADGES = [
    { num: '01', title: 'Spindle Headstock', sub: '3.7 kW • ISO 40 • 10k RPM', pos: [-0.57, 2.7, 0.4], off: [0, 0.5, 0] },
    { num: '02', title: 'Meehanite Column', sub: 'Box-Way Dovetail Guides', pos: [-0.47, 1.8, -0.6], off: [0, 0, -0.4] },
    { num: '03', title: 'Compound Worktable', sub: '1270 × 254 mm • C3 Ball Screws', pos: [1.4, 0.2, 0.6], off: [0.6, 0, 0] },
    { num: '04', title: 'Elevating Knee (Z)', sub: 'Hydraulic Counterbalance', pos: [-0.47, -1.2, 0.6], off: [0, -0.4, 0] },
    { num: '05', title: 'Monoblock Base', sub: '60L Flood Coolant Sump', pos: [-0.47, -2.1, 0.8], off: [0, -0.3, 0] },
    { num: '06', title: 'Feed Handwheels', sub: 'Longitudinal & Cross Lead Screws', pos: [0.02, -0.65, 1.8], off: [0, 0, 0.85] },
    { num: '07', title: 'ISO 40 Tooling', sub: 'ER32 Collet & Ø16mm Carbide Cutter', pos: [-0.57, 0.45, 0.6], off: [0, -0.85, 0] }
  ];

  BADGES.forEach(b => {
    const sprite = createCalloutSprite(b.num, b.title, b.sub);
    sprite.position.set(b.pos[0], b.pos[1], b.pos[2]);
    sprite.userData.basePos = sprite.position.clone();
    sprite.userData.explodeOffset = b.off;
    assemblyGroup.add(sprite);
    calloutSprites.push(sprite);
  });

  // ── 7. Dynamic Machining Cutting Swarm (Chips & Coolant Droplets) ──
  const chipCount = 70;
  const chipGeo = new THREE.BufferGeometry();
  const chipPositions = new Float32Array(chipCount * 3);
  const chipVelocities = [];

  for (let i = 0; i < chipCount; i++) {
    chipPositions[i * 3] = -0.57 + (Math.random() - 0.5) * 0.06;
    chipPositions[i * 3 + 1] = 0.95 + (Math.random() - 0.5) * 0.04;
    chipPositions[i * 3 + 2] = 0.48 + (Math.random() - 0.5) * 0.06;

    chipVelocities.push({
      vx: (Math.random() - 0.5) * 0.25 + 0.1,
      vy: Math.random() * 0.15 + 0.05,
      vz: (Math.random() - 0.5) * 0.25,
      life: Math.random()
    });
  }
  chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPositions, 3));

  const chipMat = new THREE.PointsMaterial({
    color: 0xf59e0b,
    size: 0.024,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const chipParticles = new THREE.Points(chipGeo, chipMat);
  assemblyGroup.add(chipParticles);

  // Hide original monolithic mesh and insert pristine kinematics assembly
  targetMesh.visible = false;
  glbScene.add(assemblyGroup);

  return {
    assemblyGroup,
    subAssemblies,
    bodyMesh,
    leftWheelMesh,
    rightWheelMesh,
    leftWheelCenter,
    rightWheelCenter,
    toolAssembly,
    calloutSprites,
    traceLines,
    traceLineMat,
    chipParticles,
    chipVelocities,
    targetMesh
  };
}

// ── Update Dynamic Machining Feeds, Spindle Rotation & Exploded Kinematics ──
// Ensures zero broken geometry: structure is 100% solid and undisturbed
export function updateCNCMillKinematics(cncKinematics, elapsed, isExploded, ex, sensors, health = 85) {
  if (!cncKinematics) return;

  const {
    bodyMesh, toolAssembly, leftWheelMesh, rightWheelMesh,
    leftWheelCenter, rightWheelCenter, calloutSprites,
    traceLines, traceLineMat, chipParticles, chipVelocities
  } = cncKinematics;

  // Smooth cubic ease for weighted mechanical disassembly
  const t = Math.min(1.0, Math.max(0.0, ex));
  const easeEx = t * t * (3 - 2 * t);

  // 1. Spindle High-Speed Rotation (4200 RPM)
  if (toolAssembly) {
    const rpm = sensors?.spindleSpeed ?? 4200;
    const speedRatio = Math.max(0.2, rpm / 4200);
    toolAssembly.rotation.y += 0.35 * speedRatio;

    if (isExploded) {
      toolAssembly.position.y = toolAssembly.userData.originalLocalPos.y - easeEx * 0.85;
    } else {
      toolAssembly.position.y = toolAssembly.userData.originalLocalPos.y;
    }
  }

  // 2. Handwheels Clockwise Rotation (Rotates continuously like a clock)
  const isRunning = health > 20;
  // Clockwise continuous rotation angle (negative Z in right-handed Three.js)
  const clockAngle = -elapsed * 2.5;

  if (!isExploded) {
    // ── Running Mode: Continuous Clockwise Handwheel Rotation on Knee Front ──
    if (isRunning) {
      if (leftWheelMesh) {
        leftWheelMesh.position.copy(leftWheelCenter);
        leftWheelMesh.rotation.z = clockAngle; // Rotates clockwise like a clock!
      }
      if (rightWheelMesh) {
        rightWheelMesh.position.copy(rightWheelCenter);
        rightWheelMesh.rotation.z = clockAngle * 0.75; // Cross-feed dial rotation
      }
    }
  } else {
    // ── Exploded Mode: Mechanical Separation along Orthogonal Disassembly Vectors ──
    // Handwheels separate forward along +Z off their shafts from the knee casting
    if (leftWheelMesh) {
      leftWheelMesh.position.set(
        leftWheelCenter.x,
        leftWheelCenter.y,
        leftWheelCenter.z + 0.85 * easeEx
      );
      leftWheelMesh.rotation.z = 0;
    }
    if (rightWheelMesh) {
      rightWheelMesh.position.set(
        rightWheelCenter.x,
        rightWheelCenter.y,
        rightWheelCenter.z + 0.85 * easeEx
      );
      rightWheelMesh.rotation.z = 0;
    }
  }

  // 3. Main Monoblock Body: Completely solid, untouched, and undisturbed
  if (bodyMesh) {
    bodyMesh.position.set(0, 0, 0);
  }

  // 4. Technical CAD Exploded Trace Leader Lines
  if (traceLines && traceLineMat) {
    if (easeEx > 0.02) {
      traceLineMat.opacity = Math.min(0.85, easeEx * 1.1);
      const posAttr = traceLines.geometry.attributes.position;
      const arr = posAttr.array;

      const pairs = [
        { orig: [-0.57, 1.35, 0.48], target: toolAssembly?.position },
        { orig: [leftWheelCenter.x, leftWheelCenter.y, leftWheelCenter.z], target: leftWheelMesh?.position },
        { orig: [rightWheelCenter.x, rightWheelCenter.y, rightWheelCenter.z], target: rightWheelMesh?.position },
        { orig: [-0.57, 2.7, 0.4], target: new THREE.Vector3(-0.57, 2.7 + 0.5 * easeEx, 0.4) },
        { orig: [1.4, 0.2, 0.6], target: new THREE.Vector3(1.4 + 0.6 * easeEx, 0.2, 0.6) },
        { orig: [-0.47, -1.2, 0.6], target: new THREE.Vector3(-0.47, -1.2 - 0.4 * easeEx, 0.6) }
      ];

      for (let i = 0; i < pairs.length; i++) {
        const { orig, target } = pairs[i];
        if (target) {
          arr[i * 6] = orig[0];
          arr[i * 6 + 1] = orig[1];
          arr[i * 6 + 2] = orig[2];
          arr[i * 6 + 3] = target.x;
          arr[i * 6 + 4] = target.y;
          arr[i * 6 + 5] = target.z;
        }
      }
      posAttr.needsUpdate = true;
      traceLines.computeLineDistances();
      traceLines.visible = true;
    } else {
      traceLineMat.opacity = 0;
      traceLines.visible = false;
    }
  }

  // 5. BOM Technical Callout Badges
  if (calloutSprites) {
    const badgeOpacity = Math.max(0, Math.min(0.95, (easeEx - 0.15) / 0.85));
    calloutSprites.forEach(sprite => {
      sprite.material.opacity = badgeOpacity;
      sprite.visible = badgeOpacity > 0.05;
      if (sprite.userData.basePos && sprite.userData.explodeOffset) {
        const base = sprite.userData.basePos;
        const off = sprite.userData.explodeOffset;
        sprite.position.set(
          base.x + off[0] * easeEx,
          base.y + off[1] * easeEx,
          base.z + off[2] * easeEx
        );
      }
    });
  }

  // 6. Active Cutting Swarm Particles (Chips & Mist)
  if (chipParticles && chipVelocities) {
    if (!isExploded && isRunning) {
      chipParticles.visible = true;
      const posAttr = chipParticles.geometry.attributes.position;
      const arr = posAttr.array;
      const originX = -0.57;
      const originY = 0.98;
      const originZ = 0.48;

      for (let i = 0; i < chipVelocities.length; i++) {
        const v = chipVelocities[i];
        v.life += 0.05;
        if (v.life > 1.0) {
          v.life = 0;
          arr[i * 3] = originX + (Math.random() - 0.5) * 0.03;
          arr[i * 3 + 1] = originY + (Math.random() - 0.5) * 0.02;
          arr[i * 3 + 2] = originZ + (Math.random() - 0.5) * 0.03;
          v.vx = (Math.random() - 0.5) * 0.22 + 0.08;
          v.vy = Math.random() * 0.12 + 0.04;
          v.vz = (Math.random() - 0.5) * 0.22;
        } else {
          arr[i * 3] += v.vx * 0.02;
          arr[i * 3 + 1] += v.vy * 0.02 - 0.005; // gravity drop
          arr[i * 3 + 2] += v.vz * 0.02;
        }
      }
      posAttr.needsUpdate = true;
    } else {
      chipParticles.visible = false;
    }
  }
}
