/**
 * Default values referenced across the SDK.
 *
 * Anything a developer can override via props or config lives here, so the
 * widget, the hook and the docs all read from one source of truth.
 */

/**
 * The hosted PluginAI backend, baked in at build time.
 *
 * Consumers do not pass a URL — the SDK points here by default so integration
 * needs only an API key and a workspace. Kept internal (not re-exported from
 * the package entry point) to keep the public surface small.
 *
 * Note: this value ships inside the published bundle and is visible in any
 * browser's network panel. It is infrastructure configuration, not a secret.
 */
export const DEFAULT_BASE_URL = 'https://api.pluginai.space';

export const DEFAULT_TITLE = 'AI Assistant';
export const DEFAULT_SUBTITLE = 'Powered by PluginAI';
export const DEFAULT_WELCOME = "Hi! I'm your AI assistant. Ask me anything!";
export const DEFAULT_PLACEHOLDER = 'Ask me anything...';
export const DEFAULT_COLOR = '#7c6df0';
export const DEFAULT_POSITION = 'bottom-right';
export const DEFAULT_WIDTH = 380;
export const DEFAULT_HEIGHT = 560;
export const DEFAULT_Z_INDEX = 9999;

/** Appended to `baseUrl` to form the query endpoint. */
export const QUERY_ENDPOINT = '/call/user/query/user_api_query';

/** Cookie that persists the conversation id across page reloads. */
export const COOKIE_NAME = 'pluginai_conversation_id';
export const COOKIE_EXPIRY_HOURS = 24;

/** Abort a request that has not responded within this window. */
export const REQUEST_TIMEOUT_MS = 30000;

/** localStorage flag: has the user ever opened the widget on this device? */
export const OPENED_STORAGE_KEY = 'pluginai_opened';
