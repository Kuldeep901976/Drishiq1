// jest.setup.js
/**
 * Jest setup file for global test configuration
 */

// Polyfill TextEncoder/TextDecoder for Node.js < 18
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill fetch for Node.js < 18 (optional, only if node-fetch is available)
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // node-fetch not installed, use native fetch if available (Node 18+)
    if (typeof globalThis.fetch !== 'undefined') {
      global.fetch = globalThis.fetch;
    } else {
      // Mock fetch for tests that need it
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      }));
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Suppress console warnings in tests (optional)
// Uncomment if you want to suppress specific warnings
// const originalWarn = console.warn;
// console.warn = (...args) => {
//   if (args[0]?.includes('specific-warning')) return;
//   originalWarn(...args);
// };
