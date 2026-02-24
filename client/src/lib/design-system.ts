/**
 * Design System — TypeMyAudio
 *
 * Red primary palette, yellow h1 highlights,
 * dark navy foregrounds, editorial serif + geometric sans headings.
 */

export const colors = {
  primary: {
    DEFAULT: "#DC2626",
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
    950: "#450A0A",
  },
  h1: "#FACC15",
  foreground: {
    DEFAULT: "#1A1B2E",
    muted: "#6B7280",
    subtle: "#9CA3AF",
  },
  background: {
    DEFAULT: "#FFFFFF",
    subtle: "#F9FAFB",
    muted: "#F3F4F6",
  },
  border: {
    DEFAULT: "#E5E7EB",
    hover: "#D1D5DB",
    focus: "#DC2626",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
} as const;

export const typography = {
  fontFamily: {
    heading: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
    editorial: '"DM Serif Display", Georgia, "Times New Roman", serif',
    body: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1.15" }],
    "6xl": ["3.75rem", { lineHeight: "1.1" }],
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

export const spacing = {
  page: {
    maxWidth: "80rem",
    paddingX: "1.5rem",
    paddingY: "1.5rem",
  },
  section: {
    gap: "6rem",
    paddingY: "6rem",
  },
  card: {
    padding: "1.5rem",
    gap: "1rem",
  },
  sidebar: {
    width: "16rem",
  },
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  full: "9999px",
} as const;

export const shadows = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
} as const;

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
