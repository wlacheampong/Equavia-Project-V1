# Phase 02 — Dashboard tiles

Self-contained UI work on data that already exists. Good phase to build momentum.

## 2.1 — Hide add-inputs behind a `+` affordance

**Current:** the Tasks and Goals tiles show a permanent "Add a task…" / "Add a
goal…" input row, plus a date picker on Goals. See
`refs/01-dashboard-tasks-goals-tiles-CURRENT.png`.

**Target:** those inputs are hidden by default. A neutral `+` button sits in the
top-right corner of each tile. Pressing it reveals the input row; the input
autofocuses. Dismissing (Escape, blur with empty value, or pressing `+` again)
hides it.

Details:
- The `+` is **neutral**, not accent-coloured — `--text-secondary` on transparent,
  not the orange. The current orange `+` buttons go away.
- Applies to both Tasks and Goals. The Goals date picker is part of the revealed
  row, not permanently visible.
- Empty state text ("No tasks yet — add one on Planner") stays.

Target look: `refs/04-dashboard-3col-tasks-goals-calendar-TARGET.png` — note the
small neutral `+` top-right of each tile and no visible input.

## 2.2 — Keep the greeting tile unchanged

`refs/02-dashboard-greeting-tile-KEEP.png`. Greeting, name badge, quote line,
sparkline. **Do not restyle beyond phase 01 token substitution.** It's already
right.

## 2.3 — Keep the clock tile unchanged

`refs/03-dashboard-clock-tile-KEEP.png`. Date, day, large countdown, ring
progress indicator. Same instruction — tokens only, no layout change.

## 2.4 — Calendar tile: fixed footprint, scrollable, pop out

**Target:** the calendar tile occupies the same grid footprint as the clock tile
(2.3) — it must not grow to fit its contents. Within that fixed height:

- Vertical scroll through the day's hours. Overflow scrolls, doesn't expand.
- Current hour scrolled into view on load.
- Clicking the tile "pops out" — opens an expanded overlay with more of the day
  visible.
- Day / Week / Month segmented control in the tile header.

See `refs/04-dashboard-3col-tasks-goals-calendar-TARGET.png` (right column) for
the in-tile treatment: hour gutter on the left, events as filled blocks.

The pop-out should use the shared expand primitive from phase 03 if you're doing
these in order. If building this first, keep the pop-out simple and refactor to
the primitive later — note it as a TODO.

## 2.5 — Goals tile progress bars

`refs/04-dashboard-3col-tasks-goals-calendar-TARGET.png` centre column: each goal
shows a label, a percentage right-aligned, and a horizontal progress bar beneath.
Bar fill uses `--text-primary`, track uses `--border-hairline`. Not the accent
colour.

## 2.6 — Book tracker states

Add a three-state status to book tracker entries: **not started**, **reading**,
**started**.

Note: "started" and "reading" overlap semantically. The PDF lists all three, so
implement all three, but consider whether "started" is meant to be "finished" —
worth a quick check before building, since a three-state tracker where two states
mean the same thing will be annoying to use.

Status renders as a small text label per row, coloured:
- not started → `--text-tertiary`
- reading → `--accent-primary`
- started → `--positive`

## Acceptance

- Task and goal inputs are not visible until `+` is pressed
- The `+` buttons are neutral-coloured
- Greeting and clock tiles are visually unchanged from the KEEP references
- Calendar tile height is fixed and independent of event count; content scrolls
- Calendar tile opens an expanded view on click
- Book entries can be set to any of the three states and the state persists

## Out of scope

Don't touch finance, social, or nav in this phase.
