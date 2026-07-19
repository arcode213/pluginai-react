/**
 * Basic widget — the fastest possible integration.
 *
 * Drop `<ChatWidget />` anywhere in your tree with the three required props and
 * you have a working chatbot. Everything else is optional.
 */

import { ChatWidget } from 'pluginai-react';

export default function App() {
  return (
    <>
      <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Acme Documentation</h1>
        <p>
          Browse the docs, or hit the chat bubble in the corner to ask our AI
          assistant anything.
        </p>
      </main>

      <ChatWidget
        apiKey={import.meta.env.VITE_PLUGINAI_KEY}
        workspace="acme-docs"
        title="Support Assistant"
        primaryColor="#7c6df0"
      />
    </>
  );
}
