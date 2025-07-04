'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

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

interface CreateCustomListModalProps {
  projectId: number
  positionId: number
  positionName: string
  instrumentName: string
  existingCustomListId?: number
  onClose: () => void
  onSuccess: (customListId: number) => void
}

export default function CreateCustomListModal({
  projectId,
  positionId,
  positionName,
  instrumentName,
  existingCustomListId,
  onClose,
  onSuccess
}: CreateCustomListModalProps) {
  const [project, setProject] = useState<any>(null)
  const [newListMusicians, setNewListMusicians] = useState<Musician[]>([])
  const [availableMusicians, setAvailableMusicians] = useState<Musician[]>([])
  const [existingLists, setExistingLists] = useState<{
    standardLists: ExistingList[],
    customLists: ExistingList[]
  }>({ standardLists: [], customLists: [] })
  const [selectedList, setSelectedList] = useState<ExistingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [musicianSearch, setMusicianSearch] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [listName, setListName] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
          if (!existingCustomListId) {
            setListName(`V. ${data.weekNumber}`)
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error)
      }
    }

    fetchProject()
  }, [projectId, existingCustomListId])

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // If editing existing custom list, fetch it first
        if (existingCustomListId) {
          const customListResponse = await fetch(
            `/api/projects/${projectId}/custom-lists/${existingCustomListId}`
          )
          if (customListResponse.ok) {
            const customListData = await customListResponse.json()
            setListName(customListData.name)
            setNewListMusicians(
              customListData.customRankings
                .sort((a: any, b: any) => a.rank - b.rank)
                .map((r: any) => r.musician)
            )
            setIsEditMode(true)
          }
        }

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
          // Select first standard list by default if not editing
          if (data.standardLists.length > 0 && !existingCustomListId) {
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
  }, [projectId, positionId, existingCustomListId])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(newListMusicians)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setNewListMusicians(items)
  }

  const addMusicianToNewList = (musician: Musician) => {
    if (newListMusicians.some(m => m.id === musician.id)) return
    setNewListMusicians([...newListMusicians, musician])
  }

  const removeMusicianFromNewList = (musicianId: number) => {
    setNewListMusicians(newListMusicians.filter(m => m.id !== musicianId))
  }

  const copyEntireList = () => {
    if (!selectedList || newListMusicians.length > 0) return
    setNewListMusicians([...selectedList.musicians])
  }

  const saveCustomList = async () => {
    if (newListMusicians.length === 0) {
      alert('Listan är tom. Lägg till minst en musiker.')
      return
    }

    setSaving(true)
    try {
      if (isEditMode && existingCustomListId) {
        // Update existing list
        const response = await fetch(
          `/api/projects/${projectId}/custom-lists/${existingCustomListId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: listName,
              musicians: newListMusicians.map(m => m.id)
            })
          }
        )

        if (response.ok) {
          alert('Lista uppdaterad!')
          onSuccess(existingCustomListId)
        } else {
          const error = await response.json()
          alert(error.error || 'Ett fel uppstod vid uppdatering av lista')
        }
      } else {
        // Create new list
        const requestBody = {
          positionId: parseInt(positionId.toString()),
          musicians: newListMusicians.map(m => m.id),
          saveAsTemplate,
          templateName: saveAsTemplate ? templateName : null
        }

        const response = await fetch(`/api/projects/${projectId}/custom-lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (response.ok) {
          const data = await response.json()
          alert(`Lista skapad! ${data.musicianCount} musiker tillagda.`)
          onSuccess(data.id)
        } else {
          const error = await response.json()
          alert(error.error || 'Ett fel uppstod vid skapande av lista')
        }
      }
    } catch (error) {
      console.error('Error saving list:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const filteredMusicians = availableMusicians.filter(musician => {
    const searchLower = musicianSearch.toLowerCase()
    return (
      musician.firstName.toLowerCase().includes(searchLower) ||
      musician.lastName.toLowerCase().includes(searchLower) ||
      musician.email.toLowerCase().includes(searchLower)
    )
  })

  const isMusicianInNewList = (musicianId: number) => {
    return newListMusicians.some(m => m.id === musicianId)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Ändra befintlig lista' : 'Skapa ny lista'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {instrumentName} - {positionName} • {project?.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={saveCustomList}
                disabled={saving || newListMusicians.length === 0}
                className={`px-6 py-2 text-sm font-medium rounded-lg ${
                  saving || newListMusicians.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Sparar...' : (isEditMode ? 'Spara ändringar' : 'Spara lista')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* List name field for edit mode */}
          {isEditMode && (
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
          )}

          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left column - New list */}
            <div className="bg-white rounded-lg shadow ring-2 ring-blue-500">
              <div className="px-4 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-gray-900">
                    {listName || `V. ${project?.weekNumber}`} {project?.name}
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Din nya lista
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {newListMusicians.length} musiker • Dra för att ändra ordning
                </p>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="new-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-4"
                    >
                      {newListMusicians.length === 0 ? (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          <p className="text-sm text-gray-500">
                            Dra musiker hit för att bygga din lista
                          </p>
                        </div>
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
            {!isEditMode && (
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
                
                <div className="p-4">
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
            )}

            {/* Right column - All qualified musicians */}
            <div className={`bg-white rounded-lg shadow ${isEditMode ? 'col-span-2' : ''}`}>
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
              
              <div className="p-4">
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

          {/* Template options */}
          {!isEditMode && (
            <div className="mt-6 bg-white rounded-lg shadow p-4">
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
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}