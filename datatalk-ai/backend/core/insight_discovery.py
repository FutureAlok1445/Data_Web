import pandas as pd
import numpy as np
from scipy import stats

def calculate_impact_score(correlation_score: float, population_pct: float, p_value: float = 0.05) -> float:
    """
    Calculate a composite impact score 0-100.
    Score = Magnitude (correlation) x Affected Population x Significance (confidence).
    """
    if p_value > 0.05:
        return 0.0  # Not statistically significant
        
    # Magnitude (0-1)
    magnitude = abs(correlation_score)
    
    # Population factor (0.5 to 1.5) - normalize so 100% population has max weight
    pop_factor = 0.5 + population_pct
    
    # Significance multiplier (1.0 to 1.5)
    sig_multiplier = 1.0
    if p_value < 0.01:
        sig_multiplier = 1.25
    if p_value < 0.001:
        sig_multiplier = 1.5
        
    final_score = magnitude * pop_factor * sig_multiplier * 50 # Scale to ~100
    return round(min(100.0, final_score), 1)

def find_top_drivers(data: pd.DataFrame, target_col: str) -> list:
    """
    Ranks features by their impact on the target column.
    Uses a combination of correlation and population reach.
    """
    if data.empty or target_col not in data.columns:
        return []
        
    drivers = []
    numeric_df = data.select_dtypes(include=[np.number])
    
    # 1. Correlations for numeric columns
    if target_col in numeric_df.columns:
        corr_matrix = numeric_df.corr(method='pearson')
        target_corrs = corr_matrix[target_col].drop(labels=[target_col]).dropna()
        
        for col, score in target_corrs.items():
            impact = calculate_impact_score(score, 1.0, 0.01) # Assume full population for global numeric corr
            drivers.append({
                "feature": col,
                "correlation": float(score),
                "impact_score": impact,
                "type": "numeric"
            })
            
    # 2. Segment-level impact (categorical columns)
    categorical_cols = data.select_dtypes(exclude=[np.number]).columns
    for col in categorical_cols:
        if col == target_col: continue
        
        # Simple heuristic: compare group means for the target if target is numeric
        if pd.api.types.is_numeric_dtype(data[target_col]):
            group_stats = data.groupby(col)[target_col].agg(['mean', 'count']).dropna()
            total_count = len(data)
            global_mean = data[target_col].mean()
            
            for group_name, stats in group_stats.iterrows():
                pop_pct = stats['count'] / total_count
                magnitude = abs(stats['mean'] - global_mean) / global_mean if global_mean != 0 else 0
                impact = calculate_impact_score(magnitude, pop_pct, 0.01)
                
                drivers.append({
                    "feature": f"{col} ({group_name})",
                    "magnitude": float(magnitude),
                    "pop_pct": float(pop_pct),
                    "impact_score": impact,
                    "type": "segment"
                })
                
    # Sort by impact score
    drivers.sort(key=lambda x: x["impact_score"], reverse=True)
    return drivers[:10]

def calculate_correlations(data: pd.DataFrame, target_col: str = None) -> list:
    """Original correlation logic, kept for backward compatibility but using new scores."""
    if data.empty:
        return []
        
    numeric_df = data.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return []
        
    corr_matrix = numeric_df.corr(method='pearson')
    correlations = []
    
    if target_col and target_col in corr_matrix.columns:
        target_corrs = corr_matrix[target_col].drop(labels=[target_col]).dropna()
        for col, score in target_corrs.items():
            correlations.append({
                "feature": col,
                "target": target_col,
                "correlation_score": float(score),
                "impact_score": calculate_impact_score(score, 1.0, 0.01),
                "direction": "positive" if score > 0 else "negative"
            })
        correlations.sort(key=lambda x: x["impact_score"], reverse=True)
    else:
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                col1 = corr_matrix.columns[i]; col2 = corr_matrix.columns[j]
                score = corr_matrix.iloc[i, j]
                if not np.isnan(score):
                    correlations.append({
                        "feature1": col1, "feature2": col2,
                        "correlation_score": float(score),
                        "impact_score": calculate_impact_score(score, 1.0, 0.01),
                        "direction": "positive" if score > 0 else "negative"
                    })
        correlations.sort(key=lambda x: x["impact_score"], reverse=True)
        
    return correlations
def perform_categorical_sweep(data: pd.DataFrame, target_col: str, metric_col: str = None) -> list:
    """
    Proactively checks all categorical columns for interesting segments/drivers.
    Useful for 'Insight Generation Agent' to find additional relevant insights.
    """
    if data.empty: return []
    
    categorical_cols = data.select_dtypes(exclude=[np.number]).columns.tolist()
    insights = []
    
    # If target is provided (e.g. Churn), prioritize it
    # Else, if a metric col is provided (e.g. MonthlyCharges), use it as the benchmark
    for col in categorical_cols:
        if col == target_col or col == metric_col: continue
        
        try:
            # Group by this categorical column and compute target/metric mean
            if target_col and target_col in data.columns:
                # If target is binary (like churn), compute rate
                if data[target_col].nunique() == 2:
                    # Map to 1/0 for math
                    temp_y = data[target_col].map({data[target_col].unique()[0]: 0, data[target_col].unique()[1]: 1})
                    group_stats = data.join(temp_y.rename('temp_target')).groupby(col)['temp_target'].agg(['mean', 'count'])
                else:
                    group_stats = data.groupby(col)[target_col].agg(['mean', 'count'])
                    
                global_mean = data[target_col].mean() if not (data[target_col].nunique() == 2) else data[target_col].map({data[target_col].unique()[0]: 0, data[target_col].unique()[1]: 1}).mean()
            elif metric_col and metric_col in data.columns:
                group_stats = data.groupby(col)[metric_col].agg(['mean', 'count'])
                global_mean = data[metric_col].mean()
            else:
                continue

            total_rows = len(data)
            for group_name, stats in group_stats.iterrows():
                # Filter out small segments
                if stats['count'] < 5: continue
                
                diff = stats['mean'] - global_mean
                magnitude = abs(diff) / global_mean if global_mean != 0 else 0
                pop_pct = stats['count'] / total_rows
                
                impact = calculate_impact_score(magnitude, pop_pct, 0.01)
                
                if impact > 30: # Only keep meaningful ones
                    insights.append({
                        "dimension": col,
                        "segment": str(group_name),
                        "impact_score": impact,
                        "insight_text": f"The segment '{group_name}' in {col} shows a {magnitude:.1%} difference from the average.",
                        "magnitude": float(magnitude),
                        "population_pct": float(pop_pct)
                    })
        except Exception:
            continue
            
    insights.sort(key=lambda x: x["impact_score"], reverse=True)
    return insights[:5]
