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
//     dashboard opens -- never cached -- and must return a plain
//     string or Node built from read-only markup only: no <input>,
//     <button>, <textarea>, ids that collide with the live page, or
//     data-eq-collapse attributes anywhere in the output.
//
//   window.EqDashboard.init(pageId, { keepVisible })
//     Call once per page, after DOMContentLoaded (so <main> and every
//     section registration already exist). Builds the toggle switch as
//     <main>'s first child, an empty dashboard container as <main>'s
//     last child, and the one CSS rule that hides every other direct
//     child of <main> while the toggle is on.
//
//     keepVisible: array of CSS selectors for elements that must stay
//     visible regardless of toggle state (health.html passes its three
//     photo-overlay divs, #wtOverlay/#wtCam/#wtViewer -- this file has
//     no way to know a page's own overlays, so the page declares them).
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
#${viewElId(pageId)} { display: none; }
body.eq-dashboard-active #${viewElId(pageId)} { display: block; }
body.eq-dashboard-active main > *${excludes} { display: none; }

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

.eq-dash-section {
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid var(--eq-border);
}
.eq-dash-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.eq-dash-section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--eq-text-muted); margin-bottom: 8px;
}
.eq-dash-section-body {
  font-size: 14px; line-height: 1.6; color: var(--eq-text-secondary);
}
`;
    document.head.appendChild(style);
  }

  function renderAll(pageId) {
    const view = document.getElementById(viewElId(pageId));
    if (!view) return;
    view.innerHTML = '';
    (registry[pageId] || []).forEach(({ sectionId, title, renderFn }) => {
      let content;
      try { content = renderFn(); } catch (e) { content = null; }
      if (content == null) return;

      const box = document.createElement('div');
      box.className = 'eq-dash-section';
      box.setAttribute('data-eq-dash-section', sectionId);

      const heading = document.createElement('div');
      heading.className = 'eq-dash-section-title';
      heading.textContent = title;
      box.appendChild(heading);

      const body = document.createElement('div');
      body.className = 'eq-dash-section-body';
      if (typeof content === 'string') body.innerHTML = content;
      else body.appendChild(content);
      box.appendChild(body);

      view.appendChild(box);
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
    main.appendChild(view);
  }

  window.EqDashboard = { register, init, toggle };
})();
