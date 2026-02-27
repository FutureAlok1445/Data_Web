import pandas as pd
from scipy import stats
import numpy as np

def _get_significance_msg(p_val: float) -> str:
    """Returns a standardized significance message based on p-value."""
    if p_val < 0.001:
        return "The difference is highly statistically significant (p < 0.001)."
    elif p_val < 0.01:
        return "The difference is very statistically significant (p < 0.01)."
    elif p_val < 0.05:
        return "The difference is statistically significant (p < 0.05)."
    else:
        return "The difference is not statistically significant (p > 0.05)."

def calculate_confidence_interval(data: pd.DataFrame, target_col: str, confidence: float = 0.95) -> dict:
    """Calculate the confidence interval for a numeric column."""
    if data.empty or target_col not in data.columns:
        return {}
        
    values = pd.to_numeric(data[target_col], errors='coerce').dropna()
    if len(values) < 2:
        return {"error": "Not enough numeric data points"}
        
    mean = np.mean(values)
    sem = stats.sem(values)
    ci = stats.t.interval(confidence, len(values)-1, loc=mean, scale=sem)
    
    return {
        "mean": float(mean),
        "lower_bound": float(ci[0]),
        "upper_bound": float(ci[1]),
        "confidence_level": confidence,
        "summary": f"Mean: {mean:.2f} (95% CI: [{ci[0]:.2f}, {ci[1]:.2f}])"
    }

def run_ttest(data: pd.DataFrame, group_col: str, value_col: str) -> dict:
    """Run an independent t-test between two groups."""
    if data.empty or group_col not in data.columns or value_col not in data.columns:
        return {}
        
    groups = data[group_col].dropna().unique()
    if len(groups) != 2:
        return {"error": f"t-test requires exactly 2 distinct groups, found {len(groups)}"}
        
    g1_label, g2_label = str(groups[0]), str(groups[1])
    group1 = pd.to_numeric(data[data[group_col] == groups[0]][value_col], errors='coerce').dropna()
    group2 = pd.to_numeric(data[data[group_col] == groups[1]][value_col], errors='coerce').dropna()
    
    if len(group1) < 2 or len(group2) < 2:
        return {"error": "Not enough data points in one or both groups"}
        
    t_stat, p_val = stats.ttest_ind(group1, group2)
    
    avg_diff = float(group1.mean() - group2.mean())
    multiplier = (group1.mean() / group2.mean()) if group2.mean() != 0 else 0
    
    return {
        "test_type": "t-test",
        "t_statistic": float(t_stat),
        "p_value": float(p_val),
        "significant": bool(p_val < 0.05),
        "significance_msg": _get_significance_msg(p_val),
        "groups": [g1_label, g2_label],
        "means": {g1_label: float(group1.mean()), g2_label: float(group2.mean())},
        "insight": f"{g1_label} is {multiplier:.1f}x higher in {value_col} compared to {g2_label}" if multiplier > 1.2 else "No substantial difference observed."
    }

def run_chisquare(data: pd.DataFrame, col1: str, col2: str) -> dict:
    """Run a Chi-Square test of independence."""
    if data.empty or col1 not in data.columns or col2 not in data.columns:
        return {}
        
    contingency_table = pd.crosstab(data[col1], data[col2])
    
    if contingency_table.empty or contingency_table.shape[0] < 2 or contingency_table.shape[1] < 2:
        return {"error": "Contingency table must be at least 2x2"}
        
    chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
    
    return {
        "test_type": "chi-square",
        "chi2_statistic": float(chi2),
        "p_value": float(p_val),
        "degrees_of_freedom": int(dof),
        "significant": bool(p_val < 0.05),
        "significance_msg": _get_significance_msg(p_val),
        "insight": "There is a statistically significant relationship between " + col1 + " and " + col2 if p_val < 0.05 else "No significant relationship detected."
    }

def compare_groups_statistically(data: pd.DataFrame, group_col: str, target_col: str) -> dict:
    """Auto-detects data types and runs the appropriate statistical test."""
    if data.empty: return {}
    
    # If target is numeric, use t-test (if 2 groups) or ANOVA (placeholder for now)
    if pd.api.types.is_numeric_dtype(data[target_col]):
        groups = data[group_col].dropna().unique()
        if len(groups) == 2:
            return run_ttest(data, group_col, target_col)
        else:
            # Placeholder for ANOVA
            return {"message": "ANOVA multi-group comparison not yet implemented."}
    else:
        # Categorical vs Categorical -> Chi-square
        return run_chisquare(data, group_col, target_col)
