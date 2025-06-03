import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.{test,spec}.ts'],
    exclude: [
      'lib/__tests__/mocks.ts',
      'lib/**/*.browser.{test,spec}.ts', // Exclude browser-specific tests
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
  },
  resolve: {
    alias: {
      '^(\\.\\.?\\/.+)\\.jsx?$': '$1',
    },
  },
});
