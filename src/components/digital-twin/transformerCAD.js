import * as THREE from 'three';

/**
 * High-Profile Parametric PBR 3D CAD Assembly for XFMR-302
 * Model: ABB 1000 kVA 11 kV / 415 V Dyn11 ONAN/ONAF Oil Distribution Transformer
 * w/ 4 Radiator Fin Banks, Dual ONAF Fans, Overhead Conservator Drum, MOG Dial,
 * Buchholz Gas Relay, Silica Gel Breather, Fluted 11kV Bushings & DGA Marshalling Cabinet.
 */
export function buildHighProfileTransformer() {
  const root = new THREE.Group();
  root.name = 'HighProfile_XFMR-302';

  // Authentic Substation Material Palette
  const tankEnamel = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.62, roughness: 0.34 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.78, roughness: 0.32 });
  const radiatorFinMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.72, roughness: 0.28 });
  const porcelainGlaze = new THREE.MeshStandardMaterial({ color: 0x7c2d12, metalness: 0.12, roughness: 0.16 });
  const copperBus = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.18 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.22 });
  const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.94, roughness: 0.14 });
  const valveRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.35, roughness: 0.35 });
  const silicaBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.15, roughness: 0.25, transparent: true, opacity: 0.85 });
  const cabinetSteel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.52, roughness: 0.38 });
  const dialFace = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.1, roughness: 0.4 });
  const ledOk = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 });

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

  // ── 1. Structural Steel Skid Base & Copper Earthing Busbar ────────────────
  const skidGroup = new THREE.Group();
  for (const sz of [-0.95, 0.95]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 0.22), darkSteel);
    beam.position.set(0, 0.08, sz);
    skidGroup.add(beam);
  }
  for (const sx of [-1.25, 1.25]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 2.2), darkSteel);
    cross.position.set(sx, 0.08, 0);
    skidGroup.add(cross);

    for (const sz of [-1.05, 1.05]) {
      const jackPad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.28), stainlessMat);
      jackPad.position.set(sx, 0.025, sz);
      skidGroup.add(jackPad);
    }
  }
  // Copper neutral grounding strap along skid side
  const groundStrap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.08), copperBus);
  groundStrap.position.set(0, 0.18, 1.06);
  skidGroup.add(groundStrap);

  tagPart(
    skidGroup,
    'Heavy Rolled Steel Underbase Skid & Copper Earthing',
    'Galvanized I-Beam Foundation Skid • Dual Neutral Earth Clamps • Anti-Vibration Pads',
    'ambientTemp',
    'vibration',
    'xfmr-skid'
  );
  root.add(skidGroup);
  registerExplode(skidGroup, [0, -0.5, 0]);

  // ── 2. Main Hermetic Welded Steel Tank & Bolted Top Cover ─────────────────
  const tankGroup = new THREE.Group();
  const tankBody = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.05, 1.75), tankEnamel);
  tankBody.position.set(0, 1.18, 0);
  tankGroup.add(tankBody);

  // Structural tank belt ribs & top bolted cover rim
  for (const ry of [0.55, 1.18, 1.82]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.07, 1.84), darkSteel);
    rib.position.set(0, ry, 0);
    tankGroup.add(rib);
  }
  const coverRim = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.09, 1.94), darkSteel);
  coverRim.position.set(0, 2.22, 0);
  tankGroup.add(coverRim);

  for (let bx = -1.2; bx <= 1.2; bx += 0.4) {
    for (const bz of [-0.90, 0.90]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 6), stainlessMat);
      bolt.position.set(bx, 2.28, bz);
      tankGroup.add(bolt);
    }
  }

  // Stainless OEM Rating Nameplate & Drain Sampling Valve
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.03), stainlessMat);
  plate.position.set(-0.65, 1.28, 0.89);
  tankGroup.add(plate);

  const sampleValve = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12), brassMat);
  sampleValve.rotation.x = Math.PI / 2;
  sampleValve.position.set(-0.85, 0.42, 0.95);
  tankGroup.add(sampleValve);

  const prvPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 16), darkSteel);
  prvPipe.position.set(0.92, 2.50, -0.58);
  tankGroup.add(prvPipe);

  const prvCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.06, 16), valveRed);
  prvCap.position.set(0.92, 2.78, -0.58);
  tankGroup.add(prvCap);

  tagPart(
    tankGroup,
    'Main Mineral-Oil Tank & Cu Winding Core',
    'ABB 1000 kVA Hermetic Steel Tank • Dyn11 Copper Windings • Shell Diala S4 Oil',
    'bearingDE',
    'vibration',
    'xfmr-tank'
  );
  root.add(tankGroup);
  registerExplode(tankGroup, [0, 0, 0]);

  // ── 3. Four Corrugated Radiator Cooling Banks & Dual ONAF Cooling Fans ────
  const fanAssemblies = [];
  const createRadiatorBank = (sideSign, bankName) => {
    const radGroup = new THREE.Group();
    const xBase = sideSign * 1.72;

    for (const zBank of [-0.48, 0.48]) {
      // Top & Bottom manifold header pipes connected to tank wall
      for (const py of [0.48, 1.88]) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.58, 16), tankEnamel);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(sideSign * 1.48, py, zBank);
        radGroup.add(pipe);

        // Butterfly isolation valve
        const vBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), valveRed);
        vBody.rotation.z = Math.PI / 2;
        vBody.position.set(sideSign * 1.38, py, zBank);
        radGroup.add(vBody);
      }

      // 8 Pressed Corrugated Radiator Fin Panels per bank
      for (let f = -0.30; f <= 0.30; f += 0.085) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.54, 0.028), radiatorFinMat);
        fin.position.set(xBase, 1.18, zBank + f);
        radGroup.add(fin);
      }
    }

    // Side-mounted ONAF Forced-Air Fan Shroud + Rotating Impeller
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 24, 1, true), darkSteel);
    shroud.rotation.z = Math.PI / 2;
    shroud.position.set(xBase + sideSign * 0.34, 1.18, 0);
    radGroup.add(shroud);

    const hub = new THREE.Group();
    hub.position.set(xBase + sideSign * 0.34, 1.18, 0);
    const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.10, 16), stainlessMat);
    centerCap.rotation.z = Math.PI / 2;
    hub.add(centerCap);
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.07), stainlessMat);
      const angle = (b / 6) * Math.PI * 2;
      blade.position.set(0, Math.cos(angle) * 0.17, Math.sin(angle) * 0.17);
      blade.rotation.x = angle;
      hub.add(blade);
    }
    radGroup.add(hub);
    fanAssemblies.push({ hub, sideSign });

    tagPart(
      radGroup,
      `ONAF/ONAN Radiator Bank & Fan (${bankName})`,
      '16-Fin Vertical Heat Exchanger Banks • Butterfly Isolation Valves • Auto ONAF Blower',
      'temperature',
      'vibration',
      `xfmr-rad-${bankName.toLowerCase()}`
    );
    root.add(radGroup);
    registerExplode(radGroup, [sideSign * 1.1, 0, 0]);
  };

  createRadiatorBank(-1, 'Left');
  createRadiatorBank(1, 'Right');

  // ── 4. Overhead Cylindrical Oil Conservator, MOG Gauge, Buchholz & Breather
  const conservatorGroup = new THREE.Group();

  // Structural pipe brackets rising from top cover
  for (const bx of [-0.62, 0.62]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 12), darkSteel);
    leg.position.set(bx, 2.52, -0.45);
    conservatorGroup.add(leg);
  }

  // Main cylindrical expansion drum
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.95, 28), tankEnamel);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, 2.95, -0.45);
  conservatorGroup.add(drum);

  for (const ex of [-0.99, 0.99]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.05, 28), darkSteel);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(ex, 2.95, -0.45);
    conservatorGroup.add(cap);
  }

  // Magnetic Oil Level Gauge (MOG Dial)
  const mogRim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), darkSteel);
  mogRim.rotation.x = Math.PI / 2;
  mogRim.position.set(0.55, 2.95, -0.05);
  conservatorGroup.add(mogRim);

  const mogFace = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 20), dialFace);
  mogFace.rotation.x = Math.PI / 2;
  mogFace.position.set(0.55, 2.95, -0.045);
  conservatorGroup.add(mogFace);

  // Buchholz Gas-Actuated Surge Relay along inclined riser pipe
  const equalizerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.58, 14), tankEnamel);
  equalizerPipe.rotation.x = 0.25;
  equalizerPipe.position.set(0, 2.52, -0.38);
  conservatorGroup.add(equalizerPipe);

  const buchholzBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.26), brassMat);
  buchholzBody.position.set(0, 2.54, -0.38);
  conservatorGroup.add(buchholzBody);

  // Silica Gel Dehumidifier Breather (cobalt blue crystals cartridge)
  const breatherPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.95, 10), stainlessMat);
  breatherPipe.position.set(-1.08, 2.48, -0.45);
  conservatorGroup.add(breatherPipe);

  const breatherFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 20), silicaBlue);
  breatherFlask.position.set(-1.08, 1.88, -0.45);
  conservatorGroup.add(breatherFlask);

  tagPart(
    conservatorGroup,
    'Conservator Tank, Buchholz Relay & Silica Breather',
    'Expansion Drum w/ MOG Dial • Buchholz Gas Surge Trip Relay • Silica Gel Breather',
    'temperature',
    'vibration',
    'xfmr-conservator'
  );
  root.add(conservatorGroup);
  registerExplode(conservatorGroup, [0, 1.15, -0.5]);

  // ── 5. 11 kV Fluted Porcelain HV Bushings & 415 V Copper LV Bushings ──────
  const bushingsGroup = new THREE.Group();

  // 3 Phase 11 kV Primary HV Bushings with shed skirts & brass clamps
  for (const bx of [-0.68, 0.0, 0.68]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.20, 0.22, 20), darkSteel);
    turret.position.set(bx, 2.34, 0.42);
    bushingsGroup.add(turret);

    const coreRod = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.72, 18), porcelainGlaze);
    coreRod.position.set(bx, 2.78, 0.42);
    bushingsGroup.add(coreRod);

    for (let s = 0; s < 5; s++) {
      const r = 0.16 - s * 0.012;
      const shed = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, 0.08, 20), porcelainGlaze);
      shed.position.set(bx, 2.52 + s * 0.125, 0.42);
      bushingsGroup.add(shed);
    }

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.10), brassMat);
    palm.position.set(bx, 3.22, 0.42);
    bushingsGroup.add(palm);

    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 10), stainlessMat);
    horn.rotation.x = 0.55;
    horn.position.set(bx, 3.24, 0.52);
    bushingsGroup.add(horn);
  }

  // 4 Secondary 415 V LV Bushings (R, Y, B, N) + Bare Copper Bus Risers
  for (const lbx of [-0.72, -0.24, 0.24, 0.72]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.28, 16), porcelainGlaze);
    collar.position.set(lbx, 2.38, -0.02);
    bushingsGroup.add(collar);

    const busBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.12), copperBus);
    busBar.position.set(lbx, 2.62, -0.02);
    bushingsGroup.add(busBar);
  }

  tagPart(
    bushingsGroup,
    '11 kV Porcelain HV Bushings & 415 V Copper Risers',
    '3× Shedded Glazed Porcelain 11kV Insulators w/ Arc Horns · 4× 415V Copper Bus Bars',
    'bearingDE',
    'vibration',
    'xfmr-bushings'
  );
  root.add(bushingsGroup);
  registerExplode(bushingsGroup, [0, 1.35, 0.35]);

  // ── 6. Online DGA Sensor Manifold & SCADA Marshalling Control Cabinet ─────
  const cabinetGroup = new THREE.Group();
  const cabBox = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.88, 0.28), cabinetSteel);
  cabBox.position.set(0.45, 1.25, 0.98);
  cabinetGroup.add(cabBox);

  const cabScreen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.03), darkSteel);
  cabScreen.position.set(0.45, 1.44, 1.12);
  cabinetGroup.add(cabScreen);

  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), ledOk);
  statusLed.position.set(0.68, 1.56, 1.13);
  cabinetGroup.add(statusLed);

  const dgaBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.22), darkSteel);
  dgaBox.position.set(-0.12, 0.95, 0.96);
  cabinetGroup.add(dgaBox);

  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10), stainlessMat);
  conduit.rotation.z = Math.PI / 2;
  conduit.position.set(0.14, 1.05, 0.96);
  cabinetGroup.add(conduit);

  tagPart(
    cabinetGroup,
    'IEEE C57.104 DGA Monitor & Pt100 Marshalling Cabinet',
    'Online H₂/C₂H₂ Gas Sensor Manifold · Winding Hotspot RTU · Fiber Optic Temp Bridge',
    'bearingNDE',
    'vibration',
    'xfmr-cabinet'
  );
  root.add(cabinetGroup);
  registerExplode(cabinetGroup, [0, 0, 1.05]);

  root.userData.transformerKinematics = {
    subAssemblies,
    fanAssemblies,
    statusLed,
  };

  return root;
}

/**
 * Animates ONAF cooling fans based on oil temperature, DGA status indicator,
 * and smooth Exploded CAD disassembly transitions.
 */
export function updateTransformerKinematics(kinematics, elapsed, isExploded, exProgress, sensors, health = 88) {
  if (!kinematics) return;

  const oilTemp = sensors?.topOilTemp ?? sensors?.temperature?.value ?? 48;
  const fanSpeed = oilTemp > 58 ? 0.24 : 0.08;

  kinematics.fanAssemblies.forEach(({ hub, sideSign }) => {
    hub.rotation.x += fanSpeed * sideSign;
  });

  if (kinematics.statusLed?.material?.color && kinematics.statusLed.material.emissive) {
    const isWarn = health < 75 || (sensors?.hydrogenGas ?? 24) > 80;
    kinematics.statusLed.material.color.setHex(isWarn ? 0xf59e0b : 0x10b981);
    kinematics.statusLed.material.emissive.setHex(isWarn ? 0xd97706 : 0x059669);
    kinematics.statusLed.material.emissiveIntensity = 0.75 + Math.sin(elapsed * 3.5) * 0.25;
  }

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
