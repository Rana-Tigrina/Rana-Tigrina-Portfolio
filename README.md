# Kuan — the well that answers

An interactive folk tale that is also a portfolio. You ride a bucket down a haunted well; an old
bullfrog tells you about the engineer who taught it to answer honestly. Story bible: [docs/STORY.md](docs/STORY.md).

```bash
npm install
npm run dev
```

- `/` is the experience. `/surface` is the plain version for anyone in a hurry.
- `/?scene=hall`, `/?scene=sky`, `/?scene=scare` jump straight to one scene while you work on it.
- "Ask the well" needs `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`). Everything else works without it.

## Adding to it

All content is markdown in `content/`. Nothing else needs to change.

| To add | Do this | It shows up |
|---|---|---|
| A project | New file in `content/projects/` (copy an existing one) | A chapter panel with its kolam diagram, an object to find in the Drowned Hall, the plain page, and the frog can answer questions about it |
| A life update | New file in `content/letters/`, named by date | A letter to find in the Drowned Hall, the Updates list on the plain page, and the frog's knowledge |
| A job | New file in `content/roles/` | The "one who came down" chapter and the plain page |
| A paper | New file in `content/papers/` | The Drowned Library and the plain page |
| Profile, skills, links | Edit `content/profile.md` | Everywhere |

Files are ordered by name, so prefix them (`05-…`, or a date). The fields are typed in `lib/types.ts`.

## Where things live

| Path | What |
|---|---|
| `components/Well.tsx` | The root: state, scroll and pointer wiring, HUD |
| `components/Chapters.tsx` | The descent, top to bottom. Add or reorder chapters here |
| `components/scene/` | The 3D well and its shaders |
| `components/hall/Hall.tsx` | The mini-game under the water |
| `components/Scare.tsx`, `Sky.tsx`, `Oracle.tsx` | The jump scare, the ending, the frog chat |
| `lib/state.ts` | The one shared object the scene, sound and chapters read; visitor memory |
| `lib/sound.ts` | Every sound, synthesized (no audio files) |
| `lib/watcher.ts` | Opt-in camera: blinks and lowered eyes, all on-device |
| `app/api/frog/route.ts` | The oracle, grounded in `content/` |
| `tools/` | Blender model scripts: `python tools/blender.py tools/models/frog.py` |

## Art and sound

- `public/art/` was generated with Google Flow (images: Nano Banana 2.1, sky film: Omni 1.2 Flash). The prompts are in [docs/ART.md](docs/ART.md) so a picture can be regenerated or matched.
- `public/audio/` holds CC0 recordings; sources are in `public/audio/CREDITS.md`. `lib/sound.ts` lists which sounds use a recording (`ONE_SHOTS`, `BEDS`); anything not listed is synthesized.
- A project can have a photo: add `image: /art/<file>.webp` to its frontmatter.
