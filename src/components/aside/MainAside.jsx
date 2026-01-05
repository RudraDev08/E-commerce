import { useState } from "react";
import { locationData } from "../data/LocationData";
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  FolderIcon,
  CalendarIcon,
  DocumentIcon,
  Cog6ToothIcon,
  MapPinIcon,
  GlobeAmericasIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Aside Component
export const Aside = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [countryEnabled, setCountryEnabled] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon },
    { id: "analytics", label: "Analytics", icon: ChartBarIcon },
    { id: "users", label: "Users", icon: UserGroupIcon },
    { id: "projects", label: "Projects", icon: FolderIcon },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "documents", label: "Documents", icon: DocumentIcon },
    { id: "settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  const handleCountryToggle = (enabled) => {
    setCountryEnabled(enabled);
    if (!enabled) {
      setSelectedCountry("");
    }
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 ease-in-out`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <GlobeAmericasIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">GeoAdmin</h1>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <GlobeAmericasIcon className="h-5 w-5" />
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Country Toggle Section */}
      <div className="p-4 border-b border-gray-800">
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'items-center justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">Country Filter</span>
            </div>
          )}
          <button
            onClick={() => handleCountryToggle(!countryEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${countryEnabled ? 'bg-indigo-600' : 'bg-gray-700'} ${collapsed ? 'mt-2' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${countryEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* Country Selection */}
        {countryEnabled && !collapsed && (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-gray-300">
              Select Country
            </label>
            <div className="relative">
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 rounded-md text-sm hover:bg-gray-700"
              >
                <span className="truncate">
                  {selectedCountry || "Select a country"}
                </span>
                <ChevronRightIcon className={`h-4 w-4 transform transition-transform ${countryDropdownOpen ? 'rotate-90' : ''}`} />
              </button>
              
              {countryDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedCountry("");
                        setCountryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700"
                    >
                      All Countries
                    </button>
                    {Object.keys(locationData).map((country) => (
                      <button
                        key={country}
                        onClick={() => {
                          setSelectedCountry(country);
                          setCountryDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center"
                      >
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {selectedCountry && (
              <div className="mt-2 px-3 py-2 bg-indigo-900/30 border border-indigo-800 rounded-md">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 text-indigo-400 mr-2" />
                  <span className="text-xs font-medium">Active: {selectedCountry}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {countryEnabled && collapsed && (
          <div className="mt-2 flex justify-center">
            <MapPinIcon className="h-5 w-5 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center rounded-lg p-3 transition-colors ${
                  activeNav === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed && (
          <div className="space-y-3">
            {/* Help & Support */}
            <button className="flex items-center space-x-3 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 w-full">
              <QuestionMarkCircleIcon className="h-5 w-5" />
              <span className="text-sm">Help & Support</span>
            </button>
            
            {/* Logout */}
            <button className="flex items-center space-x-3 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 w-full">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="text-sm">Logout</span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                AJ
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Alex Johnson</p>
                <p className="text-xs text-gray-400 truncate">Admin</p>
              </div>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="flex flex-col items-center space-y-3">
            <button className="p-2 text-gray-400 hover:text-white">
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
              AJ
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// CountrySidebar Component
export const CountrySidebar = () => {
  const [countryEnabled, setCountryEnabled] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Location Settings</h2>
        
        {/* Country Toggle Card */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Country Filter</h3>
              <p className="text-sm text-gray-500">Filter data by country</p>
            </div>
            <button
              onClick={() => {
                setCountryEnabled(!countryEnabled);
                if (countryEnabled) {
                  setSelectedCountry("");
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${countryEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${countryEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {countryEnabled && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Country
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">All Countries</option>
                {Object.keys(locationData).map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              
              {selectedCountry && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-md">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-indigo-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900">
                        Filtering by: {selectedCountry}
                      </p>
                      <p className="text-xs text-indigo-700">
                        Showing data for selected country only
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Country Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Available Countries</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Countries</span>
              <span className="font-medium">{Object.keys(locationData).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Filter</span>
              <span className={`font-medium ${selectedCountry ? 'text-indigo-600' : 'text-gray-400'}`}>
                {selectedCountry || "None"}
              </span>
            </div>
          </div>
          
          {/* Quick Select */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
            <div className="flex flex-wrap gap-2">
              {["USA", "Canada", "UK", "Australia"].map((country) => (
                <button
                  key={country}
                  onClick={() => {
                    setCountryEnabled(true);
                    setSelectedCountry(country);
                  }}
                  className={`px-3 py-1 text-xs rounded-full border ${selectedCountry === country ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Header Component
export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Left section - Logo and Mobile menu button */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <div className="block lg:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <XMarkIcon className="block h-6 w-6" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" />
                  )}
                </button>
              </div>
              <div className="ml-4 flex lg:ml-0">
                <a href="#" className="flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AP</span>
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-900 hidden sm:block">
                    AdminPanel
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="w-full max-w-lg lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search for anything..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center">
            
            {/* Notifications */}
            <div className="relative ml-3">
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  3
                </span>
              </button>
            </div>

            {/* User menu */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      SJ
                    </div>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Your Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Support
                  </a>
                  <div className="border-t border-gray-100"></div>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 pb-3 pt-2">
            <a
              href="#"
              className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            >
              Analytics
            </a>
            <a
              href="#"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            >
              Users
            </a>
            <a
              href="#"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            >
              Settings
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

const MainAside = Aside;
export default MainAside;