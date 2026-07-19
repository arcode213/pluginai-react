/**
 * Jest setup — runs after the test framework is installed.
 *
 * Environment polyfills live in `polyfills.ts` (loaded earlier via
 * `setupFiles`); this file only adds matchers and per-test cleanup.
 */

import '@testing-library/jest-dom';

// React 18 only treats updates as act-wrapped when this global is on. Without
// it, even Testing Library's own act-wrapped events log spurious warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// Not implemented in jsdom; the widget's scroll handling may reach for it.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {
    /* no-op */
  };
}

// Every test starts from a clean cookie jar and localStorage.
afterEach(() => {
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  window.localStorage.clear();
});
