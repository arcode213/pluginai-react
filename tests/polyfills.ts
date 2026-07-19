/**
 * Node globals that jsdom does not provide.
 *
 * Runs via `setupFiles`, i.e. before the test framework and before anything
 * imports undici or MSW — both of which reference these at module load time.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */

import { TextDecoder, TextEncoder } from 'util';
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from 'stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';

const g = globalThis as any;

// Order matters: undici's fetch reads ReadableStream at import time.
g.TextEncoder ??= TextEncoder;
g.TextDecoder ??= TextDecoder;
g.ReadableStream ??= ReadableStream;
g.WritableStream ??= WritableStream;
g.TransformStream ??= TransformStream;
g.MessageChannel ??= MessageChannel;
g.MessagePort ??= MessagePort;
g.structuredClone ??= (value: unknown) => JSON.parse(JSON.stringify(value));

// Now that the streams exist, undici's fetch stack can be loaded safely.
if (typeof g.fetch === 'undefined') {
  const undici = require('undici');
  g.fetch = undici.fetch;
  g.Request = undici.Request;
  g.Response = undici.Response;
  g.Headers = undici.Headers;
  g.FormData = undici.FormData;
}

// MSW v2 uses BroadcastChannel for its client/worker sync; a no-op stub is
// enough because these tests never exercise cross-context messaging.
if (typeof g.BroadcastChannel === 'undefined') {
  g.BroadcastChannel = class {
    onmessage: unknown = null;
    postMessage() {
      /* no-op */
    }
    close() {
      /* no-op */
    }
    addEventListener() {
      /* no-op */
    }
    removeEventListener() {
      /* no-op */
    }
  };
}
