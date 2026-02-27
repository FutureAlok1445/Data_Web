export interface OutlierInfo {
    outlier_count: number;
    total_count: number;
    threshold_used: number;
    outliers: Record<string, any>[];
}

export interface CorrelationInsight {
    feature?: string;
    feature1?: string;
    feature2?: string;
    target?: string;
    correlation_score: number;
    impact_magnitude: number;
    direction: 'positive' | 'negative';
}

export interface ExecutiveSummary {
    risk_level: 'Low' | 'Medium' | 'High';
    key_finding: string;
    recommended_action: string;
}

export interface StatsResult {
    ttest?: {
        t_statistic: number;
        p_value: number;
        significant: boolean;
        groups: string[];
    };
    chisquare?: {
        chi2_statistic: number;
        p_value: number;
        degrees_of_freedom: number;
        significant: boolean;
    };
    confidence_interval?: {
        mean: number;
        lower_bound: number;
        upper_bound: number;
        confidence_level: number;
    };
}

export interface AuditStep {
    step: string;
    status?: 'success' | 'error';
    sql?: string;
    new_sql?: string;
    error?: string;
}

export interface QueryResponsePayload {
    success: boolean;
    query: string;
    sql: string;
    answer: string;
    data: Record<string, any>[];
    columns: string[];
    anomalies: Record<string, OutlierInfo>;
    insights: CorrelationInsight[];
    stats: StatsResult;
    executive_summary: ExecutiveSummary;
    visualization?: any;
    audit_trail: AuditStep[];
    error?: string;
}
