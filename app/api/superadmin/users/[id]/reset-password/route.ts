import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAuth } from '@/lib/auth-superadmin'
import { neonPrisma } from '@/lib/prisma-dynamic'
import bcrypt from 'bcryptjs'

// Generate secure password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkSuperadminAuth()
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Generate new password
    const newPassword = generatePassword()
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    // Update user password
    const user = await neonPrisma.user.update({
      where: { id },
      data: { 
        passwordHash,
        // Reset lastLogin to force user to login with new password
        lastLogin: null
      }
    })
    
    console.log(`Password reset for user: ${user.username}`)
    
    return NextResponse.json({
      success: true,
      password: newPassword,
      username: user.username
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Användare hittades inte' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Kunde inte återställa lösenord' },
      { status: 500 }
    )
  }
}