// =============================================================
// Single shared site nav. Drop this on any page with:
//     <script src="topbar.js" defer></script>
// Phase 04: renders one floating pill dock (all 7 non-Ask destinations,
// icon-only, same markup at every viewport) plus a detached circular
// button that expands into the AI Assistant command bar. Replaces the
// former two-presentation cat-tabs (desktop)/bottombar+More-sheet
// (mobile) design -- one dock, one behaviour, all breakpoints.
// Skipped entirely inside iframes -- an embedded page has no business
// rendering the site's own nav chrome.
// =============================================================
(function () {
  'use strict';

  const PAGES = [
    // Core tabs: Main / Health / Fitness / Planner / Finance.
    // The separate Train page was merged into Fitness (gym.html) -- its
    // day-tab session runner is now a section there, writing to the same
    // workout log as the progressive-overload tracker.
    { key: 'main',    href: 'dashboard.html', label: 'Main',
      icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9"/>' },
    { key: 'health',  href: 'health.html',    label: 'Health',
      icon: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>' },
    { key: 'fitness', href: 'gym.html',       label: 'Training',
      icon: '<path d="M6.5 9v6M17.5 9v6M3 10.5v3M21 10.5v3M6.5 12h11"/>' },
    // Standalone training-programme diagnostic panel (status.js +
    // programme.json) -- added to the dock as its own 8th icon, a
    // deliberate exception to the flat-7 constraint noted below.
    { key: 'status',  href: 'status.html',    label: 'Status',
      icon: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M12 16 15 11"/><circle cx="12" cy="16" r="1"/>' },
    // Planner + the old Ability page, merged and renamed: tasks/goals/
    // calendar now sit alongside habits, skills, books and Learn Hub.
    { key: 'planner', href: 'planner.html',   label: 'Ability',
      icon: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 12l2 2 4-4"/>' },
    { key: 'finance', href: 'finance.html',   label: 'Finance',
      icon: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2"/><circle cx="17" cy="13" r="1.4"/>' },
    // Ask is intentionally excluded from DOCK_PAGES below (Phase 04.2 --
    // the dock's own search button is now the entry point to AI Assistant),
    // but stays in PAGES so currentPageKey() still resolves correctly
    // when the user is actually on ask.html (drives the search button's
    // own active state).
    { key: 'ask',      href: 'ask.html',       label: 'AI Assistant',
      icon: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    // Interactions + the old News page, merged: the news feed and weekly
    // digest are now a section on this page rather than a tab of their own.
    { key: 'interactions', href: 'interactions.html', label: 'Social',
      icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="7" r="2.4"/><path d="M15 12.5a4.2 4.2 0 0 1 6.5 3.5"/>' },
    { key: 'settings', href: 'settings.html',  label: 'Settings',
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.09a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>' }
  ];
  // The dock shows every destination except Ask (8 icons as of adding
  // 'status' -- originally a flat 7-icon pill matching the Fey reference
  // with no nested overflow menu; Status was added as a deliberate
  // exception to that count, not a design-system change).
  const DOCK_PAGES = PAGES.filter((p) => p.key !== 'ask');
  const COMPACT_BREAKPOINT = 480; // below this, dock/search shrink further to stay clear of phone-width edges

  // -------- CSS --------
  const css = `
.eq-nav-icon svg { width: 100%; height: 100%; display: block; }

/* ---- Floating dock (same markup at every viewport) ---- */
.eq-dock-wrap {
  position: fixed; left: 50%; bottom: max(18px, calc(10px + env(safe-area-inset-bottom)));
  transform: translateX(-50%);
  z-index: 40;
  display: flex; align-items: center; gap: 10px;
  max-width: calc(100vw - 16px);
}
.eq-dock {
  display: flex; align-items: center;
  background: rgba(24, 25, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 5px;
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  max-width: 100%;
  overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
}
.eq-dock::-webkit-scrollbar { width: 0; height: 0; display: none; }
.eq-dock-item {
  position: relative; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px;
  border-radius: 12px; /* "rounded-square" active fill per spec, not a full circle */
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s, background 0.15s;
}
.eq-dock-item .eq-nav-icon { width: 20px; height: 20px; }
.eq-dock-item:hover { color: rgba(255, 255, 255, 0.75); }
.eq-dock-item.is-active { color: #FAFAFA; background: rgba(255, 255, 255, 0.10); }

/* Hover tooltip -- shared by dock items and the search button, both use
   data-tip. Desktop/pointer devices only; mobile relies on icon legibility
   per the spec's own "must work without labels on mobile" requirement.
   Centred by default, but the first/last dock item and the search button
   sit close enough to the dock-wrap's own edge that a centred tooltip can
   run past the viewport on a narrow window -- those three pin to the near
   edge of their own trigger instead and grow inward (the reference image
   itself shows the search button's tooltip right-aligned above it, not
   centred, so this also matches the source more closely). */
@media (hover: hover) and (pointer: fine) {
  .eq-dock-item[data-tip], .eq-dock-search[data-tip] { position: relative; }
  .eq-dock-item[data-tip]::after, .eq-dock-search[data-tip]::after {
    content: attr(data-tip);
    position: absolute; bottom: calc(100% + 12px); left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: #1c1d20; color: #FAFAFA; font-size: 11px; font-weight: 600;
    padding: 5px 10px; border-radius: 6px; white-space: nowrap;
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s, transform 0.15s;
  }
  .eq-dock-item:hover[data-tip]::after, .eq-dock-search:hover[data-tip]::after {
    opacity: 1; transform: translateX(-50%) translateY(0);
  }
  .eq-dock-item:first-child[data-tip]::after {
    left: 0; transform: translateX(0) translateY(4px);
  }
  .eq-dock-item:first-child:hover[data-tip]::after { transform: translateX(0) translateY(0); }
  .eq-dock-item:last-child[data-tip]::after, .eq-dock-search[data-tip]::after {
    left: auto; right: 0; transform: translateX(0) translateY(4px);
  }
  .eq-dock-item:last-child:hover[data-tip]::after, .eq-dock-search:hover[data-tip]::after {
    transform: translateX(0) translateY(0);
  }
}

.eq-dock-search {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  width: 54px; height: 54px;
  border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(24, 25, 28, 0.92);
  color: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer; padding: 0;
  font-family: inherit;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.eq-dock-search svg { width: 20px; height: 20px; }
.eq-dock-search:hover, .eq-dock-search.is-engaged { color: #FAFAFA; background: rgba(42, 43, 48, 0.94); }
.eq-dock-search.is-active { border-color: rgba(var(--eq-accent-rgb, 255, 152, 96), 0.5); }

body.has-eq-dock { padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important; }

@media (max-width: ${COMPACT_BREAKPOINT}px) {
  .eq-dock-wrap { gap: 8px; bottom: max(14px, calc(8px + env(safe-area-inset-bottom))); }
  .eq-dock { padding: 4px; }
  .eq-dock-item { width: 40px; height: 40px; }
  .eq-dock-item .eq-nav-icon { width: 19px; height: 19px; }
  .eq-dock-search { width: 46px; height: 46px; }
  .eq-dock-search svg { width: 18px; height: 18px; }
  body.has-eq-dock { padding-bottom: calc(62px + env(safe-area-inset-bottom)) !important; }
}

/* ---- AI command bar (Phase 04.2) -- expands above the dock ---- */
.eq-ai-bar {
  position: fixed; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom));
  transform: translateX(-50%) translateY(8px) scale(0.96);
  width: min(560px, calc(100vw - 32px));
  z-index: 41;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.eq-ai-bar.is-open { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0) scale(1); }
.eq-ai-form {
  display: flex; align-items: center; gap: 10px;
  background: rgba(20, 21, 24, 0.97); border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px; padding: 13px 18px;
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
.eq-ai-form-icon { width: 18px; height: 18px; flex-shrink: 0; color: rgba(255, 255, 255, 0.4); }
.eq-ai-input {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  color: #FAFAFA; font-family: inherit; font-size: 15px; padding: 0;
}
.eq-ai-input::placeholder { color: rgba(255, 255, 255, 0.35); }
@media (max-width: ${COMPACT_BREAKPOINT}px) {
  .eq-ai-bar { bottom: calc(70px + env(safe-area-inset-bottom)); }
}
@media (prefers-reduced-motion: reduce) {
  .eq-ai-bar { transition: opacity 0.01s linear; }
}

/* ---- AI sheet -- opens in place over the current page instead of
   navigating to ask.html. A centered, fully-rounded floating card over a
   dimmed backdrop (matches the Fey reference dialog: rounded on all sides,
   a small icon+label tab top-left, never edge-to-edge/full-bleed even on
   mobile) -- kept as its own class names, not the page-local .modal/
   .po-modal-bg convention, to avoid colliding with any page's own modal
   styling. ---- */
.eq-ai-sheet-bg {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s;
}
.eq-ai-sheet-bg.is-open { opacity: 1; pointer-events: auto; }
.eq-ai-sheet {
  width: min(720px, 100%);
  height: min(85vh, 760px);
  background: #0d0d10;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  transform: translateY(16px) scale(0.98);
  transition: transform 0.25s ease, opacity 0.2s;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.eq-ai-sheet-bg.is-open .eq-ai-sheet { transform: translateY(0) scale(1); }
.eq-ai-sheet-head {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.eq-ai-sheet-tab {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255, 255, 255, 0.06); border: none; border-radius: 999px;
  padding: 6px 12px 6px 8px; color: rgba(255, 255, 255, 0.8);
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.eq-ai-sheet-tab:hover { background: rgba(255, 255, 255, 0.1); color: #FAFAFA; }
.eq-ai-sheet-tab svg { width: 14px; height: 14px; flex-shrink: 0; }
.eq-ai-sheet-close {
  width: 30px; height: 30px; border-radius: 999px; border: none; flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.7);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.eq-ai-sheet-close:hover { background: rgba(255, 255, 255, 0.12); color: #FAFAFA; }
.eq-ai-sheet-frame { flex: 1 1 auto; border: none; width: 100%; height: 100%; background: transparent; }
@media (max-width: 480px) {
  .eq-ai-sheet-bg { padding: 12px; }
  .eq-ai-sheet { height: min(88vh, 760px); border-radius: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .eq-ai-sheet-bg { transition: opacity 0.01s linear; }
  .eq-ai-sheet { transition: transform 0.01s linear; }
}

html, body { -webkit-text-size-adjust: 100%; }
@media (max-width: 768px) {
  html { touch-action: pan-y pinch-zoom; }
  ::-webkit-scrollbar { width: 0; height: 0; display: none; }
  html, body { scrollbar-width: none; -ms-overflow-style: none; }
}
.modal-bg, .modal, .po-modal-bg, .po-modal, .wt-overlay, .wt-viewer {
  overscroll-behavior: contain;
}
body.topbar-modal-open { overflow: hidden; touch-action: none; }
/* body.topbar-modal-open's touch-action:none blocks the PAGE from scrolling
   behind an open modal -- but touch-action isn't simply inherited, so
   without this, it also silently blocks touch-driven scrolling INSIDE the
   modal's own overflow-y:auto content, since nothing re-enables it there.
   A tall modal (e.g. gym.html's Settings, Units+Gyms+Days+Data stacked)
   becomes impossible to scroll on a real touchscreen as a result -- any
   action button below the fold (Done/Save/Cancel) is unreachable, even
   though programmatic scrolling (and Playwright's .click(), which scrolls
   via JS) still works, masking the bug in automated tests. */
.modal, .po-modal { touch-action: pan-y; }
@media (max-width: 480px) {
  .modal-bg, .po-modal-bg {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
  .modal, .po-modal {
    width: 100% !important; max-width: 100% !important;
    max-height: 100vh !important; height: 100vh !important;
    border-radius: 0 !important;
    padding-top: max(20px, env(safe-area-inset-top)) !important;
    padding-bottom: max(28px, env(safe-area-inset-bottom)) !important;
    overflow-y: auto !important; overscroll-behavior: contain;
  }
}

/* ===== 6.8 sync toast ===== */
.eq-sync-toast {
  position: fixed; left: 50%; bottom: 90px; transform: translate(-50%, 12px);
  background: rgba(20,20,22,0.95); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85); font-family: inherit; font-size: 12px; font-weight: 600;
  padding: 9px 16px; border-radius: 999px; z-index: 9999;
  opacity: 0; transition: opacity 0.25s, transform 0.25s; pointer-events: none;
}
.eq-sync-toast.is-showing { opacity: 1; transform: translate(-50%, 0); }
`;

  function iconSpan(page) {
    return '<span class="eq-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + page.icon + '</svg></span>';
  }

  const SEARCH_ICON_PATH = '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>';
  const AI_BAR_PLACEHOLDER = 'Ask AI Assistant to log, plan, or explain anything…';

  function buildDockWrap(activeKey) {
    const wrap = document.createElement('div');
    wrap.className = 'eq-dock-wrap';
    wrap.id = 'eqDockWrap';

    const dock = document.createElement('nav');
    dock.className = 'eq-dock';
    dock.id = 'eqDock';
    dock.setAttribute('role', 'navigation');
    dock.setAttribute('aria-label', 'Main');
    dock.innerHTML = DOCK_PAGES.map((p) => {
      const active = p.key === activeKey;
      return '<a class="eq-dock-item' + (active ? ' is-active' : '') + '" href="' + p.href + '" data-tip="' + p.label + '"'
        + (active ? ' aria-current="page"' : '') + ' aria-label="' + p.label + '">'
        + iconSpan(p)
        + '</a>';
    }).join('');
    wrap.appendChild(dock);

    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'eq-dock-search' + (activeKey === 'ask' ? ' is-active' : '');
    searchBtn.id = 'eqDockSearchBtn';
    searchBtn.setAttribute('data-tip', 'Ask AI Assistant · /');
    searchBtn.setAttribute('aria-label', 'Ask AI Assistant');
    searchBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + SEARCH_ICON_PATH + '</svg>';
    wrap.appendChild(searchBtn);

    return wrap;
  }

  function buildAiBar() {
    const bar = document.createElement('div');
    bar.className = 'eq-ai-bar';
    bar.id = 'eqAiBar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML =
      '<form id="eqAiForm" class="eq-ai-form" autocomplete="off">'
      + '<svg class="eq-ai-form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + SEARCH_ICON_PATH + '</svg>'
      + '<input type="text" id="eqAiInput" class="eq-ai-input" placeholder="' + AI_BAR_PLACEHOLDER + '" aria-label="Ask AI Assistant">'
      + '</form>';
    return bar;
  }

  // ---- AI command bar behaviour (Phase 04.2) ----
  let aiBarOpen = false;
  function isEditableTarget(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }
  function openAiBar() {
    const bar = document.getElementById('eqAiBar');
    const btn = document.getElementById('eqDockSearchBtn');
    if (!bar || aiBarOpen) return;
    aiBarOpen = true;
    bar.classList.add('is-open');
    bar.setAttribute('aria-hidden', 'false');
    if (btn) btn.classList.add('is-engaged');
    const input = document.getElementById('eqAiInput');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 10); }
  }
  function closeAiBar(returnFocus) {
    const bar = document.getElementById('eqAiBar');
    const btn = document.getElementById('eqDockSearchBtn');
    if (!bar || !aiBarOpen) return;
    aiBarOpen = false;
    bar.classList.remove('is-open');
    bar.setAttribute('aria-hidden', 'true');
    if (btn) { btn.classList.remove('is-engaged'); if (returnFocus) btn.focus(); }
  }
  // ---- AI sheet (replaces the old hard `window.location.href =
  // 'ask.html?prompt=...'` redirect) -- submitting now opens ask.html in an
  // iframe overlay on top of the current page instead of navigating away.
  // ask.html's own topbar.js instance sees isEmbedded() === true inside that
  // iframe and skips rendering its own dock/AI-bar chrome entirely, so there's
  // no nested dock inside the sheet. ask.html persists its chat state to
  // localStorage regardless of how it's opened, so reloading the iframe's src
  // on every open is always safe (never loses in-progress conversation data).
  let aiSheetOpen = false;
  function buildAiSheet() {
    const bg = document.createElement('div');
    bg.className = 'eq-ai-sheet-bg';
    bg.id = 'eqAiSheetBg';
    bg.innerHTML =
      '<div class="eq-ai-sheet" id="eqAiSheet" role="dialog" aria-modal="true" aria-label="AI Assistant">'
      + '<div class="eq-ai-sheet-head">'
      + '<button type="button" class="eq-ai-sheet-tab" id="eqAiSheetBack" aria-label="Close">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
      + '<span>AI Assistant</span>'
      + '</button>'
      + '<button type="button" class="eq-ai-sheet-close" id="eqAiSheetClose" aria-label="Close">'
      + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
      + '</button>'
      + '</div>'
      + '<iframe class="eq-ai-sheet-frame" id="eqAiSheetFrame" title="AI Assistant"></iframe>'
      + '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) closeAiSheet(); });
    document.getElementById('eqAiSheetClose').addEventListener('click', () => closeAiSheet());
    document.getElementById('eqAiSheetBack').addEventListener('click', () => closeAiSheet());
    return bg;
  }
  function openAiSheet(promptText) {
    const bg = document.getElementById('eqAiSheetBg') || buildAiSheet();
    const frame = document.getElementById('eqAiSheetFrame');
    frame.src = 'ask.html' + (promptText ? ('?prompt=' + encodeURIComponent(promptText)) : '');
    aiSheetOpen = true;
    bg.classList.add('is-open');
    document.body.classList.add('topbar-modal-open');
  }
  function closeAiSheet() {
    const bg = document.getElementById('eqAiSheetBg');
    if (!bg || !aiSheetOpen) return;
    aiSheetOpen = false;
    bg.classList.remove('is-open');
    document.body.classList.remove('topbar-modal-open');
  }
  function submitAiBar(promptText) {
    const trimmed = (promptText || '').trim();
    if (!trimmed) return;
    closeAiBar(false);
    openAiSheet(trimmed);
  }
  function wireAiBar() {
    const btn = document.getElementById('eqDockSearchBtn');
    const form = document.getElementById('eqAiForm');
    const input = document.getElementById('eqAiInput');
    if (btn) btn.addEventListener('click', () => { if (aiBarOpen) closeAiBar(false); else openAiBar(); });
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); submitAiBar(input ? input.value : ''); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aiSheetOpen) { closeAiSheet(); return; }
      if (e.key === 'Escape' && aiBarOpen) { closeAiBar(true); return; }
      if (e.key === '/' && !aiBarOpen && !aiSheetOpen && !isEditableTarget(e.target)) { e.preventDefault(); openAiBar(); }
    });
    document.addEventListener('pointerdown', (e) => {
      if (!aiBarOpen) return;
      const bar = document.getElementById('eqAiBar');
      if (bar && bar.contains(e.target)) return;
      if (btn && btn.contains(e.target)) return;
      closeAiBar(false);
    });
  }

  // ============================================================
  // 6.8a SCHEMA VERSIONING -- eq.schema.version + sequential migrations.
  // Runs before the sync below, so sync never reads/writes an old shape.
  // No migrations exist yet (nothing in this app's current data needs a
  // shape change) -- this pass introduces the mechanism itself. A future
  // session adding a real migration pushes a function into MIGRATIONS
  // keyed by the version it upgrades TO, not by editing this runner.
  // ============================================================
  const SCHEMA_VERSION_KEY = 'eq.schema.version';
  const CURRENT_SCHEMA_VERSION = 1;
  const MIGRATIONS = {
    // 2: function () { ... },
  };
  function runMigrations() {
    let v = Number(localStorage.getItem(SCHEMA_VERSION_KEY)) || 0;
    if (v === 0) { localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION)); return; }
    while (v < CURRENT_SCHEMA_VERSION) {
      v++;
      const fn = MIGRATIONS[v];
      if (typeof fn === 'function') { try { fn(); } catch (e) {} }
      localStorage.setItem(SCHEMA_VERSION_KEY, String(v));
    }
  }

  // ============================================================
  // 6.8b MULTI-DEVICE SYNC VIA THE OBSIDIAN VAULT -- one JSON file
  // (equavia-sync.json) holding every synced namespace's raw value.
  // "Simple silent merge" per the answered ASK FIRST question (not the
  // spec's own heavier before-you-apply diff-review screen): auto-newest
  // per namespace, applied silently, with a one-line toast afterward --
  // matches the precedent obsidian-sync.js's own pullAll() already set
  // for Notes (silent, mtime-based last-write-wins), just extended to
  // every namespace instead of one page's data.
  //
  // Deliberately EXCLUDES: session/OAuth tokens (device-local by nature,
  // syncing them across devices makes no sense); anything already synced
  // by the existing Supabase-backed sync.js/vitality-bridge.js (goals:,
  // checklist:*, longterm_goals_v1, projects_v1, local_cal_events_v1,
  // stack:*, eq.energy.logs_v1, vitality_bridge:*) -- running
  // two sync mechanisms over the same keys would fight each other, not
  // complement; and po_coach_photos (base64 progress photos -- 6.9 moves
  // these to IndexedDB specifically because they're too large for this
  // kind of JSON round trip).
  //
  // "Namespace" = one localStorage key, not a finer-grained diff within a
  // key's own JSON value -- matches this app's own existing convention
  // (sync.js/pullAll both treat a whole key as the unit of sync too).
  // ============================================================
  const SYNCED_KEYS = [
    'contacts_v1',
    'nw:bank', 'nw:stocks', 'nw:crypto', 'nw:other', 'nw:activity', 'nw:history', 'budget:income', 'budget:expenses', 'nw_currency', 'eq.finance.allocation.buckets',
    'sleep_log_v1', 'sleep_target_hours_v1', 'recovery_log_v1', 'hydration_manual_v1',
    'po_coach_v1', 'po_coach_weights', 'po_coach_goal_weight', 'po_coach_workout_done', 'eq.training.programs_v1', 'eq.training.activeProgramId_v1', 'eq.training.reducedDecisions_v1', 'eq.training.restSeconds_v1', 'eq.fitness.summary',
    'shopping_list_v1', 'books_v1', 'skills_v1', 'habits_v1', 'todo_completion_snapshots_v1', 'weekly_reports_v1',
    'eq.learn.tracks_v1', 'eq.learn.deadlines_v1', 'eq.learn.hours_v1', 'eq.learn.decks_v1', 'eq.learn.log_v1',
    'eq.news.items_v1', 'eq.news.digests_v1', 'eq.news.seen_v1',
    'eq.assistant.memory', 'eq.assistant.activity_log_v1', 'eq.assistant.morning_brief_v1', 'eq.assistant.close_day_v1', 'eq.audits.v1', 'eq.rules.v1', 'eq.rules.fired.v1', 'ask_messages_v1',
    'eq.interaction_scores_v1', 'eq.inbox.quicklog_v1',
  ];
  const SYNC_LAST_SYNCED_KEY = 'eq.sync.lastSyncedSnapshot_v1';
  const SYNC_PENDING_LOCAL_KEY = 'eq.sync.pendingLocalChangeAt_v1';
  const SYNC_LAST_RUN_KEY = 'eq.sync.lastRunAt_v1';
  const SYNC_THROTTLE_MS = 5 * 60 * 1000; // avoid re-syncing on every page nav within the same short window

  function syncToast(msg) {
    const el = document.createElement('div');
    el.className = 'eq-sync-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('is-showing'), 10);
    setTimeout(() => { el.classList.remove('is-showing'); setTimeout(() => el.remove(), 400); }, 3600);
  }

  async function runObsidianSync(force) {
    if (isEmbedded()) return;
    if (!window.ObsidianSync || !window.AssistantTools) return;
    const AT = window.AssistantTools;
    const cfg = window.ObsidianSync.getConfig();
    if (!cfg.enabled) return;

    const lastRun = Number(localStorage.getItem(SYNC_LAST_RUN_KEY)) || 0;
    if (!force && Date.now() - lastRun < SYNC_THROTTLE_MS) return;
    localStorage.setItem(SYNC_LAST_RUN_KEY, String(Date.now()));

    const pullRes = await window.ObsidianSync.pullSyncFile();
    if (!pullRes.ok) { AT.recordIntegrationHealth('obsidian_sync', false); return; }
    AT.recordIntegrationHealth('obsidian_sync', true);

    const remoteDoc = (pullRes.doc && pullRes.doc.namespaces) ? pullRes.doc : { namespaces: {} };
    let lastSynced, pendingLocal;
    try { lastSynced = JSON.parse(localStorage.getItem(SYNC_LAST_SYNCED_KEY)) || {}; } catch (e) { lastSynced = {}; }
    try { pendingLocal = JSON.parse(localStorage.getItem(SYNC_PENDING_LOCAL_KEY)) || {}; } catch (e) { pendingLocal = {}; }

    let pulled = 0, pushed = 0;
    const nowIso = new Date().toISOString();
    const outNamespaces = {};

    SYNCED_KEYS.forEach((key) => {
      const localVal = localStorage.getItem(key);
      const hadLastKnown = Object.prototype.hasOwnProperty.call(lastSynced, key);
      const lastKnown = hadLastKnown ? lastSynced[key] : undefined;
      const localChanged = hadLastKnown ? (localVal !== lastKnown) : (localVal != null);
      if (localChanged) { if (!pendingLocal[key]) pendingLocal[key] = nowIso; }
      else { delete pendingLocal[key]; }

      const remoteEntry = remoteDoc.namespaces[key];
      const remoteChanged = remoteEntry ? (remoteEntry.value !== lastKnown) : false;

      function applyRemote() {
        if (remoteEntry.value === null) localStorage.removeItem(key); else localStorage.setItem(key, remoteEntry.value);
        lastSynced[key] = remoteEntry.value;
        outNamespaces[key] = remoteEntry;
        delete pendingLocal[key];
        pulled++;
      }
      function pushLocal() {
        const entry = { value: localVal, updatedAt: pendingLocal[key] || nowIso };
        lastSynced[key] = localVal;
        outNamespaces[key] = entry;
        delete pendingLocal[key];
        pushed++;
      }

      if (remoteChanged && !localChanged) applyRemote();
      else if (localChanged && !remoteChanged) pushLocal();
      else if (localChanged && remoteChanged) {
        // Genuine same-key double-change since our last sync -- auto-newest
        // by each side's own recorded timestamp (remote's push time vs. the
        // sync cycle we first noticed the local change in). The losing
        // side's edit is discarded, same as any last-write-wins scheme.
        const remoteTime = remoteEntry.updatedAt ? new Date(remoteEntry.updatedAt).getTime() : 0;
        const localTime = new Date(pendingLocal[key] || nowIso).getTime();
        if (remoteTime > localTime) applyRemote(); else pushLocal();
      } else if (remoteEntry) {
        outNamespaces[key] = remoteEntry; // unchanged either side -- carry forward as-is
      } else if (localVal != null) {
        // First-ever sync for this key: no remote entry yet, seed one.
        outNamespaces[key] = { value: localVal, updatedAt: nowIso };
        lastSynced[key] = localVal;
        pushed++;
      }
    });

    localStorage.setItem(SYNC_LAST_SYNCED_KEY, JSON.stringify(lastSynced));
    localStorage.setItem(SYNC_PENDING_LOCAL_KEY, JSON.stringify(pendingLocal));

    if (pushed > 0) {
      const pushRes = await window.ObsidianSync.pushSyncFile({ updatedAt: nowIso, namespaces: outNamespaces });
      AT.recordIntegrationHealth('obsidian_sync', pushRes.ok);
    }
    if (pulled > 0 || pushed > 0) {
      syncToast('Synced with vault — ' + (pulled ? pulled + ' pulled' : '') + (pulled && pushed ? ', ' : '') + (pushed ? pushed + ' pushed' : ''));
      window.dispatchEvent(new Event('storage'));
    }
  }
  window.EqRunObsidianSync = runObsidianSync; // exposed for Settings' manual "Sync now" button

  // ============================================================
  // 6.9 WEEKLY AUTO-BACKUP -- a silent, whole-localStorage export written
  // into the vault once per week, keeping the last 8. Same Sunday-7pm week
  // boundary this app already uses everywhere else (weekly reports, news
  // digests). Deliberately localStorage-only, same scope as Settings'
  // regular Export button (not the separate "full export with photos") --
  // keeps the payload small/fast for a background job that runs on its own,
  // matching the answered ASK FIRST split between the two export modes.
  // ============================================================
  const BACKUP_LAST_WEEK_KEY = 'eq.backup.lastAutoBackupWeek';
  const BACKUP_KEEP = 8;
  // Re-walk vs equavia-pre-answers-final.md 4.5: Sunday 7 PM (was Monday
  // 6am -- see dashboard.html's own weekStartSunday7pm for the full
  // note). Kept in step with the Report/Audit's own week boundary so
  // backups land on the same weekly cycle those features reference.
  function backupWeekKey(refDate) {
    const shifted = new Date(refDate.getTime() - 19 * 3600000);
    const daysSinceSunday = shifted.getDay();
    const sunday = new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate() - daysSinceSunday);
    return sunday.getFullYear() + '-' + String(sunday.getMonth() + 1).padStart(2, '0') + '-' + String(sunday.getDate()).padStart(2, '0');
  }
  async function runWeeklyAutoBackup() {
    if (isEmbedded() || !window.ObsidianSync) return;
    const cfg = window.ObsidianSync.getConfig();
    if (!cfg.enabled) return;
    const weekKey = backupWeekKey(new Date());
    if (localStorage.getItem(BACKUP_LAST_WEEK_KEY) === weekKey) return; // already done this week

    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k != null) data[k] = localStorage.getItem(k);
    }
    const exportedAt = new Date().toISOString();
    const res = await window.ObsidianSync.pushBackupFile(weekKey, JSON.stringify({ app: 'equavia', exportedAt, data }, null, 2));
    if (!res.ok) return; // leave BACKUP_LAST_WEEK_KEY unset so the next page load retries
    localStorage.setItem(BACKUP_LAST_WEEK_KEY, weekKey);
    localStorage.setItem('eq.lastBackupAt', JSON.stringify(exportedAt)); // same key Settings' manual export uses -- one indicator, either source

    // Prune to the last BACKUP_KEEP, oldest first -- filenames sort
    // lexicographically the same as the week keys they embed (YYYY-MM-DD).
    const listRes = await window.ObsidianSync.listBackupFiles();
    if (listRes.ok && listRes.files.length > BACKUP_KEEP) {
      const sorted = listRes.files.slice().sort();
      const toDelete = sorted.slice(0, sorted.length - BACKUP_KEEP);
      for (const filename of toDelete) { try { await window.ObsidianSync.deleteBackupFile(filename); } catch (e) {} }
    }
  }
  window.EqRunWeeklyBackup = runWeeklyAutoBackup; // exposed for testability, same reasoning as window.EqRunObsidianSync above

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  function shouldShowChrome() { return !isEmbedded(); }
  function currentPageKey() {
    const p = (window.location.pathname || '').toLowerCase();
    const hit = PAGES.find((pg) => p.endsWith('/' + pg.href) || p.endsWith(pg.href));
    return hit ? hit.key : 'main';
  }

  function injectStyleAndHTML() {
    if (document.getElementById('eqDockWrap')) return;
    if (!shouldShowChrome()) return;
    const style = document.createElement('style');
    style.id = 'topbar-style';
    style.textContent = css;
    document.head.appendChild(style);

    const active = currentPageKey();

    document.body.appendChild(buildDockWrap(active));
    document.body.appendChild(buildAiBar());
    document.body.classList.add('has-eq-dock');

    wireAiBar();
  }

  // Double-tap-to-zoom is still blocked (an accidental double-tap on a
  // button/checkbox shouldn't zoom the page) -- pinch-zoom itself is NOT
  // blocked here; that's handled by touch-action: pan-y pinch-zoom above
  // for standard browsers. An earlier version also called preventDefault()
  // on Safari's proprietary gesturestart/gesturechange/gestureend events,
  // which blocked pinch-zoom specifically on iOS regardless of touch-action
  // -- removed so pinch-zoom actually works there too.
  function blockDoubleTapZoom() {
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch <= 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  }
  function startModalLock() {
    const MODAL_SELECTORS = ['.modal-bg', '.po-modal-bg', '.wt-overlay', '.wt-viewer', '.wt-cam'];
    function anyOpen() {
      for (const sel of MODAL_SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el.classList.contains('show') || el.classList.contains('is-open')) return true;
        }
      }
      return false;
    }
    function sync() { document.body.classList.toggle('topbar-modal-open', anyOpen()); }
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    sync();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || isEmbedded()) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  function boot() {
    runMigrations();
    injectStyleAndHTML();
    blockDoubleTapZoom();
    startModalLock();
    registerServiceWorker();
    if (!isEmbedded()) { runObsidianSync(false); runWeeklyAutoBackup(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
