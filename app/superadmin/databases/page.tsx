'use client'

import { useEffect, useState } from 'react'
import { Database, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

interface DatabaseInfo {
  tenantId: string
  tenantName: string
  subdomain: string
  databaseType: 'shared' | 'dedicated'
  databaseUrl?: string
  connectionStatus: 'connected' | 'error' | 'checking'
  size?: string
  lastBackup?: string
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDatabases()
  }, [])

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/superadmin/databases')
      if (response.ok) {
        const data = await response.json()
        setDatabases(data)
      }
    } catch (error) {
      console.error('Failed to fetch databases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (tenantId: string) => {
    setDatabases(prev => prev.map(db => 
      db.tenantId === tenantId ? { ...db, connectionStatus: 'checking' } : db
    ))

    try {
      const response = await fetch(`/api/superadmin/databases/${tenantId}/test`, {
        method: 'POST'
      })
      const result = await response.json()
      
      setDatabases(prev => prev.map(db => 
        db.tenantId === tenantId 
          ? { ...db, connectionStatus: result.success ? 'connected' : 'error' }
          : db
      ))
    } catch (error) {
      setDatabases(prev => prev.map(db => 
        db.tenantId === tenantId ? { ...db, connectionStatus: 'error' } : db
      ))
    }
  }

  if (isLoading) {
    return <div>Laddar databaser...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Databashantering</h1>
        <p className="mt-2 text-gray-600">
          Hantera databaskopplingar för alla tenants
        </p>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delad databas</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {databases.filter(db => db.databaseType === 'shared').length}
              </p>
            </div>
            <Database className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dedikerade databaser</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {databases.filter(db => db.databaseType === 'dedicated').length}
              </p>
            </div>
            <Database className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total storlek</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                Coming soon
              </p>
            </div>
            <Database className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Database List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Alla databaser</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {databases.map((db) => (
                <tr key={db.tenantId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {db.tenantName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {db.subdomain}.stagesub.com
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      db.databaseType === 'dedicated' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {db.databaseType === 'dedicated' ? 'Dedikerad' : 'Delad'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {db.connectionStatus === 'checking' ? (
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin mr-2" />
                      ) : db.connectionStatus === 'connected' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : db.connectionStatus === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      ) : null}
                      <span className="text-sm text-gray-900">
                        {db.connectionStatus === 'checking' ? 'Kontrollerar...' :
                         db.connectionStatus === 'connected' ? 'Ansluten' :
                         db.connectionStatus === 'error' ? 'Fel' : 'Okänd'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleTestConnection(db.tenantId)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Testa anslutning
                    </button>
                    {db.databaseType === 'shared' && (
                      <button className="text-purple-600 hover:text-purple-900">
                        Migrera till dedikerad
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Migration Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Om databasmigration
        </h3>
        <p className="text-sm text-blue-800">
          Institution-planer kan migrera från delad databas till en dedikerad databas för bättre 
          prestanda och isolering. Migrationen görs utan driftstopp och tar vanligtvis 5-10 minuter 
          beroende på datamängd.
        </p>
      </div>
    </div>
  )
}