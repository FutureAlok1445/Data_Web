import React from 'react';
import { KpiRow } from './KpiRow';
import { StrategicInsights } from './StrategicInsights';
import { ChartRenderer } from '../visualization/ChartRenderer';
import { StatAnnotation } from '../visualization/StatAnnotation';
import { ExpansionChips } from './ExpansionChips';
import { BrainCircuit, Info, ShieldCheck, TrendingUp, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';

interface ResponseCardProps {
    payload: any;
    onFollowUp?: (query: string) => void;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ payload, onFollowUp }) => {
    if (!payload) {
        return (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mt-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-5 h-5 text-red-800" />
                    <p className="font-bold text-red-800">Error evaluating analytical query</p>
                </div>
                <p className="text-sm font-medium ml-7">Unknown processing pipeline error</p>
            </div>
        );
    }

    if (!payload.success && !payload.answer) {
        return (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mt-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-5 h-5 text-red-800" />
                    <p className="font-bold text-red-800">Pipeline Execution Failure</p>
                </div>
                <p className="text-sm font-medium ml-7">{payload?.error_message || payload?.error || 'Unknown processing pipeline error'}</p>
            </div>
        );
    }

    const answer = payload.answer;
    const data = payload.result_data ?? payload.data;
    const query = payload.question ?? payload.query;
    const sql = payload.sql_executed ?? payload.sql;
    const stats = payload.stats;
    const anomalies = payload.anomalies;
    const insights = payload.insights; // Original insights
    const auto_insights = payload.auto_insights; // New Categorical Discovery insights
    const recommendations = payload.recommendations;
    const visual_explanation = payload.visual_explanation;
    const executive_summary = payload.executive_summary;
    const hasAnomalies = Array.isArray(anomalies) ? anomalies.length > 0 : Object.keys(anomalies || {}).length > 0;

    return (
        <div className="flex flex-col space-y-8 w-full mt-3">
            {/* ── 1. Executive Summary Card (Strategic Layer) ──────────────── */}
            {executive_summary && (
                <div className={`p-6 rounded-[2.5rem] border-l-[8px] shadow-sm flex items-start gap-5 transition-all duration-300 ${executive_summary.risk_level?.toLowerCase() === 'high'
                    ? 'bg-gradient-to-br from-orange-50/80 to-white border-orange-500 shadow-orange-100'
                    : executive_summary.risk_level?.toLowerCase() === 'medium'
                        ? 'bg-gradient-to-br from-yellow-50/70 to-white border-yellow-400 shadow-yellow-100'
                        : 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-400 shadow-emerald-100'
                    }`}>
                    <div className={`mt-0.5 shrink-0 ${executive_summary.risk_level?.toLowerCase() === 'high' ? 'animate-pulse' : ''}`}>
                        {executive_summary.risk_level?.toLowerCase() === 'high'
                            ? <AlertCircle className="w-8 h-8 text-orange-600" />
                            : executive_summary.risk_level?.toLowerCase() === 'medium'
                                ? <AlertCircle className="w-8 h-8 text-yellow-600" />
                                : <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${executive_summary.risk_level?.toLowerCase() === 'high'
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : executive_summary.risk_level?.toLowerCase() === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                {executive_summary.risk_level} Impact Severity
                            </span>
                            {executive_summary.statistical_confidence && (
                                <span className="text-[10px] font-bold text-slate-400">Confidence: {executive_summary.statistical_confidence}</span>
                            )}
                        </div>
                        <h3 className="text-slate-800 mb-2 font-black text-lg leading-tight tracking-tight">{executive_summary.summary}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="p-3 bg-white/60 rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Business Impact</span>
                                <p className="text-xs font-bold text-slate-700">{executive_summary.business_impact}</p>
                            </div>
                            <div className="p-3 bg-white/60 rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Priority Action</span>
                                <p className="text-xs font-bold text-indigo-700">{executive_summary.priority_action}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2. Data Grounding & Narrative ───────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Analysis</span>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed text-[15px] bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                    {answer}
                </div>
            </div>

            {/* ── 2.5 Vague Query Expansion ─────────────────────────── */}
            {payload.intent === 'VAGUE_QUERY' && payload.expanded_queries && onFollowUp && (
                <ExpansionChips queries={payload.expanded_queries} onSelect={onFollowUp} />
            )}

            {/* ── 3. KPI / Headline Metrics Row ──────────────────────── */}
            {data && data.length > 0 && <KpiRow data={data} />}

            {/* ── 4. Strategic Insights & Discovery Agent ─────────────── */}
            <StrategicInsights insights={auto_insights} recommendations={recommendations} />

            {/* ── 5. Primary Visualization ───────────────────────────── */}
            {data && data.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Intelligence</span>
                    </div>
                    <div className="w-full bg-white border border-slate-200 shadow-xl rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
                        <ChartRenderer data={data} query={query} suggestedChart={payload.chart_type} />

                        {visual_explanation && (
                            <div className="mt-8 flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group-hover:shadow-md transition-shadow">
                                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                    " {visual_explanation} "
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── 6. Expanded Discovery Layer ───────────────────────── */}
            <StatAnnotation anomalies={anomalies} insights={insights} stats={stats} />

            {/* ── 7. Audit & SQL Logic ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {sql && (
                    <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-1">
                            <span className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center group-open:rotate-90 transition-transform">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            </span>
                            Deterministic SQL Pipeline Logic
                        </summary>
                        <div className="mt-2 bg-slate-900 text-emerald-400 p-5 rounded-[1.5rem] text-[11px] font-mono overflow-x-auto border border-slate-800 shadow-2xl">
                            <pre className="whitespace-pre-wrap break-words">{sql}</pre>
                        </div>
                    </details>
                )}

                {data && data.length > 0 && (
                    <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-1">
                            <span className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center group-open:rotate-90 transition-transform">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            </span>
                            Validated Row Output ({data.length})
                        </summary>
                        <div className="mt-2 overflow-x-auto max-h-60 border border-slate-200 rounded-[1.5rem] shadow-inner bg-white scrollbar-thin">
                            <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        {Object.keys(data[0]).map(col => (
                                            <th key={col} className="px-4 py-3 text-left font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">{col.replace(/_/g, ' ')}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {data.slice(0, 50).map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                                            {Object.values(row).map((val: any, j: number) => (
                                                <td key={j} className="px-4 py-2 text-slate-600 whitespace-nowrap font-medium">{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
};
