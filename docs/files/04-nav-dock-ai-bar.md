# Phase 04 — Nav dock + AI command bar

## 4.1 — Replace the tab nav with a floating dock

**Target:** the current Main · Health · Train · Planner · Finance tab bar becomes
a floating pill-shaped dock, centred at the bottom of the viewport, with icon-only
buttons and a separate circular search button sitting to its right.

References:
- `refs/16-nav-dock-closeup-TARGET.png` — the dock at close range. Note: rounded
  pill container, subtle lighter fill than the page, icons in
  `--text-secondary`, active item gets a filled rounded-square background and
  `--text-primary`.
- `refs/15-nav-dock-and-ai-search-bar.png` — dock in page context with the search
  button detached to the right.

Requirements:
- Fixed position, centred horizontally, floating above content with clearance
  from the bottom edge
- Icon-only. Tooltips on hover for desktop; the icons need to be legible enough
  to work without labels on mobile.
- Active state as described above
- The search button is visually **separate** from the main pill — its own circle
  with a gap
- Must not cover content. Add bottom padding to scroll containers equal to the
  dock height plus clearance.

Keep the five existing destinations. Don't add nav items in this phase.

## 4.2 — Search button becomes the AI command bar

**Target:** pressing the search button opens an expanding text input — the entry
point to Equavia 0. PDF wording: *"Make the bottom search icon the ai text box bar
and let it open up."*

Behaviour:
- Click (or `/` keyboard shortcut) expands the circle into a wide text input
  above the dock
- Autofocus on open
- Escape collapses it
- Submitting sends the prompt to the existing Equavia 0 route

Reference: `refs/15-nav-dock-and-ai-search-bar.png` shows the collapsed state with
a "Search securities `/`" hint chip. Equavia's equivalent hint should describe
what Equavia 0 actually does — not "search securities".

## 4.3 — Changes summary panel

**⚠ Confirm intent before building — see open decision #3 in `00-OVERVIEW.md`.**

Reading assumed here: after Equavia 0 performs actions (logs a weight, adds a
task, completes a habit), it displays a summary panel listing what it changed, so
you can verify before moving on.

If that's right:
- Panel opens after any action-taking response, using the shared detail shell
  from phase 03
- Lists each change as a row: what changed, from → to
- Each row is individually reversible if the underlying operation supports it
- Panel dismisses on Escape or explicit close

If that's *not* the intent, stop and clarify — the alternative readings (a
persistent changelog, an edit-history view) are different features.

Reference for panel proportions: `refs/13-settings-page-with-referral-panel.png`
shows the "bigger box" treatment — a wide overlay panel anchored low, with a
persistent action bar at its foot.

## Acceptance

- Old tab bar is gone; dock renders on every page
- Active destination is visually distinct
- Dock doesn't obscure scrollable content at the bottom of any page
- Search expands to an input, accepts text, submits to Equavia 0
- `/` opens it, Escape closes it
- Dock is usable on a phone-width viewport

## Out of scope

Changing what any nav destination contains. This is chrome only.
