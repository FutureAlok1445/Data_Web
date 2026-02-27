import numpy as np
import pandas as pd
from scipy import stats

class AnomalyDetector:
    def __init__(self):
        pass

    def check(self, result_df, threshold=3.0):
        anomalies = []
        if result_df is None or result_df.empty:
            return anomalies
            
        numeric_cols = result_df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            values = result_df[col].dropna()
            if len(values) > 3:
                try:
                    z_scores = np.abs(stats.zscore(values))
                    outliers = z_scores > threshold
                    if outliers.sum() > 0:
                        anomalies.append({
                            "column": col,
                            "outlier_count": int(outliers.sum()),
                            "message": f"Found {int(outliers.sum())} outliers in {col}"
                        })
                except Exception:
                    pass
        return anomalies
