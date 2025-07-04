import { NextRequest, NextResponse } from 'next/server'

// In-memory progress storage (consider Redis for production)
const progressStore = new Map<string, {
  total: number
  sent: number
  currentBatch: string[]
  estimatedTime: number
  status: 'sending' | 'completed' | 'error'
  error?: string
  timestamp: number
}>()

// Clean up old progress data after 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of progressStore.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      progressStore.delete(key)
    }
  }
}, 60 * 1000)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  
  const key = sessionId ? `${id}-${sessionId}` : id
  const progress = progressStore.get(key)
  
  if (!progress) {
    return NextResponse.json({
      total: 0,
      sent: 0,
      currentBatch: [],
      estimatedTime: 0,
      status: 'idle'
    })
  }
  
  return NextResponse.json(progress)
}

// Export function to update progress from other routes
export function updateSendProgress(
  projectId: string,
  sessionId: string | null,
  data: {
    total?: number
    sent?: number
    currentBatch?: string[]
    estimatedTime?: number
    status?: 'sending' | 'completed' | 'error'
    error?: string
  }
) {
  const key = sessionId ? `${projectId}-${sessionId}` : projectId
  const existing = progressStore.get(key) || {
    total: 0,
    sent: 0,
    currentBatch: [],
    estimatedTime: 0,
    status: 'sending' as const,
    timestamp: Date.now()
  }
  
  progressStore.set(key, {
    ...existing,
    ...data,
    timestamp: Date.now()
  })
}