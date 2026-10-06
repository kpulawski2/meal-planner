import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GroqApiError,
  buildGroqUserContent,
  evenlySampleFrames,
  groqChatCompletion,
  groqBrowserSearch,
  groqTranscribe
} from './groq-adapter.js';

const makeResponse = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });

test('video frames are sampled evenly and limited to three for Groq vision', () => {
  assert.deepEqual(evenlySampleFrames(['0','1','2','3','4','5','6','7'], 3), ['0','4','7']);
  assert.deepEqual(evenlySampleFrames(['only'], 3), ['only']);
  assert.deepEqual(buildGroqUserContent('read recipe', ['one','two','three','four']).slice(1).map(x => x.image_url.url), [
    'data:image/jpeg;base64,one', 'data:image/jpeg;base64,three', 'data:image/jpeg;base64,four'
  ]);
});

test('chat completion posts JSON-mode recipe request to Groq and returns model text', async () => {
  let captured;
  const result = await groqChatCompletion({
    apiKey: 'test-key', model: 'qwen/qwen3.8-27b', system: 'Return JSON.', userText: 'Extract this recipe.',
    fetchImpl: async (url, init) => {
      captured = { url, init, body: JSON.parse(init.body) };
      return makeResponse({ choices: [{ message: { content: '{"name":"Test recipe"}' } }] });
    }
  });
  assert.equal(result, '{"name":"Test recipe"}');
  assert.equal(captured.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(captured.init.headers.Authorization, 'Bearer test-key');
  assert.equal(captured.body.model, 'qwen/qwen3.8-27b');
  assert.deepEqual(captured.body.response_format, { type: 'json_object' });
  assert.equal(captured.body.messages[1].content[0].text, 'Extract this recipe.');
});

test('chat completion reports quota errors clearly and does not treat them as success', async () => {
  await assert.rejects(
    groqChatCompletion({ apiKey: 'test-key', model: 'qwen/qwen3.8-27b', userText: 'test', fetchImpl: async () => makeResponse({ error: { message: 'Daily request limit reached' } }, 429) }),
    error => error instanceof GroqApiError && error.kind === 'quota' && /free-tier quota/i.test(error.message)
  );
});


test('browser-search completion requests the current GPT-OSS browser-search tool', async () => {
  let captured;
  const result = await groqBrowserSearch({
    apiKey: 'test-key', model: 'openai/gpt-oss-20b', system: 'Use browser search.', userText: 'Find current price.',
    fetchImpl: async (url, init) => {
      captured = { url, init, body: JSON.parse(init.body) };
      return makeResponse({ choices: [{ message: { content: '{"items":[]}' } }] });
    }
  });
  assert.equal(result.text, '{"items":[]}');
  assert.equal(captured.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(captured.body.model, 'openai/gpt-oss-20b');
  assert.deepEqual(captured.body.tools, [{ type: 'browser_search' }]);
  assert.equal(captured.body.tool_choice, 'required');
  assert.equal('response_format' in captured.body, false);
});

test('audio transcription uses Groq Whisper multipart endpoint', async () => {
  let captured;
  const text = await groqTranscribe({
    apiKey: 'test-key', model: 'whisper-large-v3-turbo', audio: Buffer.from('sample audio'),
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return makeResponse({ text: 'Add 200 grams of chicken.' });
    }
  });
  assert.equal(text, 'Add 200 grams of chicken.');
  assert.equal(captured.url, 'https://api.groq.com/openai/v1/audio/transcriptions');
  assert.equal(captured.init.headers.Authorization, 'Bearer test-key');
  assert.ok(captured.init.body instanceof FormData);
  assert.equal(captured.init.body.get('model'), 'whisper-large-v3-turbo');
  assert.equal(captured.init.body.get('response_format'), 'json');
  assert.equal(captured.init.body.get('file').name, 'recipe-audio.mp3');
});
