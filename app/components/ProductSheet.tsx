"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Product } from "@/types";
import { useMock } from "@/context/MockContext";
import BottomSheet from "./ui/BottomSheet";
import ProductImage from "./ui/ProductImage";

interface ProductSheetProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductSheet({ product, isOpen, onClose }: ProductSheetProps) {
    const { addToCart } = useMock();
    const [quantity, setQuantity] = useState<number | "">(1);

    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1);
        }
    }, [isOpen, product]);

    if (!product) return null;

    const safeQuantity = quantity === "" ? 0 : quantity;
    const total = product.price * safeQuantity;
    const isStockAvailable = product.stock > 0;

    const handleIncrement = () => {
        if (safeQuantity < product.stock) {
            setQuantity(safeQuantity + 1);
        }
    };

    const handleDecrement = () => {
        if (safeQuantity > 1) {
            setQuantity(safeQuantity - 1);
        }
    };

    const handleAddToCart = () => {
        if (safeQuantity > 0) {
            addToCart(product, safeQuantity);
            onClose();
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="space-y-6 pb-6">
                {/* Hero Image */}
                <div className="w-full aspect-video bg-slate-100 dark:bg-dark-700 rounded-xl overflow-hidden relative -mt-2">
                    <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Left-aligned Information Panel */}
                <div className="text-left space-y-3">
                    {/* Product Name: Left-aligned, no price next to it */}
                    <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-tight tracking-tight">
                        {product.name}
                    </h2>

                    {/* Metadata: Code and Availability: Left-aligned in unified styled layout */}
                    <div className="space-y-1 pt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        <div>
                            Código: <span className="font-mono text-slate-700 dark:text-slate-350 font-bold">{product.sku}</span>
                        </div>
                        <div>
                            Disponibilidad: <span className={`font-bold ${isStockAvailable ? 'text-slate-700 dark:text-slate-350' : 'text-red-500 font-bold'}`}>{isStockAvailable ? product.stock : 'Agotado'}</span>
                        </div>
                    </div>

                    {/* Description: Left-aligned, smaller and readable custom font style */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal pt-1">
                        {product.description}
                    </p>
                </div>

                {/* Dynamic Selector & Calculator Block */}
                <div className="border-t border-slate-100 dark:border-dark-600 pt-5">
                    <div className="flex items-end justify-between">
                        {/* Selector Section with Label */}
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-2">
                                Cantidad
                            </span>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-dark-700/50 p-1.5 rounded-full border border-slate-100 dark:border-dark-600">
                                <button
                                    onClick={handleDecrement}
                                    className="w-8 h-8 rounded-full bg-white dark:bg-dark-600 shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-200 active:scale-95 transition-transform"
                                    type="button"
                                >
                                    <Minus size={14} className="stroke-[2.5]" />
                                </button>
                                <div className="w-10">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={quantity}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                setQuantity("");
                                                return;
                                            }
                                            const num = parseInt(val);
                                            if (!isNaN(num)) {
                                                if (num > product.stock) setQuantity(product.stock);
                                                else if (num < 0) setQuantity(1);
                                                else setQuantity(num);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (quantity === "" || quantity === 0) setQuantity(1);
                                        }}
                                        className="w-full text-center text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 bg-transparent border-none p-0"
                                    />
                                </div>
                                <button
                                    onClick={handleIncrement}
                                    disabled={safeQuantity >= product.stock}
                                    className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center active:scale-95 transition-transform ${safeQuantity >= product.stock ? 'bg-slate-50 dark:bg-dark-700 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-dark-600 text-slate-800 dark:text-slate-200'}`}
                                    type="button"
                                >
                                    <Plus size={14} className="stroke-[2.5]" />
                                </button>
                            </div>
                        </div>

                        {/* Calculated Total Section with Label */}
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-2">
                                Total
                            </span>
                            <div className="h-11 flex items-center justify-end">
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                                    ${total.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add to Order Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={!isStockAvailable}
                    className="w-full bg-tenant-gradient text-white py-4 rounded-xl font-bold text-base shadow-high flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:bg-none disabled:bg-slate-200 dark:disabled:bg-dark-700/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none"
                    type="button"
                >
                    <ShoppingCart size={18} className="stroke-[2.5]" />
                    <span>AGREGAR AL PEDIDO</span>
                </button>
            </div>
        </BottomSheet>
    );
}
