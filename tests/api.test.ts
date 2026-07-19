import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_URL, QUERY_ENDPOINT } from '../src/constants';
import type { PluginAIConfig } from '../src/types';
import { NoDataError, sendQuery } from '../src/utils/api';
import { BASE_URL, QUERY_URL, server } from './server';

const config: PluginAIConfig = {
  apiKey: 'test-api-key',
  workspace: 'test-workspace',
  baseUrl: BASE_URL,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('sendQuery', () => {
  it('sends all four fields in the request payload', async () => {
    let body: Record<string, unknown> = {};

    server.use(
      http.post(QUERY_URL, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          respons: 'ok',
          status: 'success',
          response_time_seconds: 1,
        });
      }),
    );

    await sendQuery(config, 'What is the refund policy?', 'conv_test123');

    expect(body).toEqual({
      query: 'What is the refund policy?',
      workspace_name: 'test-workspace',
      Api_key: 'test-api-key',
      unique_id: 'conv_test123',
    });
  });

  it('returns a normalised QueryResponse on success', async () => {
    const response = await sendQuery(config, 'hello', 'conv_test123');

    expect(response).toEqual({
      answer: 'The refund window is 30 days.',
      status: 'success',
      responseTime: 2.341,
      conversationId: 'conv_test123',
    });
  });

  it('throws with the backend detail on 401', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ detail: 'Invalid API key' }, { status: 401 }),
      ),
    );

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toThrow(
      'Invalid API key',
    );
  });

  it('throws with the backend detail on 403', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ detail: 'Quota exceeded' }, { status: 403 }),
      ),
    );

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toThrow(
      'Quota exceeded',
    );
  });

  it('falls back to a generic message when the body has no detail', async () => {
    server.use(
      http.post(QUERY_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toThrow(
      'Request failed with HTTP 500.',
    );
  });

  it('throws NoDataError when the workspace has nothing relevant', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({
          respons: 'No data found for this query.',
          status: 'no_data',
          response_time_seconds: 0.123,
        }),
      ),
    );

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toBeInstanceOf(
      NoDataError,
    );
  });

  it('times out once the request exceeds the 30s budget', async () => {
    // Bypasses MSW deliberately: a never-resolving handler leaves the
    // interceptor holding the request open, which balloons memory. A direct
    // stub that only settles on abort keeps the test cheap and precise.
    const realFetch = globalThis.fetch;

    globalThis.fetch = jest.fn(
      (_input: unknown, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted.');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }),
    ) as unknown as typeof fetch;

    jest.useFakeTimers();
    try {
      const pending = sendQuery(config, 'hello', 'conv_1');
      const assertion = expect(pending).rejects.toThrow(/timed out after 30s/);

      jest.advanceTimersByTime(30000);
      await assertion;
    } finally {
      jest.useRealTimers();
      globalThis.fetch = realFetch;
    }
  });

  it('surfaces a connection error when the backend is unreachable', async () => {
    server.use(http.post(QUERY_URL, () => HttpResponse.error()));

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toThrow(
      /Could not reach the PluginAI backend/,
    );
  });

  it('never puts the API key into a thrown error message', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ detail: 'Invalid API key' }, { status: 401 }),
      ),
    );

    await expect(sendQuery(config, 'hello', 'conv_1')).rejects.toThrow(
      expect.not.stringContaining('test-api-key') as unknown as string,
    );
  });

  it('falls back to the built-in endpoint when baseUrl is omitted', async () => {
    let requested = '';

    // The default endpoint is compiled into the bundle, so consumers integrate
    // with just an API key and a workspace.
    server.use(
      http.post(`${DEFAULT_BASE_URL}${QUERY_ENDPOINT}`, ({ request }) => {
        requested = request.url;
        return HttpResponse.json({ respons: 'ok', status: 'success' });
      }),
    );

    await sendQuery(
      { apiKey: 'test-api-key', workspace: 'test-workspace' },
      'hi',
      'conv_1',
    );

    expect(requested).toBe(`${DEFAULT_BASE_URL}${QUERY_ENDPOINT}`);
  });

  it('strips a trailing slash from baseUrl', async () => {
    let requested = '';

    server.use(
      http.post(QUERY_URL, ({ request }) => {
        requested = request.url;
        return HttpResponse.json({ respons: 'ok', status: 'success' });
      }),
    );

    await sendQuery({ ...config, baseUrl: `${BASE_URL}/` }, 'hi', 'conv_1');

    expect(requested).toBe(QUERY_URL);
  });
});
