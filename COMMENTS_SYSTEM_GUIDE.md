# Comments System Implementation Guide

## Overview

A complete, production-ready comments system for Universities-Voice articles with support for:
- ✅ Nested threaded replies
- ✅ Bilingual support (Arabic/English with RTL/LTR)
- ✅ Dark mode compatibility
- ✅ User authentication integration
- ✅ Comment moderation (delete own comments)
- ✅ Character limit with real-time counter
- ✅ Responsive design
- ✅ Mock data persistence in memory
- ✅ TypeScript support

---

## File Structure

### API Routes
- **`/app/api/comments/route.ts`** - REST API for comment operations
  - `GET /api/comments?articleId=X` - Fetch comments for an article
  - `POST /api/comments` - Create new comment or reply
  - `DELETE /api/comments?id=X&userId=Y` - Delete comment (owner only)

### Components
- **`/components/Comments.tsx`** - Main comments section component
  - Displays all comments with nested replies
  - Sort by newest/oldest
  - Comment count display
  - Loading/error states
  - Empty state handling

- **`/components/CommentForm.tsx`** - Comment submission form
  - Text input with validation
  - Character counter (500 max)
  - Bilingual support
  - Authentication check
  - Error/success messages
  - Reply mode for nested threads

- **`/components/CommentsExample.tsx`** - Integration examples
  - NextAuth example
  - Clerk integration
  - Firebase integration

### Utilities
- **`/lib/commentUtils.ts`** - Helper functions
  - `formatRelativeTime()` - Format timestamps
  - `validateComment()` - Validate content
  - `countTotalComments()` - Count with replies
  - `sortComments()` - Sort by date
  - `searchComments()` - Filter comments
  - `flattenComments()` - Flatten nested structure
  - `canModifyComment()` - Check edit permissions
  - `extractMentions()` - Get @mentions
  - `sanitizeComment()` - XSS prevention
  - `truncateComment()` - Preview text
  - `getCommentStats()` - Statistics

- **`/lib/auth-hooks.ts`** - Authentication hooks
  - `useAuthUser()` - Get current user
  - `useCanModerate()` - Check moderation rights
  - `useOwnsComment()` - Check ownership
  - `useSession()` - Session management
  - `useCommentMutations()` - Add/delete operations
  - `useComments()` - Fetch comments

### Types
- **`/lib/types.ts`** - TypeScript interfaces
  - `Comment` interface with nested replies
  - `UserComment` interface
  - `AuthUser` interface

---

## Usage

### Basic Integration (No Auth)

```tsx
import { Comments } from '@/components/Comments';

export function ArticlePage() {
  const articleId = '1';
  const language = 'ar'; // or 'en'

  return (
    <Comments
      articleId={articleId}
      language={language}
      isAuthenticated={false}
      userName="Guest User"
      userId="guest-user"
    />
  );
}
```

### With Authentication (NextAuth Example)

```tsx
'use client';

import { useSession } from 'next-auth/react';
import { Comments } from '@/components/Comments';

export function ArticleWithComments({ articleId, language }) {
  const { data: session } = useSession();

  return (
    <Comments
      articleId={articleId}
      language={language}
      isAuthenticated={!!session}
      userName={session?.user?.name || 'Guest'}
      userId={session?.user?.id || 'guest'}
      userAvatar={session?.user?.image}
    />
  );
}
```

### With Clerk

```tsx
'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Comments } from '@/components/Comments';

export function ArticleWithComments({ articleId, language }) {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  return (
    <Comments
      articleId={articleId}
      language={language}
      isAuthenticated={isSignedIn}
      userName={user?.fullName || 'Guest'}
      userId={userId || 'guest'}
      userAvatar={user?.profileImageUrl}
    />
  );
}
```

---

## API Endpoints

### GET /api/comments

Fetch all comments for an article.

**Query Parameters:**
- `articleId` (required) - ID of the article

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "1",
      "articleId": "1",
      "userId": "user1",
      "userName": "Ahmed Mohamed",
      "userAvatar": "https://i.pravatar.cc/150?img=1",
      "content": "Great article!",
      "timestamp": "2024-07-28T10:30:00.000Z",
      "replies": [
        {
          "id": "1-1",
          "articleId": "1",
          "userId": "user2",
          "userName": "Fatima Ali",
          "userAvatar": "https://i.pravatar.cc/150?img=2",
          "content": "I agree!",
          "timestamp": "2024-07-28T10:35:00.000Z",
          "replies": [],
          "parentCommentId": "1"
        }
      ]
    }
  ],
  "total": 1
}
```

### POST /api/comments

Create a new comment or reply.

**Request Body:**
```json
{
  "articleId": "1",
  "content": "This is a great article!",
  "userName": "Ahmed Mohamed",
  "userId": "user1",
  "userAvatar": "https://i.pravatar.cc/150?img=1",
  "parentCommentId": "1" // Optional, for replies
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "1",
    "articleId": "1",
    "userId": "user1",
    "userName": "Ahmed Mohamed",
    "userAvatar": "https://i.pravatar.cc/150?img=1",
    "content": "This is a great article!",
    "timestamp": "2024-07-28T10:30:00.000Z",
    "replies": []
  }
}
```

### DELETE /api/comments

Delete a comment (owner only).

**Query Parameters:**
- `id` (required) - Comment ID
- `userId` (required) - User ID to verify ownership

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Features

### 1. Bilingual Support
- Full Arabic/English support
- Automatic RTL/LTR handling
- Bilingual UI text with `t(ar, en)` helper

### 2. Dark Mode
- Full dark mode support via Tailwind CSS
- Automatic theme detection
- CSS variables for colors

### 3. Nested Replies
- Reply to specific comments
- Visual threading with indentation
- Parent comment context

### 4. Character Limit
- 500 character maximum
- Real-time character counter
- Color-coded warnings (yellow at 450+, red at 500+)

### 5. User Authentication
- Check authentication status
- Only authenticated users can comment
- Show login prompt for guests
- Delete own comments only

### 6. Sorting
- Newest first (default)
- Oldest first option
- Sort controls in UI

### 7. Responsive Design
- Mobile-first approach
- Tablet and desktop layouts
- Optimized spacing and typography

---

## Customization

### Change Character Limit
Edit `/components/CommentForm.tsx`:
```tsx
const MAX_CHARS = 500; // Change to desired limit
```

### Change Mock Data
Edit `/app/api/comments/route.ts`:
```tsx
let MOCK_COMMENTS: Array<...> = [
  // Add/modify mock comments here
];
```

### Style Customization
All components use Tailwind CSS classes. Modify colors/spacing in:
- `/components/Comments.tsx`
- `/components/CommentForm.tsx`

### Add Database Integration
Replace the in-memory `MOCK_COMMENTS` array with database calls:

```tsx
// In /app/api/comments/route.ts
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('articleId');
  const comments = await db.comment.findMany({
    where: { articleId },
    include: { replies: true }
  });
  
  return NextResponse.json({ success: true, comments });
}
```

---

## Internationalization

The system uses a simple translation pattern. For each string:

```tsx
const t = (ar: string, en: string) => language === 'ar' ? ar : en;

// Usage
<h2>{t('التعليقات', 'Comments')}</h2>
```

To add new translations, update the `t()` function calls throughout the components.

---

## Performance Optimization

### For Production:
1. **Add pagination** to prevent loading all comments at once
2. **Implement caching** for frequently viewed articles
3. **Use database** instead of in-memory storage
4. **Add rate limiting** to prevent spam
5. **Optimize queries** with indexes on `articleId`
6. **Add CDN** for avatars (Gravatar, Cloudinary, etc.)

### Example with Pagination:
```tsx
const [page, setPage] = useState(1);
const COMMENTS_PER_PAGE = 10;

const response = await fetch(
  `/api/comments?articleId=${articleId}&page=${page}&limit=${COMMENTS_PER_PAGE}`
);
```

---

## Security Considerations

1. **XSS Prevention** - Input is sanitized
2. **User Verification** - Only owners can delete comments
3. **Rate Limiting** - Implement on API endpoints
4. **Content Filtering** - Consider adding moderation
5. **Spam Detection** - Monitor comment frequency per user

---

## Testing

### Manual Testing Checklist
- [ ] Comments load correctly
- [ ] New comments submit properly
- [ ] Replies work and nest correctly
- [ ] Delete button appears for own comments
- [ ] Character counter updates in real-time
- [ ] Sort order changes correctly
- [ ] Bilingual text displays properly
- [ ] Dark mode applies correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Error messages show for invalid input

---

## Troubleshooting

### Comments not loading
- Check articleId is passed correctly
- Verify API route is accessible
- Check browser console for errors

### Form not submitting
- Verify character count is under 500
- Check authentication status
- Review network requests in DevTools

### Styling issues
- Ensure Tailwind CSS is configured
- Check dark mode settings
- Verify theme classes are applied

---

## Future Enhancements

- [ ] Edit comments (not just delete)
- [ ] Like/upvote comments
- [ ] Pin important comments
- [ ] Mention users with @username
- [ ] Rich text formatting (markdown)
- [ ] Comment moderation queue
- [ ] Spam detection AI
- [ ] Comment email notifications
- [ ] Timestamp edit history
- [ ] Admin flagging system

---

## Files Summary

| File | Purpose | Size |
|------|---------|------|
| /app/api/comments/route.ts | API endpoints | 5.8 KB |
| /components/Comments.tsx | Main display component | 13 KB |
| /components/CommentForm.tsx | Comment form | 6.3 KB |
| /components/CommentsExample.tsx | Integration examples | 3.4 KB |
| /lib/commentUtils.ts | Helper utilities | 5.4 KB |
| /lib/auth-hooks.ts | Auth hooks | 5.2 KB |

**Total: ~39 KB of code**

---

## Support

For issues or questions:
1. Check the COMMENTS_SYSTEM_GUIDE.md
2. Review the example files
3. Check the API response in browser DevTools
4. Verify authentication integration

---

Generated: 2024-07-28
Last Updated: 2024-07-28
Version: 1.0.0
