# Equavia design tokens

Colours measured directly from pixels in the Fey reference screenshots, not
eyeballed. Every component reads from these variables — no hardcoded hex values
anywhere in the codebase.

```css
:root {
  /* ---- Surfaces ---- */
  --bg-page:        #0d0d10;  /* near-black, faint cool cast */
  --bg-page-alt:    #121418;  /* some screens sit slightly lighter */
  --bg-modal:       #000000;  /* full-screen overlays go pure black */
  --bg-card:        #0d0d10;  /* same as page — see note below */
  --bg-input:       #16181c;  /* text fields, search bars */

  /* ---- Borders / dividers ---- */
  --border-hairline: #1e2024;  /* the main separation device */
  --border-focus:    #2a2d33;

  /* ---- Text ---- */
  --text-primary:    #f5f5f5;  /* off-white, never pure #fff */
  --text-secondary:  #8a8d94;  /* labels, metadata */
  --text-tertiary:   #5a5d64;  /* de-emphasised / placeholder */

  /* ---- Accents ---- */
  --accent-primary:  #ff9860;  /* coral-orange: toggles on, primary action */
  --positive:        #6fa491;  /* muted sage green — deliberately not neon */
  --negative:        #f01a28;  /* vivid crimson */
  --highlight-est:   #e1e7ac;  /* pale yellow-green: estimated/projected values */

  /* ---- Chart series (in order) ---- */
  --chart-1: #ffffff;  /* primary series — white */
  --chart-2: #9580b3;  /* second series — purple */
  --chart-3: #c8102e;  /* third series — blood red */
  --chart-4: #6b4c8a;  /* fourth series — deeper purple */
  --chart-grid: #1e2024;
}
```

## Notes that matter for implementation

**Cards are not lifted.** `--bg-card` is intentionally identical to `--bg-page`.
Separation in the reference comes from a 1px hairline border and generous
padding, never from a lighter fill or a box-shadow. Resist the urge to add
elevation — it's the single thing that will make this look off-reference.

**Chart series order** is from the PDF: white/grey primary, purple second, blood
red third, purple fourth. Note that 2 and 4 are both purple — that's what was
asked for, but if four series ever render simultaneously they'll be hard to tell
apart. Worth revisiting if a 4-series chart actually ships.

**Accent restraint.** In the reference, `--accent-primary` appears on maybe two
elements per screen. It reads as premium because it's rare. Using it on every
button will flatten the effect.

**Semantic colours are for data, not decoration.** `--positive` / `--negative`
mean "this number went up/down" — don't reuse them for success/error toasts.

## Typography

Can't extract the exact typeface from raster screenshots. The reference reads as
a geometric sans with tight tracking on headings. Reasonable free matches:
Inter, Geist, or system `-apple-system` stack. Pick one, set it once.

Observed weight pattern:
- Large figures / headings: medium-to-semibold, tight tracking
- Body and table cells: regular
- Labels and metadata: regular at a smaller size, `--text-secondary`

## Not yet measured

- Exact corner radius — reads as roughly 10–14px on cards and buttons. Measure
  from a screenshot at 1:1 before settling on a value.
- Spacing scale. The reference is generous; start from an 8px base and lean
  toward larger gaps than feel natural.
