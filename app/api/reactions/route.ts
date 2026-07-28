import { NextRequest, NextResponse } from 'next/server';

// Mock in-memory storage for reactions
// In production, this would be a database
const reactionsStore: Map<string, any[]> = new Map();
const articlesMetadata: Map<string, { likes: number; bookmarks: number }> =
  new Map();

// Initialize with default counts
const getArticleMetadata = (articleId: string) => {
  if (!articlesMetadata.has(articleId)) {
    articlesMetadata.set(articleId, { likes: 0, bookmarks: 0 });
  }
  return articlesMetadata.get(articleId)!;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const userId = searchParams.get('userId');

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }

    // Get article metadata
    const metadata = getArticleMetadata(articleId);

    // Get user reactions
    let userLiked = false;
    let userBookmarked = false;

    if (userId) {
      const reactionKey = `${articleId}_${userId}`;
      const userReactions = reactionsStore.get(reactionKey) || [];

      userLiked = userReactions.some((r) => r.type === 'like');
      userBookmarked = userReactions.some((r) => r.type === 'bookmark');
    }

    return NextResponse.json({
      success: true,
      articleId,
      userId,
      likeCount: metadata.likes,
      bookmarkCount: metadata.bookmarks,
      userLiked,
      userBookmarked,
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, articleId, type, action } = body;

    if (!userId || !articleId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['like', 'bookmark'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      );
    }

    const reactionKey = `${articleId}_${userId}`;
    const userReactions = reactionsStore.get(reactionKey) || [];
    const metadata = getArticleMetadata(articleId);

    // Check if reaction already exists
    const existingIndex = userReactions.findIndex((r) => r.type === type);
    const alreadyExists = existingIndex !== -1;

    if (action === 'add' && !alreadyExists) {
      // Add reaction
      userReactions.push({
        id: `${Date.now()}_${Math.random()}`,
        userId,
        articleId,
        type,
        timestamp: new Date().toISOString(),
      });

      if (type === 'like') {
        metadata.likes += 1;
      } else if (type === 'bookmark') {
        metadata.bookmarks += 1;
      }

      reactionsStore.set(reactionKey, userReactions);
      articlesMetadata.set(articleId, metadata);

      // Save to localStorage for persistence
      saveReactionsToStorage(articleId, metadata);

      return NextResponse.json({
        success: true,
        message: `${type} added`,
        counts: {
          likes: metadata.likes,
          bookmarks: metadata.bookmarks,
        },
      });
    } else if (action === 'remove' && alreadyExists) {
      // Remove reaction
      userReactions.splice(existingIndex, 1);

      if (type === 'like' && metadata.likes > 0) {
        metadata.likes -= 1;
      } else if (type === 'bookmark' && metadata.bookmarks > 0) {
        metadata.bookmarks -= 1;
      }

      if (userReactions.length === 0) {
        reactionsStore.delete(reactionKey);
      } else {
        reactionsStore.set(reactionKey, userReactions);
      }

      articlesMetadata.set(articleId, metadata);

      // Save to localStorage for persistence
      saveReactionsToStorage(articleId, metadata);

      return NextResponse.json({
        success: true,
        message: `${type} removed`,
        counts: {
          likes: metadata.likes,
          bookmarks: metadata.bookmarks,
        },
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action',
    });
  } catch (error) {
    console.error('Error processing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reactionId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');

    if (!reactionId || !userId || !articleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reactionKey = `${articleId}_${userId}`;
    const userReactions = reactionsStore.get(reactionKey) || [];
    const reactionIndex = userReactions.findIndex(
      (r) => r.id === reactionId
    );

    if (reactionIndex === -1) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    const reaction = userReactions[reactionIndex];
    const metadata = getArticleMetadata(articleId);

    if (reaction.type === 'like' && metadata.likes > 0) {
      metadata.likes -= 1;
    } else if (reaction.type === 'bookmark' && metadata.bookmarks > 0) {
      metadata.bookmarks -= 1;
    }

    userReactions.splice(reactionIndex, 1);

    if (userReactions.length === 0) {
      reactionsStore.delete(reactionKey);
    } else {
      reactionsStore.set(reactionKey, userReactions);
    }

    articlesMetadata.set(articleId, metadata);

    return NextResponse.json({
      success: true,
      message: 'Reaction deleted',
    });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}

// Helper function to save reactions to localStorage for persistence
function saveReactionsToStorage(
  articleId: string,
  metadata: { likes: number; bookmarks: number }
) {
  if (typeof window !== 'undefined') {
    const storedMetadata = JSON.parse(
      localStorage.getItem(`article_metadata_${articleId}`) || '{}'
    );
    localStorage.setItem(
      `article_metadata_${articleId}`,
      JSON.stringify({
        ...storedMetadata,
        likes: metadata.likes,
        bookmarks: metadata.bookmarks,
        lastUpdated: new Date().toISOString(),
      })
    );
  }
}
