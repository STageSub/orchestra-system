'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  isActive: boolean
  localResidence: boolean
}

interface Ranking {
  id: number
  rank: number
  musician: Musician
}

interface RankingList {
  id: number
  rankingListId: string
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
  rankings: Ranking[]
}

// Sortable musiker-komponent
function SortableMusician({ ranking, index, onRemove }: { ranking: Ranking; index: number; onRemove: (rankingId: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ranking.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-500 w-8">
          {index + 1}
        </span>
        <div>
          <Link
            href={`/admin/musicians/${ranking.musician.id}`}
            className="hover:underline"
          >
            <p className="font-medium text-gray-900">
              {ranking.musician.firstName} {ranking.musician.lastName}
            </p>
          </Link>
          <p className="text-sm text-gray-500">
            {ranking.musician.email}
            {ranking.musician.phone && ` • ${ranking.musician.phone}`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!ranking.musician.isActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inaktiv
          </span>
        )}
        {ranking.musician.localResidence && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Lokalt boende
          </span>
        )}
        <button
          onClick={() => onRemove(ranking.id)}
          className="ml-2 text-gray-400 hover:text-red-600"
          title="Ta bort från lista"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  )
}

export default function RankingListPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [paramsId, setParamsId] = useState<string | null>(null)
  const [rankingList, setRankingList] = useState<RankingList | null>(null)
  const [availableMusicians, setAvailableMusicians] = useState<Musician[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddMusician, setShowAddMusician] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [description, setDescription] = useState('')
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [selectedMusicians, setSelectedMusicians] = useState<number[]>([])
  const [isAddingMusicians, setIsAddingMusicians] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    params.then(p => {
      setParamsId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (paramsId) {
      fetchRankingList()
    }
  }, [paramsId])

  const fetchRankingList = async () => {
    if (!paramsId) return
    try {
      const response = await fetch(`/api/rankings/${paramsId}`)
      if (!response.ok) throw new Error('Failed to fetch ranking list')
      const data = await response.json()
      setRankingList(data)
      setDescription(data.description || '')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMusicians = async () => {
    if (!rankingList) return
    
    try {
      const response = await fetch(`/api/rankings/${paramsId}/available-musicians`)
      const data = await response.json()
      setAvailableMusicians(data)
    } catch (error) {
      console.error('Error fetching available musicians:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && rankingList) {
      const oldIndex = rankingList.rankings.findIndex((r) => r.id === active.id)
      const newIndex = rankingList.rankings.findIndex((r) => r.id === over?.id)

      const newRankings = arrayMove(rankingList.rankings, oldIndex, newIndex)
      
      // Uppdatera lokalt direkt för bättre UX
      setRankingList({
        ...rankingList,
        rankings: newRankings.map((r, index) => ({ ...r, rank: index + 1 }))
      })

      // Spara till databas
      try {
        setSaving(true)
        console.log('Sending reorder request to:', `/api/rankings/${paramsId}/reorder`)
        const response = await fetch(`/api/rankings/${paramsId}/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rankings: newRankings.map((r, index) => ({
              id: r.id,
              rank: index + 1
            }))
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          console.error('Reorder failed - Full error details:', {
            status: response.status,
            statusText: response.statusText,
            error: error,
            errorDetails: error.details,
            timestamp: error.timestamp
          })
          throw new Error(error.error || 'Failed to reorder rankings')
        }
        
        console.log('Reorder successful')
        
        // Refetch to ensure consistency
        await fetchRankingList()
      } catch (error) {
        console.error('Error saving new order:', error)
        // Visa felmeddelande för användaren
        const errorMessage = error instanceof Error ? error.message : 'Kunde inte spara den nya ordningen'
        alert(errorMessage)
        // Återställ vid fel
        fetchRankingList()
      } finally {
        setSaving(false)
      }
    }
  }

  const handleAddMusician = async (musicianId: number | number[]) => {
    const musicianIds = Array.isArray(musicianId) ? musicianId : [musicianId]
    
    try {
      setIsAddingMusicians(true)
      
      // Make multiple API calls for each musician
      const promises = musicianIds.map(id => 
        fetch(`/api/rankings/${paramsId}/add-musician`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ musicianId: id })
        })
      )
      
      const results = await Promise.all(promises)
      const allSuccessful = results.every(response => response.ok)
      
      if (allSuccessful) {
        // Clear selections after successful add
        setSelectedMusicians([])
        // Update available musicians list
        fetchAvailableMusicians()
        // Update ranking list
        fetchRankingList()
      } else {
        alert('Vissa musiker kunde inte läggas till')
      }
    } catch (error) {
      console.error('Error adding musician:', error)
      alert('Ett fel uppstod när musiker skulle läggas till')
    } finally {
      setIsAddingMusicians(false)
    }
  }

  const handleRemoveMusician = async (rankingId: number) => {
    if (!confirm('Är du säker på att du vill ta bort musikern från listan?')) return

    try {
      const response = await fetch(`/api/rankings/${paramsId}/musicians/${rankingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRankingList()
      }
    } catch (error) {
      console.error('Error removing musician:', error)
    }
  }

  const handleToggleSelectMusician = (musicianId: number) => {
    setSelectedMusicians(prev => 
      prev.includes(musicianId) 
        ? prev.filter(id => id !== musicianId)
        : [...prev, musicianId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMusicians.length === availableMusicians.length) {
      setSelectedMusicians([])
    } else {
      setSelectedMusicians(availableMusicians.map(m => m.id))
    }
  }

  const handleDeleteList = async () => {
    if (!paramsId || deleteConfirmText !== 'RADERA') return

    try {
      const response = await fetch(`/api/rankings/${paramsId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/rankings')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort listan')
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      alert('Ett fel uppstod vid borttagning')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar rankningslista...</p>
      </div>
    )
  }

  if (!rankingList) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Rankningslista hittades inte</p>
        <Link
          href="/admin/rankings"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Tillbaka till rankningar
        </Link>
      </div>
    )
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/rankings?instrument=${rankingList.position.instrument.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till rankningar
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {rankingList.listType}-lista - {rankingList.position.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {rankingList.position.instrument.name}
              {editingDescription ? (
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={async () => {
                    setEditingDescription(false)
                    if (description !== rankingList.description) {
                      try {
                        await fetch(`/api/rankings/${paramsId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ description })
                        })
                        fetchRankingList()
                      } catch (error) {
                        console.error('Error updating description:', error)
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  className="ml-2 inline-block px-2 py-1 text-sm border border-gray-300 rounded"
                  autoFocus
                />
              ) : (
                <>
                  {rankingList.description && ` • ${rankingList.description}`}
                  <button
                    onClick={() => setEditingDescription(true)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="Redigera beskrivning"
                  >
                    <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getListBadgeClass(
              rankingList.listType
            )}`}
          >
            {rankingList.listType}-lista
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Rankningslista ({rankingList.rankings.length} musiker)
          </h3>
          <div className="flex items-center space-x-3">
            {saving && (
              <span className="text-sm text-gray-500">Sparar...</span>
            )}
            <div className="flex items-center space-x-2">
              {rankingList.rankings.length === 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  title="Ta bort lista"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Ta bort lista
                </button>
              )}
              {rankingList.rankings.length > 0 && (
                <button
                  onClick={() => setShowClearModal(true)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Töm lista
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddMusician(true)
                  setSelectedMusicians([])
                  fetchAvailableMusicians()
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                + Lägg till musiker
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {rankingList.rankings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Inga musiker i denna lista ännu
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rankingList.rankings.map(r => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-3">
                  {rankingList.rankings.map((ranking, index) => (
                    <SortableMusician
                      key={ranking.id}
                      ranking={ranking}
                      index={index}
                      onRemove={handleRemoveMusician}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Modal för att lägga till musiker */}
      {showAddMusician && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto border w-full max-w-2xl shadow-lg rounded-md bg-white flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Lägg till musiker
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {availableMusicians.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Inga tillgängliga musiker för denna position
                </p>
              ) : (
                <>
                  {/* Select all checkbox */}
                  <div className="mb-4 flex items-center justify-between border-b pb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMusicians.length === availableMusicians.length && availableMusicians.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Välj alla ({availableMusicians.length})
                      </span>
                    </label>
                    {selectedMusicians.length > 0 && (
                      <button
                        onClick={() => handleAddMusician(selectedMusicians)}
                        disabled={isAddingMusicians}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {isAddingMusicians ? 'Lägger till...' : `Lägg till alla valda (${selectedMusicians.length})`}
                      </button>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {availableMusicians.map((musician) => (
                      <li
                        key={musician.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMusicians.includes(musician.id)}
                            onChange={() => handleToggleSelectMusician(musician.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {musician.firstName} {musician.lastName}
                              {!musician.isActive && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inaktiv
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {musician.email}
                              {musician.localResidence && ' • Lokalt boende'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMusician(musician.id)}
                          disabled={isAddingMusicians}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                        >
                          Lägg till
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowAddMusician(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal för att tömma lista */}
      {showClearModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Töm hela listan?
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Detta kommer ta bort alla {rankingList?.rankings.length} musiker från {rankingList?.listType}-listan.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                För att bekräfta, skriv <span className="font-semibold">RADERA</span> i fältet nedan:
              </p>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Skriv RADERA här"
                style={{ fontStyle: 'italic', fontSize: '0.875rem' }}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowClearModal(false)
                  setClearConfirmText('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (clearConfirmText === 'RADERA') {
                    try {
                      const response = await fetch(`/api/rankings/${paramsId}/clear`, {
                        method: 'DELETE'
                      })
                      if (response.ok) {
                        setShowClearModal(false)
                        setClearConfirmText('')
                        fetchRankingList()
                      }
                    } catch (error) {
                      console.error('Error clearing list:', error)
                    }
                  }
                }}
                disabled={clearConfirmText !== 'RADERA'}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                  clearConfirmText === 'RADERA'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Töm lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal för att ta bort lista */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="w-12 h-12 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ta bort rankningslista</h3>
                  <p className="text-sm text-gray-500 mt-1">Denna åtgärd kan inte ångras</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                För att bekräfta borttagning av {rankingList?.listType}-listan, skriv <span className="font-semibold">RADERA</span> i fältet nedan:
              </p>
              
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Skriv RADERA här"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                autoFocus
              />
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDeleteList}
                  disabled={deleteConfirmText !== 'RADERA'}
                  className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                    deleteConfirmText === 'RADERA'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Ta bort lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}