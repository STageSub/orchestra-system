# 🛠️ System Administration Documentation

## Overview

This document covers the administrative features and tools available in the StageSub Orchestra System for monitoring, configuration, and maintenance.

## 📊 Activity Tracking System

### Purpose
Track and monitor all system activities in real-time to understand usage patterns and troubleshoot issues.

### Access
- **URL**: `/admin/activities`
- **Navigation**: Available from admin dashboard
- **Permissions**: Admin access required

### Features

#### Real-time Activity Feed
- Displays all system events with descriptive icons
- Shows user actions, system events, and state changes
- Automatically refreshes to show latest activities

#### Smart Time Formatting
- "Just nu" - Just happened
- "X min sedan" - Minutes ago (1-59)
- "X tim sedan" - Hours ago (1-23)
- "X dagar sedan" - Days ago (1-6)
- Full date/time for older events

#### Pagination
- 20 activities per page
- "Visa fler aktiviteter" button for loading more
- Total count displayed at top
- Smooth loading states

### API Endpoint
```
GET /api/dashboard/activity
Query Parameters:
- limit: Number of items to fetch (default: 20)
- skip: Number of items to skip for pagination
```

### Activity Types
Activities are color-coded and include icons:
- User actions (login, logout, create, update, delete)
- System events (emails sent, reminders triggered)
- Status changes (requests accepted/declined)
- File operations (upload, delete)

## ⚙️ Settings Management

### Purpose
Configure global system settings that affect all operations.

### Access
- **URL**: `/admin/settings`
- **Navigation**: Admin → Inställningar
- **Permissions**: Admin access required

### Current Settings

#### Reminder Percentage
- **Description**: When to send reminder emails based on response time
- **Range**: 10% to 90%
- **Default**: 75%
- **Example**: If response time is 48 hours and set to 75%, reminder sent after 36 hours
- **UI**: Number input with increment/decrement

### Future Settings (UI Prepared)
The interface is ready for these additional settings:
- **Default Messages**: Standard email signatures and templates
- **Auto Reminders**: Toggle automatic reminders on/off
- **Default Response Times**: Set default hours for new projects
- **Email Server**: SMTP configuration

### API Endpoints
```
GET /api/settings
- Fetches all current settings

PUT /api/settings
Body: {
  "reminder_percentage": "75"
}
- Updates settings values
```

### Database Storage
Settings are stored in the `Settings` table:
- `key`: Setting identifier
- `value`: Setting value (string)
- `description`: Optional description

## 🏥 Health Check API

### Purpose
Monitor system health and verify all components are functioning correctly.

### Endpoint
```
GET /api/health
```

### Response Format
```json
{
  "status": "ok" | "error",
  "database": "connected" | "disconnected",
  "environment": {
    "NODE_ENV": "production" | "development",
    "hasAllEnvVars": true | false,
    "missingEnvVars": ["VAR_NAME"] // Only if missing
  },
  "timestamp": "2025-06-28T10:00:00Z"
}
```

### Environment Variables Checked
- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- ADMIN_PASSWORD
- RESEND_API_KEY
- NEXT_PUBLIC_APP_URL

### Usage Scenarios
1. **Deployment Verification**: Check after deployment
2. **Monitoring**: Regular health checks from monitoring service
3. **Debugging**: Verify configuration issues
4. **Load Balancer**: Health check endpoint

## 🔄 Database Migration Tools

### Purpose
Safely migrate data between database providers (e.g., Supabase to Neon.tech).

### Export Tool
**Script**: `/scripts/export-supabase-data.js`

#### Usage
```bash
npm run export-data
# or
node scripts/export-supabase-data.js
```

#### Features
- Exports all tables to timestamped JSON
- Creates schema export separately
- Preserves all relationships
- Saves to `/exports` directory
- Shows progress and statistics

#### Output Files
- `supabase-export-TIMESTAMP.json` - Complete data
- `schema-TIMESTAMP.json` - Database schema

### Import Tool
**Script**: `/scripts/import-to-neon.js`

#### Usage
```bash
npm run import-data
# or
node scripts/import-to-neon.js
```

#### Features
- Automatically finds latest export
- Imports in correct order (respects foreign keys)
- Skip duplicates option
- Verification after import
- Error handling for partial imports

### Additional Utilities

#### Check Projects
**Script**: `/scripts/check-projects.js`
- Verifies project data integrity
- Checks for orphaned records
- Validates relationships

#### Test Group Email
**Script**: `/scripts/test-group-email.js`
- Tests email functionality
- Sends test emails to verify configuration

#### Verify Database
**Script**: `/scripts/verify-db.js`
- Comprehensive database integrity check
- Verifies all tables and relationships
- Reports any issues found

## 📈 Monitoring Best Practices

### Daily Checks
1. Review activity feed for unusual patterns
2. Check health endpoint status
3. Monitor error logs
4. Verify email delivery rates

### Weekly Maintenance
1. Review and adjust reminder percentage if needed
2. Check for orphaned files
3. Review inactive musicians
4. Analyze response time patterns

### Monthly Tasks
1. Export database backup
2. Review system usage statistics
3. Clean up old communication logs
4. Update settings based on feedback

## 🔒 Security Considerations

### Access Control
- All admin features require authentication
- JWT tokens expire after 24 hours
- Rate limiting on sensitive endpoints

### Data Protection
- Exports contain sensitive data - handle carefully
- Use secure transfer methods for database files
- Regularly rotate admin passwords

### Monitoring
- Track failed login attempts
- Monitor unusual activity patterns
- Set up alerts for critical errors

## 🚨 Troubleshooting

### Common Issues

#### Activities Not Loading
1. Check database connection
2. Verify API endpoint responding
3. Check browser console for errors
4. Clear browser cache

#### Settings Not Saving
1. Verify admin permissions
2. Check network requests
3. Validate input values
4. Check API response

#### Health Check Failing
1. Verify all environment variables
2. Check database connectivity
3. Ensure proper deployment
4. Review error logs

### Support Resources
- Check `/api/health` for system status
- Review activity logs for recent changes
- Use migration tools for data recovery
- Contact system administrator for help

## 📝 Future Enhancements

### Planned Features
1. **Advanced Analytics**: Detailed usage reports
2. **Automated Backups**: Scheduled database exports
3. **Alert System**: Email/SMS for critical events
4. **Audit Logs**: Detailed change tracking
5. **Performance Metrics**: Response time tracking
6. **Custom Reports**: Configurable data exports

### Integration Points
- Monitoring services (Datadog, New Relic)
- Backup solutions (AWS S3, Google Cloud)
- Alert systems (PagerDuty, Opsgenie)
- Analytics platforms (Mixpanel, Amplitude)