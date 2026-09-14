# MindVault

A React Native / Expo self-help prototype for ages **13+**, with an original animated squirrel companion. The public UI demo and the local **Quiet Forest** functional prototype are separate experiences.

Owner and publisher: **prajeetjoshua-hub**.

## Live demo

**[Open the MindVault live demo](https://prajeetjoshua-hub.github.io/MindVault/)**

Scan this QR with your phone camera to open the same webpage. No installation or Expo Go is required.

<a href="https://prajeetjoshua-hub.github.io/MindVault/">
  <img src="docs/live-demo-qr.png" alt="QR code linking to the MindVault live web demo" width="220" height="220" />
</a>

Hosted on GitHub Pages. The demo remains UI-only, with chat interaction locked.

The black-and-green webpage places the working phone demo on the left and explains the MindVault idea on the right. On smaller screens these sections stack. Scroll inside the phone to explore the white-and-light-green app.

## Local Quiet Forest prototype

The functional prototype includes typed conversations, guided check-in, preferences, manually saved password-protected chats, export, memory controls, visible deterministic/Qwen reply labels, experimental deterministic routing and a separate live pipeline dashboard. Desktop regression tests cover routing, long-message processing, cancellation, model fallback, saved-chat password verification and diagnostic authentication. Passing these tests is not clinical validation.

```sh
npm ci
npm test
npm run prototype:web
```

Open `http://localhost:8082/`. In a second terminal run `npm run dashboard`, then open the private local URL it prints. Pair through **Settings → Demo connection** to see actual trace events and score contributions. Do not publish session tokens. The browser prototype keeps conversation data in memory only.

Native authentication, encrypted storage and local-model adapters are written but still require an Android build and device testing. **Offline voice is not enabled.** Phone testing targets a Samsung F15 with Android 16 and 6 GB RAM. The native prototype requires a development or standalone build, not Expo Go.

See [the architecture, model artifact, limitations and run instructions](docs/FUNCTIONAL-PROTOTYPE.md). Use `npm run prototype:export` for a static functional browser build; the existing website export remains separate.

## Public UI demo status

This is **UI-only progress**. Home, introductory guidance, Type / Voice / Guided Check-in entry cards, companion animation, About, and navigation are implemented. Every entry card opens a **not yet unlocked** screen. There is no chat composer or microphone recording. The greeting is scripted.

Clinical logic, safety classification, intelligent routing, local storage, backend services, and clinical validation are **not implemented**. The prototype provides no medical advice, diagnosis, treatment, or emergency support.

The intended 13+ audience is a design scope, not a validated suitability claim. Age-appropriate safeguards and evaluation are required before an interactive release for teenagers.

## Public UI demo preview

Use Node.js 22.13 or newer (Node 24 recommended).

```sh
npm ci
npm start
```

Scan the QR printed by Expo with an SDK 57-compatible Expo Go app. Keep phone and computer on the same Wi-Fi and keep the development server running. On Android, use Expo Go's scanner; on iOS, use Camera. If Expo Go reports an SDK mismatch, use a compatible Expo Go version or an SDK 57 development build. A QR is a temporary development address, not a published app.

```sh
npm run web        # browser preview
npm run android    # Android emulator/device
npm run ios        # iOS simulator; requires macOS
npm run typecheck
npm run export:web # static browser build in dist/
```

## Walkthrough

1. Read the introductory 13+ notice and select **Got it** (session-only dismissal).
2. Tap the squirrel to see a small hop. System reduced-motion preferences disable the animation.
3. Select **Type**, **Voice**, or **Guided Check-in**. Each opens its labelled locked companion preview.
4. Return using **Back to your space**, the bottom navigation, or Android Back.
5. Open **About** for an honest description of current progress and future work.

## Privacy-first direction

The public UI demo requests no personal entries, account details, microphone permission, or health history. Its navigation state resets on reload. The functional prototype adds user-entered conversations and optional local diagnostics; its desktop storage is volatile and its native security still awaits device verification. Expo development tooling connects to the development server. Neither prototype is a certified private health-data system.

## Structure

```text
App.tsx                       Entry component
apps/mobile/                  Quiet Forest native/desktop functional prototype
apps/dashboard/               Separate live diagnostic website
packages/                     Independent processing layers and contracts
tools/monitor-service/        Authenticated local diagnostic receiver
tests/                        Synthetic regression tests
scripts/                      Separate preview, export and test commands
metro.config.js               Isolated public/prototype build caches
src/MindVault.tsx             Home, locked preview, About, navigation
src/components/Squirrel.tsx   Original vector companion and hop animation
src/theme.ts                  Shared color palette
app.json                      Expo application settings
app.config.js                 GitHub Pages production base path
.github/workflows/pages.yml    Build and publish on pushes to main
docs/live-demo-qr.png          Permanent live-demo QR
```

Dependencies are pinned by package-lock.json. Desktop use needs no cloud service keys. Native device QA, trusted phone-to-dashboard HTTPS setup, model licence access and clinical evaluation remain pending.

## Website publishing

GitHub Pages is configured to deploy through GitHub Actions. Every push to `main` checks types, exports the Expo web app, and publishes `dist/`. The workflow sets `GITHUB_PAGES=true` so web assets load correctly under `/MindVault/`. Normal local development keeps the root path.

