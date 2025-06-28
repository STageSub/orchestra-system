'use client'

import { useState, useEffect } from 'react'
import NeedFilesSection from './need-files-section'
import Tooltip from './tooltip'
import RequestSummaryTooltip from './request-summary-tooltip'
import StrategyTooltip from './strategy-tooltip'
import RankingListTooltip from './ranking-list-tooltip'

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
  rankingList: RankingList
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

interface CompactNeedsViewProps {
  needs: ProjectNeed[]
  statusFilter: 'all' | 'not_started' | 'in_progress' | 'completed'
  groupByInstrument: boolean
  onViewRequests: (needId: number) => void
  onEditNeed: (needId: number) => void
  onDeleteNeed: (needId: number) => void
  onUploadFile: (needId: number) => void
  onReuseFiles: (needId: number) => void
  onTogglePause?: (needId: number) => void
  onSendRequests?: (needId: number) => void
  projectId: number
  hasProjectFiles: boolean
  filesRefreshTrigger?: number
  collapseAllGroups?: boolean
}

export default function CompactNeedsView({
  needs,
  statusFilter,
  groupByInstrument,
  onViewRequests,
  onEditNeed,
  onDeleteNeed,
  onUploadFile,
  onReuseFiles,
  onTogglePause,
  onSendRequests,
  projectId,
  hasProjectFiles,
  filesRefreshTrigger,
  collapseAllGroups
}: CompactNeedsViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedNeeds, setExpandedNeeds] = useState<Set<number>>(new Set())
  const [needsWithFiles, setNeedsWithFiles] = useState<Set<number>>(new Set())

  const getStatusInfo = (need: ProjectNeed) => {
    if (!need.status) return { label: 'Ej startad', color: 'bg-gray-100 text-gray-700', priority: 0 }
    if (need.status.isFullyStaffed) return { label: 'Färdig', color: 'bg-green-100 text-green-700', priority: 3 }
    if (need.needStatus === 'paused') return { label: 'Pausad', color: 'bg-yellow-100 text-yellow-700', priority: 2 }
    if (need.status.totalRequests > 0) return { label: 'Pågående', color: 'bg-blue-100 text-blue-700', priority: 2 }
    return { label: 'Ej startad', color: 'bg-gray-100 text-gray-700', priority: 1 }
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'sequential': return 'Sekventiell'
      case 'parallel': return 'Parallell'
      case 'first_come': return 'Först till kvarn'
      default: return strategy
    }
  }

  // Filter needs based on status
  const filteredNeeds = needs.filter(need => {
    const statusInfo = getStatusInfo(need)
    switch (statusFilter) {
      case 'not_started': return statusInfo.priority <= 1
      case 'in_progress': return statusInfo.priority === 2
      case 'completed': return statusInfo.priority === 3
      default: return true
    }
  })

  // Group needs
  const groupedNeeds = groupByInstrument
    ? filteredNeeds.reduce((groups, need) => {
        const instrument = need.position.instrument.name
        if (!groups[instrument]) groups[instrument] = []
        groups[instrument].push(need)
        return groups
      }, {} as Record<string, ProjectNeed[]>)
    : { 'Alla behov': filteredNeeds }
  
  // Update collapsed groups when collapseAllGroups changes
  useEffect(() => {
    if (collapseAllGroups !== undefined) {
      if (collapseAllGroups) {
        setCollapsedGroups(new Set(Object.keys(groupedNeeds)))
      } else {
        setCollapsedGroups(new Set())
      }
    }
  }, [collapseAllGroups, Object.keys(groupedNeeds).join(',')])

  // Check which needs have files
  useEffect(() => {
    const checkNeedFiles = async () => {
      const newNeedsWithFiles = new Set<number>()
      
      await Promise.all(
        needs.map(async (need) => {
          try {
            const response = await fetch(`/api/projects/${projectId}/needs/${need.id}/files`)
            if (response.ok) {
              const files = await response.json()
              if (files.length > 0) {
                newNeedsWithFiles.add(need.id)
              }
            }
          } catch (error) {
            console.error('Error checking files for need:', need.id, error)
          }
        })
      )
      
      setNeedsWithFiles(newNeedsWithFiles)
    }
    
    checkNeedFiles()
  }, [needs, projectId, filesRefreshTrigger])

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

  const toggleNeedExpansion = (needId: number) => {
    const newExpanded = new Set(expandedNeeds)
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId)
    } else {
      newExpanded.add(needId)
    }
    setExpandedNeeds(newExpanded)
  }

  const getProgressBar = (need: ProjectNeed) => {
    if (!need.status) return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-gray-300 h-2 rounded-full w-0" />
      </div>
    )
    
    const { acceptedCount, pendingCount } = need.status
    const total = need.quantity
    const acceptedPercentage = (acceptedCount / total) * 100
    const totalActivePercentage = Math.min(((acceptedCount + pendingCount) / total) * 100, 100)

    return (
      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
        <div 
          className="bg-yellow-300 h-2 rounded-full absolute left-0 transition-all duration-300" 
          style={{ width: `${Math.min(totalActivePercentage, 100)}%` }}
        />
        <div 
          className="bg-green-500 h-2 rounded-full absolute left-0 transition-all duration-300" 
          style={{ width: `${Math.min(acceptedPercentage, 100)}%` }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(groupedNeeds).map(([groupName, groupNeeds]) => (
        <div key={groupName} className="border border-gray-200 rounded-lg">
          {groupByInstrument && (
            <div 
              className="bg-gray-50 border-b border-gray-200 px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
              onClick={() => toggleGroup(groupName)}
            >
              <div className="flex items-center space-x-2">
                <svg 
                  className={`w-4 h-4 transition-transform ${collapsedGroups.has(groupName) ? '' : 'rotate-90'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h4 className="font-medium text-gray-900">{groupName}</h4>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{groupNeeds.length} behov</span>
                <span>{groupNeeds.reduce((sum, need) => sum + (need.status?.acceptedCount || 0), 0)}/{groupNeeds.reduce((sum, need) => sum + need.quantity, 0)} bemannat</span>
              </div>
            </div>
          )}
          
          {!collapsedGroups.has(groupName) && (
            <div className="divide-y divide-gray-100">
              {groupNeeds.map((need) => {
                const statusInfo = getStatusInfo(need)
                return (
                  <div key={need.id} className="p-4 hover:bg-gray-50">
                    <div className="space-y-2">
                      {/* First row: Status badge, position name, metadata */}
                      <div className="grid grid-cols-[75px_200px_120px_310px] gap-1 items-center">
                        {/* Column 1: Status badge */}
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex-shrink-0`}>
                          {statusInfo.label}
                        </span>
                        
                        {/* Column 2: Position name with edit/delete icons */}
                        <div className="flex items-center space-x-2">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {!groupByInstrument && `${need.position.instrument.name} - `}{need.position.name}
                          </h5>
                          {(!need.status || need.status.totalRequests === 0) && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => onEditNeed(need.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Redigera"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onDeleteNeed(need.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Radera behov"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Column 3: Metadata */}
                        <div className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                          <Tooltip
                            content={
                              <RankingListTooltip 
                                rankingListId={need.rankingList.id}
                                listType={need.rankingList.listType}
                                positionName={need.position.name}
                              />
                            }
                            delay={700}
                          >
                            <span className="cursor-help border-b border-dashed border-gray-400">
                              Lista {need.rankingList.listType}
                            </span>
                          </Tooltip>
                          <span className="mx-1">•</span>
                          <Tooltip
                            content={<StrategyTooltip strategy={need.requestStrategy} />}
                            delay={700}
                          >
                            <span className="cursor-help border-b border-dashed border-gray-400">
                              {getStrategyLabel(need.requestStrategy)}
                            </span>
                          </Tooltip>
                        </div>
                        
                        {/* Column 4: Progress bar and count */}
                        <Tooltip 
                          content={
                            <RequestSummaryTooltip 
                              projectId={projectId} 
                              needId={need.id} 
                              strategy={need.requestStrategy}
                            />
                          }
                          delay={500}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity justify-end pr-4">
                            <div className="w-24 flex-shrink-0">
                              {getProgressBar(need)}
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-center">
                              {need.status?.acceptedCount || 0}/{need.quantity}
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                      
                      {/* Second row: Action icons */}
                      <div className="grid grid-cols-[75px_200px_120px_310px] gap-1 items-center">
                        {/* Column 1: Empty space to align with status badge */}
                        <div></div>
                        
                        {/* Column 2: Empty */}
                        <div></div>
                        
                        {/* Column 3: Expand/collapse button centered under bullet */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleNeedExpansion(need.id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all group"
                            title={needsWithFiles.has(need.id) ? "Visa/dölj filer" : "Ladda upp filer"}
                          >
                            <div className="relative">
                              {needsWithFiles.has(need.id) ? (
                                // Document icon when files exist
                                <svg 
                                  className="w-4.5 h-4.5" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                // Upload icon when no files
                                <svg 
                                  className="w-4.5 h-4.5" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              )}
                              <svg 
                                className={`absolute -bottom-1 -right-1 w-3 h-3 transition-transform bg-white rounded-full ${expandedNeeds.has(need.id) ? 'rotate-180' : ''}`}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </button>
                        </div>
                        
                        {/* Column 4: Action buttons */}
                        <div className="flex items-center justify-end space-x-2 pr-4">
                          {/* View button */}
                          {need.status?.totalRequests > 0 && (
                            <button
                              onClick={() => onViewRequests(need.id)}
                              className="px-3 py-1 text-xs font-medium rounded transition-colors bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                              title="Visa förfrågningar"
                            >
                              Visa
                            </button>
                          )}
                          
                          {/* Pause/Resume button */}
                          {need.status?.totalRequests > 0 && onTogglePause && !need.status.isFullyStaffed && (
                            <button
                              onClick={() => onTogglePause(need.id)}
                              className={`px-3 py-1 text-xs font-medium rounded transition-colors border ${
                                need.needStatus === 'paused' 
                                  ? 'bg-white text-green-600 hover:bg-green-50 border-green-300' 
                                  : 'bg-white text-yellow-600 hover:bg-yellow-50 border-yellow-300'
                              }`}
                              title={need.needStatus === 'paused' ? 'Återuppta förfrågningar' : 'Pausa förfrågningar'}
                            >
                              {need.needStatus === 'paused' ? 'Återuppta' : 'Pausa'}
                            </button>
                          )}
                          
                          {/* Send button */}
                          {need.status?.totalRequests === 0 && onSendRequests && (
                            <button
                              onClick={() => onSendRequests(need.id)}
                              className="px-3 py-1 text-xs font-medium rounded transition-colors bg-white text-blue-600 hover:bg-blue-50 border border-blue-300"
                              title="Skicka förfrågan endast för denna position"
                            >
                              Skicka
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedNeeds.has(need.id) && (
                      <div className="mt-3 px-4 pb-3">
                        <NeedFilesSection 
                          projectId={projectId}
                          needId={need.id}
                          refreshTrigger={filesRefreshTrigger}
                          hasProjectFiles={hasProjectFiles}
                          onUploadClick={() => onUploadFile(need.id)}
                          onReuseClick={() => onReuseFiles(need.id)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}