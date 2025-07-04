import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, metadata } = body

    // Create test log based on type
    switch (type) {
      case 'email':
        await apiLogger.info(request, 'email', `Skickade e-post till ${metadata.recipientCount} mottagare`, {
          metadata
        })
        break
      
      case 'request':
        await apiLogger.info(request, 'request', `Musiker ${metadata.status === 'accepted' ? 'accepterade' : 'avböjde'} förfrågan`, {
          metadata
        })
        break
      
      case 'error':
        await apiLogger.error(request, 'error', `Fel vid förfrågan: ${metadata.error}`, {
          metadata
        })
        break
      
      default:
        await apiLogger.info(request, 'test', 'Test log entry', { metadata })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating test log:', error)
    return NextResponse.json(
      { error: 'Failed to create test log' },
      { status: 500 }
    )
  }
}