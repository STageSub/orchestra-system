'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Instrument {
  id: number
  instrumentId: string
  name: string
  positions: Position[]
}

interface Position {
  id: number
  positionId: string
  name: string
  instrumentId: number
  rankingLists?: RankingList[]
}

interface RankingList {
  id: number
  rankingListId: string
  listType: string
  description: string | null
  positionId: number
  _count?: {
    rankings: number
  }
}

export default function RankingsPage() {
  const searchParams = useSearchParams()
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInstrument, setSelectedInstrument] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<{ positionId: number; listType: string; description: string } | null>(null)

  useEffect(() => {
    fetchInstrumentsAndLists()
  }, [searchParams])

  const fetchInstrumentsAndLists = async () => {
    try {
      const response = await fetch('/api/rankings/overview')
      if (!response.ok) {
        console.error('Failed to fetch rankings data:', response.status)
        setInstruments([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setInstruments(data)
        
        // Check if instrument ID is provided in URL
        const instrumentParam = searchParams.get('instrument')
        if (instrumentParam) {
          const instrumentId = parseInt(instrumentParam)
          if (data.find(i => i.id === instrumentId)) {
            setSelectedInstrument(instrumentId)
          } else if (data.length > 0) {
            setSelectedInstrument(data[0].id)
          }
        } else if (data.length > 0) {
          setSelectedInstrument(data[0].id)
        }
      } else {
        console.error('Invalid response format:', data)
        setInstruments([])
      }
    } catch (error) {
      console.error('Failed to fetch rankings data:', error)
      setInstruments([])
    } finally {
      setLoading(false)
    }
  }

  const getListBadgeClass = (listType: string) => {
    switch (listType) {
      case 'A':
        return 'bg-purple-100 text-purple-800'
      case 'B':
        return 'bg-blue-100 text-blue-800'
      case 'C':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const activeInstrument = instruments.find(i => i.id === selectedInstrument)

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar rankningar...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Rankningslistor</h2>
        <p className="mt-1 text-sm text-gray-600">
          Hantera rankningslistor för varje tjänst och svårighetsgrad
        </p>
      </div>

      {instruments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Inga instrument hittades</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Instrument-väljare */}
          <div className="w-64 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Instrument</h3>
            </div>
            <nav className="p-2">
              {instruments.map((instrument) => (
                <button
                  key={instrument.id}
                  onClick={() => setSelectedInstrument(instrument.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedInstrument === instrument.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {instrument.name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({instrument.positions.length} tjänster)
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Rankningslistor för valt instrument */}
          <div className="flex-1">
            {activeInstrument && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {activeInstrument.name} - Rankningslistor
                  </h3>
                </div>
                <div className="p-6">
                  {activeInstrument.positions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Inga tjänster för detta instrument
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {activeInstrument.positions.map((position) => (
                        <div key={position.id} className="border-b border-gray-200 pb-6 last:border-0">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {position.name}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['A', 'B', 'C'].map((listType) => {
                              const list = position.rankingLists?.find(
                                l => l.listType === listType
                              )
                              
                              return (
                                <div
                                  key={listType}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getListBadgeClass(
                                        listType
                                      )}`}
                                    >
                                      {listType}-lista
                                    </span>
                                    {list && (
                                      <span className="text-xs text-gray-500">
                                        {list._count?.rankings || 0} musiker
                                      </span>
                                    )}
                                  </div>
                                  
                                  {list ? (
                                    <div>
                                      <Link
                                        href={`/admin/rankings/${list.id}`}
                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                                      >
                                        Hantera lista →
                                      </Link>
                                      {list.description && (
                                        <p className="mt-1 text-xs text-gray-500 italic">
                                          &quot;{list.description}&quot;
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setCreateForm({ positionId: position.id, listType: listType, description: '' })
                                        setShowCreateModal(true)
                                      }}
                                      className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                                    >
                                      + Skapa lista
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal för att skapa ny lista */}
      {showCreateModal && createForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Skapa {createForm.listType}-lista
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivning (valfritt)
                </label>
                <input
                  type="text"
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="T.ex. 'För erfarna musiker' eller 'Reservlista'"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/rankings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(createForm)
                    })
                    
                    if (response.ok) {
                      setShowCreateModal(false)
                      setCreateForm(null)
                      fetchInstrumentsAndLists()
                    } else {
                      const error = await response.json()
                      alert(error.error || 'Kunde inte skapa lista')
                    }
                  } catch (error) {
                    console.error('Error creating list:', error)
                    alert('Ett fel uppstod')
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Skapa lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}