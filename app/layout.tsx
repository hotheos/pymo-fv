import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockProvider } from "@/context/MockContext";
import { TenantProvider } from "@/context/TenantContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pymo - Fuerza de Ventas",
    description: "Fuerza de Ventas High Performance",
    icons: {
        icon: "/fav.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-50 dark:bg-dark-950 transition-colors`}>
                <ThemeProvider>
                    <TenantProvider>
                        <MockProvider>
                            <div className="max-w-md lg:max-w-7xl mx-auto min-h-screen bg-white dark:bg-dark-900 shadow-2xl lg:shadow-none relative transition-colors">
                                {children}
                            </div>
                        </MockProvider>
                    </TenantProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
