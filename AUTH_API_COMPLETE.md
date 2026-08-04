# Universities Voice - Complete Authentication & Security API

Complete production-ready authentication system for the admin panel with all 8 required features.

## Features Implemented

### 1. **2FA (Two-Factor Authentication) with TOTP**
- Generate TOTP secrets with QR code
- Verify OTP codes
- Enable/disable 2FA
- Rate limiting on OTP attempts
- Secure temporary secret storage

### 2. **Session Management with Device Control**
- Create and track sessions per device
- View all active sessions
- Revoke individual sessions
- Revoke all other sessions
- Parse device information from user agent

### 3. **IP Whitelisting for Admin Access**
- Configure IP whitelist per user
- Validate incoming IP addresses
- Log IP changes
- Support for IPv6 and proxy scenarios

### 4. **Role-Based Access Control (RBAC) with 4 Permission Levels**
- 4 roles: super_admin, admin, editor, analyst
- Granular permissions per role
- Permission hierarchy
- Grant/revoke permissions dynamically
- Update user roles

### 5. **Audit Logging (Track User Actions)**
- Log all security-related actions
- Audit logs for user management
- Query logs by user, action, or date range
- Archive old logs
- Audit summaries and analytics

### 6. **Password Policies & Expiration**
- Enforce password complexity (12+ chars, uppercase, lowercase, numbers, special chars)
- 90-day expiration policy
- Password history (prevent reuse)
- Change password with validation
- Request/complete password reset

### 7. **OAuth2/SAML Support**
- Google OAuth2 integration
- Microsoft OAuth2 integration
- PKCE code flow for security
- Link/unlink OAuth providers
- OAuth account management

### 8. **API Key Management**
- Generate secure API keys
- View API key list (hidden after creation)
- Set API key expiration
- Revoke API keys
- Track API key usage

## Installation

### 1. Install Dependencies

```bash
npm install bcrypt jsonwebtoken speakeasy pg
# or
yarn add bcrypt jsonwebtoken speakeasy pg
```

### 2. Set Environment Variables

Create `.env.local`:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=universities_voice

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_EXPIRY=15m
REFRESH_EXPIRY=7d

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 3. Run Migrations

```bash
# Execute migration script
psql -U postgres -h localhost -d universities_voice -f migrations/001_phase1_schema.sql
psql -U postgres -h localhost -d universities_voice -f migrations/002_auth_security_system.sql
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth` - Login
Login with email and password.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "deviceName": "Chrome on MacOS",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
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

#### PUT `/api/auth` - Signup
Register a new admin user.

**Request:**
```json
{
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "firstName": "New",
  "lastName": "Admin"
}
```

**Response:** Same as login

#### DELETE `/api/auth` - Logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### PATCH `/api/auth` - Refresh Token
Get a new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "expiresIn": "15m"
}
```

### 2FA Endpoints

#### POST `/api/auth/2fa` - Setup 2FA
Initialize two-factor authentication.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "secret": "base64_encoded_secret",
  "qrCode": "otpauth://totp/...",
  "message": "Scan QR code with authenticator app and verify with code"
}
```

#### PATCH `/api/auth/2fa` - Verify OTP
Verify OTP code to enable or verify 2FA.

**Request:**
```json
{
  "otp": "123456",
  "action": "setup"  // or "verify"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

#### DELETE `/api/auth/2fa` - Disable 2FA
Turn off two-factor authentication (requires password).

**Request:**
```json
{
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

#### GET `/api/auth/2fa` - Check 2FA Status
Get current 2FA status.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "twoFAEnabled": true
}
```

### Session Management Endpoints

#### GET `/api/auth/sessions` - List Sessions
Get all active sessions for the user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ipAddress": "192.168.1.1",
      "device": "Chrome",
      "createdAt": "2024-08-04T10:00:00Z",
      "expiresAt": "2024-08-11T10:00:00Z",
      "isCurrent": true
    }
  ],
  "total": 1
}
```

#### POST `/api/auth/sessions` - Revoke Session
Revoke a specific session.

**Request:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session revoked"
}
```

#### PUT `/api/auth/sessions` - Revoke All Sessions
Revoke all sessions except the current one.

**Response:**
```json
{
  "success": true,
  "message": "3 sessions revoked",
  "revokedCount": 3
}
```

### Password Management Endpoints

#### POST `/api/auth/password` - Change Password
Change current password.

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. All other sessions have been revoked."
}
```

#### PUT `/api/auth/password` - Request Password Reset
Request a password reset link.

**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If email exists, reset link has been sent"
}
```

#### PATCH `/api/auth/password` - Complete Password Reset
Complete the password reset with token.

**Request:**
```json
{
  "resetToken": "token_from_email_link",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in again."
}
```

#### GET `/api/auth/password` - Get Password Policy
Check password policy and user status.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "policy": {
    "minLength": 12,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": true,
    "expiryDays": 90
  },
  "userStatus": {
    "daysSinceChange": 30,
    "passwordExpired": false,
    "daysUntilExpiry": 60
  }
}
```

### API Key Management Endpoints

#### GET `/api/auth/apikeys` - List API Keys
Get all API keys for the user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Production API",
      "keyPreview": "sk_pub_abcd1234...",
      "lastUsed": "2024-08-04T14:30:00Z",
      "expiresAt": "2025-08-04T00:00:00Z",
      "createdAt": "2024-08-04T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST `/api/auth/apikeys` - Create API Key
Generate a new API key.

**Request:**
```json
{
  "name": "Production API",
  "expiresIn": 365
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production API",
    "secretKey": "sk_abcdef1234567890...",
    "publicKey": "sk_pub_1234567890...",
    "expiresAt": "2025-08-04T00:00:00Z",
    "createdAt": "2024-08-04T00:00:00Z"
  },
  "message": "Keep your secret key safe. It will not be shown again."
}
```

#### PATCH `/api/auth/apikeys` - Update API Key
Update an API key name.

**Request:**
```json
{
  "keyId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key updated"
}
```

#### DELETE `/api/auth/apikeys/:keyId` - Revoke API Key
Revoke an API key.

**Response:**
```json
{
  "success": true,
  "message": "API key revoked"
}
```

### Permissions/RBAC Endpoints

#### GET `/api/auth/permissions` - Get Current Permissions
Get current user's permissions.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "role": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "super_admin",
    "description": "Full system access"
  },
  "permissions": [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "articles:create",
    "articles:read",
    "articles:update",
    "articles:delete",
    "articles:publish",
    "articles:approve",
    "settings:read",
    "settings:update",
    "audit:read",
    "permissions:manage",
    "api_keys:manage",
    "security:manage"
  ],
  "hierarchy": 4
}
```

#### POST `/api/auth/permissions` - Grant Permission
Grant a permission to a role (super_admin only).

**Request:**
```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "resource": "articles",
  "action": "publish"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission articles:publish granted"
}
```

#### DELETE `/api/auth/permissions` - Revoke Permission
Revoke a permission from a role (super_admin only).

**Request:**
```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "resource": "articles",
  "action": "publish"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission articles:publish revoked"
}
```

#### PUT `/api/auth/permissions` - List All Roles
Get all available roles with permissions.

**Response:**
```json
{
  "success": true,
  "roles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "super_admin",
      "description": "Full system access",
      "permissionCount": 16,
      "hierarchy": 4,
      "permissions": ["users:*", "articles:*", ...]
    }
  ],
  "total": 4
}
```

#### PATCH `/api/auth/permissions` - Update User Role
Change a user's role (super_admin only).

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "roleId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated to super_admin"
}
```

### Audit Logging Endpoints

#### GET `/api/auth/audit?userId=...&action=...&days=30&limit=100&offset=0` - Get Audit Logs
Retrieve audit logs for admin users.

**Query Parameters:**
- `userId`: Filter by user ID (optional)
- `action`: Filter by action type (optional)
- `days`: Number of days to look back (default: 30)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "userEmail": "admin@example.com",
      "userName": "Admin User",
      "action": "login",
      "entityType": "user",
      "entityId": null,
      "changes": null,
      "ipAddress": "192.168.1.1",
      "timestamp": "2024-08-04T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST `/api/auth/audit` - Get Audit Summary
Get audit summary and top user activity.

**Response:**
```json
{
  "success": true,
  "summary": {
    "byAction": [
      {
        "action": "login",
        "count": 245,
        "firstOccurrence": "2024-08-01T00:00:00Z",
        "lastOccurrence": "2024-08-04T14:30:00Z"
      }
    ],
    "topUsers": [
      {
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "email": "admin@example.com",
        "actionCount": 50,
        "uniqueActions": 12
      }
    ]
  }
}
```

#### PUT `/api/auth/audit?userId=...` - Get User Audit History
Get audit logs for a specific user.

**Response:** Same as GET `/api/auth/audit`

#### DELETE `/api/auth/audit` - Archive Old Logs
Delete audit logs older than specified days (super_admin only).

**Request:**
```json
{
  "olderThanDays": 365
}
```

**Response:**
```json
{
  "success": true,
  "message": "1,234 audit logs archived",
  "deletedCount": 1234
}
```

### OAuth Endpoints

#### POST `/api/auth/oauth` - Initiate OAuth
Start the OAuth flow.

**Request:**
```json
{
  "provider": "google",
  "redirectUri": "https://app.example.com/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "state_token_for_csrf_protection"
}
```

#### PATCH `/api/auth/oauth` - OAuth Callback
Handle OAuth provider callback.

**Request:**
```json
{
  "provider": "google",
  "code": "authorization_code",
  "state": "state_from_initiate"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "user@gmail.com",
    "name": "User Name",
    "role": "editor"
  },
  "expiresAt": "2024-08-04T15:00:00Z"
}
```

#### GET `/api/auth/oauth` - Get OAuth Status
Get linked OAuth providers.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "linkedProviders": ["google"],
  "availableProviders": ["microsoft"]
}
```

#### DELETE `/api/auth/oauth` - Disconnect OAuth
Unlink an OAuth provider.

**Request:**
```json
{
  "provider": "google"
}
```

**Response:**
```json
{
  "success": true,
  "message": "google disconnected"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": []  // Optional: specific validation errors
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

The following endpoints are rate-limited to prevent abuse:

- `/api/auth` (login): 5 attempts per 15 minutes per email
- `/api/auth/password` (reset): 3 attempts per hour per email
- `/api/auth/2fa` (verify): 3 attempts per 5 minutes

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT secrets** regularly
3. **Monitor audit logs** for suspicious activity
4. **Enable 2FA** for all admin accounts
5. **Use strong passwords** (12+ chars, mixed case, numbers, special chars)
6. **Whitelist IPs** for high-security accounts
7. **Review active sessions** regularly
8. **Revoke unused API keys** promptly
9. **Set password expiration** to 90 days
10. **Store secrets in environment variables**

## Testing

Example curl commands:

```bash
# Login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123!"}'

# Setup 2FA
curl -X POST http://localhost:3000/api/auth/2fa \
  -H "Authorization: Bearer {accessToken}"

# List sessions
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer {accessToken}"

# Get API keys
curl -X GET http://localhost:3000/api/auth/apikeys \
  -H "Authorization: Bearer {accessToken}"

# Create API key
curl -X POST http://localhost:3000/api/auth/apikeys \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"name":"My API Key","expiresIn":365}'
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DB credentials in `.env.local`
- Verify database exists and migrations are run

### JWT Token Errors
- Ensure `JWT_SECRET` is set in environment
- Check token has not expired
- Verify Authorization header format: `Bearer {token}`

### 2FA Issues
- Ensure authenticator app is synchronized with server time
- Check that TOTP secret was stored correctly
- Allow small time drift (±30 seconds)

### OAuth Issues
- Verify OAuth provider credentials in `.env.local`
- Check redirect URI matches provider configuration
- Ensure CORS is properly configured

## Support

For issues or questions, please open an issue in the repository.
