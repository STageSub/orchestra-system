import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET() {
  try {
    const settings = await prismaMultitenant.settings.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updates = []

    for (const [key, value] of Object.entries(body)) {
      updates.push(
        prismaMultitenant.settings.upsert({
          where: { key },
          create: {
            key,
            value: String(value),
            description: getSettingDescription(key)
          },
          update: {
            value: String(value)
          }
        })
      )
    }

    await prismaMultitenant.$transaction(updates)

    const updatedSettings = await prismaMultitenant.settings.findMany()
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    reminder_percentage: 'Procent av svarstiden som ska gå innan påminnelse skickas',
    ranking_conflict_strategy: 'Strategi för hantering av musiker som finns på flera rankningslistor'
  }
  return descriptions[key] || ''
}