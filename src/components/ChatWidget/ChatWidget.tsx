import * as React from 'react';

import {
  DEFAULT_COLOR,
  DEFAULT_HEIGHT,
  DEFAULT_PLACEHOLDER,
  DEFAULT_POSITION,
  DEFAULT_SUBTITLE,
  DEFAULT_TITLE,
  DEFAULT_WELCOME,
  DEFAULT_WIDTH,
  DEFAULT_Z_INDEX,
  OPENED_STORAGE_KEY,
} from '../../constants';
import { usePluginAI } from '../../hooks/usePluginAI';
import type { ChatWidgetProps } from '../../types';
import { isBrowser } from '../../utils/helpers';
import { ChatInput } from '../ChatInput';
import { MessageBubble } from '../MessageBubble';
import { TypingIndicator } from '../TypingIndicator';

import './ChatWidget.css';

/**
 * Drop-in floating chat widget.
 *
 * Renders a launcher button that opens a full conversation panel. All state is
 * delegated to {@link usePluginAI}; this component only composes the UI.
 *
 * ```tsx
 * <ChatWidget apiKey="pk_live_..." workspace="support-docs" primaryColor="#7c6df0" />
 * ```
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiKey,
  workspace,
  baseUrl,
  conversationId,
  onError,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  welcomeMessage = DEFAULT_WELCOME,
  placeholder = DEFAULT_PLACEHOLDER,
  position = DEFAULT_POSITION,
  primaryColor = DEFAULT_COLOR,
  avatarUrl,
  showPoweredBy = true,
  zIndex = DEFAULT_Z_INDEX,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  const { messages, isLoading, sendMessage } = usePluginAI({
    apiKey,
    workspace,
    baseUrl,
    conversationId,
    onError,
  });

  const [isOpen, setIsOpen] = React.useState(false);

  // Pulse the launcher until this visitor has opened the widget at least once.
  // Starts false so server and first client render agree; the effect below
  // turns it on once localStorage is readable.
  const [shouldPulse, setShouldPulse] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isBrowser()) return;
    try {
      setShouldPulse(window.localStorage.getItem(OPENED_STORAGE_KEY) !== 'true');
    } catch {
      // Private-browsing modes can throw on localStorage access; the pulse is
      // decorative, so failing quietly is the right call.
    }
  }, []);

  // Keep the newest message in view as the conversation grows.
  React.useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const handleToggle = () => {
    setIsOpen((open) => !open);

    if (shouldPulse) {
      setShouldPulse(false);
      try {
        window.localStorage.setItem(OPENED_STORAGE_KEY, 'true');
      } catch {
        // See above — a failed write only costs us the pulse suppression.
      }
    }
  };

  return (
    <div
      id="pluginai-widget-container"
      className={`pluginai-widget pluginai-widget--${position}`}
      style={
        {
          zIndex,
          ['--pluginai-primary' as string]: primaryColor,
        } as React.CSSProperties
      }
    >
      <div
        className={`pluginai-window ${isOpen ? 'pluginai-window--open' : ''}`}
        style={{ width, height }}
        role="dialog"
        aria-label={title}
        aria-hidden={!isOpen}
      >
        <header className="pluginai-header" style={{ background: primaryColor }}>
          <div className="pluginai-header__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span aria-hidden="true">✦</span>
            )}
            <span className="pluginai-header__status" title="Online" />
          </div>

          <div className="pluginai-header__text">
            <strong className="pluginai-header__title">{title}</strong>
            <span className="pluginai-header__subtitle">{subtitle}</span>
          </div>

          <button
            type="button"
            className="pluginai-header__close"
            onClick={() => setIsOpen(false)}
            // Distinct from the toggle's label so both remain unambiguous to
            // screen readers while the panel is open.
            aria-label="Close chat panel"
          >
            ×
          </button>
        </header>

        <div className="pluginai-messages" ref={scrollRef}>
          <MessageBubble
            message={{
              id: 'pluginai-welcome',
              role: 'assistant',
              content: welcomeMessage,
              timestamp: new Date(),
              status: 'success',
            }}
            primaryColor={primaryColor}
          />

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              primaryColor={primaryColor}
            />
          ))}

          {isLoading && <TypingIndicator primaryColor={primaryColor} />}
        </div>

        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder={placeholder}
          primaryColor={primaryColor}
        />

        {showPoweredBy && (
          <footer className="pluginai-footer">
            Powered by{' '}
            <a href="https://pluginai.space" target="_blank" rel="noopener noreferrer">
              PluginAI
            </a>
          </footer>
        )}
      </div>

      <button
        type="button"
        className={`pluginai-toggle ${shouldPulse && !isOpen ? 'pluginai-toggle--pulse' : ''}`}
        style={{ background: primaryColor }}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3c-4.97 0-9 3.36-9 7.5 0 2.3 1.25 4.36 3.2 5.73L5.5 20l4.1-2.1c.77.16 1.57.25 2.4.25 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
