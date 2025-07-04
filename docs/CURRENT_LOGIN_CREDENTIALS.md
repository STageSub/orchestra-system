# Current Login Credentials

Last updated: 2025-07-03

## 1. Superadmin Account
- **URL:** https://stagesub.com/admin/login
- **Username:** superadmin
- **Password:** superadmin123
- **Access:** Full system access, all orchestras

## 2. SCO Admin Account
- **URL:** https://sco.stagesub.com/admin/login
- **Username:** sco-admin
- **Password:** sco-admin123
- **Access:** SCO orchestra only

## 3. SCOSO Admin Account
- **URL:** https://scoso.stagesub.com/admin/login
- **Username:** scosco-admin (note: not scoso-admin)
- **Password:** scosco-admin123
- **Access:** SCOSO orchestra only

## Important Notes

1. The SCOSO admin username is `scosco-admin`, NOT `scoso-admin`
2. All passwords follow the pattern: `{username}123`
3. These are test passwords - should be changed in production
4. Passwords are hashed with bcrypt before storage

## If Login Fails

1. Check that you're using the correct subdomain URL
2. Verify the username is correct (especially for SCOSO: use `scosco-admin`)
3. Ensure cookies are enabled in your browser
4. Try clearing browser cache/cookies

## To Reset Passwords

Run: `npx tsx scripts/reset-admin-passwords.ts`