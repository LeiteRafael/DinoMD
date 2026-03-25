import html2canvas from 'html2canvas'

const captureElement = async (element, scale = 2) => {
    const canvas = await html2canvas(element, {
        scale,
        useCORS: false,
        logging: false,
        backgroundColor: null,
    })
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob)
            } else {
                reject(new Error('Failed to generate image blob'))
            }
        }, 'image/png')
    })
}

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export { captureElement, downloadBlob }
