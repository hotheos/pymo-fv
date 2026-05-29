"use client";

import React, { useState, useEffect } from "react";

interface ProductImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    fallbackSrc?: string;
}

export default function ProductImage({
    src,
    alt,
    className,
    fallbackSrc = "/product-placeholder.png",
    ...props
}: ProductImageProps) {
    const [imageError, setImageError] = useState(false);

    // Reset error state only if the src prop actually changes to a new URL
    useEffect(() => {
        if (src) {
            setImageError(false);
        }
    }, [src]);

    // If no src is provided, we treat it as an error state immediately to show fallback
    const isNoSource = !src || src === "";

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* LAYER 1: The Safety Net (Placeholder) */}
            {/* Always rendered. We remove -z-10 to prevent it from hiding behind parent backgrounds. */}
            <img
                src={fallbackSrc}
                alt="placeholder"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* LAYER 2: The Hero (Product Image) */}
            {/* Renders on top with relative positioning to ensure it covers the absolute placeholder. */}
            {!isNoSource && (
                <img
                    src={src!}
                    alt={alt || "Imagen del producto"}
                    className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${imageError ? "opacity-0" : "opacity-100"
                        }`}
                    onError={(e) => {
                        // Crucial: Simply mark as error to trigger fade-out.
                        // No logic to swap src, no infinite loops.
                        // Just "If you fail, step aside".
                        setImageError(true);
                        if (props.onError) props.onError(e);
                    }}
                    loading="lazy"
                    {...props}
                />
            )}
        </div>
    );
}
