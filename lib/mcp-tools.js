// MCP tool definitions -- server-side equivalents of assistant-tools.js's
// TOOL_REGISTRY, operating on the Supabase-synced copies of the same
// localStorage domains instead of localStorage directly (this runs in a
// Vercel function, which has no browser). Naming mirrors assistant-tools.js
// where there's a direct equivalent, since that's already a proven design
// for "let an LLM act on this app's data."
//
// Every write goes through mcp-data.js's fetchMergeUpsert -- fetch the
// current whole blob for that app section, mutate just the one localStorage
// key this tool cares about, upsert the whole blob back. Never a partial
// write (see mcp-data.js's own comment for why that matters).
//
// Date params: this runs server-side with no reliable notion of the user's
// local time (the rest of the app uses a 6am-boundary "active date" that
// only makes sense client-side). Tools that default to "today" use the
// server's UTC date when no explicit date is given -- fine for daytime use,
// but pass an explicit YYYY-MM-DD near midnight for precision.
import { z } from 'zod';
import { readDomain, fetchMergeUpsert } from './mcp-data.js';

function ok(data) { return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }; }
function fail(message) { return { content: [{ type: 'text', text: message }], isError: true }; }
function genId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
const DATE_DESC = 'YYYY-MM-DD. Defaults to today (server UTC date) if omitted.';

const TASK_PRIORITY_CAP_P1 = 3;

export const TOOLS = [
  // ---------- Tasks ----------
  {
    name: 'get_tasks',
    description: "Get the task list for a given day.",
    inputSchema: { date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ date }) => {
      const dateKey = date || todayKey();
      const blob = await readDomain('goals');
      return ok({ date: dateKey, tasks: blob['goals:' + dateKey] || [] });
    },
  },
  {
    name: 'add_task',
    description: 'Add a new task to a given day\'s list. Max 3 P1 (must-happen-today) tasks per day -- demoted to P2 automatically if that cap is already hit.',
    inputSchema: {
      title: z.string(),
      date: z.string().optional().describe(DATE_DESC),
      priority: z.enum(['P1', 'P2', 'P3']).optional().describe('Default P2.'),
    },
    handler: async ({ title, date, priority }) => {
      const dateKey = date || todayKey();
      let created;
      await fetchMergeUpsert('goals', (blob) => {
        const list = blob['goals:' + dateKey] || [];
        let p = priority || 'P2';
        if (p === 'P1' && list.filter((t) => (t.priority || 'P2') === 'P1').length >= TASK_PRIORITY_CAP_P1) p = 'P2';
        created = { id: genId('t'), text: title, done: false, priority: p, source: 'mcp' };
        list.push(created);
        blob['goals:' + dateKey] = list;
      });
      return ok({ added: created });
    },
  },
  {
    name: 'complete_task',
    description: "Mark a task done, given the day it's on and its id (from get_tasks).",
    inputSchema: { date: z.string().describe(DATE_DESC), task_id: z.string() },
    handler: async ({ date, task_id }) => {
      let found = false;
      await fetchMergeUpsert('goals', (blob) => {
        const list = blob['goals:' + date] || [];
        const task = list.find((t) => t.id === task_id);
        if (task) { task.done = true; found = true; }
      });
      return found ? ok({ completed: task_id }) : fail('No task with id "' + task_id + '" found on ' + date + '.');
    },
  },
  {
    name: 'push_task_to_tomorrow',
    description: 'Move a task from one day\'s list to another (typically today to tomorrow).',
    inputSchema: { from_date: z.string().describe(DATE_DESC), to_date: z.string(), task_id: z.string() },
    handler: async ({ from_date, to_date, task_id }) => {
      let moved = null;
      await fetchMergeUpsert('goals', (blob) => {
        const list = blob['goals:' + from_date] || [];
        const idx = list.findIndex((t) => t.id === task_id);
        if (idx === -1) return;
        moved = list[idx];
        list.splice(idx, 1);
        blob['goals:' + from_date] = list;
        const toList = blob['goals:' + to_date] || [];
        toList.push(moved);
        blob['goals:' + to_date] = toList;
      });
      return moved ? ok({ moved: moved, to: to_date }) : fail('No task with id "' + task_id + '" found on ' + from_date + '.');
    },
  },

  // ---------- Habits ----------
  {
    name: 'get_habits',
    description: 'Get all tracked habits and their completion history.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('habits');
      return ok({ habits: blob.habits_v1 || [] });
    },
  },
  {
    name: 'log_habit',
    description: 'Mark a habit done or not-done for a day.',
    inputSchema: { habit_name: z.string(), done: z.boolean(), date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ habit_name, done, date }) => {
      const dateKey = date || todayKey();
      let found = false;
      await fetchMergeUpsert('habits', (blob) => {
        const list = blob.habits_v1 || [];
        const habit = list.find((h) => (h.name || '').trim().toLowerCase() === habit_name.trim().toLowerCase());
        if (!habit) return;
        habit.history = habit.history || {};
        if (done) habit.history[dateKey] = true; else delete habit.history[dateKey];
        blob.habits_v1 = list;
        found = true;
      });
      return found ? ok({ habit: habit_name, date: dateKey, done }) : fail('No habit named "' + habit_name + '" found.');
    },
  },

  // ---------- Weight ----------
  {
    name: 'get_weight',
    description: 'Get recent weight entries and the goal weight.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('po-coach');
      const entries = (blob.po_coach_weights || []).slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      return ok({ entries: entries.slice(-30), goal_weight: blob.po_coach_goal_weight != null ? Number(blob.po_coach_goal_weight) : null });
    },
  },
  {
    name: 'log_weight',
    description: 'Log a body-weight reading, replacing any existing entry for that day.',
    inputSchema: { kg: z.number(), date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ kg, date }) => {
      const dateKey = date || todayKey();
      await fetchMergeUpsert('po-coach', (blob) => {
        const arr = blob.po_coach_weights || [];
        const existing = arr.find((e) => e.dateKey === dateKey);
        if (existing) existing.weight = kg;
        else { arr.push({ dateKey, weight: kg }); arr.sort((a, b) => a.dateKey.localeCompare(b.dateKey)); }
        blob.po_coach_weights = arr;
      });
      return ok({ logged: kg, date: dateKey });
    },
  },

  // ---------- Workouts (read-only) ----------
  {
    name: 'get_workouts',
    description: 'Get logged workout sets, optionally filtered to one day.',
    inputSchema: { date: z.string().optional().describe(DATE_DESC + ' Omit for the last 7 days across all exercises.') },
    handler: async ({ date }) => {
      const blob = await readDomain('po-coach');
      const state = blob.po_coach_v1 || {};
      const exercises = state.exercises || [];
      const logs = state.logs || {};
      const cutoff = date ? null : new Date(Date.now() - 7 * 86400000);
      const out = [];
      for (const ex of exercises) {
        const sets = (logs[ex.id] || []).filter((s) => {
          if (date) return String(s.date || '').slice(0, 10) === date;
          return new Date(s.date) >= cutoff;
        });
        if (sets.length) out.push({ exercise: ex.name, unit: state.units || 'kg', sets });
      }
      return ok({ workouts: out });
    },
  },

  // ---------- Calories ----------
  {
    name: 'get_calories',
    description: 'Get logged daily calorie totals.',
    inputSchema: { date: z.string().optional().describe(DATE_DESC + ' Omit for the last 7 days.') },
    handler: async ({ date }) => {
      const blob = await readDomain('po-coach');
      const entries = (blob.calorie_log_v1 || []).slice().sort((a, b) => a.dateKey.localeCompare(b.dateKey));
      if (date) return ok({ entry: entries.find((e) => e.dateKey === date) || null });
      const cutoffKey = todayKey();
      return ok({ entries: entries.slice(-7), today: entries.find((e) => e.dateKey === cutoffKey) || null });
    },
  },
  {
    name: 'log_calories',
    description: 'Log total calorie intake for a day, replacing any existing entry for that day.',
    inputSchema: { kcal: z.number(), date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ kcal, date }) => {
      const dateKey = date || todayKey();
      await fetchMergeUpsert('po-coach', (blob) => {
        const arr = blob.calorie_log_v1 || [];
        const existing = arr.find((e) => e.dateKey === dateKey);
        if (existing) existing.kcal = kcal;
        else { arr.push({ dateKey, kcal }); arr.sort((a, b) => a.dateKey.localeCompare(b.dateKey)); }
        blob.calorie_log_v1 = arr;
      });
      return ok({ logged: kcal, date: dateKey });
    },
  },

  // ---------- Health (WHOOP snapshot, read-only) ----------
  {
    name: 'get_health',
    description: 'Get the most recently synced WHOOP/Apple Health summary (recovery, sleep, HRV, RHR, strain, steps). This is a snapshot as of whenever health.html was last opened on any device, not a live pull -- check the "at" field for its actual timestamp.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('health');
      return ok(blob['eq.health.summary'] || {});
    },
  },

  // ---------- Supplement stack ----------
  {
    name: 'get_stack',
    description: "Get the supplement stack and today's taken/not-taken status.",
    inputSchema: { date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ date }) => {
      const dateKey = date || todayKey();
      const blob = await readDomain('health');
      const items = blob['stack:items'] || [];
      const taken = blob['stack:taken:' + dateKey] || {};
      const low = blob['stack:low'] || [];
      return ok({
        date: dateKey,
        items: items.map((it) => ({ id: it.id, name: it.name, dose: it.dose, window: it.window, taken: !!taken[it.id], running_low: low.indexOf(it.id) !== -1 })),
      });
    },
  },
  {
    name: 'check_stack_item',
    description: 'Mark a supplement/stack item as taken for a day.',
    inputSchema: { item_name: z.string().describe('Matched case-insensitively, substring allowed.'), date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ item_name, date }) => {
      const dateKey = date || todayKey();
      let found = null;
      await fetchMergeUpsert('health', (blob) => {
        const items = blob['stack:items'] || [];
        const needle = item_name.trim().toLowerCase();
        found = items.find((i) => (i.name || '').trim().toLowerCase() === needle)
          || items.find((i) => (i.name || '').trim().toLowerCase().indexOf(needle) !== -1);
        if (!found) return;
        const taken = blob['stack:taken:' + dateKey] || {};
        taken[found.id] = Date.now();
        blob['stack:taken:' + dateKey] = taken;
      });
      return found ? ok({ checked: found.name, date: dateKey }) : fail('No stack item matching "' + item_name + '" found.');
    },
  },

  // ---------- Finance (read-only, raw) ----------
  {
    name: 'get_finance_summary',
    description: 'Get raw finance data (net worth history, subscriptions, budgets, wishlist, incoming orders) as synced from the app -- returned as-is, not reshaped.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('finance');
      return ok(blob);
    },
  },

  // ---------- Checklists (read-only) ----------
  {
    name: 'get_checklists',
    description: "Get the morning/mid-day/evening checklists and today's completion status.",
    inputSchema: { date: z.string().optional().describe(DATE_DESC) },
    handler: async ({ date }) => {
      const dateKey = date || todayKey();
      const blob = await readDomain('goals');
      const out = {};
      for (const id of ['morning', 'midday', 'evening']) {
        const items = blob['checklist:items:' + id] || [];
        const done = blob['checklist:done:' + id + ':' + dateKey] || {};
        out[id] = items.map((it) => ({ text: it.text, done: !!done[it.id] }));
      }
      return ok({ date: dateKey, checklists: out });
    },
  },

  // ---------- Longterm goals ----------
  {
    name: 'get_goals',
    description: 'Get active (non-archived) longterm goals.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('goals');
      const list = (blob.longterm_goals_v1 || []).filter((g) => !g.archived);
      return ok({ goals: list });
    },
  },
  {
    name: 'add_goal_note',
    description: 'Attach a short note to a longterm goal, matched by id or exact title.',
    inputSchema: { goal_id_or_title: z.string(), note: z.string() },
    handler: async ({ goal_id_or_title, note }) => {
      let found = null;
      await fetchMergeUpsert('goals', (blob) => {
        const list = blob.longterm_goals_v1 || [];
        found = list.find((g) => g.id === goal_id_or_title)
          || list.find((g) => (g.title || '').trim().toLowerCase() === goal_id_or_title.trim().toLowerCase());
        if (!found) return;
        found.notes = found.notes || [];
        found.notes.push({ text: note, at: new Date().toISOString() });
        blob.longterm_goals_v1 = list;
      });
      return found ? ok({ goal: found.title, note }) : fail('No goal matching "' + goal_id_or_title + '" found.');
    },
  },

  // ---------- Projects (read-only) ----------
  {
    name: 'get_projects',
    description: 'Get active (non-archived) projects.',
    inputSchema: {},
    handler: async () => {
      const blob = await readDomain('goals');
      const list = (blob.projects_v1 || []).filter((p) => !p.archived);
      return ok({ projects: list });
    },
  },

  // ---------- Calendar (Equavia's own, NOT Google Calendar) ----------
  {
    name: 'get_calendar_events',
    description: "Get events from Equavia's own local calendar. This is NOT live Google Calendar -- it's a separate, app-internal event list (Google Calendar syncing only happens client-side, live, and isn't reachable from here).",
    inputSchema: { date: z.string().optional().describe(DATE_DESC + ' Omit to get all upcoming events.') },
    handler: async ({ date }) => {
      const blob = await readDomain('goals');
      let list = blob.local_cal_events_v1 || [];
      if (date) list = list.filter((e) => e.dateKey === date);
      return ok({ events: list });
    },
  },
  {
    name: 'add_calendar_event',
    description: "Add an event to Equavia's own local calendar. This does NOT create a real Google Calendar event -- say so plainly if the user seems to expect that; Google Calendar sync only happens client-side and can't be triggered from here.",
    inputSchema: {
      title: z.string(),
      date: z.string().describe('YYYY-MM-DD'),
      time: z.string().optional().describe('HH:MM, 24h. Omit for an all-day event.'),
      duration_min: z.number().optional().describe('Defaults to 30.'),
    },
    handler: async ({ title, date, time, duration_min }) => {
      let created;
      await fetchMergeUpsert('goals', (blob) => {
        const list = blob.local_cal_events_v1 || [];
        created = { id: genId('ce'), title, dateKey: date, time: time || null, duration: Number(duration_min) > 0 ? Number(duration_min) : 30, source: 'mcp' };
        list.push(created);
        blob.local_cal_events_v1 = list;
      });
      return ok({ added: created });
    },
  },
];
