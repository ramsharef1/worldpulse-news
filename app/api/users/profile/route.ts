import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mock profile retrieval - in production, fetch from database
    // For now, return an empty profile that will be populated from localStorage
    const profile = {
      id: userId,
      name: '',
      email: '',
      avatar: '/default-avatar.png',
      joinDate: new Date().toISOString(),
      bio: '',
      university: '',
      role: 'student',
      badges: [],
      savedArticles: [],
      comments: [],
    };

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, email, avatar, bio, university } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mock profile update - in production, save to database
    const updatedProfile = {
      id: userId,
      name: name || '',
      email: email || '',
      avatar: avatar || '/default-avatar.png',
      bio: bio || '',
      university: university || '',
      role: 'student',
      badges: [],
      savedArticles: [],
      comments: [],
    };

    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
