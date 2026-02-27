import React from 'react';
import { KpiRow } from './KpiRow';
import { ChartRenderer } from '../visualization/ChartRenderer';

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

    const { answer, data, anomalies, executive_summary, query } = payload;
    const hasAnomalies = Object.keys(anomalies || {}).length > 0;

    return (
        <div className="flex flex-col space-y-6 w-full mt-3">
            {/* 1. Grounded English Answer */}
            <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed text-[15px]">
                {answer}
            </div>

            {/* 2. Executive Alert Panel */}
            {executive_summary && executive_summary.risk_level !== 'Low' && (
                <div className={`p-5 rounded-2xl border-l-[6px] shadow-sm flex items-start gap-4 ${executive_summary.risk_level === 'High' ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50/70 border-yellow-400'}`}>
                    <div className={`mt-0.5 text-2xl ${executive_summary.risk_level === 'High' ? 'text-orange-500 animate-pulse' : 'text-yellow-600'}`}>
                        {executive_summary.risk_level === 'High' ? '🚨' : '⚠️'}
                    </div>
                    <div className="flex-1">
                        <h4 className={`font-bold text-xs uppercase tracking-widest mb-1.5 flex items-center gap-2 ${executive_summary.risk_level === 'High' ? 'text-orange-800' : 'text-yellow-800'}`}>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-white bg-opacity-50">{executive_summary.risk_level} Priority Insight</span>
                        </h4>
                        <p className="text-slate-800 mb-2 font-semibold text-[15px]">{executive_summary.key_finding}</p>
                        <p className="text-[13px] text-slate-600 font-medium"><span className="text-slate-800">Recommendation:</span> {executive_summary.recommended_action}</p>
                    </div>
                </div>
            )}

            {/* 3. KPI / Headline Metrics Row */}
            {data && data.length > 0 && <KpiRow data={data} />}

            {/* 4. Anomaly Warning Chip */}
            {hasAnomalies && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold w-fit shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                    Statistical anomalies detected in {Object.keys(anomalies).length} dimension(s). Check specific points in charts.
                </div>
            )}

            {/* 5. Visualization Master Region */}
            {data && data.length > 0 && (
                <div className="w-full bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-70"></div>
                    <ChartRenderer data={data} query={query} />
                </div>
            )}
        </div>
    );
};
