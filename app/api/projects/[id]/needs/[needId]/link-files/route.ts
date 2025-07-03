import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id, needId } = await context.params
    const projectId = parseInt(id)
    const projectNeedId = parseInt(needId)
    
    const body = await request.json()
    const { files } = body
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Files array is required' },
        { status: 400 }
      )
    }
    
    // Skapa nya ProjectFile-poster för varje fil
    const createdFiles = []
    
    for (const file of files) {
      const projectFileId = await generateUniqueId('projectFile', prisma)
      
      const newFile = await prisma.projectFile.create({
        data: {
          projectFileId,
          projectId,
          projectNeedId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileType: 'sheet_music',
          sendTiming: file.sendTiming || 'on_accept'
        }
      })
      
      createdFiles.push(newFile)
    }
    
    return NextResponse.json({ 
      success: true, 
      filesLinked: createdFiles.length 
    })
  } catch (error) {
    console.error('Error linking files:', error)
    return NextResponse.json(
      { error: 'Failed to link files' },
      { status: 500 }
    )
  }
}