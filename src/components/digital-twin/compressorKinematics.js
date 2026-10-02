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
 * COMP-201 Dual-Stage Air Compressor Kinematics & Precision Exploded CAD View
 * 
 * Sub-assemblies:
 * 1. Aerodynamic Cooling Flywheel (Wheel__0) - Clockwise rotation, slides +Z in exploded view
 * 2. Motor Drive Pulley & Shaft (Engine_Drive_Shaft__0) - High-speed clockwise rotation (4.88:1 ratio), slides +Z in exploded view
 * 3. High-Torque V-Belt (Belt__0) - Dynamic tension vibration, slides +Z in exploded view
 * 4. Condor MDR Pressure Switch (Switch__0) - Slides +Y & +X in exploded view
 * 5. Dual Regulator & Manifold (Knob__0) - Slides +Y & -X in exploded view
 * 6. Twin Cylinder Head & Intercooler - Highlighted with CAD leader line & BOM badge
 * 7. 200L ASME Receiver Tank (Compressor__0) - 100% solid, closed, undisturbed structural datum
 */
export function setupCompressorKinematics(glbScene, compSubMeshes, rootAssemblyGroup) {
  if (!glbScene || !compSubMeshes) return null;

  glbScene.updateMatrixWorld(true);

  const parentGroup = rootAssemblyGroup || glbScene.parent || glbScene;
  const kinematicsGroup = new THREE.Group();
  kinematicsGroup.name = 'COMP201_Kinematics_Assembly';
  parentGroup.add(kinematicsGroup);

  const parts = {};

  // ── 1. Aerodynamic Cooling Flywheel (Wheel__0) ──
  const origWheel = compSubMeshes['Wheel__0'];
  let flywheelPivot = null;
  let flywheelBasePos = null;

  if (origWheel) {
    const wheelBox = new THREE.Box3().setFromObject(origWheel);
    flywheelBasePos = wheelBox.getCenter(new THREE.Vector3());

    // Bake world matrix into a clean, detached geometry
    const bakedGeo = origWheel.geometry.clone();
    bakedGeo.applyMatrix4(origWheel.matrixWorld);
    // Center geometry on its rotational axis
    bakedGeo.translate(-flywheelBasePos.x, -flywheelBasePos.y, -flywheelBasePos.z);
    bakedGeo.computeVertexNormals();

    const flywheelMesh = new THREE.Mesh(bakedGeo, origWheel.material);
    flywheelMesh.name = 'COMP_Flywheel_Mesh';
    flywheelMesh.castShadow = true;
    flywheelMesh.receiveShadow = true;

    flywheelPivot = new THREE.Group();
    flywheelPivot.name = 'COMP_Flywheel_Pivot';
    flywheelPivot.position.copy(flywheelBasePos);
    flywheelPivot.add(flywheelMesh);

    flywheelMesh.userData = {
      isSubAssembly: true,
      subKey: 'flywheel',
      partName: 'Aerodynamic Cooling Flywheel & Cast-Iron Pulley',
      partSpec: 'Ø1190mm Dynamic Balance Grade G2.5 • Directional Fan Blades • Integrated Counterbalance Weight',
      tempSensor: 'temperature',
      vibSensor: 'vibration',
      originalLocalPos: flywheelBasePos.clone()
    };

    // Hide original mesh and add pivot to kinematics group
    origWheel.visible = false;
    kinematicsGroup.add(flywheelPivot);
    parts.flywheel = { pivot: flywheelPivot, mesh: flywheelMesh, basePos: flywheelBasePos.clone() };
  }

  // ── 2. Motor Drive Pulley & Shaft (Engine_Drive_Shaft__0) ──
  const origShaft = compSubMeshes['Engine_Drive_Shaft__0'];
  let motorPivot = null;
  let motorBasePos = null;

  if (origShaft) {
    const shaftBox = new THREE.Box3().setFromObject(origShaft);
    motorBasePos = shaftBox.getCenter(new THREE.Vector3());

    const bakedGeo = origShaft.geometry.clone();
    bakedGeo.applyMatrix4(origShaft.matrixWorld);
    bakedGeo.translate(-motorBasePos.x, -motorBasePos.y, -motorBasePos.z);
    bakedGeo.computeVertexNormals();

    const shaftMesh = new THREE.Mesh(bakedGeo, origShaft.material);
    shaftMesh.name = 'COMP_MotorShaft_Mesh';
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;

    motorPivot = new THREE.Group();
    motorPivot.name = 'COMP_MotorShaft_Pivot';
    motorPivot.position.copy(motorBasePos);
    motorPivot.add(shaftMesh);

    shaftMesh.userData = {
      isSubAssembly: true,
      subKey: 'motor-pulley',
      partName: '5.5 kW TEFC Motor Drive Pulley & Crankshaft Journal',
      partSpec: '5.5 kW 400V 3-Phase Induction Motor • 1450 RPM • Keyed Ground Hub • DIN 6885 Form A',
      tempSensor: 'bearingNDE',
      vibSensor: 'vibration',
      originalLocalPos: motorBasePos.clone()
    };

    origShaft.visible = false;
    kinematicsGroup.add(motorPivot);
    parts.motorPulley = { pivot: motorPivot, mesh: shaftMesh, basePos: motorBasePos.clone() };
  }

  // ── 3. High-Torque V-Belt (Belt__0) ──
  const origBelt = compSubMeshes['Belt__0'];
  let beltMesh = null;
  let beltBasePos = null;

  if (origBelt) {
    const beltBox = new THREE.Box3().setFromObject(origBelt);
    beltBasePos = beltBox.getCenter(new THREE.Vector3());

    const bakedGeo = origBelt.geometry.clone();
    bakedGeo.applyMatrix4(origBelt.matrixWorld);
    bakedGeo.translate(-beltBasePos.x, -beltBasePos.y, -beltBasePos.z);
    bakedGeo.computeVertexNormals();

    beltMesh = new THREE.Mesh(bakedGeo, origBelt.material);
    beltMesh.name = 'COMP_VBelt_Mesh';
    beltMesh.position.copy(beltBasePos);
    beltMesh.castShadow = true;
    beltMesh.receiveShadow = true;

    beltMesh.userData = {
      isSubAssembly: true,
      subKey: 'belt',
      partName: 'Chloroprene Reinforced Multi-Rib V-Belt Transmission',
      partSpec: 'High-Tensile Cord Core • Dynamic Tension: 96% • Anti-Static Oil Resistant • ISO 10816-3 Normal',
      tempSensor: 'temperature',
      vibSensor: 'vibrationEnvelope',
      originalLocalPos: beltBasePos.clone()
    };

    origBelt.visible = false;
    kinematicsGroup.add(beltMesh);
    parts.belt = { mesh: beltMesh, basePos: beltBasePos.clone() };
  }

  // ── 4. Condor MDR Auto Cut-off Pressure Switch & Unloader (Switch__0) ──
  const origSwitch = compSubMeshes['Switch__0'];
  let switchMesh = null;
  let switchBasePos = null;

  if (origSwitch) {
    const switchBox = new THREE.Box3().setFromObject(origSwitch);
    switchBasePos = switchBox.getCenter(new THREE.Vector3());

    const bakedGeo = origSwitch.geometry.clone();
    bakedGeo.applyMatrix4(origSwitch.matrixWorld);
    bakedGeo.translate(-switchBasePos.x, -switchBasePos.y, -switchBasePos.z);
    bakedGeo.computeVertexNormals();

    switchMesh = new THREE.Mesh(bakedGeo, origSwitch.material);
    switchMesh.name = 'COMP_PressureSwitch_Mesh';
    switchMesh.position.copy(switchBasePos);
    switchMesh.castShadow = true;
    switchMesh.receiveShadow = true;

    switchMesh.userData = {
      isSubAssembly: true,
      subKey: 'switch',
      partName: 'Condor MDR Pressure Switch & Pneumatic Unloader Valve',
      partSpec: 'Cut-In 6.2 bar / Cut-Out 8.5 bar • Automatic Vent Valve EV-3 • Differential Range: 1.5 - 3.0 bar',
      tempSensor: 'ambientTemp',
      vibSensor: 'vibration',
      originalLocalPos: switchBasePos.clone()
    };

    origSwitch.visible = false;
    kinematicsGroup.add(switchMesh);
    parts.switch = { mesh: switchMesh, basePos: switchBasePos.clone() };
  }

  // ── 5. Dual Micrometer Pressure Regulator & Filter (Knob__0) ──
  const origKnob = compSubMeshes['Knob__0'];
  let knobMesh = null;
  let knobBasePos = null;

  if (origKnob) {
    const knobBox = new THREE.Box3().setFromObject(origKnob);
    knobBasePos = knobBox.getCenter(new THREE.Vector3());

    const bakedGeo = origKnob.geometry.clone();
    bakedGeo.applyMatrix4(origKnob.matrixWorld);
    bakedGeo.translate(-knobBasePos.x, -knobBasePos.y, -knobBasePos.z);
    bakedGeo.computeVertexNormals();

    knobMesh = new THREE.Mesh(bakedGeo, origKnob.material);
    knobMesh.name = 'COMP_Regulator_Mesh';
    knobMesh.position.copy(knobBasePos);
    knobMesh.castShadow = true;
    knobMesh.receiveShadow = true;

    knobMesh.userData = {
      isSubAssembly: true,
      subKey: 'regulator',
      partName: 'Dual Pressure Regulator & Coalescing Air-Water Filter Manifold',
      partSpec: '0 - 12 bar Fine Dial Regulator • 5-Micron Sintered Bronze Element • Manual Drain Sump',
      tempSensor: 'ambientTemp',
      vibSensor: 'vibration',
      originalLocalPos: knobBasePos.clone()
    };

    origKnob.visible = false;
    kinematicsGroup.add(knobMesh);
    parts.knob = { mesh: knobMesh, basePos: knobBasePos.clone() };
  }

  // ── 6. Monolithic Receiver Tank & Twin Cylinder Casting (Compressor__0) ──
  // Remains 100% solid, closed, undisturbed machine structural anchor
  const origBody = compSubMeshes['Compressor__0'];
  if (origBody) {
    origBody.userData = {
      isSubAssembly: true,
      subKey: 'tank',
      partName: 'Cast-Iron Twin Cylinder & 200L ASME Air Receiver Vessel',
      partSpec: '200L Horizontal Receiver • 16 bar Hydrotest • Dual-Stage Intercooled Meehanite Piston Castings',
      tempSensor: 'bearingDE',
      vibSensor: 'vibrationEnvelope',
      originalLocalPos: origBody.position.clone()
    };
    parts.body = origBody;
  }

  // ── 7. Technical CAD Dashed Exploded Leader Lines ──
  const lineCount = 7;
  const leaderLinePositions = new Float32Array(lineCount * 2 * 3);
  const leaderLineGeo = new THREE.BufferGeometry();
  leaderLineGeo.setAttribute('position', new THREE.BufferAttribute(leaderLinePositions, 3));

  const leaderLineMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 0.06,
    gapSize: 0.04,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    linewidth: 2
  });
  const leaderLines = new THREE.LineSegments(leaderLineGeo, leaderLineMat);
  leaderLines.computeLineDistances();
  kinematicsGroup.add(leaderLines);

  // ── 8. 3D Technical BOM Callout Badges ──
  const calloutSprites = [];
  const BADGES = [
    { num: '01', title: 'Cooling Flywheel', sub: 'Balanced G2.5 • Air-Blast Fan', base: flywheelBasePos || new THREE.Vector3(-0.63, 0.54, 0.51), off: [-0.25, 0.95, 1.35] },
    { num: '02', title: 'Reinforced V-Belt', sub: 'Dynamic Tension: 96% • Multi-Rib', base: beltBasePos || new THREE.Vector3(-0.03, 0.54, 0.58), off: [0.10, 1.30, 0.85] },
    { num: '03', title: 'Motor Drive Pulley', sub: '5.5 kW TEFC • 1450 RPM • Keyed', base: motorBasePos || new THREE.Vector3(1.06, 0.29, 0.49), off: [0.35, 0.95, 1.15] },
    { num: '04', title: 'Pressure Switch', sub: 'Condor MDR • 6.2 - 8.5 bar Relief', base: switchBasePos || new THREE.Vector3(2.07, 0.31, -0.06), off: [0.55, 0.85, 0.2] },
    { num: '05', title: 'Dual Regulator', sub: '0-12 bar Precision Manifold & Filter', base: knobBasePos || new THREE.Vector3(-1.88, 0.29, -0.00), off: [-0.55, 0.85, 0.2] },
    { num: '06', title: 'Twin-Cylinder Head', sub: 'Intercooled Dual Stage • 850 L/min', base: new THREE.Vector3(-0.63, 1.15, 0.05), off: [-0.15, 0.90, -0.2] },
    { num: '07', title: '200L ASME Receiver', sub: 'Air Tank • 16 bar Hydrotested', base: new THREE.Vector3(0.0, -0.85, 0.0), off: [0.0, -0.85, 0.9] }
  ];

  BADGES.forEach(b => {
    const sprite = createCalloutSprite(b.num, b.title, b.sub);
    sprite.scale.set(1.5, 0.38, 1);
    sprite.position.set(b.base.x + b.off[0], b.base.y + b.off[1], b.base.z + b.off[2]);
    sprite.userData.basePos = b.base.clone();
    sprite.userData.explodeOffset = b.off;
    kinematicsGroup.add(sprite);
    calloutSprites.push(sprite);
  });

  // ── 9. Cooling Fan Airflow Stream Swarm Particles ──
  const particleCount = 65;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = [];

  for (let i = 0; i < particleCount; i++) {
    // Spawn around front face of flywheel
    particlePositions[i * 3] = (flywheelBasePos?.x ?? -0.63) + (Math.random() - 0.5) * 0.9;
    particlePositions[i * 3 + 1] = (flywheelBasePos?.y ?? 0.54) + (Math.random() - 0.5) * 0.9;
    particlePositions[i * 3 + 2] = (flywheelBasePos?.z ?? 0.51) + Math.random() * 0.1;

    particleVelocities.push({
      vx: (Math.random() - 0.5) * 0.15,
      vy: Math.random() * 0.25 + 0.1, // flow upward towards finned cylinder heads
      vz: -(Math.random() * 0.6 + 0.3), // blow backward through fan blades
      life: Math.random()
    });
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.035,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const airSwarm = new THREE.Points(particleGeo, particleMat);
  kinematicsGroup.add(airSwarm);

  return {
    kinematicsGroup,
    parts,
    leaderLines,
    leaderLineGeo,
    leaderLineMat,
    calloutSprites,
    airSwarm,
    particlePositions,
    particleVelocities,
    flywheelBasePos,
    motorBasePos,
    beltBasePos,
    switchBasePos,
    knobBasePos
  };
}

/**
 * Real-time Animation Loop for COMP-201
 * Controls continuous clock rotation of flywheel and motor pulley,
 * dynamic belt tension flutter, cooling airflow particles, and exploded CAD disassembly.
 */
export function updateCompressorKinematics(kinematics, elapsed, isExploded, explodeProgress, sensors, health) {
  if (!kinematics) return;

  const {
    parts,
    leaderLines,
    leaderLineGeo,
    leaderLineMat,
    calloutSprites,
    airSwarm,
    particlePositions,
    particleVelocities,
    flywheelBasePos,
    motorBasePos,
    beltBasePos,
    switchBasePos,
    knobBasePos
  } = kinematics;

  const ex = explodeProgress; // 0.0 (normal) to 1.0 (fully exploded)

  // ── 1. Continuous Clockwise Rotation (Like Clock Hands) ──
  // Speed: 5.5 kW Induction Motor at ~1450 RPM scaled to visually smooth 3D rate
  const motorSpeed = 12.0; // rad/s
  // Flywheel speed reduced by pulley ratio (1.189m / 0.244m = 4.88:1)
  const flywheelSpeed = motorSpeed / 4.88; // ~2.46 rad/s

  if (parts.motorPulley?.pivot) {
    // Clockwise rotation around the Z-axis
    parts.motorPulley.pivot.rotation.z = -elapsed * motorSpeed;
    // Exploded CAD offset along +Z (separates forward off motor journal)
    parts.motorPulley.pivot.position.z = (motorBasePos?.z ?? 0.49) + ex * 0.95;
  }

  if (parts.flywheel?.pivot) {
    // Clockwise rotation around the Z-axis
    parts.flywheel.pivot.rotation.z = -elapsed * flywheelSpeed;
    // Exploded CAD offset along +Z (separates forward off crankshaft)
    parts.flywheel.pivot.position.z = (flywheelBasePos?.z ?? 0.51) + ex * 1.25;
  }

  // ── 2. V-Belt Dynamics & Exploded Disassembly ──
  if (parts.belt?.mesh) {
    // High-frequency belt tension flutter matching dual-stage compression strokes
    const beltFlutterY = !isExploded ? Math.sin(elapsed * 45) * 0.0012 : 0;
    const beltFlutterX = !isExploded ? Math.cos(elapsed * 45) * 0.0006 : 0;

    parts.belt.mesh.position.x = (beltBasePos?.x ?? -0.03) + beltFlutterX;
    parts.belt.mesh.position.y = (beltBasePos?.y ?? 0.54) + beltFlutterY;
    // Exploded CAD offset along +Z (hangs forward between flywheel and motor)
    parts.belt.mesh.position.z = (beltBasePos?.z ?? 0.58) + ex * 0.70;
  }

  // ── 3. Condor MDR Pressure Switch Disassembly ──
  if (parts.switch?.mesh) {
    parts.switch.mesh.position.x = (switchBasePos?.x ?? 2.07) + ex * 0.35;
    parts.switch.mesh.position.y = (switchBasePos?.y ?? 0.31) + ex * 0.75;
    parts.switch.mesh.position.z = (switchBasePos?.z ?? -0.06);
  }

  // ── 4. Dual Pressure Regulator Disassembly ──
  if (parts.knob?.mesh) {
    parts.knob.mesh.position.x = (knobBasePos?.x ?? -1.88) - ex * 0.35;
    parts.knob.mesh.position.y = (knobBasePos?.y ?? 0.29) + ex * 0.75;
    parts.knob.mesh.position.z = (knobBasePos?.z ?? -0.00);
  }

  // ── 5. Cooling Fan Airflow Stream Swarm Animation ──
  if (airSwarm && airSwarm.geometry) {
    if (isExploded) {
      airSwarm.material.opacity = Math.max(0, 0.65 * (1 - ex * 1.5));
    } else {
      airSwarm.material.opacity = 0.65;
      const count = particlePositions.length / 3;
      const fwX = flywheelBasePos?.x ?? -0.63;
      const fwY = flywheelBasePos?.y ?? 0.54;
      const fwZ = flywheelBasePos?.z ?? 0.51;

      for (let i = 0; i < count; i++) {
        const vel = particleVelocities[i];
        particlePositions[i * 3] += vel.vx * 0.016;
        particlePositions[i * 3 + 1] += vel.vy * 0.016;
        particlePositions[i * 3 + 2] += vel.vz * 0.016;
        vel.life -= 0.016;

        if (vel.life <= 0 || particlePositions[i * 3 + 2] < fwZ - 0.7) {
          // Respawn at flywheel face
          particlePositions[i * 3] = fwX + (Math.random() - 0.5) * 0.8;
          particlePositions[i * 3 + 1] = fwY + (Math.random() - 0.5) * 0.8;
          particlePositions[i * 3 + 2] = fwZ + Math.random() * 0.05;
          vel.life = 0.8 + Math.random() * 0.6;
        }
      }
      airSwarm.geometry.attributes.position.needsUpdate = true;
    }
  }

  // ── 6. Precision Exploded CAD Dashed Leader Lines ──
  if (leaderLines && leaderLineGeo) {
    leaderLineMat.opacity = Math.min(0.85, ex * 1.2);
    if (ex > 0.02) {
      const posAttr = leaderLineGeo.attributes.position;
      const arr = posAttr.array;

      // Line 0: Flywheel (basePos -> exploded Pos)
      arr[0] = flywheelBasePos?.x ?? -0.63;
      arr[1] = flywheelBasePos?.y ?? 0.54;
      arr[2] = flywheelBasePos?.z ?? 0.51;
      arr[3] = flywheelBasePos?.x ?? -0.63;
      arr[4] = flywheelBasePos?.y ?? 0.54;
      arr[5] = (flywheelBasePos?.z ?? 0.51) + ex * 1.25;

      // Line 1: Motor Pulley (basePos -> exploded Pos)
      arr[6] = motorBasePos?.x ?? 1.06;
      arr[7] = motorBasePos?.y ?? 0.29;
      arr[8] = motorBasePos?.z ?? 0.49;
      arr[9] = motorBasePos?.x ?? 1.06;
      arr[10] = motorBasePos?.y ?? 0.29;
      arr[11] = (motorBasePos?.z ?? 0.49) + ex * 0.95;

      // Line 2: V-Belt (basePos -> exploded Pos)
      arr[12] = beltBasePos?.x ?? -0.03;
      arr[13] = beltBasePos?.y ?? 0.54;
      arr[14] = beltBasePos?.z ?? 0.58;
      arr[15] = beltBasePos?.x ?? -0.03;
      arr[16] = beltBasePos?.y ?? 0.54;
      arr[17] = (beltBasePos?.z ?? 0.58) + ex * 0.70;

      // Line 3: Pressure Switch (basePos -> exploded Pos)
      arr[18] = switchBasePos?.x ?? 2.07;
      arr[19] = switchBasePos?.y ?? 0.31;
      arr[20] = switchBasePos?.z ?? -0.06;
      arr[21] = (switchBasePos?.x ?? 2.07) + ex * 0.35;
      arr[22] = (switchBasePos?.y ?? 0.31) + ex * 0.75;
      arr[23] = switchBasePos?.z ?? -0.06;

      // Line 4: Dual Regulator (basePos -> exploded Pos)
      arr[24] = knobBasePos?.x ?? -1.88;
      arr[25] = knobBasePos?.y ?? 0.29;
      arr[26] = knobBasePos?.z ?? -0.00;
      arr[27] = (knobBasePos?.x ?? -1.88) - ex * 0.35;
      arr[28] = (knobBasePos?.y ?? 0.29) + ex * 0.75;
      arr[29] = knobBasePos?.z ?? -0.00;

      // Line 5: Twin Cylinder Head (base -> leader offset)
      arr[30] = -0.63; arr[31] = 1.15; arr[32] = 0.05;
      arr[33] = -0.63; arr[34] = 1.15 + ex * 0.55; arr[35] = 0.05;

      // Line 6: 200L ASME Receiver (base -> leader offset)
      arr[36] = 0.0; arr[37] = -0.85; arr[38] = 0.0;
      arr[39] = 0.0; arr[40] = -0.85 - ex * 0.55; arr[41] = 0.8 * ex;

      posAttr.needsUpdate = true;
      leaderLines.computeLineDistances();
    }
  }

  // ── 7. 3D Technical BOM Callout Badges ──
  if (calloutSprites) {
    const badgeOpacity = Math.min(1.0, Math.max(0, (ex - 0.25) / 0.75));
    calloutSprites.forEach((sprite, idx) => {
      sprite.material.opacity = badgeOpacity;
      if (badgeOpacity > 0) {
        const base = sprite.userData.basePos;
        const off = sprite.userData.explodeOffset;
        const hoverWave = Math.sin(elapsed * 2 + idx * 0.8) * 0.025;
        sprite.position.set(
          base.x + off[0] * ex,
          base.y + off[1] * ex + hoverWave,
          base.z + off[2] * ex
        );
      }
    });
  }
}
