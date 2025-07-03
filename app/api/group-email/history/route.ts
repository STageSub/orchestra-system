import { NextResponse } from 'next/server'
import { getPrismaForUser } from '@/lib/auth-prisma'

export async function GET(request: Request) {
  try {
    const prisma = await getPrismaForUser(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    const where = projectId ? { projectId: parseInt(projectId) } : {}
    
    const logs = await prisma.groupEmailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            weekNumber: true
          }
        }
      }
    })

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching group email logs:', error)
    
    // Check if it's a table not found error
    if (error.code === 'P2021' || error.message?.includes('GroupEmailLog')) {
      return NextResponse.json(
        { 
          error: 'E-posthistorik-tabellen finns inte. Kör SQL-migrationen i Supabase.',
          details: 'Se filen: /prisma/migrations/manual_add_group_email_log.sql',
          code: 'TABLE_NOT_FOUND'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Kunde inte hämta e-posthistorik' },
      { status: 500 }
    )
  }
}