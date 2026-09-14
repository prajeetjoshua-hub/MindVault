import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../apps/dashboard",
);
const port = Number(process.env.MONITOR_PORT || 8787);
const tls = Boolean(process.env.MONITOR_CERT && process.env.MONITOR_KEY);
const host = tls ? "0.0.0.0" : "127.0.0.1";
const origin = process.env.MONITOR_ORIGIN || `http://127.0.0.1:${port}`;
if (tls && !origin.startsWith("https://"))
  throw new Error("MONITOR_ORIGIN must be HTTPS with a trusted certificate");
const admin = crypto.randomBytes(32).toString("hex");
const pair = crypto.randomBytes(32).toString("hex");
let events = [],
  counter = 0;
const equal = (a, b) =>
  typeof a === "string" &&
  /^[a-f0-9]{64}$/.test(a) &&
  crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const detailsAllowed = new Set([
  "characters",
  "mode",
  "persisted",
  "operation",
  "processed",
  "total",
  "topic",
  "previousContextUsed",
  "ruleMatches",
  "lexicalCoverage",
  "route",
  "score",
  "persistence",
  "function",
  "overwhelm",
  "coping",
  "reasons",
  "version",
  "clinicalProbability",
  "memoryIds",
  "goal",
  "detail",
  "training",
  "eligible",
  "reason",
  "model",
  "contextMode",
  "accepted",
  "source",
  "durationMs",
  "fallback",
  "saved",
  "persistent",
  "action",
  "message",
]);
function cleanEvent(data) {
  if (
    !data ||
    typeof data.traceId !== "string" ||
    !/^[a-zA-Z0-9-]{1,80}$/.test(data.traceId) ||
    !Number.isInteger(data.sequence)
  )
    throw new Error("Invalid trace");
  if (
    !["started", "completed", "skipped", "failed"].includes(data.status) ||
    !/^[a-z-]{1,40}$/.test(data.layer)
  )
    throw new Error("Invalid event");
  const details = {};
  for (const [key, value] of Object.entries(data.details || {})) {
    if (!detailsAllowed.has(key)) continue;
    if (
      (typeof value === "number" && Number.isFinite(value)) ||
      typeof value === "boolean"
    )
      details[key] = value;
    else if (
      typeof value === "string" &&
      value.length <= (key === "message" ? 8_000 : 200)
    ) details[key] = value;
    else if (Array.isArray(value))
      details[key] = value
        .filter((v) => typeof v === "string" && v.length < 80)
        .slice(0, 100);
  }
  return {
    traceId: data.traceId,
    sequence: data.sequence,
    layer: data.layer,
    status: data.status,
    timestamp: new Date().toISOString(),
    details,
  };
}
const server = (tls ? https : http).createServer(
  tls
    ? {
        cert: fs.readFileSync(process.env.MONITOR_CERT),
        key: fs.readFileSync(process.env.MONITOR_KEY),
      }
    : {},
  async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
    );
    const caller = req.headers.origin;
    if (
      caller &&
      ["http://localhost:8082", "http://127.0.0.1:8082", origin].includes(
        caller,
      )
    ) {
      res.setHeader("Access-Control-Allow-Origin", caller);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = new URL(req.url, origin);
    const send = (status, value) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (url.pathname.startsWith("/api/")) {
      const isAdmin = equal(token, admin);
      if (url.pathname === "/api/events" && req.method === "POST") {
        if (!equal(token, pair))
          return send(401, { error: "Pairing expired or invalid" });
        let raw = "",
          bytes = 0;
        try {
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 20_000) {
              send(413, { error: "Event too large" });
              return;
            }
            raw += chunk;
          }
          const event = cleanEvent(JSON.parse(raw));
          // Idempotent repeated delivery.
          if (
            !events.some(
              (e) =>
                e.traceId === event.traceId && e.sequence === event.sequence,
            )
          ) {
            events.push({ ...event, cursor: ++counter });
            events = events.slice(-1000);
          }
          return send(200, { ok: true });
        } catch {
          return send(400, { error: "Invalid diagnostic event" });
        }
      }
      if (!isAdmin) return send(401, { error: "Dashboard session required" });
      if (url.pathname === "/api/test-results" && req.method === "GET") {
        const report = path.resolve(root, "../../.monitor/test-results.json");
        try {
          return send(200, JSON.parse(fs.readFileSync(report, "utf8")));
        } catch {
          return send(200, {
            tests: 0,
            cases: [],
            scope: "Run npm test locally to generate a regression report.",
          });
        }
      }
      if (url.pathname === "/api/events" && req.method === "GET")
        return send(200, {
          events: events.filter(
            (e) => e.cursor > Number(url.searchParams.get("after") || 0),
          ),
          counter,
        });
      if (url.pathname === "/api/events" && req.method === "DELETE") {
        events = [];
        return send(200, { ok: true });
      }
      if (url.pathname === "/api/pair" && req.method === "POST") {
        return send(200, { url: origin, token: pair, tls });
      }
      return send(404, { error: "Not found" });
    }
    const routes = {
      "/": "index.html",
      "/dashboard.js": "dashboard.js",
      "/dashboard.css": "dashboard.css",
    };
    const file = routes[url.pathname];
    if (!file) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html",
    });
    fs.createReadStream(path.join(root, file)).pipe(res);
  },
);
server.listen(port, host, () => {
  console.log(`MindVault dashboard: ${origin}/#session=${admin}`);
  console.log(
    tls
      ? "Phone connection requires the certificate to be trusted on the phone."
      : "Loopback desktop testing only. Phone pairing requires MONITOR_CERT, MONITOR_KEY and MONITOR_ORIGIN.",
  );
  console.log("Events are memory-only. Restarting clears the session.");
});
