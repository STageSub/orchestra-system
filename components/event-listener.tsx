'use client'

import { useEffect } from 'react'
import { toast } from '@/components/toast'

// This component listens for custom events and shows toasts
export default function EventListener() {
  useEffect(() => {
    // Listen for musician response events
    const handleMusicianResponse = (event: CustomEvent) => {
      const { type, musician, position, instrument } = event.detail
      
      if (type === 'accepted') {
        toast.success(
          `${musician} har accepterat förfrågan för ${instrument} - ${position}`,
          10000
        )
      } else if (type === 'declined') {
        toast.error(
          `${musician} har tackat nej till förfrågan för ${instrument} - ${position}`,
          10000
        )
      }
    }
    
    // Listen for timeout events
    const handleRequestTimeout = (event: CustomEvent) => {
      const { musician, position } = event.detail
      toast.warning(
        `Förfrågan till ${musician} för ${position} har gått ut`,
        10000
      )
    }
    
    // Listen for new request sent
    const handleRequestSent = (event: CustomEvent) => {
      const { musician, position } = event.detail
      toast.info(
        `Förfrågan skickad till ${musician} för ${position}`,
        8000
      )
    }
    
    window.addEventListener('musician-response', handleMusicianResponse as EventListener)
    window.addEventListener('request-timeout', handleRequestTimeout as EventListener)
    window.addEventListener('request-sent', handleRequestSent as EventListener)
    
    return () => {
      window.removeEventListener('musician-response', handleMusicianResponse as EventListener)
      window.removeEventListener('request-timeout', handleRequestTimeout as EventListener)
      window.removeEventListener('request-sent', handleRequestSent as EventListener)
    }
  }, [])
  
  return null
}