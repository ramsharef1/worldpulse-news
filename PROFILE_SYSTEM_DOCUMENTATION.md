# Universities-Voice: User Profile System Documentation

## Overview

A complete user profile system has been built for Universities-Voice with full bilingual support (Arabic/English), dark mode, and localStorage-based persistence. The system includes authentication, profile management, saved articles tracking, and user comments management.

## Architecture

### 1. **Authentication Context** (`/context/AuthContext.tsx`)
- Global state management for user authentication
- Provides `useAuth()` hook for components
- Features:
  - User login/logout
  - User registration
  - Profile updates
  - Account deletion
  - LocalStorage persistence

**Key Methods:**
```typescript
login(email: string, password: string): Promise<void>
register(email: string, password: string, name: string): Promise<void>
logout(): Promise<void>
updateProfile(updates: Partial<UserProfile>): Promise<void>
deleteAccount(): Promise<void>
```

### 2. **Type Definitions** (`/lib/types.ts`)

#### `UserProfile`
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio?: string;
  university?: string;
  role: 'student' | 'faculty' | 'guest' | 'university_admin';
  badges?: string[];
  savedArticles: string[];  // Array of article IDs
  comments: UserComment[];
}
```

#### `UserComment`
```typescript
interface UserComment {
  id: string;
  articleId: string;
  articleTitle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `AuthUser`
```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  role: 'student' | 'faculty' | 'guest' | 'university_admin';
}
```

### 3. **Pages**

#### Profile Page (`/app/profile/page.tsx`)
**Features:**
- Header with language toggle and dark mode
- Profile hero section with avatar, name, email, university, join date
- Edit profile button
- Logout button
- Tabbed interface with three tabs:
  - **Profile**: Stats, account info, danger zone
  - **Saved Articles**: Grid of bookmarked articles with remove buttons
  - **Comments**: List of user's comments with delete options
- Account deletion with confirmation dialog
- Bilingual support (AR/EN) with RTL/LTR
- Dark mode support
- Redirects to login if not authenticated

#### Login Page (`/app/login/page.tsx`)
**Features:**
- Login/Register tab switching
- Email and password inputs
- Name input for registration
- Form validation
- Error messages
- Demo mode info
- Bilingual and dark mode support
- Redirects to profile if already authenticated

### 4. **Components**

#### EditProfile Modal (`/components/EditProfile.tsx`)
**Props:**
```typescript
interface EditProfileProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
  language: 'ar' | 'en';
}
```

**Features:**
- Avatar upload/change with preview
- Edit name, email, university, bio
- Character counter for bio (max 300)
- Validation
- Success/error messages
- Bilingual support

#### SavedArticles Component (`/components/SavedArticles.tsx`)
**Props:**
```typescript
interface SavedArticlesProps {
  savedArticleIds: string[];
  onRemove: (articleId: string) => void;
  language: 'ar' | 'en';
}
```

**Features:**
- Grid layout (1-3 columns responsive)
- Article cards with image, title, excerpt
- Category badge
- Meta info (university, date, read time)
- Read button (links to article)
- Remove from bookmarks button
- Empty state with icon and message

#### UserComments Component (`/components/UserComments.tsx`)
**Props:**
```typescript
interface UserCommentsProps {
  comments: UserComment[];
  onDelete: (commentId: string) => void;
  language: 'ar' | 'en';
}
```

**Features:**
- List of user's comments
- Linked to original articles
- Relative timestamps (ago format)
- Edit indicator for modified comments
- Delete button with confirmation
- Empty state
- Bilingual support

### 5. **API Routes**

#### Authentication APIs
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user

#### User APIs
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/[id]` - Delete user account

**Note:** These are mock APIs using localStorage for persistence. In production, connect to a real database.

### 6. **LocalStorage Keys**

| Key | Purpose | Format |
|-----|---------|--------|
| `univerisitiesvoice_user` | Current user data | JSON |
| `univerisitiesvoice_profile` | Full profile data | JSON |
| `univerisitiesvoice_language` | Language preference | 'ar' \| 'en' |
| `univerisitiesvoice_darkmode` | Dark mode state | 'true' \| 'false' |
| `univerisitiesvoice_saved_articles` | Bookmarked articles | JSON array |
| `univerisitiesvoice_comments` | User comments | JSON array |

## Features Implemented

### Core Features
- [x] User authentication (login/register)
- [x] Profile management (view/edit)
- [x] Avatar upload support
- [x] User bio and university info
- [x] Account deletion with confirmation
- [x] Logout functionality

### Article Management
- [x] Save articles (bookmark)
- [x] Remove bookmarks
- [x] Display saved articles grid
- [x] Link to original articles

### Comments Management
- [x] Display user comments
- [x] Link to articles
- [x] Delete comments
- [x] Edit timestamps

### UI/UX
- [x] Bilingual support (Arabic/English)
- [x] RTL/LTR layout switching
- [x] Dark mode toggle
- [x] Responsive design (mobile/tablet/desktop)
- [x] Modal for profile editing
- [x] Tab interface for sections
- [x] Loading states
- [x] Error handling
- [x] Success messages
- [x] Confirmation dialogs

## Usage

### Wrap App with AuthProvider
In `/app/layout.tsx`, wrap children with `AuthProvider`:

```typescript
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Use Auth Hook in Components
```typescript
import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return <div>Welcome, {user?.name}!</div>;
}
```

### Login Flow
1. User navigates to `/login`
2. Enters email and password
3. Clicks login
4. AuthContext calls `/api/auth/login`
5. User data stored in localStorage
6. Redirected to `/profile`

### Profile Access
- Only authenticated users can access `/profile`
- Unauthenticated users are redirected to `/login`
- Profile data persists across sessions

## Demo Mode

The system is currently in **demo mode** with localStorage persistence:
- Any email + password (6+ chars) will login successfully
- User data is stored in localStorage
- Perfect for testing and prototyping

To connect to a real backend:
1. Replace API implementations in `/app/api/` routes
2. Update AuthContext to use real backend URLs
3. Implement proper authentication (JWT, sessions, etc.)

## File Structure

```
news/
├── context/
│   └── AuthContext.tsx          # Auth provider & hook
├── components/
│   ├── EditProfile.tsx          # Edit profile modal
│   ├── SavedArticles.tsx        # Saved articles component
│   └── UserComments.tsx         # User comments component
├── app/
│   ├── layout.tsx               # Updated with AuthProvider
│   ├── login/
│   │   └── page.tsx             # Login/register page
│   ├── profile/
│   │   └── page.tsx             # Profile page
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── register/route.ts
│       └── users/
│           ├── [id]/route.ts    # Delete account
│           └── profile/route.ts  # Get/update profile
└── lib/
    └── types.ts                 # Type definitions
```

## Styling

All components use **Tailwind CSS** with:
- Blue (#1E40AF) as primary color
- Purple gradients for accents
- Dark mode classes (`dark:*`)
- Responsive grid layouts
- Smooth transitions

## Bilingual Support

All text uses the `t()` helper:
```typescript
const t = (ar: string, en: string) => language === 'ar' ? ar : en;

// Usage
<h1>{t('العنوان', 'Title')}</h1>
```

Language persists in localStorage and affects:
- Page direction (RTL for Arabic, LTR for English)
- Document lang attribute
- All UI text

## Dark Mode

Toggled via button in header:
- Applies `dark` class to HTML root
- All components have dark mode styles
- Persists in localStorage

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support
- ES6+ JavaScript

## Future Enhancements

1. **Backend Integration**
   - Connect to real database (MongoDB, PostgreSQL, etc.)
   - Implement JWT authentication
   - Add password reset flow

2. **Features**
   - Follow users
   - User notifications
   - Comment replies/threading
   - Article sharing
   - User badges system
   - Email notifications

3. **Performance**
   - Implement pagination for comments/articles
   - Add image compression for avatars
   - Cache profile data

4. **Security**
   - HTTPS enforcement
   - CSRF protection
   - Rate limiting
   - Input validation
   - Password hashing (bcrypt)

## Testing

To test locally:
1. Navigate to `/login`
2. Enter any email and password (6+ chars)
3. Click login
4. You'll be redirected to `/profile`
5. Edit profile, add comments, save articles
6. All data persists in localStorage

## Notes

- The current system uses localStorage for demo purposes
- All user data is stored client-side
- No data is sent to a backend server
- Perfect for prototyping and testing UI/UX
- Ready to connect to a real authentication backend

## Support & Documentation

For more details on:
- **React**: https://react.dev
- **Next.js**: https://nextjs.org
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
