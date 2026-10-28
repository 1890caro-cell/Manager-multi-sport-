import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#f4f4f5',
        card: '#18181b',
        'card-foreground': '#f4f4f5',
        popover: '#18181b',
        'popover-foreground': '#f4f4f5',
        primary: '#10b981',
        'primary-foreground': '#ffffff',
        secondary: '#27272a',
        'secondary-foreground': '#f4f4f5',
        muted: '#27272a',
        'muted-foreground': '#a1a1aa',
        accent: '#27272a',
        'accent-foreground': '#f4f4f5',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#27272a',
        input: '#27272a',
        ring: '#10b981',
      },
    },
  },
  plugins: [],
};
export default config;
