import { useEffect, useState } from 'react'
import { toast } from '@/components/toast'

interface ProjectEvent {
  type: 'response_accepted' | 'response_declined' | 'request_timeout'
  musicianName: string
  positionName: string
  instrumentName: string
  timestamp: Date
}

export function useProjectEvents(projectId: number) {
  const [lastEventTime, setLastEventTime] = useState(new Date())
  
  useEffect(() => {
    if (!projectId) return
    
    console.log(`🔄 Starting event polling for project ${projectId}`)
    
    const checkForEvents = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/events?since=${lastEventTime.toISOString()}`)
        if (!response.ok) return
        
        const events: ProjectEvent[] = await response.json()
        
        // Log events for debugging
        if (events.length > 0) {
          console.log('📢 New events received:', events)
        }
        
        events.forEach(event => {
          switch (event.type) {
            case 'response_accepted':
              toast.success(
                `${event.musicianName} har accepterat förfrågan för ${event.instrumentName} - ${event.positionName}`,
                10000
              )
              break
            case 'response_declined':
              toast.error(
                `${event.musicianName} har tackat nej till förfrågan för ${event.instrumentName} - ${event.positionName}`,
                10000
              )
              break
            case 'request_timeout':
              toast.warning(
                `Förfrågan till ${event.musicianName} för ${event.positionName} har gått ut`,
                10000
              )
              break
          }
        })
        
        if (events.length > 0) {
          setLastEventTime(new Date())
        }
      } catch (error) {
        console.error('Error checking for events:', error)
      }
    }
    
    // Check immediately
    checkForEvents()
    
    // Then check every 10 seconds
    const interval = setInterval(checkForEvents, 10000)
    
    return () => clearInterval(interval)
  }, [projectId, lastEventTime])
}