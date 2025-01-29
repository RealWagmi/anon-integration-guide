import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['projects/amped/functions/**/*.test.ts'],
        setupFiles: ['.vitest/setup.ts']
    }
}); 