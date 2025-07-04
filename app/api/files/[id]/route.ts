import { NextRequest, NextResponse } from 'next/server'
import { getFile } from '@/lib/file-handler-db'
import { apiLogger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const file = await getFile(id)
    
    if (!file) {
      await apiLogger.warn(request, 'api', 'File not found', {
        metadata: {
          fileId: id
        }
      })
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Log file access
    await apiLogger.info(request, 'api', 'File accessed', {
      metadata: {
        fileId: id,
        fileName: file.originalName,
        mimeType: file.mimeType,
        size: file.content.length
      }
    })
    
    // Return the file with proper headers
    return new NextResponse(file.content, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error serving file:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to serve file: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        fileId: (await params).id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}