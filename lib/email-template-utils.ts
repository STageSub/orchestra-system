// Email template utilities for language and type management

export const SUPPORTED_LANGUAGES = {
  sv: { label: 'Svenska', flag: '🇸🇪', code: 'sv' },
  en: { label: 'English', flag: '🇬🇧', code: 'en' },
  // Easy to add more languages in the future:
  // no: { label: 'Norsk', flag: '🇳🇴', code: 'no' },
  // da: { label: 'Dansk', flag: '🇩🇰', code: 'da' },
  // fi: { label: 'Suomi', flag: '🇫🇮', code: 'fi' },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

export const BASE_TEMPLATE_TYPES = {
  request: {
    key: 'request',
    label: 'Förfrågan',
    description: 'Skickas när en musiker får en förfrågan om att spela',
    color: 'blue',
    defaultVariables: {
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      projectName: 'Projektnamn',
      positionName: 'Position',
      instrumentName: 'Instrument',
      startDate: 'Startdatum',
      weekNumber: 'Veckonummer',
      rehearsalSchedule: 'Repetitionsschema',
      concertInfo: 'Konsertinformation',
      responseUrl: 'Svarslänk',
      responseTime: 'Svarstid (timmar)'
    }
  },
  reminder: {
    key: 'reminder',
    label: 'Påminnelse',
    description: 'Skickas som påminnelse om obesvarade förfrågningar',
    color: 'yellow',
    defaultVariables: {
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      projectName: 'Projektnamn',
      positionName: 'Position',
      responseUrl: 'Svarslänk'
    }
  },
  confirmation: {
    key: 'confirmation',
    label: 'Bekräftelse',
    description: 'Skickas när en musiker accepterar en förfrågan',
    color: 'green',
    defaultVariables: {
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      projectName: 'Projektnamn',
      positionName: 'Position',
      instrumentName: 'Instrument',
      startDate: 'Startdatum',
      weekNumber: 'Veckonummer',
      rehearsalSchedule: 'Repetitionsschema',
      concertInfo: 'Konsertinformation',
      attachmentNote: 'Bifogade filer'
    }
  },
  position_filled: {
    key: 'position_filled',
    label: 'Position fylld',
    description: 'Skickas när en position har fyllts (först till kvarn)',
    color: 'purple',
    defaultVariables: {
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      projectName: 'Projektnamn',
      positionName: 'Position'
    }
  }
} as const

export type BaseTemplateType = keyof typeof BASE_TEMPLATE_TYPES

/**
 * Extract base type and language from a template type string
 * Examples:
 * - "request" -> { baseType: "request", language: "sv" }
 * - "request_en" -> { baseType: "request", language: "en" }
 * - "confirmation_no" -> { baseType: "confirmation", language: "no" }
 */
export function parseTemplateType(type: string): {
  baseType: string
  language: LanguageCode
} {
  const match = type.match(/^(.+?)(?:_([a-z]{2}))?$/)
  const baseType = match?.[1] || type
  const languageCode = match?.[2] || 'sv'
  
  // Validate language code
  const language = (languageCode in SUPPORTED_LANGUAGES) 
    ? languageCode as LanguageCode 
    : 'sv'
  
  return { baseType, language }
}

/**
 * Build a template type string from base type and language
 * Examples:
 * - ("request", "sv") -> "request"
 * - ("request", "en") -> "request_en"
 */
export function buildTemplateType(
  baseType: BaseTemplateType | string, 
  language: LanguageCode
): string {
  // Swedish is the default, so no suffix needed
  if (language === 'sv') {
    return baseType
  }
  return `${baseType}_${language}`
}

/**
 * Get all possible template types for all languages
 */
export function getAllPossibleTemplateTypes(): string[] {
  const types: string[] = []
  
  Object.keys(BASE_TEMPLATE_TYPES).forEach(baseType => {
    Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
      types.push(buildTemplateType(baseType, lang as LanguageCode))
    })
  })
  
  return types
}

/**
 * Check if a template type is valid
 */
export function isValidTemplateType(type: string): boolean {
  const { baseType } = parseTemplateType(type)
  return baseType in BASE_TEMPLATE_TYPES
}

/**
 * Get color classes for a template type
 */
export function getTemplateColorClasses(baseType: string, variant: 'bg' | 'text' | 'border' = 'bg'): string {
  const config = BASE_TEMPLATE_TYPES[baseType as BaseTemplateType]
  if (!config) return ''
  
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    yellow: {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200'
    }
  }
  
  return colorMap[config.color]?.[variant] || ''
}

/**
 * Get display label for a template type
 */
export function getTemplateDisplayLabel(type: string): string {
  const { baseType, language } = parseTemplateType(type)
  const baseConfig = BASE_TEMPLATE_TYPES[baseType as BaseTemplateType]
  const langConfig = SUPPORTED_LANGUAGES[language]
  
  if (!baseConfig || !langConfig) return type
  
  return `${baseConfig.label} (${langConfig.label})`
}

/**
 * Group templates by base type for UI display
 */
export function groupTemplatesByBaseType<T extends { type: string }>(
  templates: T[]
): Record<string, Record<LanguageCode, T>> {
  const grouped: Record<string, Record<LanguageCode, T>> = {}
  
  templates.forEach(template => {
    const { baseType, language } = parseTemplateType(template.type)
    
    if (!grouped[baseType]) {
      grouped[baseType] = {} as Record<LanguageCode, T>
    }
    
    grouped[baseType][language] = template
  })
  
  return grouped
}

/**
 * Get missing templates for a given list of existing templates
 */
export function getMissingTemplates(existingTemplates: { type: string }[]): string[] {
  const existingTypes = new Set(existingTemplates.map(t => t.type))
  const allPossibleTypes = getAllPossibleTemplateTypes()
  
  return allPossibleTypes.filter(type => !existingTypes.has(type))
}

/**
 * Generate default template content for a specific type and language
 */
export function generateDefaultTemplateContent(
  baseType: BaseTemplateType,
  language: LanguageCode
): { subject: string; body: string } {
  // This would contain default template content for each type and language
  // For now, return a placeholder
  const isEnglish = language === 'en'
  const baseConfig = BASE_TEMPLATE_TYPES[baseType]
  
  const templates = {
    request: {
      sv: {
        subject: 'Förfrågan: {{projectName}} - {{positionName}}',
        body: `Hej {{firstName}},

Vi skulle vilja ha dig som {{positionName}} för {{projectName}}.

Start: {{startDate}} (vecka {{weekNumber}})
Repetitioner: {{rehearsalSchedule}}
Konsert: {{concertInfo}}

Vänligen svara senast inom {{responseTime}} timmar genom att klicka på länken nedan:
{{responseUrl}}

Med vänliga hälsningar,
Orkesteradministrationen`
      },
      en: {
        subject: 'Request: {{projectName}} - {{positionName}}',
        body: `Hi {{firstName}},

We would like to have you as {{positionName}} for {{projectName}}.

Start: {{startDate}} (week {{weekNumber}})
Rehearsals: {{rehearsalSchedule}}
Concert: {{concertInfo}}

Please respond within {{responseTime}} hours by clicking the link below:
{{responseUrl}}

Best regards,
Orchestra Administration`
      }
    },
    reminder: {
      sv: {
        subject: 'Påminnelse: {{projectName}}',
        body: `Hej {{firstName}},

Detta är en påminnelse om din förfrågan för {{projectName}} som {{positionName}}.

Vänligen svara genom att klicka på länken:
{{responseUrl}}

Med vänliga hälsningar,
Orkesteradministrationen`
      },
      en: {
        subject: 'Reminder: {{projectName}}',
        body: `Hi {{firstName}},

This is a reminder about your request for {{projectName}} as {{positionName}}.

Please respond by clicking the link:
{{responseUrl}}

Best regards,
Orchestra Administration`
      }
    },
    confirmation: {
      sv: {
        subject: 'Bekräftelse: {{projectName}}',
        body: `Hej {{firstName}},

Tack för att du tackat ja till {{projectName}}!

Din position: {{positionName}} ({{instrumentName}})
Start: {{startDate}} (vecka {{weekNumber}})
Repetitioner: {{rehearsalSchedule}}
Konsert: {{concertInfo}}

{{attachmentNote}}

Vi ser fram emot att arbeta med dig!

Med vänliga hälsningar,
Orkesteradministrationen`
      },
      en: {
        subject: 'Confirmation: {{projectName}}',
        body: `Hi {{firstName}},

Thank you for accepting {{projectName}}!

Your position: {{positionName}} ({{instrumentName}})
Start: {{startDate}} (week {{weekNumber}})
Rehearsals: {{rehearsalSchedule}}
Concert: {{concertInfo}}

{{attachmentNote}}

We look forward to working with you!

Best regards,
Orchestra Administration`
      }
    },
    position_filled: {
      sv: {
        subject: 'Position fylld: {{projectName}}',
        body: `Hej {{firstName}},

Tyvärr har positionen {{positionName}} för {{projectName}} redan fyllts.

Vi hoppas få möjlighet att arbeta med dig vid ett annat tillfälle.

Med vänliga hälsningar,
Orkesteradministrationen`
      },
      en: {
        subject: 'Position Filled: {{projectName}}',
        body: `Hi {{firstName}},

Unfortunately, the position {{positionName}} for {{projectName}} has already been filled.

We hope to have the opportunity to work with you another time.

Best regards,
Orchestra Administration`
      }
    }
  }
  
  const templateContent = templates[baseType]?.[language] || templates[baseType]?.sv
  
  return templateContent || {
    subject: `${baseConfig.label} - {{projectName}}`,
    body: 'Template content not available'
  }
}