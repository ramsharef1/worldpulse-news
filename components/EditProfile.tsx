'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import type { UserProfile } from '@/lib/types';

interface EditProfileProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
  language: 'ar' | 'en';
}

export function EditProfile({ profile, isOpen, onClose, onSave, language }: EditProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    bio: profile.bio || '',
    university: profile.university || '',
    avatar: profile.avatar,
  });
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarPreview(base64);
        setFormData((prev) => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.name.trim()) {
        throw new Error(t('الرجاء إدخال الاسم', 'Please enter a name'));
      }
      if (!formData.email.trim()) {
        throw new Error(t('الرجاء إدخال البريد الإلكتروني', 'Please enter an email'));
      }
      if (formData.bio.length > 300) {
        throw new Error(t('لا يمكن أن تتجاوز السيرة الذاتية 300 حرف', 'Bio cannot exceed 300 characters'));
      }

      const updatedProfile: UserProfile = {
        ...profile,
        ...formData,
      };

      await onSave(updatedProfile);
      setSuccess(t('تم تحديث الملف الشخصي بنجاح', 'Profile updated successfully'));
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('فشل التحديث', 'Update failed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">
            {t('تحرير الملف الشخصي', 'Edit Profile')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <label className="flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLElement).closest('label')?.querySelector('input');
                  input?.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {t('تغيير الصورة', 'Change Avatar')}
              </button>
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {t('الاسم', 'Name')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {t('البريد الإلكتروني', 'Email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {t('الجامعة', 'University')}
            </label>
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('مثال: جامعة الأردن', 'e.g., University of Jordan')}
              disabled={isLoading}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              {t('السيرة الذاتية', 'Bio')}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              maxLength={300}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('اخبرنا عن نفسك...', 'Tell us about yourself...')}
              disabled={isLoading}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.bio.length}/300
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-200 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('جارٍ...', 'Saving...') : t('حفظ', 'Save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 transition-colors"
            >
              {t('إلغاء', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
