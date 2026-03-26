import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { headingsDoc, fileBrowserDoc, copyDoc } from './fixtures/docs.js'

test.describe('document management — listing, navigation, creation, and persistence', () => {
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

    test('multiple seeded documents appear as cards on the main page', async ({ page }) => {
        await page.addInitScript(
            (docs) => {
                const DOCS_KEY = 'dinomd:docs'
                const meta = docs.map(({ content: _content, ...m }) => m)
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
