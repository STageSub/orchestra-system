import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.settings.findMany()
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
        prisma.settings.upsert({
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

    await prisma.$transaction(updates)

    const updatedSettings = await prisma.settings.findMany()
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
  }
  return descriptions[key] || ''
}