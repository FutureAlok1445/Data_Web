import React from 'react';
import { Lightbulb, TrendingUp, ShieldCheck, Target } from 'lucide-react';

interface Insight {
    type: string;
    feature: string;
    target?: string;
    spread_magnitude?: number;
    magnitude?: number;
    top_segment?: string;
    bottom_segment?: string;
    description: string;
}

interface StrategicInsightsProps {
    insights: Insight[];
    recommendations: string[];
}

export const StrategicInsights: React.FC<StrategicInsightsProps> = ({ insights, recommendations }) => {
    if ((!insights || insights.length === 0) && (!recommendations || recommendations.length === 0)) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Automated Categorical Scans (Discovery Agent Layer) */}
            {insights && insights.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Automated Discovery</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-indigo-100">
                                        {insight.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-500">
                                        Magnitude: {(insight.spread_magnitude || insight.magnitude || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 mb-1">{insight.feature.replace(/_/g, ' ')} Impact</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{insight.description}</p>

                                {insight.top_segment && (
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 uppercase tracking-tighter">High Concentration</span>
                                            <span className="text-indigo-600 font-black">{insight.top_segment}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-400 uppercase tracking-tighter">Low Concentration</span>
                                            <span className="text-slate-600 font-black">{insight.bottom_segment}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Business Recommendations (Strategic Grounding Layer) */}
            {recommendations && recommendations.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision Intelligence</span>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 space-y-4">
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="flex gap-4 items-start group">
                                <div className="mt-1 p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-200 shrink-0 group-hover:scale-110 transition-transform">
                                    <Target className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed mb-1 capitalize">Strategic Action {idx + 1}</p>
                                    <p className="text-xs text-emerald-900/70 font-medium leading-relaxed">{rec}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
