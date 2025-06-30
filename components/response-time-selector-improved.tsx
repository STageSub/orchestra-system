'use client'

import { useEffect, useState } from 'react'

interface ResponseTimeSelectorImprovedProps {
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

export default function ResponseTimeSelectorImproved({
  value,
  onChange,
  disabled = false,
  required = false,
  className = ""
}: ResponseTimeSelectorImprovedProps) {
  const [currentGroup, setCurrentGroup] = useState<string>('')

  useEffect(() => {
    // Find which group the current value belongs to
    const currentOption = TIME_OPTIONS.find(opt => opt.hours === parseInt(value))
    if (currentOption) {
      setCurrentGroup(currentOption.group)
    }
  }, [value])

  const groupedOptions = TIME_OPTIONS.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = []
    }
    acc[option.group].push(option)
    return acc
  }, {} as Record<string, TimeOption[]>)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`block w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
    >
      {Object.entries(groupedOptions).map(([group, options]) => (
        <optgroup key={group} label={group}>
          {options.map((option) => (
            <option key={option.hours} value={option.hours}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}