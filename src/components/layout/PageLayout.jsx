import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import React from 'react';

const PageLayout = ({
    title,
    subtitle,
    breadcrumb = [],
    primaryAction,
    secondaryActions,
    filterBar,
    children
}) => {
    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

            {/* 2️⃣ Module Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="px-6 py-6 md:py-8 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        {/* Title Section */}
                        <div className="flex-1 min-w-0">
                            {breadcrumb.length > 0 && (
                                <nav className="flex mb-2" aria-label="Breadcrumb">
                                    <ol className="flex items-center space-x-2">
                                        {breadcrumb.map((item, index) => (
                                            <li key={index} className="flex items-center">
                                                {index > 0 && <span className="text-slate-400 mx-2">/</span>}
                                                <span className={`text-xs font-medium ${index === breadcrumb.length - 1 ? 'text-slate-500' : 'text-slate-400 hover:text-slate-600 cursor-pointer'}`}>
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] leading-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-1.5 text-sm font-medium text-[#64748B] max-w-2xl">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Actions Section */}
                        {(primaryAction || secondaryActions) && (
                            <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
                                {secondaryActions}
                                {primaryAction}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto w-full space-y-6">

                {/* 3️⃣ Toolbar Section (Optional) */}
                {filterBar && (
                    <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {filterBar}
                    </div>
                )}

                {/* 4️⃣ Content Card */}
                <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
                    {children}
                </div>

            </div>
        </div>
    );
};

export default PageLayout;
