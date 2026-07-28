# Reactions & Bookmarks System

Complete implementation of likes, bookmarks, and sharing functionality for Universities-Voice.

## Overview

The reactions system allows authenticated users to:
- **Like** articles (heart icon ❤️) with real-time count updates
- **Bookmark** articles (bookmark icon 🔖) for later reading
- **Share** articles via native sharing or copy link
- View all bookmarked articles in a dedicated bookmarks page
- Get animated feedback when interacting with articles

## Components

### 1. ArticleReactions Component
**File:** `/components/ArticleReactions.tsx`

Main component for displaying reaction buttons on article detail pages.

#### Props
```typescript
interface ArticleReactionsProps {
  articleId: string;
  language: 'ar' | 'en';
  onReactionChange?: (type: 'like' | 'bookmark', count: number, isActive: boolean) => void;
}
```

#### Features
- Like button with heart emoji
- Bookmark button with bookmark emoji
- Share button with native sharing fallback
- Real-time count display
- Animated scale effect on interaction
- Toast notifications (liked/bookmarked)
- Login prompt for unauthenticated users
- Optimistic UI updates
- Bilingual labels
- Dark mode support

#### Usage
```tsx
import { ArticleReactions } from '@/components/ArticleReactions';

export function ArticleDetailPage() {
  return (
    <ArticleReactions
      articleId={articleId}
      language={language}
      onReactionChange={(type, count, isActive) => {
        console.log(`${type} updated to ${count}`);
      }}
    />
  );
}
```

### 2. BookmarksList Component
**File:** `/components/BookmarksList.tsx`

Component for displaying user's saved articles in a grid layout.

#### Props
```typescript
interface BookmarksListProps {
  language: 'ar' | 'en';
}
```

#### Features
- Display user's bookmarked articles
- Grid layout (2 columns on tablet/desktop, 1 on mobile)
- Remove bookmark button on hover
- Empty state with CTA
- Loading skeleton
- Bilingual support
- Dark mode support
- Responsive design

#### Usage
```tsx
import { BookmarksList } from '@/components/BookmarksList';

export function BookmarksPage() {
  return <BookmarksList language={language} />;
}
```

## API Routes

### GET /api/reactions
Fetch user reactions and article counts for a specific article.

#### Query Parameters
- `articleId` (required): Article ID
- `userId` (required): User ID

#### Response
```json
{
  "success": true,
  "articleId": "1",
  "userId": "user_123",
  "likeCount": 42,
  "bookmarkCount": 15,
  "userLiked": true,
  "userBookmarked": false
}
```

### POST /api/reactions
Add or remove a reaction (like or bookmark).

#### Request Body
```json
{
  "userId": "user_123",
  "articleId": "1",
  "type": "like" | "bookmark",
  "action": "add" | "remove"
}
```

#### Response
```json
{
  "success": true,
  "message": "like added",
  "counts": {
    "likes": 43,
    "bookmarks": 15
  }
}
```

### DELETE /api/reactions
Remove a specific reaction by ID.

#### Query Parameters
- `id` (required): Reaction ID
- `userId` (required): User ID
- `articleId` (required): Article ID

#### Response
```json
{
  "success": true,
  "message": "Reaction deleted"
}
```

### GET /api/bookmarks
Fetch user's bookmarked articles.

#### Query Parameters
- `userId` (required): User ID
- `limit` (optional): Max articles to return (default: 50)

#### Response
```json
{
  "success": true,
  "userId": "user_123",
  "bookmarks": [
    {
      "id": "1",
      "title": "Article Title",
      "title_en": "Article Title",
      "category": "Academic",
      "university": "University Name",
      "excerpt": "Article excerpt...",
      "excerpt_en": "Article excerpt...",
      "date": "2024-07-27"
    }
  ],
  "total": 5,
  "limit": 50
}
```

### POST /api/bookmarks
Add or remove a bookmark.

#### Request Body
```json
{
  "userId": "user_123",
  "articleId": "1",
  "action": "add" | "remove"
}
```

#### Response
```json
{
  "success": true,
  "message": "Article bookmarked",
  "bookmarkCount": 6
}
```

### DELETE /api/bookmarks
Remove a bookmark by article ID.

#### Query Parameters
- `userId` (required): User ID
- `articleId` (required): Article ID

#### Response
```json
{
  "success": true,
  "message": "Bookmark deleted"
}
```

## Utility Functions

**File:** `/lib/reactions-utils.ts`

Helper functions for managing reactions and bookmarks with localStorage:

```typescript
// User management
getUserId(): string
  - Get or create a unique user ID

// Reactions
getStoredReactions(articleId: string, userId: string): ReactionData[]
storeReaction(articleId: string, userId: string, type: 'like' | 'bookmark'): ReactionData
removeStoredReaction(articleId: string, userId: string, type: 'like' | 'bookmark'): void
getUserReactions(articleId: string, userId: string): UserReaction

// Metadata
getArticleMetadata(articleId: string): ArticleReactionCounts
updateArticleMetadata(articleId: string, metadata: ArticleReactionCounts): void

// Bookmarks
getUserBookmarks(userId: string): string[]
addBookmark(articleId: string, userId: string): void
removeBookmark(articleId: string, userId: string): void
isArticleBookmarked(articleId: string, userId: string): boolean

// Utilities
clearAllReactions(): void
  - Clear all reactions and bookmarks for testing
```

## Pages

### /bookmarks
Dedicated page for viewing all bookmarked articles.

Features:
- Requires authentication
- Shows all bookmarked articles in grid layout
- Remove bookmark button on each card
- Empty state with CTA
- Breadcrumb navigation
- Language toggle
- Dark mode support

### /reactions-demo
Demo page showing how to use the reactions system.

Features:
- User initialization for demo
- Feature overview
- API documentation
- Component documentation
- Getting started guide
- Clear data and logout buttons

## Data Storage

### localStorage Structure

```
// Reactions
reactions_<articleId>_<userId> = JSON.stringify(ReactionData[])

// Article Metadata
article_metadata_<articleId> = JSON.stringify({
  likes: number,
  bookmarks: number,
  lastUpdated: ISO string
})

// Bookmarks
bookmarks_<userId> = JSON.stringify(articleId[])

// User ID
userId = string (unique user identifier)
```

### Mock In-Memory Storage

For development/demo:
- Reactions stored in `Map<string, any[]>`
- Article metadata cached in `Map<string, {likes, bookmarks}>`
- Bookmarks stored in `Map<string, Set<string>>`

In production, replace with actual database (PostgreSQL, MongoDB, etc.)

## Integration Points

### Article Detail Page
`/app/article/[id]/page.tsx`

The `ArticleReactions` component is integrated below the share section:

```tsx
<ArticleReactions
  articleId={articleId}
  language={language}
/>
```

### Navigation
Added "Bookmarks" link to main navigation:

```typescript
{
  name_ar: 'إشاراتي المرجعية',
  name_en: 'Bookmarks',
  href: '/bookmarks'
}
```

## Authentication

### Current Implementation
- Mock authentication using `localStorage.getItem('userId')`
- Users can be initialized at `/reactions-demo`
- User ID persists across sessions

### Future Implementation
- Integrate with actual authentication system (JWT, Sessions, etc.)
- Replace mock storage with database
- Add user profile endpoints
- Implement proper access control

## Styling

All components use the existing design system:
- **Primary Button:** Like button (when active)
- **Secondary Button:** Bookmark button (when inactive), Share button
- **Colors:** Blue (#1E40AF) + Teal (#1AA89D)
- **Animation:** Scale transform on click (0.1s duration)
- **Dark Mode:** Full support with dark: utilities
- **Responsive:** Mobile-first design

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Focus indicators with ring-2 style
- Loading states with disabled attribute
- Login prompts for unauthenticated users
- Screen reader friendly notifications

## Internationalization

All strings support Arabic and English:
- Component labels
- Notifications
- Empty states
- Error messages
- UI text

Use the `t(ar, en)` helper function for translations.

## Error Handling

- Network error fallback to localStorage
- Optimistic UI updates with rollback on failure
- User-friendly error messages
- Loading states
- Error notifications

## Performance

- Lazy loading of reactions count
- Optimistic updates for instant feedback
- Memoization of metadata
- Efficient localStorage queries
- Minimal re-renders with useState hook optimization

## Testing

### Manual Testing Steps

1. **Initialize User**
   - Go to `/reactions-demo`
   - Click "Initialize Demo User"

2. **Test Likes**
   - Navigate to article detail page
   - Click heart button
   - Verify count increases/decreases
   - Check localStorage `article_metadata_<articleId>`

3. **Test Bookmarks**
   - Click bookmark button
   - Navigate to `/bookmarks`
   - Verify article appears in list
   - Check localStorage `bookmarks_<userId>`

4. **Test Share**
   - Click share button
   - Verify native share dialog or link copied

5. **Test Dark Mode**
   - Toggle dark mode on any page
   - Verify colors and contrast

6. **Test Bilingual**
   - Toggle language to Arabic/English
   - Verify all labels update correctly

### Clear Data
- Use `/reactions-demo` "Clear All Data" button
- Or manually remove localStorage entries starting with:
  - `reactions_`
  - `article_metadata_`
  - `bookmarks_`

## Future Enhancements

- [ ] Database persistence (PostgreSQL/MongoDB)
- [ ] Real-time updates via WebSockets
- [ ] Reaction types (love, clap, etc.)
- [ ] Collections/reading lists
- [ ] Sharing analytics
- [ ] User preferences for email digests
- [ ] Social features (see who liked/bookmarked)
- [ ] Trending articles by reactions
- [ ] Export bookmarks as PDF/JSON
- [ ] Mobile app integration

## File Structure

```
/app
  /api
    /reactions
      route.ts
    /bookmarks
      route.ts
  /article
    /[id]
      page.tsx (modified)
  /bookmarks
    page.tsx (new)
  /reactions-demo
    page.tsx (new)
/components
  ArticleReactions.tsx (new)
  BookmarksList.tsx (new)
/lib
  reactions-utils.ts (new)
```

## Configuration

All constants are in `/lib/constants.ts`:
- Reaction types with emojis
- Navigation items (includes Bookmarks link)
- Other UI constants

## Support

For questions or issues:
1. Check `/reactions-demo` page for overview
2. Review this documentation
3. Check component TypeScript interfaces for prop details
4. Review API route implementations for behavior details
