import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any

class InsightDiscovery:
    def __init__(self, db):
        self.db = db

    def discover_categorical_insights(self, target_col: str, schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run automatic feature scan on categorical columns relative to a target metric."""
        if not target_col or target_col not in schema:
            return []
            
        df = self.db.get_sample_rows(n=5000)
        if df.empty:
            return []

        insights = []
        cat_cols = [c for c, t in schema.items() if (t == 'categorical' or t == 'text') and c != target_col]
        
        # Check if target is binary (for rate calculation, like churn)
        is_binary = df[target_col].nunique() == 2
        
        for col in cat_cols:
            try:
                if is_binary:
                    # Compute rates per category
                    # Assume positive value is 'Yes', '1', or the second unique value
                    pos_val = [v for v in df[target_col].unique() if str(v).lower() in ['yes', '1', 'true']][0]
                    
                    grouped = df.groupby(col)[target_col].apply(lambda x: (x == pos_val).mean() * 100).sort_values(ascending=False)
                    
                    spread = grouped.max() - grouped.min()
                    if spread > 5: # Significant enough
                        top_cat = grouped.index[0]
                        top_val = grouped.iloc[0]
                        bot_cat = grouped.index[-1]
                        bot_val = grouped.iloc[-1]
                        
                        insights.append({
                            "type": "categorical_spread",
                            "feature": col,
                            "target": target_col,
                            "spread_magnitude": float(spread),
                            "top_segment": f"{top_cat} ({top_val:.1f}%)",
                            "bottom_segment": f"{bot_cat} ({bot_val:.1f}%)",
                            "description": f"Significant variation in {target_col} discovered across {col} categories."
                        })
                else:
                    # Generic volume distribution
                    counts = df[col].value_counts(normalize=True) * 100
                    if counts.iloc[0] > 50: # Concentration alert
                        insights.append({
                            "type": "concentration",
                            "feature": col,
                            "magnitude": float(counts.iloc[0]),
                            "description": f"High concentration detected: {counts.index[0]} accounts for {counts.iloc[0]:.1f}% of data."
                        })
            except Exception as e:
                print(f"[InsightDiscovery] Error scanning {col}: {e}")
                
        # Rank by magnitude
        insights.sort(key=lambda x: x.get("spread_magnitude", x.get("magnitude", 0)), reverse=True)
        return insights[:5]

    def compute_impact_scores(self, schema, target_col):
        """Original correlation-based impact scores."""
        df = self.db.get_sample_rows(n=5000)
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
