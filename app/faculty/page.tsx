'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface FacultyMember {
  id: number;
  name_ar: string;
  name_en: string;
  university_ar: string;
  university_en: string;
  department_ar: string;
  department_en: string;
  title_ar: string;
  title_en: string;
  specialization_ar: string;
  specialization_en: string;
  email: string;
  publications_count: number;
  avatar: string;
}

const MOCK_FACULTY: FacultyMember[] = [
  {
    id: 1,
    name_ar: 'أ.د. محمد علي الأحمد',
    name_en: 'Prof. Dr. Mohammad Ali Al-Ahmad',
    university_ar: 'جامعة الأردن',
    university_en: 'University of Jordan',
    department_ar: 'قسم علم الحاسوب',
    department_en: 'Computer Science',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'الذكاء الاصطناعي ومعالجة اللغات الطبيعية',
    specialization_en: 'Artificial Intelligence & NLP',
    email: 'm.ahmad@ju.edu.jo',
    publications_count: 87,
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 2,
    name_ar: 'أ.م.د. سارة خالد العمري',
    name_en: 'Assoc. Prof. Dr. Sara Khalid Al-Omari',
    university_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    university_en: 'Jordan University of Science and Technology',
    department_ar: 'قسم الهندسة الكيميائية',
    department_en: 'Chemical Engineering',
    title_ar: 'أستاذ مشارك',
    title_en: 'Associate Professor',
    specialization_ar: 'هندسة عمليات التحويل والطاقة',
    specialization_en: 'Process Engineering & Energy',
    email: 's.omari@just.edu.jo',
    publications_count: 52,
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 3,
    name_ar: 'د. أحمد فارس النجار',
    name_en: 'Dr. Ahmad Faris Al-Najjar',
    university_ar: 'جامعة اليرموك',
    university_en: 'Yarmouk University',
    department_ar: 'قسم الفيزياء',
    department_en: 'Physics',
    title_ar: 'أستاذ مساعد',
    title_en: 'Assistant Professor',
    specialization_ar: 'فيزياء الجسم الصلب وأشباه الموصلات',
    specialization_en: 'Solid State Physics & Semiconductors',
    email: 'a.najjar@yu.edu.jo',
    publications_count: 34,
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 4,
    name_ar: 'أ.د. ليلى محمود الزعبي',
    name_en: 'Prof. Dr. Layla Mahmoud Al-Zaabi',
    university_ar: 'الجامعة الهاشمية',
    university_en: 'Hashemite University',
    department_ar: 'قسم إدارة الأعمال',
    department_en: 'Business Administration',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'الإدارة الاستراتيجية وريادة الأعمال',
    specialization_en: 'Strategic Management & Entrepreneurship',
    email: 'l.zaabi@hu.edu.jo',
    publications_count: 71,
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: 5,
    name_ar: 'أ.م.د. عمر يوسف الطراونة',
    name_en: 'Assoc. Prof. Dr. Omar Yousef Al-Trawna',
    university_ar: 'جامعة مؤتة',
    university_en: 'Mutah University',
    department_ar: 'كلية الطب',
    department_en: 'Faculty of Medicine',
    title_ar: 'أستاذ مشارك',
    title_en: 'Associate Professor',
    specialization_ar: 'طب الأطفال وأمراض القلب',
    specialization_en: 'Pediatrics & Cardiology',
    email: 'o.trawna@mutah.edu.jo',
    publications_count: 63,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 6,
    name_ar: 'د. نور الدين سعيد المجالي',
    name_en: 'Dr. Nour Al-Din Saeed Al-Majali',
    university_ar: 'جامعة البلقاء التطبيقية',
    university_en: 'Al-Balqa Applied University',
    department_ar: 'قسم الهندسة الكهربائية',
    department_en: 'Electrical Engineering',
    title_ar: 'أستاذ مساعد',
    title_en: 'Assistant Professor',
    specialization_ar: 'الطاقة المتجددة وأنظمة الطاقة الكهربائية',
    specialization_en: 'Renewable Energy & Power Systems',
    email: 'n.majali@bau.edu.jo',
    publications_count: 29,
    avatar: 'https://i.pravatar.cc/150?img=6',
  },
  {
    id: 7,
    name_ar: 'أ.د. رنا إبراهيم القضاة',
    name_en: 'Prof. Dr. Rana Ibrahim Al-Qudah',
    university_ar: 'جامعة الزيتونة الأردنية',
    university_en: 'Al-Zaytoonah University of Jordan',
    department_ar: 'قسم اللغة العربية وآدابها',
    department_en: 'Arabic Language & Literature',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'النقد الأدبي والشعر العربي الحديث',
    specialization_en: 'Literary Criticism & Modern Arabic Poetry',
    email: 'r.qudah@zuj.edu.jo',
    publications_count: 55,
    avatar: 'https://i.pravatar.cc/150?img=7',
  },
  {
    id: 8,
    name_ar: 'أ.م.د. حسام الدين جمال الرشيد',
    name_en: 'Assoc. Prof. Dr. Hussam Al-Din Jamal Al-Rashid',
    university_ar: 'جامعة الأردن',
    university_en: 'University of Jordan',
    department_ar: 'قسم الهندسة المدنية',
    department_en: 'Civil Engineering',
    title_ar: 'أستاذ مشارك',
    title_en: 'Associate Professor',
    specialization_ar: 'هندسة الإنشاءات والزلازل',
    specialization_en: 'Structural & Earthquake Engineering',
    email: 'h.rashid@ju.edu.jo',
    publications_count: 48,
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
  {
    id: 9,
    name_ar: 'د. ميساء أنور الحوامدة',
    name_en: 'Dr. Maysaa Anwar Al-Hawamda',
    university_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    university_en: 'Jordan University of Science and Technology',
    department_ar: 'قسم التمريض',
    department_en: 'Nursing',
    title_ar: 'أستاذ مساعد',
    title_en: 'Assistant Professor',
    specialization_ar: 'تمريض الصحة النفسية والمجتمعية',
    specialization_en: 'Mental Health & Community Nursing',
    email: 'm.hawamda@just.edu.jo',
    publications_count: 22,
    avatar: 'https://i.pravatar.cc/150?img=9',
  },
  {
    id: 10,
    name_ar: 'أ.د. طارق سليمان البطاينة',
    name_en: 'Prof. Dr. Tariq Suleiman Al-Bataineh',
    university_ar: 'جامعة اليرموك',
    university_en: 'Yarmouk University',
    department_ar: 'قسم الكيمياء',
    department_en: 'Chemistry',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'الكيمياء العضوية والصيدلانية',
    specialization_en: 'Organic & Pharmaceutical Chemistry',
    email: 't.bataineh@yu.edu.jo',
    publications_count: 96,
    avatar: 'https://i.pravatar.cc/150?img=10',
  },
  {
    id: 11,
    name_ar: 'أ.م.د. فاطمة حسن أبو عليان',
    name_en: 'Assoc. Prof. Dr. Fatima Hassan Abu Alyan',
    university_ar: 'الجامعة الهاشمية',
    university_en: 'Hashemite University',
    department_ar: 'قسم التربية الخاصة',
    department_en: 'Special Education',
    title_ar: 'أستاذ مشارك',
    title_en: 'Associate Professor',
    specialization_ar: 'صعوبات التعلم والإعاقة الفكرية',
    specialization_en: 'Learning Disabilities & Intellectual Disability',
    email: 'f.abualiyan@hu.edu.jo',
    publications_count: 41,
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 12,
    name_ar: 'د. وائل جميل الشديفات',
    name_en: 'Dr. Wael Jamil Al-Shdifat',
    university_ar: 'جامعة مؤتة',
    university_en: 'Mutah University',
    department_ar: 'قسم علوم الحاسوب',
    department_en: 'Computer Science',
    title_ar: 'أستاذ مساعد',
    title_en: 'Assistant Professor',
    specialization_ar: 'أمن المعلومات والشبكات',
    specialization_en: 'Information Security & Networks',
    email: 'w.shdifat@mutah.edu.jo',
    publications_count: 37,
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 13,
    name_ar: 'أ.د. كريم عبدالله المناصير',
    name_en: 'Prof. Dr. Karim Abdullah Al-Manaseer',
    university_ar: 'جامعة البلقاء التطبيقية',
    university_en: 'Al-Balqa Applied University',
    department_ar: 'قسم الرياضيات',
    department_en: 'Mathematics',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'الرياضيات التطبيقية والنمذجة العددية',
    specialization_en: 'Applied Mathematics & Numerical Modeling',
    email: 'k.manaseer@bau.edu.jo',
    publications_count: 78,
    avatar: 'https://i.pravatar.cc/150?img=13',
  },
  {
    id: 14,
    name_ar: 'أ.م.د. نادية يعقوب الهاشمي',
    name_en: 'Assoc. Prof. Dr. Nadia Yaqoub Al-Hashemi',
    university_ar: 'جامعة الزيتونة الأردنية',
    university_en: 'Al-Zaytoonah University of Jordan',
    department_ar: 'قسم علم النفس',
    department_en: 'Psychology',
    title_ar: 'أستاذ مشارك',
    title_en: 'Associate Professor',
    specialization_ar: 'علم النفس الإرشادي وصحة المراهقين',
    specialization_en: 'Counseling Psychology & Adolescent Health',
    email: 'n.hashemi@zuj.edu.jo',
    publications_count: 44,
    avatar: 'https://i.pravatar.cc/150?img=14',
  },
  {
    id: 15,
    name_ar: 'د. بلال محمود أبو زيد',
    name_en: 'Dr. Bilal Mahmoud Abu Zeid',
    university_ar: 'جامعة الأردن',
    university_en: 'University of Jordan',
    department_ar: 'قسم الاقتصاد',
    department_en: 'Economics',
    title_ar: 'أستاذ مساعد',
    title_en: 'Assistant Professor',
    specialization_ar: 'الاقتصاد الكلي والسياسات المالية',
    specialization_en: 'Macroeconomics & Fiscal Policy',
    email: 'b.abuzeid@ju.edu.jo',
    publications_count: 26,
    avatar: 'https://i.pravatar.cc/150?img=15',
  },
  {
    id: 16,
    name_ar: 'أ.د. سمر راشد القرالة',
    name_en: 'Prof. Dr. Samar Rashed Al-Qurala',
    university_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    university_en: 'Jordan University of Science and Technology',
    department_ar: 'قسم الصيدلة السريرية',
    department_en: 'Clinical Pharmacy',
    title_ar: 'أستاذ دكتور',
    title_en: 'Professor',
    specialization_ar: 'الصيدلة السريرية وعلم الأدوية',
    specialization_en: 'Clinical Pharmacy & Pharmacology',
    email: 's.qurala@just.edu.jo',
    publications_count: 112,
    avatar: 'https://i.pravatar.cc/150?img=16',
  },
];

const TITLE_FILTERS = ['All', 'Professor', 'Associate Professor', 'Assistant Professor'] as const;
const TITLE_LABELS: Record<string, { ar: string; en: string }> = {
  All: { ar: 'كل الرتب', en: 'All Titles' },
  Professor: { ar: 'أستاذ دكتور', en: 'Professor' },
  'Associate Professor': { ar: 'أستاذ مشارك', en: 'Associate' },
  'Assistant Professor': { ar: 'أستاذ مساعد', en: 'Assistant' },
};

const TITLE_COLORS: Record<string, string> = {
  Professor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  'Associate Professor': 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
  'Assistant Professor': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
};

export default function FacultyPage() {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedTitle, setSelectedTitle] = useState<string>('All');

  const universities = useMemo(
    () => Array.from(new Set(MOCK_FACULTY.map(f => f.university_en))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_FACULTY.filter(f => {
      if (selectedUniversity !== 'all' && f.university_en !== selectedUniversity) return false;
      if (selectedTitle !== 'All' && f.title_en !== selectedTitle) return false;
      if (q) {
        const nameAr = f.name_ar.toLowerCase();
        const nameEn = f.name_en.toLowerCase();
        const specAr = f.specialization_ar.toLowerCase();
        const specEn = f.specialization_en.toLowerCase();
        if (!nameAr.includes(q) && !nameEn.includes(q) && !specAr.includes(q) && !specEn.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [search, selectedUniversity, selectedTitle]);

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{t('أعضاء هيئة التدريس', 'Faculty Directory')}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t('تعرّف على أعضاء هيئة التدريس في الجامعات الأردنية', 'Meet the faculty members of Jordanian universities')}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('ابحث بالاسم أو التخصص...', 'Search by name or specialization...')}
            className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* University filter */}
          <select
            value={selectedUniversity}
            onChange={e => setSelectedUniversity(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">{t('كل الجامعات', 'All Universities')}</option>
            {universities.map(u => {
              const member = MOCK_FACULTY.find(f => f.university_en === u);
              return (
                <option key={u} value={u}>
                  {language === 'ar' ? member?.university_ar : u}
                </option>
              );
            })}
          </select>

          {/* Title filter chips */}
          <div className="flex flex-wrap gap-2">
            {TITLE_FILTERS.map(title => (
              <button
                key={title}
                onClick={() => setSelectedTitle(title)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedTitle === title
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {t(TITLE_LABELS[title].ar, TITLE_LABELS[title].en)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {t(`${filtered.length} عضو هيئة تدريس`, `${filtered.length} faculty members`)}
      </p>

      {/* Faculty grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-lg">{t('لا يوجد أعضاء مطابقون', 'No faculty members found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(member => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition text-center"
            >
              {/* Avatar */}
              <div className="relative mx-auto mb-4 w-24 h-24">
                <img
                  src={member.avatar}
                  alt={language === 'ar' ? member.name_ar : member.name_en}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow"
                />
                {/* Title badge */}
                <span className={`absolute -bottom-1 start-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TITLE_COLORS[member.title_en]}`}
                  style={{ transform: 'translateX(-50%)' }}>
                  {t(TITLE_LABELS[member.title_en].ar, TITLE_LABELS[member.title_en].en)}
                </span>
              </div>

              {/* Name */}
              <h2 className="font-bold text-gray-900 dark:text-gray-100 mt-3 leading-snug text-sm">
                {language === 'ar' ? member.name_ar : member.name_en}
              </h2>

              {/* University */}
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-1">
                {language === 'ar' ? member.university_ar : member.university_en}
              </p>

              {/* Department */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ar' ? member.department_ar : member.department_en}
              </p>

              {/* Specialization */}
              <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {language === 'ar' ? member.specialization_ar : member.specialization_en}
                </p>
              </div>

              {/* Stats & Email */}
              <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{member.publications_count}</span>
                  <span>{t('بحث', 'papers')}</span>
                </span>
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('راسلني', 'Email')}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
