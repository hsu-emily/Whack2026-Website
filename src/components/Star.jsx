import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FloatingMagicalStar({ className, style }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;

    // 1. Clean WebGL Renderer with Alpha Enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // 2. Camera Configuration
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // 3. Lighting Setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xfff5cc, 1.5);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);

    // 4. Extruded 3D Star Profile
    const starShape = new THREE.Shape();
    {
      const spikes = 5, outerR = 0.62, innerR = 0.30;
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
      depth: 0.18,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 6,
      curveSegments: 24,
    });
    starMeshGeo.center();

    // Warm Golden Glowing Material Setup
    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffdf5d, 
      emissiveIntensity: 0.0, // Starts unlit
      roughness: 0.15,
      metalness: 0.1,
    });

    const star = new THREE.Mesh(starMeshGeo, starMaterial);
    
    // --- POSITION ADJUSTMENT ---
    // Shifting the model coordinates slightly left (-X) and down (-Y)
    star.position.set(-0.15, -0.15, 0);
    
    scene.add(star);

    // 5. Physics Animation Loop
    let rafId;
    const clock = new THREE.Clock();
    const fadeDuration = 2.5; 

    const animate = () => {
      const t = clock.getElapsedTime();

      // Pitching slightly forward and spinning continuously on Y axis
      star.rotation.x = 0.4 + Math.sin(t * 0.4) * 0.1;
      star.rotation.y = t * 0.6; 
      star.rotation.z = Math.sin(t * 0.3) * 0.05;

      // Smoothly blend the emission level from 0 up to target brightness (1.8) on load
      const targetGlow = 1.8;
      const currentFade = Math.min(t / fadeDuration, 1.0);
      const baseGlow = THREE.MathUtils.lerp(0.0, targetGlow, currentFade);

      // Gentle atmospheric core pulse
      starMaterial.emissiveIntensity = baseGlow + Math.sin(t * 2.5) * (0.2 * currentFade);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    // 6. Handle Resizing Properly
    const onResize = () => {
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.dispose();
      starMeshGeo.dispose();
      starMaterial.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 15px rgba(255, 230, 110, 0.45)) drop-shadow(0 0 35px rgba(255, 220, 80, 0.15)) brightness(1.3)',
        ...style,
      }}
    />
  );
}