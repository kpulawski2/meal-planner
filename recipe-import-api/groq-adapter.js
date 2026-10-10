const CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TRANSCRIPTIONS_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export class GroqApiError extends Error {
  constructor(message, { status = 0, kind = 'unknown', retryAfterMs = null, model = '' } = {}) {
    super(message);
    this.name = 'GroqApiError';
    this.status = status;
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
    this.model = model;
  }
}

export function parseRetryAfter(response) {
  const value = response.headers.get('retry-after');
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.min(seconds * 1000, 60_000));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.min(date - Date.now(), 60_000)) : null;
}

export function parseRetryDelayFromMessage(message) {
  const text = String(message || '');
  const match = text.match(/(?:try again|retry)(?:\s+in|\s+after)\s+(\d+(?:\.\d+)?)\s*(ms|msec|milliseconds?|s|sec|seconds?)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const isMilliseconds = /^m/i.test(match[2]);
  return Math.max(0, Math.min(isMilliseconds ? amount : amount * 1000, 60_000));
}

export function evenlySampleFrames(frames, maximum = 3) {
  if (!Array.isArray(frames) || !frames.length || maximum < 1) return [];
  if (frames.length <= maximum) return frames.slice();
  if (maximum === 1) return [frames[Math.floor((frames.length - 1) / 2)]];
  const indexes = Array.from({ length: maximum }, (_, i) => Math.round(i * (frames.length - 1) / (maximum - 1)));
  return [...new Set(indexes)].map(i => frames[i]);
}

export function buildGroqUserContent(text, frameImages = []) {
  const content = [{ type: 'text', text: String(text || '') }];
  // The configured Groq vision model accepts at most three images per request.
  for (const base64 of evenlySampleFrames(frameImages, 3)) {
    if (typeof base64 !== 'string' || !base64) continue;
    content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } });
  }
  return content;
}

function classifyError(status, detail, retryAfterMs, model) {
  if (status === 401 || status === 403) {
    return new GroqApiError(`Groq rejected the API key or access. Check GROQ_API_KEY and model access. ${detail}`.trim(), { status, kind: 'configuration', retryAfterMs, model });
  }
  if (status === 404 || status === 400 && /model.+(?:decommissioned|not found|does not exist|unavailable)|model_decommissioned/i.test(detail)) {
    return new GroqApiError(`Groq model ${model} was not found or is unavailable. Check the configured model ID. ${detail}`.trim(), { status, kind: 'model_unavailable', retryAfterMs, model });
  }
  if (status === 429) {
    // TPM/RPM errors often include marketing text such as "upgrade today" later
    // in the same body. Detect per-minute limits first so "today" isn't mistaken
    // for a daily quota error.
    const perMinute = /\b(?:tokens?\s+per\s+minute|\bTPM\b|requests?\s+per\s+minute|\bRPM\b|per-minute)\b/i.test(detail);
    const daily = !perMinute && /\b(?:daily|per day|daily limit|quota exceeded|quota is exhausted|monthly|per month|exhausted)\b/i.test(detail);
    const messageRetryMs = parseRetryDelayFromMessage(detail);
    const resolvedRetryAfterMs = Math.max(retryAfterMs || 0, messageRetryMs || 0) || null;
    return new GroqApiError(`Groq ${daily ? 'free-tier daily quota appears exhausted' : 'rate limit reached'} for ${model}. ${detail}`.trim(), { status, kind: daily ? 'quota' : 'rate_limit', retryAfterMs: resolvedRetryAfterMs, model });
  }
  if ([408, 500, 502, 503, 504].includes(status)) {
    return new GroqApiError(`Groq is temporarily unavailable (HTTP ${status}) on ${model}. ${detail}`.trim(), { status, kind: 'transient', retryAfterMs, model });
  }
  return new GroqApiError(detail || `Groq request failed (HTTP ${status}).`, { status, kind: 'fatal', retryAfterMs, model });
}

async function readError(response) {
  const data = await response.json().catch(() => ({}));
  return String(data?.error?.message || data?.message || '').trim().slice(0, 700);
}

export async function groqChatCompletion({
  apiKey,
  model = 'qwen/qwen3.8-27b',
  system,
  userText,
  frameImages = [],
  temperature = 0.1,
  maxCompletionTokens = 6500,
  reasoningEffort,
  jsonMode = true,
  timeoutMs = 90000,
  fetchImpl = fetch
}) {
  if (!apiKey) throw new GroqApiError('Backend is missing GROQ_API_KEY. Add it to the hosting service environment variables.', { kind: 'configuration', model });

  const body = {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: String(system) }] : []),
      { role: 'user', content: buildGroqUserContent(userText, frameImages) }
    ],
    temperature,
    max_completion_tokens: maxCompletionTokens,
    stream: false
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  if (reasoningEffort) body.reasoning_effort = reasoningEffort;

  let response;
  try {
    response = await fetchImpl(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new GroqApiError(timedOut ? `Groq request timed out on ${model}.` : `Network error while contacting Groq on ${model}.`, { kind: 'transient', model });
  }

  if (!response.ok) {
    const detail = await readError(response);
    throw classifyError(response.status, detail, parseRetryAfter(response), model);
  }
  const data = await response.json().catch(() => ({}));
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content.trim() : Array.isArray(content) ? content.map(part => part?.text || '').join('\n').trim() : '';
  if (!text) throw new GroqApiError('Groq returned no text. Retry the import or paste the recipe caption/transcript.', { kind: 'empty_response', model });
  return text;
}

// Both IDs are listed on Groq's Free Plan Limits page. A text model never
// receives images; unavailable vision is reported instead of pretending frames
// were read. There is one model fallback, only for an unavailable text model.
export async function groqRecipeCompletion({ textModel = 'openai/gpt-oss-20b', visionModel = 'qwen/qwen3.8-27b', ...options }) {
  const vision = Array.isArray(options.frameImages) && options.frameImages.length > 0;
  const supportedVision = 'qwen/qwen3.8-27b';
  // Older Render configurations may name a retired or text-only vision model.
  // Only the currently documented image model receives private uploaded frames.
  const model = vision ? (visionModel === supportedVision ? visionModel : supportedVision) : textModel;
  const reasoningEffort = model.startsWith('qwen/') ? 'none' : model.startsWith('openai/gpt-oss') ? 'low' : undefined;
  try {
    return await groqChatCompletion({ ...options, model, reasoningEffort });
  } catch (error) {
    if (vision || !(error instanceof GroqApiError) || error.kind !== 'model_unavailable' || textModel === 'qwen/qwen3.8-27b') throw error;
    return groqChatCompletion({ ...options, model: 'qwen/qwen3.8-27b', reasoningEffort: 'none' });
  }
}

export async function groqTranscribe({
  apiKey,
  model = 'whisper-large-v3-turbo',
  audio,
  timeoutMs = 120000,
  fetchImpl = fetch
}) {
  if (!apiKey) throw new GroqApiError('Backend is missing GROQ_API_KEY. Add it to the hosting service environment variables.', { kind: 'configuration', model });
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/mpeg' }), 'recipe-audio.mp3');
  form.append('model', model);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  let response;
  try {
    response = await fetchImpl(TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new GroqApiError(timedOut ? 'Groq audio transcription timed out.' : 'Network error while contacting Groq audio transcription.', { kind: 'transient', model });
  }

  if (!response.ok) {
    const detail = await readError(response);
    throw classifyError(response.status, detail, parseRetryAfter(response), model);
  }
  const result = await response.json().catch(() => ({}));
  const text = typeof result.text === 'string' ? result.text.trim() : '';
  if (!text) throw new GroqApiError('Groq transcription returned no speech text.', { kind: 'empty_response', model });
  return text;
}
