import React from 'react';
import { KpiRow } from './KpiRow';
import { ChartRenderer } from '../visualization/ChartRenderer';
import { StatAnnotation } from '../visualization/StatAnnotation';

interface ResponseCardProps {
    payload: any;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ payload }) => {
    if (!payload || !payload.success) {
        return (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mt-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🛑</span>
                    <p className="font-bold text-red-800">Error evaluating analytical query</p>
                </div>
                <p className="text-sm font-medium ml-7">{payload?.error || "Unknown processing pipeline error"}</p>
            </div>
        );
    }

    // Backend returns: result_data, question, sql_executed, chart_type, anomalies, executive_summary, stats
    const answer = payload.answer;
    const data = payload.result_data ?? payload.data;
    const query = payload.question ?? payload.query;
    const sql = payload.sql_executed ?? payload.sql;
    const stats = payload.stats;
    const anomalies = payload.anomalies;
    const insights = payload.insights;
    const executive_summary = payload.executive_summary;
    const hasAnomalies = Array.isArray(anomalies) ? anomalies.length > 0 : Object.keys(anomalies || {}).length > 0;

    return (
        <div className="flex flex-col space-y-6 w-full mt-3">
            {/* ── 1. Executive Summary Card (CEO-level) ──────────────── */}
            {executive_summary && (
                <div className={`p-5 rounded-2xl border-l-[6px] shadow-sm flex items-start gap-4 transition-all duration-300 ${executive_summary.risk_level === 'High'
                    ? 'bg-gradient-to-r from-orange-50 to-orange-25 border-orange-500'
                    : executive_summary.risk_level === 'Medium'
                        ? 'bg-gradient-to-r from-yellow-50/70 to-amber-25/40 border-yellow-400'
                        : 'bg-gradient-to-r from-emerald-50 to-green-25/40 border-emerald-400'
                    }`}>
                    <div className={`mt-0.5 text-2xl shrink-0 ${executive_summary.risk_level === 'High' ? 'animate-pulse' : ''
                        }`}>
                        {executive_summary.risk_level === 'High' ? '🚨' : executive_summary.risk_level === 'Medium' ? '⚠️' : '✅'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm border ${executive_summary.risk_level === 'High'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : executive_summary.risk_level === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                {executive_summary.risk_level} Priority
                            </span>
                        </div>
                        <p className="text-slate-800 mb-2 font-bold text-[15px] leading-snug">{executive_summary.key_finding}</p>
                        <p className="text-[13px] text-slate-600 font-medium">
                            <span className="text-slate-800 font-bold">↳ Action:</span> {executive_summary.recommended_action}
                        </p>
                    </div>
                </div>
            )}

            {/* ── 2. Grounded Answer ─────────────────────────────────── */}
            <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed text-[15px] bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data-Backed Answer</span>
                </div>
                {answer}
            </div>

            {/* ── 3. KPI / Headline Metrics Row ──────────────────────── */}
            {data && data.length > 0 && <KpiRow data={data} />}

            {/* ── 4. Anomaly Warning Chip ────────────────────────────── */}
            {hasAnomalies && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold w-fit shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                    Statistical anomalies detected in {Object.keys(anomalies).length} dimension(s). Highlighted in charts below.
                </div>
            )}

            {/* ── 5. Primary Visualization ───────────────────────────── */}
            {data && data.length > 0 && (
                <div className="w-full bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-70"></div>
                    <ChartRenderer data={data} query={query} />
                </div>
            )}

            {/* ── 6. Statistical Annotations ─────────────────────────── */}
            <StatAnnotation
                anomalies={anomalies}
                insights={insights}
                stats={stats}
            />

            {/* ── 7. Executed SQL (collapsed) ────────────────────────── */}
            {sql && (
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-1">
                        <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        Executed SQL Query
                    </summary>
                    <div className="mt-2 bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                        <pre className="whitespace-pre-wrap break-words">{sql}</pre>
                    </div>
                </details>
            )}

            {/* ── 8. Raw Data Preview (collapsed) ────────────────────── */}
            {data && data.length > 0 && (
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-1">
                        <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        Raw Data ({data.length} rows)
                    </summary>
                    <div className="mt-2 overflow-x-auto max-h-48 border border-slate-200 rounded-xl shadow-inner">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    {Object.keys(data[0]).map(col => (
                                        <th key={col} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">{col.replace(/_/g, ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {data.slice(0, 30).map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                                        {Object.values(row).map((val: any, j: number) => (
                                            <td key={j} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{String(val)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}
        </div>
    );
};
