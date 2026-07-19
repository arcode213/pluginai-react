/** @type {import('jest').Config} */

// MSW v2 and its dependency tree ship as ESM-only. Jest does not transform
// node_modules by default, so these packages are explicitly opted in.
const ESM_PACKAGES = [
  'msw',
  '@mswjs',
  '@open-draft',
  '@bundled-es-modules',
  'rettime',
  'until-async',
  'strict-event-emitter',
  'outvariant',
  'is-node-process',
  'headers-polyfill',
  'tough-cookie',
  'universalify',
];

// Shared compiler options — the build tsconfig excludes `tests/`, so the
// options the test tree needs are supplied inline here instead.
const tsJestOptions = {
  tsconfig: {
    jsx: 'react',
    esModuleInterop: true,
    allowJs: true,
    target: 'ES2019',
    module: 'CommonJS',
    lib: ['DOM', 'DOM.Iterable', 'ES2021'],
    strict: true,
    skipLibCheck: true,
    isolatedModules: false,
    // Pulls in the extended DOM matchers (toBeInTheDocument, toHaveClass, …).
    types: ['jest', 'node', '@testing-library/jest-dom'],
  },
};

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  // Polyfills must land before the framework and before MSW is imported.
  setupFiles: ['<rootDir>/tests/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],
  moduleNameMapper: {
    // Styles carry no behaviour under test; stub them out.
    '\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', tsJestOptions],
    '^.+\\.mjs$': ['ts-jest', tsJestOptions],
  },
  transformIgnorePatterns: [`node_modules/(?!(${ESM_PACKAGES.join('|')})/)`],
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts'],
  testEnvironmentOptions: {
    // fetch needs a real origin to resolve against.
    url: 'https://example.test',
    // jsdom defaults to the "browser" export condition, under which `msw/node`
    // does not resolve. Prefer the node entry points instead.
    customExportConditions: ['node', 'require', 'default'],
  },
};
