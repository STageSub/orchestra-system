'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, ArrowLeft } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
  }>
}

export default function ImportMusiciansPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      alert('Vänligen ladda upp en CSV eller Excel-fil')
      return
    }
    
    setFile(file)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/musicians/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportResult(result)
        
        // Mark onboarding step as complete if successful
        if (result.success > 0) {
          await fetch('/api/onboarding/complete-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stepId: 'add_musicians' })
          })
        }
      } else {
        alert(result.error || 'Import misslyckades')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Ett fel uppstod vid import')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `förnamn,efternamn,email,telefon,instrument,position,aktiv,lokalt_boende,anteckningar
Erik,Andersson,erik@example.com,0701234567,Violin,1:a violin,ja,ja,"Erfaren musiker"
Anna,Svensson,anna@example.com,0709876543,Cello,Stämledare,ja,nej,"Tillgänglig vardagar"`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'musikermall.csv'
    link.click()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/musicians"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till musiker
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Importera musiker</h1>
        <p className="mt-2 text-gray-600">
          Ladda upp en CSV eller Excel-fil för att importera flera musiker samtidigt
        </p>
      </div>

      {/* Download template */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">Behöver du en mall?</h3>
        <p className="text-blue-800 mb-4">
          Ladda ner vår CSV-mall med rätt kolumner och exempeldata
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Ladda ner mall
        </button>
      </div>

      {/* File upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />
        
        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
        
        <p className="mt-4 text-lg text-gray-900">
          {file ? file.name : 'Dra och släpp din fil här'}
        </p>
        
        <p className="mt-2 text-sm text-gray-600">
          eller
        </p>
        
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          Välj fil
        </label>
        
        <p className="mt-4 text-xs text-gray-500">
          CSV eller Excel-filer upp till 10MB
        </p>
      </div>

      {/* Import button */}
      {file && !importResult && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleImport}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Importerar...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importera musiker
              </>
            )}
          </button>
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div className="mt-8">
          <div className={`rounded-lg p-6 ${
            importResult.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center mb-4">
              {importResult.failed === 0 ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
              )}
              <h3 className="text-lg font-semibold">Import slutförd</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-green-700">
                ✓ {importResult.success} musiker importerades framgångsrikt
              </p>
              {importResult.failed > 0 && (
                <p className="text-red-700">
                  ✗ {importResult.failed} musiker kunde inte importeras
                </p>
              )}
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Fel som uppstod:</h4>
                <div className="bg-white rounded border max-h-48 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Rad</th>
                        <th className="px-4 py-2 text-left">Fel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importResult.errors.map((error, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{error.row}</td>
                          <td className="px-4 py-2 text-red-600">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setFile(null)
                  setImportResult(null)
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Importera fler
              </button>
              <button
                onClick={() => router.push('/admin/musicians')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Gå till musiker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}