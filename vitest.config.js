import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { transform as esbuildTransform } from 'esbuild'

function jsxInJsPlugin() {
    return {
        name: 'vite-plugin-jsx-in-test-js',
        enforce: 'pre',
        async transform(code, id) {
            if (!id.endsWith('.js') || id.includes('/node_modules/')) return null
            if (!code.includes('<')) return null
            const result = await esbuildTransform(code, {
                loader: 'jsx',
                jsx: 'automatic',
                sourcemap: 'inline',
            })
            return { code: result.code }
        },
    }
}

export default defineConfig({
    test: {
        projects: [
            {
                plugins: [jsxInJsPlugin(), react()],
                test: {
                    name: 'renderer',
                    environment: 'jsdom',
                    include: [
                        'tests/unit/renderer/**/*.test.{js,jsx}',
                        'tests/integration/renderer/**/*.test.{js,jsx}',
                    ],
                    globals: true,
                    setupFiles: ['tests/unit/renderer/setup.js', '@testing-library/jest-dom'],
                    css: {
                        modules: {
                            classNameStrategy: 'non-scoped',
                        },
                    },
                    server: {
                        deps: {
                            inline: [/@exodus\/bytes/],
                        },
                    },
                },
            },
        ],
        coverage: {
            provider: 'v8',
            include: ['src/renderer/src/**', 'src/web/**'],
            exclude: [
                'src/renderer/src/main.jsx',
                'src/web/main.jsx',
                '**/__mocks__/**',
                '**/node_modules/**',
            ],
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: 'coverage',
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
})
