import type { Config } from "tailwindcss";

/**
 * PlanForge dark-only design tokens.
 * Prinsip diadaptasi dari brief "midnight precision instrument", dengan identitas
 * sendiri: aksen Signal Teal untuk alur kerja, bukan acid-lime dekoratif.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // --- Surfaces ---
        void: "#08090a",
        carbon: "#0f1011",
        obsidian: "#161718",
        slate: "#23252a",
        // --- Text ---
        paper: "#ffffff",
        mist: "#d0d6e0",
        fog: "#8a8f98",
        ash: "#62666d",
        // --- Accent (tunggal) ---
        accent: {
          DEFAULT: "#02b8cc",
          strong: "#17d2e6",
          soft: "rgba(2, 184, 204, 0.12)",
          foreground: "#04262b",
        },
        // --- Status (semantik, bukan dekorasi) ---
        success: "#27a644",
        danger: "#eb5757",
        // --- Semantik agar komponen ui tetap bekerja ---
        background: "#08090a",
        foreground: "#d0d6e0",
        border: "#23252a",
        input: "#23252a",
        ring: "#02b8cc",
        muted: {
          DEFAULT: "#161718",
          foreground: "#8a8f98",
        },
        card: {
          DEFAULT: "#0f1011",
          foreground: "#d0d6e0",
        },
      },
      borderColor: {
        DEFAULT: "#23252a",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "12px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tight: "-0.011em",
        display: "-0.022em",
      },
      boxShadow: {
        // Elevasi lewat hairline inset, bukan drop-shadow tumpuk
        hairline: "inset 0 0 0 1px #23252a",
        overlay: "0 4px 32px rgba(8, 9, 10, 0.6)",
      },
      transitionDuration: {
        ui: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
