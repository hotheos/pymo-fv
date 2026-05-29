"use client";

import { useState } from "react";
import { useMock } from "../context/MockContext";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ArrowLeft, AlertCircle } from "lucide-react";
import ProductSheet from "../components/ProductSheet";
import { Product } from "../types";
import ProductImage from "../components/ui/ProductImage";

export default function CatalogPage() {
    const { products, cart, activeClientNit, saveCart } = useMock();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStockBadge = (stock: number) => {
        if (stock === 0) return { color: "bg-red-100 text-red-700", text: "AGOTADO" };
        if (stock < 10) return { color: "bg-amber-100 text-amber-700", text: "ÚLTIMAS UNIDADES" };
        return { color: "bg-emerald-100 text-emerald-700", text: "DISPONIBLE" };
    };

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
        router.back();
    };

    const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-dark-900 transition-colors">
            {/* Sticky Header - Fixed */}
            <header className="flex-none z-20 bg-[#F8FAFC] dark:bg-dark-900 shadow-sm px-4 pt-4 pb-4 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={handleBack} className="p-2 -ml-2 text-slate-400">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Catálogo</h1>
                    <div className="ml-auto relative" onClick={() => router.push("/cart")}>
                        <ShoppingCart className="text-slate-600 dark:text-slate-300" size={24} />
                        {cartTotalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {cartTotalItems}
                            </span>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por Nombre, SKU..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* Product List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 pb-32">
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

                        <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">{product.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mb-2">{product.sku}</p>

                            <div className="flex items-center justify-between mt-2">
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">${product.price.toLocaleString()}</p>

                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStockBadge(product.stock).color}`}>
                                    {getStockBadge(product.stock).text}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No se encontraron productos.</p>
                    </div>
                )}
            </div>

            <ProductSheet
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
}
