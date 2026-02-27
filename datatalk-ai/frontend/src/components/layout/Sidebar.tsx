import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    MessageSquare, LayoutDashboard, Database, FolderClock,
    History, Hexagon, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

const mainNavigation = [
    { name: 'Query & Chat', href: '/', icon: MessageSquare, current: true },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: false },
    { name: 'Data Explorer', href: '/explorer', icon: Database, current: false },
    { name: 'Saved Queries', href: '/saved', icon: FolderClock, current: false },
];

export default function Sidebar() {
    const { history } = useAppStore();
    return (
        <div className="flex flex-col w-64 bg-panel/70 backdrop-blur-2xl border-r border-border h-full shrink-0 transition-colors duration-200">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-transparent">
                <Hexagon className="w-6 h-6 text-primary fill-primary" />
                <span className="ml-3 font-bold tracking-tight text-lg text-foreground">Data Web</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                {/* Main Section */}
                <div>
                    <p className="px-3 text-xs font-semibold text-muted tracking-wider uppercase mb-3">
                        Main
                    </p>
                    <nav className="space-y-1">
                        {mainNavigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
                                    )
                                }
                            >
                                <item.icon
                                    className={cn("mr-3 flex-shrink-0 h-5 w-5")}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* History Section */}
                <div>
                    <p className="px-3 text-xs font-semibold text-muted tracking-wider uppercase mb-3">
                        History
                    </p>
                    <nav className="space-y-1">
                        {history.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted italic">No recent queries.</div>
                        ) : (
                            history.map((item) => (
                                <a
                                    key={item.id}
                                    href={`/history/${item.id}`}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-muted rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground transition-colors group"
                                    title={item.query}
                                >
                                    <History
                                        className="mr-3 flex-shrink-0 h-4 w-4 text-muted group-hover:text-foreground transition-colors"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.query}</span>
                                </a>
                            ))
                        )}
                    </nav>
                </div>
            </div>

            {/* Upgrade Box from Screenshot */}
            <div className="p-4 m-4 rounded-xl border border-border shadow-sm bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center text-primary font-semibold text-sm mb-2">
                    <Zap className="w-4 h-4 mr-2 fill-primary" />
                    Pro Feature
                </div>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                    Unlock advanced visualizations and export capabilities.
                </p>
                <button className="w-full bg-panel border border-border text-foreground text-sm font-medium py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Upgrade Now
                </button>
            </div>
        </div>
    );
}
