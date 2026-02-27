import duckdb
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Optional


class DataIngestion:
    def __init__(self):
        self.conn = duckdb.connect(":memory:")
        self.schema_cache: Dict = {}

    def ingest_csv(self, file_path: str, table_name: str = "main_data") -> Tuple[Dict, Tuple]:
        # Read CSV
        from core.data_cleaner import clean_dataframe
        df = pd.read_csv(file_path)

        # Apply Comprehensive Data Cleaning Engine
        df = clean_dataframe(df)

        # Load into DuckDB
        self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        self.conn.register("temp_df", df)
        self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_df")

        # Build schema
        schema = self._profile_schema(df, table_name)
        self.schema_cache[table_name] = schema

        return schema, df.shape

    def _profile_schema(self, df: pd.DataFrame, table_name: str) -> Dict:
        schema = {}

        for col in df.columns:
            series = df[col]
            null_count = int(series.isna().sum())
            unique_count = int(series.nunique())

            col_info = {
                "null_count": null_count,
                "unique_count": unique_count,
            }

            # Determine column type
            if self._is_id_column(col, series):
                col_info["type"] = "id"

            elif pd.api.types.is_numeric_dtype(series):
                col_info["type"] = "numeric"
                col_info["min"] = round(float(series.min()), 2)
                col_info["max"] = round(float(series.max()), 2)
                col_info["mean"] = round(float(series.mean()), 2)
                col_info["median"] = round(float(series.median()), 2)
                col_info["std"] = round(float(series.std()), 2)

            elif self._is_boolean_column(series):
                col_info["type"] = "boolean"
                col_info["unique_values"] = series.dropna().unique().tolist()
                vc = series.value_counts().to_dict()
                col_info["value_counts"] = {str(k): int(v) for k, v in vc.items()}

            elif unique_count <= 30:
                col_info["type"] = "categorical"
                col_info["unique_values"] = series.dropna().unique().tolist()
                vc = series.value_counts().head(20).to_dict()
                col_info["value_counts"] = {str(k): int(v) for k, v in vc.items()}

            else:
                col_info["type"] = "text"
                col_info["sample_values"] = series.dropna().head(5).tolist()

            schema[col] = col_info

        return schema

    def _is_id_column(self, col_name: str, series: pd.Series) -> bool:
        id_keywords = ["id", "uuid", "key", "code", "customerid", "userid", "orderid"]
        col_lower = col_name.lower()
        return any(kw in col_lower for kw in id_keywords) and series.nunique() > 100

    def _is_boolean_column(self, series: pd.Series) -> bool:
        unique_vals = set(str(v).strip().lower() for v in series.dropna().unique())
        boolean_pairs = [
            {"yes", "no"},
            {"true", "false"},
            {"0", "1"},
            {"y", "n"},
        ]
        return any(unique_vals == pair for pair in boolean_pairs)

    def detect_target_column(self, schema: Dict) -> Optional[str]:
        target_keywords = [
            "churn", "attrition", "default", "fraud",
            "returned", "cancelled", "churned", "converted",
            "subscribed", "exited"
        ]

        boolean_cols = [col for col, info in schema.items() if info.get("type") == "boolean"]

        if len(boolean_cols) == 1:
            return boolean_cols[0]

        for col in boolean_cols:
            if any(kw in col.lower() for kw in target_keywords):
                return col

        return boolean_cols[0] if boolean_cols else None

    def execute(self, sql: str):
        return self.conn.execute(sql)

    def execute_query(self, sql: str):
        try:
            result = self.conn.execute(sql).fetchdf()
            return result, None
        except Exception as e:
            return None, str(e)

    def get_schema(self, table_name: str = "main_data") -> Dict:
        return self.schema_cache.get(table_name, {})

    def get_sample_rows(self, table_name: str = "main_data", n: int = 5) -> pd.DataFrame:
        return self.conn.execute(f"SELECT * FROM {table_name} LIMIT {n}").fetchdf()