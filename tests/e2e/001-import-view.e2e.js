import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { headingsDoc } from './fixtures/docs.js'

test.describe('spec 001 — import and reader view', () => {
    test('seeded document card appears on the main page', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, headingsDoc)
        const app = new AppPage(page)
        await app.goto()

        await expect(page.locator(`[title="${headingsDoc.name}"]`).first()).toBeVisible()
    })

    test('clicking a document card navigates to reader and renders the heading', async ({
        page,
    }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, headingsDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${headingsDoc.name}"]`).first().click()

        await expect(page.locator('h1').first()).toHaveText('Heading One')
    })
})
