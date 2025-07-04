'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/toast'

interface CustomList {
  id: number
  customListId: string
  name: string
  position: {
    id: number
    name: string
    instrument: string
  }
  musicianCount: number
  isInUse: boolean
  projectNeedsCount: number
  createdAt: string
  isTemplate: boolean
  templateName: string | null
}

interface Project {
  id: number
  projectId: string
  name: string
  weekNumber: number
}

export default function CustomListsOverviewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    listId: number
    listName: string
  } | null>(null)

  // Initialize params
  useEffect(() => {
    params.then(p => setProjectId(p.id))
  }, [params])

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

  // Fetch custom lists
  useEffect(() => {
    if (!projectId) return

    fetchCustomLists()
  }, [projectId])

  const fetchCustomLists = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/custom-lists/all`)
      if (response.ok) {
        const data = await response.json()
        setCustomLists(data.customLists || [])
      } else {
        console.error('Failed to fetch custom lists')
        setCustomLists([])
      }
    } catch (error) {
      console.error('Error fetching custom lists:', error)
      setCustomLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (listId: number) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/custom-lists/${listId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('Lista raderad')
        fetchCustomLists()
      } else {
        const error = await response.json()
        if (error.error === 'Cannot delete custom list that is in use') {
          toast.error('Kan inte radera lista som används av projektbehov')
        } else {
          toast.error(error.error || 'Kunde inte radera listan')
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Ett fel uppstod vid borttagning')
    } finally {
      setDeleteConfirmation(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar listor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
                <span className="text-gray-900">Anpassade listor</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Anpassade listor
              </h1>
              {project && (
                <p className="text-sm text-gray-600 mt-1">
                  {project.name} • Vecka {project.weekNumber}
                </p>
              )}
            </div>
            <Link
              href={`/admin/projects/${projectId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tillbaka till projekt
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {customLists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Inga anpassade listor
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Det finns inga anpassade listor för detta projekt än.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Skapa anpassade listor när du definierar nya musikerbehov.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Totalt antal listor</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {customLists.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Listor i användning</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {customLists.filter(list => list.isInUse).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Lists table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Antal musiker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skapad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customLists.map((list) => (
                    <tr key={list.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {list.name}
                          </div>
                          {list.isTemplate && (
                            <div className="text-xs text-gray-500">
                              Mall: {list.templateName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {list.position.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {list.position.instrument}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {list.musicianCount} musiker
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {list.isInUse ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Används ({list.projectNeedsCount} behov)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Ej i bruk
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(list.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/projects/${projectId}/custom-lists/${list.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Redigera
                          </Link>
                          {!list.isInUse && (
                            <button
                              onClick={() => setDeleteConfirmation({
                                listId: list.id,
                                listName: list.name
                              })}
                              className="text-red-600 hover:text-red-900"
                            >
                              Ta bort
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg
                  className="w-12 h-12 text-red-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ta bort lista
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Denna åtgärd kan inte ångras
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Är du säker på att du vill ta bort listan{' '}
                <span className="font-semibold">{deleteConfirmation.listName}</span>?
              </p>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmation.listId)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Ta bort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}