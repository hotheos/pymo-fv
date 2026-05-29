"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface ProductImageProps {
    src?: string | null;
    alt?: string;
    className?: string;
    fallbackSrc?: string;
    /** Sizes hint for responsive loading (default: thumbnails) */
    sizes?: string;
    /** Priority loading (use for above-the-fold images) */
    priority?: boolean;
}

/**
 * Product image component using next/image for automatic WebP/AVIF
 * conversion, responsive sizing, and lazy loading.
 *
 * Falls back to a placeholder when the source is missing or fails to load.
 */
export default function ProductImage({
    src,
    alt,
    className,
    fallbackSrc = "/product-placeholder.png",
    sizes = "(max-width: 768px) 96px, 128px",
    priority = false,
}: ProductImageProps) {
    const [imageError, setImageError] = useState(false);

    // Reset error state when src changes
    useEffect(() => {
        if (src) {
            setImageError(false);
        }
    }, [src]);

    const isNoSource = !src || src === "";
    const showFallback = isNoSource || imageError;

    // Detect if source is external (starts with http) or local
    const isExternal = src?.startsWith("http");

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* LAYER 1: Placeholder (always rendered as safety net) */}
            <Image
                src={fallbackSrc}
                alt="placeholder"
                fill
                className="object-cover"
                sizes={sizes}
            />

            {/* LAYER 2: Product image (covers placeholder when loaded) */}
            {!showFallback && (
                <Image
                    src={src!}
                    alt={alt || "Imagen del producto"}
                    fill
                    className={`object-cover transition-opacity duration-300 ${imageError ? "opacity-0" : "opacity-100"}`}
                    sizes={sizes}
                    loading={priority ? undefined : "lazy"}
                    priority={priority}
                    onError={() => setImageError(true)}
                    {...(isExternal ? { unoptimized: false } : {})}
                />
            )}
        </div>
    );
}
