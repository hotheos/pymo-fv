"use client";

import { useEffect } from "react";

export default function GlobalScrollHandler() {
    useEffect(() => {
        const findScrollableElement = (): HTMLElement | null => {
            const scrollableElements = Array.from(
                document.querySelectorAll(".overflow-y-auto, [style*='overflow-y: auto'], [style*='overflow-y: scroll']")
            );
            // Recorrer en orden inverso (del final al principio) para priorizar modales o bottom sheets activos al frente
            for (let i = scrollableElements.length - 1; i >= 0; i--) {
                const el = scrollableElements[i] as HTMLElement;
                if (el.scrollHeight > el.clientHeight && el.getBoundingClientRect().height > 0) {
                    return el;
                }
            }
            return null;
        };

        const handleGlobalWheel = (event: WheelEvent) => {
            let target = event.target as HTMLElement | null;
            let isInsideScrollable = false;

            // Determinar si el evento de scroll ya ocurrió dentro de un contenedor scrollable activo
            while (target && target !== document.body && target !== document.documentElement) {
                const styles = window.getComputedStyle(target);
                const isScrollableStyle = styles.overflowY === "auto" || styles.overflowY === "scroll";
                const hasScrollableContent = target.scrollHeight > target.clientHeight;

                if (isScrollableStyle && hasScrollableContent) {
                    isInsideScrollable = true;
                    break;
                }
                target = target.parentElement;
            }

            // Si el scroll se inició en los laterales grises (fuera de cualquier contenedor con scroll)
            if (!isInsideScrollable) {
                const scrollable = findScrollableElement();
                if (scrollable) {
                    // Redirigir el scroll vertical del mouse al contenedor activo
                    scrollable.scrollTop += event.deltaY;
                    event.preventDefault();
                }
            }
        };

        window.addEventListener("wheel", handleGlobalWheel, { passive: false });

        return () => {
            window.removeEventListener("wheel", handleGlobalWheel);
        };
    }, []);

    return null;
}
