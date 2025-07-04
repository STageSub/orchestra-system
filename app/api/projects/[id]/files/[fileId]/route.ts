import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { deleteFile } from '@/lib/file-handler-db'
import { apiLogger } from '@/lib/logger'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, fileId } = await context.params
    
    // Log file deletion start
    await apiLogger.info(request, 'api', 'Attempting to delete project file', {
      metadata: {
        action: 'delete_project_file',
        projectId: id,
        fileId
      }
    })
    
    // Hämta fil för att få URL
    const file = await prisma.projectFile.findUnique({
      where: { id: parseInt(fileId) }
    })
    
    if (!file) {
      await apiLogger.warn(request, 'api', 'File not found for deletion', {
        metadata: {
          action: 'delete_project_file',
          projectId: id,
          fileId
        }
      })
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
    
    // Log successful deletion
    await apiLogger.info(request, 'api', 'Project file deleted successfully', {
      metadata: {
        action: 'delete_project_file',
        projectId: id,
        fileId,
        fileName: file.fileName,
        fileType: file.fileType
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    
    const { id, fileId } = await context.params
    // Log error
    await apiLogger.error(request, 'api', `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'delete_project_file',
        projectId: id,
        fileId,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}