import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

/* =========================================
   AURA — EXPLODED HEADPHONE EXPERIENCE
   Scroll-driven 3D assembly/disassembly
========================================= */

(() => {
  "use strict";

  const section = document.querySelector(".aura-explode");

  if (!section) return;

  const canvasHost = section.querySelector(
    "[data-aura-explode-canvas]"
  );

  const intro = section.querySelector(".aura-explode__intro");

  const progressBar = section.querySelector(
    ".aura-explode__progress span"
  );

  const hint = section.querySelector("[data-explode-hint]");
  const stepLabel = section.querySelector("[data-explode-step]");

  const callouts = section.querySelectorAll(
    "[data-explode-label]"
  );

  if (!canvasHost) {
    console.warn("AURA: 3D canvas container was not found.");
    return;
  }

  /* -----------------------------------------
     Utilities
  ----------------------------------------- */

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const lerp = (start, end, progress) =>
    start + (end - start) * progress;

  const smoothStep = (start, end, value) => {
    const t = clamp(
      (value - start) / (end - start),
      0,
      1
    );

    return t * t * (3 - 2 * t);
  };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let disposed = false;
  let visible = false;
  let frameId = null;
  let targetProgress = 0;
  let currentProgress = 0;

  let observer = null;
  let resizeObserver = null;

  /* -----------------------------------------
     Three.js setup
  ----------------------------------------- */

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.error(
      "AURA: WebGL could not initialize. The rest of the website remains available.",
      error
    );
    return;
  }

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.5)
  );

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  canvasHost.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    40,
    1,
    0.1,
    80
  );

  camera.position.set(0, 0, 6);

  /* -----------------------------------------
     Lighting
  ----------------------------------------- */

  scene.add(
    new THREE.HemisphereLight(
      0xdce8ff,
      0x11121b,
      2
    )
  );

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3.0
  );

  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(
    0x72dfff,
    2.5
  );

  rimLight.position.set(4, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(
    0x7466ff,
    18,
    10,
    2
  );

  fillLight.position.set(-2, -1, 3);
  scene.add(fillLight);

  /* -----------------------------------------
     Materials
  ----------------------------------------- */

  const materials = {};

  materials.shell = new THREE.MeshPhysicalMaterial({
    color: 0x292d38,
    metalness: 0.72,
    roughness: 0.28,
    clearcoat: 0.8,
    clearcoatRoughness: 0.23
  });

  materials.face = new THREE.MeshPhysicalMaterial({
    color: 0x191d27,
    metalness: 0.64,
    roughness: 0.31,
    clearcoat: 0.8
  });

  materials.metal = new THREE.MeshStandardMaterial({
    color: 0xaab4c5,
    metalness: 0.9,
    roughness: 0.23
  });

  materials.darkMetal = new THREE.MeshStandardMaterial({
    color: 0x343b4a,
    metalness: 0.85,
    roughness: 0.32
  });

  materials.padding = new THREE.MeshStandardMaterial({
    color: 0x10121a,
    metalness: 0.03,
    roughness: 0.88
  });

  materials.innerPadding = new THREE.MeshStandardMaterial({
    color: 0x343948,
    metalness: 0.04,
    roughness: 0.9
  });

  materials.driver = new THREE.MeshStandardMaterial({
    color: 0x444e5d,
    metalness: 0.62,
    roughness: 0.38
  });

  materials.cone = new THREE.MeshStandardMaterial({
    color: 0x222733,
    metalness: 0.4,
    roughness: 0.48
  });

  materials.pcb = new THREE.MeshStandardMaterial({
    color: 0x14554b,
    metalness: 0.35,
    roughness: 0.43
  });

  materials.trace = new THREE.MeshStandardMaterial({
    color: 0xd7ad68,
    metalness: 0.82,
    roughness: 0.27
  });

  materials.chip = new THREE.MeshStandardMaterial({
    color: 0x202936,
    metalness: 0.72,
    roughness: 0.24,
    emissive: 0x00bce8,
    emissiveIntensity: 0.04
  });

  materials.chipDie = new THREE.MeshStandardMaterial({
    color: 0x61eaff,
    metalness: 0.25,
    roughness: 0.2,
    emissive: 0x00cfff,
    emissiveIntensity: 0.05
  });

  materials.battery = new THREE.MeshStandardMaterial({
    color: 0x99a2b2,
    metalness: 0.82,
    roughness: 0.28
  });

  materials.screw = new THREE.MeshStandardMaterial({
    color: 0xd6ddea,
    metalness: 0.9,
    roughness: 0.22
  });

  /* -----------------------------------------
     Geometry helpers
  ----------------------------------------- */

  function addBox(
    parent,
    size,
    position,
    material,
    rotation = [0, 0, 0]
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        size[0],
        size[1],
        size[2]
      ),
      material
    );

    mesh.position.set(
      position[0],
      position[1],
      position[2]
    );

    mesh.rotation.set(
      rotation[0],
      rotation[1],
      rotation[2]
    );

    parent.add(mesh);
    return mesh;
  }

  function addSphere(
    parent,
    scale,
    position,
    material
  ) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 36, 24),
      material
    );

    mesh.scale.set(
      scale[0],
      scale[1],
      scale[2]
    );

    mesh.position.set(
      position[0],
      position[1],
      position[2]
    );

    parent.add(mesh);
    return mesh;
  }

  function addTube(
    parent,
    points,
    radius,
    material,
    segments = 80
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, y, z]) =>
        new THREE.Vector3(x, y, z)
      )
    );

    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(
        curve,
        segments,
        radius,
        10,
        false
      ),
      material
    );

    parent.add(mesh);
    return mesh;
  }

  function addRing(
    parent,
    radius,
    thickness,
    position,
    scaleY,
    material
  ) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(
        radius,
        thickness,
        10,
        56
      ),
      material
    );

    mesh.position.set(
      position[0],
      position[1],
      position[2]
    );

    mesh.scale.y = scaleY;

    parent.add(mesh);
    return mesh;
  }

  function addLine(parent, points, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(([x, y, z]) =>
        new THREE.Vector3(x, y, z)
      )
    );

    const line = new THREE.Line(geometry, material);
    parent.add(line);
    return line;
  }

  /*
   * Each component has a starting position and an exploded
   * position. Every animation frame interpolates between them.
   * This makes the animation reversible.
   */

  const components = [];

  function registerComponent(
    name,
    group,
    start,
    exploded,
    startRotation = [0, 0, 0],
    explodedRotation = [0, 0, 0]
  ) {
    group.position.set(start[0], start[1], start[2]);

    group.rotation.set(
      startRotation[0],
      startRotation[1],
      startRotation[2]
    );

    components.push({
      name,
      group,
      start: new THREE.Vector3(...start),
      exploded: new THREE.Vector3(...exploded),
      startRotation: new THREE.Euler(...startRotation),
      explodedRotation: new THREE.Euler(...explodedRotation)
    });

    return group;
  }

  /* -----------------------------------------
     Main headphone model
  ----------------------------------------- */

  const model = new THREE.Group();
  scene.add(model);

  /* 1. Headband shell */

  const headband = new THREE.Group();
  model.add(headband);

  const bandPoints = [
    [-1.28, 0.12, 0],
    [-1.34, 0.65, 0],
    [-1.10, 1.27, 0],
    [-0.64, 1.68, 0],
    [0, 1.83, 0],
    [0.64, 1.68, 0],
    [1.10, 1.27, 0],
    [1.34, 0.65, 0],
    [1.28, 0.12, 0]
  ];

  addTube(
    headband,
    bandPoints,
    0.15,
    materials.shell,
    100
  );

  addTube(
    headband,
    bandPoints.map(([x, y]) => [
      x * 0.985,
      y * 0.985,
      0.10
    ]),
    0.011,
    materials.metal,
    100
  );

  registerComponent(
    "headband",
    headband,
    [0, 0, 0],
    [0, 0.88, -0.28],
    [0, 0, 0],
    [-0.06, -0.08, -0.025]
  );

  /* 2. Inner headband padding */

  const bandPadding = new THREE.Group();
  model.add(bandPadding);

  const innerBandPoints = [
    [-1.25, 0.12, 0.04],
    [-1.29, 0.64, 0.04],
    [-1.04, 1.24, 0.04],
    [-0.60, 1.60, 0.04],
    [0, 1.72, 0.04],
    [0.60, 1.60, 0.04],
    [1.04, 1.24, 0.04],
    [1.29, 0.64, 0.04],
    [1.25, 0.12, 0.04]
  ];

  addTube(
    bandPadding,
    innerBandPoints,
    0.073,
    materials.padding,
    100
  );

  registerComponent(
    "padding",
    bandPadding,
    [0, 0, 0],
    [0, 1.45, 0.20],
    [0, 0, 0],
    [0.02, 0, 0.025]
  );

  /* 3. Left and right yokes */

  function createYoke(side) {
    const group = new THREE.Group();
    model.add(group);

    addTube(
      group,
      [
        [0, 0.24, 0],
        [side * 0.015, 0.05, 0.025],
        [side * 0.085, -0.17, 0.045],
        [side * 0.09, -0.40, 0.04]
      ],
      0.043,
      materials.metal,
      36
    );

    addTube(
      group,
      [
        [side * 0.05, 0.23, -0.025],
        [side * 0.06, 0.02, 0],
        [side * 0.125, -0.17, 0.02],
        [side * 0.13, -0.40, 0.025]
      ],
      0.018,
      materials.darkMetal,
      36
    );

    addSphere(
      group,
      [0.085, 0.085, 0.055],
      [side * 0.09, -0.40, 0.04],
      materials.metal
    );

    registerComponent(
      side < 0 ? "left-yoke" : "right-yoke",
      group,
      [side * 1.25, -0.04, 0],
      [side * 1.57, -0.13, -0.18],
      [0, 0, 0],
      [0, side * 0.12, side * 0.06]
    );

    return group;
  }

  createYoke(-1);
  createYoke(1);

  /* 4. Outer ear-cup shells */

  function createShell(side) {
    const group = new THREE.Group();
    model.add(group);

    addSphere(
      group,
      [0.44, 0.58, 0.25],
      [0, 0, 0],
      materials.shell
    );

    addSphere(
      group,
      [0.34, 0.45, 0.075],
      [0, 0, 0.19],
      materials.face
    );

    addRing(
      group,
      0.335,
      0.019,
      [0, 0, 0.245],
      1.33,
      materials.metal
    );

    addSphere(
      group,
      [0.052, 0.052, 0.015],
      [0, 0, 0.267],
      materials.darkMetal
    );

    [
      [-0.20, 0.27],
      [0.20, 0.27],
      [-0.22, -0.27],
      [0.22, -0.27]
    ].forEach(([x, y]) => {
      addSphere(
        group,
        [0.019, 0.019, 0.008],
        [x, y, 0.258],
        materials.screw
      );
    });

    registerComponent(
      side < 0 ? "left-shell" : "right-shell",
      group,
      [side * 1.25, -0.48, 0],
      [side * 1.92, -0.40, -0.72],
      [0, 0, 0],
      [0, side * 0.18, side * 0.06]
    );

    return group;
  }

  createShell(-1);
  createShell(1);

  /* 5. Removable ear cushions */

  function createCushion(side) {
    const group = new THREE.Group();
    model.add(group);

    addRing(
      group,
      0.335,
      0.09,
      [0, 0, 0],
      1.34,
      materials.padding
    );

    addRing(
      group,
      0.235,
      0.042,
      [0, 0, 0.008],
      1.34,
      materials.innerPadding
    );

    addRing(
      group,
      0.402,
      0.009,
      [0, 0, -0.025],
      1.34,
      materials.darkMetal
    );

    registerComponent(
      side < 0 ? "left-cushion" : "right-cushion",
      group,
      [side * 1.25, -0.48, 0.44],
      [side * 1.49, -0.58, 1.02],
      [0, 0, 0],
      [0, side * 0.15, 0]
    );

    return group;
  }

  createCushion(-1);
  createCushion(1);

  /* 6. Acoustic speaker drivers */

  function createDriver(side) {
    const group = new THREE.Group();
    model.add(group);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.292,
        0.292,
        0.085,
        56
      ),
      materials.darkMetal
    );

    base.rotation.x = Math.PI / 2;
    group.add(base);

    addRing(
      group,
      0.265,
      0.021,
      [0, 0, 0.055],
      1,
      materials.metal
    );

    addSphere(
      group,
      [0.224, 0.224, 0.043],
      [0, 0, 0.045],
      materials.cone
    );

    addRing(
      group,
      0.16,
      0.012,
      [0, 0, 0.083],
      1,
      materials.driver
    );

    addSphere(
      group,
      [0.078, 0.078, 0.023],
      [0, 0, 0.09],
      materials.driver
    );

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;

      addSphere(
        group,
        [0.011, 0.011, 0.008],
        [
          Math.cos(angle) * 0.234,
          Math.sin(angle) * 0.234,
          0.078
        ],
        materials.metal
      );
    }

    registerComponent(
      side < 0 ? "left-driver" : "right-driver",
      group,
      [side * 1.25, -0.48, 0.14],
      [side * 1.38, -0.45, 0.48],
      [0, 0, 0],
      [0, side * 0.08, 0]
    );

    return group;
  }

  createDriver(-1);
  createDriver(1);

  /* 7. Circuit boards and processor chips */

  const chipLights = [];

  function createCircuit(side) {
    const group = new THREE.Group();
    model.add(group);

    addBox(
      group,
      [0.31, 0.39, 0.035],
      [0.12, -0.035, 0],
      materials.pcb
    );

    addLine(group, [
      [-0.005, 0.11, 0.022],
      [0.045, 0.11, 0.022],
      [0.078, 0.14, 0.022],
      [0.17, 0.14, 0.022]
    ], materials.trace);

    addLine(group, [
      [0.12, 0.015, 0.022],
      [0.20, 0.015, 0.022],
      [0.22, -0.04, 0.022]
    ], materials.trace);

    addLine(group, [
      [-0.005, -0.11, 0.022],
      [0.06, -0.11, 0.022],
      [0.09, -0.16, 0.022],
      [0.18, -0.16, 0.022]
    ], materials.trace);

    [
      [-0.005, 0.19],
      [0.21, 0.18],
      [-0.015, -0.21],
      [0.21, -0.22]
    ].forEach(([x, y], index) => {
      addBox(
        group,
        [0.052, 0.034, 0.022],
        [x, y, 0.03],
        index % 2 === 0
          ? materials.metal
          : materials.darkMetal
      );
    });

    addBox(
      group,
      [0.16, 0.15, 0.045],
      [0.105, -0.005, 0.042],
      materials.chip
    );

    const die = addBox(
      group,
      [0.081, 0.075, 0.012],
      [0.105, -0.005, 0.071],
      materials.chipDie
    );

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x55eaff,
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.008, 8, 44),
      haloMaterial
    );

    halo.position.set(0.105, -0.005, 0.075);
    group.add(halo);

    const light = new THREE.PointLight(
      0x36ddff,
      0.03,
      1.8,
      2
    );

    light.position.set(0.105, -0.005, 0.20);
    group.add(light);

    chipLights.push({ die, halo, light });

    registerComponent(
      side < 0 ? "left-circuit" : "right-circuit",
      group,
      [side * 1.25, -0.48, 0.05],
      [side * 1.67, -0.67, 0.77],
      [0, 0, 0],
      [0, side * 0.22, side * 0.08]
    );

    return group;
  }

  createCircuit(-1);
  createCircuit(1);

  /* 8. Battery pack */

  const battery = new THREE.Group();
  model.add(battery);

  addBox(
    battery,
    [0.34, 0.41, 0.105],
    [0, 0, 0],
    materials.battery
  );

  addBox(
    battery,
    [0.28, 0.34, 0.012],
    [0, 0, 0.06],
    materials.darkMetal
  );

  for (let i = 0; i < 3; i++) {
    addBox(
      battery,
      [0.17, 0.014, 0.009],
      [0, 0.09 - i * 0.08, 0.07],
      materials.metal
    );
  }

  registerComponent(
    "battery",
    battery,
    [-1.25, -0.48, 0.07],
    [-1.87, -0.85, 0.43],
    [0, 0, 0],
    [0.08, -0.16, -0.10]
  );

  /* -----------------------------------------
     Background particles
  ----------------------------------------- */

  const particlePositions = [];

  for (let i = 0; i < 100; i++) {
    particlePositions.push(
      (Math.random() - 0.5) * 11,
      (Math.random() - 0.5) * 6.5,
      -2 - Math.random() * 4
    );
  }

  const particleGeometry = new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      particlePositions,
      3
    )
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x9ba8d2,
    size: 0.022,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  scene.add(particles);

  /* -----------------------------------------
     Camera and responsive sizing
  ----------------------------------------- */

  function resizeRenderer() {
    if (disposed) return;

    const width = canvasHost.clientWidth;
    const height = canvasHost.clientHeight;

    if (width <= 0 || height <= 0) return;

    const aspect = width / height;

    camera.aspect = aspect;
    camera.fov = aspect < 0.75 ? 53 : 40;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );

    renderer.setSize(width, height, false);
  }

  /* -----------------------------------------
     Scroll position
  ----------------------------------------- */

  function readScrollProgress() {
    const rect = section.getBoundingClientRect();

    const scrollDistance = Math.max(
      0,
      section.offsetHeight - window.innerHeight
    );

    targetProgress = scrollDistance > 0
      ? clamp(-rect.top / scrollDistance, 0, 1)
      : 0;
  }

  function isSectionVisible() {
    const rect = section.getBoundingClientRect();

    return (
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  }

  /* -----------------------------------------
     Component animation
  ----------------------------------------- */

  function animateModel(progress) {
    /*
     * One normalized progress value controls every component.
     * Reverse scrolling automatically reverses disassembly.
     */

    const exploded = smoothStep(
      0.02,
      0.86,
      progress
    );

    components.forEach((component) => {
      const { group, start, exploded: end } = component;
      const startRot = component.startRotation;
      const endRot = component.explodedRotation;

      group.position.set(
        lerp(start.x, end.x, exploded),
        lerp(start.y, end.y, exploded),
        lerp(start.z, end.z, exploded)
      );

      group.rotation.set(
        lerp(startRot.x, endRot.x, exploded),
        lerp(startRot.y, endRot.y, exploded),
        lerp(startRot.z, endRot.z, exploded)
      );
    });

    model.rotation.y = lerp(
      -0.10,
      0.14,
      progress
    );

    model.rotation.x = lerp(
      0.01,
      0.045,
      Math.sin(progress * Math.PI)
    );

    /* Give the exploded parts additional room on small screens */

    const mobile = window.innerWidth < 600;

    const nearDistance = mobile ? 7.1 : 5.8;
    const farDistance = mobile ? 9.0 : 7.3;

    const distance = lerp(
      nearDistance,
      farDistance,
      exploded
    );

    const centerY = lerp(
      0.06,
      -0.04,
      exploded
    );

    camera.position.set(0, centerY, distance);
    camera.lookAt(0, centerY, 0);

    /* Reveal the circuit-board chip glow */

    const glowProgress = smoothStep(
      0.28,
      0.82,
      progress
    );

    materials.chip.emissiveIntensity =
      0.04 + glowProgress * 1.55;

    materials.chipDie.emissiveIntensity =
      0.05 + glowProgress * 2.1;

    /* Hide the intro as the exploded view develops */

    if (intro) {
      const introOpacity =
        1 - smoothStep(0.14, 0.40, progress);

      section.style.setProperty(
        "--explode-intro-opacity",
        introOpacity
      );

      section.style.setProperty(
        "--explode-intro-shift",
        `${-16 * (1 - introOpacity)}px`
      );
    }

    /* Component labels appear at different points */

    const labelStarts = {
      headband: 0.20,
      driver: 0.34,
      circuit: 0.49,
      shell: 0.29
    };

    callouts.forEach((element) => {
      const key = element.dataset.explodeLabel;
      const start = labelStarts[key] ?? 0.35;

      const opacity = smoothStep(
        start,
        start + 0.25,
        progress
      );

      element.style.setProperty(
        "--callout-opacity",
        opacity
      );

      element.style.setProperty(
        "--callout-shift",
        `${8 * (1 - opacity)}px`
      );
    });

    if (progressBar) {
      progressBar.style.transform =
        `scaleX(${progress})`;
    }

    if (stepLabel) {
      if (progress < 0.20) {
        stepLabel.textContent = "01 — ASSEMBLED";
      } else if (progress < 0.52) {
        stepLabel.textContent = "02 — LAYERS SEPARATING";
      } else if (progress < 0.84) {
        stepLabel.textContent = "03 — INTERNALS REVEALED";
      } else {
        stepLabel.textContent = "04 — EXPLODED VIEW";
      }
    }

    if (hint) {
      hint.textContent = progress < 0.12
        ? "SCROLL TO DISASSEMBLE"
        : progress > 0.88
          ? "SCROLL UP TO REASSEMBLE"
          : "KEEP SCROLLING";
    }
  }

  /* -----------------------------------------
     Render-loop management
  ----------------------------------------- */

  const clock = new THREE.Clock();

  function stopRendering() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function renderFrame() {
    // This frame is now running, so clear its handle.
    frameId = null;

    if (disposed || !visible) return;

    if (reducedMotion.matches) {
      // Reduced-motion mode: show an assembled, static model.
      currentProgress = 0;
      targetProgress = 0;

      animateModel(0);
      renderer.render(scene, camera);

      return;
    }

    // Smooth the movement without making the scroll value stale.
    currentProgress +=
      (targetProgress - currentProgress) * 0.16;

    if (Math.abs(targetProgress - currentProgress) < 0.0005) {
      currentProgress = targetProgress;
    }

    animateModel(currentProgress);

    const elapsed = clock.getElapsedTime();
    const glowProgress = smoothStep(
      0.28,
      0.82,
      currentProgress
    );

    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.6);

    chipLights.forEach(({ halo, light }) => {
      light.intensity =
        0.025 + glowProgress * (0.55 + pulse * 1.2);

      halo.material.opacity =
        0.025 + glowProgress * (0.10 + pulse * 0.18);

      const scale = 0.94 + pulse * 0.12;
      halo.scale.set(scale, scale, 1);
    });

    particles.rotation.z =
      Math.sin(elapsed * 0.08) * 0.015;

    renderer.render(scene, camera);

    // Continue rendering only while the section is visible.
    frameId = requestAnimationFrame(renderFrame);
  }

  function startRendering() {
    if (disposed || !visible || frameId !== null) return;

    frameId = requestAnimationFrame(renderFrame);
  }

  function updateVisibility() {
    const nextVisible = isSectionVisible();

    if (nextVisible !== visible) {
      visible = nextVisible;

      if (visible) {
        readScrollProgress();
        startRendering();
      } else {
        stopRendering();
      }
    } else if (visible) {
      startRendering();
    }
  }

  /* -----------------------------------------
     Event listeners
  ----------------------------------------- */

  function handleScroll() {
    readScrollProgress();
    updateVisibility();
  }

  function handleResize() {
    resizeRenderer();
    readScrollProgress();
    updateVisibility();
  }

  window.addEventListener("scroll", handleScroll, {
    passive: true
  });

  window.addEventListener("resize", handleResize);

  function handleMotionChange() {
    readScrollProgress();
    stopRendering();
    startRendering();
  }

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener(
      "change",
      handleMotionChange
    );
  }

  /* Observe visibility when entering or leaving the scene */

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;

          if (visible) {
            readScrollProgress();
            startRendering();
          } else {
            stopRendering();
          }
        });
      },
      {
        threshold: 0
      }
    );

    observer.observe(section);
  }

  /* Respond to changes in the container's actual dimensions */

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resizeRenderer();
      readScrollProgress();
      updateVisibility();
    });

    resizeObserver.observe(canvasHost);
  }

  /* -----------------------------------------
     Initialization
  ----------------------------------------- */

  resizeRenderer();
  readScrollProgress();

  visible = isSectionVisible();
  currentProgress = targetProgress;

  // The first draw must happen even if the observer has not fired yet.
  if (visible) {
    startRendering();
  }

  /* -----------------------------------------
     Cleanup
  ----------------------------------------- */

  function cleanup() {
    if (disposed) return;

    disposed = true;
    stopRendering();

    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);

    if (observer) observer.disconnect();
    if (resizeObserver) resizeObserver.disconnect();

    if (typeof reducedMotion.removeEventListener === "function") {
      reducedMotion.removeEventListener(
        "change",
        handleMotionChange
      );
    }

    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
    });

    Object.values(materials).forEach((material) => {
      material.dispose();
    });

    chipLights.forEach(({ halo }) => {
      halo.material.dispose();
    });

    particleGeometry.dispose();
    particleMaterial.dispose();

    renderer.dispose();
  }

  window.addEventListener("pagehide", cleanup, {
    once: true
  });
})();