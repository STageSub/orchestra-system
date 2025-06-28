import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; needId: string }> }
) {
  try {
    const { needId } = await context.params
    
    const files = await prisma.projectFile.findMany({
      where: { projectNeedId: parseInt(needId) },
      orderBy: { uploadedAt: 'desc' }
    })
    
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching need files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch need files' },
      { status: 500 }
    )
  }
}