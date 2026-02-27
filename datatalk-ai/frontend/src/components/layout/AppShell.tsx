import * as React from 'react';

interface AppShellProps {
    leftPanel: React.ReactNode;
    rightPanel?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel }) => {
    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden selection:bg-blue-100 selection:text-blue-900">
            {/* Main Analytical Hub */}
            <main
                className={`flex flex-col h-full bg-white shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] transition-all duration-700 ease-in-out ${rightPanel
                        ? 'w-[70%] border-r border-slate-200/60 z-10'
                        : 'w-full max-w-6xl mx-auto border-x border-slate-200/60'
                    }`}
            >
                {leftPanel}
            </main>

            {/* Smart Contextual Intelligence Sidebar */}
            {rightPanel && (
                <aside
                    className="flex flex-col w-[30%] h-full bg-slate-50 relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-40"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none opacity-40"></div>

                    <div className="relative z-10 h-full flex flex-col">
                        {rightPanel}
                    </div>
                </aside>
            )}
        </div>
    );
};
