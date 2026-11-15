// Every sound in the well is synthesized here with the Web Audio API. There are no audio files.
// To replace a sound with a recording later, change only the function for that sound.

let ctx: AudioContext;
let master: GainNode; // everything goes through here (mute, duck)
let dry: GainNode;
let wet: GainNode; // send into the well's reverb
let drone: { a: OscillatorNode; b: OscillatorNode };
let rainGain: GainNode | undefined;
let depth = 0;
let ready = false;
let muted = false;

const now = () => ctx.currentTime;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function whiteNoise(seconds: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

// A stone shaft has a long, dark echo: decaying noise is a good enough impulse response.
function shaftEcho(seconds: number) {
  const n = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5;
  }
  return buf;
}

// A gain that rises to `peak` in `attack` seconds, then dies away over `decay`, panned in stereo.
function voice(peak: number, attack: number, decay: number, pan = 0) {
  const g = ctx.createGain();
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  g.gain.setValueAtTime(0.0001, now());
  g.gain.exponentialRampToValueAtTime(peak, now() + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now() + attack + decay);
  g.connect(p);
  p.connect(dry);
  p.connect(wet);
  return { in: g, end: now() + attack + decay + 0.05 };
}

function filter(type: BiquadFilterType, freq: number, q = 1) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function osc(type: OscillatorType, freq: number, end: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.start();
  o.stop(end);
  return o;
}

function noiseInto(node: AudioNode, end: number) {
  const n = whiteNoise(Math.max(0.1, end - now()));
  n.connect(node);
  n.start();
}

const sounds = {
  drip() {
    const v = voice(0.2, 0.004, 0.3, rand(-0.7, 0.7));
    const o = osc("sine", rand(900, 1700), v.end);
    o.frequency.exponentialRampToValueAtTime(rand(300, 500), now() + 0.09);
    o.connect(v.in);
  },

  // A bullfrog is a low buzz chopped into pulses, resonating in a big throat.
  croak(pitch = 1, loud = 0.5) {
    const length = rand(0.35, 0.6);
    const v = voice(loud, 0.04, length, rand(-0.3, 0.3));
    const o = osc("sawtooth", 92 * pitch, v.end);
    o.frequency.linearRampToValueAtTime(80 * pitch, now() + length);
    const chop = ctx.createGain();
    const lfo = osc("square", rand(19, 24), v.end);
    lfo.connect(chop.gain);
    o.connect(chop);
    chop.connect(filter("bandpass", 300 * pitch, 2.5)).connect(v.in);
  },

  whisper() {
    const v = voice(0.05, 0.4, 1.1, rand(-1, 1));
    const f = filter("bandpass", rand(1800, 3200), 7);
    f.frequency.linearRampToValueAtTime(rand(1500, 3500), v.end);
    noiseInto(f, v.end);
    f.connect(v.in);
  },

  hiss(seconds = 1.5, loud = 0.1) {
    const v = voice(loud, seconds * 0.6, seconds * 0.4, rand(-0.5, 0.5));
    const f = filter("highpass", 4500);
    noiseInto(f, v.end);
    f.connect(v.in);
  },

  creak() {
    const v = voice(0.05, 0.1, 0.6, rand(-0.2, 0.2));
    const f = filter("bandpass", rand(500, 900), 14);
    f.frequency.linearRampToValueAtTime(rand(500, 900), v.end);
    osc("sawtooth", rand(50, 70), v.end).connect(f);
    f.connect(v.in);
  },

  bell() {
    const base = rand(380, 420);
    [1, 2.76, 5.4, 8.93].forEach((ratio, i) => {
      const v = voice(0.12 / (i + 1), 0.005, 4 - i * 0.7);
      osc("sine", base * ratio, v.end).connect(v.in);
    });
  },

  // The one loud sound on the site: a dissonant cluster, a noise burst and a falling sub.
  sting() {
    const v = voice(0.9, 0.01, 1.4);
    [180, 191, 233, 311, 329, 415].forEach((f) => osc("sawtooth", f, v.end).connect(v.in));
    const sub = osc("sine", 110, v.end);
    sub.frequency.exponentialRampToValueAtTime(28, now() + 1.2);
    sub.connect(v.in);
    noiseInto(v.in, now() + 0.5);
  },

  // The frog's tongue.
  thwip() {
    const v = voice(0.4, 0.005, 0.12);
    const o = osc("sine", 180, v.end);
    o.frequency.exponentialRampToValueAtTime(1400, now() + 0.07);
    o.connect(v.in);
  },

  splash() {
    const v = voice(0.35, 0.01, 0.9);
    const f = filter("lowpass", 1800);
    f.frequency.exponentialRampToValueAtTime(200, v.end);
    noiseInto(f, v.end);
    f.connect(v.in);
  },

  thunder() {
    const v = voice(0.7, 0.3, 4.5, rand(-0.4, 0.4));
    const f = filter("lowpass", 110);
    noiseInto(f, v.end);
    f.connect(v.in);
  },

  // Many frogs at once: what bullfrogs do when the monsoon arrives.
  chorus(seconds = 8) {
    if (bed("chorus", 0.5)) return void setTimeout(() => bed("chorus", 0, 6), seconds * 1000);
    for (let t = 0; t < seconds * 1000; t += rand(120, 420)) {
      setTimeout(() => sounds.croak(rand(0.8, 1.7), rand(0.08, 0.3)), t);
    }
  },
};

// ---------- real recordings (all CC0, see public/audio/CREDITS.md) ----------
// A one-shot plays instead of the synth with the same name. A bed is a long recording that
// loops and fades in and out. Delete a file's name here and the synth takes over again.
const ONE_SHOTS = ["croak", "creak", "splash", "bell", "thunder"];
const BEDS = ["drips", "rain", "chorus", "music"];
const clips: Record<string, AudioBuffer> = {};
const beds: Record<string, GainNode> = {};

async function loadRecordings() {
  for (const name of [...ONE_SHOTS, ...BEDS]) {
    try {
      const file = await fetch(`/audio/${name}.mp3`);
      clips[name] = await ctx.decodeAudioData(await file.arrayBuffer());
    } catch {
      // missing or unreadable: that sound stays synthesized
    }
  }
}

function playClip(name: string, rate = 1, loud = 0.5) {
  if (!clips[name]) return false;
  const src = ctx.createBufferSource();
  src.buffer = clips[name];
  src.playbackRate.value = rate * rand(0.94, 1.06); // never exactly the same twice
  const g = ctx.createGain();
  g.gain.value = loud;
  const p = ctx.createStereoPanner();
  p.pan.value = rand(-0.4, 0.4);
  src.connect(g).connect(p);
  p.connect(dry);
  p.connect(wet);
  src.start();
  return true;
}

// Fade a looping recording to `level` (0 fades it out). Returns false if there is no such recording.
function bed(name: string, level: number, seconds = 3) {
  if (!clips[name]) return false;
  if (!beds[name]) {
    const src = ctx.createBufferSource();
    src.buffer = clips[name];
    src.loop = true;
    beds[name] = ctx.createGain();
    beds[name].gain.value = 0;
    src.connect(beds[name]).connect(dry);
    src.start();
  }
  beds[name].gain.linearRampToValueAtTime(level, now() + seconds);
  return true;
}

function startDrone() {
  const g = ctx.createGain();
  g.gain.value = 0.1;
  const low = filter("lowpass", 160);
  const a = ctx.createOscillator();
  const b = ctx.createOscillator();
  a.type = "sine";
  b.type = "sawtooth";
  a.connect(low);
  b.connect(low);
  const air = filter("lowpass", 320);
  const airGain = ctx.createGain();
  airGain.gain.value = 0.25;
  const n = whiteNoise(4);
  n.loop = true;
  n.connect(air).connect(airGain).connect(low);
  low.connect(g);
  g.connect(dry);
  g.connect(wet);
  a.start();
  b.start();
  n.start();
  drone = { a, b };
}

// The well's own sounds, more often and stranger the deeper you are.
function ambience() {
  if (document.hidden) return;
  const r = Math.random();
  if (r < 0.1 && !clips.drips) sounds.drip();
  else if (r < 0.125) sounds.creak();
  else if (r < 0.14 && depth > 0.05) sounds.croak(rand(0.9, 1.1), 0.15);
  else if (r < 0.17 && depth > 0.5) sounds.whisper();
  else if (r < 0.18 && depth > 0.72) sounds.hiss(rand(1, 2.5), 0.03);
}

// Every sound goes through here: silent before the lamp is lit, a recording if there is one, else the synth.
const synths = sounds as Record<string, (...args: number[]) => void>;
for (const [name, synth] of Object.entries(synths)) {
  synths[name] = (...args) => {
    if (!ready) return;
    if (!ONE_SHOTS.includes(name) || !playClip(name, ...args)) synth(...args);
  };
}

export const sound = {
  ...sounds,

  // Browsers only allow audio after a click, so this is called from "Light the lamp".
  start() {
    if (ready) return;
    ctx = new AudioContext();
    master = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    master.connect(limiter).connect(ctx.destination);
    dry = ctx.createGain();
    wet = ctx.createGain();
    const echo = ctx.createConvolver();
    echo.buffer = shaftEcho(4.5);
    dry.connect(master);
    wet.connect(echo).connect(master);
    startDrone();
    ready = true;
    loadRecordings();
    sound.setDepth(0);
    setInterval(ambience, 450);
  },

  setDepth(p: number) {
    depth = p;
    if (!ready) return;
    const t = now() + 0.3;
    drone.a.frequency.linearRampToValueAtTime(56 - p * 20, t);
    drone.b.frequency.linearRampToValueAtTime(56.6 - p * 19.4, t);
    wet.gain.linearRampToValueAtTime(0.15 + p * 0.75, t);
    bed("drips", 0.1 + p * 0.45); // the dripping gets closer as you go down
  },

  mute(on: boolean) {
    muted = on;
    if (ready) master.gain.linearRampToValueAtTime(on ? 0 : 1, now() + 0.2);
  },

  // Drop to silence for a while. Silence before the scare is what makes it land.
  hush(seconds: number) {
    if (!ready) return;
    master.gain.cancelScheduledValues(now());
    master.gain.linearRampToValueAtTime(0, now() + 0.15);
    master.gain.setValueAtTime(muted ? 0 : 1, now() + seconds);
  },

  // One optional music track under everything. Off until the visitor turns it on.
  music(on: boolean) {
    if (ready) bed("music", on ? 0.3 : 0, 4);
  },

  rain(raining: boolean) {
    if (!ready || bed("rain", raining ? 0.6 : 0)) return;
    if (!rainGain) {
      rainGain = ctx.createGain();
      rainGain.gain.value = 0;
      const n = whiteNoise(4);
      n.loop = true;
      n.connect(filter("bandpass", 2600, 0.4)).connect(rainGain).connect(dry);
      n.start();
    }
    rainGain.gain.linearRampToValueAtTime(raining ? 0.22 : 0, now() + 3);
  },
};
