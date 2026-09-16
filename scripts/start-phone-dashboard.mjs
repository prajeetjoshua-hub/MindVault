import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certDirectory = path.join(root, ".runtime", "dashboard-tls");
const port = Number(process.env.MONITOR_PORT || 8787);
const networkAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter(
    (entry) =>
      entry &&
      entry.family === "IPv4" &&
      !entry.internal &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address),
  );
const address = process.env.MONITOR_IP || networkAddresses[0]?.address;
if (!address) {
  throw new Error(
    "No private IPv4 address found. Connect the laptop to the demo Wi-Fi or set MONITOR_IP.",
  );
}

const opensslCandidates = [
  process.env.OPENSSL_PATH,
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
  "C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe",
  "openssl",
].filter(Boolean);
const openssl = opensslCandidates.find((candidate) => {
  const result = spawnSync(candidate, ["version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
});
if (!openssl) {
  throw new Error("OpenSSL was not found. Install Git for Windows or set OPENSSL_PATH.");
}

fs.mkdirSync(certDirectory, { recursive: true });
const caKey = path.join(certDirectory, "mindvault-local-ca.key");
const caCertificate = path.join(certDirectory, "mindvault-local-ca.crt");
const serverKey = path.join(certDirectory, "dashboard.key");
const serverCertificate = path.join(certDirectory, "dashboard.crt");
const serverRequest = path.join(certDirectory, "dashboard.csr");
const caConfig = path.join(certDirectory, "ca.cnf");
const serverConfig = path.join(certDirectory, "server.cnf");
const metadata = path.join(certDirectory, "server.json");

function runOpenSsl(arguments_) {
  const result = spawnSync(openssl, arguments_, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`OpenSSL failed while running ${arguments_[0]}`);
}

if (!fs.existsSync(caKey) || !fs.existsSync(caCertificate)) {
  fs.writeFileSync(
    caConfig,
    `[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3_ca\n[dn]\nCN=MindVault Local Demo CA\nO=MindVault Local Prototype\n[v3_ca]\nbasicConstraints=critical,CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n`,
  );
  runOpenSsl([
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-sha256",
    "-days",
    "30",
    "-nodes",
    "-keyout",
    caKey,
    "-out",
    caCertificate,
    "-config",
    caConfig,
  ]);
}

let previousAddress = "";
try {
  previousAddress = JSON.parse(fs.readFileSync(metadata, "utf8")).address;
} catch {}
if (
  previousAddress !== address ||
  !fs.existsSync(serverKey) ||
  !fs.existsSync(serverCertificate)
) {
  fs.writeFileSync(
    serverConfig,
    `[req]\nprompt=no\ndistinguished_name=dn\nreq_extensions=v3_req\n[dn]\nCN=${address}\nO=MindVault Local Prototype\n[v3_req]\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=@alt\n[alt]\nIP.1=${address}\nIP.2=127.0.0.1\nDNS.1=localhost\n`,
  );
  runOpenSsl([
    "req",
    "-new",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    serverKey,
    "-out",
    serverRequest,
    "-config",
    serverConfig,
  ]);
  runOpenSsl([
    "x509",
    "-req",
    "-in",
    serverRequest,
    "-CA",
    caCertificate,
    "-CAkey",
    caKey,
    "-CAcreateserial",
    "-out",
    serverCertificate,
    "-days",
    "30",
    "-sha256",
    "-extensions",
    "v3_req",
    "-extfile",
    serverConfig,
  ]);
  fs.writeFileSync(
    metadata,
    JSON.stringify(
      {
        address,
        certificateSha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(serverCertificate))
          .digest("hex"),
      },
      null,
      2,
    ),
  );
}

const origin = `https://${address}:${port}`;
console.log(`Phone dashboard CA: ${caCertificate}`);
console.log(
  `CA download after accepting the local certificate: ${origin}/mindvault-local-ca.crt`,
);
console.log(
  "Install that CA on the Samsung before pairing. The private key stays on this laptop.",
);
const child = spawn(process.execPath, ["tools/monitor-service/server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    MONITOR_PORT: String(port),
    MONITOR_ORIGIN: origin,
    MONITOR_CERT: serverCertificate,
    MONITOR_KEY: serverKey,
    MONITOR_CA: caCertificate,
  },
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
