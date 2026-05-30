"use client";

import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    theme?: "danger" | "warning" | "primary";
    customIcon?: React.ReactNode;
    imageSrc?: string;
    imageSrcDark?: string; // New prop for dark mode optimized illustrations
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    theme = "danger",
    customIcon,
    imageSrc,
    imageSrcDark,
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setTimeout(() => setAnimate(true), 10);
        } else {
            setAnimate(false);
            const timer = setTimeout(() => {
                document.body.style.overflow = "";
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || (!isOpen && !animate)) return null;

    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box - completely black in dark mode (dark:bg-black) with fine border */}
            <div
                className={`bg-white dark:bg-black border border-slate-100 dark:border-dark-750 w-full max-w-xs rounded-3xl shadow-2xl p-6 relative transform transition-all duration-300 ease-out z-10 ${
                    animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                }`}
            >
                {/* Premium Illustration or Warning Icon Container */}
                {imageSrc ? (
                    <div className="mx-auto w-32 h-32 mb-4 flex items-center justify-center flex-shrink-0 relative">
                        {/* Light Mode Illustration */}
                        <img 
                            src={imageSrc} 
                            alt="Illustration" 
                            className="w-full h-full object-contain rounded-2xl dark:hidden" 
                        />
                        {/* Dark Mode Illustration */}
                        <img 
                            src={imageSrcDark ? imageSrcDark : imageSrc} 
                            alt="Illustration Dark" 
                            className="w-full h-full object-contain rounded-2xl hidden dark:block" 
                        />
                    </div>
                ) : (
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 flex-shrink-0 ${
                        theme === "danger"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                            : theme === "warning"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                            : "bg-primary/10 text-primary"
                    }`}>
                        {customIcon ? customIcon : <AlertTriangle size={24} className="stroke-[2.5]" />}
                    </div>
                )}

                {/* Text Content */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
                    {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-6">
                    {message}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-dark-600 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-dark-700/50 font-bold text-sm transition-all active:scale-95"
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 ${
                            theme === "danger"
                                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:brightness-110 shadow-red-500/20"
                                : theme === "warning"
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 shadow-amber-500/20"
                                : "bg-tenant-gradient shadow-primary/20"
                        }`}
                        type="button"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
