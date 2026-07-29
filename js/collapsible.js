// =============================================================
// Shared collapsible sections with persistent state.
//
// Collapse state survives reloads, refreshes and full browser sessions:
// it lives in localStorage under one key holding every section's id, and
// is only ever cleared by the user toggling a section back open.
//
// Markup contract -- declarative, because the pages this serves have
// wildly different structures (Finance's per-card sections, Health's
// title+card pairs, Whoop's giant recovery ring):
//
//   <div data-eq-collapse="unique-id">
//     <div data-eq-collapse-keep data-eq-collapse-trigger>Header</div>
//     <div>...everything here hides when collapsed...</div>
//   </div>
//
//   data-eq-collapse="<id>"     container; <id> must be stable across
//                               reloads since it is the storage key
//   data-eq-collapse-keep       direct child that stays visible while
//                               collapsed (the header, or Whoop's ring)
//   data-eq-collapse-trigger    element that toggles on click; defaults
//                               to the first -keep child
//
// Only DIRECT children of the container are hidden, so nesting a
// collapsible inside another works without extra bookkeeping.
// =============================================================
(function () {
  'use strict';

  const STORE_KEY = 'eq.collapse.v1';

  function readState() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY));
      return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
    } catch (e) { return {}; }
  }
  // Re-read before every write rather than caching: another tab (or the
  // vault sync) may have collapsed a different section since page load,
  // and a cached copy would silently revert it.
  function writeCollapsed(id, collapsed) {
    const state = readState();
    if (collapsed) state[id] = true; else delete state[id];
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  const CSS = `
[data-eq-collapse].eq-collapsed > *:not([data-eq-collapse-keep]) { display: none !important; }
[data-eq-collapse-trigger] { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.eq-collapse-chevron {
  display: inline-block; width: 0.62em; height: 0.62em; flex: none;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: rotate(45deg); transform-origin: center;
  opacity: 0.55; margin-left: 8px; vertical-align: middle;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
[data-eq-collapse-trigger]:hover .eq-collapse-chevron { opacity: 0.95; }
.eq-collapsed > [data-eq-collapse-keep] .eq-collapse-chevron,
.eq-collapsed .eq-collapse-chevron { transform: rotate(-45deg); }
@media (prefers-reduced-motion: reduce) {
  .eq-collapse-chevron { transition: none; }
}
`;

  function injectStyle() {
    if (document.getElementById('eq-collapse-style')) return;
    const style = document.createElement('style');
    style.id = 'eq-collapse-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function apply(container, collapsed) {
    container.classList.toggle('eq-collapsed', collapsed);
    const trigger = container.querySelector('[data-eq-collapse-trigger]');
    if (trigger) trigger.setAttribute('aria-expanded', String(!collapsed));
  }

  function setUp(container) {
    if (container.dataset.eqCollapseReady === '1') return;
    const id = container.getAttribute('data-eq-collapse');
    if (!id) return;
    container.dataset.eqCollapseReady = '1';

    let trigger = container.querySelector('[data-eq-collapse-trigger]');
    if (!trigger) {
      trigger = container.querySelector(':scope > [data-eq-collapse-keep]');
      if (trigger) trigger.setAttribute('data-eq-collapse-trigger', '');
    }

    apply(container, readState()[id] === true);

    if (!trigger) return;
    if (!trigger.hasAttribute('role')) trigger.setAttribute('role', 'button');
    if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');

    function toggle() {
      const next = !container.classList.contains('eq-collapsed');
      apply(container, next);
      writeCollapsed(id, next);
    }
    trigger.addEventListener('click', (e) => {
      // Let real controls inside a header (refresh, add, links) still work.
      if (e.target.closest('button, a, input, select, textarea, label')) return;
      toggle();
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('button, a, input, select, textarea')) return;
      e.preventDefault();
      toggle();
    });
  }

  function scan(root) {
    injectStyle();
    (root || document).querySelectorAll('[data-eq-collapse]').forEach(setUp);
  }

  // Sections rendered after boot (Finance builds several from JS) pick
  // themselves up without each caller having to remember to re-init.
  function watch() {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute && node.hasAttribute('data-eq-collapse')) setUp(node);
          if (node.querySelectorAll) node.querySelectorAll('[data-eq-collapse]').forEach(setUp);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() { scan(); watch(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.EqCollapse = { scan, isCollapsed: (id) => readState()[id] === true };
})();
