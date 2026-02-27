import React from 'react';
import { AppShell } from './components/layout/AppShell';
import { UploadPanel } from './components/upload/UploadPanel';
import { ChatWindow } from './components/chat/ChatWindow';
import { MessageInput } from './components/chat/MessageInput';
import { ResponseCard } from './components/response/ResponseCard';
import { ImpactRanking } from './components/sidebar/ImpactRanking';
import { AuditTrail } from './components/audit/AuditTrail';
import { useSessionStore } from './store/sessionStore';
import { useChatStore } from './store/chatStore';

export default function App() {
    const sessionId = useSessionStore(state => state.sessionId);
    const datasetName = useSessionStore(state => state.datasetName);
    const messages = useChatStore(state => state.messages);

    // Derive latest insights from the assistant message history for the global sidebar
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.responsePayload?.insights);
    const currentInsights = lastAssistantMsg?.responsePayload?.insights || [];

    // Custom message renderer to inject AI response modules natively into chat
    const renderMessageContent = (msg: any) => {
        if (msg.role !== 'assistant') return <p>{msg.content}</p>;

        if (msg.responsePayload) {
            return (
                <div className="flex flex-col gap-5 w-full">
                    <ResponseCard payload={msg.responsePayload} />
                    {msg.responsePayload.audit_trail && (
                        <AuditTrail steps={msg.responsePayload.audit_trail} />
                    )}
                </div>
            );
        }

        return <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>;
    };

    const MainContent = (
        <div className="flex flex-col h-full relative">
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-blue-100">
                        D
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">DataTalk <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span></h1>
                </div>
                {sessionId && (
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-inner">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Dataset</span>
                        <span className="text-sm font-bold text-blue-700">{datasetName}</span>
                    </div>
                )}
            </header>

            {!sessionId ? (
                <UploadPanel />
            ) : (
                <>
                    <ChatWindow renderMessageContent={renderMessageContent} />
                    <MessageInput />
                </>
            )}
        </div>
    );

    const RightSidebar = sessionId ? (
        <div className="flex flex-col h-full p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    Dataset Context
                </h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">You are currently analyzing <span className="font-bold text-blue-600 block text-sm mt-1">{datasetName}</span></p>

                <button className="w-full text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-200 shadow-sm flex justify-center items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    View Data Dictionary
                </button>
            </div>

            <div className="flex-1 min-h-[400px]">
                <ImpactRanking insights={currentInsights} />
            </div>
        </div>
    ) : null;

    return (
        <AppShell
            leftPanel={MainContent}
            rightPanel={RightSidebar}
        />
    );
}
