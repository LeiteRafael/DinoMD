import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { copyDoc } from './fixtures/docs.js'

test.describe('spec 008 — copy and save shortcuts', () => {
    test('Save button persists the document to the list', async ({ page }) => {
        const app = new AppPage(page)
        await app.goto()
        await page
            .getByRole('button', { name: /new document/i })
            .first()
            .click()
        await page.getByLabel('Markdown editor').fill('# Save Test Document')

        await page.getByRole('button', { name: 'Save document' }).click()
        await page.getByRole('button', { name: 'Back to document list' }).click()

        await expect(page.locator('[title="Untitled"]').first()).toBeVisible()
    })

    test('Copy MD button shows a success toast after clicking', async ({ context, page }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write'])
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, copyDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${copyDoc.name}"]`).first().click()
        await page.getByRole('button', { name: 'Edit document' }).click()

        await page.getByRole('button', { name: 'Copy as Markdown' }).click()

        await expect(page.getByText('Copied as Markdown')).toBeVisible()
    })

    test('Ctrl+S saves a previously persisted document', async ({ page }) => {
        const app = new AppPage(page)
        await app.goto()
        await page
            .getByRole('button', { name: /new document/i })
            .first()
            .click()
        await page.getByRole('button', { name: 'Save document' }).click()
        await page.getByLabel('Markdown editor').fill('# After Initial Save')

        await page.keyboard.press('Control+s')

        await expect(page.getByRole('button', { name: 'Save document' })).toBeDisabled()
    })
})
