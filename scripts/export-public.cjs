const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', '--platform', 'web', '--output-dir', 'dist'], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_APP_VARIANT: 'landing', EXPO_NO_TELEMETRY: '1' },
});
process.exit(result.status ?? 1);
