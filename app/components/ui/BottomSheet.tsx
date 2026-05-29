"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
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

    if (!mounted) return null;

    // Render directly in component tree for simplicity first, or portal if issues arise with z-index.
    // Using portal is safer for overlays.
    if (!isOpen && !animate) return null;

    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div
                className={`bg-white dark:bg-dark-800 w-full max-w-md rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto overscroll-contain ${animate ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Handle */}
                <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-dark-600 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {title && (
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                            {/* Optional close button if handle isn't enough */}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
