// =============================================================
// 6.0 SECURITY GATE — client-side passcode check.
//
// Loaded synchronously (no defer/async) as the VERY FIRST thing in <head>,
// before landing-guard.js and everything else, so an unauthenticated visit
// never gets to paint real content or run any other script.
//
// This is UX, not the actual security boundary — every gated endpoint
// verifies the token server-side via requireSession() in lib/auth.js
// regardless of what this script decides. This just avoids flashing real
// data before bouncing to the lock screen, and hands other scripts the
// header they need to call those endpoints.
//
// No per-device revocation (that needs a real server-side store this
// project doesn't have — see BUILD_EQUAVIA.md's Phase 6.0 entry). A signed
// token carrying only an expiry, checked here just to decide whether to
// redirect; the server is the real enforcement point.
// =============================================================
(function () {
  'use strict';

  // Safe no-op default so any script that runs before a pending redirect
  // actually takes effect (see window.stop() below) never throws calling
  // window.EqAuth.header() -- upgraded below once a real session is found.
  window.EqAuth = {
    header: function () { return {}; },
    signOut: function () {
      try { window.localStorage.removeItem('eq_session'); } catch (e) {}
      try { window.sessionStorage.removeItem('eq_session'); } catch (e) {}
      window.location.href = 'lock.html';
    },
  };

  // Never gate content embedded in an iframe (e.g. po-water.html inside
  // health.html) -- same rule landing-guard.js already follows, for the
  // same reason: the parent page is already gated, and an iframe has no
  // sensible place to show a lock screen.
  try { if (window.self !== window.top) return; } catch (e) { return; }

  // Never gate the lock screen itself.
  if ((window.location.pathname || '').toLowerCase().indexOf('lock.html') !== -1) return;

  function readSession(storage) {
    try {
      var raw = storage.getItem('eq_session');
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.token !== 'string' || typeof obj.exp !== 'number') return null;
      if (Date.now() >= obj.exp) return null;
      return obj;
    } catch (e) { return null; }
  }

  var session = readSession(window.localStorage) || readSession(window.sessionStorage);
  if (session) {
    var token = session.token;
    window.EqAuth.header = function () { return { 'X-Eq-Session': token }; };
    return;
  }

  // Flag checked by landing-guard.js (which runs as a later synchronous
  // <script> tag on the same page): without this, a second location
  // change fired later in the same task could supersede the redirect
  // below before the browser actually navigates, sending an unauthenticated
  // visit to index.html instead of the lock screen -- skipping the gate
  // entirely. (An earlier version tried window.stop() to prevent this
  // instead; that left headless/automated navigation-completion checks
  // hanging indefinitely, so a cooperative flag is used instead.)
  window.__eqAuthRedirecting = true;

  // No valid session -- bounce to the lock screen, carrying where to
  // return to afterward. Same-origin bare filename only (defends against
  // this ever becoming an open redirect).
  var ret = window.location.pathname.split('/').pop() + window.location.search + window.location.hash;
  if (!ret || ret.indexOf('//') !== -1 || ret.indexOf(':') !== -1) ret = 'dashboard.html';
  window.location.replace('lock.html?return=' + encodeURIComponent(ret));
})();
