import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AdminHeader = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New user registered", time: "2 min ago", read: false },
    { id: 2, title: "System update completed", time: "1 hour ago", read: false },
    { id: 3, title: "Payment received", time: "3 hours ago", read: true },
    { id: 4, title: "Database backup successful", time: "Yesterday", read: true },
  ]);

  const location = useLocation();
  const navigate = useNavigate();

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/country") return "Country";
    if (path === "/state") return "State";
    if (path === "/city") return "City";
    if (path === "/pincode") return "Pincode";
    return "Dashboard";
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // User menu items
  const userMenuItems = [
    { label: "My Profile", icon: UserCircleIcon, path: "/profile" },
    { label: "Settings", icon: Cog6ToothIcon, path: "/settings" },
    { label: "Help & Support", icon: QuestionMarkCircleIcon, path: "/help" },
    { label: "Logout", icon: ArrowRightOnRectangleIcon, path: "/logout" },
  ];

  // Handle search
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      setSearchQuery("");
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu")) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest(".notifications-menu")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showNotifications]);

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-3"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              {/* Page Title */}
              <div className="flex items-center">
                <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">
                    {getPageTitle().charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getPageTitle()}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {location.pathname === "/" ? "Overview & Analytics" : "Data Management"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors relative"
                >
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Mark all as read
                          </button>
                          <button
                            onClick={() => setNotifications([])}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                                !notification.read 
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                <BellIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => navigate("/notifications")}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">JD</span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500">
                      Administrator
                    </p>
                  </div>
                  <ChevronDownIcon className="hidden lg:block h-4 w-4 text-gray-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-semibold">JD</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            John Doe
                          </p>
                          <p className="text-sm text-gray-500">
                            john.doe@example.com
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Role</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                            Super Admin
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (item.label === "Logout") {
                              console.log("Logging out...");
                            } else {
                              navigate(item.path);
                            }
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <item.icon className="h-5 w-5 mr-3 text-gray-400" />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">System Status</span>
                        <span className="flex items-center">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-green-600 font-medium">Online</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-6 pb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminHeader;