import { TRUSTED_LOGIN_HOSTS } from '@/config/services';
import type { Credentials } from '@/lib/secure';

/** Messages posted from the page back to the app. */
export type PageMessage =
  | { type: 'page'; url: string; hasPassword: boolean; title: string }
  | { type: 'captured'; username?: string; password?: string }
  | { type: 'submitted'; step: 'username' | 'password' | 'staySignedIn' }
  | { type: 'loginError'; message: string };

/**
 * Builds the script injected into every page the session web view loads.
 *
 * It reports what kind of page is showing (so the app knows whether the
 * session is live). With `remember` on it also:
 * - remembers what the user types into the Microsoft / Union sign-in form
 *   (posted back as `captured`, stored by the app in the secure keystore),
 * - answers Microsoft's "Stay signed in?" with yes, so the identity provider
 *   issues a long-lived cookie.
 * When saved credentials are supplied it signs in for the user: it picks the
 * remembered account on Microsoft's account picker and fills Colleague's
 * login form or Microsoft's two-step username → password pages.
 *
 * Nothing is read or typed outside TRUSTED_LOGIN_HOSTS, and each step submits
 * at most once per page load. The app stops passing credentials after a
 * rejected attempt, so a wrong password never loops.
 */
export function buildPageScript(creds: Credentials | null, opts: { remember: boolean }) {
  return `(function () {
  if (window.__uuHub) return;
  window.__uuHub = true;
  var C = ${JSON.stringify(creds && creds.password ? creds : null)};
  var KNOWN_USER = ${JSON.stringify(creds?.username ?? '')};
  var REMEMBER = ${JSON.stringify(opts.remember)};
  var HOSTS = ${JSON.stringify(TRUSTED_LOGIN_HOSTS)};
  var USER_SEL = 'input[name=loginfmt], input[name=UserName], input[name=username], input[type=email], input[autocomplete=username], input#username, input#UserName';
  var done = {};

  function post(m) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function trusted() {
    var h = location.hostname;
    return HOSTS.some(function (x) { return h === x || h.slice(-(x.length + 1)) === '.' + x; });
  }
  function shown(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }
  function first(sel) {
    var all = document.querySelectorAll(sel);
    for (var i = 0; i < all.length; i++) if (shown(all[i])) return all[i];
    return null;
  }
  function type(el, v) {
    el.focus();
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function submit(field) {
    var btn = first('#idSIButton9, button[type=submit], input[type=submit], #login-button, .esg-button--primary');
    if (btn) return btn.click();
    if (field && field.form) field.form.requestSubmit ? field.form.requestSubmit() : field.form.submit();
  }
  function errorText() {
    var el = first('.validation-summary-errors, .field-validation-error, #passwordError, #usernameError, .esg-alert--error, .alert-error, .error, [role=alert]');
    var t = el && (el.innerText || '').trim();
    return t && t.length < 300 ? t : '';
  }

  // Remember what the user signs in with, at the moment they submit it.
  function capture() {
    if (!REMEMBER || !trusted()) return;
    var u = first(USER_SEL), p = first('input[type=password]');
    var m = { type: 'captured' };
    if (u && u.value && u.type !== 'hidden') m.username = u.value.trim();
    if (p && p.value) m.password = p.value;
    if (m.username || m.password) post(m);
  }
  document.addEventListener('submit', capture, true);
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('button, input[type=submit], input[type=button], #idSIButton9');
    if (t) capture();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') capture(); }, true);

  var lastReport = '';
  function tick() {
    var pw = first('input[type=password]');
    var report = location.href + '|' + !!pw;
    if (report !== lastReport) {
      lastReport = report;
      post({ type: 'page', url: location.href, hasPassword: !!pw, title: document.title });
    }
    // A login form that already shows an error means the last attempt was
    // rejected (the server re-renders the page). Report it and never retry,
    // so a stale password can't lock the account.
    if (C && (pw || done.password || done.username)) {
      var err = errorText();
      if (err) { post({ type: 'loginError', message: err }); C = null; }
    }
    if (!trusted()) return;

    if ((REMEMBER || C) && !done.staySignedIn && document.querySelector('#KmsiCheckboxField, input[name=DontShowAgain]')) {
      done.staySignedIn = true;
      var box = document.querySelector('#KmsiCheckboxField, input[name=DontShowAgain]');
      if (box && !box.checked) box.click();
      var yes = first('#idSIButton9, input[type=submit]');
      if (yes) { post({ type: 'submitted', step: 'staySignedIn' }); yes.click(); }
      return;
    }

    // Microsoft "Pick an account": choose the remembered one.
    if (KNOWN_USER && !done.picker) {
      var tiles = document.querySelectorAll('[data-test-id]');
      for (var i = 0; i < tiles.length; i++) {
        if ((tiles[i].getAttribute('data-test-id') || '').toLowerCase() === KNOWN_USER.toLowerCase() && shown(tiles[i])) {
          done.picker = true;
          tiles[i].click();
          return;
        }
      }
    }

    if (!C) return;
    var user = first(USER_SEL);
    if (pw && !done.password) {
      done.password = true;
      if (user && !user.value) type(user, C.username);
      type(pw, C.password);
      post({ type: 'submitted', step: 'password' });
      setTimeout(function () { submit(pw); }, 150);
      return;
    }
    if (!pw && user && !done.username && user.name === 'loginfmt') {
      done.username = true;
      type(user, C.username);
      post({ type: 'submitted', step: 'username' });
      setTimeout(function () { submit(user); }, 150);
    }
  }

  tick();
  var n = 0;
  var timer = setInterval(function () { tick(); if (++n > 120) clearInterval(timer); }, 500);
})(); true;`;
}

/** True when the page is a signed-in Self-Service page. */
export function isSignedInPage(msg: { url: string; hasPassword: boolean }, origin: string) {
  if (msg.hasPassword) return false;
  if (!msg.url.startsWith(origin)) return false;
  return !/\/account\/(login|logoff|signin)|\/saml|\/login/i.test(msg.url);
}

/**
 * Follows the first link whose text matches `pattern`. Used for pages that
 * have no stable URL. Hidden menu links (e.g. Colleague's "User Options"
 * dropdown) count too, since they are navigated to directly rather than clicked.
 */
export function buildFollowLinkScript(pattern: string) {
  return `(function () {
  var re = new RegExp(${JSON.stringify(pattern)}, 'i');
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var text = (a.textContent || '') + ' ' + (a.getAttribute('aria-label') || '');
    if (re.test(text) && a.href.indexOf('javascript:') !== 0) { location.assign(a.href); return; }
  }
})(); true;`;
}
