import * as THREE from 'three';

// ── Complete Industrial Component Metadata Catalog for P-101 (ISO 5199 End-Suction Pump) ──
export const PUMP_COMPONENT_INFO = {
  // ── Primary Hydraulic Casings & Flow Path ─────────────────────────
  'Object_95': {
    name: 'Radial Spiral Volute Casing & Discharge Nozzle (DN 50)',
    spec: 'Cast Iron EN-GJL-250 Spiral Volute • 16 bar Hydrotest Pressure • Class 150 RF Flange • Smooth Hydraulic Finish',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'volute'
  },
  'Object_79': {
    name: 'Axial Suction Inlet Flange & Intake Spool (DN 65)',
    spec: 'Flanged EN 1092-2 PN16 • Vortex Suppressor Intake Cone • Cast Iron Ductile Flange',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'volute'
  },
  'Object_76': {
    name: 'Enclosed Radial Impeller (Phosphor Bronze CuSn10)',
    spec: '5-Vane Backward Curved Enclosed Impeller • Dynamic ISO 1940 G2.5 Balance • Ø 174 mm • Hydraulic Efficiency: 78.4%',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'impeller'
  },
  'Object_78': {
    name: 'Suction Casing Flange Precision Mating Gasket Ring',
    spec: 'Spiral Wound 316L/Graphite ASME B16.20 Gasket Ring • 1.6 mm Thick',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'volute'
  },
  'Object_88': {
    name: 'Volute Backplate Seal Chamber Mating Flange Ring',
    spec: 'Precision Machined EN-GJS-400 Pilot Ring with O-Ring Grooving',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'volute'
  },

  // ── Mechanical Drive Shaft & Transmission ────────────────────────
  'Object_23': {
    name: 'Precision Ground High-Tensile Drive Shaft',
    spec: 'AISI 316L (1.4404) Stainless Steel • Ø 24.00 mm Ground Journal • Deflection < 0.04 mm at Seal Faces • 2950 RPM Rating',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'shaft'
  },
  'Object_7': {
    name: 'Flexible Jaw Shaft Coupling Hub (Drive End)',
    spec: 'DIN 740 Flexible Spider Coupling • 98 Shore-A Polyurethane Insert • Dynamic Balance Grade G2.5 • High-Visibility Amber',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'coupling'
  },
  'Object_2': {
    name: 'Impeller Drive Key (DIN 6885 Form A)',
    spec: 'Hardened C45 Steel Parallel Key 8×7×25 mm • Positive Drive Lock',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'shaft'
  },
  'Object_3': {
    name: 'Shaft Sleeve Drive Key (DIN 6885)',
    spec: 'Hardened Tool Steel Parallel Feather Key • Precision Ground',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'shaft'
  },
  'Object_4': {
    name: 'Coupling Hub Drive Key (DIN 6885 Form B)',
    spec: 'Hardened C45 Ground Key 8×7×35 mm • High-Torque Transmission',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'shaft'
  },
  'Object_14': {
    name: 'Coupling Safety Retention Key & Lock Ring',
    spec: 'Precision Ground Parallel Key with Circlip Groove',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'shaft'
  },

  // ── Bearing Bracket & Housing Assembly ───────────────────────────
  'Object_51': {
    name: 'Cast-Iron Bearing Bracket & Oil Sump Housing',
    spec: 'Heavy Finned Cast Iron EN-GJL-200 Bracket • 0.45L ISO VG 46 Mineral Oil Bath • Thermal Dissipation Ribs',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearing_housing'
  },
  'Object_33': {
    name: 'Bearing Housing Internal Bore & Shaft Protecting Sleeve',
    spec: 'Chrome-Nickel Alloy Steel Sleeve (AISI 316) • Hardened 55 HRC at Seal Area',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearing_housing'
  },
  'Object_21': {
    name: 'Drive-End Bearing Retaining End-Cover & Labyrinth Seal',
    spec: 'Machined Steel Flange with Non-Contact Bronze Labyrinth Oil Seal (IP56)',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearing_housing'
  },
  'Object_22': {
    name: 'Non-Drive-End Bearing Retaining End-Cover & Centering Ring',
    spec: 'Machined Steel Flange with Viton Lip Seal & Shims for Axial Float Setting',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearing_housing'
  },

  // ── Mechanical Seal Cartridge & Gland Plate ──────────────────────
  'Object_93': {
    name: 'API 682 Cartridge Mechanical Seal Gland Plate',
    spec: 'Single Cartridge Seal Plan 11 Flush Quench • SSiC vs Carbon Faces • Hastelloy Springs',
    tempSensor: 'temperature',
    vibSensor: 'vibrationEnvelope',
    category: 'fittings'
  },
  'Object_94': {
    name: 'Throttle Bushing & Seal Flush Injection Port',
    spec: 'Non-Sparking Bronze Carbon Throttle Bushing with 1/4" NPT Plan 11 Flush Tap',
    tempSensor: 'temperature',
    vibSensor: 'vibrationEnvelope',
    category: 'fittings'
  },
  'Object_34': {
    name: 'Mechanical Seal Cartridge Stainless Rotating Sleeve',
    spec: 'AISI 316 Stainless Steel Sleeve with Viton Secondary Elastomer O-Rings',
    tempSensor: 'temperature',
    vibSensor: 'vibration',
    category: 'fittings'
  },

  // ── Heavy Structural Baseplate Skid ──────────────────────────────
  'Object_12': {
    name: 'Structural Steel Baseplate Skid Channel (Drive Side)',
    spec: 'Heavy Welded C-Channel Baseplate Skid • Fabricated to ISO 3661 Standard • Rigid Deflection Resisting Girder',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_13': {
    name: 'Structural Steel Baseplate Skid Channel (Motor Side)',
    spec: 'Heavy Welded C-Channel Baseplate Skid • Motor Adjusting Jacking Screws • Epoxy Grout Chamber Bedding',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_77': {
    name: 'Volute Casing Front Support Pedestal Foot',
    spec: 'Heavy Cast Iron Foot Pedestal • Rigid Baseplate Bolted Centerline Support',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_8': {
    name: 'Foundation Anchor Hold-Down Clamp 1',
    spec: 'M16 Foundation Anchor Tie-Down Clamp with Vibration Damping Shim',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_9': {
    name: 'Foundation Anchor Hold-Down Clamp 2',
    spec: 'M16 Foundation Anchor Tie-Down Clamp with Vibration Damping Shim',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_10': {
    name: 'Foundation Anchor Hold-Down Clamp 3',
    spec: 'M16 Foundation Anchor Tie-Down Clamp with Vibration Damping Shim',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },
  'Object_11': {
    name: 'Foundation Anchor Hold-Down Clamp 4',
    spec: 'M16 Foundation Anchor Tie-Down Clamp with Vibration Damping Shim',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'skid'
  },

  // ── Precision Bearings (SKF 6205 C3 / Angular Contact) ───────────
  'Object_24': {
    name: 'SKF 6205 Deep Groove Ball Bearing Inner Raceway Ring',
    spec: 'AISI 52100 Chrome Bearing Steel • Precision Ground Superfinished Raceways',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_25': {
    name: 'SKF 6205 Precision Chrome Ball Complement & Riveted Brass Cage',
    spec: 'High-Sphericity Grade 10 Chrome Balls (Cr-Steel) • Guided Machined Brass Cage',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_26': {
    name: 'SKF 6205 Outer Bearing Raceway & Housing Retention Ring',
    spec: 'Rigid Interference Fit in Housing Bore • Preload Snap Ring',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_27': {
    name: 'Non-Drive-End Pair Angular Contact Bearing Outer Ring',
    spec: 'Universal Paired 7205 BECBM 40° Contact Angle Outer Ring',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_28': {
    name: 'Non-Drive-End Angular Contact Ball Rolling Elements & Cage',
    spec: 'High-Precision Guided Ball Set for Combined Radial & Axial Hydraulic Thrust',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_29': {
    name: 'Non-Drive-End Thrust Bearing Inner Ring',
    spec: 'Interference Fit Shaft Mounted Thrust Ring • Mirror Ground',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_30': {
    name: 'Axial Preload Spring Pack & Bearing Spacer Washer',
    spec: 'Wavy Disc Spring for Axial Play Zeroing & Thermal Compensation',
    tempSensor: 'bearingNDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_31': {
    name: 'Shaft Oil Thrower Flinger Ring',
    spec: 'Rotating Splash Centrifugal Flinger Ring for Lubrication Mist Circulation',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },
  'Object_32': {
    name: 'Internal Oil Baffle & Bearing Retaining Locknut (KM4)',
    spec: 'Metric Shaft Locknut with MB4 Star Lockwasher',
    tempSensor: 'bearingDE',
    vibSensor: 'vibrationEnvelope',
    category: 'bearings'
  },

  // ── Oil Sump Lubrication Sight & Breather Hardware ────────────────
  'Object_15': {
    name: 'Prismatic Bullseye Oil Level Sight Glass Gauge',
    spec: 'Heavy Borosilicate Glass with Internal White Contrast Reflector • 3/4" NPT Thread',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_20': {
    name: 'Bearing Housing Sump Air Breather & Desiccant Vent',
    spec: 'Brass Filter Breather Cap • Prevents Moisture Condensation in Oil Sump',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_5': {
    name: 'Magnetic Oil Sump Drain Plug (Bottom Drain)',
    spec: 'Rare-Earth Neodymium Magnetic Core for Wear Metal Particle Capture • Viton O-Ring',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_6': {
    name: 'Bearing Housing Temperature RTD Sensor Well Plug',
    spec: 'Stainless Steel 316 Thermowell Boss for Pt100 RTD Temperature Probe',
    tempSensor: 'bearingDE',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_16': {
    name: 'Volute Casing High-Point Air Bleed Vent Valve',
    spec: 'Stainless Needle Bleed Valve for Hydraulic Priming & Air Purge',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_17': {
    name: 'Volute Casing Bottom Drain Cock Plug',
    spec: '3/8" BSPT Brass Hex Head Drain Plug with Copper Crushing Gasket',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_18': {
    name: 'Discharge Pressure Gauge Gauge Isolation Tap',
    spec: '1/2" NPT Female Gauge Tap on Volute Discharge Neck',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'fittings'
  },
  'Object_19': {
    name: 'Suction Vacuum/Compound Pressure Gauge Tap',
    spec: '1/2" NPT Female Gauge Tap on Suction Eye Spool',
    tempSensor: 'ambientTemp',
    vibSensor: 'vibration',
    category: 'fittings'
  },
};

// Fill in standard fasteners (Studs, Nuts, Washers) automatically
const FASTENER_OBJECTS = [
  'Object_35','Object_36','Object_37','Object_38','Object_39','Object_40','Object_41','Object_42',
  'Object_43','Object_44','Object_45','Object_46','Object_47','Object_48','Object_49','Object_50',
  'Object_52','Object_53','Object_54','Object_55','Object_56','Object_57','Object_58','Object_59',
  'Object_60','Object_61','Object_62','Object_63','Object_64','Object_65','Object_66','Object_67',
  'Object_68','Object_69','Object_70','Object_71','Object_72','Object_73','Object_74','Object_75',
  'Object_80','Object_81','Object_82','Object_83','Object_84','Object_85','Object_86','Object_87',
  'Object_89','Object_90','Object_91','Object_92'
];

FASTENER_OBJECTS.forEach(id => {
  if (!PUMP_COMPONENT_INFO[id]) {
    PUMP_COMPONENT_INFO[id] = {
      name: 'High-Tensile Zinc-Plated Casing Fastener (Grade 8.8)',
      spec: 'Metric ISO M12 Hex Stud / Nut with Hardened Disc Washer • Zinc Electro-Plated',
      tempSensor: 'ambientTemp',
      vibSensor: 'vibration',
      category: 'fasteners'
    };
  }
});

// ── Industrial PBR Material Factory for Centrifugal Pump ─────────────
export function createCentrifugalPumpPBRMaterials() {
  return {
    // KSB Industrial Azure Blue Enamel (Volute casing & suction spool)
    voluteBlue: new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky 600 / KSB Azure
      roughness: 0.32,
      metalness: 0.24,
      name: 'Pump_PBR_Volute_Blue'
    }),

    // Cast Phosphor Bronze (Enclosed 5-vane Impeller)
    bronzeImpeller: new THREE.MeshStandardMaterial({
      color: 0xd97706, // Rich phosphor bronze / gold
      roughness: 0.26,
      metalness: 0.88,
      name: 'Pump_PBR_Bronze_Impeller'
    }),

    // Heavy Cast Iron Gunmetal Slate (Bearing Housing Bracket Frame)
    bearingBracket: new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate 700 Gunmetal
      roughness: 0.38,
      metalness: 0.65,
      name: 'Pump_PBR_Bearing_Bracket'
    }),

    // Precision Ground Mirror Stainless Steel / Chrome (Drive Shaft)
    groundShaft: new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Chrome Silver 316L
      roughness: 0.10,
      metalness: 0.98,
      name: 'Pump_PBR_Shaft_Chrome'
    }),

    // OSHA High-Visibility Safety Amber / Caution Orange (Flexible Coupling Hub)
    safetyCoupling: new THREE.MeshStandardMaterial({
      color: 0xf97316, // Safety Warning Orange
      roughness: 0.30,
      metalness: 0.32,
      name: 'Pump_PBR_Coupling_Orange'
    }),

    // Polished Chrome Bearing Steel (AISI 52100 Raceways & Balls)
    bearingSteel: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.98,
      name: 'Pump_PBR_Bearing_Steel'
    }),

    // Machined Precision Cast Steel (Bearing End Covers, Glands & Gaskets)
    machinedSteel: new THREE.MeshStandardMaterial({
      color: 0x64748b, // Slate 500
      roughness: 0.22,
      metalness: 0.85,
      name: 'Pump_PBR_Machined_Steel'
    }),

    // Structural Steel Channel Skid Baseplate (Heavy Dark Charcoal Slate)
    baseplateSkid: new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Slate 900
      roughness: 0.45,
      metalness: 0.80,
      name: 'Pump_PBR_Baseplate_Skid'
    }),

    // Bright Zinc-Plated Grade 8.8 Fasteners (Bolts, Studs, Hex Nuts, Washers)
    zincFastener: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.16,
      metalness: 0.94,
      name: 'Pump_PBR_Zinc_Fastener'
    }),

    // Precision Machined Brass (Breather, Drain Plugs & Gauge Fittings)
    brassFitting: new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Brass
      roughness: 0.22,
      metalness: 0.88,
      name: 'Pump_PBR_Brass_Fitting'
    }),

    // Translucent Borosilicate Glass (Prismatic Oil Level Sight Gauge)
    sightGlass: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.08,
      metalness: 0.15,
      name: 'Pump_PBR_Sight_Glass'
    })
  };
}

// ── Apply Curated Industrial PBR Materials to Centrifugal Pump GLB ──
export function applyCentrifugalPumpPBR(glbScene) {
  const mats = createCentrifugalPumpPBRMaterials();

  glbScene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name;
    const info = PUMP_COMPONENT_INFO[name];

    let targetMat = mats.zincFastener; // Default to fasteners

    if (name === 'Object_95' || name === 'Object_79') {
      targetMat = mats.voluteBlue;
    } else if (name === 'Object_76') {
      targetMat = mats.bronzeImpeller;
    } else if (name === 'Object_51') {
      targetMat = mats.bearingBracket;
    } else if (name === 'Object_23') {
      targetMat = mats.groundShaft;
    } else if (name === 'Object_7') {
      targetMat = mats.safetyCoupling;
    } else if (['Object_2', 'Object_3', 'Object_4', 'Object_14'].includes(name)) {
      targetMat = mats.machinedSteel;
    } else if (['Object_21', 'Object_22', 'Object_33', 'Object_78', 'Object_88', 'Object_93', 'Object_94'].includes(name)) {
      targetMat = mats.machinedSteel;
    } else if (['Object_12', 'Object_13'].includes(name)) {
      targetMat = mats.baseplateSkid;
    } else if (['Object_8', 'Object_9', 'Object_10', 'Object_11', 'Object_77'].includes(name)) {
      targetMat = mats.bearingBracket;
    } else if (['Object_24','Object_25','Object_26','Object_27','Object_28','Object_29','Object_30','Object_31','Object_32'].includes(name)) {
      targetMat = mats.bearingSteel;
    } else if (name === 'Object_15') {
      targetMat = mats.sightGlass;
    } else if (name === 'Object_20' || name === 'Object_34' || name === 'Object_5' || name === 'Object_6' || (name >= 'Object_16' && name <= 'Object_19')) {
      targetMat = mats.brassFitting;
    }

    child.material = targetMat;
    child.userData.cadMaterial = targetMat;
    child.userData.originalMaterial = targetMat;

    if (info) {
      child.userData.partName = info.name;
      child.userData.partSpec = info.spec;
      child.userData.tempKey = info.tempSensor;
      child.userData.vibKey = info.vibSensor;
      child.userData.category = info.category;
    }
  });

  return mats;
}

// ── Setup Centrifugal Pump Kinematics (Shaft Rotation & Exploded View) ──
export function setupCentrifugalPumpKinematics(glbScene, compSubMeshes) {
  // Shaft rotation axis in raw coordinates: X = -31.11, Y = -41.00
  const shaftCenter = new THREE.Vector2(-31.1104, -40.9966);

  // Group all rotating elements into a single centered rotation group
  const rotatingAssembly = new THREE.Group();
  rotatingAssembly.name = 'Pump_Rotating_Assembly';
  rotatingAssembly.position.set(shaftCenter.x, shaftCenter.y, 0);

  const rotatingNames = [
    'Object_23', // Main Drive Shaft
    'Object_7',  // Flexible Coupling Hub
    'Object_76', // Bronze Impeller
    'Object_2',  // Impeller Key
    'Object_3',  // Shaft Sleeve Key
    'Object_4',  // Coupling Key
    'Object_14', // Retention Key
    'Object_24', // Bearing DE Inner Ring
    'Object_25', // Bearing DE Balls
    'Object_28', // Bearing NDE Balls
    'Object_29', // Bearing NDE Inner Ring
    'Object_31'  // Shaft Flinger Ring
  ];

  // Disassembly direction & multiplier along drive axis (Z) for Exploded CAD View
  const explodeZOffsets = {
    // Suction intake spool & front flange hardware slide forward along -Z
    'Object_79': -1.4,
    'Object_78': -1.1,
    // Volute casing stays anchored to suction or slides forward slightly
    'Object_95': -0.4,
    'Object_88': -0.2,
    // Bearing bracket frame slides backward along +Z
    'Object_51': 0.8,
    'Object_33': 0.9,
    'Object_21': 0.5,
    'Object_22': 2.0,
    // Cartridge seal gland plate
    'Object_93': 0.3,
    'Object_94': 0.3,
    'Object_34': 0.4,
    // Sump accessories
    'Object_15': 0.8,
    'Object_20': 0.8,
    // Structural skid baseplate stays anchored at base
    'Object_12': 0.0,
    'Object_13': 0.0,
    'Object_77': -0.4,
    'Object_8': 0.0,
    'Object_9': 0.0,
    'Object_10': 0.0,
    'Object_11': 0.0
  };

  const rotatingMeshes = [];

  // Traverse sub-meshes and save original local positions
  glbScene.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalLocalPos = child.position.clone();

      // Determine exploded offset along Z
      let zFactor = 0;
      if (explodeZOffsets[child.name] !== undefined) {
        zFactor = explodeZOffsets[child.name];
      } else if (child.name >= 'Object_68' && child.name <= 'Object_75') {
        // Suction flange studs pull out forward
        zFactor = -1.8;
      } else if (child.name >= 'Object_52' && child.name <= 'Object_67') {
        // Suction flange nuts & washers pull out forward
        zFactor = -2.1;
      } else if (child.name >= 'Object_80' && child.name <= 'Object_87') {
        // Volute casing heavy studs
        zFactor = -1.2;
      } else if (child.name >= 'Object_35' && child.name <= 'Object_50') {
        // Casing nuts & washers
        zFactor = -1.5;
      } else if (child.name >= 'Object_89' && child.name <= 'Object_92') {
        // Seal studs
        zFactor = 0.5;
      } else {
        zFactor = 0.2;
      }
      child.userData.explodeZFactor = zFactor;
    }
  });

  // Determine the correct parent node (Node 1) from existing meshes so it inherits the exact matrix transforms
  const sampleMesh = compSubMeshes['Object_23'] || compSubMeshes['Object_7'] || compSubMeshes['Object_76'];
  const parentNode = sampleMesh?.parent || glbScene;

  // Re-parent rotating meshes into the centered rotatingAssembly group
  rotatingNames.forEach((name) => {
    const mesh = compSubMeshes[name];
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
      // Offset mesh position so its centerline matches the rotatingAssembly group origin (0, 0)
      mesh.position.x -= shaftCenter.x;
      mesh.position.y -= shaftCenter.y;
      mesh.userData.inRotatingGroup = true;
      mesh.userData.rotGroupLocalPos = mesh.position.clone();
      rotatingAssembly.add(mesh);
      rotatingMeshes.push(mesh);
    }
  });

  // Attach the rotating assembly to the SAME parent node (Node 1) so it inherits the exact matrix transforms!
  parentNode.add(rotatingAssembly);

  return {
    rotatingAssembly,
    rotatingMeshes,
    shaftCenter,
    compSubMeshes
  };
}

// ── Update Centrifugal Pump Dynamic Movements & Exploded Kinematics ──
export function updateCentrifugalPumpKinematics(pumpKinematics, elapsed, isExploded, ex, sensors, health = 85) {
  if (!pumpKinematics || !pumpKinematics.rotatingAssembly) return;

  const { rotatingAssembly, rotatingMeshes } = pumpKinematics;

  // 1. Shaft Kinematic Rotation
  // Synchronous speed calculation: 2950 RPM base proportional to flow rate & health
  const flowVal = sensors?.flowRate?.value ?? 48.5;
  const speedScale = Math.max(0.4, Math.min(1.4, flowVal / 50.0)) * (health / 100);
  const rotationIncrement = 0.12 * speedScale;

  if (!isExploded) {
    // In operating CAD mode: continuous high-speed rotation around the shaft Z axis
    rotatingAssembly.rotation.z += rotationIncrement;
  } else {
    // In exploded view: gentle slow-motion diagnostic rotation so parts can be inspected from all angles
    rotatingAssembly.rotation.z += 0.015;
  }

  // 2. Exploded Disassembly Translation (ISO 5199 Back-Pull-Out Kinematics)
  // Non-rotating meshes
  Object.values(pumpKinematics.compSubMeshes || {}).forEach((mesh) => {
    if (!mesh || mesh.userData.inRotatingGroup) return;
    const orig = mesh.userData.originalLocalPos;
    if (!orig) return;

    const zFactor = mesh.userData.explodeZFactor || 0;
    // Scale distance based on model dimensions (raw model Z is ~1014 units, so 130 units is ~13% disassembly spread)
    mesh.position.z = orig.z + (zFactor * 130 * ex);
  });

  // Rotating assembly back-pull-out translation:
  // Impeller, shaft, and coupling pull out backward as a single unit along +Z
  rotatingAssembly.position.z = 1.3 * 130 * ex;

  // Within the rotating assembly in exploded view:
  // Coupling hub separates further back, impeller separates forward along the shaft
  rotatingMeshes.forEach((mesh) => {
    const orig = mesh.userData.rotGroupLocalPos;
    if (!orig) return;

    if (mesh.name === 'Object_7' || mesh.name === 'Object_4' || mesh.name === 'Object_14') {
      // Flexible coupling hub & key pulls out backward towards the motor
      mesh.position.z = orig.z + (1.2 * 110 * ex);
    } else if (mesh.name === 'Object_76' || mesh.name === 'Object_2') {
      // Bronze impeller & key pulls forward off the shaft taper
      mesh.position.z = orig.z - (0.7 * 80 * ex);
    } else {
      mesh.position.z = orig.z;
    }
  });
}


