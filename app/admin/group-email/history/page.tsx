'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from '@/components/toast'

interface GroupEmailLog {
  id: number
  projectId: number | null
  subject: string
  message: string
  recipients: Array<{ email: string; name: string }>
  sentCount: number
  failedCount: number
  filters: {
    instruments?: number[]
    positions?: number[]
  } | null
  createdAt: string
  project: {
    id: number
    name: string
    weekNumber: number
  } | null
}

interface Project {
  id: number
  name: string
  weekNumber: number
  startDate?: string
}

export default function GroupEmailHistoryPage() {
  const [logs, setLogs] = useState<GroupEmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<GroupEmailLog | null>(null)
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  useEffect(() => {
    // Check if projectId is in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('projectId')
    if (projectId) {
      setSelectedProjectId(projectId)
    }
    
    // Fetch projects for dropdown
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Failed to fetch projects:', err))
    
    fetchLogs(projectId)
  }, [])
  
  useEffect(() => {
    fetchLogs(selectedProjectId || null)
  }, [selectedProjectId])

  const fetchLogs = async (projectId?: string | null) => {
    try {
      const url = projectId 
        ? `/api/group-email/history?projectId=${projectId}`
        : '/api/group-email/history'
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        if (data.code === 'TABLE_NOT_FOUND') {
          setError({
            message: data.error,
            details: data.details
          })
        } else {
          throw new Error(data.error || 'Failed to fetch logs')
        }
        return
      }
      
      setLogs(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching logs:', error)
      alert('Kunde inte hämta e-posthistorik')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar e-posthistorik...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">E-posthistorik</h2>
          <p className="mt-1 text-sm text-gray-600">
            Historik över skickade gruppmail
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error.message}</h3>
              {error.details && (
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.details}</p>
                  <p className="mt-2">
                    Kör följande SQL i Supabase SQL Editor för att skapa tabellen:
                  </p>
                  <pre className="mt-2 bg-red-100 p-3 rounded text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS "GroupEmailLog" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "recipients" JSONB NOT NULL,
  "sentCount" INTEGER NOT NULL,
  "failedCount" INTEGER NOT NULL,
  "filters" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupEmailLog_projectId_fkey" 
    FOREIGN KEY ("projectId") 
    REFERENCES "Project"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE
);`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">E-posthistorik</h2>
          <p className="mt-1 text-sm text-gray-600">
            Historik över skickade gruppmail
          </p>
        </div>
        <Link
          href="/admin/group-email"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Skicka nytt gruppmail
        </Link>
      </div>

      {/* Projektfilter */}
      <div className="mb-6">
        <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filtrera på projekt
        </label>
        <select
          id="project-filter"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Alla projekt</option>
          {(() => {
            let currentYear: number | null = null
            const options: JSX.Element[] = []
            
            // Sort projects by week number descending to ensure proper year grouping
            const sortedProjects = [...projects].sort((a, b) => {
              // If we have startDate, use it to determine year
              if (a.startDate && b.startDate) {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
              }
              // Otherwise use week numbers
              return b.weekNumber - a.weekNumber
            })
            
            sortedProjects.forEach((project) => {
              // Determine year from week number or startDate
              let projectYear: number
              if (project.startDate) {
                projectYear = new Date(project.startDate).getFullYear()
              } else {
                // Estimate year from week number (assuming current year for high weeks)
                const currentDate = new Date()
                projectYear = project.weekNumber > 26 ? currentDate.getFullYear() : currentDate.getFullYear()
              }
              
              // Add year separator if year changed
              if (currentYear !== projectYear) {
                currentYear = projectYear
                options.push(
                  <option key={`year-${projectYear}`} disabled className="font-bold bg-gray-100">
                    ───── {projectYear} ─────
                  </option>
                )
              }
              
              options.push(
                <option key={project.id} value={project.id}>
                  V. {project.weekNumber} {project.name}
                </option>
              )
            })
            
            return options
          })()}
        </select>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Inga gruppmail har skickats ännu</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {logs.map((log) => (
              <li key={log.id}>
                <button
                  onClick={() => setSelectedLog(log)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {log.subject}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        {log.project && (
                          <span>Projekt: V. {log.project.weekNumber} {log.project.name}</span>
                        )}
                        <span>
                          {log.sentCount} skickade
                          {log.failedCount > 0 && `, ${log.failedCount} misslyckade`}
                        </span>
                        <span>{log.recipients.length} mottagare</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  E-postdetaljer
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Information</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Skickat</dt>
                      <dd className="mt-1 text-gray-900">{formatDate(selectedLog.createdAt)}</dd>
                    </div>
                    {selectedLog.project && (
                      <div>
                        <dt className="text-gray-500">Projekt</dt>
                        <dd className="mt-1 text-gray-900">
                          V. {selectedLog.project.weekNumber} {selectedLog.project.name}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Antal mottagare</dt>
                      <dd className="mt-1 text-gray-900">{selectedLog.recipients.length}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className="text-green-600">{selectedLog.sentCount} skickade</span>
                        {selectedLog.failedCount > 0 && (
                          <span className="text-red-600 ml-2">{selectedLog.failedCount} misslyckade</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Ämne</h4>
                  <p className="text-sm text-gray-900">{selectedLog.subject}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Meddelande</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.message}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Mottagare ({selectedLog.recipients.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="text-sm text-gray-600 space-y-1">
                      {selectedLog.recipients.map((recipient, index) => (
                        <li key={index}>
                          {recipient.name} ({recipient.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}