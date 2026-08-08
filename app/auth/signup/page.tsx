'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Calculate password strength (0-4)
  const getPasswordStrength = (password: string): number => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return t('ضعيف جداً', 'Very Weak');
    if (passwordStrength === 1) return t('ضعيف', 'Weak');
    if (passwordStrength === 2) return t('متوسط', 'Fair');
    if (passwordStrength === 3) return t('قوي', 'Strong');
    return t('قوي جداً', 'Very Strong');
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    if (!formData.name_ar.trim()) {
      setErrorMessage(t('الرجاء إدخال الاسم بالعربية', 'Please enter name in Arabic'));
      return false;
    }

    if (!formData.name_en.trim()) {
      setErrorMessage(t('الرجاء إدخال الاسم بالإنجليزية', 'Please enter name in English'));
      return false;
    }

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

    if (getPasswordStrength(formData.password) < 2) {
      setErrorMessage(
        t(
          'يجب أن تكون كلمة المرور قوية (8 أحرف على الأقل، أحرف كبيرة وصغيرة وأرقام)',
          'Password must be strong (at least 8 characters, uppercase, lowercase, and numbers)'
        )
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('كلمات المرور غير متطابقة', 'Passwords do not match'));
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
      await signup(formData.name_ar, formData.name_en, formData.email, formData.password);
      setSuccessMessage(t('تم التسجيل بنجاح! جاري الانتقال...', 'Signup successful! Redirecting...'));

      // Redirect after showing success message
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('فشل التسجيل', 'Signup failed'));
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            {t('إنشاء حساب', 'Create Account')}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {t('انضم إلى مجتمع صوت الجامعات', 'Join the Universities-Voice community')}
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
            {/* Name Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('الاسم (عربي)', 'Name (Arabic)')}
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                placeholder={t('أدخل اسمك بالعربية', 'Enter your name in Arabic')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={isLoading}
              />
            </div>

            {/* Name English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('الاسم (إنجليزي)', 'Name (English)')}
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                placeholder={t('أدخل اسمك بالإنجليزية', 'Enter your name in English')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={isLoading}
              />
            </div>

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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < passwordStrength
                            ? getStrengthColor()
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('قوة كلمة المرور:', 'Password strength:')} {getStrengthLabel()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {t(
                      '8 أحرف على الأقل، أحرف كبيرة وصغيرة وأرقام',
                      'At least 8 characters, uppercase, lowercase, and numbers'
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('تأكيد كلمة المرور', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t('أعد إدخال كلمة المرور', 'Re-enter password')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {isLoading ? t('جاري المعالجة...', 'Processing...') : t('إنشاء حساب', 'Create Account')}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            {t('هل لديك حساب بالفعل؟', 'Already have an account?')}{' '}
            <a
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('تسجيل الدخول', 'Login')}
            </a>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
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
