# MindVault

A React Native / Expo self-help prototype for ages **13+**, with an original animated squirrel companion. The public UI demo and the local **Quiet Forest** functional prototype are separate experiences.

Owner and publisher: **prajeetjoshua-hub**.

## Local Quiet Forest prototype

The functional prototype includes typed conversations, guided check-in, preferences, manually saved four-digit-PIN-protected chats, export, memory controls, visible deterministic/Qwen reply labels, experimental deterministic routing and a separate live pipeline dashboard. On the native app, the PIN is created once and the phone's system authentication protects later access; the browser preview keeps its unlock only until that tab closes. Desktop regression tests cover routing, long-message processing, cancellation, model fallback, saved-chat PIN verification and diagnostic authentication. Passing these tests is not clinical validation.

```sh
npm ci
npm test
npm run prototype:web
```

Open `http://localhost:8082/`. In a second terminal run `npm run dashboard`, then open the private local URL it prints. Press **Pair a device**, copy the visible JSON configuration, and paste it into **Settings → Demo connection**. After the first live event, the pairing controls collapse and the dashboard uses a landscape card grid for the selected message. The dashboard shows the local test message, receipt time, actual trace events and score contributions in memory. Do not publish session tokens. The browser prototype uses tab-scoped session storage so chat, drafts, saved chats and connections survive tab switches and reloads; closing the tab clears that session. Enter submits a completed four-digit PIN in the desktop preview.

The desktop Qwen launcher uses a single request slot, quantised key/value caches and skips model warm-up to reduce memory pressure. If the local runtime stops or restarts, the prototype removes the stale connection instead of continuing to show **QWEN CONNECTED**. Deterministic support remains available, and an unmatched message receives a warm authored fallback without exposing model or runtime details.

An ARM64 standalone Android release APK has been built with the functional UI, native authentication, encrypted SQLCipher storage, local-model runtime and screenshot/recents protection. Physical-device behavior still requires testing on the Samsung F15 with Android 16 and 6 GB RAM. **Offline voice is not enabled.** This native prototype does not use Expo Go.

Use `npm run android:apk` from the short Desktop checkout to create `build-artifacts/MindVault-android-arm64.apk`. Follow [the Android install, Qwen import, HTTPS dashboard and airplane-mode test guide](docs/ANDROID-DEVICE-SETUP.md).

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

Dependencies are pinned by package-lock.json. Desktop use needs no cloud service keys. The trusted phone-to-dashboard HTTPS tooling is implemented; certificate installation and physical-device QA remain pending. Model licence access and clinical evaluation remain separate requirements.

## Website publishing

GitHub Pages is configured to deploy through GitHub Actions. Every push to `main` checks types, exports the Expo web app, and publishes `dist/`. The workflow sets `GITHUB_PAGES=true` so web assets load correctly under `/MindVault/`. Normal local development keeps the root path.

