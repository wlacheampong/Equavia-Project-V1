# Phase 03 — Expand and hold-to-detail primitives

Cross-cutting phase. The PDF asks for expand-on-click and hold-to-detail in
finance, planner, health, and social. Build them **once** here as reusable
primitives, then later phases just apply them.

If you skip this and implement per-screen, you'll end up with four
near-identical implementations that drift apart. Don't.

## 3.1 — `expandPanel` primitive (click to expand left)

**Behaviour:** clicking a section header (e.g. Tasks) expands that section into a
larger panel, with the remaining content pushed/reflowed to the right.

PDF wording: *"clicking a section for example tasks makes it bigger to the left
like this image."*

Reference: `refs/05-expand-left-pattern-and-news-feed-TARGET.png` — the left panel
holds the expanded primary content, the right holds a secondary feed.

API shape (adjust to fit your codebase):

```js
expandPanel({
  source,          // element that was clicked
  content,         // node or render fn for the expanded view
  side: 'left',    // 'left' | 'right'
  onClose,
});
```

Requirements:
- Animates rather than snapping. Keep it short — 180–220ms, ease-out.
- Escape closes. Click outside closes.
- Only one panel expanded at a time; expanding a second collapses the first.
- **Mobile:** there is no "left" on a phone. Below a breakpoint, degrade to a
  full-screen sheet. Specify the breakpoint once, here, and reuse it.
- Respects `prefers-reduced-motion` — skip the animation, keep the state change.

## 3.2 — `holdToDetail` primitive (press and hold a chart)

**Behaviour:** pressing and holding a graph opens a larger, more detailed version
of it with more data visible.

PDF wording: *"holding a graph on finance or planner or health can open it up like
this. Showing a more detailed version"* and *"Everything held down in finance can
be held down to open up bigger more detailed charts where i can see more data."*

References:
- `refs/06-finance-ticker-detail-with-kpi-picker.png` — expanded chart with metric
  selector
- `refs/10-finance-financials-table-holdpress.png` — expanded data table
- `refs/19-finance-graph-selection-multiline.png` — expanded multi-series chart

API shape:

```js
holdToDetail({
  target,          // element to attach to
  threshold: 400,  // ms before it fires
  renderDetail,    // fn returning the expanded view
});
```

Requirements:
- Works with both pointer and touch events. Use Pointer Events if you can — one
  code path instead of two.
- **Cancel on movement.** If the pointer moves more than ~10px before the
  threshold, treat it as a scroll or drag, not a hold. Without this, holding
  breaks scrolling on mobile, which is the most common way to get this wrong.
- Suppress the context menu on long-press (`contextmenu` preventDefault on
  touch targets).
- Give visual feedback during the hold — a subtle scale or progress hint — so it
  doesn't feel unresponsive.
- Provide a **non-hold fallback.** Hold gestures are undiscoverable and
  inaccessible. Every hold target also needs a visible expand affordance (a
  small corner icon) that does the same thing on click. This isn't optional if
  you want the app usable with a keyboard.

## 3.3 — Shared detail-view shell

Both primitives open a larger view. Build one shell they share:

- Near-black backdrop (`--bg-modal`), no heavy blur
- Close `×` top-left (matches the reference — not top-right)
- Content area scrolls if it overflows
- Traps focus while open, returns focus to the trigger on close

Reference: `refs/08-news-summary-modal.png` for the general shell treatment.

## Acceptance

- Both primitives are defined once, in one module, and exported
- A demo/test page exercises both against dummy content
- Hold does not interfere with page scrolling on a touch device
- Every hold target has a click-accessible equivalent
- Escape and outside-click close both
- Reduced-motion preference is respected

## Out of scope

Applying these to real screens. That happens in phases 05, 06, 07. This phase
delivers the primitives and a demo, nothing else.
