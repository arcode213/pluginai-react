/**
 * The headless hook that powers the SDK.
 *
 * All conversation logic lives here and none of the UI does, so `<ChatWidget />`
 * and a fully custom chat interface share exactly the same behaviour.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  Message,
  PluginAIConfig,
  UsePluginAIReturn,
} from '../types';
import { NoDataError, sendQuery } from '../utils/api';
import { getConversationId, setConversationId } from '../utils/cookie';
import { generateConversationId, generateMessageId } from '../utils/helpers';

/** Build a `Message` with an id and timestamp filled in. */
function createMessage(
  role: Message['role'],
  content: string,
  status: Message['status'] = 'success',
): Message {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date(),
    status,
  };
}

/**
 * Resolve the conversation id to start from.
 *
 * Explicit config wins, then a stored cookie, then a fresh id. Returns `null`
 * during SSR so the first render is deterministic and the real id is picked up
 * in an effect once the browser takes over.
 */
function resolveInitialId(configured?: string): string | null {
  if (configured) return configured;
  if (typeof document === 'undefined') return null;
  return getConversationId() || generateConversationId();
}

/**
 * Manage a PluginAI conversation: history, loading state, errors and the id.
 *
 * ```tsx
 * const { messages, sendMessage, isLoading } = usePluginAI({
 *   apiKey: 'pk_live_...',
 *   workspace: 'support-docs',
 * })
 * ```
 *
 * @param config API key, workspace and optional base URL / conversation id.
 * @returns The conversation state plus `sendMessage`, `resetConversation` and
 *   `clearMessages`.
 */
export function usePluginAI(config: PluginAIConfig): UsePluginAIReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The id lives in a ref because a request in flight must read the *current*
  // value without the hook re-running. `idVersion` exists only to re-render
  // consumers after a reset, so the returned `conversationId` stays accurate.
  const conversationIdRef = useRef<string | null>(
    resolveInitialId(config.conversationId),
  );
  const [, setIdVersion] = useState(0);

  // `sendMessage` reads config through a ref so a caller passing an inline
  // object literal does not invalidate the callback on every render.
  const configRef = useRef(config);
  configRef.current = config;

  // Guards against `setState` after unmount, and cancels the in-flight request.
  const isMountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  // `isLoading` is also mirrored into a ref so the concurrent-send guard sees
  // the latest value even when two calls land in the same render pass.
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    // On the client, adopt the stored id (SSR left the ref null) and persist it.
    if (!conversationIdRef.current) {
      conversationIdRef.current =
        config.conversationId || getConversationId() || generateConversationId();
      setIdVersion((v) => v + 1);
    }
    setConversationId(conversationIdRef.current);

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
    // Deliberately mount-only: changing `conversationId` mid-session should not
    // silently discard the running conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    const trimmed = message.trim();
    if (!trimmed || isLoadingRef.current) return;

    const activeConfig = configRef.current;
    const conversationId =
      conversationIdRef.current ||
      (conversationIdRef.current = generateConversationId());

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Optimistic update — the question appears instantly, before the round trip.
    setMessages((prev) => [...prev, createMessage('user', trimmed)]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendQuery(
        activeConfig,
        trimmed,
        conversationId,
        controller.signal,
      );

      if (!isMountedRef.current) return;
      setMessages((prev) => [...prev, createMessage('assistant', response.answer)]);
      setError(null);
    } catch (err) {
      // The component unmounted mid-flight; there is no one left to tell.
      if (controller.signal.aborted && !isMountedRef.current) return;

      const failure = err instanceof Error ? err : new Error(String(err));

      // An empty workspace is a normal outcome, not a fault — surface the
      // backend's own wording in the transcript instead of an error banner.
      const isNoData = failure instanceof NoDataError;

      if (isMountedRef.current) {
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', failure.message, isNoData ? 'success' : 'error'),
        ]);
        setError(isNoData ? null : failure.message);
      }

      activeConfig.onError?.(failure);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
      isLoadingRef.current = false;
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const resetConversation = useCallback((): void => {
    const nextId = generateConversationId();
    conversationIdRef.current = nextId;
    setConversationId(nextId);
    setMessages([]);
    setError(null);
    setIdVersion((v) => v + 1);
  }, []);

  const clearMessages = useCallback((): void => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId: conversationIdRef.current || '',
    sendMessage,
    resetConversation,
    clearMessages,
  };
}
