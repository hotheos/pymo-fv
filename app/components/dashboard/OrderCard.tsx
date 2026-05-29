import { Wallet, Phone } from "lucide-react";

interface OrderCardProps {
    order: { id: string; clientNit: string; date: string; total: number };
    client: { nit: string; name: string; phone: string; address: string; email?: string };
    onWallet: (clientName: string, clientNit: string) => void;
    onViewSummary: (orderId: string) => void;
    onNewVisit: (client: { nit: string; name: string; phone: string; address: string; email?: string }) => void;
}

export default function OrderCard({ order, client, onWallet, onViewSummary, onNewVisit }: OrderCardProps) {
    const orderTime = new Date(order.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const formatTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(order.total);

    return (
        <div key={order.id} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
            <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight">{client.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{client.address}</p>
                </div>
                <span className="text-xs text-slate-400">{orderTime}</span>
            </div>

            <div className="flex items-center gap-3 lg:gap-2 mb-5">
                <button onClick={() => onWallet(client.name, client.nit)} className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                    <Wallet size={18} className="lg:hidden" /><Wallet size={14} className="hidden lg:block" />
                </button>
                <button className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone size={18} className="lg:hidden" /><Phone size={14} className="hidden lg:block" />
                </button>
                <div className="flex-1 text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Total</span>
                    <span className="font-black text-slate-800 dark:text-slate-100">{formatTotal}</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onViewSummary(order.id)}
                    className="flex-1 py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    VER RESUMEN
                </button>
                <button
                    onClick={() => onNewVisit(client)}
                    className="flex-1 py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    NUEVA VISITA
                </button>
            </div>
        </div>
    );
}
