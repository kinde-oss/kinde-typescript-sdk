import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.{test,spec}.ts'],
    exclude: ['lib/__tests__/mocks.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '^(\\.\\.?\\/.+)\\.jsx?$': '$1',
    },
  },
}) 