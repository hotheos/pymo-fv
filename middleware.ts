import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — Multi-Tenant Subdomain Routing
 *
 * Extracts the tenant slug from the subdomain of the incoming request
 * and injects it as a header for downstream use.
 *
 * Examples:
 *   distribuidora.pymo.com  →  x-tenant-slug: distribuidora
 *   fruggy.pymo.com         →  x-tenant-slug: fruggy
 *   localhost:3000           →  x-tenant-slug: default
 *   localhost:3000?tenant=fruggy → x-tenant-slug: fruggy
 */

export function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") || "";

    // Extract subdomain
    let tenantSlug = "default";

    if (hostname.includes(".")) {
        // Production: empresaA.pymo.com → "empresaA"
        const parts = hostname.split(".");
        if (parts.length >= 2 && parts[0] !== "www") {
            tenantSlug = parts[0].toLowerCase();
        }
    }

    // For localhost development, check for query param ?tenant=xxx
    if (hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1")) {
        const tenantParam = request.nextUrl.searchParams.get("tenant");
        if (tenantParam) {
            tenantSlug = tenantParam.toLowerCase();
        }
    }

    // Clone headers and inject tenant slug
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", tenantSlug);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    // Run middleware on all routes except static assets
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|fav.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
    ],
};
