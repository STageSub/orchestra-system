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