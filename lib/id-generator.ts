import { prisma } from './prisma'

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
 * Genererar ett unikt ID som aldrig återanvänds
 * Använder databas-sekvenser för att garantera unika ID:n
 */
export async function generateUniqueId(entityType: EntityType): Promise<string> {
  // Använd transaktion för att säkerställa atomicitet
  const result = await prisma.$transaction(async (tx) => {
    // Hämta och uppdatera sekvensen i samma operation
    const sequence = await tx.idSequence.update({
      where: { entityType },
      data: {
        lastNumber: {
          increment: 1
        }
      }
    })
    
    return sequence.lastNumber
  })
  
  const prefix = ID_PREFIXES[entityType]
  const paddedNumber = result.toString().padStart(3, '0')
  
  return `${prefix}${paddedNumber}`
}

/**
 * Hämtar nästa ID utan att öka sekvensen (för preview)
 */
export async function peekNextId(entityType: EntityType): Promise<string> {
  const sequence = await prisma.idSequence.findUnique({
    where: { entityType }
  })
  
  if (!sequence) {
    throw new Error(`ID sequence for ${entityType} not found`)
  }
  
  const prefix = ID_PREFIXES[entityType]
  const nextNumber = sequence.lastNumber + 1
  const paddedNumber = nextNumber.toString().padStart(3, '0')
  
  return `${prefix}${paddedNumber}`
}

/**
 * Kontrollera om ett ID redan används (för validering)
 */
export async function isIdUsed(entityType: EntityType, id: string): Promise<boolean> {
  switch (entityType) {
    case 'musician':
      const musician = await prisma.musician.findUnique({
        where: { musicianId: id }
      })
      return !!musician
      
    case 'project':
      const project = await prisma.project.findUnique({
        where: { projectId: id }
      })
      return !!project
      
    case 'request':
      const request = await prisma.request.findUnique({
        where: { requestId: id }
      })
      return !!request
      
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}