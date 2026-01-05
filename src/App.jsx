import { useState } from "react";
import Header from "./components/header/header";
import LocationPage from "./components/pages/LocationPage";
import { Aside } from "./components/aside/MainAside";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - conditionally rendered */}
      {sidebarOpen && <Aside />}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with sidebar toggle */}
        <Header />
        
        {/* Sidebar toggle button for mobile */}
        <button 
          className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          Toggle Sidebar
        </button>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <LocationPage />
        </main>
      </div>
    </div>
  );
}

export default App;