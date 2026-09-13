const { spawnSync } = require("node:child_process");
const result = spawnSync(
  process.execPath,
  [
    require.resolve("expo/bin/cli"),
    "export",
    "--platform",
    "web",
    "--output-dir",
    "prototype-dist",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_APP_VARIANT: "prototype",
      GITHUB_PAGES: "false",
      EXPO_NO_TELEMETRY: "1",
    },
  },
);
process.exit(result.status ?? 1);
