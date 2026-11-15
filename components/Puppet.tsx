"use client";
// Tigrina, seen only as a leather shadow puppet on a lamplit cloth (tholu bommalata:
// cut hide, punched with holes so the light comes through). The picture is /public/art/puppet.webp.
// Where it stands is set per chapter in CSS, via data-chapter on <body>.
import { useEffect, useRef } from "react";
import { on } from "@/lib/state";

export function Puppet() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      on("speak", () => {
        const el = ref.current!;
        el.classList.remove("speaking");
        void el.offsetWidth; // restart the CSS animation
        el.classList.add("speaking");
      }),
    [],
  );
  return (
    <div className="puppet" ref={ref} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/puppet.webp" alt="" />
    </div>
  );
}
