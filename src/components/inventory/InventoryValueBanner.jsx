import React from "react";
import { TrendingUp, Package, ShieldCheck, Info } from "lucide-react";

export const InventoryValueBanner = ({ totalValue, totalUnits, reservedUnits }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0);

    return (
        <div className="my-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] p-10 text-white relative overflow-hidden group transition-all duration-500 hover:shadow-[0_30px_70px_rgba(79,70,229,0.4)]">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2.5 text-white/70 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
                            <div className="p-1 rounded-md bg-emerald-500/20">
                                <ShieldCheck size={14} className="text-emerald-400" />
                            </div>
                            Net Inventory Equity
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-4">
                            <h2 className="text-6xl font-black tracking-tight drop-shadow-sm">
                                {formatCurrency(totalValue)}
                            </h2>
                            {totalValue === 0 && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/60 animate-pulse">
                                    <Info size={12} />
                                    Cost prices not configured
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-10">
                        <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 transition-colors group-hover/item:bg-white/20">
                                <Package size={22} className="text-indigo-200" />
                            </div>
                            <div>
                                <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-0.5">Physical Stock</span>
                                <span className="text-2xl font-black tracking-tight">{formatNumber(totalUnits)}</span>
                            </div>
                        </div>

                        <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        <div className="flex items-center gap-4 group/item">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 transition-colors group-hover/item:bg-white/20">
                                <TrendingUp size={22} className="text-orange-300" />
                            </div>
                            <div>
                                <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-0.5">Reserved Allocation</span>
                                <span className="text-2xl font-black tracking-tight text-orange-200">{formatNumber(reservedUnits)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] rotate-12 transition-transform duration-700 group-hover:rotate-45" />
                        <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] -rotate-6 backdrop-blur-sm border border-white/10" />
                        <div className="relative w-28 h-28 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-white/10">
                            <TrendingUp size={48} className="text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-white/[0.03] mix-blend-overlay blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 mix-blend-overlay blur-3xl pointer-events-none" />

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -skew-x-[35deg] pointer-events-none transition-transform duration-[2000ms] group-hover:translate-x-full" />
        </div>
    );
};
