# Phase 01 — Design tokens / neutral restyle

**Do this first.** Every later phase reads from these variables. Doing it after
the fact means re-touching every component.

## Goal

Replace the current ad-hoc colours across the whole app with the token set in
`docs/design-tokens.md`, so the app reads as a single neutral near-black system
rather than a collection of differently-styled screens.

The PDF phrases this as: *"just added a looks folder to equavia project v1, turn
it all neutral like the inspo image in the folder."*

## Tasks

1. Add the full `:root` custom property block from `docs/design-tokens.md` to the
   global stylesheet.
2. Audit every stylesheet for hardcoded colour values — hex, `rgb()`, `hsl()`,
   and named colours. Replace each with the appropriate token.
3. Remove `box-shadow` elevation from cards and tiles. Replace with
   `1px solid var(--border-hairline)`.
4. Set `--bg-page` on `body`. Cards get `--bg-card` (same value) plus the
   hairline border.
5. Standardise corner radius to one value via a `--radius-card` token. Measure
   from `refs/24-settings-page-TARGET.png` first.
6. Pick and set the typeface globally (see design-tokens.md).

## Acceptance

- `grep` for `#` followed by 3 or 6 hex digits in the CSS returns only the
  `:root` block.
- No `box-shadow` on cards or tiles.
- Every screen uses the same page background — no screen-specific variants.
- Toggle switches in the "on" state use `--accent-primary`.
- Nothing else changed: no layout moves, no markup restructuring, no new
  features. This phase is colour and border only.

## References

- `refs/24-settings-page-TARGET.png` — the clearest example of the flat-card,
  hairline-divider treatment
- `refs/17-line-chart-purple-grey-TARGET.png` — chart series colours in context
- `refs/16-nav-dock-closeup-TARGET.png` — accent restraint on interactive chrome

## Note

Resist scope creep here. It's tempting to fix layout while you're in each file.
Don't — the layout changes are phases 02 onward, and mixing them makes the diff
impossible to review.
