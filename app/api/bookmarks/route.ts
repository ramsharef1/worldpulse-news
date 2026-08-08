import { NextRequest, NextResponse } from 'next/server';

// Mock in-memory storage for bookmarks
// In production, this would be a database
const bookmarksStore: Map<string, Set<string>> = new Map();

// Mock articles for reference
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'جامعة الأردن تعلن عن برامج دراسية جديدة',
    title_en: 'University of Jordan Announces New Programs',
    category: 'Academic',
    university: 'جامعة الأردن',
    excerpt: 'أعلنت جامعة الأردن عن إطلاق عدة برامج دراسية جديدة للعام الأكاديمي القادم',
    excerpt_en: 'University of Jordan announced new academic programs for the upcoming year',
    date: '2024-07-27',
    views: 1250,
    featured: true,
  },
  {
    id: '2',
    title: 'منافسة رياضية بين جامعات الأردن',
    title_en: 'Sports Competition Between Jordanian Universities',
    category: 'Sports',
    university: 'جامعة اليرموك',
    excerpt: 'تقام منافسة رياضية بين جامعات الأردن في كرة السلة والكرة الطائرة',
    excerpt_en: 'Sports competition held between Jordanian universities in basketball and volleyball',
    date: '2024-07-26',
    views: 890,
    featured: true,
  },
  {
    id: '3',
    title: 'اكتشاف علمي جديد من قبل باحثي JUST',
    title_en: 'New Scientific Discovery by JUST Researchers',
    category: 'Research',
    university: 'جامعة العلوم والتكنولوجيا',
    excerpt: 'قام باحثون من جامعة العلوم والتكنولوجيا بإجراء دراسة عن تطبيقات الذكاء الاصطناعي',
    excerpt_en: 'Researchers from JUST conducted a study on AI applications',
    date: '2024-07-25',
    views: 2100,
    featured: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get bookmarked article IDs
    const bookmarkedIds = Array.from(
      bookmarksStore.get(userId) || new Set()
    );

    // Get full article details
    const bookmarks = bookmarkedIds
      .slice(0, limit)
      .map((articleId) => {
        // In production, fetch from database
        const article = MOCK_ARTICLES.find((a) => a.id === articleId);
        return article || null;
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      userId,
      bookmarks,
      total: bookmarkedIds.length,
      limit,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, articleId, action } = body;

    if (!userId || !articleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userBookmarks = bookmarksStore.get(userId) || new Set();

    if (action === 'add') {
      userBookmarks.add(articleId);
      bookmarksStore.set(userId, userBookmarks);

      return NextResponse.json({
        success: true,
        message: 'Article bookmarked',
        bookmarkCount: userBookmarks.size,
      });
    } else if (action === 'remove') {
      userBookmarks.delete(articleId);
      if (userBookmarks.size === 0) {
        bookmarksStore.delete(userId);
      } else {
        bookmarksStore.set(userId, userBookmarks);
      }

      return NextResponse.json({
        success: true,
        message: 'Bookmark removed',
        bookmarkCount: userBookmarks.size,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to manage bookmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');

    if (!userId || !articleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userBookmarks = bookmarksStore.get(userId);

    if (!userBookmarks || !userBookmarks.has(articleId)) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    userBookmarks.delete(articleId);

    if (userBookmarks.size === 0) {
      bookmarksStore.delete(userId);
    } else {
      bookmarksStore.set(userId, userBookmarks);
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted',
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
