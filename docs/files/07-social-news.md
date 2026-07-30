# Phase 07 — Social news feed

Depends on: phase 01, phase 03.
**Blocked on open decision #2 in `00-OVERVIEW.md`** (news data source).

PDF: *"Add news feature to social."*

## 7.1 — Feed list

Reference: `refs/05-expand-left-pattern-and-news-feed-TARGET.png` (right column)
and `refs/09-news-headlines-list.png`.

Each item shows:
- Source badge / small icon
- Headline, one or two lines
- One-line excerpt in `--text-secondary`
- Timestamp, relative ("3h ago"), right-aligned
- Hairline divider between items — no cards, no borders per item

The reference's per-item sentiment tags (Positive / Negative) and source
attribution are worth copying. Sentiment you can generate yourself through the
Anthropic API you already use for Equavia 0 — that doesn't need a paid data
provider.

## 7.2 — Daily recap

Reference: `refs/05-expand-left-pattern-and-news-feed-TARGET.png`, top-right panel.

A single summary block at the top of the feed, synthesising the day's items into a
short paragraph, with a "Read more" link and a "Summarised at HH:MM" timestamp.

Generate via the Anthropic API from the fetched headlines. Cache it — regenerate
once or twice a day, not on every page load. Note the API cost is per generation,
so an uncached recap on every visit adds up.

## 7.3 — Summary detail view

Reference: `refs/08-news-summary-modal.png`

Opening an item shows an expanded summary using the shared detail shell from
phase 03:
- Source badge, headline, generated summary paragraph
- Source links as small cards
- "Other headlines" list beneath — related items
- A confidence / caution indicator where the summary is drawn from thin sourcing

That last one is worth keeping. The reference marks low-confidence summaries
explicitly, and an AI-generated news summary that doesn't distinguish
well-sourced from thinly-sourced claims is actively misleading. If you're
generating summaries with an LLM, flagging uncertainty is the honest default.

## 7.4 — Source selection

Given the data-source decision, provide a way to choose what's in the feed —
topics, RSS URLs, or tickers, depending on what you went with. Single-user app, so
this can be a simple editable list, not a full preferences UI.

## Acceptance

- Feed renders items with source, headline, excerpt, relative timestamp
- Items open into the shared phase 03 detail shell
- Daily recap generates and caches
- Summaries carry a sourcing-confidence indicator
- Feed sources are configurable
- Fetch failures show a clear state rather than an empty list
- Usable at phone width

## Out of scope

Posting, sharing, or any social interaction beyond reading. "Social" here means
the existing Social section gains a news feed — not that news becomes social.
