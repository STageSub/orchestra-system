import { NextRequest, NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'
import { generateUniqueId } from '@/lib/id-generator'
import { saveFile, generateFileName, isValidFileType, isValidFileSize } from '@/lib/file-handler-db'
import { apiLogger } from '@/lib/logger'

// Increase body size limit for file uploads
export const maxDuration = 60 // 60 seconds timeout

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    
    // Log file fetch start
    await apiLogger.info(request, 'api', 'Fetching project files', {
      metadata: {
        action: 'list_project_files',
        projectId: id
      }
    })
    
    const files = await prisma.projectFile.findMany({
      where: { projectId: parseInt(id) },
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
      },
      orderBy: { uploadedAt: 'desc' }
    })
    
    // Log successful fetch
    await apiLogger.info(request, 'api', 'Project files fetched successfully', {
      metadata: {
        action: 'list_project_files',
        projectId: id,
        filesCount: files.length
      }
    })
    
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching project files:', error)
    
    // Log error
    await apiLogger.error(request, 'api', `Failed to fetch project files: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        action: 'list_project_files',
        projectId: id,
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch project files' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrismaForUser(request)
    const { id } = await context.params
    const projectId = parseInt(id)
    
    console.log('Starting file upload for project:', projectId)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Content-Type:', request.headers.get('content-type'))
    console.log('Content-Length:', request.headers.get('content-length'))
    
    // Try to get the raw body first for debugging
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType)
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }
    
    let formData: FormData
    try {
      // Use the native FormData parsing
      formData = await request.formData()
    } catch (parseError) {
      console.error('FormData parse error:', parseError)
      console.error('Error stack:', parseError instanceof Error ? parseError.stack : 'No stack')
      
      // Try alternative parsing method
      try {
        // Clone the request to try again
        const clonedRequest = request.clone()
        const body = await clonedRequest.text()
        console.error('Raw body preview (first 200 chars):', body.substring(0, 200))
      } catch (bodyError) {
        console.error('Could not read body:', bodyError)
      }
      
      return NextResponse.json(
        { error: 'Invalid form data', details: parseError instanceof Error ? parseError.message : 'Unknown parse error' },
        { status: 400 }
      )
    }
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const fileType = formData.get('fileType') as string
    const projectNeedId = formData.get('projectNeedId') as string | null
    const sendTiming = formData.get('sendTiming') as string
    
    console.log('Form data received:', {
      fileName,
      fileType,
      projectNeedId,
      sendTiming,
      hasFile: !!file,
      fileSize: file?.size,
      fileMimeType: file?.type,
      fileClass: file?.constructor?.name
    })
    
    if (!file || !fileName || !fileType) {
      console.error('Missing required fields')
      return NextResponse.json(
        { error: 'Fil, filnamn och filtyp krävs' },
        { status: 400 }
      )
    }
    
    // Validera filtyp
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: 'Otillåten filtyp. Tillåtna format: PDF, bilder, Word, text, MusicXML' },
        { status: 400 }
      )
    }
    
    // Validera filstorlek
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { error: 'Filen är för stor. Max 10MB tillåtet.' },
        { status: 400 }
      )
    }
    
    // Konvertera fil till buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generera unikt filnamn och spara
    const generatedFileName = generateFileName(
      file.name,
      projectId,
      projectNeedId ? parseInt(projectNeedId) : undefined
    )
    
    const fileUrl = await saveFile(
      buffer, 
      generatedFileName,
      file.name,
      file.type || 'application/octet-stream',
      projectId,
      projectNeedId ? parseInt(projectNeedId) : undefined
    )
    
    // Generera unikt ID
    const projectFileId = await generateUniqueId('projectFile', prisma)
    
    // Spara i databasen
    const projectFile = await prisma.projectFile.create({
      data: {
        projectFileId,
        projectId,
        fileName,
        originalFileName: file.name,
        mimeType: file.type || 'application/octet-stream',
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