import pandas as pd
from scipy import stats
import numpy as np

def detect_outliers_zscore(data: pd.DataFrame, target_col: str, threshold: float = 3.0) -> dict:
    """
    Detect outliers in a numeric column using the Z-score method.
    Returns the count, threshold, and the actual outlier records.
    """
    if data.empty or target_col not in data.columns:
        return {}
        
    values = pd.to_numeric(data[target_col], errors='coerce')
    valid_mask = values.notna()
    
    if valid_mask.sum() < 3:
        return {"error": "Not enough valid numeric data points for Z-score detection"}
        
    z_scores = np.abs(stats.zscore(values[valid_mask]))
    outlier_mask = z_scores > threshold
    
    # Extract the rows that correspond to the outliers
    outlier_indices = valid_mask[valid_mask].index[outlier_mask]
    outlier_data = data.loc[outlier_indices]
    
    return {
        "outlier_count": int(outlier_mask.sum()),
        "total_count": int(valid_mask.sum()),
        "threshold_used": threshold,
        "outliers": outlier_data.to_dict(orient="records")
    }
