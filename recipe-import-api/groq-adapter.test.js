import test from 'node:test';
import assert from 'node:assert/strict';
import { groqChatCompletion, groqRecipeCompletion, GroqApiError, evenlySampleFrames, parseRetryDelayFromMessage } from './groq-adapter.js';
const success = () => new Response(JSON.stringify({ choices: [{ message: { content: '{"name":"Rice"}' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
test('text imports use a documented free text model with no image content', async () => {
  let body;
  const text = await groqRecipeCompletion({ apiKey: 'test-only', userText: 'Recipe text', fetchImpl: async (_url, options) => { body = JSON.parse(options.body); return success(); } });
  assert.equal(body.model, 'openai/gpt-oss-20b'); assert.equal(body.reasoning_effort, 'low'); assert.equal(body.messages[0].content.length, 1); assert.equal(text, '{"name":"Rice"}');
});
test('video frames use the supported vision model and bounded image sampling', async () => {
  let body;
  await groqRecipeCompletion({ apiKey: 'test-only', userText: 'Read this recipe', frameImages: ['a', 'b', 'c', 'd', 'e'], fetchImpl: async (_url, options) => { body = JSON.parse(options.body); return success(); } });
  assert.equal(body.model, 'qwen/qwen3.8-27b'); assert.equal(body.reasoning_effort, 'none'); assert.equal(body.messages[0].content.length, 4);
  assert.deepEqual(evenlySampleFrames(['a', 'b', 'c', 'd', 'e'], 3), ['a', 'c', 'e']);
});
test('legacy text-only vision configurations never receive uploaded images', async () => {
  let model;
  await groqRecipeCompletion({ apiKey: 'test-only', visionModel: 'openai/gpt-oss-20b', frameImages: ['a'], userText: 'Source', fetchImpl: async (_url, options) => { model = JSON.parse(options.body).model; return success(); } });
  assert.equal(model, 'qwen/qwen3.8-27b');
});
test('missing text models have one documented free fallback; vision never silently falls back to text', async () => {
  const models = [];
  await groqRecipeCompletion({ apiKey: 'test-only', textModel: 'old-text', userText: 'Source', fetchImpl: async (_url, options) => { models.push(JSON.parse(options.body).model); return models.length === 1 ? new Response('{"error":{"message":"model not found"}}', { status: 404 }) : success(); } });
  assert.deepEqual(models, ['old-text', 'qwen/qwen3.8-27b']);
  let attempts = 0;
  await assert.rejects(groqRecipeCompletion({ apiKey: 'test-only', frameImages: ['a'], userText: 'Source', fetchImpl: async () => { attempts++; return new Response('{"error":{"message":"model not found"}}', { status: 404 }); } }), error => error instanceof GroqApiError && error.kind === 'model_unavailable');
  assert.equal(attempts, 1);
});
test('empty and malformed JSON AI responses are controlled errors instead of browser JSON crashes', async () => {
  for (const body of ['', 'not-json', '{}']) await assert.rejects(groqChatCompletion({ apiKey: 'test-only', userText: 'Source', fetchImpl: async () => new Response(body, { status: 200 }) }), error => error instanceof GroqApiError && error.kind === 'empty_response');
});
test('quota and model access failures are not rerouted to paid or unrestricted services', async () => {
  for (const [status, message, kind] of [[429, 'daily quota exhausted', 'quota'], [429, 'TPM exceeded. Upgrade today. Try again in 2.5 seconds.', 'rate_limit'], [403, 'Model access denied', 'configuration']]) {
    let attempts = 0;
    await assert.rejects(groqRecipeCompletion({ apiKey: 'test-only', userText: 'Source', fetchImpl: async () => { attempts++; return new Response(JSON.stringify({ error: { message } }), { status }); } }), error => error.kind === kind);
    assert.equal(attempts, 1);
  }
  assert.equal(parseRetryDelayFromMessage('Try again in 2.5 seconds.'), 2500);
});
