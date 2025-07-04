'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { toast } from '@/components/toast'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  rank?: number
}

interface CustomList {
  id: number
  customListId: string
  name: string
  position: {
    id: number
    name: string
    instrument: {
      id: number
      name: string
    }
  }
  customRankings: Array<{
    rank: number
    musician: Musician
  }>
  projectNeeds: Array<{
    id: number
    projectNeedId: string
  }>
}

interface Project {
  id: number
  projectId: string
  name: string
  weekNumber: number
}

export default function EditCustomListPage({
  params
}: {
  params: Promise<{ id: string, listId: string }>
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [listId, setListId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [customList, setCustomList] = useState<CustomList | null>(null)
  const [listName, setListName] = useState('')
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [availableMusicians, setAvailableMusicians] = useState<Musician[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [musicianSearch, setMusicianSearch] = useState('')

  // Initialize params
  useEffect(() => {
    params.then(p => {
      setProjectId(p.id)
      setListId(p.listId)
    })
  }, [params])

  // Fetch all data
  useEffect(() => {
    if (!projectId || !listId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch project
        const projectResponse = await fetch(`/api/projects/${projectId}`)
        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData)
        }

        // Fetch custom list
        const listResponse = await fetch(
          `/api/projects/${projectId}/custom-lists/${listId}`
        )
        if (listResponse.ok) {
          const listData = await listResponse.json()
          setCustomList(listData)
          setListName(listData.name)
          setMusicians(
            listData.customRankings
              .sort((a: any, b: any) => a.rank - b.rank)
              .map((r: any) => r.musician)
          )

          // Fetch available musicians for this position
          const musiciansResponse = await fetch(
            `/api/projects/${projectId}/custom-lists/available-musicians?positionId=${listData.position.id}`
          )
          if (musiciansResponse.ok) {
            const musiciansData = await musiciansResponse.json()
            setAvailableMusicians(musiciansData.musicians)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Kunde inte ladda data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, listId])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(musicians)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setMusicians(items)
  }

  const addMusician = (musician: Musician) => {
    if (musicians.some(m => m.id === musician.id)) return
    setMusicians([...musicians, musician])
  }

  const removeMusician = (musicianId: number) => {
    setMusicians(musicians.filter(m => m.id !== musicianId))
  }

  const handleSave = async () => {
    if (musicians.length === 0) {
      toast.error('Listan måste innehålla minst en musiker')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/custom-lists/${listId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: listName,
            musicians: musicians.map(m => m.id)
          })
        }
      )

      if (response.ok) {
        toast.success('Lista uppdaterad')
        router.push(`/admin/projects/${projectId}/custom-lists`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kunde inte uppdatera listan')
      }
    } catch (error) {
      console.error('Error saving list:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const filteredAvailableMusicians = availableMusicians.filter(musician => {
    const searchLower = musicianSearch.toLowerCase()
    return (
      musician.firstName.toLowerCase().includes(searchLower) ||
      musician.lastName.toLowerCase().includes(searchLower) ||
      musician.email.toLowerCase().includes(searchLower)
    )
  })

  const isMusicianInList = (musicianId: number) => {
    return musicians.some(m => m.id === musicianId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar...</p>
        </div>
      </div>
    )
  }

  if (!customList) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lista hittades inte</p>
      </div>
    )
  }

  const isInUse = customList.projectNeeds.length > 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                <Link href="/admin/projects" className="hover:text-gray-700">
                  Projekt
                </Link>
                <span>/</span>
                <Link 
                  href={`/admin/projects/${projectId}`}
                  className="hover:text-gray-700"
                >
                  {project?.name}
                </Link>
                <span>/</span>
                <Link 
                  href={`/admin/projects/${projectId}/custom-lists`}
                  className="hover:text-gray-700"
                >
                  Anpassade listor
                </Link>
                <span>/</span>
                <span className="text-gray-900">Redigera</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Redigera anpassad lista
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {customList.position.instrument.name} - {customList.position.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/admin/projects/${projectId}/custom-lists`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Avbryt
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || musicians.length === 0}
                className={`px-6 py-2 text-sm font-medium rounded-lg ${
                  saving || musicians.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content with scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {/* Warning if list is in use */}
        {isInUse && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Denna lista används av {customList.projectNeeds.length} projektbehov.
                    Ändringar kommer att påverka dessa behov.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
        {/* List name */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Listnamn
          </label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ange listnamn..."
          />
        </div>

        <div className="flex gap-6" style={{ height: 'calc(100vh - 350px)' }}>
          {/* Current list */}
          <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                Nuvarande lista
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {musicians.length} musiker • Dra för att ändra ordning
              </p>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="musicians-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 p-4 overflow-y-auto"
                  >
                    {musicians.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Listan är tom
                      </p>
                    ) : (
                      musicians.map((musician, index) => (
                        <Draggable
                          key={musician.id}
                          draggableId={musician.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 bg-white border rounded-lg flex items-center justify-between ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="cursor-move text-gray-400 hover:text-gray-600 mr-3">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-500 mr-3">
                                  {index + 1}.
                                </span>
                                <span className="text-sm font-medium">
                                  {musician.firstName} {musician.lastName}
                                </span>
                              </div>
                              <button
                                onClick={() => removeMusician(musician.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Available musicians */}
          <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-2">
                Tillgängliga musiker
              </h2>
              <input
                type="text"
                placeholder="🔍 Sök musiker..."
                value={musicianSearch}
                onChange={(e) => setMusicianSearch(e.target.value)}
                className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {filteredAvailableMusicians.map(musician => {
                const isInList = isMusicianInList(musician.id)
                return (
                  <div
                    key={musician.id}
                    className={`mb-2 p-3 border rounded-lg flex items-center justify-between ${
                      isInList
                        ? 'bg-gray-50 text-gray-400 line-through'
                        : 'bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !isInList && addMusician(musician)}
                  >
                    <span className="text-sm font-medium">
                      {musician.firstName} {musician.lastName}
                    </span>
                    {!isInList && (
                      <span className="text-green-600 text-sm">+</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}