/**
 * API Configuration — Token-based auth (JWT) against the Pymo bridge
 *
 * ARCHITECTURE:
 *   - Pymo Fuerza de Ventas (this app) NEVER talks to Mekano directly.
 *   - It talks to the Pymo bridge (one instance per tenant), which validates
 *     the token and proxies the request to the tenant's local Mekano ERP.
 *   - TenantContext resolves the correct bridge base URL per subdomain.
 *
 * SECURITY MODEL (see docs/ARQUITECTURA_SEGURIDAD.md):
 *   - The real authentication is the JWT obtained at login (POST /auth/login).
 *   - The token is signed with a secret that lives ONLY on the Pymo bridge.
 *   - Every request carries `Authorization: Bearer <token>`; the bridge extracts
 *     the id_vendedor from the token and filters all data by it (filtro maestro).
 *   - No static API key is shipped to the browser — the token is the boundary.
 */

// ─── Global Config ──────────────────────────────────────────────

export const API_CONFIG = {
    /** Bridge base URL — fallback if no tenant resolved. Not a secret. */
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
} as const;

// ─── Mutable Runtime Config (set by TenantContext) ───────────────

let _runtimeBaseUrl: string | null = null;

/** Called by TenantContext to set the tenant-specific bridge base URL */
export function setTenantApiConfig(baseUrl: string): void {
    _runtimeBaseUrl = baseUrl;
}

/** Get the effective base URL (tenant override → env → default) */
export function getBaseUrl(): string {
    return _runtimeBaseUrl || API_CONFIG.baseUrl;
}

// ─── Bearer Token Management ────────────────────────────────────

let _authToken: string | null = null;

/** Store the JWT token after login */
export function setAuthToken(token: string | null): void {
    _authToken = token;
}

/** Get the current JWT token. Returns null if not logged in */
export function getAuthToken(): string | null {
    return _authToken;
}

// ─── URL Builder ────────────────────────────────────────────────

/**
 * Builds a full API endpoint URL using the tenant-resolved bridge base URL.
 * @example apiUrl("/productos") → "https://fruggy-local.pymo.io/api/productos"
 */
export function apiUrl(path: string): string {
    const base = getBaseUrl().replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

// ─── Headers ────────────────────────────────────────────────────

/**
 * Returns standard headers for API requests.
 * Auth is carried by the Bearer token; there is no static API key.
 */
export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (_authToken) {
        headers["Authorization"] = `Bearer ${_authToken}`;
    }

    return { ...headers, ...extra };
}

// ─── Fetch Wrapper ──────────────────────────────────────────────

/**
 * Convenience wrapper for fetch with tenant-aware config.
 * Automatically sets: base URL, Bearer token, and JSON content type.
 *
 * @example
 *   // Login (no Bearer token yet)
 *   const res = await apiFetch("/auth/login", {
 *       method: "POST",
 *       body: JSON.stringify({ id_vendedor: "1", password: "123" }),
 *   });
 *
 *   // After login (Bearer token added automatically)
 *   const products = await apiFetch("/productos");
 */
export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const url = apiUrl(path);
    const headers = apiHeaders(
        options.headers as Record<string, string> | undefined
    );

    return fetch(url, {
        ...options,
        headers,
    });
}
