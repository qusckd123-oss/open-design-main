import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        muted: "#667085",
        line: "#E6E8EC",
        panel: "#FFFFFF",
        canvas: "#F7F8FA",
        signal: "#0D9488",
        rise: "#047857",
        fall: "#C2410C",
        navy: "#213547"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16, 24, 40, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;
