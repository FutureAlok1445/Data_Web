import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useAppStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    // Render children normally
    return <>{children}</>;
}
