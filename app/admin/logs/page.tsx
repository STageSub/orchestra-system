'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

interface SystemLog {
  id: string
  timestamp: string
  level: string
  category: string
  message: string
  metadata?: any
  userId?: string
  orchestraId?: string
  subdomain?: string
  ip?: string
  userAgent?: string
  requestId?: string
  duration?: number
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    search: ''
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const limit = 50

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString()
      })
      
      if (filters.level) params.append('level', filters.level)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/system-logs?${params}`)
      console.log('[Logs Page] API Response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Logs Page] Data received:', { logs: data.logs?.length, total: data.total })
        setLogs(data.logs)
        setTotal(data.total)
      } else {
        const errorText = await response.text()
        console.error('[Logs Page] API Error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchLogs()
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-500'
      case 'info': return 'text-blue-600'
      case 'warn': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-700'
    }
  }

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'debug': return 'bg-gray-100'
      case 'info': return 'bg-blue-50'
      case 'warn': return 'bg-yellow-50'
      case 'error': return 'bg-red-50'
      default: return 'bg-gray-50'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'bg-gray-200 text-gray-800'
      case 'auth': return 'bg-purple-200 text-purple-800'
      case 'email': return 'bg-green-200 text-green-800'
      case 'request': return 'bg-blue-200 text-blue-800'
      case 'test': return 'bg-orange-200 text-orange-800'
      case 'error': return 'bg-red-200 text-red-800'
      case 'api': return 'bg-indigo-200 text-indigo-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const renderMetadata = (metadata: any) => {
    if (!metadata) return null

    // Special handling for email logs
    if (metadata.recipients || metadata.recipientCount) {
      return (
        <div className="mt-2 space-y-2">
          {metadata.recipients && (
            <div className="bg-white rounded p-3 border border-gray-200">
              <h4 className="font-medium text-sm mb-2">Email Recipients ({metadata.recipientCount || metadata.recipients.length})</h4>
              <div className="space-y-1">
                {metadata.recipients.map((recipient: any, index: number) => (
                  <div key={index} className="text-xs flex items-center justify-between p-1 hover:bg-gray-50 rounded">
                    <span className="font-medium">{recipient.name || recipient.email}</span>
                    <span className="text-gray-500">{recipient.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {metadata.projectName && (
            <div className="text-sm">
              <span className="font-medium">Project:</span> {metadata.projectName}
            </div>
          )}
          {metadata.positionName && (
            <div className="text-sm">
              <span className="font-medium">Position:</span> {metadata.positionName}
            </div>
          )}
        </div>
      )
    }

    // Special handling for request logs
    if (metadata.musicianName || metadata.requestId) {
      return (
        <div className="mt-2 space-y-1">
          {metadata.musicianName && (
            <div className="text-sm">
              <span className="font-medium">Musician:</span> {metadata.musicianName}
            </div>
          )}
          {metadata.positionName && (
            <div className="text-sm">
              <span className="font-medium">Position:</span> {metadata.positionName}
            </div>
          )}
          {metadata.projectName && (
            <div className="text-sm">
              <span className="font-medium">Project:</span> {metadata.projectName}
            </div>
          )}
          {metadata.status && (
            <div className="text-sm">
              <span className="font-medium">Status:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                metadata.status === 'accepted' ? 'bg-green-100 text-green-800' :
                metadata.status === 'declined' ? 'bg-red-100 text-red-800' :
                metadata.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>{metadata.status}</span>
            </div>
          )}
          {metadata.error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
              <span className="font-medium">Error:</span> {metadata.error}
            </div>
          )}
        </div>
      )
    }

    // Default JSON display for other metadata
    return (
      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">System Logs</h1>
        <p className="text-gray-600">Real-time system activity and debugging information</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              <option value="system">System</option>
              <option value="auth">Authentication</option>
              <option value="email">Email</option>
              <option value="request">Request</option>
              <option value="test">Test</option>
              <option value="error">Error</option>
              <option value="api">API</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search in messages..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
            </label>
            <button
              onClick={fetchLogs}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-gray-50 ${getLevelBgColor(log.level)}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.timestamp), 'HH:mm:ss', { locale: sv })}
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'yyyy-MM-dd', { locale: sv })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xl">
                          <p className="truncate">
                            {/* Enhanced message display */}
                            {log.category === 'email' && log.metadata?.recipients?.[0] ? (
                              <>
                                {log.message.replace('Email sent successfully', 'Email sent to').replace('Email simulated (dev mode)', 'Email simulated to')} {log.metadata.recipients[0].name || log.metadata.recipients[0].email}
                                {log.metadata.recipientCount > 1 && ` and ${log.metadata.recipientCount - 1} others`}
                              </>
                            ) : log.category === 'email' && log.metadata?.musicianName ? (
                              <>
                                {log.message.includes('Email sent to') || log.message.includes('Email simulated to') ? log.message : 
                                  (log.message.includes('successfully') ? 'Email sent to' : log.message)} {log.metadata.musicianName}
                              </>
                            ) : log.category === 'email' && log.metadata?.to ? (
                              // Handle generic email logs that include recipient in metadata
                              <>
                                {log.message.includes(' to ') ? log.message : `${log.message} to ${log.metadata.to}`}
                              </>
                            ) : log.category === 'request' && log.metadata?.musicianName ? (
                              `${log.metadata.musicianName} ${log.message.toLowerCase()}`
                            ) : (
                              log.message
                            )}
                          </p>
                          {log.metadata?.positionName && (
                            <span className="text-xs text-gray-500">
                              {log.metadata.positionName}
                            </span>
                          )}
                          {log.duration && (
                            <span className="text-xs text-gray-500 ml-2">({log.duration}ms)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <button
                          onClick={() => toggleExpanded(log.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedLogs.has(log.id) ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {/* Inline Expanded Details */}
                    {expandedLogs.has(log.id) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {log.userId && (
                              <div>
                                <span className="font-medium">User ID:</span> {log.userId}
                              </div>
                            )}
                            {log.ip && (
                              <div>
                                <span className="font-medium">IP:</span> {log.ip}
                              </div>
                            )}
                            {log.subdomain && (
                              <div>
                                <span className="font-medium">Subdomain:</span> {log.subdomain}
                              </div>
                            )}
                            {log.requestId && (
                              <div>
                                <span className="font-medium">Request ID:</span> {log.requestId}
                              </div>
                            )}
                          </div>
                          {log.metadata && (
                            <div className="mt-2">
                              <span className="font-medium">Metadata:</span>
                              {renderMetadata(log.metadata)}
                            </div>
                          )}
                          {log.userAgent && (
                            <div className="mt-2">
                              <span className="font-medium">User Agent:</span>
                              <p className="text-xs text-gray-600">{log.userAgent}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Mode Banner */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-3">
            <strong>Development Mode:</strong> Logs are stored both in memory and database.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                await fetch('/api/test-logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'email',
                    metadata: {
                      recipientCount: 5,
                      recipients: [
                        { name: 'Anna Andersson', email: 'anna@example.com' },
                        { name: 'Björn Bengtsson', email: 'bjorn@example.com' },
                        { name: 'Cecilia Carlsson', email: 'cecilia@example.com' },
                        { name: 'David Davidsson', email: 'david@example.com' },
                        { name: 'Eva Eriksson', email: 'eva@example.com' }
                      ],
                      projectName: 'V.28 Mahler 9',
                      positionName: 'Violin 1 - Tutti'
                    }
                  })
                })
                fetchLogs()
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Email Log
            </button>
            <button
              onClick={async () => {
                await fetch('/api/test-logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'request',
                    metadata: {
                      musicianName: 'Johan Johansson',
                      positionName: 'Viola - Stämledare',
                      projectName: 'V.32 Beethoven 5',
                      status: 'accepted'
                    }
                  })
                })
                fetchLogs()
              }}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Request Log
            </button>
            <button
              onClick={async () => {
                await fetch('/api/test-logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'error',
                    metadata: {
                      error: 'Connection timeout',
                      musicianName: 'Sara Svensson',
                      positionName: 'Cello - Tutti',
                      projectName: 'V.30 Mozart Requiem'
                    }
                  })
                })
                fetchLogs()
              }}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Test Error Log
            </button>
          </div>
        </div>
      )}
    </div>
  )
}