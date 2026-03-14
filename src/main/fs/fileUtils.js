import { promises as fs } from 'fs'

export async function readFileAsUtf8(filePath) {
  return fs.readFile(filePath, 'utf8')
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
