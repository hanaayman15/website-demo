-- Team and player enhancement migration
-- Date: 2026-03-12

-- New dynamic tables
CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY,
    player_id INTEGER NOT NULL,
    session_info TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supplements (
    id INTEGER PRIMARY KEY,
    player_id INTEGER NOT NULL,
    supplement_info TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Players table extensions (apply in dialect-specific safe way if your DB differs)
ALTER TABLE players ADD COLUMN client_id VARCHAR(50);
ALTER TABLE players ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE players ADD COLUMN phone_country_code VARCHAR(10);
ALTER TABLE players ADD COLUMN phone_number VARCHAR(30);
ALTER TABLE players ADD COLUMN medical_allergies TEXT;
ALTER TABLE players ADD COLUMN medical_notes TEXT;
ALTER TABLE players ADD COLUMN test_and_record TEXT;
ALTER TABLE players ADD COLUMN mental_notes TEXT;
ALTER TABLE players ADD COLUMN water_in_body FLOAT;
ALTER TABLE players ADD COLUMN calories FLOAT;
ALTER TABLE players ADD COLUMN age INTEGER;
