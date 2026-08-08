'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface Job {
  id: number;
  title_ar: string;
  title_en: string;
  company_ar: string;
  company_en: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Research';
  field: 'Engineering' | 'Medicine' | 'Business' | 'CS' | 'Education' | 'Science';
  location: string;
  salary_range?: string;
  deadline: string;
  description_ar: string;
  description_en: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: 1,
    title_ar: 'مهندس برمجيات أول',
    title_en: 'Senior Software Engineer',
    company_ar: 'جامعة الأردن - وحدة تقنية المعلومات',
    company_en: 'University of Jordan - IT Unit',
    type: 'Full-time',
    field: 'CS',
    location: 'عمان',
    salary_range: '1,200 - 1,800 JOD',
    deadline: '2026-09-30',
    description_ar: 'نبحث عن مهندس برمجيات ذو خبرة لتطوير وصيانة أنظمة المعلومات الجامعية والبوابات الإلكترونية.',
    description_en: 'Seeking an experienced software engineer to develop and maintain university information systems and web portals.',
  },
  {
    id: 2,
    title_ar: 'طبيب مقيم - تخصص الجراحة',
    title_en: 'Resident Physician - Surgery',
    company_ar: 'مستشفى جامعة العلوم والتكنولوجيا',
    company_en: 'JUST University Hospital',
    type: 'Full-time',
    field: 'Medicine',
    location: 'إربد',
    salary_range: '900 - 1,200 JOD',
    deadline: '2026-10-15',
    description_ar: 'فرصة للانضمام إلى برنامج الإقامة الطبية في قسم الجراحة العامة بمستشفى جامعي مرموق.',
    description_en: 'Opportunity to join the medical residency program in the General Surgery Department at a prestigious university hospital.',
  },
  {
    id: 3,
    title_ar: 'متدرب تسويق رقمي',
    title_en: 'Digital Marketing Intern',
    company_ar: 'جامعة اليرموك - مركز التطوير المؤسسي',
    company_en: 'Yarmouk University - Institutional Development Center',
    type: 'Internship',
    field: 'Business',
    location: 'إربد',
    salary_range: '250 JOD',
    deadline: '2026-09-01',
    description_ar: 'فرصة تدريبية لطلاب إدارة الأعمال والتسويق للعمل على حملات التسويق الرقمي للجامعة.',
    description_en: 'Training opportunity for business administration and marketing students to work on the university\'s digital marketing campaigns.',
  },
  {
    id: 4,
    title_ar: 'أستاذ مساعد - قسم الهندسة الكهربائية',
    title_en: 'Assistant Professor - Electrical Engineering',
    company_ar: 'الجامعة الهاشمية',
    company_en: 'Hashemite University',
    type: 'Full-time',
    field: 'Engineering',
    location: 'الزرقاء',
    salary_range: '1,500 - 2,000 JOD',
    deadline: '2026-10-31',
    description_ar: 'تدعو الجامعة الهاشمية المتقدمين المؤهلين من حملة الدكتوراه في الهندسة الكهربائية للتقدم لشغل وظيفة أستاذ مساعد.',
    description_en: 'Hashemite University invites qualified applicants holding a PhD in Electrical Engineering to apply for an Assistant Professor position.',
  },
  {
    id: 5,
    title_ar: 'باحث في الذكاء الاصطناعي',
    title_en: 'AI Research Associate',
    company_ar: 'جامعة الأردن - مركز أبحاث الذكاء الاصطناعي',
    company_en: 'University of Jordan - AI Research Center',
    type: 'Research',
    field: 'CS',
    location: 'عمان',
    salary_range: '800 - 1,100 JOD',
    deadline: '2026-09-20',
    description_ar: 'فرصة للانضمام إلى فريق بحثي متميز في مجال الذكاء الاصطناعي ومعالجة اللغات الطبيعية.',
    description_en: 'Opportunity to join a distinguished research team in the fields of artificial intelligence and natural language processing.',
  },
  {
    id: 6,
    title_ar: 'متدرب في مجال علم البيانات',
    title_en: 'Data Science Intern',
    company_ar: 'جامعة العلوم والتكنولوجيا الأردنية',
    company_en: 'Jordan University of Science and Technology',
    type: 'Internship',
    field: 'CS',
    location: 'إربد',
    deadline: '2026-08-20',
    description_ar: 'تدريب عملي لمدة ثلاثة أشهر في مجال تحليل البيانات وتطبيقات التعلم الآلي.',
    description_en: 'Three-month practical training in data analysis and machine learning applications.',
  },
  {
    id: 7,
    title_ar: 'معلم لغة إنجليزية - دوام جزئي',
    title_en: 'English Language Instructor - Part-time',
    company_ar: 'جامعة البلقاء التطبيقية',
    company_en: 'Al-Balqa Applied University',
    type: 'Part-time',
    field: 'Education',
    location: 'السلط',
    salary_range: '400 - 600 JOD',
    deadline: '2026-09-10',
    description_ar: 'مطلوب معلم لغة إنجليزية للتدريس في برامج اللغة الإنجليزية للأغراض الأكاديمية.',
    description_en: 'English language instructor required for teaching in English for Academic Purposes programs.',
  },
  {
    id: 8,
    title_ar: 'محلل مالي',
    title_en: 'Financial Analyst',
    company_ar: 'جامعة مؤتة - الشؤون المالية',
    company_en: 'Mutah University - Financial Affairs',
    type: 'Full-time',
    field: 'Business',
    location: 'الكرك',
    salary_range: '700 - 1,000 JOD',
    deadline: '2026-10-05',
    description_ar: 'نبحث عن محلل مالي خبير لدعم إدارة الميزانية والتخطيط المالي في الجامعة.',
    description_en: 'Seeking an experienced financial analyst to support budget management and financial planning at the university.',
  },
  {
    id: 9,
    title_ar: 'باحث في علم الأحياء الجزيئي',
    title_en: 'Molecular Biology Researcher',
    company_ar: 'جامعة الأردن - كلية العلوم',
    company_en: 'University of Jordan - Faculty of Science',
    type: 'Research',
    field: 'Science',
    location: 'عمان',
    salary_range: '900 - 1,200 JOD',
    deadline: '2026-11-01',
    description_ar: 'فرصة بحثية في مجال علم الأحياء الجزيئي وتسلسل الجينوم ضمن مشروع ممول من الاتحاد الأوروبي.',
    description_en: 'Research opportunity in molecular biology and genome sequencing within an EU-funded project.',
  },
  {
    id: 10,
    title_ar: 'مهندس مدني - تدريب صيفي',
    title_en: 'Civil Engineering Summer Intern',
    company_ar: 'الجامعة الهاشمية - قسم الهندسة المدنية',
    company_en: 'Hashemite University - Civil Engineering Department',
    type: 'Internship',
    field: 'Engineering',
    location: 'الزرقاء',
    salary_range: '200 JOD',
    deadline: '2026-08-15',
    description_ar: 'تدريب صيفي في مجال الهندسة المدنية والبنية التحتية لطلاب السنوات المتقدمة.',
    description_en: 'Summer internship in civil engineering and infrastructure for advanced-year students.',
  },
  {
    id: 11,
    title_ar: 'أخصائي تربية خاصة',
    title_en: 'Special Education Specialist',
    company_ar: 'جامعة اليرموك - كلية التربية',
    company_en: 'Yarmouk University - Faculty of Education',
    type: 'Full-time',
    field: 'Education',
    location: 'إربد',
    salary_range: '600 - 900 JOD',
    deadline: '2026-10-20',
    description_ar: 'مطلوب أخصائي تربية خاصة للعمل في وحدة دعم الطلاب ذوي الاحتياجات الخاصة بالجامعة.',
    description_en: 'Special education specialist needed to work in the university\'s unit supporting students with special needs.',
  },
  {
    id: 12,
    title_ar: 'متدرب مختبرات كيمياء',
    title_en: 'Chemistry Lab Intern',
    company_ar: 'جامعة الزيتونة الأردنية - كلية العلوم',
    company_en: 'Al-Zaytoonah University - Faculty of Science',
    type: 'Internship',
    field: 'Science',
    location: 'عمان',
    deadline: '2026-09-05',
    description_ar: 'تدريب عملي في مختبرات الكيمياء التحليلية والعضوية لطلاب الكيمياء والتخصصات المرتبطة.',
    description_en: 'Practical training in analytical and organic chemistry laboratories for chemistry and related students.',
  },
  {
    id: 13,
    title_ar: 'مدير مشاريع - دوام جزئي',
    title_en: 'Project Manager - Part-time',
    company_ar: 'جامعة البلقاء التطبيقية',
    company_en: 'Al-Balqa Applied University',
    type: 'Part-time',
    field: 'Business',
    location: 'السلط',
    salary_range: '500 - 700 JOD',
    deadline: '2026-09-25',
    description_ar: 'مدير مشاريع لإدارة مشاريع التطوير المؤسسي والتحول الرقمي بدوام جزئي.',
    description_en: 'Project manager to oversee institutional development and digital transformation projects on a part-time basis.',
  },
  {
    id: 14,
    title_ar: 'مساعد بحثي - الدراسات العليا',
    title_en: 'Graduate Research Assistant',
    company_ar: 'جامعة مؤتة - كلية الهندسة',
    company_en: 'Mutah University - Faculty of Engineering',
    type: 'Research',
    field: 'Engineering',
    location: 'الكرك',
    salary_range: '450 JOD',
    deadline: '2026-10-10',
    description_ar: 'فرصة لطلاب الدراسات العليا للعمل كمساعدين بحثيين في مشاريع الطاقة المتجددة.',
    description_en: 'Opportunity for graduate students to work as research assistants in renewable energy projects.',
  },
  {
    id: 15,
    title_ar: 'طبيب أسنان - دوام كامل',
    title_en: 'Dentist - Full-time',
    company_ar: 'جامعة العلوم والتكنولوجيا - عيادة الأسنان',
    company_en: 'JUST - Dental Clinic',
    type: 'Full-time',
    field: 'Medicine',
    location: 'إربد',
    salary_range: '1,000 - 1,400 JOD',
    deadline: '2026-11-15',
    description_ar: 'مطلوب طبيب أسنان للعمل في عيادة الأسنان الجامعية وتقديم الرعاية الصحية للطلاب وأعضاء هيئة التدريس.',
    description_en: 'Dentist required to work in the university dental clinic, providing healthcare to students and faculty members.',
  },
];

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Internship', 'Research'] as const;
const JOB_FIELDS = ['All', 'Engineering', 'Medicine', 'Business', 'CS', 'Education', 'Science'] as const;

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  All: { ar: 'الكل', en: 'All' },
  'Full-time': { ar: 'دوام كامل', en: 'Full-time' },
  'Part-time': { ar: 'دوام جزئي', en: 'Part-time' },
  Internship: { ar: 'تدريب', en: 'Internship' },
  Research: { ar: 'بحث علمي', en: 'Research' },
};

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  All: { ar: 'كل المجالات', en: 'All Fields' },
  Engineering: { ar: 'هندسة', en: 'Engineering' },
  Medicine: { ar: 'طب', en: 'Medicine' },
  Business: { ar: 'أعمال', en: 'Business' },
  CS: { ar: 'حاسوب', en: 'CS' },
  Education: { ar: 'تربية', en: 'Education' },
  Science: { ar: 'علوم', en: 'Science' },
};

const TYPE_COLORS: Record<string, string> = {
  'Full-time': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  'Part-time': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  Internship: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
  Research: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
};

export default function JobsPage() {
  const { language, t } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedField, setSelectedField] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_JOBS.filter(job => {
      if (selectedType !== 'All' && job.type !== selectedType) return false;
      if (selectedField !== 'All' && job.field !== selectedField) return false;
      if (q) {
        const titleAr = job.title_ar.toLowerCase();
        const titleEn = job.title_en.toLowerCase();
        if (!titleAr.includes(q) && !titleEn.includes(q)) return false;
      }
      return true;
    });
  }, [selectedType, selectedField, search]);

  const formatDeadline = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-JO', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{t('فرص العمل والتدريب', 'Jobs & Internships')}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t('اكتشف الوظائف وفرص التدريب في الجامعات الأردنية', 'Discover job openings and internship opportunities at Jordanian universities')}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        {/* Search box */}
        <div className="relative">
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('ابحث عن وظيفة...', 'Search for a job...')}
            className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedType === type
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {t(TYPE_LABELS[type].ar, TYPE_LABELS[type].en)}
            </button>
          ))}
        </div>

        {/* Field filter */}
        <div className="flex flex-wrap gap-2">
          {JOB_FIELDS.map(field => (
            <button
              key={field}
              onClick={() => setSelectedField(field)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedField === field
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-300 dark:border-gray-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              {t(FIELD_LABELS[field].ar, FIELD_LABELS[field].en)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {t(`${filtered.length} فرصة متاحة`, `${filtered.length} opportunities found`)}
      </p>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">{t('لا توجد فرص مطابقة', 'No matching opportunities')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(job => (
            <div
              key={job.id}
              className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition ${
                isExpired(job.deadline) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug truncate">
                    {language === 'ar' ? job.title_ar : job.title_en}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {language === 'ar' ? job.company_ar : job.company_en}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${TYPE_COLORS[job.type]}`}>
                  {t(TYPE_LABELS[job.type].ar, TYPE_LABELS[job.type].en)}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                {language === 'ar' ? job.description_ar : job.description_en}
              </p>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t(FIELD_LABELS[job.field].ar, FIELD_LABELS[job.field].en)}
                </span>
                {job.salary_range && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.salary_range}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs ${isExpired(job.deadline) ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {t('آخر موعد:', 'Deadline:')} {formatDeadline(job.deadline)}
                  {isExpired(job.deadline) && <span className="ms-1 font-semibold">{t('(منتهي)', '(Expired)')}</span>}
                </span>
                <button
                  disabled={isExpired(job.deadline)}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                >
                  {t('قدّم الآن', 'Apply Now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
