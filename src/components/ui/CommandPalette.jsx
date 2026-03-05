import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, Package, ShoppingCart, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // Toggle the menu when ⌘K or Ctrl+K is pressed
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleSelect = (route) => {
        setOpen(false);
        navigate(route);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <Command
                className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
            >
                <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Command.Input
                        autoFocus
                        placeholder="What do you need?"
                        className="w-full px-4 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
                    />
                </div>

                <Command.List className="max-h-96 overflow-y-auto p-2">
                    <Command.Empty className="p-4 text-center text-gray-500">No results found.</Command.Empty>

                    <Command.Group heading="Products & Inventory" className="px-2 py-2 text-xs font-medium text-gray-500">
                        <Command.Item
                            onSelect={() => handleSelect('/products')}
                            className="px-4 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <Package className="w-4 h-4" /> Go to Products
                        </Command.Item>
                        <Command.Item
                            onSelect={() => handleSelect('/inventory/adjust')}
                            className="px-4 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <ShoppingCart className="w-4 h-4" /> Adjust Inventory Level
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Customers" className="px-2 py-2 text-xs font-medium text-gray-500">
                        <Command.Item
                            onSelect={() => handleSelect('/customers')}
                            className="px-4 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <Users className="w-4 h-4" /> View Customers
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="System" className="px-2 py-2 text-xs font-medium text-gray-500">
                        <Command.Item
                            onSelect={() => handleSelect('/settings')}
                            className="px-4 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <Settings className="w-4 h-4" /> Settings & Feature Flags
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
};
