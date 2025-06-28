'use client'

import { useState, useEffect } from 'react'

interface NeedFile {
  id: number
  projectFileId: string
  fileName: string
  fileUrl: string
  sendTiming: string
  uploadedAt: string
}

interface NeedFilesSectionProps {
  projectId: number
  needId: number
  onUploadClick: () => void
  onReuseClick: () => void
  refreshTrigger?: number
  hasProjectFiles?: boolean
}

export default function NeedFilesSection({ projectId, needId, onUploadClick, onReuseClick, refreshTrigger, hasProjectFiles = false }: NeedFilesSectionProps) {
  const [files, setFiles] = useState<NeedFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [needId, refreshTrigger])

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/needs/${needId}/files`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna fil?')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchFiles()
      } else {
        alert('Kunde inte ta bort filen')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Ett fel uppstod vid borttagning')
    }
  }

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case 'on_request':
        return 'Vid förfrågan'
      case 'on_accept':
        return 'Vid accept'
      default:
        return timing
    }
  }

  const formatFileDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="text-xs text-gray-500">Laddar filer...</div>
  }

  if (files.length === 0) {
    return (
      <div className="mt-3 border-t pt-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUploadClick}
            className="py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-600 group-hover:text-gray-700">Ladda upp noter</span>
            </div>
          </button>
          {hasProjectFiles && (
            <button
              onClick={onReuseClick}
              className="py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm text-gray-600 group-hover:text-gray-700">Använd befintliga filer</span>
              </div>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-700">
          Noter {files.length > 0 && `(${files.length})`}
        </h5>
        <div className="flex items-center space-x-1">
          <button
            onClick={onReuseClick}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Använd befintlig"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={onUploadClick}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Ladda upp ny fil"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.fileName}</p>
                  <p className="text-gray-500 text-xs">
                    {getTimingLabel(file.sendTiming)}, {formatFileDate(file.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <a
                  href={file.fileUrl}
                  download
                  className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-200"
                  title="Ladda ner"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-200"
                  title="Ta bort"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}