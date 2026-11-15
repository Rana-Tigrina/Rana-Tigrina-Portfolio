"use client";
// An architecture diagram drawn as a kolam: one dot (pulli) per pipeline stage, and two
// rice-flour lines that braid around the dots without ever lifting. Gates are drawn in vermilion.
import { useSeen } from "./useSeen";

const STEP = 58; // vertical distance between dots
const CX = 44; // x of the dot column
const SWING = 30; // how far the braid swings either side

export function Kolam({ stages }: { stages: string[] }) {
  const ref = useSeen<SVGSVGElement>();
  const height = stages.length * STEP;
  const dotY = (i: number) => STEP / 2 + i * STEP;

  // The two lines cross halfway between dots and bulge to opposite sides around each one.
  const braid = (side: 1 | -1) =>
    stages
      .map((_, i) => `Q ${CX + (i % 2 ? -side : side) * SWING} ${dotY(i)} ${CX} ${dotY(i) + STEP / 2}`)
      .join(" ");

  return (
    <svg ref={ref} className="kolam" viewBox={`0 0 320 ${height}`} role="img" aria-label={`Pipeline: ${stages.join(", then ")}`}>
      <path d={`M ${CX} 0 ${braid(1)}`} pathLength={1} />
      <path d={`M ${CX} 0 ${braid(-1)}`} pathLength={1} />
      {stages.map((stage, i) => {
        const gate = /gate|critic|check|review/i.test(stage);
        return (
          <g key={stage} className={gate ? "gate" : undefined} style={{ transitionDelay: `${i * 0.18}s` }}>
            <circle cx={CX} cy={dotY(i)} r={gate ? 5 : 3.2} />
            <text x={CX + SWING + 18} y={dotY(i) + 4}>{stage}</text>
          </g>
        );
      })}
    </svg>
  );
}
