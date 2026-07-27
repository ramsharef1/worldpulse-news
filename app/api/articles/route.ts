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
    date: '2024-07-22',
    views: 1875,
    featured: true,
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
