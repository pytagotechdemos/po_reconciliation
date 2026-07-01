-- Add system user for audit log fallback
-- Run this if the seed doesn't work (e.g., due to createMany skip)
-- Create system user with same password hash as seed
INSERT INTO "User" (id, username, name, password, role, "createdAt")
VALUES (
  gen_random_uuid()::text,
  'system',
  'System',
  '$2a$10$YQiP4HnZCYD0r9Z5O5vR7O9J5x9V8R0Q6w5R6N8H9I0K1J2L3M4N5',
  'owner',
  NOW()
)
ON CONFLICT (username) DO NOTHING;
