/**
 * Headless hook — bring your own UI.
 *
 * `usePluginAI` ships no markup and no styles. Every pixel below is written by
 * hand; the hook only supplies the conversation state and `sendMessage`.
 */

import { useState } from 'react';
import { usePluginAI } from 'pluginai-react';

export default function App() {
  const [draft, setDraft] = useState('');

  const {
    messages,
    sendMessage,
    isLoading,
    error,
    conversationId,
    resetConversation,
  } = usePluginAI({
    apiKey: process.env.REACT_APP_PLUGINAI_KEY as string,
    workspace: 'acme-docs',
    onError: (err) => console.warn('[chat]', err.message),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const question = draft;
    setDraft(''); // Clear immediately so the box feels responsive.
    await sendMessage(question);
  };

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>My Custom Chat</h2>
        <button onClick={resetConversation}>New conversation</button>
      </header>

      <p style={{ color: '#888', fontSize: 12 }}>Conversation: {conversationId}</p>

      <ul style={{ listStyle: 'none', padding: 0, minHeight: 300 }}>
        {messages.map((message) => (
          <li
            key={message.id}
            style={{
              textAlign: message.role === 'user' ? 'right' : 'left',
              margin: '10px 0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 12,
                background: message.role === 'user' ? '#7c6df0' : '#f0f0f5',
                color: message.role === 'user' ? '#fff' : '#222',
                // Failed messages get a red tint so they read as unsent.
                opacity: message.status === 'error' ? 0.7 : 1,
              }}
            >
              {message.content}
            </span>
          </li>
        ))}

        {isLoading && <li style={{ color: '#888' }}>Thinking…</li>}
      </ul>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask something…"
          disabled={isLoading}
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={isLoading || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
