import React from 'react';

interface RightPanelProps {
    children: React.ReactNode;
}

export const RightPanel: React.FC<RightPanelProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {children}
        </div>
    );
};
