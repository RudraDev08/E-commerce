import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/24/outline";

const LocationDropdown = ({ data = [], value, onChange, label, placeholder = "Select option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = data.find((item) => item._id === value);

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="w-full font-sans text-left" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wide mb-2 ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-4 py-3.5
            rounded-2xl text-left transition-all duration-300 ease-out
            border
            ${isOpen
              ? 'bg-white border-[#2563EB] text-[#0F172A] shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-[#FAFAFA] text-[#475569] shadow-sm'
            }
          `}
        >
          <span className={`block truncate text-sm font-medium ${selectedItem ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
            {selectedItem ? selectedItem.name : placeholder}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 text-[#94A3B8] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-[#2563EB]' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 origin-top bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_28px_-8px_rgba(0,0,0,0.18)] border border-gray-100 ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >

            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-[#F9FAFB] border-none ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB]/20 focus:bg-white transition-all duration-200 placeholder:text-[#94A3B8] text-[#0F172A] outline-none"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <ul className="max-h-60 overflow-auto p-2 custom-scrollbar space-y-1">
              {/* Reset Option */}
              <li
                onClick={() => handleSelect("")}
                className={`
                  relative cursor-pointer select-none py-2.5 px-3 rounded-xl transition-all duration-200 group
                  ${value === ""
                    ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]'
                    : 'text-[#475569] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`block truncate ${value === "" ? 'font-semibold' : 'font-medium'}`}>
                    {placeholder} <span className="text-xs opacity-70 font-normal ml-1">(Reset)</span>
                  </span>
                  {value === "" && (
                    <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
                  )}
                </div>
              </li>

              {filteredData.length === 0 ? (
                <li className="relative cursor-default select-none py-8 px-4 text-center text-[#94A3B8] text-sm">
                  No results found
                </li>
              ) : (
                filteredData.map((item) => (
                  <li
                    key={item._id}
                    onClick={() => handleSelect(item._id)}
                    className={`
                      relative cursor-pointer select-none py-2.5 px-3 rounded-xl transition-all duration-200 group
                      ${value === item._id
                        ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]'
                        : 'text-[#0F172A] hover:bg-[#EFF6FF] hover:text-[#2563EB] active:scale-[0.98]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`block truncate text-sm ${value === item._id ? 'font-semibold' : 'font-medium'}`}>
                        {item.name}
                      </span>

                      {value === item._id && (
                        <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDropdown;
