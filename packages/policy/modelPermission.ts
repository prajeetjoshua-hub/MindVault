import type { Decision } from '../contracts/types.ts';

export function modelPermission(decision: Decision, pendingSafety: boolean) {
  if (pendingSafety || decision.route === 'SAFETY' || decision.evidence.some(e => e.category === 'safety' || e.category === 'uncertainty'))
    return { allowed: false, reason: 'safety-or-uncertainty' };
  if (decision.route === 'CLARIFY')
    return { allowed: decision.reasons.includes('insufficient-understanding'), reason: 'language-understanding-fallback' };
  return { allowed: true, reason: 'ordinary-conversation' };
}
