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

Union signs students in with Microsoft (often with MFA), so the app never
asks for a password itself. **Sign in with Microsoft** opens Microsoft's real
sign-in page inside the app's web view; the app watches for Self-Service to
open and then switches to Home.

With **Keep me signed in** on:

- the app answers Microsoft's "Stay signed in?" with yes, so Microsoft keeps
  a long-lived session cookie;
- what you type into the Microsoft / Union sign-in form is saved to the
  device keychain, and `src/lib/autofill.ts` uses it to sign back in silently
  (choosing your account on "Pick an account", or filling username and
  password) whenever that cookie runs out.

Safety rails:

- Nothing is read from or typed into pages outside `TRUSTED_LOGIN_HOSTS`
  (`uu.edu` and `login.microsoftonline.com`).
- If a sign-in page shows an error, autofill stops and Home asks you to sign
  in again (your new password is saved), so retries can't lock your account.
- If a silent sign-in stalls (for example an MFA approval), Home shows a
  "Sign in" banner that opens the page.
- Signing out deletes the saved sign-in and logs off Self-Service and
  Microsoft.

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
