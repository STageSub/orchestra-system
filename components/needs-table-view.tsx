'use client'

import { useState } from 'react'
import NeedFilesSection from './need-files-section'

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

interface CustomRankingList {
  id: number
  name: string
  customListId: string
  projectId: number
}

interface ProjectNeed {
  id: number
  projectNeedId: string
  quantity: number
  requestStrategy: string
  maxRecipients: number | null
  responseTimeHours: number | null
  position: Position
  rankingList: RankingList | null
  customRankingList?: CustomRankingList | null
  _count?: {
    requests: number
  }
  // We'll need to add these from the API
  status?: {
    acceptedCount: number
    pendingCount: number
    declinedCount: number
    totalRequests: number
    isFullyStaffed: boolean
    remainingNeeded: number
  }
  needStatus?: string
}

interface NeedsTableViewProps {
  needs: ProjectNeed[]
  onEditNeed: (needId: number) => void
  onDeleteNeed: (needId: number) => void
  onViewRequests: () => void
  projectId: number
  filesRefreshTrigger?: number
  onUploadFile: (needId: number) => void
  onReuseFiles: (needId: number) => void
  hasProjectFiles?: boolean
}

export default function NeedsTableView({ 
  needs, 
  onEditNeed, 
  onDeleteNeed, 
  onViewRequests, 
  projectId, 
  filesRefreshTrigger, 
  onUploadFile, 
  onReuseFiles, 
  hasProjectFiles = false 
}: NeedsTableViewProps) {
  const [sortBy, setSortBy] = useState<'instrument' | 'status' | 'requests'>('instrument')
  const [groupByInstrument, setGroupByInstrument] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpansion = (needId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId)
    } else {
      newExpanded.add(needId)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusInfo = (need: ProjectNeed) => {
    if (need.status?.isFullyStaffed) {
      return { label: 'Uppfyllt', color: 'text-green-600 bg-green-100', icon: '✓' }
    }
    if (need.needStatus === 'paused') {
      return { label: 'Pausat', color: 'text-orange-600 bg-orange-100', icon: '⏸️' }
    }
    if (need.status?.pendingCount && need.status.pendingCount > 0) {
      return { label: 'Pågående', color: 'text-yellow-600 bg-yellow-100', icon: '⏳' }
    }
    if (need.status?.totalRequests && need.status.totalRequests > 0) {
      return { label: 'Startat', color: 'text-blue-600 bg-blue-100', icon: '📧' }
    }
    return { label: 'Ej startat', color: 'text-gray-600 bg-gray-100', icon: '⭕' }
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'sequential': return 'Sekventiell'
      case 'parallel': return 'Parallell'
      case 'first_come': return 'Först till kvarn'
      default: return strategy
    }
  }


  const sortedNeeds = [...needs].sort((a, b) => {
    switch (sortBy) {
      case 'instrument':
        const instrumentCompare = a.position.instrument.name.localeCompare(b.position.instrument.name)
        if (instrumentCompare !== 0) return instrumentCompare
        return a.position.name.localeCompare(b.position.name)
      case 'status':
        const aStatus = getStatusInfo(a)
        const bStatus = getStatusInfo(b)
        return aStatus.label.localeCompare(bStatus.label)
      case 'requests':
        return (b._count?.requests || 0) - (a._count?.requests || 0)
      default:
        return 0
    }
  })

  const groupedNeeds = groupByInstrument
    ? sortedNeeds.reduce((groups, need) => {
        const instrument = need.position.instrument.name
        if (!groups[instrument]) groups[instrument] = []
        groups[instrument].push(need)
        return groups
      }, {} as Record<string, ProjectNeed[]>)
    : { 'Alla behov': sortedNeeds }

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

  const getProgressBar = (need: ProjectNeed) => {
    if (!need.status) return (
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div className="bg-gray-300 h-2 rounded-full w-0" />
      </div>
    )
    
    const { acceptedCount, pendingCount } = need.status
    const total = need.quantity
    const acceptedPercentage = (acceptedCount / total) * 100
    const totalActivePercentage = Math.min(((acceptedCount + pendingCount) / total) * 100, 100)

    return (
      <div className="w-20 bg-gray-200 rounded-full h-3 relative overflow-hidden">
        {/* Pending background */}
        <div 
          className="bg-yellow-300 h-3 rounded-full absolute left-0 transition-all duration-300" 
          style={{ width: `${Math.min(totalActivePercentage, 100)}%` }}
        />
        {/* Accepted foreground */}
        <div 
          className="bg-green-500 h-3 rounded-full absolute left-0 transition-all duration-300" 
          style={{ width: `${Math.min(acceptedPercentage, 100)}%` }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sortera:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="instrument">Instrument</option>
              <option value="status">Status</option>
              <option value="requests">Förfrågningar</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={groupByInstrument}
              onChange={(e) => setGroupByInstrument(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Gruppera efter instrument</span>
          </label>
        </div>
        <div className="text-sm text-gray-500">
          {needs.length} behov totalt
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {Object.entries(groupedNeeds).map(([groupName, groupNeeds]) => (
          <div key={groupName}>
            {groupByInstrument && (
              <div 
                className="bg-gray-50 border-b border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleGroup(groupName)}
              >
                <div className="flex items-center justify-between">
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
                  <span className="text-sm text-gray-500">{groupNeeds.length} behov</span>
                </div>
              </div>
            )}
            
            {!collapsedGroups.has(groupName) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tjänst
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Antal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lista
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strategi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Åtgärder
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {groupNeeds.map((need) => {
                      const statusInfo = getStatusInfo(need)
                      const isExpanded = expandedRows.has(need.id)
                      return (
                        <>
                          <tr key={need.id} className={`hover:bg-gray-50 ${isExpanded ? 'border-b-0' : 'border-b border-gray-200'}`}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => toggleRowExpansion(need.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Visa/dölj filer"
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {need.position.name}
                                </div>
                                {!groupByInstrument && (
                                  <div className="text-sm text-gray-500">
                                    {need.position.instrument.name}
                                  </div>
                                )}
                              </div>
                            </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {need.status ? `${need.status.acceptedCount}/${need.quantity}` : `0/${need.quantity}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {need.rankingList?.listType || (need.customRankingList ? 'Anpassad' : 'N/A')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {getStrategyLabel(need.requestStrategy)}
                              {need.maxRecipients && (
                                <div className="text-xs">Max: {need.maxRecipients}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <span className="mr-1">{statusInfo.icon}</span>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div
                                title={need.status ? 
                                  `Accepterat: ${need.status.acceptedCount}, Väntande: ${need.status.pendingCount}, Kvar: ${need.status.remainingNeeded}` : 
                                  'Inga förfrågningar skickade än'
                                }
                              >
                                {getProgressBar(need)}
                              </div>
                              {need.status && (
                                <span className="text-xs text-gray-500">
                                  {need.status.acceptedCount}/{need.quantity}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-1">
                              {/* Always show manage requests button */}
                              <button
                                onClick={onViewRequests}
                                className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Hantera förfrågningar"
                              >
                                {need.status?.totalRequests && need.status.totalRequests > 0 ? 
                                  'Visa förfrågningar' : 'Skicka förfrågningar'
                                }
                              </button>
                              
                              {/* Edit button - show when no requests have been sent */}
                              {(!need.status?.totalRequests || need.status.totalRequests === 0) && (
                                <>
                                  <button
                                    onClick={() => onEditNeed(need.id)}
                                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                    title="Redigera behov"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onDeleteNeed(need.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    title="Ta bort behov"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="ml-4">
                                <NeedFilesSection 
                                  projectId={projectId}
                                  needId={need.id}
                                  refreshTrigger={filesRefreshTrigger}
                                  hasProjectFiles={hasProjectFiles}
                                  onUploadClick={() => onUploadFile(need.id)}
                                  onReuseClick={() => onReuseFiles(need.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}