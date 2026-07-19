/**
 * The single HTTP call the SDK makes.
 *
 * Uses the browser's native `fetch` — no axios, no polyfills, nothing to bloat
 * the bundle. The API key travels in the request body only and is never logged
 * or attached to a thrown error.
 */

import {
  DEFAULT_BASE_URL,
  QUERY_ENDPOINT,
  REQUEST_TIMEOUT_MS,
} from '../constants';
import type { PluginAIConfig, QueryResponse } from '../types';

/**
 * Thrown when the backend answers 200 but the workspace held nothing relevant.
 *
 * A distinct class so callers can `catch (e) { if (e instanceof NoDataError) }`
 * and nudge the user to upload documents rather than showing a hard failure.
 */
export class NoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoDataError';
    // Restores the prototype chain when compiled down to ES5.
    Object.setPrototypeOf(this, NoDataError.prototype);
  }
}

/** Raw JSON shape returned by the backend. */
interface RawQueryResponse {
  respons?: string;
  response?: string;
  status?: string;
  response_time_seconds?: number;
  detail?: string;
}

/** Parse a response body as JSON, tolerating empty or non-JSON bodies. */
async function readJson(response: Response): Promise<RawQueryResponse> {
  try {
    const data: unknown = await response.json();
    return data && typeof data === 'object' ? (data as RawQueryResponse) : {};
  } catch {
    return {};
  }
}

/**
 * POST a question to the PluginAI query endpoint.
 *
 * @param config         API key, workspace and (optionally) a custom base URL.
 * @param message        The user's question.
 * @param conversationId Groups this call with the rest of the conversation.
 * @param signal         Optional caller signal — aborting it cancels the request.
 *
 * @throws {NoDataError} When the workspace has no relevant documents.
 * @throws {Error} On timeout, network failure, or any non-2xx response. The
 *   message is the backend's `detail` field when present.
 */
export async function sendQuery(
  config: PluginAIConfig,
  message: string,
  conversationId: string,
  signal?: AbortSignal,
): Promise<QueryResponse> {
  // Falls back to the built-in endpoint; callers normally pass nothing.
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${baseUrl}${QUERY_ENDPOINT}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Forward an unmount/cancel from the caller into our own controller so a
  // single `signal` covers both the timeout and the caller's abort.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: message,
        workspace_name: config.workspace,
        Api_key: config.apiKey,
        unique_id: conversationId,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // A caller-triggered abort is not an error worth reporting — rethrow it as
    // is so the hook can recognise and swallow it.
    if (signal?.aborted) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. ` +
          'Please check your connection and try again.',
      );
    }
    throw new Error(
      `Could not reach the PluginAI backend at ${baseUrl}. ` +
        'Check the `baseUrl` and your network connection.',
    );
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      data.detail || `Request failed with HTTP ${response.status}.`,
    );
  }

  // The backend spells the key `respons`; fall back to the correct spelling so
  // a future backend fix cannot break this SDK.
  const answer = data.respons || data.response || '';
  const status = data.status === 'no_data' ? 'no_data' : 'success';

  if (status === 'no_data') {
    throw new NoDataError(
      answer || 'No relevant data found for this query.',
    );
  }

  return {
    answer,
    status,
    responseTime: Number(data.response_time_seconds) || 0,
    conversationId,
  };
}
