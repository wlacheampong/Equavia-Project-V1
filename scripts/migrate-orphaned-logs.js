// One-off migration script: re-parent orphaned po_coach_v1.logs entries onto
// current po_coach_v1.exercises entries, by slug similarity between the
// orphaned log id and current exercise names (e.g. tr_overhead_press ->
// "Overhead Press"). See CLAUDE.md / this session's investigation for how
// these got orphaned: switchProgram() replaces state.exercises wholesale per
// programme while state.logs stays one global object, so logs recorded
// under a previous programme's exercise ids become unreachable once you're
// on a different one.
//
// PROPOSAL ONLY. This script never writes to Supabase or any localStorage --
// it reads a JSON export (see docs/exports/, produced read-only from
// app_state where key='po-coach') and prints/writes a proposed mapping for
// human review. Applying it is a separate, not-yet-built step that requires
// explicit approval of the mapping first.
//
// Usage: node scripts/migrate-orphaned-logs.js [path-to-export.json]
// Defaults to the newest file in docs/exports/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const EXPORTS_DIR = path.join(REPO_ROOT, 'docs', 'exports');

// Below this token-overlap score, a candidate is reported as "no confident
// match" rather than proposed -- picking a wrong exercise to re-parent real
// history onto is worse than leaving it orphaned, so a guess below this bar
// doesn't get auto-selected. Judgement call, not a documented figure.
const MATCH_THRESHOLD = 0.5;

// Ids generated from a name (tpResolveExercise's 'tr_' ids, openSwap's
// 'custom_' ids) carry a real slug worth comparing. Ids generated from a
// timestamp/random suffix (buildDefaultExercises' 'seed_N_<time>', and
// openSwap's swap-library ids of the form 'ex_<time>_<rand>') don't --
// there's no name encoded in them to compare against, so these are reported
// separately as "no slug available" rather than scored against garbage.
const NAME_BASED_PREFIXES = ['tr_', 'custom_'];

function findLatestExport() {
  // Exclude this script's own output -- it also lives in EXPORTS_DIR and
  // also ends in .json, and '.json' sorts before '.orphan-mapping-
  // proposal.json' lexically, so a naive "last after sort" pick grabs the
  // proposal file from a previous run instead of the actual export.
  const files = fs.readdirSync(EXPORTS_DIR).filter((f) => f.endsWith('.json') && !f.endsWith('.orphan-mapping-proposal.json'));
  if (!files.length) throw new Error('No export files found in ' + EXPORTS_DIR);
  files.sort();
  return path.join(EXPORTS_DIR, files[files.length - 1]);
}

function isNameBased(id) {
  return NAME_BASED_PREFIXES.some((p) => id.startsWith(p));
}

function slugToWords(id) {
  let s = id;
  for (const p of NAME_BASED_PREFIXES) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  // custom_ ids are time+random, not a name -- caught by isNameBased() being
  // false in practice for those (checked before this is called), but strip
  // defensively anyway.
  return s.replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]/gi, ' ').toLowerCase().trim();
}

function nameToWords(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSet(words) {
  return new Set(words.split(' ').filter(Boolean));
}

function jaccard(aWords, bWords) {
  const a = tokenSet(aWords);
  const b = tokenSet(bWords);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function bestMatch(orphanWords, exercises) {
  let best = null;
  for (const ex of exercises) {
    const score = jaccard(orphanWords, nameToWords(ex.name));
    if (!best || score > best.score) best = { exercise: ex, score };
  }
  return best;
}

function dateRangeOf(sets) {
  const dates = (sets || []).map((s) => s.date).filter(Boolean).sort();
  return dates.length ? { first: dates[0], last: dates[dates.length - 1] } : { first: null, last: null };
}

function main() {
  const exportPath = process.argv[2] ? path.resolve(process.argv[2]) : findLatestExport();
  console.log('Reading export:', exportPath);

  const rows = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || !row.data || !row.data.po_coach_v1) {
    throw new Error('Export does not contain a po_coach_v1 blob at data.po_coach_v1');
  }
  const state = row.data.po_coach_v1;
  const exercises = Array.isArray(state.exercises) ? state.exercises : [];
  const logs = state.logs || {};
  const currentIds = new Set(exercises.map((e) => e.id));

  const orphanIds = Object.keys(logs).filter((id) => !currentIds.has(id));

  // An orphaned KEY is not the same thing as orphaned HISTORY -- planToLogs()
  // writes state.logs[id] = [] for a plan exercise the moment it's resolved,
  // even before anything is actually logged against it. A key with zero sets
  // has nothing to re-parent; matching it onto a current exercise would be
  // meaningless. Only ids with real entries are candidates for the mapping.
  const emptyOrphans = orphanIds.filter((id) => (logs[id] || []).length === 0);
  const dataOrphans = orphanIds.filter((id) => (logs[id] || []).length > 0);

  const proposals = [];
  const noSlug = [];

  for (const id of dataOrphans) {
    const sets = logs[id] || [];
    const range = dateRangeOf(sets);
    const base = { orphanedId: id, sessionsAffected: sets.length, dateRange: range };

    if (!isNameBased(id)) {
      noSlug.push(Object.assign({}, base, { reason: 'id has no name-derived slug (timestamp/random-based)' }));
      continue;
    }

    const words = slugToWords(id);
    const match = bestMatch(words, exercises);
    const confident = match && match.score >= MATCH_THRESHOLD;

    proposals.push(Object.assign({}, base, {
      orphanedSlug: words,
      // Nearest-guess id/name are kept even below threshold -- a low-score
      // guess is exactly what a human needs to see to make the manual call
      // this script deliberately isn't making for them.
      nearestExerciseId: match ? match.exercise.id : null,
      nearestExerciseName: match ? match.exercise.name : null,
      score: match ? Number(match.score.toFixed(2)) : 0,
      confidence: confident ? 'match' : 'no confident match',
    }));
  }

  proposals.sort((a, b) => b.score - a.score);

  const matched = proposals.filter((p) => p.confidence === 'match');
  const unmatched = proposals.filter((p) => p.confidence !== 'match');

  console.log('\n=== Current roster: ' + exercises.length + ' exercises, ' + Object.keys(logs).length + ' total logged ids, ' +
    orphanIds.length + ' orphaned (' + dataOrphans.length + ' with real logged sets, ' + emptyOrphans.length + ' empty keys with nothing to migrate) ===\n');

  console.log('--- Proposed matches (' + matched.length + ') ---');
  for (const p of matched) {
    console.log(
      p.orphanedId.padEnd(38) + ' -> ' + p.nearestExerciseName.padEnd(28) +
      ' (id: ' + p.nearestExerciseId + ', score ' + p.score + ', ' + p.sessionsAffected + ' sessions, ' +
      p.dateRange.first + '..' + p.dateRange.last + ')'
    );
  }

  console.log('\n--- No confident match, left as-is (' + unmatched.length + ') ---');
  for (const p of unmatched) {
    const nearest = p.nearestExerciseName ? (' (nearest guess: "' + p.nearestExerciseName + '", id ' + p.nearestExerciseId + ', score ' + p.score + ', below ' + MATCH_THRESHOLD + ' threshold)') : ' (no candidate scored above 0)';
    console.log(p.orphanedId.padEnd(38) + ' -- ' + p.sessionsAffected + ' sessions, ' + p.dateRange.first + '..' + p.dateRange.last + nearest);
  }

  console.log('\n--- No slug available, needs manual review (' + noSlug.length + ') ---');
  for (const p of noSlug) {
    console.log(p.orphanedId.padEnd(38) + ' -- ' + p.sessionsAffected + ' sessions, ' + p.dateRange.first + '..' + p.dateRange.last);
  }

  console.log('\n--- Empty keys, nothing to migrate (' + emptyOrphans.length + ') ---');
  console.log(emptyOrphans.join(', '));

  const outPath = exportPath.replace(/\.json$/, '') + '.orphan-mapping-proposal.json';
  fs.writeFileSync(outPath, JSON.stringify({
    source: path.basename(exportPath), generatedAt: new Date().toISOString(), matchThreshold: MATCH_THRESHOLD,
    matched, unmatched, noSlug, emptyOrphans,
  }, null, 2) + '\n');
  console.log('\nWrote full proposal to:', outPath);
  console.log('\nNothing applied. This is a proposal only -- review before anything touches real data.');
}

main();
