'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Building, CheckCircle, Loader2 } from 'lucide-react'

interface AdminCredentials {
  username: string
  password: string
  email: string
}

export default function NewOrchestraPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials | null>(null)
  
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
      
      // Store admin credentials if provided
      if (result.adminCredentials) {
        setAdminCredentials(result.adminCredentials)
      }
      
      setSuccess(true)
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

  // Show success screen if orchestra was created
  if (success && adminCredentials) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Orkester skapad!</h2>
            <p className="mt-2 text-gray-600">
              {formData.name} har skapats framgångsrikt
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">Administratörsinloggning</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Användarnamn:</span> {adminCredentials.username}</p>
              <p><span className="font-medium">Lösenord:</span> {adminCredentials.password}</p>
              <p><span className="font-medium">E-post:</span> {adminCredentials.email}</p>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              ⚠️ Spara dessa uppgifter säkert! Lösenordet visas bara denna gång.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/superadmin')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tillbaka till översikten
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isSubmitting) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Skapar orkester...</h2>
          <p className="text-gray-600">Detta kan ta några sekunder</p>
        </div>
      </div>
    )
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
                pattern="[a-z0-9\-]+"
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
            <Building className="w-4 h-4" />
            {isSubmitting ? 'Skapar orkester och databas...' : 'Skapa Orkester'}
          </button>
        </div>

      </form>
    </div>
  )
}