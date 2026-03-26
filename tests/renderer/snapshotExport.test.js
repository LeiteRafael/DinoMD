import { captureElement, downloadBlob } from '../../src/renderer/src/utils/snapshotExport.js'

vi.mock('html2canvas', () => ({
    default: vi.fn(),
}))

import html2canvas from 'html2canvas'

const makeMockCanvas = (blob) => ({
    toBlob: vi.fn((callback) => callback(blob)),
})

test('captureElement calls html2canvas with scale 2 by default', async () => {
    const blob = new Blob(['data'], { type: 'image/png' })
    html2canvas.mockResolvedValue(makeMockCanvas(blob))
    const element = document.createElement('div')
    const result = await captureElement(element)
    expect(html2canvas).toHaveBeenCalledWith(element, expect.objectContaining({ scale: 2 }))
    expect(result).toBe(blob)
})

test('captureElement passes custom scale', async () => {
    const blob = new Blob(['data'], { type: 'image/png' })
    html2canvas.mockResolvedValue(makeMockCanvas(blob))
    const element = document.createElement('div')
    await captureElement(element, 3)
    expect(html2canvas).toHaveBeenCalledWith(element, expect.objectContaining({ scale: 3 }))
})

test('captureElement rejects when toBlob returns null', async () => {
    html2canvas.mockResolvedValue(makeMockCanvas(null))
    const element = document.createElement('div')
    await expect(captureElement(element)).rejects.toThrow('Failed to generate image blob')
})

test('downloadBlob creates anchor and triggers click', () => {
    const blob = new Blob(['data'], { type: 'image/png' })
    const anchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(anchor)
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    global.URL.revokeObjectURL = vi.fn()
    downloadBlob(blob, 'test.png')
    expect(anchor.download).toBe('test.png')
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
})
