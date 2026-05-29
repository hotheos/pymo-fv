"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setTenantApiConfig } from "@/config/api";

// Hex → HSL converter to derive tenant-tinted dark backgrounds
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Generate tenant-tinted dark palette from primary color
function generateDarkPalette(primaryHex: string) {
    const { h, s } = hexToHSL(primaryHex);
    // Keep the tenant's hue, reduce saturation for subtlety, use very low lightness
    const sat = Math.min(s, 40); // cap saturation so it's tinted, not vivid
    return {
        950: `hsl(${h}, ${sat}%, 4%)`,   // deepest — body bg
        900: `hsl(${h}, ${sat}%, 7%)`,   // main container bg
        800: `hsl(${h}, ${sat}%, 12%)`,  // cards, surfaces
        700: `hsl(${h}, ${sat}%, 18%)`,  // elevated surfaces, inputs
        600: `hsl(${h}, ${sat}%, 25%)`,  // borders, dividers
    };
}

// ═══════════════════════════════════════════
// TENANT CONFIGURATION
// ═══════════════════════════════════════════
//
// ARCHITECTURE:
// One single web app hosted on Pymo's server (pymo.com).
// Each client company accesses via their own subdomain (fruggy.pymo.com).
// Each company has its own local ERP (Mekano), fronted by the Pymo bridge.
// The web app queries the tenant's Pymo bridge via apiBaseUrl; the bridge
// validates the token and proxies to the local Mekano ERP.
//
// SECURITY (see docs/ARQUITECTURA_SEGURIDAD.md):
// Authentication is token-based (JWT issued by the bridge at /auth/login).
// No static API key is shipped to the client. The tenant config below holds
// only the bridge URL and presentation data — never secrets.
// ═══════════════════════════════════════════

export interface TenantConfig {
    slug: string;
    name: string;
    tagline: string;
    logo: string;
    primaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    /** URL of the tenant's Pymo bridge (which fronts the local Mekano ERP) */
    apiBaseUrl: string;
    supportPhone: string;
}

// ═══════════════════════════════════════════
// TENANT REGISTRY
// Mock registry — in production, this comes from Pymo's central API/DB
// To add a new client: just add a new entry here (or in the DB)
// ═══════════════════════════════════════════

const TENANT_REGISTRY: Record<string, TenantConfig> = {
    default: {
        slug: "default",
        name: "Pymo Ventas",
        tagline: "Fuerza de Ventas",
        logo: "/logo.png",
        primaryColor: "#4B91E2",
        gradientFrom: "#49B1F5",
        gradientTo: "#7477D8",
        apiBaseUrl: "http://localhost:8000/api",
        supportPhone: "+573001234567",
    },
    fruggy: {
        slug: "fruggy",
        name: "Fruggy Market",
        tagline: "Fuerza de Ventas",
        logo: "/logo.png",
        primaryColor: "#22C55E",
        gradientFrom: "#22C55E",
        gradientTo: "#16A34A",
        apiBaseUrl: "https://fruggy-local.pymo.io/api",
        supportPhone: "+573009876543",
    },
    distribuidora: {
        slug: "distribuidora",
        name: "Distribuidora Central",
        tagline: "Fuerza de Ventas",
        logo: "/logo.png",
        primaryColor: "#F59E0B",
        gradientFrom: "#F59E0B",
        gradientTo: "#D97706",
        apiBaseUrl: "https://distri-local.pymo.io/api",
        supportPhone: "+573005551234",
    },
    demo: {
        slug: "demo",
        name: "Demo Empresa",
        tagline: "Tienda de demostración",
        logo: "/logo.png",
        primaryColor: "#8B5CF6",
        gradientFrom: "#8B5CF6",
        gradientTo: "#6D28D9",
        apiBaseUrl: "https://demo-local.pymo.io/api",
        supportPhone: "+573005555555",
    },
};

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

interface TenantContextType {
    tenant: TenantConfig;
    isResolved: boolean;
}

const TenantContext = createContext<TenantContextType>({
    tenant: TENANT_REGISTRY.default,
    isResolved: false,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<TenantConfig>(TENANT_REGISTRY.default);
    const [isResolved, setIsResolved] = useState(false);

    useEffect(() => {
        const hostname = window.location.hostname;
        let slug = "default";

        // Production: extract slug from subdomain
        if (hostname.includes(".") && !hostname.startsWith("localhost")) {
            const parts = hostname.split(".");
            if (parts.length >= 2 && parts[0] !== "www") {
                slug = parts[0].toLowerCase();
            }
        }

        // Development: support ?tenant=xxx query param
        const params = new URLSearchParams(window.location.search);
        const tenantParam = params.get("tenant");
        if (tenantParam) {
            slug = tenantParam.toLowerCase();
        }

        const resolved = TENANT_REGISTRY[slug] || TENANT_REGISTRY.default;
        setTenant(resolved);
        setIsResolved(true);

        // Configure API client with the tenant's bridge URL (auth is via token)
        setTenantApiConfig(resolved.apiBaseUrl);

        // Inject CSS variables for dynamic theming
        document.documentElement.style.setProperty("--tenant-primary", resolved.primaryColor);
        document.documentElement.style.setProperty("--tenant-gradient-from", resolved.gradientFrom);
        document.documentElement.style.setProperty("--tenant-gradient-to", resolved.gradientTo);

        // Inject dark mode palette — tinted by tenant's primary color hue
        const darkPalette = generateDarkPalette(resolved.primaryColor);
        document.documentElement.style.setProperty("--dark-950", darkPalette[950]);
        document.documentElement.style.setProperty("--dark-900", darkPalette[900]);
        document.documentElement.style.setProperty("--dark-800", darkPalette[800]);
        document.documentElement.style.setProperty("--dark-700", darkPalette[700]);
        document.documentElement.style.setProperty("--dark-600", darkPalette[600]);
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, isResolved }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    return useContext(TenantContext);
}
