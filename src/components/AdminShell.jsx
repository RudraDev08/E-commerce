import React, { useState } from "react";
import ProfessionalAside from "../components/aside/SimpleAside";
import AdminHeader from "../components/header/Header";
import { motion } from "framer-motion";

const AdminShell = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR */}
      <ProfessionalAside
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      {/* MAIN WRAPPER (BLOCKS OVERLAY) */}
      <div className="flex-1 flex flex-col min-w-0 pointer-events-none">
        <AdminHeader isExpanded={isExpanded} />

        <main className="flex-1 overflow-y-auto pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
