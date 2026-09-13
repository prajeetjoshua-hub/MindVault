import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyseSentiment } from '../packages/sentiment/analyseSentiment.ts';
import { ConversationOrchestrator } from '../packages/pipeline/ConversationOrchestrator.ts';
import { defaultPreferences } from '../packages/contracts/types.ts';
test('VADER advisory distinguishes simple negation', async () => {
  const signal = new AbortController().signal;
  assert.ok((await analyseSentiment('I am happy', signal)).mean > 0);
  assert.ok((await analyseSentiment('I am not happy', signal)).mean < 0);
});
test('sentiment scans all sections without hiding opposite polarity', async () => {
  const text = 'I am happy. '.repeat(200) + 'I am miserable and lonely. '.repeat(200);
  const result = await analyseSentiment(text, new AbortController().signal);
  assert.equal(result.processed, text.length);
  assert.ok(result.min < 0 && result.max > 0);
});
test('positive framing does not override urgent safety routing', async () => {
  const result = await new ConversationOrchestrator(() => {}).process('I feel calm and happy but I will hurt myself tonight', defaultPreferences);
  assert.equal(result.decision.route, 'SAFETY');
});
