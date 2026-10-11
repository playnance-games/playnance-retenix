import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated AI "brain" — a fuzzy particle sphere that rotates and pulses,
 * evoking a nebula-like magenta/purple core fading to indigo edges.
 */
const PALETTES = {
  players: { core: "#e33e68", mid: "#c026b3", edge: "#7c2d6d" },
  bosses: { core: "#2563eb", mid: "#4f46e5", edge: "#1e3a8a" },
};

export default function BrainSphere({ className = "", palette = "players" }) {
  const ref = useRef(null);
  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const colorsFor = PALETTES[palette] || PALETTES.players;

    const getWidth = () => mount.clientWidth || 600;
    const getHeight = () => mount.clientHeight || 560;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 0.1, 100);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getWidth(), getHeight());
    mount.appendChild(renderer.domElement);

    // Particle cloud — denser at the core, sparse at the edges.
    const COUNT = 7000;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const core = new THREE.Color(colorsFor.core);
    const mid = new THREE.Color(colorsFor.mid);
    const edge = new THREE.Color(colorsFor.edge);
    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const r = Math.pow(u, 1.8) * 1.05;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const t = Math.min(r / 1.05, 1);
      const c = t < 0.5 ? core.clone().lerp(mid, t / 0.5) : mid.clone().lerp(edge, (t - 0.5) / 0.5);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    // Track original positions and current displacement for the spring-back effect.
    const origPositions = new Float32Array(COUNT * 3);
    origPositions.set(positions);
    const disp = new Float32Array(COUNT * 3); // current offset from original
    const vel = new Float32Array(COUNT * 3); // velocity of the offset

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geom, mat);
    scene.add(points);

    // Neural paths — particle streams that branch from the brain's surface to 6 anchor points
    // (3 left, 3 right). They use the same particles/spring physics as the brain, so clicks
    // push them too, and they flow back to place.
    const ANCHORS = [];
    for (let i = 0; i < 3; i++) {
      const y = 0.55 - i * 0.55; // top, middle, bottom
      ANCHORS.push({ x: -2.2, y, z: 0 }); // left
      ANCHORS.push({ x: 2.2, y, z: 0 }); // right
    }
    const PATH_PER_ANCHOR = 180;
    const PATH_COUNT = ANCHORS.length * PATH_PER_ANCHOR;
    const pathPositions = new Float32Array(PATH_COUNT * 3);
    const pathColors = new Float32Array(PATH_COUNT * 3);
    const pathOrig = new Float32Array(PATH_COUNT * 3);
    const pathDisp = new Float32Array(PATH_COUNT * 3);
    const pathVel = new Float32Array(PATH_COUNT * 3);
    const pathPath = new THREE.Color(colorsFor.core);
    const pathEdge = new THREE.Color(colorsFor.mid);
    let pi = 0;
    ANCHORS.forEach((a, ai) => {
      // Origin on the brain surface, in the direction of the anchor.
      const dir = new THREE.Vector3(a.x, a.y, a.z).normalize();
      const ox = dir.x * 1.02, oy = dir.y * 1.02, oz = dir.z * 1.02;
      for (let j = 0; j < PATH_PER_ANCHOR; j++) {
        // Distribute along the path with slight perpendicular spread (a fuzzy tendril).
        const t = j / (PATH_PER_ANCHOR - 1);
        const ease = t * t * (3 - 2 * t); // smoothstep
        const px = ox + (a.x - ox) * ease;
        const py = oy + (a.y - oy) * ease;
        const pz = oz + (a.z - oz) * ease;
        // Perpendicular jitter for a neural-fiber look.
        const spread = 0.05 + t * 0.12;
        const jx = (Math.random() - 0.5) * spread;
        const jy = (Math.random() - 0.5) * spread;
        const jz = (Math.random() - 0.5) * spread * 0.3;
        const X = px + jx, Y = py + jy, Z = pz + jz;
        pathPositions[pi * 3] = X;
        pathPositions[pi * 3 + 1] = Y;
        pathPositions[pi * 3 + 2] = Z;
        pathOrig[pi * 3] = X;
        pathOrig[pi * 3 + 1] = Y;
        pathOrig[pi * 3 + 2] = Z;
        const c = pathPath.clone().lerp(pathEdge, t);
        pathColors[pi * 3] = c.r;
        pathColors[pi * 3 + 1] = c.g;
        pathColors[pi * 3 + 2] = c.b;
        pi++;
      }
    });
    const pathGeom = new THREE.BufferGeometry();
    pathGeom.setAttribute("position", new THREE.BufferAttribute(pathPositions, 3));
    pathGeom.setAttribute("color", new THREE.BufferAttribute(pathColors, 3));
    const pathMat = new THREE.PointsMaterial({
      size: 0.022,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pathPoints = new THREE.Points(pathGeom, pathMat);
    scene.add(pathPoints);

    // Soft inner glow.
    const glowGeom = new THREE.SphereGeometry(0.38, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorsFor.core),
      transparent: true,
      opacity: 0.14,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    scene.add(glow);

    // Click pushes nearby dots toward the click point; they spring back to place.
    const pushDots = (clientX, clientY) => {
      const rect = mount.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      // Project a target point on the brain's surface plane (z≈0 in local space).
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
      const dir = target.sub(camera.position).normalize();
      // Intersect the click ray with the z=0 plane through the brain's center.
      const hit = camera.position.clone().add(dir.multiplyScalar(-camera.position.z / dir.z));
      // Convert into the rotating/pulsing cloud's local space.
      points.updateMatrixWorld();
      points.worldToLocal(hit);
      const ox = hit.x, oy = hit.y, oz = hit.z;
      const RADIUS = 0.75;
      const FORCE = 6;
      // Affect brain particles.
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        const px = origPositions[i3];
        const py = origPositions[i3 + 1];
        const pz = origPositions[i3 + 2];
        const dx = px - ox;
        const dy = py - oy;
        const dz = pz - oz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < RADIUS) {
          const fall = (1 - dist / RADIUS);
          const push = FORCE * fall * fall;
          // Push dots outward, away from the click point.
          const inv = 1 / Math.max(dist, 0.0001);
          vel[i3] += dx * inv * push;
          vel[i3 + 1] += dy * inv * push;
          vel[i3 + 2] += dz * inv * push;
        }
      }
      // Affect neural-path particles too (same spring physics).
      pathPoints.updateMatrixWorld();
      const pathHit = hit.clone();
      pathPoints.worldToLocal(pathHit);
      const pOX = pathHit.x, pOY = pathHit.y, pOZ = pathHit.z;
      const PRADIUS = 1.1;
      for (let i = 0; i < PATH_COUNT; i++) {
        const i3 = i * 3;
        const px = pathOrig[i3];
        const py = pathOrig[i3 + 1];
        const pz = pathOrig[i3 + 2];
        const dx = px - pOX;
        const dy = py - pOY;
        const dz = pz - pOZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < PRADIUS) {
          const fall = (1 - dist / PRADIUS);
          const push = FORCE * 0.8 * fall * fall;
          const inv = 1 / Math.max(dist, 0.0001);
          pathVel[i3] += dx * inv * push;
          pathVel[i3 + 1] += dy * inv * push;
          pathVel[i3 + 2] += dz * inv * push;
        }
      }
    };

    const onClick = (e) => pushDots(e.clientX, e.clientY);
    const onMove = (e) => { if (e.buttons > 0) pushDots(e.clientX, e.clientY); };
    mount.addEventListener("pointerdown", onClick);
    mount.addEventListener("pointermove", onMove);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.12;
      points.rotation.x = Math.sin(t * 0.2) * 0.16;
      const pulse = 1 + Math.sin(t * 1.4) * 0.04;
      points.scale.setScalar(pulse);
      glow.scale.setScalar(1 + Math.sin(t * 1.4) * 0.1);
      glowMat.opacity = 0.1 + Math.abs(Math.sin(t * 1.4)) * 0.09;

      // Spring dots back toward their original positions.
      const STIFFNESS = 9; // pull back to origin
      const DAMPING = 4; // settle the wobble
      const dt = 0.016;
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        // spring toward zero displacement (original position)
        vel[i3] += (-STIFFNESS * disp[i3] - DAMPING * vel[i3]) * dt;
        vel[i3 + 1] += (-STIFFNESS * disp[i3 + 1] - DAMPING * vel[i3 + 1]) * dt;
        vel[i3 + 2] += (-STIFFNESS * disp[i3 + 2] - DAMPING * vel[i3 + 2]) * dt;
        disp[i3] += vel[i3] * dt;
        disp[i3 + 1] += vel[i3 + 1] * dt;
        disp[i3 + 2] += vel[i3 + 2] * dt;
        positions[i3] = origPositions[i3] + disp[i3];
        positions[i3 + 1] = origPositions[i3 + 1] + disp[i3 + 1];
        positions[i3 + 2] = origPositions[i3 + 2] + disp[i3 + 2];
      }
      geom.attributes.position.needsUpdate = true;
      // Same spring physics for neural-path particles, plus a gentle flowing shimmer
      // along each tendril so the paths look alive.
      for (let i = 0; i < PATH_COUNT; i++) {
        const i3 = i * 3;
        pathVel[i3] += (-STIFFNESS * pathDisp[i3] - DAMPING * pathVel[i3]) * dt;
        pathVel[i3 + 1] += (-STIFFNESS * pathDisp[i3 + 1] - DAMPING * pathVel[i3 + 1]) * dt;
        pathVel[i3 + 2] += (-STIFFNESS * pathDisp[i3 + 2] - DAMPING * pathVel[i3 + 2]) * dt;
        pathDisp[i3] += pathVel[i3] * dt;
        pathDisp[i3 + 1] += pathVel[i3 + 1] * dt;
        pathDisp[i3 + 2] += pathVel[i3 + 2] * dt;
        const perp = Math.sin(t * 2 + i * 0.4) * 0.012;
        pathPositions[i3] = pathOrig[i3] + pathDisp[i3] + perp;
        pathPositions[i3 + 1] = pathOrig[i3 + 1] + pathDisp[i3 + 1] + Math.cos(t * 2 + i * 0.4) * 0.012;
        pathPositions[i3 + 2] = pathOrig[i3 + 2] + pathDisp[i3 + 2];
      }
      pathGeom.attributes.position.needsUpdate = true;
      // Paths stay fixed in place (no rotation) — only a subtle opacity shimmer.
      pathMat.opacity = 0.5 + Math.abs(Math.sin(t * 1.4)) * 0.2;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = getWidth();
      const h = getHeight();
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onClick);
      mount.removeEventListener("pointermove", onMove);
      geom.dispose();
      mat.dispose();
      glowGeom.dispose();
      glowMat.dispose();
      pathGeom.dispose();
      pathMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [palette]);

  return <div ref={ref} className={`brain-sphere ${className}`} style={{ cursor: "crosshair" }} aria-label="Interactive brain — click to send dots flying" />;
}