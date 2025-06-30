'use client'

import { useState, useEffect } from 'react'

interface Conflict {
  musician: {
    id: number
    firstName: string
    lastName: string
  }
  positions: Array<{
    needId: number
    position: {
      id: number
      name: string
      instrument: {
        name: string
      }
    }
    listType: string
    ranking: number
    quantity: number
  }>
}

interface ConflictWarningProps {
  projectId: number
}

export default function ConflictWarning({ projectId }: ConflictWarningProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [conflictStrategy, setConflictStrategy] = useState('simple')

  useEffect(() => {
    fetchConflicts()
    fetchSettings()
  }, [projectId])

  const fetchConflicts = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/conflicts`)
      if (response.ok) {
        const data = await response.json()
        setConflicts(data.conflicts)
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        const strategySetting = settings.find((s: any) => s.key === 'ranking_conflict_strategy')
        if (strategySetting) {
          setConflictStrategy(strategySetting.value)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  if (loading) return null
  if (conflicts.length === 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <svg className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <div className="text-sm text-orange-800">
              <p className="font-medium">{conflicts.length} {conflicts.length === 1 ? 'musiker finns' : 'musiker finns'} i flera rankningslistor</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-orange-700 hover:text-orange-900 underline ml-4"
        >
          {showDetails ? 'Dölj' : 'Detaljer'}
        </button>
      </div>
          
          {showDetails && (
            <div className="mt-3 space-y-2">
              {/* Explanation */}
              <div className="text-xs text-orange-700 bg-orange-50 rounded p-2 border border-orange-100">
                <p>Varje musiker får endast EN förfrågan per projekt. Systemet skickar automatiskt till den position som behandlas först - övriga positioner hoppas över.</p>
              </div>

              {/* Strategy explanation */}
              {conflictStrategy !== 'simple' && (
                <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                  <p className="font-medium mb-1">Konflikthantering:</p>
                  <p className="text-gray-600">
                    {conflictStrategy === 'detailed' && 
                      'Detaljerad loggning - sparar information om alla konflikter för analys.'}
                    {conflictStrategy === 'smart' && 
                      'Smart prioritering - analyserar var musiker passar bäst baserat på ranking.'}
                  </p>
                </div>
              )}

              {/* Musician list */}
              <div className="space-y-1">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="text-xs bg-white rounded p-2 border border-orange-200">
                    <span className="font-medium text-gray-900">
                      {conflict.musician.firstName} {conflict.musician.lastName}:
                    </span>
                    <span className="text-gray-600 ml-1">
                      {conflict.positions.map((pos, pidx) => (
                        <span key={pidx}>
                          {pidx > 0 && ', '}
                          {pos.position.name} ({pos.listType}-{pos.ranking})
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  )
}