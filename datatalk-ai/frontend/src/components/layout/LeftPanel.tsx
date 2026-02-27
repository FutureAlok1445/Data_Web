import React from 'react';

interface LeftPanelProps {
    children: React.ReactNode;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-full bg-white">
            {children}
        </div>
    );
};
