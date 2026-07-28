'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/UIComponents';

export default function ReactionsDemoPage() {
  const [userId, setUserId] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, [darkMode]);

  const handleInitializeUser = () => {
    const newUserId = `demo_user_${Date.now()}`;
    localStorage.setItem('userId', newUserId);
    setUserId(newUserId);
    alert(`User initialized: ${newUserId}`);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all reactions and bookmarks data?')) {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith('reactions_') ||
          key.startsWith('article_metadata_') ||
          key.startsWith('bookmarks_')
        ) {
          localStorage.removeItem(key);
        }
      });
      alert('All reactions and bookmarks data cleared');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId('');
    alert('User logged out');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-950">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Universities-Voice
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Reactions & Bookmarks Demo
            </h1>

            {/* User Status */}
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
                User Status
              </h2>
              {userId ? (
                <>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    <strong>User ID:</strong> {userId}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    ✓ User authenticated
                  </p>
                </>
              ) : (
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                  ⚠ No user ID set. Initialize a user to test reactions.
                </p>
              )}
            </div>

            {/* Features Overview */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Features
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Like articles (❤️) with animated reactions</li>
                <li>✓ Bookmark articles (🔖) for later reading</li>
                <li>✓ Share articles with native sharing or copy link</li>
                <li>✓ Real-time count updates and validation</li>
                <li>✓ User feedback (toast notifications)</li>
                <li>✓ Bilingual support (Arabic/English)</li>
                <li>✓ Dark mode support</li>
                <li>✓ Persistent storage (localStorage + API)</li>
                <li>✓ Login prompt for unauthenticated users</li>
                <li>✓ Responsive design</li>
              </ul>
            </div>

            {/* API Routes */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                API Routes
              </h2>
              <div className="space-y-3 text-sm font-mono">
                <div className="p-2 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded">
                  GET /api/reactions?articleId=X&userId=Y
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Get user reactions for an article
                </div>

                <div className="p-2 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded mt-4">
                  POST /api/reactions
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Add or remove reactions (like/bookmark)
                </div>

                <div className="p-2 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded mt-4">
                  GET /api/bookmarks?userId=X&limit=Y
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Get user's bookmarked articles
                </div>
              </div>
            </div>

            {/* Components */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Components
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <strong>ArticleReactions.tsx</strong> - Like, bookmark, and share buttons
                </li>
                <li>
                  <strong>BookmarksList.tsx</strong> - Display user's saved articles
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Actions
              </h2>

              {!userId && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleInitializeUser}
                  className="w-full"
                >
                  Initialize Demo User
                </Button>
              )}

              <Link href="/news" className="block">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Go to News Feed & Test Reactions
                </Button>
              </Link>

              {userId && (
                <Link href="/bookmarks" className="block">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    View My Bookmarks
                  </Button>
                </Link>
              )}

              {userId && (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleClearData}
                    className="w-full"
                  >
                    Clear All Data
                  </Button>

                  <Button
                    variant="text"
                    size="lg"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>

            {/* Getting Started */}
            <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-4">
                Getting Started
              </h3>
              <ol className="space-y-2 text-sm text-amber-800 dark:text-amber-300 list-decimal list-inside">
                <li>Click "Initialize Demo User" if not authenticated</li>
                <li>Go to "News Feed & Test Reactions"</li>
                <li>Click on an article to view details</li>
                <li>Use the reaction buttons to like/bookmark articles</li>
                <li>View your bookmarks at /bookmarks</li>
              </ol>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 Universities-Voice. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
