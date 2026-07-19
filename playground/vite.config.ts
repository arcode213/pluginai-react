import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point at the SDK source, not dist, so edits hot-reload instantly
      // without a rebuild. Swap to '../dist' to exercise the built bundle.
      'pluginai-react': resolve(__dirname, '../src/index.ts'),
      // The playground and the SDK must share one React copy, or hooks break.
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: { port: 5173, open: true },
});
