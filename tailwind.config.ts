import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        ink: "var(--ink)",
        surface: "var(--surface)",
      },
    },
  },
  plugins: [],
} satisfies Config;
