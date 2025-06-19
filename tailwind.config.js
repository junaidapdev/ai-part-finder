module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", // blue-600
          light: "#3b82f6", // blue-500
          dark: "#1d4ed8", // blue-700
        },
        accent: {
          DEFAULT: "#ff7a1a", // orange
          light: "#ff944d",
          dark: "#cc6200",
        },
        gray: {
          50: "#f6f8fa", // softest
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        success: {
          DEFAULT: "#22c55e", // green-500
          bg: "#dcfce7",
        },
        warning: {
          DEFAULT: "#facc15", // yellow-400
        },
        error: {
          DEFAULT: "#ef4444", // red-500
        },
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(27, 39, 51, 0.06)",
        soft: "0 1.5px 8px 0 rgba(27, 39, 51, 0.04)",
      },
    },
    fontFamily: {
      sans: ["Geist", "Inter", "ui-sans-serif", "system-ui"],
    },
  },
  plugins: [],
};
