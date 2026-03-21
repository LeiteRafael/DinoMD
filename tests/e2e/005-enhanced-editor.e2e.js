import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { editorDoc } from './fixtures/docs.js'

test.describe('spec 005 — enhanced markdown editor', () => {
    test('CodeMirror-like editor textarea is present and accessible', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, editorDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${editorDoc.name}"]`).first().click()
        await page.getByRole('button', { name: 'Edit document' }).click()

        await expect(page.getByLabel('Markdown editor')).toBeVisible()
    })

    test('typing in the editor updates the textarea value', async ({ page }) => {
        await page.addInitScript((doc) => {
            const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
            const { content, ...meta } = doc
            existing.push(meta)
            localStorage.setItem('dinomd:docs', JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(`dinomd:content:${doc.id}`, content)
            }
        }, editorDoc)
        const app = new AppPage(page)
        await app.goto()
        await page.locator(`[title="${editorDoc.name}"]`).first().click()
        await page.getByRole('button', { name: 'Edit document' }).click()
        const editor = page.getByLabel('Markdown editor')

        await editor.fill('# Newly Typed Content')

        await expect(editor).toHaveValue('# Newly Typed Content')
    })
})
