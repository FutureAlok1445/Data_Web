import * as React from 'react';
import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSessionStore } from '../../store/sessionStore';
import { apiClient } from '../../api/client';
import { SuggestedChips } from './SuggestedChips';

export const MessageInput: React.FC = () => {
    const [query, setQuery] = useState('');
    const sessionId = useSessionStore((state: any) => state.sessionId);
    const addMessage = useChatStore((state: any) => state.addMessage);
    const setLoading = useChatStore((state: any) => state.setLoading);
    const isLoading = useChatStore((state: any) => state.isLoading);
    const messages = useChatStore((state: any) => state.messages);

    const handleSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
        if (e) e.preventDefault();
        const finalQuery = manualQuery || query;
        if (!finalQuery.trim() || !sessionId || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: finalQuery };
        addMessage(userMsg);
        if (!manualQuery) setQuery('');
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
        <div className="flex flex-col w-full bg-white border-t border-slate-200 sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            {/* Suggested Chips (Only show if no messages yet) */}
            {sessionId && messages.length === 0 && (
                <div className="pt-4 px-6 flex justify-center">
                    <SuggestedChips onSelect={(q: string) => handleSubmit(undefined, q)} />
                </div>
            )}

            <div className="p-5 lg:p-6">
                <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto group">
                    <div className="absolute left-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={sessionId ? "Ask DataTalk AI anything about your dataset..." : "Please upload a dataset first..."}
                        className="w-full pl-14 pr-16 py-4.5 bg-slate-50 border border-slate-300/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-[15px] font-semibold text-slate-800 placeholder-slate-400 shadow-inner transition-all duration-300 ease-in-out"
                        disabled={isLoading || !sessionId}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim() || !sessionId}
                        className="absolute right-2 px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Send'}
                        {!isLoading && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                    </button>
                </form>
                {sessionId && (
                    <p className="text-center mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Validated via DuckDB SQL Execution Pipeline
                    </p>
                )}
            </div>
        </div>
    );
};
