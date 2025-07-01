import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-node'
import { prismaMultitenant } from '@/lib/prisma-multitenant'
import { generateUniqueId } from '@/lib/id-generator'
import { getCurrentTenant } from '@/lib/tenant-context'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenant()
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    const lines = text.trim().split('\n')
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'Filen måste innehålla minst en rubrikrad och en datarad' 
      }, { status: 400 })
    }

    // Parse CSV (simple implementation - could be enhanced with a CSV library)
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    
    // Map Swedish column names to field names
    const columnMap: Record<string, string> = {
      'förnamn': 'firstName',
      'fornamn': 'firstName',
      'firstname': 'firstName',
      'efternamn': 'lastName',
      'lastname': 'lastName',
      'email': 'email',
      'e-post': 'email',
      'epost': 'email',
      'telefon': 'phone',
      'phone': 'phone',
      'instrument': 'instrument',
      'position': 'position',
      'tjänst': 'position',
      'aktiv': 'isActive',
      'active': 'isActive',
      'lokalt_boende': 'hasLocalResidence',
      'lokalt boende': 'hasLocalResidence',
      'anteckningar': 'notes',
      'notes': 'notes',
      'språk': 'preferredLanguage',
      'language': 'preferredLanguage'
    }

    // Get all instruments and positions for validation
    const instruments = await prismaMultitenant.instrument.findMany({
      where: { tenantId },
      include: { positions: true }
    })

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const musicianData: any = {}

        // Map values to fields
        headers.forEach((header, index) => {
          const fieldName = columnMap[header]
          if (fieldName && values[index]) {
            if (fieldName === 'isActive' || fieldName === 'hasLocalResidence') {
              // Handle boolean values
              const value = values[index].toLowerCase()
              musicianData[fieldName] = value === 'ja' || value === 'yes' || value === 'true' || value === '1'
            } else {
              musicianData[fieldName] = values[index]
            }
          }
        })

        // Validate required fields
        if (!musicianData.firstName || !musicianData.lastName) {
          results.errors.push({
            row: i + 1,
            error: 'Förnamn och efternamn krävs'
          })
          results.failed++
          continue
        }

        // Check for duplicate email
        if (musicianData.email) {
          const existing = await prismaMultitenant.musician.findFirst({
            where: {
              email: musicianData.email,
              tenantId
            }
          })
          
          if (existing) {
            results.errors.push({
              row: i + 1,
              error: `E-post ${musicianData.email} finns redan`
            })
            results.failed++
            continue
          }
        }

        // Create musician
        const musician = await prismaMultitenant.musician.create({
          data: {
            id: generateUniqueId('musician'),
            firstName: musicianData.firstName,
            lastName: musicianData.lastName,
            email: musicianData.email || '',
            phone: musicianData.phone || '',
            isActive: musicianData.isActive !== false,
            hasLocalResidence: musicianData.hasLocalResidence || false,
            notes: musicianData.notes || '',
            preferredLanguage: musicianData.preferredLanguage || 'sv',
            tenantId
          }
        })

        // Add qualifications if instrument/position provided
        if (musicianData.instrument) {
          const instrument = instruments.find(i => 
            i.name.toLowerCase() === musicianData.instrument.toLowerCase()
          )
          
          if (instrument) {
            let positionId = null
            
            if (musicianData.position) {
              const position = instrument.positions.find(p => 
                p.name.toLowerCase() === musicianData.position.toLowerCase()
              )
              if (position) {
                positionId = position.id
              }
            }

            // Use first position if no specific position provided
            if (!positionId && instrument.positions.length > 0) {
              positionId = instrument.positions[0].id
            }

            if (positionId) {
              await prismaMultitenant.qualification.create({
                data: {
                  id: generateUniqueId('qualification'),
                  musicianId: musician.id,
                  instrumentId: instrument.id,
                  positionId,
                  isPrimary: true,
                  tenantId
                }
              })
            }
          }
        }

        results.success++
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        results.errors.push({
          row: i + 1,
          error: 'Ett fel uppstod vid import av denna rad'
        })
        results.failed++
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import misslyckades' },
      { status: 500 }
    )
  }
}