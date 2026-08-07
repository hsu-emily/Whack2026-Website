import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * WishingWell — a well built from glassy bricks, fed by a stream of stars
 * pouring in from the top of the frame.
 *
 * There is no galaxy in here: this component is meant to be layered as the
 * BACKGROUND of a section that sits below the GalaxyStream section, so the
 * stars appear to spill out of that galaxy, cross this section (behind the
 * section's own text), and land in the well at the bottom.
 *
 * Intended usage (section content overlays the stars):
 *
 *   <section id="sponsors" className="section section-6 well-section">
 *     <WishingWell className="well-canvas" sourceX={0.62} />
 *     <div className="section-inner centered">…pills, headings…</div>
 *   </section>
 *
 *   .well-section { position: relative; }
 *   .well-canvas  { position: absolute; inset: 0; }
 *   .well-section .section-inner { position: relative; z-index: 1; }
 *
 * The canvas ignores pointer events, so links and pills above it stay clickable.
 * Fixed camera — no zoom, no orbit. The only moving parts are the star stream,
 * the ripples/splashes it makes, and the occasional wish star.
 *
 * Props:
 *   sourceX        number      0–1: where (horizontally) the stream enters at the
 *                              top of the frame. Match it to where GalaxyStream's
 *                              trails exit the section above (~0.6–0.7). Default 0.62.
 *   streamDensity  number      0–1. How heavy the star stream is. Default 1.
 *   onStarLanded   () => void  Called when a big wish star splashes down.
 *   className      string      Passed to the root wrapper div.
 *   style          object      Passed to the root wrapper div.
 *   background     string | null  CSS background. null = transparent (default).
 */

// Same palette as GalaxyStream — the stream stars are "its" stars.
const BRIGHT = [0xeef0ff, 0xfff3d8, 0xdcd2ff];
const DEEP = [0x7c8ce0, 0x5d6fd4, 0x9aa8f2, 0xb9a7ee];
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export default function WishingWell({
  sourceX = 0.62,
  streamDensity = 1,
  onStarLanded,
  className,
  style,
  background = null,
}) {
  const mountRef = useRef(null);
  const densityRef = useRef(streamDensity);
  const sourceXRef = useRef(sourceX);
  const onStarLandedRef = useRef(onStarLanded);

  useEffect(() => {
    densityRef.current = THREE.MathUtils.clamp(streamDensity, 0, 1);
  }, [streamDensity]);
  useEffect(() => {
    sourceXRef.current = THREE.MathUtils.clamp(sourceX, 0, 1);
  }, [sourceX]);
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

    // --- Scene / fixed camera (no controls) ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05082a, 0.02);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 7.4);
    camera.lookAt(0, 2.2, 0); // well sits low in frame, sky above for stream + overlaid text

    // --- Lights (Hourglass trio + pool glow) ---
    scene.add(new THREE.AmbientLight(0x4a5fb0, 0.6));
    const keyLight = new THREE.PointLight(0x9ffcff, 2.5, 20, 1.6);
    keyLight.position.set(2.5, 2.5, 3);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb388ff, 2.0, 20, 1.6);
    rimLight.position.set(-2.5, 0.5, 2);
    scene.add(rimLight);
    const poolLight = new THREE.PointLight(0x5fc8ff, 1.4, 5, 2);
    poolLight.position.set(0, 1.0, 0);
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

    // --- Root group (the well) ---
    const root = new THREE.Group();
    scene.add(root);

    // ══════════════════════ STONE-BRICK WELL ══════════════════════
    // Solid moonlit stone in the Hourglass family: same blue-metal tones as its
    // caps and posts, with a faint inner emissive so the whole well feels lit
    // from the water. No transmission — a well should read as solid.
    const stoneMat = new THREE.MeshPhysicalMaterial({
      color: 0x7fb4e6,
      metalness: 0.5,
      roughness: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      emissive: 0x0d2b55,
      emissiveIntensity: 0.35,
    });

    // Flush masonry: bricks sit exactly on the wall radius with near-zero jitter,
    // and a soft fillet keeps every edge rounded (the hourglass has no hard corners).
    const wallRadius = 1.6;
    const courses = 5;
    const perCourse = 16;
    const courseHeight = 0.33;
    const wallBottom = -1.1;
    const wallTop = wallBottom + (courses - 1) * courseHeight + 0.16; // top face of last course
    const brickGeo = new RoundedBoxGeometry(0.6, 0.31, 0.24, 3, 0.04);
    const bricks = new THREE.InstancedMesh(brickGeo, stoneMat, courses * perCourse);
    {
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const p = new THREE.Vector3();
      const s = new THREE.Vector3(1, 1, 1);
      const tint = new THREE.Color();
      let idx = 0;
      for (let c = 0; c < courses; c++) {
        const y = wallBottom + c * courseHeight;
        const bond = (c % 2) * (Math.PI / perCourse); // running-bond half-step offset
        for (let i = 0; i < perCourse; i++) {
          const a = bond + (i / perCourse) * Math.PI * 2;
          p.set(Math.cos(a) * wallRadius, y, Math.sin(a) * wallRadius);
          e.set(0, -a - Math.PI / 2, 0); // long axis along the wall tangent, perfectly flush
          q.setFromEuler(e);
          m4.compose(p, q, s);
          bricks.setMatrixAt(idx, m4);
          // Very gentle per-brick tint drift so the wall isn't a flat color.
          tint.setHSL(0.57 + Math.random() * 0.025, 0.45, 0.66 + Math.random() * 0.06);
          bricks.setColorAt(idx, tint);
          idx++;
        }
      }
      bricks.instanceMatrix.needsUpdate = true;
      if (bricks.instanceColor) bricks.instanceColor.needsUpdate = true;
    }
    root.add(bricks);

    // Coping: a course of wide, flat capstones laid across the top of the wall —
    // a real well rim, not a ring. They overhang the bricks slightly on both sides.
    const copingCount = 12;
    const copingGeo = new RoundedBoxGeometry(0.86, 0.15, 0.46, 3, 0.05);
    const coping = new THREE.InstancedMesh(copingGeo, stoneMat, copingCount);
    {
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const p = new THREE.Vector3();
      const s = new THREE.Vector3(1, 1, 1);
      const tint = new THREE.Color();
      for (let i = 0; i < copingCount; i++) {
        const a = (i / copingCount) * Math.PI * 2 + Math.PI / copingCount;
        p.set(Math.cos(a) * wallRadius, wallTop + 0.08, Math.sin(a) * wallRadius);
        e.set(0, -a - Math.PI / 2, 0);
        q.setFromEuler(e);
        m4.compose(p, q, s);
        coping.setMatrixAt(i, m4);
        tint.setHSL(0.57 + Math.random() * 0.02, 0.42, 0.7 + Math.random() * 0.05);
        coping.setColorAt(i, tint);
      }
      coping.instanceMatrix.needsUpdate = true;
      if (coping.instanceColor) coping.instanceColor.needsUpdate = true;
    }
    root.add(coping);

    // Solid stone plinth the well stands on — two soft-edged tiers.
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(wallRadius + 0.22, wallRadius + 0.34, 0.2, 64),
      stoneMat
    );
    plinth.position.y = wallBottom - 0.24;
    root.add(plinth);
    const plinthLower = new THREE.Mesh(
      new THREE.CylinderGeometry(wallRadius + 0.38, wallRadius + 0.46, 0.14, 64),
      stoneMat
    );
    plinthLower.position.y = wallBottom - 0.4;
    root.add(plinthLower);

    // Whisper of light lining the inside of the shaft, so the interior reads as
    // lit by the water rather than pitch black.
    const innerGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(wallRadius - 0.2, wallRadius - 0.2, courses * courseHeight, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x9ffcff,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    innerGlow.position.y = wallBottom + (courses * courseHeight) / 2 - courseHeight / 2;
    root.add(innerGlow);

    // --- Water inside the well (Hourglass liquid material) ---
    const waterY = wallTop - 0.28;
    const poolRadius = wallRadius - 0.24;
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

    // ══════════════════════ THE STREAM ══════════════════════
    // Stars enter at the top edge of the frame (screen-space sourceX), so they
    // visually continue whatever is above this section — the GalaxyStream trails.
    const sourcePoint = new THREE.Vector3();
    const corridor = new THREE.Vector3();
    const updateSource = () => {
      // Unproject a point just above the top of the viewport onto the z=0 plane.
      const ndcX = sourceXRef.current * 2 - 1;
      sourcePoint.set(ndcX, 1.12, 0.5).unproject(camera);
      const dir = sourcePoint.sub(camera.position).normalize();
      const t = -camera.position.z / dir.z;
      sourcePoint.copy(camera.position).addScaledVector(dir, t);
      // Corridor: midway down, bowed outward so the ribbon falls in a graceful arc.
      corridor.set(
        sourcePoint.x + (sourcePoint.x >= 0 ? 0.9 : -0.9),
        (sourcePoint.y + waterY) * 0.55,
        0
      );
    };
    updateSource();

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
    scene.add(stream);

    const tmpV = new THREE.Vector3();
    const particles = [];
    const spawnParticle = (p) => {
      p.a.copy(sourcePoint);
      p.a.x += (Math.random() - 0.5) * 0.5;
      p.a.z += (Math.random() - 0.5) * 0.4;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (poolRadius - 0.25);
      p.b.set(Math.cos(ang) * r, waterY, Math.sin(ang) * r);
      p.c.copy(corridor);
      p.c.x += (Math.random() - 0.5) * 0.35;
      p.c.y += (Math.random() - 0.5) * 0.35;
      p.c.z += (Math.random() - 0.5) * 0.3;
      p.t = 0;
      p.speed = 0.24 + Math.random() * 0.16;
      // Same color rule as GalaxyStream's trails: 30% BRIGHT, 70% DEEP.
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
      p.t = Math.random(); // pre-fill so it starts as a flowing ribbon
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

    // --- Ripple rings (Hourglass system) ---
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

    // --- Splash particles (Hourglass system) ---
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

    // --- Wish stars (Hourglass rounded star, warm BRIGHT gold) ---
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
    const wishCount = 2;
    for (let i = 0; i < wishCount; i++) {
      const mesh = new THREE.Mesh(
        starMeshGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0xfff3d8,
          emissiveIntensity: 3.5,
          metalness: 0.4,
          roughness: 0.1,
          clearcoat: 1.0,
          transparent: true,
          opacity: 1,
        })
      );
      mesh.scale.setScalar(0.5);
      mesh.visible = false;
      scene.add(mesh);
      wishStars.push({
        mesh,
        phase: 'idle',
        age: -(5 + i * 8 + Math.random() * 4),
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        c: new THREE.Vector3(),
        fallDuration: 3,
        floatDuration: 4,
        spin: 0,
      });
    }
    const launchWishStar = (w) => {
      w.a.copy(sourcePoint);
      w.a.x += (Math.random() - 0.5) * 0.4;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (poolRadius - 0.4);
      w.b.set(Math.cos(ang) * r, waterY, Math.sin(ang) * r);
      w.c.copy(corridor); // rides the same corridor as the stardust
      w.fallDuration = 2.8 + Math.random() * 1.2;
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

      // Stream: accelerate down the arc, fade in near the top of the frame.
      const activeCount = Math.floor(streamCount * density);
      for (let i = 0; i < streamCount; i++) {
        const p = particles[i];
        if (i >= activeCount) {
          streamPos[i * 3 + 1] = -50;
          continue;
        }
        p.t += p.speed * (0.45 + p.t) * dt;
        if (p.t >= 1) {
          spawnRipple(p.b.x, p.b.z, 0.2 + Math.random() * 0.18);
          if (Math.random() < 0.25) spawnSplash(p.b.x, p.b.z, 2);
          spawnParticle(p);
        }
        bezier(tmpV, p.a, p.c, p.b, p.t);
        streamPos[i * 3] = tmpV.x;
        streamPos[i * 3 + 1] = tmpV.y;
        streamPos[i * 3 + 2] = tmpV.z;
        const fadeIn = Math.min(1, p.t / 0.08);
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
          const eased = k * k * (3 - 2 * k);
          bezier(m.position, w.a, w.c, w.b, eased);
          m.rotation.y += w.spin * dt * 2;
          m.rotation.z = Math.sin(t * 2 + w.spin) * 0.3;
          if (k >= 1) {
            spawnSplash(m.position.x, m.position.z, 10);
            spawnRipple(m.position.x, m.position.z, 1.05);
            spawnRipple(m.position.x, m.position.z, 0.7, 0.15);
            spawnRipple(m.position.x, m.position.z, 0.4, 0.3);
            w.phase = 'floating';
            w.age = 0;
            onStarLandedRef.current?.();
          }
          continue;
        }
        const k = Math.min(w.age / w.floatDuration, 1);
        m.position.y = waterY + 0.1 + Math.sin(t * 2.2 + w.spin * 5) * 0.03;
        m.rotation.y += w.spin * dt * 0.4;
        m.rotation.z = Math.sin(t * 1.4 + w.spin) * 0.12;
        const fade = 1 - Math.max(0, (k - 0.6) / 0.4);
        m.material.opacity = fade;
        m.material.emissiveIntensity = 3.5 * (0.85 + Math.sin(t * 3) * 0.15) * fade;
        if (k >= 1) {
          spawnRipple(m.position.x, m.position.z, 0.35);
          m.visible = false;
          w.phase = 'idle';
          w.age = -(8 + Math.random() * 10);
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

      // The only ambient motion: water shimmer and the Hourglass's gentle sway.
      water.material.emissiveIntensity = 0.24 + Math.sin(t * 1.8) * 0.07;
      poolLight.intensity = 1.3 + Math.sin(t * 1.8) * 0.3;
      root.rotation.y = Math.sin(t * 0.25) * 0.04;
      root.position.y = Math.sin(t * 0.6) * 0.03;
    };

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);
      tick(t, dt);
      composer.render();
    };

    const animate = () => {
      if (visible) renderFrame(); // pause the whole pipeline when scrolled offscreen
      raf = requestAnimationFrame(animate);
    };

    if (reducedMotion) {
      for (let i = 0; i < 60; i++) tick(i * 0.05, 0.05); // settle the ribbon
      composer.render(); // single static frame
    } else {
      animate();
    }

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
      camera.lookAt(0, 2.2, 0);
      renderer.setSize(w, h);
      composer.setSize(w, h);
      updateSource(); // keep the stream entering at the same screen fraction
      if (reducedMotion) composer.render();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
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
  }, []); // Setup once. Density/sourceX/callbacks are read from refs so prop changes apply live.

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
        pointerEvents: 'none', // background layer: never block links/pills above it
        ...style,
      }}
    />
  );
}
