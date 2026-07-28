// Universities-Voice Constants

export const CATEGORIES = [
  { id: '1', name_ar: 'أكاديمي', name_en: 'Academic', slug: 'academic', icon: '🎓', color: '#3B82F6' },
  { id: '2', name_ar: 'حياة الطلاب', name_en: 'Student Life', slug: 'student-life', icon: '👥', color: '#8B5CF6' },
  { id: '3', name_ar: 'البحث العلمي', name_en: 'Research', slug: 'research', icon: '🔬', color: '#EC4899' },
  { id: '4', name_ar: 'الرياضة', name_en: 'Sports', slug: 'sports', icon: '⚽', color: '#F59E0B' },
  { id: '5', name_ar: 'القبول والمنح', name_en: 'Admissions', slug: 'admissions', icon: '📝', color: '#10B981' },
  { id: '6', name_ar: 'الوظائف والمسار الوظيفي', name_en: 'Career & Jobs', slug: 'careers', icon: '💼', color: '#06B6D4' },
  { id: '7', name_ar: 'الإنجازات', name_en: 'Achievements', slug: 'achievements', icon: '🏆', color: '#F43F5E' },
];

export const UNIVERSITIES = [
  'University of Jordan',
  'Jordan University of Science and Technology (JUST)',
  'Hashemite University',
  'Yarmouk University',
  'Al-Balqa Applied University',
  'Mutah University',
  'Al-Ahliyya Amman University',
  'Middle East University',
  'German Jordanian University',
  'Jerash University',
  'Philadelphia University',
  'Amman Arab University',
  'Princess Sumaya University for Technology',
  'Isra University',
  'Petra University',
  'Applied Science University',
  'Aqaba University',
  'Al-Zaytoonah University',
];

export const ROLES = {
  GUEST: 'guest',
  STUDENT: 'student',
  FACULTY: 'faculty',
  UNIVERSITY_ADMIN: 'university_admin',
  PLATFORM_ADMIN: 'platform_admin',
};

export const BADGE_TYPES = [
  { id: 'contributor', name_ar: 'مساهم', name_en: 'Contributor', icon: '📝' },
  { id: 'top_commenter', name_ar: 'معلق نشط', name_en: 'Top Commenter', icon: '💬' },
  { id: 'researcher', name_ar: 'باحث', name_en: 'Researcher', icon: '🔬' },
  { id: 'active_reader', name_ar: 'قارئ نشط', name_en: 'Active Reader', icon: '📖' },
  { id: 'verified', name_ar: 'موثق', name_en: 'Verified', icon: '✓' },
];

export const PAGINATION = {
  ARTICLES_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 10,
  SEARCH_RESULTS_PER_PAGE: 25,
};

export const LIMITS = {
  MAX_ARTICLE_TITLE: 200,
  MAX_ARTICLE_EXCERPT: 500,
  MAX_COMMENT_LENGTH: 1000,
  MAX_BIO_LENGTH: 300,
  MIN_PASSWORD_LENGTH: 8,
};

export const EMAIL_DIGEST_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  NONE: 'none',
};

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
  UNIVERSITY_ADMIN: 'university_admin',
};

export const PREMIUM_PLAN_PRICE = {
  MONTHLY: 4.99,
  YEARLY: 49.99,
};

export const REACTION_TYPES = [
  { id: 'like', emoji: '👍', name: 'Like' },
  { id: 'love', emoji: '❤️', name: 'Love' },
  { id: 'clap', emoji: '👏', name: 'Clap' },
  { id: 'thumbsup', emoji: '✨', name: 'Amazing' },
];

export const NAV_ITEMS = [
  { name_ar: 'الرئيسية', name_en: 'Home', href: '/' },
  { name_ar: 'الأخبار', name_en: 'News Feed', href: '/news' },
  { name_ar: 'الجامعات', name_en: 'Universities', href: '/universities' },
  { name_ar: 'الأحداث', name_en: 'Events', href: '/events' },
  { name_ar: 'أعضاء هيئة التدريس', name_en: 'Faculty', href: '/faculty' },
  { name_ar: 'الوظائف', name_en: 'Jobs', href: '/jobs' },
  { name_ar: 'إشاراتي المرجعية', name_en: 'Bookmarks', href: '/bookmarks' },
];

export const FOOTER_LINKS = {
  ABOUT: { name_ar: 'عن المنصة', name_en: 'About', href: '/about' },
  CONTACT: { name_ar: 'تواصل معنا', name_en: 'Contact', href: '/contact' },
  PRIVACY: { name_ar: 'سياسة الخصوصية', name_en: 'Privacy Policy', href: '/privacy' },
  TERMS: { name_ar: 'شروط الخدمة', name_en: 'Terms of Service', href: '/terms' },
  HELP: { name_ar: 'المساعدة', name_en: 'Help', href: '/help' },
};
