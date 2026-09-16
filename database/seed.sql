-- ============================================
-- DIGITAL NOTEPAD INITIAL SUPERADMIN
-- ============================================

INSERT INTO superadmins (
    email,
    created_by,
    is_active
)
VALUES (
    'aaravsadhu7@gmail.com',
    'SYSTEM',
    TRUE
)
ON CONFLICT (LOWER(email))
DO UPDATE SET
    is_active = TRUE;