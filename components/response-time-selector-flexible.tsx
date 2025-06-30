'use client'

import { useState, useEffect } from 'react'

interface ResponseTimeSelectorFlexibleProps {
  value: string // Current value in hours as string
  onChange: (hours: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

interface QuickPick {
  hours: number
  label: string
}

const QUICK_PICKS: QuickPick[] = [
  { hours: 24, label: '1 dag' },
  { hours: 48, label: '2 dagar' },
  { hours: 72, label: '3 dagar' },
  { hours: 168, label: '1 vecka' },
  { hours: 336, label: '2 veckor' },
  { hours: 720, label: '1 månad' },
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
    // Swedish formats
    { regex: /^(\d+(?:\.\d+)?)\s*h(?:our|ours|rs)?$/i, multiplier: 1 }, // 17h, 17hours
    { regex: /^(\d+(?:\.\d+)?)\s*(?:timm(?:e|ar)?)$/i, multiplier: 1 }, // 17 timmar, 17 timme
    { regex: /^(\d+(?:\.\d+)?)\s*d(?:ay|ays)?$/i, multiplier: 24 }, // 23d, 23days
    { regex: /^(\d+(?:\.\d+)?)\s*(?:dag(?:ar)?)$/i, multiplier: 24 }, // 23 dagar, 23 dag
    { regex: /^(\d+(?:\.\d+)?)\s*v(?:ecka|eckor)?$/i, multiplier: 168 }, // 3v, 3 veckor
    { regex: /^(\d+(?:\.\d+)?)\s*w(?:eek|eeks)?$/i, multiplier: 168 }, // 3w, 3weeks
    { regex: /^(\d+(?:\.\d+)?)\s*m(?:onth|onths|ån|ånad|ånader)?$/i, multiplier: 720 }, // 1m, 1 månad
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

export default function ResponseTimeSelectorFlexible({
  value,
  onChange,
  disabled = false,
  required = false,
  className = ""
}: ResponseTimeSelectorFlexibleProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  
  useEffect(() => {
    // Initialize input with formatted value
    if (value) {
      const hours = parseInt(value)
      if (!isNaN(hours)) {
        setInputValue(formatHours(hours))
      }
    }
  }, [value])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowPreview(true)
    
    if (newValue.trim() === '') {
      setError('')
      onChange('24') // Default value
      return
    }
    
    const parsed = parseTimeInput(newValue)
    if (parsed !== null) {
      setError('')
      onChange(parsed.toString())
    } else {
      setError('Ogiltigt format. Exempel: 17h, 23 dagar, 3v')
    }
  }
  
  const handleQuickPick = (hours: number) => {
    const formatted = formatHours(hours)
    setInputValue(formatted)
    onChange(hours.toString())
    setError('')
    setShowPreview(false)
  }
  
  const currentHours = parseInt(value) || 24
  const previewText = error ? '' : formatHours(currentHours)
  
  return (
    <div className={className}>
      <div className="mb-2">
        <span className="text-xs text-gray-600">Skriv in eller välj snabbval:</span>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setShowPreview(false)}
          disabled={disabled}
          required={required}
          placeholder="Skriv själv, t.ex. 17h, 23 dagar, 3v..."
          className={`block w-full h-10 pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {showPreview && previewText && inputValue !== previewText && (
          <div className="absolute left-0 top-full mt-1 text-xs text-gray-600">
            → {previewText}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick.hours}
            type="button"
            onClick={() => handleQuickPick(pick.hours)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              currentHours === pick.hours
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {pick.label}
          </button>
        ))}
      </div>
    </div>
  )
}