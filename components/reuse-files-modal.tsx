'use client'

import { useState, useEffect } from 'react'

interface ProjectFile {
  id: number
  projectFileId: string
  fileName: string
  fileUrl: string
  fileType: string
  sendTiming: string
  uploadedAt: string
  projectNeedId?: number | null
  projectNeed?: {
    id: number
    position: {
      name: string
      instrument: {
        name: string
      }
    }
  }
}

interface ReuseFilesModalProps {
  projectId: number
  currentNeedId: number
  onClose: () => void
  onSuccess: () => void
}

export default function ReuseFilesModal({ projectId, currentNeedId, onClose, onSuccess }: ReuseFilesModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())
  const [sendTimings, setSendTimings] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchProjectFiles()
  }, [])

  const fetchProjectFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      if (response.ok) {
        const data = await response.json()
        // Filtrera bort filer som redan är kopplade till detta behov
        const filteredFiles = data.filter((f: ProjectFile) => 
          f.projectNeedId !== currentNeedId
        )
        
        // Gruppera filer efter fileUrl för att få unika filer
        const uniqueFilesMap = new Map<string, ProjectFile>()
        filteredFiles.forEach((file: ProjectFile) => {
          // Om filen redan finns, behåll den första förekomsten
          if (!uniqueFilesMap.has(file.fileUrl)) {
            uniqueFilesMap.set(file.fileUrl, file)
          }
        })
        
        // Konvertera tillbaka till array
        const uniqueFiles = Array.from(uniqueFilesMap.values())
        setProjectFiles(uniqueFiles)
        
        // Sätt default sendTiming för varje fil
        const timings: Record<number, string> = {}
        uniqueFiles.forEach((f: ProjectFile) => {
          timings[f.id] = f.sendTiming
        })
        setSendTimings(timings)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFileSelection = (fileId: number) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna fil?')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Ta bort filen från listan
        setProjectFiles(prev => prev.filter(f => f.id !== fileId))
        // Ta bort från selection om den var vald
        setSelectedFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      } else {
        alert('Kunde inte ta bort filen')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Ett fel uppstod vid borttagning')
    }
  }

  const handleSubmit = async () => {
    if (selectedFiles.size === 0) return
    
    setSaving(true)
    try {
      const filesToLink = Array.from(selectedFiles).map(fileId => {
        const file = projectFiles.find(f => f.id === fileId)
        return {
          fileId,
          fileUrl: file?.fileUrl,
          fileName: file?.fileName,
          sendTiming: sendTimings[fileId]
        }
      })

      const response = await fetch(`/api/projects/${projectId}/needs/${currentNeedId}/link-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToLink })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error linking files:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-sm text-gray-500">Laddar filer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Använd befintliga filer</h3>
          <p className="mt-1 text-sm text-gray-500">
            Välj filer från projektet som ska kopplas till detta behov
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {projectFiles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Inga andra filer finns i projektet
            </p>
          ) : (
            <div className="space-y-4">
              {/* Generella filer */}
              {projectFiles.filter(f => f.fileType === 'general_info').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Generella filer</h4>
                  <div className="space-y-2">
                    {projectFiles
                      .filter(f => f.fileType === 'general_info')
                      .map(file => (
                        <FileSelectItem
                          key={file.id}
                          file={file}
                          selected={selectedFiles.has(file.id)}
                          sendTiming={sendTimings[file.id]}
                          onToggle={() => toggleFileSelection(file.id)}
                          onTimingChange={(timing) => setSendTimings({ ...sendTimings, [file.id]: timing })}
                          onDelete={() => handleDeleteFile(file.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Noter från andra behov */}
              {projectFiles.filter(f => f.fileType === 'sheet_music').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Noter från andra behov</h4>
                  <div className="space-y-2">
                    {projectFiles
                      .filter(f => f.fileType === 'sheet_music')
                      .map(file => (
                        <FileSelectItem
                          key={file.id}
                          file={file}
                          selected={selectedFiles.has(file.id)}
                          sendTiming={sendTimings[file.id]}
                          onToggle={() => toggleFileSelection(file.id)}
                          onTimingChange={(timing) => setSendTimings({ ...sendTimings, [file.id]: timing })}
                          onDelete={() => handleDeleteFile(file.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || selectedFiles.size === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Kopplar filer...' : `Koppla ${selectedFiles.size} fil(er)`}
          </button>
        </div>
      </div>
    </div>
  )
}

interface FileSelectItemProps {
  file: ProjectFile
  selected: boolean
  sendTiming: string
  onToggle: () => void
  onTimingChange: (timing: string) => void
  onDelete?: () => void
}

function FileSelectItem({ file, selected, sendTiming, onToggle, onTimingChange, onDelete }: FileSelectItemProps) {
  return (
    <div className={`border rounded-lg p-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
              {file.projectNeed && (
                <p className="text-xs text-gray-500">
                  Från: {file.projectNeed.position.instrument.name} - {file.projectNeed.position.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Uppladdad: {new Date(file.uploadedAt).toLocaleDateString('sv-SE')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {selected && (
                <select
                  value={sendTiming}
                  onChange={(e) => onTimingChange(e.target.value)}
                  className="text-xs rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="on_request">Vid förfrågan</option>
                  <option value="on_accept">Vid accept</option>
                </select>
              )}
              {!file.projectNeedId && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                  title="Ta bort ej kopplad fil"
                >
                  Ta bort
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}