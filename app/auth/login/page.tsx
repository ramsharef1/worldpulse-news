'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remember_me');
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setErrorMessage(t('الرجاء إدخال البريد الإلكتروني', 'Please enter email'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage(t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email format'));
      return false;
    }

    if (!formData.password) {
      setErrorMessage(t('الرجاء إدخال كلمة المرور', 'Please enter password'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password, rememberMe);
      setSuccessMessage(t('تم تسجيل الدخول بنجاح! جاري الانتقال...', 'Login successful! Redirecting...'));

      // Redirect after showing success message
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('فشل تسجيل الدخول', 'Login failed'));
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            {t('تسجيل الدخول', 'Login')}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {t('مرحبًا بك في صوت الجامعات', 'Welcome to Universities-Voice')}
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('البريد الإلكتروني', 'Email Address')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('البريد@مثال.com', 'email@example.com')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('أدخل كلمة المرور', 'Enter password')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 dark:border-gray-700 dark:bg-gray-800"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                {t('تذكرني', 'Remember me')}
              </label>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="#forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  alert(t('ميزة استعادة كلمة المرور قريباً', 'Password recovery coming soon'));
                }}
              >
                {t('هل نسيت كلمة المرور؟', 'Forgot password?')}
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {isLoading ? t('جاري المعالجة...', 'Processing...') : t('تسجيل الدخول', 'Login')}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            {t('ليس لديك حساب؟', 'Don\'t have an account?')}{' '}
            <a
              href="/auth/signup"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('إنشاء حساب جديد', 'Create new account')}
            </a>
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
            {t('بيانات التجربة:', 'Demo Credentials:')}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200 font-mono">
            {t('البريد: test@example.com', 'Email: test@example.com')}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200 font-mono">
            {t('كلمة المرور: Test1234', 'Password: Test1234')}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
            {t('(قم بالتسجيل أولاً لإنشاء حسابك)', '(Sign up first to create your account)')}
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {t(
              'ℹ️ هذا التطبيق يستخدم التخزين المحلي للبيانات. البيانات آمنة فقط في هذا المتصفح.',
              'ℹ️ This app uses local storage. Data is stored securely in this browser.'
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
