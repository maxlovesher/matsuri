/* The full-screen field: embroidered temari and glowing paper lanterns driven by scroll.
   Scroll progress is a float "section index": 0 hero, 1 fall, 2 torii gate, 3 passing through. */
const FieldScene = (() => {
  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const STEP = 1 / 60;
  const PARAMS = {
    rebound: -0.3,
    mouseRepelForce: 0.05,
    mouseRepelRadius: 4.4,
    centerAttractForce: 0.0035,
    bounciness: 0.02,
  };

  /* Each thread colourway is [ball colour, thread colour]. */
  const SEASONS = {
    spring: {
      petal: '#f4b6c6',
      threads: [['#f2b6c6', '#fff6f2'], ['#d9577f', '#ffe9ef'], ['#f8efe4', '#e0708f'], ['#8aa86a', '#f8efe4']],
    },
    summer: {
      petal: '#a9c7e0',
      threads: [['#1f3a6e', '#f3eee3'], ['#3f6fb0', '#f3eee3'], ['#f3eee3', '#1f3a6e'], ['#c8321f', '#f3e3b0']],
    },
    autumn: {
      petal: '#d9531e',
      threads: [['#b92c1a', '#e8c15f'], ['#e0702a', '#fbe7c6'], ['#d9a441', '#6b2a14'], ['#4d1f2e', '#e8a86c']],
    },
    winter: {
      petal: '#ffffff',
      threads: [['#eef1f4', '#2f4a6b'], ['#a9c4dc', '#ffffff'], ['#25395a', '#dfe8f2'], ['#2a2a2e', '#c9a24b']],
    },
  };
  /* Festival colours the temari take on as they fall, whatever the season. */
  const FESTIVAL = [['#c8321f', '#e8c15f'], ['#1f3a6e', '#f3eee3'], ['#d9a441', '#8a2413'], ['#f3eee3', '#c8321f']];
  const THREAD_WEIGHTS = [0.32, 0.28, 0.24, 0.16];

  const GATE_RED = '#cf3a20';
  const GATE_INK = '#2a2526';
  const LANTERN_KANJI = ['祭', '灯', '縁', '夢'];
  const LANTERN_SHARE = 0.24;

  async function start({ container, canvas, control, mouse, season, theme, reducedMotion, onReady }) {
    const THREE = await import(THREE_URL);

    // Lantern characters are drawn to canvas, so their font has to be ready first.
    if (document.fonts) {
      await Promise.race([
        document.fonts.load('700 200px "Shippori Mincho"', LANTERN_KANJI.join('')),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]).catch(() => {});
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    let pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    // No filmic tone mapping: the flat, saturated colour of a woodblock print is the goal.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemiLight = new THREE.HemisphereLight(0xfff6e8, 0x8a6a58, 1.5);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.7);
    keyLight.position.set(-6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 10;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(8, 7, -8);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.35);
    frontLight.position.set(0, 0, 11);
    scene.add(frontLight);

    // The simulation box is the visible frustum at z = 0.
    let viewportWidth = 10;
    let viewportHeight = 6;
    const updateFrustumBounds = () => {
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewportWidth = viewportHeight * (container.clientWidth / container.clientHeight);
    };
    updateFrustumBounds();

    const toThreads = (list) => list.map(([ball, thread]) => ({ ball: new THREE.Color(ball), thread: new THREE.Color(thread) }));
    let seasonThreads = toThreads(SEASONS[season].threads);
    let petalColor = new THREE.Color(SEASONS[season].petal);
    const festivalThreads = toThreads(FESTIVAL);
    const currentThreads = THREAD_WEIGHTS.map(() => ({ ball: new THREE.Color(), thread: new THREE.Color() }));

    /* --- Textures --- */

    const textureSize = isMobile ? 256 : 512;
    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const toTexture = (source) => {
      const texture = new THREE.CanvasTexture(source);
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
      return texture;
    };
    const temariTextures = Array.from({ length: Patterns.temariCount }, (_, i) => toTexture(Patterns.temari(i, textureSize)));
    const lanternTextures = LANTERN_KANJI.map((kanji) => toTexture(Patterns.lantern(kanji, textureSize)));
    const glowTexture = new THREE.CanvasTexture(Patterns.glow());

    /* Mixes ball and thread colour by the mask, so both can morph while staying properly lit.
       Ink on a lantern also blocks its inner glow. */
    const threadShader = (threadColor) => (shader) => {
      shader.uniforms.threadColor = { value: threadColor };
      shader.fragmentShader = `uniform vec3 threadColor;\n${shader.fragmentShader}`.replace(
        '#include <map_fragment>',
        `float threadMask = texture2D(map, vMapUv).r;
         diffuseColor.rgb = mix(diffuseColor.rgb, threadColor, threadMask);
         totalEmissiveRadiance *= 1.0 - threadMask;`
      );
    };

    const pickThread = () => {
      let roll = Math.random();
      for (let i = 0; i < THREAD_WEIGHTS.length; i++) {
        roll -= THREAD_WEIGHTS[i];
        if (roll <= 0) return i;
      }
      return 0;
    };

    /* --- Spheres --- */

    // Phones have a much narrower box, so spheres shrink to keep the copy readable.
    const ballCount = isMobile ? 54 : 96;
    const sizeScale = isMobile ? 0.72 : 1;
    const sphereGeometry = new THREE.SphereGeometry(1, 40, 28);
    const balls = [];
    const inkColor = new THREE.Color('#1b1a18');
    const lanternPapers = [new THREE.Color('#d8452a'), new THREE.Color('#f4e7cc')];

    for (let i = 0; i < ballCount; i++) {
      const rand = Math.random();
      let radius;
      if (rand < 0.3) radius = 0.27 + Math.random() * 0.12;
      else if (rand < 0.8) radius = 0.42 + Math.random() * 0.18;
      else radius = 0.66 + Math.random() * 0.21;
      radius *= sizeScale;

      const isLantern = i < Math.round(ballCount * LANTERN_SHARE);
      const threadIndex = pickThread();
      const threadColor = new THREE.Color();
      const paper = lanternPapers[i % lanternPapers.length];

      const map = isLantern
        ? lanternTextures[i % lanternTextures.length]
        : temariTextures[i % temariTextures.length];

      const material = new THREE.MeshStandardMaterial({
        map,
        bumpMap: map,
        bumpScale: isLantern ? 0.4 : 1.4,
        roughness: isLantern ? 0.62 : 0.78,
        metalness: 0,
        emissive: isLantern ? new THREE.Color('#ff9a4a') : new THREE.Color('#000000'),
        transparent: true,
      });
      material.onBeforeCompile = threadShader(threadColor);

      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (isLantern) mesh.rotation.y = (Math.random() - 0.5) * 1.1;
      else mesh.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      scene.add(mesh);

      let halo = null;
      if (isLantern) {
        halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTexture,
          color: 0xffa050,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
        }));
        halo.scale.setScalar(3.4);
        mesh.add(halo);
      }

      balls.push({
        id: i,
        radius,
        mass: Math.pow(radius, 3),
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        mesh,
        material,
        halo,
        isLantern,
        threadIndex,
        threadColor,
        paper,
        inkOnly: false,
        visualScale: radius,
        gateTarget: new THREE.Vector3(),
        gateRadius: radius,
        gateColor: new THREE.Color(GATE_RED),
      });
    }

    /* --- Torii gate --- */

    const gate = { cx: 0, cy: 0 };

    /* Lays the balls out along the beams and pillars of a torii, shoulder to shoulder. */
    const assignGateTargets = () => {
      const isSideBySide = window.innerWidth >= 1024;
      const isPortrait = viewportWidth < viewportHeight;
      const H = isPortrait ? viewportWidth * 0.56 : Math.min(viewportHeight * 0.64, viewportWidth * 0.36);
      const W = H * 1.08;
      gate.cx = isSideBySide ? viewportWidth * 0.25 : 0;
      gate.cy = -viewportHeight * 0.03;

      const at = (x, y) => [gate.cx + x * W, gate.cy + (y - 0.5) * H];
      const parts = [
        // Kasagi: the ink top beam, sweeping up at both ends
        { ink: true, length: 1.3 * W, point: (t) => { const x = lerp(-0.65, 0.65, t); return at(x, 1.0 + 0.09 * Math.pow(x / 0.65, 2)); } },
        // Shimaki: the red beam just beneath it
        { length: 1.12 * W, point: (t) => at(lerp(-0.56, 0.56, t), 0.925) },
        // Nuki: the lower tie beam
        { length: 0.98 * W, point: (t) => at(lerp(-0.49, 0.49, t), 0.72) },
        // Gakuzuka: the short post between them
        { length: 0.14 * H, point: (t) => at(0, lerp(0.76, 0.89, t)) },
        // Hashira: the two pillars, leaning slightly inward
        { length: 0.9 * H, point: (t) => at(lerp(-0.4, -0.34, t), lerp(0, 0.9, t)) },
        { length: 0.9 * H, point: (t) => at(lerp(0.4, 0.34, t), lerp(0, 0.9, t)) },
      ];

      // One lantern hangs in the opening; everything else builds the structure.
      const beads = balls.slice(1);
      for (let i = beads.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [beads[i], beads[j]] = [beads[j], beads[i]];
      }
      const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
      const spacing = totalLength / beads.length;

      let cursor = 0;
      parts.forEach((part, partIndex) => {
        const isLast = partIndex === parts.length - 1;
        const count = isLast ? beads.length - cursor : Math.max(2, Math.round(part.length / spacing));
        for (let i = 0; i < count && cursor < beads.length; i++, cursor++) {
          const [x, y] = part.point(count === 1 ? 0.5 : i / (count - 1));
          const bead = beads[cursor];
          bead.gateTarget.set(x, y, (Math.random() - 0.5) * 0.18);
          bead.gateRadius = spacing * 0.66 * (0.94 + Math.random() * 0.12);
          bead.gateColor.set(part.ink ? GATE_INK : GATE_RED);
        }
      });

      const hanging = balls[0];
      const [hangX, hangY] = at(0, 0.5);
      hanging.gateTarget.set(hangX, hangY, 0.3);
      hanging.gateRadius = H * 0.1;
      hanging.gateColor.copy(hanging.paper);
    };
    assignGateTargets();

    /* --- Drifting petals --- */

    const petalCount = reducedMotion ? 0 : isMobile ? 30 : 70;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, -0.1);
    petalShape.bezierCurveTo(0.09, -0.04, 0.09, 0.06, 0.018, 0.1);
    petalShape.lineTo(0, 0.08);
    petalShape.lineTo(-0.018, 0.1);
    petalShape.bezierCurveTo(-0.09, 0.06, -0.09, -0.04, 0, -0.1);
    const petalMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.92, toneMapped: false });
    const petalMesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(petalShape), petalMaterial, Math.max(1, petalCount));
    petalMesh.visible = petalCount > 0;
    petalMesh.frustumCulled = false;
    scene.add(petalMesh);

    const petalDummy = new THREE.Object3D();
    const shadeColor = new THREE.Color();
    const petals = Array.from({ length: petalCount }, (_, i) => {
      shadeColor.setScalar(0.82 + Math.random() * 0.18);
      petalMesh.setColorAt(i, shadeColor);
      return {
        x: (Math.random() - 0.5) * viewportWidth,
        y: (Math.random() - 0.5) * viewportHeight,
        z: Math.random() * 3 - 0.5,
        fall: 0.25 + Math.random() * 0.4,
        sway: 0.3 + Math.random() * 0.5,
        phase: Math.random() * 6.28,
        spin: 0.4 + Math.random() * 1.4,
        scale: 0.55 + Math.random() * 0.6,
      };
    });

    const updatePetals = (dt, time) => {
      const halfW = viewportWidth / 2 + 1;
      const halfH = viewportHeight / 2 + 0.6;
      petals.forEach((p, i) => {
        p.y -= p.fall * dt;
        p.x += (0.12 + Math.sin(time * p.sway + p.phase) * 0.28) * dt;
        if (p.y < -halfH) { p.y = halfH; p.x = (Math.random() - 0.5) * viewportWidth; }
        if (p.x > halfW) p.x = -halfW;
        petalDummy.position.set(p.x, p.y, p.z);
        petalDummy.rotation.set(time * p.spin + p.phase, Math.sin(time * p.sway + p.phase) * 1.2, time * p.spin * 0.6);
        petalDummy.scale.setScalar(p.scale);
        petalDummy.updateMatrix();
        petalMesh.setMatrixAt(i, petalDummy.matrix);
      });
      petalMesh.instanceMatrix.needsUpdate = true;
    };

    /* --- Theme --- */

    let lanternGlow = 0.4;
    let haloStrength = 0;
    const applyTheme = (name) => {
      const isNight = name === 'dark';
      lanternGlow = isNight ? 1.0 : 0.38;
      haloStrength = isNight ? 0.5 : 0.08;
      hemiLight.intensity = isNight ? 0.95 : 1.5;
      keyLight.intensity = isNight ? 1.25 : 1.7;
    };
    applyTheme(theme);

    /* --- Positions --- */

    const scatterFar = (withInwardVelocity) => {
      const R = Math.max(viewportWidth, viewportHeight) * 1.5;
      for (const b of balls) {
        const a = Math.random() * Math.PI * 2;
        const px = Math.cos(a) * R * 1.25;
        const py = Math.sin(a) * R * 0.85;
        const pz = (Math.random() - 0.5) * 4;
        b.position.set(px, py, pz);
        b.mesh.position.copy(b.position);
        if (withInwardVelocity) {
          b.velocity.set(-px, -py, -pz).normalize().multiplyScalar(0.08 + Math.random() * 0.05);
        } else {
          b.velocity.set(0, 0, 0);
        }
      }
    };
    const placeInCluster = () => {
      for (const b of balls) {
        b.position.set(
          (Math.random() - 0.5) * viewportWidth * 0.8,
          (Math.random() - 0.5) * viewportHeight * 0.45,
          (Math.random() - 0.5) * 2
        );
        b.mesh.position.copy(b.position);
        b.mesh.scale.setScalar(b.radius);
        b.velocity.set(0, 0, 0);
      }
    };

    const mouseProjVec = new THREE.Vector3();
    const mouseWorld3D = new THREE.Vector3();
    const updateMouse3D = () => {
      mouseProjVec.set(mouse.x, mouse.y, 0.5);
      mouseProjVec.unproject(camera);
      const dir = mouseProjVec.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      mouseWorld3D.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    const diffVec = new THREE.Vector3();
    const collideDiff = new THREE.Vector3();
    const relVel = new THREE.Vector3();
    const deltaPos = new THREE.Vector3();
    const rotAxis = new THREE.Vector3();
    const prevMouseWorld = new THREE.Vector3();
    const mixColor = new THREE.Color();
    const petalMix = new THREE.Color();
    const gateRedColor = new THREE.Color(GATE_RED);
    let wasInteracting = false;
    let mouseSpeed = 0;
    let localStarted = false;
    let entranceStart = 0;

    const stepSimulation = (time, progress) => {
      const heroF = 1 - smoothstep(0.30, 0.80, progress);
      const dropRaw = smoothstep(0.40, 0.95, progress);
      // The fly-out finishes as the release section lands, so its copy is never left behind spheres.
      const flyF = smoothstep(2.4, 3.05, progress);
      const shapeF = smoothstep(1.40, 2.05, progress) * (1 - smoothstep(2.3, 2.75, progress));
      const dropF = dropRaw * (1 - smoothstep(1.25, 1.75, progress));
      // The gate slides to centre and grows as you scroll, as though you are walking up to it.
      const approach = smoothstep(2.05, 2.6, progress);
      const gateScale = 1 + 1.7 * approach;
      const gateX = gate.cx * (1 - approach);

      const bFestival = smoothstep(0.55, 1.05, progress);
      currentThreads.forEach((current, i) => {
        current.ball.copy(seasonThreads[i].ball).lerp(festivalThreads[i].ball, bFestival);
        current.thread.copy(seasonThreads[i].thread).lerp(festivalThreads[i].thread, bFestival);
      });

      const entranceT = reducedMotion ? 1 : easeOutCubic(clamp01((time - entranceStart) / 2.2));
      const attractionBoost = lerp(7.5, 1, entranceT);

      // Measuring from the previous frame on first contact would read as one huge flick.
      const isInteracting = Math.abs(mouse.x) < 0.99 || Math.abs(mouse.y) < 0.99;
      mouseSpeed = isInteracting && wasInteracting ? Math.min(mouseWorld3D.distanceTo(prevMouseWorld), 3) : 0;
      prevMouseWorld.copy(mouseWorld3D);
      wasInteracting = isInteracting;

      let damping = 0.91;
      damping = lerp(damping, 0.992, dropF);
      damping = lerp(damping, 0.90, shapeF);
      damping = lerp(damping, 0.985, flyF);

      const camZ = camera.position.z;
      const clusterActive = Math.max(heroF, entranceT < 1 ? 1 : 0);
      // Hero copy sits along the bottom, so the cluster floats a little above centre.
      const clusterY = viewportHeight * (viewportWidth < viewportHeight ? 0.16 : 0.1);

      // 1. Accelerations
      for (const b of balls) {
        if (heroF > 0.01 && !reducedMotion) {
          b.velocity.x += Math.sin(time * 0.4 + b.id * 1.5) * 0.0004 * b.radius * heroF;
          b.velocity.y += Math.cos(time * 0.5 + b.id * 1.2) * 0.0004 * b.radius * heroF;
          b.velocity.z += Math.sin(time * 0.35 + b.id) * 0.0001 * heroF;
        }

        const clusterStrength = PARAMS.centerAttractForce * attractionBoost * clusterActive;
        if (clusterStrength > 0.00001) {
          b.velocity.x += (0 - b.position.x) * clusterStrength * 0.38;
          b.velocity.y += (clusterY - b.position.y) * clusterStrength * 1.85;
          b.velocity.z += (0 - b.position.z) * clusterStrength * 1.8;
        }

        if (dropF > 0.001) {
          b.velocity.y -= 0.011 * dropF;
        }

        if (shapeF > 0.001) {
          const k = 0.06 * shapeF;
          const targetX = (b.gateTarget.x - gate.cx) * gateScale + gateX;
          const targetY = (b.gateTarget.y - gate.cy) * gateScale + gate.cy;
          const targetZ = b.gateTarget.z + 1.7 * approach;
          b.velocity.x += (targetX - b.position.x) * k;
          b.velocity.y += (targetY - b.position.y) * k;
          b.velocity.z += (targetZ - b.position.z) * k;
        }

        if (flyF > 0.001) {
          const stagger = (b.id * 0.6180339887) % 1;
          const local = smoothstep(stagger * 0.55, stagger * 0.55 + 0.45, flyF);
          b.velocity.z += 0.05 * local;
          b.velocity.x += b.position.x * 0.006 * local;
          b.velocity.y += b.position.y * 0.006 * local;
        }

        if (isInteracting) {
          diffVec.subVectors(b.position, mouseWorld3D);
          const rawDist = diffVec.length();
          const activeRepelRadius = mouse.isDown ? PARAMS.mouseRepelRadius * 1.4 : PARAMS.mouseRepelRadius;
          const activeRepelForce = mouse.isDown ? PARAMS.mouseRepelForce * 1.7 : PARAMS.mouseRepelForce;
          if (rawDist < activeRepelRadius && rawDist > 0.0001) {
            const ratio = rawDist / activeRepelRadius;
            const smoothFactor = 1.0 - (ratio * ratio * (3.0 - 2.0 * ratio));
            const speedBoost = 1 + mouseSpeed * 3.2;
            const push = smoothFactor * activeRepelForce * speedBoost;
            diffVec.normalize();
            diffVec.z *= 0.12;
            diffVec.normalize();
            b.velocity.addScaledVector(diffVec, push);
          }
        }

        b.velocity.multiplyScalar(damping);
        b.position.addScaledVector(b.velocity, 1);

        // The fly-out force grows with distance, so anyone lingering mid-release would hit infinity.
        if (flyF > 0.001) {
          if (Math.abs(b.position.x) > 60) { b.position.x = Math.sign(b.position.x) * 60; b.velocity.x = 0; }
          if (Math.abs(b.position.y) > 60) { b.position.y = Math.sign(b.position.y) * 60; b.velocity.y = 0; }
          if (b.position.z > 40) { b.position.z = 40; b.velocity.z = 0; }
        }

        // Colour: thread colourways morph with scroll, then everything takes on the gate's colours.
        const threads = currentThreads[b.threadIndex];
        mixColor.copy(b.isLantern ? b.paper : threads.ball).lerp(b.gateColor, shapeF);
        b.material.color.copy(mixColor);
        if (b.isLantern) b.threadColor.copy(inkColor).lerp(b.gateColor, shapeF * (b.id === 0 ? 0 : 1));
        else b.threadColor.copy(threads.thread).lerp(b.gateColor, shapeF * 0.8);

        const opacity = flyF > 0.001 ? 1 - smoothstep(camZ - 2.6, camZ - 0.3, b.position.z) : 1;
        b.material.opacity = opacity;
        if (b.isLantern) {
          const dim = b.id === 0 ? 1 : 1 - 0.8 * shapeF;
          const flicker = 0.92 + Math.sin(time * 3.1 + b.id * 2.4) * 0.08;
          b.material.emissiveIntensity = lanternGlow * dim * flicker;
          b.halo.material.opacity = haloStrength * dim * opacity;
        }

        const targetVis = lerp(b.radius, b.gateRadius, shapeF);
        b.visualScale += (targetVis - b.visualScale) * 0.12;
        if (b.isLantern) b.mesh.scale.set(b.visualScale, b.visualScale * 0.9, b.visualScale);
        else b.mesh.scale.setScalar(b.visualScale);
      }

      // 2. Pairwise collisions, nearly off in gate mode so balls can line up shoulder to shoulder
      const collideScale = 0.28 * (1 - 0.97 * shapeF) * (1 - flyF);
      if (collideScale > 0.0005) {
        for (let step = 0; step < 4; step++) {
          for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
              const b1 = balls[i];
              const b2 = balls[j];
              collideDiff.subVectors(b2.position, b1.position);
              const dist = collideDiff.length();
              const minDist = b1.visualScale + b2.visualScale;
              if (dist < minDist && dist > 0.001) {
                const overlap = minDist - dist;
                collideDiff.multiplyScalar(1 / dist);
                const totalMass = b1.mass + b2.mass;
                const ratio1 = b2.mass / totalMass;
                const ratio2 = b1.mass / totalMass;
                b1.position.addScaledVector(collideDiff, -overlap * ratio1 * collideScale);
                b2.position.addScaledVector(collideDiff, overlap * ratio2 * collideScale);

                relVel.subVectors(b2.velocity, b1.velocity);
                const velAlongNormal = relVel.dot(collideDiff);
                if (velAlongNormal < -0.0001) {
                  const impulse = -(1 + PARAMS.bounciness) * velAlongNormal / (1 / b1.mass + 1 / b2.mass);
                  b1.velocity.addScaledVector(collideDiff, -impulse / b1.mass);
                  b2.velocity.addScaledVector(collideDiff, impulse / b2.mass);
                }
              }
            }
          }
        }
      }

      // 3. Viewport walls and the floor
      const xBound = viewportWidth / 2 - 0.2;
      const topY = viewportHeight / 2 - 0.05;
      const floorY = -viewportHeight / 2 + 0.05;
      const zBound = 2.0;
      const restitution = 0.30 + 0.35 * dropF;
      const contain = flyF < 0.5 && approach < 0.05;
      const zContain = flyF < 0.02;

      for (const b of balls) {
        const r = b.visualScale;

        if (contain) {
          if (b.position.x < -xBound - r) { b.position.x = -xBound - r; b.velocity.x *= PARAMS.rebound; }
          else if (b.position.x > xBound + r) { b.position.x = xBound + r; b.velocity.x *= PARAMS.rebound; }

          if (b.position.y - r < floorY) {
            b.position.y = floorY + r;
            if (b.velocity.y < 0) b.velocity.y = -b.velocity.y * restitution;
            if (dropF > 0.3) { b.velocity.x *= 0.86; b.velocity.z *= 0.86; }
          }
          if (b.position.y + r > topY) {
            b.position.y = topY - r;
            if (b.velocity.y > 0) b.velocity.y *= PARAMS.rebound;
          }
        }

        if (zContain) {
          if (b.position.z < -zBound) { b.position.z = -zBound; b.velocity.z *= PARAMS.rebound; }
          else if (b.position.z > zBound) { b.position.z = zBound; b.velocity.z *= PARAMS.rebound; }
        }

        if (b.isLantern) {
          // Lanterns stay upright and sway, so their characters remain readable.
          b.mesh.rotation.z = Math.sin(time * 0.7 + b.id) * 0.08 * (1 - shapeF);
        } else {
          // Temari roll with their motion, which is what makes the embroidery come alive.
          deltaPos.copy(b.position).sub(b.mesh.position);
          const moved = Math.hypot(deltaPos.x, deltaPos.y);
          if (moved > 0.0005) {
            rotAxis.set(deltaPos.y, -deltaPos.x, 0).normalize();
            b.mesh.rotateOnWorldAxis(rotAxis, -(moved / b.radius) * 0.95);
          }
        }
        b.mesh.position.copy(b.position);
      }

      // Petals warm towards vermilion as the gate rises.
      petalMix.copy(petalColor).lerp(gateRedColor, shapeF * 0.6);
      petalMaterial.color.copy(petalMix);
    };

    // Steps down resolution, then shadows, if the device can't hold a usable frame rate.
    let sampleFrames = 0;
    let sampleTime = 0;
    const watchPerformance = (dt) => {
      sampleFrames++;
      sampleTime += dt;
      if (sampleFrames < 90) return;
      const fps = sampleFrames / sampleTime;
      sampleFrames = 0;
      sampleTime = 0;
      if (fps >= 38) return;
      if (pixelRatio > 1) {
        pixelRatio = Math.max(1, pixelRatio - 0.25);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight, false);
      } else if (keyLight.castShadow) {
        keyLight.castShadow = false;
      }
    };

    // Compiling shaders synchronously would freeze the loader on slower devices. The one
    // warm-up frame runs in the cluster, because off-screen spheres would be culled from it.
    await renderer.compileAsync(scene, camera);
    placeInCluster();
    renderer.render(scene, camera);
    scatterFar(false);
    onReady();

    const startedAt = performance.now();
    let lastFrame = startedAt;
    let accumulator = 0;
    let parked = false;
    let flownSince = -1;

    const setBallsVisible = (visible) => {
      balls.forEach((b) => { b.mesh.visible = visible; });
      renderer.shadowMap.autoUpdate = visible;
    };

    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const dt = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      const time = (now - startedAt) / 1000;

      if (control.started && !localStarted) {
        localStarted = true;
        entranceStart = time;
        if (reducedMotion) placeInCluster();
        else scatterFar(true);
      }
      if (!localStarted || control.paused) return;

      updatePetals(dt, time);

      // Once every sphere has flown past the lens, only the petals are left to draw.
      const progress = control.progress;
      if (progress >= 3.2) {
        if (flownSince < 0) flownSince = time;
        if (time - flownSince > 2.5) {
          if (!parked) {
            parked = true;
            setBallsVisible(false);
          }
          renderer.render(scene, camera);
          return;
        }
      } else {
        flownSince = -1;
        if (parked) {
          parked = false;
          setBallsVisible(true);
        }
      }

      updateMouse3D();
      accumulator += dt;
      let steps = 0;
      while (accumulator >= STEP - 0.002 && steps < 2) {
        stepSimulation(time, progress);
        accumulator -= STEP;
        steps++;
      }
      if (accumulator > STEP) accumulator = 0;

      renderer.render(scene, camera);
      watchPerformance(dt);
    };

    new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      updateFrustumBounds();
      assignGateTargets();
    }).observe(container);

    loop();

    return {
      setSeason(name) {
        seasonThreads = toThreads(SEASONS[name].threads);
        petalColor = new THREE.Color(SEASONS[name].petal);
      },
      setTheme: applyTheme,
    };
  }

  return { start, SEASONS };
})();
