import * as React from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder: string;
  primaryColor: string;
}

/** Rows the textarea may grow to before it starts scrolling. */
const MAX_ROWS = 4;

/**
 * The composer at the bottom of the chat.
 *
 * Grows with the text up to {@link MAX_ROWS}, sends on Enter and inserts a
 * newline on Shift+Enter — the convention people already expect from chat apps.
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder,
  primaryColor,
}) => {
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Grab focus on mount so an opened widget is immediately typeable.
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /** Re-measure the textarea against its content, capped at MAX_ROWS. */
  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Collapse first, otherwise scrollHeight only ever grows.
    el.style.height = 'auto';

    // `lineHeight` is often "normal" and paddings are "" before styles load,
    // both of which parse to NaN — fall back so the arithmetic stays finite.
    const styles = window.getComputedStyle(el);
    const toPx = (value: string, fallback = 0): number => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const lineHeight = toPx(styles.lineHeight, 20);
    const padding = toPx(styles.paddingTop) + toPx(styles.paddingBottom);
    const maxHeight = lineHeight * MAX_ROWS + padding;

    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  React.useEffect(resize, [value, resize]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <form
      className="pluginai-input"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={textareaRef}
        className="pluginai-input__field"
        rows={1}
        value={value}
        placeholder={placeholder}
        disabled={isLoading}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Message"
      />

      <button
        type="submit"
        className="pluginai-input__send"
        disabled={!canSend}
        aria-label="Send message"
        style={{ background: primaryColor, opacity: canSend ? 1 : 0.45 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15.6 12 3.4 13.8z" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
};
