import React from 'react';

const SectionHeader = ({ title, subtitle, rightElement, className = '' }) => {
    return (
        <div
            className={`
        group w-full bg-white border-b border-slate-200 px-6 py-5 
        flex flex-col sm:flex-row sm:items-center justify-between gap-4 
        transition-all duration-300 hover:bg-[#F8FAFC]
        ${className}
      `}
        >
            <div className="flex items-center gap-4">
                {/* Vertical Accent Bar */}
                <div
                    className="
            w-1 h-10 bg-gradient-to-b from-[#4F46E5] to-[#6366F1] rounded-full 
            shadow-[0_0_4px_rgba(79,70,229,0.1)] 
            transition-all duration-300 ease-out
            group-hover:h-12 group-hover:shadow-[0_0_10px_rgba(79,70,229,0.3)]
            shrink-0
          "
                />

                {/* Text Content */}
                <div className="flex flex-col justify-center">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] leading-tight transition-colors duration-300">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 text-sm font-medium text-[#64748B] transition-colors duration-300 group-hover:text-slate-600">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Content (Actions, Buttons) */}
            {rightElement && (
                <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
