// Routes every fresh entry into the app through the landing page
// (index.html) first. "Fresh entry" means a hard refresh, a typed URL,
// a bookmark, or a new tab — anything that isn't a click from inside
// the app's own navigation (topbar / bottom tabs / the landing hero).
//
// Loaded synchronously (no defer/async) as the very first thing in
// <head>, before styles or other scripts, so the redirect — when it
// fires — happens before this page paints.
(function () {
  // Never redirect content embedded in an iframe (e.g. the water
  // tracker embedded inside health.html).
  try {
    if (window.self !== window.top) return;
  } catch (e) {
    return;
  }

  // Never hijack an OAuth redirect back into this page (e.g. WHOOP
  // sending the browser to health.html?code=...&state=...). The
  // referrer on that hop is the OAuth provider's domain, not this
  // site, so without this check it would look identical to a fresh
  // site open and the auth code would be lost before the page's own
  // JS ever reads it.
  if (/[?&]code=/.test(window.location.search)) return;

  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var navType = nav
    ? nav.type
    : (performance.navigation ? ['navigate', 'reload', 'back_forward'][performance.navigation.type] : 'navigate');

  var referrer = document.referrer || '';
  var cameFromThisSite = referrer.indexOf(window.location.origin) === 0;

  // A reload of this exact page, or arriving with no same-origin
  // referrer at all, both count as "opening the site" — send them to
  // the landing page. Normal in-app navigation (referrer is another
  // page on this site, type 'navigate') is left alone.
  if (navType === 'reload' || !cameFromThisSite) {
    window.location.replace('index.html');
  }
})();
