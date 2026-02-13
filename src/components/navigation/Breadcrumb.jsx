import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Capitalize function
    const formatSegment = (segment) => {
        // Custom replacements for known acronyms or specific terms
        const overrides = {
            'pincode': 'Pincode',
            'variant-mapping': 'Variant Mapping',
            'size-management': 'Size Management',
            'color-management': 'Color Management',
            'inventory': 'Inventory',
            'warehouses': 'Warehouses',
        };

        if (overrides[segment]) return overrides[segment];

        return segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (pathnames.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        to="/"
                        className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors duration-200"
                    >
                        Dashboard
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronRight className="w-3 h-3 text-[#94A3B8] mx-1" />
                            {isLast ? (
                                <span className="text-xs font-semibold text-[#0F172A]">
                                    {formatSegment(value)}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors duration-200"
                                >
                                    {formatSegment(value)}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
