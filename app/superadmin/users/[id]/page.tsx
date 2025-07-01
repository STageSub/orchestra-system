'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Key, User, Shield, Calendar } from 'lucide-react'

interface UserDetails {
  id: string
  email: string
  name?: string
  role: string
  lastLoginAt?: string
  emailVerified?: string
  createdAt: string
  updatedAt: string
  tenantId?: string
  tenant?: {
    id: string
    name: string
    subdomain: string
  }
}

interface Tenant {
  id: string
  name: string
  subdomain: string
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    tenantId: ''
  })

  useEffect(() => {
    fetchUser()
    fetchTenants()
  }, [params.id])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/superadmin/users/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setFormData({
          email: data.email,
          name: data.name || '',
          role: data.role,
          tenantId: data.tenantId || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updateData: any = { ...formData }
      if (showPasswordForm && newPassword) {
        updateData.password = newPassword
      }

      const response = await fetch(`/api/superadmin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        alert('Användare uppdaterad!')
        setShowPasswordForm(false)
        setNewPassword('')
        fetchUser()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte uppdatera användare')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Kunde inte uppdatera användare')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill radera denna användare?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/superadmin/users/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Användare raderad!')
        router.push('/superadmin/users')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte radera användare')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Kunde inte radera användare')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Aldrig'
    const date = new Date(dateString)
    return `${date.toLocaleDateString('sv-SE')} ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (isLoading) {
    return <div>Laddar användare...</div>
  }

  if (!user) {
    return <div>Användare hittades inte</div>
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/superadmin/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Redigera användare</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Sparar...' : 'Spara'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Raderar...' : 'Radera'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Användarinformation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Namn</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Ingen namn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-post</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Roll</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="user">Användare</option>
                </select>
              </div>

              {formData.role !== 'superadmin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organisation</label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">Välj organisation</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.subdomain})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Lösenord</h2>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showPasswordForm ? 'Avbryt' : 'Ändra lösenord'}
              </button>
            </div>
            
            {showPasswordForm ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nytt lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Minst 8 tecken"
                  minLength={8}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Lämna tomt för att behålla nuvarande lösenord
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Klicka på "Ändra lösenord" för att sätta ett nytt lösenord
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivitet</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Senast inloggad</span>
                </div>
                <p className="text-sm font-medium">{formatDateTime(user.lastLoginAt)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Shield className="w-4 h-4" />
                  <span>E-post verifierad</span>
                </div>
                <p className="text-sm font-medium">
                  {user.emailVerified ? formatDateTime(user.emailVerified) : 'Nej'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  <span>Skapad</span>
                </div>
                <p className="text-sm font-medium">{formatDateTime(user.createdAt)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Key className="w-4 h-4" />
                  <span>Senast uppdaterad</span>
                </div>
                <p className="text-sm font-medium">{formatDateTime(user.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Information</h3>
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Användar-ID</p>
                <p className="font-mono text-xs">{user.id}</p>
              </div>
              {user.tenant && (
                <div>
                  <p className="text-gray-600">Organisation</p>
                  <p className="font-medium">{user.tenant.name}</p>
                  <p className="text-xs text-gray-500">{user.tenant.subdomain}.stagesub.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}