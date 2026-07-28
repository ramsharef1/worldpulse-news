import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication - in production, validate against a database
    // For now, accept any email/password combination
    if (email && password.length >= 6) {
      const user = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        avatar: '/default-avatar.png',
        joinDate: new Date().toISOString(),
        role: 'student',
      };

      return NextResponse.json(
        { user, message: 'Login successful' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
