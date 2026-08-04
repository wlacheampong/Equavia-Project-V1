// =============================================================
// Shared inline-SVG icon fragments -- only icons that actually recur
// across more than one file live here. Everything else stays a local
// constant in its own file's IIFE; this isn't a general icon library,
// just the handful of glyphs multiple pages independently needed.
//
// Same minimal style as js/topbar.js's own nav icons: viewBox 0 0 24 24,
// no fill, currentColor stroke, stroke-width 1.8, round caps/joins.
// Callers wrap the raw fragment in that <svg> shell themselves, matching
// topbar.js's own pattern -- this file exports paths, not markup.
// =============================================================
window.EqIcons = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  // Same X path as topbar.js's own AI-sheet close button, for consistency.
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'
};
