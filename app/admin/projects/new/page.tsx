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

  const calculateDateFromWeek = (weekNum: string, year?: number) => {
    const weekNumber = parseInt(weekNum)
    if (!weekNumber || weekNumber < 1 || weekNumber > 53) return ''
    
    const today = new Date()
    const currentWeek = getCurrentWeekNumber()
    let targetYear = year || today.getFullYear()
    
    // Om inget år anges och veckan har passerat, använd nästa år
    if (!year && weekNumber < currentWeek) {
      targetYear = today.getFullYear() + 1
    }
    
    // Enkel och korrekt ISO veckoberäkning
    const jan4 = new Date(targetYear, 0, 4)
    const time = jan4.getTime()
    const dayOfWeek = (jan4.getDay() + 6) % 7
    const startOfWeek1 = new Date(time - dayOfWeek * 86400000)
    
    const targetDate = new Date(startOfWeek1.getTime() + (weekNumber - 1) * 7 * 86400000)
    
    // Formatera datum i lokal tid, inte UTC
    const y = targetDate.getFullYear()
    const m = String(targetDate.getMonth() + 1).padStart(2, '0')
    const d = String(targetDate.getDate()).padStart(2, '0')
    
    return `${y}-${m}-${d}`
  }

  const getCurrentWeekNumber = () => {
    const today = new Date()
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  }

  const getWeekDateRange = (weekNum: string) => {
    const startDate = calculateDateFromWeek(weekNum)
    if (!startDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
    const startMonth = months[start.getMonth()]
    const endMonth = months[end.getMonth()]
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${startMonth} ${start.getFullYear()}`
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${start.getFullYear()}`
    } else {
      return `${start.getDate()} ${startMonth} ${start.getFullYear()} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`
    }
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
    <div className="min-h-screen pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-4">
          <Link
            href="/admin/projects"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Tillbaka till projekt
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Nytt projekt</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <section className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Grundinformation</h2>

            <div className="space-y-3">
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
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                  placeholder="t.ex. Vårkonsert 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => {
                      const weekNum = e.target.value
                      const newDate = calculateDateFromWeek(weekNum)
                      setFormData(prev => ({
                        ...prev,
                        weekNumber: weekNum,
                        startDate: newDate || prev.startDate
                      }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                    placeholder="T.ex. 14"
                  />
                  {formData.weekNumber && getWeekDateRange(formData.weekNumber) && (
                    <p className="mt-1 text-xs text-gray-600">
                      Vecka {formData.weekNumber}: {getWeekDateRange(formData.weekNumber)}
                    </p>
                  )}
                </div>

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
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Fylls i automatiskt från veckonummer (måndag)
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Projektinformation</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="rehearsalSchedule" className="block text-sm font-medium text-gray-700">
                  Repetitionsschema
                </label>
                <textarea
                  id="rehearsalSchedule"
                  rows={3}
                  value={formData.rehearsalSchedule}
                  onChange={(e) => setFormData({ ...formData, rehearsalSchedule: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                  placeholder="Beskriv repetitionstider och datum..."
                />
              </div>

              <div>
                <label htmlFor="concertInfo" className="block text-sm font-medium text-gray-700">
                  Konsertinformation
                </label>
                <textarea
                  id="concertInfo"
                  rows={3}
                  value={formData.concertInfo}
                  onChange={(e) => setFormData({ ...formData, concertInfo: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                  placeholder="Information om konserten, plats, tid, etc..."
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Anteckningar
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 transition-colors placeholder:text-gray-400"
                  placeholder="Interna anteckningar om projektet..."
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-3">
            <Link
              href="/admin/projects"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Skapar...' : 'Skapa projekt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}