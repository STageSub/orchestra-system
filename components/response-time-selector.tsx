'use client'

import { useEffect, useState } from 'react'

interface ResponseTimeSelectorProps {
  value: number | null // Current value in hours
  onChange: (hours: number | null) => void
  disabled?: boolean
  required?: boolean
}

type TimeUnit = 'hours' | 'days' | 'weeks' | 'months'

const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'hours', label: 'Timmar' },
  { value: 'days', label: 'Dagar' },
  { value: 'weeks', label: 'Veckor' },
  { value: 'months', label: 'Månader' }
]

const HOUR_OPTIONS = Array.from({ length: 23 }, (_, i) => i + 1)
const DAY_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1)
const WEEK_OPTIONS = Array.from({ length: 4 }, (_, i) => i + 1)
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

const convertToUnit = (hours: number): { value: number; unit: TimeUnit } => {
  if (hours % 720 === 0 && hours >= 720) {
    return { value: hours / 720, unit: 'months' }
  } else if (hours % 168 === 0 && hours >= 168) {
    return { value: hours / 168, unit: 'weeks' }
  } else if (hours % 24 === 0 && hours >= 24) {
    return { value: hours / 24, unit: 'days' }
  } else {
    return { value: hours, unit: 'hours' }
  }
}

const convertToHours = (value: number, unit: TimeUnit): number => {
  switch (unit) {
    case 'hours':
      return value
    case 'days':
      return value * 24
    case 'weeks':
      return value * 168
    case 'months':
      return value * 720 // 30 days
    default:
      return value
  }
}

export default function ResponseTimeSelector({
  value,
  onChange,
  disabled = false,
  required = false
}: ResponseTimeSelectorProps) {
  const initialConversion = value ? convertToUnit(value) : { value: 48, unit: 'hours' as TimeUnit }
  const [selectedUnit, setSelectedUnit] = useState<TimeUnit>(initialConversion.unit)
  const [selectedValue, setSelectedValue] = useState<number>(initialConversion.value)

  useEffect(() => {
    if (value) {
      const converted = convertToUnit(value)
      setSelectedUnit(converted.unit)
      setSelectedValue(converted.value)
    }
  }, [value])

  const handleUnitChange = (unit: TimeUnit) => {
    setSelectedUnit(unit)
    // Reset to default value for new unit
    const defaultValue = unit === 'hours' ? 24 : unit === 'days' ? 2 : unit === 'weeks' ? 1 : 1
    setSelectedValue(defaultValue)
    onChange(convertToHours(defaultValue, unit))
  }

  const handleValueChange = (newValue: number) => {
    setSelectedValue(newValue)
    onChange(convertToHours(newValue, selectedUnit))
  }

  const getOptions = () => {
    switch (selectedUnit) {
      case 'hours':
        return HOUR_OPTIONS
      case 'days':
        return DAY_OPTIONS
      case 'weeks':
        return WEEK_OPTIONS
      case 'months':
        return MONTH_OPTIONS
      default:
        return []
    }
  }

  return (
    <div className="flex space-x-2">
      <select
        value={selectedValue}
        onChange={(e) => handleValueChange(Number(e.target.value))}
        disabled={disabled}
        required={required}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      >
        {getOptions().map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      
      <select
        value={selectedUnit}
        onChange={(e) => handleUnitChange(e.target.value as TimeUnit)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      >
        {TIME_UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>
    </div>
  )
}