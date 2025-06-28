'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  localResidence: boolean
  isActive: boolean
  qualifications: Array<{
    position: {
      id: number
      name: string
      instrument: {
        id: number
        name: string
      }
    }
  }>
}

export default function EditMusicianPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [musician, setMusician] = useState<Musician | null>(null)
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null)
  const [selectedPositions, setSelectedPositions] = useState<number[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    localResidence: false
  })

  // Hämta musiker och instrument
  useEffect(() => {
    Promise.all([
      fetch(`/api/musicians/${params.id}`).then(res => res.json()),
      fetch('/api/instruments').then(res => res.json())
    ])
      .then(([musicianData, instrumentsData]) => {
        setMusician(musicianData)
        setInstruments(instrumentsData)
        
        // Sätt formulärdata
        setFormData({
          firstName: musicianData.firstName,
          lastName: musicianData.lastName,
          email: musicianData.email,
          phone: musicianData.phone || '',
          localResidence: musicianData.localResidence
        })
        
        // Sätt instrument och kvalifikationer
        if (musicianData.qualifications.length > 0) {
          const instrumentId = musicianData.qualifications[0].position.instrument.id
          setSelectedInstrumentId(instrumentId)
          setSelectedPositions(musicianData.qualifications.map(q => q.position.id))
        }
      })
      .catch(err => {
        console.error('Failed to fetch data:', err)
        setError('Kunde inte hämta musikerinformation')
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/musicians/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qualificationIds: selectedPositions,
          isActive: musician?.isActive
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Något gick fel')
      }

      router.push(`/admin/musicians/${params.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedInstrument = instruments.find(i => i.id === selectedInstrumentId)

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
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/admin/musicians/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till musikerprofil
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          Redigera musiker - {musician.musicianId}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        {/* Personuppgifter */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personuppgifter</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Förnamn *
              </label>
              <input
                type="text"
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Efternamn *
              </label>
              <input
                type="text"
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Kontaktuppgifter */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktuppgifter</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-postadress *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefonnummer
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="localResidence"
                checked={formData.localResidence}
                onChange={(e) => setFormData({ ...formData, localResidence: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="localResidence" className="ml-2 block text-sm text-gray-900">
                Lokalt boende
              </label>
            </div>
          </div>
        </div>

        {/* Instrument och kvalifikationer */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Instrument och kvalifikationer</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="instrument" className="block text-sm font-medium text-gray-700">
                Välj instrument *
              </label>
              <select
                id="instrument"
                required
                value={selectedInstrumentId || ''}
                onChange={(e) => {
                  setSelectedInstrumentId(Number(e.target.value))
                  setSelectedPositions([])
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Välj instrument...</option>
                {instruments.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedInstrument && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kvalifikationer för {selectedInstrument.name} *
                </label>
                <div className="space-y-2 border border-gray-200 rounded-md p-4">
                  {selectedInstrument.positions.map((position) => (
                    <label key={position.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={position.id}
                        checked={selectedPositions.includes(position.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPositions([...selectedPositions, position.id])
                          } else {
                            setSelectedPositions(selectedPositions.filter(id => id !== position.id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{position.name}</span>
                    </label>
                  ))}
                </div>
                {selectedPositions.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">Välj minst en kvalifikation</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Knappar */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Link
            href={`/admin/musicians/${params.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={saving || selectedPositions.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </form>
    </div>
  )
}