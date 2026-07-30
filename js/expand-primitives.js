// =============================================================
// Phase 03 (docs/files/03-expand-interactions.md) -- shared expand/
// hold-to-detail primitives. Built once here so finance (05), the
// earnings calendar (06), and social/news (07) apply ONE consistent
// implementation instead of four screens slowly drifting apart.
//
//   window.EqExpand.expandPanel({ source, content, side, onClose })
//     Wires a click on `source` to open `content` in the shared shell,
//     anchored to `side` ('left'|'right', default 'left') on desktop.
//     Below the mobile breakpoint every panel becomes a full-screen
//     sheet instead -- there is no "left" on a phone.
//
//   window.EqExpand.holdToDetail({ target, threshold, renderDetail })
//     Wires a press-and-hold on `target` (Pointer Events, one code
//     path for mouse+touch) to open renderDetail()'s content in the
//     shared shell, centered. Returns { openViaClick } -- callers MUST
//     wire that to their own visible corner-icon element themselves;
//     a hold gesture alone is undiscoverable/inaccessible, so this
//     primitive deliberately does not treat a plain click on `target`
//     itself as equivalent to holding it (that would make an accidental
//     quick tap on a chart open the detail view unexpectedly).
//
// Both funnel through one shared shell (openShell/closeShell below):
// near-black backdrop, close "x" top-left, scrolling content, a focus
// trap, Escape/outside-click to close, only one panel open at a time,
// and prefers-reduced-motion skips the animation but not the state
// change. Demo/test page: demo-expand.html (not wired into nav/sw.js,
// same "exists but not discoverable" pattern as habits.html).
// =============================================================
(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 768; // matches the app's existing tablet breakpoint (equavia-core.css)
  const ANIM_MS = 200; // 180-220ms per spec

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  // ---- shared shell ---------------------------------------------
  let activeShell = null; // { backdrop, panel, triggerEl, keyHandler, onClose }

  function focusablesIn(panel) {
    return Array.prototype.slice.call(
      panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function closeShell() {
    if (!activeShell) return;
    const { backdrop, triggerEl, keyHandler, onClose } = activeShell;
    document.removeEventListener('keydown', keyHandler);
    activeShell = null; // clear first so a closeShell() re-entry (e.g. double Escape) is a no-op
    const finish = () => {
      backdrop.remove();
      if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
      if (typeof onClose === 'function') onClose();
    };
    if (prefersReducedMotion()) { finish(); return; }
    backdrop.classList.remove('eq-shell-open');
    let done = false;
    const onEnd = () => { if (done) return; done = true; finish(); };
    backdrop.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, ANIM_MS + 80); // fallback in case transitionend never fires
  }

  // layout: 'left' | 'right' | 'center' -- collapses to a full-screen
  // sheet under MOBILE_BREAKPOINT regardless of the requested layout.
  function openShell(opts) {
    const contentEl = opts.contentEl, triggerEl = opts.triggerEl, onClose = opts.onClose;
    const layout = isMobile() ? 'sheet' : (opts.layout || 'center');
    if (activeShell) closeShell(); // only one panel expanded at a time

    const backdrop = document.createElement('div');
    backdrop.className = 'eq-shell-backdrop';
    const panel = document.createElement('div');
    panel.className = 'eq-shell-panel eq-shell-' + layout;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'eq-shell-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;'; // top-left, per spec -- deliberately not top-right like Phase 02's calendar modal

    const body = document.createElement('div');
    body.className = 'eq-shell-body';
    body.appendChild(contentEl);

    panel.appendChild(closeBtn);
    panel.appendChild(body);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    closeBtn.addEventListener('click', closeShell);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeShell(); });
    const keyHandler = (e) => {
      if (e.key === 'Escape') { closeShell(); return; }
      if (e.key !== 'Tab') return;
      const items = focusablesIn(panel);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyHandler);

    activeShell = { backdrop, panel, triggerEl, keyHandler, onClose };

    if (prefersReducedMotion()) {
      backdrop.classList.add('eq-shell-open');
    } else {
      // starts closed so the added class actually transitions
      requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('eq-shell-open')));
    }
    closeBtn.focus();
    return { close: closeShell };
  }

  // ---- expandPanel -------------------------------------------------
  function expandPanel(config) {
    const source = config.source;
    const content = config.content;
    const side = config.side === 'right' ? 'right' : 'left';
    const onClose = config.onClose;
    if (!source) return;
    source.addEventListener('click', (e) => {
      e.preventDefault();
      const contentEl = typeof content === 'function' ? content() : content;
      openShell({ contentEl: contentEl, triggerEl: source, onClose: onClose, layout: side });
    });
  }

  // ---- holdToDetail --------------------------------------------------
  function holdToDetail(config) {
    const target = config.target;
    const threshold = config.threshold || 400;
    const renderDetail = config.renderDetail;
    if (!target) return { openViaClick: function () {} };

    let timer = null, startX = 0, startY = 0;
    const MOVE_CANCEL_PX = 10;

    function clearHoldTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function endHoldVisual() { target.classList.remove('eq-hold-active'); }

    function openDetail() {
      const contentEl = renderDetail();
      openShell({ contentEl: contentEl, triggerEl: target, layout: 'center' });
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX; startY = e.clientY;
      target.classList.add('eq-hold-active');
      clearHoldTimer();
      timer = setTimeout(() => {
        endHoldVisual();
        target.classList.add('eq-hold-fired');
        setTimeout(() => target.classList.remove('eq-hold-fired'), 220);
        timer = null;
        openDetail();
      }, threshold);
    }
    function onPointerMove(e) {
      if (!timer) return;
      // Cancel on movement past the threshold -- otherwise holding breaks
      // scrolling on touch, the most common way to get this wrong (spec).
      if (Math.abs(e.clientX - startX) > MOVE_CANCEL_PX || Math.abs(e.clientY - startY) > MOVE_CANCEL_PX) {
        clearHoldTimer();
        endHoldVisual();
      }
    }
    function onPointerUpOrCancel() {
      clearHoldTimer();
      endHoldVisual();
    }

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUpOrCancel);
    target.addEventListener('pointerleave', onPointerUpOrCancel);
    target.addEventListener('pointercancel', onPointerUpOrCancel);
    // Suppress the long-press context menu on touch targets (spec).
    target.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Non-hold fallback -- REQUIRED per spec, not optional: hold gestures
    // are undiscoverable and inaccessible (no keyboard equivalent), so
    // every hold target needs a visible click-accessible affordance too.
    // The primitive doesn't invent that icon itself (it doesn't know the
    // caller's layout) -- it just hands back a ready-to-wire handler.
    function openViaClick(e) {
      if (e) e.preventDefault();
      openDetail();
    }
    return { openViaClick: openViaClick };
  }

  window.EqExpand = { expandPanel: expandPanel, holdToDetail: holdToDetail };
})();
