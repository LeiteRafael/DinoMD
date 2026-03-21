import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { fileBrowserDoc, headingsDoc } from './fixtures/docs.js'

test.describe('spec 004 — file browser sidebar', () => {
    test('multiple seeded documents appear as cards on the main page', async ({ page }) => {
        await page.addInitScript(
            (docs) => {
                const DOCS_KEY = 'dinomd:docs'
                const meta = docs.map(({ content, ...m }) => m)
                localStorage.setItem(DOCS_KEY, JSON.stringify(meta))
                docs.forEach((doc) => {
                    if (doc.content != null) {
                        localStorage.setItem(`dinomd:content:${doc.id}`, doc.content)
                    }
                })
            },
            [headingsDoc, fileBrowserDoc]
        )
        const app = new AppPage(page)
        await app.goto()

        await expect(page.locator(`[title="${headingsDoc.name}"]`).first()).toBeVisible()
        await expect(page.locator(`[title="${fileBrowserDoc.name}"]`).first()).toBeVisible()
    })

    test('clicking a document in the list opens its content in the reader', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, fileBrowserDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${fileBrowserDoc.name}"]`).first().click()

        await expect(page.locator('h1').first()).toHaveText('File Browser')
    })
})
