import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'

test.describe('file tree — sidebar and folder browsing', () => {
    test('clicking Open Folder renders tree entries from the stubbed picker', async ({ page }) => {
        await page.addInitScript(() => {
            const mockEntries = [
                ['readme.md', { kind: 'file', name: 'readme.md' }],
                ['notes', { kind: 'directory', name: 'notes' }],
            ]
            window.showDirectoryPicker = async () => ({
                name: 'test-folder',
                kind: 'directory',
                async *entries() {
                    for (const entry of mockEntries) {
                        yield entry
                    }
                },
                async getDirectoryHandle(name) {
                    return {
                        name,
                        kind: 'directory',
                        async *entries() {},
                        async getDirectoryHandle() {
                            throw new Error('not found')
                        },
                    }
                },
            })
        })
        const app = new AppPage(page)
        await app.goto()
        await page.getByRole('button', { name: 'Open Folder' }).first().click()

        await expect(page.getByRole('button', { name: 'readme.md' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'notes' })).toBeVisible()
    })

    test('tree renders folder name in sidebar header after folder is opened', async ({ page }) => {
        await page.addInitScript(() => {
            window.showDirectoryPicker = async () => ({
                name: 'my-project',
                kind: 'directory',
                async *entries() {},
                async getDirectoryHandle(name) {
                    return {
                        name,
                        kind: 'directory',
                        async *entries() {},
                        async getDirectoryHandle() {
                            throw new Error('not found')
                        },
                    }
                },
            })
        })
        const app = new AppPage(page)
        await app.goto()
        await page.getByRole('button', { name: 'Open Folder' }).first().click()

        await expect(page.getByText('my-project')).toBeVisible()
    })
})
