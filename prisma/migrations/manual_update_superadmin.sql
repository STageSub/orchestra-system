-- Update superadmin user in production
-- Run this in Neon dashboard SQL editor

-- First check if superadmin exists
SELECT id, username, email, role, "passwordHash" IS NOT NULL as has_password
FROM "User"
WHERE role = 'superadmin';

-- Update superadmin username and password
-- Password is 'admin123' hashed with bcrypt
UPDATE "User"
SET username = 'superadmin',
    "passwordHash" = '$2a$10$K7L1OJ0/9kGmVxXhM1bZPeFdBz8Tq8zH0kEpKqSe2gKqKxqXZWxCq'
WHERE role = 'superadmin';

-- Verify the update
SELECT id, username, email, role, active
FROM "User"
WHERE role = 'superadmin';