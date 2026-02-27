import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatWindowProps {
    renderMessageContent?: (msg: any) => React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ renderMessageContent }) => {
    const messages = useChatStore(state => state.messages);
    const isLoading = useChatStore(state => state.isLoading);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    if (messages.length === 0 && !isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                    💡
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Dataset Ready for Analysis</h3>
                <p className="text-slate-500 max-w-sm">Ask a question about trends, correlations, or specific metrics within your dataset to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 scroll-smooth">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white selection:bg-blue-800' : 'bg-white border border-slate-200 text-slate-800'}`}>
                        {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                        ) : (
                            renderMessageContent ? renderMessageContent(msg) : <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {msg.isError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">⚠️</span>
                                <span>{msg.content}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="max-w-[85%] rounded-3xl p-5 shadow-sm bg-white border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="flex space-x-1.5 p-1">
                                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                            <span className="text-sm font-medium text-slate-500 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Running AI Pipelines & SQL execution...</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={endOfMessagesRef} />
        </div>
    );
};
