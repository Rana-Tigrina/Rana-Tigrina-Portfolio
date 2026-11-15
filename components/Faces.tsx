"use client";
// The Wall of Questions: carved stone faces of everyone who ever asked the well something.
// A glint in each drilled eye socket follows the lamp. The faces only change when you are
// not looking: on a blink if the camera is on, otherwise when the lamp moves away.
// Each face is two carvings (/public/art/face-N-calm.webp and face-N-open.webp).
import { useEffect, useRef, useState } from "react";
import { on } from "@/lib/state";

// Where the two eye sockets are in each picture, as [left %, top %].
const FACES: { calm: [number, number][]; open: [number, number][] }[] = [
  { calm: [[37, 40], [63, 40]], open: [[39, 40], [62, 40]] },
  { calm: [[36.5, 41], [64, 41]], open: [[39, 39], [60.5, 39]] },
  { calm: [[37, 42.5], [63, 42.5]], open: [[39.5, 38.5], [61, 38.5]] },
  { calm: [[38, 40.5], [62.5, 40.5]], open: [[39, 38], [62, 38]] },
];

export function Faces() {
  const wall = useRef<HTMLDivElement>(null);
  const [calling, setCalling] = useState<boolean[]>(() => FACES.map(() => false));

  useEffect(() => {
    // Not all at once: each face has a one-in-three chance of having changed.
    const change = () => setCalling((faces) => faces.map((open) => (Math.random() < 0.34 ? !open : open)));

    const follow = (e: PointerEvent) => {
      for (const face of wall.current!.children as HTMLCollectionOf<HTMLElement>) {
        const box = face.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height * 0.4);
        const far = Math.hypot(dx, dy) || 1;
        // The glint moves at most about a third of a socket, so it never leaves the hole.
        face.style.setProperty("--px", `${(dx / far) * box.width * 0.012}px`);
        face.style.setProperty("--py", `${(dy / far) * box.width * 0.009}px`);
      }
    };
    const el = wall.current!;
    window.addEventListener("pointermove", follow);
    el.addEventListener("pointerleave", change);
    const off = on("blink", change);
    return () => {
      window.removeEventListener("pointermove", follow);
      el.removeEventListener("pointerleave", change);
      off();
    };
  }, []);

  return (
    <div className="faces" ref={wall} aria-hidden>
      {FACES.map((face, i) => (
        <div key={i} className={calling[i] ? "face calling" : "face"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/art/face-${i + 1}-calm.webp`} alt="" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="other" src={`/art/face-${i + 1}-open.webp`} alt="" loading="lazy" />
          {(calling[i] ? face.open : face.calm).map(([left, top]) => (
            <i key={left} style={{ left: `${left}%`, top: `${top}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
