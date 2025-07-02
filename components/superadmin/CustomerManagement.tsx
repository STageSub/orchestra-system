'use client'

import { useState, useEffect } from 'react'
import { Database, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react'
import { Customer } from '@/lib/services/customer-service'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/superadmin/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      setError('Kunde inte hämta kunder')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = async (customer: Partial<Customer>) => {
    try {
      const response = await fetch('/api/superadmin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomers([...customers, newCustomer])
        setShowAddModal(false)
        alert('Kund skapad! Glöm inte att konfigurera databasen.')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte skapa kund')
      }
    } catch (error) {
      console.error('Failed to add customer:', error)
      alert('Kunde inte skapa kund')
    }
  }

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const response = await fetch(`/api/superadmin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomers(customers.map(c => c.id === id ? updatedCustomer : c))
        setEditingCustomer(null)
        alert('Kund uppdaterad!')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte uppdatera kund')
      }
    } catch (error) {
      console.error('Failed to update customer:', error)
      alert('Kunde inte uppdatera kund')
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Är du säker på att du vill ta bort ${customer.name}? Denna åtgärd kan inte ångras.`)) {
      return
    }

    try {
      const response = await fetch(`/api/superadmin/customers/${customer.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== customer.id))
        alert('Kund borttagen!')
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort kund')
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('Kunde inte ta bort kund')
    }
  }

  if (isLoading) {
    return <div>Laddar kunder...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Kundhantering</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lägg till kund
        </button>
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
                Kund
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subdomän
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontakt
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
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Database className="w-8 h-8 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.subdomain}.stagesub.com</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    customer.plan === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status === 'active' ? 'Aktiv' :
                     customer.status === 'pending' ? 'Väntar' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.contactEmail}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {customer.databaseUrl}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingCustomer(customer)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    className="text-red-600 hover:text-red-900"
                    disabled={customer.status === 'active'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerModal
          title="Lägg till ny kund"
          customer={{} as Customer}
          onSave={handleAddCustomer}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerModal
          title="Redigera kund"
          customer={editingCustomer}
          onSave={(updates) => handleUpdateCustomer(editingCustomer.id, updates)}
          onCancel={() => setEditingCustomer(null)}
        />
      )}
    </div>
  )
}

interface CustomerModalProps {
  title: string
  customer: Partial<Customer>
  onSave: (customer: Partial<Customer>) => void
  onCancel: () => void
}

function CustomerModal({ title, customer, onSave, onCancel }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    subdomain: customer.subdomain || '',
    contactEmail: customer.contactEmail || '',
    plan: customer.plan || 'small',
    status: customer.status || 'pending',
    databaseUrl: customer.databaseUrl || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kundnamn
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomän
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                className="flex-1 rounded-md border-gray-300"
                pattern="[a-z0-9-]+"
                required
              />
              <span className="ml-2 text-sm text-gray-500">.stagesub.com</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Endast små bokstäver, siffror och bindestreck
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontakt E-post
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
              className="w-full rounded-md border-gray-300"
            >
              <option value="small">Small ($299)</option>
              <option value="medium">Medium ($599)</option>
              <option value="enterprise">Enterprise ($999)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full rounded-md border-gray-300"
            >
              <option value="pending">Väntar</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Databas URL (valfritt)
            </label>
            <input
              type="text"
              value={formData.databaseUrl}
              onChange={(e) => setFormData({ ...formData, databaseUrl: e.target.value })}
              className="w-full rounded-md border-gray-300"
              placeholder="env:DATABASE_URL_SUBDOMAIN"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lämna tomt för att använda standard format
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Spara
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}