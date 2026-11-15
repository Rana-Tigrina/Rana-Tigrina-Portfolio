// The shape of everything in /content. Add a field here and in the markdown frontmatter.

type Entry<T> = T & { slug: string; body: string };

export type Profile = Entry<{
  name: string;
  title: string;
  tagline: string;
  location: string;
  status: string;
  email: string;
  links: { github: string; linkedin: string; resume: string };
  metrics: { value: string; label: string; source: string }[];
  education: { school: string; degree: string; when: string; note: string }[];
  skills: { group: string; items: string[] }[];
}>;

export type Role = Entry<{
  company: string;
  role: string;
  period: string;
  place: string;
  chapter: string;
  stack: string[];
  points: string[];
}>;

export type Project = Entry<{
  title: string;
  kind: string;
  object: string; // the thing that fell into the well
  image?: string; // optional photo of that thing, a path under /public
  metric: string;
  metricLabel: string;
  stack: string[];
  summary: string;
  graph: string[]; // pipeline stages in order, drawn as a kolam
  invariants: string[];
  link: string;
}>;

export type Paper = Entry<{ title: string; venue: string; status: string; year: string; tags: string[] }>;

export type Letter = Entry<{ title: string; date: string }>;

export type Content = {
  profile: Profile;
  roles: Role[];
  projects: Project[];
  papers: Paper[];
  letters: Letter[];
};
