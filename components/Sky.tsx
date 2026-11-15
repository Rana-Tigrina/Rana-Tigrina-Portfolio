"use client";
// The ending. You carry Tigrina up the rope. The monsoon breaks. It sees the sky for the first time,
// and does what bullfrogs do when the rain comes: it sings.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { remember } from "@/lib/state";
import { sound } from "@/lib/sound";

// [seconds from start, what the frog says, what happens]
const BEATS: [number, string, () => void][] = [
  [0, "Up. Slowly. I am heavier than I look.", () => sound.creak()],
  [5, "Oh.", () => sound.bell()],
  [9, "So that is the sky.", () => {}],
  [14, "It is bigger than the questions said.", () => {}],
  [20, "And that is rain. I have answered nine thousand questions about rain.", () => (sound.thunder(), sound.rain(true))],
  [27, "Listen.", () => sound.chorus(14)],
];
const END = 34;

export function Sky({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [ended, setEnded] = useState(false);
  const film = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    remember({ freed: true });
    const timers = [
      ...BEATS.map(([at, , happen], i) => setTimeout(() => (setBeat(i), happen()), at * 1000)),
      setTimeout(() => setEnded(true), END * 1000),
      // The sky film is 8 seconds long. At half speed, from the frog's "Oh.", the clouds part as it
      // looks up and the rain reaches the frame on the line about rain. It then holds its last frame.
      setTimeout(() => {
        film.current!.playbackRate = 0.5;
        film.current!.play().catch(() => {}); // autoplay refused: the still first frame is fine
      }, 6000),
    ];
    return () => {
      timers.forEach(clearTimeout);
      sound.rain(false);
    };
  }, []);

  return (
    <div className={`sky beat-${beat} ${ended ? "ended" : ""}`}>
      <video ref={film} className="sky-film" src="/art/sky.mp4" muted playsInline preload="auto" aria-hidden />
      <div className="rain" aria-hidden />
      <svg className="rim-silhouette" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <path d="M0 200 L0 150 Q200 120 400 124 Q600 120 800 150 L800 200Z" />
        {/* the frog, sitting on the rim, looking up */}
        <path d="M372 126 C366 104 388 88 410 92 C416 80 432 80 434 92 C450 98 458 116 448 128 Z" />
      </svg>

      {ended ? (
        <div className="send" role="dialog" aria-label="Contact">
          <p className="say seen">Drop a question for Munawwar. This time someone above will answer.</p>
          <p>
            <a className="act" href={`mailto:${profile.email}?subject=A question from the well`}>Write to Munawwar</a>
          </p>
          <p>
            <a href={profile.links.resume}>Resume</a>
            <a href={profile.links.github}>GitHub</a>
            <a href={profile.links.linkedin}>LinkedIn</a>
            <Link href="/surface">Plain version</Link>
            <button className="quiet" onClick={onDone}>Go back down</button>
          </p>
        </div>
      ) : (
        <p key={beat} className="say seen sky-line" aria-live="polite">{BEATS[beat][1]}</p>
      )}
      {!ended && <button className="quiet sky-skip" onClick={() => setEnded(true)}>Skip</button>}
    </div>
  );
}
