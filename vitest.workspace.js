import { defineWorkspace } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineWorkspace([
    {
        test: {
            name: 'main',
            environment: 'node',
            include: ['tests/main/**/*.test.js'],
            globals: true,
            pool: 'vmForks',
        },
    },
    {
        plugins: [react()],
        css: {
            modules: {
                classNameStrategy: 'non-scoped',
            },
        },
        test: {
            name: 'renderer',
            environment: 'jsdom',
            include: ['tests/renderer/**/*.test.{js,jsx}'],
            globals: true,
            setupFiles: ['tests/renderer/setup.js', '@testing-library/jest-dom'],
        },
    },
])
