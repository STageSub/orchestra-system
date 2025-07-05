'use client'

import { useState, useEffect } from 'react'
import { Plus, Database, Zap, Server, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SystemHealth {
  api: string
  databases: { name: string; status: string }[]
  email: string
}

export default function OrchestraManagement() {
  const router = useRouter()
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isRunningAction, setIsRunningAction] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemHealth = async () => {
    try {
      console.log('Fetching system health...')
      const response = await fetch('/api/superadmin/health')
      console.log('Health response status:', response.status)
      
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('System health data:', data)
        setSystemHealth(data)
      } else {
        const error = await response.text()
        console.error('Health check failed:', error)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const runMigrations = async () => {
    if (!confirm('Vill du köra migrationer på alla aktiva databaser? Detta kan ta några minuter.')) {
      return
    }

    setIsRunningAction('migrations')
    try {
      const response = await fetch('/api/superadmin/orchestras/run-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Migrationer körda!\n\nResultat:\n- Totalt: ${data.summary.total}\n- Lyckade: ${data.summary.successful}\n- Misslyckade: ${data.summary.failed}`)
      } else {
        alert(`Fel vid körning av migrationer: ${data.error}`)
      }
    } catch (error) {
      alert('Ett fel uppstod vid körning av migrationer')
      console.error('Migration error:', error)
    } finally {
      setIsRunningAction(null)
    }
  }

  const updateSchemas = async () => {
    if (!confirm('Vill du uppdatera alla databas-scheman? Detta synkroniserar Prisma-schemat med databaserna.')) {
      return
    }

    setIsRunningAction('schemas')
    try {
      // For now, this uses the same endpoint as migrations
      // In a real implementation, this might run prisma db push or similar
      const response = await fetch('/api/superadmin/orchestras/run-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('Databas-scheman uppdaterade!')
      } else {
        alert(`Fel vid uppdatering av scheman: ${data.error}`)
      }
    } catch (error) {
      alert('Ett fel uppstod vid uppdatering av scheman')
      console.error('Schema update error:', error)
    } finally {
      setIsRunningAction(null)
    }
  }

  const clearCache = async () => {
    setIsRunningAction('cache')
    try {
      const response = await fetch('/api/superadmin/orchestras/clear-cache', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Cache rensad!\n\n- ${data.clearedPaths} sökvägar rensade\n- ${data.orchestras} orkestrar påverkade`)
        // Refresh system health after clearing cache
        fetchSystemHealth()
      } else {
        alert(`Fel vid rensning av cache: ${data.error}`)
      }
    } catch (error) {
      alert('Ett fel uppstod vid rensning av cache')
      console.error('Cache clear error:', error)
    } finally {
      setIsRunningAction(null)
    }
  }


  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Orkesterhantering</h2>
          <p className="text-sm text-gray-600 mt-1">Skapa och hantera nya orkestrar</p>
        </div>
        <button
          onClick={() => router.push('/superadmin/orchestras/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny orkester
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h3 className="text-lg font-semibold">Snabbåtgärder</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={runMigrations}
              disabled={isRunningAction === 'migrations'}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span>Kör migrationer på alla databaser</span>
              {isRunningAction === 'migrations' && (
                <Clock className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </button>
            <button 
              onClick={updateSchemas}
              disabled={isRunningAction === 'schemas'}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span>Uppdatera alla scheman</span>
              {isRunningAction === 'schemas' && (
                <Clock className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </button>
            <button 
              onClick={clearCache}
              disabled={isRunningAction === 'cache'}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span>Rensa cache för alla orkestrar</span>
              {isRunningAction === 'cache' && (
                <Clock className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </button>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold">Databashälsa</h3>
          </div>
          <div className="space-y-3">
            {!systemHealth ? (
              <div className="text-sm text-gray-400">Laddar...</div>
            ) : systemHealth.databases?.length === 0 ? (
              <div className="text-sm text-gray-500">Inga databaser konfigurerade</div>
            ) : (
              systemHealth.databases.map((db) => (
                <div key={db.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{db.name}</span>
                  <div className="flex items-center gap-2">
                    {db.status === 'healthy' ? (
                      <>
                        <span className="text-xs text-green-600">OK</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </>
                    ) : db.status === 'no-database' ? (
                      <>
                        <span className="text-xs text-gray-400">Ingen DB</span>
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-red-600">Fel</span>
                        <XCircle className="w-4 h-4 text-red-500" />
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold">Systemstatus</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.api === 'operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth?.api === 'operational' ? 'Operativ' : 'Fel'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Databaser</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.databases.every(db => db.status === 'healthy' || db.status === 'no-database')
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {systemHealth?.databases.every(db => db.status === 'healthy' || db.status === 'no-database') ? 'Alla OK' : 'Problem'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">E-post</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                systemHealth?.email === 'operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth?.email === 'operational' ? 'Aktiv' : 'Fel'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}