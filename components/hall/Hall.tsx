"use client";
// The Drowned Hall: a small world under the water where everything that ever fell in has settled.
// You are the frog. Fetch Munawwar's letters and the lost things. Stay out of the serpent's way.
// Everything here is placed from /content, so a new letter or project shows up as a new thing to find.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { Content, Letter, Project } from "@/lib/types";
import { sound } from "@/lib/sound";

type Find = { kind: "letter"; item: Letter; at: THREE.Vector3 } | { kind: "thing"; item: Project; at: THREE.Vector3 };

const EDGE = 18; // radius of the hall
const ROPE = new THREE.Vector3(0, 0, -15); // where the way out appears
const START = new THREE.Vector3(0, 0, 0); // the serpent never comes closer than 5.5 to the middle

// Spread n things evenly on a ring, so adding one more never moves it on top of another.
const onRing = (i: number, n: number, radius: number) => {
  const a = (i / n) * Math.PI * 2 + radius;
  return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
};

export function Hall({ content, lite, onLeave }: { content: Content; lite: boolean; onLeave: (climbed: boolean) => void }) {
  const finds = useMemo<Find[]>(
    () => [
      ...content.letters.map((item, i, all) => ({ kind: "letter" as const, item, at: onRing(i, all.length, 8) })),
      ...content.projects.map((item, i, all) => ({ kind: "thing" as const, item, at: onRing(i, all.length, 13) })),
    ],
    [content],
  );
  const [found, setFound] = useState<number[]>([]);
  const [open, setOpen] = useState<Find | null>(null);
  const [warning, setWarning] = useState("");

  const lettersLeft = finds.filter((f, i) => f.kind === "letter" && !found.includes(i)).length;
  const count = (kind: Find["kind"]) =>
    `${finds.filter((f, i) => f.kind === kind && found.includes(i)).length}/${finds.filter((f) => f.kind === kind).length}`;

  useEffect(() => {
    sound.splash();
  }, []);

  const find = (i: number) => {
    sound.bell();
    setFound((f) => [...f, i]);
    setOpen(finds[i]);
  };
  const caught = () => {
    sound.splash();
    setWarning("It did not want you. It wanted you to know it was there.");
    setTimeout(() => setWarning(""), 5000);
  };

  return (
    <div className="hall">
      <Canvas dpr={[1, lite ? 1.25 : 1.75]} camera={{ fov: 55, position: [0, 6, 12] }}>
        <color attach="background" args={["#010403"]} />
        <fog attach="fog" args={["#010403", 3, 17]} />
        <World finds={finds} found={found} paused={!!open} ropeDown={lettersLeft === 0} onFind={find} onCaught={caught} onClimb={() => onLeave(true)} />
      </Canvas>

      <header className="hall-hud">
        <p>Letters {count("letter")} · Lost things {count("thing")}</p>
        <p>{warning || (lettersLeft ? "WASD or arrow keys, or tap where you want to go" : "The last letter is not a letter. Find the rope.")}</p>
        <button className="quiet" onClick={() => onLeave(false)}>Back up to the well</button>
      </header>

      {open && (
        <div className="hall-card note seen" role="dialog" aria-label={open.item.title}>
          {open.kind === "letter" ? (
            <>
              <span className="note-label">A letter from above · {open.item.date}</span>
              <p className="note-big">{open.item.title}</p>
              <p>{open.item.body}</p>
              <p>— M.</p>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {open.item.image && <img className="hall-photo" src={open.item.image} alt={open.item.object} />}
              <span className="note-label">{open.item.object}</span>
              <p className="note-big">{open.item.title}</p>
              <p><strong>{open.item.metric}</strong> {open.item.metricLabel.toLowerCase()}</p>
              <p>{open.item.summary}</p>
              <a href={open.item.link}>Code on GitHub</a>
            </>
          )}
          <button className="act" autoFocus onClick={() => setOpen(null)}>Keep it</button>
        </div>
      )}
    </div>
  );
}

type WorldProps = {
  finds: Find[];
  found: number[];
  paused: boolean;
  ropeDown: boolean;
  onFind: (i: number) => void;
  onCaught: () => void;
  onClimb: () => void;
};

const KEYS: Record<string, [number, number]> = {
  w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0],
};
const SEGMENTS = 16;

function World({ finds, found, paused, ropeDown, onFind, onCaught, onClimb }: WorldProps) {
  const frog = useRef<THREE.Group>(null!);
  const lamp = useRef<THREE.PointLight>(null!);
  const serpent = useRef<THREE.InstancedMesh>(null!);
  const held = useRef(new Set<string>());
  const goal = useRef<THREE.Vector3 | null>(null); // where the last tap asked the frog to go
  const taken = useRef(new Set<number>()); // found this frame, before React catches up
  const scratch = useMemo(() => ({ move: new THREE.Vector3(), eye: new THREE.Vector3(), part: new THREE.Object3D(), head: new THREE.Vector3() }), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => KEYS[e.key.toLowerCase()] && (held.current.add(e.key.toLowerCase()), e.preventDefault());
    const up = (e: KeyboardEvent) => held.current.delete(e.key.toLowerCase());
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, []);

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime;
    const { move, eye, part, head } = scratch;
    const at = frog.current.position;

    // --- the frog
    move.set(0, 0, 0);
    if (!paused) {
      for (const key of held.current) move.add(eye.set(KEYS[key][0], 0, KEYS[key][1]));
      if (move.lengthSq()) goal.current = null;
      else if (goal.current) {
        move.copy(goal.current).sub(at).setY(0);
        if (move.length() < 0.25) (goal.current = null), move.set(0, 0, 0);
      }
    }
    const moving = move.lengthSq() > 0;
    at.y = 0;
    if (moving) {
      at.addScaledVector(move.normalize(), dt * 4.4).clampLength(0, EDGE);
      frog.current.rotation.y = Math.atan2(move.x, move.z);
    }
    at.y = moving ? Math.abs(Math.sin(t * 9)) * 0.35 : Math.sin(t * 2) * 0.04;
    camera.position.lerp(eye.set(at.x, 6.5, at.z + 8), 0.06);
    camera.lookAt(at.x, 0.4, at.z);

    // --- the serpent: a string of beads following a wandering path, mostly outside the light
    for (let i = 0; i < SEGMENTS; i++) {
      const ti = t * 0.42 - i * 0.14;
      const reach = 9.5 + Math.sin(ti * 0.7) * 4; // circles between 5.5 and 13.5 from the middle, never over the start
      part.position.set(Math.cos(ti * 0.5) * reach, 0.5 + Math.sin(ti * 3) * 0.12, Math.sin(ti * 0.5) * reach);
      part.scale.setScalar(1 - (i / SEGMENTS) * 0.7);
      part.updateMatrix();
      serpent.current.setMatrixAt(i, part.matrix);
      if (i === 0) head.copy(part.position);
    }
    serpent.current.instanceMatrix.needsUpdate = true;

    const gap = head.distanceTo(at);
    const dread = Math.max(0, 1 - gap / 7);
    lamp.current.intensity = (55 + Math.sin(t * 11) * 4) * (1 - dread * 0.75);
    lamp.current.color.setRGB(1 - dread * 0.4, 0.62 + dread * 0.2, 0.3);
    if (dread > 0.3 && Math.random() < dt * 0.6) sound.hiss(1.2, dread * 0.08);
    if (gap < 1.5 && !paused) {
      at.copy(START);
      goal.current = null;
      onCaught();
    }

    // --- finding things
    finds.forEach((f, i) => {
      if (taken.current.has(i) || f.at.distanceTo(eye.copy(at).setY(0)) > 1.3) return;
      taken.current.add(i);
      goal.current = null;
      onFind(i);
    });
    if (ropeDown && !paused && ROPE.distanceTo(eye.copy(at).setY(0)) < 1.4) onClimb();
  });

  const tap = (e: ThreeEvent<PointerEvent>) => (goal.current = e.point.clone().setY(0));

  return (
    <>
      <hemisphereLight args={["#2a5548", "#000000", 0.9]} />

      <mesh rotation-x={-Math.PI / 2} onPointerDown={tap}>
        <circleGeometry args={[EDGE + 4, 48]} />
        <meshStandardMaterial color="#4a5c4c" roughness={1} />
      </mesh>
      <Debris />

      <group ref={frog} position={START.toArray()}>
        <pointLight ref={lamp} position={[0, 2.4, 0.5]} distance={13} decay={1.5} />
        <Suspense fallback={null}>
          <FrogModel />
        </Suspense>
      </group>

      <instancedMesh ref={serpent} args={[undefined, undefined, SEGMENTS]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshStandardMaterial color="#0c120b" roughness={0.35} metalness={0.4} />
      </instancedMesh>

      {finds.map((f, i) => !found.includes(i) && <Treasure key={i} find={f} />)}

      {ropeDown && (
        <group position={ROPE.toArray()}>
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 20, 6]} />
            <meshBasicMaterial color="#c9a56a" />
          </mesh>
          <pointLight position={[0, 2, 0]} color="#bcd4ff" intensity={30} distance={14} />
        </group>
      )}
    </>
  );
}

// Tigrina, modelled in Blender by tools/models/frog.py.
function FrogModel() {
  const { scene } = useLoader(GLTFLoader, "/models/frog.glb");
  return <primitive object={scene} scale={0.5} />;
}

// A letter is pale and flat; a lost thing is amber and faceted. Both turn slowly and glow.
function Treasure({ find }: { find: Find }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.8;
    ref.current.position.y = 0.9 + Math.sin(clock.elapsedTime * 1.5 + find.at.x) * 0.15;
  });
  const letter = find.kind === "letter";
  return (
    <mesh ref={ref} position={find.at}>
      {letter ? <boxGeometry args={[0.6, 0.42, 0.03]} /> : <icosahedronGeometry args={[0.38, 0]} />}
      <meshStandardMaterial
        color={letter ? "#e9dfc7" : "#f2a541"}
        emissive={letter ? "#8fa3c9" : "#f2a541"}
        emissiveIntensity={letter ? 0.7 : 1.1}
        flatShading
      />
      <pointLight color={letter ? "#9fb6e6" : "#f2a541"} intensity={3} distance={4} />
    </mesh>
  );
}

// Four hundred years of fallen things: pots, bricks, bangles, a bicycle's worth of shapes in the silt.
function Debris() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 140;
  useEffect(() => {
    const thing = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = i * 2.39996; // golden angle: even scatter without a random seed
      const r = 3 + Math.sqrt(i / COUNT) * (EDGE + 2);
      const tall = i % 9 === 0; // every ninth one is a broken pillar
      thing.position.set(Math.cos(a) * r, tall ? 1.5 : 0.15, Math.sin(a) * r);
      thing.rotation.set(tall ? 0 : a, a * 3, tall ? 0.06 : a * 2);
      thing.scale.set(tall ? 0.7 : 0.3 + (i % 5) * 0.12, tall ? 3 + (i % 4) : 0.3 + (i % 3) * 0.15, tall ? 0.7 : 0.3 + (i % 4) * 0.14);
      thing.updateMatrix();
      ref.current.setMatrixAt(i, thing.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry />
      <meshStandardMaterial color="#5b6a58" roughness={1} />
    </instancedMesh>
  );
}
