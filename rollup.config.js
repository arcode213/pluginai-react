import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

import { createRequire } from 'module';

// Import assertions for JSON changed syntax across Node versions; going through
// `require` keeps this config working on every supported release.
const pkg = createRequire(import.meta.url)('./package.json');

export default {
  input: 'src/index.ts',
  output: [
    {
      // CommonJS — webpack, Jest, older bundlers.
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      // ES module — Vite, Rollup, modern bundlers (tree-shakeable).
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
  ],
  // react / react-dom are peers and must never be bundled, or consumers end up
  // with two copies of React and broken hooks.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  plugins: [
    peerDepsExternal(),
    nodeResolve(),
    postcss({
      // Inject the widget CSS at runtime so consumers need no separate import.
      extract: false,
      inject: true,
      minimize: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'tests/**', 'examples/**'],
    }),
    terser(),
  ],
};
