import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/constants';
import { UNIVERSITIES_DATA } from '@/lib/universities-data';

const BASE_URL = 'https://universitiesvoice.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/about',
    '/news',
    '/universities',
    '/events',
    '/faculty',
    '/jobs',
    '/contact',
    '/search',
    '/trending',
    '/breaking',
    '/bookmarks',
    '/dashboard',
    '/stats',
    '/help',
    '/privacy',
    '/terms',
    '/auth/login',
    '/auth/signup',
  ];

  const categoryPages = CATEGORIES.map((cat) => `/news/${cat.slug}`);

  const universityPages = UNIVERSITIES_DATA.map((uni) => `/universities/${uni.slug}`);

  const allPages = [...staticPages, ...categoryPages, ...universityPages];

  return allPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path.startsWith('/news') ? 0.8 : 0.6,
  }));
}
