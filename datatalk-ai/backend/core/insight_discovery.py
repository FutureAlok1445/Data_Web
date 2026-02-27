import pandas as pd
import numpy as np

def calculate_correlations(data: pd.DataFrame, target_col: str = None) -> list:
    """
    Calculate Pearson correlation between numeric columns.
    If target_col is provided, returns correlations sorted by impact on that target.
    """
    if data.empty:
        return []
        
    numeric_df = data.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return []
        
    corr_matrix = numeric_df.corr(method='pearson')
    correlations = []
    
    if target_col and target_col in corr_matrix.columns:
        # Get correlations specifically for the target column
        target_corrs = corr_matrix[target_col].drop(labels=[target_col]).dropna()
        for col, score in target_corrs.items():
            correlations.append({
                "feature": col,
                "target": target_col,
                "correlation_score": float(score),
                "impact_magnitude": float(abs(score)),
                "direction": "positive" if score > 0 else "negative"
            })
        # Sort by absolute impact magnitude
        correlations.sort(key=lambda x: x["impact_magnitude"], reverse=True)
    else:
        # Get top correlations across all pairs
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                col1 = corr_matrix.columns[i]
                col2 = corr_matrix.columns[j]
                score = corr_matrix.iloc[i, j]
                if not np.isnan(score):
                    correlations.append({
                        "feature1": col1,
                        "feature2": col2,
                        "correlation_score": float(score),
                        "impact_magnitude": float(abs(score)),
                        "direction": "positive" if score > 0 else "negative"
                    })
        correlations.sort(key=lambda x: x["impact_magnitude"], reverse=True)
        
    return correlations

def calculate_impact_score(correlation_score: float, p_value: float = 0.05) -> float:
    """
    Calculate a composite impact score 0-100 based on correlation strength and statistical significance.
    """
    if p_value > 0.05:
        return 0.0  # Not statistically significant
        
    # Magnitude mapping
    base_score = abs(correlation_score) * 100
    
    # Confidence multiplier
    confidence_multiplier = 1.0
    if p_value < 0.01:
        confidence_multiplier = 1.2
    elif p_value < 0.001:
        confidence_multiplier = 1.5
        
    final_score = min(100.0, base_score * confidence_multiplier)
    return round(final_score, 1)
