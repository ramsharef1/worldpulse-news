# Universities-Voice Brand Guidelines

## Logo

### Logo Mark
The Universities-Voice logo combines two core concepts:
- **Open Book**: Represents knowledge, education, and universities
- **Voice Waves**: Represents broadcast, amplification, and giving voice to the community

### Logo Files
- `public/logo.svg` - Full logo with text (used in header, navigation)
- `public/favicon.svg` - Logo mark only (used as favicon and icon)

### Usage
- **Large spaces** (hero, homepage): Use full logo with text
- **Header/Navigation**: Logo mark + text
- **Favicon/Icon**: Logo mark only
- **Social media**: Logo mark with rounded background

### Clear Space
Maintain minimum clear space equal to the logo mark's width around all sides.

### Minimum Size
- Print/High-res: 96px minimum
- Web: 32px minimum for mark, 40px for full logo

---

## Color Palette

### Primary Colors
- **Blue**: `#1E40AF` - Primary brand color (trust, education)
- **Teal/Cyan**: `#1AA89D` - Secondary accent (innovation, modern, forward-thinking)

### Neutral Colors
- **Charcoal**: `#1F2937` - Primary text (dark mode)
- **Off-white**: `#F9FAFB` - Background (light mode)
- **Gray-600**: `#4B5563` - Secondary text

### Semantic Colors
- **Success**: `#10B981` - Positive actions
- **Warning**: `#F59E0B` - Alerts, caution
- **Error**: `#EF4444` - Errors, critical
- **Info**: `#06B6D4` - Information

### Dark Mode
- Background: `#111827` (near-black)
- Surface: `#1F2937` (dark gray)
- Text: `#F9FAFB` (off-white)

---

## Typography

### Display Font
**System sans-serif** (Geometric, confident)
- Headlines (H1-H3)
- Logo text
- Bold calls-to-action

### Body Font
**System sans-serif** (Clean, readable)
- Body text
- Descriptions
- Navigation labels

### Utility Font
**Monospace** (for data, code)
- Timestamps
- Article metadata
- Tabular numbers

### Type Scale
- H1: 32px / 40px
- H2: 24px / 32px
- H3: 20px / 28px
- H4: 18px / 26px
- Body: 16px / 24px
- Small: 14px / 20px
- Tiny: 12px / 16px

---

## Component Patterns

### Logo Component
```tsx
import { Logo, LogoMark } from '@/components/Logo';

// Full logo with text
<Logo size="md" showText={true} />

// Mark only
<LogoMark size="sm" />
```

### Sizes
- `sm` - 32px (Small icons, mobile header)
- `md` - 40px (Default, header)
- `lg` - 64px (Hero, large displays)

---

## Voice & Tone

### Brand Voice
- **Authoritative**: Credible, knowledgeable
- **Accessible**: Clear, approachable
- **Energetic**: Forward-looking, dynamic
- **Community-focused**: Celebrating universities and students

### Writing Principles
- Use active voice
- Be specific, avoid jargon
- Celebrate academic achievement
- Include both Arabic and English naturally

---

## Design System

### Spacing
- 4px base unit
- Common: 8px, 12px, 16px, 24px, 32px, 48px

### Rounded Corners
- Buttons/inputs: `rounded-lg` (8px)
- Cards: `rounded-lg` (8px)
- Large elements: `rounded-xl` (12px)
- Badges: `rounded-full`

### Shadows
- Subtle: `shadow-sm` (light hover states)
- Standard: `shadow-md` (cards, emphasis)
- Elevated: `shadow-lg` (modals, overlays)

### Borders
- Default: 1px solid `border-gray-200` (light)
- Focus state: 2px solid `border-blue-600`

---

## RTL/LTR & Language

### Arabic (Primary Direction: RTL)
- All headings and primary content in Arabic
- Full RTL layout
- Logo faces left in marks

### English (Secondary Direction: LTR)
- Supplementary information
- Taglines, subtext
- Optional on international features

### Implementation
- Use `dir="rtl"` on `<html>` for Arabic
- Use `dir="ltr"` for English sections
- Always support bidirectional text within paragraphs

---

## Dark Mode

### Color Overrides
All components inherit dark mode through CSS custom properties:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1F2937;
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
  }
}
```

### Logo in Dark Mode
Logo gradient remains consistent: Blue to Purple (works on all backgrounds).

---

## Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- Graphics/UI: 3:1 minimum

### Focus States
- All interactive elements have visible focus ring
- Focus ring color: `ring-2 ring-blue-600`

### Motion
- Respect `prefers-reduced-motion`
- Default animations subtle and purposeful
- Disable animations for users with motion sensitivity

---

## Examples & Applications

### Header Logo
- Size: `md` (40px)
- Position: Left-aligned in header
- Interaction: Link to homepage

### Favicon
- Size: 32px minimum
- File: `favicon.svg`
- Auto-loaded from `public/favicon.svg`

### Social Media
- Size: 512x512px minimum
- Background: Solid color or gradient
- Usage: Profile picture, shared content

### Email
- Size: 200px width
- Alt text: "Universities-Voice"
- Link: Homepage

---

## Updates & Maintenance

**Last Updated**: 2024-07-27
**Version**: 1.0
**Maintained By**: Universities-Voice Team

For questions or updates to branding guidelines, please contact the design team.
