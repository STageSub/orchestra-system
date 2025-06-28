import { prisma } from '@/lib/prisma'

export async function generateRequestToken(requestId: number, responseTimeHours: number): Promise<string> {
  // Token expires exactly when response time runs out
  const expiresAt = new Date()
  expiresAt.setTime(expiresAt.getTime() + (responseTimeHours * 60 * 60 * 1000))

  const token = await prisma.requestToken.create({
    data: {
      requestId,
      expiresAt
    }
  })

  return token.token
}

export async function validateToken(token: string) {
  const requestToken = await prisma.requestToken.findUnique({
    where: { token },
    include: {
      request: {
        include: {
          musician: true,
          projectNeed: {
            include: {
              project: true,
              position: {
                include: {
                  instrument: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!requestToken) {
    return { valid: false, error: 'Token finns inte' } as const
  }

  if (requestToken.usedAt) {
    return { valid: false, error: 'Token har redan använts' } as const
  }

  if (new Date() > requestToken.expiresAt) {
    return { valid: false, error: 'Token har gått ut' } as const
  }

  if (requestToken.request.status !== 'pending') {
    return { valid: false, error: 'Förfrågan är redan besvarad' } as const
  }

  return { valid: true, data: requestToken } as const
}

export async function markTokenAsUsed(token: string) {
  await prisma.requestToken.update({
    where: { token },
    data: { usedAt: new Date() }
  })
}

export async function getOrCreateTokenForRequest(requestId: number): Promise<string> {
  // Check if there's an existing valid token
  const existingToken = await prisma.requestToken.findFirst({
    where: {
      requestId,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  })

  if (existingToken) {
    return existingToken.token
  }

  // Get response time hours for this request
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      projectNeed: true
    }
  })

  if (!request) {
    throw new Error('Request not found')
  }

  // Create new token with correct expiry time
  return generateRequestToken(requestId, request.projectNeed.responseTimeHours)
}