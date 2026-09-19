"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface Radar3DBlip {
  id: string;
  angleDeg: number;
  severity: "opportunity" | "watch" | "critical";
}

const SEV_COLOR: Record<Radar3DBlip["severity"], number> = {
  opportunity: 0x4a7ef0, // trust blue
  watch: 0xffc24b, // warm sun
  critical: 0xf96a3c, // clay orange
};

/** Soft round sprite for glows without external textures. */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/**
 * RADAAR's true-3D growth radar, styled like clay on the blue canvas:
 * a rounded dish, a soft rotating sweep, and jelly-like blip pillars.
 */
export default function Radar3D({ blips }: { blips: Radar3DBlip[] }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const blipsRef = useRef<Radar3DBlip[]>(blips);
  blipsRef.current = blips;
  const pillarRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    // clay-studio lighting: key from top-left, cool fill from right
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-4, 7, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
    fill.position.set(5, 3, 4);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));

    const dish = new THREE.Group();
    scene.add(dish);

    // dish base: squashed sphere = clay saucer
    const saucer = new THREE.Mesh(
      new THREE.SphereGeometry(4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05 }),
    );
    saucer.scale.set(1, 0.32, 1);
    saucer.position.y = -0.4;
    dish.add(saucer);

    // inner dish: shallow blue bowl
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd9e6fb, roughness: 0.4 }),
    );
    bowl.scale.set(1, 0.42, 1);
    bowl.rotation.x = Math.PI; // open upward
    bowl.position.y = 0.28;
    dish.add(bowl);

    // cute center hub
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0x3ec98f, roughness: 0.35 }),
    );
    hub.position.y = 0.45;
    dish.add(hub);

    // rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x9db9ec, transparent: true, opacity: 0.5 });
    for (const r of [1.15, 2.3, 3.35]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 72), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.16;
      dish.add(ring);
    }

    // sweep: soft cone rotating
    const glowTex = makeGlowTexture();
    const sweep = new THREE.Mesh(
      new THREE.ConeGeometry(3.25, 1.1, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x7da9ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    sweep.position.y = 0.85;
    dish.add(sweep);

    // blip pillars group (rebuilt when blips change)
    const pillars = new THREE.Group();
    dish.add(pillars);
    pillarRef.current = pillars;

    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    function rebuildPillars() {
      if (!pillarRef.current) return;
      const g = pillarRef.current;
      while (g.children.length) {
        const c = g.children.pop()!;
        (c as THREE.Mesh).geometry?.dispose?.();
      }
      for (const b of blipsRef.current) {
        const a = (b.angleDeg * Math.PI) / 180;
        const dist = 2.1;
        const x = Math.cos(a) * dist;
        const z = Math.sin(a) * dist;
        const col = SEV_COLOR[b.severity];

        const h = 0.85 + (b.severity === "critical" ? 0.5 : 0);
        const pillar = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.17, h, 6, 16),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }),
        );
        pillar.position.set(x, 0.25 + h / 2, z);
        g.add(pillar);

        const top = new THREE.Sprite(spriteMat.clone());
        top.material.color = new THREE.Color(col);
        top.scale.set(0.9, 0.9, 1);
        top.position.set(x, 0.35 + h + 0.28, z);
        g.add(top);

        // base plate
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.34, 0.1, 24),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }),
        );
        plate.position.set(x, 0.2, z);
        g.add(plate);
      }
    }
    rebuildPillars();

    // interaction: gentle orbit + drag
    let rotY = 0;
    let targetRotY = 0.5;
    let velY = 0.0016;
    let dragging = false;
    let lastX = 0;
    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.onpointerdown = (e) => {
      dragging = true;
      lastX = e.clientX;
      el.style.cursor = "grabbing";
    };
    window.addEventListener("pointerup", () => {
      dragging = false;
      el.style.cursor = "grab";
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      targetRotY += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
    });

    function resize() {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight || 320;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const fit = Math.max(1, w / Math.max(1, h));
      camera.position.set(0, 5.6, 7.4 + fit * 1.6);
      camera.lookAt(0, -0.1, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const render = () => {
      const t = clock.getElapsedTime();
      if (!dragging) targetRotY += velY;
      rotY += (targetRotY - rotY) * 0.08;
      dish.rotation.y = rotY;

      sweep.rotation.y = -t * 1.4;
      sweep.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);

      // jelly bounce on pillars
      if (pillarRef.current) {
        pillarRef.current.children.forEach((c, i) => {
          if ((c as THREE.Mesh).geometry?.type === "CapsuleGeometry") {
            const s = 1 + Math.sin(t * 3 + i * 1.7) * 0.06;
            c.scale.y = s;
          }
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // react to blip changes
  useEffect(() => {
    // trivial tick; rebuild happens via ref below
  }, [blips]);
  useEffect(() => {
    const g = pillarRef.current;
    if (!g) return;
    while (g.children.length) {
      const c = g.children.pop()!;
      (c as THREE.Mesh).geometry?.dispose?.();
    }
    // rebuild with latest blips
    for (const b of blips) {
      const a = (b.angleDeg * Math.PI) / 180;
      const dist = 2.1;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const col = SEV_COLOR[b.severity];
      const h = 0.85 + (b.severity === "critical" ? 0.5 : 0);
      const pillar = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.17, h, 6, 16),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }),
      );
      pillar.position.set(x, 0.25 + h / 2, z);
      g.add(pillar);
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.34, 0.1, 24),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }),
      );
      plate.position.set(x, 0.2, z);
      g.add(plate);
    }
  }, [blips]);

  return <div ref={mountRef} className="h-full w-full" />;
}
