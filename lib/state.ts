// One mutable object that the 3D scene, the sound and the chapters all read every frame.
// Plain fields, no React state, so nothing re-renders at 60fps.
export const well = {
  chapter: "rim", // id of the chapter on screen
  depth: 0, // 0 at the rim, 1 at the water (scroll progress)
  pointer: { x: 0, y: 0 }, // -1..1, the lamp
  lamp: 0, // 1 lit, 0 out. Dark until the visitor lights it
  dread: 0, // 0..1, how close the serpent is
  gazeDown: 0, // 0..1 from the camera watcher, 0 when the camera is off
};

export const DEPTH_M = 66; // metres from rim to water, used for the depth meter and the scene

// What the well remembers about a visitor between visits. Stays in their browser.
export type Memory = { visits: number; deepest: number; scared: boolean; freed: boolean; asked: number };
const KEY = "kuan";
const blank: Memory = { visits: 0, deepest: 0, scared: false, freed: false, asked: 0 };

export function recall(): Memory {
  try {
    return { ...blank, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return blank; // private mode or blocked storage: the well just has no memory
  }
}

export function remember(patch: Partial<Memory>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...recall(), ...patch }));
  } catch {}
}

// Small event bus for things that happen once: a blink, the scare, a chapter change.
export const emit = (name: string) => window.dispatchEvent(new Event(`well:${name}`));
export const on = (name: string, fn: () => void) => {
  window.addEventListener(`well:${name}`, fn);
  return () => window.removeEventListener(`well:${name}`, fn);
};
