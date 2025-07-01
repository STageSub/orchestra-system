import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { generateUniqueId } from '@/lib/id-generator'

export async function GET() {
  try {
    const templates = await prismaMultitenant.emailTemplate.findMany({
      orderBy: { type: 'asc' }
    })
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, subject, body: templateBody, variables } = body
    
    // Check if template type already exists
    const existing = await prismaMultitenant.emailTemplate.findUnique({
      where: { type }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Template type already exists' },
        { status: 400 }
      )
    }
    
    // Generate unique template ID
    const emailTemplateId = await generateUniqueId('emailTemplate')
    
    const template = await prismaMultitenant.emailTemplate.create({
      data: {
        emailTemplateId,
        type,
        subject,
        body: templateBody,
        variables: variables || []
      }
    })
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}