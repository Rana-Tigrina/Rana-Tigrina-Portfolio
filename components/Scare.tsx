"use client";
// The one jump scare. It only runs if the visitor broke the rule, and only once ever.
// Silence, the lamp dies, a second of nothing, then Priyadarshan. Then the frog pulls you out.
import { useEffect, useState } from "react";
import { well } from "@/lib/state";
import { sound } from "@/lib/sound";

type Beat = "dark" | "eyes" | "pulled" | "told";

export function Scare({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState<Beat>("dark");

  useEffect(() => {
    well.lamp = 0;
    sound.hush(1.7);
    const timers = [
      setTimeout(() => {
        setBeat("eyes");
        sound.sting();
        sound.hiss(0.7, 0.5);
      }, 1700),
      setTimeout(() => {
        setBeat("pulled");
        sound.thwip();
      }, 2350),
      setTimeout(() => setBeat("told"), 3000),
      setTimeout(() => {
        well.lamp = 1;
        well.dread = 0;
        onDone();
      }, 6200),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`scare ${beat}`} role="alert" aria-label="Something in the water looked back.">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/serpent.webp" alt="" />
      <p>I told you not to look.</p>
    </div>
  );
}
