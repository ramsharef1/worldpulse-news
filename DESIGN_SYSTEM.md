# Universities-Voice Design System

**Version:** 2.0 (Refined)  
**Last Updated:** 2024-07-27  
**Status:** Professional & Academic Aesthetic

---

## 📋 Design Philosophy

**Universities-Voice** is an academic, professional news platform that respects both knowledge and accessibility. The design should feel:
- 📚 **Authoritative** - Trustworthy and credible
- 🎓 **Academic** - Professional and institutional
- 📖 **Content-Focused** - Image-heavy, generous spacing
- 🌍 **Multilingual** - Works beautifully in Arabic (RTL) and English (LTR)

---

## 🎨 Color System

### Primary Colors

| Color | Value | Usage | Contrast |
|-------|-------|-------|----------|
| **University Blue** | `#1E40AF` | Primary, Text, Borders | AA (WCAG compliant) |
| **Teal/Cyan Accent** | `#1AA89D` | Headlines, CTAs, Highlights | AA (WCAG compliant) |

### Neutral Colors

| Color | Value | Usage | Light Mode | Dark Mode |
|-------|-------|-------|-----------|-----------|
| **White** | `#FFFFFF` | Light backgrounds | Primary | Accent |
| **Off-White** | `#F9FAFB` | Light surfaces | Secondary | - |
| **Light Gray** | `#F3F4F6` | Light borders | Tertiary | - |
| **Gray-500** | `#6B7280` | Secondary text | - | - |
| **Dark Gray** | `#1F2937` | Dark mode bg | - | Primary |
| **Very Dark** | `#111827` | Dark mode surfaces | - | Secondary |
| **Black** | `#000000` | Dark text | Primary | - |

### Semantic Colors

| Type | Color | Usage |
|------|-------|-------|
| **Success** | `#059669` | Positive actions, approvals |
| **Warning** | `#D97706` | Caution, alerts |
| **Error** | `#DC2626` | Errors, delete actions |
| **Info** | `#0891B2` | Information, notes |

### Dark Mode Palette

```css
:root[data-theme="dark"] {
  --bg-primary: #111827;      /* Very dark navy */
  --bg-secondary: #1F2937;    /* Dark gray */
  --text-primary: #F9FAFB;    /* Off-white */
  --text-secondary: #D1D5DB;  /* Light gray */
  --border-color: #374151;    /* Dark border */
}
```

---

## 🔤 Typography System

### Typeface Choices

**Display Font (Headlines H1-H3):**
- Family: System sans-serif humanist (Outfit, Open Sans, Segoe UI)
- Characteristics: Friendly yet professional, approachable authority
- Usage: All headings, logo text, major CTAs

**Body Font (Paragraph text, small):**
- Family: System sans-serif humanist (Inter, Open Sans)
- Characteristics: Highly readable, geometric precision
- Usage: Article body, descriptions, navigation

**Monospace (Data, code):**
- Family: System monospace
- Usage: Timestamps, metadata, article numbers

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **H1** | 32px | 700 | 40px | Page titles, hero headline |
| **H2** | 28px | 700 | 36px | Section headers |
| **H3** | 24px | 700 | 32px | Subsection headers |
| **H4** | 20px | 600 | 28px | Card titles, article headlines |
| **Body** | 16px | 400 | 24px | Main article text, descriptions |
| **Small** | 14px | 400 | 20px | Secondary text, captions |
| **Tiny** | 12px | 400 | 16px | Metadata, timestamps |

### Text Properties

- **Letter Spacing:** 
  - Headlines: `-0.02em` (slightly tighter)
  - Body: Normal
  - Uppercase labels: `+0.05em` (slightly wider)

- **Text Wrap:** `balance` on all headings
- **Paragraph Width:** 65 characters max for readability
- **Arabic:** All Arabic text uses RTL direction, same sizes as English

---

## 📏 Spacing System

**Base Unit:** 4px (all spacing multiples of 4)

| Size | Value | Usage |
|------|-------|-------|
| **xs** | 4px | Micro spacing |
| **sm** | 8px | Tight spacing |
| **md** | 12px | Standard spacing |
| **lg** | 16px | Comfortable spacing |
| **xl** | 24px | Generous spacing |
| **2xl** | 32px | Large sections |
| **3xl** | 48px | Extra large gaps |
| **4xl** | 64px | Page margins |

### Padding Strategy

- **Cards:** 24px (premium, spacious)
- **Sections:** 32px-48px (breathing room)
- **Page margins:** 16px mobile, 48px desktop
- **Grid gaps:** 24px (image-heavy cards need space)

---

## 🎯 Component Specifications

### Buttons

**Style:** Flat & Minimal (no gradients, no shadows)

| Type | Style | Usage |
|------|-------|-------|
| **Primary** | Blue bg, white text, no border | Main actions (Search, Submit) |
| **Secondary** | White/transparent, blue text, gray border | Alternative actions |
| **Text** | No background, blue text, underline hover | Links, secondary actions |
| **Disabled** | Gray bg, gray text, opacity 50% | Inactive states |

**Sizing:**
- **Large:** 48px height, 24px padding
- **Medium:** 40px height, 16px padding (default)
- **Small:** 32px height, 12px padding

**Rounded Corners:**
- Buttons: `rounded-lg` (8px)
- Icons: `rounded-md` (6px)
- Cards: `rounded-lg` (8px)

**States:**
- Hover: 5% darker/lighter background
- Focus: 2px blue ring
- Active: 10% darker/lighter background

### Cards (Image-Heavy Design)

**Structure:**
```
┌─────────────────┐
│    Large        │ ← 60% of card height
│    Image        │
├─────────────────┤
│ Headline (H4)   │ ← Bold, navy blue
├─────────────────┤
│ Excerpt (Body)  │ ← 2 lines max
├─────────────────┤
│ Meta (Tiny)     │ ← Date, University, Category
└─────────────────┘
```

**Specifications:**
- **Padding:** 0 (image) + 16px (text section)
- **Min Height:** 360px (image-focused)
- **Image Aspect:** 16:9 (for prominence)
- **Border:** 1px light gray (light mode), 1px dark gray (dark mode)
- **Shadow:** None (flat design)
- **Hover:** Image scales 3%, text emphasis increases

### Inputs & Forms

**Style:** Flat, minimal borders

| Element | Style |
|---------|-------|
| **Text Input** | 40px height, 12px padding, 1px gray border, rounded-lg |
| **Focus** | 2px blue ring, border color changes to blue |
| **Placeholder** | Gray-500, italicized |
| **Label** | Small weight-600, 4px above input |
| **Error** | Red border, red error text below |

### Navigation

**Header:**
- Height: 64px (desktop), 56px (mobile)
- Position: Sticky top
- Padding: 16px horizontal, 12px vertical
- Background: White (light) / Dark gray (dark)
- Border: 1px bottom light gray

**Logo:**
- Position: Left side (LTR) / Right side (RTL)
- Size: 40px mark + 14px text
- Hover: 80% opacity

**Nav Items:**
- Font: Small weight-500
- Padding: 8px horizontal, 4px vertical
- Hover: Blue text + underline
- Active: Blue text + thick bottom border

---

## 📱 Layout & Grid

### Container Sizes

| Breakpoint | Width | Padding | Usage |
|-----------|-------|---------|-------|
| **Mobile** | 320-639px | 16px | Small phones |
| **Tablet** | 640-1023px | 24px | Tablets, large phones |
| **Desktop** | 1024-1919px | 32px | Laptops, monitors |
| **Wide** | 1920px+ | 64px | Ultra-wide displays |

### Grid System

- **Columns:** 12-column grid
- **Gap:** 24px (generous, premium feel)
- **Card Grid:**
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column

### Sections

- **Max Width:** 1280px (desktop)
- **Margins:** Auto (centered)
- **Padding Top/Bottom:** 32-48px (generous)
- **Gap between sections:** 48-64px

---

## 🌙 Dark Mode

### Implementation

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1F2937;
    --text-primary: #F9FAFB;
  }
}

:root[data-theme="dark"] {
  /* Override media query if user toggles */
  --bg-primary: #111827;
  --bg-secondary: #1F2937;
  --text-primary: #F9FAFB;
}
```

### Color Adjustments in Dark Mode

| Element | Light Mode | Dark Mode | Contrast |
|---------|-----------|----------|----------|
| **Backgrounds** | White (#FFF) | Very dark (#111827) | 20:1 |
| **Cards** | Off-white (#F9F) | Dark gray (#1F2) | 15:1 |
| **Primary Text** | Black (#000) | Off-white (#F9F) | 20:1 |
| **Secondary Text** | Gray-500 (#6B7) | Light gray (#D1D) | 5:1 |
| **Borders** | Light gray (#F3F) | Dark gray (#374) | 3:1 |

### Image Treatment

- Overlay: 20% black overlay in dark mode for readability
- Brightness: Slightly reduced (-10%) for OLED comfort
- Contrast: Slightly increased (+5%) for definition

---

## ✨ Visual Effects

### Transitions

- **Default:** 150ms ease-out
- **Hover:** 200ms ease-out
- **Page load:** 300ms ease-in-out

### Shadows

**Light Mode:**
- Subtle: `0 1px 2px rgba(0, 0, 0, 0.05)`
- Standard: None (flat design)
- Elevated: None (flat design)

**Dark Mode:**
- Subtle: `0 1px 2px rgba(0, 0, 0, 0.3)`
- Standard: None (flat design)

### Borders

- **Primary:** 1px solid `var(--border-color)`
- **Focus:** 2px solid `#1E40AF`
- **Error:** 2px solid `#DC2626`
- **Radius:** 8px (cards, buttons), 6px (icons), 4px (inputs)

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- **Contrast:** All text meets 4.5:1 or 3:1 (large text)
- **Focus States:** All interactive elements have visible focus ring
- **Keyboard Navigation:** Tab order is logical, skip links included
- **Motion:** Respects `prefers-reduced-motion`
- **Text Sizing:** Max-width 65 chars for readability

### Color Blindness

- **Don't rely on color alone:** Always use icons/text labels
- **Contrast:** Both teal and blue stand out for deuteranopia
- **Icons:** Semantic symbols in addition to color

### RTL/LTR Support

- **Logical Properties:** Use `start`/`end` instead of `left`/`right`
- **Flexbox:** Reverse when needed with `flex-direction`
- **Margins:** RTL-aware with `margin-inline` utilities
- **Text Direction:** `dir="rtl"` on html element for Arabic

---

## 📐 Responsive Behavior

### Content Adjustments

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| **Font Sizes** | Full scale | 90% | 85% |
| **Spacing** | 24px+ | 16-24px | 12-16px |
| **Images** | 100% width | 95% width | 90% width |
| **Columns** | 3 cols | 2 cols | 1 col |
| **Typography** | H1: 32px | H1: 28px | H1: 24px |

### Navigation Changes

- Desktop: Full horizontal menu
- Tablet: Compact menu items
- Mobile: Hamburger menu (optional, or scroll horiz)

---

## 🎭 Component Examples

### Article Card (Standard)

```html
<div class="card">
  <img src="..." alt="..." class="card-image">
  <div class="card-content">
    <p class="category">Academic</p>
    <h4 class="card-title">Article Headline Here</h4>
    <p class="card-excerpt">Brief excerpt of the article...</p>
    <p class="card-meta">July 27, 2024 • University of Jordan • 5 min read</p>
  </div>
</div>
```

### Featured Section

```html
<section class="featured">
  <h2>Featured Articles</h2>
  <div class="grid grid-cols-3 gap-6">
    <!-- 3 large cards with generous spacing -->
  </div>
</section>
```

### Hero Section

```html
<section class="hero">
  <div class="hero-content">
    <h1>Universities News</h1>
    <p class="subtitle">Stay updated with news from all Jordanian universities</p>
    <input type="search" placeholder="Search articles...">
  </div>
</section>
```

---

## 🎯 Implementation Guidelines

### CSS Architecture

1. **CSS Variables** for colors, spacing, fonts
2. **Tailwind Utilities** for layout and sizing
3. **Component Classes** for specific styling
4. **BEM Naming** for complex components

### File Organization

```
styles/
├── variables.css      (colors, spacing)
├── typography.css    (font sizes, weights)
├── components.css    (button, card, input)
├── layout.css        (grid, container)
└── dark-mode.css     (dark theme)
```

### Testing

- Visual regression testing at breakpoints
- Contrast checking with tools
- Keyboard navigation testing
- RTL/LTR layout testing
- Dark mode rendering testing

---

## 📚 Design Tokens

### Color Tokens

```
--color-primary: #1E40AF
--color-accent: #1AA89D
--color-success: #059669
--color-warning: #D97706
--color-error: #DC2626
--color-bg-light: #FFFFFF
--color-bg-dark: #111827
--color-text-primary: #000000
--color-text-secondary: #6B7280
```

### Spacing Tokens

```
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 48px
--spacing-4xl: 64px
```

### Font Tokens

```
--font-heading: 700 32px / 40px
--font-body: 400 16px / 24px
--font-small: 400 14px / 20px
```

---

## ✅ Quality Checklist

Before shipping any component:

- [ ] Tested in light AND dark modes
- [ ] Tested in RTL (Arabic) and LTR (English)
- [ ] Mobile, tablet, desktop breakpoints validated
- [ ] Contrast meets WCAG AA (4.5:1 minimum)
- [ ] Focus states clearly visible
- [ ] Images are optimized and lazy-loaded
- [ ] Fonts are performant (system fonts preferred)
- [ ] No hardcoded colors (use CSS variables)
- [ ] Spacing uses defined scale (no random pixels)
- [ ] Accessible to keyboard and screen readers

---

**This design system ensures consistency, accessibility, and professionalism across Universities-Voice.**
