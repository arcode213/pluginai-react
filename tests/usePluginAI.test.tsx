import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { usePluginAI } from '../src/hooks/usePluginAI';
import type { PluginAIConfig } from '../src/types';
import { setConversationId } from '../src/utils/cookie';
import { BASE_URL, QUERY_URL, server } from './server';

const config: PluginAIConfig = {
  apiKey: 'test-api-key',
  workspace: 'test-workspace',
  baseUrl: BASE_URL,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('usePluginAI', () => {
  it('initializes with an empty message list', () => {
    const { result } = renderHook(() => usePluginAI(config));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('generates a conversation id on mount', () => {
    const { result } = renderHook(() => usePluginAI(config));
    expect(result.current.conversationId).toMatch(/^conv_[a-z0-9]{12}$/);
  });

  it('reuses the conversation id stored in the cookie', () => {
    setConversationId('conv_existing1234');
    const { result } = renderHook(() => usePluginAI(config));
    expect(result.current.conversationId).toBe('conv_existing1234');
  });

  it('prefers an explicitly configured conversation id', () => {
    setConversationId('conv_fromcookie12');
    const { result } = renderHook(() =>
      usePluginAI({ ...config, conversationId: 'conv_explicit123' }),
    );
    expect(result.current.conversationId).toBe('conv_explicit123');
  });

  it('adds the user message immediately, before the response arrives', async () => {
    const { result } = renderHook(() => usePluginAI(config));

    act(() => {
      void result.current.sendMessage('Hello');
    });

    // Asserted before the request settles — this is the optimistic update.
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Hello',
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('appends the assistant message on success', async () => {
    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'The refund window is 30 days.',
      status: 'success',
    });
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading true during the request and false afterwards', async () => {
    const { result } = renderHook(() => usePluginAI(config));

    act(() => {
      void result.current.sendMessage('Hello');
    });
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('sets the error state when the API fails', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ detail: 'Invalid API key' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).toBe('Invalid API key');
    expect(result.current.messages[1]).toMatchObject({ status: 'error' });
  });

  it('calls onError with the Error instance on failure', async () => {
    const onError = jest.fn();
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({ detail: 'Invalid API key' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => usePluginAI({ ...config, onError }));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Invalid API key');
  });

  it('treats a no_data response as a normal answer, not an error', async () => {
    server.use(
      http.post(QUERY_URL, () =>
        HttpResponse.json({
          respons: 'No data found for this query.',
          status: 'no_data',
          response_time_seconds: 0.1,
        }),
      ),
    );

    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'No data found for this query.',
      status: 'success',
    });
  });

  it('resetConversation clears the messages', async () => {
    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => result.current.resetConversation());
    expect(result.current.messages).toEqual([]);
  });

  it('resetConversation generates a different conversation id', () => {
    const { result } = renderHook(() => usePluginAI(config));
    const original = result.current.conversationId;

    act(() => result.current.resetConversation());

    expect(result.current.conversationId).not.toBe(original);
    expect(result.current.conversationId).toMatch(/^conv_[a-z0-9]{12}$/);
  });

  it('clearMessages empties history but keeps the conversation id', async () => {
    const { result } = renderHook(() => usePluginAI(config));
    const original = result.current.conversationId;

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    act(() => result.current.clearMessages());

    expect(result.current.messages).toEqual([]);
    expect(result.current.conversationId).toBe(original);
  });

  it('ignores an empty or whitespace-only message', async () => {
    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      await result.current.sendMessage('');
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores a second send while one is already in flight', async () => {
    let requestCount = 0;
    server.use(
      http.post(QUERY_URL, () => {
        requestCount += 1;
        return HttpResponse.json({ respons: 'ok', status: 'success' });
      }),
    );

    const { result } = renderHook(() => usePluginAI(config));

    await act(async () => {
      const first = result.current.sendMessage('First');
      const second = result.current.sendMessage('Second');
      await Promise.all([first, second]);
    });

    expect(requestCount).toBe(1);
    // Only "First" produced a user bubble and an answer.
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('First');
  });

  it('does not update state after the component unmounts', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => usePluginAI(config));

    act(() => {
      void result.current.sendMessage('Hello');
    });
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('unmounted component'),
    );
    errorSpy.mockRestore();
  });
});
