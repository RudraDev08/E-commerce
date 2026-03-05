import React, { useState, useEffect } from 'react';
import {
    DollarSign, ShoppingCart, Package, AlertTriangle,
    Send, RefreshCcw, Bell, Calendar
} from 'lucide-react';
import { KPICard } from './KPICard';
import { RevenueLineChart, OrdersBarChart, InventoryDistributionChart } from './Charts';
import { QuickActionPanel } from './QuickActions';
import { DashboardDateFilter } from './DateRangePicker';
import { AdminActivityLog } from '../ui/AdminActivityLog';
import { DashboardCustomizer } from '../ui/DashboardCustomizer';
import { SystemStatusWidget } from '../ui/SystemStatusWidget';

// Simulation of analytics API hooks
const useDashboardAnalytics = (dateRange) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Simulate API fetch delay
        const timer = setTimeout(() => {
            setData({
                kpis: [
                    { id: 'revenue', title: 'Total Revenue', value: '$128,430.00', change: 12.5, trend: 'up', icon: DollarSign },
                    { id: 'orders', title: 'Orders Today', value: '1,432', change: 8.2, trend: 'up', icon: ShoppingCart },
                    { id: 'active_products', title: 'Active Products', value: '4,521', change: -1.4, trend: 'down', icon: Package },
                    { id: 'low_stock', title: 'Low Stock Items', value: '28', change: 4.5, trend: 'down', icon: AlertTriangle },
                    { id: 'pending_ship', title: 'Pending Shipments', value: '156', change: 2.1, trend: 'up', icon: Send }
                ],
                revenueData: [
                    { date: '2026-03-01', revenue: 4000 },
                    { date: '2026-03-02', revenue: 3000 },
                    { date: '2026-03-03', revenue: 2000 },
                    { date: '2026-03-04', revenue: 2780 },
                    { date: '2026-03-05', revenue: 1890 },
                    { date: '2026-03-06', revenue: 2390 },
                    { date: '2026-03-07', revenue: 3490 }
                ],
                ordersData: [
                    { date: 'Mon', orders: 120 },
                    { date: 'Tue', orders: 140 },
                    { date: 'Wed', orders: 110 },
                    { date: 'Thu', orders: 155 },
                    { date: 'Fri', orders: 200 },
                    { date: 'Sat', orders: 180 },
                    { date: 'Sun', orders: 160 }
                ],
                inventoryDistribution: [
                    { name: 'Apparel', value: 400 },
                    { name: 'Electronics', value: 300 },
                    { name: 'Home & Living', value: 300 },
                    { name: 'Footwear', value: 200 }
                ]
            });
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [dateRange]);

    return { data, loading };
};

export const DashboardLayout = () => {
    const [dateRange, setDateRange] = useState('last_7_days');
    const { data, loading } = useDashboardAnalytics(dateRange);

    // Widget customization state
    const [widgets, setWidgets] = useState([
        { id: 'kpi_grid', title: 'KPI Summary', visible: true, type: 'kpi' },
        { id: 'revenue_chart', title: 'Revenue Pipeline', visible: true, type: 'chart' },
        { id: 'orders_chart', title: 'Order Trends', visible: true, type: 'chart' },
        { id: 'inventory_chart', title: 'Inventory Distribution', visible: true, type: 'chart' },
        { id: 'quick_actions', title: 'Shortcuts', visible: true, type: 'side' },
        { id: 'activity_log', title: 'Recent Operations', visible: true, type: 'side' },
        { id: 'system_status', title: 'Service Health', visible: true, type: 'side' }
    ]);

    const handleLayoutChange = (activeWidgets) => {
        setWidgets(prev => prev.map(w => ({ ...w, visible: activeWidgets[w.id] })));
    };

    const isWidgetVisible = (id) => widgets.find(w => w.id === id)?.visible;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

            {/* ── Dashboard Header ───────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Executive Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2">
                        Overview of your platform's operational performance health.
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 rounded-full text-xs font-bold leading-none animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" /> Live
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DashboardDateFilter selected={dateRange} onChange={setDateRange} />
                    <DashboardCustomizer widgets={widgets} onLayoutChange={handleLayoutChange} />
                    <button className="p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors">
                        <RefreshCcw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── KPI Grid ───────────────────────────────────────────── */}
            {isWidgetVisible('kpi_grid') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {(loading ? Array(5).fill({}) : data?.kpis).map((kpi, idx) => (
                        <KPICard key={kpi.id || idx} {...kpi} loading={loading} />
                    ))}
                </div>
            )}

            {/* ── Main Analytics & Activity Layout ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column (Charts) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {isWidgetVisible('revenue_chart') && (
                            <RevenueLineChart data={data?.revenueData} loading={loading} />
                        )}
                        {isWidgetVisible('orders_chart') && (
                            <OrdersBarChart data={data?.ordersData} loading={loading} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {isWidgetVisible('inventory_chart') && (
                            <InventoryDistributionChart data={data?.inventoryDistribution} loading={loading} />
                        )}
                        {isWidgetVisible('quick_actions') && (
                            <QuickActionPanel />
                        )}
                    </div>
                </div>

                {/* Right Column (Status & Logs) */}
                <div className="lg:col-span-4 space-y-8 sticky top-24">
                    {isWidgetVisible('system_status') && <SystemStatusWidget />}
                    {isWidgetVisible('activity_log') && <AdminActivityLog />}

                    {/* Custom Info Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2">Automated Optimization</h4>
                            <p className="text-sm text-blue-100 mb-4 opacity-90">Your inventory reconciliation is scheduled for 03:00 AM UTC tonight.</p>
                            <button className="px-5 py-2.5 bg-white text-blue-600 font-bold rounded-lg text-sm hover:bg-blue-50 transition-colors shadow-sm">Review Schedule</button>
                        </div>
                        <Bell className="absolute -bottom-4 -right-4 w-28 h-28 text-white/10" />
                    </div>
                </div>
            </div>
        </div>
    );
};
