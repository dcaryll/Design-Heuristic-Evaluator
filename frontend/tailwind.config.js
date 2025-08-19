/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Red Hat Display', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body': ['Red Hat Text', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Red Hat Design System icon tokens
      spacing: {
        'rh-icon-01': 'var(--rh-size-icon-01, 16px)',
        'rh-icon-04': 'var(--rh-size-icon-04, 40px)',
      },
      colors: {
        // Red Hat Design System color tokens
        'rh-brand-red': {
          DEFAULT: 'var(--rh-color-brand-red, #ee0000)',
          'on-light': 'var(--rh-color-brand-red-on-light, #ee0000)',
          'on-dark': 'var(--rh-color-brand-red-on-dark, #ee0000)',
        },
        'rh-accent': {
          'base': 'var(--rh-color-accent-base, #0066cc)',
          'brand': 'var(--rh-color-accent-brand, #ee0000)',
        },
        'rh-text': {
          'primary': 'var(--rh-color-text-primary, #151515)',
          'secondary': 'var(--rh-color-text-secondary, #6a6e73)',
        },
        'rh-surface': {
          'lightest': 'var(--rh-color-surface-lightest, #ffffff)',
          'lighter': 'var(--rh-color-surface-lighter, #f2f2f2)',
          'dark': 'var(--rh-color-surface-dark, #1f1f1f)',
        },
        'rh-status': {
          'success': 'var(--rh-color-status-success, #3e8635)',
          'warning': 'var(--rh-color-status-warning, #f0ab00)',
          'danger': 'var(--rh-color-status-danger, #c9190b)',
          'info': 'var(--rh-color-status-info, #0066cc)',
        },
        'rh-yellow': {
          '50': 'var(--rh-color-yellow-50, #fffbf0)',
        },
        'rh-interactive': {
          'blue': 'var(--rh-color-interactive-blue-default, #0066cc)',
          'blue-hover': 'var(--rh-color-interactive-blue-hover, #004080)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};