"use client";

import { useState, useEffect } from "react";
import { useMock } from "../context/MockContext";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ArrowLeft, AlertCircle, Save, LayoutGrid } from "lucide-react";
import ProductSheet from "../components/ProductSheet";
import { Product } from "../types";
import ProductImage from "../components/ui/ProductImage";

export default function CatalogPage() {
    const { products, cart, activeClientNit, saveCart, getCart } = useMock();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [sortBy, setSortBy] = useState<"abc" | "category" | "stock" | "price-desc" | "price-asc">("abc");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredProducts = products
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Regla de Oro: Productos agotados (stock === 0) siempre van al final
            if (a.stock === 0 && b.stock > 0) return 1;
            if (b.stock === 0 && a.stock > 0) return -1;
            if (a.stock === 0 && b.stock === 0) return a.name.localeCompare(b.name);

            // Ordenamiento por criterio seleccionado para los productos disponibles
            if (sortBy === "abc") {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === "category") {
                const catCompare = a.category.localeCompare(b.category);
                if (catCompare !== 0) return catCompare;
                return a.name.localeCompare(b.name);
            }
            if (sortBy === "stock") {
                return b.stock - a.stock;
            }
            if (sortBy === "price-desc") {
                return b.price - a.price;
            }
            if (sortBy === "price-asc") {
                return a.price - b.price;
            }
            return 0;
        });

    const handleProductClick = (product: Product) => {
        if (product.stock > 0) {
            setSelectedProduct(product);
        }
    };

    // Save cart when leaving catalog (simulates PUT /clientes/:nit/carrito)
    const handleBack = () => {
        if (activeClientNit) {
            saveCart(activeClientNit);
        }
        router.push("/");
    };

    const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const savedCart = activeClientNit ? getCart(activeClientNit) : [];
    const hasChanges = (() => {
        if (!activeClientNit) return false;
        if (cart.length !== savedCart.length) return true;
        for (const item of cart) {
            const savedItem = savedCart.find(s => s.productId === item.productId);
            if (!savedItem || savedItem.quantity !== item.quantity) return true;
        }
        return false;
    })();

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-dark-900 transition-colors">
            {/* Sticky Header: Fixed */}
            <header className="flex-none z-20 bg-[#F8FAFC] dark:bg-dark-900 shadow-sm px-4 pt-4 pb-4 transition-colors">
                <div className="relative flex items-center justify-between h-10 w-full mb-4">
                    {/* Left Button */}
                    <button
                        onClick={handleBack}
                        style={{
                            transition: hasChanges
                                ? "background-color 300ms ease-out, width 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms, padding 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms"
                                : "width 400ms cubic-bezier(0.16, 1, 0.3, 1), padding 400ms cubic-bezier(0.16, 1, 0.3, 1), background-color 300ms ease-out 200ms"
                        }}
                        className={`
                            relative h-10 flex items-center rounded-full overflow-hidden active:scale-95 flex-shrink-0 z-10
                            ${hasChanges 
                                ? "bg-amber-400 text-slate-950 pl-2.5 pr-4 gap-2 w-32 shadow-md justify-start -ml-2" 
                                : "bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800/60 w-10 justify-center -ml-2"
                            }
                        `}
                        type="button"
                    >
                        <ArrowLeft 
                            size={20} 
                            className={`transition-colors duration-300 flex-shrink-0 ${hasChanges ? "stroke-[2.5] text-slate-950" : "text-slate-500 dark:text-slate-400"}`} 
                        />

                        {/* Expanding section with Save icon and text */}
                        <div 
                            style={{
                                transition: hasChanges
                                    ? "opacity 300ms ease-out 300ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) 250ms"
                                    : "opacity 150ms ease-out, transform 150ms ease-out"
                            }}
                            className={`
                                flex items-center gap-1.5 flex-shrink-0
                                ${hasChanges 
                                    ? "opacity-100 translate-x-0" 
                                    : "opacity-0 translate-x-4 pointer-events-none w-0"
                                }
                            `}
                        >
                            <Save size={15} className="stroke-[2.5] flex-shrink-0 text-slate-950" />
                            <span className="font-extrabold text-[11px] tracking-wider flex-shrink-0 text-slate-950">GUARDAR</span>
                        </div>
                    </button>

                    {/* Centered Title */}
                    <h1 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap z-0">
                        Catálogo
                    </h1>

                    {/* Right Navigation Switch Pill */}
                    <button
                        onClick={() => router.push("/cart")}
                        className="relative flex items-center bg-slate-100/50 dark:bg-dark-800 p-[2px] rounded-full h-8 w-[72px] z-10 ml-auto select-none border border-slate-300/85 dark:border-dark-600 overflow-hidden active:scale-95 transition-transform duration-200 cursor-pointer"
                        title="Ir al Resumen del Pedido"
                        type="button"
                    >
                        {/* Sliding highlight indicator */}
                        <div 
                            className="absolute top-[2px] bottom-[2px] w-[32px] rounded-full bg-primary shadow-sm transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform translate-x-0"
                            style={{ left: "2px" }}
                        />

                        {/* Catalog Icon Container */}
                        <div className="w-[32px] h-full flex items-center justify-center relative z-10 text-white">
                            <LayoutGrid size={15} className="stroke-[2.2]" />
                        </div>

                        {/* Spacer between switch elements */}
                        <div className="w-[4px] h-full" />

                        {/* Cart Icon Container */}
                        <div className="w-[32px] h-full flex items-center justify-center relative z-10 text-slate-400 dark:text-slate-500 transition-colors duration-300">
                            <ShoppingCart size={15} className="stroke-[2.2]" />
                        </div>
                    </button>
                </div>

                {/* Search & Order Filter Container */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, SKU..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Custom Order Selection Dropdown */}
                    <div className="relative md:w-64 w-full flex-shrink-0">
                        {/* Clickable Header Box */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-white dark:bg-dark-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200/50 dark:border-dark-700/80 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer text-left"
                            type="button"
                            title="Seleccionar criterio de ordenamiento"
                        >
                            {/* Left Label with Icon */}
                            <div className="flex items-center gap-2 flex-shrink-0 pointer-events-none">
                                <span className="text-primary flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m0 0v1.5m0-1.5L13 18m0 0l3-3m-3 3l-3-3" />
                                    </svg>
                                </span>
                                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                                    Ordenar por
                                </span>
                            </div>

                            {/* Visual Option Text & Chevron */}
                            <div className="flex items-center gap-2 min-w-0 pr-1 pl-4 flex-1 justify-end pointer-events-none">
                                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-200 truncate">
                                    {sortBy === "abc" && "ABC (A-Z)"}
                                    {sortBy === "category" && "Categoría"}
                                    {sortBy === "stock" && "Disponibilidad"}
                                    {sortBy === "price-desc" && "Precio Alto"}
                                    {sortBy === "price-asc" && "Precio Bajo"}
                                </span>
                                <span className={`text-slate-400 dark:text-slate-500 flex-shrink-0 flex items-center justify-center transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}>
                                    <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </span>
                            </div>
                        </button>

                        {/* Dropdown Options List */}
                        {isDropdownOpen && (
                            <>
                                {/* Overlay to close dropdown when clicking outside */}
                                <div 
                                    className="fixed inset-0 z-20 cursor-default animate-none" 
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-high border border-slate-150 dark:border-dark-700/80 overflow-hidden z-30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {[
                                        { value: "abc", label: "ABC (Nombre A-Z)" },
                                        { value: "category", label: "Categoría (Agrupar por Tipo)" },
                                        { value: "stock", label: "Mayor Disponibilidad" },
                                        { value: "price-desc", label: "Precio: Mayor a Menor" },
                                        { value: "price-asc", label: "Precio: Menor a Mayor" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setSortBy(opt.value as any);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                                sortBy === opt.value 
                                                    ? "text-primary bg-primary/5 font-extrabold dark:bg-primary/10" 
                                                    : "text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-dark-700/40 hover:text-slate-800 dark:hover:text-slate-100"
                                            }`}
                                            type="button"
                                        >
                                            <span>{opt.label}</span>
                                            {sortBy === opt.value && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Product List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 pb-32 transition-all">
                <div className="mx-auto w-full gap-4 transition-all duration-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className={`flex items-start gap-4 p-3 rounded-xl border border-slate-100 dark:border-dark-600 shadow-sm active:scale-[0.98] transition-all bg-white dark:bg-dark-800 ${product.stock === 0 ? 'opacity-70' : ''}`}
                        >
                            {/* Product Image */}
                            <div className="bg-slate-50 dark:bg-dark-700 w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-dark-600">
                                <ProductImage
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between h-24">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 text-sm truncate">{product.name}</h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                        Disponibilidad: <span className={product.stock === 0 ? "text-red-500 font-bold animate-pulse" : "text-slate-650 dark:text-slate-300 font-extrabold"}>{product.stock}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <p className="font-black text-slate-900 dark:text-slate-100 text-base">${product.price.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-slate-400 w-full col-span-full">
                            <p>No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            </div>

            <ProductSheet
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
}
