/**
 * Shared MSW server.
 *
 * Handlers default to a happy-path answer; individual tests override with
 * `server.use(...)` to exercise failures.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const BASE_URL = 'https://backend.test';
export const QUERY_URL = `${BASE_URL}/call/user/query/user_api_query`;

export const successHandler = http.post(QUERY_URL, () =>
  HttpResponse.json({
    respons: 'The refund window is 30 days.',
    status: 'success',
    response_time_seconds: 2.341,
  }),
);

export const server = setupServer(successHandler);
