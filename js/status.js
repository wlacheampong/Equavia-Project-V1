// Training programme status -- pure functions over docs/programme.json.
// "Phase" here is the training programme's P0-P4 periodisation (see
// programme.json / docs/master-plan-v2.md), not a Fey redesign phase.
//
// Every function takes `date` explicitly (a Date or a 'YYYY-MM-DD' string)
// instead of reading the clock itself, so a test can pass any fixed date
// and get a deterministic result. No DOM access -- this file only reads
// programme.json and does date arithmetic.
//
// Unlike the other js/*.js files (IIFE + window.Eq*), this one uses real
// ES `export` so it can be imported directly in tests. Load it with
// <script type="module"> if it's ever wired into a page.

import programme from '../docs/programme.json' with { type: 'json' };
import mcpShapes from '../docs/mcp-shapes.json' with { type: 'json' };

// mcpShapes._indicator_lifts carries a sibling `_note` string alongside the
// real A1/A2/B1/A5 entries (it's a documentation comment embedded in the
// data file, not a lift) -- filtered out here once so nothing downstream
// has to remember to skip underscore-prefixed keys itself.
export const INDICATOR_LIFTS = Object.entries(mcpShapes._indicator_lifts).filter(([id]) => !id.startsWith('_'));

const MS_PER_DAY = 86400000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Judgement calls with no source in programme.json or mcp-shapes.json --
// there's no documented figure for either, so they live here rather than
// being invented as fake "data".
const WEIGHT_FLAT_TOLERANCE_KG = 0.2;
const STALL_SESSION_COUNT = 3;

// Trailing-week-vs-prior-week comparison, both judgement calls: the 5% flat
// band matches health.html's own TREND_FLAT_BAND_PCT (health.html:949) for
// consistency, but the minimum-days-per-window figure has no source anywhere
// -- 3 was picked so a couple of missed WHOOP syncs don't blank the trend.
const RECOVERY_TREND_FLAT_BAND_PCT = 5;
const RECOVERY_TREND_MIN_DAYS = 3;

// Busy Mode's reduced schedule (2 sessions/week, no LEGS, first 4 exercises
// only) mirrors master-plan-v2.md §3.8's Placement Block Contingency; the
// 7-day expiry itself is a specified duration, not derived from that section.
const BUSY_MODE_DAYS = 7;

function toEpochDay(date) {
  if (date instanceof Date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const [y, m, d] = String(date).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatEpochDay(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// workout set dates are full ISO timestamps ("2026-07-30T11:00:00.000Z"),
// not the plain YYYY-MM-DD toEpochDay expects, so route them through Date first.
function epochDayFromIso(iso) {
  return toEpochDay(new Date(iso));
}

function parseLeadingNumber(str) {
  if (typeof str !== 'string') return null;
  const m = str.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function findExerciseSpec(id) {
  for (const session of programme.sessions) {
    const ex = session.exercises.find((e) => e.id === id);
    if (ex) return ex;
  }
  return null;
}

function previousCheckpoint(nextCp) {
  if (!nextCp) return null;
  const nextDay = toEpochDay(nextCp.date);
  const earlier = programme.checkpoints
    .filter((c) => toEpochDay(c.date) < nextDay)
    .sort((a, b) => toEpochDay(b.date) - toEpochDay(a.date));
  return earlier[0] || null;
}

// Most recent logged session for `exerciseName` at or before `day` (epoch day, ms).
function latestSession(workoutsList, exerciseName, day) {
  const entry = workoutsList.find((w) => w.exercise === exerciseName);
  if (!entry) return null;
  const sessions = entry.sets
    .filter((s) => epochDayFromIso(s.date) <= day)
    .sort((a, b) => epochDayFromIso(a.date) - epochDayFromIso(b.date));
  return sessions.length ? sessions[sessions.length - 1] : null;
}

// Length of the unbroken run of identical `weight` values ending at `day` (0 if no sessions).
function stalledStreak(workoutsList, exerciseName, day) {
  const entry = workoutsList.find((w) => w.exercise === exerciseName);
  if (!entry) return 0;
  const sessions = entry.sets
    .filter((s) => epochDayFromIso(s.date) <= day)
    .sort((a, b) => epochDayFromIso(b.date) - epochDayFromIso(a.date)); // newest first
  if (!sessions.length) return 0;
  const latestWeight = sessions[0].weight;
  let streak = 0;
  for (const s of sessions) {
    if (s.weight !== latestWeight) break;
    streak++;
  }
  return streak;
}

// Real trend from recovery_log_v1's daily history: trailing 7-day average vs
// the 7 days before that (same two-window comparison health.html itself uses
// for weight, weight7dAvgChange) -- not health.html's own recoveryTrend
// field, which is "today vs one 7-day average", a single snapshot rather
// than a trend over time. Returns null (not a guess) if either window has
// fewer than RECOVERY_TREND_MIN_DAYS entries.
function recoveryTrendFromLog(recoveryLogList, day) {
  const sorted = recoveryLogList
    .filter((e) => e && typeof e.recovery === 'number' && e.dateKey)
    .map((e) => ({ recovery: e.recovery, day: toEpochDay(e.dateKey) }))
    .filter((e) => e.day <= day)
    .sort((a, b) => a.day - b.day);

  const recentWindow = sorted.filter((e) => e.day > day - 7 * MS_PER_DAY);
  const priorWindow = sorted.filter((e) => e.day <= day - 7 * MS_PER_DAY && e.day > day - 14 * MS_PER_DAY);
  if (recentWindow.length < RECOVERY_TREND_MIN_DAYS || priorWindow.length < RECOVERY_TREND_MIN_DAYS) return null;

  const avg = (list) => list.reduce((sum, e) => sum + e.recovery, 0) / list.length;
  const recentAvg = avg(recentWindow);
  const priorAvg = avg(priorWindow);
  if (priorAvg === 0) return null;

  const diffPct = ((recentAvg - priorAvg) / priorAvg) * 100;
  const trend = diffPct > RECOVERY_TREND_FLAT_BAND_PCT ? 'up' : diffPct < -RECOVERY_TREND_FLAT_BAND_PCT ? 'down' : 'flat';
  return { trend, recentAvg, priorAvg };
}

export function currentPhase(date) {
  const day = toEpochDay(date);
  return programme.phases.find((p) => day >= toEpochDay(p.start) && day <= toEpochDay(p.end)) || null;
}

// isBusy is a plain boolean, decoupled from *why* -- callers derive it from
// busyModeStatus(...).isBusy, a manual override, or anything else. When busy:
// LEGS is dropped entirely, and the remaining sessions are truncated to their
// first 4 exercises (master-plan-v2.md §3.8 Placement Block Contingency).
export function todaySession(date, isBusy) {
  const dow = WEEKDAYS[new Date(toEpochDay(date)).getUTCDay()];
  const session = programme.sessions.find((s) => s.day === dow) || null;
  if (!session || !isBusy) return session;
  if (session.id === 'LEGS') return null;
  return { ...session, exercises: session.exercises.slice(0, 4) };
}

// busyModeStatus(armedAt, date)
//
// Pure read of Busy Mode state given the raw `armed_at` value (whatever a
// caller loaded from the Supabase app_state row keyed 'busy_mode' --
// { armed_at, expires_at }, stored there rather than localStorage so it's
// authoritative across devices immediately, not on the next page's sync).
//
// Deliberately recomputes expiry from `armed_at` + BUSY_MODE_DAYS rather than
// trusting a stored `expires_at` -- the row keeps that field for convenience/
// inspection, but the source of truth here is armed_at, so a caller can never
// get a stale answer by passing a stale expires_at. Three states:
//   - 'off'     : armedAt is null/undefined.
//   - 'armed'   : within BUSY_MODE_DAYS of armedAt.
//   - 'expired' : past it. isBusy stays true here too -- an expired Busy Mode
//                 does NOT silently revert to the full programme, it keeps
//                 behaving as armed until something re-arms or clears it.
//                 evaluateFlags surfaces this as a flag asking which.
export function busyModeStatus(armedAt, date) {
  if (!armedAt) return { state: 'off', isBusy: false, armedAt: null, expiresAt: null };

  const day = toEpochDay(date);
  const armedDay = toEpochDay(new Date(armedAt));
  const expiresDay = armedDay + BUSY_MODE_DAYS * MS_PER_DAY;
  const expired = day >= expiresDay;

  return {
    state: expired ? 'expired' : 'armed',
    isBusy: true,
    armedAt: formatEpochDay(armedDay),
    expiresAt: formatEpochDay(expiresDay),
  };
}

export function phaseProgress(date) {
  const phase = currentPhase(date);
  if (!phase) return null;

  const day = toEpochDay(date);
  const start = toEpochDay(phase.start);
  const end = toEpochDay(phase.end);
  const daysTotal = Math.round((end - start) / MS_PER_DAY) + 1;
  const daysElapsed = Math.round((day - start) / MS_PER_DAY) + 1;
  const fraction = Math.min(1, Math.max(0, daysElapsed / daysTotal));

  return {
    phase: phase.id,
    daysElapsed,
    daysTotal,
    daysRemaining: daysTotal - daysElapsed,
    fraction,
  };
}

export function nextCheckpoint(date) {
  const day = toEpochDay(date);
  const upcoming = programme.checkpoints
    .filter((c) => toEpochDay(c.date) >= day)
    .sort((a, b) => toEpochDay(a.date) - toEpochDay(b.date));
  return upcoming[0] || null;
}

export function dailyTargets(date, isBusy) {
  const phase = currentPhase(date);
  if (!phase) return null;

  const session = todaySession(date, isBusy);
  const isTrainingDay = session !== null;
  const baseKcal = isTrainingDay ? phase.kcal_train : phase.kcal_rest;

  return {
    date,
    phase: phase.id,
    isTrainingDay,
    session: session ? session.id : null,
    kcal: isBusy && baseKcal !== null ? baseKcal + programme.busy_mode_kcal_adjustment : baseKcal,
    protein_g: phase.protein_g,
    steps: isBusy ? programme.busy_mode_steps : phase.steps,
  };
}

// evaluateFlags(workouts, health, measurements, date, isBusy)
//
// Inputs:
//   workouts     -- the real get_workouts shape: { workouts: [{ exercise, unit, sets }] }.
//                    Missing/malformed input is treated as no data, not an error.
//   health       -- the real get_health shape (see mcp-shapes.json). May be null/undefined.
//   measurements -- NOT an existing MCP shape. Shape here:
//                    [{ date, weight, waist, arm_flexed, chest, session_feel }], every field
//                    but `date` optional per entry. weight/waist are logged weekly, arm_flexed/
//                    chest monthly (per master-plan-v2.md §8) -- so most entries will only have
//                    a subset of fields, that's expected, not malformed input. weight/waist have
//                    a real source as of the po_coach_weights conversion in status.html (waist
//                    added there alongside weight, same entry); arm_flexed/chest still have no
//                    source anywhere. session_feel ('great'|'fine'|'motions') has a real source
//                    too, gym.html's session_feel_log_v1, but lives in a separate log keyed by
//                    date rather than sharing weight/waist's entry -- status.html's converter
//                    merges the two logs by date before this function ever sees them. Pass [] or
//                    undefined until a real source exists -- every rule that reads it
//                    degrades to "skip", not throw.
//   date         -- the evaluation date (Date or 'YYYY-MM-DD'), same convention as every
//                    other function in this file.
//   isBusy       -- suppresses all missed-session flags when true. Independent of
//                    `busyModeState` below -- pass busyModeStatus(...).isBusy if that's
//                    what's driving it, but this function doesn't assume that's the source.
//   busyModeState -- optional, the object returned by busyModeStatus(armedAt, date).
//                    Only used to raise the "Busy Mode expired" flag when .state is
//                    'expired'; omit it and that one rule is simply skipped.
//   recoveryLog  -- optional, recovery_log_v1's shape: [{ dateKey, recovery }], the
//                    append-only daily history (NOT health.recoveryTrend, which is a
//                    single snapshot field -- a real trend needs the history). Omit it
//                    and the recovery-declining rule is simply skipped.
//
// Every rule "skips" (adds nothing) rather than flags when it lacks enough data to be
// confident -- e.g. an indicator lift with no logged history yet (Weighted chin-up and
// Hammer curl don't appear in the log until 2026-08-03, per mcp-shapes.json) is not a
// stall, it's an absence, so it's left alone rather than reported as unchanged. The one
// exception is the pre-start checklist rule, which fires unconditionally while
// date < phases[0].start precisely because there's no "done" data to check against.
export function evaluateFlags(workouts, health, measurements, date, isBusy, busyModeState, recoveryLog) {
  const day = toEpochDay(date);
  const flags = [];
  const workoutsList = (workouts && Array.isArray(workouts.workouts)) ? workouts.workouts : [];
  const measurementsList = Array.isArray(measurements) ? measurements : [];
  const recoveryLogList = Array.isArray(recoveryLog) ? recoveryLog : [];
  const phase = currentPhase(date);

  // Rule: pre-start checklist, while date is before the programme even starts.
  // Unconditional while in this window -- there's no "purchased" flag anywhere
  // (see programme.json's pre_start_checklist._note), so this can't diff against
  // what's actually been bought, only remind that the list exists.
  if (day < toEpochDay(programme.phases[0].start)) {
    const items = programme.pre_start_checklist.items;
    flags.push({
      severity: 'amber',
      title: items.length + ' one-off purchase(s) needed before start',
      detail: items.map((i) => i.item + ' (' + i.cost + ') -- ' + i.purpose).join(' | '),
      action: 'Buy before ' + programme.phases[0].start + '.',
    });
  }

  // Rule: indicator lift unchanged for 3+ sessions.
  for (const [id, exerciseName] of INDICATOR_LIFTS) {
    const streak = stalledStreak(workoutsList, exerciseName, day);
    if (streak >= STALL_SESSION_COUNT) {
      const latest = latestSession(workoutsList, exerciseName, day);
      flags.push({
        severity: 'amber',
        title: exerciseName + ' stalled',
        detail: exerciseName + ' has been ' + latest.weight + workoutsList.find((w) => w.exercise === exerciseName).unit +
          ' for the last ' + streak + ' sessions.',
        action: 'Check technique, recovery, and consider a small deload on this lift (' + id + ').',
      });
    }
  }

  // Rule: behind linear pace to the next checkpoint.
  // Only evaluated for lifts with a plain numeric kg starting load and target -- B1
  // (Weighted chin-up) starts from "BW" and its target is added-weight-over-bodyweight,
  // which isn't on the same scale as the raw kg logged in get_workouts, so it's skipped
  // rather than compared on a mismatched basis.
  const nextCp = nextCheckpoint(date);
  if (nextCp) {
    const prevCp = previousCheckpoint(nextCp);
    for (const target of nextCp.indicator_lifts) {
      const exerciseName = mcpShapes._indicator_lifts[target.id];
      if (!exerciseName) continue;
      const latest = latestSession(workoutsList, exerciseName, day);
      if (!latest) continue; // no history -- can't judge pace, not "behind"

      const spec = findExerciseSpec(target.id);
      const startLoad = spec ? parseLeadingNumber(spec.start_load) : null;
      const prevTarget = prevCp ? prevCp.indicator_lifts.find((t) => t.id === target.id) : null;

      const intervalStartDay = prevCp ? toEpochDay(prevCp.date) : toEpochDay(programme.phases[0].start);
      const intervalStartValue = prevCp
        ? (prevTarget ? parseLeadingNumber(prevTarget.target) : null)
        : startLoad;
      const intervalEndDay = toEpochDay(nextCp.date);
      const intervalEndValue = parseLeadingNumber(target.target);

      if (intervalStartValue === null || intervalEndValue === null || intervalEndDay <= intervalStartDay) continue;

      const fraction = Math.min(1, Math.max(0, (day - intervalStartDay) / (intervalEndDay - intervalStartDay)));
      const expected = intervalStartValue + fraction * (intervalEndValue - intervalStartValue);

      if (latest.weight < expected) {
        flags.push({
          severity: 'amber',
          title: exerciseName + ' behind pace',
          detail: exerciseName + ' is at ' + latest.weight + 'kg, expected roughly ' + expected.toFixed(1) +
            'kg by now to reach ' + target.target + ' at ' + nextCp.label + ' (' + nextCp.date + ').',
          action: 'No need to force it -- reassess if the gap is still there closer to the checkpoint.',
        });
      }
    }
  }

  // Rule: sessions missed within the window actually covered by `workouts`.
  // Inferred the same way mcp-shapes.json documents it: a scheduled training day
  // (Mon/Wed/Fri per programme.json sessions) with zero logged sets. The window is
  // derived from the earliest and latest logged set dates present in `workouts` --
  // NOT assumed to be month-to-date, since get_workouts defaults to a 7-day window
  // and a caller passing that default would otherwise have most of the month
  // silently counted as missed. No logged sets at all means no window to derive,
  // so the rule skips rather than guessing.
  if (!isBusy) {
    const loggedDays = new Set();
    let minLogged = null;
    let maxLogged = null;
    for (const entry of workoutsList) {
      for (const s of entry.sets) {
        const d = epochDayFromIso(s.date);
        if (d > day) continue; // ignore anything logged after the evaluation date
        loggedDays.add(d);
        if (minLogged === null || d < minLogged) minLogged = d;
        if (maxLogged === null || d > maxLogged) maxLogged = d;
      }
    }
    if (minLogged !== null) {
      const scheduled = [];
      for (let d = minLogged; d <= maxLogged; d += MS_PER_DAY) {
        const dow = WEEKDAYS[new Date(d).getUTCDay()];
        if (programme.sessions.some((s) => s.day === dow)) scheduled.push(d);
      }
      const missed = scheduled.filter((d) => !loggedDays.has(d));
      const windowDays = Math.round((maxLogged - minLogged) / MS_PER_DAY) + 1;
      if (missed.length > 0) {
        flags.push({
          severity: missed.length >= 2 ? 'red' : 'amber',
          title: missed.length + ' of ' + scheduled.length + ' sessions missed, last ' + windowDays + ' days',
          detail: 'Window covers logged sets from ' + formatEpochDay(minLogged) + ' to ' + formatEpochDay(maxLogged) + '.',
          action: 'Log anything you did complete off-schedule, or plan to make up the volume this week.',
        });
      }
    }
  }

  // Rule: waist up two weeks running.
  const waistEntries = measurementsList
    .filter((e) => e.waist != null && toEpochDay(e.date) <= day)
    .sort((a, b) => toEpochDay(a.date) - toEpochDay(b.date));
  if (waistEntries.length >= 3) {
    const last3 = waistEntries.slice(-3);
    if (last3[0].waist < last3[1].waist && last3[1].waist < last3[2].waist) {
      flags.push({
        severity: 'amber',
        title: 'Waist up two weeks running',
        detail: last3.map((e) => e.date + ': ' + e.waist + 'cm').join(' -> '),
        action: 'Diagnostic rule (master-plan-v2.md §8): cut 150 kcal from training-day calories.',
      });
    }
  }

  // Rule: weight flat 3 weeks during a surplus phase.
  if (phase && phase.direction === 'surplus') {
    const weightEntries = measurementsList
      .filter((e) => e.weight != null && toEpochDay(e.date) <= day)
      .sort((a, b) => toEpochDay(a.date) - toEpochDay(b.date));
    if (weightEntries.length >= 3) {
      const last3 = weightEntries.slice(-3);
      const values = last3.map((e) => e.weight);
      const flat = Math.max(...values) - Math.min(...values) <= WEIGHT_FLAT_TOLERANCE_KG;
      if (flat) {
        flags.push({
          severity: 'amber',
          title: 'Weight flat during surplus phase',
          detail: last3.map((e) => e.date + ': ' + e.weight + 'kg').join(' -> ') + ' (' + phase.name + ')',
          action: 'Diagnostic rule (master-plan-v2.md §8): add 150 kcal to training-day calories.',
        });
      }
    }
  }

  // Rule: recovery declining over the trailing week, from recovery_log_v1's
  // actual daily history -- not health.recoveryTrend, which is a single
  // snapshot field on eq.health.summary, not a trend computed over time.
  const recoveryTrend = recoveryTrendFromLog(recoveryLogList, day);
  if (recoveryTrend && recoveryTrend.trend === 'down') {
    flags.push({
      severity: (health && typeof health.recovery === 'number' && health.recovery <= 33) ? 'red' : 'amber',
      title: 'Recovery trending down',
      detail: 'Trailing 7-day average ' + recoveryTrend.recentAvg.toFixed(0) + ' vs ' + recoveryTrend.priorAvg.toFixed(0) + ' the week before.',
      action: 'Consider dropping to Yellow/Red autoregulation per master-plan-v2.md §3.7.',
    });
  }

  // Rule: deload week active.
  if (phase) {
    const isDeloadPhase = phase.id.startsWith('D');
    const inDeloadWeek = (phase.deloads || []).some((dStr) => {
      const start = toEpochDay(dStr);
      return day >= start && day <= start + 6 * MS_PER_DAY;
    });
    if (isDeloadPhase || inDeloadWeek) {
      flags.push({
        severity: 'info',
        title: 'Deload week active',
        detail: '60% load, half sets, same exercises (' + phase.name + ').',
        action: 'Hold back on intensity -- this is scheduled, not a setback.',
      });
    }
  }

  // Rule: Busy Mode expired -- don't silently revert, ask.
  if (busyModeState && busyModeState.state === 'expired') {
    flags.push({
      severity: 'amber',
      title: 'Busy Mode expired',
      detail: 'Armed until ' + busyModeState.expiresAt + ' and not renewed. The reduced schedule ' +
        '(2 sessions/week, no LEGS, first 4 exercises, +250 kcal) is still being applied.',
      action: 'Re-arm Busy Mode for another 7 days, or turn it off to return to the full programme.',
    });
  }

  // Rule: health data over 48 hours stale.
  if (health && health.at) {
    const hoursSince = (day - new Date(health.at).getTime()) / 3600000;
    if (hoursSince > mcpShapes._gate_thresholds.stale_warning_hours) {
      flags.push({
        severity: 'red',
        title: 'Health data stale',
        detail: 'Last synced ' + hoursSince.toFixed(1) + 'h ago (' + health.at + ').',
        action: 'Open health.html on a synced device before trusting the recovery gate.',
      });
    }
  }

  const severityRank = { red: 0, amber: 1, green: 2, info: 3 };
  return flags.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
