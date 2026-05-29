"use client";

import { useState } from "react";
import { useMock } from "../context/MockContext";
import { useTenant } from "../context/TenantContext";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/navigation";
import { Badge, Lock, Sun, Moon } from "lucide-react";

export default function LoginPage() {
    const { login } = useMock();
    const { tenant } = useTenant();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError("");
        setIsSubmitting(true);
        try {
            const ok = await login(username, password);
            if (ok) {
                router.push("/");
            } else {
                setError("Credenciales inválidas. Intente con 1/1 o 2/2");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-900 px-6 transition-colors relative">
            {/* Theme Toggle — top right, subtle */}
            <button
                onClick={toggleTheme}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm shadow-sm hover:shadow-md text-slate-500 dark:text-slate-300 transition-all active:scale-90"
                aria-label="Cambiar tema"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-full max-w-sm">
                {/* Branding — dynamic per tenant */}
                <div className="flex flex-col items-center mb-8">
                    <img src={theme === 'dark' ? "/logo-white.png" : tenant.logo} alt={tenant.name} className="w-[220px] object-contain mb-4" />
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{tenant.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-[0.2em] uppercase">{tenant.tagline}</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Badge className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ID Vendedor"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium bg-white dark:bg-dark-800"
                                style={{ "--tw-ring-color": `${tenant.primaryColor}40` } as React.CSSProperties}
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium bg-white dark:bg-dark-800"
                                style={{ "--tw-ring-color": `${tenant.primaryColor}40` } as React.CSSProperties}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? "OCULTAR" : "VER"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                            background: `linear-gradient(135deg, ${tenant.gradientFrom}, ${tenant.gradientTo})`,
                        }}
                    >
                        {isSubmitting ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                {/* Developer Credit */}
                <div className="mt-12 text-center mb-6">
                    <img src={theme === 'dark' ? "/apolosoft-white.png" : "/apolosoft.png"} alt="Apolosoft" className="w-[140px] mx-auto opacity-50" />
                </div>
            </div>
        </div>
    );
}
