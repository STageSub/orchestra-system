'use client'

import { useState } from 'react'
import { Upload, UserPlus, Download, ArrowRight } from 'lucide-react'

interface AddMusiciansStepProps {
  orchestraName: string
  onNext: () => void
  onSkip: () => void
}

export default function AddMusiciansStep({ onNext, onSkip }: AddMusiciansStepProps) {
  const [method, setMethod] = useState<'manual' | 'import'>('manual')
  const [musicians, setMusicians] = useState<any[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    instrument: '',
    phone: ''
  })

  const handleAddMusician = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Vänligen fyll i alla obligatoriska fält')
      return
    }

    try {
      const response = await fetch('/api/musicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isActive: true
        })
      })

      if (response.ok) {
        const newMusician = await response.json()
        setMusicians([...musicians, newMusician])
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          instrument: '',
          phone: ''
        })
        alert('Musiker tillagd!')
      }
    } catch (error) {
      console.error('Failed to add musician:', error)
      alert('Kunde inte lägga till musiker')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Here you would implement CSV/Excel parsing
    alert('Import-funktionen kommer snart! För nu, använd manuell inmatning.')
  }

  const downloadTemplate = () => {
    const csv = 'Förnamn,Efternamn,E-post,Telefon,Instrument\nAnna,Andersson,anna@example.com,070-1234567,Violin\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'musiker-mall.csv'
    a.click()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Lägg till dina musiker</h2>
      <p className="text-gray-600 mb-6">
        Börja med att lägga till några musiker. Du kan alltid lägga till fler senare.
      </p>

      {/* Method selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMethod('manual')}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            method === 'manual' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <UserPlus className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <span className="block font-medium">Lägg till manuellt</span>
          <span className="text-sm text-gray-600">En musiker i taget</span>
        </button>

        <button
          onClick={() => setMethod('import')}
          className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
            method === 'import' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <span className="block font-medium">Importera från fil</span>
          <span className="text-sm text-gray-600">CSV eller Excel</span>
        </button>
      </div>

      {/* Content based on method */}
      {method === 'manual' ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Lägg till musiker</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Förnamn *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                  placeholder="Anna"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efternamn *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                  placeholder="Andersson"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-post *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border-gray-300"
                placeholder="anna@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                  placeholder="070-123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instrument
                </label>
                <input
                  type="text"
                  value={formData.instrument}
                  onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                  placeholder="Violin"
                />
              </div>
            </div>

            <button
              onClick={handleAddMusician}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
            >
              Lägg till musiker
            </button>
          </div>

          {musicians.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                Tillagda musiker: {musicians.length}
              </p>
              <div className="space-y-1">
                {musicians.slice(-3).map((m, i) => (
                  <div key={i} className="text-sm text-gray-700">
                    ✓ {m.firstName} {m.lastName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Importera musiker</h3>
          
          <div className="mb-4">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4" />
              Ladda ner CSV-mall
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Dra och släpp din fil här</p>
            <p className="text-sm text-gray-500 mb-4">eller</p>
            <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
              Välj fil
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Stödda format: CSV, Excel (.xlsx, .xls)</p>
            <p>Max filstorlek: 5 MB</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700"
        >
          Hoppa över detta steg
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          disabled={musicians.length === 0}
        >
          Fortsätt
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}