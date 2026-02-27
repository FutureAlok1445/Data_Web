import React, { useState } from 'react';

interface SqlViewerProps {
    sql: string;
}

export const SqlViewer: React.FC<SqlViewerProps> = ({ sql }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    if (!sql) return null;

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Executed SQL</span>
                <button
                    onClick={handleCopy}
                    className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                <pre className="whitespace-pre-wrap break-words">{sql}</pre>
            </div>
        </div>
    );
};
