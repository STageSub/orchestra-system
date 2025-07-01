import { prismaMultitenant } from './prisma-multitenant'
import { getCurrentTenant } from './tenant-context'
import { connectionManager } from './database-connection-manager'

// ID-prefix för olika entiteter
const ID_PREFIXES = {
  musician: 'MUS',
  project: 'PROJ',
  request: 'REQ',
  instrument: 'INST',
  position: 'POS',
  rankingList: 'RANK',
  ranking: 'RNK',
  projectNeed: 'NEED',
  emailTemplate: 'TMPL',
  communicationLog: 'COMM',
  projectFile: 'FILE',
  auditLog: 'AUDIT'
} as const

type EntityType = keyof typeof ID_PREFIXES

/**
 * Get tenant prefix from subdomain or tenant ID
 */
async function getTenantPrefix(tenantId?: string): Promise<string> {
  const currentTenantId = tenantId || getCurrentTenant()
  
  if (!currentTenantId) {
    throw new Error('No tenant context available')
  }
  
  // Get tenant info
  const tenant = await prismaMultitenant.tenant.findUnique({
    where: { id: currentTenantId },
    select: { subdomain: true }
  })
  
  if (!tenant) {
    throw new Error(`Tenant ${currentTenantId} not found`)
  }
  
  // Use first 3 letters of subdomain as prefix (uppercase)
  const prefix = tenant.subdomain.substring(0, 3).toUpperCase()
  return prefix
}

/**
 * Genererar ett unikt ID som aldrig återanvänds
 * Format: TENANT-PREFIX-NUMBER (e.g., GOT-MUS-001 for Göteborg)
 */
export async function generateUniqueId(entityType: EntityType, tenantId?: string): Promise<string> {
  const currentTenantId = tenantId || getCurrentTenant()
  
  if (!currentTenantId) {
    throw new Error('No tenant context available')
  }
  
  // Get the appropriate database connection
  const prisma = await connectionManager.getConnection(currentTenantId)
  
  // Get tenant prefix
  const tenantPrefix = await getTenantPrefix(currentTenantId)
  
  // Använd transaktion för att säkerställa atomicitet
  const result = await prisma.$transaction(async (tx) => {
    // First, ensure the sequence exists
    const existing = await tx.idSequence.findFirst({
      where: { 
        entityType,
        tenantId: currentTenantId
      }
    })
    
    if (!existing) {
      // Create the sequence if it doesn't exist
      await tx.idSequence.create({
        data: {
          entityType,
          tenantId: currentTenantId,
          lastNumber: 0
        }
      })
    }
    
    // Update and get the new number
    const sequence = await tx.idSequence.update({
      where: { 
        entityType_tenantId: {
          entityType,
          tenantId: currentTenantId
        }
      },
      data: {
        lastNumber: {
          increment: 1
        }
      }
    })
    
    return sequence.lastNumber
  })
  
  const entityPrefix = ID_PREFIXES[entityType]
  const paddedNumber = result.toString().padStart(3, '0')
  
  // Format: TENANT-ENTITY-NUMBER
  return `${tenantPrefix}-${entityPrefix}-${paddedNumber}`
}

/**
 * Hämtar nästa ID utan att öka sekvensen (för preview)
 */
export async function peekNextId(entityType: EntityType, tenantId?: string): Promise<string> {
  const currentTenantId = tenantId || getCurrentTenant()
  
  if (!currentTenantId) {
    throw new Error('No tenant context available')
  }
  
  // Get the appropriate database connection
  const prisma = await connectionManager.getConnection(currentTenantId)
  
  // Get tenant prefix
  const tenantPrefix = await getTenantPrefix(currentTenantId)
  
  const sequence = await prisma.idSequence.findFirst({
    where: { 
      entityType,
      tenantId: currentTenantId
    }
  })
  
  const entityPrefix = ID_PREFIXES[entityType]
  const nextNumber = (sequence?.lastNumber || 0) + 1
  const paddedNumber = nextNumber.toString().padStart(3, '0')
  
  return `${tenantPrefix}-${entityPrefix}-${paddedNumber}`
}

/**
 * Kontrollera om ett ID redan används (för validering)
 */
export async function isIdUsed(entityType: EntityType, id: string, tenantId?: string): Promise<boolean> {
  const currentTenantId = tenantId || getCurrentTenant()
  
  if (!currentTenantId) {
    throw new Error('No tenant context available')
  }
  
  // Get the appropriate database connection
  const prisma = await connectionManager.getConnection(currentTenantId)
  
  switch (entityType) {
    case 'musician':
      const musician = await prisma.musician.findFirst({
        where: { 
          musicianId: id,
          tenantId: currentTenantId
        }
      })
      return !!musician
      
    case 'project':
      const project = await prisma.project.findFirst({
        where: { 
          projectId: id,
          tenantId: currentTenantId
        }
      })
      return !!project
      
    case 'request':
      const request = await prisma.request.findFirst({
        where: { 
          requestId: id
        }
      })
      return !!request
      
    case 'instrument':
      const instrument = await prisma.instrument.findFirst({
        where: { 
          instrumentId: id,
          tenantId: currentTenantId
        }
      })
      return !!instrument
      
    case 'position':
      const position = await prisma.position.findFirst({
        where: { 
          positionId: id,
          tenantId: currentTenantId
        }
      })
      return !!position
      
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

/**
 * Parse tenant-prefixed ID to extract components
 */
export function parseMultitenantId(id: string): { tenantPrefix: string; entityPrefix: string; number: number } | null {
  const parts = id.split('-')
  if (parts.length !== 3) {
    return null
  }
  
  const [tenantPrefix, entityPrefix, numberStr] = parts
  const number = parseInt(numberStr, 10)
  
  if (isNaN(number)) {
    return null
  }
  
  return { tenantPrefix, entityPrefix, number }
}