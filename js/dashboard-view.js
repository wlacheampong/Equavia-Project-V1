// =============================================================
// Shared read-only "dashboard view" toggle. One engine, reused by any
// page that wants an at-a-glance, read-only render of its own sections
// -- modeled on collapsible.js's declarative pattern: pages register
// what they have, this file only handles show/hide + the render loop,
// and never hardcodes per-page knowledge (section ids, overlay ids,
// data sources) itself.
//
// Loaded WITHOUT `defer` (unlike collapsible.js) -- every section below
// calls EqDashboard.register(...) from its own inline <script>, which
// runs synchronously during parsing, before any deferred script would
// have executed. This file has to already exist by then.
//
//   window.EqDashboard.register(pageId, sectionId, title, renderFn)
//     Called by a section's own script, right next to where it already
//     has its data in hand (same spot health.html's Whoop section
//     already publishes eq.health.summary for the same cross-surface-
//     reuse reason). renderFn() is called fresh every time the
//     dashboard opens -- never cached -- and must return one of:
//       - a plain string or Node, read-only markup only (no <input>,
//         <button>, <textarea>, ids colliding with the live page, or
//         data-eq-collapse attributes) -- rendered as a plain body.
//         This is the right shape for anything that isn't genuinely a
//         single value: a multi-metric list, a checklist, a sentence
//         mixing a headline number with other context, etc.
//       - a { value, label? } object, for a section whose content
//         really is one value with nothing else -- rendered with
//         .eq-card-value (and .eq-card-label, if given). Don't force a
//         section into this shape just because it CAN return a string;
//         only use it when the content has no other rows/context to
//         lose by doing so (health.html's Progress Photos count is the
//         only current example).
//     Every card gets a .eq-card wrapper + .eq-card-title header
//     (equavia-core.css) regardless of which body shape it returns.
//
//   window.EqDashboard.init(pageId, { keepVisible, gridCols })
//     Call once per page, after DOMContentLoaded (so <main> and every
//     section registration already exist). Builds the toggle switch as
//     <main>'s first child, an empty dashboard container (laid out via
//     the shared .eq-card-grid family, same 640px/980px breakpoints as
//     dashboard.html's own .grid) as <main>'s last child, and the one
//     CSS rule that hides every other direct child of <main> while the
//     toggle is on.
//
//     keepVisible: array of CSS selectors for elements that must stay
//     visible regardless of toggle state (health.html passes its three
//     photo-overlay divs, #wtOverlay/#wtCam/#wtViewer -- this file has
//     no way to know a page's own overlays, so the page declares them).
//
//     gridCols: 2, 3, or 4 -- picks .eq-card-grid-2/3/4. Defaults to 3.
//     Page-agnostic: any page can pass a different count, none is
//     hardcoded here for a specific page's section count.
//
//   window.EqDashboard.toggle(pageId)
//     Flips the in-memory (never persisted) state for that page.
//
// Toggle state is deliberately NOT persisted anywhere -- no
// localStorage key, no sessionStorage -- so it always starts off on a
// fresh load. This matters concretely on health.html: WHOOP's OAuth
// redirect lands back on this exact page mid-flow (#whoop_access=...),
// and the callback handler must never find a stale "dashboard was left
// open" state hiding the card it's about to update. That handler reads
// the URL hash directly and isn't gated on anything here, but a
// non-persisted toggle also means the user always lands back on the
// normal, editable page after that redirect, not a dashboard view some
// earlier session left switched on.
// =============================================================
(function () {
  'use strict';

  const registry = {};   // pageId -> [{ sectionId, title, renderFn }]
  const activeState = {}; // pageId -> boolean, in-memory only
  const initedPages = {}; // pageId -> boolean, guards double-init

  function register(pageId, sectionId, title, renderFn) {
    if (!registry[pageId]) registry[pageId] = [];
    registry[pageId].push({ sectionId, title, renderFn });
  }

  function toggleElId(pageId) { return 'eqDashboardToggle-' + pageId; }
  function viewElId(pageId) { return 'eqDashboardView-' + pageId; }

  function injectStyle(pageId, keepVisible) {
    const styleId = 'eq-dashboard-style-' + pageId;
    if (document.getElementById(styleId)) return;

    // Toggle stays visible in both states (otherwise there'd be no way
    // back once dashboard mode is on); the view container is visible
    // only in dashboard mode; every other direct child of <main> --
    // every section, plus any page-declared overlays -- is excluded
    // from the hide rule by id/selector, everything else direct under
    // <main> gets hidden. New sections need no new exclusion: they're
    // hidden automatically just by being an unlisted direct child.
    const excludes = ['#' + toggleElId(pageId), '#' + viewElId(pageId)]
      .concat(keepVisible || [])
      .map((sel) => ':not(' + sel + ')')
      .join('');

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
#${viewElId(pageId)} {
  display: none;
  /* Every section concatenated into one plain-text list runs taller than
     the normal page ever does at the same scroll depth (each section
     here is just text, none of the normal page's own collapsible/capped
     widgets) -- main/body's own dock-clearance padding isn't enough on
     its own to keep the last section's last row from landing under the
     fixed dock. Same value body.has-eq-dock already uses for exactly
     this (see js/topbar.js), reused here rather than invented. */
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}
/* display: grid, not block -- the view container also carries
   .eq-card-grid (equavia-core.css), and an ID selector's display value
   always wins over a class selector's regardless of source order, so
   this has to match .eq-card-grid's own display mode or the grid layout
   would never actually take effect. gap/columns still come entirely
   from .eq-card-grid/-2/-3/-4 -- only the display keyword is duplicated
   here, out of cascade necessity, not by choice. */
body.eq-dashboard-active #${viewElId(pageId)} { display: grid; }
body.eq-dashboard-active main > *${excludes} { display: none; }
@media (max-width: 480px) {
  #${viewElId(pageId)} { padding-bottom: calc(62px + env(safe-area-inset-bottom)); }
}

.eq-dash-toggle-wrap {
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 22px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.eq-dash-toggle-label {
  font-family: var(--eq-font-mono);
  font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--eq-text-muted);
}
.set-toggle { display: inline-flex; align-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; flex-shrink: 0; }
.set-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.set-toggle-track { position: relative; display: inline-block; width: 34px; height: 19px; border-radius: 999px; background: rgba(var(--eq-text-primary-rgb), 0.12); transition: background 0.2s; }
.set-toggle-thumb { position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: var(--eq-text-primary); transition: transform 0.2s, background 0.2s; }
.set-toggle input:checked ~ .set-toggle-track { background: var(--eq-accent); }
.set-toggle input:checked ~ .set-toggle-track .set-toggle-thumb { transform: translateX(15px); background: var(--eq-bg-primary); }

/* Card box/title/label/value/grid all now live in equavia-core.css's
   .eq-card family (every page here already links that file -- confirmed
   for health.html/finance.html/planner.html). Only what's still genuinely
   per-page-dynamic (interpolates pageId/keepVisible above), or specific
   to the plain-body fallback that .eq-card family has no equivalent for,
   stays injected here. */
.eq-card-plain-body {
  font-size: 14px; line-height: 1.6; color: var(--eq-text-secondary);
}
`;
    document.head.appendChild(style);
  }

  function isValueShape(content) {
    return !!content && typeof content === 'object' && !(content instanceof Node) && typeof content.value === 'string';
  }

  function renderAll(pageId) {
    const view = document.getElementById(viewElId(pageId));
    if (!view) return;
    view.innerHTML = '';
    (registry[pageId] || []).forEach(({ sectionId, title, renderFn }) => {
      let content;
      try { content = renderFn(); } catch (e) { content = null; }
      if (content == null) return;

      const card = document.createElement('div');
      card.className = 'eq-card';
      card.setAttribute('data-eq-dash-section', sectionId);

      const heading = document.createElement('div');
      heading.className = 'eq-card-title';
      heading.textContent = title;
      card.appendChild(heading);

      if (isValueShape(content)) {
        if (content.label) {
          const label = document.createElement('div');
          label.className = 'eq-card-label';
          label.textContent = content.label;
          card.appendChild(label);
        }
        const value = document.createElement('div');
        value.className = 'eq-card-value';
        value.textContent = content.value;
        card.appendChild(value);
      } else {
        const body = document.createElement('div');
        body.className = 'eq-card-plain-body';
        if (typeof content === 'string') body.innerHTML = content;
        else body.appendChild(content);
        card.appendChild(body);
      }

      view.appendChild(card);
    });
  }

  function toggle(pageId) {
    const next = !activeState[pageId];
    activeState[pageId] = next;
    document.body.classList.toggle('eq-dashboard-active', next);
    const input = document.querySelector('#' + toggleElId(pageId) + ' input');
    if (input) input.checked = next;
    if (next) renderAll(pageId);
  }

  function init(pageId, opts) {
    opts = opts || {};
    if (initedPages[pageId]) return;
    const main = document.querySelector('main');
    if (!main) return;
    initedPages[pageId] = true;

    injectStyle(pageId, opts.keepVisible);
    const gridCols = [2, 3, 4].indexOf(opts.gridCols) !== -1 ? opts.gridCols : 3;

    const wrap = document.createElement('label');
    wrap.id = toggleElId(pageId);
    wrap.className = 'eq-dash-toggle-wrap set-toggle';
    const labelText = document.createElement('span');
    labelText.className = 'eq-dash-toggle-label';
    labelText.textContent = 'Dashboard view';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = false;
    input.addEventListener('change', () => toggle(pageId));
    const track = document.createElement('span');
    track.className = 'set-toggle-track';
    track.innerHTML = '<span class="set-toggle-thumb"></span>';
    wrap.appendChild(labelText);
    wrap.appendChild(input);
    wrap.appendChild(track);
    main.insertBefore(wrap, main.firstChild);

    const view = document.createElement('div');
    view.id = viewElId(pageId);
    view.className = 'eq-card-grid eq-card-grid-' + gridCols;
    main.appendChild(view);
  }

  window.EqDashboard = { register, init, toggle };
})();
