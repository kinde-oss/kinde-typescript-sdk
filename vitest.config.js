export default {
  test: {
    environment: 'node',
    include: ['lib/**/*.{test,spec}.ts'],
    exclude: ['lib/__tests__/mocks.ts', 'lib/**/*.browser.{test,spec}.ts'],
    globals: true,
    setupFiles: ['./vitest.setup.js'],
  },
};
