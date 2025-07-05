# Current Login Credentials

Updated: 2025-07-05

## Production & Local Login Credentials

### Superadmin
- **Username**: superadmin
- **Password**: admin123
- **Access**: Full system access, all orchestras
- **Login URL**: https://stagesub.com/admin/login

### SCO Orchestra Admin
- **Username**: Daniel
- **Password**: orchestra123
- **Orchestra**: SCO
- **Access**: SCO orchestra only

### SCOSO Orchestra Admin
- **Username**: Daniel2
- **Password**: orchestra123
- **Orchestra**: Orchestra SCOSO
- **Access**: SCOSO orchestra only

## How to Login

1. Go to `/admin/login`
2. Enter username and password
3. Click "Logga in"

The system will automatically redirect:
- Superadmin → `/superadmin`
- Orchestra admins → `/admin`

## Notes
- All passwords were updated on 2025-07-05
- Users are stored in the Neon (central) database
- Authentication uses bcrypt hashed passwords
- Sessions last 24 hours