import * as React from 'react';

interface StatAnnotationProps {
    anomalies?: Record<string, { outlier_count: number; total_count: number; threshold_used: number }>;
    insights?: Array<{
        feature?: string;
        feature1?: string;
        feature2?: string;
        target?: string;
        correlation_score: number;
        impact_magnitude: number;
        direction: string;
    }>;
    stats?: {
        ttest?: { p_value: number; significant: boolean; groups: string[] };
        chisquare?: { p_value: number; significant: boolean; chi2_statistic: number };
        confidence_interval?: { mean: number; lower_bound: number; upper_bound: number; confidence_level: number };
    };
}

export const StatAnnotation: React.FC<StatAnnotationProps> = ({ anomalies, insights, stats }) => {
    const hasContent = (anomalies && Object.keys(anomalies).length > 0) ||
        (insights && insights.length > 0) ||
        (stats && Object.keys(stats).length > 0);

    if (!hasContent) return null;

    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Statistical Significance Banner */}
            {stats?.ttest && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${stats.ttest.significant
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stats.ttest.significant ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                    <span>
                        The difference between <strong>{stats.ttest.groups?.join(' and ')}</strong> is
                        <strong>{stats.ttest.significant ? ' statistically significant' : ' not statistically significant'}</strong>
                        {' '}(p = {stats.ttest.p_value.toFixed(4)})
                    </span>
                </div>
            )}

            {stats?.chisquare && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${stats.chisquare.significant
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stats.chisquare.significant ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                    <span>
                        Chi-Square test: χ² = {stats.chisquare.chi2_statistic.toFixed(2)}, p = {stats.chisquare.p_value.toFixed(4)} —
                        <strong>{stats.chisquare.significant ? ' variables are dependent' : ' no significant association detected'}</strong>
                    </span>
                </div>
            )}

            {stats?.confidence_interval && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span>
                        {(stats.confidence_interval.confidence_level * 100).toFixed(0)}% Confidence Interval:
                        <strong> [{stats.confidence_interval.lower_bound.toFixed(2)}, {stats.confidence_interval.upper_bound.toFixed(2)}]</strong>
                        {' '}(Mean: {stats.confidence_interval.mean.toFixed(2)})
                    </span>
                </div>
            )}

            {/* Anomaly Flags */}
            {anomalies && Object.entries(anomalies).map(([col, info]) => (
                <div key={col} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                    <span>
                        <strong>{col.replace(/_/g, ' ')}</strong>: {info.outlier_count} outlier{info.outlier_count > 1 ? 's' : ''} detected
                        out of {info.total_count} records (Z-score threshold: {info.threshold_used})
                    </span>
                </div>
            ))}

            {/* Top Impact Drivers (compact) */}
            {insights && insights.length > 0 && (
                <div className="px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">Top Analytical Drivers</p>
                    <div className="flex flex-wrap gap-2">
                        {insights.slice(0, 5).map((insight, idx) => {
                            const label = insight.feature || `${insight.feature1} ↔ ${insight.feature2}`;
                            const score = Math.round(insight.impact_magnitude * 100);
                            const isPos = insight.direction === 'positive';
                            return (
                                <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${isPos
                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}
                                >
                                    <span className="text-[10px]">{idx + 1}.</span>
                                    {label?.replace(/_/g, ' ')}
                                    <span className="font-mono text-[10px] opacity-70">
                                        {isPos ? '+' : '-'}{score}%
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
