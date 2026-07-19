/**
 * Playground for the SDK.
 *
 * Left: live controls for every ChatWidget prop.
 * Right: the headless hook driving a hand-rolled UI, proving both entry points
 *        share the same behaviour.
 */

import { useState } from 'react';
import { ChatWidget, usePluginAI, type WidgetPosition } from 'pluginai-react';

import { installMockBackend, mockState, type MockMode } from './mockBackend';

installMockBackend();

const MODES: { value: MockMode; label: string }[] = [
  { value: 'success', label: 'Success (~0.9s)' },
  { value: 'slow', label: 'Slow (6s) — watch the typing dots' },
  { value: 'no_data', label: 'No data in workspace' },
  { value: 'auth_error', label: 'Auth error (401)' },
  { value: 'server_error', label: 'Server error (500)' },
];

/** The headless hook wired to a completely custom UI. */
function HeadlessDemo({ backend }: { backend: string }) {
  const [draft, setDraft] = useState('');

  const { messages, sendMessage, isLoading, error, conversationId, resetConversation } =
    usePluginAI({
      apiKey: 'demo-key',
      workspace: 'demo-workspace',
      baseUrl: backend,
      onError: (err) => console.warn('[headless onError]', err.message),
    });

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>Headless hook</h2>
        <button onClick={resetConversation}>Reset</button>
      </div>

      <p className="hint">
        Zero SDK markup — every element below is written by hand.
        <br />
        <code>{conversationId}</code>
      </p>

      <div className="transcript">
        {messages.length === 0 && <p className="hint">No messages yet. Say hello.</p>}

        {messages.map((m) => (
          <div key={m.id} className={`row row--${m.role}`}>
            <span className={`chip chip--${m.role} ${m.status === 'error' ? 'chip--error' : ''}`}>
              {m.content}
            </span>
          </div>
        ))}

        {isLoading && <p className="hint">Thinking…</p>}
      </div>

      {error && <p className="error">error: {error}</p>}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          const q = draft;
          setDraft('');
          void sendMessage(q);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask something…"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

export default function App() {
  // Any URL works — the mock intercepts by path, not host.
  const backend = 'https://demo.pluginai.local';

  const [mode, setMode] = useState<MockMode>('success');
  const [title, setTitle] = useState('Support Assistant');
  const [subtitle, setSubtitle] = useState('Powered by PluginAI');
  const [welcome, setWelcome] = useState("Hi! I'm your AI assistant. Ask me anything!");
  const [placeholder, setPlaceholder] = useState('Ask me anything...');
  const [color, setColor] = useState('#7c6df0');
  const [position, setPosition] = useState<WidgetPosition>('bottom-right');
  const [width, setWidth] = useState(380);
  const [height, setHeight] = useState(560);
  const [poweredBy, setPoweredBy] = useState(true);
  const [showSecond, setShowSecond] = useState(false);

  const applyMode = (next: MockMode) => {
    setMode(next);
    mockState.mode = next;
  };

  return (
    <div className="page">
      <header className="hero">
        <h1>pluginai-react</h1>
        <p>
          Local playground. A mock backend is installed, so no API key is needed —
          open the launcher in the corner and start chatting.
        </p>
      </header>

      <div className="grid">
        <section className="panel">
          <h2>Widget controls</h2>

          <label>
            Backend behaviour
            <select value={mode} onChange={(e) => applyMode(e.target.value as MockMode)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Subtitle
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </label>

          <label>
            Welcome message
            <input value={welcome} onChange={(e) => setWelcome(e.target.value)} />
          </label>

          <label>
            Placeholder
            <input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
          </label>

          <label>
            Primary colour
            <span className="color-row">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <code>{color}</code>
            </span>
          </label>

          <label>
            Position
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as WidgetPosition)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </label>

          <label>
            Width — {width}px
            <input
              type="range"
              min={300}
              max={520}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>

          <label>
            Height — {height}px
            <input
              type="range"
              min={380}
              max={700}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={poweredBy}
              onChange={(e) => setPoweredBy(e.target.checked)}
            />
            Show &ldquo;Powered by&rdquo; footer
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={showSecond}
              onChange={(e) => setShowSecond(e.target.checked)}
            />
            Add a second widget (opposite corner, own conversation)
          </label>

          <p className="hint">
            Checklist: resize the browser under 480px for the full-screen mobile
            layout; reload the page to confirm the conversation cookie persists;
            open DevTools to watch the request payload.
          </p>
        </section>

        <HeadlessDemo backend={backend} />
      </div>

      <ChatWidget
        apiKey="demo-key"
        workspace="demo-workspace"
        baseUrl={backend}
        title={title}
        subtitle={subtitle}
        welcomeMessage={welcome}
        placeholder={placeholder}
        primaryColor={color}
        position={position}
        width={width}
        height={height}
        showPoweredBy={poweredBy}
        onError={(err) => console.warn('[widget onError]', err.message)}
      />

      {showSecond && (
        <ChatWidget
          apiKey="demo-key-2"
          workspace="second-workspace"
          baseUrl={backend}
          // Explicit id — otherwise both widgets share the one cookie.
          conversationId="conv_playground_two"
          title="Second Widget"
          subtitle="Different workspace"
          welcomeMessage="I'm a separate widget with my own history."
          primaryColor="#12a97a"
          position={position === 'bottom-right' ? 'bottom-left' : 'bottom-right'}
        />
      )}
    </div>
  );
}
