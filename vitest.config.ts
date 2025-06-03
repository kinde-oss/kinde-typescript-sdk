import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.{test,spec}.ts'],
    exclude: [
      'lib/__tests__/mocks.ts',
      'lib/**/*.browser.{test,spec}.ts', // Exclude browser-specific test
    ],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'lib/__tests__/mocks.ts',
        'dist',
        'dist-cjs',
        'lib/models',
        'lib/apis',
      ],
    },
    deps: {
      inline: [/node:.*/],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '^(\\.\\.?\\/.+)\\.jsx?$': '$1',
    },
  },
});
