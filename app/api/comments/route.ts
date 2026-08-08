import { NextRequest, NextResponse } from 'next/server';

// Mock storage for comments (in-memory)
let MOCK_COMMENTS: Array<{
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replies: any[];
  parentCommentId?: string;
}> = [
  {
    id: '1',
    articleId: '1',
    userId: 'user1',
    userName: 'أحمد محمود',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    content: 'مقالة ممتازة وغنية بالمعلومات. شكراً على المشاركة!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    replies: [],
  },
  {
    id: '2',
    articleId: '1',
    userId: 'user2',
    userName: 'فاطمة علي',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    content: 'Great information! This is very helpful for students.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: '2-1',
        articleId: '1',
        userId: 'user3',
        userName: 'محمد الشرقي',
        userAvatar: 'https://i.pravatar.cc/150?img=3',
        content: 'أتفق معك تماماً، المعلومات مفيدة جداً.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        replies: [],
        parentCommentId: '2',
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Filter comments for the article
    const articleComments = MOCK_COMMENTS.filter((c) => c.articleId === articleId && !c.parentCommentId);

    return NextResponse.json({
      success: true,
      comments: articleComments,
      total: articleComments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.articleId || !body.content || !body.userName || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content length (max 500 characters)
    if (body.content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment exceeds maximum length of 500 characters' },
        { status: 400 }
      );
    }

    // Create new comment
    const newComment = {
      id: Date.now().toString(),
      articleId: body.articleId,
      userId: body.userId,
      userName: body.userName,
      userAvatar: body.userAvatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      content: body.content,
      timestamp: new Date().toISOString(),
      replies: [],
      parentCommentId: body.parentCommentId || undefined,
    };

    // If it's a reply, add it to the parent comment
    if (body.parentCommentId) {
      const parentComment = MOCK_COMMENTS.find((c) => c.id === body.parentCommentId);
      if (parentComment) {
        parentComment.replies.push(newComment);
      } else {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    } else {
      MOCK_COMMENTS.push(newComment);
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID and User ID are required' },
        { status: 400 }
      );
    }

    // Find and delete the comment
    const commentIndex = MOCK_COMMENTS.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      // Check if it's a reply
      let found = false;
      for (const comment of MOCK_COMMENTS) {
        const replyIndex = comment.replies.findIndex((r) => r.id === commentId);
        if (replyIndex !== -1) {
          // Verify user owns the comment
          if (comment.replies[replyIndex].userId === userId) {
            comment.replies.splice(replyIndex, 1);
            found = true;
            break;
          } else {
            return NextResponse.json(
              { success: false, error: 'You can only delete your own comments' },
              { status: 403 }
            );
          }
        }
      }

      if (!found) {
        return NextResponse.json(
          { success: false, error: 'Comment not found' },
          { status: 404 }
        );
      }
    } else {
      // Verify user owns the comment
      if (MOCK_COMMENTS[commentIndex].userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'You can only delete your own comments' },
          { status: 403 }
        );
      }

      MOCK_COMMENTS.splice(commentIndex, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
