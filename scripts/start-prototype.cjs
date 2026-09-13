const { spawn } = require("node:child_process");
const cli = require.resolve("expo/bin/cli");
const child = spawn(
  process.execPath,
  [cli, "start", "--port", "8082", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_APP_VARIANT: "prototype",
      EXPO_NO_TELEMETRY: "1",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
