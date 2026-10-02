import * as THREE from 'three';

// ── Helper to create high-visibility technical CAD BOM callout sprites ──
function createCalloutSprite(badgeNumber, title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background rounded box with technical cyan border
  ctx.fillStyle = 'rgba(11, 17, 32, 0.92)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.stroke();

  // Number badge circle
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(60, 64, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a78bfa';
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
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText(title, 115, 50);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px monospace';
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

/**
 * ROB-001 6-Axis Heavy-Payload Articulated Industrial Robot Arm
 * Production-Level Kinematics, Heatmap-Ready Decomposition & Precision Exploded CAD View
 *
 * The ROB-001 GLB model is a monolithic mesh (2 sub-meshes, same material "Robotex").
 * World-space bounding box after viewer scaling:
 *   X: -0.83 to +0.83
 *   Y: -2.20 (floor) to +0.86
 *   Z: -2.60 to +2.60
 *
 * The robot arm extends primarily along Z (arm direction) with the base pedestal
 * centered near Z ≈ -1.0 and the gripper/wrist reaching to Z ≈ +2.6.
 * Y axis is vertical (up).
 *
 * Sub-assembly decomposition (5 zones by world-space Z range):
 *   1. Base Pedestal & J1 Slewing Turntable      Z < -1.3
 *   2. Shoulder Servo & J2 Heavy Linkage          -1.3 ≤ Z < -0.3
 *   3. Elbow Joint J3 & Counterbalance Link       -0.3 ≤ Z < 0.6
 *   4. Integrated Wrist Assembly J4/J5/J6         0.6 ≤ Z < 1.6
 *   5. Servo Gripper & End-Effector Tooling       Z ≥ 1.6
 *
 * Kinematics:
 *   - J1 turntable: Continuous slow yaw oscillation around Y axis
 *   - J2 shoulder: Subtle pitch oscillation around X axis
 *   - J3 elbow: Pitch oscillation (counterphase to J2)
 *   - J4-J6 wrist: Compound roll/pitch/yaw micro-motion
 *   - Gripper: Periodic open/close pneumatic pulse
 *
 * Exploded view:
 *   - Each sub-assembly separates along its designated explode vector
 *   - 8 dashed cyan CAD leader lines connect original positions to exploded positions
 *   - 8 3D BOM callout badge sprites with part numbers and specs
 *   - Welding spark particles suppressed during exploded mode
 */
export function setupRobotKinematics(glbScene, compSubMeshes, rootAssemblyGroup) {
  if (!glbScene) return null;

  glbScene.updateMatrixWorld(true);

  // Collect all meshes from the GLB scene
  const allMeshes = [];
  glbScene.traverse((child) => {
    if (child.isMesh) {
      allMeshes.push(child);
    }
  });

  if (allMeshes.length === 0) return null;

  const parentGroup = rootAssemblyGroup || glbScene.parent || glbScene;
  const kinematicsGroup = new THREE.Group();
  kinematicsGroup.name = 'ROB001_Kinematics_Assembly';
  parentGroup.add(kinematicsGroup);

  // ── Bake all meshes into a single merged geometry ──
  // The robot has 2 mesh parts with the same material; we merge them for clean decomposition
  const mergedPositions = [];
  const mergedNormals = [];
  const mergedUvs = [];
  const mergedIndices = [];
  let vertexOffset = 0;
  let originalMat = null;

  for (const mesh of allMeshes) {
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);

    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const uvAttr = geo.attributes.uv;
    const idxAttr = geo.index;

    if (!posAttr || !idxAttr) continue;
    if (!originalMat) originalMat = mesh.material;

    for (let i = 0; i < posAttr.count; i++) {
      mergedPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      if (normAttr) mergedNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      if (uvAttr) mergedUvs.push(uvAttr.getX(i), uvAttr.getY(i));
    }

    for (let i = 0; i < idxAttr.count; i++) {
      mergedIndices.push(idxAttr.array[i] + vertexOffset);
    }

    vertexOffset += posAttr.count;
    geo.dispose();
  }

  const positions = new Float32Array(mergedPositions);
  const normals = mergedNormals.length > 0 ? new Float32Array(mergedNormals) : null;
  const uvs = mergedUvs.length > 0 ? new Float32Array(mergedUvs) : null;
  const indices = new Uint32Array(mergedIndices);

  // ── Spatial Decomposition: Partition triangles by world-space Z of centroid ──
  // The viewer applies: scale ≈ 0.2895, position = (0, -2.20, -1.20)
  // So world Z = raw_transformed_Z * scale + posZ
  // We classify using the raw baked world positions before the viewer's parent transform

  // Compute the world-space bounds to calibrate decomposition thresholds
  let minZ = Infinity, maxZ = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const z = positions[i + 2];
    const y = positions[i + 1];
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // The baked geometry is in world space. After the viewer's glbLoadedMesh transform,
  // these raw positions get scaled. The Z range spans the arm from base to gripper.
  // We use normalized thresholds relative to the actual geometry range.
  const zRange = maxZ - minZ;
  const zNorm = (z) => (z - minZ) / zRange; // 0 = base end, 1 = gripper end

  // Zone boundary thresholds (normalized 0..1 along arm length)
  const BASE_END = 0.18;      // Bottom 18% = Base pedestal + J1 turntable
  const SHOULDER_END = 0.35;  // 18-35% = Shoulder linkage + J2 servo
  const ELBOW_END = 0.52;     // 35-52% = Elbow joint J3 + counterbalance
  const WRIST_END = 0.72;     // 52-72% = Wrist cluster J4/J5/J6
  // 72-100% = Gripper end-effector

  const baseIndices = [];
  const shoulderIndices = [];
  const elbowIndices = [];
  const wristIndices = [];
  const gripperIndices = [];

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2];

    // Centroid Z of this triangle
    const cz = (positions[i0 * 3 + 2] + positions[i1 * 3 + 2] + positions[i2 * 3 + 2]) / 3;
    const nz = zNorm(cz);

    if (nz < BASE_END) {
      baseIndices.push(i0, i1, i2);
    } else if (nz < SHOULDER_END) {
      shoulderIndices.push(i0, i1, i2);
    } else if (nz < ELBOW_END) {
      elbowIndices.push(i0, i1, i2);
    } else if (nz < WRIST_END) {
      wristIndices.push(i0, i1, i2);
    } else {
      gripperIndices.push(i0, i1, i2);
    }
  }

  // ── Create a master BufferGeometry with all baked vertex data ──
  const masterGeo = new THREE.BufferGeometry();
  masterGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (normals) masterGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (uvs) masterGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Helper: create a sub-assembly mesh from a subset of indices
  function createSubMesh(indexArray, name, userData) {
    const subGeo = masterGeo.clone();
    subGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(indexArray), 1));
    subGeo.computeVertexNormals();

    const mesh = new THREE.Mesh(subGeo, originalMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      isSubAssembly: true,
      originalMaterial: originalMat,
      ...userData,
      originalLocalPos: new THREE.Vector3(0, 0, 0)
    };
    return mesh;
  }

  // Helper: compute the centroid of a set of triangle indices
  function computeCentroid(indexArray) {
    let sx = 0, sy = 0, sz = 0, count = 0;
    for (let i = 0; i < indexArray.length; i++) {
      sx += positions[indexArray[i] * 3];
      sy += positions[indexArray[i] * 3 + 1];
      sz += positions[indexArray[i] * 3 + 2];
      count++;
    }
    return new THREE.Vector3(sx / count, sy / count, sz / count);
  }

  // ── 1. Base Pedestal & J1 Slewing Turntable ──
  const baseMesh = createSubMesh(baseIndices, 'ROB_Base_Pedestal_J1', {
    subKey: 'base-turntable',
    partName: 'Monoblock Base Pedestal & J1 Slewing Turntable',
    partSpec: '360° Continuous Slew Ring Bearing • Multi-Stage Epicyclic Drive • Anchor Foundation Mounting',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration'
  });
  const baseCentroid = computeCentroid(baseIndices);
  kinematicsGroup.add(baseMesh);

  // ── 2. Shoulder Assembly J2 ──
  const shoulderMesh = createSubMesh(shoulderIndices, 'ROB_Shoulder_J2', {
    subKey: 'shoulder-arm',
    partName: 'Heavy-Duty Shoulder Linkage & Servo Motor (J2)',
    partSpec: 'High-Torque Synchronous AC Servo (680 N·m) • Dual Preloaded Roller Bearings • Rigid Cast Steel',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope'
  });
  const shoulderCentroid = computeCentroid(shoulderIndices);
  kinematicsGroup.add(shoulderMesh);

  // ── 3. Elbow Joint J3 ──
  const elbowMesh = createSubMesh(elbowIndices, 'ROB_Elbow_J3', {
    subKey: 'elbow-joint',
    partName: 'Elbow Articulation Joint (J3) & Counterbalance Link',
    partSpec: 'High-Ratio Cycloidal Reducer • 390 N·m Torque • Pneumatic Balancing Cylinder',
    tempSensor: 'temperature',
    vibSensor: 'vibration'
  });
  const elbowCentroid = computeCentroid(elbowIndices);
  kinematicsGroup.add(elbowMesh);

  // ── 4. Wrist Cluster J4/J5/J6 ──
  const wristMesh = createSubMesh(wristIndices, 'ROB_Wrist_J456', {
    subKey: 'wrist-cluster',
    partName: '3-Axis Integrated Wrist Assembly (J4/J5/J6)',
    partSpec: 'In-Line Epicyclic Gearbox • Dual Hollow Shaft • Roll/Pitch/Yaw Drives',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope'
  });
  const wristCentroid = computeCentroid(wristIndices);
  kinematicsGroup.add(wristMesh);

  // ── 5. Gripper End-Effector Tooling ──
  const gripperMesh = createSubMesh(gripperIndices, 'ROB_Gripper_Tooling', {
    subKey: 'gripper-tool',
    partName: 'Wrist J5/J6 Flange & Servo Gripper Tooling',
    partSpec: 'Parallel Servo Gripper • Pneumatic 6.2 bar • Laser Part-Detect Sensor • ISO 9283 ±0.03mm',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibration'
  });
  const gripperCentroid = computeCentroid(gripperIndices);
  kinematicsGroup.add(gripperMesh);

  // ── 6. Procedural Pneumatic Line & Cable Harness ──
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.3,
    roughness: 0.6,
    name: 'Pneumatic_Cable_Harness'
  });

  const cablePoints = [
    baseCentroid.clone(),
    shoulderCentroid.clone(),
    elbowCentroid.clone(),
    wristCentroid.clone(),
    gripperCentroid.clone()
  ];
  const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 32, 0.02, 6, false);
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.name = 'ROB_Cable_Harness';
  cableMesh.userData = {
    isSubAssembly: true,
    subKey: 'cable-harness',
    partName: 'Pneumatic Supply Line & Servo Encoder Cable Harness',
    partSpec: 'IP67 Armored Cable Conduit • 6-bar Air Supply • EtherCAT Encoder Bus',
    originalLocalPos: new THREE.Vector3(0, 0, 0)
  };
  kinematicsGroup.add(cableMesh);

  // ── 7. Exploded CAD Leader Lines (8 line segments) ──
  const lineCount = 8;
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
  kinematicsGroup.add(traceLines);

  // ── 8. 3D BOM Technical Callout Badges ──
  const calloutSprites = [];
  const BADGES = [
    { num: '01', title: 'J1 Turntable Base', sub: '360° Slew Ring • Epicyclic', centroid: baseCentroid, off: [0.6, -0.8, -0.5] },
    { num: '02', title: 'J2 Shoulder Servo', sub: '680 N·m AC Servo Drive', centroid: shoulderCentroid, off: [0.8, 0.4, -0.4] },
    { num: '03', title: 'J3 Elbow Joint', sub: 'Cycloidal Reducer 390 N·m', centroid: elbowCentroid, off: [1.0, 0.6, 0.0] },
    { num: '04', title: 'J4-J6 Wrist Cluster', sub: 'Roll/Pitch/Yaw Gearbox', centroid: wristCentroid, off: [0.8, 0.8, 0.4] },
    { num: '05', title: 'Servo Gripper', sub: '6.2 bar Pneumatic ±0.03mm', centroid: gripperCentroid, off: [0.6, 0.4, 0.8] },
    { num: '06', title: 'Cable Harness', sub: 'IP67 EtherCAT Encoder Bus', centroid: elbowCentroid.clone().add(new THREE.Vector3(0.15, 0.1, 0)), off: [1.2, 0.3, 0.0] },
    { num: '07', title: 'Encoder Feedback', sub: 'Absolute 25-bit Multi-Turn', centroid: shoulderCentroid.clone().add(new THREE.Vector3(-0.1, 0.05, 0)), off: [-0.9, 0.5, 0.0] },
    { num: '08', title: 'Foundation Bolts', sub: 'M20 Grade 12.9 × 4 Anchors', centroid: baseCentroid.clone().add(new THREE.Vector3(0, -0.1, 0)), off: [-0.6, -0.6, 0.4] },
  ];

  BADGES.forEach(b => {
    const sprite = createCalloutSprite(b.num, b.title, b.sub);
    sprite.position.set(
      b.centroid.x + b.off[0],
      b.centroid.y + b.off[1],
      b.centroid.z + b.off[2]
    );
    sprite.userData.basePos = sprite.position.clone();
    sprite.userData.explodeOffset = b.off;
    sprite.userData.centroid = b.centroid.clone();
    kinematicsGroup.add(sprite);
    calloutSprites.push(sprite);
  });

  // ── 9. Welding Spark Particle System (Active During Normal Operation) ──
  const sparkCount = 50;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkVelocities = [];

  for (let i = 0; i < sparkCount; i++) {
    sparkPositions[i * 3] = gripperCentroid.x + (Math.random() - 0.5) * 0.04;
    sparkPositions[i * 3 + 1] = gripperCentroid.y + (Math.random() - 0.5) * 0.04;
    sparkPositions[i * 3 + 2] = gripperCentroid.z + (Math.random() - 0.5) * 0.04;
    sparkVelocities.push({
      vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * 0.2 + 0.05,
      vz: (Math.random() - 0.5) * 0.3,
      life: Math.random()
    });
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

  const sparkMat = new THREE.PointsMaterial({
    color: 0xfbbf24,
    size: 0.02,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
  kinematicsGroup.add(sparkParticles);

  // ── Explode offset vectors for each sub-assembly ──
  // These define how each part separates in the exploded view
  const explodeVectors = {
    base:     new THREE.Vector3(0, -0.8, -1.0),
    shoulder: new THREE.Vector3(0.7, 0.4, -0.6),
    elbow:    new THREE.Vector3(0.9, 0.7, 0),
    wrist:    new THREE.Vector3(0.5, 0.6, 0.8),
    gripper:  new THREE.Vector3(0, 0.4, 1.4),
    cable:    new THREE.Vector3(1.2, 0.3, 0),
  };

  // Hide original monolithic meshes — our decomposed assembly replaces them
  allMeshes.forEach(m => { m.visible = false; });

  return {
    kinematicsGroup,
    baseMesh,
    shoulderMesh,
    elbowMesh,
    wristMesh,
    gripperMesh,
    cableMesh,
    calloutSprites,
    traceLines,
    traceLineMat,
    sparkParticles,
    sparkVelocities,
    explodeVectors,
    centroids: {
      base: baseCentroid,
      shoulder: shoulderCentroid,
      elbow: elbowCentroid,
      wrist: wristCentroid,
      gripper: gripperCentroid
    },
    allOriginalMeshes: allMeshes,
    BADGES
  };
}

// ── Update ROB-001 Joint Kinematics, Spark FX & Exploded Disassembly ──
export function updateRobotKinematics(robotKinematics, elapsed, isExploded, ex, sensors, health = 96) {
  if (!robotKinematics) return;

  const {
    baseMesh, shoulderMesh, elbowMesh, wristMesh, gripperMesh, cableMesh,
    calloutSprites, traceLines, traceLineMat, sparkParticles, sparkVelocities,
    explodeVectors, centroids, BADGES
  } = robotKinematics;

  // Smooth cubic ease for weighted mechanical disassembly
  const t = Math.min(1.0, Math.max(0.0, ex));
  const easeEx = t * t * (3 - 2 * t);

  const isRunning = health > 20;

  if (!isExploded) {
    // ── Normal Operation: Joint Kinematics ──────────────────────────

    // J1 Turntable: Slow continuous yaw oscillation
    if (baseMesh) {
      baseMesh.position.set(0, 0, 0);
      baseMesh.rotation.set(0, 0, 0);
    }

    // J2 Shoulder: Subtle pitch oscillation
    if (shoulderMesh) {
      shoulderMesh.position.set(0, 0, 0);
      const j2Angle = Math.sin(elapsed * 0.8) * 0.012;
      shoulderMesh.rotation.set(j2Angle, 0, 0);
    }

    // J3 Elbow: Counter-phase pitch oscillation
    if (elbowMesh) {
      elbowMesh.position.set(0, 0, 0);
      const j3Angle = Math.sin(elapsed * 1.2 + Math.PI * 0.5) * 0.015;
      elbowMesh.rotation.set(j3Angle, 0, 0);
    }

    // J4-J6 Wrist: Compound micro-motion (roll + pitch)
    if (wristMesh) {
      wristMesh.position.set(0, 0, 0);
      const j4Roll = Math.sin(elapsed * 1.8) * 0.008;
      const j5Pitch = Math.sin(elapsed * 2.2 + 1.0) * 0.006;
      wristMesh.rotation.set(j5Pitch, 0, j4Roll);
    }

    // Gripper: Subtle pneumatic breathing pulse
    if (gripperMesh) {
      gripperMesh.position.set(0, 0, 0);
      const gripPulse = 1.0 + Math.sin(elapsed * 3.0) * 0.003;
      gripperMesh.scale.set(gripPulse, gripPulse, gripPulse);
      gripperMesh.rotation.set(0, 0, 0);
    }

    // Cable harness: Follow arm motion subtly
    if (cableMesh) {
      cableMesh.position.set(0, 0, 0);
      cableMesh.visible = true;
    }

  } else {
    // ── Exploded Mode: Precision Mechanical Disassembly ─────────────

    if (baseMesh) {
      baseMesh.rotation.set(0, 0, 0);
      baseMesh.position.set(
        explodeVectors.base.x * easeEx,
        explodeVectors.base.y * easeEx,
        explodeVectors.base.z * easeEx
      );
    }

    if (shoulderMesh) {
      shoulderMesh.rotation.set(0, 0, 0);
      shoulderMesh.position.set(
        explodeVectors.shoulder.x * easeEx,
        explodeVectors.shoulder.y * easeEx,
        explodeVectors.shoulder.z * easeEx
      );
    }

    if (elbowMesh) {
      elbowMesh.rotation.set(0, 0, 0);
      elbowMesh.position.set(
        explodeVectors.elbow.x * easeEx,
        explodeVectors.elbow.y * easeEx,
        explodeVectors.elbow.z * easeEx
      );
    }

    if (wristMesh) {
      wristMesh.rotation.set(0, 0, 0);
      wristMesh.position.set(
        explodeVectors.wrist.x * easeEx,
        explodeVectors.wrist.y * easeEx,
        explodeVectors.wrist.z * easeEx
      );
    }

    if (gripperMesh) {
      gripperMesh.rotation.set(0, 0, 0);
      gripperMesh.scale.set(1, 1, 1);
      gripperMesh.position.set(
        explodeVectors.gripper.x * easeEx,
        explodeVectors.gripper.y * easeEx,
        explodeVectors.gripper.z * easeEx
      );
    }

    if (cableMesh) {
      cableMesh.position.set(
        explodeVectors.cable.x * easeEx,
        explodeVectors.cable.y * easeEx,
        explodeVectors.cable.z * easeEx
      );
    }
  }

  // ── Technical CAD Exploded Trace Leader Lines ──────────────────────
  if (traceLines && traceLineMat) {
    if (easeEx > 0.02) {
      traceLineMat.opacity = Math.min(0.85, easeEx * 1.1);
      const posAttr = traceLines.geometry.attributes.position;
      const arr = posAttr.array;

      // Each pair: [original centroid position] → [current exploded position]
      const meshes = [baseMesh, shoulderMesh, elbowMesh, wristMesh, gripperMesh, cableMesh];
      const centroidKeys = ['base', 'shoulder', 'elbow', 'wrist', 'gripper', 'elbow'];
      const explodeKeys = ['base', 'shoulder', 'elbow', 'wrist', 'gripper', 'cable'];

      for (let i = 0; i < Math.min(meshes.length, 8); i++) {
        const mesh = meshes[i];
        const c = centroids[centroidKeys[i]];
        const ev = explodeVectors[explodeKeys[i]];
        if (c && ev) {
          // Start point: original centroid
          arr[i * 6] = c.x;
          arr[i * 6 + 1] = c.y;
          arr[i * 6 + 2] = c.z;
          // End point: exploded position
          arr[i * 6 + 3] = c.x + ev.x * easeEx;
          arr[i * 6 + 4] = c.y + ev.y * easeEx;
          arr[i * 6 + 5] = c.z + ev.z * easeEx;
        }
      }

      // Additional leader lines for badges 07 and 08
      if (BADGES.length >= 8) {
        for (let bi = 6; bi < Math.min(8, BADGES.length); bi++) {
          const badge = BADGES[bi];
          const bc = badge.centroid;
          arr[bi * 6] = bc.x;
          arr[bi * 6 + 1] = bc.y;
          arr[bi * 6 + 2] = bc.z;
          arr[bi * 6 + 3] = bc.x + badge.off[0] * easeEx;
          arr[bi * 6 + 4] = bc.y + badge.off[1] * easeEx;
          arr[bi * 6 + 5] = bc.z + badge.off[2] * easeEx;
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

  // ── BOM Technical Callout Badges ──────────────────────────────────
  if (calloutSprites) {
    const badgeOpacity = Math.max(0, Math.min(0.95, (easeEx - 0.15) / 0.85));
    calloutSprites.forEach(sprite => {
      sprite.material.opacity = badgeOpacity;
      sprite.visible = badgeOpacity > 0.05;
      if (sprite.userData.basePos && sprite.userData.explodeOffset) {
        const base = sprite.userData.basePos;
        const off = sprite.userData.explodeOffset;
        sprite.position.set(
          base.x + off[0] * easeEx * 0.3,
          base.y + off[1] * easeEx * 0.3,
          base.z + off[2] * easeEx * 0.3
        );
      }
    });
  }

  // ── Welding Spark Particles (Active Only During Normal Operation) ──
  if (sparkParticles && sparkVelocities) {
    if (!isExploded && isRunning) {
      sparkParticles.visible = true;
      const posAttr = sparkParticles.geometry.attributes.position;
      const arr = posAttr.array;
      const originX = centroids.gripper.x;
      const originY = centroids.gripper.y;
      const originZ = centroids.gripper.z;

      for (let i = 0; i < sparkVelocities.length; i++) {
        const v = sparkVelocities[i];
        v.life += 0.06;
        if (v.life > 1.0) {
          v.life = 0;
          arr[i * 3] = originX + (Math.random() - 0.5) * 0.03;
          arr[i * 3 + 1] = originY + (Math.random() - 0.5) * 0.02;
          arr[i * 3 + 2] = originZ + (Math.random() - 0.5) * 0.03;
          v.vx = (Math.random() - 0.5) * 0.28;
          v.vy = Math.random() * 0.18 + 0.04;
          v.vz = (Math.random() - 0.5) * 0.28;
        } else {
          arr[i * 3] += v.vx * 0.018;
          arr[i * 3 + 1] += v.vy * 0.018 - 0.004; // gravity
          arr[i * 3 + 2] += v.vz * 0.018;
        }
      }
      posAttr.needsUpdate = true;
    } else {
      sparkParticles.visible = false;
    }
  }
}
