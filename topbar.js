// =============================================================
// Single shared site nav. Drop this on any page with:
//     <script src="topbar.js" defer></script>
// Renders from one page list into two presentations:
//   - Desktop (>=768px): a top row showing all pages, in-flow at
//     the start of <body> (the former per-page "cat-tabs" row,
//     now defined once instead of copy-pasted onto every page).
//   - Mobile (<768px): a fixed bottom tab bar with the 5 core
//     pages plus a pinned
//     "More" tab (always visible, never scrolls away) that opens
//     a small sheet for the remaining pages.
// Skipped entirely inside iframes (e.g. po-water.html embedded in
// health.html).
// =============================================================
(function () {
  'use strict';

  const PAGES = [
    // Core tabs, re-walk against equavia-pre-answers-final.md 0.4/6.1:
    // Main / Health / Fitness / Planner / Finance. Finance moves back to
    // core from the More sheet; Interactions moves to More. User later
    // asked to bring back both the "Fitness" label on gym.html (reverting
    // the Train relabel) and train.html itself (reverting its retirement)
    // -- train.html is back in the More sheet below, distinct from
    // gym.html's own "Fitness" tab.
    { key: 'main',    href: 'dashboard.html', label: 'Main',
      icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9"/>' },
    { key: 'health',  href: 'health.html',    label: 'Health',
      icon: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>' },
    { key: 'fitness', href: 'gym.html',       label: 'Fitness',
      icon: '<path d="M6.5 9v6M17.5 9v6M3 10.5v3M21 10.5v3M6.5 12h11"/>' },
    { key: 'planner', href: 'planner.html',   label: 'Planner',
      icon: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 12l2 2 4-4"/>' },
    { key: 'finance', href: 'finance.html',   label: 'Finance',
      icon: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2"/><circle cx="17" cy="13" r="1.4"/>' },
    // "More" on mobile only — desktop shows these inline with everything else.
    { key: 'ask',      href: 'ask.html',       label: 'Equavia 0', more: true,
      icon: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    { key: 'interactions', href: 'interactions.html', label: 'Interactions', more: true,
      icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="7" r="2.4"/><path d="M15 12.5a4.2 4.2 0 0 1 6.5 3.5"/>' },
    { key: 'ability', href: 'ability.html',   label: 'Ability', more: true,
      icon: '<path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-3s2 1 2 5a6 6 0 0 1-12 0c0-6 5-6 7-11Z"/>' },
    { key: 'train',   href: 'train.html',     label: 'Train',   more: true,
      icon: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6M12 2v3"/>' },
    // Phase 5.6: deliberately not a core tab, so reaching the news feed
    // always costs one extra tap (the friction is intentional, same
    // reasoning Interactions' Inbox zone already applies).
    { key: 'news',    href: 'news.html',      label: 'News',    more: true,
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5M8 13h8M8 17h5"/>' },
    { key: 'notes',   href: 'notes.html',     label: 'Notes',   more: true,
      icon: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>' },
    { key: 'settings', href: 'settings.html',  label: 'Settings', more: true,
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.09a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>' }
  ];
  const CORE_PAGES = PAGES.filter((p) => !p.more);
  const MORE_PAGES = PAGES.filter((p) => p.more);
  const BREAKPOINT = 768;

  // -------- CSS --------
  const css = `
.eq-nav-icon svg { width: 100%; height: 100%; display: block; }

/* ---- Desktop top nav (>=${BREAKPOINT}px) ---- */
.cat-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 32px;
  max-width: 1280px;
  margin: 0 auto;
  padding: max(22px, env(safe-area-inset-top)) 20px 20px;
}
.cat-tab {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
  padding: 2px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}
.cat-tab:hover { color: rgba(255, 255, 255, 0.75); }
.cat-tab.is-active { color: #FAFAFA; }
.cat-tab .eq-nav-icon { width: 22px; height: 22px; }
.cat-tab-label {
  font-size: 11px; font-weight: 600;
  line-height: 1.25;
  text-align: center;
  white-space: nowrap;
}
@media (max-width: 480px) {
  .cat-tabs { gap: 18px; }
  .cat-tab-label { font-size: 10px; }
}
@media (max-width: ${BREAKPOINT - 1}px) {
  .cat-tabs { display: none; }
}

/* ---- Mobile bottom bar (<${BREAKPOINT}px) ---- */
.bottombar {
  display: none;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
  background: #0a0a0b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  padding-bottom: env(safe-area-inset-bottom);
}
@media (max-width: ${BREAKPOINT - 1}px) {
  .bottombar { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
}
.bottombar-scroll {
  display: flex;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.bottombar-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
.bottombar-tab, .bottombar-more-btn {
  flex: 0 0 auto;
  min-width: 62px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; padding: 6px 8px 4px; text-decoration: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
  background: transparent; border: 0; border-left: 1px solid transparent;
  font-family: inherit; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: color 0.15s;
}
.bottombar-more-btn {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 56px;
}
.bottombar-tab .eq-nav-icon, .bottombar-more-btn .eq-nav-icon {
  width: 22px; height: 22px;
  filter: grayscale(100%) brightness(1.2); opacity: 0.6;
  transition: opacity 0.15s, filter 0.15s, transform 0.10s;
}
.bottombar-tab.is-active, .bottombar-more-btn.is-active { color: #FAFAFA; }
.bottombar-tab.is-active .eq-nav-icon, .bottombar-more-btn.is-active .eq-nav-icon {
  filter: grayscale(100%) brightness(1.6); opacity: 1;
}
.bottombar-tab:active .eq-nav-icon, .bottombar-more-btn:active .eq-nav-icon { transform: scale(0.92); }
body.has-bottombar {
  padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
}
@media (min-width: ${BREAKPOINT}px) {
  body.has-bottombar { padding-bottom: 0 !important; }
}

/* ---- "More" sheet (mobile only) ---- */
.eq-more-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0, 0, 0, 0.55);
  display: none;
  align-items: flex-end;
}
.eq-more-overlay.is-open { display: flex; }
.eq-more-sheet {
  width: 100%;
  background: #0e0e11;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px 16px 0 0;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
}
.eq-more-sheet-title {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 8px 0 14px;
}
.eq-more-row {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 6px;
  color: #FAFAFA;
  text-decoration: none;
  font-size: 15px; font-weight: 600;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.eq-more-row:first-of-type { border-top: 0; }
.eq-more-row .eq-nav-icon { width: 22px; height: 22px; opacity: 0.8; }

html, body { -webkit-text-size-adjust: 100%; }
@media (max-width: 768px) {
  html { touch-action: pan-y; }
  ::-webkit-scrollbar { width: 0; height: 0; display: none; }
  html, body { scrollbar-width: none; -ms-overflow-style: none; }
}
.modal-bg, .modal, .po-modal-bg, .po-modal, .wt-overlay, .wt-viewer {
  overscroll-behavior: contain;
}
body.topbar-modal-open { overflow: hidden; touch-action: none; }
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

/* ---- Quick Capture (3.4): floating "+" available on every page ---- */
.eq-qc-fab {
  position: fixed; right: 18px; bottom: calc(18px + env(safe-area-inset-bottom));
  z-index: 45; width: 52px; height: 52px; border-radius: 50%;
  background: #FAFAFA; color: #0a0a0b; border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
@media (max-width: ${BREAKPOINT}px) {
  .eq-qc-fab { bottom: calc(64px + 14px + env(safe-area-inset-bottom)); }
}
.eq-qc-fab svg { width: 24px; height: 24px; }
.eq-qc-overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0, 0, 0, 0.55);
  display: none; align-items: flex-end; justify-content: center;
}
.eq-qc-overlay.is-open { display: flex; }
.eq-qc-sheet {
  width: 100%; max-width: 480px;
  background: #0e0e11; border-top: 1px solid rgba(255,255,255,0.10);
  border-radius: 16px 16px 0 0;
  padding: 18px 18px calc(20px + env(safe-area-inset-bottom));
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.eq-qc-head-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding-bottom: 14px; position: relative;
}
.eq-qc-title {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.4);
}
.eq-qc-mode-toggle {
  position: absolute; right: 0;
  padding: 5px 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
  font-family: inherit; font-size: 10.5px; font-weight: 700; cursor: pointer;
}
.eq-qc-mode-toggle.is-on { background: rgba(224,118,88,0.16); border-color: rgba(224,118,88,0.45); color: #E07658; }
.eq-qc-input-row { display: flex; gap: 8px; align-items: flex-start; }
.eq-qc-input {
  flex: 1; min-width: 0; box-sizing: border-box; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  color: #FAFAFA; font-family: inherit; font-size: 14px; padding: 10px 12px;
  resize: none; max-height: 100px;
}
.eq-qc-input::placeholder { color: rgba(255,255,255,0.35); }
.eq-qc-mic-btn {
  flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.eq-qc-mic-btn.is-listening { background: #FF6B6B; color: #2a0a0a; }
@media (prefers-reduced-motion: no-preference) {
  .eq-qc-mic-btn.is-listening { animation: eqQcMicPulse 1.2s ease-in-out infinite; }
  @keyframes eqQcMicPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
}
.eq-qc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.eq-qc-chip {
  padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.75);
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.eq-qc-chip:active { background: rgba(255,255,255,0.14); }
.eq-qc-chip:disabled { opacity: 0.35; cursor: default; }
.eq-qc-smart-btn {
  width: 100%; margin-top: 12px; padding: 11px;
  border-radius: 10px; border: none; background: #E07658; color: #1a0f0a;
  font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
}
.eq-qc-smart-btn:disabled { opacity: 0.55; cursor: default; }
.eq-qc-status { font-size: 11.5px; color: rgba(255,255,255,0.4); text-align: center; margin-top: 12px; min-height: 15px; }

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

  function buildCatTabs(activeKey) {
    const wrap = document.createElement('div');
    wrap.className = 'cat-tabs';
    wrap.id = 'catTabs';
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Site sections');
    wrap.innerHTML = PAGES.map((p) => {
      const active = p.key === activeKey;
      return '<a class="cat-tab' + (active ? ' is-active' : '') + '" href="' + p.href + '"' + (active ? ' aria-current="page"' : '') + '>'
        + iconSpan(p)
        + '<span class="cat-tab-label">' + p.label + '</span>'
        + '</a>';
    }).join('');
    return wrap;
  }

  function buildBottomBar(activeKey) {
    const nav = document.createElement('nav');
    nav.className = 'bottombar';
    nav.id = 'bottombar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main tabs');

    const scroll = document.createElement('div');
    scroll.className = 'bottombar-scroll';
    scroll.innerHTML = CORE_PAGES.map((p) => {
      const active = p.key === activeKey;
      return '<a class="bottombar-tab' + (active ? ' is-active' : '') + '" href="' + p.href + '" data-page="' + p.key + '">'
        + iconSpan(p)
        + '<span>' + p.label + '</span>'
        + '</a>';
    }).join('');
    nav.appendChild(scroll);

    const moreActive = MORE_PAGES.some((p) => p.key === activeKey);
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'bottombar-more-btn' + (moreActive ? ' is-active' : '');
    moreBtn.id = 'bottombarMoreBtn';
    moreBtn.innerHTML = '<span class="eq-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg></span><span>More</span>';
    nav.appendChild(moreBtn);

    return nav;
  }

  function buildMoreSheet(activeKey) {
    const overlay = document.createElement('div');
    overlay.className = 'eq-more-overlay';
    overlay.id = 'eqMoreOverlay';
    const sheet = document.createElement('div');
    sheet.className = 'eq-more-sheet';
    sheet.innerHTML = '<div class="eq-more-sheet-title">More</div>'
      + MORE_PAGES.map((p) => {
        const active = p.key === activeKey;
        return '<a class="eq-more-row" href="' + p.href + '"' + (active ? ' aria-current="page"' : '') + '>' + iconSpan(p) + '<span>' + p.label + '</span></a>';
      }).join('');
    overlay.appendChild(sheet);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMoreSheet(); });
    return overlay;
  }

  function openMoreSheet() {
    const overlay = document.getElementById('eqMoreOverlay');
    if (overlay) overlay.classList.add('is-open');
  }
  function closeMoreSheet() {
    const overlay = document.getElementById('eqMoreOverlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  // ============================================================
  // QUICK CAPTURE (3.4) -- available on every page via a floating "+".
  // Writes directly to each destination's real storage key/shape rather
  // than navigating away, so capturing something never interrupts
  // whatever the user was doing on the current page.
  //
  // The Notes destination can't use window.Vitality.save() here: that
  // bridge derives its storage key from the *current page's own
  // filename* (see vitality-bridge.js's appKey()), so calling it from
  // topbar.js -- loaded on every page -- would silently write into
  // whichever page happens to be open, not into Notes. Writing straight
  // to notes.html's exact cache key ('vitality_bridge:vitality_notes')
  // sidesteps that. This only updates the local cache immediately; the
  // cross-device Supabase push happens the next time Notes is actually
  // opened on this device (its own boot already does a full load/save
  // cycle) rather than being duplicated here, since not every page that
  // loads topbar.js has the Supabase SDK script tag loaded to push with.
  // ============================================================
  function qcPad2(n) { return String(n).padStart(2, '0'); }
  function qcDateKeyOf(d) { return d.getFullYear() + '-' + qcPad2(d.getMonth() + 1) + '-' + qcPad2(d.getDate()); }
  // Same 6am day-boundary convention as planner.html's getActiveDateString()
  // -- a task captured at 2am belongs to the still-active previous day.
  function qcActiveDateKey() {
    const now = new Date();
    if (now.getHours() < 6) { const d = new Date(now); d.setDate(d.getDate() - 1); return qcDateKeyOf(d); }
    return qcDateKeyOf(now);
  }
  function qcTomorrowDateKey() {
    const now = new Date();
    const d = new Date(now);
    d.setDate(d.getDate() + (now.getHours() < 6 ? 0 : 1));
    return qcDateKeyOf(d);
  }
  function qcStoreGet(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v; } catch (e) { return null; } }
  function qcStoreSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function qcId(prefix) { return prefix + Date.now() + Math.random().toString(36).slice(2, 7); }

  function qcSaveTask(text, dateKey) {
    const key = 'goals:' + dateKey;
    const list = qcStoreGet(key);
    const arr = Array.isArray(list) ? list : [];
    arr.push({ text, done: false });
    qcStoreSet(key, arr);
  }
  function qcSaveNote(text) {
    const lines = text.split('\n');
    const title = lines[0].slice(0, 120);
    const body = lines.slice(1).join('\n').trim();
    const now = new Date().toISOString();
    const CACHE_KEY = 'vitality_bridge:vitality_notes';
    const existing = qcStoreGet(CACHE_KEY);
    const notes = Array.isArray(existing) ? existing : [];
    notes.unshift({
      id: qcId('note-'), title, body, pinned: false, images: [],
      createdAt: now, updatedAt: now, obsidian: { path: null, lastSyncedAt: null, remoteMtime: null },
    });
    qcStoreSet(CACHE_KEY, notes);
  }
  function qcSaveShopping(text) {
    const list = qcStoreGet('shopping_list_v1');
    const arr = Array.isArray(list) ? list : [];
    arr.push({ id: qcId('sh'), name: text, grams: 0, qty: 1, lastsValue: 0, lastsUnit: 'days', estDays: null });
    qcStoreSet('shopping_list_v1', arr);
  }
  function qcSaveBook(text) {
    const list = qcStoreGet('books_v1');
    const arr = Array.isArray(list) ? list : [];
    arr.push({
      id: qcId('bk'), title: text, author: '', status: 'want', rating: 0, notes: '',
      finishedAt: null, addedAt: new Date().toISOString(),
    });
    qcStoreSet('books_v1', arr);
  }

  // 6.3: attaches to the first active (or just first) Learn Hub track --
  // Quick Capture has no track-picker UI of its own, and adding one just
  // for this destination wasn't worth the extra tap this feature is
  // supposed to avoid. Throws a clear message (not a silent no-op) if no
  // track exists yet to attach to.
  function qcSaveLearningLog(text) {
    const tracks = qcStoreGet('eq.learn.tracks_v1');
    const arr = Array.isArray(tracks) ? tracks : [];
    if (!arr.length) throw new Error('Add a Learn Hub track on Ability first.');
    const track = arr.find((t) => t.status === 'active') || arr[0];
    const list = qcStoreGet('eq.learn.log_v1');
    const logArr = Array.isArray(list) ? list : [];
    logArr.push({ id: qcId('ll-'), trackId: track.id, text, link: null, at: new Date().toISOString() });
    qcStoreSet('eq.learn.log_v1', logArr);
  }

  const QC_DESTINATIONS = [
    { key: 'task-today', label: 'Task today', save: (t) => qcSaveTask(t, qcActiveDateKey()) },
    { key: 'task-tomorrow', label: 'Task tomorrow', save: (t) => qcSaveTask(t, qcTomorrowDateKey()) },
    { key: 'note', label: 'Note', save: qcSaveNote },
    { key: 'shopping', label: 'Shopping list', save: qcSaveShopping },
    { key: 'book', label: 'Book to read', save: qcSaveBook },
    { key: 'learning', label: 'Learning log', save: qcSaveLearningLog },
  ];

  function buildQuickCaptureFab() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eq-qc-fab';
    btn.id = 'eqQcFab';
    btn.setAttribute('aria-label', 'Quick capture');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
    return btn;
  }
  function buildQuickCaptureSheet() {
    const overlay = document.createElement('div');
    overlay.className = 'eq-qc-overlay';
    overlay.id = 'eqQcOverlay';
    const sheet = document.createElement('div');
    sheet.className = 'eq-qc-sheet';
    sheet.innerHTML =
      '<div class="eq-qc-head-row">' +
        '<div class="eq-qc-title">Quick Capture</div>' +
        '<button type="button" class="eq-qc-mode-toggle" id="eqQcModeToggle" aria-pressed="false">Smart parse</button>' +
      '</div>' +
      '<div class="eq-qc-input-row">' +
        '<textarea class="eq-qc-input" id="eqQcInput" rows="2" placeholder="What do you want to remember?"></textarea>' +
        '<button type="button" class="eq-qc-mic-btn" id="eqQcMicBtn" aria-label="Voice input" style="display:none;">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4M9 22h6"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="eq-qc-chips" id="eqQcChips">' +
        QC_DESTINATIONS.map((d) => '<button type="button" class="eq-qc-chip" data-dest="' + d.key + '">' + d.label + '</button>').join('') +
      '</div>' +
      '<button type="button" class="eq-qc-smart-btn" id="eqQcSmartBtn" style="display:none;">Log it</button>' +
      '<div class="eq-qc-status" id="eqQcStatus"></div>';
    overlay.appendChild(sheet);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeQuickCapture(); });
    return overlay;
  }
  function openQuickCapture() {
    const overlay = document.getElementById('eqQcOverlay');
    if (!overlay) return;
    overlay.classList.add('is-open');
    const input = document.getElementById('eqQcInput');
    document.getElementById('eqQcStatus').textContent = '';
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
  function closeQuickCapture() {
    const overlay = document.getElementById('eqQcOverlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  // ============================================================
  // SMART CAPTURE (4.2) -- free text parsed into the right records via the
  // assistant's own tool loop, opt-in per capture since it costs a token
  // round-trip (structured chips above stay the zero-cost default path).
  // Runs the exact same tools Ask Claude's full chat uses (assistant-
  // tools.js, extracted from ask.html for exactly this reuse) so behavior
  // never drifts between the two entry points.
  //
  // Unlike ask.html's chat loop, this never shows a confirm card -- there's
  // no room for one in a one-shot capture sheet, and a same-day overwrite
  // from the user's own just-typed text isn't the kind of surprising
  // background write a confirm gate exists to catch. Every tool call here
  // executes immediately regardless of confirmMode.
  // ============================================================
  const QC_SMART_MODEL = 'claude-haiku-4-5-20251001';
  const QC_SMART_MAX_ROUNDS = 5;
  function qcSmartSystemPrompt() {
    return 'You are a quick-capture parser for a personal tracking app. The user typed one short note describing one or more things that already happened -- extract each one and call the matching tool to record it. Call as many tools as apply in one note (e.g. a sleep amount AND a weight in the same sentence are two separate tool calls). If part of the note does not clearly map to any available tool, silently ignore that part -- never ask a clarifying question, since there is no way for the user to answer. Today\'s date is ' + new Date().toISOString().slice(0, 10) + '. After calling tools, reply with nothing else.\n\n' + window.AssistantTools.getMemoryContextText();
  }
  async function qcSmartToolLoop(text, statusEl) {
    const tools = Object.keys(window.AssistantTools.TOOL_REGISTRY).map((name) => window.AssistantTools.TOOL_REGISTRY[name].schema);
    let messages = [{ role: 'user', content: text }];
    const summaries = [];
    for (let round = 0; round < QC_SMART_MAX_ROUNDS; round++) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, window.EqAuth ? window.EqAuth.header() : {}),
        body: JSON.stringify({ messages, systemContext: qcSmartSystemPrompt(), tools, model: QC_SMART_MODEL }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
      if (!data.toolUse || !window.AssistantTools.TOOL_REGISTRY[data.toolUse.name]) break;
      const tool = window.AssistantTools.TOOL_REGISTRY[data.toolUse.name];
      let result;
      try { result = await tool.execute(data.toolUse.input || {}); }
      catch (e) { result = { ok: false, summary: 'Failed: ' + (e.message || 'unknown error') }; }
      summaries.push(result.summary);
      if (statusEl) statusEl.textContent = summaries.join(' ');
      messages = messages.concat([
        { role: 'assistant', content: data.rawContent },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: data.toolUse.id, content: result.summary }] },
      ]);
    }
    return summaries;
  }
  function initSmartCapture() {
    const toggle = document.getElementById('eqQcModeToggle');
    const chips = document.getElementById('eqQcChips');
    const smartBtn = document.getElementById('eqQcSmartBtn');
    const input = document.getElementById('eqQcInput');
    if (!toggle || !chips || !smartBtn || !input) return;
    let smartOn = false;
    toggle.addEventListener('click', () => {
      smartOn = !smartOn;
      toggle.classList.toggle('is-on', smartOn);
      toggle.setAttribute('aria-pressed', String(smartOn));
      chips.style.display = smartOn ? 'none' : '';
      smartBtn.style.display = smartOn ? '' : 'none';
      input.placeholder = smartOn ? 'Describe what happened — slept 6h, weight 82.9, took magnesium…' : 'What do you want to remember?';
    });
    smartBtn.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const statusEl = document.getElementById('eqQcStatus');
      smartBtn.disabled = true;
      smartBtn.textContent = 'Logging…';
      statusEl.textContent = '';
      try {
        const summaries = await qcSmartToolLoop(text, statusEl);
        statusEl.textContent = summaries.length ? summaries.join(' ') : 'Nothing in that matched a loggable action.';
        window.dispatchEvent(new Event('storage'));
        if (summaries.length) setTimeout(closeQuickCapture, 1200);
      } catch (e) {
        statusEl.textContent = 'Could not reach the assistant — ' + (e.message || 'try again') + '.';
      } finally {
        smartBtn.disabled = false;
        smartBtn.textContent = 'Log it';
      }
    });
  }

  // 4.7 voice input -- same Web Speech API approach as ask.html's mic
  // button (small enough to duplicate rather than share; see that file
  // for the full rationale on why the transcript is never auto-sent).
  function initQcVoiceInput() {
    const micBtn = document.getElementById('eqQcMicBtn');
    const input = document.getElementById('eqQcInput');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !micBtn) return;
    micBtn.style.display = '';
    let recognition = null;
    let listening = false;
    micBtn.addEventListener('click', () => {
      if (listening) { recognition && recognition.stop(); return; }
      recognition = new SR();
      recognition.lang = (navigator.language || 'en-US');
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => {
        const transcript = e.results[0] && e.results[0][0] ? e.results[0][0].transcript : '';
        if (transcript) input.value = (input.value ? input.value + ' ' : '') + transcript;
        input.focus();
      };
      recognition.onerror = () => { listening = false; micBtn.classList.remove('is-listening'); };
      recognition.onend = () => { listening = false; micBtn.classList.remove('is-listening'); };
      try { recognition.start(); listening = true; micBtn.classList.add('is-listening'); }
      catch (e) { listening = false; }
    });
  }

  function initQuickCapture() {
    const fab = document.getElementById('eqQcFab');
    if (fab) fab.addEventListener('click', openQuickCapture);
    const chips = document.getElementById('eqQcChips');
    if (!chips) return;
    chips.querySelectorAll('.eq-qc-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('eqQcInput');
        const text = input.value.trim();
        if (!text) { input.focus(); return; }
        const dest = QC_DESTINATIONS.find((d) => d.key === chip.dataset.dest);
        if (!dest) return;
        try {
          dest.save(text);
          document.getElementById('eqQcStatus').textContent = 'Saved to ' + dest.label + '.';
          window.dispatchEvent(new Event('storage'));
          setTimeout(closeQuickCapture, 500);
        } catch (e) {
          document.getElementById('eqQcStatus').textContent = (e && e.message) ? e.message : 'Could not save — try again.';
        }
      });
    });
    initSmartCapture();
    initQcVoiceInput();
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
  // stack:*, po_water_v1, eq.energy.logs_v1, vitality_bridge:*) -- running
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
    'sleep_log_v1', 'sleep_target_hours_v1', 'recovery_log_v1', 'hydration_manual_v1', 'eq.symptoms.log_v1', 'eq.symptoms.types_v1', 'eq.mood.log_v1',
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
    if (document.getElementById('bottombar') || document.getElementById('catTabs')) return;
    if (!shouldShowChrome()) return;
    const style = document.createElement('style');
    style.id = 'topbar-style';
    style.textContent = css;
    document.head.appendChild(style);

    const active = currentPageKey();

    document.body.insertBefore(buildCatTabs(active), document.body.firstChild);
    document.body.appendChild(buildBottomBar(active));
    document.body.appendChild(buildMoreSheet(active));
    document.body.appendChild(buildQuickCaptureFab());
    document.body.appendChild(buildQuickCaptureSheet());
    document.body.classList.add('has-bottombar');

    const moreBtn = document.getElementById('bottombarMoreBtn');
    if (moreBtn) moreBtn.addEventListener('click', openMoreSheet);
    initQuickCapture();
  }

  function blockGesture(e) { e.preventDefault(); }
  function lockGestures() {
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    document.addEventListener('gestureend', blockGesture, { passive: false });
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
    lockGestures();
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
