import React, { useState, useEffect } from 'react';
import { Bell, X, Check, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationCenter = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', title: 'Low Stock Alert', message: 'Product SKU-1029 is below minimum threshold.', read: false, time: '2m ago' },
        { id: 2, type: 'error', title: 'Transfer Failed', message: 'Warehouse B to C transfer failed synchronization.', read: false, time: '1h ago' },
        { id: 3, type: 'info', title: 'Promotion Expiring', message: 'Summer Sale 2026 expires in 2 hours.', read: true, time: '3h ago' }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                Notifications
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs">{unreadCount}</span>
                            </h3>
                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Mark all read</button>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Check className="w-8 h-8 mx-auto text-green-500 mb-2 opacity-50" />
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {notifications.map(notif => (
                                        <li
                                            key={notif.id}
                                            className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                {notif.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                                {notif.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                                            </div>
                                            {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 self-center" />}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20 text-center">
                            <button className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-center w-full gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                                View all history <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
