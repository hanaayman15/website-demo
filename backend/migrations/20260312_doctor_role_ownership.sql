-- Doctor role and team ownership migration
-- Date: 2026-03-12

-- Users table compatibility columns
ALTER TABLE users ADD COLUMN name VARCHAR(255);
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Teams ownership
ALTER TABLE teams ADD COLUMN doctor_id INTEGER;
