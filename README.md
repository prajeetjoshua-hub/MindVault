# MindVault

A calm, white-and-light-green React Native / Expo interface prototype for adults **18+**, with an original animated squirrel companion.

Owner and publisher: **prajeetjoshua-hub**.

## Prototype status

This is **UI-only progress**. Home, introductory guidance, Type / Voice / Guided Check-in entry cards, companion animation, About, and navigation are implemented. Every entry card opens a **not yet unlocked** screen. There is no chat composer or microphone recording. The greeting is scripted.

Clinical logic, safety classification, intelligent routing, local storage, backend services, and clinical validation are **not implemented**. The prototype provides no medical advice, diagnosis, treatment, or emergency support.

## Preview

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

1. Read the introductory 18+ notice and select **Got it** (session-only dismissal).
2. Tap the squirrel to see a small hop. System reduced-motion preferences disable the animation.
3. Select **Type**, **Voice**, or **Guided Check-in**. Each opens its labelled locked companion preview.
4. Return using **Back to your space**, the bottom navigation, or Android Back.
5. Open **About** for an honest description of current progress and future work.

## Privacy-first direction

The app requests no personal entries, account details, microphone permission, or health history. It contains no analytics or application backend calls. Navigation state is held only in memory and resets on reload. Secure local storage is a future feature, not a present guarantee. Expo development tooling may connect to the development server; the prototype is not a certified private health-data system.

## Structure

```text
App.tsx                       Entry component
src/MindVault.tsx             Home, locked preview, About, navigation
src/components/Squirrel.tsx   Original vector companion and hop animation
src/theme.ts                  Shared color palette
app.json                      Expo application settings
```

Dependencies are pinned by package-lock.json. No service keys or environment configuration are required. Native device QA and clinical evaluation remain future work.
