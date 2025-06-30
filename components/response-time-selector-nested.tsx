'use client'

import { useState, useEffect, useRef } from 'react'

interface ResponseTimeSelectorNestedProps {
  value: string // Current value in hours as string
  onChange: (hours: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
  compact?: boolean // Use compact button style
  simple?: boolean // Use simple input + dropdown style
}

interface TimeGroup {
  icon: string
  label: string
  options: { hours: number; label: string }[]
}

const TIME_GROUPS: TimeGroup[] = [
  {
    icon: '🕐',
    label: 'Timmar',
    options: [
      { hours: 1, label: '1h' },
      { hours: 2, label: '2h' },
      { hours: 3, label: '3h' },
      { hours: 4, label: '4h' },
      { hours: 6, label: '6h' },
      { hours: 8, label: '8h' },
      { hours: 12, label: '12h' },
      { hours: 18, label: '18h' },
    ]
  },
  {
    icon: '📅',
    label: 'Dagar',
    options: [
      { hours: 24, label: '1d' },
      { hours: 48, label: '2d' },
      { hours: 72, label: '3d' },
      { hours: 96, label: '4d' },
      { hours: 120, label: '5d' },
      { hours: 144, label: '6d' },
      { hours: 168, label: '7d' },
    ]
  },
  {
    icon: '📆',
    label: 'Veckor',
    options: [
      { hours: 168, label: '1v' },
      { hours: 336, label: '2v' },
      { hours: 504, label: '3v' },
      { hours: 672, label: '4v' },
    ]
  },
  {
    icon: '🗓',
    label: 'Månader',
    options: [
      { hours: 720, label: '1m' },
      { hours: 1440, label: '2m' },
      { hours: 2160, label: '3m' },
      { hours: 2880, label: '4m' },
      { hours: 3600, label: '5m' },
      { hours: 4320, label: '6m' },
    ]
  }
]

// Parse user input to hours
function parseTimeInput(input: string): number | null {
  if (!input || input.trim() === '') return null
  
  const normalized = input.toLowerCase().trim()
  
  // Try to parse as number first (plain hours)
  const plainNumber = parseFloat(normalized)
  if (!isNaN(plainNumber) && plainNumber > 0) {
    return Math.round(plainNumber)
  }
  
  // Regex patterns for different formats
  const patterns = [
    { regex: /^(\d+(?:\.\d+)?)\s*h(?:our|ours|rs)?$/i, multiplier: 1 },
    { regex: /^(\d+(?:\.\d+)?)\s*(?:timm(?:e|ar)?)$/i, multiplier: 1 },
    { regex: /^(\d+(?:\.\d+)?)\s*d(?:ay|ays)?$/i, multiplier: 24 },
    { regex: /^(\d+(?:\.\d+)?)\s*(?:dag(?:ar)?)$/i, multiplier: 24 },
    { regex: /^(\d+(?:\.\d+)?)\s*v(?:ecka|eckor)?$/i, multiplier: 168 },
    { regex: /^(\d+(?:\.\d+)?)\s*w(?:eek|eeks)?$/i, multiplier: 168 },
    { regex: /^(\d+(?:\.\d+)?)\s*m(?:onth|onths|ån|ånad|ånader)?$/i, multiplier: 720 },
  ]
  
  for (const { regex, multiplier } of patterns) {
    const match = normalized.match(regex)
    if (match) {
      const value = parseFloat(match[1])
      if (!isNaN(value) && value > 0) {
        return Math.round(value * multiplier)
      }
    }
  }
  
  return null
}

// Format hours to display string
function formatHours(hours: number): string {
  if (hours % 720 === 0 && hours >= 720) {
    const months = hours / 720
    return months === 1 ? '1 månad' : `${months} månader`
  } else if (hours % 168 === 0 && hours >= 168) {
    const weeks = hours / 168
    return weeks === 1 ? '1 vecka' : `${weeks} veckor`
  } else if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24
    return days === 1 ? '1 dag' : `${days} dagar`
  } else {
    return hours === 1 ? '1 timme' : `${hours} timmar`
  }
}

export default function ResponseTimeSelectorNested({
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  compact = false,
  simple = false
}: ResponseTimeSelectorNestedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customInputs, setCustomInputs] = useState({
    hours: '',
    days: '',
    weeks: '',
    months: ''
  })
  
  // State for simple mode
  const [simpleValue, setSimpleValue] = useState(() => {
    const hours = parseInt(value) || 0
    if (!hours) {
      return { number: '', unit: '' }
    }
    if (hours % 24 === 0 && hours >= 24) {
      return { number: hours / 24, unit: 'days' }
    }
    return { number: hours, unit: 'hours' }
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const currentHours = parseInt(value) || 24
  const displayValue = formatHours(currentHours)
  
  const handleOptionSelect = (hours: number) => {
    onChange(hours.toString())
    setIsOpen(false)
    setCustomInputs({ hours: '', days: '', weeks: '', months: '' })
  }
  
  const handleCustomInputChange = (type: string, value: string) => {
    // Only allow digits
    const numericValue = value.replace(/\D/g, '')
    setCustomInputs(prev => ({ ...prev, [type]: numericValue }))
  }
  
  const handleCustomSubmit = (type: string) => {
    const value = customInputs[type]
    if (!value || value.trim() === '') return
    
    const num = parseInt(value)
    if (isNaN(num) || num <= 0) return
    
    let hours = num
    switch (type) {
      case 'hours':
        hours = num
        break
      case 'days':
        hours = num * 24
        break
      case 'weeks':
        hours = num * 168
        break
      case 'months':
        hours = num * 720
        break
    }
    
    onChange(hours.toString())
    setIsOpen(false)
    setCustomInputs({ hours: '', days: '', weeks: '', months: '' })
  }
  
  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomSubmit(type)
    }
  }
  
  // Simple mode handlers
  const handleSimpleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setSimpleValue(prev => ({ ...prev, number: val }))
    
    // Only calculate hours if we have both number and unit
    if (val && simpleValue.unit) {
      const num = parseInt(val)
      const hours = simpleValue.unit === 'days' ? num * 24 : num
      
      // Validate max 4500 hours
      if (hours > 4500) {
        alert('Svarstiden kan inte vara längre än 4500 timmar (cirka 6 månader)')
        return
      }
      
      onChange(hours.toString())
    }
  }
  
  const handleSimpleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value
    setSimpleValue(prev => ({ ...prev, unit }))
    
    // Only calculate hours if we have both number and unit
    if (unit && simpleValue.number) {
      const num = parseInt(simpleValue.number)
      const hours = unit === 'days' ? num * 24 : num
      
      // Validate max 4500 hours
      if (hours > 4500) {
        alert('Svarstiden kan inte vara längre än 4500 timmar (cirka 6 månader)')
        // Reset to empty
        setSimpleValue({ number: '', unit: '' })
        onChange('')
        return
      }
      
      onChange(hours.toString())
    }
  }
  
  // Simple mode render
  if (simple) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          type="text"
          value={simpleValue.number || ''}
          onChange={handleSimpleNumberChange}
          disabled={disabled}
          required={required}
          placeholder="Skriv nummer"
          max={simpleValue.unit === 'days' ? 187 : 4500}
          className="w-28 h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 placeholder:text-gray-400"
        />
        <select
          value={simpleValue.unit}
          onChange={handleSimpleUnitChange}
          disabled={disabled}
          required={required}
          className="h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 bg-white hover:bg-gray-50"
        >
          <option value="">Välj tidsformat</option>
          <option value="hours">Timmar</option>
          <option value="days">Dagar</option>
        </select>
      </div>
    )
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={compact ? `
          inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border
          ${disabled 
            ? 'bg-gray-50 text-gray-500 border-gray-200' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ` : `
          block w-full h-10 px-3 py-2 text-sm text-left border rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          transition-colors disabled:bg-gray-50 disabled:text-gray-500
          bg-white border-gray-300 hover:bg-gray-50
          flex items-center justify-between
        `}
      >
        <span>{displayValue}</span>
        {compact ? (
          <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ) : (
          <svg 
            className={`h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {/* Popover Menu */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 bg-gray-50 border border-gray-400 rounded-lg shadow-xl ${
          compact ? 'w-80' : 'w-96'
        } ${containerRef.current && window.innerHeight - containerRef.current.getBoundingClientRect().bottom < 400 ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-4 space-y-3">
            {/* Hours Row */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">Timmar</div>
              <div className="flex items-center gap-1">
                {TIME_GROUPS[0].options.map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => handleOptionSelect(option.hours)}
                    className={`
                      px-2 py-1.5 text-xs font-medium rounded border transition-colors
                      ${currentHours === option.hours
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                <div className="flex items-center ml-auto">
                  <input
                    type="text"
                    value={customInputs.hours}
                    onChange={(e) => handleCustomInputChange('hours', e.target.value)}
                    onKeyDown={(e) => handleCustomKeyDown(e, 'hours')}
                    placeholder="..."
                    className="w-12 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <span className="text-xs text-gray-500 ml-1">h</span>
                </div>
              </div>
            </div>
            
            {/* Days Row */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">Dagar</div>
              <div className="flex items-center gap-1">
                {TIME_GROUPS[1].options.map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => handleOptionSelect(option.hours)}
                    className={`
                      px-2 py-1.5 text-xs font-medium rounded border transition-colors
                      ${currentHours === option.hours
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                <div className="flex items-center ml-auto">
                  <input
                    type="text"
                    value={customInputs.days}
                    onChange={(e) => handleCustomInputChange('days', e.target.value)}
                    onKeyDown={(e) => handleCustomKeyDown(e, 'days')}
                    placeholder="..."
                    className="w-12 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <span className="text-xs text-gray-500 ml-1">d</span>
                </div>
              </div>
            </div>
            
            {/* Weeks Row */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">Veckor</div>
              <div className="flex items-center gap-1">
                {TIME_GROUPS[2].options.map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => handleOptionSelect(option.hours)}
                    className={`
                      px-2 py-1.5 text-xs font-medium rounded border transition-colors
                      ${currentHours === option.hours
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                <div className="flex items-center ml-auto">
                  <input
                    type="text"
                    value={customInputs.weeks}
                    onChange={(e) => handleCustomInputChange('weeks', e.target.value)}
                    onKeyDown={(e) => handleCustomKeyDown(e, 'weeks')}
                    placeholder="..."
                    className="w-12 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <span className="text-xs text-gray-500 ml-1">v</span>
                </div>
              </div>
            </div>
            
            {/* Months Row */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">Månader</div>
              <div className="flex items-center gap-1">
                {TIME_GROUPS[3].options.map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => handleOptionSelect(option.hours)}
                    className={`
                      px-2 py-1.5 text-xs font-medium rounded border transition-colors
                      ${currentHours === option.hours
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                <div className="flex items-center ml-auto">
                  <input
                    type="text"
                    value={customInputs.months}
                    onChange={(e) => handleCustomInputChange('months', e.target.value)}
                    onKeyDown={(e) => handleCustomKeyDown(e, 'months')}
                    placeholder="..."
                    className="w-12 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  <span className="text-xs text-gray-500 ml-1">m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}