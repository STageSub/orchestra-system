import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'projects')

// Säkerställ att upload-mappen finns
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Generera unikt filnamn
export function generateFileName(originalName: string, projectId: number, projectNeedId?: number): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const ext = path.extname(originalName)
  
  if (projectNeedId) {
    return `project-${projectId}-need-${projectNeedId}-${timestamp}-${random}${ext}`
  } else {
    return `project-${projectId}-general-${timestamp}-${random}${ext}`
  }
}

// Spara fil
export async function saveFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  await ensureUploadDir()
  const filePath = path.join(UPLOAD_DIR, fileName)
  await writeFile(filePath, buffer)
  
  // Returnera relativ sökväg för URL
  return `/uploads/projects/${fileName}`
}

// Ta bort fil
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Konvertera URL till filsökväg
    const fileName = path.basename(fileUrl)
    const filePath = path.join(UPLOAD_DIR, fileName)
    
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    // Fortsätt även om filen inte kunde tas bort
  }
}

// Validera filtyp
export function isValidFileType(fileName: string): boolean {
  const allowedExtensions = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.doc',
    '.docx',
    '.txt',
    '.xml',
    '.mxl',
    '.musicxml'
  ]
  
  const ext = path.extname(fileName).toLowerCase()
  return allowedExtensions.includes(ext)
}

// Validera filstorlek (max 10MB)
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return sizeInBytes <= maxSize
}