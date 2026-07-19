/**
 * Conversation-id cookie helpers.
 *
 * Persisting the id lets a visitor reload the page and keep their chat history
 * on the backend. Every function is a no-op outside the browser so the SDK can
 * be imported from a Next.js server component without blowing up.
 */

import { COOKIE_EXPIRY_HOURS, COOKIE_NAME } from '../constants';
import { isBrowser } from './helpers';

/** Read the stored conversation id, or `null` if there isn't one. */
export function getConversationId(): string | null {
  if (!isBrowser()) return null;

  const prefix = `${COOKIE_NAME}=`;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!match) return null;

  const value = decodeURIComponent(match.slice(prefix.length));
  return value || null;
}

/** Store `id` for {@link COOKIE_EXPIRY_HOURS} hours, site-wide. */
export function setConversationId(id: string): void {
  if (!isBrowser()) return;

  const expires = new Date(
    Date.now() + COOKIE_EXPIRY_HOURS * 60 * 60 * 1000,
  ).toUTCString();

  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(id)}; expires=${expires}; ` +
    'path=/; SameSite=Lax';
}

/** Delete the cookie by expiring it in the past. */
export function clearConversationId(): void {
  if (!isBrowser()) return;

  document.cookie =
    `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
    'path=/; SameSite=Lax';
}
