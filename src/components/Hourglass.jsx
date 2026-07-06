import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * SoulSeal Progress Hourglass — magical long-term goal visualizer.
 *
 * Props:
 *   startDate     Date | string   When the goal began. Defaults to now.
 *   endDate       Date | string   When the goal ends. Required for real progress; otherwise starts at 0%.
 *   progress      number          0–1. When provided, overrides the date-based fill entirely
 *                                 (e.g. drive it from scroll position).
 *   onProgress    (progress: number, elapsedMs: number, remainingMs: number) => void
 *                                 Called ~4x/second while mounted.
 *   className     string          Passed to the root wrapper div.
 *   style         object          Passed to the root wrapper div.
 *   background    string | null   CSS background for the wrapper. null = transparent (default).
 *
 * The component fills its parent container. Give the parent an explicit size.
 */
export default function Hourglass({
  startDate,
  endDate,
  progress,
  onProgress,
  className,
  style,
  background = null,
}) {
  const mountRef = useRef(null);
  const goalRef = useRef({ start: null, end: null });
  const progressRef = useRef(progress ?? null);

  useEffect(() => {
    progressRef.current = progress ?? null;
  }, [progress]);

  // Keep the goal ref in sync with props so the animation loop always reads the latest values.
  useEffect(() => {
    goalRef.current = {
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null,
    };
  }, [startDate, endDate]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // --- Scene / camera ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05082a, 0.02);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 7);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0x4a5fb0, 0.6));
    const keyLight = new THREE.PointLight(0x9ffcff, 2.5, 20, 1.6);
    keyLight.position.set(2.5, 2, 3);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb388ff, 2.0, 20, 1.6);
    rimLight.position.set(-2.5, -1, 2);
    scene.add(rimLight);
    const topLight = new THREE.PointLight(0xffffff, 1.2, 10, 2);
    topLight.position.set(0, 3, 1);
    scene.add(topLight);

    // --- Backdrop starfield ---
    const starGeo = new THREE.BufferGeometry();
    {
      const count = 600;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 20 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi) - 5;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.08,
        color: 0xcfe9ff,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(stars);

    // --- Hourglass group ---
    const hourglass = new THREE.Group();
    scene.add(hourglass);

    // Glass lathe profile.
    const glassProfile = [
      [0.0, -2.0], [1.1, -2.0], [1.3, -1.85], [1.35, -1.55], [1.25, -1.1],
      [0.95, -0.6], [0.55, -0.25], [0.18, 0.0], [0.55, 0.25], [0.95, 0.6],
      [1.25, 1.1], [1.35, 1.55], [1.3, 1.85], [1.1, 2.0], [0.0, 2.0],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const glass = new THREE.Mesh(
      new THREE.LatheGeometry(glassProfile, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0xa0e8ff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.4,
        ior: 1.45,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
        envMapIntensity: 1.2,
      })
    );
    hourglass.add(glass);

    const rim = new THREE.Mesh(
      new THREE.LatheGeometry(glassProfile, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9ffcff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    rim.scale.setScalar(1.02);
    hourglass.add(rim);

    // Caps.
    const capMat = new THREE.MeshPhysicalMaterial({
      color: 0x88c8ff,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 1.0,
    });
    const capGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.18, 64);
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = 2.09;
    hourglass.add(topCap);
    const bottomCap = new THREE.Mesh(capGeo, capMat);
    bottomCap.position.y = -2.09;
    hourglass.add(bottomCap);

    // Posts.
    const postMat = new THREE.MeshPhysicalMaterial({
      color: 0x6ac8ff,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x113366,
      emissiveIntensity: 0.4,
    });
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 4.1, 16);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18);
      hourglass.add(post);
    }

    // --- Liquid ---
    const innerInset = 0.08;
    const innerRadiusAt = (y) => {
      for (let i = 0; i < glassProfile.length - 1; i++) {
        const a = glassProfile[i];
        const b = glassProfile[i + 1];
        if ((a.y <= y && b.y >= y) || (a.y >= y && b.y <= y)) {
          const t = (y - a.y) / ((b.y - a.y) || 1e-6);
          const r = a.x + (b.x - a.x) * t;
          return Math.max(0.001, r - innerInset);
        }
      }
      return 0.001;
    };

    const buildSandProfile = (dir, fillHeight) => {
      const pts = [];
      const segs = 28;
      if (dir > 0) {
        pts.push(new THREE.Vector2(0.001, 0));
        for (let i = 1; i <= segs; i++) {
          const y = fillHeight * (i / segs);
          pts.push(new THREE.Vector2(innerRadiusAt(y), y));
        }
        pts.push(new THREE.Vector2(0.001, fillHeight));
      } else {
        const floorY = -2.0;
        const surfaceY = floorY + fillHeight;
        pts.push(new THREE.Vector2(0.001, floorY));
        for (let i = 1; i <= segs; i++) {
          const y = floorY + fillHeight * (i / segs);
          pts.push(new THREE.Vector2(innerRadiusAt(y), y));
        }
        pts.push(new THREE.Vector2(0.001, surfaceY));
      }
      return pts;
    };

    const liquidColor = 0x5fc8ff;
    const makeLiquidMat = (opacity) =>
      new THREE.MeshPhysicalMaterial({
        color: liquidColor,
        emissive: 0x1a6fa8,
        emissiveIntensity: 0.25,
        roughness: 0.15,
        metalness: 0.0,
        transmission: 0.35,
        thickness: 1.0,
        ior: 1.33,
        attenuationColor: 0x3a9fdc,
        attenuationDistance: 0.6,
        transparent: true,
        opacity,
        depthWrite: true,
        side: THREE.DoubleSide,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

    const topLiquid = new THREE.Mesh(
      new THREE.LatheGeometry(buildSandProfile(+1, 2.0), 64),
      makeLiquidMat(0.9)
    );
    const bottomLiquid = new THREE.Mesh(
      new THREE.LatheGeometry(buildSandProfile(-1, 0.35), 64),
      makeLiquidMat(0.92)
    );
    hourglass.add(topLiquid);
    hourglass.add(bottomLiquid);

    const updateLiquidGeometry = (topFill, bottomFill) => {
      topLiquid.geometry.dispose();
      topLiquid.geometry = new THREE.LatheGeometry(buildSandProfile(+1, topFill), 64);
      bottomLiquid.geometry.dispose();
      bottomLiquid.geometry = new THREE.LatheGeometry(buildSandProfile(-1, bottomFill), 64);
    };

    // --- Dripping droplets ---
    // Each droplet swells at the neck, detaches, falls, then resets — like a leaky faucet.
    const dropMat = new THREE.MeshPhysicalMaterial({
      color: liquidColor,
      emissive: 0x2a8fcc,
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.25,
      thickness: 0.2,
      ior: 1.33,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const dropGeo = new THREE.SphereGeometry(0.07, 20, 16);
    const fallingDrops = new THREE.Group();
    const drips = [];
    const dripCount = 3;
    for (let i = 0; i < dripCount; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      m.visible = false;
      fallingDrops.add(m);
      drips.push({
        mesh: m,
        phase: 'forming',
        age: -i * 0.9, // stagger so drops fall one after another
        formDuration: 0.8,
        vel: new THREE.Vector3(),
      });
    }
    hourglass.add(fallingDrops);

    // --- Ripple rings on the pool surface ---
    const rippleCount = 12;
    const rippleGeo = new THREE.RingGeometry(0.85, 1.0, 48);
    const ripples = [];
    for (let i = 0; i < rippleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xbfeaff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(rippleGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      hourglass.add(mesh);
      ripples.push({ mesh, age: 0, life: 0, maxRadius: 1, delay: 0 });
    }
    const spawnRipple = (x, z, y, maxRadius, delay = 0) => {
      const r = ripples.find((rp) => rp.life <= 0);
      if (!r) return;
      r.mesh.position.set(x, y + 0.015, z);
      r.age = -delay;
      r.life = 1.1;
      r.maxRadius = maxRadius;
    };

    // --- Splash particles ---
    const makeDropletTexture = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(220, 245, 255, 1)');
      grad.addColorStop(0.6, 'rgba(170, 220, 255, 0.7)');
      grad.addColorStop(1, 'rgba(120, 200, 255, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 32, 32);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const splashCount = 40;
    const splashGeo = new THREE.BufferGeometry();
    const splashPos = new Float32Array(splashCount * 3);
    const splashVel = new Float32Array(splashCount * 3);
    const splashLife = new Float32Array(splashCount);
    splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
    const splash = new THREE.Points(
      splashGeo,
      new THREE.PointsMaterial({
        size: 0.025,
        color: 0xcfeeff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.NormalBlending,
        map: makeDropletTexture(),
        sizeAttenuation: true,
      })
    );
    hourglass.add(splash);

    // --- Star + moon ---
    const milestoneGroup = new THREE.Group();
    hourglass.add(milestoneGroup);

    // Star: rounded via quadratic curves.
    const starShape = new THREE.Shape();
    {
      const spikes = 5, outerR = 0.3, innerR = 0.15;
      const pts = [];
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
      const mids = pts.map((p, i) => p.clone().add(pts[(i + 1) % pts.length]).multiplyScalar(0.5));
      starShape.moveTo(mids[0].x, mids[0].y);
      for (let i = 0; i < pts.length; i++) {
        const c = pts[(i + 1) % pts.length];
        const nm = mids[(i + 1) % mids.length];
        starShape.quadraticCurveTo(c.x, c.y, nm.x, nm.y);
      }
      starShape.closePath();
    }
    const starMeshGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 8,
      curveSegments: 24,
    });
    starMeshGeo.center();
    const star = new THREE.Mesh(
      starMeshGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: 0xff9be0,
        emissiveIntensity: 4.5,
        metalness: 0.4,
        roughness: 0.1,
        clearcoat: 1.0,
      })
    );
    star.position.set(0, 1.2, 0);

    // Halo sprite.
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d');
    const hgrad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    hgrad.addColorStop(0, 'rgba(255, 220, 245, 1)');
    hgrad.addColorStop(0.3, 'rgba(255, 155, 224, 0.55)');
    hgrad.addColorStop(1, 'rgba(255, 155, 224, 0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(haloCanvas),
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.setScalar(1.6);
    star.add(halo);
    const starLight = new THREE.PointLight(0xff9be0, 2.0, 3, 2);
    star.add(starLight);
    milestoneGroup.add(star);

    // Moon.
    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 0.3, -Math.PI / 2, Math.PI / 2, false);
    moonShape.absarc(0.1, 0, 0.26, Math.PI / 2, -Math.PI / 2, true);
    const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 10,
      curveSegments: 48,
    });
    moonGeo.center();
    const moon = new THREE.Mesh(
      moonGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xc8f0ff,
        emissive: 0x80d0ff,
        emissiveIntensity: 0.25,
        metalness: 0.5,
        roughness: 0.2,
        clearcoat: 1,
      })
    );
    moon.position.set(0, -1.3, 0);
    moon.rotation.z = -0.3;
    milestoneGroup.add(moon);

    // --- Postprocessing ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.55,
      0.5,
      0.35
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // --- Progress helpers ---
    const getProgress = () => {
      if (progressRef.current !== null) {
        return THREE.MathUtils.clamp(progressRef.current, 0, 1);
      }
      const { start, end } = goalRef.current;
      if (!start || !end) return 0;
      const now = new Date();
      const total = end - start;
      if (total <= 0) return 1;
      return THREE.MathUtils.clamp((now - start) / total, 0, 1);
    };

    // --- onProgress callback ticker ---
    let progressInterval = null;
    if (onProgress) {
      progressInterval = setInterval(() => {
        const { start, end } = goalRef.current;
        if (!start || !end) return;
        const now = new Date();
        onProgress(getProgress(), now - start, end - now);
      }, 250);
    }

    // --- Animation loop ---
    const clock = new THREE.Clock();
    let raf = 0;
    const moonRadius = 0.32;

    const animate = () => {
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);

      const progress = getProgress();
      const topFill = THREE.MathUtils.clamp((1 - progress) * 2.0, 0.05, 2.0);
      const bottomBase = 0.35;
      const bottomFill = THREE.MathUtils.clamp(
        bottomBase + progress * (2.0 - bottomBase),
        0.05,
        2.0
      );
      updateLiquidGeometry(topFill, bottomFill);

      const poolSurface = -2.0 + bottomFill;

      // Moon world → local for collision.
      const moonWorld = new THREE.Vector3();
      moon.getWorldPosition(moonWorld);
      const moonLocal = hourglass.worldToLocal(moonWorld.clone());

      const spawnSplash = (x, z) => {
        for (let s = 0; s < 4; s++) {
          const idx = Math.floor(Math.random() * splashCount);
          const a = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 0.4;
          const r = 0.01 + Math.random() * 0.02;
          splashPos[idx * 3] = x + Math.cos(a) * r;
          splashPos[idx * 3 + 1] = poolSurface + 0.02;
          splashPos[idx * 3 + 2] = z + Math.sin(a) * r;
          splashVel[idx * 3] = Math.cos(a) * speed * 0.4;
          splashVel[idx * 3 + 1] = speed;
          splashVel[idx * 3 + 2] = Math.sin(a) * speed * 0.4;
          splashLife[idx] = 0.4 + Math.random() * 0.4;
        }
        splashGeo.attributes.position.needsUpdate = true;
      };

      // Drip cycle: swell at the neck → detach → fall → splash + ripple → reset.
      const gravity = 2.4;
      const poolRadius = Math.max(0.15, innerRadiusAt(poolSurface) - 0.05);
      for (const d of drips) {
        d.age += dt;
        const m = d.mesh;
        if (d.age < 0) {
          m.visible = false;
          continue;
        }
        m.visible = true;

        if (d.phase === 'forming') {
          // Droplet grows and elongates while clinging to the neck.
          const k = Math.min(d.age / d.formDuration, 1);
          const s = 0.35 + 0.65 * k;
          const wobble = 1 + Math.sin(t * 18) * 0.03 * k;
          m.scale.set(s * wobble, s * (1 + k * 0.7), s * wobble);
          m.position.set(0, -0.08 - k * 0.06, 0);
          if (k >= 1) {
            d.phase = 'falling';
            d.vel.set((Math.random() - 0.5) * 0.03, -0.15, (Math.random() - 0.5) * 0.03);
          }
          continue;
        }

        // Falling.
        const v = d.vel;
        v.y -= gravity * dt;
        m.position.x += v.x * dt;
        m.position.y += v.y * dt;
        m.position.z += v.z * dt;

        // Moon collision (sphere approx).
        const dx = m.position.x - moonLocal.x;
        const dy = m.position.y - moonLocal.y;
        const dz = m.position.z - moonLocal.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < moonRadius * moonRadius) {
          const dist = Math.sqrt(d2) || 1e-6;
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          m.position.x = moonLocal.x + nx * moonRadius;
          m.position.y = moonLocal.y + ny * moonRadius;
          m.position.z = moonLocal.z + nz * moonRadius;
          const vDotN = v.x * nx + v.y * ny + v.z * nz;
          const rest = 0.35;
          v.x = (v.x - 2 * vDotN * nx) * rest + nx * 0.2;
          v.y = (v.y - 2 * vDotN * ny) * rest + ny * 0.05;
          v.z = (v.z - 2 * vDotN * nz) * rest + nz * 0.2;
        }

        if (m.position.y < poolSurface) {
          spawnSplash(m.position.x, m.position.z);
          spawnRipple(m.position.x, m.position.z, poolSurface, poolRadius);
          spawnRipple(m.position.x, m.position.z, poolSurface, poolRadius * 0.7, 0.15);
          d.phase = 'forming';
          d.age = -(0.3 + Math.random() * 0.5);
        }

        // Teardrop stretch while falling.
        const stretch = THREE.MathUtils.clamp(1 + Math.abs(v.y) * 0.35, 1, 2.2);
        m.scale.set(1, stretch, 1);
      }

      // Ripples: expand outward and fade.
      for (const r of ripples) {
        if (r.life <= 0) {
          r.mesh.visible = false;
          continue;
        }
        r.age += dt;
        if (r.age < 0) {
          r.mesh.visible = false;
          continue;
        }
        r.life -= dt;
        r.mesh.visible = true;
        const k = THREE.MathUtils.clamp(r.age / 1.1, 0, 1);
        const eased = 1 - Math.pow(1 - k, 2); // ease-out expansion
        const radius = 0.06 + eased * r.maxRadius;
        r.mesh.scale.setScalar(radius);
        r.mesh.position.y = poolSurface + 0.015;
        r.mesh.material.opacity = 0.55 * (1 - k);
      }

      // Splash physics.
      const g2 = 4.5;
      for (let i = 0; i < splashCount; i++) {
        splashPos[i * 3] += splashVel[i * 3] * dt;
        splashPos[i * 3 + 1] += splashVel[i * 3 + 1] * dt;
        splashPos[i * 3 + 2] += splashVel[i * 3 + 2] * dt;
        splashVel[i * 3 + 1] -= g2 * dt;
        splashLife[i] -= dt;
        if (splashLife[i] <= 0 || splashPos[i * 3 + 1] < poolSurface - 0.1) {
          splashPos[i * 3 + 1] = poolSurface - 1; // hide off-screen
          splashLife[i] = 0;
        }
      }
      splashGeo.attributes.position.needsUpdate = true;

      // Star: stays floating in the top bulb with a gentle bob.
      star.position.y = 1.2 + Math.sin(t * 1.1) * 0.06;
      star.rotation.y = t * 0.6;
      star.rotation.z = Math.sin(t * 0.8) * 0.15;
      const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      star.material.emissiveIntensity = (4.0 + progress * 3.0) * pulse;
      halo.scale.setScalar((1.4 + progress * 0.6) * pulse);
      starLight.intensity = (1.8 + progress * 2.0) * pulse;

      // Moon.
      const moonPulse = 0.9 + Math.sin(t * 1.2) * 0.1;
      moon.material.emissiveIntensity = (0.25 + progress * 0.35) * moonPulse;
      moon.rotation.z = -0.3 + Math.sin(t * 0.4) * 0.05;

      // Hourglass sway.
      hourglass.rotation.y = Math.sin(t * 0.25) * 0.08;
      hourglass.position.y = Math.sin(t * 0.6) * 0.04;

      controls.update();
      composer.render();
      raf = requestAnimationFrame(animate);
    };
    animate();

    // --- Resize ---
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      if (progressInterval) clearInterval(progressInterval);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      composer.dispose?.();
      // Best-effort dispose scene resources.
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            for (const key of Object.keys(m)) {
              const v = m[key];
              if (v && v.isTexture) v.dispose();
            }
            m.dispose?.();
          }
        }
      });
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []); // Setup once. Progress is read from the ref so goal changes take effect live.

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: background ?? 'transparent',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
