import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiClient } from '../../api/client';

export const MessageInput: React.FC = () => {
    const [query, setQuery] = useState('');
    const sessionId = useSessionStore(state => state.sessionId);
    const addMessage = useChatStore(state => state.addMessage);
    const setLoading = useChatStore(state => state.setLoading);
    const isLoading = useChatStore(state => state.isLoading);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !sessionId || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: query };
        addMessage(userMsg);
        setQuery('');
        setLoading(true);

        try {
            const response = await apiClient.processQuery(sessionId, userMsg.content);
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                responsePayload: response
            });
        } catch (err: any) {
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: err.message || 'Error executing AI pipeline.',
                isError: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 bg-white border-t border-slate-200 sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={sessionId ? "Ask DataTalk AI anything about your dataset..." : "Please upload a dataset first..."}
                    className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-300 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 shadow-inner transition-all duration-300 ease-in-out font-medium"
                    disabled={isLoading || !sessionId}
                />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim() || !sessionId}
                    className="absolute right-2 p-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm group-focus-within:shadow-md"
                >
                    <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    );
};
