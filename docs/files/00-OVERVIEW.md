# Equavia redesign — overview

Converted from `Equavia_changes_New.pdf`. Every item in the PDF appears
somewhere below; nothing was dropped.

## Phase map

Ordered by dependency, not by importance. Later phases assume earlier ones exist.

| # | Phase | Depends on | Rough size |
|---|---|---|---|
| 01 | Design tokens / neutral restyle | — | Small, touches everything |
| 02 | Dashboard tiles | 01 | Medium |
| 03 | Expand + hold-to-detail primitives | 01 | Medium, cross-cutting |
| 04 | Nav dock + AI command bar | 01 | Medium |
| 05 | Finance core (stocks, charts, toggles) | 01, 03 | **Large** |
| 06 | Finance earnings/pay calendar | 01, 05 | Medium |
| 07 | Social news feed | 01, 03 | Medium |
| 08 | Settings + landing page | 01 | Small |

Phase 03 comes before 05 and 07 deliberately. "Click to expand left" and "hold
to open detail" appear across finance, planner, health, and social in the PDF.
Build them once as reusable primitives, then apply — otherwise you'll write four
slightly different versions and they'll drift.

## Sizing reality check

Phases 05, 06, and 07 are the bulk of this. Phase 05 alone is larger than 01–04
combined, because "add stocks to finance" and "news feed" mean live market and
news data, which the rest of Equavia has never needed. See open decisions below.

Phases 01–04 and 08 are self-contained UI work on data you already have. If you
want visible progress fast, do those first and treat 05–07 as a separate project.

## Open decisions — resolve before starting the relevant phase

These are genuinely ambiguous in the PDF. Guessing wrong here wastes the most
time, so decide before writing code rather than mid-implementation.

### 1. Where does stock data come from? (blocks phase 05)

The PDF asks for share prices, P/E ratios, EPS actuals vs estimates, analyst
estimates, market cap, sector performance, and multi-year financials. Fey paid
data providers for that (S&P Global, Benzinga — visible in the reference
screenshots' copyright lines).

Options, roughly cheapest first:
- **Manual entry** — you type holdings and prices yourself. Free, no API, but
  no live prices and no estimates/financials at all.
- **Free tier API** (Alpha Vantage, Finnhub, Twelve Data) — live-ish quotes and
  some fundamentals. Rate limits are tight; analyst estimates usually absent.
- **Paid API** — full fundamentals and estimates. Realistically £30–100+/month.

Decide which, because it changes the schema, the caching strategy, and roughly
half the finance screens. Several PDF items (analyst estimates, EPS beat/miss,
multiples tables) are simply not buildable on the free tiers.

### 2. Where does news come from? (blocks phase 07)

Same problem. The reference shows per-ticker news with sentiment tags
(Positive/Negative), source attribution, and AI summaries. Sentiment tagging and
summarisation you can do yourself via the Anthropic API you already use. The
underlying headlines need a news API (NewsAPI, Finnhub news, or RSS feeds).

RSS is free and probably enough for a single-user app — worth considering before
paying for anything.

### 3. "Will list the changes made in a bigger box" — what changes?

Ambiguous in the PDF. Most likely reading: after Equavia 0 (the AI assistant)
performs actions, it shows a summary panel of what it changed. Confirm this is
the intent before building — if it means something else (a changelog? edit
history?) the implementation is completely different.

### 4. Landing page — "the red image in my original landing page but this size"

The PDF shows the Fey layout (`21-landing-page-layout-TARGET.png`) and a red V
hero graphic (`23-landing-red-hero-image.png`), and asks for one at the other's
size. Which element is meant to end up where isn't clear from the text. Needs a
sketch or a sentence of clarification.

### 5. Earnings calendar — semantics differ from the reference

The reference is a *market* earnings calendar (when companies report). The PDF
wants it repurposed for *personal* cash flow — planned pay days, incoming money.
The visual layout transfers; the data model doesn't. Confirm whether you also
want actual company earnings dates in there, or purely personal income events.

## Items in the PDF and where they landed

| PDF request | Phase |
|---|---|
| Add task/goal inputs hidden behind a neutral `+` | 02 |
| Keep greeting tile (top-left) as is | 02 |
| Keep clock/date tile (top-right) as is | 02 |
| Calendar tile — same footprint, scrollable, click to pop out | 02 |
| Book tracker: started / not started / reading | 02 |
| Turn the looks folder all neutral | 01 |
| Clicking a section expands it bigger to the left | 03 |
| Hold a graph (finance/planner/health) → detailed version | 03 |
| Everything in finance hold-to-expand for more data | 03 + 05 |
| Add stocks feature to finance | 05 |
| Line charts purple/grey, 3rd line blood red, 4th purple | 01 (tokens) + 05 |
| Dropdown for expenses/budgets + list↔graph toggle | 05 |
| Finance tab showing most recent data, page to the right | 05 |
| New earnings calendar hooked to finance (pay days, income) | 06 |
| Add news feature to social | 07 |
| Bottom search icon → AI text box bar that opens up | 04 |
| Lists changes made in a bigger box | 04 |
| Change icon bar to the floating dock | 04 |
| New settings page | 08 |
| Landing page layout | 08 |
