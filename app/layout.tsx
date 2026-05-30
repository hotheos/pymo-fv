import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockProvider } from "@/context/MockContext";
import { TenantProvider } from "@/context/TenantContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GlobalScrollHandler from "./components/GlobalScrollHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pymo - Fuerza de Ventas",
    description: "Gestiona tu ruta de ventas, visitas a clientes, pedidos y catálogo de productos desde cualquier dispositivo.",
    icons: {
        icon: "/fav.ico",
        apple: "/logo.png",
    },
    metadataBase: new URL("https://pymo-fv.vercel.app"),
    openGraph: {
        title: "Pymo - Fuerza de Ventas",
        description: "Gestiona tu ruta de ventas, visitas a clientes, pedidos y catálogo de productos desde cualquier dispositivo.",
        url: "https://pymo-fv.vercel.app",
        siteName: "Pymo",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Pymo - Fuerza de Ventas",
            },
        ],
        locale: "es_CO",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pymo - Fuerza de Ventas",
        description: "Gestiona tu ruta de ventas, visitas a clientes, pedidos y catálogo de productos.",
        images: ["/og-image.png"],
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
                            <GlobalScrollHandler />
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
