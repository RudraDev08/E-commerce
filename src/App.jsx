import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import SimpleAside from "./components/aside/SimpleAside";
import AdminHeader from "./components/header/Header";

import Dashboard from "./page/Dashboard";
import CountryPage from "./page/CountryPage";
import StatePage from "./page/StatePage";
import CityPage from "./page/CityPage";
import PincodeTable from "./components/tables/PincodeTable";

import {
  ChartBarIcon,
  DocumentChartBarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-indigo-500 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-24 w-24 border-4 border-cyan-400 border-t-white rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold bg-linear-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            GeoAdmin Pro
          </h2>
          <p className="text-white mt-2">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* ROOT LAYOUT */}
      <div className="flex min-h-screen bg-linear-to-br">
        {/* SIDEBAR */}
        <div
          className={`${
            sidebarOpen ? "block" : "hidden"
          } lg:block min-h-screen relative z-40`}
        >
          <SimpleAside
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col w-full">
          {/* HEADER */}
          <div className="sticky top-0 z-30">
            <AdminHeader
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
            />
          </div>

          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* FLOATING ACTION BUTTONS */}
            <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-3">
              <button className="p-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:scale-105 transition">
                <BellIcon className="h-5 w-5" />
              </button>
              <button className="p-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-xl hover:scale-105 transition">
                <DocumentChartBarIcon className="h-5 w-5" />
              </button>
            </div>

            {/* ROUTES */}
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/country" element={<CountryPage />} />
                <Route path="/state" element={<StatePage />} />
                <Route path="/city" element={<CityPage />} />
                <Route path="/pincode" element={<PincodeTable />} />
              </Routes>

              {/* FOOTER */}
              <footer className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p>© 2024 GeoAdmin Pro. All rights reserved.</p>
                    <p className="mt-1">Version 3.2.1</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="hover:text-blue-500">Privacy</button>
                    <button className="hover:text-blue-500">Terms</button>
                    <button className="hover:text-blue-500">Status</button>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
