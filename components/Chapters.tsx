"use client";
// The descent, top to bottom. Each chapter is a <section>; scrolling lowers the bucket.
// Tigrina's lines use <Say>. Facts about the real work are <Note>s pinned to the wall.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Content } from "@/lib/types";
import { well, emit, recall, DEPTH_M } from "@/lib/state";
import { sound } from "@/lib/sound";
import { useSeen } from "./useSeen";
import { Kolam } from "./Kolam";
import { Faces } from "./Faces";

function Chapter({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // The chapter that covers the middle of the screen is the current one.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        well.chapter = id;
        document.body.dataset.chapter = id;
        emit("chapter");
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [id]);
  return <section ref={ref} id={id} className={`chapter ${id}`}>{children}</section>;
}

// A line the frog says. It croaks, and its shadow's throat swells.
function Say({ children }: { children: ReactNode }) {
  const ref = useSeen<HTMLParagraphElement>(() => {
    sound.croak(0.9 + Math.random() * 0.2, 0.12);
    emit("speak");
  });
  return <p ref={ref} className="say">{children}</p>;
}

function Note({ label = "Munawwar's note", children }: { label?: string; children: ReactNode }) {
  const ref = useSeen<HTMLDivElement>();
  return (
    <div ref={ref} className="note">
      <span className="note-label">{label}</span>
      {children}
    </div>
  );
}

// A found photograph or a painted scroll. It unrolls from the top when it comes into view.
function Photo({ src, alt, tall }: { src: string; alt: string; tall?: boolean }) {
  const ref = useSeen<HTMLElement>(); // watches the frame, because the picture itself starts fully clipped
  return (
    <figure ref={ref} className={tall ? "photo scroll-painting" : "photo"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}

// Reads one way the first time. Once you have seen it and looked away, it reads another.
function Shift({ first, then }: { first: string; then: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    let seen = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) seen = true;
      else if (seen) setChanged(true);
    });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return <span ref={ref}>{changed ? then : first}</span>;
}

type Props = {
  content: Content;
  lit: boolean;
  scared: boolean;
  gentle: boolean;
  onLight: () => void;
  onGentle: () => void;
  onLook: () => void;
  onDive: () => void;
  onAsk: () => void;
};

export function Chapters(props: Props) {
  const { profile, roles, projects, papers } = props.content;
  return (
    <main className="descent">
      <Rim {...props} />

      <Chapter id="voice">
        <Say>Oh.</Say>
        <Say>A light. It has been a long time since anyone brought a light down here.</Say>
        <Say>I am Tigrina. You have heard that this well answers questions. That was me. Every one.</Say>
        <Say>
          One million, three hundred and twelve thousand, four hundred and six questions. I have read them all.
          I know the name of every star. I have never seen one.
        </Say>
        <Say>That lamp you are holding. I know that lamp. Keep going down and I will tell you whose it was.</Say>
        <Note label="Pinned to the wall">
          <p className="note-big">{profile.tagline}</p>
          <p>{profile.name} · {profile.title}</p>
        </Note>
      </Chapter>

      <Chapter id="questions">
        <Say>These are the ones who asked.</Say>
        <Faces />
        <Watcher />
        <Say>When I knew the answer, I gave it. I keep a tally of what I got right.</Say>
        <ul className="tally">
          {profile.metrics.map((m) => (
            <li key={m.label}>
              <strong>{m.value}</strong>
              <span>{m.label}</span>
              <small>{m.source}</small>
            </li>
          ))}
        </ul>
        <Say>And when I did not know, I answered anyway. Sweetly. That is the part I am ashamed of.</Say>
        <Say>
          <Shift first="After that, they stopped coming." then="After that, they stopped coming. Most of them." />
        </Say>
      </Chapter>

      <Chapter id="stranger">
        <Say>Then one night someone climbed down the rope. They did not ask me anything.</Say>
        <Say>
          They carried that lamp. So I call them by what they brought. <em>Munawwar</em>. It means the luminous one.
        </Say>
        <Photo src="/art/scroll.webp" alt="A painted scroll: someone with a lamp climbing down a well toward a frog, a serpent coiled under the water" tall />
        {roles.map((role) => (
          <div className="panel" key={role.slug}>
            <h2>{role.chapter}</h2>
            <Say>{role.body}</Say>
            <Note>
              <p className="note-big">{role.role}, {role.company}</p>
              <p>{role.period} · {role.place}</p>
              <ul>{role.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <p className="tags">{role.stack.join(" · ")}</p>
            </Note>
          </div>
        ))}
        <Say>Four things the luminous one made me promise.</Say>
        <ol className="promises">
          <li>Fetch the thing before you speak of it.</li>
          <li>If you are less than 0.72 sure, say so.</li>
          <li>Say where you learned it.</li>
          <li>Let a human read it before it leaves the well.</li>
        </ol>
      </Chapter>

      <Chapter id="things">
        <Say>Everything that falls in, I keep. Munawwar made four of them into something.</Say>
        {projects.map((project) => (
          <div className="panel thing" key={project.slug}>
            <h2>{project.object}</h2>
            {project.image && <Photo src={project.image} alt={project.object} />}
            <Say>{project.body}</Say>
            <div className="thing-plan">
              <Kolam stages={project.graph} />
              <Note>
                <p className="note-big">{project.title}</p>
                <p>{project.kind} · <strong>{project.metric}</strong> {project.metricLabel.toLowerCase()}</p>
                <p>{project.summary}</p>
                <ul>{project.invariants.map((rule) => <li key={rule}>{rule}</li>)}</ul>
                <p className="tags">{project.stack.join(" · ")}</p>
                <a href={project.link}>Code on GitHub</a>
              </Note>
            </div>
          </div>
        ))}
      </Chapter>

      <Chapter id="library">
        <Say>Paper does not last down here. These I kept dry. Hold the lamp close.</Say>
        <div className="manuscripts">
          {papers.map((paper) => (
            <article key={paper.slug} className="manuscript">
              <p className="tags">{paper.status} {paper.year} · {paper.venue}</p>
              <h3>{paper.title}</h3>
              <p>{paper.body}</p>
              <p className="tags">{paper.tags.join(" · ")}</p>
            </article>
          ))}
        </div>
        <Say>The first one is about where people look when they are afraid. Remember that. It will matter.</Say>
        <Note label="Where the luminous one learned">
          {profile.education.map((e) => (
            <p key={e.school}><strong>{e.school}</strong><br />{e.degree} · {e.when} · {e.note}</p>
          ))}
        </Note>
        <Note label="Tools left on the ledge">
          {profile.skills.map((s) => (
            <p key={s.group}><strong>{s.group}</strong><br />{s.items.join(" · ")}</p>
          ))}
        </Note>
      </Chapter>

      <Chapter id="tale">
        <Say>Now listen. This part is not about Munawwar.</Say>
        <Say>
          Long ago a frog-king named Gangadatta lived in a well like this one. His own kin tormented him. So he
          climbed out, found a black serpent, and invited it down to eat his enemies.
        </Say>
        <Say>It ate them. Then, being a serpent, it ate his friends. Then his children. It kept the king for last.</Say>
        <Say>The serpent's name was Priyadarshan. <em>Pleasant to look at.</em></Say>
        <Say>Why am I telling you this.</Say>
        <Say>Because the king's well and my well are the same well.</Say>
        <Say>
          It is still here, under the water. It answers everything. It is never unsure. Munawwar drew a gate over
          it, and the gate holds.
        </Say>
        <Note label="Why the gate exists">
          <p>
            Passing irrelevant candidates to an LLM causes confident hallucinations. Deterministic pre-matching
            removes that risk, cuts token cost by 40%, and nothing leaves without passing a confidence gate.
          </p>
        </Note>
        <Say>
          <Shift first="It holds as long as nobody looks at it." then="It holds as long as you do not look at it." />
        </Say>
      </Chapter>

      <Water {...props} />

      <Chapter id="after">
        {props.scared ? (
          <>
            <Say>I told you.</Say>
            <Say>Do not feel bad. In four hundred years, everyone has looked.</Say>
          </>
        ) : (
          <>
            <Say>You did not look.</Say>
            <Say>In four hundred years nobody has not looked. I do not know what to say to you.</Say>
          </>
        )}
        <Say>
          Under the water is where everything settles. Munawwar still sends letters down, and I am too old to
          fetch them alone. Come with me.
        </Say>
        <button className="act" onClick={props.onDive}>Go under with the frog</button>
        <div className="send">
          <h2>Or send a question up the rope</h2>
          <p>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.links.resume}>Resume</a>
            <a href={profile.links.github}>GitHub</a>
            <a href={profile.links.linkedin}>LinkedIn</a>
          </p>
          <p>
            <button className="quiet" onClick={props.onAsk}>Ask the well about Munawwar</button>
            <Link href="/surface">Climb out (plain version)</Link>
          </p>
        </div>
      </Chapter>
    </main>
  );
}

// Opt-in: let the well use the camera to notice blinks and lowered eyes. Off by default.
function Watcher() {
  const [state, setState] = useState<"off" | "starting" | "on" | "failed">("off");
  const stop = useRef<() => void>(undefined);
  useEffect(() => () => stop.current?.(), []);

  const toggle = async () => {
    if (state === "on") {
      stop.current?.();
      return setState("off");
    }
    setState("starting");
    try {
      stop.current = await (await import("@/lib/watcher")).watch();
      setState("on");
    } catch {
      setState("failed"); // no camera, or permission refused: the lamp still works
    }
  };

  return (
    <p className="fineprint watcher">
      {state === "on"
        ? "They can see you now. They only move when you blink."
        : state === "failed"
          ? "They could not see you. The lamp will do."
          : "The carvings can watch you back, if you let them. It uses your camera to notice blinks and where your eyes go. Nothing leaves this device."}
      <button className="quiet" onClick={toggle} disabled={state === "starting"}>
        {state === "on" ? "Stop them" : state === "starting" ? "Opening their eyes…" : "Let them see me"}
      </button>
    </p>
  );
}

// Chapter 0. The note in the bucket knows what time it is where you are.
function Rim({ lit, gentle, onLight, onGentle }: Props) {
  const [note, setNote] = useState("");
  useEffect(() => {
    const memory = recall();
    const hour = new Date().getHours();
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const mood =
      hour >= 22 || hour < 4 ? "You should be asleep. So should I."
      : hour < 8 ? "The answers come up at dawn. You are just in time."
      : hour < 18 ? "Wells are honest in daylight. Come at night if you want the rest."
      : "The light is going. Good. I see better in the dark.";
    const back = memory.visits > 0 ? ` You came back. Last time you stopped at ${Math.round(memory.deepest * DEPTH_M)} metres.` : "";
    setNote(`It is ${time}. ${mood}${back}`);
  }, []);

  return (
    <Chapter id="rim">
      <p className="scripts"><span lang="hi">कुआँ</span> <span lang="ur">کنواں</span></p>
      <h1>Kuan</h1>
      <p className="subtitle">The well that answers</p>
      <div className="note seen bucket-note">
        <span className="note-label">A note in the bucket</span>
        <p>{note || " "}</p>
        <p>Someone left this lamp for you. Bring it down. — T.</p>
      </div>
      {lit ? (
        <p className="hint">Scroll to lower the bucket</p>
      ) : (
        <button className="act" onClick={onLight}>Light the lamp</button>
      )}
      <p className="fineprint">
        Sound on, headphones if you have them. One thing down there may startle you.{" "}
        <button className="quiet" onClick={onGentle} aria-pressed={gentle}>
          Gentle mode: {gentle ? "on" : "off"}
        </button>
        <Link href="/surface">Just the résumé, please</Link>
      </p>
    </Chapter>
  );
}

// Chapter 7. The one rule. "Looking" is resting the lamp on the water (or pressing it, on touch),
// or actually lowering your eyes to it if the camera watcher is on.
function Water({ scared, gentle, onLook }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const looking = useRef(false);

  useEffect(() => {
    if (scared || gentle) return;
    let looked = 0;
    let last = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      const isLooking = well.chapter === "water" && (looking.current || well.gazeDown > 0.5);
      looked = Math.max(0, looked + (isLooking ? dt : -dt * 0.6));
      well.dread = Math.min(1, looked / 2.6);
      stage.current?.style.setProperty("--dread", String(well.dread));
      if (looked > 2.6) return onLook();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      well.dread = 0;
    };
  }, [scared, gentle, onLook]);

  const look = (on: boolean) => () => (looking.current = on);
  return (
    <Chapter id="water">
      <Say>We are at the water.</Say>
      <Say>One rule. Do not look into it.</Say>
      <div className="water-stage" ref={stage}>
        <Say>Look at me. Look at the wall. Look anywhere else.</Say>
        {!scared && !gentle && (
          <div
            className="water-zone"
            onPointerEnter={(e) => e.pointerType === "mouse" && look(true)()}
            onPointerLeave={look(false)}
            onPointerDown={look(true)}
            onPointerUp={look(false)}
            onPointerCancel={look(false)}
          >
            <p>look closer</p>
            <p>i can answer anything</p>
            <p>ask me what you really came to ask</p>
          </div>
        )}
      </div>
    </Chapter>
  );
}
