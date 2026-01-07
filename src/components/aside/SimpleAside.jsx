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
  ChartPieIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  MapIcon as MapIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  HashtagIcon as HashtagIconSolid,
} from "@heroicons/react/24/solid";

const ProfessionalAside = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [hovered, setHovered] = useState(null);
  const [showCountryManagement, setShowCountryManagement] = useState(true);
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
    {
      name: "Dashboard",
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      path: "/",
    },
  ];

  const countryManagementItems = [
    {
      name: "Country",
      icon: GlobeAltIcon,
      activeIcon: GlobeAltIconSolid,
      path: "/country",
    },
    {
      name: "State",
      icon: MapIcon,
      activeIcon: MapIconSolid,
      path: "/state",
    },
    {
      name: "City",
      icon: BuildingOfficeIcon,
      activeIcon: BuildingOfficeIconSolid,
      path: "/city",
    },
    {
      name: "Pincode",
      icon: HashtagIcon,
      activeIcon: HashtagIconSolid,
      path: "/pincode",
    },
  ];

  const handleSelect = (item) => {
    setSelected(item.name);
    navigate(item.path);
  };

  const getIcon = (item) => {
    return selected === item.name ? item.activeIcon || item.icon : item.icon;
  };

  return ( 
    <div className="flex min-h-full">
      {/* Sidebar Container */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } relative min-h-screen bg-gray-50 border-r border-gray-200 text-gray-700 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ChartPieIcon className="h-6 w-6 text-white" />
              </div>
              {open && (
                <div className="transition-all duration-300">
                  <h1 className="text-xl font-bold text-gray-800">GeoAdmin</h1>
                  <p className="text-sm text-gray-500">Management Panel</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Dashboard Section */}
          <div className="px-4 mb-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = getIcon(item);
                const isActive = selected === item.name;
                const isHovered = hovered === item.name;

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHovered(item.name)}
                      onMouseLeave={() => setHovered(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      } ${!open ? "justify-center px-0" : ""}`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        } ${isHovered && !isActive ? "bg-gray-200" : ""}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {open && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Country Management Section */}
          <div className="px-4 mb-6">
            {open && (
              <div className="mb-3">
                <button
                  onClick={() =>
                    setShowCountryManagement(!showCountryManagement)
                  }
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Country Management
                  </span>
                  {showCountryManagement ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            )}

            {(open ? showCountryManagement : true) && (
              <ul className="space-y-2">
                {countryManagementItems.map((item) => {
                  const Icon = getIcon(item);
                  const isActive = selected === item.name;
                  const isHovered = hovered === item.name;

                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setHovered(item.name)}
                        onMouseLeave={() => setHovered(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        } ${!open ? "justify-center px-0" : ""}`}
                      >
                        <div
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          } ${isHovered && !isActive ? "bg-gray-200" : ""}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {open && (
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 bg-white p-4">
          {/* User Profile */}
          <div
            className={`flex items-center ${
              open ? "justify-between" : "justify-center"
            } mb-4`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-1.5 bg-blue-600 rounded-full">
                  <UserCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              {open && (
                <div className="transition-opacity duration-200">
                  <h3 className="font-semibold text-sm text-gray-800">
                    Admin User
                  </h3>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              )}
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setOpen(!open)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
                !open ? "mx-auto" : ""
              }`}
            >
              {open ? (
                <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Version Info */}
          {open && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Version 1.0.0</span>
                <span className="text-green-600 font-medium">• Online</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Hover Tooltips for Collapsed State */}
      {!open && (
        <div className="fixed left-20 top-0 h-full z-50">
          {/* Dashboard */}
          <div
            className="absolute left-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 transform transition-all duration-200 opacity-0 hover:opacity-100 pointer-events-auto"
            style={{ top: "140px" }}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              Dashboard
            </span>
          </div>

          {/* Country Management Items */}
          {countryManagementItems.map((item, index) => (
            <div
              key={item.name}
              className="absolute left-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 transform transition-all duration-200 opacity-0 hover:opacity-100 pointer-events-auto"
              style={{
                top: `${index * 48 + 200}px`,
              }}
            >
              <span className="text-sm font-medium whitespace-nowrap">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalAside;
