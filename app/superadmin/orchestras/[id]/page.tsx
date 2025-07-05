'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building, Users, Settings, Activity } from 'lucide-react'
import OrchestraConfig from '@/components/superadmin/OrchestraConfig'

interface Orchestra {
  id: string
  name: string
  subdomain: string
  status: string
  plan: string
  contactEmail: string
  contactName: string
  createdAt: string
  maxMusicians: number
  maxProjects: number
  pricePerMonth: number
}

export default function OrchestraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orchestraId = params.id as string
  
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'users' | 'activity'>('overview')

  useEffect(() => {
    fetchOrchestra()
  }, [orchestraId])

  const fetchOrchestra = async () => {
    try {
      const response = await fetch(`/api/superadmin/orchestras/${orchestraId}`)
      if (response.ok) {
        const data = await response.json()
        setOrchestra(data)
      } else if (response.status === 404) {
        router.push('/superadmin')
      }
    } catch (error) {
      console.error('Failed to fetch orchestra:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">Laddar orkesterinformation...</div>
  }

  if (!orchestra) {
    return <div className="p-8">Orkester hittades inte</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{orchestra.name}</h1>
              <p className="text-gray-600">{orchestra.subdomain}.stagesub.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              orchestra.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {orchestra.status === 'active' ? 'Aktiv' : 'Inaktiv'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {orchestra.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Översikt
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Konfiguration
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Användare
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Aktivitet
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Grundinformation</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Kontaktperson</dt>
                <dd className="text-sm text-gray-900">{orchestra.contactName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">E-post</dt>
                <dd className="text-sm text-gray-900">{orchestra.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Skapad</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(orchestra.createdAt).toLocaleDateString('sv-SE')}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Prenumeration</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="text-sm text-gray-900 capitalize">{orchestra.plan}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max musiker</dt>
                <dd className="text-sm text-gray-900">{orchestra.maxMusicians}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Max projekt</dt>
                <dd className="text-sm text-gray-900">{orchestra.maxProjects}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pris per månad</dt>
                <dd className="text-sm text-gray-900">
                  {new Intl.NumberFormat('sv-SE', { 
                    style: 'currency', 
                    currency: 'SEK' 
                  }).format(orchestra.pricePerMonth)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      
      {activeTab === 'config' && (
        <OrchestraConfig 
          orchestraId={orchestraId} 
          orchestraName={orchestra.name} 
        />
      )}
      
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">Användarhantering kommer snart...</p>
        </div>
      )}
      
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">Aktivitetslogg kommer snart...</p>
        </div>
      )}
    </div>
  )
}