/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'lift-sm': '0 1px 2px hsl(215 28% 12% / 0.04), 0 4px 12px hsl(215 28% 12% / 0.04)',
        lift: '0 2px 4px hsl(215 28% 12% / 0.04), 0 12px 28px hsl(215 28% 12% / 0.06)',
        'lift-lg': '0 4px 8px hsl(215 28% 12% / 0.05), 0 24px 48px hsl(215 28% 12% / 0.08)',
        // Legacy aliases mapped to neutral shadows so old classnames don't glow purple
        'soft-sm': '0 1px 2px hsl(215 28% 12% / 0.04), 0 4px 12px hsl(215 28% 12% / 0.04)',
        soft: '0 2px 4px hsl(215 28% 12% / 0.04), 0 12px 28px hsl(215 28% 12% / 0.06)',
        'soft-lg': '0 4px 8px hsl(215 28% 12% / 0.05), 0 24px 48px hsl(215 28% 12% / 0.08)',
        'soft-xl': '0 8px 16px hsl(215 28% 12% / 0.06), 0 32px 64px hsl(215 28% 12% / 0.1)',
        'glow-violet': '0 2px 4px hsl(215 28% 12% / 0.04), 0 12px 28px hsl(215 28% 12% / 0.06)',
        'glow-pink': '0 2px 4px hsl(215 28% 12% / 0.04), 0 12px 28px hsl(215 28% 12% / 0.06)',
        'glow-amber': '0 4px 16px hsl(32 92% 44% / 0.25)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 2px)',
        '2xl': 'calc(var(--radius) + 6px)',
        '3xl': 'calc(var(--radius) + 10px)'
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s cubic-bezier(0.23, 1, 0.32, 1) both',
        'fade-in-up': 'fade-in-up 0.25s cubic-bezier(0.23, 1, 0.32, 1) both',
        shimmer: 'shimmer 1.6s linear infinite'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
