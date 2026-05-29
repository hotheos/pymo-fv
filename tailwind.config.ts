import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--tenant-primary)", // Dynamic per tenant — set by TenantContext
                "primary-light": "color-mix(in srgb, var(--tenant-primary) 10%, white)", // Light tint for backgrounds
                background: "#F8FAFC", // Background
                surface: "#FFFFFF", // Surface
                // Dark mode tenant-tinted backgrounds — computed from tenant primary hue
                dark: {
                    950: "var(--dark-950)",  // body bg
                    900: "var(--dark-900)",  // main container
                    800: "var(--dark-800)",  // cards, surfaces
                    700: "var(--dark-700)",  // elevated surfaces, inputs
                    600: "var(--dark-600)",  // borders, dividers
                },
            },
            boxShadow: {
                'high': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
        },
    },
    plugins: [],
};
export default config;
