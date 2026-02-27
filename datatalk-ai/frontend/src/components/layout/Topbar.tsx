import React from 'react';
import { Search, Bell, Settings, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function Topbar() {
    const { theme, toggleTheme } = useAppStore();
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-panel/70 backdrop-blur-2xl border-b border-border z-10 sticky top-0 transition-colors duration-200">
            {/* Search Bar */}
            <div className="flex-1 flex max-w-2xl">
                <label htmlFor="search-input" className="sr-only">Search</label>
                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        id="search-input"
                        className="block w-full pl-10 pr-10 py-2 border border-border rounded-full leading-5 bg-background text-sm placeholder-muted focus:outline-none focus:bg-panel focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Search data, dashboards..."
                        type="search"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-muted text-xs shadow-sm bg-panel border border-border px-1.5 rounded">/</span>
                    </div>
                </div>
            </div>

            {/* Right Navigation */}
            <div className="ml-4 flex items-center space-x-6">
                <nav className="hidden md:flex space-x-6 text-sm font-medium text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
                    <a href="#" className="hover:text-foreground transition-colors">Help</a>
                </nav>

                <div className="h-5 w-px bg-gray-200 hidden md:block" aria-hidden="true"></div>

                <div className="flex items-center space-x-4 text-gray-500">
                    <button className="hover:text-foreground transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-border" />
                    </button>
                    <button onClick={toggleTheme} className="hover:text-foreground transition-colors">
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <button className="hover:text-foreground transition-colors">
                        <Settings className="h-5 w-5" />
                    </button>
                    <button className="flex items-center ml-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                        <img
                            className="h-8 w-8 rounded-full bg-orange-100 object-cover"
                            src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=fbd38d"
                            alt="User Avatar"
                        />
                    </button>
                </div>
            </div>
        </header>
    );
}
