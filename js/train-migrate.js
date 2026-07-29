// =============================================================
// One-time migration folding the old standalone Train page into the
// Fitness page's single workout log.
//
// Before: two independent stores.
//   train.html -> window.Vitality blob ("vitality_train"), day-centric:
//     { active, order:[dayKey], days:{ dayKey:{ name, type, restDay, off,
//       ex:[{ id, name, sets, reps, kg, rest, perHand, note, hist:[
//         { date:'YYYY-MM-DD', kg, sets:[{r,fail}] } ] }] } } }
//   gym.html  -> localStorage "po_coach_v1", exercise-centric:
//     { exercises:[{id,name,...}], logs:{ exerciseId:[{weight,reps,date}] } }
//
// After: one log. state.logs stays the single source of truth for every
// completed set, and the plan (day tabs, per-day exercise list) becomes
// state.plan referencing exercises by their po_coach exercise id.
//
// A train session recorded all its sets; a po_coach entry recorded only
// the top set. The unified entry is a superset -- `weight`/`reps` keep
// meaning "top set" so all existing gym code reads unchanged, and an
// optional `sets` array carries the per-set detail train had. Nothing is
// dropped in either direction.
//
// Written as a pure function over plain objects (no DOM, no storage) so
// it can be exercised directly in tests before ever running against real
// history.
// =============================================================
(function (root, factory) {
  // Loaded as a plain <script> in the app; also importable by tests, where
  // this package's "type":"module" means module/exports are absent.
  root.EqTrainMigrate = factory();
})(globalThis, function () {
  'use strict';

  function normName(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function dayKeyOf(iso) {
    return String(iso == null ? '' : iso).slice(0, 10);
  }
  function newExerciseId(name, taken) {
    const base = 'tr_' + normName(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(base + '_' + n)) n++;
    return base + '_' + n;
  }

  // Highest-weight set of a train history entry, falling back to the
  // entry's own recorded top weight when per-set detail is absent.
  function topOf(histEntry) {
    const sets = Array.isArray(histEntry.sets) ? histEntry.sets.filter(Boolean) : [];
    const kg = Number(histEntry.kg) || 0;
    if (!sets.length) return { weight: kg, reps: 0, sets: [] };
    const norm = sets.map((s) => ({ reps: Number(s.r != null ? s.r : s.reps) || 0, fail: !!s.fail }));
    const best = norm.reduce((a, b) => (b.reps > a.reps ? b : a), norm[0]);
    return { weight: kg, reps: best.reps, sets: norm };
  }

  /**
   * @param {object} trainState  raw vitality_train blob (may be null)
   * @param {object} gymState    po_coach_v1 state (mutated copy returned)
   * @returns {{state: object, report: object}}
   */
  function migrate(trainState, gymState) {
    const state = JSON.parse(JSON.stringify(gymState || {}));
    state.exercises = Array.isArray(state.exercises) ? state.exercises : [];
    state.logs = (state.logs && typeof state.logs === 'object') ? state.logs : {};

    const report = { daysImported: 0, exercisesMatched: 0, exercisesCreated: 0, sessionsImported: 0, sessionsSkipped: 0 };

    if (!trainState || !trainState.days || typeof trainState.days !== 'object') {
      return { state, report };
    }

    const byName = new Map();
    state.exercises.forEach((e) => { if (e && e.name) byName.set(normName(e.name), e); });
    const takenIds = new Set(state.exercises.map((e) => e && e.id).filter(Boolean));

    const order = Array.isArray(trainState.order) && trainState.order.length
      ? trainState.order.slice()
      : Object.keys(trainState.days);

    const plan = { active: trainState.active || order[0] || null, order: [], days: {} };

    order.forEach((dayKey) => {
      const day = trainState.days[dayKey];
      if (!day) return;
      plan.order.push(dayKey);
      report.daysImported++;

      const exList = Array.isArray(day.ex) ? day.ex : [];
      plan.days[dayKey] = {
        name: day.name || dayKey,
        type: day.type || '',
        restDay: !!day.restDay,
        off: !!day.off,
        ex: exList.map((ex) => {
          // Reuse the po_coach exercise with the same name where one
          // exists, so a lift logged on both pages keeps a single history
          // rather than splitting into two look-alike entries.
          let target = byName.get(normName(ex.name));
          if (target) {
            report.exercisesMatched++;
          } else {
            const id = newExerciseId(ex.name, takenIds);
            takenIds.add(id);
            target = { id, name: ex.name || 'Untitled', bw: false, startWeight: Number(ex.kg) || 0 };
            state.exercises.push(target);
            byName.set(normName(ex.name), target);
            report.exercisesCreated++;
          }

          const log = state.logs[target.id] || [];
          const seenDays = new Set(log.map((l) => dayKeyOf(l.date)));

          (Array.isArray(ex.hist) ? ex.hist : []).forEach((h) => {
            if (!h || !h.date) return;
            // A day already present in po_coach wins: it is the store the
            // merged page keeps writing to, so re-adding would double-count.
            if (seenDays.has(dayKeyOf(h.date))) { report.sessionsSkipped++; return; }
            const top = topOf(h);
            log.push({
              weight: top.weight,
              reps: top.reps,
              date: new Date(h.date + 'T12:00:00').toISOString(),
              sets: top.sets,
            });
            seenDays.add(dayKeyOf(h.date));
            report.sessionsImported++;
          });

          log.sort((a, b) => String(a.date).localeCompare(String(b.date)));
          state.logs[target.id] = log;

          return {
            id: target.id,
            sets: Number(ex.sets) || 3,
            reps: Number(ex.reps) || 10,
            kg: Number(ex.kg) || 0,
            perHand: !!ex.perHand,
            rest: Number(ex.rest) || 120,
            note: ex.note || '',
            pinned: !!ex.pinned,
            deload: !!ex.deload,
            tier: ex.tier != null ? ex.tier : 2,
            lastKg: ex.lastKg != null ? ex.lastKg : null,
            log: Array.isArray(ex.log) ? ex.log.slice(0, Number(ex.sets) || 3) : [],
          };
        }),
      };
    });

    if (!plan.active || !plan.days[plan.active]) plan.active = plan.order[0] || null;
    state.plan = plan;
    return { state, report };
  }

  // Fresh plan for someone who never used the old Train page: mirrors the
  // po_coach day list so the tabs are never empty on first open.
  function emptyPlan(days) {
    const list = Array.isArray(days) && days.length ? days : [{ id: 'push', name: 'Push' }];
    const plan = { active: list[0].id, order: [], days: {} };
    list.forEach((d) => {
      plan.order.push(d.id);
      plan.days[d.id] = { name: d.name, type: '', restDay: false, off: false, ex: [] };
    });
    return plan;
  }

  return { migrate, emptyPlan, _normName: normName, _topOf: topOf };
});
