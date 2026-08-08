# Revamp Report — Universities-Voice

**Date:** 2026-08-08
**Branch:** `revamp` (5 commits, ready to merge into `main`)

## Summary

Holistic revamp of the Universities-Voice bilingual (Arabic/English) news platform covering content, visual system, SEO, and accessibility.

## What Changed

### Batch 1 — Shared Layout & Design Tokens
- Created `lib/LanguageContext.tsx` — shared React context for language, dark mode, and `t()` helper
- Created `components/SiteHeader.tsx` and `components/SiteFooter.tsx` — shared across all 24 pages
- Rewrote `app/layout.tsx` — root layout with Inter + Cairo fonts, skip-to-content, landmarks
- Rewrote `app/globals.css` — CSS custom properties design system with `@theme inline`
- Stripped duplicate header/footer/state boilerplate from all 24 page files

### Batch 2 — Content & Voice Consistency
- Created `content/voice-guide.md` — bilingual tone and conventions
- Fixed brand name inconsistency (some pages used "أخبار الجامعات" instead of "صوت الجامعات")
- Replaced hardcoded English university abbreviations with `UNIVERSITIES_DATA` throughout
- Rewrote `app/about/page.tsx` with bilingual university names and proper slug links
- Updated stale 2024-07 dates to 2026-08 in API mock data

### Batch 3 — Visual System
- Replaced default Next.js favicon with branded gradient `public/favicon.svg`
- Created `public/og-image.svg` (1200×630) with bilingual branding
- Created `public/images/article-placeholder.svg`
- Created `app/not-found.tsx` — bilingual 404 with inline SVG illustration
- Created `content/image-manifest.json` documenting all visual assets

### Batch 4 — SEO
- Created `app/sitemap.ts` — dynamic sitemap covering static, category, and university pages
- Created `app/robots.ts` — blocks /api/, /auth/, /profile, /dashboard, /notifications
- Added NewsArticle JSON-LD structured data to `app/article/[id]/page.tsx`
- Added OpenGraph metadata to root layout

### Batch 5 — Accessibility & Performance
- Skip-to-content link with visible focus state
- `aria-label` on nav, language toggle, dark mode toggle, password toggle
- Footer link lists wrapped in `<nav>` landmarks
- Fixed nested `<main>` in news page
- Connected form labels to inputs (contact, search, login pages)
- Fixed homepage: `<h1>` heading, search label, CTA as link instead of dead button
- Fixed dark mode contrast (gray-500 → gray-400 on dark backgrounds)

## Phase 0 Problems — Before/After

| Problem | Before | After |
|---------|--------|-------|
| Duplicate boilerplate | 24 pages each had own header/footer/language state | Shared context + components |
| Hardcoded English university names | `['UoJ', 'JUST', 'HU', ...]` on homepage | `UNIVERSITIES_DATA` with bilingual names |
| Brand name inconsistency | Mixed "أخبار الجامعات" / "صوت الجامعات" | Consistent "صوت الجامعات" everywhere |
| Default Next.js favicon | Black N on white | Branded UV gradient |
| No sitemap or robots.txt | Missing | Dynamic sitemap + robots.txt |
| No structured data | Missing | NewsArticle JSON-LD on articles |
| Missing form labels | Placeholders only | Proper `<label>` + `htmlFor`/`id` |
| No skip-to-content | Missing | Visible on focus |
| Dead CTA button | `<button>` with no handler | `<a href="/auth/signup">` |
| Stale dates | 2024-07 in mock data | 2026-08 |

## TODO:VERIFY Items

None. All content is derived from the repository; no facts were invented.

## Known Limitations

- `ignoreBuildErrors: true` remains in `next.config.js` — TypeScript errors in `lib/` files need separate cleanup
- API routes return mock data; backend integration is a separate phase
- OG image is SVG; some social platforms prefer PNG/JPG
- Phone number on contact page is placeholder (`+962 6 XXX XXXX`)

## Build Status

Build passes cleanly (with `ignoreBuildErrors`). All 24 routes render without errors.
