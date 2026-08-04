-- Universities Voice - Authentication & Security System Schema
-- Phase 2: Complete admin panel authentication, 2FA, sessions, permissions, audit logging

-- ============================================
-- 1. EXTEND USERS TABLE FOR AUTH FEATURES
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- ============================================
-- 2. TEMPORARY SECRETS (for 2FA setup)
-- ============================================

CREATE TABLE IF NOT EXISTS auth_temp_secrets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. PASSWORD HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- ============================================
-- 4. PASSWORD RESET TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- ============================================
-- 5. IP WHITELIST
-- ============================================

CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  description VARCHAR(255),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user ON admin_ip_whitelist(user_id);

-- ============================================
-- 6. ADMIN SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ip_whitelist_enabled BOOLEAN DEFAULT false,
  ip_whitelist INET[] DEFAULT ARRAY[]::INET[],
  require_2fa BOOLEAN DEFAULT false,
  session_timeout_minutes INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_user ON admin_settings(user_id);

-- ============================================
-- 7. OAUTH STATES & ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(255) UNIQUE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  code_verifier VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- google, microsoft, etc.
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  picture_url TEXT,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);

-- ============================================
-- 8. LOGIN ATTEMPTS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  ip_address INET,
  success BOOLEAN,
  reason VARCHAR(255),
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(attempted_at);

-- ============================================
-- 9. SESSION DEVICES & TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS session_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- mobile, desktop, tablet
  device_os VARCHAR(100),
  browser VARCHAR(100),
  ip_address INET,
  is_trusted BOOLEAN DEFAULT false,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_devices_user ON session_devices(user_id);

-- ============================================
-- 10. SECURITY EVENTS LOG
-- ============================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100), -- suspicious_login, brute_force, ip_change, etc.
  description TEXT,
  severity VARCHAR(20), -- low, medium, high, critical
  ip_address INET,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- ============================================
-- 11. API KEY IMPROVEMENTS
-- ============================================

ALTER TABLE api_keys
ADD COLUMN IF NOT EXISTS scopes VARCHAR(500)[] DEFAULT ARRAY[]::VARCHAR[],
ADD COLUMN IF NOT EXISTS rate_limit INT DEFAULT 1000,
ADD COLUMN IF NOT EXISTS ip_whitelist INET[],
ADD COLUMN IF NOT EXISTS last_used_ip INET,
ADD COLUMN IF NOT EXISTS use_count INT DEFAULT 0;

-- ============================================
-- 12. UPDATE AUDIT_LOG WITH MORE FIELDS
-- ============================================

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id),
ADD COLUMN IF NOT EXISTS resource VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);

-- ============================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_two_fa ON users(two_fa_enabled);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_permissions_role_resource ON permissions(role_id, resource);

-- ============================================
-- 14. SEED DEFAULT ADMIN SETTINGS
-- ============================================

-- Insert default settings for new admins
INSERT INTO admin_settings (user_id, ip_whitelist_enabled, require_2fa, session_timeout_minutes)
SELECT id, false, false, 30
FROM users
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
  AND id NOT IN (SELECT user_id FROM admin_settings WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. ROLE-BASED PERMISSION SEEDING
-- ============================================

-- Super Admin Permissions
INSERT INTO permissions (role_id, resource, action) VALUES
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'users', 'create'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'users', 'read'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'users', 'update'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'users', 'delete'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'create'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'read'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'update'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'delete'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'publish'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'articles', 'approve'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'settings', 'read'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'settings', 'update'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'audit', 'read'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'permissions', 'manage'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'api_keys', 'manage'),
  ((SELECT id FROM roles WHERE name = 'super_admin'), 'security', 'manage')
ON CONFLICT DO NOTHING;

-- Admin Permissions
INSERT INTO permissions (role_id, resource, action) VALUES
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'create'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'read'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'update'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'delete'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'publish'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'articles', 'approve'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'users', 'read'),
  ((SELECT id FROM roles WHERE name = 'admin'), 'audit', 'read')
ON CONFLICT DO NOTHING;

-- Editor Permissions
INSERT INTO permissions (role_id, resource, action) VALUES
  ((SELECT id FROM roles WHERE name = 'editor'), 'articles', 'create'),
  ((SELECT id FROM roles WHERE name = 'editor'), 'articles', 'read'),
  ((SELECT id FROM roles WHERE name = 'editor'), 'articles', 'update')
ON CONFLICT DO NOTHING;

-- Analyst Permissions
INSERT INTO permissions (role_id, resource, action) VALUES
  ((SELECT id FROM roles WHERE name = 'analyst'), 'articles', 'read'),
  ((SELECT id FROM roles WHERE name = 'analyst'), 'audit', 'read')
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. UPDATE SESSIONS TABLE CONSTRAINTS
-- ============================================

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES session_devices(id);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_id);

-- ============================================
-- END OF MIGRATION
-- ============================================
