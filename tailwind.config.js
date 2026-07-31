/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090C",
        surface: "#0F1117",
        panel: "#161922",
        border: "#232734",
        accent: {
          cyan: "#00F0FF",
          purple: "#7000FF",
          emerald: "#00FF66",
          rose: "#FF0055",
          amber: "#FFB800"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 240, 255, 0.25)',
        'glow-purple': '0 0 20px rgba(112, 0, 255, 0.25)',
        'glow-rose': '0 0 20px rgba(255, 0, 85, 0.3)',
      }
    },
  },
  plugins: [],
}
