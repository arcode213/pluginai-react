/** Small stateless helpers shared across the SDK. */

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Random alphanumeric string of `length` characters. */
function randomToken(length: number): string {
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return token;
}

/**
 * Create a fresh conversation id, e.g. `conv_k3f9a01bz7qd`.
 *
 * Used whenever no id was supplied and none is stored in the cookie.
 */
export function generateConversationId(): string {
  return `conv_${randomToken(12)}`;
}

/**
 * Create a unique id for one {@link Message}.
 *
 * Combines a timestamp with a random suffix so two messages created in the
 * same millisecond still differ.
 */
export function generateMessageId(): string {
  return `msg_${Date.now().toString(36)}_${randomToken(6)}`;
}

/** Format a `Date` as a short 12-hour clock time, e.g. `"10:35 AM"`. */
export function formatTimestamp(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  // 0 and 12 both display as 12 on a 12-hour clock.
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** True when running in a browser — guards cookie/localStorage access for SSR. */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
