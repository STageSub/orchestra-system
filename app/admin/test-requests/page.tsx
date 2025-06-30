'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/components/toast'

interface TestRequest {
  id: number
  requestId: string
  musician: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  project: string
  position: string
  status: string
  sentAt: string
  token?: string
}

interface EmailPreview {
  subject: string
  body: string
  to: string
}

export default function TestRequestsPage() {
  const [requests, setRequests] = useState<TestRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [selectedNeed, setSelectedNeed] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [projectNeeds, setProjectNeeds] = useState<any[]>([])
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    timedOut: 0,
    cancelled: 0
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      alert('Denna sida är endast tillgänglig i utvecklingsläge')
      window.location.href = '/admin'
      return
    }
    
    fetchRequests()
    fetchProjects()
    fetchStats()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/test/requests')
      if (response.ok) {
        const data = await response.json()
        const formattedRequests: TestRequest[] = []
        
        data.projects.forEach((project: any) => {
          project.projectNeeds.forEach((need: any) => {
            need.requests.forEach((request: any) => {
              formattedRequests.push({
                id: request.id,
                requestId: request.requestId,
                musician: {
                  id: request.musician.id,
                  firstName: request.musician.firstName,
                  lastName: request.musician.lastName,
                  email: request.musician.email
                },
                project: project.name,
                position: `${need.position.instrument.name} - ${need.position.name}`,
                status: request.status,
                sentAt: request.sentAt,
                token: request.requestTokens[0]?.token
              })
            })
          })
        })
        
        setRequests(formattedRequests)
      }
    } catch (error) {
      console.error('Error fetching test requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchProjectNeeds = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectNeeds(data.projectNeeds || [])
      }
    } catch (error) {
      console.error('Error fetching project needs:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/test/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const createTestRequest = async () => {
    if (!selectedNeed) {
      alert('Välj ett behov först')
      return
    }

    try {
      const response = await fetch('/api/test/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needId: selectedNeed.id })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Test-förfrågan skapad!')
        fetchRequests()
        fetchStats()
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte skapa test-förfrågan')
      }
    } catch (error) {
      console.error('Error creating test request:', error)
      alert('Ett fel uppstod')
    }
  }


  const previewEmail = async (requestId: number, type: string) => {
    try {
      const response = await fetch('/api/test/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, type })
      })

      if (response.ok) {
        const data = await response.json()
        setEmailPreview(data)
        setShowEmailPreview(true)
      } else {
        alert('Kunde inte förhandsgranska email')
      }
    } catch (error) {
      console.error('Error previewing email:', error)
      alert('Ett fel uppstod')
    }
  }

  const simulateResponse = async (requestId: number, response: 'accepted' | 'declined') => {
    try {
      const res = await fetch('/api/test/simulate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, response })
      })

      if (res.ok) {
        alert(`Svar simulerat: ${response === 'accepted' ? 'Accepterat' : 'Avböjt'}`)
        
        // Trigger toast notification for testing
        const req = requests.find(r => r.id === requestId)
        if (req) {
          if (response === 'accepted') {
            toast.success(
              `${req.musician.firstName} ${req.musician.lastName} har accepterat förfrågan för ${req.position}`,
              10000
            )
          } else {
            toast.error(
              `${req.musician.firstName} ${req.musician.lastName} har tackat nej till förfrågan för ${req.position}`,
              10000
            )
          }
        }
        
        fetchRequests()
        fetchStats()
      } else {
        alert('Kunde inte simulera svar')
      }
    } catch (error) {
      console.error('Error simulating response:', error)
      alert('Ett fel uppstod')
    }
  }

  const triggerReminders = async () => {
    try {
      const response = await fetch('/api/test/trigger-reminders', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Påminnelser körda! ${data.count} påminnelser skickade.`)
        fetchRequests()
      } else {
        alert('Kunde inte köra påminnelser')
      }
    } catch (error) {
      console.error('Error triggering reminders:', error)
      alert('Ett fel uppstod')
    }
  }

  const triggerTimeouts = async () => {
    try {
      const response = await fetch('/api/test/trigger-timeouts', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Timeouts körda! ${data.count} förfrågningar timeout:ade.`)
        fetchRequests()
        fetchStats()
      } else {
        alert('Kunde inte köra timeouts')
      }
    } catch (error) {
      console.error('Error triggering timeouts:', error)
      alert('Ett fel uppstod')
    }
  }

  const clearTestData = async () => {
    if (!confirm('Är du säker på att du vill rensa all testdata?')) return

    try {
      const response = await fetch('/api/test/clear', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Testdata rensad!')
        fetchRequests()
        fetchStats()
      } else {
        alert('Kunde inte rensa testdata')
      }
    } catch (error) {
      console.error('Error clearing test data:', error)
      alert('Ett fel uppstod')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE')
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Utvecklingsverktyg</strong> - Endast för testning av förfrågningssystemet
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Test Requests</h2>
          <p className="mt-1 text-sm text-gray-600">
            Testa förfrågningssystemet utan att skicka riktiga emails
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Totalt</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Väntar</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Accepterade</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">{stats.accepted}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Avböjda</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">{stats.declined}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Avbrutna</div>
            <div className="mt-1 text-2xl font-semibold text-gray-500">{stats.cancelled}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Timeout</div>
            <div className="mt-1 text-2xl font-semibold text-gray-600">{stats.timedOut}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={triggerReminders}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔔 Kör påminnelser
            </button>
            <button
              onClick={triggerTimeouts}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              ⏰ Kör timeouts
            </button>
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ➕ Skapa test-förfrågan
            </button>
            <button
              onClick={clearTestData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ Rensa testdata
            </button>
          </div>
        </div>

        {/* Test Panel */}
        {showTestPanel && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Skapa test-förfrågan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Välj projekt
                  </label>
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === parseInt(e.target.value))
                      setSelectedProject(project)
                      if (project) {
                        fetchProjectNeeds(project.id)
                        setSelectedNeed(null)
                      }
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">-- Välj projekt --</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} (Vecka {project.weekNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && projectNeeds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Välj behov
                    </label>
                    <select
                      value={selectedNeed?.id || ''}
                      onChange={(e) => {
                        const need = projectNeeds.find(n => n.id === parseInt(e.target.value))
                        setSelectedNeed(need)
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">-- Välj behov --</option>
                      {projectNeeds.map((need) => (
                        <option key={need.id} value={need.id}>
                          {need.position.instrument.name} - {need.position.name} ({need.quantity} st)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={createTestRequest}
                  disabled={!selectedNeed}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skapa test-förfrågan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Test-förfrågningar</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Laddar...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Inga test-förfrågningar finns</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Musiker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projekt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skickad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.requestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.musician.firstName} {request.musician.lastName}
                        <br />
                        <span className="text-xs text-gray-400">{request.musician.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.project}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          request.status === 'declined' ? 'bg-red-100 text-red-800' :
                          request.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          request.status === 'timed_out' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'cancelled' ? 'Avbruten' : request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.sentAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => previewEmail(request.id, 'request')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️ Förhandsgranska
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => simulateResponse(request.id, 'accepted')}
                                className="text-green-600 hover:text-green-900"
                              >
                                ✅ Simulera JA
                              </button>
                              <button
                                onClick={() => simulateResponse(request.id, 'declined')}
                                className="text-red-600 hover:text-red-900"
                              >
                                ❌ Simulera NEJ
                              </button>
                            </>
                          )}
                          {request.token && (
                            <a
                              href={`/respond?token=${request.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              🔗 Öppna svarssida
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Email Preview Modal */}
        {showEmailPreview && emailPreview && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">E-post förhandsgranskning</h3>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Till:</label>
                  <p className="mt-1 text-sm text-gray-900">{emailPreview.to}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ämne:</label>
                  <p className="mt-1 text-sm text-gray-900">{emailPreview.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Innehåll:</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: emailPreview.body }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}