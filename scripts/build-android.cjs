const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const androidRoot = path.join(root, "android");
const runtimeRoot = path.join(root, ".runtime");
const bundledSdk = path.join(runtimeRoot, "android-sdk");
let propertiesSdk = "";
try {
  const localProperties = fs.readFileSync(
    path.join(androidRoot, "local.properties"),
    "utf8",
  );
  const match = localProperties.match(/^sdk\.dir=(.+)$/m);
  propertiesSdk = match?.[1]?.trim().replaceAll("\\\\", "\\") || "";
} catch {}
const sdkCandidates = [
  process.env.ANDROID_SDK_ROOT,
  process.env.ANDROID_HOME,
  bundledSdk,
  propertiesSdk,
  process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
    : "",
].filter(Boolean);
const sdkRoot = sdkCandidates
  .map((candidate) => path.resolve(candidate))
  .find((candidate) => fs.existsSync(path.join(candidate, "platform-tools")));
const debug = process.argv.includes("--debug");
const buildType = debug ? "Debug" : "Release";

if (!fs.existsSync(path.join(androidRoot, "gradlew.bat"))) {
  throw new Error("Run npm run android:prepare before building the APK.");
}
if (!sdkRoot) {
  throw new Error(
    "Android SDK not found. Install it or set ANDROID_SDK_ROOT before building.",
  );
}

const androidUserHome = path.resolve(
  process.env.ANDROID_USER_HOME || path.join(runtimeRoot, "android-user"),
);
const physicalGradleUserHome = path.resolve(
  process.env.GRADLE_USER_HOME || path.join(runtimeRoot, "gradle-user"),
);
fs.mkdirSync(androidUserHome, { recursive: true });
fs.mkdirSync(physicalGradleUserHome, { recursive: true });

let gradleUserHome = physicalGradleUserHome;
let mappedGradleDrive;
if (process.platform === "win32" && !process.env.GRADLE_USER_HOME) {
  for (const letter of "GHIJKLMNOPQRSTUVWXYZ") {
    const drive = `${letter}:`;
    if (fs.existsSync(`${drive}\\`)) continue;
    const mapping = spawnSync("subst.exe", [drive, physicalGradleUserHome], {
      windowsHide: true,
      stdio: "ignore",
    });
    if (mapping.status === 0) {
      mappedGradleDrive = drive;
      gradleUserHome = `${drive}\\`;
      break;
    }
  }
  if (!mappedGradleDrive) {
    throw new Error(
      "A short temporary drive could not be created for the Gradle cache.",
    );
  }

  const mappingMarker = path.join(runtimeRoot, "gradle-cache-drive.txt");
  let previousDrive = "";
  try {
    previousDrive = fs.readFileSync(mappingMarker, "utf8").trim();
  } catch {}
  if (previousDrive !== mappedGradleDrive) {
    const nativeCaches = [
      path.join(androidRoot, "app", ".cxx"),
      path.join(root, "node_modules", "expo-modules-core", "android", ".cxx"),
      path.join(root, "node_modules", "expo-sqlite", "android", ".cxx"),
      path.join(root, "node_modules", "llama.rn", "android", ".cxx"),
    ];
    for (const cache of nativeCaches) {
      fs.rmSync(cache, { recursive: true, force: true, maxRetries: 3 });
    }
    fs.writeFileSync(mappingMarker, `${mappedGradleDrive}\n`);
  }
}
fs.writeFileSync(
  path.join(androidRoot, "local.properties"),
  `sdk.dir=${sdkRoot.replaceAll("\\", "/")}\n`,
);

const gradle = path.join(
  androidRoot,
  process.platform === "win32" ? "gradlew.bat" : "gradlew",
);
const gradleArguments = [
  `assemble${buildType}`,
  "-PreactNativeArchitectures=arm64-v8a",
  // llama.rn ships verified ARM64 binaries. Rebuilding every CPU/OpenCL variant
  // creates paths that exceed Windows' native filename limit in this workspace.
  "-PrnllamaBuildFromSource=false",
  // The project may be checked out through a short drive mapping on Windows.
  // Disabling incremental Kotlin caches avoids mixing mapped and physical roots.
  "-Pkotlin.incremental=false",
  "-Pkotlin.compiler.execution.strategy=in-process",
  "--max-workers=2",
  "--no-daemon",
  "--stacktrace",
];
const command =
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : gradle;
const commandArguments =
  process.platform === "win32"
    ? ["/d", "/c", "gradlew.bat", ...gradleArguments]
    : gradleArguments;
let result;
try {
  result = spawnSync(command, commandArguments, {
    cwd: androidRoot,
    env: {
      ...process.env,
      ANDROID_HOME: sdkRoot,
      ANDROID_SDK_ROOT: sdkRoot,
      ANDROID_USER_HOME: androidUserHome,
      GRADLE_USER_HOME: gradleUserHome,
      EXPO_PUBLIC_APP_VARIANT: "prototype",
      NODE_ENV: debug ? "development" : "production",
    },
    encoding: "utf8",
    stdio: "inherit",
  });
} finally {
  if (mappedGradleDrive) {
    spawnSync("subst.exe", [mappedGradleDrive, "/D"], {
      windowsHide: true,
      stdio: "ignore",
    });
  }
}

if (result?.error) throw result.error;
if (result.status === 0) {
  const source = path.join(
    androidRoot,
    "app",
    "build",
    "outputs",
    "apk",
    debug ? "debug" : "release",
    debug ? "app-debug.apk" : "app-release.apk",
  );
  const outputDirectory = path.join(root, "build-artifacts");
  const output = path.join(
    outputDirectory,
    debug ? "MindVault-android-arm64-debug.apk" : "MindVault-android-arm64.apk",
  );
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.copyFileSync(source, output);
  console.log(`APK ready: ${output}`);
}
process.exit(result.status ?? 1);
