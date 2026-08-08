'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface Event {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  university_ar: string;
  university_en: string;
  date: string; // ISO date string
  location_ar: string;
  location_en: string;
  category: 'Conference' | 'Workshop' | 'Cultural' | 'Sports' | 'Academic';
  image_url: string;
}

const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    title_ar: 'مؤتمر الابتكار والتكنولوجيا الرقمية',
    title_en: 'Digital Innovation & Technology Conference',
    description_ar: 'يستضيف مؤتمر الابتكار والتكنولوجيا الرقمية نخبة من الخبراء والباحثين لمناقشة أحدث التطورات في مجال الذكاء الاصطناعي وتحويل الأعمال الرقمية.',
    description_en: 'The Digital Innovation & Technology Conference hosts leading experts and researchers to discuss the latest advances in artificial intelligence and digital business transformation.',
    university_ar: 'جامعة الأردن',
    university_en: 'University of Jordan',
    date: '2026-09-15',
    location_ar: 'قاعة المؤتمرات الرئيسية، عمان',
    location_en: 'Main Conference Hall, Amman',
    category: 'Conference',
    image_url: 'https://picsum.photos/seed/event1/400/200',
  },
  {
    id: 2,
    title_ar: 'ورشة عمل تطوير تطبيقات الهاتف المحمول',
    title_en: 'Mobile App Development Workshop',
    description_ar: 'ورشة عمل عملية لمدة يومين تغطي تطوير التطبيقات باستخدام React Native وFlutter مع تطبيقات عملية حقيقية.',
    description_en: 'A two-day hands-on workshop covering app development using React Native and Flutter with real-world practical applications.',
    university_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    university_en: 'Jordan University of Science and Technology',
    date: '2026-09-22',
    location_ar: 'مختبر الحوسبة، إربد',
    location_en: 'Computing Lab, Irbid',
    category: 'Workshop',
    image_url: 'https://picsum.photos/seed/event2/400/200',
  },
  {
    id: 3,
    title_ar: 'مهرجان الفنون والثقافة الجامعية',
    title_en: 'University Arts & Culture Festival',
    description_ar: 'احتفال سنوي يجمع طلاب الجامعات الأردنية للتعبير عن إبداعاتهم الفنية والثقافية من موسيقى ومسرح وشعر وفنون بصرية.',
    description_en: 'An annual celebration bringing Jordanian university students together to express their artistic and cultural creativity through music, theater, poetry, and visual arts.',
    university_ar: 'جامعة اليرموك',
    university_en: 'Yarmouk University',
    date: '2026-10-05',
    location_ar: 'المسرح الجامعي، إربد',
    location_en: 'University Theater, Irbid',
    category: 'Cultural',
    image_url: 'https://picsum.photos/seed/event3/400/200',
  },
  {
    id: 4,
    title_ar: 'بطولة كرة القدم بين الجامعات',
    title_en: 'Inter-University Football Championship',
    description_ar: 'البطولة السنوية لكرة القدم التي تجمع فرق الجامعات الأردنية في منافسة رياضية على مستوى عالٍ.',
    description_en: 'The annual football championship bringing together Jordanian university teams in high-level athletic competition.',
    university_ar: 'الجامعة الهاشمية',
    university_en: 'Hashemite University',
    date: '2026-10-12',
    location_ar: 'الملعب الرياضي، الزرقاء',
    location_en: 'Sports Stadium, Zarqa',
    category: 'Sports',
    image_url: 'https://picsum.photos/seed/event4/400/200',
  },
  {
    id: 5,
    title_ar: 'ندوة البحث العلمي والنشر الأكاديمي',
    title_en: 'Scientific Research & Academic Publishing Seminar',
    description_ar: 'ندوة متخصصة تناقش منهجيات البحث العلمي الحديثة واستراتيجيات النشر في المجلات الدولية المحكمة.',
    description_en: 'A specialized seminar discussing modern scientific research methodologies and strategies for publishing in peer-reviewed international journals.',
    university_ar: 'جامعة مؤتة',
    university_en: 'Mutah University',
    date: '2026-10-20',
    location_ar: 'قاعة المؤتمرات، الكرك',
    location_en: 'Conference Room, Karak',
    category: 'Academic',
    image_url: 'https://picsum.photos/seed/event5/400/200',
  },
  {
    id: 6,
    title_ar: 'معرض المشاريع الريادية للطلاب',
    title_en: 'Student Entrepreneurship Projects Exhibition',
    description_ar: 'معرض يتيح للطلاب الجامعيين عرض مشاريعهم الريادية أمام المستثمرين وأصحاب العمل والمهتمين بدعم الابتكار.',
    description_en: 'An exhibition allowing university students to showcase their entrepreneurial projects to investors, employers, and innovation supporters.',
    university_ar: 'جامعة البلقاء التطبيقية',
    university_en: 'Al-Balqa Applied University',
    date: '2026-11-03',
    location_ar: 'قاعة المعارض، السلط',
    location_en: 'Exhibition Hall, Salt',
    category: 'Academic',
    image_url: 'https://picsum.photos/seed/event6/400/200',
  },
  {
    id: 7,
    title_ar: 'مؤتمر الطب والصحة في الأردن',
    title_en: 'Medicine & Healthcare in Jordan Conference',
    description_ar: 'مؤتمر طبي سنوي يضم نخبة من الأطباء والأكاديميين لمناقشة أحدث المستجدات في مجال الطب والرعاية الصحية.',
    description_en: 'An annual medical conference bringing together leading physicians and academics to discuss the latest developments in medicine and healthcare.',
    university_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    university_en: 'Jordan University of Science and Technology',
    date: '2026-11-15',
    location_ar: 'كلية الطب، إربد',
    location_en: 'Faculty of Medicine, Irbid',
    category: 'Conference',
    image_url: 'https://picsum.photos/seed/event7/400/200',
  },
  {
    id: 8,
    title_ar: 'ورشة التصميم الجرافيكي والهوية البصرية',
    title_en: 'Graphic Design & Visual Identity Workshop',
    description_ar: 'ورشة تدريبية مكثفة يقدمها محترفون من الصناعة الإبداعية تتناول أساسيات التصميم الجرافيكي وبناء الهوية البصرية.',
    description_en: 'An intensive training workshop led by creative industry professionals covering the fundamentals of graphic design and visual identity building.',
    university_ar: 'جامعة الزيتونة الأردنية',
    university_en: 'Al-Zaytoonah University of Jordan',
    date: '2026-11-28',
    location_ar: 'مختبر التصميم، عمان',
    location_en: 'Design Lab, Amman',
    category: 'Workshop',
    image_url: 'https://picsum.photos/seed/event8/400/200',
  },
  {
    id: 9,
    title_ar: 'أسبوع التراث الأردني',
    title_en: 'Jordanian Heritage Week',
    description_ar: 'أسبوع ثقافي يحتفل بالتراث والتاريخ الأردني الأصيل من خلال معارض وعروض فولكلورية وفعاليات تفاعلية.',
    description_en: 'A cultural week celebrating authentic Jordanian heritage and history through exhibitions, folkloric performances, and interactive events.',
    university_ar: 'جامعة مؤتة',
    university_en: 'Mutah University',
    date: '2026-12-07',
    location_ar: 'الحرم الجامعي، الكرك',
    location_en: 'University Campus, Karak',
    category: 'Cultural',
    image_url: 'https://picsum.photos/seed/event9/400/200',
  },
  {
    id: 10,
    title_ar: 'بطولة الروبوتيكس والذكاء الاصطناعي',
    title_en: 'Robotics & AI Championship',
    description_ar: 'منافسة تقنية مثيرة يتنافس فيها فرق الطلاب في تصميم وبرمجة الروبوتات لحل مشكلات هندسية محددة.',
    description_en: 'An exciting technical competition where student teams compete in designing and programming robots to solve specific engineering challenges.',
    university_ar: 'جامعة الأردن',
    university_en: 'University of Jordan',
    date: '2026-12-20',
    location_ar: 'كلية الهندسة، عمان',
    location_en: 'Faculty of Engineering, Amman',
    category: 'Academic',
    image_url: 'https://picsum.photos/seed/event10/400/200',
  },
  {
    id: 11,
    title_ar: 'دوري الألعاب الرياضية بين الكليات',
    title_en: 'Inter-Faculty Sports League',
    description_ar: 'دوري رياضي متنوع يشمل كرة السلة والكرة الطائرة وكرة الطاولة وغيرها من الألعاب الجماعية والفردية.',
    description_en: 'A diverse sports league covering basketball, volleyball, table tennis, and other team and individual sports.',
    university_ar: 'الجامعة الهاشمية',
    university_en: 'Hashemite University',
    date: '2026-08-10',
    location_ar: 'المجمع الرياضي، الزرقاء',
    location_en: 'Sports Complex, Zarqa',
    category: 'Sports',
    image_url: 'https://picsum.photos/seed/event11/400/200',
  },
  {
    id: 12,
    title_ar: 'ورشة اللغات وتطوير مهارات التواصل',
    title_en: 'Language & Communication Skills Workshop',
    description_ar: 'ورشة متخصصة في تطوير مهارات التحدث والكتابة بالعربية والإنجليزية للطلاب الجامعيين وأعضاء هيئة التدريس.',
    description_en: 'A workshop specializing in developing Arabic and English speaking and writing skills for university students and faculty members.',
    university_ar: 'جامعة اليرموك',
    university_en: 'Yarmouk University',
    date: '2026-08-25',
    location_ar: 'كلية الآداب، إربد',
    location_en: 'Faculty of Arts, Irbid',
    category: 'Workshop',
    image_url: 'https://picsum.photos/seed/event12/400/200',
  },
];

const CATEGORIES = ['All', 'Conference', 'Workshop', 'Cultural', 'Sports', 'Academic'] as const;

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  All: { ar: 'الكل', en: 'All' },
  Conference: { ar: 'مؤتمر', en: 'Conference' },
  Workshop: { ar: 'ورشة عمل', en: 'Workshop' },
  Cultural: { ar: 'ثقافي', en: 'Cultural' },
  Sports: { ar: 'رياضي', en: 'Sports' },
  Academic: { ar: 'أكاديمي', en: 'Academic' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Conference: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  Workshop: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  Cultural: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  Sports: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  Academic: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EventsPage() {
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    return MOCK_EVENTS.filter(ev => {
      const evDate = new Date(ev.date);
      const isUpcoming = evDate >= today;
      if (tab === 'upcoming' && !isUpcoming) return false;
      if (tab === 'past' && isUpcoming) return false;
      if (selectedCategory !== 'All' && ev.category !== selectedCategory) return false;
      if (selectedMonth !== 'all') {
        const evMonth = evDate.getMonth();
        if (evMonth !== parseInt(selectedMonth)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (tab === 'upcoming') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [tab, selectedCategory, selectedMonth]);

  const getEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: language === 'ar' ? MONTHS_AR[d.getMonth()] : MONTHS_EN[d.getMonth()],
      year: d.getFullYear(),
    };
  };

  const availableMonths = useMemo(() => {
    const months = new Set(MOCK_EVENTS.map(ev => new Date(ev.date).getMonth()));
    return Array.from(months).sort((a, b) => a - b);
  }, []);

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{t('أحداث الجامعات', 'University Events')}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t('اكتشف الفعاليات والأحداث القادمة في الجامعات الأردنية', 'Discover upcoming events at Jordanian universities')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        {(['upcoming', 'past'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-6 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === tabKey
                ? 'border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tabKey === 'upcoming' ? t('القادمة', 'Upcoming') : t('السابقة', 'Past')}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedCategory === cat
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {t(CATEGORY_LABELS[cat].ar, CATEGORY_LABELS[cat].en)}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="all">{t('كل الأشهر', 'All Months')}</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {language === 'ar' ? MONTHS_AR[m] : MONTHS_EN[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Events grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">{t('لا توجد فعاليات', 'No events found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(ev => {
            const { day, month, year } = getEventDate(ev.date);
            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition group"
              >
                <div className="relative">
                  <img
                    src={ev.image_url}
                    alt={language === 'ar' ? ev.title_ar : ev.title_en}
                    className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Date badge */}
                  <div className="absolute top-3 start-3 bg-blue-700 text-white rounded-xl px-3 py-2 text-center shadow-lg min-w-[56px]">
                    <div className="text-2xl font-bold leading-none">{day}</div>
                    <div className="text-xs font-medium mt-0.5 uppercase">{month}</div>
                    <div className="text-xs opacity-80">{year}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[ev.category]}`}>
                      {t(CATEGORY_LABELS[ev.category].ar, CATEGORY_LABELS[ev.category].en)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {language === 'ar' ? ev.university_ar : ev.university_en}
                    </span>
                  </div>

                  <h2 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 leading-snug">
                    {language === 'ar' ? ev.title_ar : ev.title_en}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {language === 'ar' ? ev.description_ar : ev.description_en}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{language === 'ar' ? ev.location_ar : ev.location_en}</span>
                  </div>

                  <button className="w-full py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition">
                    {t('سجّل الآن', 'Register Now')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
