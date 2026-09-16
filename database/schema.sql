-- ============================================
-- DIGITAL NOTEPAD DATABASE SCHEMA
-- ============================================

-- ============================================
-- NOTEPADS
-- ============================================

CREATE TABLE IF NOT EXISTS notepads (
    id BIGSERIAL PRIMARY KEY,

    college_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    team_name TEXT NOT NULL,

    team_leader_name TEXT,
    team_leader_contact TEXT,

    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,

    mentor_name TEXT,
    mentor_contact TEXT,
    mentor_room TEXT,

    accommodation TEXT,

    transaction_id TEXT,
    amount_paid NUMERIC(10, 2),

    oc_poc TEXT,
    oc_poc_contact TEXT,

    duration TEXT,
    arrival_date DATE,
    expected_departure_date DATE,

    additional_remarks TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ DEFAULT NULL
);


-- ============================================
-- SUPERADMINS
-- ============================================

CREATE TABLE IF NOT EXISTS superadmins (
    id BIGSERIAL PRIMARY KEY,

    email TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================
-- UNIQUE EMAIL
-- Case-insensitive uniqueness for Superadmins
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS
superadmins_email_unique
ON superadmins (LOWER(email));


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS
notepads_created_at_idx
ON notepads (created_at DESC);

CREATE INDEX IF NOT EXISTS
notepads_deleted_at_idx
ON notepads (deleted_at);

CREATE INDEX IF NOT EXISTS
superadmins_active_idx
ON superadmins (is_active);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE notepads ENABLE ROW LEVEL SECURITY;

ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;