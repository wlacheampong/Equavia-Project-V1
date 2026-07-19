// =============================================================
// Shared assistant tool registry -- write access to the app's own data,
// usable by anything the assistant runs through, not just ask.html's chat.
//
// Originally lived entirely inside ask.html (Phase 4.1). Extracted here in
// Phase 4.2 because Quick Capture's new "smart" mode (topbar.js, loaded on
// every page) needs the exact same tool behavior -- same storage shapes,
// same overwrite/confirm rules, same activity log -- and a second,
// independently-written copy would drift from the first the moment either
// one changed (this build has hit that exact bug before, in the contact
// snooze-ordering issue from Phase 5.2: copying a shape without re-deriving
// it is how these diverge).
//
// NOT shared here: `add_calendar_event` (depends on ask.html's own Google
// Calendar OAuth token machinery, not portable) and `get_data` (depends on
// ask.html's domain-context builders, e.g. buildHealthContext -- meaningful
// only inside a chat conversation with context chips, not a one-shot
// capture). Both stay defined locally in ask.html and get merged into the
// final registry there. Smart Capture (4.2) doesn't need either: it only
// ever writes, and a single free-text capture isn't a multi-turn
// conversation that benefits from an on-demand read tool.
// =============================================================
window.AssistantTools = (function () {
  'use strict';

  function storeGet(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v; } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function genId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  const ASSISTANT_ACTIVITY_KEY = 'eq.assistant.activity_log_v1';
  const MAX_ACTIVITY_ENTRIES = 200;
  // Undo only needs to survive the current page session -- in-memory, not
  // persisted, so it never has to serialize a closure through localStorage.
  const pendingUndos = {};
  function logAssistantActivity(tool, summary, undo) {
    const list = storeGet(ASSISTANT_ACTIVITY_KEY) || [];
    const id = genId('a');
    list.unshift({ id, tool, summary, at: new Date().toISOString(), undone: false });
    if (list.length > MAX_ACTIVITY_ENTRIES) list.length = MAX_ACTIVITY_ENTRIES;
    storeSet(ASSISTANT_ACTIVITY_KEY, list);
    if (undo) pendingUndos[id] = undo;
    return id;
  }
  async function undoAssistantActivity(activityId) {
    const undo = pendingUndos[activityId];
    if (!undo) return false;
    await undo();
    delete pendingUndos[activityId];
    const list = storeGet(ASSISTANT_ACTIVITY_KEY) || [];
    const entry = list.find((a) => a.id === activityId);
    if (entry) { entry.undone = true; storeSet(ASSISTANT_ACTIVITY_KEY, list); }
    return true;
  }

  // Same 6am day-boundary convention as planner.html's getActiveDateString().
  function fmtDateKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function activeDateKeyLocal() {
    const now = new Date();
    return fmtDateKey(now.getHours() < 6 ? new Date(now.getTime() - 86400000) : now);
  }
  function tomorrowDateKeyLocal() {
    const now = new Date();
    const active = now.getHours() < 6 ? new Date(now.getTime() - 86400000) : now;
    return fmtDateKey(new Date(active.getTime() + 86400000));
  }

  function getTasksList(dateKey) { return storeGet('goals:' + dateKey) || []; }
  function setTasksList(dateKey, list) { storeSet('goals:' + dateKey, list); }
  function findTaskByRef(ref) {
    for (const dk of [activeDateKeyLocal(), tomorrowDateKeyLocal()]) {
      const list = getTasksList(dk);
      const idx = list.findIndex((t) => (t.id && t.id === ref) || (!t.id && 'text:' + t.text === ref));
      if (idx !== -1) return { dateKey: dk, list, idx, task: list[idx] };
    }
    return null;
  }

  const WEIGHT_KEY = 'po_coach_weights';
  function refreshFitnessSummaryWeightFields(arr) {
    const sorted = arr.slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const current = sorted.length ? sorted[sorted.length - 1] : null;
    const cutoff = fmtDateKey(new Date(Date.now() - 7 * 86400000));
    const recent = sorted.filter((e) => e.dateKey >= cutoff);
    const avg7 = recent.length ? recent.reduce((s, e) => s + e.weight, 0) / recent.length : null;
    const startKey = fmtDateKey(new Date(Date.now() - 14 * 86400000));
    const prior = sorted.filter((e) => e.dateKey >= startKey && e.dateKey < cutoff);
    const avg7Prior = prior.length ? prior.reduce((s, e) => s + e.weight, 0) / prior.length : null;
    const existing = storeGet('eq.fitness.summary') || {};
    storeSet('eq.fitness.summary', Object.assign({}, existing, {
      currentWeight: current ? current.weight : null,
      weight7dAvg: avg7 != null ? Number(avg7.toFixed(1)) : null,
      weight7dAvgChange: (avg7 != null && avg7Prior != null) ? Number((avg7 - avg7Prior).toFixed(1)) : null,
      at: new Date().toISOString(),
    }));
  }
  function getStackItemsList() { return storeGet('stack:items') || []; }

  // 6.6: P1/P2/P3 priority, default P2, cap of 3 P1s/day enforced here too
  // (not just the planner.html UI) -- same rule, same reason, whichever
  // surface is used to add the task.
  const TASK_PRIORITY_CAP_P1 = 3;
  const ADD_TASK_TOOL = {
    name: 'add_task', description: 'Add a new task to today or tomorrow\'s list.',
    input_schema: { type: 'object', properties: {
      title: { type: 'string', description: 'The task text.' },
      day: { type: 'string', enum: ['today', 'tomorrow'], description: 'Which day\'s list to add it to.' },
      priority: { type: 'string', enum: ['P1', 'P2', 'P3'], description: 'Priority: P1 (must happen that day), P2 (should, default), P3 (whenever). Max 3 P1 tasks/day.' },
    }, required: ['title', 'day'] },
  };
  async function exec_add_task(input) {
    const dateKey = input.day === 'tomorrow' ? tomorrowDateKeyLocal() : activeDateKeyLocal();
    const list = getTasksList(dateKey);
    const priority = ['P1', 'P2', 'P3'].includes(input.priority) ? input.priority : 'P2';
    if (priority === 'P1' && list.filter((t) => (t.priority || 'P2') === 'P1').length >= TASK_PRIORITY_CAP_P1) {
      return { ok: false, summary: 'Already at the ' + TASK_PRIORITY_CAP_P1 + ' P1-task cap for ' + (input.day || 'today') + ' -- demote or complete an existing P1 first, or add this as P2.' };
    }
    const id = genId('t');
    list.push({ id, text: input.title, done: false, source: 'assistant', priority });
    setTasksList(dateKey, list);
    const activityId = logAssistantActivity('add_task', 'Added task: "' + input.title + '" (' + (input.day || 'today') + ', ' + priority + ')', async () => {
      const l = getTasksList(dateKey);
      const i = l.findIndex((t) => t.id === id);
      if (i !== -1) { l.splice(i, 1); setTasksList(dateKey, l); }
    });
    return { ok: true, summary: 'Added task "' + input.title + '" for ' + (input.day || 'today') + ' (' + priority + ', id: ' + id + ').', activityId };
  }

  const COMPLETE_TASK_TOOL = {
    name: 'complete_task', description: 'Mark a task as done. Look the task up with get_data first if you don\'t already have its id from this conversation.',
    input_schema: { type: 'object', properties: { task_id: { type: 'string', description: 'The task\'s id, from get_data or a prior add_task result.' } }, required: ['task_id'] },
  };
  async function exec_complete_task(input) {
    const found = findTaskByRef(input.task_id);
    if (!found) return { ok: false, summary: 'No task found matching "' + input.task_id + '". Use get_data to look up the right task first.' };
    if (found.task.done) return { ok: true, summary: '"' + found.task.text + '" was already marked complete.' };
    found.task.done = true;
    setTasksList(found.dateKey, found.list);
    const activityId = logAssistantActivity('complete_task', 'Completed task: "' + found.task.text + '"', async () => {
      const f = findTaskByRef(input.task_id);
      if (f) { f.task.done = false; setTasksList(f.dateKey, f.list); }
    });
    return { ok: true, summary: 'Marked "' + found.task.text + '" complete.', activityId };
  }

  const PUSH_TASK_TOOL = {
    name: 'push_task_to_tomorrow', description: 'Move an unfinished task from today to tomorrow.',
    input_schema: { type: 'object', properties: { task_id: { type: 'string', description: 'The task\'s id, from get_data or a prior add_task result.' } }, required: ['task_id'] },
  };
  async function exec_push_task_to_tomorrow(input) {
    const found = findTaskByRef(input.task_id);
    if (!found) return { ok: false, summary: 'No task found matching "' + input.task_id + '".' };
    const task = found.task;
    found.list.splice(found.idx, 1);
    setTasksList(found.dateKey, found.list);
    const tomorrowDk = tomorrowDateKeyLocal();
    const tomorrowList = getTasksList(tomorrowDk);
    tomorrowList.push(task);
    setTasksList(tomorrowDk, tomorrowList);
    const fromDateKey = found.dateKey;
    const activityId = logAssistantActivity('push_task_to_tomorrow', 'Pushed "' + task.text + '" to tomorrow', async () => {
      const tl = getTasksList(tomorrowDk);
      const i = tl.findIndex((t) => t === task || (t.id && t.id === task.id));
      if (i !== -1) tl.splice(i, 1);
      setTasksList(tomorrowDk, tl);
      const orig = getTasksList(fromDateKey);
      orig.push(task);
      setTasksList(fromDateKey, orig);
    });
    return { ok: true, summary: 'Pushed "' + task.text + '" to tomorrow.', activityId };
  }

  const LOG_WEIGHT_TOOL = {
    name: 'log_weight', description: 'Log a body-weight reading.',
    input_schema: { type: 'object', properties: {
      kg: { type: 'number', description: 'Weight in kilograms.' },
      date: { type: 'string', description: 'ISO date, YYYY-MM-DD. Defaults to today if omitted.' },
    }, required: ['kg'] },
  };
  function weightEntryFor(dateKey) { return (storeGet(WEIGHT_KEY) || []).find((e) => e.dateKey === dateKey) || null; }
  async function exec_log_weight(input) {
    const dateKey = input.date || fmtDateKey(new Date());
    const arr = storeGet(WEIGHT_KEY) || [];
    const existing = arr.find((e) => e.dateKey === dateKey);
    const prevWeight = existing ? existing.weight : null;
    if (existing) existing.weight = input.kg;
    else { arr.push({ dateKey, weight: input.kg }); arr.sort((a, b) => a.dateKey.localeCompare(b.dateKey)); }
    storeSet(WEIGHT_KEY, arr);
    refreshFitnessSummaryWeightFields(arr);
    const activityId = logAssistantActivity('log_weight', 'Logged weight: ' + input.kg + 'kg (' + dateKey + ')', async () => {
      const a2 = storeGet(WEIGHT_KEY) || [];
      if (prevWeight != null) { const e = a2.find((x) => x.dateKey === dateKey); if (e) e.weight = prevWeight; }
      else { const i = a2.findIndex((x) => x.dateKey === dateKey); if (i !== -1) a2.splice(i, 1); }
      storeSet(WEIGHT_KEY, a2);
      refreshFitnessSummaryWeightFields(a2);
    });
    return { ok: true, summary: 'Logged ' + input.kg + 'kg for ' + dateKey + '.', activityId };
  }

  const LOG_SLEEP_TOOL = {
    name: 'log_sleep', description: 'Log a manual sleep-hours entry (use when the user tells you their sleep rather than it coming from WHOOP).',
    input_schema: { type: 'object', properties: {
      hours: { type: 'number', description: 'Hours slept.' },
      date: { type: 'string', description: 'ISO date, YYYY-MM-DD. Defaults to today if omitted.' },
    }, required: ['hours'] },
  };
  function sleepEntryFor(dateKey) { return (storeGet('sleep_log_v1') || []).find((e) => e.dateKey === dateKey) || null; }
  async function exec_log_sleep(input) {
    const dateKey = input.date || activeDateKeyLocal();
    const arr = storeGet('sleep_log_v1') || [];
    const existing = arr.find((e) => e.dateKey === dateKey);
    const prev = existing ? Object.assign({}, existing) : null;
    if (existing) { existing.hours = input.hours; existing.source = 'manual'; }
    else arr.push({ dateKey, hours: input.hours, source: 'manual' });
    storeSet('sleep_log_v1', arr);
    const activityId = logAssistantActivity('log_sleep', 'Logged sleep: ' + input.hours + 'h (' + dateKey + ')', async () => {
      const a2 = storeGet('sleep_log_v1') || [];
      if (prev) { const e = a2.find((x) => x.dateKey === dateKey); if (e) Object.assign(e, prev); }
      else { const i = a2.findIndex((x) => x.dateKey === dateKey); if (i !== -1) a2.splice(i, 1); }
      storeSet('sleep_log_v1', a2);
    });
    return { ok: true, summary: 'Logged ' + input.hours + 'h sleep for ' + dateKey + '.', activityId };
  }

  const LOG_CONTACT_TOOL = {
    name: 'log_contact', description: 'Record that you were in touch with a tracked contact today (or a given date).',
    input_schema: { type: 'object', properties: {
      contact_name: { type: 'string', description: 'The contact\'s name, matched case-insensitively.' },
      date: { type: 'string', description: 'ISO date, YYYY-MM-DD. Defaults to today if omitted.' },
    }, required: ['contact_name'] },
  };
  async function exec_log_contact(input) {
    const list = storeGet('contacts_v1') || [];
    const needle = (input.contact_name || '').trim().toLowerCase();
    const contact = list.find((c) => (c.name || '').trim().toLowerCase() === needle);
    if (!contact) return { ok: false, summary: 'No contact named "' + input.contact_name + '" found.' };
    contact.history = Array.isArray(contact.history) ? contact.history : [];
    const entry = { date: input.date ? new Date(input.date + 'T12:00:00').toISOString() : new Date().toISOString(), channel: 'other', note: '', direction: 'outbound' };
    contact.history.push(entry);
    const prevSnooze = contact.snoozedUntil;
    contact.snoozedUntil = null;
    storeSet('contacts_v1', list);
    const activityId = logAssistantActivity('log_contact', 'Logged contact: ' + contact.name, async () => {
      const l2 = storeGet('contacts_v1') || [];
      const c2 = l2.find((c) => c.id === contact.id);
      if (c2 && Array.isArray(c2.history)) {
        const i = c2.history.findIndex((h) => h.date === entry.date && h.channel === entry.channel);
        if (i !== -1) c2.history.splice(i, 1);
        c2.snoozedUntil = prevSnooze;
        storeSet('contacts_v1', l2);
      }
    });
    return { ok: true, summary: 'Logged contact with ' + contact.name + '.', activityId };
  }

  const ADD_SHOPPING_ITEM_TOOL = {
    name: 'add_shopping_item', description: 'Add an item to the shopping list.',
    input_schema: { type: 'object', properties: {
      name: { type: 'string', description: 'Item name.' },
      grams: { type: 'number', description: 'Optional weight in grams.' },
      qty: { type: 'number', description: 'Optional quantity, defaults to 1.' },
    }, required: ['name'] },
  };
  async function exec_add_shopping_item(input) {
    const list = storeGet('shopping_list_v1') || [];
    const id = genId('sh');
    list.push({ id, name: input.name, grams: input.grams || 0, qty: input.qty || 1, lastsValue: 0, lastsUnit: 'days', estDays: null, source: 'assistant' });
    storeSet('shopping_list_v1', list);
    const activityId = logAssistantActivity('add_shopping_item', 'Added to shopping list: ' + input.name, async () => {
      const l2 = storeGet('shopping_list_v1') || [];
      const i = l2.findIndex((x) => x.id === id);
      if (i !== -1) { l2.splice(i, 1); storeSet('shopping_list_v1', l2); }
    });
    return { ok: true, summary: 'Added "' + input.name + '" to your shopping list (id: ' + id + ').', activityId };
  }

  const ADD_BOOK_TOOL = {
    name: 'add_book', description: 'Add a book to the tracker.',
    input_schema: { type: 'object', properties: {
      title: { type: 'string', description: 'Book title.' },
      author: { type: 'string', description: 'Optional author.' },
      status: { type: 'string', enum: ['want', 'reading', 'read'], description: 'Shelf to place it on.' },
    }, required: ['title', 'status'] },
  };
  async function exec_add_book(input) {
    const list = storeGet('books_v1') || [];
    const id = genId('bk');
    list.push({ id, title: input.title, author: input.author || '', status: input.status, rating: 0, finishedAt: input.status === 'read' ? new Date().toISOString() : null, notes: '', source: 'assistant' });
    storeSet('books_v1', list);
    const activityId = logAssistantActivity('add_book', 'Added book: "' + input.title + '" (' + input.status + ')', async () => {
      const l2 = storeGet('books_v1') || [];
      const i = l2.findIndex((x) => x.id === id);
      if (i !== -1) { l2.splice(i, 1); storeSet('books_v1', l2); }
    });
    return { ok: true, summary: 'Added "' + input.title + '" to your books (' + input.status + ', id: ' + id + ').', activityId };
  }

  const CHECK_STACK_ITEM_TOOL = {
    name: 'check_stack_item', description: 'Mark a supplement/stack item as taken today.',
    input_schema: { type: 'object', properties: { item_name: { type: 'string', description: 'The stack item\'s name, matched case-insensitively (substring match allowed).' } }, required: ['item_name'] },
  };
  async function exec_check_stack_item(input) {
    const items = getStackItemsList();
    const needle = (input.item_name || '').trim().toLowerCase();
    let item = items.find((i) => (i.name || '').trim().toLowerCase() === needle);
    if (!item) item = items.find((i) => (i.name || '').trim().toLowerCase().indexOf(needle) !== -1);
    if (!item) return { ok: false, summary: 'No stack item matching "' + input.item_name + '" found.' };
    const dateKey = activeDateKeyLocal();
    const takenKey = 'stack:taken:' + dateKey;
    const taken = storeGet(takenKey) || {};
    if (taken[item.id]) return { ok: true, summary: '"' + item.name + '" was already marked taken today.' };
    taken[item.id] = Date.now();
    storeSet(takenKey, taken);
    const activityId = logAssistantActivity('check_stack_item', 'Marked taken: ' + item.name, async () => {
      const t2 = storeGet(takenKey) || {};
      delete t2[item.id];
      storeSet(takenKey, t2);
    });
    return { ok: true, summary: 'Marked "' + item.name + '" taken.', activityId };
  }

  const LOG_HABIT_TOOL = {
    name: 'log_habit', description: 'Mark a habit done or not-done for a day.',
    input_schema: { type: 'object', properties: {
      habit_name: { type: 'string', description: 'The habit\'s name, matched case-insensitively.' },
      done: { type: 'boolean', description: 'Whether it was completed.' },
      date: { type: 'string', description: 'ISO date, YYYY-MM-DD. Defaults to today if omitted.' },
    }, required: ['habit_name', 'done'] },
  };
  async function exec_log_habit(input) {
    const list = storeGet('habits_v1') || [];
    const needle = (input.habit_name || '').trim().toLowerCase();
    const habit = list.find((h) => (h.name || '').trim().toLowerCase() === needle);
    if (!habit) return { ok: false, summary: 'No habit named "' + input.habit_name + '" found.' };
    const dateKey = input.date || activeDateKeyLocal();
    habit.history = habit.history || {};
    const prev = habit.history[dateKey];
    if (input.done) habit.history[dateKey] = true; else delete habit.history[dateKey];
    storeSet('habits_v1', list);
    const activityId = logAssistantActivity('log_habit', 'Logged habit "' + habit.name + '": ' + (input.done ? 'done' : 'not done') + ' (' + dateKey + ')', async () => {
      const l2 = storeGet('habits_v1') || [];
      const h2 = l2.find((h) => h.id === habit.id);
      if (h2) { h2.history = h2.history || {}; if (prev === undefined) delete h2.history[dateKey]; else h2.history[dateKey] = prev; storeSet('habits_v1', l2); }
    });
    return { ok: true, summary: 'Logged "' + habit.name + '" as ' + (input.done ? 'done' : 'not done') + ' for ' + dateKey + '.', activityId };
  }

  const ADD_GOAL_NOTE_TOOL = {
    name: 'add_goal_note', description: 'Attach a short note to a longterm goal.',
    input_schema: { type: 'object', properties: {
      goal_id: { type: 'string', description: 'The goal\'s id or exact title.' },
      note: { type: 'string', description: 'The note text.' },
    }, required: ['goal_id', 'note'] },
  };
  async function exec_add_goal_note(input) {
    const list = storeGet('longterm_goals_v1') || [];
    const needle = (input.goal_id || '').trim().toLowerCase();
    const goal = list.find((g) => g.id === input.goal_id) || list.find((g) => (g.title || '').trim().toLowerCase() === needle);
    if (!goal) return { ok: false, summary: 'No goal matching "' + input.goal_id + '" found.' };
    goal.notes = goal.notes || [];
    goal.notes.push({ text: input.note, at: new Date().toISOString() });
    const noteIdx = goal.notes.length - 1;
    storeSet('longterm_goals_v1', list);
    const activityId = logAssistantActivity('add_goal_note', 'Added note to goal "' + goal.title + '"', async () => {
      const l2 = storeGet('longterm_goals_v1') || [];
      const g2 = l2.find((g) => g.id === goal.id);
      if (g2 && Array.isArray(g2.notes)) { g2.notes.splice(noteIdx, 1); storeSet('longterm_goals_v1', l2); }
    });
    return { ok: true, summary: 'Added a note to "' + goal.title + '".', activityId };
  }

  // ---------- Persistent memory (4.3) ----------
  const MEMORY_KEY = 'eq.assistant.memory';
  const MEMORY_CAP = 30;
  function getMemory() { const v = storeGet(MEMORY_KEY); return Array.isArray(v) ? v : []; }
  function setMemory(list) { storeSet(MEMORY_KEY, list); }
  // Injected into the system prompt of every assistant call (chat and
  // Smart Capture both) -- the whole point of persistent memory is that it
  // isn't something you have to re-explain per entry point.
  function getMemoryContextText() {
    const list = getMemory();
    if (!list.length) return '';
    return 'REMEMBERED FACTS ABOUT THE USER:\n' + list.map((m) => '- ' + m.fact + ' (id: ' + m.id + ')').join('\n') + '\n';
  }

  const REMEMBER_TOOL = {
    name: 'remember',
    description: 'Save a durable fact or preference about the user for future conversations (e.g. "prefers metric units", "training split is push/pull/legs", "sleep target is 7.5h"). Only for things that should persist long-term -- one-off details already captured by another tool (a single weight reading, a single task) don\'t belong here.',
    input_schema: { type: 'object', properties: { fact: { type: 'string', description: 'The fact, written concisely in third person, e.g. "Prefers direct, no-fluff advice."' } }, required: ['fact'] },
  };
  async function exec_remember(input) {
    const list = getMemory();
    const id = genId('m');
    list.push({ id, fact: input.fact, created: new Date().toISOString() });
    // Oldest-first cap, same drop-the-oldest precedent as the activity log
    // -- a fact remembered 6 months ago is the one most likely stale.
    while (list.length > MEMORY_CAP) list.shift();
    setMemory(list);
    const activityId = logAssistantActivity('remember', 'Remembered: ' + input.fact, async () => {
      const l2 = getMemory();
      const i = l2.findIndex((m) => m.id === id);
      if (i !== -1) { l2.splice(i, 1); setMemory(l2); }
    });
    return { ok: true, summary: 'Remembered: ' + input.fact, activityId };
  }

  const FORGET_TOOL = {
    name: 'forget',
    description: 'Remove a previously remembered fact -- use when the user corrects or contradicts something already remembered. The current remembered facts (with ids) are listed in context.',
    input_schema: { type: 'object', properties: { fact_id: { type: 'string', description: 'The id of the memory entry to remove.' } }, required: ['fact_id'] },
  };
  async function exec_forget(input) {
    const list = getMemory();
    const idx = list.findIndex((m) => m.id === input.fact_id);
    if (idx === -1) return { ok: false, summary: 'No remembered fact matching "' + input.fact_id + '" found.' };
    const removed = list[idx];
    list.splice(idx, 1);
    setMemory(list);
    const activityId = logAssistantActivity('forget', 'Forgot: ' + removed.fact, async () => {
      const l2 = getMemory();
      l2.push(removed);
      setMemory(l2);
    });
    return { ok: true, summary: 'Forgot: ' + removed.fact, activityId };
  }

  const TOOL_REGISTRY = {
    add_task: { schema: ADD_TASK_TOOL, confirmMode: 'never', execute: exec_add_task },
    complete_task: { schema: COMPLETE_TASK_TOOL, confirmMode: 'never', execute: exec_complete_task },
    push_task_to_tomorrow: { schema: PUSH_TASK_TOOL, confirmMode: 'never', execute: exec_push_task_to_tomorrow },
    log_weight: { schema: LOG_WEIGHT_TOOL, confirmMode: (input) => !!weightEntryFor(input.date || fmtDateKey(new Date())), execute: exec_log_weight },
    log_sleep: { schema: LOG_SLEEP_TOOL, confirmMode: (input) => !!sleepEntryFor(input.date || activeDateKeyLocal()), execute: exec_log_sleep },
    log_contact: { schema: LOG_CONTACT_TOOL, confirmMode: 'never', execute: exec_log_contact },
    add_shopping_item: { schema: ADD_SHOPPING_ITEM_TOOL, confirmMode: 'never', execute: exec_add_shopping_item },
    add_book: { schema: ADD_BOOK_TOOL, confirmMode: 'never', execute: exec_add_book },
    check_stack_item: { schema: CHECK_STACK_ITEM_TOOL, confirmMode: 'never', execute: exec_check_stack_item },
    log_habit: { schema: LOG_HABIT_TOOL, confirmMode: (input) => { const h = (storeGet('habits_v1') || []).find((x) => (x.name || '').trim().toLowerCase() === (input.habit_name || '').trim().toLowerCase()); const dk = input.date || activeDateKeyLocal(); return !!(h && h.history && h.history[dk] !== undefined); }, execute: exec_log_habit },
    add_goal_note: { schema: ADD_GOAL_NOTE_TOOL, confirmMode: 'never', execute: exec_add_goal_note },
    remember: { schema: REMEMBER_TOOL, confirmMode: 'never', execute: exec_remember },
    forget: { schema: FORGET_TOOL, confirmMode: 'never', execute: exec_forget },
  };

  function toolNeedsConfirm(name, input) {
    const t = TOOL_REGISTRY[name];
    if (!t) return false;
    if (t.confirmMode === 'always') return true;
    if (typeof t.confirmMode === 'function') { try { return !!t.confirmMode(input); } catch (e) { return false; } }
    return false;
  }

  // ============================================================
  // 6.8 System health strip -- a single shared key each integration's own
  // fetch success/catch path calls into, so Settings' health strip and the
  // Dashboard's failure chip have one place to read from instead of five
  // different pages' worth of scattered, differently-shaped state.
  // ============================================================
  const INTEGRATIONS_HEALTH_KEY = 'eq.integrations.health_v1';
  function recordIntegrationHealth(name, ok) {
    const all = storeGet(INTEGRATIONS_HEALTH_KEY) || {};
    const now = new Date().toISOString();
    const entry = all[name] || {};
    entry.lastAttemptAt = now;
    if (ok) { entry.lastSuccessAt = now; entry.lastError = null; }
    else { entry.lastError = now; }
    all[name] = entry;
    storeSet(INTEGRATIONS_HEALTH_KEY, all);
  }
  function getIntegrationsHealth() { return storeGet(INTEGRATIONS_HEALTH_KEY) || {}; }

  return {
    TOOL_REGISTRY,
    toolNeedsConfirm,
    logAssistantActivity,
    undoAssistantActivity,
    genId,
    storeGet,
    storeSet,
    fmtDateKey,
    activeDateKeyLocal,
    tomorrowDateKeyLocal,
    MEMORY_KEY,
    MEMORY_CAP,
    getMemory,
    setMemory,
    getMemoryContextText,
    recordIntegrationHealth,
    getIntegrationsHealth,
    INTEGRATIONS_HEALTH_KEY,
  };
})();
