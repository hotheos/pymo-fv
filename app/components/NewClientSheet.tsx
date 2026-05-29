"use client";

import { useState, useEffect } from "react";
import { Fingerprint, Search, Store, Phone, MapPin, Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Pencil, UserCheck, UserPlus, Download, Hash } from "lucide-react";
import { useMock } from "@/context/MockContext";
import type { Client, Visit } from "@/types";
import { useRouter } from "next/navigation";
import BottomSheet from "./ui/BottomSheet";
import VisitSummarySheet from "./VisitSummarySheet";

interface NewClientSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

type SearchStatus = "idle" | "searching" | "found" | "not_found";

// Field-level validation helpers
const validators = {
    nit: (v: string) => {
        if (!v) return null; // Don't show error on empty (not touched yet)
        if (!/^\d+$/.test(v)) return "Solo números";
        if (v.length < 6) return "Mínimo 6 dígitos";
        if (v.length > 15) return "Máximo 15 dígitos";
        return null;
    },
    name: (v: string) => {
        if (!v) return null;
        if (v.length < 2) return "Mínimo 2 caracteres";
        if (v.length > 100) return "Máximo 100 caracteres";
        return null;
    },
    phone: (v: string) => {
        if (!v) return null;
        if (v.length < 7) return "Mínimo 7 dígitos";
        if (v.length > 15) return "Máximo 15 dígitos";
        return null;
    },
    address: (v: string) => {
        if (!v) return null;
        if (v.length < 5) return "Mínimo 5 caracteres";
        if (v.length > 200) return "Máximo 200 caracteres";
        return null;
    },
    email: (v: string) => {
        if (!v) return null; // Email is optional
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato inválido";
        return null;
    },
};

export default function NewClientSheet({ isOpen, onClose }: NewClientSheetProps) {
    const { searchClient, addClient, updateClient, beginVisit, clients, getTodayOrders } = useMock();
    const router = useRouter();

    const [formData, setFormData] = useState({
        nit: "",
        name: "",
        phone: "",
        address: "",
        email: ""
    });

    // Track which fields the user has interacted with (for showing errors only after touch)
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
    const [isMekanoClient, setIsMekanoClient] = useState(false);
    const [originalData, setOriginalData] = useState<typeof formData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [nitError, setNitError] = useState<string | null>(null);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryOrderId, setSummaryOrderId] = useState("");

    // Real-time field errors
    const fieldErrors: Record<string, string | null> = {
        nit: validators.nit(formData.nit),
        name: validators.name(formData.name),
        phone: validators.phone(formData.phone),
        address: validators.address(formData.address),
        email: validators.email(formData.email),
    };

    // Unified search result from API (GET /clientes/buscar/:nit)
    const [searchResult, setSearchResult] = useState<{
        foundIn: "asignado" | "no_asignado" | null;
        client?: Client;
        visit?: Visit | null;
    } | null>(null);

    // Derive existingClient and existingVisit from search result
    const existingClient = searchResult?.foundIn === "asignado" ? searchResult.client as Client : null;
    const existingVisit = searchResult?.foundIn === "asignado" && searchResult.visit ? searchResult.visit as Visit : null;

    // Combined NIT error: format error OR backend error (no more duplicate check — we handle it as a feature now)
    const nitDisplayError = touched.nit
        ? (fieldErrors.nit || nitError)
        : null;

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === "nit") {
            setNitError(null);
            // Reset search when NIT changes
            if (searchStatus !== "idle") {
                setSearchStatus("idle");
                setIsMekanoClient(false);
                setOriginalData(null);
                setSearchResult(null);
            }
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSearch = async () => {
        if (!formData.nit || formData.nit.length < 6 || fieldErrors.nit) return;

        setSearchStatus("searching");

        const result = await searchClient(formData.nit);
        setSearchResult(result);

        if (result.foundIn === "no_asignado" && result.client) {
            // Client exists but not assigned — fill form for import
            const filled = {
                nit: result.client.nit,
                name: result.client.name,
                phone: result.client.phone,
                address: result.client.address,
                email: result.client.email || ""
            };
            setFormData(filled);
            setOriginalData(filled);
            setIsMekanoClient(true);
            setSearchStatus("found");
            setTouched({ nit: true, name: true, phone: true, address: true, email: true });
        } else if (result.foundIn === "asignado") {
            // Already assigned to this vendor — show client card
            setIsMekanoClient(false);
            setOriginalData(null);
            setSearchStatus("found");
        } else {
            // Not found anywhere
            setIsMekanoClient(false);
            setOriginalData(null);
            setSearchStatus("not_found");
        }
    };

    const hasChanges = (): boolean => {
        if (!originalData) return false;
        return (
            formData.name !== originalData.name ||
            formData.phone !== originalData.phone ||
            formData.address !== originalData.address ||
            formData.email !== originalData.email
        );
    };

    // Form is valid when: all required fields filled + no errors + (new client with Mekano check OR editing existing)
    const isFormValid =
        formData.nit && !fieldErrors.nit && !nitError &&
        (isEditingExisting || (!existingClient && (searchStatus === "not_found" || isMekanoClient))) &&
        formData.name && !fieldErrors.name &&
        formData.phone && !fieldErrors.phone &&
        formData.address && !fieldErrors.address &&
        !fieldErrors.email;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all as touched to show all errors
        setTouched({ nit: true, name: true, phone: true, address: true, email: true });

        if (!isFormValid) return;

        setIsSaving(true);

        // If editing existing client, update and return to card view
        if (isEditingExisting) {
            updateClient(formData.nit, {
                name: formData.name.toUpperCase(),
                phone: formData.phone,
                address: formData.address,
                email: formData.email
            });
            setIsSaving(false);
            setIsEditingExisting(false);
            return;
        }

        const result = addClient({
            nit: formData.nit,
            name: formData.name.toUpperCase(),
            phone: formData.phone,
            address: formData.address,
            email: formData.email
        });

        // Handle backend duplicate NIT error
        if (result.error) {
            setNitError(result.error);
            setIsSaving(false);
            return;
        }

        setIsSaving(false);
        resetForm();
        onClose();
        router.push(`/catalog?newVisit=true&nit=${result.nit}`);
    };

    const resetForm = () => {
        setFormData({ nit: "", name: "", phone: "", address: "", email: "" });
        setTouched({});
        setSearchStatus("idle");
        setIsMekanoClient(false);
        setOriginalData(null);
        setNitError(null);
        setIsEditingExisting(false);
        setSearchResult(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Helper: get border color based on field state
    const fieldBorder = (field: string, error: string | null) => {
        if (field === "nit" && nitDisplayError) return "border-red-300 focus:ring-red-300";
        if (touched[field] && error) return "border-red-300 focus:ring-red-300";
        if (touched[field] && formData[field as keyof typeof formData] && !error) return "border-emerald-300 focus:ring-emerald-300";
        return "border-slate-200 dark:border-dark-600";
    };

    // Helper: show inline validation feedback
    const FieldFeedback = ({ field, error }: { field: string; error: string | null }) => {
        if (field === "nit") return null; // NIT has its own special display
        if (!touched[field]) return null;
        const value = formData[field as keyof typeof formData];
        if (error) {
            return (
                <p className="text-xs text-red-500 mt-1 pl-1 flex items-center gap-1">
                    <XCircle size={12} className="flex-shrink-0" /> {error}
                </p>
            );
        }
        if (value) {
            return (
                <p className="text-xs text-emerald-500 mt-1 pl-1 flex items-center gap-1">
                    <CheckCircle2 size={12} className="flex-shrink-0" /> Válido
                </p>
            );
        }
        return null;
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={handleClose}>
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Custom header with back arrow */}
                <div className="flex items-center mb-1">
                    {searchStatus !== "idle" || existingClient || isEditingExisting ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (isEditingExisting) {
                                    // Go back to the card, not to search
                                    setIsEditingExisting(false);
                                } else {
                                    resetForm();
                                }
                            }}
                            className="p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                    ) : <div className="w-7" />}
                    <h2 className="flex-1 text-center text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                        {isEditingExisting ? <><Pencil size={20} /> Actualizar Datos</>
                            : searchStatus !== "idle" && existingClient ? <><UserCheck size={20} /> Cliente Encontrado</>
                                : searchStatus === "not_found" ? <><UserPlus size={20} /> Crear Nuevo Cliente</>
                                    : searchStatus === "found" && !existingClient ? <><Download size={20} /> Importar Cliente</>
                                        : <><Fingerprint size={20} /> Identificar Cliente</>}
                    </h2>
                    <div className="w-7" />
                </div>

                {/* NIT — input when idle, plain text after search */}
                {searchStatus === "idle" ? (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">NIT / Cédula *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.nit}
                                onChange={(e) => handleChange("nit", e.target.value)}
                                onBlur={() => handleBlur("nit")}
                                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:border-primary transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-dark-700 ${fieldBorder("nit", fieldErrors.nit)}`}
                                placeholder="123456789"
                                required
                            />
                        </div>
                        {/* NIT inline validation */}
                        {nitDisplayError && (
                            <p className="text-xs text-red-500 mt-1 pl-1 flex items-center gap-1">
                                <XCircle size={12} className="flex-shrink-0" /> {nitDisplayError}
                            </p>
                        )}
                        {/* Search button */}
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={!formData.nit || !!fieldErrors.nit}
                            className={`w-full mt-4 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${formData.nit && !fieldErrors.nit
                                ? 'bg-primary shadow-high hover:brightness-110 active:scale-95'
                                : 'bg-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <Search size={20} />
                            BUSCAR EN MEKANO Y PYMO
                        </button>
                    </div>
                ) : searchStatus === "searching" ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-sm font-medium text-slate-500">Buscando en Mekano y Pymo...</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Status banners — above NIT */}
                        {!existingClient && searchStatus === "found" && (
                            <div className="mb-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <p className="text-sm font-semibold text-emerald-800">Cliente encontrado en Mekano</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Revise y guarde los datos importados.</p>
                            </div>
                        )}

                        {!existingClient && searchStatus === "not_found" && (
                            <div className="mb-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                                <p className="text-sm font-semibold text-amber-600">Cliente no encontrado en Mekano ni en Pymo</p>
                                <p className="text-xs text-amber-500 mt-0.5">Complete los datos para crear un nuevo cliente.</p>
                            </div>
                        )}

                        {existingClient && (
                            <div className="mb-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <p className="text-sm font-semibold text-emerald-800">Cliente encontrado en Pymo</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Los datos de este cliente ya están registrados en el sistema.</p>
                            </div>
                        )}

                        {/* NIT as plain text */}
                        <p className="text-xs font-bold text-slate-400 uppercase">NIT / Cédula</p>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-700">
                            <Hash size={16} className="text-slate-400" />
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wide">{formData.nit}</span>
                        </div>

                        {/* Existing Pymo client card */}
                        {existingClient && existingVisit && !isEditingExisting && (
                            <div className="mt-4 rounded-xl bg-white dark:bg-dark-700 border border-slate-200 dark:border-dark-600 shadow-sm overflow-hidden">
                                <div className="px-4 pt-3 pb-3">
                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">{existingClient.name}</p>
                                    <div className="flex justify-between">
                                        <div className="space-y-1.5 text-xs text-slate-500">
                                            <p className="flex items-center gap-1.5"><MapPin size={12} /> {existingClient.address}</p>
                                            <p className="flex items-center gap-1.5"><Phone size={12} /> {existingClient.phone}</p>
                                            {existingClient.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {existingClient.email}</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${existingVisit.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                                                : existingVisit.status === 'IN_PROCESS' ? 'bg-primary/15 text-primary'
                                                    : existingVisit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${existingVisit.status === 'PENDING' ? 'bg-amber-500'
                                                    : existingVisit.status === 'IN_PROCESS' ? 'bg-primary'
                                                        : existingVisit.status === 'COMPLETED' ? 'bg-emerald-500'
                                                            : 'bg-red-500'
                                                    }`} />
                                                {existingVisit.status === 'PENDING' ? 'Por Visitar'
                                                    : existingVisit.status === 'IN_PROCESS' ? 'Visitando'
                                                        : existingVisit.status === 'COMPLETED' ? 'Finalizada'
                                                            : 'Cancelada'}
                                            </div>
                                            <button type="button" onClick={() => {
                                                setFormData({ nit: existingClient.nit, name: existingClient.name, phone: existingClient.phone, address: existingClient.address, email: existingClient.email || "" });
                                                setOriginalData({ nit: existingClient.nit, name: existingClient.name, phone: existingClient.phone, address: existingClient.address, email: existingClient.email || "" });
                                                setIsEditingExisting(true);
                                                setTouched({ nit: true, name: true, phone: true, address: true, email: true });
                                            }} className="flex items-center gap-1 text-xs font-semibold text-primary hover:brightness-110 transition-colors">
                                                <Pencil size={12} />
                                                Actualizar datos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {existingClient && !existingVisit && !isEditingExisting && (
                            <div className="mt-4 rounded-xl bg-white dark:bg-dark-700 border border-slate-200 dark:border-dark-600 shadow-sm overflow-hidden">
                                <div className="px-4 pt-3 pb-3">
                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">{existingClient.name}</p>
                                    <div className="flex justify-between">
                                        <div className="space-y-1.5 text-xs text-slate-500">
                                            <p className="flex items-center gap-1.5"><MapPin size={12} /> {existingClient.address}</p>
                                            <p className="flex items-center gap-1.5"><Phone size={12} /> {existingClient.phone}</p>
                                            {existingClient.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {existingClient.email}</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                Sin Visita
                                            </div>
                                            <button type="button" onClick={() => {
                                                setFormData({ nit: existingClient.nit, name: existingClient.name, phone: existingClient.phone, address: existingClient.address, email: existingClient.email || "" });
                                                setOriginalData({ nit: existingClient.nit, name: existingClient.name, phone: existingClient.phone, address: existingClient.address, email: existingClient.email || "" });
                                                setIsEditingExisting(true);
                                                setTouched({ nit: true, name: true, phone: true, address: true, email: true });
                                            }} className="flex items-center gap-1 text-xs font-semibold text-primary hover:brightness-110 transition-colors">
                                                <Pencil size={12} />
                                                Actualizar datos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* Form fields — shown after NIT verified (not idle/searching) for new clients OR editing existing */}
                {(searchStatus === "not_found" || searchStatus === "found" || isEditingExisting) && (!existingClient || isEditingExisting) && (
                    <>
                        {/* Nombre */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Razón Social *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    onBlur={() => handleBlur("name")}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:border-primary transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-dark-700 uppercase ${fieldBorder("name", fieldErrors.name)}`}
                                    placeholder="TIENDA EJEMPLO"
                                    required
                                />
                            </div>
                            <FieldFeedback field="name" error={fieldErrors.name} />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Teléfono *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    onBlur={() => handleBlur("phone")}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:border-primary transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-dark-700 ${fieldBorder("phone", fieldErrors.phone)}`}
                                    placeholder="300 123 4567"
                                    required
                                />
                            </div>
                            <FieldFeedback field="phone" error={fieldErrors.phone} />
                        </div>

                        {/* Dirección */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Dirección *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    onBlur={() => handleBlur("address")}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:border-primary transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-dark-700 ${fieldBorder("address", fieldErrors.address)}`}
                                    placeholder="Calle 123 # 45-67"
                                    required
                                />
                            </div>
                            <FieldFeedback field="address" error={fieldErrors.address} />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    onBlur={() => handleBlur("email")}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:border-primary transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-dark-700 ${fieldBorder("email", fieldErrors.email)}`}
                                    placeholder="cliente@email.com"
                                />
                            </div>
                            <FieldFeedback field="email" error={fieldErrors.email} />
                        </div>
                        {/* Mekano sync indicator — removed per user request */}
                    </>
                )}

                {/* Action buttons — only after search */}
                {searchStatus !== "idle" && existingClient && existingVisit && !isEditingExisting ? (
                    existingVisit.status === 'COMPLETED' ? (
                        <div className="space-y-3 mt-4">
                            {/* List all orders for this client */}
                            {(() => {
                                const clientOrders = getTodayOrders()
                                    .filter(o => o.clientNit === existingClient.nit)
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                if (clientOrders.length === 0) {
                                    return (
                                        <div className="text-center py-4 text-slate-400 text-sm">
                                            No hay pedidos para este cliente hoy
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pedidos de hoy ({clientOrders.length})</p>
                                        {clientOrders.map(order => {
                                            const orderTime = new Date(order.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                                            const formatTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(order.total);
                                            return (
                                                <div key={order.id} className="flex items-center gap-3 bg-slate-50 dark:bg-dark-700 rounded-xl p-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatTotal}</p>
                                                        <p className="text-[10px] text-slate-400">{orderTime} · {order.items.length} productos</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSummaryOrderId(order.id);
                                                            setShowSummary(true);
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-tenant-gradient text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                                                    >
                                                        VER RESUMEN
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}

                            <button
                                type="button"
                                onClick={() => {
                                    const result = addClient({
                                        nit: existingClient.nit,
                                        name: existingClient.name,
                                        phone: existingClient.phone,
                                        address: existingClient.address,
                                        email: existingClient.email || ""
                                    });
                                    if (!result.error) {
                                        resetForm();
                                        onClose();
                                        router.push(`/catalog?newVisit=true&nit=${existingClient.nit}`);
                                    }
                                }}
                                className="w-full py-3 rounded-xl font-bold text-primary border border-primary/20 bg-primary/5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-all active:scale-95"
                            >
                                <span>NUEVA VISITA</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onClose();
                                router.push(`/catalog?newVisit=true&nit=${existingClient.nit}`);
                            }}
                            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all bg-primary shadow-high hover:brightness-110 active:scale-95"
                        >
                            <span>{
                                existingVisit.status === 'PENDING' ? 'COMENZAR VISITA'
                                    : existingVisit.status === 'IN_PROCESS' ? 'CONTINUAR VISITA'
                                        : 'REABRIR Y COMENZAR VISITA'
                            }</span>
                            <ArrowRight size={20} />
                        </button>
                    )
                ) : searchStatus !== "idle" && existingClient && !existingVisit && !isEditingExisting ? (
                    <button
                        type="button"
                        disabled
                        className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-4 bg-slate-300 cursor-not-allowed"
                    >
                        <span>CLIENTE SIN VISITA ACTIVA</span>
                    </button>
                ) : (searchStatus === "not_found" || searchStatus === "found" || isEditingExisting) ? (
                    <button
                        type="submit"
                        disabled={!isFormValid || isSaving}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all ${isFormValid && !isSaving ? 'bg-primary shadow-high hover:brightness-110 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span>{
                                    isEditingExisting
                                        ? 'ACTUALIZAR'
                                        : isMekanoClient ? 'IMPORTAR Y COMENZAR VISITA'
                                            : 'GUARDAR Y COMENZAR VISITA'
                                }</span>
                                {isEditingExisting ? <CheckCircle2 size={20} /> : <ArrowRight size={20} />}
                            </>
                        )}
                    </button>
                ) : null}

            </form>
            {existingClient && (
                <VisitSummarySheet
                    isOpen={showSummary}
                    onClose={() => setShowSummary(false)}
                    orderId={summaryOrderId}
                />
            )}
        </BottomSheet>
    );
}
