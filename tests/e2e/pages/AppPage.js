export class AppPage {
    constructor(page) {
        this.page = page
    }

    async goto() {
        await this.page.goto('/')
    }

    documentCards() {
        return this.page.getByTestId('document-card')
    }

    documentCardByName(name) {
        return this.page.getByTestId('document-card').filter({ hasText: name })
    }

    editorContent() {
        return this.page.locator('.cm-content, textarea[aria-label="Markdown editor"]').first()
    }

    previewPanel() {
        return this.page.locator('[data-testid="preview-pane"], [aria-label="Preview"]').first()
    }

    sidebar() {
        return this.page.locator('[data-testid="sidebar"]').first()
    }

    newDocumentButton() {
        return this.page.getByRole('button', { name: /new document/i })
    }

    importButton() {
        return this.page.getByRole('button', { name: /import/i })
    }

    async seedDocument(doc) {
        await this.page.evaluate((docToSeed) => {
            const DOCS_KEY = 'dinomd:docs'
            const CONTENT_KEY = `dinomd:content:${docToSeed.id}`
            const existing = JSON.parse(localStorage.getItem(DOCS_KEY) || '[]')
            const { content, ...meta } = docToSeed
            existing.push(meta)
            localStorage.setItem(DOCS_KEY, JSON.stringify(existing))
            if (content != null) {
                localStorage.setItem(CONTENT_KEY, content)
            }
        }, doc)
    }

    async clearStorage() {
        await this.page.evaluate(() => {
            localStorage.removeItem('dinomd:docs')
            localStorage.removeItem('dinomd:ui')
        })
    }
}
