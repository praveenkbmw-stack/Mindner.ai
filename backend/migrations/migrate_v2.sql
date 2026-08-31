-- ====================================================
-- MINDNER AI: Schema Extensions & Non-destructive Migration
-- ====================================================

-- 1. Memory Journey Schema Extension
CREATE TABLE IF NOT EXISTS memory_journey_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL DEFAULT 'Important Events',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url TEXT,
    voice_recording_url TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure non-destructive addition if table or equivalent memories table existed
ALTER TABLE memories ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS voice_recording_url TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS category_name VARCHAR(255) DEFAULT 'Important Events';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES patients(id) ON DELETE CASCADE;

-- 2. Family Voices Schema Extension
CREATE TABLE IF NOT EXISTS family_voices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(255) NOT NULL,
    image_url TEXT,
    voice_recording_url TEXT,
    voice_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure non-destructive column additions on family_members
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS voice_recording_url TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES patients(id) ON DELETE CASCADE;

-- 3. Cognitive Game Sessions Schema Extension
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    game_type VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    accuracy FLOAT NOT NULL,
    response_time_seconds FLOAT NOT NULL,
    response_time FLOAT,
    attempts INTEGER NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure non-destructive updates on game_sessions
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS response_time_seconds FLOAT;

-- 4. Photo Recall Custom Items Schema Extension
CREATE TABLE IF NOT EXISTS photo_recall_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(255),
    description TEXT,
    image_path TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

