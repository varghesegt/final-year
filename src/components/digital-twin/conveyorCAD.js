import * as THREE from 'three';

/**
 * High-Profile Parametric PBR 3D CAD Assembly for CONV-401
 * Model: Dorner 2200 Series Heavy Modular Conveyor w/ SEW Helical-Bevel Gearmotor,
 * Timken UC207-20 Pillow Block Bearings, Optical Tracking Portal & Cleated Moving Belt.
 */
export function buildHighProfileConveyor() {
  const root = new THREE.Group();
  root.name = 'HighProfile_CONV-401';

  // PBR Industrial Material Palette
  const frameAlum = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.24 });
  const darkAnodized = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.36 });
  const steelPolished = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.94, roughness: 0.14 });
  const sewCobalt = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.55, roughness: 0.28 });
  const safetyOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.25, roughness: 0.42 });
  const safetyAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.38 });
  const urethaneBelt = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.08, roughness: 0.85 });
  const cleatMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.15, roughness: 0.65 });
  const bearingCast = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.5, roughness: 0.4 });
  const crateBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.15, roughness: 0.55 });
  const crateAmber = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.18, roughness: 0.52 });
  const ledCyan = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8, roughness: 0.2 });

  const subAssemblies = [];
  const registerExplode = (mesh, explodeVec) => {
    mesh.userData.originalLocalPos = mesh.position.clone();
    mesh.userData.explodeVec = new THREE.Vector3(...explodeVec);
    subAssemblies.push(mesh);
  };

  const tagPart = (obj, partName, partSpec, tempKey, vibKey, subKey) => {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.partName = partName;
        child.userData.partSpec = partSpec;
        child.userData.tempKey = tempKey;
        child.userData.vibKey = vibKey;
        child.userData.subKey = subKey;
        child.userData.isSubAssembly = true;
      }
    });
  };

  // ── 1. Extruded Aluminum T-Slot Side Rails & Stanchion Support Frame ──────
  const frameGroup = new THREE.Group();
  const frameLen = 6.0;
  const bedY = 1.25;
  const halfW = 0.72;

  for (const side of [-1, 1]) {
    // Upper + Lower T-Slot extrusion flanges
    const rail = new THREE.Mesh(new THREE.BoxGeometry(frameLen, 0.24, 0.09), frameAlum);
    rail.position.set(0, bedY, side * halfW);
    frameGroup.add(rail);

    const railGroove = new THREE.Mesh(new THREE.BoxGeometry(frameLen - 0.1, 0.05, 0.105), darkAnodized);
    railGroove.position.set(0, bedY, side * halfW);
    frameGroup.add(railGroove);

    // Side guide-rail bar above belt edge
    const guideRail = new THREE.Mesh(new THREE.BoxGeometry(frameLen - 0.5, 0.05, 0.03), steelPolished);
    guideRail.position.set(0, bedY + 0.24, side * (halfW - 0.06));
    frameGroup.add(guideRail);

    for (const bx of [-2.4, -0.8, 0.8, 2.4]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.04), darkAnodized);
      bracket.position.set(bx, bedY + 0.17, side * (halfW - 0.04));
      frameGroup.add(bracket);
    }
  }

  // 3 Heavy H-Frame Support Stanchions + Vibration Isolator Pads
  for (const lx of [-2.2, 0.0, 2.2]) {
    for (const lz of [-0.68, 0.68]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, bedY - 0.14, 0.11), darkAnodized);
      leg.position.set(lx, (bedY - 0.06) / 2, lz);
      frameGroup.add(leg);

      const gusset = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.13), frameAlum);
      gusset.position.set(lx, bedY - 0.16, lz);
      frameGroup.add(gusset);

      const anchorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.26), steelPolished);
      anchorPlate.position.set(lx, 0.04, lz);
      frameGroup.add(anchorPlate);

      const rubberPad = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.03, 16), urethaneBelt);
      rubberPad.position.set(lx, 0.015, lz);
      frameGroup.add(rubberPad);
    }

    const crossTie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 1.36), darkAnodized);
    crossTie.position.set(lx, 0.48, 0);
    frameGroup.add(crossTie);
  }

  // Longitudinal brace + stainless return rollers under bed
  const longBrace = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.08), darkAnodized);
  longBrace.position.set(0, 0.48, 0);
  frameGroup.add(longBrace);

  const returnRollers = [];
  for (const rx of [-2.0, -1.0, 0.0, 1.0, 2.0]) {
    const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.28, 16), steelPolished);
    rMesh.rotation.x = Math.PI / 2;
    rMesh.position.set(rx, bedY - 0.14, 0);
    frameGroup.add(rMesh);
    returnRollers.push(rMesh);
  }

  // Slider bed plate
  const sliderBed = new THREE.Mesh(new THREE.BoxGeometry(frameLen - 0.35, 0.04, 1.24), steelPolished);
  sliderBed.position.set(0, bedY + 0.07, 0);
  frameGroup.add(sliderBed);

  tagPart(
    frameGroup,
    'Dorner 2200 Anodized Frame & H-Stand Bed',
    'Extruded Aluminum T-Slot Side Rails • 3× Bolted H-Stands • Stainless Slider Bed',
    'ambientTemp',
    'vibration',
    'conveyor-frame'
  );
  root.add(frameGroup);
  registerExplode(frameGroup, [0, -0.45, 0]);

  // ── 2. Moving Cleated Urethane Belt & Industrial Parcels ───────────────────
  const beltGroup = new THREE.Group();
  const topBelt = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.035, 1.22), urethaneBelt);
  topBelt.position.set(0, bedY + 0.11, 0);
  beltGroup.add(topBelt);

  const bottomBelt = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.025, 1.22), urethaneBelt);
  bottomBelt.position.set(0, bedY - 0.08, 0);
  beltGroup.add(bottomBelt);

  const cleats = [];
  const cleatCount = 24;
  for (let i = 0; i < cleatCount; i++) {
    const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.032, 1.16), cleatMat);
    cleat.userData.phase = i / cleatCount;
    beltGroup.add(cleat);
    cleats.push(cleat);
  }

  const parcels = [];
  const parcelConfigs = [
    { w: 0.62, h: 0.42, d: 0.56, mat: crateBlue, offset: 0.08, beltPhase: 0.12 },
    { w: 0.54, h: 0.36, d: 0.52, mat: crateAmber, offset: -0.06, beltPhase: 0.45 },
    { w: 0.68, h: 0.46, d: 0.58, mat: crateBlue, offset: 0.02, beltPhase: 0.78 },
  ];
  parcelConfigs.forEach((cfg) => {
    const tote = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), cfg.mat);
    tote.add(body);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.04, 0.05, cfg.d + 0.04), darkAnodized);
    rim.position.y = cfg.h / 2 - 0.02;
    tote.add(rim);
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.22), steelPolished);
    label.position.set(0, 0, cfg.d / 2 + 0.005);
    tote.add(label);
    tote.userData.beltPhase = cfg.beltPhase;
    tote.userData.h = cfg.h;
    tote.userData.zOffset = cfg.offset;
    beltGroup.add(tote);
    parcels.push(tote);
  });

  tagPart(
    beltGroup,
    'Cleated Modular Urethane Belt & WIP Totes',
    '12m Cleated FDA Urethane Belt • Dynamic Tension Monitoring • Optical Tracked Totes',
    'temperature',
    'vibration',
    'conveyor-belt'
  );
  root.add(beltGroup);
  registerExplode(beltGroup, [0, 0.75, 0]);

  // ── 3. Head Drive Drum, Timken Pillow Bearings & SEW Helical Gearmotor ────
  const driveGroup = new THREE.Group();

  // Head rubber-lagged drive drum
  const headDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.32, 24), safetyAmber);
  headDrum.rotation.x = Math.PI / 2;
  headDrum.position.set(2.94, bedY + 0.01, 0);
  driveGroup.add(headDrum);

  const driveShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.95, 16), steelPolished);
  driveShaft.rotation.x = Math.PI / 2;
  driveShaft.position.set(2.94, bedY + 0.01, 0.16);
  driveGroup.add(driveShaft);

  // Dual Timken UC207-20 Pillow Block Bearings (Front DE & Rear NDE)
  for (const side of [-1, 1]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.12), bearingCast);
    housing.position.set(2.94, bedY + 0.01, side * 0.78);
    driveGroup.add(housing);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16), steelPolished);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(2.94, bedY + 0.01, side * 0.78);
    driveGroup.add(collar);
  }

  // Helical-Bevel Gearbox Reducer + 5.5 kW TEFC Cobalt Drive Motor
  const gearbox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.34), darkAnodized);
  gearbox.position.set(2.86, bedY + 0.02, 1.02);
  driveGroup.add(gearbox);

  const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.58, 24), sewCobalt);
  motorBody.rotation.z = Math.PI / 2;
  motorBody.position.set(2.48, bedY + 0.05, 1.05);
  driveGroup.add(motorBody);

  for (let fx = -0.2; fx <= 0.2; fx += 0.08) {
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.025, 24), sewCobalt);
    fin.rotation.z = Math.PI / 2;
    fin.position.set(2.48 + fx, bedY + 0.05, 1.05);
    driveGroup.add(fin);
  }

  const fanCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.18, 24), darkAnodized);
  fanCowl.rotation.z = Math.PI / 2;
  fanCowl.position.set(2.14, bedY + 0.05, 1.05);
  driveGroup.add(fanCowl);

  const junctionBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), sewCobalt);
  junctionBox.position.set(2.55, bedY + 0.30, 1.05);
  driveGroup.add(junctionBox);

  // Nip-Point OSHA Orange Safety Guard
  const headGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 1.44), safetyOrange);
  headGuard.position.set(3.12, bedY + 0.01, 0);
  driveGroup.add(headGuard);

  tagPart(
    driveGroup,
    '5.5 kW Helical-Bevel Gearmotor & Timken DE Bearings',
    'SEW 415V 960 RPM Gearmotor • Timken UC207-20 DE Pillow Block • OSHA Nip Guard',
    'bearingDE',
    'vibrationEnvelope',
    'conveyor-drive'
  );
  root.add(driveGroup);
  registerExplode(driveGroup, [0.95, 0.15, 0.55]);

  // ── 4. Tail Crowned Idler Drum & Tension Take-Up Assembly ─────────────────
  const tailGroup = new THREE.Group();
  const tailDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.32, 24), steelPolished);
  tailDrum.rotation.x = Math.PI / 2;
  tailDrum.position.set(-2.94, bedY + 0.01, 0);
  tailGroup.add(tailDrum);

  const tailGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.30, 1.44), safetyOrange);
  tailGuard.position.set(-3.11, bedY + 0.01, 0);
  tailGroup.add(tailGuard);

  for (const side of [-1, 1]) {
    const takeupBlock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.10), bearingCast);
    takeupBlock.position.set(-2.94, bedY + 0.01, side * 0.77);
    tailGroup.add(takeupBlock);

    const screwRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 10), steelPolished);
    screwRod.rotation.z = Math.PI / 2;
    screwRod.position.set(-2.78, bedY + 0.01, side * 0.77);
    tailGroup.add(screwRod);
  }

  tagPart(
    tailGroup,
    'Tail Crowned Roller & Take-Up Tensioner',
    'Crowned Tracking Pulley • Dual Acme Screw Take-Ups • Tail Pillow Bearings',
    'bearingNDE',
    'vibration',
    'conveyor-tail'
  );
  root.add(tailGroup);
  registerExplode(tailGroup, [-0.95, 0.15, 0]);

  // ── 5. Overhead Optical Vision & Belt-Drift Sensor Portal ────────────────
  const portalGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.08), frameAlum);
    post.position.set(0.35, bedY + 0.46, side * 0.76);
    portalGroup.add(post);
  }
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 1.62), darkAnodized);
  crossbar.position.set(0.35, bedY + 0.92, 0);
  portalGroup.add(crossbar);

  const scannerHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.36), sewCobalt);
  scannerHead.position.set(0.35, bedY + 0.85, 0);
  portalGroup.add(scannerHead);

  const scanBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.28), ledCyan);
  scanBar.position.set(0.35, bedY + 0.77, 0);
  portalGroup.add(scanBar);

  // Stack light tower on portal corner
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12), steelPolished);
  pole.position.set(0.35, bedY + 1.10, 0.76);
  portalGroup.add(pole);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), ledCyan);
  beacon.position.set(0.35, bedY + 1.24, 0.76);
  portalGroup.add(beacon);

  tagPart(
    portalGroup,
    'Optical Vision & Belt Edge Drift Portal',
    'Sick Photoelectric Edge Sensor • Top-Mount SKU Scanner • Stack Status Beacon',
    'ambientTemp',
    'vibration',
    'conveyor-portal'
  );
  root.add(portalGroup);
  registerExplode(portalGroup, [0, 1.25, 0]);

  root.userData.conveyorKinematics = {
    subAssemblies,
    cleats,
    parcels,
    headDrum,
    tailDrum,
    returnRollers,
    bedY,
    scanBar,
    beacon,
  };

  return root;
}

/**
 * Animates belt cleats, parcels, rollers, optical scan glow, and smooth Exploded CAD separation.
 */
export function updateConveyorKinematics(kinematics, elapsed, isExploded, exProgress, sensors, health = 85) {
  if (!kinematics) return;

  const speedMps = sensors?.beltSpeedMps ?? 1.42;
  const speedScale = (health < 35 ? 0.35 : 1.0) * (speedMps / 1.42);
  const beltTravel = elapsed * 0.24 * speedScale;
  const spanX = 5.65;
  const halfSpan = spanX / 2;

  // Smooth belt cleat progression along top and return runs
  kinematics.cleats.forEach((cleat) => {
    const p = (cleat.userData.phase + beltTravel) % 1.0;
    if (p < 0.5) {
      // Top active carry run
      const u = p * 2.0;
      cleat.position.set(-halfSpan + u * spanX, kinematics.bedY + 0.135, 0);
    } else {
      // Bottom return run
      const u = (p - 0.5) * 2.0;
      cleat.position.set(halfSpan - u * spanX, kinematics.bedY - 0.105, 0);
    }
  });

  // Animate industrial WIP totes smoothly across belt
  kinematics.parcels.forEach((tote) => {
    const u = (tote.userData.beltPhase + beltTravel * 1.15) % 1.0;
    const x = -2.45 + u * 4.9;
    tote.position.set(x, kinematics.bedY + 0.13 + tote.userData.h / 2, tote.userData.zOffset);
  });

  // Rotate drums and rollers proportional to linear belt speed
  const rotStep = 0.08 * speedScale;
  kinematics.headDrum.rotation.y += rotStep;
  kinematics.tailDrum.rotation.y += rotStep;
  kinematics.returnRollers.forEach((r) => { r.rotation.y -= rotStep * 1.4; });

  // Optical beacon status pulse (safe across PBR & Thermal ShaderMaterial swaps)
  if (kinematics.beacon?.material?.color && kinematics.beacon.material.emissive) {
    kinematics.beacon.material.color.setHex(health < 60 ? 0xf59e0b : 0x10b981);
    kinematics.beacon.material.emissive.setHex(health < 60 ? 0xd97706 : 0x059669);
    kinematics.beacon.material.emissiveIntensity = 0.65 + Math.sin(elapsed * 4.0) * 0.3;
  }

  // Apply smooth exploded CAD vector separation
  kinematics.subAssemblies.forEach((grp) => {
    if (grp.userData.originalLocalPos && grp.userData.explodeVec) {
      grp.position.lerpVectors(
        grp.userData.originalLocalPos,
        grp.userData.originalLocalPos.clone().add(grp.userData.explodeVec),
        exProgress
      );
    }
  });
}
