import React from 'react';

interface Correlation {
    feature?: string;
    feature1?: string;
    feature2?: string;
    target?: string;
    correlation_score: number;
    impact_magnitude: number;
    direction: string;
}

interface ImpactRankingProps {
    insights: Correlation[];
}

export const ImpactRanking: React.FC<ImpactRankingProps> = ({ insights }) => {
    if (!insights || insights.length === 0) {
        return (
            <div className="p-5 bg-white rounded-xl border border-slate-200/60 shadow-sm text-center">
                <div className="text-3xl mb-3 opacity-30 mx-auto">🔍</div>
                <p className="text-slate-500 font-medium text-sm">No significant analytical drivers or strong correlations identified yet.</p>
                <p className="text-slate-400 text-xs mt-1">Try querying different metrics across dimensions.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    TOP STATISTICAL DRIVERS
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">{insights.length} FOUND</span>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                {insights.map((insight, idx) => {
                    const label = insight.target
                        ? `<span class="opacity-70">${insight.feature?.replace(/_/g, ' ')}</span> &rarr; ${insight.target.replace(/_/g, ' ')}`
                        : `<span class="opacity-70">${insight.feature1?.replace(/_/g, ' ')}</span> &harr; <span class="opacity-70">${insight.feature2?.replace(/_/g, ' ')}</span>`;

                    const scorePercent = Math.min(100, Math.round(insight.impact_magnitude * 100));
                    const isPos = insight.direction === 'positive';

                    return (
                        <div key={idx} className="group cursor-default">
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="text-[13px] font-bold text-slate-700 truncate mr-3 capitalize" dangerouslySetInnerHTML={{ __html: label }}></span>
                                <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-sm border ${isPos ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {isPos ? '+' : '-'}{scorePercent}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 shadow-inner">
                                <div
                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${isPos ? 'bg-gradient-to-r from-teal-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                                    style={{ width: `${scorePercent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
