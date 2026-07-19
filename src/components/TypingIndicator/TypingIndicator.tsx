import * as React from 'react';

export interface TypingIndicatorProps {
  primaryColor: string;
}

/**
 * Three dots bouncing in sequence while the assistant composes a reply.
 *
 * Shares the assistant bubble's shape so it reads as a message being written.
 * Dots use `primaryColor` at low opacity to stay quiet next to real content.
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ primaryColor }) => (
  <div
    className="pluginai-message pluginai-message--assistant"
    role="status"
    aria-live="polite"
    aria-label="Assistant is typing"
  >
    <div className="pluginai-bubble pluginai-typing">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="pluginai-typing__dot"
          style={{
            background: primaryColor,
            // Stagger each dot so the bounce travels left to right.
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </div>
  </div>
);
