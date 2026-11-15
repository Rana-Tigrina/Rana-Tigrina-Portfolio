"use client";
// The root of the experience. Owns the few pieces of real state (lit, gentle, which scene)
// and wires scroll and pointer into the shared `well` object that the 3D scene reads.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Glitch, Noise, Vignette } from "@react-three/postprocessing";
import { GlitchMode, type GlitchEffect } from "postprocessing";
import { Vector2 } from "three";
import type { Content } from "@/lib/types";
import { well, recall, remember, DEPTH_M } from "@/lib/state";
import { sound } from "@/lib/sound";
import { Shaft } from "./scene/Shaft";
import { Chapters } from "./Chapters";
import { Puppet } from "./Puppet";
import { Scare } from "./Scare";
import { Oracle } from "./Oracle";
import { Hall } from "./hall/Hall";
import { Sky } from "./Sky";

type Scene = "descent" | "scare" | "hall" | "sky";

// Film stock: grain, soft halation, a little lens fringing. Tearing only when something is wrong.
function Film({ gentle }: { gentle: boolean }) {
  const glitch = useRef<GlitchEffect>(null);
  useFrame(() => {
    if (glitch.current) glitch.current.mode = well.dread > 0.45 && !gentle ? GlitchMode.SPORADIC : GlitchMode.DISABLED;
  });
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.7} intensity={0.7} mipmapBlur />
      <ChromaticAberration offset={new Vector2(0.0009, 0.0009)} />
      <Glitch ref={glitch} delay={new Vector2(0.3, 1.2)} duration={new Vector2(0.1, 0.3)} strength={new Vector2(0.1, 0.4)} />
      <Noise premultiply opacity={0.55} />
      <Vignette offset={0.25} darkness={0.85} />
    </EffectComposer>
  );
}

export function Well({ content }: { content: Content }) {
  const [lit, setLit] = useState(false);
  const [gentle, setGentle] = useState(false);
  const [muted, setMuted] = useState(false);
  const [music, setMusic] = useState(false);
  const [lite, setLite] = useState(false);
  const [scared, setScared] = useState(false);
  const [scene, setScene] = useState<Scene>("descent");
  const [asking, setAsking] = useState(false);
  const meter = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    setLite(matchMedia("(max-width: 760px), (pointer: coarse)").matches);
    setGentle(matchMedia("(prefers-reduced-motion: reduce)").matches);
    // For working on one scene at a time: /?scene=hall or /?scene=sky jumps straight to it.
    const jump = new URLSearchParams(location.search).get("scene");
    if (jump === "hall" || jump === "sky" || jump === "scare") setScene(jump);
    const memory = recall();
    setScared(memory.scared); // the serpent only bothers with you once
    remember({ visits: memory.visits + 1 });

    let deepest = memory.deepest;
    const onScroll = () => {
      // The bucket reaches the water where the last chapter ("after") begins.
      const bottom = document.getElementById("after")!.offsetTop - innerHeight * 0.4;
      well.depth = Math.min(1, Math.max(0, scrollY / bottom)) || 0; // 0 while only the rim exists
      sound.setDepth(well.depth);
      meter.current!.value = `${Math.round(well.depth * DEPTH_M)} m down`;
      if (well.depth > deepest + 0.02) remember({ deepest: (deepest = well.depth) });
    };
    const onPointer = (e: PointerEvent) => {
      well.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      well.pointer.y = (e.clientY / innerHeight) * 2 - 1;
      document.documentElement.style.setProperty("--lx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--ly", `${e.clientY}px`);
    };
    // The tab waits for you.
    const title = document.title;
    const onHide = () => (document.title = document.hidden ? "the well is still here" : title);

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onPointer);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  // No scrolling behind the other scenes. (Before the lamp is lit there is nothing below the rim: see CSS.)
  useEffect(() => {
    document.body.style.overflow = scene === "descent" ? "" : "hidden";
  }, [scene]);

  const light = () => {
    sound.start();
    sound.bell();
    well.lamp = 1;
    new Image().src = "/art/serpent.webp"; // fetched now, so the scare is never a black screen on a slow connection
    setLit(true);
  };
  const toggleMute = () => {
    sound.mute(!muted);
    setMuted(!muted);
  };
  const toggleMusic = () => {
    sound.music(!music);
    setMusic(!music);
  };
  const look = useCallback(() => setScene("scare"), []);
  const afterScare = () => {
    remember({ scared: true });
    setScared(true);
    setScene("descent");
  };

  return (
    <div className={`well ${gentle ? "gentle" : ""} ${lit ? "lit" : ""}`}>
      <div className="stage" aria-hidden>
        <Canvas dpr={[1, lite ? 1.25 : 1.75]} camera={{ fov: 62, near: 0.1, far: 90 }} gl={{ antialias: false }}>
          <color attach="background" args={["#020303"]} />
          <Shaft gentle={gentle} lite={lite} />
          {!lite && <Film gentle={gentle} />}
        </Canvas>
      </div>
      <div className="grain" aria-hidden />
      <div className="lamplight" aria-hidden />
      <Puppet />

      <header className="hud">
        <output ref={meter}>0 m down</output>
        <nav>
          {lit && <button onClick={() => setAsking(true)}>Ask the well</button>}
          {lit && <button onClick={toggleMute} aria-pressed={muted}>Sound: {muted ? "off" : "on"}</button>}
          {lit && <button onClick={toggleMusic} aria-pressed={music}>Music: {music ? "on" : "off"}</button>}
          <Link href="/surface">Climb out ↑</Link>
        </nav>
      </header>

      <Chapters
        content={content}
        lit={lit}
        scared={scared}
        gentle={gentle}
        onLight={light}
        onGentle={() => setGentle(!gentle)}
        onLook={look}
        onDive={() => setScene("hall")}
        onAsk={() => setAsking(true)}
      />

      {asking && <Oracle onClose={() => setAsking(false)} />}
      {scene === "scare" && <Scare onDone={afterScare} />}
      {scene === "hall" && <Hall content={content} lite={lite} onLeave={(climbed) => setScene(climbed ? "sky" : "descent")} />}
      {scene === "sky" && <Sky profile={content.profile} onDone={() => setScene("descent")} />}
    </div>
  );
}
