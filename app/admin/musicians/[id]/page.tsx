'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  localResidence: boolean
  isActive: boolean
  isArchived: boolean
  createdAt: string
  qualifications: Array<{
    position: {
      id: number
      name: string
      instrument: {
        name: string
      }
    }
  }>
  rankings?: Array<{
    id: number
    rank: number
    rankingList: {
      id: number
      listType: string
      description: string | null
      position: {
        id: number
        name: string
        instrument: {
          id: number
          name: string
        }
      }
    }
  }>
}

interface ProjectHistory {
  project: {
    id: number
    projectId: string
    name: string
    startDate: string
    weekNumber: number
  }
  requests: Array<{
    id: number
    requestId: string
    position: {
      id: number
      name: string
      instrument: {
        id: number
        name: string
      }
    }
    status: string
    sentAt: string
    respondedAt: string | null
    response: string | null
  }>
}

export default function MusicianProfilePage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [musician, setMusician] = useState<Musician | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [statistics, setStatistics] = useState<{
    totalRequests: number
    acceptedRequests: number
    declinedRequests: number
    pendingRequests: number
    acceptanceRate: number
    averageResponseTime: number
    topPositions: Array<{ position: string; instrument: string; count: number }>
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchMusician()
    fetchProjectHistory()
    fetchStatistics()
  }, [params.id])

  const fetchMusician = async () => {
    try {
      const response = await fetch(`/api/musicians/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch musician')
      const data = await response.json()
      setMusician(data)
    } catch (error) {
      console.error('Error:', error)
      setError('Kunde inte hämta musikerinformation')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectHistory = async () => {
    try {
      const response = await fetch(`/api/musicians/${params.id}/project-history`)
      if (!response.ok) throw new Error('Failed to fetch project history')
      const data = await response.json()
      setProjectHistory(data)
    } catch (error) {
      console.error('Error fetching project history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/musicians/${params.id}/statistics`)
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!musician) return
    
    try {
      const response = await fetch(`/api/musicians/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...musician,
          isActive: !musician.isActive,
          qualificationIds: musician.qualifications.map(q => q.position.id)
        })
      })

      if (!response.ok) throw new Error('Failed to update status')
      const updatedMusician = await response.json()
      setMusician(updatedMusician)
    } catch (error) {
      console.error('Error:', error)
      setError('Kunde inte uppdatera status')
    }
  }

  const handleArchive = async () => {
    if (!confirm('Är du säker på att du vill arkivera denna musiker?')) return

    try {
      const response = await fetch(`/api/musicians/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to archive musician')
      router.push('/admin/musicians')
    } catch (error) {
      console.error('Error:', error)
      setError('Kunde inte arkivera musiker')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar musikerinformation...</p>
      </div>
    )
  }

  if (!musician) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Musiker hittades inte</p>
        <Link
          href="/admin/musicians"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Tillbaka till musiker
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/musicians"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till musiker
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {musician.firstName} {musician.lastName}
          </h2>
          <span className="text-lg text-gray-500">{musician.musicianId}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Status bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {musician.isArchived ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Arkiverad
                </span>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    musician.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {musician.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              )}
              {musician.localResidence && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Lokalt boende
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!musician.isArchived && (
                <>
                  <button
                    onClick={handleStatusToggle}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {musician.isActive ? 'Inaktivera' : 'Aktivera'}
                  </button>
                  <Link
                    href={`/admin/musicians/${params.id}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Redigera
                  </Link>
                  <button
                    onClick={handleArchive}
                    className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    Arkivera
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kontaktinformation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Kontaktinformation</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">E-postadress</dt>
              <dd className="mt-1 text-sm text-gray-900">{musician.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefonnummer</dt>
              <dd className="mt-1 text-sm text-gray-900">{musician.phone || 'Ej angivet'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Registrerad</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(musician.createdAt).toLocaleDateString('sv-SE')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Kvalifikationer */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Kvalifikationer</h3>
          {musician.qualifications.length === 0 ? (
            <p className="text-sm text-gray-500">Inga kvalifikationer registrerade</p>
          ) : (
            <div className="space-y-2">
              {musician.qualifications.map((qual, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {qual.position.instrument.name}:
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {qual.position.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Framtida sektioner */}
      <div className="mt-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Rankningar</h3>
          {!musician.rankings || musician.rankings.length === 0 ? (
            <p className="text-sm text-gray-500">Musikern finns inte med i några rankningslistor</p>
          ) : (
            <div className="space-y-4">
              {/* Group rankings by instrument and position */}
              {Object.entries(
                musician.rankings.reduce((groups, ranking) => {
                  const key = `${ranking.rankingList.position.instrument.name} - ${ranking.rankingList.position.name}`
                  if (!groups[key]) groups[key] = []
                  groups[key].push(ranking)
                  return groups
                }, {} as Record<string, typeof musician.rankings>)
              ).map(([positionKey, rankings]) => (
                <div key={positionKey} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{positionKey}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {rankings.map((ranking) => (
                      <div key={ranking.id} className="text-center">
                        <Link
                          href={`/admin/rankings?position=${ranking.rankingList.position.id}&list=${ranking.rankingList.listType}`}
                          className="block hover:bg-gray-50 rounded p-2 transition-colors"
                        >
                          <div className="text-2xl font-bold text-gray-900">
                            {ranking.rank}
                          </div>
                          <div className="text-sm text-gray-600">
                            Lista {ranking.rankingList.listType}
                          </div>
                          {ranking.rankingList.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {ranking.rankingList.description}
                            </div>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Projekthistorik</h3>
          {historyLoading ? (
            <p className="text-sm text-gray-500">Laddar projekthistorik...</p>
          ) : projectHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Musikern har inte fått några projektförfrågningar ännu</p>
          ) : (
            <div className="space-y-4">
              {projectHistory.map((item) => (
                <div key={item.project.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/admin/projects/${item.project.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {item.project.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        Vecka {item.project.weekNumber} • {new Date(item.project.startDate).toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    {new Date(item.project.startDate) > new Date() ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Kommande
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Genomfört
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {item.requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            {request.position.instrument.name} - {request.position.name}
                          </span>
                          {request.status === 'accepted' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepterad
                            </span>
                          )}
                          {request.status === 'declined' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Avböjd
                            </span>
                          )}
                          {request.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Väntar svar
                            </span>
                          )}
                        </div>
                        {request.respondedAt && (
                          <span className="text-xs text-gray-500">
                            Svarade: {new Date(request.respondedAt).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Statistik</h3>
          {statsLoading ? (
            <p className="text-sm text-gray-500">Laddar statistik...</p>
          ) : !statistics || statistics.totalRequests === 0 ? (
            <p className="text-sm text-gray-500">Ingen statistik tillgänglig ännu</p>
          ) : (
            <div className="space-y-6">
              {/* Översikt */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalRequests}</div>
                  <div className="text-sm text-gray-600">Förfrågningar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.acceptedRequests}</div>
                  <div className="text-sm text-gray-600">Accepterade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{statistics.declinedRequests}</div>
                  <div className="text-sm text-gray-600">Avböjda</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.pendingRequests}</div>
                  <div className="text-sm text-gray-600">Väntar svar</div>
                </div>
              </div>

              {/* Acceptansgrad och svarstid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Acceptansgrad</span>
                    <span className="text-2xl font-bold text-gray-900">{statistics.acceptanceRate}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${statistics.acceptanceRate}%` }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Genomsnittlig svarstid</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {statistics.averageResponseTimeHours < 24 
                        ? `${statistics.averageResponseTimeHours} tim`
                        : `${Math.round(statistics.averageResponseTimeHours / 24)} dagar`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Mest efterfrågade positioner */}
              {statistics.topPositions && statistics.topPositions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mest efterfrågade positioner</h4>
                  <div className="space-y-2">
                    {statistics.topPositions.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.position}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count} förfrågningar</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Förfrågningar per år */}
              {statistics.requestsByYear && statistics.requestsByYear.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Förfrågningar per år</h4>
                  <div className="space-y-1">
                    {statistics.requestsByYear.map((item: any) => (
                      <div key={item.year} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.year}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count} förfrågningar</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}