import { NextRequest, NextResponse } from 'next/server'
import { runOrchestraPreflightChecks } from '@/lib/orchestra-preflight'

/**
 * Pre-create validation endpoint
 * Kör alla kontroller INNAN orkestern skapas
 */
export async function POST(request: NextRequest) {
  try {
    const { name, subdomain, contactEmail } = await request.json()
    
    // Grundläggande validering
    if (!subdomain) {
      return NextResponse.json(
        { 
          canCreate: false,
          error: 'Subdomän krävs' 
        },
        { status: 400 }
      )
    }
    
    // Kör omfattande pre-flight kontroller
    const result = await runOrchestraPreflightChecks(
      subdomain,
      name || '',
      contactEmail || ''
    )
    
    // Returnera strukturerat resultat
    return NextResponse.json({
      canCreate: result.canCreate,
      issues: result.issues,
      suggestions: result.suggestions,
      summary: {
        errors: result.issues.filter(i => i.type === 'error').length,
        warnings: result.issues.filter(i => i.type === 'warning').length
      }
    })
    
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { 
        canCreate: false,
        error: 'Valideringsfel',
        details: error instanceof Error ? error.message : 'Okänt fel'
      },
      { status: 500 }
    )
  }
}