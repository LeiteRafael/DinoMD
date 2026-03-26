import { test, expect } from '@playwright/test'
import { AppPage } from './pages/AppPage.js'
import { codeSnapshotDoc } from './fixtures/docs.js'

const seedDoc = async (page, doc) => {
    await page.addInitScript((d) => {
        const existing = JSON.parse(localStorage.getItem('dinomd:docs') || '[]')
        const { content, ...meta } = d
        existing.push(meta)
        localStorage.setItem('dinomd:docs', JSON.stringify(existing))
        if (content != null) {
            localStorage.setItem(`dinomd:content:${d.id}`, content)
        }
    }, doc)
}

const openSplitView = async (page, docName) => {
    await page.locator(`[title="${docName}"]`).first().click()
    await page.getByRole('button', { name: 'Edit document' }).click()
    await page.getByRole('button', { name: 'Open split view' }).click()
}

test.describe('code snapshot — snapshot mode and export', () => {
    test('Snapshot toggle reveals the Code snapshot chrome', async ({ page }) => {
        await seedDoc(page, codeSnapshotDoc)
        const app = new AppPage(page)
        await app.goto()
        await openSplitView(page, codeSnapshotDoc.name)

        await page.getByRole('button', { name: 'Snapshot' }).click()

        await expect(page.getByLabel('Code snapshot')).toBeVisible()
    })

    test('Export PNG button is visible in Snapshot mode', async ({ page }) => {
        await seedDoc(page, codeSnapshotDoc)
        const app = new AppPage(page)
        await app.goto()
        await openSplitView(page, codeSnapshotDoc.name)
        await page.getByRole('button', { name: 'Snapshot' }).click()

        await expect(page.getByRole('button', { name: 'Export as PNG' })).toBeVisible()
    })

    test('switching back to Code mode hides the Export PNG button', async ({ page }) => {
        await seedDoc(page, codeSnapshotDoc)
        const app = new AppPage(page)
        await app.goto()
        await openSplitView(page, codeSnapshotDoc.name)
        await page.getByRole('button', { name: 'Snapshot' }).click()
        await page.getByRole('button', { name: 'Code' }).click()

        await expect(page.getByRole('button', { name: 'Export as PNG' })).not.toBeVisible()
    })

    test('Snapshot mode defaults back to Code mode when a different file is opened', async ({
        page,
    }) => {
        const secondDoc = {
            id: 'fixture-010b',
            name: 'second.js',
            filePath: null,
            orderIndex: 10,
            status: 'available',
            content: 'const x = 2\n',
        }
        await seedDoc(page, codeSnapshotDoc)
        await seedDoc(page, secondDoc)
        const app = new AppPage(page)
        await app.goto()
        await openSplitView(page, codeSnapshotDoc.name)
        await page.getByRole('button', { name: 'Snapshot' }).click()
        await expect(page.getByLabel('Code snapshot')).toBeVisible()

        await page.locator(`[title="${secondDoc.name}"]`).first().click()

        await expect(page.getByLabel('Code snapshot')).not.toBeVisible()
    })
})
