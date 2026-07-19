# pluginai-react

Official React SDK and chat widget for [PluginAI](https://pluginai.space) — add a RAG chatbot grounded in your own documents to any React app in under five minutes.

- 🎯 **Drop-in widget** — a polished floating chatbot, zero UI work
- 🪝 **Headless hook** — full conversation state, bring your own UI
- 🧩 **Zero runtime dependencies** — native `fetch`, plain CSS, nothing else
- 📘 **Fully typed** — complete TypeScript definitions, no `any`
- ⚛️ **React 17 & 18**, SSR-safe for Next.js

---

## Installation

```bash
npm install pluginai-react
# or
yarn add pluginai-react
# or
pnpm add pluginai-react
```

`react` and `react-dom` (>= 17) are peer dependencies — the SDK uses whichever copy your app already has.

---

## Quickstart

### Option 1 — Drop-in widget

```jsx
import { ChatWidget } from 'pluginai-react'

export default function App() {
  return (
    <>
      <YourApp />
      <ChatWidget
        apiKey="your-api-key"
        workspace="your-workspace"
        title="Support Assistant"
        primaryColor="#7c6df0"
      />
    </>
  )
}
```

That's it. The widget renders a floating launcher, remembers the conversation across page reloads, and needs no CSS import — styles ship inside the bundle.

### Option 2 — Headless hook

```jsx
import { usePluginAI } from 'pluginai-react'

function MyChat() {
  const { messages, sendMessage, isLoading } = usePluginAI({
    apiKey: 'your-api-key',
    workspace: 'your-workspace',
  })

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={msg.role}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello')} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

The hook renders nothing and imposes no styles — every pixel is yours.

---

## `<ChatWidget />` props

### Connection

| Prop | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **required** | Your workspace API key. |
| `workspace` | `string` | **required** | Name of the workspace to query. |
| `conversationId` | `string` | auto | Continue a specific conversation. Falls back to the stored cookie, then a fresh id. |
| `onError` | `(error: Error) => void` | — | Called with the `Error` on every failed request. |

### Appearance & content

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `"AI Assistant"` | Header title. |
| `subtitle` | `string` | `"Powered by PluginAI"` | Header subtitle. |
| `welcomeMessage` | `string` | `"Hi! I'm your AI assistant. Ask me anything!"` | First message shown in the panel. |
| `placeholder` | `string` | `"Ask me anything..."` | Input placeholder. |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | Which corner the widget docks to. |
| `primaryColor` | `string` | `"#7c6df0"` | Any CSS colour. Drives the launcher, header, send button and user bubbles. |
| `avatarUrl` | `string` | — | Image shown in the header instead of the default mark. |
| `showPoweredBy` | `boolean` | `true` | Show the "Powered by PluginAI" footer. |
| `zIndex` | `number` | `9999` | Stacking order of the widget root. |
| `width` | `number` | `380` | Panel width in px (ignored below 480px, where it goes full-screen). |
| `height` | `number` | `560` | Panel height in px (same caveat). |

---

## `usePluginAI(config)`

### Config

Accepts the connection options above: `apiKey`, `workspace`, `conversationId`, `onError`.

### Returns

| Value | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Full conversation, oldest first. |
| `isLoading` | `boolean` | `true` while a request is in flight. |
| `error` | `string \| null` | Message from the most recent failure, or `null`. |
| `conversationId` | `string` | Id grouping the current conversation. |
| `sendMessage` | `(message: string) => Promise<void>` | Sends a question; appends both it and the answer. Ignores empty input and concurrent calls. |
| `resetConversation` | `() => void` | Starts a new conversation — new id, empty history. |
| `clearMessages` | `() => void` | Empties history but keeps the same conversation id. |

### `Message`

```ts
interface Message {
  id: string                        // unique — safe as a React key
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status: 'sending' | 'success' | 'error'
}
```

---

## Error handling

Every failure rejects with an `Error` whose `message` is the backend's own `detail` field where available. The hook additionally:

- appends the failure as an `assistant` message with `status: 'error'`
- sets `error` to the message
- invokes your `onError` callback

```jsx
const { error } = usePluginAI({
  apiKey: '...',
  workspace: '...',
  onError: (err) => analytics.track('chat_error', { message: err.message }),
})
```

### `NoDataError`

When a workspace holds nothing relevant to the question, the backend answers `200` with `status: "no_data"`. The SDK surfaces this as a `NoDataError` — but the hook treats it as a **normal answer**, not a failure: the backend's wording appears in the transcript and `error` stays `null`. This is deliberate; an empty result is an outcome, not a fault.

Catch it yourself when calling the API layer directly:

```ts
import { NoDataError } from 'pluginai-react'

try {
  /* ... */
} catch (err) {
  if (err instanceof NoDataError) showUploadPrompt()
}
```

---

## Next.js

The widget uses state, effects, cookies and `localStorage`, so it must be a client component:

```tsx
'use client'
import { ChatWidget } from 'pluginai-react'

export default function Page() {
  return (
    <ChatWidget
      apiKey={process.env.NEXT_PUBLIC_PLUGINAI_KEY!}
      workspace="acme-docs"
    />
  )
}
```

Every browser-only access inside the SDK is guarded with `typeof window !== 'undefined'`, so importing the module from a server file is safe. See [`examples/nextjs-integration`](./examples/nextjs-integration).

> **Security note:** `NEXT_PUBLIC_*` variables are inlined into the client bundle, and any key passed to a browser component is visible to end users. This is inherent to any client-side chat widget, not a gap in this SDK. Only ever ship a publishable workspace key this way — never a secret. For untrusted traffic, proxy requests through your own server using the [Python SDK](https://pypi.org/project/pluginai/), where the key stays server-side.

---

## Multiple widgets

Each `<ChatWidget />` owns its own state, so two instances are already independent. The one thing they share is the conversation-id cookie — a single browser-wide key. Pass an explicit `conversationId` to each to give them genuinely separate conversations:

```jsx
<ChatWidget workspace="acme-sales"   conversationId={salesId}   position="bottom-left"  primaryColor="#12a97a" />
<ChatWidget workspace="acme-support" conversationId={supportId} position="bottom-right" primaryColor="#7c6df0" />
```

---

## Styling

All widget CSS is prefixed `.pluginai-*` and scoped under the widget root, so it cannot collide with your application's styles. Most theming is covered by `primaryColor`; for anything further, override the classes:

```css
#pluginai-widget-container .pluginai-bubble {
  border-radius: 6px;
}
```

---

## Examples

| Example | Shows |
|---|---|
| [`basic-widget`](./examples/basic-widget) | Minimum viable integration |
| [`headless-custom-ui`](./examples/headless-custom-ui) | A chat UI built from scratch on the hook |
| [`nextjs-integration`](./examples/nextjs-integration) | App Router + `'use client'` |
| [`multiple-widgets`](./examples/multiple-widgets) | Two independent widgets on one page |

---

## Development

```bash
npm install
npm run build      # → dist/index.js, dist/index.esm.js, dist/index.d.ts
npm test           # Jest + Testing Library + MSW
npm run lint
npm run typecheck
```

---

## License

MIT © [Plugin AI](https://pluginai.space)
