import pandas as pd
import numpy as np
from scipy import stats

class InsightDiscovery:
    def __init__(self):
        pass

    def compute_impact_scores(self, db, schema, target_col):
        if not target_col:
            return []
            
        df = db.get_sample_rows(n=10000)
        numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != target_col]
        
        scores = []
        if target_col in df.columns and pd.api.types.is_numeric_dtype(df[target_col]) and len(df) > 5:
            target_series = df[target_col].dropna()
            for col in numeric_cols:
                series = df[col].dropna()
                common_idx = target_series.index.intersection(series.index)
                if len(common_idx) > 5:
                    try:
                        corr, p = stats.pearsonr(series.loc[common_idx], target_series.loc[common_idx])
                        if not np.isnan(corr) and p < 0.05:
                            scores.append({
                                "feature": col,
                                "target": target_col,
                                "correlation_score": float(corr),
                                "impact_magnitude": float(abs(corr)),
                                "direction": "positive" if corr > 0 else "negative"
                            })
                    except Exception:
                        pass
        
        scores.sort(key=lambda x: x["impact_magnitude"], reverse=True)
        return scores[:10]
