import { NextRequest, NextResponse } from 'next/server'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { hashPassword } from '@/lib/auth-db'

// This is a one-time setup endpoint to create users in production
// It should be removed after initial setup
export async function POST(request: NextRequest) {
  try {
    // Simple security check - require a setup key
    const { setupKey } = await request.json()
    
    if (setupKey !== 'setup-orchestra-2025') {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }
    
    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as string[],
      orchestras: [] as any[]
    }
    
    // First, check what orchestras exist
    try {
      const orchestras = await neonPrisma.orchestra.findMany()
      results.orchestras = orchestras.map(o => ({
        id: o.id,
        name: o.name,
        subdomain: o.subdomain
      }))
    } catch (error) {
      results.errors.push('Could not fetch orchestras')
    }
    
    // Define users to create
    const users = [
      {
        username: 'superadmin',
        email: 'superadmin@stagesub.com',
        password: 'superadmin123',
        role: 'superadmin' as const,
        orchestraId: null
      },
      {
        username: 'sco-admin',
        email: 'admin@sco.stagesub.com',
        password: 'sco-admin123',
        role: 'admin' as const,
        orchestraId: results.orchestras.find(o => o.subdomain === 'sco')?.id || null
      },
      {
        username: 'scosco-admin',
        email: 'admin@scosco.stagesub.com',
        password: 'scosco-admin123',
        role: 'admin' as const,
        orchestraId: results.orchestras.find(o => o.subdomain === 'scosco')?.id || null
      }
    ]
    
    // Create or update each user
    for (const userData of users) {
      try {
        const existingUser = await neonPrisma.user.findUnique({
          where: { username: userData.username }
        })
        
        const passwordHash = await hashPassword(userData.password)
        
        if (existingUser) {
          await neonPrisma.user.update({
            where: { username: userData.username },
            data: {
              passwordHash,
              email: userData.email,
              active: true,
              role: userData.role
            }
          })
          results.updated.push(userData.username)
        } else {
          await neonPrisma.user.create({
            data: {
              username: userData.username,
              email: userData.email,
              passwordHash,
              role: userData.role,
              orchestraId: userData.orchestraId,
              active: true
            }
          })
          results.created.push(userData.username)
        }
      } catch (error) {
        results.errors.push(`Failed to process ${userData.username}: ${error}`)
      }
    }
    
    // Get final user count
    const finalCount = await neonPrisma.user.count()
    
    return NextResponse.json({
      success: true,
      results,
      finalUserCount: finalCount,
      message: 'User setup complete. This endpoint should now be removed for security.'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await neonPrisma.$disconnect()
  }
}