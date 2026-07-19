/**
 * Two widgets, two workspaces, one page.
 *
 * Each `<ChatWidget />` owns its own `usePluginAI` instance, so message history
 * and loading state are already independent.
 *
 * The one thing they *would* share is the conversation-id cookie â€” it is a
 * single browser-wide key. Pass an explicit `conversationId` to each widget to
 * give them genuinely separate conversations on the backend.
 */

import { useMemo } from 'react';
import { ChatWidget } from 'pluginai-react';

/** Stable per-widget id, kept for the lifetime of the page. */
function useConversationId(prefix: string) {
  return useMemo(
    () => `conv_${prefix}_${Math.random().toString(36).slice(2, 10)}`,
    [prefix],
  );
}

export default function App() {
  const salesId = useConversationId('sales');
  const supportId = useConversationId('support');

  return (
    <>
      <main style={{ padding: 40, fontFamily: 'system-ui' }}>
        <h1>Acme</h1>
        <p>Sales questions bottom-left, support questions bottom-right.</p>
      </main>

      <ChatWidget
        apiKey="pk_live_sales_key"
        workspace="acme-sales"
        conversationId={salesId}
        title="Talk to Sales"
        subtitle="Pricing &amp; plans"
        position="bottom-left"
        primaryColor="#12a97a"
        welcomeMessage="Hi! Questions about pricing?"
      />

      <ChatWidget
        apiKey="pk_live_support_key"
        workspace="acme-support"
        conversationId={supportId}
        title="Support"
        subtitle="Docs &amp; troubleshooting"
        position="bottom-right"
        primaryColor="#7c6df0"
        welcomeMessage="Hi! Stuck on something?"
      />
    </>
  );
}
