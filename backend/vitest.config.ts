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
      // Isolate test uploads from the dev uploads dir; the test cleans this up.
      UPLOADS_DIR: '.test-uploads',
      UPLOADS_PUBLIC_URL: 'http://localhost:5001/uploads',
    },
  },
});
