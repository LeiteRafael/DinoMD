import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: 'tests/e2e',
    testMatch: ['**/*.e2e.js'],
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],
    use: {
        baseURL: 'http://localhost:5174',
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev:web',
        url: 'http://localhost:5174',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
})
