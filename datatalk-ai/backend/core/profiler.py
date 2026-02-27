import pandas as pd
import numpy as np
from typing import Dict, Any, List
from core.nvidia_client import nvidia_complete

class DataProfiler:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def run_profiling(self) -> Dict[str, Any]:
        """Deterministically compute profiling metrics."""
        report = {
            "basic_stats": {
                "total_rows": len(self.df),
                "total_columns": len(self.df.columns),
                "memory_usage": f"{self.df.memory_usage().sum() / 1024 / 1024:.2f} MB"
            },
            "missing_values": self.df.isnull().sum().to_dict(),
            "data_types": self.df.dtypes.astype(str).to_dict(),
            "anomalies": self._detect_basic_anomalies(),
            "correlations": self._compute_correlations()
        }
        return report

    def _detect_basic_anomalies(self) -> List[Dict[str, Any]]:
        anomalies = []
        # Check for high cardinality in categorical columns
        for col in self.df.select_dtypes(include=['object', 'category']).columns:
            unique_count = self.df[col].nunique()
            if unique_count > len(self.df) * 0.9 and len(self.df) > 100:
                anomalies.append({
                    "column": col,
                    "type": "high_cardinality",
                    "message": f"Column '{col}' has extremely high cardinality ({unique_count} unique values), likely an ID."
                })
        
        # Check for extreme skew in numeric columns
        for col in self.df.select_dtypes(include=[np.number]).columns:
            skew = self.df[col].skew()
            if abs(skew) > 3:
                anomalies.append({
                    "column": col,
                    "type": "high_skew",
                    "message": f"Column '{col}' is highly skewed (skew={skew:.2f})."
                })
        return anomalies

    def _compute_correlations(self) -> List[Dict[str, Any]]:
        numeric_df = self.df.select_dtypes(include=[np.number])
        if numeric_df.shape[1] < 2:
            return []
        
        corr_matrix = numeric_df.corr().abs()
        correlations = []
        cols = corr_matrix.columns
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                val = corr_matrix.iloc[i, j]
                if val > 0.7:
                    correlations.append({
                        "col1": cols[i],
                        "col2": cols[j],
                        "strength": float(val)
                    })
        return sorted(correlations, key=lambda x: x["strength"], reverse=True)[:5]

    def generate_ai_summary(self, profile_data: Dict[str, Any]) -> str:
        """Use LLM to generate a plain-English quality report."""
        system_prompt = "You are a Senior Data Analyst. Generate a concise, 3-bullet point 'Data Quality Summary' based on the following technical profiling results. Focus on potential issues and recommendations."
        user_content = f"PROFILING_DATA: {profile_data}"
        
        return nvidia_complete(system_prompt, user_content, max_tokens=512, temperature=0.1)
