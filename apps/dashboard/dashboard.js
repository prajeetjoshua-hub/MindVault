const $ = (id) => document.getElementById(id);
const fromHash = new URLSearchParams(location.hash.slice(1)).get("session");
if (fromHash) {
  sessionStorage.setItem("monitor-session", fromHash);
  history.replaceState(null, "", location.pathname);
}
const session = sessionStorage.getItem("monitor-session");
let all = [],
  cursor = 0,
  selected = "",
  lastRendered = "";
async function api(path, method = "GET") {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: { Authorization: `Bearer ${session}` },
  });
  if (!r.ok)
    throw new Error(
      r.status === 401
        ? "Open the private dashboard URL printed in your terminal."
        : "Monitor unavailable",
    );
  return r.json();
}
function node(tag, text, cls) {
  const n = document.createElement(tag);
  n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function render() {
  const ids = [...new Set(all.map((e) => e.traceId))].reverse();
  if (!selected) selected = ids[0] || "";
  $("traces").replaceChildren(
    ...ids.map((id) => {
      const b = node(
        "button",
        `${id.slice(0, 13)} · ${all.find((e) => e.traceId === id && e.layer === "policy")?.details.route || "processing"}`,
      );
      b.onclick = () => {
        selected = id;
        lastRendered = "";
        render();
      };
      return b;
    }),
  );
  const trace = all
    .filter((e) => e.traceId === selected)
    .sort((a, b) => a.sequence - b.sequence);
  const key = `${selected}:${trace.length}`;
  if (key === lastRendered) return;
  lastRendered = key;
  $("traceId").textContent = selected || "No selected message";
  const policy = trace.find((e) => e.layer === "policy")?.details,
    coverage = trace.filter((e) => e.layer === "coverage").at(-1)?.details,
    gate = trace.find((e) => e.layer === "model-gate")?.details;
  $("route").textContent = policy?.route || "Waiting";
  $("score").textContent = policy?.score ?? "—";
  $("coverage").textContent = coverage
    ? `${coverage.processed} / ${coverage.total}`
    : "—";
  $("model").textContent = gate
    ? gate.eligible
      ? "Eligible"
      : "Skipped"
    : "Not called";
  $("modelReason").textContent =
    gate?.reason || "Waiting for an actual model-gate event";
  $("calculation").textContent = policy
    ? `Persistence ${policy.persistence} + functioning ${policy.function} + overwhelm ${policy.overwhelm} + coping ${policy.coping} = ${policy.score}. Route: ${policy.route}. Reason: ${policy.reasons.join(", ")}. Policy ${policy.version}. Not a clinical probability.`
    : "P + F + O + C = support intensity. Safety evidence overrides this calculation.";
  $("timeline").replaceChildren(
    ...trace.map((e) => {
      const d = node("div", "", "event");
      const h = node("h3", `${e.sequence}. ${e.layer}`);
      h.append(node("span", e.status, `status ${e.status}`));
      d.append(h, node("code", JSON.stringify(e.details, null, 2)));
      return d;
    }),
  );
}
$("pair").onclick = async () => {
  try {
    const p = await api("pair", "POST");
    $("pairing").hidden = false;
    $("pairData").value = JSON.stringify({ url: p.url, token: p.token });
    $("pairNote").textContent = p.tls
      ? "Trusted HTTPS configured. Use a phone on the same local network."
      : "Desktop browser pairing only. Configure trusted HTTPS before pairing a phone.";
  } catch (e) {
    $("connection").textContent = e.message;
  }
};
$("clear").onclick = async () => {
  await api("events", "DELETE");
  all = [];
  selected = "";
  lastRendered = "";
  render();
};
$("export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(all, null, 2)], { type: "application/json" }),
  );
  const a = node("a", "");
  a.href = url;
  a.download = "MindVault-diagnostic-trace.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
async function poll() {
  try {
    const data = await api(`events?after=${cursor}`);
    if (data.events.length) {
      all = [...all, ...data.events].slice(-1000);
      cursor = data.counter;
      render();
    }
    $("connection").textContent =
      "Local monitor connected · waiting for device events";
  } catch (e) {
    $("connection").textContent = e.message;
  }
  setTimeout(poll, 1000);
}
poll();
async function testReport() {
  try {
    const report = await api("test-results");
    $("testSummary").textContent = report.tests
      ? `${report.passed}/${report.tests} passed · ${report.failed} failed · ${new Date(report.finishedAt).toLocaleString()}. ${report.scope}. This is the latest recorded run; rerun after code changes.`
      : report.scope;
    $("testCases").replaceChildren(
      ...report.cases.map((c) =>
        node("p", `${c.passed ? "PASS" : "FAIL"} · ${c.name}`),
      ),
    );
  } catch {
    $("testSummary").textContent = "Test report unavailable.";
  }
  setTimeout(testReport, 15000);
}
testReport();
