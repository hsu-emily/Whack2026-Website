import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * WishingWell — a glass basin fed by a single stream of stars from a galaxy.
 *
 * Visual siblings:
 *   · The basin uses the Hourglass's glass recipe (transmission MeshPhysicalMaterial
 *     + additive BackSide rim shell) and the same metal for its accents.
 *   · The galaxy mirrors GalaxyStream's CONFIG: 4 arms, winding 4.6, scatter 0.55,
 *     coreBias 0.6, warm core / violet halo, and the same BRIGHT/DEEP palette —
 *     so the 2D galaxy in Tracks and this 3D one read as the same object.
 *   · Stream particles use the trail rules from GalaxyStream: 30% BRIGHT / 70% DEEP
 *     colors, fade-in near the source, and acceleration as they fall. Every path
 *     funnels through one shared corridor so it reads as a single ribbon of stars.
 *
 * Props:
 *   streamDensity  number      0–1. How heavy the star stream is. Default 1.
 *   onStarLanded   () => void  Called when a big wish star splashes down.
 *   className      string      Passed to the root wrapper div.
 *   style          object      Passed to the root wrapper div.
 *   background     string | null  CSS background. null = transparent (default).
 *
 * The component fills its parent container. Give the parent an explicit size.
 */

// Same palette as GalaxyStream.
const BRIGHT = [0xeef0ff, 0xfff3d8, 0xdcd2ff];
const DEEP = [0x7c8ce0, 0x5d6fd4, 0x9aa8f2, 0xb9a7ee];
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// Same spiral parameters as GalaxyStream's CONFIG.
const GALAXY = {
  arms: 4,
  winding: 4.6,
  scatter: 0.55,
  coreBias: 0.6,
  coreFraction: 0.28,
  radius: 1.6, // local units
  rotationSpeed: 0.02,
};

export default function WishingWell({
  streamDensity = 1,
  onStarLanded,
  className,
  style,
  background = null,
}) {
  const mountRef = useRef(null);
  const densityRef = useRef(streamDensity);
  const onStarLandedRef = useRef(onStarLanded);

  useEffect(() => {
    densityRef.current = THREE.MathUtils.clamp(streamDensity, 0, 1);
  }, [streamDensity]);

  useEffect(() => {
    onStarLandedRef.current = onStarLanded;
  }, [onStarLanded]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    camera.position.set(0, 1.4, 8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.target.set(0.6, 1.0, 0);
    controls.enablePan = false;

    // --- Lights (same trio as the Hourglass) ---
    scene.add(new THREE.AmbientLight(0x4a5fb0, 0.6));
    const keyLight = new THREE.PointLight(0x9ffcff, 2.5, 20, 1.6);
    keyLight.position.set(2.5, 2.5, 3);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb388ff, 2.0, 20, 1.6);
    rimLight.position.set(-2.5, 0, 2);
    scene.add(rimLight);
    const poolLight = new THREE.PointLight(0x5fc8ff, 1.4, 5, 2);
    poolLight.position.set(0, 0.5, 0);
    scene.add(poolLight);

    // --- Backdrop starfield (identical to the Hourglass) ---
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
    const backdropStars = new THREE.Points(
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
    scene.add(backdropStars);

    // --- Shared canvas textures ---
    const makeRadialTexture = (stops, size = 64) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (const [k, col] of stops) grad.addColorStop(k, col);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const softStarTexture = makeRadialTexture([
      [0, 'rgba(255, 255, 255, 1)'],
      [0.45, 'rgba(230, 235, 255, 0.8)'],
      [1, 'rgba(160, 175, 240, 0)'],
    ]);
    const dropletTexture = makeRadialTexture([
      [0, 'rgba(220, 245, 255, 1)'],
      [0.6, 'rgba(170, 220, 255, 0.7)'],
      [1, 'rgba(120, 200, 255, 0)'],
    ]);
    // Four-point "anime" sparkle, same shape GalaxyStream draws.
    const sparkleTexture = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const r = 30, k = r * 0.16;
      g.translate(32, 32);
      g.fillStyle = 'rgba(255, 246, 224, 1)';
      g.beginPath();
      g.moveTo(0, -r);
      g.quadraticCurveTo(k, -k, r, 0);
      g.quadraticCurveTo(k, k, 0, r);
      g.quadraticCurveTo(-k, k, -r, 0);
      g.quadraticCurveTo(-k, -k, 0, -r);
      g.fill();
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    // --- Root group ---
    const root = new THREE.Group();
    scene.add(root);

    // ══════════════════════ THE WELL ══════════════════════
    // Glass recipe copied from the Hourglass.
    const glassMat = new THREE.MeshPhysicalMaterial({
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
    });

    // Basin profile: foot → outer bowl wall → rolled lip → inner wall → floor.
    const basinProfile = [
      [0.0, -1.0], [1.1, -1.0], [1.28, -0.94], [1.36, -0.75], [1.4, -0.4],
      [1.44, 0.0], [1.5, 0.12], [1.46, 0.2], [1.3, 0.16], [1.24, 0.04],
      [1.2, -0.35], [1.16, -0.62], [0.0, -0.66],
    ].map(([x, y]) => new THREE.Vector2(x, y));

    const basin = new THREE.Mesh(new THREE.LatheGeometry(basinProfile, 96), glassMat);
    root.add(basin);

    // Additive back-side shell for that glowing glass edge (same trick as the Hourglass rim).
    const basinRim = new THREE.Mesh(
      new THREE.LatheGeometry(basinProfile, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9ffcff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    basinRim.scale.setScalar(1.02);
    root.add(basinRim);

    // Metal accents in the Hourglass cap material.
    const capMat = new THREE.MeshPhysicalMaterial({
      color: 0x88c8ff,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 1.0,
    });
    const baseRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.36, 0.14, 64),
      capMat
    );
    baseRing.position.y = -1.02;
    root.add(baseRing);
    const lipRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.045, 12, 96),
      capMat
    );
    lipRing.rotation.x = -Math.PI / 2;
    lipRing.position.y = 0.16;
    root.add(lipRing);

    // Faint cyan glow tracing the lip.
    const lipGlow = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.06, 12, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9ffcff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    lipGlow.rotation.x = -Math.PI / 2;
    lipGlow.position.y = 0.16;
    root.add(lipGlow);

    // --- Water (the Hourglass liquid material) ---
    const waterY = 0.0;
    const poolRadius = 1.18;
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(poolRadius, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0x5fc8ff,
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
        opacity: 0.92,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = waterY;
    root.add(water);

    // ══════════════════════ THE GALAXY ══════════════════════
    // A 3D twin of GalaxyStream: same arms/winding/scatter/palette, tilted the same way.
    const galaxy = new THREE.Group();
    galaxy.position.set(2.4, 3.9, -1.0);
    galaxy.rotation.set(1.05, 0, -0.45); // tip the disc toward the viewer, tilt like the 2D one
    root.add(galaxy);

    // Disc spins as a unit; spawn math adds disc.rotation.y so the stream tracks the arms.
    const disc = new THREE.Group();
    galaxy.add(disc);

    // (frac, armIndex, fuzz) → flat disc-space point, same formula as GalaxyStream.
    const armPoint = (target, frac, armIndex, fuzz) => {
      const armAngle = armIndex * ((Math.PI * 2) / GALAXY.arms);
      const spread = fuzz * (0.9 - frac * GALAXY.scatter);
      const theta = armAngle + frac * GALAXY.winding + spread;
      const r = frac * GALAXY.radius;
      target.set(
        Math.cos(theta) * r,
        (Math.random() - 0.5) * 0.06,
        Math.sin(theta) * r
      );
      return target;
    };

    const galaxyCount = 900;
    const galaxyGeo = new THREE.BufferGeometry();
    {
      const pos = new Float32Array(galaxyCount * 3);
      const col = new Float32Array(galaxyCount * 3);
      const v = new THREE.Vector3();
      const c = new THREE.Color();
      for (let i = 0; i < galaxyCount; i++) {
        const frac = Math.pow(Math.random(), GALAXY.coreBias);
        armPoint(v, frac, i % GALAXY.arms, Math.random() - 0.5);
        pos[i * 3] = v.x;
        pos[i * 3 + 1] = v.y;
        pos[i * 3 + 2] = v.z;
        // Same color rule as GalaxyStream: warm/bright core, mostly-DEEP arms.
        const inner = frac < GALAXY.coreFraction;
        c.setHex(inner ? pick(BRIGHT) : Math.random() < 0.22 ? pick(BRIGHT) : pick(DEEP));
        const dim = inner ? 1 : 0.55 + Math.random() * 0.45;
        col[i * 3] = c.r * dim;
        col[i * 3 + 1] = c.g * dim;
        col[i * 3 + 2] = c.b * dim;
      }
      galaxyGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      galaxyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    const galaxyPoints = new THREE.Points(
      galaxyGeo,
      new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: softStarTexture,
        sizeAttenuation: true,
      })
    );
    disc.add(galaxyPoints);

    // Four-point sparkles seeded along the arms.
    const sparkleCount = 14;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(sparkleCount * 3);
    const sparkleCol = new Float32Array(sparkleCount * 3);
    const sparklePhase = [];
    {
      const v = new THREE.Vector3();
      const c = new THREE.Color();
      for (let i = 0; i < sparkleCount; i++) {
        const frac = 0.15 + Math.pow(Math.random(), 0.7) * 0.85;
        armPoint(v, frac, i % GALAXY.arms, (Math.random() - 0.5) * 1.3);
        sparklePos[i * 3] = v.x;
        sparklePos[i * 3 + 1] = v.y;
        sparklePos[i * 3 + 2] = v.z;
        c.setHex(pick(BRIGHT));
        sparkleCol[i * 3] = c.r;
        sparkleCol[i * 3 + 1] = c.g;
        sparkleCol[i * 3 + 2] = c.b;
        sparklePhase.push({ tw: 0.4 + Math.random() * 1.1, phase: Math.random() * Math.PI * 2, c: c.clone() });
      }
      sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
      sparkleGeo.setAttribute('color', new THREE.BufferAttribute(sparkleCol, 3));
    }
    const sparkles = new THREE.Points(
      sparkleGeo,
      new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: sparkleTexture,
        sizeAttenuation: true,
      })
    );
    disc.add(sparkles);

    // Warm core + wide violet halo, straight from GalaxyStream's drawGlows.
    const coreSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeRadialTexture([
          [0, 'rgba(255, 242, 214, 0.95)'],
          [0.35, 'rgba(255, 226, 190, 0.4)'],
          [1, 'rgba(255, 226, 190, 0)'],
        ], 128),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    coreSprite.scale.set(1.2, 0.85, 1);
    galaxy.add(coreSprite);
    const haloSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeRadialTexture([
          [0, 'rgba(140, 130, 240, 0.34)'],
          [0.5, 'rgba(90, 90, 200, 0.14)'],
          [1, 'rgba(90, 90, 200, 0)'],
        ], 128),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    haloSprite.scale.set(3.8, 2.6, 1);
    galaxy.add(haloSprite);

    // ══════════════════════ THE STREAM ══════════════════════
    // One ribbon of stars: every particle spawns on a spiral arm, then funnels
    // through a shared corridor point on its way down to the pool — so all the
    // arcs overlap into a single flow, like the trails in GalaxyStream.
    const corridor = new THREE.Vector3(2.5, 1.7, -0.3);

    const streamCount = 150;
    const streamGeo = new THREE.BufferGeometry();
    const streamPos = new Float32Array(streamCount * 3);
    const streamCol = new Float32Array(streamCount * 3);
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
    streamGeo.setAttribute('color', new THREE.BufferAttribute(streamCol, 3));
    const stream = new THREE.Points(
      streamGeo,
      new THREE.PointsMaterial({
        size: 0.075,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: softStarTexture,
        sizeAttenuation: true,
      })
    );
    root.add(stream);

    const tmpV = new THREE.Vector3();
    let discRotation = 0;

    // Spawn on a lower-arm point (frac 0.35–1) of the *currently rotated* disc.
    const spawnFromArm = (target) => {
      const frac = 0.35 + Math.pow(Math.random(), 0.7) * 0.65;
      const armIndex = (Math.random() * GALAXY.arms) | 0;
      armPoint(target, frac, armIndex, Math.random() - 0.5);
      target.applyAxisAngle(new THREE.Vector3(0, 1, 0), discRotation);
      galaxy.localToWorld(target);
      root.worldToLocal(target);
      return target;
    };

    const particles = [];
    const spawnParticle = (p) => {
      spawnFromArm(p.a);
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (poolRadius - 0.2);
      p.b.set(Math.cos(a) * r, waterY, Math.sin(a) * r);
      // Funnel: pull the control point strongly toward the shared corridor.
      p.c.lerpVectors(p.a, p.b, 0.5);
      p.c.lerp(corridor, 0.7);
      p.c.x += (Math.random() - 0.5) * 0.3;
      p.c.y += (Math.random() - 0.5) * 0.3;
      p.c.z += (Math.random() - 0.5) * 0.3;
      p.t = 0;
      p.speed = 0.26 + Math.random() * 0.18;
      // Trail color rule from GalaxyStream: 30% BRIGHT, 70% DEEP.
      p.color.setHex(Math.random() < 0.3 ? pick(BRIGHT) : pick(DEEP));
      p.twinkle = Math.random() * Math.PI * 2;
    };
    for (let i = 0; i < streamCount; i++) {
      const p = {
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        c: new THREE.Vector3(),
        t: 0,
        speed: 0.3,
        color: new THREE.Color(),
        twinkle: 0,
      };
      spawnParticle(p);
      p.t = Math.random(); // pre-fill so it starts as a flowing ribbon, not a first drip
      particles.push(p);
    }

    const bezier = (out, a, c, b, t) => {
      const u = 1 - t;
      out.set(
        u * u * a.x + 2 * u * t * c.x + t * t * b.x,
        u * u * a.y + 2 * u * t * c.y + t * t * b.y,
        u * u * a.z + 2 * u * t * c.z + t * t * b.z
      );
      return out;
    };

    // --- Ripple rings (same system as the Hourglass) ---
    const rippleCount = 14;
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
      root.add(mesh);
      ripples.push({ mesh, age: 0, life: 0, maxRadius: 1 });
    }
    const spawnRipple = (x, z, maxRadius, delay = 0) => {
      const r = ripples.find((rp) => rp.life <= 0);
      if (!r) return;
      r.mesh.position.set(x, waterY + 0.015, z);
      r.age = -delay;
      r.life = 1.1;
      r.maxRadius = maxRadius;
    };

    // --- Splash particles (same system as the Hourglass) ---
    const splashCount = 60;
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
        map: dropletTexture,
        sizeAttenuation: true,
      })
    );
    root.add(splash);
    const spawnSplash = (x, z, bursts = 4) => {
      for (let s = 0; s < bursts; s++) {
        const idx = Math.floor(Math.random() * splashCount);
        const a = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.4;
        const r = 0.01 + Math.random() * 0.02;
        splashPos[idx * 3] = x + Math.cos(a) * r;
        splashPos[idx * 3 + 1] = waterY + 0.02;
        splashPos[idx * 3 + 2] = z + Math.sin(a) * r;
        splashVel[idx * 3] = Math.cos(a) * speed * 0.4;
        splashVel[idx * 3 + 1] = speed;
        splashVel[idx * 3 + 2] = Math.sin(a) * speed * 0.4;
        splashLife[idx] = 0.4 + Math.random() * 0.4;
      }
      splashGeo.attributes.position.needsUpdate = true;
    };

    // --- Wish stars: the Hourglass's rounded star, in the galaxy's warm BRIGHT tone ---
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

    const wishStars = [];
    const wishCount = 3;
    for (let i = 0; i < wishCount; i++) {
      const mesh = new THREE.Mesh(
        starMeshGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0xfff3d8, // BRIGHT warm gold — matches the galaxy's core stars
          emissiveIntensity: 3.5,
          metalness: 0.4,
          roughness: 0.1,
          clearcoat: 1.0,
          transparent: true,
          opacity: 1,
        })
      );
      mesh.scale.setScalar(0.45);
      mesh.visible = false;
      root.add(mesh);
      wishStars.push({
        mesh,
        phase: 'idle',
        age: -(4 + i * 6 + Math.random() * 4), // stagger arrivals
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        c: new THREE.Vector3(),
        fallDuration: 3,
        floatDuration: 4,
        spin: 0,
      });
    }
    const launchWishStar = (w) => {
      spawnFromArm(w.a);
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (poolRadius - 0.4);
      w.b.set(Math.cos(a) * r, waterY, Math.sin(a) * r);
      w.c.lerpVectors(w.a, w.b, 0.5);
      w.c.lerp(corridor, 0.7); // rides the same corridor as the stardust
      w.fallDuration = 2.6 + Math.random() * 1.2;
      w.floatDuration = 3.5 + Math.random() * 2;
      w.spin = (Math.random() - 0.5) * 2;
      w.phase = 'falling';
      w.age = 0;
      w.mesh.visible = true;
      w.mesh.material.opacity = 1;
    };

    // --- Postprocessing (same bloom as the Hourglass) ---
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

    // --- Animation loop ---
    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    const tick = (t, dt) => {
      const density = densityRef.current;

      // Galaxy spins as one disc; the twinkle matches GalaxyStream's rhythm.
      discRotation = t * GALAXY.rotationSpeed * 6; // a touch faster than the 2D one so motion reads in 3D
      disc.rotation.y = discRotation;
      coreSprite.material.opacity = 0.85 + Math.sin(t * 1.4) * 0.15;
      const scol = sparkleGeo.attributes.color;
      for (let i = 0; i < sparkleCount; i++) {
        const sp = sparklePhase[i];
        const a = 0.25 + 0.75 * Math.abs(Math.sin(t * sp.tw + sp.phase));
        scol.setXYZ(i, sp.c.r * a, sp.c.g * a, sp.c.b * a);
      }
      scol.needsUpdate = true;

      // Stream: accelerate down the arc (trail rule), fade in near the galaxy.
      const activeCount = Math.floor(streamCount * density);
      for (let i = 0; i < streamCount; i++) {
        const p = particles[i];
        if (i >= activeCount) {
          streamPos[i * 3 + 1] = -50; // park inactive particles out of sight
          continue;
        }
        p.t += p.speed * (0.45 + p.t) * dt;
        if (p.t >= 1) {
          spawnRipple(p.b.x, p.b.z, 0.22 + Math.random() * 0.18);
          if (Math.random() < 0.25) spawnSplash(p.b.x, p.b.z, 2);
          spawnParticle(p);
        }
        bezier(tmpV, p.a, p.c, p.b, p.t);
        streamPos[i * 3] = tmpV.x;
        streamPos[i * 3 + 1] = tmpV.y;
        streamPos[i * 3 + 2] = tmpV.z;
        const fadeIn = Math.min(1, p.t / 0.1);
        const tw = (0.72 + Math.sin(t * 7 + p.twinkle) * 0.28) * fadeIn;
        streamCol[i * 3] = p.color.r * tw;
        streamCol[i * 3 + 1] = p.color.g * tw;
        streamCol[i * 3 + 2] = p.color.b * tw;
      }
      streamGeo.attributes.position.needsUpdate = true;
      streamGeo.attributes.color.needsUpdate = true;

      // Wish stars.
      for (const w of wishStars) {
        w.age += dt;
        if (w.phase === 'idle') {
          if (w.age >= 0) launchWishStar(w);
          continue;
        }
        const m = w.mesh;
        if (w.phase === 'falling') {
          const k = Math.min(w.age / w.fallDuration, 1);
          const eased = k * k * (3 - 2 * k); // smoothstep: drifts free, then commits
          bezier(m.position, w.a, w.c, w.b, eased);
          m.rotation.y += w.spin * dt * 2;
          m.rotation.z = Math.sin(t * 2 + w.spin) * 0.3;
          if (k >= 1) {
            spawnSplash(m.position.x, m.position.z, 10);
            spawnRipple(m.position.x, m.position.z, 0.9);
            spawnRipple(m.position.x, m.position.z, 0.6, 0.15);
            spawnRipple(m.position.x, m.position.z, 0.35, 0.3);
            w.phase = 'floating';
            w.age = 0;
            onStarLandedRef.current?.();
          }
          continue;
        }
        // Floating: bob, hold, then dissolve into the water.
        const k = Math.min(w.age / w.floatDuration, 1);
        m.position.y = waterY + 0.1 + Math.sin(t * 2.2 + w.spin * 5) * 0.03;
        m.rotation.y += w.spin * dt * 0.4;
        m.rotation.z = Math.sin(t * 1.4 + w.spin) * 0.12;
        const fade = 1 - Math.max(0, (k - 0.6) / 0.4);
        m.material.opacity = fade;
        m.material.emissiveIntensity = 3.5 * (0.85 + Math.sin(t * 3) * 0.15) * fade;
        if (k >= 1) {
          spawnRipple(m.position.x, m.position.z, 0.4);
          m.visible = false;
          w.phase = 'idle';
          w.age = -(6 + Math.random() * 8);
        }
      }

      // Ripples.
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
        const eased = 1 - Math.pow(1 - k, 2);
        r.mesh.scale.setScalar(0.06 + eased * r.maxRadius);
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
        if (splashLife[i] <= 0 || splashPos[i * 3 + 1] < waterY - 0.1) {
          splashPos[i * 3 + 1] = waterY - 1;
          splashLife[i] = 0;
        }
      }
      splashGeo.attributes.position.needsUpdate = true;

      // Water shimmer + lip pulse + gentle sway (Hourglass rhythm).
      water.material.emissiveIntensity = 0.24 + Math.sin(t * 1.8) * 0.07;
      poolLight.intensity = 1.3 + Math.sin(t * 1.8) * 0.3;
      lipGlow.material.opacity = 0.28 + Math.sin(t * 2.4) * 0.12;
      root.rotation.y = Math.sin(t * 0.25) * 0.05;
      root.position.y = Math.sin(t * 0.6) * 0.03;
    };

    const clockTick = () => {
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);
      tick(t, dt);
      controls.update();
      composer.render();
    };

    const animate = () => {
      if (visible) clockTick(); // pause the whole pipeline when scrolled offscreen
      raf = requestAnimationFrame(animate);
    };

    if (reducedMotion) {
      tick(2, 0.016); // settle particles into a visible ribbon, render one static frame
      for (let i = 0; i < 60; i++) tick(2 + i * 0.05, 0.05);
      controls.update();
      composer.render();
    } else {
      animate();
    }

    // --- Visibility: don't burn GPU while offscreen (same idea as GalaxyStream) ---
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    // --- Resize ---
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      if (reducedMotion) composer.render();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      composer.dispose?.();
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
  }, []); // Setup once. Density and callbacks are read from refs so prop changes take effect live.

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
