import { NextResponse } from 'next/server'
import { sendReminders, handleTimeouts } from '@/lib/request-handlers'
import { neonPrisma } from '@/lib/prisma-dynamic'
import { getPrismaClient } from '@/lib/database-config'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('Running reminder and timeout checks for all orchestras...')
    
    // Get all active orchestras from Neon
    const orchestras = await neonPrisma.orchestra.findMany({
      where: { status: 'active' },
      select: { subdomain: true, name: true }
    })
    
    console.log(`Found ${orchestras.length} active orchestras`)
    
    const results = {
      timestamp: new Date().toISOString(),
      orchestras: {} as Record<string, { reminders: string; timeouts: string; errors: string[] }>
    }
    
    // Process each orchestra
    for (const orchestra of orchestras) {
      console.log(`Processing ${orchestra.name} (${orchestra.subdomain})...`)
      
      try {
        // Get the orchestra-specific prisma client
        const orchestraPrisma = await getPrismaClient(orchestra.subdomain)
        
        // Run both checks in parallel for this orchestra
        const [remindersResult, timeoutsResult] = await Promise.allSettled([
          sendReminders(orchestraPrisma),
          handleTimeouts(orchestraPrisma)
        ])
        
        results.orchestras[orchestra.subdomain] = {
          reminders: remindersResult.status === 'fulfilled' ? 'success' : 'failed',
          timeouts: timeoutsResult.status === 'fulfilled' ? 'success' : 'failed',
          errors: []
        }
        
        if (remindersResult.status === 'rejected') {
          console.error(`Reminder check failed for ${orchestra.subdomain}:`, remindersResult.reason)
          results.orchestras[orchestra.subdomain].errors.push(`Reminders: ${remindersResult.reason}`)
        }
        
        if (timeoutsResult.status === 'rejected') {
          console.error(`Timeout check failed for ${orchestra.subdomain}:`, timeoutsResult.reason)
          results.orchestras[orchestra.subdomain].errors.push(`Timeouts: ${timeoutsResult.reason}`)
        }
      } catch (error) {
        console.error(`Failed to process orchestra ${orchestra.subdomain}:`, error)
        results.orchestras[orchestra.subdomain] = {
          reminders: 'failed',
          timeouts: 'failed',
          errors: [`Orchestra processing failed: ${String(error)}`]
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}