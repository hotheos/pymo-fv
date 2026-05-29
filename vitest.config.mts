import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // No jsdom needed: tests are pure business logic, no DOM.
        environment: 'node',
        globals: true,
        include: ['__tests__/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './app'),
        },
    },
});
