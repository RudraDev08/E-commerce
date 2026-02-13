import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import ProfessionalAside from "../components/aside/SimpleAside";
import AdminHeader from "../components/header/Header";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Responsive Sidebar Handling
    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== 'undefined') {
                if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                } else {
                    setSidebarOpen(true);
                }
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-sans text-slate-900 overflow-hidden">
            {/* 1. Sidebar */}
            <ProfessionalAside
                isExpanded={sidebarOpen}
                setIsExpanded={setSidebarOpen}
            />

            {/* 2. Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative transition-all duration-300">

                {/* 3. Global Header */}
                <AdminHeader
                    sidebarOpen={sidebarOpen}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* 4. Page Content / Outlet */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] scroll-smooth">
                    {/* The nested routes will render here */}
                    <Outlet />

                    {/* Add footer here if needed in future */}
                </main>

            </div>
        </div>
    );
};

export default AdminLayout;
