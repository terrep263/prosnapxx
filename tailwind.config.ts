import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)"
        }
      }
    }
  },
  plugins: []
};

export default config;
