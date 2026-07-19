/**
 * Next.js App Router integration.
 *
 * The widget reads cookies and localStorage, both of which only exist in the
 * browser, so it must be a client component. The SDK guards every such access
 * with a `typeof window` check, which means the module is safe to import from a
 * server file — but the component itself still needs `'use client'` because it
 * uses React state and effects.
 */

'use client';

import { ChatWidget } from 'pluginai-react';

export default function Page() {
  return (
    <>
      <main style={{ padding: 40 }}>
        <h1>Acme — Next.js</h1>
        <p>Server-rendered page with a client-side chat widget.</p>
      </main>

      <ChatWidget
        // NEXT_PUBLIC_ vars are inlined into the client bundle, so only ever
        // put a publishable workspace key here — never a secret.
        apiKey={process.env.NEXT_PUBLIC_PLUGINAI_KEY as string}
        workspace="acme-docs"
        title="Acme Assistant"
      />
    </>
  );
}

/*
 * Prefer to keep the widget out of your server components entirely? Wrap it:
 *
 *   // components/Chat.tsx
 *   'use client'
 *   import { ChatWidget } from 'pluginai-react'
 *   export default function Chat() {
 *     return <ChatWidget apiKey={...} workspace="acme-docs" />
 *   }
 *
 * …then render <Chat /> from any server layout. If you hit hydration warnings
 * from a hosting setup that pre-renders aggressively, load it dynamically:
 *
 *   const Chat = dynamic(() => import('./Chat'), { ssr: false })
 */
