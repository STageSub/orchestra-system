'use client'

import { useState } from 'react'
import { toast } from '@/components/toast'
import SuccessModal from '@/components/success-modal'

interface FileUploadModalProps {
  projectId: number
  projectNeedId?: number
  isGeneralFile?: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FileUploadModal({ projectId, projectNeedId, isGeneralFile = false, onClose, onSuccess }: FileUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({
    fileName: '',
    fileType: isGeneralFile ? 'general_info' : 'sheet_music',
    sendTiming: isGeneralFile ? 'on_request' : 'on_accept'
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Sätt filnamn automatiskt från filens namn (utan extension)
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setFormData(prev => ({ ...prev, fileName: nameWithoutExt }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Välj en fil att ladda upp')
      return
    }
    
    setLoading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result as string
          resolve(result)
        }
      })
      reader.readAsDataURL(file)
      const base64Data = await base64Promise

      // Use JSON API instead of FormData
      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64Data,
          fileName: formData.fileName,
          fileType: formData.fileType,
          sendTiming: formData.sendTiming,
          projectNeedId: projectNeedId?.toString() || null,
          originalFileName: file.name,
          mimeType: file.type
        })
      })

      if (response.ok) {
        setShowSuccessModal(true)
        onSuccess()
        // Delay closing the upload modal to show success feedback
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const error = await response.json()
        alert(error.error || 'Något gick fel vid uppladdning')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Ett fel uppstod vid uppladdning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isGeneralFile ? 'Ladda upp generell fil' : 'Ladda upp noter'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Välj fil <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt,.xml,.mxl,.musicxml"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max 10MB. Tillåtna format: PDF, bilder, Word, text, MusicXML
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Filnamn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                  placeholder={isGeneralFile ? "t.ex. Konsertprogram" : "t.ex. Violin 1 noter"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  När ska filen skickas? <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.sendTiming}
                  onChange={(e) => setFormData({ ...formData, sendTiming: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="on_request">Vid förfrågan</option>
                  <option value="on_accept">När musiker tackar ja</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.sendTiming === 'on_request' 
                    ? 'Filen skickas med i första förfrågan' 
                    : 'Filen skickas när musikern accepterat jobbet'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Laddar upp...' : 'Ladda upp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Uppladdning lyckades!"
        message="Fil uppladdad!"
        autoClose={true}
        autoCloseDelay={3000}
      />
    </>
  )
}