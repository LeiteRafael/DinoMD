import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { transform as esbuildTransform } from 'esbuild'

const electronMockPath = fileURLToPath(new URL('./tests/__mocks__/electron.js', import.meta.url))

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
                resolve: {
                    alias: {
                        electron: electronMockPath,
                    },
                },
                test: {
                    name: 'main',
                    environment: 'node',
                    include: ['tests/main/unit/**/*.test.js'],
                    globals: true,
                },
            },
            {
                plugins: [jsxInJsPlugin(), react()],
                test: {
                    name: 'renderer',
                    environment: 'jsdom',
                    include: [
                        'tests/renderer/unit/**/*.test.{js,jsx}',
                        'tests/renderer/integration/**/*.test.{js,jsx}',
                    ],
                    globals: true,
                    setupFiles: ['tests/renderer/setup.js', '@testing-library/jest-dom'],
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
            include: ['src/main/**', 'src/preload/**', 'src/renderer/src/**'],
            exclude: [
                'src/renderer/src/main.jsx',
                'src/main/index.js',
                'src/preload/index.js',
                'src/main/fs/fileUtils.js',
                'src/main/store/index.js',
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
