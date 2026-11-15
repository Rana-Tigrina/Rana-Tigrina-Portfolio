// The Surface: daylight, above the well. The plain version for anyone in a hurry.
import Link from "next/link";
import { getContent } from "@/lib/content";
import "./surface.css";

export const metadata = { title: "Mohammad Munawwar Malook — AI & GenAI Systems Engineer" };

export default function Surface() {
  const { profile: p, roles, projects, papers, letters } = getContent();
  return (
    <main className="surface">
      <header>
        <p className="s-kicker">{p.status} · {p.location}</p>
        <h1>{p.name}</h1>
        <p className="s-title">{p.title}</p>
        <p className="s-tagline">{p.tagline}</p>
        <p>{p.body}</p>
        <nav>
          <a href={p.links.resume}>Resume</a>
          <a href={`mailto:${p.email}`}>{p.email}</a>
          <a href={p.links.github}>GitHub</a>
          <a href={p.links.linkedin}>LinkedIn</a>
          <Link href="/">Go down the well ↓</Link>
        </nav>
      </header>

      <ul className="s-metrics">
        {p.metrics.map((m) => (
          <li key={m.label}><strong>{m.value}</strong>{m.label}<small>{m.source}</small></li>
        ))}
      </ul>

      <section>
        <h2>Experience</h2>
        {roles.map((r) => (
          <article key={r.slug}>
            <h3>{r.role}, {r.company}</h3>
            <p className="s-meta">{r.period} · {r.place}</p>
            <ul>{r.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
            <p className="s-tags">{r.stack.join(" · ")}</p>
          </article>
        ))}
      </section>

      <section>
        <h2>Systems</h2>
        {projects.map((s) => (
          <article key={s.slug}>
            <h3><a href={s.link}>{s.title}</a></h3>
            <p className="s-meta">{s.kind} · {s.metric} {s.metricLabel.toLowerCase()}</p>
            <p>{s.summary}</p>
            <ul>{s.invariants.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="s-tags">{s.stack.join(" · ")}</p>
          </article>
        ))}
      </section>

      <section>
        <h2>Research</h2>
        {papers.map((r) => (
          <article key={r.slug}>
            <h3>{r.title}</h3>
            <p className="s-meta">{r.status} {r.year} · {r.venue}</p>
            <p>{r.body}</p>
          </article>
        ))}
      </section>

      <section>
        <h2>Skills</h2>
        {p.skills.map((s) => (
          <p key={s.group}><strong>{s.group}:</strong> {s.items.join(", ")}</p>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {p.education.map((e) => (
          <p key={e.school}><strong>{e.school}</strong> — {e.degree}. {e.when}, {e.note}.</p>
        ))}
      </section>

      <section>
        <h2>Updates</h2>
        {[...letters].reverse().map((l) => (
          <article key={l.slug}>
            <h3>{l.title}</h3>
            <p className="s-meta">{l.date}</p>
            <p>{l.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
