import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://khaleef@localhost:5432/haizotech_test',
      JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
      VISITOR_JWT_SECRET: 'different-test-secret-at-least-32-chars',
      CORS_ORIGINS: 'http://localhost:3000',
    },
  },
});
