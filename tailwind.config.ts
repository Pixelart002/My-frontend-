import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
 darkMode: ["class"],
 content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
 ],
 theme: {
  extend: {
   colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: {
     DEFAULT: "hsl(var(--card))",
     foreground: "hsl(var(--card-foreground))",
    },
    popover: {
     DEFAULT: "hsl(var(--popover))",
     foreground: "hsl(var(--popover-foreground))",
    },
    primary: {
     DEFAULT: "hsl(var(--primary))",
     foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
     DEFAULT: "hsl(var(--secondary))",
     foreground: "hsl(var(--secondary-foreground))",
    },
    muted: {
     DEFAULT: "hsl(var(--muted))",
     foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
     DEFAULT: "hsl(var(--accent))",
     foreground: "hsl(var(--accent-foreground))",
    },
    destructive: {
     DEFAULT: "hsl(var(--destructive))",
     foreground: "hsl(var(--destructive-foreground))",
    },
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
   },
   borderRadius: {
    lg: "var(--radius)",
    md: "calc(var(--radius) - 2px)",
    sm: "calc(var(--radius) - 4px)",
   },
   fontFamily: {
    sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
    mono: ["var(--font-geist-mono)", "monospace"],
   },
   keyframes: {
    "accordion-down": {
     from: { height: "0" },
     to: { height: "var(--radix-accordion-content-height)" },
    },
    "accordion-up": {
     from: { height: "var(--radix-accordion-content-height)" },
     to: { height: "0" },
    },
    shimmer: {
     "0%": { backgroundPosition: "-200% 0" },
     "100%": { backgroundPosition: "200% 0" },
    },
    "fade-in": {
     from: { opacity: "0", transform: "translateY(10px)" },
     to: { opacity: "1", transform: "translateY(0)" },
    },
    "slide-in": {
     from: { transform: "translateX(100%)" },
     to: { transform: "translateX(0)" },
    },
   },
   animation: {
    "accordion-down": "accordion-down 0.2s ease-out",
    "accordion-up": "accordion-up 0.2s ease-out",
    shimmer: "shimmer 2s linear infinite",
    "fade-in": "fade-in 0.3s ease-out",
    "slide-in": "slide-in 0.3s ease-out",
   },
  },
 },
 // ✅ FIX: require() CommonJS tha — ESM project mein silently fail ho sakta hai
 // import syntax use kiya — guaranteed kaam karega Next.js 15 + ESM mein
 plugins: [tailwindcssAnimate],
};

export default config;