import React from 'react';

interface QueryTraceProps {
    query: string;
    sql: string;
}

export const QueryTrace: React.FC<QueryTraceProps> = ({ query, sql }) => {
    return (
        <div className="space-y-3">
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Question</span>
                <p className="text-sm text-slate-700 font-medium mt-1">{query}</p>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated SQL</span>
                <div className="mt-1 bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800">
                    <pre className="whitespace-pre-wrap break-words">{sql}</pre>
                </div>
            </div>
        </div>
    );
};
