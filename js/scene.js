/* The full-screen gravity field: glossy spheres driven by scroll progress.
   Scroll progress is a float "section index": 0 hero, 1 drop, 2 heart, 3 release. */
const GravityScene = (() => {
  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const STEP = 1 / 60;
  const ROLES = ['pastel', 'light', 'medium', 'deep', 'glass'];
  const PARAMS = {
    rebound: -0.3,
    mouseRepelForce: 0.05,
    mouseRepelRadius: 4.4,
    centerAttractForce: 0.0035,
    bounciness: 0.02,
  };

  async function start({ container, canvas, control, mouse, ballColor, reducedMotion, onReady }) {
    const THREE = await import(THREE_URL);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    let pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemiLight = new THREE.HemisphereLight(0xffffff, new THREE.Color(ballColor), 1.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
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
    keyLight.shadow.radius = 12.0;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.25);
    rimLight.position.set(8, 7, -8);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
    frontLight.position.set(0, 0, 11);
    scene.add(frontLight);

    const sideBounceLight = new THREE.DirectionalLight(0xffffff, 0.3);
    sideBounceLight.position.set(-9, -2, 4);
    scene.add(sideBounceLight);

    // The simulation box is the visible frustum at z = 0.
    let viewportWidth = 10;
    let viewportHeight = 6;
    const updateFrustumBounds = () => {
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewportWidth = viewportHeight * (container.clientWidth / container.clientHeight);
    };
    updateFrustumBounds();

    const getDynamicColors = (baseColor) => {
      const hex = baseColor.toLowerCase();
      const set = (pastel, light, medium, deep, glass) => ({
        pastel: new THREE.Color(pastel),
        light: new THREE.Color(light),
        medium: new THREE.Color(medium),
        deep: new THREE.Color(deep),
        glass: new THREE.Color(glass),
      });
      if (hex === '#e1fc03') return set('#FBFFE2', '#EFFE69', '#E1FC03', '#B1E200', '#DCFF32');
      if (hex === '#ffc5c2') return set('#FFF5F4', '#FFECEB', '#FFA6B3', '#FF4D6D', '#FFA6B3');
      if (hex === '#96e5ff') return set('#F0F9FF', '#C9F1FF', '#96E5FF', '#2BA5FF', '#98E4FF');
      return set('#ECEFFF', '#A8C1FF', '#2F69FF', '#0A33BF', '#4D80FF');
    };

    // Scroll-driven palettes: hero (base) -> volt-lime (drop) -> rose-pink (heart).
    let palHero = getDynamicColors(ballColor);
    const palLime = getDynamicColors('#E1FC03');
    const palPink = getDynamicColors('#FFC5C2');
    const curPal = {};
    ROLES.forEach((role) => { curPal[role] = new THREE.Color(); });

    // Phones have a much narrower box, so spheres shrink to keep the copy readable.
    const ballCount = isMobile ? 54 : 96;
    const sizeScale = isMobile ? 0.72 : 1;
    const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
    const balls = [];

    for (let i = 0; i < ballCount; i++) {
      const rand = Math.random();
      let radius;
      if (rand < 0.3) radius = 0.27 + Math.random() * 0.12;
      else if (rand < 0.8) radius = 0.42 + Math.random() * 0.18;
      else radius = 0.66 + Math.random() * 0.21;
      radius *= sizeScale;

      const isGlass = Math.random() < 0.22;
      let role = 'glass';
      let material;

      if (isGlass) {
        material = new THREE.MeshPhysicalMaterial({
          color: palHero.glass, roughness: 0.08, metalness: 0.0,
          clearcoat: 1.0, clearcoatRoughness: 0.03, transmission: 0.95,
          ior: 1.485, thickness: 2.2,
          specularColor: new THREE.Color('#ffffff'), specularIntensity: 1.0,
          attenuationColor: palHero.pastel.clone(), attenuationDistance: 1.0,
          emissive: palHero.glass, emissiveIntensity: 0.12,
          transparent: true,
        });
      } else {
        const colorRand = Math.random();
        if (colorRand < 0.25) role = 'pastel';
        else if (colorRand < 0.55) role = 'light';
        else if (colorRand < 0.85) role = 'medium';
        else role = 'deep';

        material = new THREE.MeshPhysicalMaterial({
          color: palHero[role], roughness: 0.44, metalness: 0.0,
          clearcoat: 0.24, clearcoatRoughness: 0.35,
          emissive: palHero[role], emissiveIntensity: 0.08,
          transparent: true,
        });
      }

      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.setScalar(radius);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      balls.push({
        id: i,
        radius,
        mass: Math.pow(radius, 3),
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        mesh,
        material,
        role,
        isGlass,
        visualScale: radius,
        shapeTarget: new THREE.Vector3(),
      });
    }

    const meanRadius = balls.reduce((sum, b) => sum + b.radius, 0) / balls.length;
    let shapeScale = 1;

    // Fill the heart implicit (x²+y²−1)³ − x²y³ ≤ 0 by rejection sampling.
    const inHeart = (x, y) => {
      const a = x * x + y * y - 1;
      return a * a * a - x * x * y * y * y <= 0;
    };
    const assignHeartTargets = () => {
      // Wide screens keep the copy in the left column, so the heart sits to the right of it.
      const isSideBySide = window.innerWidth >= 1024;
      const isPortrait = viewportWidth < viewportHeight;
      const S = isPortrait ? viewportWidth * 0.24 : Math.min(viewportWidth * (isSideBySide ? 0.18 : 0.30), viewportHeight * 0.27);
      const baseCX = isSideBySide ? viewportWidth * 0.25 : 0;
      const baseCY = -viewportHeight * 0.03;
      shapeScale = Math.max(0.3, Math.min(1, (S * 0.45 / 2.3) / meanRadius));
      balls.forEach((ball, i) => {
        let x = 0;
        let y = 0;
        if (i % 2 === 0) {
          // Half trace the outline, evenly spaced: a random fill alone reads as a blob.
          const t = (i / balls.length) * Math.PI * 2;
          x = (16 * Math.pow(Math.sin(t), 3)) / 16;
          y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 14.2 + 0.17;
        } else {
          let tries = 0;
          do {
            x = (Math.random() * 2 - 1) * 1.25;
            y = Math.random() * 2.55 - 1.4;
            tries++;
          } while (!inHeart(x, y) && tries < 60);
        }
        ball.shapeTarget.set(x * S + baseCX, (y + 0.12) * S + baseCY, (Math.random() - 0.5) * 0.35);
      });
    };
    assignHeartTargets();

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
        b.velocity.set(0, 0, 0);
      }
    };
    scatterFar(false);

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
    const prevMouseWorld = new THREE.Vector3();
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

      const bLime = smoothstep(0.55, 1.05, progress);
      const bPink = smoothstep(1.40, 1.95, progress);
      for (const role of ROLES) {
        curPal[role].copy(palHero[role]).lerp(palLime[role], bLime).lerp(palPink[role], bPink);
      }
      hemiLight.groundColor.copy(curPal.medium);

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
          b.velocity.x += (b.shapeTarget.x - b.position.x) * k;
          b.velocity.y += (b.shapeTarget.y - b.position.y) * k;
          b.velocity.z += (b.shapeTarget.z - b.position.z) * k;
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

        const c = b.isGlass ? curPal.glass : curPal[b.role];
        b.material.color.copy(c);
        b.material.emissive.copy(c);
        if (b.isGlass) b.material.attenuationColor.copy(curPal.pastel);

        b.material.opacity = flyF > 0.001
          ? 1 - smoothstep(camZ - 2.6, camZ - 0.3, b.position.z)
          : 1;

        const targetVis = b.radius * (1 - (1 - shapeScale) * shapeF);
        b.visualScale += (targetVis - b.visualScale) * 0.12;
        b.mesh.scale.setScalar(b.visualScale);
      }

      // 2. Pairwise collisions, nearly off in shape mode so balls snap onto the silhouette
      const collideScale = 0.28 * (1 - 0.93 * shapeF) * (1 - flyF);
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

      // 3. Viewport walls and the bouncy floor
      const xBound = viewportWidth / 2 - 0.2;
      const topY = viewportHeight / 2 - 0.05;
      const floorY = -viewportHeight / 2 + 0.05;
      const zBound = 2.0;
      const restitution = 0.30 + 0.35 * dropF;
      const contain = flyF < 0.5;
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

        b.mesh.position.copy(b.position);
      }
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

      // Once every sphere has flown past the lens nothing is visible, so stop spending GPU on it.
      const progress = control.progress;
      if (progress >= 3.2) {
        if (flownSince < 0) flownSince = time;
        if (time - flownSince > 2.5) {
          if (!parked) {
            parked = true;
            renderer.clear();
          }
          return;
        }
      } else {
        flownSince = -1;
        parked = false;
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
      assignHeartTargets();
    }).observe(container);

    loop();

    return {
      setBallColor(hex) {
        palHero = getDynamicColors(hex);
      },
    };
  }

  return { start };
})();
