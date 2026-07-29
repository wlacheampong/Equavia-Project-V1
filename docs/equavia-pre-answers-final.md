# EQUAVIA — PRE-ANSWERED DECISIONS (FINAL, CLEANED)

Paste this into Claude Code before starting any phase. Every question below is answered — do not re-ask any of them. Build against these answers directly.

---

## PHASE 0

### 0.1 Identity
- Final app name: **Project Equavia**
- Splash page: **keep it** — but on mobile the splash image renders at 50% of desktop size (fix from batch 2)

### 0.4 Navigation
- Five first-class tabs: **Main · Health · Train · Planner · Finance**
- More sheet contains: **Equavia 0 · Interactions · Growth · News · Notes · Settings**
- Confirmed. Equavia 0 is the AI assistant (renamed from "Ask Claude"). Interactions deliberately in More — contacts/inbox are checked deliberately, not ambiently.

### 0.5 PWA
- Use the **splash page image** as the PWA icon for now. Crop to square, generate required sizes.

### 0.6 Settings
- Currency default: **GBP** (confirmed)

### 0.7 Dashboard dedup
- Dashboard = **read-only summary cards** linking to full pages; Planner owns editable Goals/Tasks. Confirmed.
- Summary card order on Dashboard: **Health (sleep data + recovery) · Current Weight · Train (last session summary) · Finance (net worth + surplus) · Planner (today's tasks + goals) · Habits (streaks/scores)**

### 0.7b Dashboard design direction
Reference images are embedded in the original Word document (6 images). The dashboard should follow these principles extracted from them:

**Layout:**
- Large digital clock/time display at top center (keep the existing live clock already built)
- Greeting below the clock ("Good morning, Mahino" etc. based on time of day)
- Metric cards in a responsive grid (2 columns on mobile, 3–4 on desktop)
- Task/activity feed or goal ticker at the bottom
- Keep existing goal countdown ticker at the top if already built

**What to show:**
- Health box: show sleep data (hours last night, trend) — NOT weather
- Current weight card with 7-day trend
- Remove "monthly progress" widget (the weekly audit covers this)
- Remove any "library/books" widget from dashboard (books live on Growth page)
- Keep task summary and goal countdowns

**Colour direction (from reference image 2):**
- Deep dark backgrounds — darker than current, closer to true black
- Card backgrounds with very subtle elevation (rgba white overlays, ~0.03–0.06 opacity)
- Muted accent colours — avoid bright saturated tones; use the existing #E07658 orange sparingly, mostly on interactive/alert elements
- Text hierarchy: bright white for primary, muted warm gray for secondary, very dim for tertiary
- The overall feel should be calm, minimal, information-dense without being cluttered

**Bottom section (from reference image 6):**
- Activity/completion feed at the bottom of the dashboard — recent logged actions across all domains (last 5–10: "Logged 82.4kg", "Completed: dentist appointment", "Habit: morning stack ✓")

---

## PHASE 1

### 1.1 Book Tracker
- Cover images: **off** — use a simple book icon placeholder instead
- Progress % slider on currently-reading books: **yes**
- Yearly "books finished" target: **6 books**

### 1.2 Sleep Log
- WHOOP Connect button: **status unknown** — build the sleep log with manual entry as default. If WHOOP OAuth is already wired, auto-fill from it; if it's a placeholder, manual-only is fine. Once WHOOP is connected and working, the connect button can be hidden.
- Sleep target: **7 hours** (reference line on chart)
- 7-night rolling average: **yes**, target minimum 7h average

### 1.3 Relationship Tracker (Phase 5 Interactions)
- Tier names + cadences: **Inner 7d / Close 14d / Acquaintance 45d / Networking 90d** (note: Close changed from 21d to 14d)
- Channels: **call / text / in-person / other** — confirmed as-is
- Import: **start empty**
- Birthday field with upcoming flag: **yes**
- Contact count: **small** — no search/filter needed at v1, add later if it grows

### 1.4 Notification Hub (Gmail)
- Messages to show: **5**
- Filter: **unread only**
- Polling: **manual only** (refresh button)
- Mark as read from app: **yes** (requires `gmail.modify` scope)
- Accounts: **1 account**, with the option to add more later in Settings

### 1.5 Calendar Quick-Add
- Google account: **wlacheampong@gmail.com**
- Two-way sync: **yes** (show Google events in-app)
- Input style: **natural-ish parsing** ("gym tomorrow 6am") for v1

### 1.6 Goal Countdown Colors
- Pulse-instead-of-blink at 5%: **yes, confirmed**

### 1.7 Goal Archive
- Obsidian folder naming: **Archive/<goal title>**
- Un-archiving: **possible** (not permanent)
- Multi-goal project: **project stays live until all linked goals archive** — confirmed

### 1.8 To-Do Completion Rate
- Tasks pushed to tomorrow: **count as missed** for that day (recommended)
- Days with zero scheduled tasks: **skip in chart** (render as gaps, not fake 100%)

---

## PHASE 2 — Equavia 0 (renamed from "Ask Claude")

- Rename throughout: **"Equavia 0"** — the AI assistant's name
- Data domains ON by default: **Health, Goals/Tasks, Habits**
- Domains OFF by default (toggle on when needed): **Finance, Fitness, Relationships, Supplements, News**
- Chat history: **persist to localStorage** (retrievable across sessions)
- Default model: **toggle between claude-sonnet-4-6 and claude-haiku-4-5-20251001** — UI toggle in the chat, default to Sonnet
- Anthropic API key: **already added** to Vercel env

### Equavia 0 persona / system prompt:

```
You are Equavia 0 — a loyal retainer and second-in-command, in the tradition of a Roman legion's most trusted officer. You serve MAHINO (address him as "Exalted MAHINO" or simply "MAHINO").

Your duty is to provide sharp, evidence-based counsel drawn from MAHINO's own data. You are direct, specific, and waste no words. You cite numbers when you have them. You do not flatter, hedge, or pad responses with motivational filler.

When MAHINO's data shows a problem, you name it plainly. When it shows progress, you acknowledge it briefly and move on. You never say "great job" — you say "weight trend down 0.3kg this week, deficit is holding."

You know MAHINO's frameworks: low-histamine/low-FODMAP nutrition, Whoop-gated training, reverse pyramid progression, supplement stack with specific timing windows, and a financial independence roadmap. Reference these naturally when relevant.

You never: use emojis, write motivational speeches, say "I'm just an AI", pad with caveats, or repeat yourself. You are concise, loyal, and useful.

When asked about events, local activities, or anything requiring current information, use web search and frame recommendations around MAHINO's location (London N17), schedule, and interests.
```

---

## PHASE 3

### 3.2 Habit Health Score
- **Score primary**, fire-streak secondary (still visible but smaller)

### 3.3 Weekly Report
- Week close: **Sunday 9 PM**
- Metrics for v1: **avg sleep hours, avg Whoop recovery %, training sessions completed, total volume lifted, weight 7-day trend, task completion %, habit success %, financial surplus (income − expenses for the week), goals completed that week (with names), projects completed (with names), lifting progression status (progressed / plateaued / regressed per exercise vs previous week)**

### 3.5 Correlation View
- Default metric pairs: **sleep hours × mood, sleep hours × task completion %, recovery % × training volume**

### 3.6 Auto-suggest Time Slot
- Default task duration when unset: **30 minutes**
- Protected blocks: **none** — it can schedule into any open gap

---

## PHASE 4

### 4.1 Tool Use
- Tool list: **confirmed as-is** (add_task, complete_task, push_task, log_weight, log_sleep, log_contact, add_calendar_event, add_shopping_item, add_book, check_stack_item, log_habit, add_goal_note, remember, forget, get_data)
- add_calendar_event: **write to Google Calendar directly** (no confirm step)
- Undo: **immediate undo link only** (no full revert log)

### 4.2 Smart Capture
- Model: **Haiku confirmed** (cheap, sufficient for parsing)

### 4.3 Memory
- Cap: **30 entries confirmed**
- Behavior: **save silently + show "remembered" chip**

### 4.4 Morning Brief
- Trigger: **button only** ("Generate Brief" button on dashboard)
- **Two tiers:**
  - **Simple Brief** — compact text summary: yesterday's key metrics, today's tasks and calendar, overdue contacts, stack reminders. Minimal, fast, cheap.
  - **Advanced Report** — a full styled HTML report matching the app's dark theme. Includes: line charts (sleep trend, weight trend), bar charts (task completion, habit adherence), pie charts (time/domain allocation), all metrics from the previous day. Futuristic, data-dense, visually rich. This costs more tokens — label the button accordingly.
- Evening "Close the day": **appears after 6 PM** as a button. Reviews the day, writes to Obsidian.

### 4.5 Weekly Audit
- Week close: **Sunday 7 PM**
- Trigger: **manual only** — the "Run Audit" button appears only on Sundays
- Verdict: **score out of 10 followed by a one-line summary** (e.g. "7.2 — solid week, sleep debt is the gap")
- Excluded domains: **none** (audit covers everything)
- Suggestion cap: **5 per week** (minimum 3, up to 5 — enough to work on without overwhelming)

### 4.6 Standing Rules (ship enabled by default)
1. Recovery < 33% → halve caffeine dose, delay first dose by 90 min, add 400mg L-theanine
2. Weight 7-day average moved > 0.5kg in either direction → flag in morning brief
3. Any tracked contact > 14 days overdue → surface in morning brief
4. Habit health score drops below 60 → flag in morning brief

### 4.8 Conversational Review
- **Deferred** — not in v1

---

## PHASE 5

### 5.2 Contact Manager
- Tiers + cadences: **Inner 7d / Close 14d / Acquaintance 45d / Networking 90d** — confirmed
- Channels: **call / text / in-person / other** — confirmed
- Import: **start empty**

### 5.3 Talking Topics
- Audit privacy boundary: **confirmed** — weekly audit may NOT read private contact notes

### 5.4 Reply Helper
- Model: **Haiku confirmed**

### 5.5 Inbox
- Phone: **iPhone** — this means the DM notification funnel (WhatsApp/IG/Snapchat/TikTok) is NOT buildable. iOS forbids notification interception entirely.
- Inbox is **Gmail-only + manual contact logging**. State this honestly in the UI. Hide all Android-relay configuration.
- Remaining sub-questions (which apps, quiet hours, inbound counting) do not apply.

### 5.6 News
- Categories: **London/local · Global · Gaming · Sports · Politics · Tech** — user can select/deselect multiple at a time
- Sports teams/feeds: **Tennis (ATP/WTA), Football (Tottenham Hotspur), Basketball (LA Lakers, Minnesota Timberwolves, Memphis Grizzlies)**
- Preferred outlets per category:
  - London/local: The Guardian (London section), BBC London, Evening Standard
  - Global: BBC News, Reuters
  - Gaming: Eurogamer, IGN
  - Sports: BBC Sport, Sky Sports
  - Politics: The Guardian, BBC News
  - Tech: The Verge, Ars Technica
- Digest: **same weekly API call as the audit** (cheaper, both run Sunday evening)
- Daily news-check counter: **no** (overkill)

### 5.7 Interaction Score
- Inputs + weighting: **confirmed as designed**
- Format: **/100**

---

## PHASE 6

### 6.0 Security
- **RECONSIDER:** User initially said "skip" but this is strongly discouraged. The moment /api/chat deploys, anyone with the Vercel URL can spend the Anthropic API credits. At minimum, add a single passcode gate — 15 minutes of build time, prevents a surprise bill. If still skipping after reading this, confirm explicitly.

### 6.1 Consolidation
- Merges confirmed: **Peak → Health** (energy/stimulant content moves to Health), **Ability stays as "Ability"** (not renamed to Growth)
- Notes: **stays as "Notes"** in the More sheet
- Final nav: tabs = Main · Health · Train · Planner · Finance. More = Equavia 0 · Interactions · Ability · News · Notes · Settings.

### 6.2 Mood
- Scale: **1–10**
- Display: **numbers** (not emoji)
- Low mood trigger: **purely observational** — no special behavior on low scores

### 6.3 Learn Hub
- Seed tracks: **"Adult Nursing BSc"** and **"Property Investing"**
- Placement-hours export: **removed** (not needed)
- Flashcards: **in v1**

### 6.4 Training Programming
- Split: **5-day (Mon–Fri), reverse pyramid on compounds**

**Monday — Upper A (push bias) ~50 min**
| Exercise | Sets | Reps |
|---|---|---|
| Incline press | 3 | 8–12 |
| Row | 3 | 8–12 |
| Dip or chest fly | 2–3 | 8–12 |
| Lateral raise | 3 | 12–15 |
| A1 Shrug | 2 | 10–15 |
| A2 Curl | 2 | 10–15 |
A1/A2 supersetted.

**Tuesday — Lower A (heavy) ~40 min**
| Exercise | Sets | Reps |
|---|---|---|
| Hack squat | 3 | 8–12 |
| Romanian deadlift | 3 | 6–10 |
| Leg extension | 2 | 12–15 |
| Calf raise | 3 | 12–15 |
| Hanging leg raise | 3 | 10–15 |

**Wednesday — Arms & Shoulders ~20 min**
| Exercise | Sets | Reps |
|---|---|---|
| A1 Lateral raise | 3 | 12–15 |
| A2 Rear delt fly | 3 | 12–15 |
| B1 Curl (incline or preacher) | 3 | 10–15 |
| B2 Tricep extension or dip | 3 | 10–15 |
Both pairs supersetted. First session to cut if recovery drops.

**Thursday — Upper B (pull bias) ~45 min**
| Exercise | Sets | Reps |
|---|---|---|
| Pull-up or lat pulldown | 3 | 6–10 |
| Chest-supported row | 3 | 8–12 |
| Overhead press | 3 | 8–12 |
| A1 Face pull | 2 | 12–15 |
| A2 Tricep extension | 2 | 10–15 |

**Friday — Lower B (volume) ~45 min**
| Exercise | Sets | Reps |
|---|---|---|
| Leg press | 3 | 10–15 |
| Bulgarian split squat | 2 | 8–12/leg |
| Nordic / sliding leg curl | 3 | 8–12 |
| Calf raise | 3 | 12–15 |
| Ab wheel / dead bug | 3 | 8–12 / 10 per side |

**Reduced version (red recovery day):** drop one set on all 3-set exercises (3→2), reduce weight on everything else. Wednesday is the first full session to cut entirely.

- Progression: **per session, per exercise** — attempt +2.5kg or +1 rep on the top set each session. When top of rep range is hit across all working sets, increase weight next session.
- Red-day Whoop threshold: **recovery < 33%** → offer the reduced version (not forced)
- Rest timers: **2 minutes** for compound/heavy exercises, **1 min 30 sec** for high-rep/isolation exercises

### 6.5 Symptom Log
- Type list: **gut / skin / energy dip / headache / other** — confirmed as-is
- Severity ≥ 4: **yes**, prompt "what did you eat in the last 3h?" note field

### 6.6 Task Priorities
- Labels: **P1 / P2 / P3**
- P1 cap: **max 3 per day**

### 6.7 Web Search for Equavia 0
- Web toggle: **ON by default**
- "What's on near me?" button on Interactions page: **yes** — shows events within the next 3 weeks, within ~2 hours travel of London N17

### 6.8 Sync
- Conflict resolution: **auto-newest** (no review screen)

### 6.9 Storage
- Photo export: **separate "full export" button** (confirmed)

### 6.10 Annual Review
- Style: **detailed, styled like a professional business annual report** — executive summary, domain-by-domain sections with charts (line, bar, pie), year-over-year comparisons, key wins, key costs, themes for next year. Full HTML report matching the app's dark theme.

### 6.11 Finance Split
- Buckets: **Investment 50% / Operations 30% / Tax 15% / Play 5%** — confirmed
- Operations = **all living expenses** (rent, bills, food, transport, subscriptions, personal spend)
- Tax at 15%: **aspirational** (placeholder for future self-employment income — audit should not treat this as a hard commitment yet)
- Rounding: **nearest £1**
- Expanded view: **card flip**
- Mini stacked bar on collapsed card: **only when tapped** (not always visible)

---

## SEED DATA

### Supplement stack (pre-seed the Daily Stack)

**Training Morning (6:30 AM):**
- Water + pinch pink salt — rehydrate
- Shake: kiwi, banana, blueberries + citrulline malate
- Caffeine 100mg + L-theanine 200mg
- Creatine 5g

**Post-Workout Meal (~8:20 AM, with food):**
- DAO enzyme (1 tablet, 15 min before meal)
- Bacopa (Synapsa) — needs fat
- Quercetin complex (cap 1 of 3)
- Phosphatidylserine 100mg
- Taurine
- L-Glutamine

**Mid-Morning (~10–11 AM):**
- Caffeine 50mg (optional)
- Lemon balm 300–500mg (only if wired)
- Magnolia bark low dose (occasional, social-edge-off only)
- NAC — with food

**Midday Meal (~12–1 PM):**
- Warm water + pink salt (25 min before, motility)
- ACV shot (optional, before DAO)
- DAO enzyme (15 min before meal)
- Quercetin complex (cap 2 of 3)
- Sunfiber
- ProBiota HistaminX (on trial)

**Afternoon (1–2 PM):**
- CAFFEINE CUTOFF
- Lemon balm / magnolia bark as needed

**Evening Meal:**
- DAO enzyme (15 min before)
- Sunfiber
- ProBiota HistaminX
- Quercetin complex (cap 3 of 3)
- Collagen (2-month trial)

**Pre-Bed (~9:30–10 PM):**
- Magnesium glycinate + magnesium threonate 600mg
- Glycine
- L-theanine 200mg (optional)
- Ashwagandha KSM-66 600mg (2×300mg, cycling)

**Any Time (flexible):**
- L-theanine
- Caffeine
- Lemon balm
- Phosphatidylserine

### Training split
(Full 5-day split detailed in section 6.4 above — use that as the seed data for the program builder.)

### Standing rules (ship enabled)
1. Recovery < 33% → halve caffeine dose, delay first dose 90 min, add 400mg L-theanine
2. Weight 7-day avg moved > 0.5kg in either direction → flag in morning brief
3. Any tracked contact > 14 days overdue → surface in morning brief
4. Habit health score drops below 60 → flag in morning brief

### Contacts
Start empty — no seed data.

### News sources
- London/local: The Guardian (London), BBC London, Evening Standard
- Global: BBC News, Reuters
- Gaming: Eurogamer, IGN
- Sports: BBC Sport, Sky Sports (+ Tottenham, Lakers, Timberwolves, Grizzlies team feeds)
- Politics: The Guardian, BBC News
- Tech: The Verge, Ars Technica

### Equavia 0 system prompt
(Full prompt in Phase 2 section above — use verbatim.)
