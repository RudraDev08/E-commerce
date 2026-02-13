import React from 'react';
import Breadcrumb from '../navigation/Breadcrumb';

const PageHeader = ({ title, subtitle, primaryAction, secondaryActions }) => {
    return (
        <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="max-w-[1600px] mx-auto w-full px-6 py-6 md:py-8">

                {/* Dynamic Breadcrumbs */}
                <Breadcrumb />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">

                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] leading-tight transition-all duration-300">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1.5 text-sm font-medium text-[#64748B] max-w-3xl leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {(primaryAction || secondaryActions) && (
                        <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                            {secondaryActions && (
                                <div className="flex items-center gap-2">
                                    {secondaryActions}
                                </div>
                            )}
                            {primaryAction}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
