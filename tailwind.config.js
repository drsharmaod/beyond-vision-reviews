/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Beyond Vision brand palette
        gold: {
          50:  "#fdf8ec",
          100: "#faefd0",
          200: "#f4dca2",
          300: "#ecc56a",
          400: "#e4ae3b",
          500: "#C9A84C", // primary brand gold
          600: "#a8862e",
          700: "#876524",
          800: "#6e5024",
          900: "#5d4322",
        },
        brand: {
          black:  "#0a0a0a",
          dark:   "#141414",
          card:   "#1a1a1a",
          border: "#2a2a2a",
          muted:  "#3a3a3a",
          text:   "#b0b0b0",
          gold:   "#C9A84C",
        },
        // Semantic
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#3b82f6",

        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        serif:   ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 2s infinite",
        fadeIn:           "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
