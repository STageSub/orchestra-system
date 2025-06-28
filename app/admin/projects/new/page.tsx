'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    weekNumber: '',
    rehearsalSchedule: '',
    concertInfo: '',
    notes: ''
  })

  const calculateWeekNumber = (date: string) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    setFormData(prev => ({ ...prev, weekNumber: weekNumber.toString() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weekNumber: parseInt(formData.weekNumber)
        })
      })

      if (response.ok) {
        const project = await response.json()
        router.push(`/admin/projects/${project.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Något gick fel')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Ett fel uppstod vid skapande av projekt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tillbaka till projekt
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Nytt projekt</h2>
        <p className="mt-1 text-sm text-gray-600">
          Skapa ett nytt orkesterprojekt eller produktion
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grundinformation</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Projektnamn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                placeholder="t.ex. Vårkonsert 2024"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Startdatum <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value })
                    if (e.target.value) {
                      calculateWeekNumber(e.target.value)
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="weekNumber" className="block text-sm font-medium text-gray-700">
                  Veckonummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="weekNumber"
                  required
                  min="1"
                  max="53"
                  value={formData.weekNumber}
                  onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                  placeholder="Beräknas automatiskt från datum"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fylls i automatiskt när du väljer startdatum
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Projektinformation</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="rehearsalSchedule" className="block text-sm font-medium text-gray-700">
                Repetitionsschema
              </label>
              <textarea
                id="rehearsalSchedule"
                rows={4}
                value={formData.rehearsalSchedule}
                onChange={(e) => setFormData({ ...formData, rehearsalSchedule: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                placeholder="Beskriv repetitionstider och datum..."
              />
            </div>

            <div>
              <label htmlFor="concertInfo" className="block text-sm font-medium text-gray-700">
                Konsertinformation
              </label>
              <textarea
                id="concertInfo"
                rows={4}
                value={formData.concertInfo}
                onChange={(e) => setFormData({ ...formData, concertInfo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                placeholder="Information om konserten, plats, tid, etc..."
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Anteckningar
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm placeholder:text-gray-400"
                placeholder="Interna anteckningar om projektet..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/projects"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Skapar...' : 'Skapa projekt'}
          </button>
        </div>
      </form>
    </div>
  )
}