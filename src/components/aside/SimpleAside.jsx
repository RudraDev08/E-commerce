import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  GlobeAltIcon,
  MapIcon,
  BuildingOfficeIcon,
  HashtagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const SimpleAside = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Update selected based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setSelected("Dashboard");
    else if (path === "/country") setSelected("Country");
    else if (path === "/state") setSelected("State");
    else if (path === "/city") setSelected("City");
    else if (path === "/pincode") setSelected("Pincode");
  }, [location]);

  const menuItems = [
    { name: "Dashboard", icon: HomeIcon, path: "/" },
    { name: "Country", icon: GlobeAltIcon, path: "/country" },
    { name: "State", icon: MapIcon, path: "/state" },
    { name: "City", icon: BuildingOfficeIcon, path: "/city" },
    { name: "Pincode", icon: HashtagIcon, path: "/pincode" },
  ];

  const bottomMenuItems = [
    { name: "Profile", icon: UserCircleIcon, path: "/profile" },
    { name: "Settings", icon: Cog6ToothIcon, path: "/settings" },
    { name: "Logout", icon: ArrowRightOnRectangleIcon, path: "/logout" },
  ];

  const handleSelect = (item) => {
    setSelected(item.name);
    navigate(item.path);
  };

  return (
    <div className="flex">
      {/* Sidebar Container */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } relative h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-6 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        >
          {open ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            {open && (
              <div className="transition-opacity duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-400 mt-1">Management System</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <nav className="p-4">
          <h2
            className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 ${
              open ? "opacity-100" : "opacity-0"
            } transition-opacity duration-200`}
          >
            Main Menu
          </h2>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = selected === item.name;
              const isHovered = hovered === item.name;

              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHovered(item.name)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border-l-4 border-indigo-500 shadow-lg"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : "bg-gray-800"
                      } ${isHovered && !isActive ? "scale-110" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {open && (
                      <span
                        className={`font-medium transition-opacity duration-200 ${
                          open ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {item.name}
                      </span>
                    )}
                    {isActive && open && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section - Profile & Settings */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          {/* User Profile */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full">
              <UserCircleIcon className="h-8 w-8" />
            </div>
            {open && (
              <div className="transition-opacity duration-200">
                <h3 className="font-semibold text-white">Admin User</h3>
                <p className="text-xs text-gray-400">Super Administrator</p>
              </div>
            )}
          </div>

          {/* Bottom Menu */}
          <ul className="space-y-2">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              const isHovered = hovered === item.name;

              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHovered(item.name)}
                    onMouseLeave={() => setHovered(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                  >
                    <div
                      className={`p-2 rounded-lg bg-gray-800 transition-all duration-200 ${
                        isHovered ? "scale-110" : ""
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {open && (
                      <span
                        className={`font-medium transition-opacity duration-200 ${
                          open ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {item.name}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Version Info */}
          {open && (
            <div className="mt-6 pt-4 border-t border-gray-700/30">
              <p className="text-xs text-gray-500 text-center">
                v2.1.0 • © 2024
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Collapsed Tooltips */}
      {!open && (
        <div className="fixed left-20 top-0 h-full z-20 pointer-events-none">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className="absolute left-2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              style={{ top: `${menuItems.indexOf(item) * 56 + 120}px` }}
            >
              <span className="text-sm whitespace-nowrap">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleAside;