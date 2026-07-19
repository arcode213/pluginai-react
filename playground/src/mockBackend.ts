/**
 * A fake PluginAI backend, so the whole widget can be exercised without
 * credentials or a running server.
 *
 * Installs a `fetch` wrapper that answers the query endpoint and passes every
 * other request through untouched.
 */

const ENDPOINT = '/call/user/query/user_api_query';

export type MockMode = 'success' | 'no_data' | 'auth_error' | 'server_error' | 'slow';

/** Canned answers, cycled through so replies don't all look identical. */
const ANSWERS = [
  'Our refund window is 30 days from the date of purchase. Contact support with your order number and we will process it within 3 business days.',
  'You can rotate an API key from Settings → API Keys. The old key stays valid for one hour so you have time to redeploy.',
  'Yes — the Pro plan includes unlimited workspaces. The Starter plan is limited to three.',
  'Indexing usually finishes within a couple of minutes. Very large PDFs can take up to ten.',
];

let answerIndex = 0;
let installed = false;

/** The mode the next request should simulate. Mutated by the playground UI. */
export const mockState: { mode: MockMode } = { mode: 'success' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Patch `window.fetch` once. Safe to call repeatedly. */
export function installMockBackend(): void {
  if (installed) return;
  installed = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Anything that isn't the query endpoint is none of our business.
    if (!url.includes(ENDPOINT)) return realFetch(input, init);

    const payload = init?.body ? JSON.parse(init.body as string) : {};
    // Logged so you can confirm the exact wire format the SDK sends. The API
    // key is redacted — the SDK must never leak it, and neither should this.
    console.log('[mock backend] received', {
      ...payload,
      Api_key: payload.Api_key ? `${String(payload.Api_key).slice(0, 3)}…` : undefined,
    });

    switch (mockState.mode) {
      case 'auth_error':
        await wait(400);
        return jsonResponse({ detail: 'Invalid API key' }, 401);

      case 'server_error':
        await wait(400);
        return jsonResponse({ detail: 'Upstream model timed out' }, 500);

      case 'no_data':
        await wait(600);
        return jsonResponse({
          respons:
            'No data found. This workspace has no documents matching your question yet.',
          status: 'no_data',
          response_time_seconds: 0.123,
        });

      case 'slow':
        // Long enough to watch the typing indicator do its thing.
        await wait(6000);
        break;

      default:
        await wait(900);
    }

    const answer = ANSWERS[answerIndex % ANSWERS.length];
    answerIndex += 1;

    return jsonResponse({
      respons: answer,
      status: 'success',
      response_time_seconds: 1.23,
    });
  };
}
