import React from 'react';

interface ExecutiveSummaryProps {
    summary: {
        risk_level: string;
        key_finding: string;
        recommended_action: string;
    };
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary }) => {
    if (!summary || summary.risk_level === 'Low') return null;

    const isHigh = summary.risk_level === 'High';

    return (
        <div className={`p-5 rounded-2xl border-l-[6px] shadow-sm flex items-start gap-5 mb-5 transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${isHigh ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50/80 border-yellow-400'}`}>
            <div className={`mt-0.5 text-3xl drop-shadow-sm ${isHigh ? 'text-orange-500 animate-pulse' : 'text-yellow-600'}`}>
                {isHigh ? '🚨' : '⚠️'}
            </div>
            <div className="flex-1">
                <h4 className={`font-bold text-[11px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${isHigh ? 'text-orange-800' : 'text-yellow-800'}`}>
                    <span className="px-2.5 py-1 rounded-md shadow-sm bg-white/70 backdrop-blur-sm border border-white/40">{summary.risk_level} Priority Insight</span>
                </h4>
                <p className="text-slate-800 mb-3 font-bold text-[16px] leading-snug">{summary.key_finding}</p>

                <div className={`p-3 rounded-xl mt-3 flex gap-3 items-start border ${isHigh ? 'bg-orange-100/50 border-orange-200 text-orange-900' : 'bg-yellow-100/50 border-yellow-200 text-yellow-900'}`}>
                    <svg className="w-5 h-5 shrink-0 mt-0.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <p className="text-[13px] font-medium leading-relaxed">
                        <span className="uppercase text-[10px] font-bold tracking-widest opacity-60 block mb-0.5">Recommended Action</span>
                        {summary.recommended_action}
                    </p>
                </div>
            </div>
        </div>
    );
};
