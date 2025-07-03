import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { deleteFile } from '@/lib/file-handler-db'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { fileId } = await context.params
    
    // Hämta fil för att få URL
    const file = await prisma.projectFile.findUnique({
      where: { id: parseInt(fileId) }
    })
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Ta bort fysisk fil
    await deleteFile(file.fileUrl)
    
    // Ta bort från databasen
    await prisma.projectFile.delete({
      where: { id: parseInt(fileId) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}