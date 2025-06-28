'use client'

import { useState, useEffect } from 'react'
import { Mail, Users, Music, FileText, Send, AlertCircle, Check } from 'lucide-react'

interface Project {
  id: number
  name: string
  type: string
  startDate: string
  endDate: string
  status?: string
  weekNumber?: number
}

interface Instrument {
  id: number
  name: string
}

interface Position {
  id: number
  name: string
  instrumentId: number
  hierarchyLevel: number
  recipientCount?: number
}

interface Recipient {
  id: string
  name: string
  email: string
  instrument: string
  instrumentId: number
  instrumentOrder: number
  position: string
  positionId: number
  positionHierarchy: number
  acceptedFor: string // What they accepted (e.g., "Violin - Stämledare")
}

export default function GroupEmailPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [instrumentCounts, setInstrumentCounts] = useState<Record<number, number>>({})
  const [positionCounts, setPositionCounts] = useState<Record<number, number>>({})
  
  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [allMusiciansChecked, setAllMusiciansChecked] = useState(true)
  const [selectedInstruments, setSelectedInstruments] = useState<number[]>([])
  const [selectedPositions, setSelectedPositions] = useState<number[]>([])
  const [allPositionsForInstrument, setAllPositionsForInstrument] = useState<Record<number, boolean>>({})
  
  // Email states
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Load initial data
  useEffect(() => {
    loadProjects()
    // Don't load instruments until a project is selected
  }, [])

  // Update recipients when filters change
  useEffect(() => {
    if (selectedProject) {
      loadRecipients()
    } else {
      setRecipients([])
    }
  }, [selectedProject, selectedInstruments, selectedPositions, allMusiciansChecked])
  
  // Clear instrument and position selections when "All musicians" is checked
  useEffect(() => {
    if (allMusiciansChecked) {
      setSelectedInstruments([])
      setSelectedPositions([])
      setAllPositionsForInstrument({})
    }
  }, [allMusiciansChecked])

  // Function to get ISO week number
  const getWeekNumber = (date = new Date()) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Auto-fill subject when project is selected and load instruments
  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id.toString() === selectedProject)
      if (project) {
        const weekNumber = getWeekNumber()
        setSubject(`Projekt ${project.name}, vecka ${weekNumber}: `)
      }
      loadInstruments() // Load instruments when project is selected
    } else {
      setSubject('')
      setInstruments([]) // Clear instruments when no project
    }
  }, [selectedProject, projects])

  // Update positions when instruments change
  useEffect(() => {
    if (selectedInstruments.length > 0) {
      loadPositions()
    } else {
      setPositions([])
      setSelectedPositions([])
    }
  }, [selectedInstruments])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        const today = new Date()
        
        // Filter and sort projects
        const filteredProjects = data
          .filter((p: Project) => {
            // Exclude archived/completed projects
            if (p.status === 'archived' || p.status === 'completed') return false
            
            // Only include upcoming projects (startDate >= today)
            const projectDate = new Date(p.startDate)
            return projectDate >= today
          })
          .sort((a: Project, b: Project) => {
            // Sort by week number first, then by name
            if (a.weekNumber && b.weekNumber && a.weekNumber !== b.weekNumber) {
              return a.weekNumber - b.weekNumber
            }
            return a.name.localeCompare(b.name)
          })
        
        setProjects(filteredProjects)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadInstruments = async () => {
    if (!selectedProject) return
    
    try {
      // First get all recipients to know which instruments have accepted musicians
      const recipientsResponse = await fetch(`/api/group-email/recipients?projectId=${selectedProject}`)
      if (recipientsResponse.ok) {
        const recipientsData = await recipientsResponse.json()
        
        // Calculate counts per instrument
        const counts: Record<number, number> = {}
        recipientsData.forEach((r: Recipient) => {
          counts[r.instrumentId] = (counts[r.instrumentId] || 0) + 1
        })
        setInstrumentCounts(counts)
        
        const instrumentsWithAccepted = new Set(Object.keys(counts).map(id => parseInt(id)))
        
        // Then get all instruments but filter to only those with accepted musicians
        const instrumentsResponse = await fetch('/api/instruments')
        if (instrumentsResponse.ok) {
          const allInstruments = await instrumentsResponse.json()
          const filteredInstruments = allInstruments.filter((inst: Instrument) => 
            instrumentsWithAccepted.has(inst.id)
          )
          setInstruments(filteredInstruments)
        }
      }
    } catch (error) {
      console.error('Error loading instruments:', error)
    }
  }

  const loadPositions = async () => {
    if (!selectedProject || selectedInstruments.length === 0) return
    
    try {
      // First get recipients to know which positions have accepted musicians
      const recipientsResponse = await fetch(`/api/group-email/recipients?projectId=${selectedProject}`)
      if (recipientsResponse.ok) {
        const recipientsData = await recipientsResponse.json()
        
        // Calculate counts per position
        const counts: Record<number, number> = {}
        recipientsData.forEach((r: Recipient) => {
          counts[r.positionId] = (counts[r.positionId] || 0) + 1
        })
        setPositionCounts(counts)
        
        const positionsWithAccepted = new Set(Object.keys(counts).map(id => parseInt(id)))
        
        // Get all positions
        const positionsResponse = await fetch('/api/positions')
        if (positionsResponse.ok) {
          const allPositions = await positionsResponse.json()
          
          // Filter positions: must be for selected instruments AND have accepted musicians
          const filteredPositions = allPositions
            .filter((p: Position) => 
              selectedInstruments.includes(p.instrumentId) &&
              positionsWithAccepted.has(p.id)
            )
            .sort((a: Position, b: Position) => {
              // Sort by instrumentId first to group positions by instrument
              if (a.instrumentId !== b.instrumentId) {
                return a.instrumentId - b.instrumentId
              }
              // Then sort by hierarchyLevel within each instrument
              return a.hierarchyLevel - b.hierarchyLevel
            })
          
          setPositions(filteredPositions)
        }
      }
    } catch (error) {
      console.error('Error loading positions:', error)
    }
  }

  const loadRecipients = async () => {
    if (!selectedProject) return

    const params = new URLSearchParams()
    params.append('projectId', selectedProject)
    
    // Only add filters if "All musicians" is not checked
    if (!allMusiciansChecked) {
      selectedInstruments.forEach(id => params.append('instrumentId', id.toString()))
      selectedPositions.forEach(id => params.append('positionId', id.toString()))
    }

    try {
      const response = await fetch(`/api/group-email/recipients?${params}`)
      console.log('[Group Email] Loading recipients, URL:', `/api/group-email/recipients?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Group Email] Recipients loaded:', data.length, 'musicians')
        setRecipients(data)
      } else {
        const errorData = await response.json()
        console.error('[Group Email] API error:', response.status, errorData)
        setSendResult({ 
          success: false, 
          message: `Kunde inte hämta mottagare: ${errorData.error || 'Okänt fel'}` 
        })
      }
    } catch (error) {
      console.error('[Group Email] Network error:', error)
      setSendResult({ 
        success: false, 
        message: 'Kunde inte ansluta till servern' 
      })
    }
  }

  const handleSendEmail = async () => {
    if (!subject || !message || recipients.length === 0) {
      setSendResult({ success: false, message: 'Fyll i alla fält och se till att det finns mottagare.' })
      return
    }

    // Show confirmation dialog for large recipient lists
    if (recipients.length > 5) {
      setShowConfirmDialog(true)
      return
    }

    await sendEmails()
  }

  const sendEmails = async () => {
    setShowConfirmDialog(false)
    setSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/group-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({ email: r.email, name: r.name })),
          subject,
          message,
          metadata: {
            projectId: selectedProject,
            filters: {
              instruments: selectedInstruments,
              positions: selectedPositions
            }
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setSendResult({ success: true, message: `E-post skickad till ${recipients.length} mottagare!` })
        // Clear form after successful send
        setSubject('')
        setMessage('')
      } else {
        setSendResult({ success: false, message: result.error || 'Ett fel uppstod vid utskick.' })
      }
    } catch {
      setSendResult({ success: false, message: 'Ett fel uppstod vid utskick.' })
    } finally {
      setSending(false)
    }
  }

  const toggleInstrument = (instrumentId: number) => {
    setSelectedInstruments(prev => {
      const newInstruments = prev.includes(instrumentId)
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
      
      // If adding instrument, default to all positions selected
      if (!prev.includes(instrumentId)) {
        setAllPositionsForInstrument(prevAll => ({
          ...prevAll,
          [instrumentId]: true
        }))
      } else {
        // If removing instrument, clear its all positions state
        setAllPositionsForInstrument(prevAll => {
          const newAll = { ...prevAll }
          delete newAll[instrumentId]
          return newAll
        })
      }
      
      return newInstruments
    })
  }

  const togglePosition = (positionId: number) => {
    setSelectedPositions(prev => 
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    )
  }


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gruppmail</h1>
        <p className="text-gray-600 mt-2">Skicka e-post till musiker som tackat ja till ett projekt</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Column */}
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {/* Project Filter - Required */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-500" />
              Välj projekt
              <span className="ml-1 text-red-500">*</span>
            </h2>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Välj ett projekt...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id} className="text-sm">
                  {project.weekNumber ? `V. ${project.weekNumber} ` : ''}{project.name}{project.type ? ` (${project.type})` : ''}
                </option>
              ))}
            </select>
            {!selectedProject && (
              <p className="mt-2 text-sm text-amber-600">
                Du måste välja ett projekt först
              </p>
            )}
          </div>

          {/* Recipient Selection with Toggle */}
          {selectedProject && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-500" />
                Välj mottagare
              </h2>
              
              {/* Option 1: Radio Buttons (Commented) */}
              {/* <div className="mb-4">
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      checked={allMusiciansChecked}
                      onChange={() => {
                        setAllMusiciansChecked(true)
                        setSelectedInstruments([])
                        setSelectedPositions([])
                      }}
                      className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Alla musiker i projektet</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      checked={!allMusiciansChecked}
                      onChange={() => setAllMusiciansChecked(false)}
                      className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Välj specifika instrument och tjänster</span>
                  </label>
                </div>
              </div> */}
              
              {/* Option 2: Segmented Control */}
              <div className="mb-4">
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAllMusiciansChecked(true)
                      setSelectedInstruments([])
                      setSelectedPositions([])
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      allMusiciansChecked 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Alla musiker
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllMusiciansChecked(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      !allMusiciansChecked 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Filtrera
                  </button>
                </div>
              </div>
              
              {/* Filters - shown when toggle is ON (not all musicians) */}
              {!allMusiciansChecked && (
                <div className="space-y-4 transition-all duration-200 ease-in-out">
                  {/* Instrument Filter */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <Music className="w-4 h-4 mr-1.5 text-gray-500" />
                      Instrument
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {instruments.map(instrument => (
                        <label key={instrument.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedInstruments.includes(instrument.id)}
                              onChange={() => toggleInstrument(instrument.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{instrument.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            ({instrumentCounts[instrument.id] || 0})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Position Filter - shown when instruments selected */}
                  {positions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <Users className="w-4 h-4 mr-1.5 text-gray-500" />
                        Tjänster
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                {(() => {
                  // Group positions by instrument
                  const positionsByInstrument = positions.reduce((acc, pos) => {
                    if (!acc[pos.instrumentId]) {
                      acc[pos.instrumentId] = []
                    }
                    acc[pos.instrumentId].push(pos)
                    return acc
                  }, {} as Record<number, Position[]>)
                  
                  return Object.entries(positionsByInstrument).map(([instrumentIdStr, instrumentPositions], groupIndex) => {
                    const instrumentId = parseInt(instrumentIdStr)
                    const instrument = instruments.find(i => i.id === instrumentId)
                    console.log('[Group Email] Looking for instrument:', instrumentId, 'Found:', instrument?.name)
                    const allSelected = allPositionsForInstrument[instrumentId] !== false
                    
                    return (
                      <div key={instrumentId}>
                        {groupIndex > 0 && <hr className="my-3 border-gray-200" />}
                        
                        {/* All positions checkbox for this instrument */}
                        <label className="flex items-center mb-2 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              setAllPositionsForInstrument(prev => ({
                                ...prev,
                                [instrumentId]: isChecked
                              }))
                              
                              if (isChecked) {
                                // Add all positions for this instrument
                                const positionIds = instrumentPositions.map(p => p.id)
                                setSelectedPositions(prev => {
                                  const filtered = prev.filter(id => !positionIds.includes(id))
                                  return [...filtered, ...positionIds]
                                })
                              } else {
                                // Remove all positions for this instrument
                                const positionIds = instrumentPositions.map(p => p.id)
                                setSelectedPositions(prev => prev.filter(id => !positionIds.includes(id)))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Alla {instrument?.name ? `(${instrument.name})` : ''}
                          </span>
                        </label>
                        
                        {/* Individual positions - only show if not all selected */}
                        {!allSelected && (
                          <div className="ml-6 space-y-1">
                            {instrumentPositions.map(position => (
                              <label key={position.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedPositions.includes(position.id)}
                                    onChange={() => togglePosition(position.id)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    {position.name}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({positionCounts[position.id] || 0})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recipients List - Dynamic */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-500" />
                Mottagare
              </span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {recipients.length} st
              </span>
            </h2>
            
            {!selectedProject ? (
              <div>
                <div className="h-[42px] flex items-center">
                  <p className="text-gray-500 text-sm">
                    Välj ett projekt för att se mottagare
                  </p>
                </div>
              </div>
            ) : recipients.length === 0 ? (
              <div>
                <div className="h-[42px] flex items-center">
                  <div className="text-gray-500 text-sm">
                    <p>Inga musiker har tackat ja till de valda kriterierna.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {(() => {
                  // Group recipients by instrument
                  const groupedRecipients = recipients.reduce((groups, recipient) => {
                    if (!groups[recipient.instrument]) {
                      groups[recipient.instrument] = []
                    }
                    groups[recipient.instrument].push(recipient)
                    return groups
                  }, {} as Record<string, typeof recipients>)
                  
                  return Object.entries(groupedRecipients).map(([instrument, instrumentRecipients], groupIndex) => (
                    <div key={instrument} className={groupIndex > 0 ? 'mt-4' : ''}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        {instrument}
                      </h4>
                      <div className="space-y-1">
                        {instrumentRecipients.map(recipient => (
                          <div key={recipient.id} className="flex items-center p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                            <Check className="w-3 h-3 mr-1.5 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">
                              {recipient.name} <span className="text-[10px] text-gray-500">- {recipient.position}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Email Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className={`text-lg font-semibold mb-4 flex items-center transition-all duration-200 ${
              !selectedProject ? 'text-gray-400' : 'text-gray-900'
            }`}>
              <Mail className={`w-5 h-5 mr-2 transition-all duration-200 ${
                !selectedProject ? 'text-gray-300' : 'text-gray-500'
              }`} />
              Skriv meddelande
            </h2>
            
            <div className="space-y-4">
              <div className={`transition-all duration-200 ${
                !selectedProject ? 'opacity-60' : ''
              }`}>
                <label className={`block text-sm font-medium mb-1 ${
                  !selectedProject ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  Ämne
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ange ämne för e-postmeddelandet"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-200 ${
                    !selectedProject 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  disabled={!selectedProject}
                />
              </div>

              <div className={`p-4 rounded-lg transition-all duration-200 ${
                !selectedProject ? 'bg-gray-50 opacity-60' : 'bg-transparent'
              }`}>
                <label className={`block text-sm font-medium mb-1 ${
                  !selectedProject ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  Meddelande
                </label>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Skriv ditt meddelande här..."
                    rows={12}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none resize-none transition-all duration-200 ${
                      !selectedProject 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                    disabled={!selectedProject}
                  />
                  <div className={`absolute bottom-2 right-2 text-xs transition-all duration-200 ${
                    !selectedProject ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {message.length} tecken
                  </div>
                </div>
              </div>

              {sendResult && (
                <div className={`flex items-center p-4 rounded-md ${
                  sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {sendResult.success ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  {sendResult.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  {!selectedProject && (
                    <span className="flex items-center text-amber-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Välj ett projekt för att börja
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSendEmail}
                  disabled={sending || recipients.length === 0 || !subject || !message || !selectedProject}
                  className={`flex items-center px-8 py-3 rounded-md font-medium transition-all transform hover:scale-105 ${
                    sending || recipients.length === 0 || !subject || !message || !selectedProject
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {sending ? 'Skickar...' : `Skicka till ${recipients.length} mottagare`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Bekräfta utskick</h3>
            <p className="text-gray-600 mb-6">
              Du är på väg att skicka e-post till <span className="font-semibold">{recipients.length} mottagare</span>.
              Är du säker på att du vill fortsätta?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={sendEmails}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Skicka e-post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}