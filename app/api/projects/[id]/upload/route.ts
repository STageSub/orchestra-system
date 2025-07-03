import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { saveFile, generateFileName, isValidFileType, isValidFileSize } from '@/lib/file-handler-db'

// Alternative approach using JSON with base64 encoding
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    const projectId = parseInt(id)
    
    // Parse JSON body instead of FormData
    const body = await request.json()
    const { file, fileName, fileType, projectNeedId, sendTiming, originalFileName, mimeType } = body
    
    console.log('Upload request received:', {
      projectId,
      fileName,
      fileType,
      projectNeedId,
      sendTiming,
      originalFileName,
      hasFile: !!file
    })
    
    if (!file || !fileName || !fileType || !originalFileName) {
      return NextResponse.json(
        { error: 'Fil, filnamn och filtyp krävs' },
        { status: 400 }
      )
    }
    
    // Validate file type
    if (!isValidFileType(originalFileName)) {
      return NextResponse.json(
        { error: 'Otillåten filtyp. Tillåtna format: PDF, bilder, Word, text, MusicXML' },
        { status: 400 }
      )
    }
    
    // Convert base64 to buffer
    const base64Data = file.replace(/^data:.*,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Validate file size
    if (!isValidFileSize(buffer.length)) {
      return NextResponse.json(
        { error: 'Filen är för stor. Max 10MB tillåtet.' },
        { status: 400 }
      )
    }
    
    // Generate unique filename and save
    const generatedFileName = generateFileName(
      originalFileName,
      projectId,
      projectNeedId ? parseInt(projectNeedId) : undefined
    )
    
    const fileUrl = await saveFile(
      buffer, 
      generatedFileName,
      originalFileName,
      mimeType || fileType || 'application/octet-stream',
      projectId,
      projectNeedId ? parseInt(projectNeedId) : undefined
    )
    
    // Generate unique ID
    const projectFileId = await generateUniqueId('projectFile', prisma)
    
    // Save to database
    const projectFile = await prisma.projectFile.create({
      data: {
        projectFileId,
        projectId,
        fileName,
        originalFileName: originalFileName || fileName, // Save original filename with extension
        mimeType: mimeType || 'application/octet-stream',
        fileUrl,
        fileType,
        projectNeedId: projectNeedId ? parseInt(projectNeedId) : null,
        sendTiming: sendTiming || 'on_request'
      },
      include: {
        projectNeed: {
          include: {
            position: {
              include: {
                instrument: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json(projectFile, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}