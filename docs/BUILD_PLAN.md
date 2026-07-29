# EQUAVIA — COMPLETE BUILD PROMPT (ALL PHASES, SINGLE FILE)

This file contains the entire build plan: Phases 0–3 (master), Phase 4 (AI assistant), Phase 5 (Interactions + News), Phase 6 (security, consolidation, remaining domains).

**EFFECTIVE BUILD ORDER: Phase 0 → 6.0 → 6.1 → 1 → 2 → 3 → 4 → 5 → 6.2–6.10.**
Structure and security first, features onto a stable skeleton, intelligence last. Follow the build-order override in the master section below. Work one section at a time; ask all ASK FIRST questions before building each section; wait for confirmation before moving on.

═══════════════════════════════════════════════════════════════

# EQUAVIA — MASTER BUILD PROMPT FOR CLAUDE CODE

Paste this entire file into Claude Code at the repo root. Work through it **one phase at a time, one section at a time**. Do not build ahead.

---

## HOW TO WORK (read first, applies to everything)

0. **BUILD ORDER OVERRIDE:** after completing Phase 0, jump to **Phase 6.0 (security gate)** and **Phase 6.1 (consolidation — merges/cuts/final nav)** before building Phases 1–5. The security gate must exist before any serverless endpoint deploys publicly, and the merged page structure (Peak deleted into Health, Ability → Growth, Notes → More sheet, final 5-tab nav) must be settled so Phases 1–5 build onto pages that will actually exist. Where any later section references peak.html, treat it as the Energy section on health.html; where a section asks which page gets a nav slot, the answer is the Phase 6.1 lineup.
1. **Before building each numbered section:** ask me every question listed under its `ASK FIRST` block, plus anything else ambiguous. Do not silently default on wording, thresholds, tier names, data shapes, OAuth scopes, or edge cases. Wait for my answers, then build.
2. **Explore before touching.** Read the existing codebase first. These are plain HTML pages (dashboard.html, health.html, gym.html, peak.html, finance.html, planner.html, ability.html, notes.html) with inline/linked JS and localStorage persistence, deployed on Vercel. Match the existing patterns — do not introduce a framework, bundler, or build step unless a section explicitly requires a serverless function.
3. **Match the existing dark visual language** (near-black backgrounds #050506/#0a0a0b, card-based layout). New sections must be indistinguishable in style from existing ones.
4. **localStorage discipline:** every new feature namespaces its keys (`eq.books.*`, `eq.contacts.*`, `eq.sleep.*` etc.). Every feature's data must be included in the global export/import built in Phase 0.
5. **Reuse the existing chart pattern** (the Weight graph on gym.html) for every new chart. One charting approach across the whole app.
6. **Mobile-first.** Assume primary use is a phone with the app installed as a PWA.
7. **After each section:** show me what changed, list the files touched, and wait for my confirmation before moving on.
8. **Do NOT build any food/calorie logging.** Nutrition is handled in MyFitnessPal separately, outside this app. If any old "Fuel" references exist, remove them.

---

# PHASE 0 — FOUNDATION & CLEANUP (do this before any new features)

## 0.1 Identity & naming
- Unify the app name across every `<title>`, header, splash page, and manifest.
- ASK FIRST: final app name ("Equavia"? "William's Dashboard"? something else), and whether the splash-image landing page stays or the app should open straight to the dashboard.

## 0.2 Remove template artifacts
- health.html: remove the visible `// editable template · all data stays in your browser` text and embed the water tracker properly instead of a raw `po-water.html` link.
- peak.html: **do not clean this page — delete it.** Per the consolidation plan (Phase 6.1, executed early): move its only real content (energy curve concept, stimulant plan, schedule strip) into a new "Energy" section on health.html, written in the app's own voice, then remove peak.html and all nav references. The Patreon link and pasted all-caps marketing copy are deleted with the page.
- Hide all "coming soon" UI (Gantt) — features that don't exist yet should not be advertised.

## 0.3 Empty states
- Replace every bare "—", "0/0", "Loading…" placeholder across all pages with a proper empty state: one line describing what the panel does + one clear action, in the style of gym.html's "Log your first weight to start tracking."

## 0.4 Bottom navigation
- Replace the plain text link row with a fixed bottom tab bar on mobile (icons + labels, active-state highlight on the current page). Keep a top nav or the same bar on desktop.
- ASK FIRST: there are 7+ pages and a mobile tab bar fits ~5. Which pages get first-class tabs and which fold into a "More" sheet?

## 0.5 PWA
- Add `manifest.json` (name, icons, standalone display, theme color) and a service worker (cache-first app shell so all pages load offline; localStorage data is already local).
- ASK FIRST: do you have a logo/icon file, or should a simple monogram icon be generated?

## 0.6 Global backup & settings page
- New `settings.html` (reachable from the nav/More sheet) containing:
  - **Export all** — one JSON file containing every localStorage namespace, with an export date. **Import all** — restores it, with a confirmation warning.
  - "Last backed up X days ago" indicator surfaced on the dashboard when > 14 days.
  - Global preferences: currency (default **GBP**, not CHF — update finance.html default), units, wake/bed times (moved here from dashboard modal but still editable there), Obsidian connection (single shared config — deduplicate the two separate Obsidian sync configs currently on planner.html and notes.html into one, both pages read the same stored connection).

## 0.7 Dashboard deduplication
- dashboard.html and planner.html currently both render full Goals + To Do components. Refactor: **Planner owns the full editable components; the Dashboard shows compact read-only summary cards** (today's tasks done/total, top 1–2 goals with countdown, streak) that link into Planner.
- The dashboard becomes an aggregator: add compact summary cards for Health (recovery % / sleep hrs once Whoop or sleep log has data), Fitness (last session, current weight + 7-day avg), Finance (net worth + month cash flow), each linking to its page.
- ASK FIRST: confirm this direction before refactoring, and which summary cards you want in which order.

---

# PHASE 1 — CORE ADDITIONS

## 1.1 Book Tracker (Ability page)
- New card section on ability.html: three statuses — **Want to Read / Reading / Read**.
- Each book: title, author, status, optional 1–5 star rating, optional notes. "Read" entries record and display date finished.
- Add via "+" button; change status via dropdown (no drag needed on v1).
- Optional cover images: fetch from Open Library covers API by title/author search (`https://openlibrary.org/search.json`), cache the image URL; graceful text-only fallback.
- A "Reading" book can optionally show a progress % slider.
- ASK FIRST:
  - Cover images on or off for v1?
  - Progress % on currently-reading books — wanted?
  - Show a yearly "books finished" count (Goodreads-challenge style) with a target?

## 1.2 Sleep Log + Trend Chart (Health page)
- Below the existing WHOOP sleep-stages block: nightly total sleep hours log.
- If the WHOOP connection is live and returns sleep totals, auto-fill each night from it; manual entry/override always available for missing nights. Manual entries flagged visually as manual.
- Line chart (existing chart pattern): sleep hours per night, toggle 30/90 days, horizontal reference line at a configurable target.
- ASK FIRST:
  - Is the "Connect WHOOP" button currently wired to the real WHOOP API (OAuth working), or is it a placeholder? (Determines whether auto-pull is buildable now or the log starts manual-only.)
  - Sleep target in hours?
  - Also chart a 7-night rolling average line?

## 1.3 Relationship Tracker (Planner page)
- New card section: contacts with **name, relationship type (family/friend/colleague/other), tier, target check-in cadence in days**.
- "Logged contact today" button per person → updates last-contacted date. Also allow backdating ("logged contact on [date]") for catch-up entry.
- **Overdue flag** when days-since-contact > cadence; list sorts overdue-first, most-overdue at top. Days-overdue count shown.
- Dashboard: if anyone is overdue, the Planner summary card shows "N people overdue" badge.
- Optional per-contact notes field (what you last talked about — useful before reaching out).
- ASK FIRST:
  - Exact tier names and how many ("priority tier" was placeholder — e.g. Inner circle / Close / Network, or A/B/C?). Should tier auto-suggest a default cadence (e.g. Inner=7d, Close=14d, Network=30–60d)?
  - Birthday field with an upcoming-birthday flag — wanted?
  - Roughly how many contacts will this hold (affects whether search/filter is needed at v1)?

## 1.4 Notification Hub — Gmail, READ-ONLY (Main dashboard)
Purpose: see that a message arrived and what it says **without opening Gmail or having mail apps on the phone** — no doomscroll vector. **No composing, no replying, no sending from this app.**
- Connect Gmail via Google OAuth using the **`gmail.readonly` scope only** (deliberately minimal — easier consent, zero send risk).
- Implementation: Google Identity Services token flow client-side (PKCE); no server storage of tokens. Token kept in memory/session, silent re-auth where possible.
- Panel on dashboard: sender, subject, snippet, time for the most recent N messages. Tapping a message expands the snippet to the fuller plain-text body preview **in-app** (still read-only). An external "Open in Gmail" link is allowed as an explicit escape hatch.
- Unread indicator + count badge. Refresh: manual button + polling interval.
- Instagram/Meta DMs: **excluded permanently** — personal-account third-party DM access isn't available (Basic Display API deprecated; business-only review process). Do not build around it.
- Cross-link (small but high value): if a Gmail sender's name/email matches a Relationship Tracker contact, show a small badge on the message ("tracked contact") and offer one tap → "count this as contact logged."
- ASK FIRST:
  - How many messages to show (10? 20?), unread-only or all recent?
  - Polling interval (every 5 min while open? manual only?)
  - Allow "mark as read" from the app? (Requires `gmail.modify` scope instead of readonly — say no if you want the strictest scope.)
  - One Gmail account or multiple?

## 1.5 Calendar Quick-Add → Google Calendar (Planner)
- On planner.html's Calendar section: input "What are you doing?" + date/time picker + duration.
- On save: create the event via Google Calendar API (same Google OAuth session as 1.4 where possible — request `calendar.events` scope) AND render it in the local in-app calendar immediately. Inline success/failure state.
- Also pull upcoming Google Calendar events into the in-app calendar view (read), so the "Connect Google Calendar" button that already exists becomes real.
- ASK FIRST:
  - Which Google account and which calendar (if several)?
  - Two-way (show Google events in-app) confirmed, or push-only?
  - Should quick-add support natural-ish parsing ("gym tomorrow 6am") or strictly the structured fields for v1?

## 1.6 Color-Coded Live Goal Countdown
- Applies to the existing live day/hr/min/sec countdown per goal.
- `percent_remaining = (deadline − now) / (deadline − start_time) × 100`
- Color stops: 100–76% neutral · 75% dark green · 50% green · 40% light green · 35% lighter green · 30% yellow · 20% orange · 10% red · 5–0% dark red + blinking.
- **Exception:** if the goal's progress slider is at 100%, always neutral — skip the gradient entirely.
- Implement as discrete steps or smooth HSL interpolation — whichever renders cleaner against the dark theme; show me both if trivial.
- Accessibility: "blinking" should be a slow opacity pulse (~1s ease), not a hard flash; respect `prefers-reduced-motion` by falling back to static dark red.
- ASK FIRST: confirm the pulse-instead-of-blink substitution is acceptable.

## 1.7 Goal Archive at 100% → History + Obsidian Folder
- When a goal's progress slider hits 100%: show an **Archive** button on that goal.
- On archive: remove from Dashboard entirely → append to a collapsed/expandable **Goal History** section on planner.html only (shows title, completion date, linked project count).
- Obsidian: using the existing per-project Obsidian page sync, move/copy the archived goal's linked projects' pages into a vault folder named after the goal title (create folder if missing, sanitize illegal filename characters).
- Archived goals and their linked projects become **read-only** — sliders and edits disabled, with a visible "archived" state.
- ASK FIRST:
  - Folder naming: exact goal title, or `Archive/<goal title>`, or date-prefixed (`2026-07 — <goal>`)?
  - Should un-archiving be possible, or is archive permanent?
  - If a project is linked to two goals and one archives — what happens? (Propose: project stays live until all linked goals archive; confirm.)

## 1.8 To-Do Completion Rate Chart (Main dashboard)
- Daily completion % = tasks completed ÷ tasks scheduled that day × 100. Store a daily snapshot at day rollover (6 AM reset already exists — snapshot at reset).
- Line chart under the To Do summary: toggle 4 / 12 / 52 weeks, raw daily points + **7-day rolling average line** (daily % is noisy; the average is the real signal).
- ASK FIRST:
  - Tasks pushed to tomorrow — count as missed for that day (recommended, keeps the metric honest), or excluded?
  - Days with zero scheduled tasks — skip in the chart, or count as 100%? (Propose: skip — gaps render as breaks.)

---

# PHASE 2 — "ASK CLAUDE" PAGE (in-app AI chat over my data)

- New nav entry + `ask.html`: standard chat UI (message list, input, send).
- Backend: **Vercel serverless function** (`/api/chat`) calling `https://api.anthropic.com/v1/messages`. The Anthropic API key lives ONLY in a Vercel environment variable — never shipped client-side, never in the repo.
- Context injection: before each request, the client assembles a compact current-state summary from localStorage (selected domains only) and sends it with the message; the serverless function forwards it as system context.
- Include a per-message domain toggle row (chips: Health · Fitness · Goals/Tasks · Finance · Habits · Relationships) so context is opt-in per conversation — full-everything context on every message wastes tokens.
- Basic protections in the serverless function: max tokens cap, simple rate limit, reject non-POST.
- Show estimated context size ("~2.1k tokens of your data attached") so cost stays visible.
- ASK FIRST:
  - Which domains ON by default?
  - Session-only history, or persist conversations to localStorage?
  - Model: `claude-sonnet-4-6` (smarter, costlier) vs `claude-haiku-4-5-20251001` (cheap, fast) as default — or a toggle?
  - Confirm you'll add `ANTHROPIC_API_KEY` in Vercel env settings.

---

# PHASE 3 — BORROWED PATTERNS FROM REFERENCE APPS

Build in this order; each is standalone.

## 3.1 Year Grid per habit (from Way of Life)
- ability.html: next to each habit's streak, a whole-year grid (365 cells, green = done, red = missed, grey = not yet/paused). Success % for the year shown alongside — so one miss doesn't visually erase months of consistency.
- Compact per-habit mini-grid on the card; tap to expand full-year view.

## 3.2 Habit Health Score with decay (from Loop Habit Tracker)
- Alongside (not replacing) the streak: a 0–100 score per habit using exponential smoothing — completing raises it toward 100, a miss decays it gradually instead of zeroing it. Loop's approach: score = previous × k + done × (1 − k), k derived from habit frequency.
- Display as a small ring/bar per habit. ASK FIRST: keep the fire-streak too, or make the score primary?

## 3.3 Weekly Report widget (from Gyroscope)
- One combined report card, generated at week end, spanning: Health (avg sleep, avg recovery if Whoop live), Fitness (sessions done, total volume, weight 7-day avg change), Planner (task completion %, goals progressed), Ability (habit success %), Finance (month cash-flow pace).
- Renders as a single shareable-looking card on the dashboard; keeps the last 12 weeks browsable.
- Also: one tap "Write to Obsidian" → weekly note via the existing sync.
- ASK FIRST: which day/time does the week close (Sunday 9 PM?), and which metrics make the cut for v1.

## 3.4 Quick Capture from anywhere (from Second-Brain templates)
- A floating "+" (or long-press on the nav's center tab) available on every page → small sheet: text input + destination chips (Task today · Task tomorrow · Note · Shopping list · Book to read). Saves to the right store without leaving the current page.

## 3.5 Correlation view (from Exist.io)
- New card on health.html: pick metric A × metric B from tracked data (sleep hrs, recovery %, task completion %, habit score, weight 7-day trend) → scatter/dual-line over the last 60–90 days + Pearson r with a plain-English line ("On nights under 7h sleep, next-day task completion averages 22% lower").
- Honesty rules: require ≥ 14 paired data points before showing r; always label it correlation, not cause.
- ASK FIRST: the 2–3 metric pairs you actually care about first, so defaults are pre-set.

## 3.6 Auto-suggest time slot (from Motion — lightweight version)
- On unscheduled Planner tasks: a "suggest slot" button → looks at today's in-app + Google Calendar events, finds the first open gap ≥ the task's duration inside waking hours, proposes it; one tap accepts and creates the calendar block.
- Rules-based only — no AI needed. ASK FIRST: default task duration when unset (30 min?), and protected blocks it must never schedule over (training window 6:00–7:30 AM, meals, wind-down after 9 PM?).

---

# ACCEPTANCE CHECKLIST (verify after all phases)

- [ ] No page shows template artifacts, third-party links, or "coming soon" stubs
- [ ] Every feature's data round-trips through global Export/Import
- [ ] App installs as a PWA and all pages open offline
- [ ] All charts share one visual pattern
- [ ] Gmail integration is readonly-scope and cannot send anything
- [ ] No API key of any kind appears in client-side code or the repo
- [ ] Dashboard aggregates; Planner owns tasks/goals; no duplicated editable components
- [ ] Archived goals are immutable and present in Obsidian under their folder
- [ ] Every new section matches the dark card aesthetic on a 380px viewport

═══════════════════════════════════════════════════════════════

# PHASE 4 — ASK CLAUDE → FULL AI ASSISTANT

Append this to the master build prompt. Requires Phase 2 (Ask Claude page + serverless function) complete. Work section by section, ask the `ASK FIRST` questions before building each.

Global rules for this phase:
- The assistant can READ everything and WRITE only through defined tools. No tool = no action.
- The assistant can never contact the outside world (no email sending, no messages, no posting). Read-only Gmail stays read-only.
- Every write the assistant makes is tagged `source: "assistant"` in its localStorage record, and listed in an "Assistant activity" log viewable in Settings — full audit trail of what it did and when.
- All costs run against my own Anthropic API key. Show token estimates where practical.

---

## 4.1 Tool Use — write access to the app

Define the app's actions as Anthropic tools in the serverless `/api/chat` call. Claude requests a tool; the CLIENT executes it against localStorage and returns the result; the loop continues until Claude produces a final text reply.

Tool set (v1):
- `add_task(title, day: "today"|"tomorrow")`
- `complete_task(task_id)` / `push_task_to_tomorrow(task_id)`
- `log_weight(kg, date?)`
- `log_sleep(hours, date?)`
- `log_contact(contact_name, date?)`
- `add_calendar_event(title, date, time, duration_min)` — local + Google if connected
- `add_shopping_item(name, grams?, qty?)`
- `add_book(title, author?, status)`
- `check_stack_item(item_name)` — mark a supplement taken
- `log_habit(habit_name, done: true|false, date?)`
- `add_goal_note(goal_id, note)`
- `remember(fact)` / `forget(fact_id)` — see 4.3
- `get_data(domain, range)` — explicit read tool so context injection can shrink: instead of front-loading everything, Claude pulls what it needs

Rules:
- Logging/reading tools execute silently. Destructive or irreversible ones (delete, archive, overwrite an existing entry) require an in-chat confirm chip before executing.
- Tool results render as small inline action cards in the chat ("✓ Logged 82.4 kg") with an undo link where feasible (undo = delete the created record).
- Unknown references ("push the dentist thing") — Claude uses `get_data` to search tasks, asks if ambiguous.

ASK FIRST:
- Confirm the v1 tool list — anything to add/remove?
- Should `add_calendar_event` be allowed to write to Google Calendar directly, or local-only with a "sync" confirm?
- Undo window — keep it simple (immediate undo link only) or a full revert log in Settings?

## 4.2 Universal command bar / natural-language quick log

- The Quick Capture "+" (Phase 3.4) gains a "smart" mode: free text goes to the assistant with tools enabled, parsed into the right records. "slept rough, 6 hours, skipped morning stack, weight 82.9" → sleep entry + stack state + weight log in one pass, with a compact result card listing what was logged.
- Structured mode (destination chips) remains as the zero-cost path; smart mode is opt-in per capture because it costs a token round-trip.
- ASK FIRST: which model for smart-capture parsing — Haiku is likely sufficient and keeps per-capture cost trivial. Confirm.

## 4.3 Persistent memory

- `eq.assistant.memory` store, max ~30 entries, each `{id, fact, created}`.
- Claude can call `remember()` when I state a durable preference or fact, and `forget()` when I correct one. All memory entries injected into the system prompt of every assistant call.
- Settings page: memory viewer with manual add/edit/delete.
- Seed on first run by asking me 3–5 onboarding questions (current goal phase, training split, sleep target, tone preference for advice).
- ASK FIRST: confirm the cap, and whether the assistant should ask permission before saving a memory or save silently and show a "remembered" chip.

## 4.4 Morning Brief

- Dashboard card, generated on first open after the 6 AM reset (cached for the day; manual regenerate button).
- Serverless assembles: last night's sleep (Whoop or log), recovery % if live, today's tasks + calendar, overdue contacts, unread-count from Gmail hub, subscription renewals ≤ 7 days, habit states, weight 7-day trend.
- Claude writes ≤ 6 lines: state of play + ONE recommended focus for the day. No generic filler, no motivational padding.
- Evening variant ("Close the day" button after 8 PM): reviews completion vs plan, asks for tomorrow's top task if unset, writes the day summary to Obsidian daily note via existing sync.
- ASK FIRST: auto-generate on open vs button-only (auto = 1 API call/day baseline cost). Include evening variant in v1?

## 4.5 WEEKLY AUDIT — the core review feature

Runs at week close (default Sunday evening; manual "Run audit now" always available). Replaces/absorbs the static weekly report widget from Phase 3.3 — the Gyroscope-style stat card becomes the header of this audit.

**Data in:** the full week across every domain (sleep, recovery, training sessions + volume, weight trend, task completion %, habit grid, goals progressed, contacts logged vs overdue, finance cash-flow pace, stack adherence) PLUS the previous week's audit entry, so every audit is comparative — trajectory, not snapshot.

**Output structure (fixed sections, rendered as cards):**
1. **The week in numbers** — compact stat header (the Phase 3.3 metrics).
2. **What went well** — 3–5 specific, evidence-cited wins ("Stack adherence 96%, up from 84%"). No participation trophies: if the week was poor, this section is allowed to be short.
3. **What went badly** — equally specific, equally evidence-cited. Direct language, no cushioning. Includes broken commitments from last week's audit ("Last week you accepted 'walk after Meal 2 daily' — logged 2/7").
4. **What to do better** — the 2–3 highest-leverage fixes for next week, each tied to a metric that would prove it worked.
5. **Suggested additions** — 1–3 NEW routine/habit/tracking suggestions I can adopt or ignore. Each renders with **[Implement] [Ignore]** buttons:
   - **Implement** → the assistant uses its tools to create the actual habit/task/stack item/rule immediately, tagged as originating from audit week N.
   - **Ignore** → recorded, and the assistant does not re-suggest the same idea for at least 4 weeks (store ignored suggestions with a cooldown date).
6. **Verdict** — one line, one grade or score for the week (ASK: letter grade, /10, or a one-word verdict?).

**Behavior rules:**
- Every claim must cite a number from the data. If data is missing for a domain, say "no data" — never infer or pad.
- Implemented suggestions are automatically checked in the NEXT audit's section 3/2 — the loop closes itself.
- Audits persist (`eq.audits.*`), browsable as a history list; each also writes to Obsidian as `Audits/2026-W29.md` via existing sync.
- Tone: direct, specific, zero flattery. The audit's value is honesty.

ASK FIRST:
- Week close day/time (Sunday 8 PM?).
- Auto-run at close vs manual-only (auto = 1 larger API call/week — this one is worth Sonnet-class; confirm model).
- Verdict format (grade / score /10 / one-word)?
- Any domain to EXCLUDE from audit scope (e.g. finance private from this view)?
- Hard cap on suggestion count per week (default 3)?

## 4.6 Standing rules engine

- Settings section: user-defined rules `{trigger, condition, action}` checked locally on app open — plain JS evaluation, NO API call unless a rule fires and its action is "assistant message."
- Starter rule templates: recovery < 33% → suggest training swap · tracked contact emailed → surface on dashboard · weight 7-day avg moved > X kg in 7 days → flag · habit health score dropped below 60 → flag · subscription renewing in 48h → flag.
- When a rule fires with an assistant action, Claude writes the one-line message with the triggering numbers included.
- The weekly audit (4.5) may propose new rules in its suggestions section; Implement creates them here.
- ASK FIRST: which 3–4 rules to ship enabled by default.

## 4.7 Voice input

- Web Speech API mic button on the assistant chat input and the smart quick-capture sheet. Free, on-device recognition, no key.
- Transcript is shown before sending (tap to edit), then flows through the normal tool loop.
- Graceful fallback: hide the mic if the browser doesn't support SpeechRecognition.

## 4.8 Conversational weekly review (optional layer on 4.5)

- After the audit renders: "Review this week with me?" → 3 short questions max (what felt hardest, what to protect next week, anything the data missed). Answers appended to the Obsidian audit note and stored as context for next week's audit.
- Strictly optional and skippable — the audit must stand alone without it.
- ASK FIRST: include in v1 or defer.

---

## Phase 4 acceptance checklist
- [ ] Assistant can log/create via every v1 tool; destructive actions gated behind confirm
- [ ] Every assistant write is tagged and visible in the Settings activity log, with undo where feasible
- [ ] Assistant cannot send, post, or contact anything outside the app
- [ ] Memory persists, is capped, and is fully user-editable in Settings
- [ ] Morning brief ≤ 6 lines, generated once daily, from real data only
- [ ] Weekly audit: cites numbers for every claim, compares against previous week, tracks implemented/ignored suggestions with cooldown, writes to Obsidian
- [ ] Implement buttons create real records immediately; Ignore suppresses re-suggestion ≥ 4 weeks
- [ ] Rules engine evaluates locally; API calls only on fire
- [ ] Voice input works on supporting browsers, hides elsewhere

═══════════════════════════════════════════════════════════════

# PHASE 5 — INTERACTIONS PAGE + NEWS PAGE (two pages, deliberately separate)

Append to the master build prompt. Requires Phase 0 (nav, settings, backup), Phase 2 (serverless /api/chat), and benefits from Phase 4 (tools, audit, rules). Work section by section; ask every `ASK FIRST` question before building.

**Purpose:** two pages with one purpose each, kept separate on purpose.
- **Interactions** = *people I know*: who to reach out to, what arrived, what to say. Visited when being social.
- **News** = *the world*: category feed + weekly digest. Visited deliberately, not ambiently.

Do NOT co-locate the news feed with the message inbox — pairing a feed with an inbox recreates the exact check-messages-then-scroll pattern this build exists to escape. The data still flows between them (news→talking topics, digest→audit) regardless of page placement; the split is about attention, not architecture.

**A React prototype exists for the contact manager** (component name "Keep", light theme). Treat it as a UX reference ONLY: port its concepts and layout logic into the app's existing dark plain-HTML + localStorage patterns. Do NOT paste React into the codebase, do NOT adopt its light palette, and do NOT keep its direct client-side `api.anthropic.com` call — every AI call in this phase routes through the existing serverless `/api/chat` so the key stays server-side.

---

## 5.1 New "Interactions" page + nav slot

- New `interactions.html`. Nav placement is already settled by Phase 6.1 (executed early per the build-order override): **tabs = Main · Health · Fitness · Planner · Interactions; News lives in the More sheet.** The dashboard digest card covers the daily glance, and one extra tap to reach the full feed is intentional friction for the page most at risk of becoming a scroll. No nav question to ask here.
- Two stacked zones only: **People** (contact manager, 5.2–5.4) · **Inbox** (message funnel, 5.5). No news content anywhere on this page — the only news that appears near a contact is matched talking-topic items inside that contact's profile (5.3), which is destination, not feed.
- The Relationship Tracker built in Phase 1.3 MOVES here from Planner (single source of truth; Planner keeps only the overdue-count summary card, dashboard summary card now points here).

## 5.2 Contact manager (port + upgrade of the prototype)

Adopt from the prototype:
- Tier system with cadences — **Inner every 7d · Close every 21d · Acquaintance every 60d · Networking every 90d** (this answers Phase 1.3's tier question; migrate any existing contacts). Tier colors adapted to the dark theme.
- Sidebar list sorted by overdue-ratio (most overdue first), search, tier filter chips, "due" flag, birthday flag when ≤ 14 days out.
- Profile fields: name, birthday, tier, last spoke, free notes.

Fix and extend beyond the prototype:
- **No hardcoded date** — the prototype pins `today` to a fixed date; use real current date everywhere.
- **Interaction history, not a single date** — replace lone `lastSpoke` with an append-only log: `{date, channel (call/text/in-person/other), optional one-line note}`. "Log a chat today" opens a 2-tap sheet (channel + optional note). Last-spoke derives from the log. History renders on the profile, newest first.
- **Interest tags** — alongside free notes, a tag field per contact (e.g. `judo`, `gaming`, `NHS`, `climbing`). Powers talking topics (5.3) and news matching (5.6).
- **Birthday pipeline** — birthdays ≤ 7 days surface on the Morning Brief (4.4) and as a default standing rule (4.6). On the birthday itself, the contact jumps to top of list with a distinct flag regardless of cadence.
- **Snooze** — per contact: "not now, remind in N days" so an overdue flag can be deliberately deferred without logging fake contact.
- ASK FIRST:
  - Confirm the four tier names/cadences or give replacements (note: tiers are labeled by closeness, not usefulness — cadence already encodes priority).
  - Channels list for the history log — call/text/in-person/other enough?
  - Import: start empty, or do you have a contact list (CSV/paste) to seed?

## 5.3 Talking topics + prompts (per contact)

New tab on each contact profile: **"What to talk about."** Three stacked sources, clearly labeled:

1. **Open threads (manual)** — a per-contact checklist of topics to raise ("ask how the 6c project went", "sister's wedding — September"). Add/check-off/edit. Checked items move into that day's interaction history note. The weekly audit may NOT read private notes content — only counts (ASK FIRST to confirm privacy boundary).
2. **From their interests (generated)** — button: "Suggest topics." Serverless call sends the contact's tags + notes + last 2 history notes → Claude returns 4–6 specific conversation prompts tuned to that person (JSON array, rendered as tappable cards, tap = copy). Cached per contact until notes/tags change; regenerate button.
3. **From this week's news (auto)** — any news item (5.6) whose category/keywords match the contact's interest tags appears here as "You could mention: [headline]" with the link. Zero API cost — plain keyword/category matching client-side.

Also port the prototype's **Toolkit** as a page-level (not per-contact) reference card: conversation starters, follow-up questions, open-ended prompts, meeting-spot ideas — static lists, click-to-copy. Keep the content editable in a small settings block so the lists are mine, not hardcoded.

## 5.4 Reply helper (ported through serverless)

Port the prototype's reply helper per contact:
- Inputs: "what they said" (paste), optional "my rough draft."
- Four modes: Open-ended reply · Follow-up question · Change subject · Smooth my draft.
- Output: exactly 3 ready-to-send options, tap-to-copy. Context sent: contact notes + tags + tier + last 2 history notes, so replies fit the actual relationship.
- Route through `/api/chat` (never client-side key). Model: ASK FIRST — Haiku is likely fine here and keeps each generation ~free; confirm.
- Add a fifth mode the prototype lacks: **"Re-open after silence"** — a warm re-engagement opener for overdue contacts, referencing an open thread if one exists. Surface this as the quick action directly on overdue contacts in the list.

## 5.5 Inbox — the notification funnel (honest constraints)

**Platform reality, stated up front so we don't build fiction:** Instagram, WhatsApp (personal), Snapchat, and TikTok expose **no API access to personal DMs**. Meta killed Basic Display; WhatsApp's API is business-messaging only; Snapchat and TikTok have none. No web app can read these directly, and iOS forbids notification interception entirely. What IS buildable:

- **Tier A — Gmail (already built, Phase 1.4):** mirrors here as well as the dashboard. Tracked-contact matching already exists.
- **Tier B — Android notification relay (optional, the only real DM funnel):** if my daily phone is Android, an automation app (MacroDroid / Tasker / BuzzKill) can catch notifications from WhatsApp/Instagram/Snapchat/TikTok and POST `{app, sender, text, time}` to a new Vercel serverless endpoint `/api/inbox` (secured with a secret token in the URL/header). The endpoint stores recent items (Vercel KV or simplest available store) and the Inbox panel polls it. Result: sender + message preview visible in-app, read-only, no social app opened. Claude Code: build the endpoint + panel and write me the exact MacroDroid setup steps as a doc.
- **Tier C — manual quick-log fallback:** whatever can't be relayed, one tap on a contact logs "they messaged me on [app]" so the cadence tracker stays truthful even without automation.

Inbox behavior (all tiers):
- Unified list: source icon (Gmail/WhatsApp/IG/etc.), sender, preview, time. Read-only — no replying from here (reply helper 5.4 is for composing, then I paste into the real app on my own terms).
- Sender-name matching against contacts: matched items show the contact chip; one tap = "count as contact received" (logged in history as inbound). Inbound does NOT reset the cadence clock by default — ASK FIRST: should receiving a message count as contact, or only when I reply?
- A "clear/dismiss" per item; auto-expire after 7 days.
- ASK FIRST:
  - Is your daily phone Android or iPhone? (Determines whether Tier B is buildable at all. If iPhone: state clearly in the UI that DM funneling isn't possible and hide Tier B, leaving Gmail + manual.)
  - If Android: which apps to relay (WhatsApp, IG, Snapchat, TikTok, SMS?), and quiet hours where the relay drops or holds items?

## 5.6 News — standalone page (`news.html`, reached via More sheet)

Own page, NOT on interactions.html. A compact digest card on the dashboard links here.

Design stance — this is a briefing page, not a feed:
- The **weekly digest is the centrepiece** at the top; the live category feed sits below it, collapsed by default.
- No infinite scroll: each category shows a fixed batch (e.g. 10 stories) with an explicit "load more" — ending is a feature.
- Optional "daily cap" indicator (ASK FIRST: want a soft "you've checked news N times today" counter, or is that overkill?).

**Sources (free, no scraping):**
- **The Guardian Open Platform API** — free key, excellent UK/London coverage: `section=uk-news` + `q=London` for local, `world` for global, `politics`, `technology`, `sport`, `games`.
- **RSS via serverless proxy** — `/api/news` endpoint fetches + parses feeds server-side (avoids CORS): BBC London, BBC Sport, The Verge, Eurogamer/PC Gamer, plus any feed I add in settings. Cache responses ~30 min server-side to stay polite.
- ASK FIRST: confirm category list — **London/local · Global · Gaming · Sports (which sports/teams?) · Politics · Tech** — and 2–3 preferred outlets per category. NBA/judo/basketball feeds worth adding given interests?

**Display:**
- Category tabs; each story: headline, source, time, one-line standfirst, **external link opening the original article** (target=_blank). Never reproduce article text beyond title + short snippet — link out for reading.
- "Mark seen" per story; seen stories collapse.

**Weekly digest (the talking-ammunition feature):**
- At week close (same trigger as the audit), a serverless call sends the week's collected headlines+snippets per category → Claude writes a tight per-category summary: 3–5 bullets of "what actually happened this week," each bullet linking its source article. Stored (`eq.news.digests.*`), browsable history, and written to Obsidian as `News/2026-W29.md`.
- The digest is context ammunition: the audit (4.5) and talking topics (5.3) both read from it.
- ASK FIRST: digest on the same weekly API call as the audit (cheaper, one big call) or separate button-triggered call?

## 5.7 Interaction score (feeds the weekly audit)

One number that makes "maintain relationships while off the apps" measurable:
- Weekly score from: % of due contacts actually contacted · overdue count trend vs last week · breadth (distinct people contacted) · inbound left unanswered > 72h (only if Inbox tiers make inbound visible).
- Displayed on the Interactions page header and included as a domain in the Phase 4.5 weekly audit — the audit can now praise/criticize social upkeep with numbers and suggest specific people ("Daniel is 28d over cadence; you have an open thread about his Berlin move").
- ASK FIRST: confirm the inputs and weighting, and whether the score shows as /100 or a simple A–F.

---

## Interconnections summary (why this page multiplies the rest)
- Contacts → Morning Brief (overdue + birthdays) and Rules engine (default rules).
- News tags → per-contact talking topics (free, client-side matching).
- News digest → weekly audit context + Obsidian archive.
- Inbox sender-matching → contact history (inbound logging).
- Interaction score → weekly audit domain; audit suggestions can Implement new contacts' cadence changes or rules via Phase 4 tools.
- Assistant tools (4.1): add `log_contact` variants — `log_interaction(name, channel, note?)`, `add_open_thread(name, topic)`, `snooze_contact(name, days)`.

## Phase 5 acceptance checklist
- [ ] Interactions page holds People/Inbox only; tracker no longer duplicated on Planner
- [ ] News is its own page in the More sheet; no feed content on Interactions; digest card on dashboard links to it
- [ ] Contact history is append-only log; last-spoke derived, never hand-edited except backfill
- [ ] All AI calls (topics, reply helper, digest) go through serverless — zero client-side keys
- [ ] Reply helper produces 3 options in my voice using contact context; overdue contacts expose "re-open" quick action
- [ ] Inbox states platform limits honestly; Tier B only if Android confirmed; relay endpoint token-secured
- [ ] News links out to originals; snippets stay short; digest bullets each carry a source link
- [ ] Digest + interaction score flow into the Phase 4.5 audit
- [ ] All new stores namespaced and covered by global export/import

═══════════════════════════════════════════════════════════════

# PHASE 6 — SECURITY, CONSOLIDATION & REMAINING DOMAINS (final planned phase)

Append to the master build prompt. **Sections 6.0 and 6.1 are pulled forward in the build order — they execute immediately after Phase 0, before Phases 1–5** (see the build-order override at the top of the master prompt). Sections 6.2 onward run in normal sequence after Phase 5. Work section by section; ask every `ASK FIRST` before building. After this phase the feature list is FROZEN — an icebox at the bottom holds parked ideas; do not build them unless I explicitly promote one.

**Cross-check, do not duplicate:** the color-coded live goal countdown (neutral → 75% dark green → 50% green → 40%/35% lighter greens → 30% yellow → 20% orange → 10% red → 5–0% dark red + pulse; goal slider at 100% = always default color) and the archive-at-100% flow (Archive button → Goal History on Planner only, hidden from Dashboard → linked projects' Obsidian pages moved into a vault folder named after the goal → archived goals read-only) are **already fully specified in Phase 1.6 and 1.7**. If they are not yet built, build them there, not here. If built, verify against that spec now.

---

## 6.0 SECURITY GATE (build first — blocks everything else going to production)

The app is a public Vercel URL. localStorage keeps data per-device, but every serverless endpoint (`/api/chat`, `/api/inbox`, `/api/news`) is currently callable by anyone who finds the URL — meaning strangers can burn my Anthropic credits.

- **App lock:** first visit asks for a passcode (stored as a salted hash in an env var server-side). Correct passcode → server issues a signed session token (long-lived, e.g. 90 days) stored client-side; every serverless endpoint verifies it. Wrong/absent token → 401.
- Passcode screen matches the dark theme; "remember this device" default on.
- `/api/inbox` (Android relay) keeps its own separate secret header — the phone automation isn't a browser session.
- Rate limits on all endpoints regardless of auth (belt and braces).
- ASK FIRST: single passcode fine, or per-device revocation wanted (list of issued tokens in Settings with revoke buttons)?

## 6.1 CONSOLIDATION — merges and cuts (do before adding new pages)

Current page count is too high for the nav and several pages overlap. Apply, pending my confirmation per item:

**MERGE — Peak → Health.** Peak's real content (caffeine/energy curve, stimulant plan, schedule strip) belongs beside the Whoop panel and Daily Stack that already live on Health. Move the energy-curve feature into a "Energy" section on health.html; delete peak.html entirely. (Peak was also the page with leftover template/vitality-plug copy — merging kills two problems.)
**MERGE — Ability → "Growth" page absorbing the Learn hub (6.3).** Habits, skills, year grids, books, and the new learning system are one domain: getting better at things. One page: Growth (or keep the name Ability — ASK FIRST). Books tracker already lives here.
**CUT as a nav destination — Notes.** Quick capture (3.4) reaches note-taking from anywhere; notes.html remains as a page but moves to the More sheet, not a tab.
**ALREADY DONE in Phase 0.7 — Dashboard/Planner dedup.** Verify no editable Goals/To-Do duplication remains.
**RESULTING NAV (proposal):** tabs = Main · Health · Fitness · Planner · Interactions. More sheet = Growth · News · Notes · Settings · Ask Claude.
- ASK FIRST: confirm each merge/cut and the final tab lineup (Ask Claude might deserve a tab over Interactions depending on your usage — your call).

## 6.2 MOOD + ONE-LINE JOURNAL (cheapest missing data)

- One-tap daily mood (1–5) + optional single-line note. Lives in the evening "Close the day" flow (4.4) and as a dashboard chip if the day has no entry yet; takes < 5 seconds.
- Mood becomes a metric in the correlation view (3.5) — mood × sleep, mood × training done, mood × interaction score — and a domain in the weekly audit.
- Written into the Obsidian daily note.
- ASK FIRST: 1–5 scale or 1–10? Emoji faces or numbers? Should a very low mood (1) trigger anything (e.g. a gentler audit tone that week), or stay purely observational?

## 6.3 LEARN HUB — lifelong, not just university (lives on Growth page)

Designed to outlast the nursing degree: university now, anything after (property/finance education, coding, judo theory, whatever comes).

- **Tracks** — top-level containers: e.g. "Adult Nursing BSc", "Property investing", "Japanese". Each track: active/paused/done, optional end date.
- **Items within a track**, three types:
  - **Deadlines** — assignments, exams, applications: title, due date, weight/importance, status. Due items surface on Planner and Morning Brief automatically (≤ 7 days out). Countdown coloring reuses the Phase 1.6 color logic.
  - **Hours log** — timestamped sessions with optional note. Covers placement hours (evidenced log exportable as a table — you will need this) and any self-study. Weekly hours per track chartable, feeds the audit.
  - **Flashcard decks** — simple spaced repetition (SM-2 style): deck per topic (pharmacology, OSCE steps, anything), card = front/back, daily review queue sized by the algorithm, "due today: N" chip on Growth and Morning Brief. Deck import via paste (Q&A pairs, one per line) so decks can be generated by Ask Claude and pasted in — or, if tools allow, an `add_flashcards(deck, pairs)` assistant tool so "make me 20 cards on beta blockers" creates the deck directly.
- **Learning log** — lightweight "things I learned" capture (a destination chip on quick capture): one-liner + optional link/source, appended to the track and to Obsidian. This absorbs courses/videos/articles worth keeping.
- ASK FIRST: seed tracks to create now? Placement-hours export format (CSV table enough, or match a university template)? Flashcards in v1 or deferred?

## 6.4 TRAINING PROGRAMMING (gym.html: from ledger to coach)

- **Program builder:** define the split once — days, exercises per day, target sets × rep range, progression rule per exercise (e.g. +2.5 kg when top of rep range hit across all sets), optional deload rule (every N weeks or on trigger).
- **Today's session card:** on gym.html (and Morning Brief on training days): today's exercises pre-filled with last session's numbers + the progression suggestion. Logging a set is one tap on the suggestion or an edit.
- **Recovery gating (the very-you part):** if Whoop recovery is live and red/low (threshold configurable), the session card offers the reduced variant (e.g. −1 set per exercise, −10% load, or swap to LISS) — suggested, never forced. Decision logged, so the audit can later show whether pushing through red days cost anything.
- Rest timer inside the session view (auto-starts on set log, configurable per exercise). Interval timer for LISS/conditioning.
- ASK FIRST: your actual current split (days + exercises) to seed · progression rules per lift or one global rule · red-day threshold and preferred reduced-session shape · rest timer defaults.

## 6.5 SYMPTOM LOG (the missing half of the histamine experiment)

- Quick-log on Health: symptom type (gut / skin / energy dip / headache / other — list editable), severity 1–5, timestamp, optional note. Two taps for a standard entry.
- Timeline view overlaying symptoms on sleep hours, training days, stack adherence, and mood — the app-side correlates. (Food stays in MFP; when investigating a reaction, the timestamped symptom log here lines up against MFP's diary manually.)
- Symptom frequency/severity trend becomes an audit domain — "skin flare incidents: 1 this week, down from 4."
- ASK FIRST: confirm the symptom type list; should a severity ≥ 4 entry prompt an optional "what did you eat in the last 3h" note field specifically?

## 6.6 TASK PRIORITY LEVELS (Planner + Dashboard)

Not previously specced — adding now:
- Each task gets a priority: **P1 (must happen today) / P2 (should) / P3 (whenever)**. Default P2; set at creation or by tap-cycling a badge on the task row.
- Sort: P1 → P2 → P3 within the day; P1s render with a stronger visual weight; the Dashboard summary shows "P1s remaining: N" and the Morning Brief names the P1s explicitly.
- Completion-rate chart (1.8) gains an optional P1-only view — "did the must-dos happen" is a truer signal than raw completion %.
- Auto-slot suggestion (3.6) schedules P1s first. Assistant `add_task` tool gains a `priority` parameter.
- ASK FIRST: P1/P2/P3 labels or High/Med/Low? Cap P1s per day (e.g. max 3, forcing honesty about what "must" means)?

## 6.7 ASK CLAUDE — WEB SEARCH (events, recommendations, anything current)

Not currently the case — the assistant only sees app data. Add:
- The serverless `/api/chat` call includes Anthropic's **web search tool** (`web_search_20250305`) so the assistant can search the live web when a question needs it — "any hip hop events in London this weekend?" — real, current results with links, recommended with my location context (London/N17) and, where relevant, my data ("Saturday looks free on your calendar; recovery permitting, here are three").
- Search results always render with source links. Event suggestions get a one-tap "add to calendar" via the existing tool.
- Toggle chip in the chat UI ("Web: on/off") since searched turns cost more tokens; default ON — ASK FIRST to confirm, and whether event-finding should get a dedicated quick prompt button ("What's on near me this weekend?") on the Interactions page, since its stated purpose is fueling social plans.

## 6.8 SYNC, MIGRATIONS, SYSTEM HEALTH (infrastructure)

- **Multi-device sync via the Obsidian vault:** the app already writes to the vault through Local REST API, and the vault already syncs between my devices. Add: on app open (when Obsidian reachable), read `equavia-sync.json` from the vault; if its timestamp is newer than local, offer merge (last-write-wins per namespace, with a diff summary before applying); on close/daily, write local state back. Phone and laptop converge without a backend. ASK FIRST: which device is canonical when both changed the same namespace same day — always ask, or auto-newest?
- **Schema versioning:** `eq.schema.version` key; on load, run pending migrations sequentially; never let new code read old shapes unmigrated.
- **System health strip in Settings:** each integration (Whoop, Google, Obsidian, inbox relay, news proxy) with last-successful-sync time; stale > 48h = amber, failed = red. Failures also chip on the dashboard once, dismissible.

## 6.9 STORAGE & BACKUP HARDENING

- Migrate progress photos (and any future images) from localStorage to **IndexedDB via Dexie** — localStorage's ~5MB ceiling will otherwise truncate silently. Include IndexedDB stores in global export (photos as base64 in a separate optional archive — ASK FIRST: include photos in every export or as a separate "full export"?).
- **Auto-backup:** weekly silent export-all JSON written into the vault (`Backups/equavia-2026-W29.json`) via existing sync; keep last 8. Dashboard backup-age indicator (0.6) now reads from this.

## 6.10 ANNUAL REVIEW (nearly free, very on-brand)

- Reuses the audit machinery: on demand (December button + anytime), assembles all weekly audits + full-year domain data → one Sonnet call → a year document: trajectory per domain, kept/broken commitments, top 5 wins, top 5 costs, and 3 proposed themes for next year (Implement/Ignore, same mechanics as 4.5). Written to Obsidian as `Reviews/2026.md`.

---

## 6.11 ALLOCATION SPLIT ON THE TOTAL CARD (finance.html)

Follows all global rules: match dark card style, namespace storage (`eq.finance.allocation.*`), include in global export/import, ask all ASK FIRST questions before building.

**Feature:** The total amount card on finance.html becomes tappable. Tapping expands it (inline accordion or flip — whichever fits the existing card pattern cleaner) into an allocation breakdown of the current total:

| Bucket      | %   | Amount |
|-------------|-----|--------|
| Investment  | 50% | £X     |
| Operations  | 30% | £X     |
| Tax         | 15% | £X     |
| Play money  | 5%  | £X     |

**Behavior:**
- Amounts compute live from the current total; recompute whenever the total changes. Currency = the global GBP setting.
- Render each bucket as a row: label, %, computed amount, and a thin proportional bar so the split reads visually at a glance (one stacked bar across the top of the expanded view is also acceptable — propose one).
- Rounding: round each bucket to the nearest £1 (or 2dp — ASK FIRST) and force the buckets to sum exactly to the total by absorbing the rounding remainder into the largest bucket (Investment).
- Percentages are **user-editable in Settings → Finance** (label + % per bucket, add/remove buckets). Must total 100% — block save with an inline error if they don't. The 50/30/15/5 set above are the defaults to seed.
- Tap again (or an ✕) collapses back to the plain total card. Collapsed is the default state on every page load.
- Buckets are a **lens on the total, not separate tracked accounts** — no transactions attach to them in v1. (If later promoted: actual per-bucket balances with transfers would be an icebox item, not this build.)

**Interconnections:**
- The weekly audit (4.5) and Ask Claude may reference the split when discussing money ("Investment bucket currently £X against your FI target").
- If the FI progress features (Phase 6 icebox/finance depth) are ever built, the Investment bucket's amount is the natural input.

ASK FIRST:
- Confirm the four bucket names and defaults — and what "Operations" covers (living costs? bills? everything non-invest/non-tax?), so the label can carry a one-line description in Settings.
- Is Tax at 15% modelling something real now (side-income set-aside?) or aspirational for when self-employment income exists? (Doesn't change the build — changes whether the audit should treat the Tax bucket as a commitment or ignore it.)
- Rounding: nearest £1 or 2dp?
- Expanded view: inline accordion below the total, or the card flips/expands in place?
- Should the split also appear as a mini stacked bar on the *collapsed* card (always visible), or only when tapped?

### 6.11 acceptance
- [ ] Tap expands, tap/✕ collapses; buckets always sum exactly to the displayed total
- [ ] Percentages editable in Settings, validated to 100%, defaults 50/30/15/5
- [ ] Recomputes live when total changes; respects global currency
- [ ] No separate account tracking — display lens only
- [ ] Storage namespaced and in global export

---

## ICEBOX — parked, do not build unless explicitly promoted
- Decision journal (log big decisions + expected outcome, review at +3/6 months)
- Media log (games/films alongside books)
- Documents & renewals vault (passport, NMC, DBS, insurance dates — rules engine)
- Warranty/receipt log
- Onboarding/reset flow for a fresh device or another user
- "Why" page — static statement of the app's purpose and operating rules
- Daily news check-counter (if declined in 5.6)

## Phase 6 acceptance checklist
- [ ] No serverless endpoint responds without a valid token; rate limits on all
- [ ] Peak deleted, energy features live on Health; nav = 5 tabs + More sheet as confirmed
- [ ] Mood entry takes < 5s and appears in correlations, audit, and Obsidian daily note
- [ ] Learn hub handles a university track and a non-university track identically; placement hours exportable
- [ ] Today's-session card pre-fills from history, applies progression rules, and offers (not forces) the red-day variant
- [ ] Symptom entries are 2 taps and overlay on the health timeline
- [ ] P1 tasks visually dominant, named in Morning Brief, P1-only completion view exists
- [ ] Ask Claude answers "what's on near me this weekend" with live, linked results and can add an event to calendar
- [ ] Two devices converge through the vault sync file without data loss
- [ ] Photos live in IndexedDB; weekly auto-backup lands in the vault
- [ ] Countdown colors and goal archive verified against Phase 1.6/1.7 spec — no duplicate implementation
