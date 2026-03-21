import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { splitViewDoc } from './fixtures/docs.js'

test.describe('spec 003 — split view', () => {
    test('split view shows both editor pane and preview pane', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, splitViewDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${splitViewDoc.name}"]`).first().click()
        await page.getByRole('button', { name: 'Edit document' }).click()
        await page.getByRole('button', { name: 'Open split view' }).click()

        await expect(page.getByLabel('Markdown editor')).toBeVisible()
        await expect(page.getByRole('group', { name: 'View mode' })).toBeVisible()
    })

    test('typing in the editor pane is reflected in the preview pane', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, splitViewDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${splitViewDoc.name}"]`).first().click()
        await page.getByRole('button', { name: 'Edit document' }).click()
        await page.getByRole('button', { name: 'Open split view' }).click()
        const editor = page.getByLabel('Markdown editor')
        await editor.fill('# Live Preview Heading')

        await expect(page.locator('h1').first()).toHaveText('Live Preview Heading')
    })
})
