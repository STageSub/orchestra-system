'use client'

import { useState, useEffect } from 'react'

interface Musician {
  id: number
  firstName: string
  lastName: string
  rank: number
}

interface RankingListTooltipProps {
  rankingListId?: number
  customRankingListId?: number
  listType: string
  positionName: string
}

export default function RankingListTooltip({ 
  rankingListId, 
  customRankingListId,
  listType, 
  positionName 
}: RankingListTooltipProps) {
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (rankingListId || customRankingListId) {
      fetchRankingList()
    }
  }, [rankingListId, customRankingListId])

  const fetchRankingList = async () => {
    try {
      let response
      if (customRankingListId) {
        // Fetch custom ranking list
        const searchParams = new URLSearchParams({ customListId: customRankingListId.toString() })
        response = await fetch(`/api/projects/0/custom-lists?${searchParams}`)
        if (response.ok) {
          const data = await response.json()
          const rankings = data.customRankings || []
          const musiciansData = rankings.map((ranking: any) => ({
            id: ranking.musician.id,
            firstName: ranking.musician.firstName,
            lastName: ranking.musician.lastName,
            rank: ranking.rank
          }))
          
          setMusicians(musiciansData.slice(0, 8)) // Show first 8
          setTotalCount(musiciansData.length)
        }
      } else if (rankingListId) {
        // Fetch standard ranking list
        response = await fetch(`/api/rankings/${rankingListId}`)
        if (response.ok) {
          const data = await response.json()
          const rankings = data.rankings || []
          const musiciansData = rankings.map((ranking: any) => ({
            id: ranking.musician.id,
            firstName: ranking.musician.firstName,
            lastName: ranking.musician.lastName,
            rank: ranking.rank
          }))
          
          setMusicians(musiciansData.slice(0, 8)) // Show first 8
          setTotalCount(musiciansData.length)
        }
      }
    } catch (error) {
      console.error('Error fetching ranking list:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-64 p-2">
        <div className="text-sm opacity-70">Laddar...</div>
      </div>
    )
  }

  return (
    <div className="w-64">
      <div className="font-semibold mb-2 text-sm">
        Lista {listType} - {positionName}
      </div>
      
      {musicians.length > 0 ? (
        <div className="space-y-1">
          {musicians.map((musician) => (
            <div key={musician.id} className="text-xs flex items-center">
              <span className="opacity-70 mr-2 w-6 text-right">{musician.rank}.</span>
              <span className="truncate">
                {musician.firstName} {musician.lastName}
              </span>
            </div>
          ))}
          
          {totalCount > 8 && (
            <div className="text-xs opacity-70 italic mt-2 pt-2 border-t border-gray-600">
              ... och {totalCount - 8} till ({totalCount} totalt)
            </div>
          )}
          
          {totalCount <= 8 && totalCount > 0 && (
            <div className="text-xs opacity-70 italic mt-2 pt-2 border-t border-gray-600">
              {totalCount} musiker totalt
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs opacity-70 italic">
          Inga musiker i denna lista
        </div>
      )}
    </div>
  )
}