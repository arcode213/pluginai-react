/**
 * pluginai-react — official React SDK for the PluginAI RAG chatbot.
 *
 * Two entry points: the headless {@link usePluginAI} hook for a custom UI, and
 * the drop-in `<ChatWidget />` for zero UI work.
 */

// Hook
export { usePluginAI } from './hooks/usePluginAI';

// Component
export { ChatWidget } from './components/ChatWidget';

// Error thrown when a workspace has no relevant documents.
export { NoDataError } from './utils/api';

// Types
export type {
  PluginAIConfig,
  Message,
  MessageRole,
  MessageStatus,
  QueryResponse,
  UsePluginAIReturn,
  ChatWidgetProps,
  WidgetPosition,
} from './types';

// Constants, for consumers building on top of the defaults.
export { DEFAULT_COLOR, DEFAULT_POSITION } from './constants';
