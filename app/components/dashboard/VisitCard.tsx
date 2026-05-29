import {
    Wallet,
    Phone,
    Trash2,
    Eraser,
} from "lucide-react";

interface VisitCardProps {
    visit: { clientNit: string; status: string };
    client: { nit: string; name: string; phone: string; address: string; email?: string };
    onWallet: (clientName: string, clientNit: string) => void;
    onCancel: (nit: string) => void;
    onReset: (nit: string) => void;
    onBeginVisit: (nit: string) => void;
    onNavigateToCatalog: (nit: string) => void;
    onReactivate: (nit: string) => Promise<void>;
}

export default function VisitCard({
    visit, client, onWallet, onCancel, onReset, onBeginVisit, onNavigateToCatalog, onReactivate
}: VisitCardProps) {
    const isInProcess = visit.status === "IN_PROCESS";
    const isCancelled = visit.status === "CANCELLED";

    return (
        <div key={visit.clientNit} className="bg-white dark:bg-dark-800 rounded-[20px] p-5 shadow-high relative z-0 mb-4 lg:mb-0">
            <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg lg:text-base leading-tight">{client.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{client.address}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-2 mb-5">
                <button
                    onClick={() => onWallet(client.name, client.nit)}
                    className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                    <Wallet size={18} className="lg:hidden" /><Wallet size={14} className="hidden lg:block" />
                </button>
                <button className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone size={18} className="lg:hidden" /><Phone size={14} className="hidden lg:block" />
                </button>

                {isInProcess && (
                    <button
                        onClick={() => onReset(visit.clientNit)}
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 transition-colors"
                        title="Vaciar carrito"
                    >
                        <Eraser size={18} className="lg:hidden" /><Eraser size={14} className="hidden lg:block" />
                    </button>
                )}

                {!isCancelled && (
                    <button
                        onClick={() => onCancel(visit.clientNit)}
                        className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors">
                        <Trash2 size={18} className="lg:hidden" /><Trash2 size={14} className="hidden lg:block" />
                    </button>
                )}
                <div className="h-px bg-slate-100 dark:bg-dark-700 flex-1"></div>
            </div>

            {visit.status === 'IN_PROCESS' ? (
                <button
                    onClick={() => {
                        onBeginVisit(visit.clientNit);
                        onNavigateToCatalog(client.nit);
                    }}
                    className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                    CONTINUAR VISITA
                </button>
            ) : (
                <button
                    onClick={async () => {
                        if (visit.status === 'PENDING') {
                            onBeginVisit(visit.clientNit);
                            onNavigateToCatalog(client.nit);
                        } else if (visit.status === 'CANCELLED') {
                            await onReactivate(visit.clientNit);
                            onNavigateToCatalog(client.nit);
                        }
                    }}
                    className="w-full py-3 lg:py-2.5 rounded-xl bg-tenant-gradient text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
                    {visit.status === 'PENDING' ? 'COMENZAR VISITA' : 'REACTIVAR VISITA'}
                </button>
            )}
        </div>
    );
}
