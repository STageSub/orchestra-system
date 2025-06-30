'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Position {
  id: number
  positionId: string
  name: string
  hierarchyLevel: number
}

interface Instrument {
  id: number
  instrumentId: string
  name: string
  displayOrder: number | null
  isArchived: boolean
  positions: Position[]
}

export default function EditInstrumentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [paramsId, setParamsId] = useState<string | null>(null)
  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    displayOrder: ''
  })
  const [editingPosition, setEditingPosition] = useState<number | null>(null)
  const [positionName, setPositionName] = useState('')

  useEffect(() => {
    params.then(p => {
      setParamsId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (paramsId) {
      fetchInstrument()
    }
  }, [paramsId])

  const fetchInstrument = async () => {
    if (!paramsId) return
    
    try {
      const response = await fetch(`/api/instruments/${paramsId}`)
      const data = await response.json()
      setInstrument(data)
      setFormData({
        name: data.name,
        displayOrder: data.displayOrder?.toString() || ''
      })
    } catch (error) {
      console.error('Error fetching instrument:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/instruments/${paramsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null
        })
      })

      if (response.ok) {
        router.push('/admin/instruments')
      }
    } catch (error) {
      console.error('Error updating instrument:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePosition = async (positionId: number) => {
    if (!positionName.trim()) return

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: positionName.trim() })
      })

      if (response.ok) {
        setEditingPosition(null)
        setPositionName('')
        fetchInstrument()
      }
    } catch (error) {
      console.error('Error updating position:', error)
    }
  }

  const handleDeletePosition = async (positionId: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna tjänst?')) return

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchInstrument()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort tjänsten')
      }
    } catch (error) {
      console.error('Error deleting position:', error)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Är du säker på att du vill arkivera detta instrument?')) return

    setArchiving(true)
    try {
      const response = await fetch(`/api/instruments/${paramsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null,
          isArchived: true
        })
      })

      if (response.ok) {
        alert('Instrumentet har arkiverats')
        fetchInstrument()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte arkivera instrumentet')
      }
    } catch (error) {
      console.error('Error archiving instrument:', error)
      alert('Ett fel uppstod vid arkivering')
    } finally {
      setArchiving(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Vill du återställa detta instrument från arkivet?')) return

    setArchiving(true)
    try {
      const response = await fetch(`/api/instruments/${paramsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null,
          isArchived: false
        })
      })

      if (response.ok) {
        alert('Instrumentet har återställts')
        fetchInstrument()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte återställa instrumentet')
      }
    } catch (error) {
      console.error('Error restoring instrument:', error)
      alert('Ett fel uppstod vid återställning')
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar instrument...</p>
      </div>
    )
  }

  if (!instrument) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Instrument hittades inte</p>
        <Link
          href="/admin/instruments"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Tillbaka till instrument
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/instruments"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till instrument
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Redigera instrument</h2>
          {instrument?.isArchived && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Arkiverad
            </span>
          )}
        </div>
      </div>

      {instrument?.isArchived && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Instrumentet är arkiverat</h3>
              <p className="mt-1 text-sm text-red-700">
                Detta instrument är inte tillgängligt för nya projekt eller förfrågningar. 
                Klicka på "Återställ" för att göra instrumentet aktivt igen.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grundinformation</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Instrumentnamn
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

          </div>

          <div className="mt-6 flex justify-between">
            <div>
              {instrument?.isArchived ? (
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={archiving}
                  className="px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {archiving ? 'Återställer...' : 'Återställ'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {archiving ? 'Arkiverar...' : 'Arkivera instrument'}
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/instruments"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Avbryt
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tjänster/Kvalifikationer</h3>
        
        {instrument.positions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Inga tjänster registrerade
          </p>
        ) : (
          <ul className="space-y-2">
            {instrument.positions
              .sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
              .map((position) => (
                <li key={position.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingPosition === position.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={positionName}
                        onChange={(e) => setPositionName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdatePosition(position.id)
                          }
                        }}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdatePosition(position.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPosition(null)
                          setPositionName('')
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{position.name}</p>
                        <p className="text-xs text-gray-500">Nivå {position.hierarchyLevel}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPosition(position.id)
                            setPositionName(position.name)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(position.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}