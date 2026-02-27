import React, { useState } from 'react';

interface AuditTrailProps {
    steps: Array<{ step: string; status?: string; sql?: string; new_sql?: string; error?: string }>;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ steps }) => {
    const [expanded, setExpanded] = useState(false);

    if (!steps || steps.length === 0) return null;

    return (
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs uppercase tracking-widest">
                    <svg className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    System execution Trace
                </div>
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                    {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} Logged
                </span>
            </button>

            {expanded && (
                <div className="p-5 bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="space-y-5">
                        {steps.map((step, idx) => (
                            <div key={idx} className="border-l-2 border-slate-700 pl-4 py-0.5 relative">
                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-700"></div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-blue-400 font-bold tracking-wider">[{String(idx + 1).padStart(2, '0')}] {step.step.replace(/_/g, ' ').toUpperCase()}</span>
                                    {step.status === 'success' && <span className="text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-emerald-800/50">SUCCESS</span>}
                                    {step.status === 'error' && <span className="text-rose-400 bg-rose-900/40 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-rose-800/50">FAILED</span>}
                                </div>

                                {step.sql && (
                                    <div className="mt-2 text-slate-100 bg-black/40 p-3 rounded-md border border-slate-800 shadow-inner">
                                        <span className="text-slate-600 select-none mr-3 tracking-widest text-[9px] uppercase">SQL&gt;</span>
                                        {step.sql}
                                    </div>
                                )}

                                {step.new_sql && (
                                    <div className="mt-3 text-emerald-300 bg-emerald-900/10 p-3 rounded-md border border-emerald-900/50 shadow-inner">
                                        <span className="text-emerald-600/80 font-bold select-none mr-3 tracking-widest text-[9px] uppercase">FIX&gt;</span>
                                        {step.new_sql}
                                    </div>
                                )}

                                {step.error && (
                                    <div className="mt-3 text-rose-400 break-words bg-rose-900/10 p-3 rounded-md border border-rose-900/50">
                                        <span className="font-bold tracking-widest text-[9px] uppercase text-rose-600/80 mr-2">ERR:</span> {step.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
