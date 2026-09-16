# Android device setup

The current target is a Samsung F15 running Android 16 with 6 GB RAM. The ARM64 release APK contains the functional React Native interface and native Qwen runtime, so it opens without Expo Go or a Metro development server. The 2.5 GB Qwen model file is imported separately and is never committed or bundled into the APK.

## Build

Use a short Windows checkout path such as `C:\Users\praje\Desktop\MindVault`. React Native native-code filenames can exceed Windows limits in deeply nested folders.

```powershell
npm ci
npm run android:prepare
npm run android:apk
```

The release APK is copied to `build-artifacts\MindVault-android-arm64.apk`. It is signed with the generated Android debug certificate for local prototype installation. It is not a Play Store release artifact.

## Install and unlock

1. Connect the Samsung by USB and copy the APK to the phone, or use `adb install -r build-artifacts\MindVault-android-arm64.apk` after enabling Developer options and USB debugging.
2. If installing from the Files app, allow installation from that source when Android asks.
3. Open MindVault. The app asks Android to authenticate the phone owner. MindVault never reads or stores the phone password.
4. The app locks and clears the visible working conversation when it enters the background. Saved chats remain in the encrypted local vault only after the user explicitly saves them.

## Import Qwen once

1. Copy `Qwen3-4B-Instruct-2507-Q4_K_M.gguf` to the phone's Downloads folder. Keep at least 6 GB of free storage for the original file, the private imported copy and working space.
2. In MindVault open **Settings → Model & voice → Import approved model**.
3. Select the GGUF file and approve the phone-owner authentication prompt.
4. Wait while MindVault checks the complete file size and SHA-256 before copying it into app-private storage.
5. Return to Settings. **QWEN CONNECTED** confirms that native local inference is loaded. Later authenticated launches reconnect to the verified private copy automatically.

Importing and loading are separate operations. The file remains on the phone, while the model is released from RAM whenever the app locks. First-load time and reply latency must be measured on the Samsung before the phone model is declared final.

## Connect the phone to the laptop dashboard

The app rejects cleartext dashboard traffic. The phone and laptop must share a local Wi-Fi network or hotspot, and Android must trust the short-lived local demo certificate.

1. On the laptop, from the Desktop MindVault folder, run `npm run dashboard:phone`.
2. The command prints a private dashboard URL, a CA certificate path and a CA download URL. Never publish the private URL or pairing JSON.
3. Copy `.runtime\dashboard-tls\mindvault-local-ca.crt` to the Samsung. On Samsung, open **Settings → Security and privacy → More security settings → Install from device storage → CA certificate**. Menu wording can vary by One UI version.
4. Open the private HTTPS dashboard URL on the laptop. Because the certificate is local, the laptop browser may ask you to continue to the page.
5. Press **Pair a device**, then **Copy pairing configuration**.
6. In the phone app open **Settings → Demo connection**, paste the JSON and connect.
7. Send a synthetic message from the phone. The settings page changes to **DASHBOARD CONNECTED** after the first event reaches the laptop. The dashboard then shows the message timestamp, layer events, route, support-intensity calculation, model gate and storage result.

The CA private key remains in the ignored laptop `.runtime` folder. Remove **MindVault Local Demo CA** from the phone's user credentials after the demonstration if the dashboard will no longer be used. Regenerating the local CA requires installing the new public certificate again.

## Offline test

After importing Qwen, turn on airplane mode and leave Wi-Fi off. Typed conversation, deterministic routing, Qwen fallback, check-in, preferences, saving, local history, export and deletion should remain usable. The dashboard cannot receive events with every radio disabled.

For the combined demonstration, turn on airplane mode and then re-enable Wi-Fi to a local router or laptop hotspot with no internet connection. Conversation processing stays on the phone while the local HTTPS link carries redacted diagnostic events to the laptop.

Record model load time, reply latency, peak memory, temperature, lock/reopen behavior, export, deletion and each LOW/MEDIUM/SAFETY/CLARIFY case. Passing desktop tests or installing the APK does not replace this physical-device acceptance test.
