# Authentication API - Quick Reference Guide

Fast lookup for common authentication operations.

## Core Concepts

### Roles & Permissions

```
super_admin (level 4)  → Full system access
├─ admin (level 3)     → Content management + user read
├─ editor (level 2)    → Content creation & editing
└─ viewer (level 1)    → Read-only access
```

### Token Flow

```
Login → Access Token (15m) + Refresh Token (7d)
          ↓
   Access protected routes
          ↓
   Token expires → Use Refresh Token
                    ↓
                 New Access Token
```

### 2FA Flow

```
Setup 2FA → Scan QR Code → Enter OTP → Enabled
                                          ↓
            Login → Requires OTP → Verify → Session
```

## API Quick Reference

### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth` | Login |
| PUT | `/api/auth` | Signup |
| DELETE | `/api/auth` | Logout |
| PATCH | `/api/auth` | Refresh token |

### 2FA

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/2fa` | Setup 2FA |
| PATCH | `/api/auth/2fa` | Verify OTP |
| DELETE | `/api/auth/2fa` | Disable 2FA |
| GET | `/api/auth/2fa` | Check status |

### Sessions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/sessions` | List sessions |
| POST | `/api/auth/sessions` | Revoke session |
| PUT | `/api/auth/sessions` | Revoke all |
| DELETE | `/api/auth/sessions/:id` | Delete session |

### Password

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/password` | Change password |
| PUT | `/api/auth/password` | Request reset |
| PATCH | `/api/auth/password` | Complete reset |
| GET | `/api/auth/password` | Get policy |

### API Keys

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/apikeys` | List keys |
| POST | `/api/auth/apikeys` | Create key |
| PATCH | `/api/auth/apikeys` | Update key |
| DELETE | `/api/auth/apikeys/:id` | Revoke key |

### Permissions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/permissions` | Get current |
| POST | `/api/auth/permissions` | Grant permission |
| DELETE | `/api/auth/permissions` | Revoke permission |
| PUT | `/api/auth/permissions` | List roles |
| PATCH | `/api/auth/permissions` | Update user role |

### Audit Logs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/audit` | Get logs |
| POST | `/api/auth/audit` | Summary |
| PUT | `/api/auth/audit` | User history |
| DELETE | `/api/auth/audit` | Archive logs |

### OAuth

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/oauth` | Initiate flow |
| PATCH | `/api/auth/oauth` | Callback |
| GET | `/api/auth/oauth` | Get status |
| DELETE | `/api/auth/oauth` | Disconnect |

## Common Tasks

### Login

```typescript
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePassword123!'
  })
});

const { accessToken, refreshToken, user } = await response.json();
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Authenticated Request

```typescript
const response = await fetch('/api/auth/sessions', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Handle Token Expiry

```typescript
const refreshAccessToken = async () => {
  const response = await fetch('/api/auth', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });
  
  const { accessToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
  return accessToken;
};
```

### Setup 2FA

```typescript
// 1. Request setup
const setupResponse = await fetch('/api/auth/2fa', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const { qrCode, secret } = await setupResponse.json();
// Display QR code to user

// 2. Verify OTP
const verifyResponse = await fetch('/api/auth/2fa', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    otp: '123456',
    action: 'setup'
  })
});
```

### Create API Key

```typescript
const response = await fetch('/api/auth/apikeys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Production API',
    expiresIn: 365
  })
});

const { key } = await response.json();
// Save secretKey securely - only shown once!
```

### Get Audit Logs

```typescript
const response = await fetch('/api/auth/audit?days=30&limit=100', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const { logs } = await response.json();
```

### Change Password

```typescript
const response = await fetch('/api/auth/password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword456!',
    confirmPassword: 'NewPassword456!'
  })
});
```

### Revoke All Sessions

```typescript
const response = await fetch('/api/auth/sessions', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// All other sessions are revoked except current
// User stays logged in on this device
```

## Error Handling

### Standard Error Response

```json
{
  "error": "Invalid email or password",
  "details": []
}
```

### Handle Errors

```typescript
const response = await fetch('/api/auth', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

if (!response.ok) {
  const { error, details } = await response.json();
  
  if (response.status === 401) {
    // Unauthorized
    console.error('Login failed:', error);
  } else if (response.status === 429) {
    // Rate limited
    console.error('Too many attempts:', error);
  } else if (response.status === 400 && details) {
    // Validation error
    console.error('Validation errors:', details);
  }
}
```

## Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Proceed normally |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Re-authenticate or refresh token |
| 403 | Forbidden | Check permissions/role |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Wait before retrying |
| 500 | Server Error | Check logs/status page |

## Headers

### Required Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Common Headers

```
User-Agent: [browser/app identifier]
Accept: application/json
X-Forwarded-For: [client IP]
```

## Query Parameters

### Pagination

```
?limit=50&offset=0
```

### Filtering

```
?userId=550e8400-e29b-41d4-a716-446655440000
?action=login
?days=30
```

## Request Body Examples

### Login Request

```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "deviceName": "Chrome on MacOS"
}
```

### Change Password

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

### Create API Key

```json
{
  "name": "Production API",
  "expiresIn": 365
}
```

### Grant Permission

```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "resource": "articles",
  "action": "publish"
}
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Store tokens securely (httpOnly cookies preferred)
- [ ] Clear tokens on logout
- [ ] Refresh tokens before expiry
- [ ] Validate all inputs
- [ ] Handle errors gracefully
- [ ] Monitor failed login attempts
- [ ] Enable 2FA for admins
- [ ] Review audit logs regularly
- [ ] Rotate API keys periodically
- [ ] Monitor session activity
- [ ] Check permission updates
- [ ] Whitelist admin IPs
- [ ] Enable password expiration alerts

## Debugging

### Check Token Contents

```javascript
// Decode JWT (client-side only)
const decodeJWT = (token) => {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  return payload;
};

const payload = decodeJWT(accessToken);
console.log(payload);
// { userId: '...', email: '...', role: '...', exp: ... }
```

### Monitor Network Requests

```javascript
// Log all API calls
fetch = (() => {
  const originalFetch = window.fetch;
  return (...args) => {
    console.log('API Call:', args[0], args[1]);
    return originalFetch.apply(this, args);
  };
})();
```

### Check Stored Tokens

```javascript
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
```

## Environment Variables Needed

```
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
DB_NAME
JWT_SECRET
REFRESH_SECRET
GOOGLE_CLIENT_ID (optional)
GOOGLE_CLIENT_SECRET (optional)
MICROSOFT_CLIENT_ID (optional)
MICROSOFT_CLIENT_SECRET (optional)
```

## Useful Commands

### Test API with curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123!"}'

# Get sessions
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer TOKEN"

# Create API key
curl -X POST http://localhost:3000/api/auth/apikeys \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","expiresIn":365}'
```

### View Database

```bash
# Connect to DB
psql -U postgres -d universities_voice

# View users
SELECT id, email, role_id, status, two_fa_enabled FROM users;

# View audit logs
SELECT user_id, action, entity_type, timestamp FROM audit_log ORDER BY timestamp DESC LIMIT 10;

# View sessions
SELECT id, user_id, ip_address, expires_at FROM sessions;

# View API keys
SELECT id, user_id, name, created_at FROM api_keys;
```

## Tips & Tricks

### Rate Limit Bypass

⚠️ **DO NOT DO THIS** - Use proper account recovery instead:
1. Try different email/user ID variations
2. Wait for rate limit window
3. Contact support for account recovery

### Password Reset Flow

1. User requests reset with email
2. Check inbox for reset link
3. Click link with token
4. Enter new password
5. Login with new password

### Session Management

1. Check all active sessions
2. Identify suspicious devices
3. Revoke unknown sessions
4. Revoke all if compromised
5. Change password immediately

### API Key Rotation

1. Generate new API key
2. Update application config
3. Test with new key
4. Revoke old key
5. Verify all systems working

## Support Resources

- 📚 Full API Docs: `AUTH_API_COMPLETE.md`
- 🚀 Setup Guide: `AUTH_SETUP_GUIDE.md`
- 🔐 Security: See OWASP guidelines
- 🐛 Debug: Check browser console and server logs
- 💬 Questions: Open GitHub issue

## Version Info

- Created: August 2024
- Status: Production Ready
- Last Updated: August 4, 2024
