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
  preferredLanguage: string | null
  localResidence: boolean
  notes: string | null
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
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [musician, setMusician] = useState<Musician | null>(null)
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null)
  const [selectedPositions, setSelectedPositions] = useState<number[]>([])
  const [musicianId, setMusicianId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredLanguage: 'sv',
    localResidence: false,
    notes: ''
  })

  // Hämta musiker och instrument
  useEffect(() => {
    const loadData = async () => {
      const { id } = await params
      setMusicianId(id)
      
      Promise.all([
        fetch(`/api/musicians/${id}`).then(res => res.json()),
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
          preferredLanguage: musicianData.preferredLanguage || 'sv',
          localResidence: musicianData.localResidence,
          notes: musicianData.notes || ''
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
    }
    
    loadData()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { id } = await params
      const response = await fetch(`/api/musicians/${id}`, {
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

      router.push(`/admin/musicians/${musicianId}`)
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
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/admin/musicians/${musicianId}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Tillbaka till musikerprofil
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Redigera musiker - {musician.musicianId}
          </h1>
          <p className="mt-2 text-sm text-gray-600">Uppdatera musikerinformation</p>
        </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Grundinformation */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grundinformation</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
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
                className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
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
                className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
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
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
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
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
                Språk för e-post
              </label>
              <select
                id="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
              >
                <option value="sv">Svenska</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.localResidence}
                  onChange={(e) => setFormData({ ...formData, localResidence: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded transition-colors"
                />
                <span className="ml-2 text-sm text-gray-700">Lokalt boende</span>
              </label>
            </div>
          </div>
        </section>

        {/* Anteckningar */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Anteckningar</h2>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Interna anteckningar
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
              placeholder="Interna anteckningar om musikern..."
            />
          </div>
        </section>

        {/* Instrument och kvalifikationer */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrument och kvalifikationer</h2>
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
                className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors"
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
                <div className="space-y-2 border border-gray-200 rounded-md p-4 bg-gray-50">
                  {selectedInstrument.positions.map((position) => (
                    <label key={position.id} className="flex items-center hover:bg-white p-2 rounded transition-colors">
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded transition-colors"
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
        </section>

        {/* Knappar */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href={`/admin/musicians/${musicianId}`}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={saving || selectedPositions.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}