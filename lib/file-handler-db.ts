import { getPrisma } from '@/lib/prisma'

// Generate unique filename
export function generateFileName(originalName: string, projectId: number, projectNeedId?: number): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const ext = getFileExtension(originalName)
  
  if (projectNeedId) {
    return `project-${projectId}-need-${projectNeedId}-${timestamp}-${random}${ext}`
  } else {
    return `project-${projectId}-general-${timestamp}-${random}${ext}`
  }
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > -1 ? fileName.substring(lastDot) : ''
}

// Save file to database
export async function saveFile(
  buffer: Buffer,
  fileName: string,
  originalName: string,
  mimeType: string,
  projectId?: number,
  needId?: number
): Promise<string> {
  const prisma = await getPrisma()
  const fileRecord = await prisma.fileStorage.create({
    data: {
      fileName,
      originalName,
      mimeType,
      size: buffer.length,
      content: buffer,
      projectId,
      needId
    }
  })
  
  // Return the file ID as the URL
  return `/api/files/${fileRecord.id}`
}

// Delete file from database
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const prisma = await getPrisma()
    // Extract ID from URL if needed
    const id = fileId.startsWith('/api/files/') 
      ? fileId.replace('/api/files/', '')
      : fileId
    
    await prisma.fileStorage.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    // Continue even if file couldn't be deleted
  }
}

// Get file from database
export async function getFile(fileId: string): Promise<{ 
  content: Buffer
  fileName: string
  originalName: string
  mimeType: string
} | null> {
  try {
    const prisma = await getPrisma()
    const file = await prisma.fileStorage.findUnique({
      where: { id: fileId }
    })
    
    if (!file) return null
    
    return {
      content: Buffer.from(file.content),
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType
    }
  } catch (error) {
    console.error('Error getting file:', error)
    return null
  }
}

// Validate file type
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
  
  const ext = getFileExtension(fileName).toLowerCase()
  return allowedExtensions.includes(ext)
}

// Validate file size (max 10MB)
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return sizeInBytes <= maxSize
}