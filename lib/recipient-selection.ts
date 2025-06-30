import { prisma } from '@/lib/prisma'
import { generateRequestToken } from '@/lib/request-tokens'
import { sendRequestEmail } from '@/lib/email'
import { generateUniqueId } from '@/lib/id-generator'

// Types for the unified function
export interface RecipientInfo {
  id: number
  name: string
  email: string
  rank: number
  firstName?: string
  lastName?: string
  // Nya fält för att visa varför musiker hoppas över
  isExcluded?: boolean
  excludeReason?: 'already_contacted' | 'has_pending' | 'has_accepted' | 'has_declined' | 'timed_out' | 'no_local_residence' | 'inactive' | 'will_receive_request'
  existingPosition?: string // t.ex. "Violin 1 - Förste konsertmästare"
  existingStatus?: string // 'pending', 'accepted', 'declined', 'timed_out'
}

export interface NeedRecipientResult {
  needId: number
  position: string
  quantity: number
  currentStatus: {
    accepted: number
    pending: number
    remaining: number
  }
  strategy: 'sequential' | 'parallel' | 'first_come'
  maxRecipients: number | null
  listType?: string // NY: Vilken lista (A, B, C)
  rankingListId?: number // NY: ID för rankningslistan
  musiciansToContact: RecipientInfo[]
  nextInQueue: RecipientInfo[]
  allMusiciansWithStatus?: RecipientInfo[] // NY: Alla musiker med status
  totalAvailable: number
  canSend: boolean
}

export interface RecipientResult {
  needs: NeedRecipientResult[]
  totalToSend: number
  canSend: boolean
  conflicts?: ConflictInfo[]
}

export interface ConflictInfo {
  musicianId: number
  musicianName: string
  positions: Array<{
    needId: number
    positionName: string
    instrumentName: string
    hierarchyLevel: number
    ranking: number
    listType: string
  }>
  chosenPosition?: {
    needId: number
    positionName: string
  }
}

interface GetRecipientsOptions {
  dryRun?: boolean // true for preview, false for actual sending
  includeDetails?: boolean // include extra info for preview display
}

interface MusicianConflictInfo {
  musicianId: number
  positions: Array<{
    needId: number
    positionId: number
    positionName: string
    instrumentName: string
    hierarchyLevel: number
    ranking: number
    listType: string
  }>
}

// Helper function to analyze conflicts across all needs
async function analyzeConflictsForProject(
  projectId: number, 
  includeDetails: boolean = false
): Promise<Map<number, MusicianConflictInfo>> {
  const projectNeeds = await prisma.projectNeed.findMany({
    where: { 
      projectId,
      status: { not: 'paused' }
    },
    include: {
      position: {
        include: {
          instrument: true
        }
      },
      rankingList: {
        include: {
          rankings: {
            include: {
              musician: true
            }
          }
        }
      }
    }
  })

  const musicianConflicts = new Map<number, MusicianConflictInfo>()

  projectNeeds.forEach(need => {
    if (need.rankingList?.rankings) {
      need.rankingList.rankings.forEach(ranking => {
        const musicianId = ranking.musicianId
        
        if (!musicianConflicts.has(musicianId)) {
          musicianConflicts.set(musicianId, {
            musicianId,
            positions: []
          })
        }
        
        musicianConflicts.get(musicianId)!.positions.push({
          needId: need.id,
          positionId: need.position.id,
          positionName: need.position.name,
          instrumentName: need.position.instrument.name,
          hierarchyLevel: need.position.hierarchyLevel,
          ranking: ranking.rank,
          listType: need.rankingList.listType
        })
      })
    }
  })

  // Return only musicians with conflicts
  const conflictsOnly = new Map<number, MusicianConflictInfo>()
  musicianConflicts.forEach((info, musicianId) => {
    if (info.positions.length > 1) {
      conflictsOnly.set(musicianId, info)
    }
  })

  return conflictsOnly
}

// Get ALL musicians including excluded ones with explanations
async function getAllMusiciansWithStatus(
  need: any,
  projectId: number,
  plannedRequests?: Map<number, { needId: number; position: string }>
): Promise<RecipientInfo[]> {
  if (!need.rankingList?.rankings) {
    return []
  }

  // Get all existing requests for this project
  const projectRequests = await prisma.request.findMany({
    where: {
      projectNeed: {
        projectId: projectId
      }
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

  // Create a map for quick lookup
  const requestsByMusicianId = new Map()
  projectRequests.forEach(req => {
    requestsByMusicianId.set(req.musicianId, req)
  })

  // Map all musicians with their status
  return need.rankingList.rankings.map((r: any) => {
    const existingRequest = requestsByMusicianId.get(r.musicianId)
    const plannedRequest = plannedRequests?.get(r.musicianId)
    const baseInfo: RecipientInfo = {
      id: r.musician.id,
      name: `${r.musician.firstName} ${r.musician.lastName}`,
      email: r.musician.email,
      rank: r.rank,
      firstName: r.musician.firstName,
      lastName: r.musician.lastName
    }

    // Check if musician will receive request in this batch
    if (plannedRequest && plannedRequest.needId !== need.id) {
      return {
        ...baseInfo,
        isExcluded: true,
        excludeReason: 'will_receive_request',
        existingPosition: plannedRequest.position,
        existingStatus: 'pending'
      }
    }

    if (existingRequest) {
      let excludeReason: RecipientInfo['excludeReason']
      switch (existingRequest.status) {
        case 'pending':
          excludeReason = 'has_pending'
          break
        case 'accepted':
          excludeReason = 'has_accepted'
          break
        case 'declined':
          excludeReason = 'has_declined'
          break
        case 'timed_out':
          excludeReason = 'timed_out'
          break
        default:
          excludeReason = 'already_contacted'
      }

      return {
        ...baseInfo,
        isExcluded: true,
        excludeReason,
        existingPosition: `${existingRequest.projectNeed.position.instrument.name} - ${existingRequest.projectNeed.position.name}`,
        existingStatus: existingRequest.status
      }
    }

    // Check other filters
    if (need.requireLocalResidence && !r.musician.localResidence) {
      return {
        ...baseInfo,
        isExcluded: true,
        excludeReason: 'no_local_residence'
      }
    }

    if (!r.musician.isActive) {
      return {
        ...baseInfo,
        isExcluded: true,
        excludeReason: 'inactive'
      }
    }

    return baseInfo
  })
}

// Get available musicians for a specific need, applying all filters
async function getAvailableMusiciansForNeed(
  need: any,
  excludedMusicianIds: Set<number>,
  conflicts: Map<number, MusicianConflictInfo>,
  conflictStrategy: string
): Promise<RecipientInfo[]> {
  // Start with musicians from ranking list
  if (!need.rankingList?.rankings) {
    return []
  }

  let availableMusicians = need.rankingList.rankings
    .filter((r: any) => {
      // Filter out already contacted musicians (project-wide)
      if (excludedMusicianIds.has(r.musicianId)) {
        return false
      }

      // Apply local residence filter if required
      if (need.requireLocalResidence && !r.musician.localResidence) {
        return false
      }

      // Ensure musician is active
      if (!r.musician.isActive) {
        return false
      }

      return true
    })
    .map((r: any) => ({
      id: r.musician.id,
      name: `${r.musician.firstName} ${r.musician.lastName}`,
      email: r.musician.email,
      rank: r.rank,
      firstName: r.musician.firstName,
      lastName: r.musician.lastName
    }))

  // Apply smart conflict filtering if enabled
  if (conflictStrategy === 'smart') {
    availableMusicians = availableMusicians.filter((musician: RecipientInfo) => {
      if (conflicts.has(musician.id)) {
        const conflict = conflicts.get(musician.id)!
        // Find best position (lowest ranking = best)
        const bestPosition = conflict.positions.reduce((best, pos) => {
          if (pos.ranking < best.ranking) return pos
          if (pos.ranking === best.ranking && pos.hierarchyLevel < best.hierarchyLevel) return pos
          return best
        })
        // Only include if this is their best position
        return bestPosition.needId === need.id
      }
      return true
    })
  }

  return availableMusicians
}

// Determine how many musicians to contact based on strategy
function calculateMusiciansToContact(
  need: any,
  availableMusicians: RecipientInfo[],
  acceptedCount: number,
  pendingCount: number
): RecipientInfo[] {
  const remainingNeeded = Math.max(0, need.quantity - acceptedCount)

  switch (need.requestStrategy) {
    case 'sequential':
      // Sequential: one at a time, only if no pending
      if (pendingCount === 0 && remainingNeeded > 0) {
        return availableMusicians.slice(0, 1)
      }
      break

    case 'parallel':
      // Parallel: as many as needed to maintain active requests equal to quantity
      const neededActive = need.quantity - acceptedCount
      const currentActive = pendingCount
      const toSend = neededActive - currentActive
      if (toSend > 0) {
        return availableMusicians.slice(0, toSend)
      }
      break

    case 'first_come':
      // First come: up to maxRecipients at once, or ALL if not specified
      if (pendingCount === 0 && remainingNeeded > 0) {
        if (need.maxRecipients && need.maxRecipients > 0) {
          return availableMusicians.slice(0, Math.min(need.maxRecipients, availableMusicians.length))
        } else {
          // When maxRecipients is null/empty, send to ALL available musicians
          return availableMusicians
        }
      }
      break
  }

  return []
}

// Main function to get recipients for a single need
export async function getRecipientsForNeed(
  needId: number,
  options: GetRecipientsOptions = {}
): Promise<RecipientResult> {
  const { dryRun = true, includeDetails = false } = options

  // Get the need with all required data
  const need = await prisma.projectNeed.findUnique({
    where: { id: needId },
    include: {
      position: {
        include: {
          instrument: true
        }
      },
      rankingList: {
        include: {
          rankings: {
            include: {
              musician: true
            },
            orderBy: {
              rank: 'asc'
            }
          }
        }
      },
      requests: {
        include: {
          musician: true
        }
      }
    }
  })

  if (!need) {
    throw new Error('Need not found')
  }

  // Get conflict handling strategy
  const conflictStrategySetting = await prisma.settings.findUnique({
    where: { key: 'ranking_conflict_strategy' }
  })
  const conflictStrategy = conflictStrategySetting?.value || 'simple'

  // Calculate current status
  const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
  const pendingCount = need.requests.filter(r => r.status === 'pending').length
  const remainingNeeded = Math.max(0, need.quantity - acceptedCount)

  // Get all musicians already contacted for this project
  const projectRequests = await prisma.request.findMany({
    where: {
      projectNeed: {
        projectId: need.projectId
      },
      status: {
        in: ['pending', 'accepted', 'declined', 'timed_out']
      }
    },
    select: {
      musicianId: true,
      status: true
    }
  })
  
  const excludedMusicianIds = new Set(projectRequests.map(r => r.musicianId))

  // Analyze conflicts if needed
  const conflicts = await analyzeConflictsForProject(need.projectId, includeDetails)

  // Get available musicians
  const availableMusicians = await getAvailableMusiciansForNeed(
    need,
    excludedMusicianIds,
    conflicts,
    conflictStrategy
  )

  // Calculate who to contact
  const musiciansToContact = calculateMusiciansToContact(
    need,
    availableMusicians,
    acceptedCount,
    pendingCount
  )

  // Get next in queue
  const nextInQueue = availableMusicians
    .filter(m => !musiciansToContact.some(mtc => mtc.id === m.id))
    .slice(0, 5) // Show next 5

  // Get all musicians with status if requested
  let allMusiciansWithStatus: RecipientInfo[] | undefined
  if (includeDetails) {
    allMusiciansWithStatus = await getAllMusiciansWithStatus(need, need.projectId)
  }

  // Prepare the need result
  const needResult: NeedRecipientResult = {
    needId: need.id,
    position: `${need.position.instrument.name} - ${need.position.name}`,
    quantity: need.quantity,
    currentStatus: {
      accepted: acceptedCount,
      pending: pendingCount,
      remaining: remainingNeeded
    },
    strategy: need.requestStrategy as 'sequential' | 'parallel' | 'first_come',
    maxRecipients: need.maxRecipients,
    listType: need.rankingList?.listType, // Lägg till vilken lista
    rankingListId: need.rankingList?.id, // Lägg till ranking list ID
    musiciansToContact,
    nextInQueue,
    allMusiciansWithStatus,
    totalAvailable: availableMusicians.length,
    canSend: musiciansToContact.length > 0
  }

  // If not dry run, actually send the requests
  if (!dryRun && musiciansToContact.length > 0) {
    const results = await Promise.allSettled(
      musiciansToContact.map(musician => 
        createAndSendRequest(need.id, musician.id)
      )
    )

    // Log results
    results.forEach((result, index) => {
      const musician = musiciansToContact[index]
      if (result.status === 'fulfilled' && result.value === true) {
        console.log(`✅ Successfully sent request to ${musician.name}`)
      } else {
        console.log(`❌ Failed to send request to ${musician.name}`)
      }
    })
  }

  // Prepare conflict info if requested
  let conflictInfo: ConflictInfo[] | undefined
  if (includeDetails && conflicts.size > 0) {
    conflictInfo = Array.from(conflicts.entries())
      .filter(([musicianId]) => {
        // Only include conflicts for musicians that might be contacted
        return availableMusicians.some(m => m.id === musicianId)
      })
      .map(([musicianId, conflict]) => {
        const musician = availableMusicians.find(m => m.id === musicianId)
        const chosenPosition = conflictStrategy === 'smart' 
          ? conflict.positions.reduce((best, pos) => {
              if (pos.ranking < best.ranking) return pos
              if (pos.ranking === best.ranking && pos.hierarchyLevel < best.hierarchyLevel) return pos
              return best
            })
          : undefined

        return {
          musicianId,
          musicianName: musician?.name || 'Unknown',
          positions: conflict.positions,
          chosenPosition: chosenPosition ? {
            needId: chosenPosition.needId,
            positionName: chosenPosition.positionName
          } : undefined
        }
      })
  }

  return {
    needs: [needResult],
    totalToSend: musiciansToContact.length,
    canSend: musiciansToContact.length > 0,
    conflicts: conflictInfo
  }
}

// Function to get recipients for all needs in a project
export async function getRecipientsForProject(
  projectId: number,
  options: GetRecipientsOptions = {}
): Promise<RecipientResult> {
  const { dryRun = true, includeDetails = false } = options

  // Get project with all active needs
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectNeeds: {
        where: {
          status: { not: 'paused' }
        },
        include: {
          position: {
            include: {
              instrument: true
            }
          },
          rankingList: {
            include: {
              rankings: {
                include: {
                  musician: true
                },
                orderBy: {
                  rank: 'asc'
                }
              }
            }
          },
          requests: {
            include: {
              musician: true
            }
          }
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Sort needs by instrument order and hierarchy
  const sortedNeeds = project.projectNeeds.sort((a, b) => {
    const orderA = a.position.instrument.displayOrder ?? 999
    const orderB = b.position.instrument.displayOrder ?? 999
    
    if (orderA !== orderB) {
      return orderA - orderB
    }
    
    return a.position.hierarchyLevel - b.position.hierarchyLevel
  })

  // Get conflict handling strategy
  const conflictStrategySetting = await prisma.settings.findUnique({
    where: { key: 'ranking_conflict_strategy' }
  })
  const conflictStrategy = conflictStrategySetting?.value || 'simple'

  // Get all musicians already contacted for this project
  const projectRequests = await prisma.request.findMany({
    where: {
      projectNeed: {
        projectId
      },
      status: {
        in: ['pending', 'accepted', 'declined', 'timed_out']
      }
    },
    select: {
      musicianId: true,
      status: true
    }
  })
  
  const excludedMusicianIds = new Set(projectRequests.map(r => r.musicianId))

  // Analyze conflicts across all needs
  const conflicts = await analyzeConflictsForProject(projectId, includeDetails)

  const needResults: NeedRecipientResult[] = []
  let totalToSend = 0
  const plannedRequests = new Map<number, { needId: number; position: string }>()

  // Process each need
  for (const need of sortedNeeds) {
    // Calculate current status
    const acceptedCount = need.requests.filter(r => r.status === 'accepted').length
    const pendingCount = need.requests.filter(r => r.status === 'pending').length
    const totalActive = acceptedCount + pendingCount
    const remainingNeeded = Math.max(0, need.quantity - acceptedCount)

    // Skip if already fully staffed
    if (totalActive >= need.quantity) continue

    // Get available musicians for this need
    const availableMusicians = await getAvailableMusiciansForNeed(
      need,
      excludedMusicianIds,
      conflicts,
      conflictStrategy
    )

    // Calculate who to contact
    const musiciansToContact = calculateMusiciansToContact(
      need,
      availableMusicians,
      acceptedCount,
      pendingCount
    )

    if (musiciansToContact.length > 0) {
      // Get next in queue
      const nextInQueue = availableMusicians
        .filter(m => !musiciansToContact.some(mtc => mtc.id === m.id))
        .slice(0, 5) // Show next 5

      // Get all musicians with status if requested
      let allMusiciansWithStatus: RecipientInfo[] | undefined
      if (includeDetails) {
        allMusiciansWithStatus = await getAllMusiciansWithStatus(need, projectId, plannedRequests)
      }

      needResults.push({
        needId: need.id,
        position: `${need.position.instrument.name} - ${need.position.name}`,
        quantity: need.quantity,
        currentStatus: {
          accepted: acceptedCount,
          pending: pendingCount,
          remaining: remainingNeeded
        },
        strategy: need.requestStrategy as 'sequential' | 'parallel' | 'first_come',
        maxRecipients: need.maxRecipients,
        listType: need.rankingList?.listType, // Lägg till vilken lista
        rankingListId: need.rankingList?.id, // Lägg till ranking list ID
        musiciansToContact,
        nextInQueue,
        allMusiciansWithStatus,
        totalAvailable: availableMusicians.length,
        canSend: true
      })

      totalToSend += musiciansToContact.length

      // KRITISKT: Lägg till valda musiker till excluded-listan så de inte väljs igen!
      musiciansToContact.forEach(musician => {
        excludedMusicianIds.add(musician.id)
        // Lägg också till i plannedRequests för att visa i andra behov
        plannedRequests.set(musician.id, {
          needId: need.id,
          position: `${need.position.instrument.name} - ${need.position.name}`
        })
      })

      // If not dry run, actually send the requests
      if (!dryRun) {
        const results = await Promise.allSettled(
          musiciansToContact.map(musician => 
            createAndSendRequest(need.id, musician.id)
          )
        )

        // Log results
        results.forEach((result, index) => {
          const musician = musiciansToContact[index]
          if (result.status === 'fulfilled' && result.value === true) {
            console.log(`✅ Successfully sent request to ${musician.name} for ${need.position.name}`)
          } else {
            console.log(`❌ Failed to send request to ${musician.name} for ${need.position.name}`)
          }
        })
      }
    }
  }

  // Prepare conflict info if requested
  let conflictInfo: ConflictInfo[] | undefined
  if (includeDetails && conflicts.size > 0) {
    const allContactedMusicianIds = new Set(
      needResults.flatMap(need => need.musiciansToContact.map(m => m.id))
    )

    conflictInfo = Array.from(conflicts.entries())
      .filter(([musicianId]) => allContactedMusicianIds.has(musicianId))
      .map(([musicianId, conflict]) => {
        const musicianName = needResults
          .flatMap(n => n.musiciansToContact)
          .find(m => m.id === musicianId)?.name || 'Unknown'

        const chosenPosition = conflictStrategy === 'smart' 
          ? conflict.positions.reduce((best, pos) => {
              if (pos.ranking < best.ranking) return pos
              if (pos.ranking === best.ranking && pos.hierarchyLevel < best.hierarchyLevel) return pos
              return best
            })
          : undefined

        return {
          musicianId,
          musicianName,
          positions: conflict.positions,
          chosenPosition: chosenPosition ? {
            needId: chosenPosition.needId,
            positionName: chosenPosition.positionName
          } : undefined
        }
      })
  }

  return {
    needs: needResults,
    totalToSend,
    canSend: totalToSend > 0,
    conflicts: conflictInfo
  }
}

// Helper function to create and send a request (reused from request-strategies)
async function createAndSendRequest(projectNeedId: number, musicianId: number): Promise<boolean> {
  try {
    const requestId = await generateUniqueId('request')

    // Create request
    const request = await prisma.request.create({
      data: {
        requestId,
        projectNeedId,
        musicianId,
        status: 'pending',
        sentAt: new Date()
      },
      include: {
        projectNeed: true
      }
    })

    // Generate token
    const token = await generateRequestToken(request.id, request.projectNeed.responseTimeHours)

    // Send email
    await sendRequestEmail(request, token)

    return true
  } catch (error) {
    console.error(`Failed to send request to musician ${musicianId}:`, error)
    return false
  }
}