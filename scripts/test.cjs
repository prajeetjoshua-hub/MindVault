const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const startedAt = new Date().toISOString();
const testFiles = fs
  .readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".test.ts"))
  .map((name) => path.join("tests", name));
const userShim = path.join(root, "scripts", "windows-node-user-shim.cjs");
const nodeOptions = [process.env.NODE_OPTIONS, `--require=${userShim}`]
  .filter(Boolean)
  .join(" ");
const child = spawn(
  process.execPath,
  [
    "--require",
    userShim,
    require.resolve("tsx/cli"),
    "--test",
    "--test-reporter=tap",
    ...testFiles,
  ],
  {
    cwd: root,
    stdio: ["inherit", "pipe", "inherit"],
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  },
);
let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk;
  process.stdout.write(chunk);
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("close", (code) => {
  const cases = [...output.matchAll(/^(ok|not ok) \d+ - (.+)$/gm)].map(
    (match) => ({ name: match[2], passed: match[1] === "ok" }),
  );
  const count = (name) =>
    Number(output.match(new RegExp(`^# ${name} (\\d+)`, "m"))?.[1] || 0);
  fs.mkdirSync(path.join(root, ".monitor"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".monitor", "test-results.json"),
    JSON.stringify(
      {
        startedAt,
        finishedAt: new Date().toISOString(),
        exitCode: code,
        tests: count("tests"),
        passed: count("pass"),
        failed: count("fail"),
        cases,
        scope:
          "Desktop regression tests; native runtime and clinical validity not tested",
      },
      null,
      2,
    ),
  );
  process.exitCode = code ?? 1;
});
