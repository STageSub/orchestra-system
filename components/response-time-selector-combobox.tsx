'use client'

import { useState, useEffect, useRef } from 'react'

interface ResponseTimeSelectorComboboxProps {
  value: string // Current value in hours as string
  onChange: (hours: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

interface TimeOption {
  hours: number
  label: string
  group: string
}

const TIME_OPTIONS: TimeOption[] = [
  // Hours
  { hours: 1, label: '1 timme', group: 'Timmar' },
  { hours: 2, label: '2 timmar', group: 'Timmar' },
  { hours: 3, label: '3 timmar', group: 'Timmar' },
  { hours: 4, label: '4 timmar', group: 'Timmar' },
  { hours: 6, label: '6 timmar', group: 'Timmar' },
  { hours: 8, label: '8 timmar', group: 'Timmar' },
  { hours: 12, label: '12 timmar', group: 'Timmar' },
  { hours: 18, label: '18 timmar', group: 'Timmar' },
  
  // Days
  { hours: 24, label: '1 dag', group: 'Dagar' },
  { hours: 48, label: '2 dagar', group: 'Dagar' },
  { hours: 72, label: '3 dagar', group: 'Dagar' },
  { hours: 96, label: '4 dagar', group: 'Dagar' },
  { hours: 120, label: '5 dagar', group: 'Dagar' },
  { hours: 144, label: '6 dagar', group: 'Dagar' },
  { hours: 168, label: '7 dagar', group: 'Dagar' },
  
  // Weeks
  { hours: 336, label: '2 veckor', group: 'Veckor' },
  { hours: 504, label: '3 veckor', group: 'Veckor' },
  
  // Months
  { hours: 720, label: '1 månad', group: 'Månader' },
  { hours: 1440, label: '2 månader', group: 'Månader' },
  { hours: 2160, label: '3 månader', group: 'Månader' },
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

export default function ResponseTimeSelectorCombobox({
  value,
  onChange,
  disabled = false,
  required = false,
  className = ""
}: ResponseTimeSelectorComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(TIME_OPTIONS)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Initialize input with formatted value
    if (value) {
      const hours = parseInt(value)
      if (!isNaN(hours)) {
        setInputValue(formatHours(hours))
      }
    }
  }, [value])
  
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
  
  useEffect(() => {
    // Filter options based on input
    if (inputValue.trim() === '') {
      setFilteredOptions(TIME_OPTIONS)
    } else {
      const filtered = TIME_OPTIONS.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [inputValue])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    
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
  
  const handleOptionSelect = (option: TimeOption) => {
    setInputValue(option.label)
    onChange(option.hours.toString())
    setError('')
    setIsOpen(false)
    inputRef.current?.blur()
  }
  
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
      e.preventDefault()
      setIsOpen(true)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setIsOpen(false)
    }
  }
  
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = []
    }
    acc[option.group].push(option)
    return acc
  }, {} as Record<string, TimeOption[]>)
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder="Skriv eller välj, t.ex. 17h, 23 dagar..."
          className={`block w-full h-10 px-3 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 cursor-pointer ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className={`h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {Object.keys(groupedOptions).length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              Inga matchande alternativ. Prova: 17h, 23 dagar, 3v
            </div>
          ) : (
            Object.entries(groupedOptions).map(([group, options]) => (
              <div key={group}>
                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                  {group}
                </div>
                {options.map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}