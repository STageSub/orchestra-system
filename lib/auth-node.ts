import bcrypt from 'bcryptjs'
import { prismaMultitenant } from './prisma-multitenant'
import { createToken } from './auth-edge'

// Multi-tenant auth functions
export async function authenticateUser(email: string, password: string, tenantId?: string) {
  try {
    // Find user by email
    const user = await prismaMultitenant.user.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!user || !user.password) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Verify tenant if provided (optional check for flexible auth)
    if (tenantId && user.tenantId && user.tenantId !== tenantId) {
      return { success: false, error: 'User not found in this organization' }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Update last login
    await prismaMultitenant.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create token
    const token = await createToken(user.id, user.tenantId || '', user.role)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}