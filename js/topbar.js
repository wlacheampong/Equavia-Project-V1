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
    // Planner + the old Ability page, merged and renamed: tasks/goals/
    // calendar now sit alongside habits, skills, books and Learn Hub.
    { key: 'planner', href: 'planner.html',   label: 'Ability',
      icon: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 12l2 2 4-4"/>' },
    { key: 'finance', href: 'finance.html',   label: 'Finance',
      icon: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2"/><circle cx="17" cy="13" r="1.4"/>' },
    // "More" on mobile only — desktop shows these inline with everything else.
    { key: 'ask',      href: 'ask.html',       label: 'Equavia 0', more: true,
      icon: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    // Interactions + the old News page, merged: the news feed and weekly
    // digest are now a section on this page rather than a tab of their own.
    { key: 'interactions', href: 'interactions.html', label: 'Social', more: true,
      icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="7" r="2.4"/><path d="M15 12.5a4.2 4.2 0 0 1 6.5 3.5"/>' },
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
    document.body.classList.add('has-bottombar');

    const moreBtn = document.getElementById('bottombarMoreBtn');
    if (moreBtn) moreBtn.addEventListener('click', openMoreSheet);
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
