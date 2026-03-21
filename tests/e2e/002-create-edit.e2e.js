import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'

test.describe('spec 002 — create and edit document', () => {
    test('new document editor opens when New document button is clicked', async ({ page }) => {
        const app = new AppPage(page)
        await app.goto()

        await page
            .getByRole('button', { name: /new document/i })
            .first()
            .click()

        await expect(page.getByLabel('Markdown editor')).toBeVisible()
    })

    test('new document appears in list after being saved', async ({ page }) => {
        const app = new AppPage(page)
        await app.goto()
        await page
            .getByRole('button', { name: /new document/i })
            .first()
            .click()
        await page.getByLabel('Markdown editor').fill('# My First Note')

        await page.getByRole('button', { name: 'Save document' }).click()
        await page.getByRole('button', { name: 'Back to document list' }).click()

        await expect(page.locator('[title="Untitled"]').first()).toBeVisible()
    })
})
