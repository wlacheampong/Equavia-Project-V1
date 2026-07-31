# Equavia — project context

Read this before any task. It's the standing context for the project.

## What Equavia is

Single-user personal life-management PWA. Health, training, finance, planning,
social. Not a product for other people — no auth flows, no multi-tenancy, no
onboarding. One user, one dataset.

## Stack

- Plain HTML / CSS / JS. **No framework.** No React, no Vue, no build step.
- Deployed on Vercel
- Supabase backend, `localStorage` as the primary store with Supabase for
  cross-device sync
- Obsidian vault integration via Local REST API
- Nav: tabs — Main · Health · Train · Planner · Finance
- AI Assistant (formerly "Equavia 0") routed through the Anthropic API

## Conventions

- Keep it vanilla. If a task seems to want a framework, it doesn't — do it with
  plain JS.
- Prefer editing existing files over creating new ones.
- One feature per commit. Don't refactor unrelated code while implementing a
  change.
- All colours come from the CSS custom properties in `css/equavia-core.css`
  (values sourced from `docs/files/design-tokens.md`). Never hardcode a hex
  value in a component — the shared file is the single `:root` block; every
  page's own local `:root` only aliases those tokens under page-local names,
  it doesn't redefine values.
- Mobile matters — this gets used on a phone. Don't build desktop-only layouts.

## How the change specs are organised

**Note:** the paths below match how `HOW-TO-USE.md` describes setting this up,
but in this repo the files actually landed at `docs/files/` (not
`docs/changes/`) and the reference screenshots are in `docs/Fey Reference/`
(not `docs/changes/refs/`, and not the specific `-TARGET`/`-KEEP`/`-CURRENT`
filenames the phase docs reference — that curated 24-image set was never
copied in, only a larger set of 43 generic Fey screenshots). Use the real
paths, not the ones written into the phase docs themselves.

`docs/files/` holds the redesign work, split into phases:

| File | Scope |
|---|---|
| `00-OVERVIEW.md` | Phase map, dependencies, open decisions |
| `01-design-tokens.md` | Neutral restyle foundation — **do this first** |
| `02-dashboard-tiles.md` | Main dashboard tile changes |
| `03-expand-interactions.md` | Shared expand/hold-to-detail primitives |
| `04-nav-dock-ai-bar.md` | Floating nav dock + AI command bar |
| `05-finance-core.md` | Stocks, charts, view toggles |
| `06-finance-earnings-calendar.md` | Pay-day / income calendar |
| `07-social-news.md` | News feed |
| `08-settings-landing.md` | Settings page, landing page |

**Status: Phase 01 done** (see git history) — full token replacement across
every page, `css/equavia-core.css`'s `:root` updated to the measured Fey
values, box-shadow elevation removed from cards, corner radius standardised.
Phases 02-08 not started.

Do **one phase per session.** Don't start a later phase while an earlier one is
incomplete — later phases depend on primitives built in earlier ones.

`docs/Fey Reference/` holds generic (not curated/renamed) Fey screenshots for
visual reference. There's no `-TARGET`/`-KEEP`/`-CURRENT` naming convention in
this repo's actual image set — that's aspirational text from `HOW-TO-USE.md`,
not something to expect to find.

## Design direction

Reference is Fey (fey.com, acquired by Wealthsimple). Near-black canvas, flat
cards separated by hairline dividers rather than elevation, generous spacing,
restrained accent use. Read `docs/files/design-tokens.md` for the measured
values.

Important: the references are a **financial research tool**. Borrow the visual
language and interaction patterns, not the information density. Equavia has far
less data per screen — don't cram.
