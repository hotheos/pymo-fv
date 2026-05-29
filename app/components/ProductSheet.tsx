"use client";

import { useEffect, useState } from "react";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";
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

                {/* Header / Info */}
                <div>
                    <div className="flex justify-between items-start gap-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight flex-1">{product.name}</h2>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xl">${product.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 mb-4">
                        <span className="bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded">{product.sku}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {product.stock > 0 ? `Disponible: ${product.stock}` : 'Agotado'}
                        </span>
                    </div>

                    {/* Description */}
                    <div className="p-4 bg-slate-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">{product.description}</p>
                    </div>
                </div>

                {/* Selector & Calculator */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-600 pt-6">
                    {/* Selector */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDecrement}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-slate-800 dark:text-slate-200 active:scale-95 transition-transform"
                        >
                            <Minus size={18} />
                        </button>
                        <div className="w-16">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={quantity}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setQuantity(""); // Allow empty temporarily
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
                                className="w-full text-center text-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 bg-transparent"
                            />
                        </div>
                        <button
                            onClick={handleIncrement}
                            disabled={safeQuantity >= product.stock}
                            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${safeQuantity >= product.stock ? 'bg-slate-100 dark:bg-dark-700 text-slate-400' : 'bg-slate-100 dark:bg-dark-700 text-slate-800 dark:text-slate-200'}`}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100">${total.toLocaleString()}</p>
                    </div>
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={!isStockAvailable}
                    className="w-full bg-tenant-gradient text-white py-4 rounded-xl font-bold text-lg shadow-high flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:bg-none disabled:bg-slate-300 disabled:shadow-none"
                >
                    <ShoppingCart size={20} />
                    <span>AGREGAR AL PEDIDO</span>
                </button>
            </div>
        </BottomSheet>
    );
}
