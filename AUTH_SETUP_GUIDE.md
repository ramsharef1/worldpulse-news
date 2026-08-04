# Authentication & Security API Setup Guide

Complete step-by-step guide to setup and deploy the authentication system.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

This will install:
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation
- `speakeasy` - TOTP for 2FA
- `pg` - PostgreSQL driver

## Step 2: Database Setup

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE universities_voice;
```

### Run Migrations

```bash
# Run Phase 1 schema
psql -U postgres -d universities_voice -f migrations/001_phase1_schema.sql

# Run Auth & Security schema
psql -U postgres -d universities_voice -f migrations/002_auth_security_system.sql
```

### Verify Tables

```bash
# Connect to database
psql -U postgres -d universities_voice

# List tables
\dt

# Check users table
\d users

# Exit
\q
```

## Step 3: Environment Configuration

### Create `.env.local`

```bash
cp .env.example .env.local
```

### Edit `.env.local`

Update the following variables:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=universities_voice

# JWT Secrets (Generate strong random strings)
JWT_SECRET=replace_with_random_32_char_string_1234567890123456
REFRESH_SECRET=replace_with_random_32_char_string_9876543210987654

# OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Generate Secure Secrets

Use this command to generate secure random strings:

```bash
# Mac/Linux
openssl rand -hex 32

# Windows PowerShell
[System.Convert]::ToHexString([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

## Step 4: Create Initial Admin User

Create a SQL script `create_admin.sql`:

```sql
-- Get default role IDs
SELECT id, name FROM roles;

-- Insert admin user (replace with actual values)
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role_id, 
  status,
  two_fa_enabled
)
VALUES (
  'admin@example.com',
  '$2b$10$...',  -- Use bcrypt hashed password
  'Admin',
  'User',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  'active',
  false
);
```

For testing, you can use a simple password hash. In production, use proper bcrypt hashing.

## Step 5: Configure OAuth (Optional)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
6. Copy Client ID and Client Secret to `.env.local`

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Register new application
3. Create client secret
4. Add platform: Web
5. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
6. Copy Application ID and secret to `.env.local`

## Step 6: Test the API

### Start Development Server

```bash
npm run dev
# Server runs on http://localhost:3000
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword123!",
    "deviceName": "Testing Device"
  }'
```

### Expected Response

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "super_admin",
    "twoFAEnabled": false,
    "requiresOTP": false
  },
  "expiresAt": "2024-08-04T15:00:00Z"
}
```

## Step 7: Test 2FA Setup

Using the access token from login:

```bash
curl -X POST http://localhost:3000/api/auth/2fa \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:

```json
{
  "success": true,
  "secret": "base64_encoded_secret",
  "qrCode": "otpauth://totp/UniversitiesVoice?secret=...",
  "message": "Scan QR code with authenticator app and verify with code"
}
```

**Steps to verify:**
1. Scan QR code with Google Authenticator, Authy, or Microsoft Authenticator
2. Get the 6-digit code
3. Verify with OTP

## Step 8: Test Session Management

List sessions:

```bash
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:

```json
{
  "success": true,
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ipAddress": "127.0.0.1",
      "device": "Unknown Device",
      "createdAt": "2024-08-04T14:00:00Z",
      "expiresAt": "2024-08-11T14:00:00Z",
      "isCurrent": true
    }
  ],
  "total": 1
}
```

## Step 9: Test API Key Management

Create API key:

```bash
curl -X POST http://localhost:3000/api/auth/apikeys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "expiresIn": 365
  }'
```

Expected response:

```json
{
  "success": true,
  "key": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Test API Key",
    "secretKey": "sk_abcdef1234567890...",
    "publicKey": "sk_pub_1234567890...",
    "expiresAt": "2025-08-04T00:00:00Z",
    "createdAt": "2024-08-04T00:00:00Z"
  },
  "message": "Keep your secret key safe. It will not be shown again."
}
```

## Step 10: Deploy to Production

### Pre-deployment Checklist

- [ ] Update JWT secrets with strong random values
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Enable HSTS headers
- [ ] Configure secure cookie flags
- [ ] Enable audit logging
- [ ] Setup monitoring/alerting
- [ ] Configure backup strategy
- [ ] Test disaster recovery
- [ ] Document deployment procedure
- [ ] Setup log aggregation

### Environment Variables

```env
NODE_ENV=production
JWT_SECRET=<strong_random_value>
REFRESH_SECRET=<strong_random_value>
DB_HOST=<production_db_host>
DB_PASSWORD=<strong_password>
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t universities-voice:latest .
docker run -p 3000:3000 --env-file .env.local universities-voice:latest
```

## Monitoring & Maintenance

### Check Database Health

```bash
# Connect to database
psql -U postgres -d universities_voice

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check indexes
\di
```

### Monitor Audit Logs

```bash
# Check recent audit logs
SELECT COUNT(*) FROM audit_log WHERE timestamp > NOW() - INTERVAL '1 day';

# Check for suspicious activity
SELECT action, COUNT(*) as count FROM audit_log 
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY action
ORDER BY count DESC;
```

### Clear Old Sessions

```bash
-- Remove expired sessions
DELETE FROM sessions WHERE expires_at < NOW();
```

### Archive Old Audit Logs

```bash
-- Archive logs older than 1 year
DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '365 days';
```

## Troubleshooting

### Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
- Ensure PostgreSQL is running: `brew services start postgresql` (Mac)
- Check DB_HOST and DB_PORT in .env.local
- Verify credentials are correct
```

### JWT Verification Failures

```
Error: Invalid or expired token

Solution:
- Ensure JWT_SECRET matches on all servers
- Check token expiration
- Verify Authorization header format: "Bearer {token}"
```

### 2FA Issues

```
Error: Invalid OTP code

Solution:
- Check system time is synchronized
- Verify TOTP secret was stored correctly
- Ensure authenticator app is on same time
```

### Rate Limiting

```
Error: Too many requests (429)

Solution:
- Wait for rate limit window to expire
- Check CLIENT IP address
- Increase rate limit if needed
```

## Security Hardening

### SQL Injection Prevention

All queries use parameterized statements:
```typescript
query('SELECT * FROM users WHERE email = $1', [email]);
```

### XSS Prevention

Input is sanitized:
```typescript
sanitizeInput(userInput);
```

### CSRF Protection

OAuth uses state parameter for CSRF protection.

### Rate Limiting

Implemented on:
- Login attempts
- Password reset
- 2FA verification
- API calls

### Password Security

- Bcrypt hashing with salt
- Password complexity validation
- 90-day expiration
- Password history (no reuse)

### Session Security

- Secure session tokens
- IP tracking
- Device tracking
- Session expiration

## Support

For issues or questions:
1. Check the [API Documentation](AUTH_API_COMPLETE.md)
2. Review error logs
3. Check database logs
4. Open an issue on GitHub

## Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
