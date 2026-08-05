/**
 * Universities Voice - Design System
 * Modern, professional design tokens for the platform
 */

export const designSystem = {
  // ============= COLORS =============
  colors: {
    // Primary brand colors (Blue)
    primary: {
      50: '#f0f7ff',
      100: '#e0eeff',
      200: '#c7ddff',
      300: '#a4c9ff',
      400: '#7bafff',
      500: '#4f8fff', // Primary
      600: '#3b6bde',
      700: '#2d4fa8',
      800: '#243b7f',
      900: '#1e2d66',
    },

    // Secondary colors (Teal/Emerald)
    secondary: {
      50: '#f0fdf8',
      100: '#ccfbee',
      200: '#99f6e0',
      300: '#5eedc8',
      400: '#2dd4ae', // Secondary
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#134e4a',
      900: '#0f3f3a',
    },

    // Accent colors (Purple)
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4ff',
      400: '#c084fc',
      500: '#a855f7', // Accent
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },

    // Neutral colors (Gray)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Backgrounds
    bg: {
      light: '#ffffff',
      lightSecondary: '#f9fafb',
      lightTertiary: '#f3f4f6',
      dark: '#0f172a',
      darkSecondary: '#1e293b',
      darkTertiary: '#334155',
    },
  },

  // ============= TYPOGRAPHY =============
  typography: {
    fontFamily: {
      display: '"Poppins", "Cairo", sans-serif', // Bold, modern
      body: '"Inter", "Segoe UI", sans-serif', // Clean, readable
      mono: '"Fira Code", "Monaco", monospace', // Code
    },

    // Font scales (px)
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
    },

    // Font weights
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ============= SPACING =============
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
  },

  // ============= SHADOWS =============
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // ============= BORDER RADIUS =============
  borderRadius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },

  // ============= TRANSITIONS =============
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
    slower: '500ms ease-in-out',
  },

  // ============= BREAKPOINTS =============
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ============= Z-INDEX =============
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },
};

// ============= COMPONENT PATTERNS =============

export const componentPatterns = {
  // Button sizes
  button: {
    xs: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '4px',
      minHeight: '32px',
    },
    sm: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '6px',
      minHeight: '36px',
    },
    base: {
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '8px',
      minHeight: '40px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: '18px',
      fontWeight: 600,
      borderRadius: '8px',
      minHeight: '48px',
    },
    xl: {
      padding: '16px 32px',
      fontSize: '20px',
      fontWeight: 700,
      borderRadius: '12px',
      minHeight: '56px',
    },
  },

  // Card styles
  card: {
    base: {
      borderRadius: '12px',
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    elevated: {
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    ghost: {
      borderRadius: '12px',
      padding: '16px',
      backgroundColor: 'transparent',
      border: '1px solid #e5e7eb',
    },
  },

  // Input styles
  input: {
    base: {
      padding: '10px 14px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      transition: 'all 200ms ease-in-out',
      '&:focus': {
        outline: 'none',
        borderColor: '#4f8fff',
        boxShadow: '0 0 0 3px rgba(79, 143, 255, 0.1)',
      },
    },
  },

  // Badge styles
  badge: {
    sm: {
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: 600,
      borderRadius: '4px',
    },
    base: {
      padding: '6px 12px',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '6px',
    },
    lg: {
      padding: '8px 16px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '8px',
    },
  },
};

// ============= UTILITIES =============

export const utils = {
  // Responsive utilities
  responsive: {
    containerWidth: '1280px',
    containerPadding: '16px',
  },

  // Animation utilities
  animations: {
    fadeIn: 'fadeIn 0.3s ease-in-out',
    slideUp: 'slideUp 0.3s ease-in-out',
    slideDown: 'slideDown 0.3s ease-in-out',
    scaleIn: 'scaleIn 0.2s ease-in-out',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },

  // Focus styles
  focusRing: {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(79, 143, 255, 0.1), 0 0 0 4px #4f8fff',
  },

  // Truncate utilities
  truncate: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

  lineClamp: (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }),
};
