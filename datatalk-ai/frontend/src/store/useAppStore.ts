import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
}

interface AppState {
    theme: 'light' | 'dark';
    history: HistoryItem[];
    toggleTheme: () => void;
    addHistory: (query: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'light', // Default matching screenshot
            history: [],
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),
            addHistory: (query) => set((state) => {
                // Don't add duplicate if it's the exact same query that was just asked
                if (state.history.length > 0 && state.history[0].query === query) {
                    return state;
                }
                const newItem: HistoryItem = {
                    id: crypto.randomUUID(),
                    query,
                    timestamp: Date.now()
                };
                // Keep the last 15 history items
                return { history: [newItem, ...state.history].slice(0, 15) };
            })
        }),
        {
            name: 'dataweb-storage',
        }
    )
);
