import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/setup-tests.ts'],
    css: true,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    isolate: true,
    pool: 'threads',
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/main.server.ts',
        'src/server.ts',
        'src/setup-tests.ts',
        'src/test-providers.ts',
        'src/environments/**',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@app': new URL('./src/app/', import.meta.url).pathname,
      '@core': new URL('./src/app/core/', import.meta.url).pathname,
      '@shared': new URL('./src/app/shared/', import.meta.url).pathname,
      '@features': new URL('./src/app/features/', import.meta.url).pathname,
      '@layouts': new URL('./src/app/layouts/', import.meta.url).pathname,
      '@env': new URL('./src/environments/', import.meta.url).pathname,
    },
  },
});
