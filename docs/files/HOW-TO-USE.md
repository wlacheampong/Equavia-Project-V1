# How to use this with Claude Code

## Setup (once)

1. Copy `CLAUDE.md` to your Equavia repo root.
2. Copy `docs/` into the repo (gives you `docs/design-tokens.md` and
   `docs/changes/`).
3. Commit. Now Claude Code auto-loads `CLAUDE.md` every session and can read the
   phase specs and reference images by path.

```
your-equavia-repo/
├── CLAUDE.md
├── docs/
│   ├── design-tokens.md
│   └── changes/
│       ├── 00-OVERVIEW.md
│       ├── 01-design-tokens.md … 08-settings-landing.md
│       └── refs/            ← 24 reference images
└── … your existing code
```

## Per session

Open Claude Code in the repo and give it one phase:

```
Read docs/changes/01-design-tokens.md and implement it.
Reference images are in docs/changes/refs/.
Stop when the acceptance criteria are met — don't start phase 02.
```

Then review the diff, commit, and start a **fresh session** for the next phase.

## Why one phase per session

Three reasons, in order of how much pain they save:

1. **Context.** The whole PDF at once is ~20 requests spanning colour tokens to
   live market data. Claude Code will do all of them shallowly rather than any of
   them well.
2. **Reviewable diffs.** One phase is a diff you can actually read. Eight phases
   is a diff you rubber-stamp, which is how bugs ship.
3. **Rollback.** If phase 05 goes wrong, you revert one commit, not a week.

## Reference images

Claude Code reads images if you point at the path. Ask it to look at specific
files rather than describing them:

```
Look at docs/changes/refs/16-nav-dock-closeup-TARGET.png and match that dock
treatment.
```

Filename suffixes: `-TARGET` = build toward this, `-KEEP` = don't change,
`-CURRENT` = existing state being replaced.

## Before you start: three decisions

Phases 05, 06, 07 are blocked on questions the PDF doesn't answer. They're listed
in `00-OVERVIEW.md` under "Open decisions". The important one is **where stock
and news data comes from** — it determines the schema and about half the finance
screens, and several requested features (analyst estimates, EPS beat/miss,
multiples tables) aren't buildable on free API tiers at all.

Answer those before starting 05. Guessing and rebuilding is the single biggest
time sink available here.

## Suggested order

**Phases 01 → 04 and 08** are self-contained UI work on data you already have.
Five sessions, visible progress, no external dependencies.

**Phases 05 → 07** need a data source and are larger than everything else
combined. Treat them as a separate project after the redesign lands.

If you want the app to *look* finished quickly, do 01, 02, 04, 08 and stop.
