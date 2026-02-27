import pandas as pd
from scipy import stats
import numpy as np

def calculate_confidence_interval(data: pd.DataFrame, target_col: str, confidence: float = 0.95) -> dict:
    """Calculate the confidence interval for a numeric column using Scipy."""
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
        "confidence_level": confidence
    }

def run_ttest(data: pd.DataFrame, group_col: str, value_col: str) -> dict:
    """Run an independent t-test between two groups in the dataframe."""
    if data.empty or group_col not in data.columns or value_col not in data.columns:
        return {}
        
    groups = data[group_col].dropna().unique()
    if len(groups) != 2:
        return {"error": f"t-test requires exactly 2 distinct groups, found {len(groups)}"}
        
    group1 = pd.to_numeric(data[data[group_col] == groups[0]][value_col], errors='coerce').dropna()
    group2 = pd.to_numeric(data[data[group_col] == groups[1]][value_col], errors='coerce').dropna()
    
    if len(group1) < 2 or len(group2) < 2:
        return {"error": "Not enough data points in one or both groups"}
        
    t_stat, p_val = stats.ttest_ind(group1, group2)
    
    return {
        "t_statistic": float(t_stat),
        "p_value": float(p_val),
        "significant": bool(p_val < 0.05),
        "groups": [str(groups[0]), str(groups[1])]
    }

def run_chisquare(data: pd.DataFrame, col1: str, col2: str) -> dict:
    """Run a Chi-Square test of independence between two categorical columns."""
    if data.empty or col1 not in data.columns or col2 not in data.columns:
        return {}
        
    contingency_table = pd.crosstab(data[col1], data[col2])
    
    if contingency_table.empty or contingency_table.shape[0] < 2 or contingency_table.shape[1] < 2:
        return {"error": "Contingency table must be at least 2x2"}
        
    chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
    
    return {
        "chi2_statistic": float(chi2),
        "p_value": float(p_val),
        "degrees_of_freedom": int(dof),
        "significant": bool(p_val < 0.05)
    }
