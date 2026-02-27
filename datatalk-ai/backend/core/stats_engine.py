import pandas as pd
import numpy as np
from scipy import stats

class StatsEngine:
    def __init__(self):
        pass

    def run(self, result_df, db, question):
        if result_df is None or result_df.empty or len(result_df) < 2:
            return None
            
        numeric_cols = result_df.select_dtypes(include=[np.number]).columns
        categorical_cols = result_df.select_dtypes(exclude=[np.number]).columns
        
        # Scenario 1: T-test (1 categorical with exactly 2 groups, 1 numeric)
        if len(categorical_cols) == 1 and len(numeric_cols) == 1:
            cat_col = categorical_cols[0]
            num_col = numeric_cols[0]
            groups = result_df[cat_col].dropna().unique()
            
            if len(groups) == 2:
                g1 = result_df[result_df[cat_col] == groups[0]][num_col].dropna()
                g2 = result_df[result_df[cat_col] == groups[1]][num_col].dropna()
                if len(g1) >= 2 and len(g2) >= 2:
                    t_stat, p_val = stats.ttest_ind(g1, g2)
                    return {
                        "test_type": "Independent T-Test (Numeric Comparison)",
                        "p_value": round(p_val, 4),
                        "significant": bool(p_val < 0.05)
                    }
                    
        # Scenario 2: Chi-Square (at least 2 categorical columns)
        if len(categorical_cols) >= 2:
            c1, c2 = categorical_cols[0], categorical_cols[1]
            contingency = pd.crosstab(result_df[c1], result_df[c2])
            if contingency.shape[0] >= 2 and contingency.shape[1] >= 2:
                chi2, p_val, dof, expected = stats.chi2_contingency(contingency)
                return {
                    "test_type": "Chi-Square Test (Categorical Independence)",
                    "p_value": round(p_val, 4),
                    "significant": bool(p_val < 0.05)
                }

        return None
