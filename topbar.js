// =============================================================
// Single shared site nav. Drop this on any page with:
//     <script src="topbar.js" defer></script>
// Renders from one page list into two presentations:
//   - Desktop (>=768px): a top row showing all pages, in-flow at
//     the start of <body> (the former per-page "cat-tabs" row,
//     now defined once instead of copy-pasted onto every page).
//   - Mobile (<768px): a fixed bottom tab bar with the 8 core
//     pages in a horizontally-scrollable strip plus a pinned
//     "More" tab (always visible, never scrolls away) that opens
//     a small sheet for the remaining pages.
// Skipped entirely inside iframes (e.g. train.html embedded in
// gym.html's Fitness tile, po-water.html embedded in health.html).
// =============================================================
(function () {
  'use strict';

  const PAGES = [
    { key: 'main',    href: 'dashboard.html', label: 'Main',
      icon: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9"/>' },
    { key: 'health',  href: 'health.html',    label: 'Health',
      icon: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>' },
    { key: 'fitness', href: 'gym.html',       label: 'Fitness',
      icon: '<path d="M6.5 9v6M17.5 9v6M3 10.5v3M21 10.5v3M6.5 12h11"/>' },
    { key: 'peak',    href: 'peak.html',      label: 'Peak',
      icon: '<path d="M3 20 9 8l4 6 2-3 6 9Z"/>' },
    { key: 'finance', href: 'finance.html',   label: 'Finance',
      icon: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2"/><circle cx="17" cy="13" r="1.4"/>' },
    { key: 'planner', href: 'planner.html',   label: 'Planner',
      icon: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 12l2 2 4-4"/>' },
    { key: 'ability', href: 'ability.html',   label: 'Ability',
      icon: '<path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-3s2 1 2 5a6 6 0 0 1-12 0c0-6 5-6 7-11Z"/>' },
    { key: 'notes',   href: 'notes.html',     label: 'Notes',
      icon: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>' },
    // "More" on mobile only — desktop shows these inline with everything else.
    { key: 'train',   href: 'train.html',     label: 'Train',  more: true,
      icon: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6M12 2v3"/>' },
    { key: 'vitals',  href: 'vitals.html',    label: 'Vitals', more: true,
      icon: '<path d="M2 12h4l2-7 4 14 3-9 2 5h5"/>' },
    { key: 'brand',   href: 'brand.html',     label: 'Brand',  more: true,
      icon: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>' },
    { key: 'settings', href: 'settings.html',  label: 'Settings', more: true,
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.09a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>' },
    { key: 'ask',      href: 'ask.html',       label: 'Ask',      more: true,
      icon: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' }
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
@media (max-width: ${BREAKPOINT - 1}px) {
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
.eq-qc-title {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.4); text-align: center; padding-bottom: 14px;
}
.eq-qc-input {
  width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  color: #FAFAFA; font-family: inherit; font-size: 14px; padding: 10px 12px;
  resize: none; max-height: 100px;
}
.eq-qc-input::placeholder { color: rgba(255,255,255,0.35); }
.eq-qc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.eq-qc-chip {
  padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.75);
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.eq-qc-chip:active { background: rgba(255,255,255,0.14); }
.eq-qc-chip:disabled { opacity: 0.35; cursor: default; }
.eq-qc-status { font-size: 11.5px; color: rgba(255,255,255,0.4); text-align: center; margin-top: 12px; min-height: 15px; }
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

  const QC_DESTINATIONS = [
    { key: 'task-today', label: 'Task today', save: (t) => qcSaveTask(t, qcActiveDateKey()) },
    { key: 'task-tomorrow', label: 'Task tomorrow', save: (t) => qcSaveTask(t, qcTomorrowDateKey()) },
    { key: 'note', label: 'Note', save: qcSaveNote },
    { key: 'shopping', label: 'Shopping list', save: qcSaveShopping },
    { key: 'book', label: 'Book to read', save: qcSaveBook },
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
      '<div class="eq-qc-title">Quick Capture</div>' +
      '<textarea class="eq-qc-input" id="eqQcInput" rows="2" placeholder="What do you want to remember?"></textarea>' +
      '<div class="eq-qc-chips" id="eqQcChips">' +
        QC_DESTINATIONS.map((d) => '<button type="button" class="eq-qc-chip" data-dest="' + d.key + '">' + d.label + '</button>').join('') +
      '</div>' +
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
          document.getElementById('eqQcStatus').textContent = 'Could not save — try again.';
        }
      });
    });
  }

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
    injectStyleAndHTML();
    lockGestures();
    startModalLock();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
