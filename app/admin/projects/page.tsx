'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Project {
  id: number
  projectId: string
  name: string
  startDate: string
  weekNumber: number
  rehearsalSchedule: string | null
  concertInfo: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    projectNeeds: number
    projectFiles: number
  }
  staffingPercentage?: number
  totalNeeded?: number
  totalAccepted?: number
  totalRequests?: number
  allNeedsPaused?: boolean
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'alphabetical' | 'staffing'>('date')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        console.error('Failed to fetch projects:', response.status)
        setProjects([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setProjects(data)
      } else {
        console.error('Invalid response format:', data)
        setProjects([])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getProjectStatus = (startDate: string) => {
    const projectDate = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate end of project week (Sunday)
    const endOfProjectWeek = new Date(projectDate)
    const daysUntilSunday = 7 - projectDate.getDay()
    endOfProjectWeek.setDate(projectDate.getDate() + daysUntilSunday)
    endOfProjectWeek.setHours(23, 59, 59, 999)
    
    // Project is "upcoming" until the Monday after project week
    if (today <= endOfProjectWeek) {
      return 'upcoming'
    } else {
      return 'past'
    }
  }

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // For filter compatibility, use the same status logic
      const dateStatus = getProjectStatus(project.startDate)
      const matchesFilter = filter === 'all' || filter === dateStatus
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': {
          // Original intelligent sorting with date-based status
          const dateStatusA = getProjectStatus(a.startDate)
          const dateStatusB = getProjectStatus(b.startDate)
          const dateA = new Date(a.startDate).getTime()
          const dateB = new Date(b.startDate).getTime()
          
          // Om en är kommande och en är genomförd, visa kommande först
          if (dateStatusA === 'upcoming' && dateStatusB === 'past') return -1
          if (dateStatusA === 'past' && dateStatusB === 'upcoming') return 1
          
          // Om båda har samma status
          if (dateStatusA === dateStatusB) {
            if (dateStatusA === 'upcoming') {
              // Kommande projekt: tidigast datum först (kronologisk ordning)
              return dateA - dateB
            } else {
              // Genomförda projekt: senaste datum först (omvänd kronologisk ordning)
              return dateB - dateA
            }
          }
          return 0
        }
        case 'created': {
          // Newest first (most recently created)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        case 'alphabetical': {
          // A-Z by project name
          return a.name.localeCompare(b.name, 'sv-SE')
        }
        case 'staffing': {
          // Highest staffing percentage first
          const staffingA = a.staffingPercentage || 0
          const staffingB = b.staffingPercentage || 0
          return staffingB - staffingA
        }
        default:
          return 0
      }
    })

  const upcomingCount = projects.filter(p => getProjectStatus(p.startDate) === 'upcoming').length
  const pastCount = projects.filter(p => getProjectStatus(p.startDate) === 'past').length

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Projekt</h2>
            <p className="mt-1 text-sm text-gray-600">
              Hantera orkesterns projekt och produktioner
            </p>
          </div>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nytt projekt
          </Link>
        </div>

        {/* Statistik */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Totalt</p>
                <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Kommande</p>
                <p className="text-2xl font-semibold text-gray-900">{upcomingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Genomförda</p>
                <p className="text-2xl font-semibold text-gray-900">{pastCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sök och filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sökruta - samma bredd som statistik-boxarna */}
            <div className="md:col-span-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Sök projekt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filter och sortering */}
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Alla
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'upcoming'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Kommande
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'past'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Genomförda
                </button>
              </div>

              {/* Sortering och vyläge */}
              <div className="flex items-center space-x-4">
                {/* Sortering dropdown */}
                <div className="flex items-center space-x-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Startdatum</option>
                    <option value="created">Senast tillagd</option>
                    <option value="alphabetical">Alfabetisk</option>
                    <option value="staffing">Bemanningsgrad</option>
                  </select>
                </div>

                {/* Vyläge toggle */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Tabellvy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Kortvy"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projektlista */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Laddar projekt...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || filter !== 'all' ? 'Inga projekt matchar din sökning' : 'Inga projekt registrerade ännu'}
          </p>
          {!searchTerm && filter === 'all' && (
            <Link
              href="/admin/projects/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Skapa första projektet
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        // Tabellvy
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bemanningsgrad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Behov/Filer
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Öppna</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  const status = getProjectStatus(project.startDate)
                  const isUpcoming = status === 'upcoming'
                  
                  return (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {project.name}
                                {project.allNeedsPaused && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pausad
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">Vecka {project.weekNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(project.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUpcoming
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isUpcoming ? 'Kommande' : 'Genomfört'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.totalNeeded > 0 ? (
                          project.totalRequests === 0 ? (
                            <span className="text-xs text-gray-500">Förfrågningar ej startade</span>
                          ) : project.staffingPercentage === 100 ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 max-w-20">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-green-500"
                                    style={{ width: '100%' }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs font-medium text-green-700">
                                Fullbemannad
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 max-w-20">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      project.staffingPercentage >= 80 
                                        ? 'bg-green-500' 
                                        : project.staffingPercentage >= 50 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(project.staffingPercentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                {project.staffingPercentage}% ({project.totalAccepted}/{project.totalNeeded})
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">Inga behov</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          {project._count && (
                            <>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {project._count.projectNeeds}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {project._count.projectFiles}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Kortvy
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const status = getProjectStatus(project.startDate)
            const isUpcoming = status === 'upcoming'
            
            return (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="group"
              >
                <div className={`rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 h-full ${
                  project.allNeedsPaused ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 flex items-center">
                          {project.name}
                          {project.allNeedsPaused && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pausad
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Vecka {project.weekNumber}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isUpcoming
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUpcoming ? 'Kommande' : 'Genomfört'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(project.startDate)}
                      </div>
                    </div>

                    {/* Bemanningsgrad */}
                    {project.totalNeeded > 0 ? (
                      <div className="mb-4">
                        {project.totalRequests === 0 ? (
                          <div className="text-center py-2">
                            <span className="text-xs text-gray-500">Förfrågningar ej startade</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">Bemanningsgrad</span>
                              <span className="text-xs font-medium text-gray-700">
                                {project.staffingPercentage === 100 ? (
                                  <span className="text-green-700">Fullbemannad</span>
                                ) : (
                                  `${project.staffingPercentage}% (${project.totalAccepted}/${project.totalNeeded})`
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  project.staffingPercentage === 100
                                    ? 'bg-green-500'
                                    : project.staffingPercentage >= 80 
                                      ? 'bg-green-500' 
                                      : project.staffingPercentage >= 50 
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(project.staffingPercentage, 100)}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 text-center py-2">
                        <span className="text-xs text-gray-400">Inga behov</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {project._count && (
                          <>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {project._count.projectNeeds} behov
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {project._count.projectFiles} filer
                            </span>
                          </>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}