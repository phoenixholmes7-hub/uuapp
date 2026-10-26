# Union Hub

An unofficial, faster replacement for the **MY. | The Union App** (`edu.uu.mobileapp`).
Like the original, it's a front end for Union University's Ellucian Colleague
Self-Service (`selfservice.uu.edu`), but:

- **It remembers you.** Sign in once. With "Keep me signed in" on, your
  credentials go into the iOS Keychain / Android Keystore and the app signs
  back into Self-Service silently whenever the session expires — including
  Microsoft's two-step sign-in and its "Stay signed in?" prompt. Optional
  Face ID / fingerprint lock.
- **It's fluid.** Home, Discover and Account are native screens with spring
  animations and haptics. Self-Service pages open in a single web view that is
  created once and kept alive, so it's already signed in and warm when you
  tap a card, and nothing reloads when you go back.
- **It handles foldables.** Unfolded (or on a tablet / wide window) it switches
  to two panes — cards on the left, the Self-Service page on the right, split
  along the hinge on book-style foldables. Folding and unfolding re-lays-out
  live without restarting the app or dropping the session, and the grid adds
  columns as space allows.

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go
```

Everything used is included in Expo Go. For an installable build:

```bash
npx eas-cli@latest build --platform android --profile preview
```

A native build (EAS or `npx expo run:android`) is needed for the foldable
manifest settings in `plugins/with-foldable-support.js` to apply; Expo Go
still re-lays-out on fold but Android may restart it.

`npx expo start --web` runs a layout preview in the browser. Self-Service
can't be embedded there, so pages open in a new tab and sign-in isn't
verified.

## Configure

All Self-Service URLs live in `src/config/services.ts`. The paths are
Colleague Self-Service defaults; if one of Union's pages lives elsewhere,
change its `path` there. To add a card, add an entry to `SERVICES`.

## How sign-in works

`src/lib/autofill.ts` builds a script injected into each page the session web
view loads. It reports whether the page is a signed-in Self-Service page and,
when credentials are available, fills Colleague's login form or Microsoft's
username → password → "Stay signed in" steps.

Safety rails:

- Credentials are only typed into pages on `TRUSTED_LOGIN_HOSTS`
  (`uu.edu` and `login.microsoftonline.com`).
- If a login page shows an error, the app stops autofilling and asks you to
  sign in again, so a changed password can't lock your account through retries.
- If sign-in doesn't finish within 20 seconds (for example an MFA prompt),
  the page is shown so you can finish it yourself.
- Signing out deletes the stored credentials and logs off Self-Service.

## Layout

```
src/app/                 routes (expo-router)
  _layout.tsx            providers, auth gate, list + page pane shell
  login.tsx, locked.tsx
  (tabs)/                Home, Discover, Account
src/components/
  portal-sheet.tsx       the persistent Self-Service web view (sheet / side pane)
  card-grid.tsx, service-card.tsx, screen.tsx
src/state/               session (auth + web session) and prefs (pins, recents)
src/lib/                 autofill script, secure storage, prefs storage
src/hooks/use-layout.ts  phone / two-pane / foldable breakpoints
plugins/                 Expo config plugin for seamless fold/unfold on Android
```
