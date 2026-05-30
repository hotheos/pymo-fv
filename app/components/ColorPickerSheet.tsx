"use client";

import { Check, RotateCcw, Palette } from "lucide-react";
import { useTenant, THEME_COLORS, ThemeColor } from "@/context/TenantContext";
import BottomSheet from "./ui/BottomSheet";

interface ColorPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ColorPickerSheet({ isOpen, onClose }: ColorPickerSheetProps) {
    const { currentColor, applyColor, resetColor, isCustomColorActive, tenant } = useTenant();

    const handleSelectColor = (color: ThemeColor) => {
        applyColor(color);
        onClose();
    };

    const handleReset = () => {
        resetColor();
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Palette size={20} className="text-primary" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">
                        Personalizar Tema
                    </h2>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center -mt-3">
                    Selecciona un color para cambiar la identidad visual de la aplicación.
                </p>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-x-3 gap-y-5 py-2">
                    {THEME_COLORS.map((color) => {
                        const isActive = currentColor?.primary.toLowerCase() === color.primary.toLowerCase();
                        
                        return (
                            <button
                                key={color.name}
                                onClick={() => handleSelectColor(color)}
                                className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-95 transition-transform"
                                type="button"
                            >
                                {/* Color circle */}
                                <div
                                    style={{
                                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`
                                    }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center relative shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
                                        isActive 
                                            ? "ring-4 ring-offset-2 ring-primary dark:ring-offset-dark-800 scale-105" 
                                            : "hover:brightness-105 border border-slate-100 dark:border-dark-600"
                                    }`}
                                >
                                    {isActive && (
                                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                                            <Check size={16} className="text-white drop-shadow-md stroke-[3]" />
                                        </div>
                                    )}
                                </div>

                                {/* Color name */}
                                <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${
                                    isActive 
                                        ? "text-primary font-black" 
                                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                }`}>
                                    {color.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tenant Default / Reset Section */}
                {isCustomColorActive && (
                    <div className="pt-2 border-t border-slate-100 dark:border-dark-700">
                        <button
                            onClick={handleReset}
                            style={{
                                background: `linear-gradient(135deg, ${tenant.gradientFrom}, ${tenant.gradientTo})`
                            }}
                            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                            type="button"
                        >
                            <RotateCcw size={16} className="text-white" />
                            <span>Restablecer tema original ({tenant.name})</span>
                        </button>
                    </div>
                )}
            </div>
        </BottomSheet>
    );
}
