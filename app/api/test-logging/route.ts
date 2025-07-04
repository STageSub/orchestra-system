import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Test logging with apiLogger
    console.log('[test-logging] Starting test...')
    
    await apiLogger.info(request, 'system', 'Test logging endpoint called', {
      metadata: {
        timestamp: new Date().toISOString(),
        test: true,
        source: 'test-logging-endpoint'
      }
    })
    
    console.log('[test-logging] Log should have been written')
    
    // Also test other log levels
    await apiLogger.warn(request, 'system', 'Test warning log', {
      metadata: { test: true }
    })
    
    await apiLogger.debug(request, 'system', 'Test debug log', {
      metadata: { test: true }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test logs created - check the logs page',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[test-logging] Error:', error)
    
    await apiLogger.error(request, 'system', `Test logging failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Test logging failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}