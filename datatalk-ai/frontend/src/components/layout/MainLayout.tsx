import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ThemeProvider from './ThemeProvider';
import AnimatedBackground from '../ui/AnimatedBackground';

export default function MainLayout() {
    return (
        <ThemeProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-hidden z-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
