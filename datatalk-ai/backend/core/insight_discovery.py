import pandas as pd
import numpy as np

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
