'use client';

import { useState, useEffect } from 'react';
import { EnhancedHeader, EnhancedNav, EnhancedFooter, ContentCard } from '@/components/EnhancedLayout';

interface ArticleDetailEnhancedProps {
  params: { id: string };
}

export default function ArticleDetailEnhanced({ params }: ArticleDetailEnhancedProps) {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('dark', darkMode);
  }, [language, darkMode]);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/articles/${params.id}`);
      const data = await response.json();
      setArticle(data);

      // Fetch related articles
      const relatedRes = await fetch(`/api/articles?category=${data.category}&limit=3&exclude=${params.id}`);
      const relatedData = await relatedRes.json();
      setRelatedArticles(relatedData.articles || []);
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const readingTime = Math.ceil((article?.content?.split(' ').length || 0) / 200);

  if (isLoading) {
    return (
      <>
        <EnhancedHeader
          language={language}
          darkMode={darkMode}
          onLanguageChange={setLanguage}
          onDarkModeChange={setDarkMode}
        />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse">
            <div className="w-96 h-96 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <EnhancedHeader
          language={language}
          darkMode={darkMode}
          onLanguageChange={setLanguage}
          onDarkModeChange={setDarkMode}
        />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500 text-lg">{t('لم يتم العثور على المقالة', 'Article not found')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <EnhancedHeader
        language={language}
        darkMode={darkMode}
        onLanguageChange={setLanguage}
        onDarkModeChange={setDarkMode}
      />

      <EnhancedNav language={language} items={[]} />

      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-40">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{
            width: '30%',
          }}
        />
      </div>

      {/* Hero Image */}
      <div className="w-full h-96 md:h-[500px] bg-gradient-to-br from-blue-400 to-purple-600 relative overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-${1600000 + Math.random() * 1000000}-?w=1200&h=500&fit=crop`}
          alt={language === 'ar' ? article.title : article.title_en}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Article Content */}
      <article className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content (2/3) */}
            <div className="lg:col-span-2">
              {/* Meta Information */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase">
                    {article.category}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{article.university}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{article.date}</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  {language === 'ar' ? article.title : article.title_en}
                </h1>

                {/* Reading Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8">
                  <span>📖 {readingTime} {t('دقيقة قراءة', 'min read')}</span>
                  <span>👁️ {article.views || 0} {t('مشاهدة', 'views')}</span>
                  <span>❤️ {article.likes || 0} {t('إعجاب', 'likes')}</span>
                </div>

                {/* Author Card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                  <div className="flex-1">
                    <p className="font-semibold">{t('محرر الأخبار', 'News Editor')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('مراسل متخصص في أخبار الجامعات', 'University News Correspondent')}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    {t('متابعة', 'Follow')}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-3 py-6 border-t border-b border-gray-200 dark:border-gray-800 mb-8">
                <span className="font-semibold">{t('مشاركة:', 'Share:')}</span>
                <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" title="Share on Twitter">
                  𝕏
                </button>
                <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" title="Share on Facebook">
                  f
                </button>
                <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" title="Share on LinkedIn">
                  in
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert(t('تم نسخ الرابط', 'Link copied!'));
                  }}
                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  title="Copy link"
                >
                  🔗
                </button>
              </div>

              {/* Article Content */}
              <div className="prose dark:prose-invert max-w-none mb-12">
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {language === 'ar' ? article.excerpt : article.excerpt_en}
                </p>

                <div className="my-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('الفقرة الرئيسية:', 'Key Point:')}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {t('هذه مقالة مهمة تغطي الأحداث الأخيرة في الجامعات الأردنية وتأثيرها على الطلاب والأكاديميين.', 'This important article covers recent events in Jordanian universities and their impact on students and academics.')}
                  </p>
                </div>

                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {language === 'ar' ? article.content : article.content_en}
                </p>
              </div>

              {/* Related Topics */}
              <div className="mb-12">
                <h3 className="text-xl font-bold mb-4">{t('الموضوعات ذات الصلة', 'Related Topics')}</h3>
                <div className="flex flex-wrap gap-2">
                  {['التعليم', 'الطلاب', 'الأخبار', 'الجامعات'].map((tag, idx) => (
                    <a
                      key={idx}
                      href={`/news?category=${tag}`}
                      className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
                <h3 className="text-2xl font-bold mb-8">{t('التعليقات', 'Comments')} ({comments.length})</h3>

                {/* Comment Form */}
                <div className="mb-8">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder={t('أضف تعليقك...', 'Add your comment...')}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (newComment.trim()) {
                          setComments([{ id: Date.now(), text: newComment, author: t('أنت', 'You'), date: t('الآن', 'Now') }, ...comments]);
                          setNewComment('');
                        }
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                      disabled={!newComment.trim()}
                    >
                      {t('نشر', 'Post')}
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-gray-500">{t('لا توجد تعليقات حتى الآن. كن الأول في التعليق!', 'No comments yet. Be the first to comment!')}</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{comment.author}</p>
                            <span className="text-sm text-gray-500">{comment.date}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <button className="text-gray-500 hover:text-blue-600 transition">{t('رد', 'Reply')}</button>
                            <button className="text-gray-500 hover:text-blue-600 transition">{t('أعجبني', 'Like')}</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar (1/3) */}
            <aside className="space-y-8">
              {/* Actions */}
              <div className="sticky top-32 space-y-3">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    isSaved
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {isSaved ? '❤️ ' : '🤍 '} {t('حفظ المقالة', 'Save Article')}
                </button>
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  {t('مشاركة', 'Share')}
                </button>
              </div>

              {/* Info Card */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">{t('معلومات المقالة', 'Article Info')}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{t('الجامعة', 'University')}</p>
                    <p className="font-semibold">{article.university}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{t('التصنيف', 'Category')}</p>
                    <p className="font-semibold">{article.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{t('تاريخ النشر', 'Published')}</p>
                    <p className="font-semibold">{article.date}</p>
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">{t('مقالات ذات صلة', 'Related Articles')}</h3>
                  <div className="space-y-4">
                    {relatedArticles.map((related: any) => (
                      <a
                        key={related.id}
                        href={`/article/${related.id}`}
                        className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-lg transition block"
                      >
                        <p className="text-sm font-semibold line-clamp-2 hover:text-blue-600 transition">
                          {language === 'ar' ? related.title : related.title_en}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{related.views} views</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6">
                <h3 className="font-bold mb-2">{t('النشرة البريدية', 'Newsletter')}</h3>
                <p className="text-sm text-white/90 mb-4">{t('اشترك للحصول على أحدث الأخبار', 'Subscribe for latest news')}</p>
                <input
                  type="email"
                  placeholder={t('بريدك الإلكتروني', 'Your email')}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white placeholder:text-white/60 border border-white/30 focus:border-white focus:outline-none mb-3"
                />
                <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                  {t('اشترك', 'Subscribe')}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <EnhancedFooter language={language} />
    </>
  );
}
