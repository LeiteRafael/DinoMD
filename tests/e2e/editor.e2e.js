import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { splitViewDoc, editorDoc } from './fixtures/docs.js'

async function openSplitView(page) {
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
}

test.describe('editor — editing, split view, and UI modes', () => {
    test('split view shows both editor pane and preview pane', async ({ page }) => {
        await openSplitView(page)

        await expect(page.getByLabel('Markdown editor')).toBeVisible()
        await expect(page.getByRole('group', { name: 'View mode' })).toBeVisible()
    })

    test('typing in the editor pane is reflected in the preview pane', async ({ page }) => {
        await openSplitView(page)
        const editor = page.getByLabel('Markdown editor')
        await editor.fill('# Live Preview Heading')

        await expect(page.locator('h1').first()).toHaveText('Live Preview Heading')
    })

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

    test('view mode toggle group renders all three mode buttons', async ({ page }) => {
        await openSplitView(page)

        await expect(page.getByRole('button', { name: 'Split' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Editor Only' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Preview Only' })).toBeVisible()
    })

    test('clicking Editor Only sets that button as active', async ({ page }) => {
        await openSplitView(page)

        await page.getByRole('button', { name: 'Editor Only' }).click()

        await expect(page.getByRole('button', { name: 'Editor Only' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        await expect(page.getByRole('button', { name: 'Split' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    test('clicking Preview Only sets that button as active', async ({ page }) => {
        await openSplitView(page)

        await page.getByRole('button', { name: 'Preview Only' }).click()

        await expect(page.getByRole('button', { name: 'Preview Only' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
    })
})
