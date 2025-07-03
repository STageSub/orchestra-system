'use client'

import { useState, useEffect } from 'react'
import { Database, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Orchestra {
  id: string
  name: string
  subdomain: string
  contactName: string
  contactEmail: string
  databaseUrl?: string
  createdAt: string
  status: 'pending' | 'active' | 'inactive'
}

export default function OrchestraManagement() {
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrchestras()
  }, [])

  const fetchOrchestras = async () => {
    try {
      const response = await fetch('/api/superadmin/orchestras')
      if (response.ok) {
        const data = await response.json()
        setOrchestras(data)
      }
    } catch (error) {
      console.error('Failed to fetch orchestras:', error)
      setError('Kunde inte hämta orkestrar')
    } finally {
      setIsLoading(false)
    }
  }


  if (isLoading) {
    return <div>Laddar orkestrar...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Orkesterhantering</h2>
        <Link
          href="/superadmin/orchestras/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Skapa ny orkester
        </Link>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orkester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subdomän
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Databas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orchestras.map((orchestra) => (
              <tr key={orchestra.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Database className="w-8 h-8 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">
                      {orchestra.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{orchestra.subdomain}.stagesub.com</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">{orchestra.contactName}</div>
                    <div className="text-sm text-gray-500">{orchestra.contactEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    orchestra.status === 'active' ? 'bg-green-100 text-green-800' :
                    orchestra.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {orchestra.status === 'active' ? 'Aktiv' :
                     orchestra.status === 'pending' ? 'Väntar' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {orchestra.databaseUrl ? (
                    orchestra.status === 'active' ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Klar att använda</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Migrationer krävs</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Ej provisionerad</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {orchestra.databaseUrl ? (
                    <a
                      href={`https://${orchestra.subdomain}.stagesub.com/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Öppna Admin
                    </a>
                  ) : (
                    <span className="text-gray-500 italic">Väntar på databas...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orchestras.length === 0 && !error && (
        <div className="px-6 py-12 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Inga orkestrar skapade än</p>
          <p className="text-sm text-gray-400 mt-2">Klicka på "Skapa ny orkester" för att komma igång</p>
        </div>
      )}
    </div>
  )
}