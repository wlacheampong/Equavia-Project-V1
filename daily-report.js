// =============================================================
// Comprehensive daily report -> Obsidian. Pulls together everything the
// app knows about a given day (weight/goal, WHOOP + steps, supplement
// stack, tasks, checklists, habits, longterm goals, active projects,
// today's workout sets from both gym.html and train.html, mood, and the
// close-the-day text) into one markdown file, pushed via
// ObsidianSync.pushDailyNote to the same <folder>/Daily/<dateKey>.md path
// the old dashboard.html-only writer used. This is the single writer of
// that file now -- dashboard.html's "Close the day" button calls
// window.EqDailyReport.run() too, instead of building its own markdown.
//
// Loaded on every page (same set as topbar.js) so it works no matter which
// page is opened first in the evening -- every read below is plain
// localStorage, shared cross-page same-origin, so no dependency on which
// page's own script actually wrote it.
//
// Self-triggers once/day: the first page load after 18:00 local, if
// today's report hasn't already been pushed, generates and pushes it.
// There is no literal "exactly 6PM" trigger available -- Obsidian sync is
// a browser-to-localhost bridge (see obsidian-sync.js's own top comment)
// that only runs while a tab is open, so this is the closest real
// equivalent: "whenever the app is next opened after 6PM."
// =============================================================
(function () {
  'use strict';
  function storeGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function safe(fn) { try { return fn() || ''; } catch (e) { return ''; } }

  function isoToDateKey(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---------- Weight vs goal (gym.html: po_coach_weights / po_coach_goal_weight) ----------
  function sectionWeight(dateKey) {
    const entries = (storeGet('po_coach_weights') || []).slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    if (!entries.length) return '';
    const gymState = storeGet('po_coach_v1');
    const unit = (gymState && gymState.units) || 'kg';
    const latest = entries[entries.length - 1];
    const cutoff = new Date(new Date(dateKey + 'T12:00:00').getTime() - 7 * 86400000);
    const recent = entries.filter((e) => new Date(e.dateKey + 'T12:00:00') >= cutoff);
    const avg7 = recent.length ? recent.reduce((s, e) => s + e.weight, 0) / recent.length : null;
    const goalRaw = localStorage.getItem('po_coach_goal_weight');
    const goal = goalRaw != null ? parseFloat(goalRaw) : null;
    const lines = ['Latest: ' + latest.weight + unit + ' (' + latest.dateKey + ')'];
    if (avg7 != null) lines.push('7-day avg: ' + avg7.toFixed(1) + unit);
    if (goal != null) {
      const diff = goal - latest.weight;
      const remaining = Math.abs(diff);
      lines.push(remaining < 0.05
        ? 'At goal weight (' + goal + unit + ').'
        : 'Goal: ' + goal + unit + ' — ' + remaining.toFixed(1) + unit + ' to ' + (diff < 0 ? 'lose' : 'gain') + '.');
    }
    return '## Weight\n' + lines.map((l) => '- ' + l).join('\n') + '\n\n';
  }

  // ---------- WHOOP + steps (health.html: eq.health.summary) ----------
  function sectionHealth(dateKey) {
    const h = storeGet('eq.health.summary');
    if (!h) return '';
    const fresh = h.at && isoToDateKey(h.at) === dateKey;
    const rows = [];
    if (h.recovery != null) rows.push('Recovery: ' + h.recovery + '%' + (h.recovery7dAvg != null ? ' (7d avg ' + h.recovery7dAvg + '%, ' + (h.recoveryTrend || 'flat') + ')' : ''));
    if (h.sleepHours != null) rows.push('Sleep: ' + h.sleepHours + 'h' + (h.sleepPerf != null ? ' (' + h.sleepPerf + '% perf)' : ''));
    if (h.hrv != null) rows.push('HRV: ' + h.hrv + (h.hrv7dAvg != null ? ' (7d avg ' + h.hrv7dAvg + ', ' + (h.hrvTrend || 'flat') + ')' : ''));
    if (h.rhr != null) rows.push('RHR: ' + h.rhr + (h.rhr7dAvg != null ? ' (7d avg ' + h.rhr7dAvg + ', ' + (h.rhrTrend || 'flat') + ')' : ''));
    if (h.strain != null) rows.push('Strain: ' + h.strain + (h.yesterdayStrain != null ? ' (yesterday ' + h.yesterdayStrain + ')' : ''));
    if (h.spo2 != null) rows.push('SpO2: ' + h.spo2 + '%');
    if (h.respRate != null) rows.push('Resp rate: ' + h.respRate);
    if (h.skinTemp != null) rows.push('Skin temp: ' + h.skinTemp);
    if (h.steps != null) rows.push('Steps: ' + h.steps);
    if (h.activeKcal != null) rows.push('Active kcal: ' + h.activeKcal);
    if (h.avgHr != null) rows.push('Avg HR: ' + h.avgHr);
    if (h.hrvDeclining) rows.push('HRV is on a declining trend.');
    if (!rows.length) return '';
    const title = fresh ? '## Health (WHOOP + steps)\n' : '## Health (WHOOP + steps) — not synced today, last data from ' + (isoToDateKey(h.at) || 'unknown') + '\n';
    return title + rows.map((r) => '- ' + r).join('\n') + '\n\n';
  }

  // ---------- Supplement stack (health.html: stack:items / stack:taken:<dateKey>) ----------
  function sectionStack(dateKey) {
    const items = storeGet('stack:items') || [];
    if (!items.length) return '';
    const taken = storeGet('stack:taken:' + dateKey) || {};
    const low = storeGet('stack:low') || [];
    const lines = items.map((it) => '- [' + (taken[it.id] ? 'x' : ' ') + '] ' + it.name + (it.dose ? ' (' + it.dose + ')' : '') + (low.indexOf(it.id) !== -1 ? ' — running low' : ''));
    return '## Supplement Stack\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Tasks (assistant-tools.js: goals:<dateKey>) ----------
  function sectionTasks(dateKey) {
    const list = storeGet('goals:' + dateKey) || [];
    if (!list.length) return '';
    const lines = list.map((t) => '- [' + (t.done ? 'x' : ' ') + '] ' + t.text + ' (' + (t.priority || 'P2') + ')');
    return '## Tasks\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Checklists (planner.html: checklist:items:<id> / checklist:done:<id>:<dateKey>) ----------
  function sectionChecklists(dateKey) {
    const CHECKLISTS = [
      { id: 'morning', name: 'Morning Checklist' },
      { id: 'midday', name: 'Mid-Day Checklist' },
      { id: 'evening', name: 'Evening Checklist' },
    ];
    let out = '';
    CHECKLISTS.forEach((c) => {
      const items = storeGet('checklist:items:' + c.id) || [];
      if (!items.length) return;
      const done = storeGet('checklist:done:' + c.id + ':' + dateKey) || {};
      const lines = items.map((it) => '- [' + (done[it.id] ? 'x' : ' ') + '] ' + it.text);
      out += '## ' + c.name + '\n' + lines.join('\n') + '\n\n';
    });
    return out;
  }

  // ---------- Habits (ability.html: habits_v1) ----------
  function sectionHabits(dateKey) {
    const list = storeGet('habits_v1') || [];
    if (!list.length) return '';
    const lines = list.map((h) => '- [' + ((h.history && h.history[dateKey]) ? 'x' : ' ') + '] ' + h.name);
    return '## Habits\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Longterm goals (planner.html: longterm_goals_v1) ----------
  function sectionGoals() {
    const list = (storeGet('longterm_goals_v1') || []).filter((g) => !g.archived);
    if (!list.length) return '';
    const lines = list.map((g) => {
      const notes = Array.isArray(g.notes) && g.notes.length ? g.notes[g.notes.length - 1].text : null;
      return '- ' + g.title + (g.deadline ? ' (due ' + g.deadline + ')' : '') + (notes ? ' — latest note: ' + notes : '');
    });
    return '## Longterm Goals\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Active projects (planner.html: projects_v1) ----------
  function sectionProjects() {
    const list = (storeGet('projects_v1') || []).filter((p) => !p.archived);
    if (!list.length) return '';
    const lines = list.map((p) => '- ' + p.title + ' (' + (p.status || 'not-started') + ')' + (p.obsidian && p.obsidian.path ? ' — [[' + p.obsidian.path.replace(/\.md$/i, '') + ']]' : ''));
    return '## Active Projects\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Today's workout (gym.html: po_coach_v1, train.html: vitality_bridge:vitality_train) ----------
  function sectionWorkout(dateKey) {
    const lines = [];
    const gymState = storeGet('po_coach_v1');
    if (gymState && Array.isArray(gymState.exercises) && gymState.logs) {
      const unit = gymState.units || 'kg';
      gymState.exercises.forEach((ex) => {
        const sets = (gymState.logs[ex.id] || []).filter((s) => isoToDateKey(s.date) === dateKey);
        if (!sets.length) return;
        const setsTxt = sets.map((s, i) => 'Set ' + (i + 1) + ': ' + s.weight + unit + '×' + s.reps).join(', ');
        lines.push('- ' + ex.name + ' — ' + setsTxt);
      });
    }
    const vit = storeGet('vitality_bridge:vitality_train');
    if (vit && vit.days) {
      const unit = vit.unit || 'kg';
      Object.keys(vit.days).forEach((dayKey) => {
        const day = vit.days[dayKey];
        (day.ex || []).forEach((ex) => {
          (ex.hist || []).filter((h) => h.date === dateKey).forEach((h) => {
            const setsTxt = (h.sets || []).map((s, i) => 'Set ' + (i + 1) + ': ' + h.kg + unit + '×' + s.r + (s.fail ? ' (fail)' : '')).join(', ');
            lines.push('- ' + ex.name + ' — ' + setsTxt);
          });
        });
      });
    }
    if (!lines.length) return '';
    return '## Workout\n' + lines.join('\n') + '\n\n';
  }

  // ---------- Mood + close-the-day (dashboard.html: eq.mood.log_v1 / eq.assistant.close_day_v1) ----------
  function sectionMoodAndClose(dateKey) {
    let out = '';
    const mood = (storeGet('eq.mood.log_v1') || []).find((m) => m.dateKey === dateKey);
    if (mood) out += '## Mood\n' + mood.mood + '/10' + (mood.note ? ' — ' + mood.note : '') + '\n\n';
    const close = storeGet('eq.assistant.close_day_v1');
    if (close && close.dateKey === dateKey && close.text) out += '## Close the Day\n\n' + close.text + '\n\n';
    return out;
  }

  function buildMarkdown(dateKey) {
    let md = '# ' + dateKey + '\n\n';
    md += safe(() => sectionWeight(dateKey));
    md += safe(() => sectionHealth(dateKey));
    md += safe(() => sectionStack(dateKey));
    md += safe(() => sectionTasks(dateKey));
    md += safe(() => sectionChecklists(dateKey));
    md += safe(() => sectionHabits(dateKey));
    md += safe(() => sectionGoals());
    md += safe(() => sectionProjects());
    md += safe(() => sectionWorkout(dateKey));
    md += safe(() => sectionMoodAndClose(dateKey));
    return md;
  }

  async function run(dateKey) {
    if (!window.ObsidianSync || !ObsidianSync.getConfig().enabled) return { ok: false, reason: 'disabled' };
    const md = buildMarkdown(dateKey);
    return ObsidianSync.pushDailyNote(dateKey, md);
  }

  window.EqDailyReport = { buildMarkdown, run };

  // Single fire per day: first page load at/after 18:00 local, gated by a
  // marker so re-opening the app later the same evening doesn't re-push on
  // every load. If the push itself fails (Obsidian not reachable), the
  // marker is NOT set, so the next page load retries.
  (function maybeAutoRun() {
    if (!window.ObsidianSync) return;
    let cfg;
    try { cfg = ObsidianSync.getConfig(); } catch (e) { return; }
    if (!cfg.enabled) return;
    if (new Date().getHours() < 18) return;
    const AT = window.AssistantTools;
    const dateKey = AT ? AT.activeDateKeyLocal() : isoToDateKey(new Date().toISOString());
    const marker = storeGet('eq.dailyreport.last_pushed');
    if (marker && marker.dateKey === dateKey) return;
    run(dateKey).then((res) => {
      if (res && res.ok) storeSet('eq.dailyreport.last_pushed', { dateKey, at: new Date().toISOString() });
    }).catch(function () {});
  })();
})();
