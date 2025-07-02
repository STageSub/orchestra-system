'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function NewOrchestraPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    contactEmail: '',
    contactName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/superadmin/orchestras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Kunde inte skapa orkester')
      }

      const result = await response.json()
      alert(`Orkester skapad! Databas: ${result.databaseName}`)
      router.push('/superadmin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate subdomain from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: name.toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Skapa Ny Orkester</h1>
        <p className="mt-2 text-gray-600">
          Skapa en ny orkester med egen databas och subdomän
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Orkesternamn *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Uppsala Symphony Orchestra"
            />
          </div>

          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
              Subdomän *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="subdomain"
                required
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="uppsala"
                pattern="[a-z0-9-]+"
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                .stagesub.com
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Endast små bokstäver, siffror och bindestreck
            </p>
          </div>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
              Kontaktperson *
            </label>
            <input
              type="text"
              id="contactName"
              required
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Anna Andersson"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
              E-postadress *
            </label>
            <input
              type="email"
              id="contactEmail"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="anna@uppsalasymfoni.se"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Avbryt
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
          >
            <Building2 className="w-4 h-4" />
            {isSubmitting ? 'Skapar...' : 'Skapa Orkester'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>OBS:</strong> För närvarande måste databasen skapas manuellt i Supabase/PostgreSQL.
            Detta formulär förbereder konfigurationen för den nya orkestern.
          </p>
        </div>
      </form>
    </div>
  )
}