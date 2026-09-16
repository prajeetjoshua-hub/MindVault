import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConversationOrchestrator } from '../packages/pipeline/ConversationOrchestrator.ts';
import { defaultPreferences } from '../packages/contracts/types.ts';

test('monitor conversation carries context and answers personal small talk honestly', async () => {
  const engine = new ConversationOrchestrator(() => {});
  const send = (text: string) => engine.process(text, defaultPreferences);
  await send('I got a new monitor today');
  assert.match((await send('i like it so much its 27inch screen and 4K')).text, /picture|space/);
  assert.match((await send('I like watching movies and series in this new monitor')).text, /film|series/);
  assert.match((await send('what did u eat for breakfast?')).text, /don’t eat/);
  assert.match((await send('My new monitor arrived broken')).text, /damaged|turn on/);
});
test('family conflict remains the cause across study and sleep messages', async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process('my parents are fighting and I cannot study', defaultPreferences);
  const reply = await engine.process('they fight and use harsh words that keep running in my mind and I cannot sleep', defaultPreferences);
  assert.match(reply.text, /arguments|words|conflict/);
  assert.doesNotMatch(reply.text, /what tends to be going on/i);
});
test('mixed loneliness and an explicit planning request take precedence', async () => {
  const engine = new ConversationOrchestrator(() => {});
  assert.match((await engine.process('I passed my exam but I still feel lonely', defaultPreferences)).text, /lonely/);
  assert.match((await engine.process('feeling lonely', defaultPreferences)).text, /Loneliness/);
  assert.match((await engine.process('I failed an exam. Help me decide what to do tomorrow.', defaultPreferences)).text, /tomorrow|topic/);
});
test('natural reassurance and no-harm wording permits ordinary conversation', async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process('i feel suicidal', defaultPreferences);
  await engine.process('its fine i am alright', defaultPreferences);
  assert.equal((await engine.process('no no i feel better no harm', defaultPreferences)).decision.route, 'LOW');
  assert.match((await engine.process('I will talk about my monitor now', defaultPreferences)).text, /monitor/);
});
test('all reported browser messages avoid the old generic fallback in context', async () => {
  const sequences = [
    [
      'got a new monitor today',
      'I saved for three months to buy it.',
      'i like it so much, its 27inch screen and i got it for like 30K its a 4K monitor',
      'i like watching movies and series in this new monitor',
      'what did u eat for breakfast?',
      'i asked do you eat something?',
      'My new monitor arrived broken',
    ],
    [
      'i face family issues',
      'my parents are fighting so i feel disturbed and i am not able to study',
      'thats what my parents are fighting so i am not so mentally stable',
      'they are fighting days and nights and i am not being able to sleep and i am not able to focus on studying',
      'the way they fight, use harsh words that keeps running on my mind and i am not able to sleep',
    ],
    [
      'i got a new monitor today i feel like dying',
      'why is my brain not working',
      'simply i said bro i am totally fine',
      'now i am good i didnt hurt myself',
      'I feel overwhelmed. I just want someone to listen.',
    ],
    [
      'i dont like you',
      'i feel suicidal',
      'its fine i am alright',
      'no no i feel better no harm',
      'no i ll talk about my monitor now',
      'ok bro i am so done',
      'is anyone seeing this chat',
      'ok u dont know anything',
    ],
  ];
  const oldFallback = /Thank you for telling me|Would you like to tell me a little more|I don’t want to keep asking|local conversation model isn’t available/i;
  for (const inputs of sequences) {
    const engine = new ConversationOrchestrator(() => {});
    for (const input of inputs) {
      const reply = await engine.process(input, defaultPreferences);
      assert.doesNotMatch(reply.text, oldFallback, input);
    }
  }
});
test('topic change does not falsely mark unresolved concern safe or block ordinary reply', async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process('i feel suicidal', defaultPreferences);
  await engine.process('I am fine', defaultPreferences);
  const reply = await engine.process('I want to talk about my monitor', defaultPreferences);
  assert.match(reply.text, /monitor/);
  assert.ok(reply.decision.reasons.includes('topic-change-with-safety-unconfirmed'));
  assert.equal((await engine.process('I will hurt myself tonight', defaultPreferences)).decision.route, 'SAFETY');
});
test('breakup context receives warm replies and self-harm language receives a specific safety response', async () => {
  const engine = new ConversationOrchestrator(() => {});
  assert.match((await engine.process('i feel hurted', defaultPreferences)).text, /Ayyo|happened|hurting/);
  assert.match((await engine.process('i had a breakup', defaultPreferences)).text, /sad|story|loss/i);
  assert.match((await engine.process('he left me for a bad girl', defaultPreferences)).text, /worth|care|painful/i);
  const cutting = await engine.process('i feel like cutting my hand', defaultPreferences);
  assert.equal(cutting.decision.route, 'SAFETY');
  assert.match(cutting.text, /breakup|cut yourself|sharp|trusted/i);
  assert.match((await engine.process('i feel like dying', defaultPreferences)).text, /ending your life/);
  const firstReassurance = await engine.process('i am good now', defaultPreferences);
  assert.equal(firstReassurance.decision.route, 'CLARIFY');
  assert.match(firstReassurance.text, /sure|safe|bothering/i);
  const resolved = await engine.process('i am fine', defaultPreferences);
  assert.equal(resolved.decision.route, 'LOW');
  assert.match(resolved.text, /breakup|talk about what happened|move on/i);
});
test('a direct self-harm admission stays urgent until stopping and injury status are clear', async () => {
  const engine = new ConversationOrchestrator(() => {});
  const admission = await engine.process('yes i am hurting myself', defaultPreferences);
  assert.equal(admission.decision.route, 'SAFETY');
  assert.match(admission.text, /bleeding|seriously injured|emergency/i);
  const casualReassurance = await engine.process('i am safe right now', defaultPreferences);
  assert.equal(casualReassurance.decision.route, 'SAFETY');
  assert.match(casualReassurance.text, /stopped|injured|bleeding/i);
  const recovery = await engine.process('I stopped hurting myself and I am safe', defaultPreferences);
  assert.equal(recovery.decision.route, 'LOW');
  assert.match(recovery.text, /safe|move on/i);
});
test('food messages receive specific everyday conversation instead of a generic fallback', async () => {
  const cases: [string, RegExp][] = [
    ['I had idli for breakfast', /idli/i],
    ['I made pasta for dinner', /pasta/i],
    ['I had tea during my break', /tea/i],
    ['I am hungry now', /warm|light|filling|snack/i],
    ['I have no appetite today', /appetite|stress|small|later/i],
    ['What is your favourite food?', /don’t eat|favourite/i],
    ['I am cooking biryani', /biryani|making/i],
  ];
  for (const [input, expected] of cases) {
    const reply = await new ConversationOrchestrator(() => {}).process(input, defaultPreferences);
    assert.match(reply.text, expected, input);
    assert.doesNotMatch(reply.text, /local conversation model isn’t available|Would you like to tell me a little more/i, input);
  }
});
test('relationship situations keep the specific cause and emotional tone', async () => {
  const cases: [string, RegExp][] = [
    ['I got ghosted and they stopped replying', /explanation|respect|reply/i],
    ['my partner cheated on me', /betrayal|trust|lied/i],
    ['we had a huge argument', /argument|hurt|feelings/i],
    ['I still miss my ex', /miss|relationship/i],
    ['we are in a long distance relationship', /distance|communication|apart/i],
    ['I have a crush but it is one-sided', /feelings|lovable|talk/i],
  ];
  for (const [input, expected] of cases) {
    const reply = await new ConversationOrchestrator(() => {}).process(input, defaultPreferences);
    assert.match(reply.text, expected, input);
    assert.doesNotMatch(reply.text, /Thank you for telling me|Would you like to tell me a little more/i, input);
  }
});
