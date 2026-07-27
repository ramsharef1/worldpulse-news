// Universities-Voice Database Types (All 45 Features)

// User Roles
export type UserRole = 'guest' | 'student' | 'faculty' | 'university_admin' | 'platform_admin';

// User
export interface User {
  id: string;
  email: string;
  name_ar: string;
  name_en: string;
  password_hash: string;
  role: UserRole;
  university_id?: string;
  department_id?: string;
  profile_image?: string;
  bio?: string;
  is_verified: boolean;
  language_preference: 'ar' | 'en';
  theme_preference: 'light' | 'dark' | 'auto';
  reputation_score: number;
  created_at: Date;
  updated_at: Date;
}

// University
export interface University {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  logo_url?: string;
  banner_url?: string;
  website?: string;
  location_ar?: string;
  location_en?: string;
  established_year?: number;
  student_count?: number;
  faculty_count?: number;
  contact_email?: string;
  contact_phone?: string;
  social_links?: Record<string, string>;
  is_featured: boolean;
  ranking?: number;
  article_count: number;
  follower_count: number;
  created_at: Date;
  updated_at: Date;
}

// Department
export interface Department {
  id: string;
  university_id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  head_id?: string;
  contact_email?: string;
  parent_department_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Article Category
export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  color: string;
  description_ar?: string;
  description_en?: string;
}

// Article (with Phase 1-4 features)
export interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  content_ar: string;
  content_en: string;
  excerpt_ar?: string;
  excerpt_en?: string;
  university_id: string;
  category_id: string;
  author_id: string;
  source_type: 'admin' | 'rss' | 'tip' | 'social' | 'event';
  featured_image_url?: string;
  gallery_urls?: string[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  shares_count: number;
  reading_time: number;
  tags: string[];
  seo_metadata?: Record<string, string>;
  is_featured: boolean;
  is_breaking: boolean;
  language_original: 'ar' | 'en';
  published_at?: Date;
  scheduled_at?: Date;
  updated_at: Date;
  created_at: Date;
}

// Comment (Threaded)
export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  is_pinned: boolean;
  is_edited: boolean;
  likes_count: number;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// User Reaction (Like, Clap, etc)
export interface Reaction {
  id: string;
  user_id: string;
  article_id: string;
  reaction_type: 'like' | 'love' | 'clap' | 'thumbsup' | 'bookmark' | 'share';
  created_at: Date;
}

// User Bookmark/Save
export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  collection_id?: string;
  created_at: Date;
}

// News Tip Submission
export interface NewsTip {
  id: string;
  user_id: string;
  title_ar: string;
  title_en: string;
  description: string;
  university_id: string;
  category_id?: string;
  source_link?: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  admin_notes?: string;
  converted_article_id?: string;
  created_at: Date;
  updated_at: Date;
}

// RSS Feed
export interface RSSFeed {
  id: string;
  university_id: string;
  feed_url: string;
  feed_name_ar: string;
  feed_name_en: string;
  last_synced?: Date;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  is_active: boolean;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

// Event
export interface Event {
  id: string;
  university_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  start_date: Date;
  end_date: Date;
  location_ar?: string;
  location_en?: string;
  image_url?: string;
  link?: string;
  is_featured: boolean;
  status: 'draft' | 'published' | 'completed';
  created_at: Date;
  updated_at: Date;
}

// Faculty
export interface Faculty {
  id: string;
  university_id: string;
  department_id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  research_interests?: string;
  office_location?: string;
  office_hours?: string;
  profile_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

// User Preferences
export interface UserPreferences {
  id: string;
  user_id: string;
  email_digest_frequency: 'daily' | 'weekly' | 'none';
  subscribed_universities: string[];
  subscribed_categories: string[];
  subscribed_topics: string[];
  notification_settings: Record<string, boolean>;
  muted_keywords: string[];
  blocked_universities: string[];
  blocked_users: string[];
  show_profile_public: boolean;
  show_reading_history: boolean;
  created_at: Date;
  updated_at: Date;
}

// User Follows (Users, Universities, Topics)
export interface UserFollow {
  id: string;
  user_id: string;
  follow_type: 'user' | 'university' | 'category' | 'topic';
  follow_id: string;
  created_at: Date;
}

// Article Tags
export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
  follower_count: number;
  created_at: Date;
}

// User Badge/Achievement
export interface Badge {
  id: string;
  user_id: string;
  badge_type: 'contributor' | 'top_commenter' | 'researcher' | 'active_reader' | 'verified';
  description?: string;
  earned_at: Date;
}

// Reading List/Collection
export interface Collection {
  id: string;
  user_id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  article_ids: string[];
  is_public: boolean;
  follower_count: number;
  created_at: Date;
  updated_at: Date;
}

// Reading History
export interface ReadingHistory {
  id: string;
  user_id: string;
  article_id: string;
  time_spent: number;
  progress: number;
  created_at: Date;
  updated_at: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  entity_type: string;
  entity_id: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ip_address?: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  type: 'article_published' | 'comment_reply' | 'tip_approved' | 'breaking_news' | 'recommendation';
  article_id?: string;
  related_entity_id?: string;
  message_ar: string;
  message_en: string;
  read_at?: Date;
  created_at: Date;
}

// Ad Campaign
export interface AdCampaign {
  id: string;
  university_id?: string;
  sponsor_id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image_url: string;
  link: string;
  ad_type: 'banner' | 'sidebar' | 'featured';
  is_premium_placement: boolean;
  start_date: Date;
  end_date: Date;
  impressions: number;
  clicks: number;
  budget_jd: number;
  cost_per_click?: number;
  cost_per_impression?: number;
  created_at: Date;
  updated_at: Date;
}

// Subscription (Premium)
export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'university_admin';
  payment_status: 'active' | 'cancelled' | 'expired';
  start_date: Date;
  end_date?: Date;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Job Posting
export interface JobPosting {
  id: string;
  university_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  position_type: 'internship' | 'fulltime' | 'parttime' | 'contract';
  posted_by_id: string;
  status: 'open' | 'closed';
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Analytics Daily
export interface AnalyticsDaily {
  id: string;
  date: Date;
  article_id?: string;
  university_id?: string;
  views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
}

// Question & Answer
export interface Question {
  id: string;
  article_id: string;
  user_id: string;
  title: string;
  content: string;
  answers_count: number;
  helpful_count: number;
  status: 'open' | 'answered' | 'closed';
  created_at: Date;
  updated_at: Date;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_marked_best: boolean;
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}
