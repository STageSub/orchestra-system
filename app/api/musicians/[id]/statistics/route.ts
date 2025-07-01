import { NextResponse } from 'next/server'
import { prismaMultitenant } from '@/lib/prisma-multitenant'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Fetch all requests for this musician
    const requests = await prismaMultitenant.request.findMany({
      where: { musicianId: parseInt(id) },
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

    // Calculate basic statistics
    const totalRequests = requests.length
    const acceptedRequests = requests.filter(r => r.status === 'accepted').length
    const declinedRequests = requests.filter(r => r.status === 'declined').length
    const pendingRequests = requests.filter(r => r.status === 'pending').length
    
    // Calculate acceptance rate
    const respondedRequests = acceptedRequests + declinedRequests
    const acceptanceRate = respondedRequests > 0 
      ? Math.round((acceptedRequests / respondedRequests) * 100)
      : 0

    // Calculate average response time (for responded requests)
    const responseTimes = requests
      .filter(r => r.respondedAt && r.sentAt)
      .map(r => {
        const sent = new Date(r.sentAt).getTime()
        const responded = new Date(r.respondedAt!).getTime()
        return (responded - sent) / (1000 * 60 * 60) // Convert to hours
      })
    
    const averageResponseTimeHours = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

    // Group by instrument/position to find most requested
    const positionCounts = requests.reduce((acc, request) => {
      const key = `${request.projectNeed.position.instrument.name} - ${request.projectNeed.position.name}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sortedPositions = Object.entries(positionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([position, count]) => ({ position, count }))

    // Calculate requests by year
    const requestsByYear = requests.reduce((acc, request) => {
      const year = new Date(request.sentAt).getFullYear()
      acc[year] = (acc[year] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const statistics = {
      totalRequests,
      acceptedRequests,
      declinedRequests,
      pendingRequests,
      acceptanceRate,
      averageResponseTimeHours,
      topPositions: sortedPositions.slice(0, 3), // Top 3 most requested positions
      requestsByYear: Object.entries(requestsByYear)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, count]) => ({ year: Number(year), count }))
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching musician statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}