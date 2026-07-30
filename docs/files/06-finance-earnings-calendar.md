# Phase 06 — Finance earnings / income calendar

Depends on: phase 01, phase 05 (shares the Finance section structure).

**Confirm open decision #5 in `00-OVERVIEW.md` first** — whether this is purely
personal income events, or also company earnings dates.

## What's being repurposed

PDF: *"New Earning category calendar hooked to finance where i can put planned pay
days and when i get money coming in."*

The references are a *market* earnings calendar — when public companies report.
The visual layout is what's wanted; the data model is entirely different. Equavia's
version tracks **your** money arriving, not corporate reporting dates.

Don't copy the reference's data fields (EPS, revenue, beat/miss). Copy its layout
and view-switching.

## 6.1 — Month view

Reference: `refs/11-earnings-calendar-month-view.png`

- Weekday-column grid, Monday-first
- Each day cell lists income events: source label + amount, right-aligned
- Overflow per day shows an "N more" row rather than growing the cell
- Today's cell is visually distinct (lighter fill, explicit "Today, <date>" label)
- Past days de-emphasised via `--text-tertiary`
- Cell height fixed — the grid must not reflow as events are added

Amount colouring: incoming money uses `--positive`. If you also track outgoing
(scheduled bills), use `--negative`. Confirm whether outgoing belongs here or
stays in Expenses.

## 6.2 — Day / Week / Month toggle

Reference: `refs/12-earnings-calendar-day-view.png` for the day view.

Day view is a two-column split: the day's events on the left, a small month
mini-calendar plus detail for the selected event on the right.

Segmented control top-right, matching the one in phase 02's calendar tile — same
component, not a second implementation.

## 6.3 — Event model

Minimum fields per income event:
- Source / label (e.g. "Placement bursary", "Shift pay")
- Amount
- Date
- Recurrence — none, weekly, fortnightly, monthly, or a custom interval
- Confirmed vs expected

Recurrence matters here: pay days are the archetypal recurring event, and entering
each one manually defeats the purpose. Expected-vs-confirmed lets you distinguish
"payday is the 28th" from "the money actually landed".

Render expected events with `--highlight-est` (the same pale yellow the reference
uses for estimates) and confirmed ones in `--text-primary`. That mapping is
already in the token set and this is exactly what it's for.

## 6.4 — Hook into Finance

- Reachable from the Finance section dropdown built in 5.3
- Monthly income total feeds whatever net-worth or cash-flow view exists
- Upcoming income appears on the main dashboard if there's a natural slot for it —
  optional, only if it fits without crowding

## Acceptance

- Month grid renders income events with fixed cell heights and "N more" overflow
- Day / Week / Month switching works, reusing the phase 02 segmented control
- Recurring events generate future occurrences without manual re-entry
- Expected vs confirmed events are visually distinguishable
- Today is clearly marked
- Reachable from Finance
- Usable at phone width — the month grid needs a mobile strategy; a 5-column grid
  at 375px is not readable, so consider defaulting mobile to week or day view

## Out of scope

Company earnings data, EPS, beat/miss indicators — unless decision #5 says
otherwise.
