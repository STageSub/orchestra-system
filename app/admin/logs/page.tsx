'use client'

import { useState, useEffect, useRef } from 'react'
import type { LogEntry } from '@/lib/log-storage'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [emailOnly, setEmailOnly] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [fullFlowLoading, setFullFlowLoading] = useState(false)
  const [fullFlowResult, setFullFlowResult] = useState<any>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async (since?: Date) => {
    try {
      const params = new URLSearchParams()
      if (emailOnly) params.set('emailOnly', 'true')
      if (since) params.set('since', since.toISOString())

      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setLastUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' })
      if (response.ok) {
        setLogs([])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
    }
  }

  const testConfirmationEmail = async () => {
    setTestLoading(true)
    try {
      console.log('🔥🔥🔥 TRIGGERING TEST CONFIRMATION EMAIL 🔥🔥🔥')
      const response = await fetch('/api/test/confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Test email triggered:', result.message)
        // Refresh logs after a short delay to capture new logs
        setTimeout(() => fetchLogs(), 1000)
      } else {
        const error = await response.json()
        console.error('❌ Test email failed:', error)
      }
    } catch (error) {
      console.error('Error triggering test email:', error)
    } finally {
      setTestLoading(false)
    }
  }

  const testFullFlow = async () => {
    setFullFlowLoading(true)
    setFullFlowResult(null)
    try {
      console.log('🚀 Starting full email flow test...')
      const response = await fetch('/api/test/full-email-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      setFullFlowResult(result)
      
      if (response.ok) {
        console.log('✅ Full flow test complete:', result)
        // Refresh logs to show latest
        setTimeout(() => fetchLogs(), 500)
      } else {
        console.error('❌ Full flow test failed:', result)
      }
    } catch (error) {
      console.error('Error in full flow test:', error)
      setFullFlowResult({ error: String(error) })
    } finally {
      setFullFlowLoading(false)
    }
  }

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs(lastUpdate || undefined)
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh, lastUpdate, emailOnly])

  // Initial load
  useEffect(() => {
    fetchLogs()
  }, [emailOnly])

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const getLogColor = (level: string, message: string) => {
    if (message.includes('🔥')) return 'text-red-600 font-bold'
    if (message.includes('✅')) return 'text-green-600 font-semibold'
    if (message.includes('❌')) return 'text-red-500 font-semibold'
    
    switch (level) {
      case 'error': return 'text-red-500'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-700'
    }
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
                <strong>Development Logs</strong> - Real-time log viewer for debugging
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Real-time Logs</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor application logs in real-time for debugging
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailOnly"
                checked={emailOnly}
                onChange={(e) => setEmailOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="emailOnly" className="text-sm font-medium">
                Email logs only
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoRefresh" className="text-sm font-medium">
                Auto-refresh (2s)
              </label>
            </div>

            <button
              onClick={() => fetchLogs()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Refresh Now
            </button>

            <button
              onClick={testConfirmationEmail}
              disabled={testLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {testLoading ? '⏳ Testing...' : '🧪 Test Confirmation Email'}
            </button>

            <button
              onClick={testFullFlow}
              disabled={fullFlowLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {fullFlowLoading ? '⏳ Running...' : '🚀 Test Full Flow (Auto Accept)'}
            </button>

            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ Clear Logs
            </button>
          </div>
          
          {lastUpdate && (
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {formatTime(lastUpdate)} | 
              Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Full Flow Test Results */}
        {fullFlowResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🚀 Full Flow Test Results
            </h3>
            {fullFlowResult.error ? (
              <div className="text-red-600">
                <p className="font-semibold">❌ Test Failed</p>
                <p className="text-sm">{fullFlowResult.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Musician</h4>
                    <p className="text-sm">{fullFlowResult.musician.name}</p>
                    <p className="text-xs text-gray-500">{fullFlowResult.musician.email}</p>
                    <p className="text-xs font-semibold text-blue-600">
                      Language: {fullFlowResult.musician.preferredLanguage || 'Not set (defaults to sv)'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Project</h4>
                    <p className="text-sm">{fullFlowResult.project}</p>
                    <p className="text-xs text-gray-500">{fullFlowResult.position}</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Findings</h4>
                  <div className="space-y-1 text-sm">
                    <p className={fullFlowResult.keyFindings.respondApiReached ? 'text-green-600' : 'text-red-600'}>
                      {fullFlowResult.keyFindings.respondApiReached ? '✅' : '❌'} Respond API reached
                    </p>
                    <p className={fullFlowResult.keyFindings.confirmationTriggered ? 'text-green-600' : 'text-red-600'}>
                      {fullFlowResult.keyFindings.confirmationTriggered ? '✅' : '❌'} Confirmation email triggered
                    </p>
                    <p className={fullFlowResult.keyFindings.englishTemplateUsed ? 'text-green-600' : 'text-red-600'}>
                      {fullFlowResult.keyFindings.englishTemplateUsed ? '✅' : '❌'} English template used
                    </p>
                    {fullFlowResult.keyFindings.languageSelected && (
                      <p className="text-blue-600 font-semibold">
                        Language: {fullFlowResult.keyFindings.languageSelected}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm text-gray-700">Log Summary</h4>
                  <p className="text-xs text-gray-500">
                    Total logs: {fullFlowResult.logs.total} | 
                    Respond API: {fullFlowResult.logs.respondApiCalled ? 'Yes' : 'No'} | 
                    Confirmation: {fullFlowResult.logs.confirmationEmailCalled ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Application Logs {emailOnly ? '(Email Only)' : '(All)'}
            </h3>
          </div>
          
          <div className="p-4" style={{ height: '600px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No logs found</p>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="flex">
                    <span className="text-gray-400 mr-3 flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`uppercase mr-3 flex-shrink-0 w-12 ${getLogColor(log.level, log.message)}`}>
                      {log.level}
                    </span>
                    <span className={`flex-1 whitespace-pre-wrap ${getLogColor(log.level, log.message)}`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}