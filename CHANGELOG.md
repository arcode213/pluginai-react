# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-19

First public release.

### Added

- `usePluginAI` — headless hook managing messages, loading state, errors and the
  conversation id. Optimistic user messages, abort-on-unmount, and guards
  against empty or concurrent sends.
- `<ChatWidget />` — drop-in floating chat widget with configurable title,
  subtitle, welcome message, placeholder, position, primary colour, avatar,
  z-index and dimensions.
- Conversation persistence via the `pluginai_conversation_id` cookie (24h).
- Backend endpoint is built in, so integration needs only an API key and a
  workspace. `baseUrl` remains available as an optional override for
  self-hosting or proxying.
- `NoDataError`, thrown when a workspace holds nothing relevant. The hook
  surfaces it as a normal answer rather than an error.
- Full TypeScript definitions for every public type.
- CommonJS and ES module builds, with CSS injected into the bundle.
- SSR-safe: all cookie and `localStorage` access is guarded for Next.js.
- Mobile-responsive layout — the panel goes full-screen below 480px.
