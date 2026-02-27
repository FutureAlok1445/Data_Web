import React from 'react';

interface AppShellProps {
    leftPanel: React.ReactNode;
    rightPanel?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel }) => {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
            {/* Main Chat/Workspace Area */}
            <div className={`flex flex-col h-full bg-white shadow-xl transition-all duration-300 ${rightPanel ? 'w-2/3 border-r border-slate-200 z-10' : 'w-full max-w-5xl mx-auto border-x border-slate-200'}`}>
                {leftPanel}
            </div>

            {/* Context/Analysis Sidebar */}
            {rightPanel && (
                <div className="flex flex-col w-1/3 h-full bg-slate-50 overflow-y-auto">
                    {rightPanel}
                </div>
            )}
        </div>
    );
};
