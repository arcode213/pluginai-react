/**
 * Public type surface of the SDK.
 *
 * Everything a consumer can pass in or receive back is declared here so the
 * generated `dist/index.d.ts` gives full autocomplete in editors.
 */

/** Configuration shared by {@link usePluginAI} and `<ChatWidget />`. */
export interface PluginAIConfig {
  /** Your workspace API key. */
  apiKey: string;
  /** The workspace to query. */
  workspace: string;
  /**
   * Advanced: override the backend endpoint.
   *
   * You do not need to set this. The SDK targets the hosted PluginAI backend
   * out of the box; supply a URL only when self-hosting or routing through
   * your own proxy.
   */
  baseUrl?: string;
  /**
   * Continue an existing conversation by passing its id. When omitted the SDK
   * reuses the id stored in the `pluginai_conversation_id` cookie, or generates
   * a fresh one.
   */
  conversationId?: string;
  /** Called with the underlying `Error` on every failed request. */
  onError?: (error: Error) => void;
}

/** Delivery state of a single message. */
export type MessageStatus = 'sending' | 'success' | 'error';

/** Who authored a message. */
export type MessageRole = 'user' | 'assistant';

/** One chat message. */
export interface Message {
  /** Unique within a conversation; safe to use as a React `key`. */
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
}

/** A successful backend response, normalised into camelCase. */
export interface QueryResponse {
  /** The AI-generated answer. */
  answer: string;
  status: 'success' | 'no_data';
  /** Server-side processing time, in seconds. */
  responseTime: number;
  /** The conversation this answer belongs to. */
  conversationId: string;
}

/** Everything {@link usePluginAI} hands back. */
export interface UsePluginAIReturn {
  /** Full conversation, oldest first. */
  messages: Message[];
  /** True while a request is in flight. */
  isLoading: boolean;
  /** Message from the most recent failure, or `null`. */
  error: string | null;
  /** Id grouping the current conversation. */
  conversationId: string;
  /** Send a question and append both the question and the answer. */
  sendMessage: (message: string) => Promise<void>;
  /** Start a brand-new conversation (new id, empty history). */
  resetConversation: () => void;
  /** Empty the history but keep the same conversation id. */
  clearMessages: () => void;
}

/** Where the widget docks against the viewport. */
export type WidgetPosition = 'bottom-right' | 'bottom-left';

/** Props for the drop-in `<ChatWidget />`. */
export interface ChatWidgetProps extends PluginAIConfig {
  /** Header title. Default `"AI Assistant"`. */
  title?: string;
  /** Header subtitle. Default `"Powered by PluginAI"`. */
  subtitle?: string;
  /** First message shown, before any conversation. */
  welcomeMessage?: string;
  /** Input placeholder. Default `"Ask me anything..."`. */
  placeholder?: string;
  /** Viewport corner. Default `"bottom-right"`. */
  position?: WidgetPosition;
  /** Any CSS colour; drives the toggle, header, send button and user bubbles. */
  primaryColor?: string;
  /** Image shown in the header instead of the default mark. */
  avatarUrl?: string;
  /** Show the "Powered by PluginAI" footer. Default `true`. */
  showPoweredBy?: boolean;
  /** Stacking order of the widget root. Default `9999`. */
  zIndex?: number;
  /** Chat window width in px. Default `380`. */
  width?: number;
  /** Chat window height in px. Default `560`. */
  height?: number;
}
