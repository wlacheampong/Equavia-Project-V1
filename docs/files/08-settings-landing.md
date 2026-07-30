# Phase 08 — Settings page + landing page

Depends on: phase 01. Smallest remaining phase — good closing work.

## 8.1 — Settings page

Reference: `refs/24-settings-page-TARGET.png` (primary),
`refs/13-settings-page-with-referral-panel.png` (panel treatment).

Two-column layout:

**Left column** — a category rail with icon + label, and rows grouped under each:
- Category labels sit in the left gutter, rows to their right
- Rows are flat, separated by hairlines, with a leading icon
- Toggle rows show the switch right-aligned (`--accent-primary` when on)
- Link-out rows show a small `↗` right-aligned

Adapt the reference's categories to Equavia's actual settings. The reference has
Account / Options / Support / Referrals — Equavia needs something like Account,
Display, Sync (Supabase + Obsidian), Data (export/import), About. Don't copy
Referrals; there's no referral programme in a single-user app.

**Right column** — stacked info cards. In the reference these are subscription
and payment. Equavia's equivalents: sync status, storage usage, Obsidian
connection state.

Also present: email + sign-out top-right, and the `‹` back affordance top-left.

## 8.2 — Landing page

**⚠ Confirm open decision #4 in `00-OVERVIEW.md` before building.** The PDF asks
for *"the landing page like this but instead it is the red image in my original
landing page but this size"* — which element ends up where isn't clear.

References:
- `refs/21-landing-page-layout-TARGET.png` — the two-column layout: greeting
  top-left, status top-right, chart panel left, feed right
- `refs/23-landing-red-hero-image.png` — the red V hero graphic
- `refs/22-loading-logo-state.png` — centred-logo loading state

The layout from the first reference is unambiguous and buildable now. The hero
graphic placement is the part needing clarification — build the layout, leave the
hero slot, fill it once the intent is confirmed.

Loading state from `refs/22-loading-logo-state.png` is straightforward: centred
logo in a soft circular surface on the page background. Worth doing regardless.

## Acceptance

- Settings uses the two-column rail + cards layout
- Settings categories reflect Equavia's actual features, not the reference's
- Toggles use `--accent-primary` when on
- Landing page uses the reference layout
- Loading state implemented
- Both usable at phone width — the two-column settings layout must collapse to a
  single column, with categories as collapsible sections or a top tab strip

## Out of scope

Building settings for features that don't exist yet. If phases 05–07 were
deferred, don't add their settings rows.
