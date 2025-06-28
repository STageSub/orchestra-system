'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PositionInput {
  name: string
  hierarchyLevel: number
}

export default function NewInstrumentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    displayOrder: '',
  })
  const [positions, setPositions] = useState<PositionInput[]>([])
  const [newPositionName, setNewPositionName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null,
          positions: positions
        })
      })

      if (response.ok) {
        router.push('/admin/instruments')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte skapa instrument')
      }
    } catch (error) {
      console.error('Error creating instrument:', error)
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const addPosition = () => {
    if (newPositionName.trim()) {
      setPositions([
        ...positions,
        {
          name: newPositionName.trim(),
          hierarchyLevel: positions.length + 1
        }
      ])
      setNewPositionName('')
    }
  }

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index))
  }

  const movePosition = (fromIndex: number, toIndex: number) => {
    const newPositions = [...positions]
    const [movedItem] = newPositions.splice(fromIndex, 1)
    newPositions.splice(toIndex, 0, movedItem)
    
    // Update hierarchy levels
    setPositions(newPositions.map((pos, idx) => ({
      ...pos,
      hierarchyLevel: idx + 1
    })))
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
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Nytt instrument</h2>
        <p className="mt-1 text-sm text-gray-600">
          Skapa ett nytt instrument med dess tjänster/kvalifikationer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grundinformation</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Instrumentnamn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="T.ex. Violin, Viola, Cello"
              />
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                Visningsordning
              </label>
              <input
                type="number"
                id="displayOrder"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="1, 2, 3... (lämna tom för automatisk ordning)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Bestämmer i vilken ordning instrumentet visas i listor
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tjänster/Kvalifikationer</h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addPosition()
                  }
                }}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="T.ex. Förste konsertmästare, Stämledare, Tutti"
              />
              <button
                type="button"
                onClick={addPosition}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Lägg till
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lägg till tjänster i hierarkisk ordning (högst till lägst)
            </p>
          </div>

          {positions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              Inga tjänster tillagda än. Lägg till minst en tjänst ovan.
            </p>
          ) : (
            <ul className="space-y-2">
              {positions.map((position, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => index > 0 && movePosition(index, index - 1)}
                        className={`text-gray-400 hover:text-gray-600 ${index === 0 ? 'invisible' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => index < positions.length - 1 && movePosition(index, index + 1)}
                        className={`text-gray-400 hover:text-gray-600 ${index === positions.length - 1 ? 'invisible' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{position.name}</p>
                      <p className="text-xs text-gray-500">Nivå {position.hierarchyLevel}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePosition(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/instruments"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.name || positions.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Skapar...' : 'Skapa instrument'}
          </button>
        </div>
      </form>
    </div>
  )
}