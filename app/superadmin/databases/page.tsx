'use client'

import { useEffect, useState } from 'react'
import { Database, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { getConfiguredCustomers } from '@/lib/database-config'

interface DatabaseInfo {
  subdomain: string
  name: string
  status: 'active' | 'inactive' | 'pending'
  hasEnvVar: boolean
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])

  useEffect(() => {
    // Get configured customers from the config
    async function loadCustomers() {
      const customers = await getConfiguredCustomers()
      
      const dbInfo: DatabaseInfo[] = customers.map(subdomain => ({
        subdomain,
        name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Symphony Orchestra',
        status: 'active' as const,
        hasEnvVar: true
      }))

      // Add Uppsala if not already configured
      if (!customers.includes('uppsala')) {
        dbInfo.push({
          subdomain: 'uppsala',
          name: 'Uppsala Symphony Orchestra',
          status: 'pending' as const,
          hasEnvVar: false
        })
      }

      setDatabases(dbInfo)
    }
    
    loadCustomers()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Databaser</h1>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Konfigurerade databaser</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {databases.map(db => (
            <div key={db.subdomain} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium flex items-center gap-2">
                    {db.name}
                    {db.status === 'active' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {db.status === 'pending' && (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Subdomän: {db.subdomain}.stagesub.com
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {db.status === 'active' ? 'Aktiv' : 'Väntar på konfiguration'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Miljövariabel: DATABASE_URL_{db.subdomain.toUpperCase()} 
                    {db.hasEnvVar ? ' ✓' : ' ✗'}
                  </p>
                </div>
                
                {db.status === 'active' && (
                  <a
                    href={`http://${db.subdomain}.localhost:3000/admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Öppna
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              
              {db.status === 'pending' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded text-xs">
                  <p className="text-yellow-800">
                    För att aktivera: Lägg till DATABASE_URL_{db.subdomain.toUpperCase()} i .env.local
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Snabbguide:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Skapa ny databas i Supabase/PostgreSQL</li>
            <li>Lägg till DATABASE_URL_[SUBDOMAIN] i .env.local</li>
            <li>Kör migrations: <code className="text-xs bg-gray-200 px-1 rounded">npx prisma migrate deploy</code></li>
            <li>Seed data: <code className="text-xs bg-gray-200 px-1 rounded">npx ts-node scripts/seed-new-orchestra.ts</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}