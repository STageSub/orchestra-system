export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ')
}

// Generate unique IDs with prefix
export function generateMusicianId(lastId?: string): string {
  const prefix = 'MUS'
  if (!lastId) return `${prefix}001`
  
  const numberPart = parseInt(lastId.slice(3))
  const nextNumber = numberPart + 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

export function generateProjectId(lastId?: string): string {
  const prefix = 'PROJ'
  if (!lastId) return `${prefix}001`
  
  const numberPart = parseInt(lastId.slice(4))
  const nextNumber = numberPart + 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

export function generateRequestId(lastId?: string): string {
  const prefix = 'REQ'
  if (!lastId) return `${prefix}001`
  
  const numberPart = parseInt(lastId.slice(3))
  const nextNumber = numberPart + 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

// Format hours into human-readable Swedish time format
export function formatHoursToReadable(hours: number): string {
  // Handle edge cases
  if (hours === 0) return '0 timmar'
  if (hours < 0) return '0 timmar'
  
  // Check for months (30 days = 720 hours)
  if (hours >= 720 && hours % 720 === 0) {
    const months = Math.floor(hours / 720)
    return months === 1 ? '1 månad' : `${months} månader`
  }
  
  // Check for weeks (7 days = 168 hours)
  if (hours >= 168 && hours % 168 === 0) {
    const weeks = Math.floor(hours / 168)
    return weeks === 1 ? '1 vecka' : `${weeks} veckor`
  }
  
  // Check for days (24 hours)
  if (hours >= 24 && hours % 24 === 0) {
    const days = Math.floor(hours / 24)
    return days === 1 ? '1 dag' : `${days} dagar`
  }
  
  // Default to hours
  return hours === 1 ? '1 timme' : `${hours} timmar`
}