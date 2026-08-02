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
- Any change to a file listed in `sw.js`'s `APP_SHELL` requires bumping
  `CACHE_NAME` in that same commit. `sw.js` serves the app shell cache-first
  with no revalidation against a stale precache manifest (even after moving
  to stale-while-revalidate — that still serves the stale cached copy for the
  *current* load, only refreshing it in the background for next time), so a
  forgotten bump means clients keep serving old code indefinitely, silently.
  This already caused one real incident — see the CACHE_NAME history around
  2026-08-02 for the planner.html/js/sync.js version-skew case.

## Testing

Test runs must **never** connect to the live Supabase backend. Block network
calls to `*.supabase.co` (and `cdn.jsdelivr.net`, which pulls the Supabase JS
client) at the browser/tool level before loading any page that calls
`initCloudSync` — every page does. If a test genuinely needs remote-shaped
data, use a fixture (a static JSON payload, or one of the real exports in
`docs/exports/`), never a live read, and never a live write. This isn't
optional caution: an unblocked test run against `js/sync.js` once pushed
fabricated task/checklist/goal data straight into the real `app_state` table
in Supabase, overwriting genuine data — see git history around
`docs/exports/app_state-backup-2026-08-02T22-10-02.574Z.json` for the
incident and its recovery. Must not recur.

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

## Training programme integration (master-plan-v2)

Standing facts for work building on `docs/master-plan-v2.md` and
`docs/mcp-shapes.json`:

- Equavia is a single-user PWA.
- Plain HTML / CSS / JS — no framework, no build step.
- Supabase handles sync; Vercel handles hosting.
- New code matches the style of the existing training page.
- No new dependencies.

Note: "phase" here means the training programme's P0–P4 periodisation blocks
(`docs/master-plan-v2.md` §4), unrelated to the Fey redesign phases
(`docs/files/00-08`) described above.

`js/status.js` deliberately breaks from the `window.Eq*` IIFE pattern used by
every other file in `js/` — it uses real ES `export`s instead, so its pure
functions can be unit-tested under Node without a browser. Anything that
loads it must use `<script type="module">`, not a plain `<script src>`.

`gym.html` has its own `eq.training.*` localStorage keys (`programs_v1`,
`activeProgramId_v1`, `reducedDecisions_v1`, `restSeconds_v1`) — these are a
different "programme" entirely (that page's own workout-programme settings),
unrelated to `docs/programme.json`'s phases/sessions/checkpoints. Don't
conflate the two when working in this area.

`js/auth-gate.js` exists but isn't wired into any page in this repo — not
`gym.html`, not `health.html`, not any other dock page — confirmed by
grepping every `.html` file. `js/landing-guard.js`'s own comment describes
auth-gate.js as running first on every gated page; that's aspirational, not
current. Don't assume a lock-screen check is protecting anything without
checking the specific page.

`status.html` reads workouts/health/weight straight from `gym.html`'s and
`health.html`'s own `localStorage` keys on whichever device it's opened on
(see that file's `<script type="module">` for exactly which keys and how
they convert) — not through Supabase. It only ever reflects what that one
browser has logged locally, never what's synced from other devices. Waist
and session-feel both have real sources (`health.html`'s waist input on
`po_coach_weights`, `gym.html`'s `session_feel_log_v1`); arm/chest and
December's live scorecard values are still genuinely unwired — no data
source exists for them at all, not just unsynced.
