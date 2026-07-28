# Universities-Voice Authentication System

Complete user authentication system for Universities-Voice platform with full bilingual (Arabic/English) and dark mode support.

## Overview

This authentication system provides:
- **User Signup** with email validation and password strength checking
- **User Login** with session persistence
- **Auth Context** for global state management
- **Protected Routes** for authenticated-only pages
- **Token Management** using mock JWT tokens
- **Bilingual Support** (Arabic/English with RTL/LTR)
- **Dark Mode Support** throughout the system

## File Structure

```
app/
├── auth/
│   ├── signup/
│   │   └── page.tsx          # Signup page with form validation
│   └── login/
│       └── page.tsx           # Login page with "Remember me"
├── profile/
│   └── page.tsx               # Protected profile page (demo)
└── layout.tsx                 # Updated with AuthProvider wrapper

lib/
├── AuthContext.tsx            # Auth context & useAuth hook
└── authUtils.ts               # Validation & utility functions

components/
├── ProtectedRoute.tsx         # Route protection HOC
└── UserMenu.tsx               # User dropdown menu component
```

## Core Features

### 1. Authentication Context (`lib/AuthContext.tsx`)

The `AuthContext` manages:
- **User State**: Current authenticated user information
- **Token Management**: JWT token storage and validation
- **Auth Functions**: `login()`, `signup()`, `logout()`, `updateUser()`
- **Session Persistence**: Automatic session restoration on page reload

**Usage:**

```typescript
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Welcome, {user?.name_en}!</div>;
}
```

### 2. Signup Page (`app/auth/signup/page.tsx`)

Features:
- Bilingual form (Arabic & English names)
- Email validation
- Password strength indicator (4-level)
- Confirm password matching
- Error and success messages
- Redirect to login link
- Auto-redirect if already logged in

**Validation Rules:**
- Names: Required in both Arabic and English
- Email: Valid email format
- Password: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number

### 3. Login Page (`app/auth/login/page.tsx`)

Features:
- Email and password fields
- "Remember me" checkbox
- "Forgot password" link (placeholder)
- Success/error messages
- Auto-fill remembered email
- Link to signup page
- Auto-redirect if already logged in

### 4. Protected Routes (`components/ProtectedRoute.tsx`)

Wraps components that require authentication:

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
```

Optional role-based protection:
```typescript
<ProtectedRoute requiredRole="faculty">
  <FacultyOnlyContent />
</ProtectedRoute>
```

### 5. User Menu Component (`components/UserMenu.tsx`)

Displays:
- User avatar with first letter
- User name (responsive)
- Dropdown menu with:
  - Profile link
  - Settings link
  - Logout button
- Login/Signup buttons if not authenticated

**Usage:**
```typescript
<UserMenu language="ar" />
```

### 6. Auth Utilities (`lib/authUtils.ts`)

Helper functions:
- `isValidEmail(email)` - Email validation
- `isPasswordStrong(password)` - Password strength check
- `getPasswordStrength(password)` - Get strength score (0-4)
- `getStrengthLabel(strength, language)` - Get strength text
- `getStrengthColor(strength)` - Get UI color for strength
- `isValidName(name)` - Name validation
- `sanitizeInput(input)` - XSS prevention
- `generateUserId()` - Unique user ID generation
- `validateSignupForm(data)` - Full signup validation
- `validateLoginForm(data)` - Full login validation
- `parseJWT(token)` - Token parsing (demo only)
- `isTokenExpired(token)` - Check token expiration

## How to Use

### 1. Setup (Already Done in `layout.tsx`)

The app is already wrapped with `AuthProvider`:

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Create a New User Account

1. Navigate to `/auth/signup`
2. Fill in the form:
   - Name in Arabic (الاسم بالعربية)
   - Name in English
   - Email address
   - Strong password (8+ chars, uppercase, lowercase, numbers)
   - Confirm password
3. Click "Create Account"
4. Auto-redirect to home page

### 3. Login

1. Navigate to `/auth/login`
2. Enter your email and password
3. Optionally check "Remember me" to auto-fill email next time
4. Click "Login"
5. Auto-redirect to home page

### 4. Access Protected Pages

Protected pages automatically redirect to login:

```typescript
function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### 5. Use Auth Context in Components

```typescript
'use client';

import { useAuth } from '@/lib/AuthContext';

export function HeaderUserSection() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return isAuthenticated ? (
    <div>
      <p>Welcome, {user?.name_en}</p>
      <button onClick={logout}>Logout</button>
    </div>
  ) : (
    <a href="/auth/login">Login</a>
  );
}
```

## Data Storage

**Important:** This is a mock authentication system using browser localStorage.

### User Data Structure

```typescript
interface AuthUser {
  id: string;                    // Unique user ID
  name_ar: string;               // Arabic name
  name_en: string;               // English name
  email: string;                 // Email address
  profile_image?: string;        // Optional profile image URL
  role: UserRole;                // User role
  language_preference: 'ar' | 'en';
  theme_preference: 'light' | 'dark' | 'auto';
}
```

### LocalStorage Keys

- `auth_token` - JWT token
- `auth_user` - Serialized user object
- `remember_me` - Remembered email
- `users` - All registered users (for demo)

## Testing

### Test Account

You can create test accounts during signup, or use:

**Email:** test@example.com  
**Password:** Test1234

Then login with these credentials.

### Test Cases

1. **Signup Validation**
   - Missing fields → Error
   - Invalid email → Error
   - Weak password → Error
   - Passwords don't match → Error

2. **Login Validation**
   - Wrong email → "Email not found"
   - Wrong password → "Invalid password"
   - Correct credentials → Success

3. **Protected Routes**
   - Logged out → Redirect to login
   - Logged in → Access page

4. **Language & Theme**
   - Toggle language (AR/EN)
   - Toggle dark mode
   - Changes persist across navigation

## Bilingual Implementation

All pages use the translation pattern:

```typescript
const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

// Usage
<h1>{t('مرحبا', 'Hello')}</h1>
```

### RTL/LTR Support

Automatically handled by:
```typescript
document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = language;
```

## Dark Mode Support

Implemented using Tailwind's dark mode:

```typescript
document.documentElement.classList.toggle('dark', darkMode);
```

All components use dark mode utilities:
- `dark:bg-gray-900` - Dark background
- `dark:text-white` - Dark text
- `dark:border-gray-800` - Dark borders

## Security Notes

⚠️ **This is a demo/mock system. For production:**

1. **Backend Authentication**
   - Move authentication logic to backend
   - Never validate passwords in client code
   - Use proper password hashing (bcrypt, Argon2)

2. **Token Management**
   - Use real JWT tokens from server
   - Store tokens in httpOnly cookies (not localStorage)
   - Implement token refresh mechanism

3. **HTTPS Only**
   - All auth requests must use HTTPS
   - Set secure and httpOnly flags on cookies

4. **Input Validation**
   - Validate on both client and server
   - Use parameterized queries
   - Implement rate limiting

5. **Database**
   - Secure password hashing
   - User email verification
   - Account recovery flow

## Extending the System

### Add a New Protected Page

```typescript
// app/my-protected-page/page.tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

function MyPageContent() {
  const { user } = useAuth();
  return <div>Page for {user?.name_en}</div>;
}

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Add Role-Based Access

```typescript
<ProtectedRoute requiredRole="faculty">
  <FacultyPanel />
</ProtectedRoute>
```

### Update User Profile

```typescript
const { updateUser } = useAuth();

updateUser({
  language_preference: 'en',
  theme_preference: 'dark',
});
```

### Custom Validation

```typescript
import { isPasswordStrong, isValidEmail } from '@/lib/authUtils';

if (!isValidEmail(email) || !isPasswordStrong(password)) {
  // Show error
}
```

## Troubleshooting

### Users lost on page refresh

- Check browser localStorage is enabled
- Check `AuthProvider` wraps the app
- Check `layout.tsx` has `AuthProvider`

### Protected route not working

- Ensure component is wrapped with `<ProtectedRoute>`
- Check component is marked with `'use client'`
- Check `useAuth()` is called within `AuthProvider`

### Login/Signup not working

- Check email format is valid
- Check password meets strength requirements
- Check names are filled in both languages
- Clear localStorage and try again

### Theme/Language not persisting

- Ensure state updates happen in useEffect
- Check dark mode class is applied to `<html>`
- Check RTL direction is set correctly

## TypeScript Types

All types are defined for type safety:

```typescript
import { AuthUser, AuthContextType } from '@/lib/AuthContext';
```

## Next Steps

To integrate with a real backend:

1. Replace mock JWT generation with server auth endpoint
2. Move user storage from localStorage to database
3. Implement proper password hashing
4. Add email verification flow
5. Implement token refresh mechanism
6. Add OAuth/social login options
7. Implement 2FA (two-factor authentication)

## Support Files

- `components/ProtectedRoute.tsx` - Route protection
- `components/UserMenu.tsx` - User menu dropdown
- `lib/AuthContext.tsx` - Auth context provider
- `lib/authUtils.ts` - Utility functions
- `app/auth/signup/page.tsx` - Signup page
- `app/auth/login/page.tsx` - Login page
- `app/profile/page.tsx` - Profile page (protected)
