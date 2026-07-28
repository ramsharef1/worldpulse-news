'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { EditProfile } from '@/components/EditProfile';
import { SavedArticles } from '@/components/SavedArticles';
import { UserComments } from '@/components/UserComments';
import { Logo } from '@/components/Logo';
import type { UserProfile, UserComment } from '@/lib/types';

type TabType = 'profile' | 'saved' | 'comments';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateProfile, deleteAccount } = useAuth();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize language and dark mode from localStorage
  useEffect(() => {
    const savedLanguage = (localStorage.getItem('univerisitiesvoice_language') || 'ar') as 'ar' | 'en';
    const savedDarkMode = localStorage.getItem('univerisitiesvoice_darkmode') === 'true';

    setLanguage(savedLanguage);
    setDarkMode(savedDarkMode);

    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  // Handle language and dark mode changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('univerisitiesvoice_language', language);
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('univerisitiesvoice_darkmode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Load user profile from localStorage
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }

      // Load or create user profile
      const storedProfile = localStorage.getItem('univerisitiesvoice_profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // Create new profile for the user
        const newProfile: UserProfile = {
          id: user.id,
          name: language === 'ar' ? user.name_ar : user.name_en,
          email: user.email,
          avatar: user.profile_image || '',
          joinDate: new Date().toISOString().split('T')[0],
          bio: '',
          university: '',
          role: user.role,
          badges: [],
          savedArticles: [],
          comments: [],
        };
        setProfile(newProfile);
        localStorage.setItem('univerisitiesvoice_profile', JSON.stringify(newProfile));
      }
      setIsLoading(false);
    }
  }, [user, isAuthenticated, authLoading]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleLogout = async () => {
    if (window.confirm(t('هل أنت متأكد من تسجيل الخروج؟', 'Are you sure you want to log out?'))) {
      await logout();
      window.location.href = '/';
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('تحذير: هذا سيحذف حسابك بشكل دائم. هل أنت متأكد؟', 'Warning: This will permanently delete your account. Are you sure?'))) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    try {
      await updateProfile(updatedProfile);
      setProfile(updatedProfile);
      localStorage.setItem('univerisitiesvoice_profile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const handleRemoveBookmark = (articleId: string) => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        savedArticles: profile.savedArticles.filter((id) => id !== articleId),
      };
      setProfile(updatedProfile);
      localStorage.setItem('univerisitiesvoice_profile', JSON.stringify(updatedProfile));
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        comments: profile.comments.filter((c) => c.id !== commentId),
      };
      setProfile(updatedProfile);
      localStorage.setItem('univerisitiesvoice_profile', JSON.stringify(updatedProfile));
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-300">{t('جارٍ التحميل...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 dark:text-gray-300">{t('حدث خطأ ما', 'Something went wrong')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="hover:opacity-80 transition">
            <Logo size="md" showText={true} language={language} />
          </a>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <p className="text-blue-100 mb-1">📧 {profile.email}</p>
              {profile.university && <p className="text-blue-100 mb-1">🏫 {profile.university}</p>}
              <p className="text-blue-100 mb-4">
                {t('انضم في', 'Joined')}{' '}
                {new Date(profile.joinDate).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {t('تحرير الملف الشخصي', 'Edit Profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  {t('تسجيل الخروج', 'Logout')}
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-blue-500 border-opacity-30">
              <p className="text-sm leading-relaxed italic">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {t('الملف الشخصي', 'Profile')}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'saved'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {t('المحفوظات', 'Saved')}
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {profile.savedArticles.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {t('التعليقات', 'Comments')}
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {profile.comments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {profile.savedArticles.length}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{t('مقالات محفوظة', 'Saved Articles')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {profile.comments.length}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{t('تعليقات', 'Comments')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {profile.badges?.length || 0}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{t('شارات', 'Badges')}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('معلومات الحساب', 'Account Information')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('الدور', 'Role')}:</span>
                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                      {t(
                        profile.role === 'student'
                          ? 'طالب'
                          : profile.role === 'faculty'
                            ? 'عضو هيئة تدريس'
                            : profile.role === 'university_admin'
                              ? 'مسؤول جامعة'
                              : 'ضيف',
                        profile.role === 'student'
                          ? 'Student'
                          : profile.role === 'faculty'
                            ? 'Faculty'
                            : profile.role === 'university_admin'
                              ? 'University Admin'
                              : 'Guest'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
                  {t('منطقة الخطر', 'Danger Zone')}
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  {t(
                    'حذف حسابك سيؤدي إلى فقدان جميع البيانات بشكل دائم.',
                    'Deleting your account will permanently remove all your data.'
                  )}
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
                >
                  {t('حذف الحساب', 'Delete Account')}
                </button>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                  <div className="mt-4 border-t border-red-200 dark:border-red-800 pt-4">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-3">
                      {t('هل أنت متأكد تماماً؟', 'Are you absolutely sure?')}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? t('جارٍ...', 'Deleting...') : t('حذف نهائياً', 'Delete Permanently')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('إلغاء', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <SavedArticles
              savedArticleIds={profile.savedArticles}
              onRemove={handleRemoveBookmark}
              language={language}
            />
          )}

          {activeTab === 'comments' && (
            <UserComments
              comments={profile.comments}
              onDelete={handleDeleteComment}
              language={language}
            />
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfile
        profile={profile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Universities-Voice. {t('جميع الحقوق محفوظة', 'All rights reserved')}</p>
        </div>
      </footer>
    </>
  );
}
