'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Shield, Calendar, Edit2, Trash2, Plus } from 'lucide-react'

interface UserData {
  id: string
  username: string
  email: string
  role: string
  active: boolean
  lastLogin: string | null
  createdAt: string
  orchestra?: {
    id: string
    name: string
    orchestraId: string
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [orchestras, setOrchestras] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
    fetchOrchestras()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...')
      const response = await fetch('/api/superadmin/users')
      console.log('Users response status:', response.status)
      
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('Users data:', data)
        console.log('Number of users:', data.users?.length || 0)
        setUsers(data.users || [])
      } else {
        const error = await response.text()
        console.error('Failed to fetch users:', error)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrchestras = async () => {
    try {
      const response = await fetch('/api/superadmin/metrics')
      if (response.ok) {
        const data = await response.json()
        setOrchestras(data.orchestras || [])
      }
    } catch (error) {
      console.error('Failed to fetch orchestras:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Superadmin'
      case 'admin': return 'Admin'
      case 'user': return 'Användare'
      default: return role
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    try {
      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
          role: formData.get('role'),
          orchestraId: formData.get('orchestraId') || null
        })
      })

      if (response.ok) {
        alert('Användare skapad!')
        setShowCreateModal(false)
        fetchUsers()
        form.reset()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte skapa användare')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Ett fel uppstod')
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    try {
      const response = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password') || undefined,
          role: formData.get('role'),
          active: formData.get('active') === 'true',
          orchestraId: formData.get('orchestraId') || null
        })
      })

      if (response.ok) {
        alert('Användare uppdaterad!')
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte uppdatera användare')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Ett fel uppstod')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna användare?')) {
      return
    }

    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Användare borttagen!')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort användare')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Ett fel uppstod')
    }
  }

  if (isLoading) {
    return <div className="p-8">Laddar användare...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Användarhantering</h2>
          <p className="text-sm text-gray-600 mt-1">Hantera användare och deras behörigheter</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny användare
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Användare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orkester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senaste inloggning
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Inga användare hittades. Klicka på "Ny användare" för att skapa en.
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.orchestra?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('sv-SE') : 'Aldrig'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Redigera"
                        onClick={() => {
                          setEditingUser(user)
                          setShowEditModal(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Ta bort"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Skapa ny användare</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Användarnamn</label>
                <input
                  type="text"
                  name="username"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-post</label>
                <input
                  type="email"
                  name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lösenord</label>
                <input
                  type="password"
                  name="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Roll</label>
                <select
                  name="role"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="user">Användare</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Orkester (valfritt)</label>
                <select
                  name="orchestraId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">-- Ingen orkester --</option>
                  {orchestras.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Skapa användare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Redigera användare</h3>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Användarnamn</label>
                <input
                  type="text"
                  name="username"
                  defaultValue={editingUser.username}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-post</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nytt lösenord (lämna tomt för att behålla)</label>
                <input
                  type="password"
                  name="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Roll</label>
                <select
                  name="role"
                  defaultValue={editingUser.role}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="user">Användare</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="active"
                  defaultValue={editingUser.active ? 'true' : 'false'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="true">Aktiv</option>
                  <option value="false">Inaktiv</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Orkester</label>
                <select
                  name="orchestraId"
                  defaultValue={editingUser.orchestra?.id || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">-- Ingen orkester --</option>
                  {orchestras.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Spara ändringar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}