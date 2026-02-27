import * as React from 'react';
import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { UploadPanel } from '../components/upload/UploadPanel';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageInput } from '../components/chat/MessageInput';
import { ResponseCard } from '../components/response/ResponseCard';
import { ImpactRanking } from '../components/sidebar/ImpactRanking';
import { SchemaPanel } from '../components/sidebar/SchemaPanel';
import { AuditTrail } from '../components/audit/AuditTrail';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore, Message } from '../store/chatStore';
import { useExport } from '../hooks/useExport';

export default function QueryPage() {
    const sessionId = useSessionStore((state: any) => state.sessionId);
    const datasetName = useSessionStore((state: any) => state.datasetName);
    const schema = useSessionStore((state: any) => state.schema);
    const dataDictionary = useSessionStore((state: any) => state.dataDictionary);
    const clearSession = useSessionStore((state: any) => state.clearSession);

    const messages = useChatStore((state: any) => state.messages);
    const clearMessages = useChatStore((state: any) => state.clearMessages);

    const { exportCsv, exportPdf } = useExport();
    const [showDictionary, setShowDictionary] = useState(false);

    // Derive latest insights from the assistant message history for the global sidebar
    const lastAssistantMsg = React.useMemo(() =>
        [...messages].reverse().find(m => m.role === 'assistant' && m.responsePayload?.insights),
        [messages]);

    const currentInsights = lastAssistantMsg?.responsePayload?.insights || [];

    const handleNewDataset = () => {
        clearSession();
        clearMessages();
    };

    // Custom message renderer to inject AI response modules natively into chat
    const renderMessageContent = (msg: Message) => {
        if (msg.role !== 'assistant') return <p>{msg.content}</p>;

        const handleFollowUp = (q: string) => {
            // We need access to the handleSubmit from MessageInput context ideally, 
            // but we can just use the store or a ref if needed. 
            // For now, let's just trigger a click on the input button if possible or expose it.
            window.dispatchEvent(new CustomEvent('datatalk-query', { detail: q }));
        };

        if (msg.responsePayload) {
            return (
                <div className="flex flex-col gap-5 w-full">
                    <ResponseCard
                        payload={msg.responsePayload}
                        onFollowUp={handleFollowUp}
                    />
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
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-blue-50">
                        D
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">DataTalk <span className="text-blue-600">AI</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Enterprise Intelligence</p>
                    </div>
                </div>

                {sessionId && (
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Source</span>
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{datasetName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportPdf}
                                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Export Report (PDF)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button
                                onClick={handleNewDataset}
                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                                New Analysis
                            </button>
                        </div>
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
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 overflow-y-auto border-l border-slate-200">
            {/* 1. Dataset Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">📁</div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Analysis Context</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Grounded in actual data</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current File</span>
                        <p className="text-sm font-bold text-slate-700 truncate">{datasetName}</p>
                    </div>

                    <button
                        onClick={() => setShowDictionary(!showDictionary)}
                        className={`w-full text-xs px-4 py-3 rounded-xl font-bold transition-all border flex justify-center items-center gap-2 ${showDictionary
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {showDictionary ? 'Return to Analysis' : 'Show Data Dictionary'}
                    </button>
                </div>
            </div>

            {/* 2. Dynamic Content: Dictionary or Schema/Insights */}
            {showDictionary && dataDictionary ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in zoom-in-95">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">AI Generated Data Dictionary</h3>
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                        {typeof dataDictionary === 'string'
                            ? dataDictionary
                            : JSON.stringify(dataDictionary, null, 2)}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 flex-1 flex flex-col">
                    {schema && <SchemaPanel schema={schema} />}
                    <div className="flex-1 min-h-[300px]">
                        <ImpactRanking insights={currentInsights} />
                    </div>
                </div>
            )}

            {/* 3. Export Shortcuts */}
            <div className="grid grid-cols-2 gap-3 pb-6">
                <button
                    onClick={exportCsv}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-sm group"
                >
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📄</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Raw CSV</span>
                </button>
                <button
                    onClick={() => window.open(`/export/sql/${sessionId}`, '_blank')}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-sm group"
                >
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">💾</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DuckDB SQL</span>
                </button>
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
