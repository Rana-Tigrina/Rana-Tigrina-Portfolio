"use client";
// The well itself: wall, steps, rope, water, dust and the lamp. All procedural, no model files.
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { well, DEPTH_M } from "@/lib/state";
import { wallShader, waterShader, moteShader } from "./shaders";

const R = 4; // radius of the shaft, metres
const TOP = 3;
const WATER_Y = -DEPTH_M;

// Little oil lamps in niches, one near each chapter.
const DIYAS = [-6, -13, -22, -30, -38, -47, -55, -61].map(
  (y, i) => new THREE.Vector3(Math.cos(i * 2.4) * (R - 0.25), y, Math.sin(i * 2.4) * (R - 0.25)),
);

const hand = new THREE.Vector3(); // the lamp is held out toward whatever you point at

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function Shaft({ gentle, lite }: { gentle: boolean; lite: boolean }) {
  const lamp = useRef<THREE.PointLight>(null!);
  const bucket = useRef<THREE.Mesh>(null!);
  const wall = useMemo(() => {
    const m = new THREE.ShaderMaterial({ ...wallShader, side: THREE.BackSide });
    m.uniforms.uDiyas.value = DIYAS;
    return m;
  }, []);
  const water = useMemo(() => new THREE.ShaderMaterial(waterShader), []);
  const motes = useMemo(
    () => new THREE.ShaderMaterial({ ...moteShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [],
  );
  const eased = useRef({ depth: 0, x: 0, y: 0, lamp: 0 });

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime;
    const k = Math.min(1, dt * 3); // the bucket has weight: everything trails the input a little
    const e = eased.current;
    e.depth += (well.depth - e.depth) * k;
    e.x += (well.pointer.x - e.x) * k;
    e.y += (well.pointer.y - e.y) * k;

    // You ride the bucket down the middle. It turns slowly and sways.
    camera.position.set(Math.sin(t * 0.5) * 0.12, 1.6 - e.depth * (DEPTH_M - 0.2), Math.cos(t * 0.37) * 0.12);
    // Peer straight down at the rim, look at the wall on the way, peer down again at the water.
    const peer = smoothstep(0.05, 0, e.depth) + smoothstep(0.9, 1, e.depth) * 0.85;
    camera.rotation.set(-0.1 - peer * 1.25 - e.y * 0.25, e.depth * Math.PI * 3 - e.x * 0.5, Math.sin(t * 0.6) * 0.015, "YXZ");
    bucket.current.position.set(camera.position.x, camera.position.y - 0.8, camera.position.z);

    // The flame. Slow breathing plus a faster shiver; gentle mode holds it steady.
    const flicker = gentle ? 1 : 0.86 + 0.1 * Math.sin(t * 2.3) * Math.sin(t * 1.1) + 0.04 * Math.sin(t * 13);
    e.lamp += (well.lamp - e.lamp) * Math.min(1, dt * (well.lamp ? 1.2 : 30)); // catches slowly, dies at once
    const power = e.lamp * flicker;
    lamp.current.position.copy(camera.position).add(hand.set(e.x * 2.3, -e.y * 1.6, -2.9).applyEuler(camera.rotation));
    lamp.current.intensity = power * 40;

    for (const m of [wall, water, motes]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uLamp.value.copy(lamp.current.position);
      m.uniforms.uPower.value = power;
      m.uniforms.uDread.value = well.dread;
    }
  });

  return (
    <>
      <pointLight ref={lamp} color="#ff9a45" distance={8} decay={2} />
      <hemisphereLight args={["#27344f", "#000000", 0.25]} />
      <fog attach="fog" args={["#020303", 3, 30]} />

      <mesh position={[0, (TOP + WATER_Y) / 2, 0]} material={wall}>
        <cylinderGeometry args={[R, R, TOP - WATER_Y, 96, 1, true]} />
      </mesh>

      <Steps />

      {/* the rope you came down on */}
      <mesh position={[1.2, (TOP + WATER_Y) / 2, 0.9]}>
        <cylinderGeometry args={[0.018, 0.018, TOP - WATER_Y, 6]} />
        <meshBasicMaterial color="#2b2014" />
      </mesh>

      {/* the rim of the bucket you are standing in */}
      <mesh ref={bucket} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.5, 0.035, 8, 40]} />
        <meshBasicMaterial color="#120b06" />
      </mesh>

      {DIYAS.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={[4, 1.6, 0.4]} toneMapped={false} />
        </mesh>
      ))}

      <mesh position={[0, WATER_Y, 0]} rotation-x={-Math.PI / 2} material={water}>
        <circleGeometry args={[R, 64]} />
      </mesh>

      <Motes material={motes} count={lite ? 250 : 900} />
    </>
  );
}

// A stone stair winding down the wall, one slab at a time.
function Steps() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = Math.floor((TOP - WATER_Y) / 0.2);
  useLayoutEffect(() => {
    const slab = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = i * 0.2;
      slab.position.set(Math.cos(a) * (R - 0.45), TOP - i * 0.2, Math.sin(a) * (R - 0.45));
      slab.rotation.y = -a;
      slab.updateMatrix();
      ref.current.setMatrixAt(i, slab.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.9, 0.2, 0.85]} />
      <meshStandardMaterial color="#6a665b" roughness={1} />
    </instancedMesh>
  );
}

// Dust that only shows where the lamp reaches.
function Motes({ material, count }: { material: THREE.ShaderMaterial; count: number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (R - 0.4);
      pos.set([Math.cos(a) * r, TOP - Math.random() * (TOP - WATER_Y), Math.sin(a) * r], i * 3);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, [count]);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
