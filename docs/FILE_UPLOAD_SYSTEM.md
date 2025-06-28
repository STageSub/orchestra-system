# File Upload System Documentation

## Overview

The Orchestra System includes a comprehensive file upload system designed to handle sheet music, general information files, and other project-related documents. The system is built to work seamlessly with Next.js 15 and includes features for file reuse, deduplication, and orphaned file management.

## Technical Implementation

### Base64 Encoding Approach

Due to FormData parsing issues in Next.js 15, the system uses base64 encoding:

```typescript
// Frontend: Convert file to base64
const reader = new FileReader()
reader.readAsDataURL(file)
const base64Data = await reader.result

// Send as JSON
fetch('/api/projects/[id]/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file: base64Data, ... })
})
```

### API Endpoints

- `POST /api/projects/[id]/upload` - Upload new files
- `GET /api/projects/[id]/files` - List all project files
- `DELETE /api/projects/[id]/files/[fileId]` - Delete a file
- `GET /api/projects/[id]/needs/[needId]/files` - List files for a specific need
- `POST /api/projects/[id]/needs/[needId]/link-files` - Link existing files to a need

## File Types and Timing

### File Types
- `general_info` - General project information
- `sheet_music` - Musical scores and parts

### Send Timing
- `on_request` - Sent with initial request (default for general files)
- `on_accept` - Sent when musician accepts (default for sheet music)

## User Interface

### File Upload Modal
- Automatic filename extraction
- File type validation (PDF, images, Word, text, MusicXML)
- Size limit: 10MB
- Configurable send timing

### Need Files Section
- Displays files attached to each need
- Balanced upload/reuse buttons when no files exist
- Compact file list with icons
- Real-time refresh after upload

### Reuse Files Modal
- Shows unique files only (deduplication by fileUrl)
- Allows different send timing per reuse
- Delete option for orphaned files
- Grouped by file type

## File Management

### Orphaned Files
Files without a `projectNeedId` are considered orphaned and appear in:
- Files tab (with "Ej kopplade filer" section)
- Can be deleted from Files tab or Reuse modal

### File Deduplication
- Reuse modal groups files by `fileUrl` to show unique files only
- File count in UI shows unique files, not total associations

### Cascade Deletion
- Deleting a need removes associated files (onDelete: Cascade)
- Files are automatically cleaned up when parent entities are removed

## Database Schema

```prisma
model ProjectFile {
  id            Int          @id @default(autoincrement())
  projectFileId String       @unique @default(cuid())
  projectId     Int
  projectNeedId Int?         // null = general file
  fileName      String
  fileUrl       String       @db.Text
  fileType      String       // 'general_info' or 'sheet_music'
  sendTiming    String       @default("on_request")
  uploadedAt    DateTime     @default(now())
  
  project       Project      @relation(fields: [projectId], references: [id])
  projectNeed   ProjectNeed? @relation(fields: [projectNeedId], references: [id], onDelete: Cascade)
}
```

## Common Operations

### Upload a File
1. User clicks "Ladda upp noter" or general file upload
2. Selects file and configures options
3. File converted to base64 and sent to API
4. File saved and database record created
5. UI refreshes automatically

### Reuse Existing Files
1. User clicks "Använd befintliga filer"
2. Modal shows all unique files not already linked
3. User selects files and configures timing
4. Files linked to current need without duplication

### Delete Orphaned Files
1. Navigate to Files tab
2. Find "Ej kopplade filer" section
3. Click "Ta bort" on unwanted files
4. File removed from storage and database

## Best Practices

1. **Always validate file types** - Check extensions before upload
2. **Use appropriate timing** - General info on request, sheet music on accept
3. **Clean up orphaned files** - Regularly check Files tab for unlinked files
4. **Reuse when possible** - Avoid uploading duplicate files
5. **Monitor file sizes** - Keep under 10MB limit

## Troubleshooting

### "Failed to upload file" Error
- Check file size (max 10MB)
- Verify file type is allowed
- Ensure proper network connection

### Files Not Showing
- Check `refreshTrigger` is incrementing
- Verify API responses in network tab
- Ensure proper projectNeedId association

### Duplicate Files in Modal
- Files are deduplicated by fileUrl
- Check if files have different URLs but same content
- Use developer tools to inspect file records

## Future Enhancements

1. **Virus Scanning** - Integrate file scanning service
2. **Preview Support** - Add file preview for images/PDFs
3. **Bulk Upload** - Allow multiple file selection
4. **Version Control** - Track file versions and changes
5. **Compression** - Automatic file compression for storage