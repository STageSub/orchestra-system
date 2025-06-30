# Email Template System Documentation

## Overview

The Orchestra System email template system is designed to be scalable and support multiple languages. Templates are grouped by base type with language variants.

## Architecture

### Base Template Types

1. **Request** (`request`) - Initial musician request
2. **Reminder** (`reminder`) - Follow-up for unanswered requests  
3. **Confirmation** (`confirmation`) - Acceptance confirmation
4. **Position Filled** (`position_filled`) - When position is no longer available

### Language Support

Currently supported:
- 🇸🇪 Swedish (sv) - Default language
- 🇬🇧 English (en)

Easy to add:
- 🇳🇴 Norwegian (no)
- 🇩🇰 Danish (da)
- 🇫🇮 Finnish (fi)

### Template Naming Convention

```
{base_type}_{language_code}
```

Examples:
- `request` - Swedish request template (no suffix for default)
- `request_en` - English request template
- `confirmation_no` - Norwegian confirmation template

## UI Grouping

Templates are displayed grouped by base type:

```
📧 Förfrågan
├── 🇸🇪 Svenska ✓
└── 🇬🇧 English ✓

📧 Bekräftelse  
├── 🇸🇪 Svenska ✓
└── 🇬🇧 English ✗ (missing)
```

## Adding a New Language

1. Update `/lib/email-template-utils.ts`:
```typescript
export const SUPPORTED_LANGUAGES = {
  sv: { label: 'Svenska', flag: '🇸🇪', code: 'sv' },
  en: { label: 'English', flag: '🇬🇧', code: 'en' },
  no: { label: 'Norsk', flag: '🇳🇴', code: 'no' }, // New!
}
```

2. Add default templates in `generateDefaultTemplateContent()`

3. Run seed function to create missing templates

## Template Variables

Each template type has specific variables available:

### Request Template
- `{{firstName}}`, `{{lastName}}` - Musician name
- `{{projectName}}` - Project name
- `{{positionName}}` - Position (e.g., "1st Violin")
- `{{instrumentName}}` - Instrument
- `{{startDate}}` - Project start date
- `{{weekNumber}}` - Week number
- `{{rehearsalSchedule}}` - Rehearsal info
- `{{concertInfo}}` - Concert details
- `{{responseUrl}}` - Response link
- `{{responseTime}}` - Hours to respond

### Reminder Template
- `{{firstName}}`, `{{lastName}}`
- `{{projectName}}`
- `{{positionName}}`
- `{{responseUrl}}`

### Confirmation Template
- All request variables
- `{{attachmentNote}}` - Note about attached files

### Position Filled Template
- `{{firstName}}`, `{{lastName}}`
- `{{projectName}}`
- `{{positionName}}`

## API Usage

### Fetching Templates
```typescript
// Get all templates
GET /api/templates

// Get specific template
GET /api/templates/{id}
```

### Creating/Updating Templates
```typescript
// Update template
PUT /api/templates/{id}
{
  "subject": "New subject",
  "body": "New body content"
}
```

### Seed Missing Templates
```typescript
POST /api/templates/seed
```

## Email Sending Logic

The system automatically selects the correct template based on:
1. Template type (request, confirmation, etc.)
2. Musician's preferred language

```typescript
const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'
const templateType = language === 'en' ? `${type}_en` : type
```

## Future Enhancements

1. **Template Inheritance**: Base templates with language-specific overrides
2. **Template Versioning**: Track changes and allow rollback
3. **Preview System**: See how emails look before sending
4. **A/B Testing**: Test different template versions
5. **Rich Text Editor**: WYSIWYG editing for templates
6. **Dynamic Variables**: Custom variables per orchestra

## Best Practices

1. **Always provide fallback**: If language template missing, use Swedish
2. **Test all languages**: When updating templates, test all variants
3. **Keep variables consistent**: Use same variable names across languages
4. **Meaningful subjects**: Include project name and position
5. **Clear CTAs**: Make response links prominent

## Troubleshooting

### Template Not Found
- Check template type exists in database
- Verify language code is correct
- Run seed function to create missing templates

### Variables Not Replaced
- Ensure variable names match exactly (case-sensitive)
- Check all required data is passed to email function
- Verify template has correct variable syntax `{{variableName}}`

### Wrong Language Selected
- Check musician's `preferredLanguage` field
- Verify template exists for that language
- Check fallback logic is working