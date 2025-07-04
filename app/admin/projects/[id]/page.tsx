'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AddProjectNeedModal from '@/components/add-project-need-modal'
import EditProjectNeedModal from '@/components/edit-project-need-modal'
import FileUploadModal from '@/components/file-upload-modal'
import ReuseFilesModal from '@/components/reuse-files-modal'
import ProjectRequestsModal from '@/components/project-requests-modal'
import SendRequestsPreviewModal from '@/components/send-requests-preview-modal'
import SendAllRequestsPreviewModal from '@/components/send-all-requests-preview-modal'
import CompactNeedsView from '@/components/compact-needs-view'
import ConflictWarning from '@/components/conflict-warning'
import { toast } from '@/components/toast'
import { useProjectEvents } from '@/hooks/use-project-events'
import AcceptedMusiciansModal from '@/components/accepted-musicians-modal'
import SuccessModal from '@/components/success-modal'
import EmailSendProgressModal from '@/components/email-send-progress-modal-v2'

interface Position {
  id: number
  name: string
  instrument: {
    id: number
    name: string
  }
}

interface RankingList {
  id: number
  listType: string
  description: string | null
}

interface ProjectNeed {
  id: number
  projectNeedId: string
  quantity: number
  requestStrategy: string
  maxRecipients: number | null
  responseTimeHours: number | null
  position: Position
  rankingList?: RankingList | null
  customRankingList?: {
    id: number
    customListId: string
    name: string
    projectId: number
    positionId: number
  } | null
  needStatus?: string
  _count?: {
    requests: number
  }
  status?: {
    acceptedCount: number
    pendingCount: number
    declinedCount: number
    totalRequests: number
    isFullyStaffed: boolean
    remainingNeeded: number
  }
}

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
    position: Position
  }
}

interface Project {
  id: number
  projectId: string
  name: string
  startDate: string
  weekNumber: number
  rehearsalSchedule: string | null
  concertInfo: string | null
  notes: string | null
  projectNeeds: ProjectNeed[]
  projectFiles?: ProjectFile[]
  _count?: {
    projectFiles: number
  }
}

export default function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [sendingSessionId, setSendingSessionId] = useState<string | null>(null)
  const [emailVolume, setEmailVolume] = useState(0)
  const searchParams = useSearchParams()
  const [paramsId, setParamsId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [selectedNeedForRequests, setSelectedNeedForRequests] = useState<number | null>(null)
  const [showAddNeed, setShowAddNeed] = useState(false)
  const [customRankingListId, setCustomRankingListId] = useState<number | null>(null)
  const [prefilledPositionId, setPrefilledPositionId] = useState<number | null>(null)
  const [showUploadFile, setShowUploadFile] = useState(false)
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [uploadForNeedId, setUploadForNeedId] = useState<number | null>(null)
  const [showReuseFiles, setShowReuseFiles] = useState(false)
  const [reuseForNeedId, setReuseForNeedId] = useState<number | null>(null)
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all')
  const [showEditNeed, setShowEditNeed] = useState(false)
  const [editingNeedId, setEditingNeedId] = useState<number | null>(null)
  const [showSendPreview, setShowSendPreview] = useState(false)
  const [sendPreviewNeedId, setSendPreviewNeedId] = useState<number | null>(null)
  const [showGlobalSendPreview, setShowGlobalSendPreview] = useState(false)
  const [sendingRequests, setSendingRequests] = useState(false)
  const [collapseAllGroups, setCollapseAllGroups] = useState<boolean | undefined>(undefined)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAcceptedMusicians, setShowAcceptedMusicians] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [customListsCount, setCustomListsCount] = useState(0)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [totalEmailsToSend, setTotalEmailsToSend] = useState(0)
  const [sessionId, setSessionId] = useState<string>('')
  
  // Use project events hook for toast notifications
  useProjectEvents(project?.id || 0)

  useEffect(() => {
    params.then(p => {
      setParamsId(p.id)
    })
  }, [params])

  // Check for custom list parameters in URL
  useEffect(() => {
    const customListId = searchParams.get('customListId')
    const positionId = searchParams.get('positionId')
    
    if (customListId && positionId) {
      setCustomRankingListId(parseInt(customListId))
      setPrefilledPositionId(parseInt(positionId))
      setShowAddNeed(true)
      
      // Clear the URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('customListId')
      url.searchParams.delete('positionId')
      window.history.replaceState({}, '', url)
    }
  }, [searchParams])

  useEffect(() => {
    if (paramsId) {
      fetchProject()
      fetchProjectFiles()
      fetchCustomListsCount()
    }
  }, [paramsId])

  // Auto-refresh project data every 30 seconds when page is visible
  useEffect(() => {
    if (!paramsId) return

    let intervalId: NodeJS.Timeout

    const startPolling = () => {
      // Initial fetch
      fetchProject()
      
      // Set up polling interval (30 seconds)
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchProject()
        }
      }, 30000)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh immediately
        fetchProject()
      }
    }

    // Start polling
    startPolling()

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [paramsId])



  const fetchProject = async () => {
    if (!paramsId) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/projects/${paramsId}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setIsUpdating(false), 500) // Brief animation
    }
  }
  
  const handleSendRequests = () => {
    setShowGlobalSendPreview(true)
  }
  
  const confirmSendRequests = async () => {
    setSendingRequests(true)
    try {
      // First, get the preview to determine email volume
      const previewResponse = await fetch(`/api/projects/${paramsId}/preview-all-requests`)
      if (!previewResponse.ok) {
        throw new Error('Kunde inte hämta förhandsgranskning')
      }
      const previewData = await previewResponse.json()
      const totalEmails = previewData.totalToSend
      
      // Generate a unique session ID for this send operation
      const sessionId = `send-${Date.now()}`
      setSendingSessionId(sessionId)
      setEmailVolume(totalEmails)
      
      // Show progress modal if more than 10 emails
      if (totalEmails > 10) {
        setShowProgressModal(true)
        setShowGlobalSendPreview(false)
      }
      
      // Start sending requests
      const response = await fetch(`/api/projects/${paramsId}/send-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // If we were showing progress modal, close it
        if (showProgressModal) {
          setShowProgressModal(false)
        }
        
        setSuccessMessage(`${result.totalSent} förfrågningar skickades ut.`)
        setShowSuccessModal(true)
        fetchProject() // Reload to update counts
        setShowGlobalSendPreview(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Ett fel uppstod vid utskick av förfrågningar')
      }
    } catch (error) {
      console.error('Error sending requests:', error)
      setShowProgressModal(false)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Ett fel uppstod vid utskick av förfrågningar')
      }
      throw error
    } finally {
      setSendingRequests(false)
      setSendingSessionId(null)
    }
  }
  
  const handlePauseProject = async () => {
    const action = allNeedsPaused ? 'återuppta' : 'pausa'
    const confirmMessage = allNeedsPaused 
      ? 'Återuppta projekt?\n\n' +
        'Detta kommer att:\n' +
        '✓ Tillåta nya förfrågningar att skickas igen\n' +
        '✓ Aktivera alla pausade behov\n\n' +
        'Vill du fortsätta?'
      : 'Pausa projekt?\n\n' +
        'Detta kommer att:\n' +
        '✓ Stoppa ALLA NYA förfrågningar från att skickas\n' +
        '✓ Behålla väntande förfrågningar (musiker kan fortfarande svara)\n\n' +
        'OBS! Detta påverkar hela projektet.\n\n' +
        'Vill du fortsätta?'
    
    if (!confirm(confirmMessage)) return
    
    try {
      const response = await fetch(`/api/projects/${paramsId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause: !allNeedsPaused })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchProject() // Reload to update status
      } else {
        const error = await response.json()
        alert(error.error || `Kunde inte ${action} projektet`)
      }
    } catch (error) {
      console.error('Error pausing/resuming project:', error)
      alert(`Ett fel uppstod vid att ${action} projektet`)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmText !== 'RADERA') return
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Navigate to projects list after successful deletion
        window.location.href = '/admin/projects'
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort projektet')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Ett fel uppstod vid borttagning av projektet')
    }
  }

  const handleDeleteNeed = async (needId: number) => {
    if (!confirm('Är du säker på att du vill ta bort detta behov?')) return
    
    try {
      const response = await fetch(`/api/projects/${paramsId}/needs/${needId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.archived) {
          alert(result.message || 'Behovet arkiverades')
        }
        fetchProject() // Reload project data
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort behovet')
      }
    } catch (error) {
      console.error('Error deleting need:', error)
      alert('Ett fel uppstod vid borttagning')
    }
  }

  const fetchProjectFiles = async () => {
    if (!paramsId) return
    
    try {
      const response = await fetch(`/api/projects/${paramsId}/files`)
      if (response.ok) {
        const data = await response.json()
        setProjectFiles(data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }
  
  const fetchCustomListsCount = async () => {
    if (!paramsId) return
    
    try {
      const response = await fetch(`/api/projects/${paramsId}/custom-lists/all`)
      if (response.ok) {
        const data = await response.json()
        setCustomListsCount(data.customLists?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching custom lists count:', error)
    }
  }
  
  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna fil?')) return
    
    try {
      const response = await fetch(`/api/projects/${paramsId}/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchProjectFiles() // Reload files
        fetchProject() // Update project counts
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte ta bort filen')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Ett fel uppstod vid borttagning av filen')
    }
  }


  const handleViewRequests = (needId: number) => {
    setSelectedNeedForRequests(needId)
    setShowRequestsModal(true)
  }

  const handleTogglePause = async (needId: number) => {
    const need = project?.projectNeeds.find(n => n.id === needId)
    if (!need) return

    // Show warning when pausing
    if (need.needStatus !== 'paused' && need.status?.pendingCount && need.status.pendingCount > 0) {
      const confirmed = confirm(
        'OBS! Väntande förfrågningar förblir aktiva. Musiker kan fortfarande svara.\n\n' +
        'Endast NYA förfrågningar pausas.\n\n' +
        'Vill du fortsätta?'
      )
      if (!confirmed) return
    }

    try {
      const newStatus = need.needStatus === 'paused' ? 'active' : 'paused'
      const response = await fetch(`/api/projects/${project!.id}/needs/${needId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchProject() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Kunde inte uppdatera status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Ett fel uppstod')
    }
  }

  const handleSendDirectPreview = (needId: number) => {
    setSendPreviewNeedId(needId)
    setShowSendPreview(true)
  }

  const handleConfirmSendRequests = async () => {
    if (!sendPreviewNeedId || !project) return
    
    const response = await fetch(`/api/projects/${project.id}/send-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectNeedId: sendPreviewNeedId })
    })

    if (response.ok) {
      const data = await response.json()
      setSuccessMessage(data.message)
      setShowSuccessModal(true)
      fetchProject()
      setShowSendPreview(false)
      setSendPreviewNeedId(null)
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Kunde inte skicka förfrågningar')
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
      return { label: 'Kommande', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { label: 'Genomfört', color: 'bg-gray-100 text-gray-800' }
    }
  }



  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Laddar projekt...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Projekt hittades inte</p>
        <Link
          href="/admin/projects"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500 transition-colors duration-300"
        >
          Tillbaka till projekt
        </Link>
      </div>
    )
  }

  const status = getProjectStatus(project.startDate)
  const totalNeeds = project.projectNeeds.reduce((sum, need) => sum + need.quantity, 0)
  const totalRequests = project.projectNeeds.reduce((sum, need) => sum + (need._count?.requests || 0), 0)
  const totalAccepted = project.projectNeeds.reduce((sum, need) => sum + (need.status?.acceptedCount || 0), 0)
  const staffingPercentage = totalNeeds > 0 ? Math.round((totalAccepted / totalNeeds) * 100) : 0
  
  // Check if there are any needs that require requests to be sent
  const needsRequiringRequests = project.projectNeeds.filter(need => {
    const acceptedCount = need.status?.acceptedCount || 0
    const pendingCount = need.status?.pendingCount || 0
    return acceptedCount + pendingCount < need.quantity && need.needStatus !== 'paused'
  })
  const hasNeedsToSend = needsRequiringRequests.length > 0
  
  // Check if all needs are paused
  const allNeedsPaused = project.projectNeeds.length > 0 && project.projectNeeds.every(need => need.needStatus === 'paused')

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Link
            href="/admin/projects"
            className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 transition-colors duration-300"
          >
            <span>←</span>
            <span>Projekt</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">{project.name}</span>
          </Link>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center space-x-3">
              <span>{project.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-normal text-gray-600">Vecka {project.weekNumber}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-normal text-gray-600">{formatDate(project.startDate)}</span>
            </h2>
          </div>
        </div>
      </div>


      {/* Paused warning banner */}
      {allNeedsPaused && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Projektet är pausat</strong> - Alla behov är pausade och inga nya förfrågningar skickas ut. 
                Väntande förfrågningar förblir aktiva och musiker kan fortfarande svara.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bemanningsstatus box - vänster */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-evenly items-center h-full">
            <div className="flex items-center">
              <div className="relative w-14 h-14 mr-3">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    d="M18 2.0845 A 15.9155 15.9155 0 1 1 18 33.9155 A 15.9155 15.9155 0 1 1 18 2.0845"
                  />
                  <path
                    className={staffingPercentage === 100 ? "text-green-400" : "text-blue-400"}
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${staffingPercentage}, 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                    d="M18 2.0845 A 15.9155 15.9155 0 1 1 18 33.9155 A 15.9155 15.9155 0 1 1 18 2.0845"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-700">{staffingPercentage}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bemannat</p>
                <p className="text-lg font-medium text-gray-900">{totalAccepted}/{totalNeeds}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-gray-200"></div>
            
            <button
              onClick={() => setShowAcceptedMusicians(true)}
              className="flex items-center px-3 py-2 -m-2 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer group"
              disabled={totalAccepted === 0}
            >
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Accepterade</p>
                <div className="flex items-center space-x-1">
                  <p className="text-lg font-medium text-gray-900">{totalAccepted}</p>
                  {totalAccepted > 0 && (
                    <svg className="w-4 h-4 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Projekt-översikt box - höger (tar 2 kolumner) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-evenly items-center h-full">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Behov</p>
                <p className="text-lg font-medium text-gray-900">{totalNeeds}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-gray-200"></div>
            
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Förfrågningar</p>
                <p className="text-lg font-medium text-gray-900">{totalRequests}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-gray-200"></div>
            
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Instrument</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Set(project.projectNeeds.map(n => n.position.instrument.id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane - Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Grundinformation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Grundinformation</h4>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Redigera
                  </Link>
                  {totalRequests === 0 && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50 transition-all duration-300"
                      title="Ta bort projekt"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Ta bort projekt
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-500 w-16">Namn:</span>
                  <span className="text-xs text-gray-900">{project.name}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-500 w-16">Datum:</span>
                  <span className="text-xs text-gray-900">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-500 w-16">Vecka:</span>
                  <span className="text-xs text-gray-900">{project.weekNumber}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs font-medium text-gray-500 w-16">Status:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              
              {/* Skicka alla förfrågningar knapp */}
              {hasNeedsToSend && (
                <div className="mt-3">
                  <button
                    onClick={() => handleSendRequests()}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-300"
                    title="Skickar förfrågningar för alla behov som inte är fullt bemannade"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Skicka alla förfrågningar
                  </button>
                </div>
              )}
              
              {/* Pausa alla aktiva förfrågningar - nödfåll */}
              {project.projectNeeds.some(need => need.status?.totalRequests && need.status.totalRequests > 0) && (
                <div className="mt-2">
                  <button
                    onClick={() => handlePauseProject()}
                    className={`w-full inline-flex items-center justify-center px-3 py-2 rounded text-sm font-medium border transition-all duration-300 ${
                      allNeedsPaused 
                        ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' 
                        : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                    }`}
                    title={allNeedsPaused ? 'Tillåter nya förfrågningar att skickas igen' : 'Stoppar nya förfrågningar. Väntande svar kan fortfarande komma in'}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {allNeedsPaused ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    {allNeedsPaused ? 'Återuppta projekt' : 'Pausa projekt'}
                  </button>
                </div>
              )}
            </div>

            {/* Filer - Flyttat upp */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Projektfiler</h4>
              {projectFiles.filter(f => !f.projectNeedId).length === 0 ? (
                <button
                  onClick={() => {
                    setUploadForNeedId(null)
                    setShowUploadFile(true)
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-300 group"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Ladda upp filer</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-1">
                  {projectFiles.filter(f => !f.projectNeedId).slice(0, 3).map((file) => (
                    <div key={file.id} className="flex items-center justify-between text-xs text-gray-600 group hover:bg-gray-50 p-2 rounded transition-colors duration-300">
                      <div className="flex items-center space-x-2 truncate">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{file.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-300 ml-2 flex-shrink-0"
                        title="Ta bort"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {projectFiles.filter(f => !f.projectNeedId).length > 3 && (
                    <p className="text-xs text-gray-500 pl-2">+{projectFiles.filter(f => !f.projectNeedId).length - 3} filer till</p>
                  )}
                  <button
                    onClick={() => {
                      setUploadForNeedId(null)
                      setShowUploadFile(true)
                    }}
                    className="w-full mt-2 py-2 text-xs text-blue-600 hover:text-blue-800 font-medium border border-gray-200 rounded hover:bg-gray-50 transition-all duration-300"
                  >
                    + Ladda upp fler
                  </button>
                </div>
              )}
            </div>

            {/* Projektdetaljer - Kombinerad sektion */}
            {(project.rehearsalSchedule || project.concertInfo) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Projektdetaljer</h4>
                <div className="space-y-2">
                  {project.rehearsalSchedule && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Repetitionsschema</p>
                      <div className="bg-blue-50 rounded p-2 border border-blue-200">
                        <p className="text-xs text-gray-800 whitespace-pre-wrap">{project.rehearsalSchedule}</p>
                      </div>
                    </div>
                  )}
                  {project.concertInfo && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Konsertinformation</p>
                      <div className="bg-purple-50 rounded p-2 border border-purple-200">
                        <p className="text-xs text-gray-800 whitespace-pre-wrap">{project.concertInfo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gruppmail */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Gruppmail</h4>
              <div className="bg-gray-50 rounded p-2 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    {project._count?.groupEmailLogs || 0} gruppmail skickade
                  </p>
                  {(project._count?.groupEmailLogs || 0) > 0 && (
                    <Link
                      href={`/admin/group-email/history?projectId=${project.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-300"
                    >
                      Visa historik →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Anpassade listor */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Anpassade listor</h4>
              <div className="bg-gray-50 rounded p-2 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    {customListsCount > 0 
                      ? `${customListsCount} anpassade listor skapade`
                      : 'Hantera projektspecifika rankningslistor'
                    }
                  </p>
                  <Link
                    href={`/admin/projects/${project.id}/custom-lists`}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-300"
                  >
                    Visa listor →
                  </Link>
                </div>
              </div>
            </div>

            {/* Anteckningar */}
            {project.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Anteckningar</h4>
                <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{project.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Pane - Needs & Requests */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Musikerbehov & Förfrågningar</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Manual refresh button */}
                  <button
                    onClick={() => fetchProject()}
                    disabled={isUpdating}
                    className="h-10 w-10 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium flex items-center justify-center transition-all duration-300"
                    title="Uppdatera nu"
                  >
                    <svg className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {/* Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'not_started' | 'in_progress' | 'completed')}
                    className="h-10 text-sm border border-gray-300 rounded-md px-4 py-2 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-300"
                  >
                    <option value="all">Alla behov</option>
                    <option value="not_started">Ej startade</option>
                    <option value="in_progress">Pågående</option>
                    <option value="completed">Färdiga</option>
                  </select>
                  {project.projectNeeds.length > 0 && (
                    <button
                      onClick={() => setCollapseAllGroups(prev => prev === true ? false : true)}
                      className="h-10 text-sm border border-gray-300 rounded-md px-4 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-300"
                    >
                      {collapseAllGroups === true ? 'Expandera alla' : 'Minimera alla'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddNeed(true)}
                    className="h-10 text-sm bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors duration-300"
                  >
                    + Nytt behov
                  </button>
                </div>
              </div>

              {/* Conflict warning */}
              {project && <ConflictWarning projectId={project.id} />}

              {project.projectNeeds.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Inga musikerbehov har definierats för detta projekt</p>
                  <button
                    onClick={() => setShowAddNeed(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
                  >
                    Lägg till första behovet
                  </button>
                </div>
              ) : (
                <CompactNeedsView
                  needs={project.projectNeeds}
                  statusFilter={statusFilter}
                  groupByInstrument={true}
                  projectId={project.id}
                  hasProjectFiles={projectFiles.length > 0}
                  filesRefreshTrigger={filesRefreshTrigger}
                  collapseAllGroups={collapseAllGroups}
                  onViewRequests={handleViewRequests}
                  onTogglePause={handleTogglePause}
                  onSendRequests={handleSendDirectPreview}
                  onEditNeed={(needId) => {
                    setEditingNeedId(needId)
                    setShowEditNeed(true)
                  }}
                  onDeleteNeed={handleDeleteNeed}
                  onUploadFile={(needId) => {
                    setUploadForNeedId(needId)
                    setShowUploadFile(true)
                  }}
                  onReuseFiles={(needId) => {
                    setReuseForNeedId(needId)
                    setShowReuseFiles(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Need Modal */}
      {showAddNeed && (
        <AddProjectNeedModal
          projectId={project.id}
          onClose={() => {
            setShowAddNeed(false)
            setCustomRankingListId(null)
            setPrefilledPositionId(null)
          }}
          onSuccess={() => {
            fetchProject()
            setCustomRankingListId(null)
            setPrefilledPositionId(null)
          }}
          customRankingListId={customRankingListId || undefined}
          prefilledPositionId={prefilledPositionId || undefined}
        />
      )}
      
      {/* File Upload Modal */}
      {showUploadFile && project && (
        <FileUploadModal
          projectId={project.id}
          projectNeedId={uploadForNeedId || undefined}
          isGeneralFile={!uploadForNeedId}
          onClose={() => {
            setShowUploadFile(false)
            setUploadForNeedId(null)
          }}
          onSuccess={() => {
            fetchProjectFiles()
            fetchProject()
            setFilesRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
      
      {/* Reuse Files Modal */}
      {showReuseFiles && project && reuseForNeedId && (
        <ReuseFilesModal
          projectId={project.id}
          currentNeedId={reuseForNeedId}
          onClose={() => {
            setShowReuseFiles(false)
            setReuseForNeedId(null)
          }}
          onSuccess={() => {
            fetchProjectFiles()
            fetchProject()
            setFilesRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
      
      {/* Edit Need Modal */}
      {showEditNeed && project && editingNeedId && (
        <EditProjectNeedModal
          projectId={project.id}
          needId={editingNeedId}
          onClose={() => {
            setShowEditNeed(false)
            setEditingNeedId(null)
          }}
          onSuccess={() => {
            fetchProject()
          }}
        />
      )}
      
      {/* Project Requests Modal */}
      <ProjectRequestsModal
        projectId={project.id}
        needId={selectedNeedForRequests}
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false)
          setSelectedNeedForRequests(null)
        }}
      />
      
      {/* Global Send Requests Preview Modal */}
      <SendAllRequestsPreviewModal
        projectId={project.id}
        isOpen={showGlobalSendPreview}
        onClose={() => setShowGlobalSendPreview(false)}
        onConfirm={confirmSendRequests}
      />
      
      {/* Send Requests Preview Modal */}
      {sendPreviewNeedId && (
        <SendRequestsPreviewModal
          projectId={project.id}
          needId={sendPreviewNeedId}
          isOpen={showSendPreview}
          onClose={() => {
            setShowSendPreview(false)
            setSendPreviewNeedId(null)
          }}
          onConfirm={handleConfirmSendRequests}
        />
      )}
      
      {/* Accepted Musicians Modal */}
      {showAcceptedMusicians && project && (
        <AcceptedMusiciansModal
          isOpen={showAcceptedMusicians}
          onClose={() => setShowAcceptedMusicians(false)}
          projectId={project.id.toString()}
          projectName={project.name}
        />
      )}
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Förfrågningar skickade!"
        message={successMessage}
      />
      
      {/* Email Send Progress Modal */}
      {showProgressModal && sendingSessionId && (
        <EmailSendProgressModal
          projectId={paramsId}
          sessionId={sendingSessionId}
          volume={emailVolume}
          isOpen={showProgressModal}
          onClose={() => {
            setShowProgressModal(false)
            setSendingSessionId(null)
          }}
        />
      )}
      
      {/* Delete Project Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <svg className="w-12 h-12 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ta bort projekt</h3>
                  <p className="text-sm text-gray-500 mt-1">Denna åtgärd kan inte ångras</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Du håller på att ta bort projektet <span className="font-semibold">{project.name}</span>.
                </p>
                <p className="text-sm text-gray-600">
                  För att bekräfta borttagningen, skriv <span className="font-semibold">RADERA</span> i fältet nedan:
                </p>
              </div>
              
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Skriv RADERA här"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                autoFocus
              />
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmText !== 'RADERA'}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Ta bort projekt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}