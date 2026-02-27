import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
    responsePayload?: any; // Holds the full JSON response from the backend query
}

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    addMessage: (msg: Message) => void;
    updateMessage: (id: string, payload: Partial<Message>) => void;
    setLoading: (loading: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [],
            isLoading: false,

            addMessage: (msg) =>
                set((state) => ({ messages: [...state.messages, msg] })),

            updateMessage: (id, payload) =>
                set((state) => ({
                    messages: state.messages.map((m) => m.id === id ? { ...m, ...payload } : m)
                })),

            setLoading: (loading) =>
                set({ isLoading: loading }),

            clearMessages: () =>
                set({ messages: [], isLoading: false }),
        }),
        {
            name: 'datatalk-chat', // localStorage key
            // Don't persist loading state
            partialize: (state) => ({ messages: state.messages }),
        }
    )
);
