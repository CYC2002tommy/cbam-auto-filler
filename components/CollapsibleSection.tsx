
import React, { useState, ReactNode, useRef, useEffect } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    startOpen?: boolean;
    isSubSection?: boolean;
    noCollapse?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, startOpen = false, isSubSection = false, noCollapse = false }) => {
    // If noCollapse is true, isOpen is always true
    const [isOpen, setIsOpen] = useState(startOpen || noCollapse);
    const sectionRef = useRef<HTMLElement>(null);

    const toggleOpen = () => {
        if (!noCollapse) {
            setIsOpen(!isOpen);
        }
    };

    const headerBase = isSubSection
        ? "bg-slate-50 p-3 rounded-t-md border border-slate-200 mt-4"
        : "bg-slate-100 p-4 rounded-t-lg border-b border-slate-200";

    const headerInteractive = noCollapse 
        ? "flex justify-between items-center" 
        : "cursor-pointer flex justify-between items-center hover:bg-slate-100/80 transition-colors";
    
    const headerClasses = `${headerBase} ${headerInteractive}`;
    
    const contentClasses = isSubSection
        ? "bg-white p-6 rounded-b-lg shadow-sm border border-t-0 border-slate-200"
        : "bg-white p-6 rounded-b-lg shadow-md border border-t-0 border-slate-200";

    const titleClasses = isSubSection
        ? "text-lg font-semibold text-slate-600"
        : "text-xl font-semibold text-slate-700";
        
    const iconSize = isSubSection ? "w-5 h-5" : "w-6 h-6";

    return (
        <section ref={sectionRef}>
            <div className={headerClasses} onClick={toggleOpen}>
                <h2 className={titleClasses}>{title}</h2>
                {!noCollapse && (
                    <svg className={`${iconSize} transform transition-transform ${!isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                )}
            </div>
            <div className={contentClasses} style={{ display: (isOpen || noCollapse) ? 'block' : 'none' }}>
                {children}
            </div>
        </section>
    );
};

export default CollapsibleSection;
