import * as React from 'react';

import type { Message } from '../../types';
import { formatTimestamp } from '../../utils/helpers';

export interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
}

/**
 * One chat bubble.
 *
 * User messages sit right-aligned on `primaryColor`; assistant messages sit
 * left-aligned on white. Colours come through inline styles so the bubble
 * always reflects the caller's palette regardless of the host stylesheet.
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  primaryColor,
}) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';

  return (
    <div
      className={`pluginai-message pluginai-message--${message.role}`}
      data-status={message.status}
    >
      <div
        className="pluginai-bubble"
        style={
          isUser
            ? { background: primaryColor, color: '#ffffff', borderColor: primaryColor }
            : undefined
        }
      >
        {message.content}
      </div>

      <div className="pluginai-message__meta">
        {isError && (
          <span className="pluginai-message__error" role="img" aria-label="Failed to send">
            ⚠
          </span>
        )}
        <time dateTime={message.timestamp.toISOString()}>
          {formatTimestamp(message.timestamp)}
        </time>
      </div>
    </div>
  );
};
