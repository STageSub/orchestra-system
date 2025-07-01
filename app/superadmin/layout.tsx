'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, CreditCard, Activity, Database, Settings, LogOut, ChevronDown, BarChart3, ExternalLink, Package } from 'lucide-react'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false)

  useEffect(() => {
    // Check if user is superadmin
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/admin/login')
          return
        }
        
        const userData = await response.json()
        if (userData.role !== 'superadmin') {
          router.push('/admin')
          return
        }
        
        setUser(userData)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
    fetchTenants()
  }, [router])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Laddar...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                StageSub Superadmin
              </h1>
              <span className="ml-4 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                Superadmin
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Tenant Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowTenantSwitcher(!showTenantSwitcher)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Växla Tenant</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showTenantSwitcher && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border z-50">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium text-gray-700 px-2">Logga in som tenant</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {tenants.map((tenant) => (
                        <button
                          key={tenant.id}
                          onClick={async () => {
                            // Create a session for the tenant admin
                            const response = await fetch(`/api/superadmin/tenants/${tenant.id}/switch`, {
                              method: 'POST'
                            })
                            if (response.ok) {
                              // Open in new tab
                              window.open('/admin', '_blank')
                              setShowTenantSwitcher(false)
                            } else {
                              alert('Kunde inte växla till tenant')
                            }
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                            <p className="text-xs text-gray-500">{tenant.subdomain}.stagesub.com</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/superadmin"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-900"
                >
                  <Activity className="w-5 h-5" />
                  Översikt
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/tenants"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Building2 className="w-5 h-5" />
                  Tenants
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/users"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Users className="w-5 h-5" />
                  Användare
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/usage"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <BarChart3 className="w-5 h-5" />
                  Användning
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/subscriptions"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <CreditCard className="w-5 h-5" />
                  Prenumerationer
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/migration"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Package className="w-5 h-5" />
                  Migration
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/databases"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Database className="w-5 h-5" />
                  Databaser
                </Link>
              </li>
              <li>
                <Link
                  href="/superadmin/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700"
                >
                  <Settings className="w-5 h-5" />
                  Inställningar
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}