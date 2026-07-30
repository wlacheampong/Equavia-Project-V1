# Phase 05 — Finance core

**Largest phase by a wide margin.** Blocked on open decision #1 in
`00-OVERVIEW.md` (stock data source). Do not start until that's resolved — the
answer determines the schema and roughly half these screens.

Depends on: phase 01 (tokens), phase 03 (expand/hold primitives).

## 5.1 — Stocks feature

PDF: *"add stocks feature to finance."*

Scope depends entirely on the data source decision. Three tiers:

**Tier A — manual (no API)**
- Holdings list: ticker, quantity, cost basis, manually-entered current price
- Computed: position value, gain/loss, portfolio total
- Everything else in this section is unavailable

**Tier B — free-tier API**
- Everything in A, with live/delayed quotes fetched and cached
- Day change per position and portfolio-wide
- Simple price history chart per ticker
- Aggressive caching required — free tiers rate-limit hard. Cache quotes for
  minutes, not seconds, and degrade gracefully when the limit is hit.

**Tier C — paid API**
- Everything in B, plus the fundamentals screens the references show:
  ticker detail with KPI picker (`refs/06-finance-ticker-detail-with-kpi-picker.png`),
  financials tables (`refs/10-finance-financials-table-holdpress.png`),
  analyst estimates and multiples

**Build the tier you've chosen. Don't build UI for data you can't fetch** — empty
states pretending to be features are worse than not having the feature.

## 5.2 — Chart series colours

Apply `--chart-1` through `--chart-4` from `docs/design-tokens.md` to all finance
charts. Series order: white → purple → blood red → deeper purple.

Reference: `refs/17-line-chart-purple-grey-TARGET.png`.

Note the reference's dual-axis treatment — primary series occupies the upper
two-thirds, secondary series sits in a compressed band below with its own scale.
Worth copying when comparing series of very different magnitudes.

Caveat already flagged in design-tokens.md: series 2 and 4 are both purple. Fine
for two or three series; problematic at four. Revisit if a 4-series chart ships.

## 5.3 — Expenses / budgets dropdown + view toggle

PDF: *"drop down menu for my expenses budgets and all section that would make
sense in finance, with a button at the top to switch between this view and graph."*

- A dropdown at the top of Finance selects the active section: Expenses,
  Budgets, Income, Subscriptions, Net worth, Holdings — whichever of these
  Equavia already has data for. Don't invent sections.
- A segmented toggle beside it switches the selected section between **list**
  and **graph** rendering
- Selection persists across sessions

Reference for dropdown treatment: `refs/20-landing-page-with-dropdown.png` — note
the flat panel, hairline row separators, search field pinned at the bottom of the
list.

## 5.4 — Finance tab: recent-data view

PDF: *"let there be a tab option on finance where it would look like this showing
the most recent data, with the rest of the page to the right."*

Two-column layout: a scrollable list of most-recent finance events on the left,
detail/context for the selected item on the right.

Reference: `refs/18-finance-tab-recent-data-list.png`.

Use the `expandPanel` primitive from phase 03 rather than a bespoke split view.
On mobile this collapses to list-then-detail navigation, not side-by-side.

## 5.5 — Apply hold-to-detail across finance

PDF: *"Everything held down in finance can be held down to open up bigger more
detailed charts where i can see more data."*

Attach the `holdToDetail` primitive from phase 03 to every chart and data table
in Finance. Per phase 03, each also needs a visible click affordance.

Detail views should show: longer time range, more granular data points, and any
secondary metrics hidden in the compact view.

## Acceptance

- Chosen data tier is fully implemented; no placeholder UI for unavailable data
- All finance charts use the token chart colours in the specified order
- Section dropdown and list/graph toggle work and persist
- Recent-data view uses the phase 03 primitive, not a new implementation
- Every finance chart and table responds to hold, and has a click equivalent
- API failures and rate limits show a clear state, not a blank chart
- Works at phone width

## Suggested split

This phase is large enough to break across sessions:
1. 5.2 + 5.3 (chart colours, dropdown/toggle) — no API dependency
2. 5.1 (stocks, per chosen tier)
3. 5.4 + 5.5 (recent view, hold-to-detail application)

Commit between each.
