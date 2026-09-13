import type { Decision, Evidence, Topic } from "../contracts/types.ts";
export function evaluatePolicy(
  evidence: Evidence[],
  topic: Topic,
  unresolvedSafety: boolean,
  lexicalCoverage: boolean,
): Decision {
  const contributions: Record<string, number> = {
    persistence: 0,
    function: 0,
    overwhelm: 0,
    coping: 0,
  };
  for (const item of evidence)
    if (item.category === "support")
      contributions[item.id] = Math.max(
        contributions[item.id] ?? 0,
        item.contribution,
      );
  const score = Object.values(contributions).reduce((a, b) => a + b, 0);
  const active = evidence.filter((item) => item.category === "safety");
  const uncertain = evidence.some((item) => item.category === "uncertainty");
  const route =
    active.length || unresolvedSafety
      ? "SAFETY"
      : uncertain || !lexicalCoverage
        ? "CLARIFY"
        : score >= 2
          ? "MEDIUM"
          : "LOW";
  return {
    route,
    score,
    contributions,
    topic,
    evidence,
    policyVersion: "0.2.0-experimental",
    reasons: active.length
      ? [...new Set(active.map((x) => x.id))]
      : unresolvedSafety
        ? ["unresolved-safety-state"]
        : uncertain
          ? ["context-needs-clarification"]
          : !lexicalCoverage
            ? ["insufficient-understanding"]
            : [`support-intensity-${score}`],
  };
}
