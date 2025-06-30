'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Musician {
  id: number
  musicianId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  localResidence: boolean
  isActive: boolean
  isArchived: boolean
  qualifications: Array<{
    position: {
      name: string
      instrument: {
        name: string
      }
    }
  }>
}

export default function MusiciansPage() {
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    localResidence: 0
  })
  const [instruments, setInstruments] = useState<{ id: number; name: string }[]>([])
  const [positions, setPositions] = useState<{ id: number; name: string; instrumentId: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstrument, setSelectedInstrument] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name')

  useEffect(() => {
    fetchMusicians()
    fetchInstruments()
    fetchPositions()
    fetchTotalStats()
  }, [])

  const fetchMusicians = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedInstrument) params.append('instrumentId', selectedInstrument)
      if (selectedPosition) params.append('positionId', selectedPosition)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/musicians?${params}`)
      if (!response.ok) {
        console.error('Failed to fetch musicians:', response.status)
        setMusicians([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setMusicians(data)
      } else {
        console.error('Invalid response format:', data)
        setMusicians([])
      }
    } catch (error) {
      console.error('Failed to fetch musicians:', error)
      setMusicians([])
    } finally {
      setLoading(false)
    }
  }

  const fetchInstruments = async () => {
    try {
      const response = await fetch('/api/instruments')
      if (!response.ok) {
        console.error('Failed to fetch instruments:', response.status)
        setInstruments([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setInstruments(data)
      } else {
        setInstruments([])
      }
    } catch (error) {
      console.error('Failed to fetch instruments:', error)
      setInstruments([])
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions')
      if (!response.ok) {
        console.error('Failed to fetch positions:', response.status)
        setPositions([])
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setPositions(data)
      } else {
        setPositions([])
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error)
      setPositions([])
    }
  }

  const fetchTotalStats = async () => {
    try {
      const response = await fetch('/api/musicians')
      if (!response.ok) {
        console.error('Failed to fetch total stats:', response.status)
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setTotalStats({
          total: data.length,
          active: data.filter(m => m.isActive && !m.isArchived).length,
          inactive: data.filter(m => !m.isActive && !m.isArchived).length,
          localResidence: data.filter(m => m.localResidence).length
        })
      }
    } catch (error) {
      console.error('Failed to fetch total stats:', error)
    }
  }

  // Debounce helper
  const debounceRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    // Clear any existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // For search, add debounce
    if (searchTerm !== '') {
      debounceRef.current = setTimeout(() => {
        fetchMusicians()
      }, 300)
    } else {
      // For dropdowns and empty search, fetch immediately
      fetchMusicians()
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, selectedInstrument, selectedPosition, selectedStatus])

  // När instrument ändras, återställ position
  useEffect(() => {
    if (selectedInstrument === '') {
      setSelectedPosition('')
    } else {
      // Om en position var vald men tillhör inte det nya instrumentet, återställ
      const validPosition = positions.find(p => 
        p.id.toString() === selectedPosition && 
        p.instrumentId.toString() === selectedInstrument
      )
      if (!validPosition) {
        setSelectedPosition('')
      }
    }
  }, [selectedInstrument, positions])

  const getPrimaryInstrument = (musician: Musician) => {
    if (musician.qualifications.length === 0) return 'Inget instrument'
    return musician.qualifications[0].position.instrument.name
  }

  // Sort musicians based on selected sorting
  const sortedMusicians = [...musicians].sort((a, b) => {
    if (sortBy === 'name') {
      return a.firstName.localeCompare(b.firstName, 'sv-SE')
    } else {
      // Sort by newest (highest ID first)
      return b.id - a.id
    }
  })

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Musiker</h2>
            <p className="mt-1 text-sm text-gray-600">
              Hantera orkesterns musiker och deras kvalifikationer
            </p>
          </div>
          <Link
            href="/admin/musicians/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ny musiker
          </Link>
        </div>
        
        {/* Statistik */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Totalt</p>
                <p className="text-2xl font-semibold text-gray-900">{totalStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-green-600"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aktiva</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.active}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-red-600"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Inaktiva</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.inactive}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Lokalt boende</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalStats.localResidence}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sök och filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Sök musiker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'newest')}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="name">Bokstavsordning</option>
                <option value="newest">Senast tillagda</option>
              </select>
              <select 
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Alla instrument</option>
                {instruments.map((instrument) => (
                  <option key={instrument.id} value={instrument.id.toString()}>
                    {instrument.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={!selectedInstrument}
              >
                <option value="">Alla kvalifikationer</option>
                {selectedInstrument && positions
                  .filter(p => p.instrumentId.toString() === selectedInstrument)
                  .map((position) => (
                    <option key={position.id} value={position.id.toString()}>
                      {position.name}
                    </option>
                  ))}
              </select>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Alla status</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
                <option value="archived">Arkiverad</option>
              </select>
            </div>
            
            {/* Vyläge */}
            <div className="flex items-center space-x-4">
              
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

      {/* Musikerlista */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Laddar musiker...</p>
        </div>
      ) : sortedMusicians.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Inga musiker registrerade ännu</p>
          <Link
            href="/admin/musicians/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Lägg till första musikern
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMusicians.map((musician) => (
            <Link
              key={musician.id}
              href={`/admin/musicians/${musician.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 h-full">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {musician.firstName} {musician.lastName}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 mt-1">
                        {getPrimaryInstrument(musician)}
                      </p>
                    </div>
                    <div className="ml-3">
                      {musician.isArchived ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Arkiverad
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            musician.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {musician.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{musician.email}</span>
                    </div>
                    {musician.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {musician.phone}
                      </div>
                    )}
                  </div>
                  
                  {(musician.localResidence || musician.qualifications.length > 1) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {musician.localResidence && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Lokalt
                          </span>
                        )}
                      </div>
                      {musician.qualifications.length > 1 && (
                        <span className="text-xs text-gray-500">
                          +{musician.qualifications.length - 1} kvalifikationer
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {sortedMusicians.map((musician) => (
              <li key={musician.id}>
                <Link
                  href={`/admin/musicians/${musician.id}`}
                  className="block hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {musician.firstName[0]}{musician.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {musician.firstName} {musician.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {getPrimaryInstrument(musician)} • {musician.email}
                                  {musician.phone && ` • ${musician.phone}`}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {musician.localResidence && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Lokalt boende
                                  </span>
                                )}
                                {musician.isArchived ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Arkiverad
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      musician.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {musician.isActive ? 'Aktiv' : 'Inaktiv'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}