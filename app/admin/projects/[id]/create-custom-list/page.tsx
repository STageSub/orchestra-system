'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { logger } from '@/lib/logger'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  listStatus: string
  isInCustomList?: boolean
  rank?: number
}

interface ExistingList {
  id: number
  type: 'standard' | 'custom'
  name: string
  listType?: string
  weekNumber?: number
  musicians: Musician[]
  musicianCount: number
  availableCount?: number
}

export default function CreateCustomListPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ positionId: string, positionName: string, instrumentName: string }>
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<any>(null)
  const [positionId, setPositionId] = useState<string>('')
  const [positionName, setPositionName] = useState<string>('')
  const [instrumentName, setInstrumentName] = useState<string>('')
  
  // List states
  const [newListMusicians, setNewListMusicians] = useState<Musician[]>([])
  const [availableMusicians, setAvailableMusicians] = useState<Musician[]>([])
  const [existingLists, setExistingLists] = useState<{
    standardLists: ExistingList[],
    customLists: ExistingList[]
  }>({ standardLists: [], customLists: [] })
  const [selectedList, setSelectedList] = useState<ExistingList | null>(null)
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [musicianSearch, setMusicianSearch] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Initialize params
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      
      setProjectId(resolvedParams.id)
      setPositionId(resolvedSearchParams.positionId)
      setPositionName(resolvedSearchParams.positionName)
      setInstrumentName(resolvedSearchParams.instrumentName)
    }
    
    initializeParams()
  }, [params, searchParams])

  // Fetch project details
  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
        }
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    }

    fetchProject()
  }, [projectId])

  // Fetch all data
  useEffect(() => {
    if (!projectId || !positionId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch available musicians
        const musiciansResponse = await fetch(
          `/api/projects/${projectId}/custom-lists/available-musicians?positionId=${positionId}`
        )
        if (musiciansResponse.ok) {
          const data = await musiciansResponse.json()
          setAvailableMusicians(data.musicians)
        }

        // Fetch existing lists
        const listsResponse = await fetch(
          `/api/projects/${projectId}/custom-lists/existing-lists?positionId=${positionId}`
        )
        if (listsResponse.ok) {
          const data = await listsResponse.json()
          setExistingLists(data)
          // Select first standard list by default
          if (data.standardLists.length > 0) {
            setSelectedList(data.standardLists[0])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        alert('Ett fel uppstod vid hämtning av data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, positionId])

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(newListMusicians)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setNewListMusicians(items)
  }

  // Add musician to new list
  const addMusicianToNewList = (musician: Musician) => {
    if (newListMusicians.some(m => m.id === musician.id)) return
    
    setNewListMusicians([...newListMusicians, musician])
  }

  // Remove musician from new list
  const removeMusicianFromNewList = (musicianId: number) => {
    setNewListMusicians(newListMusicians.filter(m => m.id !== musicianId))
  }

  // Copy entire list
  const copyEntireList = () => {
    if (!selectedList || newListMusicians.length > 0) return
    
    setNewListMusicians([...selectedList.musicians])
  }

  // Save the custom list
  const saveCustomList = async () => {
    console.log('[Frontend] Save button clicked')
    console.log('[Frontend] Musicians to save:', newListMusicians.length)
    console.log('[Frontend] Project ID:', projectId)
    console.log('[Frontend] Position ID:', positionId)
    
    if (newListMusicians.length === 0) {
      alert('Listan är tom. Lägg till minst en musiker.')
      return
    }

    setSaving(true)
    try {
      const requestBody = {
        positionId: parseInt(positionId),
        musicians: newListMusicians.map(m => m.id),
        saveAsTemplate,
        templateName: saveAsTemplate ? templateName : null
      }
      
      console.log('[Frontend] Request body:', JSON.stringify(requestBody, null, 2))
      console.log('[Frontend] Request URL:', `/api/projects/${projectId}/custom-lists`)
      
      const response = await fetch(`/api/projects/${projectId}/custom-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('[Frontend] Response status:', response.status)
      console.log('[Frontend] Response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        alert(`Lista skapad! ${data.musicianCount} musiker tillagda.`)
        
        // Navigate back with the custom list ID
        router.push(`/admin/projects/${projectId}?customListId=${data.id}&positionId=${positionId}`)
      } else {
        const error = await response.json()
        console.error('[Frontend] Error response:', error)
        console.error('[Frontend] Response status:', response.status)
        alert(error.error || 'Ett fel uppstod vid skapande av lista')
      }
    } catch (error) {
      console.error('[Frontend] Network or parsing error:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  // Filter musicians based on search
  const filteredMusicians = availableMusicians.filter(musician => {
    const searchLower = musicianSearch.toLowerCase()
    return (
      musician.firstName.toLowerCase().includes(searchLower) ||
      musician.lastName.toLowerCase().includes(searchLower) ||
      musician.email.toLowerCase().includes(searchLower)
    )
  })

  // Check if musician is in new list
  const isMusicianInNewList = (musicianId: number) => {
    return newListMusicians.some(m => m.id === musicianId)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skapa ny lista</h1>
              <p className="text-sm text-gray-600 mt-1">
                {instrumentName} - {positionName} • {project?.name}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column - New list */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                V. {project?.weekNumber} {project?.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {newListMusicians.length} musiker
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="new-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[400px] p-4"
                  >
                    {newListMusicians.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Dra musiker hit för att bygga din lista
                      </p>
                    ) : (
                      newListMusicians.map((musician, index) => (
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
                                <span className="text-sm font-medium text-gray-500 mr-3">
                                  {index + 1}.
                                </span>
                                <span className="text-sm font-medium">
                                  {musician.firstName} {musician.lastName}
                                </span>
                              </div>
                              <button
                                onClick={() => removeMusicianFromNewList(musician.id)}
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

          {/* Middle column - Existing lists */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-2">Befintliga listor</h2>
              <select
                value={selectedList?.id || ''}
                onChange={(e) => {
                  const listId = parseInt(e.target.value)
                  const allLists = [...existingLists.standardLists, ...existingLists.customLists]
                  const list = allLists.find(l => l.id === listId)
                  setSelectedList(list || null)
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {existingLists.standardLists.length > 0 && (
                  <>
                    <optgroup label="Standardlistor">
                      {existingLists.standardLists.map(list => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.musicianCount} musiker)
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
                {existingLists.customLists.length > 0 && (
                  <optgroup label="Projektlistor">
                    {existingLists.customLists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.musicianCount} musiker)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              <button
                onClick={copyEntireList}
                disabled={newListMusicians.length > 0}
                className={`mt-3 w-full px-4 py-2 text-sm font-medium rounded-lg ${
                  newListMusicians.length > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={
                  newListMusicians.length > 0
                    ? 'Knappen är otillgänglig eftersom nya listan redan innehåller musiker.'
                    : 'Kopiera hela listan till nya listan'
                }
              >
                Kopiera lista
              </button>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {selectedList?.musicians.map((musician, index) => {
                const isInNewList = isMusicianInNewList(musician.id)
                return (
                  <div
                    key={musician.id}
                    className={`mb-2 p-3 border rounded-lg flex items-center justify-between ${
                      isInNewList
                        ? 'bg-gray-50 text-gray-400 line-through'
                        : 'bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !isInNewList && addMusicianToNewList(musician)}
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-3">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium">
                        {musician.firstName} {musician.lastName}
                      </span>
                    </div>
                    {!isInNewList && (
                      <span className="text-green-600 text-sm">+</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column - All qualified musicians */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-2">Alla kvalificerade musiker</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Sök musiker..."
                  value={musicianSearch}
                  onChange={(e) => setMusicianSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {filteredMusicians.map(musician => {
                const isInNewList = isMusicianInNewList(musician.id)
                return (
                  <div
                    key={musician.id}
                    className={`mb-2 p-3 border rounded-lg flex items-center justify-between ${
                      isInNewList
                        ? 'bg-gray-50 text-gray-400 line-through'
                        : 'bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !isInNewList && addMusicianToNewList(musician)}
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {musician.firstName} {musician.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        • {musician.listStatus}
                      </span>
                    </div>
                    {!isInNewList && (
                      <span className="text-green-600 text-sm">+</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Spara som mall för framtida projekt
                </span>
              </label>
              {saveAsTemplate && (
                <input
                  type="text"
                  placeholder="Mallnamn..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              )}
            </div>
            
            <button
              onClick={saveCustomList}
              disabled={saving || newListMusicians.length === 0}
              className={`px-6 py-2 text-sm font-medium rounded-lg ${
                saving || newListMusicians.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Sparar...' : 'Spara lista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}