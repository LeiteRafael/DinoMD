import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { splitViewDoc } from './fixtures/docs.js'

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

test.describe('spec 006 — editor UI refinements', () => {
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
