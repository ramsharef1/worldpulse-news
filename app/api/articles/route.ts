import { NextRequest, NextResponse } from 'next/server';

// Mock articles for initial MVP
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'جامعة الأردن تعلن عن برامج دراسية جديدة',
    title_en: 'University of Jordan Announces New Programs',
    category: 'Academic',
    university: 'جامعة الأردن',
    excerpt: 'أعلنت جامعة الأردن عن إطلاق عدة برامج دراسية جديدة للعام الأكاديمي القادم',
    excerpt_en: 'University of Jordan announced new academic programs for the upcoming year',
    date: '2024-07-27',
    views: 1250,
    featured: true,
  },
  {
    id: '2',
    title: 'منافسة رياضية بين جامعات الأردن',
    title_en: 'Sports Competition Between Jordanian Universities',
    category: 'Sports',
    university: 'جامعة اليرموك',
    excerpt: 'تقام منافسة رياضية بين جامعات الأردن في كرة السلة والكرة الطائرة',
    excerpt_en: 'Sports competition held between Jordanian universities in basketball and volleyball',
    date: '2024-07-26',
    views: 890,
    featured: true,
  },
  {
    id: '3',
    title: 'اكتشاف علمي جديد من قبل باحثي JUST',
    title_en: 'New Scientific Discovery by JUST Researchers',
    category: 'Research',
    university: 'جامعة العلوم والتكنولوجيا',
    excerpt: 'قام باحثون من جامعة العلوم والتكنولوجيا بإجراء دراسة عن تطبيقات الذكاء الاصطناعي',
    excerpt_en: 'Researchers from JUST conducted a study on AI applications',
    date: '2024-07-25',
    views: 2100,
    featured: true,
  },
  {
    id: '4',
    title: 'فرص تدريب وعمل للطلاب الخريجين',
    title_en: 'Training and Job Opportunities for Graduates',
    category: 'Career & Jobs',
    university: 'الجامعة الهاشمية',
    excerpt: 'تعلن عدة شركات عن فرص عمل وتدريب للطلاب الخريجين من الجامعات الأردنية',
    excerpt_en: 'Several companies announce job opportunities for graduate students',
    date: '2024-07-24',
    views: 1560,
    featured: true,
  },
  {
    id: '5',
    title: 'مهرجان الفنون والثقافة الجامعي',
    title_en: 'University Arts and Culture Festival',
    category: 'Student Life',
    university: 'جامعة مؤتة',
    excerpt: 'تقيم جامعة مؤتة مهرجاناً سنوياً للفنون والثقافة الجامعية',
    excerpt_en: 'Mutah University organizes annual arts and culture festival',
    date: '2024-07-23',
    views: 945,
    featured: true,
  },
  {
    id: '6',
    title: 'منح دراسية لطلاب التفوق الأكاديمي',
    title_en: 'Scholarships for Academic Excellence',
    category: 'Admissions',
    university: 'البلقاء التطبيقية',
    excerpt: 'تعلن جامعة البلقاء التطبيقية عن منح دراسية للطلاب المتفوقين أكاديمياً',
    excerpt_en: 'Al-Balqa University announces scholarships for academic excellence',
    date: '2026-07-22',
    views: 1875,
    featured: true,
  },
  // Additional News Articles
  {
    id: '7',
    title: 'جامعة الزيتونة تحقق إنجازات بحثية عالمية',
    title_en: 'Al-Zaytoonah University Achieves Global Research Success',
    category: 'Achievements',
    university: 'جامعة الزيتونة',
    excerpt: 'نشرت أوراق بحثية من جامعة الزيتونة في مجلات عالمية مرموقة في مجال الهندسة',
    excerpt_en: 'Al-Zaytoonah researchers published papers in prestigious international journals',
    date: '2026-07-21',
    views: 1567,
    featured: false,
  },
  {
    id: '8',
    title: 'جامعة إسراء توسع برامجها الهندسية',
    title_en: 'Isra University Expands Engineering Programs',
    category: 'Academic',
    university: 'جامعة إسراء',
    excerpt: 'أضافت جامعة إسراء ثلاثة برامج هندسية جديدة بتقنيات حديثة ومختبرات متطورة',
    excerpt_en: 'Isra University added three new engineering programs with modern labs',
    date: '2026-07-20',
    views: 1234,
    featured: false,
  },
  {
    id: '9',
    title: 'طلاب الجامعة الألمانية الأردنية يفوزون بمسابقة دولية',
    title_en: 'GJU Students Win International Competition',
    category: 'Achievements',
    university: 'الجامعة الألمانية الأردنية',
    excerpt: 'فاز فريق من طلاب الجامعة الألمانية الأردنية بمسابقة دولية في الابتكار التكنولوجي',
    excerpt_en: 'German Jordanian University team won international technology innovation competition',
    date: '2026-07-19',
    views: 2145,
    featured: false,
  },
  {
    id: '10',
    title: 'جامعة عمّان العربية تطلق منصة تعليم إلكترونية',
    title_en: 'Amman Arab University Launches E-Learning Platform',
    category: 'Academic',
    university: 'جامعة عمّان العربية',
    excerpt: 'أطلقت جامعة عمّان العربية منصة تعليم إلكترونية متقدمة تدعم التعليم الهجين',
    excerpt_en: 'Amman Arab University launched e-learning platform supporting hybrid education',
    date: '2026-07-18',
    views: 1876,
    featured: false,
  },
  {
    id: '11',
    title: 'فريق جامعة جرش يفوز ببطولة كرة القدم',
    title_en: 'Jerash University Wins Football Championship',
    category: 'Sports',
    university: 'جامعة جرش',
    excerpt: 'تتويج فريق جامعة جرش ببطولة كرة القدم الجامعية للعام الثاني على التوالي',
    excerpt_en: 'Jerash University football team wins championship for second consecutive year',
    date: '2026-07-17',
    views: 3456,
    featured: false,
  },
  {
    id: '12',
    title: 'جامعة الشرق الأوسط توظف 100 خريج',
    title_en: 'Middle East University Employs 100 Graduates',
    category: 'Career & Jobs',
    university: 'جامعة الشرق الأوسط',
    excerpt: 'وظفت مشاريع وشركات متعاونة مع جامعة الشرق الأوسط 100 خريج في وظائف متنوعة',
    excerpt_en: 'Partner companies employed 100 MEU graduates in various positions',
    date: '2026-07-16',
    views: 2789,
    featured: false,
  },
  {
    id: '13',
    title: 'مؤتمر دولي للبحث العلمي في جامعة البترا',
    title_en: 'International Research Conference at Petra University',
    category: 'Research',
    university: 'جامعة البترا',
    excerpt: 'استضافت جامعة البترا مؤتمراً دولياً حضره باحثون من 20 دولة',
    excerpt_en: 'Petra University hosted international conference with researchers from 20 countries',
    date: '2026-07-15',
    views: 1654,
    featured: false,
  },
  {
    id: '14',
    title: 'يوم مفتوح في جامعة فيلادلفيا',
    title_en: 'Open Day at Philadelphia University',
    category: 'Student Life',
    university: 'جامعة فيلادلفيا',
    excerpt: 'استقبلت جامعة فيلادلفيا آلاف الطلاب الراغبين في الالتحاق يوم الجمعة الماضي',
    excerpt_en: 'Philadelphia University hosted thousands of prospective students during open day',
    date: '2026-07-14',
    views: 2341,
    featured: false,
  },
  {
    id: '15',
    title: 'منح دراسية أميركية للطلاب الأردنيين',
    title_en: 'US Scholarships for Jordanian Students',
    category: 'Admissions',
    university: 'جامعة اليرموك',
    excerpt: 'توفر السفارة الأميركية منح دراسية كاملة للطلاب الأردنيين الراغبين في الدراسة الجامعية',
    excerpt_en: 'US Embassy offers full scholarships for Jordanian students pursuing university education',
    date: '2026-07-13',
    views: 4123,
    featured: false,
  },
  {
    id: '16',
    title: 'جامعة العلوم التطبيقية تختبر تقنية الواقع الافتراضي',
    title_en: 'Applied University Tests Virtual Reality Technology',
    category: 'Research',
    university: 'جامعة العلوم التطبيقية',
    excerpt: 'بدأت جامعة العلوم التطبيقية اختبار تقنيات الواقع الافتراضي في المحاضرات التعليمية',
    excerpt_en: 'Applied Science University testing VR technology in educational lectures',
    date: '2026-07-12',
    views: 1987,
    featured: false,
  },
  {
    id: '17',
    title: 'جامعة أقابة تستضيف ملتقى الخريجين',
    title_en: 'Aqaba University Hosts Alumni Gathering',
    category: 'Student Life',
    university: 'جامعة أقابة',
    excerpt: 'استضافت جامعة أقابة ملتقى سنوي لخريجيها من مختلف السنوات والتخصصات',
    excerpt_en: 'Aqaba University hosted annual alumni gathering with graduates from all years',
    date: '2026-07-11',
    views: 1234,
    featured: false,
  },
  {
    id: '18',
    title: 'اكتشاف جديد في الطب من جامعة الهاشمية',
    title_en: 'New Medical Discovery from Hashemite University',
    category: 'Achievements',
    university: 'الجامعة الهاشمية',
    excerpt: 'اكتشف باحثو كلية الطب في الجامعة الهاشمية علاجاً جديداً قد يفيد المصابين بأمراض معينة',
    excerpt_en: 'Hashemite University medical researchers discovered new treatment for certain diseases',
    date: '2026-07-10',
    views: 3654,
    featured: false,
  },
  {
    id: '19',
    title: 'برنامج تبادل طلابي مع جامعات أوروبية',
    title_en: 'Student Exchange Program with European Universities',
    category: 'Academic',
    university: 'جامعة الأردن',
    excerpt: 'وافقت جامعة الأردن على برنامج تبادل طلابي جديد مع 5 جامعات أوروبية مرموقة',
    excerpt_en: 'University of Jordan approved new student exchange program with 5 European universities',
    date: '2026-07-09',
    views: 2567,
    featured: false,
  },
  {
    id: '20',
    title: 'مسابقة ريادة الأعمال الجامعية 2026',
    title_en: 'University Entrepreneurship Competition 2026',
    category: 'Achievements',
    university: 'جامعة مؤتة',
    excerpt: 'انطلقت مسابقة ريادة الأعمال الجامعية بجوائز تصل إلى 50 ألف دينار',
    excerpt_en: 'University entrepreneurship competition launched with prizes reaching 50,000 JD',
    date: '2026-07-08',
    views: 2198,
    featured: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const university = searchParams.get('university');
    const limit = parseInt(searchParams.get('limit') || '20');

    let articles = [...MOCK_ARTICLES];

    if (featured === 'true') {
      articles = articles.filter((a) => a.featured);
    }

    if (category) {
      articles = articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    if (university) {
      articles = articles.filter((a) => a.university.toLowerCase().includes(university.toLowerCase()));
    }

    const paginated = articles.slice(0, limit);

    return NextResponse.json({
      success: true,
      articles: paginated,
      total: articles.length,
      limit,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title_en || !body.title_ar || !body.content_en) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Create new article
    const newArticle = {
      id: Date.now().toString(),
      title: body.title_en,
      title_en: body.title_en,
      title_ar: body.title_ar,
      content_en: body.content_en,
      content_ar: body.content_ar || '',
      category: body.category || 'General',
      university: body.university || 'General',
      excerpt_en: body.excerpt_en || body.content_en.substring(0, 150),
      date: new Date().toISOString().split('T')[0],
      views: 0,
      featured: false,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      article: newArticle,
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ success: false, error: 'Failed to create article' }, { status: 500 });
  }
}
